
/* La base de jugadores vive en localStorage (`oi_jugadores_v1`) y viaja a
   la nube con el botón de Análisis. Aquí había una migración del proyecto
   Supabase antiguo que ya nadie llamaba; se ha quitado para no dejar una
   puerta abierta a datos viejos. */

// El 11 Inicial — v3.9 build 1780654533
// ── ALMACENAMIENTO LOCAL ──────────────────────────────────────
// ── ESTADOS ───────────────────────────────────────────────────────
const EST = {
  "EN PLANTILLA":          {bg:"#FFFFFF",tx:"#1B2A6B",bd:"#1B2A6B"},
  "INTERESA RENOVAR":      {bg:"#D6FC79",tx:"#1B2A6B"},
  "INTERESA":              {bg:"#1B2A6B",tx:"#FFFFFF"},
  "TANTEADO":              {bg:"#09626D",tx:"#FFFFFF"},
  "INTERESA CESIÓN":       {bg:"#0532FF",tx:"#FFFFFF"},
  "CON PROPUESTA":         {bg:"#FFFF00",tx:"#1B2A6B"},
  "CON PROPUESTA RENOV.":  {bg:"#C5E1B4",tx:"#1B2A6B"},
  "FIRMADO":               {bg:"#4372C4",tx:"#FFFFFF"},
  "RENOVADO":              {bg:"#09FA05",tx:"#1B2A6B"},
  "FICHADO POR OTRO":      {bg:"#FE7E79",tx:"#1B2A6B"},
  "RENOVADO POR SU CLUB":  {bg:"#BF0001",tx:"#FFFFFF"},
  "ROTAS NEGOCIA.":        {bg:"#FF0000",tx:"#FFFFFF"},
  "A LA ESPERA":           {bg:"#E1AB11",tx:"#FFFFFF"},
  "CONSEGUIR INFO":        {bg:"#393838",tx:"#FFFFFF"},
  "POSIBLE BAJA":          {bg:"#ED7D31",tx:"#FFFFFF"},
  "NO RENOVAR":            {bg:"#C55912",tx:"#FFFFFF"},
  "NO INTERESA":           {bg:"#808080",tx:"#FFFFFF"},
  "PARA FILIAL":           {bg:"#BFBEBF",tx:"#1B2A6B"},
  "ACTUALIZADO":           {bg:"#09FA05",tx:"#1B2A6B"},
  "RETIRADO":              {bg:"#808080",tx:"#FFFFFF"},
  "FUTURIBLES":            {bg:"#00B0F0",tx:"#FFFFFF"},
};
const es = e => EST[e] || {bg:"#888",tx:"#fff"};

// ── ICONOS ────────────────────────────────────────────────────────
const ICO = [
  {id:"cap", e:"🅒",  l:"Capitán"},
  {id:"gol", e:"⚽",  l:"Goleador"},
  {id:"ray", e:"⚡",  l:"Desequilibrio"},
  {id:"pot", e:"🏃",  l:"Potente"},
  {id:"abp", e:"🎯",  l:"Lanzador ABP"},
  {id:"tiro",e:"🔫",  l:"Tiro exterior"},
  {id:"pun", e:"👊",  l:"Peleón en duelos"},
  {id:"int", e:"⚔️", l:"Presión"},
  {id:"str", e:"⭐",  l:"Destacado"},
  {id:"aer", e:"✈️", l:"Juego aéreo"},
  {id:"mov", e:"🔄",  l:"Movilidad"},
  {id:"bbx", e:"↔️", l:"Box to box"},
  {id:"pie", e:"🦶",  l:"Buen pie"},
  {id:"puz", e:"🧩",  l:"Polivalente"},
  {id:"tem", e:"🌡️", l:"Temperamental"},
];
const ie = id => ICO.find(x => x.id === id)?.e || "";

// ── POSICIONES ────────────────────────────────────────────────────
const TODAS_POS = ["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11"];
const PCC = {P1:"#C8A84B",P2:"#00B0F0",P3:"#00B0F0",P4:"#00B0F0",P5:"#00B0F0",
             P6:"#27AE60",P7:"#E74C3C",P8:"#27AE60",P9:"#E74C3C",P10:"#27AE60",P11:"#E74C3C"};
const PCT = {P1:"#1B2A6B",P2:"#1B2A6B",P3:"#1B2A6B",P4:"#1B2A6B",P5:"#1B2A6B",
             P6:"#fff",P7:"#fff",P8:"#fff",P9:"#fff",P10:"#fff",P11:"#fff"};
const pc = p => { const b=(p||"").split(/[,/]/)[0].trim(); return PCC[b]||"#555"; };
const pt = p => { const b=(p||"").split(/[,/]/)[0].trim(); return PCT[b]||"#fff"; };
// Devuelve array de posiciones de un jugador
const jugPos = j => (j.pos||"").split(/[,/]/).map(p=>p.trim()).filter(Boolean);

const SECS = ["PORTEROS","CENTRALES","LATERALES","MC / PIVOTES","INTERIORES","INT. MEDIA PUNTAS","EXTREMOS","DELANTEROS"];
// Para los jugadores que se crean desde un campograma: el puesto dice en
// qué grupo de la Base de datos tienen que salir.
const SEC_POS = {P1:"PORTEROS",P2:"LATERALES",P3:"LATERALES",P4:"CENTRALES",P5:"CENTRALES",
                 P6:"MC / PIVOTES",P8:"INTERIORES",P10:"INT. MEDIA PUNTAS",
                 P7:"EXTREMOS",P11:"EXTREMOS",P9:"DELANTEROS"};
const secDePos = p => SEC_POS[(p||"").split(/[,\/]/)[0].trim()] || "MC / PIVOTES";

