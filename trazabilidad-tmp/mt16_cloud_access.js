import {mt16Access} from './mt16_cloud.js';

const host = document.getElementById('mt16-cloud-access');
if (host) {
  host.innerHTML = `
    <strong>Acceso de Calidad</strong>
    <p role="status" data-access-status>Comprobando sesión…</p>
    <form hidden>
      <label>Clave de Calidad <input type="password" required maxlength="256" autocomplete="current-password"></label>
      <button class="btn" type="submit">Entrar</button>
    </form>`;
  const form = host.querySelector('form');
  const input = form.querySelector('input');
  const status = host.querySelector('[data-access-status]');
  const auth = window.supabase.auth;
  const onSave = host.hasAttribute('data-on-save');
  let accessRequested = false;
  let generation = 0;
  let active;

  async function refresh() {
    const request = ++generation;
    try {
      const user = await mt16Access();
      if (request !== generation) return;
      form.hidden = !!user;
      if (onSave) host.hidden = !!user || !accessRequested;
      status.textContent = user ? 'Acceso de Calidad activo.' : 'Introduce la clave de Calidad para acceder al registro compartido.';
      const userId = user?.id || null;
      if (active !== userId) {
        active = userId;
        window.dispatchEvent(new Event('mt16-cloud-session'));
      }
    } catch {
      if (request === generation) status.textContent = 'No se pudo comprobar el acceso de Calidad.';
    }
  }

  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'Comprobando la clave…';
    try {
      const response = await fetch('/api/mt16-acceso', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({clave: input.value}),
        cache: 'no-store'
      });
      if (response.status === 404) throw Error('El acceso de Calidad todavía no está instalado.');
      const session = await response.json();
      if (!response.ok) throw Error(session.error || 'No se pudo iniciar sesión.');
      const {error} = await auth.setSession(session);
      if (error) throw Error('No se pudo abrir la sesión de Calidad.');
      await refresh();
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? 'No se pudo acceder al registro compartido.' : error.message;
    } finally {
      input.value = '';
      button.disabled = false;
    }
  };

  auth.onAuthStateChange(() => setTimeout(refresh, 0));
  window.addEventListener('mt16-request-login', () => {
    accessRequested = true;
    host.hidden = false;
    form.hidden = false;
    host.scrollIntoView({block:'center'});
    input.focus();
  });
  refresh();
}
