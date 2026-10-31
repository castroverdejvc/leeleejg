/* LeeLEEJG · base: utilidades, datos, lectores, navegación */
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalizar = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9ñ]/g,'').replace(/ñ/g,'n');
const limpiar = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const barajar = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
const mmss = s => { s=Math.max(0,Math.round(s||0)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : s;
const pausa = ms => new Promise(r=>setTimeout(r,ms));
const media = a => { a=a.filter(x=>x!=null && !Number.isNaN(x)); return a.length ? a.reduce((x,y)=>x+y,0)/a.length : null; };
function lev(a,b){ const m=a.length,n=b.length; if(Math.abs(m-n)>2) return 9; const d=Array.from({length:m+1},(_,i)=>[i]); for(let j=1;j<=n;j++) d[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]; }
function coincide(t, w){
  if(t===w) return true;
  if(w.length>=4 && t.length>=3){ if(lev(t,w) <= (w.length>=7?2:1)) return true; if(w.startsWith(t) && t.length>=w.length-2) return true; }
  return false;
}
async function api(ruta, opt={}){
  const r = await fetch(ruta, opt);
  if(!r.ok) throw new Error((await r.text().catch(()=>'')) || ('Error '+r.status));
  const t = r.headers.get('Content-Type')||'';
  return t.includes('json') ? r.json() : r;
}
/* borrar algo y apuntarlo, para que al juntar con el otro aparato no vuelva (aj.borrados viaja en las copias) */
const TIPO_BORRADO = {audio:'audio', sesion:'sesion', misimagenes:'imagen', 'historias-nuevas':'historias'};
function borrar(ruta){
  const m = ruta.match(/^\/api\/([a-z-]+)\/(.+)$/); const t = m && TIPO_BORRADO[m[1]];
  if(t){ aj.borrados = (aj.borrados||[]).filter(b=>!(b.t===t && b.id===decodeURIComponent(m[2]))).concat([{t, id:decodeURIComponent(m[2]), f:Date.now()}]).slice(-2000); guardarAj(); }
  return api(ruta, {method:'DELETE'});
}
const postJSON = (ruta, datos) => api(ruta, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(datos)});
function registrar(m){ try{ navigator.sendBeacon('/api/registro', new Blob([JSON.stringify({mensaje:m})],{type:'application/json'})); }catch(e){} }
window.addEventListener('error', e=>registrar('Error JS: '+e.message+' @'+(e.filename||'').split('/').pop()+':'+(e.lineno||'')));
window.addEventListener('unhandledrejection', e=>registrar('Promesa: '+(e.reason && e.reason.message || e.reason)));

/* ================= ICONOS ================= */
const ICON = {
  logo:'<svg viewBox="0 0 48 38" fill="none"><path d="M24 8C18 3 9 2 2 4v28c7-2 16-1 22 4 6-5 15-6 22-4V4c-7-2-16-1-22 4z" fill="#CFE2FF"/><path d="M24 8C18 3 9 2 2 4v28c7-2 16-1 22 4V8z" fill="#1E7BF2"/><path d="M24 8c6-5 15-6 22-4v28c-7-2-16-1-22 4V8z" fill="#5FA4FF"/><path d="M24 8v28" stroke="#fff" stroke-width="2"/></svg>',
  casa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  libro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5c3-1.5 7-1.5 10 1 3-2.5 7-2.5 10-1v14c-3-1.5-7-1.5-10 1-3-2.5-7-2.5-10-1z"/><path d="M12 6v14"/></svg>',
  calendario:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  album:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/><path d="M5.5 15l2-2.5 1.5 2M15.5 15l2-2.5 1.5 2"/></svg>',
  lapiz:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/></svg>',
  abajo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
  usuarios:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6M14.5 14.6c3.2 0 6.5 1.6 6.5 5.4"/></svg>',
  letra:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19L9 5l5 14M6 14h6M15 13c1-1 2-1.5 3-1.5 1.6 0 2.5 1 2.5 2.5V19M20.5 16c-3 0-5 .5-5 2 0 1 .8 1.5 1.8 1.5 1.5 0 3.2-1 3.2-3.5"/></svg>',
  candado:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  barras:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
  hoja:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></svg>',
  persona:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  imagen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
  altavoz:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  engranaje:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  brote:'<svg viewBox="0 0 34 40" fill="none"><path d="M17 38V18" stroke="#169B54" stroke-width="3" stroke-linecap="round"/><path d="M17 22C17 12 10 6 2 6c0 9 6 16 15 16z" fill="#18B47B"/><path d="M17 18c0-9 6-15 15-15 0 9-6 15-15 15z" fill="#169B54"/></svg>',
  flecha:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  atras:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  dcha:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
  izq:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  camara:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  nube:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 19a5 5 0 0 1-.6-10A6.5 6.5 0 0 1 19 9.5 4.8 4.8 0 0 1 18 19z"/><path d="M12 16v-5m-2.5 2.5L12 11l2.5 2.5" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
  carpeta:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  historial:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
  bombilla:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  recargar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  estrella:'<svg viewBox="0 0 24 24" fill="#F5B301"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
  borrar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M17 9l-5 6M12 9l5 6"/></svg>',
  informe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h5"/></svg>',
  pausa2:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
  juego:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".6" fill="currentColor"/><circle cx="18" cy="13.5" r=".6" fill="currentColor"/></svg>',
  descarga:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>'
};
function iconos(raiz=document){ $$('[data-icono]', raiz).forEach(e=>{ if(!e.dataset.hecho){ e.innerHTML=ICON[e.dataset.icono]||''; e.dataset.hecho='1'; e.style.display='inline-flex'; } }); }
const ic = n => ICON[n]||'';

/* ================= CONTENIDO, FOTOS Y ESTADO ================= */
let CONT = {mundos:[], historias:[], fotos:{}, emoji:{}, creditos:[], palabras:{}, trozos:{}, inicio:'2026-10-15'};
let EST = {voz:'navegador', oido:'navegador'};
let MIS = {};
let SES = [];
const PERSONAJES = [
  {clave:'lector', nombre:'{nombre} (el lector)', palabras:[]},
  {clave:'batman', nombre:'Batman', palabras:['batman']},
  {clave:'spiderman', nombre:'Spider-Man', palabras:['spiderman']},
  {clave:'superheroe', nombre:'Súper {nombre}', palabras:['super','súper']},
  {clave:'oliver', nombre:'Oliver', palabras:['oliver']},
  {clave:'benji', nombre:'Benji', palabras:['benji']},
  {clave:'mark', nombre:'Mark Lenders', palabras:['mark','lenders']},
  {clave:'shakes', nombre:'Shakes', palabras:['shakes']},
  {clave:'blok', nombre:'Blok', palabras:['blok']},
  {clave:'matador', nombre:'El Matador', palabras:['matador']}
];
function fotoURL(k, grande){
  if(!k) return null;
  if(MIS[k]) return '/mis-imagenes/'+k+'.jpg?v='+MIS[k];
  const f = CONT.fotos[k]; if(!f) return null;
  const v = CONT.fotosV ? '?v='+CONT.fotosV : '';
  return (grande && f==='b' ? 'fotos/'+k+'_big.jpg' : 'fotos/'+k+'.jpg') + v;
}
function imgHTML(k, grande, cls){
  const src = fotoURL(k, grande);
  if(src) return `<img${cls?` class="${cls}"`:''} src="${src}" alt="" decoding="async" loading="lazy">`;
  return `<span class="emo${cls?' '+cls:''}" aria-hidden="true">${CONT.emoji[k]||'🖼️'}</span>`;
}
const mundoDe = id => CONT.mundos.find(m=>m.id===id) || {id, nombre:id, foto:''};
const historia = id => CONT.historias.find(h=>h.id===id) || (CONT.complementarias||[]).find(h=>h.id===id);
/* lecturas complementarias (ids c_…): solo dan minutos de tele; no cuentan para cromos, criaturas, juegos ni nivel */
const esComp = id => /^c_/.test(String(id||''));
/* Para buscar la foto de una palabra suelta (práctica, ayuda) */
function claveDePalabra(p){ const l=String(p).toLowerCase(); return CONT.palabras[l] || CONT.palabras[l.replace(/s$/,'')] || CONT.palabras[l.replace(/es$/,'')] || null; }

/* ================= AJUSTES Y LECTORES ================= */
const COLORES = ['#1E7BF2','#8B5CF6','#18B47B','#E5484D','#F5A300','#0EA5B7','#DB2777','#64748B'];
const SUAVE = {'#1E7BF2':'#D7E8FF','#8B5CF6':'#EAE2FF','#18B47B':'#D6F3E6','#E5484D':'#FDE1E1','#F5A300':'#FFF0CC','#0EA5B7':'#D4F2F6','#DB2777':'#FCE1EE','#64748B':'#E5EAF1','#1463E6':'#D7E8FF','#1FA982':'#D6F3E6','#E8503B':'#FDE1E1','#F2A900':'#FFF0CC'};
const PKEYS = ['tam','letra','img','nivel','inicio','adelantar','practica','repaso','repasoLog','dictado','dictadoLog','temas','plan','temasLog','pideMas','espacio','marcapaginas','gustosLog','adivLog','juegoDias','premiosVistos','recordatorio','letras','letrasLog','teleDesde','teleLog','teleAvisado','juntos','escuchar','cambios','trabajosLog','juegoLog','peliLog','sobresLog','resumenVisto','deseosLog','buzonPedir','teleVistaInicio','eduLog','deporteLog','movilLog','revistasLog','cajasLog','objManualLog','cartas','advientoVisto','calcNivelIni','metasVistas','recordAvisado','sorpresaAvisada','caliLog','caliHechas','palDiaLog','palDia','nivelLog','nivelPedir','informeVisto','avisosVistos','munecosRegalo','juegosRegalo','deletreo','deletreoLog','practicaLog','sorpresaLog','anuncioVisto','nuevosLog','nuevosVistos'];
/* fichas: lo que cuenta como una ficha (⭐, minutos de tele y objetivos) — 24/10: también la caligrafía y las palabras del día */
const LOGS_FICHA = ['dictadoLog','repasoLog','letrasLog','caliLog','palDiaLog','deletreoLog'];
/* 28/10 (la familia): «Sorpresas de hoy» y «Practicar» también dan premio: 1 minuto de tele (tMini) y ⭐ (⭐⭐ si casi todo bien) */
const LOGS_MINI = ['practicaLog','sorpresaLog'];
/* 24/10: datos que se guardaban fuera del perfil del niño (7.3–7.5) y los nuevos; se reparten al perfil al abrir (ver arranque.js) */
const PKEYS_24 = ['eduLog','deporteLog','movilLog','revistasLog','cajasLog','objManualLog','cartas','advientoVisto','calcNivelIni','metasVistas','recordAvisado','sorpresaAvisada','caliLog','caliHechas','palDiaLog','palDia','nivelLog','nivelPedir','informeVisto','avisosVistos'];
const cfgBase = p => ({tam: window.innerWidth<700 ? 30 : 44, letra:'imprenta', img:'con', nivel:0, inicio:null, adelantar: !!(p && p.prueba), practica:{}, repaso:{}, repasoLog:[], dictado:{}, dictadoLog:[], temas:[], plan:{}, temasLog:[], pideMas:[], espacio:'normal', marcapaginas:null, gustosLog:[], adivLog:[], juegoDias:{}, premiosVistos:null, recordatorio:null, letras:{}, letrasLog:[], teleDesde:null, teleLog:[], teleAvisado:null, juntos:'no', escuchar:'boton', trabajosLog:[], cambios:[], juegoLog:[], peliLog:[], sobresLog:[], resumenVisto:null, deseosLog:[], buzonPedir:false, teleVistaInicio:null, eduLog:[], deporteLog:[], movilLog:[], revistasLog:[], cajasLog:[], objManualLog:[], cartas:[], advientoVisto:null, calcNivelIni:null, metasVistas:null, recordAvisado:null, sorpresaAvisada:null, caliLog:[], caliHechas:{}, palDiaLog:[], palDia:{}, nivelLog:[], nivelPedir:false, informeVisto:null, avisosVistos:{}, munecosRegalo:[], juegosRegalo:0, deletreo:{}, deletreoLog:[], practicaLog:[], sorpresaLog:[], anuncioVisto:null, nuevosLog:[], nuevosVistos:null});
/* perfil con el que empieza un aparato nuevo (se cambia el nombre en Usuarios, o se traen los del ordenador) */
const PERFIL_INICIAL = () => ({id:'lector1', nombre:'Lector', color:COLORES[0]});
const ajPorDefecto = () => ({perfiles:[{...PERFIL_INICIAL(), cfg:cfgBase()}], perfil:'lector1', pin:'', voz:'', volumen:.9, audioPreguntas:true, ...cfgBase()});
let aj = ajPorDefecto();
let tGuardarAj=null;
const perfil = () => aj.perfiles.find(p=>p.id===aj.perfil) || aj.perfiles[0];
const nombre = () => perfil().nombre || 'Lector';
const conNombre = s => String(s).split('{nombre}').join(nombre());
const iniciales = n => (n||'?').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
/* guarda en el perfil lo de la pantalla (y conserva lo que traiga de una versión más nueva) */
function guardarCfgPerfil(){ const p=aj.perfiles && aj.perfiles.find(x=>x.id===aj.perfil); if(p) p.cfg = {...(p.cfg||{}), ...JSON.parse(JSON.stringify(Object.fromEntries(PKEYS.map(k=>[k, aj[k]]))))}; }
/* al recargar después de restaurar o de juntar no se guarda nada más (se pisaría lo nuevo con lo de la pantalla) */
let recargando=false;
function recargarSinGuardar(){ recargando=true; clearTimeout(tGuardarAj); location.reload(); }
let uniendo=false, ajPendiente=false;   // mientras se junta una copia no se escribe: los cambios se apuntan y se juntan al terminar
function guardarAj(){ if(recargando) return; if(uniendo){ guardarCfgPerfil(); if(typeof sellarCambios==='function') sellarCambios(); ajPendiente=true; return; } guardarCfgPerfil(); if(typeof sellarCambios==='function') sellarCambios(); clearTimeout(tGuardarAj); tGuardarAj=setTimeout(()=>{ if(recargando) return; if(uniendo){ ajPendiente=true; return; } postJSON('/api/ajustes', aj).catch(e=>registrar('No se guardaron los ajustes: '+e.message)); }, 350); }
function usarPerfil(id){ guardarCfgPerfil(); aj.perfil=id; const p=perfil(); Object.assign(aj, cfgBase(p), p.cfg||{}); guardarAj(); pintarCabecera(); aplicarLetra(); }
const claveLector = (p=perfil()) => MIS['lector_'+p.id] ? 'lector_'+p.id : (p.id===aj.perfiles[0].id && MIS.lector ? 'lector' : 'lector_'+p.id);
function fotoLector(p=perfil()){ const k=claveLector(p); return MIS[k] ? '/mis-imagenes/'+k+'.jpg?v='+MIS[k] : null; }
function fondoLector(p=perfil()){ if(p.fondo==='__nada') return null; if(MIS['fondo_'+p.id] && (!p.fondo || p.fondo==='fondo_'+p.id)) return fotoURL('fondo_'+p.id, true); return p.fondo ? fotoURL(p.fondo, true) : null; }
const avatarHTML = (p, cls='') => { const f=fotoLector(p); return `<span class="av ${cls}" style="--c:${esc(p.color)}">${f?`<img src="${f}" alt="">`:esc(iniciales(p.nombre))}</span>`; };
/* Logo del programa: la foto que la familia pone en Mis imágenes › Mi foto › «Logo del programa» (se guarda en el aparato, no en la web) */
const icLogo = () => MIS.logo ? `<img class="logo-foto" src="/mis-imagenes/logo.jpg?v=${MIS.logo}" alt="">` : ICON.logo;
function pintarLogo(){
  const url = MIS.logo ? '/mis-imagenes/logo.jpg?v='+MIS.logo : null;
  $$('[data-icono="logo"]').forEach(e=>{ e.innerHTML = url ? `<img class="logo-foto" src="${url}" alt="">` : ICON.logo; e.dataset.hecho='1'; e.style.display='inline-flex'; });
  let fav=document.querySelector('link[rel="icon"]'); if(!fav){ fav=document.createElement('link'); fav.rel='icon'; document.head.appendChild(fav); }
  fav.href = url || 'iconos/icono-192.png';
}
function pintarCabecera(){
  pintarLogo();
  const p=perfil(); $('#yoAv').outerHTML = avatarHTML(p).replace('class="av ','id="yoAv" class="av ');
  $('#yoNom').textContent=p.nombre; $('#yoPrueba').hidden=!p.prueba; $('#franjaPrueba').hidden=!p.prueba;
}
const claseTexto = () => (aj.letra==='ligada'?'ligada':'') + (aj.espacio==='amplio'?' amplio':'');
function aplicarLetra(){ document.documentElement.style.setProperty('--tam', (aj.tam||44)+'px'); }

/* ================= CALENDARIO ================= */
const DIA_MS = 864e5;
/* ajustes de un lector: los del que está leyendo viven en «aj»; los de los demás, en su p.cfg */
const cfgDe = p => (p.id===aj.perfil ? aj : (p.cfg || (p.cfg={})));
function hoySinHora(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
function inicioDe(p){ return new Date((cfgDe(p).inicio || CONT.inicio) + 'T00:00:00'); }
function diaHoyDe(p){ const n=Math.round((hoySinHora()-inicioDe(p))/DIA_MS)+1; return Math.max(1, Math.min(365, n)); }
function fechaDiaDe(p, n){ const d=inicioDe(p); d.setDate(d.getDate()+n-1); return d; }
const fechaInicio = () => inicioDe(perfil());
const diaDeHoy = () => diaHoyDe(perfil());
const fechaDia = n => fechaDiaDe(perfil(), n);
function diaDeFecha(d){ return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-fechaInicio())/DIA_MS)+1; }
const fechaLarga = d => d.toLocaleDateString('es-ES',{weekday:'long', day:'numeric', month:'long'});
const fechaCorta = iso => new Date(iso).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
const disponible = h => estaDisponible(h);
const claveDia = d => { const x=new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); };
function iconoEspecial(e){ const t=normalizar(e);
  const M=[['cumple','🎂'],['magosto','🌰'],['samain','🎃'],['nochebuena','🎄'],['navidad','🎄'],['nochevieja','🎆'],['reyes','👑'],['entroido','🎭'],['carnaval','🎭'],['primavera','🌸'],['pascua','🥚'],['libro','📚'],['letras','📚'],['verano','☀️'],['xoan','🔥'],['juan','🔥'],['galicia','🎶'],['vuelta','🎒'],['ultimo','🎒'],['froilan','🎡']];
  for(const [k,v] of M) if(t.includes(k)) return v; return '⭐'; }

