import './config.mjs';
// Identificación para guardar/consultar informes privados. No crea usuarios.
const host=document.createElement('section');host.id='mt16-auth';host.style.cssText='margin:16px auto;padding:16px;max-width:1200px;border:1px solid #c9d5e2;border-radius:10px;background:white;color:#173653';
host.innerHTML=`<strong>Acceso a informes MT16</strong><p id="mt16-auth-status" role="status">Comprobando sesión…</p><form id="mt16-login" hidden style="display:flex;gap:10px;align-items:end;flex-wrap:wrap"><label>Correo de acceso<input id="mt16-email" type="email" autocomplete="username" required></label><label>Contraseña<input id="mt16-password" type="password" autocomplete="current-password" required></label><button type="submit">Iniciar sesión</button></form><button id="mt16-logout" type="button" hidden>Cerrar sesión</button><p style="font-size:13px">Los informes guardados son privados de la cuenta identificada. Puedes evaluar y descargar una verificación sin iniciar sesión.</p>`;
(document.querySelector('main')||document.body).prepend(host);
const $=id=>document.getElementById(id),sb=window.supabase;let previous;
function paint(session){const user=session?.user;$('mt16-login').hidden=!!user;$('mt16-logout').hidden=!user;$('mt16-auth-status').textContent=user?'Sesión iniciada · '+(user.email||user.id):'Inicia sesión para guardar y consultar los informes.';if(previous!==user?.id){previous=user?.id;window.dispatchEvent(new CustomEvent('mt16-auth-changed',{detail:{signedIn:!!user}}));}}
if(!sb?.auth){$('mt16-auth-status').textContent='La conexión de identificación no está disponible.';}else{
 sb.auth.getSession().then(({data,error})=>{if(error)throw error;paint(data.session);}).catch(()=>{$('mt16-auth-status').textContent='No se pudo consultar la sesión. Recarga la página.';});
 sb.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>paint(session),0);});
 $('mt16-login').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{const {data,error}=await sb.auth.signInWithPassword({email:$('mt16-email').value.trim(),password:$('mt16-password').value});$('mt16-password').value='';if(error)throw error;paint(data.session);}catch{$('mt16-auth-status').textContent='No se pudo iniciar sesión. Comprueba el correo y la contraseña de la aplicación.';}finally{button.disabled=false;}};
 $('mt16-logout').onclick=async()=>{const {error}=await sb.auth.signOut();if(error)$('mt16-auth-status').textContent='No se pudo cerrar sesión. Vuelve a intentarlo.';else paint(null);};
}
