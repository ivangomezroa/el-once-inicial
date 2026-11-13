// ══════════════════════════════════════════════════════════════
//  INVITAR A ALGUIEN AL ESPACIO  ·  función de servidor (Vercel)
//
//  Crear la cuenta de otra persona necesita la clave secreta de
//  Supabase, y esa clave NO puede estar en el navegador: si estuviera en
//  el código de la app, cualquiera podría crear usuarios y leerlo todo.
//  Por eso este trozo corre en el servidor de Vercel, donde la clave va
//  en una variable de entorno y nunca sale de ahí.
//
//  Qué hace, en orden:
//    1. Comprueba quién llama (con SU sesión, no con la clave secreta).
//    2. Comprueba que esa persona es propietaria del espacio.
//    3. Crea la invitación llamando a la función `invitar` de la base de
//       datos CON LA SESIÓN DE QUIEN LLAMA, para que las reglas de la
//       base vuelvan a comprobar el permiso. Dos candados, no uno.
//    4. Con la clave secreta, le manda a esa dirección el correo para
//       poner su contraseña, y ese correo vuelve a la app con el enlace
//       de la invitación ya puesto.
//
//  Variables de entorno necesarias en Vercel:
//    SUPABASE_URL          https://npaddnmffepnuidekynb.supabase.co
//    SUPABASE_SERVICE_KEY  la clave secreta (sb_secret_… / service_role)
// ══════════════════════════════════════════════════════════════

const ROLES = ['propietario', 'entrenador', 'analista', 'invitado'];
const MAX_PENDIENTES = 25;   // freno por espacio, para que esto no sea un grifo

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return fin(res, 204, null);
  if (req.method !== 'POST')   return fin(res, 405, { error: 'Sólo POST' });

  const URL_BASE = process.env.SUPABASE_URL;
  const SECRETA  = process.env.SUPABASE_SERVICE_KEY;
  if (!URL_BASE || !SECRETA) {
    return fin(res, 503, { error: 'Falta configurar SUPABASE_URL y SUPABASE_SERVICE_KEY en Vercel',
                           sinConfigurar: true });
  }

  const auth = req.headers.authorization || '';
  if (!/^Bearer\s+\S+/.test(auth)) return fin(res, 401, { error: 'Hay que iniciar sesión' });

  let cuerpo;
  try { cuerpo = await leeCuerpo(req); }
  catch (e) { return fin(res, 400, { error: 'No se ha entendido la petición' }); }

  const email   = String(cuerpo.email || '').trim().toLowerCase();
  const rol     = String(cuerpo.rol || 'entrenador');
  const espacio = String(cuerpo.espacio_id || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fin(res, 400, { error: 'Ese correo no tiene buena pinta' });
  if (ROLES.indexOf(rol) < 0)                        return fin(res, 400, { error: 'Ese rol no existe' });
  if (!/^[0-9a-f-]{36}$/i.test(espacio))             return fin(res, 400, { error: 'Falta el espacio' });

  const conSecreta = { apikey: SECRETA, Authorization: 'Bearer ' + SECRETA, 'Content-Type': 'application/json' };
  const conQuienLlama = { apikey: SECRETA, Authorization: auth, 'Content-Type': 'application/json' };

  try {
    // 1. ¿Quién llama?
    const yo = await pide(URL_BASE + '/auth/v1/user', { headers: conQuienLlama });
    if (!yo || !yo.id) return fin(res, 401, { error: 'Tu sesión ha caducado: vuelve a entrar' });

    // 2. ¿Es propietario de ese espacio?
    const mio = await pide(URL_BASE + '/rest/v1/miembros?espacio_id=eq.' + espacio +
                           '&perfil_id=eq.' + yo.id + '&select=rol', { headers: conSecreta });
    if (!Array.isArray(mio) || !mio.length || mio[0].rol !== 'propietario') {
      return fin(res, 403, { error: 'Sólo el propietario del espacio puede invitar' });
    }

    // Freno: que un despiste no deje cien invitaciones abiertas.
    const abiertas = await pide(URL_BASE + '/rest/v1/invitaciones?espacio_id=eq.' + espacio +
                                '&aceptada_en=is.null&select=id', { headers: conSecreta });
    if (Array.isArray(abiertas) && abiertas.length >= MAX_PENDIENTES) {
      return fin(res, 429, { error: 'Hay demasiadas invitaciones sin usar en este espacio. Revoca alguna antes.' });
    }

    // 3. La invitación la crea la base de datos, con la sesión de quien
    //    llama: así el permiso se comprueba otra vez allí.
    const token = await pide(URL_BASE + '/rest/v1/rpc/invitar', {
      method: 'POST', headers: conQuienLlama,
      body: JSON.stringify({ p_espacio: espacio, p_email: email, p_rol: rol })
    });
    if (!token || typeof token !== 'string') return fin(res, 500, { error: 'No se ha podido crear la invitación' });

    const origen = (req.headers.origin && /^https?:\/\//.test(req.headers.origin))
      ? req.headers.origin
      : 'https://' + (req.headers.host || 'app-integral.vercel.app');
    const enlace = origen + '/analisis.html?invitacion=' + encodeURIComponent(token);

    // 4. El correo para poner contraseña, que vuelve a la app con la
    //    invitación puesta. Si ya tenía cuenta, Supabase dice que no y
    //    entonces basta con mandarle el enlace: entra con su contraseña.
    let correo = false, yaTenia = false, avisoCorreo = '';
    try {
      await pide(URL_BASE + '/auth/v1/invite?redirect_to=' + encodeURIComponent(enlace), {
        method: 'POST', headers: conSecreta, body: JSON.stringify({ email: email })
      });
      correo = true;
    } catch (e) {
      const m = String((e && e.message) || '');
      if (/already|registrad|exists/i.test(m)) yaTenia = true;
      else avisoCorreo = m || 'No se ha podido enviar el correo';
    }

    return fin(res, 200, { ok: true, enlace: enlace, correo: correo, yaTenia: yaTenia,
                           aviso: avisoCorreo, email: email, rol: rol });
  } catch (e) {
    const est = (e && e.estado) || 500;
    return fin(res, est === 401 ? 401 : (est === 403 ? 403 : 500),
               { error: (e && e.message) || 'Algo ha fallado por el camino' });
  }
};

// ── Ayudantes ──────────────────────────────────────────────────
function fin(res, estado, datos) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(datos === null ? '' : JSON.stringify(datos));
}
function leeCuerpo(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(JSON.parse(req.body || '{}'));
  return new Promise((ok, mal) => {
    let t = '';
    req.on('data', c => { t += c; if (t.length > 20000) { mal(new Error('demasiado')); req.destroy(); } });
    req.on('end', () => { try { ok(JSON.parse(t || '{}')); } catch (e) { mal(e); } });
    req.on('error', mal);
  });
}
async function pide(url, opts) {
  const r = await fetch(url, opts);
  const txt = await r.text();
  let d = null;
  if (txt) { try { d = JSON.parse(txt); } catch (e) { d = txt; } }
  if (!r.ok) {
    const msg = (d && (d.message || d.msg || d.error_description || d.error || d.hint)) || ('HTTP ' + r.status);
    const err = new Error(msg); err.estado = r.status; throw err;
  }
  return d;
}