/* ================= SESIONES ================= */
function normSesion(s){
  (s.palabras||[]).forEach(p=>{ if(p.e==='costo') p.e='practica'; });
  if(!s.lectorId){ const pf = aj.perfiles.find(p=>p.nombre===s.lector); s.lectorId = pf ? pf.id : aj.perfiles[0].id; }
  if(s.revisada===undefined) s.revisada = true;
  return s;
}
const sesDe = id => SES.filter(s=>s.lectorId===id);
const misSes = () => sesDe(aj.perfil);
/* historias terminadas (las que están a medias, con preguntas pendientes, no cuentan como cromo) */
const leidasDe = id => { const c={}; sesDe(id).forEach(s=>{ if(!s.incompleta && !esComp(s.historiaId)) c[s.historiaId]=(c[s.historiaId]||0)+1; }); return c; };
/* preguntas contestadas de una lectura (en las que están a medias, solo las que ya hizo) */
const preguntasHechas = s => s.incompleta ? (s.preguntas||[]).length : (s.totalPreguntas||0);
const leidas = () => leidasDe(aj.perfil);
async function guardarSesion(s){ s.mod=Date.now(); await postJSON('/api/sesion', s); }

/* ================= SÍLABAS ================= */
const VOCALES='aeiouáéíóúü';
function silabear(pal){
  const w=pal.toLowerCase(); if(w.length<=2) return [pal];
  const inse=['pl','bl','cl','fl','gl','pr','br','cr','dr','fr','gr','tr','ch','ll','rr'];
  const esV=(i)=>{ const c=w[i]; if(!c) return false; if(c==='y') return i===w.length-1 || !VOCALES.includes(w[i+1]||''); if(c==='u' && (w[i-1]==='q' || (w[i-1]==='g' && 'eiéí'.includes(w[i+1]||'')))) return false; return VOCALES.includes(c); };
  const fuerte=c=>'aeoáéíóú'.includes(c);
  const nuc=[]; let i=0;
  while(i<w.length){ if(esV(i)){ let j=i+1; while(j<w.length && esV(j) && !(fuerte(w[j-1]) && fuerte(w[j]))) j++; nuc.push([i,j]); i=j; } else i++; }
  if(nuc.length<2) return [pal];
  const cortes=[];
  for(let k=0;k<nuc.length-1;k++){
    const a=nuc[k][1], b=nuc[k+1][0]; const cons=w.slice(a,b); const n=cons.length; let corte;
    if(n<=1) corte=a; else if(n===2) corte = inse.includes(cons) ? a : a+1; else if(n===3) corte = inse.includes(cons.slice(1)) ? a+1 : a+2; else corte = a+2;
    if(n===2 && ['ch','ll','rr'].includes(cons)) corte=a;
    cortes.push(corte);
  }
  const out=[]; let ini=0; cortes.forEach(c=>{ out.push(pal.slice(ini,c)); ini=c; }); out.push(pal.slice(ini));
  return out.filter(Boolean);
}
/* sílabas visibles de una palabra tal como está escrita (con mayúsculas y signos) */
function silabasVisibles(texto){
  const m = String(texto).match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}]+)([^\p{L}\p{N}]*)$/u);
  if(!m) return [texto];
  const s = silabear(m[2]); s[0]=m[1]+s[0]; s[s.length-1]+=m[3]; return s;
}
const silabasHTML = (pal, sep=' · ') => silabear(pal).map((s,i)=>`<span class="s ${i%2?'b':'a'}">${esc(s)}</span>`).join(`<span class="p">${sep.trim()}</span>`);

