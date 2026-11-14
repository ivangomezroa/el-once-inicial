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
  const cargo   = String(cuerpo.cargo || '').trim().slice(0, 60);
  const espacio = String(cuerpo.espacio_id || '').trim();
  // Reenviar: no se crea otra invitación, se vuelve a mandar la que ya hay.
  const reenvio = String(cuerpo.invitacion_id || '').trim();

  if (!/^[0-9a-f-]{36}$/i.test(espacio))             return fin(res, 400, { error: 'Falta el espacio' });
  if (reenvio) {
    if (!/^[0-9a-f-]{36}$/i.test(reenvio))           return fin(res, 400, { error: 'Esa invitación no vale' });
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fin(res, 400, { error: 'Ese correo no tiene buena pinta' });
    if (ROLES.indexOf(rol) < 0)                      return fin(res, 400, { error: 'Ese rol no existe' });
  }

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

    let token, aQuien = email, suRol = rol;

    if (reenvio) {
      // 3a. Reenviar la que ya existe: mismo token, 14 días más de vida.
      const filas = await pide(URL_BASE + '/rest/v1/invitaciones?id=eq.' + reenvio +
        '&espacio_id=eq.' + espacio + '&select=id,email,rol,cargo,token,aceptada_en', { headers: conSecreta });
      const inv = Array.isArray(filas) && filas[0];
      if (!inv)              return fin(res, 404, { error: 'Esa invitación ya no está' });
      if (inv.aceptada_en)   return fin(res, 409, { error: 'Esa invitación ya se usó' });
      const masCatorce = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
      await pide(URL_BASE + '/rest/v1/invitaciones?id=eq.' + reenvio, {
        method: 'PATCH', headers: Object.assign({ Prefer: 'return=minimal' }, conSecreta),
        body: JSON.stringify({ caduca_en: masCatorce })
      });
      token = inv.token; aQuien = inv.email; suRol = inv.rol;
    } else {
      // Freno: que un despiste no deje cien invitaciones abiertas.
      const abiertas = await pide(URL_BASE + '/rest/v1/invitaciones?espacio_id=eq.' + espacio +
                                  '&aceptada_en=is.null&select=id', { headers: conSecreta });
      if (Array.isArray(abiertas) && abiertas.length >= MAX_PENDIENTES) {
        return fin(res, 429, { error: 'Hay demasiadas invitaciones sin usar en este espacio. Revoca alguna antes.' });
      }
      // 3b. La invitación la crea la base de datos, con la sesión de quien
      //     llama: así el permiso se comprueba otra vez allí.
      token = await pide(URL_BASE + '/rest/v1/rpc/invitar', {
        method: 'POST', headers: conQuienLlama,
        body: JSON.stringify({ p_espacio: espacio, p_email: email, p_rol: rol, p_cargo: cargo || null })
      });
      if (!token || typeof token !== 'string') return fin(res, 500, { error: 'No se ha podido crear la invitación' });
    }

    const origen = (req.headers.origin && /^https?:\/\//.test(req.headers.origin))
      ? req.headers.origin
      : 'https://' + (req.headers.host || 'app-integral.vercel.app');
    const enlace = origen + '/analisis.html?invitacion=' + encodeURIComponent(token);

    // 4. El correo. Si la persona no tiene cuenta, se le manda la
    //    invitación de Supabase. Si YA la tiene —porque la invitaron
    //    antes, o porque el enlace anterior ya se usó: los de Supabase
    //    son de un solo uso— se le manda el de poner contraseña, que
    //    sirve igual y acaba en el mismo sitio. En los dos casos el
    //    enlace de vuelta lleva la invitación puesta.
    let correo = false, yaTenia = false, avisoCorreo = '';
    const vuelta = encodeURIComponent(enlace);
    try {
      await pide(URL_BASE + '/auth/v1/invite?redirect_to=' + vuelta, {
        method: 'POST', headers: conSecreta, body: JSON.stringify({ email: aQuien })
      });
      correo = true;
    } catch (e) {
      const m = String((e && e.message) || '');
      if (/already|registrad|exists/i.test(m)) {
        yaTenia = true;
        try {
          await pide(URL_BASE + '/auth/v1/recover?redirect_to=' + vuelta, {
            method: 'POST', headers: conSecreta, body: JSON.stringify({ email: aQuien })
          });
          correo = true;
        } catch (e2) { avisoCorreo = enCristiano((e2 && e2.message) || ''); }
      } else avisoCorreo = enCristiano(m);
    }

    return fin(res, 200, { ok: true, enlace: enlace, correo: correo, yaTenia: yaTenia,
                           reenviada: !!reenvio, aviso: avisoCorreo, email: aQuien, rol: suRol,
                           cargo: reenvio ? null : (cargo || null) });
  } catch (e) {
    const est = (e && e.estado) || 500;
    return fin(res, est === 401 ? 401 : (est === 403 ? 403 : 500),
               { error: (e && e.message) || 'Algo ha fallado por el camino' });
  }
};

// Los mensajes de Supabase vienen en inglés y de corrido. Este es el
// único que se ve a menudo: el correo de serie va muy limitado por hora.
function enCristiano(m) {
  var t = String(m || '');
  if (/rate limit|too many requests/i.test(t)) {
    return 'Supabase sólo deja mandar unos pocos correos por hora y se han agotado. ' +
           'Prueba dentro de un rato, o configura un correo propio.';
  }
  if (/invalid|not allowed/i.test(t) && /email/i.test(t)) return 'Supabase no acepta esa dirección de correo';
  return t || 'No se ha podido enviar el correo';
}

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
