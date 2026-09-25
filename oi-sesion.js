/* ══════════════════════════════════════════════════════════════════════
   EL ONCE INICIAL — SESIÓN DE USUARIO (compartida por todas las pantallas)
   ══════════════════════════════════════════════════════════════════════
   Qué hace:
     · Antes de dejar ver la pantalla, comprueba que hay sesión abierta.
     · Si no hay, muestra la puerta de entrada (correo + contraseña).
     · Elige o crea el espacio de trabajo (el "equipo" o "cuerpo técnico").
     · Deja una etiqueta con tu correo arriba a la derecha para salir.

   Reglas que respeta:
     · Sin librerías. Solo fetch. Vanilla JS.
     · Todo va dentro de una función anónima: no crea ni una variable
       global suelta, así no choca con nada de las pantallas.
     · SIN COBERTURA NO TE DEJA FUERA. Si ya habías entrado en este
       navegador y la nube no responde, entras igual y trabajas en local.
       La puerta solo aparece cuando NUNCA has entrado aquí.
     · Usa las mismas claves de localStorage que analisis.html
       (oi_nube_ses, oi_nube_espacio), así las dos partes se entienden.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.OISesion) return;

var URL_  = 'https://npaddnmffepnuidekynb.supabase.co';
var KEY   = 'sb_publishable_YfvyI8taXsUNCcun0kYUnw_BlxCbPR9';
var K_SES = 'oi_nube_ses';
var K_ESP = 'oi_nube_espacio';
var K_INV = 'oi_nube_invitacion_pendiente';

var ses = null, esp = null, modo = 'entrar', ocupado = false;

// ── Almacén ───────────────────────────────────────────────────────────
function leeLS(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } }
function grabaLS(k,v){ try{ v===null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function cargaSesion(){ ses = leeLS(K_SES); esp = leeLS(K_ESP); }

// ── Petición ──────────────────────────────────────────────────────────
function pide(ruta, opts, conSesion){
  opts = opts || {};
  var cab = {'apikey': KEY, 'Content-Type': 'application/json'};
  for(var k in (opts.headers||{})) cab[k] = opts.headers[k];
  var pre = (conSesion === false)
    ? Promise.resolve(null)
    : testigo();
  return pre.then(function(t){
    cab['Authorization'] = 'Bearer ' + (t || KEY);
    var o = {headers: cab};
    for(var k2 in opts) if(k2 !== 'headers') o[k2] = opts[k2];
    return fetch(URL_ + ruta, o);
  }).then(function(r){
    return r.text().then(function(txt){
      var cuerpo = null;
      if(txt){ try{ cuerpo = JSON.parse(txt); }catch(e){ cuerpo = txt; } }
      if(!r.ok){
        var msg = (cuerpo && (cuerpo.msg || cuerpo.message || cuerpo.error_description || cuerpo.error || cuerpo.hint)) || ('HTTP ' + r.status);
        var err = new Error(msg); err.estado = r.status; throw err;
      }
      return cuerpo;
    });
  });
}

// Renueva el testigo si le quedan menos de 60 segundos.
function testigo(){
  if(!ses) return Promise.resolve(null);
  var ahora = Math.floor(Date.now()/1000);
  if(ses.expira && ses.expira - ahora > 60) return Promise.resolve(ses.access_token);
  if(!ses.refresh_token) return Promise.resolve(ses.access_token);
  return pide('/auth/v1/token?grant_type=refresh_token', {
    method:'POST', body: JSON.stringify({refresh_token: ses.refresh_token})
  }, false).then(function(d){
    ses = {access_token:d.access_token, refresh_token:d.refresh_token,
           expira: Math.floor(Date.now()/1000) + (d.expires_in||3600),
           email: (d.user && d.user.email) || ses.email};
    grabaLS(K_SES, ses);
    return ses.access_token;
  }).catch(function(e){
    // 400/401 = el refresco ya no vale: hay que volver a entrar.
    // Cualquier otro fallo (sin cobertura) NO cierra la sesión.
    if(e && (e.estado === 400 || e.estado === 401 || e.estado === 403)){
      ses = null; grabaLS(K_SES, null);
      return null;
    }
    return ses ? ses.access_token : null;
  });
}

function guardaSesionDe(d, email){
  ses = {access_token:d.access_token, refresh_token:d.refresh_token,
         expira: Math.floor(Date.now()/1000) + (d.expires_in||3600),
         email: (d.user && d.user.email) || email};
  grabaLS(K_SES, ses);
}

function rpc(nombre, args){
  return pide('/rest/v1/rpc/'+nombre, {method:'POST', body: JSON.stringify(args||{})});
}

// ── Estilos (prefijo oi-s-, no toca nada de la pantalla) ──────────────
var CSS = ''
+ '.oi-s-velo{position:fixed;inset:0;z-index:99990;background:#0f1624;display:flex;'
+   'align-items:center;justify-content:center;padding:18px;overflow:auto;'
+   'font-family:"Segoe UI",system-ui,sans-serif;}'
+ '.oi-s-caja{width:100%;max-width:380px;background:#1e2d40;border:1px solid rgba(200,168,75,.35);'
+   'border-radius:10px;padding:26px 24px 22px;box-shadow:0 18px 50px rgba(0,0,0,.55);}'
+ '.oi-s-marca{font-family:"Barlow Condensed","Segoe UI",sans-serif;font-size:26px;font-weight:700;'
+   'color:#C8A84B;letter-spacing:1.5px;text-transform:uppercase;line-height:1;margin:0 0 4px;text-align:center;}'
+ '.oi-s-lema{font-size:10px;letter-spacing:2px;color:#8a93a5;text-transform:uppercase;'
+   'text-align:center;margin:0 0 22px;}'
+ '.oi-s-tit{font-family:"Barlow Condensed","Segoe UI",sans-serif;font-size:15px;letter-spacing:1px;'
+   'text-transform:uppercase;color:#ddd8cc;margin:0 0 14px;padding-bottom:7px;'
+   'border-bottom:1px solid rgba(255,255,255,.09);}'
+ '.oi-s-fila{margin-bottom:12px;}'
+ '.oi-s-fila label{display:block;font-size:11px;letter-spacing:.6px;text-transform:uppercase;'
+   'color:#8a93a5;margin-bottom:5px;}'
+ '.oi-s-in{width:100%;box-sizing:border-box;background:#0f1624;color:#ddd8cc;'
+   'border:1px solid rgba(255,255,255,.14);border-radius:5px;padding:10px 11px;font-size:16px;'
+   'font-family:inherit;outline:none;}'
+ '.oi-s-in:focus{border-color:#C8A84B;}'
+ '.oi-s-b{width:100%;box-sizing:border-box;padding:11px;border-radius:5px;cursor:pointer;'
+   'font-family:"Barlow Condensed","Segoe UI",sans-serif;font-size:14px;letter-spacing:1px;'
+   'text-transform:uppercase;font-weight:600;border:1px solid rgba(255,255,255,.16);'
+   'background:transparent;color:#ddd8cc;margin-top:6px;}'
+ '.oi-s-b:hover{border-color:#C8A84B;color:#C8A84B;}'
+ '.oi-s-b.pri{background:#C8A84B;border-color:#C8A84B;color:#1B2A6B;}'
+ '.oi-s-b.pri:hover{background:#d8ba63;color:#1B2A6B;}'
+ '.oi-s-b[disabled]{opacity:.5;cursor:default;}'
+ '.oi-s-mini{background:none;border:0;color:#8a93a5;font-size:12px;cursor:pointer;'
+   'padding:8px 2px 0;font-family:inherit;text-decoration:underline;}'
+ '.oi-s-mini:hover{color:#C8A84B;}'
+ '.oi-s-nota{font-size:11.5px;line-height:1.5;color:#8a93a5;margin-top:14px;}'
+ '.oi-s-av{display:none;font-size:12.5px;line-height:1.45;border-radius:5px;padding:9px 11px;margin-bottom:14px;}'
+ '.oi-s-av.mal{display:block;background:rgba(224,82,82,.14);border:1px solid rgba(224,82,82,.5);color:#ffb4b4;}'
+ '.oi-s-av.bien{display:block;background:rgba(46,204,64,.12);border:1px solid rgba(46,204,64,.45);color:#b6ecb6;}'
+ '.oi-s-av.info{display:block;background:rgba(200,168,75,.11);border:1px solid rgba(200,168,75,.4);color:#e2d3a4;}'
+ '.oi-s-esp{width:100%;box-sizing:border-box;text-align:left;background:#0f1624;color:#ddd8cc;'
+   'border:1px solid rgba(255,255,255,.12);border-radius:5px;padding:10px 12px;margin-bottom:7px;'
+   'cursor:pointer;font-family:inherit;font-size:13.5px;}'
+ '.oi-s-esp:hover{border-color:#C8A84B;}'
+ '.oi-s-esp small{display:block;color:#8a93a5;font-size:11px;margin-top:2px;}'
+ '.oi-s-carg{color:#8a93a5;font-size:13px;text-align:center;padding:10px 0;}'
/* etiqueta de usuario */
+ '.oi-s-chip{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;'
+   'background:rgba(200,168,75,.1);border:1px solid rgba(200,168,75,.42);color:#C8A84B;'
+   'border-radius:20px;padding:4px 11px;font-family:"Segoe UI",system-ui,sans-serif;'
+   'font-size:11.5px;line-height:1.2;cursor:pointer;max-width:210px;}'
+ '.oi-s-chip:hover{background:rgba(200,168,75,.2);}'
+ '.oi-s-chip b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
+ '.oi-s-chip.suelto{position:fixed;top:14px;right:16px;z-index:9000;}'
+ '.oi-s-men{position:fixed;z-index:99991;background:#1e2d40;border:1px solid rgba(200,168,75,.4);'
+   'border-radius:8px;padding:8px;min-width:210px;box-shadow:0 14px 36px rgba(0,0,0,.55);'
+   'font-family:"Segoe UI",system-ui,sans-serif;}'
+ '.oi-s-men .d{font-size:11px;color:#8a93a5;padding:3px 6px;line-height:1.5;}'
+ '.oi-s-men .d b{color:#ddd8cc;font-weight:600;}'
+ '.oi-s-men hr{border:0;border-top:1px solid rgba(255,255,255,.1);margin:7px 0;}'
+ '.oi-s-men button{display:block;width:100%;text-align:left;background:none;border:0;'
+   'color:#ddd8cc;font-size:12.5px;padding:7px 6px;border-radius:4px;cursor:pointer;font-family:inherit;}'
+ '.oi-s-men button:hover{background:rgba(255,255,255,.07);color:#C8A84B;}'
+ '@media print{.oi-s-chip,.oi-s-men,.oi-s-velo{display:none !important;}}';

