import {mt16Access} from './mt16_cloud.js';

const host = document.getElementById('mt16-cloud-access');
if (host) {
  const redirect = new URL(location.pathname, location.origin);
  const callbackError = new URLSearchParams(location.hash.slice(1)).get('error_code');
  host.innerHTML = `
    <strong>Acceso de Calidad al registro compartido</strong>
    <p role="status" data-access-status>Comprobando sesión…</p>
    <form hidden>
      <label>Correo de Calidad <input type="email" required autocomplete="email"></label>
      <button class="btn" type="submit">Solicitar enlace para iniciar sesión</button>
      <details><summary>Configuración del enlace</summary><p>Dirección de retorno para autorizar en Supabase</p>
      <input data-return-address type="url" readonly aria-label="Dirección de retorno de MT16"></details>
    </form>`;
  const form = host.querySelector('form');
  const input = form.querySelector('input[type=email]');
  const returnAddress = form.querySelector('[data-return-address]');
  returnAddress.value = redirect.href;
  returnAddress.onclick = () => returnAddress.select();
  const status = host.querySelector('[data-access-status]');
  const auth = window.supabase.auth;
  let generation = 0;
  let active;
  const onSave = host.hasAttribute('data-on-save');
  let accessRequested = !!callbackError;

  async function refresh() {
    const request = ++generation;
    try {
      const user = await mt16Access();
      if (request !== generation) return;
      form.hidden = !!user;
      if (onSave) host.hidden = !!user || !accessRequested;
      status.textContent = user ? 'Acceso al registro compartido activo.' : callbackError === 'otp_expired'
        ? 'El enlace no es válido o ha caducado. Pide uno nuevo.'
        : 'Usa el correo de Calidad solo para iniciar sesión. Con la sesión activa, Guardar verificación guarda directamente en Supabase.';
      const userId = user?.id || null;
      if (active !== userId) {
        active = userId;
        window.dispatchEvent(new Event('mt16-cloud-session'));
      }
    } catch {
      if (request === generation) status.textContent = 'No se pudo comprobar el acceso al registro de Calidad.';
    }
  }
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const {error} = await auth.signInWithOtp({
        email: input.value.trim(),
        options: {shouldCreateUser:false,emailRedirectTo:redirect.href}
      });
      if (error) throw error;
      status.textContent = 'Abre el enlace más reciente en este mismo navegador. Si dejaste un guardado pendiente, MT16 lo retomará al volver.';
    } catch (error) {
      status.textContent = 'No se pudo enviar el enlace. ' + (error.message || '');
    } finally {
      button.disabled = false;
    }
  };
  auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.addEventListener('mt16-request-login', () => {
    accessRequested = true;
    host.hidden = false;
    host.scrollIntoView({block:'center'});
    input.focus();
  });
  refresh();
}