/* ================= NAVEGACIÓN ================= */
const PANT = {};
function definir(nombre, o){ PANT[nombre]=Object.assign({zona:'nino', nav:''}, o); }
let actual=null, pinOk=false, volverTrasPin=null;
function ir(p, ...args){
  const d=PANT[p]; if(!d) return;
  if(d.zona==='adulto' && aj.pin && !pinOk){ volverTrasPin=[p,args]; mostrar('pin'); PANT.pin.pintar(); return; }
  if(actual && PANT[actual] && PANT[actual].salir && actual!==p) PANT[actual].salir(p);
  actual=p; mostrar(p);
  $('#menuYo').hidden=true;
  try{ d.pintar && d.pintar(...args); }catch(e){ registrar('Pantalla '+p+': '+e.message); console.error(e); }
  try{ if(typeof actualizarTeleMini==='function') actualizarTeleMini(); }catch(e){}
  iconos(document);
  window.scrollTo(0,0);
}
function mostrar(p){
  const d=PANT[p];
  $('#zonaNino').hidden = d.zona!=='nino';
  $('#zonaAdulto').hidden = d.zona!=='adulto';
  $$('.pantalla').forEach(s=>{ s.hidden = s.id!=='s-'+p; });
  $$('#navNino button').forEach(b=>b.setAttribute('aria-current', b.dataset.nav===d.nav ? 'page' : 'false'));
  $$('.lateral [data-nava]').forEach(b=>b.setAttribute('aria-current', b.dataset.nava===(d.nav||p) ? 'page' : 'false'));
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-ir],[data-nav],[data-nava]');
  if(b){ ir(b.dataset.ir||b.dataset.nav||b.dataset.nava); return; }
  if(!e.target.closest('#menuYo,#yoBtn')) $('#menuYo').hidden=true;
});