function ponEstilos(){
  if(document.getElementById('oi-s-css')) return;
  var s = document.createElement('style');
  s.id = 'oi-s-css'; s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
}

// ── La puerta ─────────────────────────────────────────────────────────
function velo(){
  var v = document.getElementById('oi-s-velo');
  if(!v){
    v = document.createElement('div');
    v.id = 'oi-s-velo'; v.className = 'oi-s-velo';
    v.innerHTML = '<div class="oi-s-caja" id="oi-s-caja"></div>';
    document.body.appendChild(v);
  }
  return document.getElementById('oi-s-caja');
}
function quitaVelo(){
  var v = document.getElementById('oi-s-velo');
  if(v && v.parentNode) v.parentNode.removeChild(v);
}
function cabecera(){
  return '<div class="oi-s-marca">El Once Inicial</div>'
       + '<div class="oi-s-lema">Sistema de gestión para equipos</div>';
}
function esc(s){
  return String(s==null?'':s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}
function aviso(t, clase){
  var a = document.getElementById('oi-s-av');
  if(a){ a.className = 'oi-s-av ' + (clase||''); a.innerHTML = t || ''; }
}
function trabajando(si, texto){
  ocupado = si;
  var b = document.getElementById('oi-s-pri');
  if(b){ b.disabled = si; if(si && texto) b.textContent = texto; }
}

function pintaEntrar(){
  ponEstilos();
  var c = velo();
  var hayInv = !!localStorage.getItem(K_INV);
  var h = cabecera();
  h += '<div class="oi-s-av" id="oi-s-av"></div>';

  if(modo === 'recuperar'){
    h += '<div class="oi-s-tit">Recuperar contraseña</div>'
      +  '<div class="oi-s-fila"><label>Correo</label>'
      +  '<input type="email" class="oi-s-in" id="oi-s-em" placeholder="tu@correo.com" autocomplete="username"></div>'
      +  '<button class="oi-s-b pri" id="oi-s-pri" data-a="recuperar">Enviarme el enlace</button>'
      +  '<button class="oi-s-mini" data-a="volver">Volver a entrar</button>'
      +  '<div class="oi-s-nota">Te llega un correo con un enlace. Al pulsarlo se abre la app y te pide la contraseña nueva.</div>';
  } else if(modo === 'nueva'){
    h += '<div class="oi-s-tit">Contraseña nueva</div>'
      +  '<div class="oi-s-fila"><label>Nueva contraseña</label>'
      +  '<input type="password" class="oi-s-in" id="oi-s-pw" placeholder="Mínimo 8 caracteres" autocomplete="new-password"></div>'
      +  '<div class="oi-s-fila"><label>Repítela</label>'
      +  '<input type="password" class="oi-s-in" id="oi-s-pw2" placeholder="Otra vez" autocomplete="new-password"></div>'
      +  '<button class="oi-s-b pri" id="oi-s-pri" data-a="guardarClave">Guardar y entrar</button>';
  } else {
    h += '<div class="oi-s-tit">Entrar</div>'
      +  '<div class="oi-s-fila"><label>Correo</label>'
      +  '<input type="email" class="oi-s-in" id="oi-s-em" placeholder="tu@correo.com" autocomplete="username"></div>'
      +  '<div class="oi-s-fila"><label>Contraseña</label>'
      +  '<input type="password" class="oi-s-in" id="oi-s-pw" placeholder="Tu contraseña" autocomplete="current-password"></div>'
      +  '<button class="oi-s-b pri" id="oi-s-pri" data-a="entrar">Entrar</button>'
      +  '<button class="oi-s-mini" data-a="recuperar-ir">He olvidado la contraseña</button>';
    if(hayInv){
      h += '<div class="oi-s-nota">Tienes una invitación pendiente. Entra con el correo al que te llegó y se aplicará sola.</div>';
    } else {
      h += '<div class="oi-s-nota">Las cuentas las crea el responsable del equipo: nadie puede registrarse por su cuenta. Si te han invitado, entra con el correo de la invitación.</div>';
    }
  }
  c.innerHTML = h;
  engancha(c);
  var foco = document.getElementById('oi-s-em') || document.getElementById('oi-s-pw');
  if(foco) foco.focus();
}

function pintaEspacios(lista){
  ponEstilos();
  var c = velo();
  var h = cabecera() + '<div class="oi-s-av" id="oi-s-av"></div>'
        + '<div class="oi-s-tit">Espacio de trabajo</div>';
  if(lista && lista.length){
    h += '<div class="oi-s-nota" style="margin:0 0 12px;">Elige con qué equipo vas a trabajar.</div>';
    lista.forEach(function(e){
      h += '<button class="oi-s-esp" data-a="elegir" data-id="'+esc(e.id)+'" data-n="'+esc(e.nombre)+'" data-r="'+esc(e.rol)+'">'
        +  esc(e.nombre) + '<small>' + esc(e.rol) + ' · ' + (e.miembros||1) + (e.miembros==1?' persona':' personas') + '</small></button>';
    });
    h += '<hr style="border:0;border-top:1px solid rgba(255,255,255,.1);margin:14px 0 12px;">';
  } else {
    h += '<div class="oi-s-nota" style="margin:0 0 14px;">Todavía no tienes ningún espacio. Crea el primero: es donde viven los informes, las fichas y el calendario del equipo.</div>';
  }
  h += '<div class="oi-s-fila"><label>Crear espacio nuevo</label>'
    +  '<input type="text" class="oi-s-in" id="oi-s-nom" placeholder="Ej: Cuerpo técnico 2026-27"></div>'
    +  '<button class="oi-s-b pri" id="oi-s-pri" data-a="crear">Crear espacio</button>'
    +  '<button class="oi-s-mini" data-a="salir">Cerrar sesión</button>';
  c.innerHTML = h;
  engancha(c);
}

function engancha(c){
  c.addEventListener('click', function(ev){
    var b = ev.target.closest('[data-a]');
    if(!b || ocupado) return;
    accion(b.getAttribute('data-a'), b);
  });
  c.addEventListener('keydown', function(ev){
    if(ev.key !== 'Enter') return;
    var p = document.getElementById('oi-s-pri');
    if(p && !ocupado){ ev.preventDefault(); accion(p.getAttribute('data-a'), p); }
  });
}

function valor(id){ var e = document.getElementById(id); return e ? e.value.trim() : ''; }

function accion(a, b){
  if(a === 'recuperar-ir'){ modo = 'recuperar'; pintaEntrar(); return; }
  if(a === 'volver'){ modo = 'entrar'; pintaEntrar(); return; }

  if(a === 'entrar'){
    var em = valor('oi-s-em'), pw = (document.getElementById('oi-s-pw')||{}).value || '';
    if(!em || !pw){ aviso('Pon el correo y la contraseña.', 'mal'); return; }
    trabajando(true, 'Entrando…');
    aviso('');
    pide('/auth/v1/token?grant_type=password', {
      method:'POST', body: JSON.stringify({email:em, password:pw})
    }, false).then(function(d){
      guardaSesionDe(d, em);
      return aplicaInvitacion();
    }).then(function(){
      location.reload();
    }).catch(function(e){
      trabajando(false); pintaEntrar();
      aviso(mensajeError(e), 'mal');
    });
    return;
  }

  if(a === 'recuperar'){
    var em2 = valor('oi-s-em');
    if(!em2){ aviso('Pon tu correo.', 'mal'); return; }
    trabajando(true, 'Enviando…');
    pide('/auth/v1/recover', {method:'POST', body: JSON.stringify({email:em2})}, false)
      .then(function(){
        modo = 'entrar'; pintaEntrar();
        aviso('Te hemos enviado un correo. Abre el enlace desde este mismo dispositivo.', 'bien');
      })
      .catch(function(e){ trabajando(false); aviso(mensajeError(e), 'mal'); });
    return;
  }

  if(a === 'guardarClave'){
    var p1 = (document.getElementById('oi-s-pw')||{}).value || '';
    var p2 = (document.getElementById('oi-s-pw2')||{}).value || '';
    if(p1.length < 8){ aviso('La contraseña necesita 8 caracteres como mínimo.', 'mal'); return; }
    if(p1 !== p2){ aviso('Las dos contraseñas no coinciden.', 'mal'); return; }
    trabajando(true, 'Guardando…');
    pide('/auth/v1/user', {method:'PUT', body: JSON.stringify({password:p1})})
      .then(function(){ limpiaHash(); location.reload(); })
      .catch(function(e){ trabajando(false); aviso(mensajeError(e), 'mal'); });
    return;
  }

  if(a === 'elegir'){
    grabaLS(K_ESP, {id:b.getAttribute('data-id'), nombre:b.getAttribute('data-n'), rol:b.getAttribute('data-r')});
    location.reload();
    return;
  }

  if(a === 'crear'){
    var nom = valor('oi-s-nom');
    if(!nom){ aviso('Ponle nombre al espacio.', 'mal'); return; }
    trabajando(true, 'Creando…');
    rpc('crear_espacio', {p_nombre:nom}).then(function(id){
      grabaLS(K_ESP, {id:id, nombre:nom, rol:'propietario'});
      location.reload();
    }).catch(function(e){ trabajando(false); aviso(mensajeError(e), 'mal'); });
    return;
  }

  if(a === 'salir'){ salir(); return; }
  if(a === 'cambiar'){
    grabaLS(K_ESP, null); location.reload(); return;
  }
}

function mensajeError(e){
  var m = (e && e.message) || 'Ha fallado algo';
  if(/invalid login credentials/i.test(m)) return 'El correo o la contraseña no son correctos.';
  if(/email not confirmed/i.test(m))       return 'Esa cuenta no ha confirmado su correo todavía. Busca el correo de confirmación.';
  if(/signups? not allowed|signup is disabled/i.test(m)) return 'El registro está cerrado. Las cuentas las crea el responsable del equipo.';
  if(/failed to fetch|networkerror|load failed/i.test(m)) return 'No hay conexión con la nube. Comprueba internet e inténtalo otra vez.';
  if(/rate limit|too many/i.test(m))       return 'Demasiados intentos seguidos. Espera un minuto.';
  return m;
}

function salir(){
  testigo().then(function(){
    return pide('/auth/v1/logout', {method:'POST'}).catch(function(){});
  }).catch(function(){}).then(function(){
    grabaLS(K_SES, null); grabaLS(K_ESP, null);
    location.reload();
  });
}

// ── Invitaciones ──────────────────────────────────────────────────────
function guardaInvitacionDeURL(){
  var m = /[?&]invitacion=([^&#]+)/.exec(location.search);
  if(m){
    try{ localStorage.setItem(K_INV, decodeURIComponent(m[1])); }catch(e){}
    try{ history.replaceState(null, '', location.pathname); }catch(e){}
  }
}
function aplicaInvitacion(){
  var t = null;
  try{ t = localStorage.getItem(K_INV); }catch(e){}
  if(!t) return Promise.resolve();
  return rpc('aceptar_invitacion', {p_token:t}).then(function(id){
    try{ localStorage.removeItem(K_INV); }catch(e){}
    if(id) grabaLS(K_ESP, {id:id, nombre:'(invitación)', rol:'entrenador'});
  }).catch(function(){ /* la invitación no valía: se sigue normal */ });
}

// ── Enlace de recuperación (#access_token=…&type=recovery) ────────────
function hashRecuperacion(){
  var h = location.hash || '';
  if(h.indexOf('access_token=') < 0 || h.indexOf('type=recovery') < 0) return false;
  var p = new URLSearchParams(h.replace(/^#/, ''));
  ses = {access_token:p.get('access_token'), refresh_token:p.get('refresh_token'),
         expira: Math.floor(Date.now()/1000) + parseInt(p.get('expires_in')||'3600', 10), email:''};
  grabaLS(K_SES, ses);
  return true;
}
function limpiaHash(){ try{ history.replaceState(null, '', location.pathname); }catch(e){} }

// ── Traer los jugadores de Captación desde la nube ────────────────────
// Captación guarda su base en `oi_jugadores_v1` y no habla con la nube.
// En un móvil recién abierto eso está vacío, así que se le da una manera
// de bajarla sin tener que pasar por Análisis.
function traeJugadores(){
  var e = leeLS(K_ESP);
  if(!ses)        return Promise.reject(new Error('Entra con tu cuenta primero'));
  if(!e || !e.id) return Promise.reject(new Error('Elige un espacio de trabajo primero'));
  return pide('/rest/v1/jugadores?espacio_id=eq.' + encodeURIComponent(e.id) + '&select=datos')
    .then(function(filas){
      var lista = (filas||[]).map(function(f){ return f.datos; }).filter(Boolean);
      if(!lista.length) throw new Error('En la nube no hay jugadores guardados en este espacio');
      localStorage.setItem('oi_jugadores_v1', JSON.stringify(lista));
      return lista.length;
    });
}

// ── Etiqueta de usuario ───────────────────────────────────────────────
function ponChip(){
  if(document.getElementById('oi-s-chip')) return;
  ponEstilos();
  var barra = document.querySelector('#topnav') || document.querySelector('.topnav') || document.querySelector('.oi-topnav');
  var chip = document.createElement('button');
  chip.id = 'oi-s-chip';
  chip.className = 'oi-s-chip no-print' + (barra ? '' : ' suelto');
  chip.title = 'Sesión de usuario';
  chip.innerHTML = '<span>👤</span><b>' + esc(esp ? esp.nombre : (ses.email||'')) + '</b>';
  chip.addEventListener('click', function(ev){ ev.stopPropagation(); menu(chip); });
  if(barra){
    // En la barra: se encoge si no cabe, en vez de desbordarla.
    chip.style.marginLeft = 'auto';
    chip.style.flexShrink = '1';
    chip.style.minWidth   = '0';
    chip.style.maxWidth   = '170px';
    barra.appendChild(chip);
  } else {
    document.body.appendChild(chip);
  }
}

function menu(chip){
  var v = document.getElementById('oi-s-men');
  if(v){ v.parentNode.removeChild(v); return; }
  var d = document.createElement('div');
  d.id = 'oi-s-men'; d.className = 'oi-s-men no-print';
  d.innerHTML = '<div class="d">Usuario<br><b>' + esc(ses.email||'—') + '</b></div>'
    + (esp ? '<div class="d">Espacio<br><b>' + esc(esp.nombre) + '</b> · ' + esc(esp.rol||'') + '</div>' : '')
    + '<hr>'
    + '<button data-a="cambiar">Cambiar de espacio</button>'
    + '<button data-a="salir">Cerrar sesión</button>';
  document.body.appendChild(d);
  var r = chip.getBoundingClientRect();
  d.style.top = (r.bottom + 6) + 'px';
  d.style.left = Math.max(8, Math.min(r.right - d.offsetWidth, window.innerWidth - d.offsetWidth - 8)) + 'px';
  d.addEventListener('click', function(ev){
    var b = ev.target.closest('[data-a]'); if(!b) return;
    accion(b.getAttribute('data-a'), b);
  });
  setTimeout(function(){
    document.addEventListener('click', function cierra(){
      var x = document.getElementById('oi-s-men');
      if(x && x.parentNode) x.parentNode.removeChild(x);
      document.removeEventListener('click', cierra);
    });
  }, 0);
}

/* ══════════════════════════════════════════════════════════════════════
   PIZARRA Y PLANILLA DE SESIÓN EN LA NUBE
   ══════════════════════════════════════════════════════════════════════
   La pizarra y la planilla guardaban SOLO en el navegador. Esto las sube
   y las baja solas, sin pulsar nada, desde CUALQUIERA de las pantallas
   (porque este fichero lo cargan las seis).

   Por qué es un motor aparte y no el de Análisis:
     Análisis ya tiene el suyo para informes, jugadores, rivales y
     calendario. Dos motores tocando los mismos datos es justo la forma
     de perder trabajo. Así que este usa TABLAS distintas (tareas,
     sesiones, ajustes), CLAVES de localStorage distintas y su propia
     marca de pendiente. Los dos no se cruzan en ningún punto.

   Reglas, por orden de importancia — las mismas que ya costaron un
   disgusto y por las que existe el cinturón de seguridad:
     1. Nunca se pierde trabajo. Subir solo añade y actualiza.
     2. Solo se BAJA si este dispositivo no tiene nada pendiente.
     3. Sin cobertura no pasa nada: queda pendiente y se sube al volver.
     4. Los borrados viajan (lápidas), si no reaparecen al bajar.
   ══════════════════════════════════════════════════════════════════════ */
var PZ_PEND  = 'oi_pz_pend';       // hay cambios de aquí sin subir
var PZ_BORRA = 'oi_pz_borrados';   // lápidas: lo borrado aquí, para borrarlo allí
var PZ_AUTO  = 'oi_pz_auto';       // ya se estrenó el automático en este navegador
var PZ_ULT   = 'oi_pz_ultima';
var PZ_CALMA = 12000;              // espera tras el último cambio

// Listas (una fila por elemento) y valores sueltos (una fila por clave).
var PZ_LISTAS = {
  'pz_tasks_v3': {tabla:'tareas',   fila: function(t){
      return {id_local:String(t.id), nombre:String(t.name||''),
              fase:String(t.fasePrincipal||''), datos:t}; }},
  'pz_sessions': {tabla:'sesiones', fila: function(s){
      return {id_local:String(s.id), numero:(parseInt(s.num,10)||null),
              fecha:String(s.date||''), datos:s}; }}
};
var PZ_SUELTAS = ['pz_mdj','pz_tipos','pz_players','oi_team_crest'];
var PZ_CLAVES  = {'pz_tasks_v3':1,'pz_sessions':1,'pz_mdj':1,'pz_tipos':1,
                  'pz_players':1,'oi_team_crest':1};

var pzT = null, pzEnCurso = false;

// ── La foto del momento de abrir ──────────────────────────────────────
// Se toma AQUÍ, al cargar este fichero, que va en el <head> y por tanto
// antes de que la pantalla ejecute nada. Hace falta porque las pantallas
// escriben en localStorage solo con pintarse (la pizarra reescribe
// pz_tipos y pz_mdj cada vez), y eso pasa ANTES de que la decisión de
// subir o bajar llegue de la nube. Si la decisión se tomara leyendo el
// momento, un dispositivo recién estrenado se creería con trabajo
// pendiente por haber abierto la pantalla, y nunca bajaría nada.
var pzInicio = null;
function pzFoto(){
  if(pzInicio) return pzInicio;
  var tenia = {};
  PZ_SUELTAS.forEach(function(k){
    try{ tenia[k] = localStorage.getItem(k) !== null; }catch(e){ tenia[k] = false; }
  });
  pzInicio = {pend: pzPend(), lapidas: pzLapidas().length,
              cuenta: pzCuentaAqui(), tenia: tenia, listas: pzCuentaPorLista()};
  return pzInicio;
}
function pzCuentaPorLista(){
  var o = {};
  Object.keys(PZ_LISTAS).forEach(function(k){
    var a = pzLista(k);
    o[k] = a ? a.filter(function(x){ return x && x.id; }).length : 0;
  });
  return o;
}

function pzPend(){ try{ return localStorage.getItem(PZ_PEND)==='1'; }catch(e){ return false; } }
function pzMarca(si){
  try{ si ? localStorage.setItem(PZ_PEND,'1') : localStorage.removeItem(PZ_PEND); }catch(e){}
}
function pzLapidas(){
  try{ var a=JSON.parse(localStorage.getItem(PZ_BORRA)||'[]'); return Array.isArray(a)?a:[]; }
  catch(e){ return []; }
}
// El escudo es una cadena base64, no JSON: se envuelve para que quepa
// en la misma columna jsonb que el resto.
function pzLeeSuelta(k){
  try{
    var s = localStorage.getItem(k);
    if(s===null) return null;
    if(k==='oi_team_crest') return {v:s};
    return JSON.parse(s);
  }catch(e){ return null; }
}
function pzEscribeSuelta(k, d){
  try{
    if(d===null || d===undefined) return false;
    if(k==='oi_team_crest'){
      var v = (d && typeof d==='object') ? d.v : d;
      if(!v) return false;
      localStorage.setItem(k, String(v)); return true;
    }
    localStorage.setItem(k, JSON.stringify(d)); return true;
  }catch(e){ return false; }
}
function pzLista(k){
  try{ var a=JSON.parse(localStorage.getItem(k)||'null'); return Array.isArray(a)?a:null; }
  catch(e){ return null; }
}

// Cuántas tareas y sesiones hay aquí. Es el cinturón: si aquí hay más
// que allí, este dispositivo va por delante y NO se baja nada encima.
function pzCuentaAqui(){
  var n = 0;
  Object.keys(PZ_LISTAS).forEach(function(k){
    var a = pzLista(k); if(a) n += a.filter(function(x){ return x && x.id; }).length;
  });
  return n;
}
// Qué hay en la nube, en barato: solo los id_local y las claves, que
// pesan poco. Así no hay que depender de las cabeceras de conteo de
// PostgREST, y de paso se sabe qué valores sueltos tiene ya.
function pzEstadoAlli(e){
  var q = 'espacio_id=eq.' + encodeURIComponent(e.id);
  return Promise.all([
    pide('/rest/v1/tareas?'   + q + '&select=id_local'),
    pide('/rest/v1/sesiones?' + q + '&select=id_local'),
    pide('/rest/v1/ajustes?'  + q + '&select=clave')
  ]).then(function(r){
    return {cuenta: (r[0]||[]).length + (r[1]||[]).length,
            claves: (r[2]||[]).map(function(x){ return x.clave; })};
  });
}

// ── Apuntar un borrado, para que también se borre en la nube ──
function pzBorrado(tabla, idLocal){
  try{
    var a = pzLapidas();
    a.push({tabla:tabla, id:String(idLocal)});
    localStorage.setItem(PZ_BORRA, JSON.stringify(a.slice(-400)));
    pzMarca(true); pzCambio();
  }catch(e){}
}
function pzAplicaLapidas(e){
  var a = pzLapidas();
  if(!a.length) return Promise.resolve(0);
  return Promise.all(a.map(function(l){
    return pide('/rest/v1/'+l.tabla+'?espacio_id=eq.'+encodeURIComponent(e.id)
              + '&id_local=eq.'+encodeURIComponent(l.id), {method:'DELETE'})
      .then(function(){ return 1; });
  })).then(function(){
    try{ localStorage.removeItem(PZ_BORRA); }catch(e2){}
    return a.length;
  });
}

// ── Subir ──
function pzSubeTabla(tabla, filas){
  if(!filas.length) return Promise.resolve(0);
  var LIMITE = 1200*1024, lotes = [], i = 0;
  while(i < filas.length){
    var lote = [], bytes = 0;
    while(i < filas.length){
      var s = JSON.stringify(filas[i]).length;
      if(lote.length && bytes + s > LIMITE) break;
      lote.push(filas[i]); bytes += s; i++;
    }
    lotes.push(lote);
  }
  return lotes.reduce(function(p, lote){
    return p.then(function(){
      return pide('/rest/v1/'+tabla+'?on_conflict=espacio_id,id_local', {
        method:'POST',
        headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify(lote)
      });
    });
  }, Promise.resolve()).then(function(){ return filas.length; });
}

function pzSube(){
  var e = leeLS(K_ESP);
  if(!ses || !e || !e.id) return Promise.reject(new Error('Sin sesión o sin espacio'));
  var res = {};
  return pzAplicaLapidas(e).then(function(){
    var pasos = [];
    Object.keys(PZ_LISTAS).forEach(function(k){
      var cfg = PZ_LISTAS[k], a = pzLista(k);
      if(!a) return;
      var filas = a.filter(function(x){ return x && x.id; }).map(function(x){
        var f = cfg.fila(x); f.espacio_id = e.id; return f;
      });
      pasos.push(function(){
        return pzSubeTabla(cfg.tabla, filas).then(function(n){ res[cfg.tabla] = n; });
      });
    });
    var aj = [];
    PZ_SUELTAS.forEach(function(k){
      var d = pzLeeSuelta(k);
      if(d===null || d===undefined) return;
      aj.push({espacio_id:e.id, clave:k, datos:d});
    });
    if(aj.length) pasos.push(function(){
      return pide('/rest/v1/ajustes?on_conflict=espacio_id,clave', {
        method:'POST',
        headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},
        body: JSON.stringify(aj)
      }).then(function(){ res.ajustes = aj.length; });
    });
    return pasos.reduce(function(p,f){ return p.then(f); }, Promise.resolve());
  }).then(function(){
    try{ localStorage.setItem(PZ_ULT, new Date().toISOString()); }catch(e2){}
    return res;
  });
}

// ── Bajar ──
function pzBaja(){
  var e = leeLS(K_ESP);
  if(!e || !e.id) return Promise.reject(new Error('Sin espacio'));
  var q = 'espacio_id=eq.' + encodeURIComponent(e.id);
  return Promise.all([
    pide('/rest/v1/tareas?'   + q + '&select=datos'),
    pide('/rest/v1/sesiones?' + q + '&select=datos'),
    pide('/rest/v1/ajustes?'  + q + '&select=clave,datos')
  ]).then(function(r){
    var tareas   = (r[0]||[]).map(function(x){ return x.datos; }).filter(Boolean);
    var sesiones = (r[1]||[]).map(function(x){ return x.datos; }).filter(Boolean);
    var ajustes  = {};
    (r[2]||[]).forEach(function(x){ if(x && x.clave) ajustes[x.clave] = x.datos; });

    var cambiadas = [];
    var ahora = pzCuentaPorLista(), f0 = pzFoto().listas;
    // Último cinturón: si una lista ha CRECIDO desde que se abrió la
    // pantalla, aquí se ha guardado algo mientras se pedían los datos.
    // Eso no se pisa: se sube en la siguiente vuelta.
    var seguro = function(k){ return ahora[k] <= (f0[k]||0); };
    window.__oiBajando = true;
    try{
      // Solo se escribe lo que la nube tiene de verdad: una nube vacía
      // no borra lo que haya aquí.
      if(tareas.length && seguro('pz_tasks_v3')){
        try{ localStorage.setItem('pz_tasks_v3', JSON.stringify(tareas)); cambiadas.push('pz_tasks_v3'); }catch(e2){}
      }
      if(sesiones.length && seguro('pz_sessions')){
        try{ localStorage.setItem('pz_sessions', JSON.stringify(sesiones)); cambiadas.push('pz_sessions'); }catch(e2){}
      }
      PZ_SUELTAS.forEach(function(k){
        if(ajustes[k] !== undefined && pzEscribeSuelta(k, ajustes[k])) cambiadas.push(k);
      });
    } finally {
      window.__oiBajando = false;
    }
    // Bajar NO deja pendiente: si lo dejara, se subiría en bucle. Pero si
    // algo se ha quedado sin pisar por el cinturón, eso SÍ hay que subirlo.
    var protegidas = Object.keys(PZ_LISTAS).filter(function(k){ return !seguro(k); });
    if(protegidas.length){ pzMarca(true); pzCambio(); } else { pzMarca(false); }
    if(cambiadas.length) pzAvisaPantalla(cambiadas);
    return {tareas:tareas.length, sesiones:sesiones.length,
            ajustes:Object.keys(ajustes).length, claves:cambiadas};
  });
}

// La pantalla ya está pintada con lo que había, así que se le avisa para
// que se refresque sin recargar. Si no escucha, no pasa nada: el dato ya
// está guardado y se verá la próxima vez.
function pzAvisaPantalla(claves){
  try{
    window.dispatchEvent(new CustomEvent('oi-datos', {detail:{claves:claves}}));
  }catch(e){}
}

// ── Automático ──
function pzCambio(){
  if(!ses) return;
  pzMarca(true);
  if(pzT) clearTimeout(pzT);
  pzT = setTimeout(function(){ pzSubeSiHay(); }, PZ_CALMA);
}

function pzSubeSiHay(){
  if(pzEnCurso || !ses) return Promise.resolve();
  if(!pzPend() && !pzLapidas().length) return Promise.resolve();
  pzEnCurso = true;
  return pzSube().then(function(){
    pzMarca(false);
  }).catch(function(){
    // Sin cobertura: se queda pendiente y se reintenta.
  }).then(function(){ pzEnCurso = false; });
}

function pzArranca(){
  var e = leeLS(K_ESP);
  if(!ses || !e || !e.id) return;

  var f = pzFoto();

  // Primera vez en este navegador: no hay forma de saber si aquí hay
  // trabajo posterior a la última subida, así que si había ALGO se da por
  // hecho que sí y se sube en vez de bajar. En un dispositivo virgen no
  // hay nada que proteger, así que se baja a la primera.
  var estreno = false;
  try{ estreno = !localStorage.getItem(PZ_AUTO); }catch(e2){}
  if(estreno){
    try{ localStorage.setItem(PZ_AUTO,'1'); }catch(e2){}
    // Solo las tareas y las sesiones son trabajo que se pueda perder. Los
    // valores sueltos (tipos, modelo de juego, escudo) los crea cualquier
    // pantalla con solo abrirse, así que tenerlos NO significa ir por
    // delante: si bloquearan la bajada, un móvil nuevo no se traería nunca
    // la librería a la primera, porque casi ningún navegador está limpio.
    if(f.cuenta > 0) f.pend = true;
  }

  // Subir y bajar son cosas distintas y pueden hacer falta las dos a la
  // vez: por ejemplo un móvil nuevo que ya tiene el escudo (hay que
  // subirlo) pero no tiene las tareas (hay que bajarlas). Primero se
  // sube, que es lo que nunca se puede perder, y después se baja.
  pzEstadoAlli(e).then(function(al){
    var faltanAlli = PZ_SUELTAS.filter(function(k){
      return f.tenia[k] && al.claves.indexOf(k) < 0;
    });
    var faltanAqui = PZ_SUELTAS.filter(function(k){
      return !f.tenia[k] && al.claves.indexOf(k) >= 0;
    });
    var listasAdelantadas = f.cuenta > al.cuenta;
    var subir = f.pend || f.lapidas || listasAdelantadas || faltanAlli.length;
    // Solo se baja si este dispositivo no tiene nada sin guardar.
    var bajar = !f.pend && !f.lapidas && !listasAdelantadas
                && (al.cuenta > f.cuenta || faltanAqui.length);

    var p = Promise.resolve();
    if(subir){ pzMarca(true); p = pzSubeSiHay(); }
    return p.then(function(){ if(bajar) return pzBaja(); });
  }).catch(function(){
    // Sin cobertura: si había algo pendiente se queda marcado y se
    // reintentará; no se baja nada a ciegas.
    if(f.pend || f.lapidas) pzMarca(true);
  });

  // Reintentos: al volver la conexión, al dejar la pestaña, y cada 3 min.
  window.addEventListener('online', function(){ pzSubeSiHay(); });
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden') pzSubeSiHay();
  });
  setInterval(function(){ pzSubeSiHay(); }, 180000);
}

// Se toma ya, mientras nadie ha podido escribir nada.
pzFoto();

// ── Vigilar cambios de datos en CUALQUIER pantalla ────────────────────
// Ninguna pantalla salvo Análisis habla con la nube, pero todas escriben
// en localStorage. Para las claves de Análisis se deja la marca y él se
// encarga; para las de pizarra y sesión, este fichero las sube él mismo.
(function vigila(){
  var CLAVES = {'oi_informes_v3':1,'oi_jug_informes_v1':1,'oi_jugadores_v1':1,
                'oi_rivals_v1':1,'oi_cal_v2':1};
  var guardar = Storage.prototype.setItem;
  var leer = Storage.prototype.getItem;
  Storage.prototype.setItem = function(k,v){
    var vigilada = CLAVES[k] || PZ_CLAVES[k];
    // Volver a escribir LO MISMO no es un cambio. Importa de verdad: la
    // pizarra reescribe pz_tipos y pz_mdj cada vez que se pinta, así que
    // sin esta comprobación el dispositivo se marcaba "pendiente" solo por
    // abrir la pantalla, y entonces nunca se bajaba nada de la nube.
    var igual = false;
    if(vigilada && !window.__oiBajando){
      try{ igual = (leer.call(this, k) === String(v)); }catch(e){}
    }
    var r = guardar.call(this,k,v);
    try{
      // Al traer de la nube también se escriben estas claves: eso tampoco
      // es un cambio de este dispositivo.
      if(vigilada && !igual && !window.__oiBajando && localStorage.getItem(K_SES)){
        if(CLAVES[k]) guardar.call(localStorage, 'oi_nube_pendiente', '1');
        if(PZ_CLAVES[k]){ guardar.call(localStorage, PZ_PEND, '1'); pzCambio(); }
      }
    }catch(e){}
    return r;
  };
})();

// ── Arranque ──────────────────────────────────────────────────────────
function arranca(){
  guardaInvitacionDeURL();
  cargaSesion();

  if(hashRecuperacion()){ modo = 'nueva'; pintaEntrar(); return; }

  if(!ses){ modo = 'entrar'; pintaEntrar(); return; }

  // Hay sesión guardada. Se comprueba, pero sin cobertura NO se cierra.
  ponEstilos();
  var c = velo();
  c.innerHTML = cabecera() + '<div class="oi-s-carg">Comprobando tu sesión…</div>';

  testigo().then(function(t){
    if(!t){ quitaVelo(); modo = 'entrar'; pintaEntrar(); return; }
    return aplicaInvitacion().then(function(){
      cargaSesion();
      if(esp && esp.id){ quitaVelo(); ponChip(); pzArranca(); return; }
      return rpc('mis_espacios').then(function(lista){
        lista = lista || [];
        if(lista.length === 1){
          grabaLS(K_ESP, {id:lista[0].id, nombre:lista[0].nombre, rol:lista[0].rol});
          esp = leeLS(K_ESP);
          quitaVelo(); ponChip(); pzArranca();
        } else {
          pintaEspacios(lista);
        }
      });
    });
  }).catch(function(e){
    // Sin conexión y con sesión previa: se entra igual, en local.
    if(esp && esp.id){
      quitaVelo(); ponChip();
      var chip = document.getElementById('oi-s-chip');
      if(chip){ chip.title = 'Sin conexión con la nube: trabajas en local'; chip.style.opacity = '.62'; }
      // Sin cobertura no se baja nada, pero sí se dejan puestos los
      // reintentos: lo que se trabaje ahora subirá al volver la conexión.
      pzArranca();
    } else {
      pintaEspacios([]);
      aviso('No se ha podido hablar con la nube: ' + mensajeError(e), 'mal');
    }
  });
}

window.OISesion = {
  datos: function(){ return {ses:ses, espacio:esp}; },
  traeJugadores: traeJugadores,
  testigo: testigo,
  salir: salir,
  URL: URL_, KEY: KEY,
  // Pizarra y planilla de sesión: la pantalla apunta el borrado con
  // `borrado()` y escucha el evento 'oi-datos' para refrescarse.
  borrado: pzBorrado,
  sube: pzSubeSiHay,
  baja: pzBaja,
  pendiente: pzPend
};

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca);
else arranca();
})();
