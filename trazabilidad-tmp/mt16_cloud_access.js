import {mt16Access} from './mt16_cloud.js';

const host = document.getElementById('mt16-cloud-access');

if (host) {
  host.innerHTML = `
    <strong>Acceso de Calidad</strong>
    <p role="status" data-access-status>Comprobando acceso…</p>
    <form hidden>
      <label>Correo de Calidad
        <input type="email" name="email" autocomplete="username" required>
      </label>
      <label>Contraseña de Supabase
        <input type="password" name="password" autocomplete="current-password" required>
      </label>
      <button type="submit">Autorizar este navegador</button>
    </form>`;

  const form = host.querySelector('form');
  const email = form.elements.namedItem('email');
  const password = form.elements.namedItem('password');
  const button = form.querySelector('button');
  const status = host.querySelector('[data-access-status]');
  const auth = window.supabase.auth;
  const onSave = host.hasAttribute('data-on-save');
  let accessRequested = false;
  let userId = null;
  let signingIn = false;

  function showAccess() {
    host.hidden = onSave && (Boolean(userId) || !accessRequested);
    form.hidden = Boolean(userId);
  }

  async function refresh() {
    try {
      const user = await mt16Access();
      const nextId = user?.id || null;
      status.textContent = nextId
        ? 'Acceso de Calidad activo.'
        : 'Autoriza este navegador para guardar y consultar los informes.';
      const changed = userId !== nextId;
      userId = nextId;
      showAccess();
      if (changed) window.dispatchEvent(new Event('mt16-cloud-session'));
    } catch {
      status.textContent = 'No se pudo comprobar el acceso de Calidad. Puedes volver a intentarlo.';
      showAccess();
    }
  }

  auth.onAuthStateChange(() => setTimeout(() => {
    if (!signingIn) refresh();
  }, 0));

  window.addEventListener('mt16-request-login', event => {
    accessRequested = true;
    showAccess();
    if (!event.detail?.quiet && !host.hidden) host.scrollIntoView({block:'center'});
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (signingIn) return;
    signingIn = true;
    button.disabled = true;
    status.textContent = 'Comprobando acceso de Calidad…';
    const credentials = {email:email.value.trim(), password:password.value};
    password.value = '';
    try {
      const {error} = await auth.signInWithPassword(credentials);
      if (error) {
        status.textContent = error.code === 'invalid_credentials'
          ? 'Supabase no ha aceptado el correo o la contraseña de Calidad.'
          : 'No se pudo iniciar sesión en Supabase. Puedes volver a intentarlo.';
        return;
      }
      await refresh();
    } catch {
      status.textContent = 'No se pudo conectar con Supabase. Puedes volver a intentarlo.';
    } finally {
      signingIn = false;
      button.disabled = false;
    }
  });

  await refresh();
}
