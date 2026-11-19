import {mt16Access} from './mt16_cloud.js';

const host = document.getElementById('mt16-cloud-access');
if (host) {
  host.innerHTML = `
    <strong>Acceso de Calidad al registro compartido</strong>
    <p role="status" data-access-status>Comprobando sesión…</p>
    <form hidden>
      <label>Correo de Calidad <input type="email" required autocomplete="email"></label>
      <button class="btn" type="submit">Enviar enlace de acceso</button>
    </form>`;
  const form = host.querySelector('form');
  const input = form.querySelector('input');
  const status = host.querySelector('[data-access-status]');
  const auth = window.supabase.auth;
  let generation = 0;
  let active;

  async function refresh() {
    const request = ++generation;
    try {
      const user = await mt16Access();
      if (request !== generation) return;
      form.hidden = !!user;
      status.textContent = user ? 'Acceso al registro compartido activo.' : 'Usa tu correo de Calidad para entrar sin contraseña.';
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
      const redirect = new URL(location.pathname + location.search, location.origin);
      const {error} = await auth.signInWithOtp({
        email: input.value.trim(),
        options: {shouldCreateUser:false,emailRedirectTo:redirect.href}
      });
      if (error) throw error;
      status.textContent = 'Abre el enlace que recibas en este mismo navegador y vuelve a la verificación.';
    } catch (error) {
      status.textContent = 'No se pudo enviar el enlace. ' + (error.message || '');
    } finally {
      button.disabled = false;
    }
  };
  auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.addEventListener('mt16-request-login', () => {
    host.scrollIntoView({block:'center'});
    input.focus();
  });
  refresh();
}