/* ================= DIÁLOGOS Y AVISOS ================= */
/* alCerrar: se llama si se cierra con la × o tocando fuera (no con los botones) */
function dialogo({titulo='', html='', botones=[], cerrar=true, cls='', alCerrar=null}){
  const capa=$('#capa'); const v=document.createElement('div'); v.className='velo';
  v.innerHTML=`<div class="dialogo ${cls}" role="dialog" aria-modal="true">${cerrar?`<button class="x" type="button" aria-label="Cerrar">×</button>`:''}${titulo?`<h2>${titulo}</h2>`:''}${html}<div class="dlg-botones" style="display:grid;gap:10px;margin-top:6px"></div></div>`;
  const cont=v.querySelector('.dlg-botones'); const quitar=()=>v.remove();
  botones.forEach(b=>{ const x=document.createElement('button'); x.type='button'; x.className='btn btn-g '+(b.cls||''); x.innerHTML=b.t; x.onclick=()=>{ if(!b.mantener) quitar(); b.fn && b.fn(); }; cont.appendChild(x); });
  const cancelar=()=>{ quitar(); if(alCerrar) alCerrar(); };
  if(cerrar){ v.querySelector('.x').onclick=cancelar; v.addEventListener('click',e=>{ if(e.target===v) cancelar(); }); }
  capa.appendChild(v); iconos(v);
  const p=cont.querySelector('button'); if(p) p.focus();
  return {cerrar:quitar, el:v};
}
function aviso(msg){ const t=document.createElement('div'); t.className='toast'; t.innerHTML=ic('check')+esc(msg); document.body.appendChild(t); setTimeout(()=>t.remove(), 2200); }
function confeti(cont){ const c=document.createElement('div'); c.className='confeti'; const col=['#1E7BF2','#18B47B','#F5B301','#8B5CF6','#E5484D','#5FA4FF'];
  for(let i=0;i<46;i++){ const s=document.createElement('i'); s.style.left=Math.random()*100+'%'; s.style.background=col[i%col.length]; s.style.animationDuration=(1.8+Math.random()*1.8)+'s'; s.style.animationDelay=(Math.random()*.6)+'s'; s.style.transform=`rotate(${Math.random()*180}deg)`; c.appendChild(s); }
  cont.appendChild(c); setTimeout(()=>c.remove(), 4500); }
