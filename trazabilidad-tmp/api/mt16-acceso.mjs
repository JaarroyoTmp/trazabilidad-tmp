import {createHash, timingSafeEqual} from 'node:crypto';

const tokenEndpoint = 'https://uukxdslfmxesufuxjzvt.supabase.co/auth/v1/token?grant_type=password';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({error: 'Método no permitido.'});
  }
  if (request.headers['sec-fetch-site'] === 'cross-site') {
    return response.status(403).json({error: 'Abre MT16 para acceder.'});
  }
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') {
    return response.status(415).json({error: 'Formato no admitido.'});
  }
  const email = process.env.MT16_CALIDAD_EMAIL?.trim().toLowerCase();
  const apiKey = process.env.MT16_SUPABASE_PUBLIC_KEY;
  const password = process.env.MT16_CALIDAD_PASSWORD;
  const allowed = (process.env.MT16_ACTIVATION_SHA256 || '').split(',')
    .map(hash => hash.trim()).filter(hash => /^[a-f0-9]{64}$/i.test(hash))
    .map(hash => Buffer.from(hash, 'hex'));
  if (!email || !apiKey || !password || !allowed.length) {
    return response.status(503).json({error: 'Falta configurar la activación de los ordenadores de Calidad.'});
  }
  const enrollment = request.body?.activacion;
  if (typeof enrollment !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(enrollment)) {
    return response.status(400).json({error: 'Abre el enlace de activación facilitado por Calidad.'});
  }
  const digest = createHash('sha256').update(enrollment).digest();
  if (!allowed.some(hash => timingSafeEqual(hash, digest))) {
    return response.status(403).json({error: 'El enlace de activación no está autorizado.'});
  }
  try {
    const result = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {apikey: apiKey, 'Content-Type': 'application/json'},
      body: JSON.stringify({email, password}),
      signal: AbortSignal.timeout(10000)
    });
    if (result.status === 429) {
      return response.status(429).json({error: 'Demasiados intentos. Espera antes de volver a probar.'});
    }
    if ([400, 401, 403].includes(result.status)) {
      return response.status(401).json({error: 'La cuenta de Calidad configurada en el servidor no ha podido iniciar sesión.'});
    }
    if (result.ok) {
      const {access_token, refresh_token} = await result.json();
      if (typeof access_token === 'string' && typeof refresh_token === 'string') {
        return response.status(200).json({access_token, refresh_token});
      }
    }
  } catch {
    // Upstream errors can include request details. Keep them out of the response.
  }
  return response.status(502).json({error: 'El acceso de Calidad no está disponible temporalmente.'});
}
