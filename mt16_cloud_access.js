import {mt16Access} from './mt16_cloud.js';

const host = document.getElementById('mt16-cloud-access');
const activation = new URLSearchParams(location.hash.slice(1)).get('mt16-activar');

if (host) {
  if (activation) {
    const url = new URL(location.href);
    url.searchParams.delete('activar');
    url.hash = '';
    window.history.replaceState(null, '', url);
  }

  host.innerHTML = `
    <strong>Acceso de Calidad</strong>
    <p role="status" data-access-status>Comprobando acceso…</p>`;
  const status = host.querySelector('[data-access-status]');
  const auth = window.supabase.auth;
  const onSave = host.hasAttribute('data-on-save');
  const needsActivation = 'Este navegador necesita el enlace de activación de Calidad.';
  let accessRequested = Boolean(activation);
  let active;
  let activating = Boolean(activation);

  async function refresh() {
    try {
      const user = await mt16Access();
      if (onSave) host.hidden = !accessRequested || (Boolean(user) && !activation);
      status.textContent = user ? 'Acceso de Calidad activo.' : needsActivation;
      const userId = user?.id || null;
      if (active !== userId) {
        active = userId;
        window.dispatchEvent(new Event('mt16-cloud-session'));
      }
    } catch {
      status.textContent = 'No se pudo comprobar el acceso de Calidad.';
    }
  }

  auth.onAuthStateChange(() => setTimeout(() => {
    if (!activating) refresh();
  }, 0));
  window.addEventListener('mt16-request-login', () => {
    accessRequested = true;
    host.hidden = false;
    host.scrollIntoView({block:'center'});
  });

  if (activation) {
    host.hidden = false;
    try {
      const response = await fetch(new URL('./api/mt16-acceso', location.href), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({activacion: activation}),
        cache: 'no-store'
      });
      if (response.status === 404) throw Error('La función de activación aún no está instalada.');
      const session = await response.json();
      if (!response.ok) throw Error(session.error || 'No se pudo activar este navegador.');
      const {error} = await auth.setSession(session);
      if (error) throw Error('No se pudo abrir la sesión en este navegador.');
      await refresh();
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? 'No se pudo activar este navegador.' : error.message;
    } finally {
      activating = false;
    }
  } else {
    await refresh();
  }
}
