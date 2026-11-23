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
  const email = process.env.MT16_CALIDAD_EMAIL;
  const apiKey = process.env.MT16_SUPABASE_PUBLIC_KEY;
  if (!email || !apiKey) {
    return response.status(503).json({error: 'El acceso de Calidad todavía está por configurar.'});
  }
  const password = request.body?.clave;
  if (typeof password !== 'string' || !password || password.length > 256) {
    return response.status(400).json({error: 'Introduce una clave de Calidad válida.'});
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
      return response.status(401).json({error: 'La clave de Calidad no es válida o la cuenta no está habilitada.'});
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