// ── SISTEMAS DE JUEGO ─────────────────────────────────────────────
const SISTEMAS = {
  "1-4-3-3": [
    [{k:"P11",lb:"11 · Ext. izq",  bg:"#E74C3C",tx:"#fff"},
     {k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P10",lb:"10 · Int. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC Pivote",  bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · Int. dcho",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Lat. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Lat. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-3-5-2": [
    [{k:"P9", lb:"9 · Del. izq",   bg:"#E74C3C",tx:"#fff"},
     {k:"P7", lb:"7 · Del. dcho",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Carril izq",bg:"#27AE60",tx:"#fff"},
     {k:"P10",lb:"10 · Int. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC Pivote",  bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · Int. dcho",  bg:"#27AE60",tx:"#fff"},
     {k:"P2", lb:"2 · Carril dcho",bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. cen.",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-4-4-2": [
    [{k:"P9", lb:"9 · Del. izq",   bg:"#E74C3C",tx:"#fff"},
     {k:"P10",lb:"10 · Del. dcho", bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Ext. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC izq",     bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · MC dcho",    bg:"#27AE60",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Lat. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Lat. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-3-4-3": [
    [{k:"P10",lb:"10 · Ext. izq",  bg:"#E74C3C",tx:"#fff"},
     {k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Carril izq",bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC izq",     bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · MC dcho",    bg:"#27AE60",tx:"#fff"},
     {k:"P2", lb:"2 · Carril dcho",bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. cen.",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  // ── Los ocho de abajo son nuevos. Mismos dorsales de siempre:
  //    lateral dcho 2, central dcho 4, central izq 5, lateral izq 3;
  //    con línea de 3, carriles 2 y 11; extremos 7 y 11; dos MC 6 y 8;
  //    tres MC 6 de pivote con 8 y 10 por delante; y cuando hay dos
  //    puntas con tres MC, los puntas son el 7 y el 9 porque el 10 es
  //    uno de los medios.
  "1-4-2-3-1": [
    [{k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Ext. izq",  bg:"#E74C3C",tx:"#fff"},
     {k:"P10",lb:"10 · Media pta", bg:"#E74C3C",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P6", lb:"6 · Pivote izq", bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · Pivote dcho",bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Lat. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Lat. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-4-1-4-1": [
    [{k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Ext. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P10",lb:"10 · MC izq",    bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · MC dcho",    bg:"#27AE60",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P6", lb:"6 · MC Pivote",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Lat. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Lat. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-4-4-1-1": [
    [{k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P10",lb:"10 · Segunda pta",bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Ext. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC izq",     bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · MC dcho",    bg:"#27AE60",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Lat. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Lat. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-4-3-1-2": [
    [{k:"P9", lb:"9 · Del. izq",   bg:"#E74C3C",tx:"#fff"},
     {k:"P7", lb:"7 · Del. dcho",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P10",lb:"10 · Media pta", bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · MC izq",    bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC Pivote",  bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · MC dcho",    bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Lat. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Lat. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-5-3-2": [
    [{k:"P9", lb:"9 · Del. izq",   bg:"#E74C3C",tx:"#fff"},
     {k:"P7", lb:"7 · Del. dcho",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P10",lb:"10 · Int. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC Pivote",  bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · Int. dcho",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P11",lb:"11 · Carril izq",bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P3", lb:"3 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. cen.",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Carril dcho",bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-5-4-1": [
    [{k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P10",lb:"10 · MC izq",    bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC Pivote",  bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · MC dcho",    bg:"#27AE60",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P11",lb:"11 · Carril izq",bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P3", lb:"3 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. cen.",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Carril dcho",bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-4-5-1": [
    [{k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Ext. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P10",lb:"10 · Int. izq",  bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC Pivote",  bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · Int. dcho",  bg:"#27AE60",tx:"#fff"},
     {k:"P7", lb:"7 · Ext. dcho",  bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Lat. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P2", lb:"2 · Lat. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
  "1-3-4-2-1": [
    [{k:"P9", lb:"9 · Delantero",  bg:"#E74C3C",tx:"#fff"}],
    [{k:"P10",lb:"10 · Media pta izq",bg:"#E74C3C",tx:"#fff"},
     {k:"P7", lb:"7 · Media pta dcha",bg:"#E74C3C",tx:"#fff"}],
    [{k:"P11",lb:"11 · Carril izq",bg:"#27AE60",tx:"#fff"},
     {k:"P6", lb:"6 · MC izq",     bg:"#27AE60",tx:"#fff"},
     {k:"P8", lb:"8 · MC dcho",    bg:"#27AE60",tx:"#fff"},
     {k:"P2", lb:"2 · Carril dcho",bg:"#27AE60",tx:"#fff"}],
    [{k:"P3", lb:"3 · Cen. izq",   bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P5", lb:"5 · Cen. cen.",  bg:"#00B0F0",tx:"#1B2A6B"},
     {k:"P4", lb:"4 · Cen. dcho",  bg:"#00B0F0",tx:"#1B2A6B"}],
    [{k:"P1", lb:"1 · Portero",    bg:"#C8A84B",tx:"#1B2A6B"}],
  ],
};

// ── ESTADO GLOBAL ─────────────────────────────────────────────────
let jug=[], plant=[], view="campo", sistema="1-4-3-3";

// ══ CAMPOGRAMAS ══════════════════════════════════════════════════
//   Antes había un solo campograma y el puesto de cada jugador vivía
//   dentro del propio jugador (_enPlantilla + pos_campo): o estabas en
//   el campo o no, y en un único sitio. Ahora cada campograma es un
//   equipo con su sistema y sus asignaciones, y un mismo jugador puede
//   estar en varios a la vez sin pisarse.
//   Forma: {id, nombre, cat, sistema, asign:{ idJugador: "P7" }}
const K_CG = 'oi_campogramas_v1';
let CGS=[], cgAct=null;

// ── BANCO DE IMÁGENES ────────────────────────────────────────────
//   Los escudos no viven dentro de cada sitio: se guardan una sola vez
//   en `oi_img_<huella>` y lo demás apunta con `img:<huella>`. Es el
//   mismo sistema que usa la pantalla de Análisis, con la misma huella,
//   así que un escudo que ya esté guardado no se duplica.
const IMG_PREFIJO='oi_img_', IMG_REF='img:';
const IMG_VACIA='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
function imgHuella(str){
  let h1=0x811c9dc5, h2=0;
  for(let i=0;i<str.length;i++){
    const c=str.charCodeAt(i);
    h1=((h1^c)*0x01000193)>>>0;
    h2=(c + (h2<<6) + (h2<<16) - h2)>>>0;
  }
  return str.length.toString(36)+'-'+h1.toString(36)+'-'+h2.toString(36);
}
function esRefImg(v){ return typeof v==='string' && v.slice(0,4)===IMG_REF; }
function imgLee(ref){
  if(!esRefImg(ref)) return null;
  try{ return localStorage.getItem(IMG_PREFIJO+ref.slice(4)); }catch(e){ return null; }
}
function imgGuarda(dataUrl){
  const h=imgHuella(dataUrl), k=IMG_PREFIJO+h;
  try{ if(localStorage.getItem(k)===null) localStorage.setItem(k,dataUrl); }
  catch(e){ return dataUrl; }      // si no cabe, mejor el dato suelto que perderlo
  return IMG_REF+h;
}
function imgSrc(v){ if(!v) return ''; if(!esRefImg(v)) return v; return imgLee(v)||IMG_VACIA; }
function imgHay(v){ return !!v && (!esRefImg(v) || !!imgLee(v)); }

// Un escudo pequeño listo para pintar, o nada.
function escudoHTML(v, px, extra){
  if(!imgHay(v)) return '';
  return '<img src="'+imgSrc(v)+'" alt="" style="width:'+px+'px;height:'+px+'px;object-fit:contain;'+
         'flex:0 0 '+px+'px;border-radius:2px;'+(extra||'')+'">';
}

// ── CLUBES YA REGISTRADOS ────────────────────────────────────────
//   Se juntan de todos los sitios donde ya hay equipos: los rivales
//   guardados, los partidos del calendario, los informes, los propios
//   campogramas y los equipos de las fichas de jugador. Si el mismo
//   club aparece en varios, se queda con el que trae escudo.
function leeJSON(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } }
function clubesConocidos(){
  const m=new Map();
  const add=(nom,esc)=>{
    const n=String(nom||'').replace(/\s+/g,' ').trim();
    if(!n) return;
    const k=n.toLowerCase();
    const prev=m.get(k);
    if(!prev) m.set(k,{nombre:n, escudo:imgHay(esc)?esc:''});
    else if(!prev.escudo && imgHay(esc)) prev.escudo=esc;
  };
  (leeJSON('oi_rivals_v1')||[]).forEach(r=>add(r&&r.name, r&&r.crest));
  const cal=leeJSON('oi_cal_v2')||{};
  Object.keys(cal).forEach(d=>(cal[d]||[]).forEach(ev=>{
    if(!ev) return; add(ev.localName,ev.localCrest); add(ev.rival,ev.rivalCrest);
  }));
  (leeJSON('oi_informes_v3')||[]).forEach(r=>add(r&&r.rival, r&&r.crestRival));
  CGS.forEach(c=>add(c.nombre,c.escudo));
  jug.forEach(j=>add(j&&j.eq,''));
  return [...m.values()].sort((a,b)=>{
    const ea=a.escudo?0:1, eb=b.escudo?0:1;
    if(ea!==eb) return ea-eb;                       // los que traen escudo, primero
    return a.nombre.localeCompare(b.nombre,'es');
  });
}

function cgId(){ return 'cg'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function cgNuevo(nombre){
  return {id:cgId(), nombre:nombre||'Equipo nuevo', cat:'', escudo:'', sistema:'1-4-3-3', asign:{}};
}
function cgGuardar(){
  try{
    localStorage.setItem(K_CG, JSON.stringify({activo:cgAct, lista:CGS}));
    return true;
  }catch(e){
    // Callarse aquí sería lo peor: parecería guardado y no lo estaría.
    shT('No se ha podido guardar: no queda sitio en este navegador','err');
    return false;
  }
}
function cgCargar(){
  try{
    const d=JSON.parse(localStorage.getItem(K_CG)||'null');
    if(d && Array.isArray(d.lista) && d.lista.length){
      CGS=d.lista;
      cgAct = (d.activo && CGS.some(c=>c.id===d.activo)) ? d.activo : CGS[0].id;
      return;
    }
  }catch(e){}
  // Primera vez: lo que ya estuviera en el campo pasa a ser el primer
  // campograma, para no perder nada de lo que ya tenía montado.
  const c=cgNuevo('Mi plantilla');
  c.sistema = SISTEMAS[sistema] ? sistema : '1-4-3-3';
  jug.forEach(function(j){ if(j && j._enPlantilla) c.asign[j.id]=j.pos_campo||jugPos(j)[0]||'P1'; });
  CGS=[c]; cgAct=c.id; cgGuardar();
}
function cg(){ return CGS.find(c=>c.id===cgAct) || CGS[0] || null; }
// Los jugadores del campograma activo, con su puesto.
function cgPlant(){
  const c=cg(); if(!c) return [];
  return Object.keys(c.asign).map(function(id){
    const j=jug.find(x=>String(x.id)===String(id));
    return j ? Object.assign({},j,{_posAsignada:c.asign[id]}) : null;
  }).filter(Boolean);
}
function cgSync(){ plant = cgPlant(); if(cg()) sistema = cg().sistema; }

let selPos=null, editJid=null, editCid=null, movJid=null;
let posExpanded={}; // {P1: true, P3: true, ...} — posiciones con lista desplegada
let flt={txt:"",sec:"",est:""};
let fd={s:"PORTEROS",pos:"P1",n:"",eq:"",cat:"",est:"INTERESA",ico:[],repre:"",contacto:"",tel:"",tm:"",bs:"",obs:"",perfil:""};
let toast=null, tTmr=null, searchTmr=null;
let syncStatus="ok";
let claudeMsgs=[], claudeLoading=false;

// ── SUPABASE: CARGAR ──────────────────────────────────────────────
async function loadData() {
  shT("Cargando datos...","info");
  try {
    const stored = localStorage.getItem('oi_jugadores_v1');
    jug = stored ? JSON.parse(stored) : [];
    jug.sort(function(a,b){ return a.id - b.id; });
    // Cada jugador guarda si está en plantilla (_enPlantilla) y en qué puesto
    // (pos_campo), pero antes nadie lo volvía a leer: al recargar la pantalla
    // la plantilla salía vacía aunque el dato estuviera guardado.
    cgCargar(); cgSync();
    syncStatus="ok"; render(); shT(jug.length + " jugadores ✓");
  } catch(e) {
    syncStatus="error"; shT("Error: "+e.message,"err"); render();
  }
}

// ── SUPABASE: ACTUALIZAR ──────────────────────────────────────────
async function updJug(id, ch) {
  jug = jug.map(j=>j.id===id?{...j,...ch}:j);
  plant = plant.map(j=>j.id===id?{...j,...ch}:j);
  render();
  try {
    const i2 = jug.findIndex(function(x){ return x.id===id; });
    if(i2>=0){ jug[i2]=Object.assign({},jug[i2],ch,{updated_at:new Date().toISOString()}); }
    localStorage.setItem('oi_jugadores_v1', JSON.stringify(jug));
    render();
  } catch(e) { shT("Error al guardar: "+e.message,"err"); }
}

async function delJug(id) {
  if(!confirm("¿Eliminar jugador?")) return;
  jug=jug.filter(j=>j.id!==id); plant=plant.filter(j=>j.id!==id); render();
  jug = jug.filter(function(x){ return x.id!==id; });
  localStorage.setItem('oi_jugadores_v1', JSON.stringify(jug));
}
async function addPlant(id, posAsignada) {
  const j=jug.find(x=>x.id===id); const c=cg();
  if(!j||!c) return;
  const yaEstaba = c.asign[id]!=null;
  const pa = posAsignada || jugPos(j)[0] || 'P1';
  c.asign[id]=pa; cgGuardar(); cgSync(); render();
  if(!yaEstaba) shT(`${j.n} → ${pa}`);
}
async function remPlant(id) {
  const c=cg(); if(!c) return;
  delete c.asign[id]; cgGuardar(); cgSync(); render();
}
async function addJug() {
  const n=(document.getElementById("rn")?.value||"").trim();
  const eq=(document.getElementById("re")?.value||"").trim();
  if(!n){shT("El nombre es obligatorio","err");return;}
  if(!eq){shT("El equipo es obligatorio","err");return;}
  // Usar id basado en max id existente + 1 para evitar conflictos con bigint de Supabase
  const maxId = jug.length > 0 ? Math.max(...jug.map(j=>Number(j.id)||0)) : 300;
  const nuevo = {
    ...fd,
    id: maxId + 1,
    n: n.toUpperCase(),
    eq,
    // Asegurar que posArr no se incluye (campo interno)
    posArr: undefined,
  };
  delete nuevo.posArr;
  try {
    jug=[...jug,nuevo];
    localStorage.setItem('oi_jugadores_v1', JSON.stringify(jug));
    // Reset COMPLETO — posArr a null para que no arrastre posiciones del jugador anterior
    fd={s:"PORTEROS",pos:"P1",n:"",eq:"",cat:"",est:"INTERESA",ico:[],repre:"",contacto:"",tel:"",tm:"",bs:"",obs:"",perfil:"",posArr:null};
    render();
    shT(`✅ ${nuevo.n} añadido correctamente`);
  } catch(e) {
    shT("❌ Error al guardar: "+e.message,"err");
    console.error("addJug error:", e);
  }
}

// ── CLAUDE AI ─────────────────────────────────────────────────────
async function sendClaude() {
  const input=document.getElementById("claude-input");
  const msg=input?.value?.trim();
  if(!msg||claudeLoading) return;
  input.value=""; claudeMsgs.push({role:"user",content:msg}); claudeLoading=true; render();
  const jugRes=jug.slice(0,60).map(j=>`ID:${j.id} ${j.n}(${j.pos}) ${j.eq} [${j.est}]`).join("\n");
  try {
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
        system:`Asistente de scouting de Iván Gómez Roa. ${jug.length} jugadores futuribles.\nMuestra:\n${jugRes}\n\nPara actualizar responde SOLO JSON:\n{"accion":"update","jugador_id":ID,"cambios":{"eq":"...","est":"...","pos":"..."}}`,
        messages:claudeMsgs.map(m=>({role:m.role,content:m.content}))})
    });
    const data=await res.json();
    const txt=data.content?.map(c=>c.text||"").join("")||"Sin respuesta";
    claudeMsgs.push({role:"assistant",content:txt});
    const m=txt.match(/\{[\s\S]*"accion"\s*:\s*"update"[\s\S]*\}/);
    if(m){try{const cmd=JSON.parse(m[0]);if(cmd.accion==="update"&&cmd.jugador_id){await updJug(cmd.jugador_id,cmd.cambios);const j=jug.find(x=>x.id===cmd.jugador_id);shT(`✓ ${j?.n} actualizado`);}}catch{}}
  } catch(e){claudeMsgs.push({role:"assistant",content:"Error: "+e.message});}
  claudeLoading=false; render();
}

// ── HELPERS ───────────────────────────────────────────────────────
function shT(msg,type="ok"){toast={msg,type};if(tTmr)clearTimeout(tTmr);tTmr=setTimeout(()=>{toast=null;rtT();},3000);rtT();}
function rtT(){const el=document.getElementById("ta");if(el)el.innerHTML=toast?`<div class="toast ${toast.type}">${toast.msg}</div>`:"";}
function eb(e){const{bg,tx,bd}=es(e||"");const b=bd?`border:1px solid ${bd};`:"";return`<span class="eb" style="background:${bg};color:${tx};${b}">${e||""}</span>`;}
function pbg(pos){const p0=(pos||"").split(",")[0].trim();return`<span class="pb" style="background:${pc(pos)};color:${pt(pos)}">${p0}</span>`;}
function isp(ico){return ico?.length?`<span class="ir">${ico.map(ie).join("")}</span>`:"";}

// ── RENDER PRINCIPAL ──────────────────────────────────────────────
function render(){
  const app=document.getElementById("app"); if(!app) return;
  const logoSrc = window.LOGO_SRC || '/logo.png';
  const NAV=[
    {id:"campo",  ic:"ti-layout-dashboard", lb:"Campogramas"},
    {id:"bd",     ic:"ti-database",         lb:"Base de datos"},
    {id:"reg",    ic:"ti-plus",             lb:"Registro"},
    {id:"plant",  ic:"ti-layout-list",      lb:"Plantilla"},
    {id:"claude", ic:"ti-robot",            lb:"Claude AI"},
  ];
  app.innerHTML=`
    <div id="ta"></div>
    <nav class="nav">
      <div class="nav-bg"></div>
      <div class="nav-overlay"></div>
      <div class="nav-inner">
        <div class="nav-brand">
          <img src="${logoSrc}" class="nav-logo" alt="El 11 Inicial">
          <div class="nav-name">
            <span class="nav-name-top">Base de datos</span>
            <span class="nav-name-main">El 11 Inicial</span>
          </div>
        </div>
        <div class="nav-sep"></div>
        <div class="nav-btns">
          ${NAV.map(b=>`<button class="nb ${view===b.id?'act':''}" onclick="sv_('${b.id}')">
            <i class="ti ${b.ic}"></i><span class="nb-label">${b.lb}</span>
          </button>`).join("")}
        </div>
        <div class="nav-stats">
          <div><div class="sv" style="color:#C8A84B">${jug.length}</div><div class="sl">Jug.</div></div>
          <div><div class="sv" style="color:#00B0F0">${plant.length}</div><div class="sl">Plant.</div></div>
          <span class="sync-badge ${syncStatus==='ok'?'':'error'}">${syncStatus==='ok'?'☁️':'⚠️'}</span>
        </div>
      </div>
    </nav>
    <div class="pane">
      ${view==="campo"?rCampo():view==="bd"?rBD():view==="reg"?rReg():view==="plant"?rPlant():rClaude()}
    </div>
    <nav class="bottom-nav">
      ${NAV.map(b=>`<button class="bnb ${view===b.id?'act':''}" onclick="sv_('${b.id}')">
        <i class="ti ${b.ic}"></i>${b.lb}
      </button>`).join("")}
    </nav>`;
  rtT();
}

// ── CAMPOGRAMA ────────────────────────────────────────────────────
function rCampo(){
  const campo=SISTEMAS[sistema];
  const rows=campo.map(row=>`<div class="crow">${row.map(pos=>{
    // candidatos: todos los jugadores que pueden jugar en esta posición (en o fuera de plantilla)
    // Los candidatos se parten en dos: los que ya son de este equipo y
    // los del resto de la base, que son las posibles incorporaciones.
    const eqCG=(cg()&&cg().nombre||'').trim().toLowerCase();
    const esDeEsteEquipo=j=>eqCG && (j.eq||'').trim().toLowerCase()===eqCG;
    const todos=jug.filter(j=>jugPos(j).includes(pos.k));
    const candidatos=todos.slice().sort((a,b)=>(esDeEsteEquipo(b)?1:0)-(esDeEsteEquipo(a)?1:0));
    // visibles: los primeros 8 (o todos si está expandida la posición)
    const isExpanded=!!posExpanded[pos.k];
    const visibles=isExpanded?candidatos:candidatos.slice(0,8);
    // enc: jugadores cuya posición asignada (o primera posición natural) es esta
    const enc=plant.filter(j=>(j._posAsignada||jugPos(j)[0])===pos.k);
    // dis: candidatos no asignados a ninguna posición del campo todavía
    const dis=candidatos.filter(j=>!plant.find(p=>p.id===j.id));
    const isSel=selPos===pos.k;
    // Jugadores asignados — scrollable, compactos
    const jH=enc.map(j=>{
      const{bg,tx,bd}=es(j.est); const b=bd?`border:1px solid ${bd};`:"";
      const isMov=movJid===j.id; // panel de mover activo
      // Posiciones del sistema actual para mover
      const possSistema=[...new Set(SISTEMAS[sistema].flat().map(p=>p.k))];
      const movPanel=isMov?`<div style="background:rgba(0,0,0,.6);border-radius:4px;padding:5px 6px;margin-top:3px">
        <div style="font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;margin-bottom:4px">Mover a posición:</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">
          ${possSistema.map(pk=>{
            const pdef=SISTEMAS[sistema].flat().find(x=>x.k===pk);
            const esActual=(j._posAsignada||jugPos(j)[0])===pk;
            return`<button onclick="moverPos(${j.id},'${pk}')" style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700;cursor:pointer;border:1.5px solid ${esActual?'#fff':pdef?.bg||'#555'};background:${esActual?pdef?.bg||'#555':'transparent'};color:${esActual?pdef?.tx||'#fff':pdef?.bg||'#888'};opacity:${esActual?1:.8}">${pk}</button>`;
          }).join("")}
        </div>
        <button onclick="moverPos(null,null)" style="margin-top:5px;width:100%;padding:2px 0;font-size:8px;cursor:pointer;border:.5px solid rgba(255,255,255,.2);border-radius:3px;background:transparent;color:rgba(255,255,255,.3)">Cancelar</button>
      </div>`:"";
      return`<div class="jr">
        <div class="jr-info" onclick="tMov(${j.id})" style="cursor:pointer;flex:1">
          <div class="jn">${j.n} ${isMov?'':'<span style="font-size:8px;opacity:.35">⇄</span>'}</div>
          ${esDeEsteEquipo(j)?'':`<div class="je">${j.eq}</div>`}
        </div>
        <div class="jr-right">
          <span class="eb" style="background:${bg};color:${tx};${b}">${j.est||""}</span>
          ${isp(j.ico)}
          <button class="bi" onclick="remP(${j.id})" style="font-size:10px;color:rgba(255,255,255,.3);padding:0 2px">✕</button>
        </div>
        ${movPanel}
      </div>`;
    }).join("");
    // Panel de candidatos: lista de todos los jugadores que pueden ir a esta posición
    const candidatosHTML=visibles.map(j=>{
      const enCampo=plant.find(p=>p.id===j.id);
      const esEsta=(enCampo?._posAsignada||jugPos(enCampo||{})[0])===pos.k;
      const{bg,tx,bd}=es(j.est); const b=bd?`border:1px solid ${bd};`:"";
      if(esEsta) return""; // ya visible en la tarjeta arriba
      return`<div class="ai" onclick="${enCampo?`moverPos(${j.id},'${pos.k}')`:`addP(${j.id},'${pos.k}')`}" 
        style="opacity:${enCampo?0.6:1}" title="${enCampo?'Mover a esta posición':'Añadir al campo'}">
        <span style="font-size:9px;color:rgba(255,255,255,.85);flex:1">${j.n}</span>
        ${enCampo?`<span style="font-size:8px;color:rgba(255,255,255,.35);margin-right:3px">${enCampo._posAsignada||jugPos(enCampo)[0]}</span>`:""}
        <span class="eb" style="background:${bg};color:${tx};${b}">${j.est||""}</span>
        <span style="font-size:10px;margin-left:3px;opacity:.5">${enCampo?'⇄':'+'}</span>
      </div>`;
    }).join("");
    const masBtn=!isExpanded&&candidatos.length>8?
      `<div onclick="tExp('${pos.k}')" style="font-size:8px;color:rgba(255,255,255,.35);text-align:center;padding:4px;cursor:pointer;border-top:.5px solid rgba(255,255,255,.06)">
        Ver todos (${candidatos.length}) ▼
      </div>`
      :isExpanded&&candidatos.length>8?
      `<div onclick="tExp('${pos.k}')" style="font-size:8px;color:rgba(255,255,255,.35);text-align:center;padding:4px;cursor:pointer;border-top:.5px solid rgba(255,255,255,.06)">
        Mostrar menos ▲
      </div>`:""
    ;
    const nDeEquipo=candidatos.filter(esDeEsteEquipo).length;
    const nuevoBtn=`<div class="ai" onclick="cgNuevoJug('${pos.k}')" style="border-top:.5px solid rgba(255,255,255,.08);color:var(--gold)">
        <span style="font-size:9px;flex:1;color:var(--gold)">+ Jugador nuevo de ${(cg()&&cg().nombre)||'este equipo'}</span>
        <span style="font-size:10px;opacity:.7">✎</span>
      </div>`;
    const addPanel=`<div class="ap">
      <div class="at">${candidatos.length} candidatos${nDeEquipo?` · ${nDeEquipo} de la plantilla`:""}${enc.length?` · ${enc.length} en campo`:""}:</div>
      ${candidatosHTML}${masBtn}${nuevoBtn}
    </div>`;
    const nA=!enc.length?`<div class="na" onclick="tPos('${pos.k}')">+ añadir candidatos</div>`:""; 
    return`<div class="pc ${isSel?'sel':''}">
      <div class="ph" style="background:${pos.bg};color:${pos.tx}" onclick="tPos('${pos.k}')">
        <span>${pos.lb}</span><span style="font-size:10px">${isSel?'▲':'▼'}</span>
      </div>
      <div class="pos-jugadores">${jH}${nA}</div>
      ${isSel?addPanel:""}
    </div>`;
  }).join("")}</div>`).join("");

  const lE=Object.entries(EST).map(([e,{bg,tx,bd}])=>{const b=bd?`border:1px solid ${bd};`:"";return`<span class="eb" style="background:${bg};color:${tx};${b}">${e}</span>`;}).join("");
  const lI=ICO.map(ic=>`<span title="${ic.l}" style="font-size:12px;white-space:nowrap;margin-right:6px">${ic.e}<span style="font-size:9px;color:var(--muted);margin-left:2px">${ic.l}</span></span>`).join("");
  const c=cg();
  const tabs=CGS.map(x=>{
    const act=x.id===cgAct, n=Object.keys(x.asign).length;
    return`<button onclick="cgSel('${x.id}')" style="flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:7px 7px 0 0;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;
      border:1px solid ${act?'var(--border2)':'transparent'};border-bottom:none;
      background:${act?'var(--card)':'rgba(255,255,255,.04)'};color:${act?'var(--gold)':'var(--muted)'}">
      ${escudoHTML(x.escudo,16)}
      ${x.nombre||'Sin nombre'}
      <span style="font-size:9px;font-weight:600;padding:1px 5px;border-radius:8px;background:${act?'var(--gold)':'rgba(255,255,255,.12)'};color:${act?'#1B2A6B':'var(--muted)'}">${n}</span>
    </button>`;
  }).join("");
  return`
    <div style="display:flex;align-items:flex-end;gap:3px;overflow-x:auto;border-bottom:1px solid var(--border2);margin-bottom:10px;padding-bottom:0;min-width:0">
      ${tabs}
      <button onclick="cgAdd()" title="Nuevo campograma" style="flex:0 0 auto;padding:6px 11px;margin-left:4px;border:1px dashed var(--border2);border-bottom:none;border-radius:7px 7px 0 0;background:transparent;color:var(--muted);cursor:pointer;font-size:13px;font-weight:700">＋</button>
    </div>
    <div class="sis-sel" style="flex-wrap:wrap">
      ${escudoHTML(c&&c.escudo,26,'cursor:pointer;')}
      <span onclick="cgHoja(cgAct)" title="Equipo, escudo, categoría y sistema" style="font-size:14px;font-weight:700;color:var(--text);cursor:pointer">${(c&&c.nombre)||'Sin nombre'} <span style="font-size:10px;opacity:.4">✎</span></span>
      <span onclick="cgHoja(cgAct)" title="Equipo, escudo, categoría y sistema" style="font-size:10px;color:var(--muted);cursor:pointer;border:1px solid var(--border);border-radius:9px;padding:2px 8px">${(c&&c.cat)||'+ categoría'}</span>${(c&&!imgHay(c.escudo))?`<span onclick="cgHoja(cgAct)" title="Poner el escudo del club" style="font-size:10px;color:var(--muted);cursor:pointer;border:1px dashed var(--border2);border-radius:9px;padding:2px 8px">+ escudo</span>`:''}
      <span style="width:1px;height:16px;background:var(--border)"></span>
      <label>⚽ Sistema:</label>
      <select onchange="setSistema(this.value)">
        ${Object.keys(SISTEMAS).map(s=>`<option ${sistema===s?'selected':''} value="${s}">${s}</option>`).join("")}
      </select>
      <span style="font-size:11px;color:var(--muted)">← Izquierda &nbsp; Derecha →</span>
      <span style="margin-left:auto;display:flex;gap:5px">
        <button onclick="cgDup()" title="Duplicar este campograma" style="padding:3px 9px;font-size:10px;cursor:pointer;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--muted)">⧉ Duplicar</button>
        <button onclick="cgDel()" title="Eliminar este campograma" style="padding:3px 9px;font-size:10px;cursor:pointer;border:1px solid var(--border);border-radius:5px;background:transparent;color:#E74C3C">🗑</button>
      </span>
    </div>
    <div class="campo">
      ${rows}
    </div>
    <div class="ley-section"><div class="ley-title">Estados</div><div class="lf">${lE}</div></div>
    <div class="ley-section"><div class="ley-title">Características</div><div class="lf" style="gap:6px">${lI}</div></div>`;
}

// ── INLINE EDIT (campograma y plantilla) ──────────────────────────
function rEI(j){
  const eB=Object.keys(EST).map(e=>{const{bg,tx}=es(e);const sel=j.est===e;return`<button class="ebt ${sel?'sel':''}" style="background:${bg};color:${tx}" onclick="sEC(${j.id},'${e}')">${e}</button>`;}).join("");
  const iB=ICO.map(ic=>{const sel=(j.ico||[]).includes(ic.id);return`<button class="ibt ${sel?'sel':''}" onclick="tIC(${j.id},'${ic.id}')" title="${ic.l}">${ic.e}</button>`;}).join("");
  // Selector de posiciones múltiples
  const posB=TODAS_POS.map(p=>{
    const sel=jugPos(j).includes(p);
    return`<button onclick="tPosJug(${j.id},'${p}')" style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700;cursor:pointer;border:1.5px solid ${sel?'#fff':'rgba(255,255,255,.2)'};background:${sel?PCC[p]:'transparent'};color:${sel?PCT[p]:'rgba(255,255,255,.5)'}">${p}</button>`;
  }).join("");
  return`<div class="ei">
    <div class="eil">POSICIONES:</div><div class="eg" style="margin-bottom:8px">${posB}</div>
    <div class="eil">ESTADO:</div><div class="eg">${eB}</div>
    <div class="eil">CARACTERÍSTICAS:</div><div class="ig">${iB}</div>
    <button onclick="tEC(null)" style="font-size:9px;padding:3px 10px;border-radius:3px;cursor:pointer;border:none;background:#09FA05;color:#1B2A6B;font-weight:700;margin-top:4px">Cerrar</button>
  </div>`;
}

// ── BASE DE DATOS ─────────────────────────────────────────────────
function rBD(){
  const secs=[...new Set(jug.map(j=>j.s))];
  const f=jug.filter(j=>{
    const t=flt.txt.toLowerCase();
    return(!t||(j.n||"").toLowerCase().includes(t)||(j.eq||"").toLowerCase().includes(t)||(j.perfil||"").toLowerCase().includes(t))
      &&(!flt.sec||j.s===flt.sec)&&(!flt.est||j.est===flt.est);
  });
  const cards=f.map((j,i)=>{
    const{bg,tx,bd}=es(j.est);const b=bd?`border:1px solid ${bd};`:"";
    const isE=editJid===j.id;
    const telL=j.tel?`<a href="tel:${j.tel}" class="tel-link">📞 ${j.tel}</a>`:"";
    const tmL=j.tm?`<a href="${j.tm}" target="_blank" class="ext-link">TM↗</a>`:"";
    const bsL=j.bs?`<a href="${j.bs}" target="_blank" class="ext-link">BS↗</a>`:"";
    // Todas las posiciones del jugador como badges
    const posHtml=jugPos(j).map(p=>`<span class="pb" style="background:${PCC[p]||'#555'};color:${PCT[p]||'#fff'}">${p}</span>`).join(" ");
    const eH=isE?`<div class="eform">
      <div class="efg">
        <div><div class="efl">Nombre</div><input class="efi" id="en-${j.id}" value="${(j.n||"").replace(/"/g,'&quot;')}"></div>
        <div><div class="efl">Equipo</div><input class="efi" id="ee-${j.id}" value="${(j.eq||"").replace(/"/g,'&quot;')}"></div>
        <div><div class="efl">Categoría</div><input class="efi" id="ec-${j.id}" value="${(j.cat||"").replace(/"/g,'&quot;')}"></div>
        <div style="grid-column:span 3">
          <div class="efl">Perfil de juego</div>
          <input class="efi" id="ep-${j.id}" value="${(j.perfil||"").replace(/"/g,'&quot;')}"
            placeholder="Escribe o elige perfil..." list="perfiles-edit-${j.id}" style="width:100%">
          <datalist id="perfiles-edit-${j.id}">
                      <option value="PORTERO COMPLETO">
          <option value="PORTERO GATO Y PIES">
          <option value="PORTERO AÉREO">
          <option value="PORTERO GATO Y AÉREO">
          <option value="CENTRAL COMPLETO">
          <option value="CENTRAL CONTUNDENTE">
          <option value="CENTRAL CREATIVO">
          <option value="LATERAL TIPO CENTRAL">
          <option value="LATERAL">
          <option value="CARRILERO">
          <option value="EXTREMO/CARRILERO">
          <option value="MC DEFENSIVO">
          <option value="MC POSICIONAL">
          <option value="MC POSICIONAL Y CREACIÓN">
          <option value="MC PULPO">
          <option value="MC CREACIÓN">
          <option value="MC CREACIÓN Y BOX TO BOX">
          <option value="MC BOX TO BOX">
          <option value="MC DEFENSIVO Y PULPO">
          <option value="MEDIA PUNTA ELÉCTRICO">
          <option value="MEDIA PUNTA ASOCIATIVO">
          <option value="EXTREMO CREATIVO">
          <option value="SEGUNDO DELANTERO">
          <option value="EXTREMO PURO">
          <option value="EXTREMO ELÉCTRICO">
          <option value="DELANTERO COMPLETO">
          <option value="DELANTERO REFERENCIA">
          <option value="DELANTERO EXTREMO">
            ${[...new Set(jug.map(j=>j.perfil).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).map(p=>`<option value="${p}">`).join("")}
          </datalist>
        </div>
      </div>
      <div style="margin-bottom:8px">
        <div class="efl" style="margin-bottom:4px">Posiciones (selecciona todas las que puede ocupar)</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${TODAS_POS.map(p=>{const sel=jugPos(j).includes(p);return`<button onclick="tPosJugBD(${j.id},'${p}')" style="padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;border:1.5px solid ${sel?'#fff':PCC[p]||'#555'};background:${sel?PCC[p]||'#555':'transparent'};color:${sel?PCT[p]||'#fff':PCC[p]||'#555'}">${p}</button>`;}).join("")}
        </div>
      </div>
      <div style="margin-bottom:8px"><div class="efl" style="margin-bottom:4px">Estado</div>
        <div class="eg">${Object.keys(EST).map(e=>{const{bg:eb,tx:et}=es(e);const sel=j.est===e;return`<button class="ebt ${sel?'sel':''}" style="background:${eb};color:${et}" onclick="sEB(${j.id},'${e}')">${e}</button>`;}).join("")}</div>
      </div>
      <div style="margin-bottom:8px"><div class="efl" style="margin-bottom:4px">Características</div>
        <div class="ig">${ICO.map(ic=>{const sel=(j.ico||[]).includes(ic.id);return`<button class="ibt ${sel?'sel':''}" onclick="tIB(${j.id},'${ic.id}')" title="${ic.l}">${ic.e} <span style="font-size:9px">${ic.l}</span></button>`;}).join("")}</div>
      </div>
      <div style="margin-bottom:8px">
        <div class="efl" style="margin-bottom:4px">Representante / Contacto</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <input class="efi" id="er-${j.id}" value="${(j.repre||"").replace(/"/g,'&quot;')}" placeholder="Representante">
          <input class="efi" id="et-${j.id}" value="${(j.tel||"").replace(/"/g,'&quot;')}" placeholder="📞 Teléfono" type="tel">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">
          <input class="efi" id="etm-${j.id}" value="${(j.tm||"").replace(/"/g,'&quot;')}" placeholder="🔗 Transfermarkt URL">
          <input class="efi" id="ebs-${j.id}" value="${(j.bs||"").replace(/"/g,'&quot;')}" placeholder="🔗 BeSoccer URL">
        </div>
      </div>
      <div style="margin-bottom:8px"><div class="efl">Observaciones</div>
        <input class="efi" id="eob-${j.id}" value="${(j.obs||"").replace(/"/g,'&quot;')}" style="width:100%">
      </div>
      <div style="display:flex;gap:6px">
        <button onclick="svEB(${j.id})" class="btn-primary" style="font-size:11px;padding:6px 14px">Guardar</button>
        <button class="bg" onclick="sEJ(null)">Cancelar</button>
      </div>
    </div>`:"";
    return`<div class="jc" style="background:${i%2===0?'var(--card)':'var(--bg)'};border-left-color:${pc(j.pos)}">
      <div class="jcr">
        ${posHtml}
        <span style="font-weight:600;font-size:11px;color:var(--text);flex:1 1 80px">${j.n}</span>
        <span style="font-size:10px;color:var(--muted)">${j.eq}</span>
        <span style="font-size:9px;color:var(--muted)">${j.cat}</span>
        <span class="eb" style="background:${bg};color:${tx};${b}">${j.est||""}</span>
        ${isp(j.ico)}
        ${telL}${tmL}${bsL}
        <div style="display:flex;gap:2px;margin-left:auto">
          <button class="bi" onclick="sEJ(${j.id})" title="Editar"><i class="ti ti-edit"></i></button>
          <button class="bi g" onclick="addP(${j.id})" title="Añadir al campograma ${(cg()&&cg().nombre)||''}"><i class="ti ti-plus"></i></button>
          <button class="bi" onclick="delJug(${j.id})" title="Eliminar"><i class="ti ti-trash"></i></button>
        </div>
      </div>${eH}
    </div>`;
  }).join("");
  return`
    <div class="flt">
      <input id="search-bd" placeholder="🔍 Buscar nombre, equipo o perfil..." value="${flt.txt}" oninput="sf('txt',this.value)" autocomplete="off" spellcheck="false">
      <select onchange="sf('sec',this.value)"><option value="">Todas las posiciones</option>${secs.map(s=>`<option ${flt.sec===s?'selected':''} value="${s}">${s}</option>`).join("")}</select>
      <select onchange="sf('est',this.value)"><option value="">Todos los estados</option>${Object.keys(EST).map(e=>`<option ${flt.est===e?'selected':''} value="${e}">${e}</option>`).join("")}</select>
      ${flt.txt||flt.sec||flt.est?`<button class="bg" onclick="cf()">✕ Limpiar</button>`:""}
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:6px">${f.length} de ${jug.length} jugadores</div>
    ${cards||`<div style="padding:20px;text-align:center;color:var(--muted)">Sin resultados</div>`}`;
}

// ── REGISTRO ──────────────────────────────────────────────────────
function rReg(){
  const eB=Object.keys(EST).map(e=>{const{bg,tx}=es(e);const sel=fd.est===e;return`<button class="ebt ${sel?'sel':''}" style="background:${bg};color:${tx}" onclick="sfe('${e}')">${e}</button>`;}).join("");
  const iB=ICO.map(ic=>{const sel=(fd.ico||[]).includes(ic.id);return`<button class="ibt ${sel?'sel':''}" onclick="tfi('${ic.id}')" title="${ic.l}">${ic.e} <span style="font-size:9px">${ic.l}</span></button>`;}).join("");
  const sO=SECS.map(s=>`<option ${fd.s===s?'selected':''} value="${s}">${s}</option>`).join("");
  const cO=["","1ª División","2ª División","1ª Federación","2ª Federación","3ª Federación","Liga Extranjera","Sin club","Retirado"].map(c=>`<option ${fd.cat===c?'selected':''} value="${c}">${c||'— Categoría —'}</option>`).join("");
  // Selector de posiciones múltiples en registro
  const posB=TODAS_POS.map(p=>{
    const sel=(fd.posArr||[]).includes(p);
    return`<button onclick="tfiPos('${p}')" style="padding:4px 9px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;border:1.5px solid ${sel?'#fff':PCC[p]||'#555'};background:${sel?PCC[p]||'#555':'transparent'};color:${sel?PCT[p]||'#fff':PCC[p]||'#555'}">${p}</button>`;
  }).join("");
  return`<div class="rform">
    <div style="background:linear-gradient(135deg,var(--navy3),var(--navy2));border-radius:8px;padding:12px 16px;margin-bottom:14px;border-left:4px solid var(--gold);display:flex;align-items:center;gap:12px">
      <img src="${window.LOGO_SRC||'/logo.png'}" style="width:40px;height:40px;object-fit:contain;flex-shrink:0">
      <div>
        <div style="color:var(--gold);font-size:13px;font-weight:700;margin-bottom:2px">Nuevo jugador futurible</div>
        <div style="color:rgba(255,255,255,.5);font-size:11px">Sincronizado en todos tus dispositivos vía Supabase</div>
      </div>
    </div>
    <div class="stl">Identificación</div>
    <div class="rfg">
      <div><label class="rfl">Nombre deportivo *</label><input class="rfi" id="rn" value="${fd.n||""}" placeholder="ALIAS / NOMBRE" oninput="sfd('n',this.value)"></div>
      <div><label class="rfl">Sección</label><select class="rfs" onchange="sfd('s',this.value)">${sO}</select></div>
    </div>
    <div style="margin-bottom:10px">
      <label class="rfl" style="display:block;margin-bottom:5px">Posiciones (puede ser múltiple)</label>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${posB}</div>
    </div>
    <div class="stl">Club y categoría</div>
    <div class="rfg">
      <div><label class="rfl">Equipo actual *</label>
        <input class="rfi" id="re" value="${fd.eq||""}" placeholder="Nombre del club"
          oninput="sfd('eq',this.value)" list="equipos-list" autocomplete="off">
        <datalist id="equipos-list">
          ${[...new Set(jug.map(j=>j.eq).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).map(eq=>`<option value="${eq}">`).join("")}
        </datalist>
      </div>
      <div><label class="rfl">Categoría</label><select class="rfs" onchange="sfd('cat',this.value)">${cO}</select></div>
      <div style="grid-column:span 2">
        <label class="rfl">Perfil de juego</label>
        <input class="rfi" value="${fd.perfil||""}" placeholder="Escribe o elige perfil..."
          oninput="sfd('perfil',this.value)" list="perfiles-list" autocomplete="off">
        <datalist id="perfiles-list">
                    <option value="PORTERO COMPLETO">
          <option value="PORTERO GATO Y PIES">
          <option value="PORTERO AÉREO">
          <option value="PORTERO GATO Y AÉREO">
          <option value="CENTRAL COMPLETO">
          <option value="CENTRAL CONTUNDENTE">
          <option value="CENTRAL CREATIVO">
          <option value="LATERAL TIPO CENTRAL">
          <option value="LATERAL">
          <option value="CARRILERO">
          <option value="EXTREMO/CARRILERO">
          <option value="MC DEFENSIVO">
          <option value="MC POSICIONAL">
          <option value="MC POSICIONAL Y CREACIÓN">
          <option value="MC PULPO">
          <option value="MC CREACIÓN">
          <option value="MC CREACIÓN Y BOX TO BOX">
          <option value="MC BOX TO BOX">
          <option value="MC DEFENSIVO Y PULPO">
          <option value="MEDIA PUNTA ELÉCTRICO">
          <option value="MEDIA PUNTA ASOCIATIVO">
          <option value="EXTREMO CREATIVO">
          <option value="SEGUNDO DELANTERO">
          <option value="EXTREMO PURO">
          <option value="EXTREMO ELÉCTRICO">
          <option value="DELANTERO COMPLETO">
          <option value="DELANTERO REFERENCIA">
          <option value="DELANTERO EXTREMO">
          ${[...new Set(jug.map(j=>j.perfil).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).filter(p=>!['PORTERO COMPLETO', 'PORTERO GATO Y PIES', 'PORTERO AÉREO', 'PORTERO GATO Y AÉREO', 'CENTRAL COMPLETO', 'CENTRAL CONTUNDENTE', 'CENTRAL CREATIVO', 'LATERAL TIPO CENTRAL', 'LATERAL', 'CARRILERO', 'EXTREMO/CARRILERO', 'MC DEFENSIVO', 'MC POSICIONAL', 'MC POSICIONAL Y CREACIÓN', 'MC PULPO', 'MC CREACIÓN', 'MC CREACIÓN Y BOX TO BOX', 'MC BOX TO BOX', 'MC DEFENSIVO Y PULPO', 'MEDIA PUNTA ELÉCTRICO', 'MEDIA PUNTA ASOCIATIVO', 'EXTREMO CREATIVO', 'SEGUNDO DELANTERO', 'EXTREMO PURO', 'EXTREMO ELÉCTRICO', 'DELANTERO COMPLETO', 'DELANTERO REFERENCIA', 'DELANTERO EXTREMO'].includes(p)).map(p=>`<option value="${p}">`).join("")}
        </datalist>
        <div style="font-size:9px;color:var(--muted);margin-top:3px">
          💡 Elige de la lista o escribe uno nuevo — se añadirá automáticamente
        </div>
      </div>
    </div>
    <div class="stl">Estado fichaje</div>
    <div class="eg" style="margin-bottom:12px">${eB}</div>
    <div class="stl">Características</div>
    <div class="ig" style="margin-bottom:14px">${iB}</div>
    <div class="stl">Contacto y enlaces</div>
    <div class="rfg">
      <div><label class="rfl">Representante</label><input class="rfi" value="${fd.repre||""}" placeholder="Nombre del agente" oninput="sfd('repre',this.value)"></div>
      <div><label class="rfl">📞 Teléfono</label><input class="rfi" type="tel" value="${fd.tel||""}" placeholder="+34 600 000 000" oninput="sfd('tel',this.value)"></div>
      <div><label class="rfl">🔗 Transfermarkt</label><input class="rfi" value="${fd.tm||""}" placeholder="https://transfermarkt.es/..." oninput="sfd('tm',this.value)"></div>
      <div><label class="rfl">🔗 BeSoccer</label><input class="rfi" value="${fd.bs||""}" placeholder="https://besoccer.com/..." oninput="sfd('bs',this.value)"></div>
    </div>
    <div style="margin-bottom:14px"><label class="rfl">Observaciones</label><textarea class="rfi" rows="2" style="resize:vertical" placeholder="Notas sobre el jugador..." oninput="sfd('obs',this.value)">${fd.obs||""}</textarea></div>

    <div style="margin-bottom:14px">
      <div class="stl">📖 Leyenda de perfiles de juego</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
        
        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #C8A84B">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">🧤 PORTEROS</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>PORTERO COMPLETO</b> — Bueno bajo palos y con los pies<br>
            <b>PORTERO GATO Y PIES</b> — Reflejos + gran juego con balón<br>
            <b>PORTERO AÉREO</b> — Domina el área, poderío físico<br>
            <b>PORTERO GATO Y AÉREO</b> — Reflejos + dominio aéreo
          </div>
        </div>

        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #00B0F0">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">🛡️ CENTRALES</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>CENTRAL COMPLETO</b> — Equilibrio defensivo y juego<br>
            <b>CENTRAL CONTUNDENTE</b> — Físico, duro, buen marcador<br>
            <b>CENTRAL CREATIVO</b> — Sale con balón, buen pie<br>
            <b>LATERAL TIPO CENTRAL</b> — Puede jugar de central
          </div>
        </div>

        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #00B0F0">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">↔️ LATERALES</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>LATERAL</b> — Perfil defensivo clásico<br>
            <b>CARRILERO</b> — Sube y baja, apoyo ofensivo constante<br>
            <b>EXTREMO/CARRILERO</b> — Muy ofensivo, puede jugar de extremo
          </div>
        </div>

        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #27AE60">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">⚙️ MEDIOS CENTRO / PIVOTES</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>MC DEFENSIVO</b> — Rompe juego, posición, recupera<br>
            <b>MC POSICIONAL</b> — Control del juego, circulación<br>
            <b>MC POSICIONAL Y CREACIÓN</b> — Pivote + primer pase<br>
            <b>MC PULPO</b> — Muy completo, cubre todo el campo<br>
            <b>MC CREACIÓN</b> — Distribuye, dicta el ritmo
          </div>
        </div>

        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #27AE60">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">🔁 INTERIORES</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>MC CREACIÓN Y BOX TO BOX</b> — Llega al área + construye<br>
            <b>MC BOX TO BOX</b> — Recorre todo el campo, aparece en ataque<br>
            <b>MC DEFENSIVO Y PULPO</b> — Recupera + polivalente
          </div>
        </div>

        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #27AE60">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">🎯 INT. MEDIA PUNTAS</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>MEDIA PUNTA ELÉCTRICO</b> — Veloz, desequilibra entre líneas<br>
            <b>MEDIA PUNTA ASOCIATIVO</b> — Toca, asocia, genera<br>
            <b>EXTREMO CREATIVO</b> — Encarador, genera superioridades<br>
            <b>SEGUNDO DELANTERO</b> — Cae a buscar, enlaza con 9
          </div>
        </div>

        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #E74C3C">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">⚡ EXTREMOS</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>EXTREMO PURO</b> — Perfil, velocidad, 1vs1<br>
            <b>EXTREMO CREATIVO</b> — Asocia, genera, asiste<br>
            <b>EXTREMO ELÉCTRICO</b> — Explosivo, desequilibrio puro
          </div>
        </div>

        <div style="background:var(--bg);border:.5px solid var(--border);border-radius:6px;padding:8px 10px;border-left:3px solid #E74C3C">
          <div style="font-weight:700;color:var(--text);margin-bottom:4px">⚽ DELANTEROS</div>
          <div style="color:var(--muted);line-height:1.6">
            <b>DELANTERO COMPLETO</b> — Gol + asociación + profundidad<br>
            <b>DELANTERO REFERENCIA</b> — Físico, retiene, remata<br>
            <b>DELANTERO EXTREMO</b> — Veloz, en profundidad<br>
            <b>SEGUNDO DELANTERO</b> — Movilidad, enlace, gol
          </div>
        </div>

      </div>
    </div>
    <button class="btn-gold" style="width:100%;font-size:13px;padding:12px 0" onclick="addJug()">
      <i class="ti ti-plus" style="font-size:16px"></i>Añadir jugador a base de datos
    </button>
  </div>`;
}

// ── PLANTILLA ─────────────────────────────────────────────────────
function rPlant(){
  // La Plantilla es la del campograma que esté abierto.
  const lista = plant, c = cg();
  if(!lista.length) return`<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px;border:1.5px dashed var(--border);border-radius:10px">
    El campograma «${(c&&c.nombre)||''}» todavía no tiene jugadores.<br>Colócalos desde la pestaña Campogramas.
  </div>`;
  return`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      ${escudoHTML(c&&c.escudo,24)}
      <span style="font-size:14px;font-weight:700;color:var(--text)">${(c&&c.nombre)||''}</span>
      ${c&&c.cat?`<span style="font-size:10px;color:var(--muted);border:1px solid var(--border);border-radius:9px;padding:2px 8px">${c.cat}</span>`:''}
      <span style="font-size:10px;color:var(--muted)">· ${(c&&c.sistema)||''}</span>
      <span style="background:var(--gold);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px">${lista.length}</span>
      <span style="font-size:10px;color:var(--muted);margin-left:auto">Sigue al campograma que tengas abierto</span>
    </div>
    <div class="pgd">${lista.map(j=>{
      const{bg,tx,bd}=es(j.est);const b=bd?`border:1px solid ${bd};`:"";const isE=editCid===j.id;
      const posHtml=jugPos(j).map(p=>`<span class="pb" style="background:${PCC[p]||'#555'};color:${PCT[p]||'#fff'};margin-right:2px">${p}</span>`).join("");
      const telL=j.tel?`<a href="tel:${j.tel}" class="tel-link" style="display:block;margin-top:4px">📞 ${j.tel}</a>`:"";
      return`<div class="pca" style="border-top-color:${pc(j.pos)}">
        <div class="pbo">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px;margin-bottom:5px">
            <div style="flex:1;min-width:0">
              ${posHtml}
              <div style="font-size:12px;font-weight:700;color:var(--text);margin-top:3px">${j.n}</div>
              <div style="font-size:10px;color:var(--muted)">${j.eq}</div>
              <div style="font-size:9px;color:var(--muted)">${j.cat}</div>
              ${telL}
            </div>
            <button class="bi" onclick="remP(${j.id})" style="font-size:13px">✕</button>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:5px">
            <span class="eb" style="background:${bg};color:${tx};${b}">${j.est||""}</span>
            ${isp(j.ico)}
          </div>
          ${j.obs?`<div style="font-size:9px;color:var(--muted);font-style:italic;border-top:1px solid var(--border);padding-top:4px;margin-top:3px">${j.obs}</div>`:""}
          <button onclick="tEC(${j.id})" style="margin-top:6px;width:100%;padding:3px 0;font-size:9px;cursor:pointer;border:.5px solid var(--border);border-radius:4px;background:transparent;color:var(--muted)">✏️ Editar estado / posición / iconos</button>
          ${isE?`<div style="margin-top:6px">${rEI(j)}</div>`:""}
        </div>
      </div>`;
    }).join("")}</div>`;
}

// ── CLAUDE ────────────────────────────────────────────────────────
function rClaude(){
  const msgs=claudeMsgs.map(m=>`<div class="${m.role==='user'?'claude-msg-user':'claude-msg-ai'}">${m.role==='user'?'👤 Tú:':'🤖 Claude:'}<div style="margin-top:2px">${m.content.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div></div>`).join("");
  return`
    <div class="claude-box">
      <div class="claude-title"><i class="ti ti-robot"></i>Claude AI · Asistente de Scouting</div>
      <div style="color:rgba(255,255,255,.55);font-size:11px;margin-bottom:12px">Pregunta sobre jugadores, pide actualizaciones o análisis. Claude puede actualizar datos directamente en Supabase.</div>
      <div class="claude-msgs" style="min-height:80px;margin-bottom:12px">
        ${msgs||'<div style="color:rgba(255,255,255,.3);font-style:italic">Haz una pregunta sobre tu base de datos...</div>'}
        ${claudeLoading?'<div style="color:var(--gold);margin-top:8px">⏳ Pensando...</div>':""}
      </div>
      <div style="display:flex;gap:8px">
        <input class="claude-input" id="claude-input" placeholder="Ej: ¿Qué porteros tenemos en 1ª División?..." onkeydown="if(event.key==='Enter')sendClaude()">
        <button onclick="sendClaude()" class="btn-gold" style="padding:9px 14px;white-space:nowrap;font-size:12px">${claudeLoading?'⏳':'Enviar →'}</button>
      </div>
    </div>`;
}

// ── EVENTOS ───────────────────────────────────────────────────────
window.sv_ = v => { view=v; selPos=null; editJid=null; editCid=null; render(); };
window.setSistema = s => {
  const c=cg(); if(c){ c.sistema=s; cgGuardar(); }
  sistema=s; selPos=null; render();
};

// ── Pestañas de campogramas ──────────────────────────────────────
window.cgSel = id => { cgAct=id; selPos=null; editCid=null; movJid=null; posExpanded={}; cgGuardar(); cgSync(); render(); };
// ── LA HOJA DE CREAR / EDITAR UN CAMPOGRAMA ──────────────────────
//   Vive fuera de render(): si se repintara toda la pantalla con cada
//   tecla, el cursor se saldría del campo de texto a media palabra.
let cgDraft=null;

window.cgAdd = () => cgHoja(null);
window.cgRen = () => cgHoja(cgAct);
window.cgCat = () => cgHoja(cgAct);
window.cgHoja = (id) => {
  const base = id ? CGS.find(c=>c.id===id) : null;
  cgDraft = base
    ? {id:base.id, nombre:base.nombre||'', cat:base.cat||'', escudo:base.escudo||'', sistema:base.sistema||'1-4-3-3'}
    : {id:null, nombre:'', cat:'', escudo:'', sistema:'1-4-3-3'};
  cgPintaHoja();
};
window.cgCierraHoja = () => { const m=document.getElementById('cg-hoja'); if(m) m.remove(); cgDraft=null; };

function cgPintaHoja(){
  let m=document.getElementById('cg-hoja');
  if(!m){ m=document.createElement('div'); m.id='cg-hoja'; document.body.appendChild(m); }
  m.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(8,12,22,.82);'+
    'display:flex;align-items:center;justify-content:center;padding:14px;';
  const d=cgDraft;
  m.innerHTML=`
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:12px;
         width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden">
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--border)">
        <span style="font-size:14px;font-weight:700;color:var(--gold);flex:1">${d.id?'Editar campograma':'Nuevo campograma'}</span>
        <button id="cg-x" style="background:transparent;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1">×</button>
      </div>
      <div style="padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div id="cg-esc" title="Poner o cambiar el escudo"
               style="width:62px;height:62px;flex:0 0 62px;border:1.5px dashed var(--border2);border-radius:9px;
                      display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;
                      background:var(--bg)"></div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">
            <input id="cg-nombre" value="${(d.nombre||'').replace(/"/g,'&quot;')}" placeholder="Nombre del equipo"
                   style="width:100%;padding:8px 10px;border-radius:7px;border:1px solid var(--border2);
                          background:var(--bg);color:var(--text);font-size:14px;font-weight:700">
            <div style="display:flex;gap:8px">
              <input id="cg-cat" value="${(d.cat||'').replace(/"/g,'&quot;')}" placeholder="Categoría"
                     style="flex:1;min-width:0;padding:6px 9px;border-radius:7px;border:1px solid var(--border);
                            background:var(--bg);color:var(--text);font-size:12px">
              <select id="cg-sis" style="flex:0 0 auto;padding:6px 9px;border-radius:7px;border:1px solid var(--border);
                            background:var(--bg);color:var(--text);font-size:12px">
                ${Object.keys(SISTEMAS).map(x=>`<option value="${x}"${x===d.sistema?' selected':''}>${x}</option>`).join('')}
              </select>
            </div>
            <button id="cg-quita-esc" style="align-self:flex-start;font-size:10px;padding:2px 8px;border-radius:5px;
                    border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;
                    display:${d.escudo?'block':'none'}">Quitar escudo</button>
          </div>
        </div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:6px">
            Clubes ya registrados
          </div>
          <input id="cg-busca" placeholder="Buscar club..."
                 style="width:100%;padding:7px 10px;border-radius:7px;border:1px solid var(--border);
                        background:var(--bg);color:var(--text);font-size:12px;margin-bottom:7px">
          <div id="cg-lista" style="max-height:230px;overflow-y:auto;border:1px solid var(--border);border-radius:8px"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding:11px 14px;border-top:1px solid var(--border)">
        <button id="cg-cancel" style="padding:7px 14px;border-radius:7px;border:1px solid var(--border);
                background:transparent;color:var(--muted);cursor:pointer;font-size:12px">Cancelar</button>
        <button id="cg-ok" style="padding:7px 18px;border-radius:7px;border:none;background:var(--gold);
                color:#1B2A6B;font-weight:700;cursor:pointer;font-size:12px">Guardar</button>
      </div>
    </div>
    <input type="file" id="cg-file" accept="image/*" style="display:none">`;

  const $=i=>document.getElementById(i);
  cgPintaEscudoHoja();
  cgPintaClubes('');

  $('cg-x').onclick = $('cg-cancel').onclick = cgCierraHoja;
  m.onclick = e => { if(e.target===m) cgCierraHoja(); };
  $('cg-nombre').oninput = e => { cgDraft.nombre=e.target.value; };
  $('cg-cat').oninput    = e => { cgDraft.cat=e.target.value; };
  $('cg-sis').onchange   = e => { cgDraft.sistema=e.target.value; };
  $('cg-busca').oninput  = e => cgPintaClubes(e.target.value);
  $('cg-esc').onclick    = () => $('cg-file').click();
  $('cg-file').onchange  = cgEscudoElegido;
  $('cg-quita-esc').onclick = () => { cgDraft.escudo=''; cgPintaEscudoHoja(); };
  $('cg-ok').onclick     = cgGuardaHoja;
  $('cg-nombre').focus();
}

function cgPintaEscudoHoja(){
  const e=document.getElementById('cg-esc'); if(!e) return;
  e.innerHTML = imgHay(cgDraft.escudo)
    ? '<img src="'+imgSrc(cgDraft.escudo)+'" alt="" style="width:100%;height:100%;object-fit:contain">'
    : '<span style="font-size:10px;color:var(--muted);text-align:center;line-height:1.2">+<br>escudo</span>';
  const q=document.getElementById('cg-quita-esc');
  if(q) q.style.display = cgDraft.escudo ? 'block' : 'none';
}

function cgPintaClubes(filtro){
  const cont=document.getElementById('cg-lista'); if(!cont) return;
  const f=String(filtro||'').trim().toLowerCase();
  let lista=clubesConocidos();
  if(f) lista=lista.filter(c=>c.nombre.toLowerCase().includes(f));
  const total=lista.length;
  const corta = !f && total>60;
  if(corta) lista=lista.slice(0,60);
  if(!total){
    cont.innerHTML='<div style="padding:14px;text-align:center;font-size:11px;color:var(--muted)">'+
      (f?'Ningún club con ese nombre. Escríbelo arriba y se crea igualmente.':'Todavía no hay clubes registrados.')+'</div>';
    return;
  }
  cont.innerHTML = lista.map((c,i)=>
    '<div class="cg-club" data-i="'+i+'" style="display:flex;align-items:center;gap:8px;padding:6px 9px;cursor:pointer;'+
    'border-bottom:.5px solid var(--border)">'+
      (c.escudo?escudoHTML(c.escudo,22):'<span style="width:22px;height:22px;flex:0 0 22px;border-radius:3px;'+
        'background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--muted)">⚽</span>')+
      '<span style="flex:1;min-width:0;font-size:12px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+c.nombre+'</span>'+
    '</div>').join('') +
    (corta?'<div style="padding:7px;text-align:center;font-size:10px;color:var(--muted)">'+
      'y '+(total-60)+' más · usa el buscador</div>':'');
  cont.querySelectorAll('.cg-club').forEach(el=>{
    el.onclick=()=>{
      const c=lista[+el.dataset.i];
      cgDraft.nombre=c.nombre;
      if(c.escudo) cgDraft.escudo=c.escudo;
      const n=document.getElementById('cg-nombre'); if(n) n.value=c.nombre;
      cgPintaEscudoHoja();
    };
  });
}

function cgEscudoElegido(e){
  const file=e.target.files && e.target.files[0];
  e.target.value='';
  if(!file || !/^image\//.test(file.type)) return;
  const rd=new FileReader();
  rd.onload=ev=>{
    const im=new Image();
    im.onload=()=>{
      const MAX=160, c=document.createElement('canvas');
      let w=im.width, h=im.height;
      if(w>MAX||h>MAX){ const k=Math.min(MAX/w,MAX/h); w=Math.round(w*k); h=Math.round(h*k); }
      c.width=w; c.height=h; c.getContext('2d').drawImage(im,0,0,w,h);
      cgDraft.escudo = imgGuarda(c.toDataURL('image/png'));
      cgPintaEscudoHoja();
    };
    im.src=ev.target.result;
  };
  rd.readAsDataURL(file);
}

function cgGuardaHoja(){
  const d=cgDraft; if(!d) return;
  const nombre=String(d.nombre||'').replace(/\s+/g,' ').trim();
  if(!nombre){ shT('Ponle nombre al equipo','err'); const n=document.getElementById('cg-nombre'); if(n) n.focus(); return; }
  const cat=String(d.cat||'').replace(/\s+/g,' ').trim();
  if(d.id){
    const c=CGS.find(x=>x.id===d.id); if(!c) return cgCierraHoja();
    c.nombre=nombre; c.cat=cat; c.escudo=d.escudo||''; c.sistema=SISTEMAS[d.sistema]?d.sistema:c.sistema;
    cgGuardar(); cgSync(); cgCierraHoja(); render(); shT('Campograma actualizado');
  } else {
    const c=cgNuevo(nombre);
    c.cat=cat; c.escudo=d.escudo||''; c.sistema=SISTEMAS[d.sistema]?d.sistema:'1-4-3-3';
    CGS.push(c); cgAct=c.id; selPos=null; posExpanded={};
    cgGuardar(); cgSync(); cgCierraHoja(); render(); shT('Campograma «'+c.nombre+'» creado');
  }
}
window.cgDup = () => {
  const c=cg(); if(!c) return;
  const copia=JSON.parse(JSON.stringify(c));
  copia.id=cgId(); copia.nombre=c.nombre+' (copia)';
  CGS.splice(CGS.indexOf(c)+1,0,copia); cgAct=copia.id;
  cgGuardar(); cgSync(); render(); shT('Copiado');
};
window.cgDel = () => {
  const c=cg(); if(!c) return;
  if(CGS.length<=1){ shT('Tiene que quedar al menos un campograma','err'); return; }
  const n=Object.keys(c.asign).length;
  if(!confirm('¿Eliminar el campograma «'+c.nombre+'»'+(n?' con sus '+n+' jugadores colocados':'')+'?\n\nLas fichas de los jugadores NO se borran: siguen en la base de datos.')) return;
  CGS=CGS.filter(x=>x.id!==c.id); cgAct=CGS[0].id;
  selPos=null; posExpanded={}; cgGuardar(); cgSync(); render(); shT('Campograma eliminado');
};
window.tPos = k => { selPos=selPos===k?null:k; editCid=null; render(); };
window.tExp = k => { posExpanded={...posExpanded,[k]:!posExpanded[k]}; render(); };
window.moverPos = async (id, nuevaPos) => {
  if(!id) { movJid=null; render(); return; }
  const c=cg(); if(c){ c.asign[id]=nuevaPos; cgGuardar(); cgSync(); }
  movJid = null;
  render();
  shT('Movido a ' + nuevaPos);
};
window.tEC  = id => { editCid=editCid===id?null:id; render(); };
window.tMov = id => { movJid=movJid===id?null:id; render(); };
window.sEC  = (id,est) => updJug(id,{est});

// Cambiar posición en campograma/plantilla (toggle)
window.tPosJug = (id, p) => {
  const j = [...jug,...plant].find(x=>x.id===id); if(!j) return;
  const ps = jugPos(j);
  const nuevas = ps.includes(p) ? ps.filter(x=>x!==p) : [...ps,p];
  const posStr = nuevas.length ? nuevas.join(',') : p;
  updJug(id, {pos: posStr});
};

// Cambiar posición en base de datos
window.tPosJugBD = (id, p) => {
  const j = jug.find(x=>x.id===id); if(!j) return;
  const ps = jugPos(j);
  const nuevas = ps.includes(p) ? ps.filter(x=>x!==p) : [...ps,p];
  const posStr = nuevas.length ? nuevas.join(',') : p;
  updJug(id, {pos: posStr}); editJid=id;
};

// Toggle posición en registro (posArr)
window.tfiPos = p => {
  // Si posArr es null (reset tras último registro), empezar desde cero — NO heredar pos anterior
  if(!fd.posArr) fd.posArr=[];
  const idx=fd.posArr.indexOf(p);
  if(idx>=0) fd.posArr=fd.posArr.filter(x=>x!==p);
  else fd.posArr=[...fd.posArr,p];
  fd.pos=fd.posArr.length>0 ? fd.posArr.join(',') : 'P1';
  render();
};

window.tIC = (id,ico) => {
  const j=[...jug,...plant].find(x=>x.id===id); if(!j) return;
  const c=j.ico||[]; updJug(id,{ico:c.includes(ico)?c.filter(x=>x!==ico):[...c,ico]});
};
window.sEJ = id => { editJid=id; render(); };
window.sEB = (id,est) => { updJug(id,{est}); editJid=id; };
window.tIB = (id,ico) => {
  const j=jug.find(x=>x.id===id); if(!j) return;
  const c=j.ico||[]; updJug(id,{ico:c.includes(ico)?c.filter(x=>x!==ico):[...c,ico]}); editJid=id;
};
window.svEB = id => {
  const g = s => document.getElementById(`${s}-${id}`)?.value||"";
  updJug(id,{n:g('en').toUpperCase(),eq:g('ee'),cat:g('ec'),perfil:g('ep'),repre:g('er'),tel:g('et'),tm:g('etm'),bs:g('ebs'),obs:g('eob'),notas:g('eob')});
  editJid=null;
};
window.sf = (k,v) => {
  flt={...flt,[k]:v};
  if(k==='txt') {
    // Para texto: debounce — no re-renderiza hasta 250ms después de la última letra
    if(searchTmr) clearTimeout(searchTmr);
    searchTmr = setTimeout(()=>{ render(); reconectarBuscador(); }, 250);
  } else {
    render();
  }
};
function reconectarBuscador() {
  // Restaurar foco y posición del cursor en el buscador tras render
  const inp = document.getElementById('search-bd');
  if(inp && document.activeElement !== inp) {
    // no robar el foco si el usuario ya está en otro sitio
  }
}
window.cf  = () => { flt={txt:"",sec:"",est:""}; render(); };
// Un jugador de la plantilla del equipo que todavía no está en la base.
// Se crea con el equipo del campograma y entra directo al puesto.
window.cgNuevoJug = (pos) => {
  const c=cg(); if(!c) return;
  // Se limpian los espacios de más: escribiendo deprisa en el móvil salen
  // dobles y luego el nombre no casa con el de la base de datos.
  const n=(prompt('Nombre del jugador (equipo: '+c.nombre+'):','')||'').replace(/\s+/g,' ').trim();
  if(!n) return;
  const maxId = jug.length ? Math.max(...jug.map(j=>Number(j.id)||0)) : 300;
  const nuevo = {id:maxId+1, n:n.toUpperCase(), eq:c.nombre, cat:c.cat||'', pos:pos,
                 s:secDePos(pos), est:'EN PLANTILLA', ico:[], obs:'', tel:'', tm:'', bs:'',
                 repre:null, contacto:null, perfil:null, notas:null, pos_campo:'',
                 _deCampograma:c.id, updated_at:new Date().toISOString()};
  jug=[...jug,nuevo];
  try{ localStorage.setItem('oi_jugadores_v1', JSON.stringify(jug)); }catch(e){}
  c.asign[nuevo.id]=pos; cgGuardar(); cgSync(); render();
  shT(nuevo.n+' → '+pos);
};
window.addP = (id, pos) => addPlant(id, pos);
window.remP = remPlant;
window.delJug = delJug;
window.addJug = addJug;
window.sfe = e => { fd={...fd,est:e}; render(); };
window.tfi = ico => { const c=fd.ico||[]; fd={...fd,ico:c.includes(ico)?c.filter(x=>x!==ico):[...c,ico]}; render(); };
window.sfd = (k,v) => { fd={...fd,[k]:v}; };
window.sendClaude = sendClaude;

// ── PWA ───────────────────────────────────────────────────────────
if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});

// ── ARRANCAR ──────────────────────────────────────────────────────
render();
loadData();
