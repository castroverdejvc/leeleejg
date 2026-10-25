/* LeeLEEJG · premios: actividades hechas, álbum de criaturas, juegos que se abren y tareas atrasadas.
   Todo se calcula a partir de lo hecho (lecturas, dictados y repasos), así no se descuadra al juntar la tablet y el ordenador. */
'use strict';
/* criatura, juego, sobre, tele, teleExtra, teleTrabajo y peliExtra: reglas de antes del 24/10/2026 (lo ya ganado se queda).
   Desde el 24/10/2026 (estrellas.js): estCriatura, estJuego, sobreDia, sorpresa…, y la tele con tDia, tExtra, tTrabajo, peliExtras y los topes. */
const PREMIOS_DEF = {criatura:2, juego:5, minutos:15, trasLeer:true, tele:10, teleExtra:15, teleRelee:5, teleFicha:5, teleTrabajo:1, sobre:15, restaFallo:0.5, peliExtra:9,
  estCriatura:8, estJuego:30, sobreDia:4, sorpresa:true, sorpresaExtras:2, movilCada:3, movilMax:30, eduMax:4,
  tDia:15, tExtra:10, tRelee:5, tFicha:5, tTrabajo:2, peliExtras:7, teleMaxDia:120, teleMaxSemana:240,
  revista1:45, revista2:75, cajaPeq:500, cajaGrande:1000};
const premiosCfg = () => ({...PREMIOS_DEF, ...(aj.premios||{})});

/* actividades (ejercicios) = lecturas terminadas + dictados + repasos de fichas + rondas de «As letras» */
function actividadesDe(p=perfil()){
  const c=cfgDe(p);
  return sesDe(p.id).filter(s=>!s.incompleta && !esComp(s.historiaId)).length + ['dictadoLog','repasoLog','letrasLog'].reduce((a,k)=>a+(c[k]||[]).length, 0);
}
/* azar con semilla: el orden de las criaturas es distinto para cada niño pero siempre el mismo */
function semilla(txt){ let h=2166136261; for(const ch of String(txt)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function azar(seed){ let a=seed||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function barajarCon(lista, seed){ const r=azar(seed), a=lista.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ---------------- criaturas (inventadas para LeeLEEJG) ---------------- */
const TIPOS_CRIATURA = {
  fuego:{n:'Fuego', c:['#FF7A3D','#FFD7A8'], emo:'🔥', frase:'Calienta las manos en invierno.'},
  agua:{n:'Agua', c:['#2F9BE0','#C7E8FF'], emo:'💧', frase:'Nada más rápido que un delfín.'},
  planta:{n:'Planta', c:['#2FB36B','#CDF3DA'], emo:'🌱', frase:'Hace crecer flores donde pisa.'},
  rayo:{n:'Rayo', c:['#F2C230','#FFF4C2'], emo:'⚡', frase:'Enciende las bombillas con un estornudo.'},
  roca:{n:'Roca', c:['#9C7B67','#E6D7CC'], emo:'🪨', frase:'Duerme la siesta dentro de las montañas.'},
  aire:{n:'Aire', c:['#5CC8F0','#E8F8FF'], emo:'🌬️', frase:'Vuela con las cometas en otoño.'},
  hielo:{n:'Hielo', c:['#7FD6F2','#F1FCFF'], emo:'❄️', frase:'Hace helados con solo soplar.'},
  noche:{n:'Noche', c:['#7262E0','#DDD8FF'], emo:'🌙', frase:'Cuenta las estrellas antes de dormir.'},
  dulce:{n:'Dulce', c:['#FF7FB5','#FFE2EF'], emo:'🍬', frase:'Huele a galletas recién hechas.'},
  metal:{n:'Metal', c:['#7E8EA0','#E2E8EF'], emo:'🔩', frase:'Arregla juguetes rotos con sus tornillos.'}
};
const CRIATURAS = [
  ['chispin','Chispín','fuego',1],['brasita','Brasita','fuego',1],['llamaron','Llamarón','fuego',2],['volcanete','Volcanete','fuego',3],
  ['burbujo','Burbujo','agua',1],['gotina','Gotina','agua',1],['marejo','Marejo','agua',2],['oleajo','Oleajo','agua',3],
  ['hojin','Hojín','planta',1],['brotito','Brotito','planta',1],['musgolo','Musgolo','planta',2],['floribel','Floribel','planta',3],
  ['zumbi','Zumbi','rayo',1],['chisporro','Chisporro','rayo',1],['relampin','Relampín','rayo',2],['tronador','Tronador','rayo',3],
  ['guijarrin','Guijarrín','roca',1],['pedrolo','Pedrolo','roca',1],['rocacho','Rocacho','roca',2],['montanon','Montañón','roca',3],
  ['plumin','Plumín','aire',1],['ventolin','Ventolín','aire',1],['nubecin','Nubecín','aire',2],['remolino','Remolino','aire',3],
  ['escarchin','Escarchín','hielo',1],['copin','Copín','hielo',1],['glacio','Glacio','hielo',2],['polarin','Polarín','hielo',3],
  ['sombrin','Sombrín','noche',1],['lunero','Lunero','noche',1],['murcielin','Murcielín','noche',2],['estrellon','Estrellón','noche',3],
  ['golosin','Golosín','dulce',1],['caramelin','Caramelín','dulce',1],['nubepan','Nubepán','dulce',2],['tartolo','Tartolo','dulce',3],
  ['tuercas','Tuercas','metal',1],['imanin','Imanín','metal',1],['robotin','Robotín','metal',2],['cohetin','Cohetín','metal',3]
].map(([id,nombre,tipo,rareza],i)=>({id,nombre,tipo,rareza,n:i+1}));
/* especiales: se ganan en su temporada (ver temporadas.js) */
const CRIATURAS_ESPECIALES = [
  {id:'calabazin', nombre:'Calabazín', tipo:'fuego', temporada:'samain', extra:'calabaza'},
  {id:'castanin', nombre:'Castañín', tipo:'roca', temporada:'magosto', extra:'castana'},
  {id:'copito', nombre:'Copito', tipo:'hielo', temporada:'navidad', extra:'gorro'},
  {id:'mascarin', nombre:'Mascarín', tipo:'dulce', temporada:'entroido', extra:'antifaz'},
  {id:'florinda', nombre:'Florinda', tipo:'planta', temporada:'primavera', extra:'flores'},
  {id:'huevin', nombre:'Huevín', tipo:'dulce', temporada:'pascua', extra:'huevo'},
  {id:'solete', nombre:'Solete', tipo:'rayo', temporada:'verano', extra:'gafas'},
  {id:'hojarasco', nombre:'Hojarasco', tipo:'planta', temporada:'otono', extra:'hojas'},
  {id:'abracin', nombre:'Abracín', tipo:'dulce', temporada:'dereitos', extra:'corazon'},
  {id:'equipin', nombre:'Equipín', tipo:'metal', temporada:'constitucion', extra:'librito'},
  {id:'coronin', nombre:'Coronín', tipo:'rayo', temporada:'reyes', extra:'corona'},
  {id:'tartin', nombre:'Tartín', tipo:'dulce', temporada:'cumple', extra:'gorrofiesta'},
  {id:'palomin', nombre:'Palomín', tipo:'aire', temporada:'paz', extra:'ramita'},
  {id:'cuentin', nombre:'Cuentín', tipo:'noche', temporada:'libroinfantil', extra:'gafitas'},
  {id:'paginin', nombre:'Paginín', tipo:'planta', temporada:'libro', extra:'rosa'},
  {id:'letrino', nombre:'Letriño', tipo:'roca', temporada:'letras', extra:'pluma'},
  {id:'mochilin', nombre:'Mochilín', tipo:'rayo', temporada:'fincurso', extra:'birrete'},
  {id:'chispin', nombre:'Chispín', tipo:'fuego', temporada:'sanxoan', extra:'chispas'},
  {id:'vieirino', nombre:'Vieiriño', tipo:'agua', temporada:'galicia', extra:'vieira'}
].map((c,i)=>({...c, rareza:3, especial:true, n:CRIATURAS.length+i+1}));
/* 24/10/2026: las fiestas nuevas traen su muñeco en contenido.json (temporadas[].criatura: {id, nombre, tipo, cabeza, lado}) */
let _espCache={ts:null, v:CRIATURAS_ESPECIALES};
function especiales(){ const ts=(typeof CONT!=='undefined' && CONT.temporadas)||[]; if(_espCache.ts===ts) return _espCache.v;
  const extra=ts.filter(t=>t.criatura && !CRIATURAS_ESPECIALES.some(c=>c.temporada===t.id)).map((t,i)=>({id:t.criatura.id, nombre:t.criatura.nombre, tipo:t.criatura.tipo, temporada:t.id, cabeza:t.criatura.cabeza, lado:t.criatura.lado, rareza:3, especial:true, n:CRIATURAS.length+CRIATURAS_ESPECIALES.length+i+1}));
  _espCache={ts, v:CRIATURAS_ESPECIALES.concat(extra)}; return _espCache.v; }
const todasCriaturas = () => CRIATURAS.concat(especiales());
const criatura = id => (typeof criaturaForma==='function' ? criaturaForma(id) : todasCriaturas().find(c=>c.id===id));

/* orden en que las gana cada niño: primero las comunes, al final las raras (barajadas) */
function ordenCriaturas(p){ const s=semilla('criaturas-'+p.id); return [1,2,3].flatMap(r=>barajarCon(CRIATURAS.filter(c=>c.rareza===r), s+r)); }
/* 25/10/2026: lo que ya salió en su álbum no se quita aunque cambien las reglas (p. ej. un iPad con una versión antigua
   que dio muñecos con la regla vieja después del 24/10). Eso queda «de regalo» y los muñecos que gane después son nuevos. */
const munecosRegalo = p => { const r=cfgDe(p).munecosRegalo; return Array.isArray(r) ? r.filter(id=>!!criatura(id)) : []; };
function munecosPorRegla(p, n=munecosHasta(p)){
  const reg=new Set(munecosRegalo(p)), ids=[];
  for(const id of secuenciaMunecos(p)){ if(ids.length>=n) break; if(!reg.has(id)) ids.push(id); }
  return ids;
}
const siguienteMuneco = p => { const reg=new Set(munecosRegalo(p)), ya=new Set(munecosPorRegla(p)); return secuenciaMunecos(p).find(id=>!ya.has(id) && !reg.has(id)) || null; };
function guardarLoYaVisto(p=perfil()){
  const cfg=cfgDe(p), v=cfg.premiosVistos; if(!v || p.prueba) return false;
  let cambio=false;
  if(Array.isArray(v.criaturas)){
    const tengo=new Set(criaturasDe(p)), esp=new Set(especiales().map(c=>c.id));
    const falta=v.criaturas.filter(id=>!tengo.has(id) && !esp.has(id) && !!criatura(id));
    if(falta.length){ cfg.munecosRegalo=[...munecosRegalo(p), ...falta]; cambio=true; }
  }
  const nJ=typeof JUEGOS!=='undefined'?JUEGOS.length:0, faltaJ=Math.min(nJ,+v.juegos||0) - juegosAbiertos(p);
  if(faltaJ>0){ cfg.juegosRegalo=(+cfg.juegosRegalo||0)+faltaJ; cambio=true; }
  if(cambio) guardarAj();
  return cambio;
}
function criaturasDe(p=perfil()){
  const ids=munecosPorRegla(p); munecosRegalo(p).forEach(id=>{ if(!ids.includes(id)) ids.push(id); });
  if(typeof temporadaGanada==='function') especiales().forEach(c=>{ if(temporadaGanada(c.temporada,p)) ids.push(c.id); });
  return ids;
}
const faltanParaCriatura = (p=perfil()) => { const k=Math.max(1,premiosCfg().estCriatura); return k - (estrellasDe(p)%k); };

/* dibujo de cada criatura (SVG hecho por el programa a partir de su nombre) */
function criaturaSVG(c, {silueta=false, cls=''}={}){
  const T=TIPOS_CRIATURA[c.tipo]; const r=azar(semilla(c.base||c.id)); const v=Math.floor(r()*4); const forma=silueta?1:(+c.forma||1);
  const [col, clara]= silueta ? ['#C9D3E2','#C9D3E2'] : T.c; const osc = silueta ? '#B7C3D4' : 'rgba(0,0,0,.18)';
  const cuerpo = [`<ellipse cx="60" cy="74" rx="34" ry="31" fill="${col}"/>`, `<path d="M60 36c22 0 34 22 34 44 0 16-15 26-34 26S26 96 26 80c0-22 12-44 34-44z" fill="${col}"/>`,
    `<ellipse cx="60" cy="72" rx="29" ry="36" fill="${col}"/>`, `<rect x="24" y="44" width="72" height="62" rx="30" fill="${col}"/>`][v];
  const tipoDeco = {
    fuego:`<path d="M60 14c8 10 14 16 10 26 6-4 6-10 6-10 6 10 0 22-16 22s-20-12-14-22c2 6 6 8 6 8-4-10 0-16 8-24z" fill="${silueta?col:'#FFB020'}"/><path d="M60 30c4 6 6 10 3 14-1 3-6 3-7 0-2-4 1-8 4-14z" fill="${silueta?col:'#FFE38A'}"/>`,
    agua:`<path d="M48 44c6-14 18-20 26-22-4 8-4 16 0 24z" fill="${silueta?col:'#1C7CC0'}"/><path d="M98 92c8-2 12 6 6 12-3 3-9 1-9-4 0-3 1-6 3-8z" fill="${silueta?col:'#7CC8FF'}"/>`,
    planta:`<path d="M60 42c-2-12-12-20-24-18 2 12 12 18 24 18z" fill="${silueta?col:'#1E9150'}"/><path d="M60 42c2-14 12-22 26-20-2 14-14 20-26 20z" fill="${silueta?col:'#3CCB78'}"/><path d="M60 42v-6" stroke="${silueta?col:'#1E9150'}" stroke-width="3"/>`,
    rayo:`<path d="M34 50l-8-26 18 16z" fill="${silueta?col:'#E0A800'}"/><path d="M86 50l8-26-18 16z" fill="${silueta?col:'#E0A800'}"/><path d="M94 84l12-6-6 10 10-2-14 14 4-10-8 2z" fill="${silueta?col:'#FFB800'}"/>`,
    roca:`<circle cx="44" cy="86" r="5" fill="${osc}"/><circle cx="80" cy="66" r="4" fill="${osc}"/><circle cx="74" cy="92" r="3" fill="${osc}"/><path d="M50 40l6-12 6 12z M62 40l8-10 4 12z" fill="${silueta?col:'#7A5C4A'}"/>`,
    aire:`<ellipse cx="22" cy="70" rx="10" ry="18" fill="${silueta?col:'#FFFFFF'}" transform="rotate(-20 22 70)"/><ellipse cx="98" cy="70" rx="10" ry="18" fill="${silueta?col:'#FFFFFF'}" transform="rotate(20 98 70)"/><path d="M50 40c4-8 16-8 20 0" stroke="${silueta?col:'#FFFFFF'}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    hielo:`<path d="M42 46l4-18 6 16z M56 42l4-22 6 22z M70 44l6-16 4 18z" fill="${silueta?col:'#E6FBFF'}" stroke="${silueta?col:'#9BE3F5'}" stroke-width="1.5"/>`,
    noche:`<path d="M36 52l-6-28 20 18z" fill="${silueta?col:'#4E3FB8'}"/><path d="M84 52l6-28-20 18z" fill="${silueta?col:'#4E3FB8'}"/><path d="M66 90a8 8 0 1 1-6-12 6 6 0 0 0 6 12z" fill="${silueta?col:'#FFE680'}"/>`,
    dulce:`<circle cx="60" cy="34" r="7" fill="${silueta?col:'#E5484D'}"/><path d="M60 27c2-6 6-8 10-8" stroke="${silueta?col:'#2FB36B'}" stroke-width="2" fill="none"/>${silueta?'':'<rect x="42" y="60" width="6" height="2.5" rx="1" fill="#FFD166" transform="rotate(30 45 61)"/><rect x="74" y="58" width="6" height="2.5" rx="1" fill="#6FD3FF" transform="rotate(-20 77 59)"/><rect x="50" y="96" width="6" height="2.5" rx="1" fill="#9B8CF5"/>'}`,
    metal:`<path d="M60 40V24" stroke="${silueta?col:'#5F6E80'}" stroke-width="3"/><circle cx="60" cy="22" r="5" fill="${silueta?col:'#E5484D'}"/><circle cx="34" cy="74" r="3.5" fill="${osc}"/><circle cx="86" cy="74" r="3.5" fill="${osc}"/>`
  }[c.tipo]||'';
  const extra = silueta ? '' : ({
    calabaza:'<path d="M40 40c0-10 40-10 40 0 0 8-40 8-40 0z" fill="#FF8A1F"/><path d="M58 30h4v-8h-4z" fill="#2E7D32"/>',
    castana:'<path d="M38 44c4-16 40-16 44 0z" fill="#7A4A2A"/><path d="M40 44h40" stroke="#5A3418" stroke-width="3"/>',
    gorro:'<path d="M36 46c4-18 30-26 48-10l-48 10z" fill="#E5484D"/><circle cx="86" cy="34" r="6" fill="#fff"/><rect x="34" y="42" width="52" height="8" rx="4" fill="#fff"/>',
    antifaz:'<path d="M34 62c8-8 20-6 26 0 6-6 18-8 26 0-2 10-14 12-20 6h-12c-6 6-18 4-20-6z" fill="#8B5CF6" opacity=".85"/>',
    flores:'<circle cx="42" cy="42" r="6" fill="#FF7FB5"/><circle cx="60" cy="36" r="6" fill="#FFD166"/><circle cx="78" cy="42" r="6" fill="#9B8CF5"/>',
    huevo:'<path d="M30 92c4 14 56 14 60 0l-8 6-8-6-8 6-8-6-8 6-8-6-8 6z" fill="#FFF3D6" stroke="#E9C46A" stroke-width="1.5"/>',
    gafas:'<rect x="38" y="58" width="18" height="12" rx="5" fill="#1F2937"/><rect x="64" y="58" width="18" height="12" rx="5" fill="#1F2937"/><path d="M56 63h8" stroke="#1F2937" stroke-width="3"/>',
    hojas:'<path d="M40 44c-8-8-6-18 4-18 0 8 2 12-4 18z" fill="#E67E22"/><path d="M80 44c8-8 6-18-4-18 0 8-2 12 4 18z" fill="#C0392B"/><path d="M60 38c-6-10 0-18 8-16-2 8-2 12-8 16z" fill="#F1C40F"/>',
    corazon:'<path d="M60 98c-10-7-14-11-14-16a6 6 0 0 1 14-3 6 6 0 0 1 14 3c0 5-4 9-14 16z" fill="#E5484D"/>',
    librito:'<rect x="46" y="84" width="28" height="18" rx="2" fill="#2563EB"/><path d="M60 84v18" stroke="#fff" stroke-width="2"/><path d="M49 89h8M49 94h8M63 89h8M63 94h8" stroke="#BFDBFE" stroke-width="1.5"/>',
    corona:'<path d="M40 44l4-16 8 9 8-12 8 12 8-9 4 16z" fill="#F5B301" stroke="#B7791F" stroke-width="1.5"/><circle cx="60" cy="27" r="2.5" fill="#E5484D"/><circle cx="46" cy="38" r="2" fill="#1E7BF2"/><circle cx="74" cy="38" r="2" fill="#2FB36B"/>',
    gorrofiesta:'<path d="M48 44l12-28 12 28z" fill="#EC4899"/><path d="M52 36h16M55 28h10" stroke="#FFD166" stroke-width="3"/><circle cx="60" cy="16" r="4" fill="#FFD166"/>',
    ramita:'<path d="M78 72c10-6 18-6 24-2" stroke="#4D7C0F" stroke-width="2.5" fill="none"/><ellipse cx="86" cy="65" rx="4.5" ry="2.2" fill="#65A30D" transform="rotate(-30 86 65)"/><ellipse cx="94" cy="65" rx="4.5" ry="2.2" fill="#65A30D" transform="rotate(20 94 65)"/><ellipse cx="100" cy="68" rx="4.5" ry="2.2" fill="#65A30D"/>',
    gafitas:'<circle cx="46" cy="64" r="8.5" fill="none" stroke="#1F2937" stroke-width="2.5"/><circle cx="74" cy="64" r="8.5" fill="none" stroke="#1F2937" stroke-width="2.5"/><path d="M54.5 64h11" stroke="#1F2937" stroke-width="2.5"/>',
    rosa:'<path d="M84 51l3 12" stroke="#15803D" stroke-width="2"/><circle cx="84" cy="44" r="7" fill="#DC2626"/><path d="M80 44a4 4 0 0 1 8 0M82 41a2 2 0 0 1 4 0" stroke="#7F1D1D" stroke-width="1.5" fill="none"/>',
    pluma:'<path d="M82 54C88 36 97 25 104 20c-2 11-8 23-19 34z" fill="#F8FAFC" stroke="#0284C7" stroke-width="1.5"/><path d="M84 52l14-26" stroke="#0284C7" stroke-width="1"/>',
    birrete:'<path d="M34 36l26-10 26 10-26 10z" fill="#1F2937"/><rect x="47" y="38" width="26" height="8" fill="#1F2937"/><path d="M84 36v12" stroke="#F5B301" stroke-width="2"/><circle cx="84" cy="49" r="2.2" fill="#F5B301"/>',
    chispas:'<path d="M22 40l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#FFD166"/><path d="M96 28l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#FF9F43"/><circle cx="100" cy="56" r="2.5" fill="#FFD166"/>',
    vieira:'<path d="M48 98a12 12 0 0 1 24 0z" fill="#FDE68A" stroke="#B45309" stroke-width="1.5"/><path d="M60 86v12M54 88l2.5 10M66 88l-2.5 10" stroke="#B45309" stroke-width="1"/>'
  })[c.extra]||'';
  const emoAdorno = silueta ? '' : (c.cabeza?`<text x="60" y="38" text-anchor="middle" font-size="28">${c.cabeza}</text>`:'') + (c.lado?`<text x="98" y="104" text-anchor="middle" font-size="22">${c.lado}</text>`:'');
  const ojosY = v===3 ? 66 : 64; const sep = v===2 ? 12 : 14;
  const cara = silueta ? `<text x="60" y="84" text-anchor="middle" font-size="30" font-weight="900" fill="#fff" font-family="Nunito,system-ui">?</text>` : `
    <ellipse cx="60" cy="88" rx="${v===2?18:22}" ry="15" fill="${clara}"/>
    <circle cx="${60-sep}" cy="${ojosY}" r="9" fill="#fff"/><circle cx="${60+sep}" cy="${ojosY}" r="9" fill="#fff"/>
    <circle cx="${60-sep+1}" cy="${ojosY+1}" r="5" fill="#1F2937"/><circle cx="${60+sep+1}" cy="${ojosY+1}" r="5" fill="#1F2937"/>
    <circle cx="${60-sep+3}" cy="${ojosY-2}" r="1.8" fill="#fff"/><circle cx="${60+sep+3}" cy="${ojosY-2}" r="1.8" fill="#fff"/>
    <circle cx="${60-sep-8}" cy="${ojosY+12}" r="4" fill="#FF8FA3" opacity=".7"/><circle cx="${60+sep+8}" cy="${ojosY+12}" r="4" fill="#FF8FA3" opacity=".7"/>
    <path d="M52 80q8 ${v===1?9:7} 16 0" stroke="#1F2937" stroke-width="2.6" fill="none" stroke-linecap="round"/>${v===0?'<rect x="58" y="81" width="4" height="4" rx="1" fill="#fff"/>':''}`;
  const brillo = (!silueta && c.rareza===3) ? '<path d="M14 24l2 6 6 2-6 2-2 6-2-6-6-2 6-2z M104 18l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="#FFC83D"/>' : '';
  const pies = `<ellipse cx="45" cy="106" rx="9" ry="5" fill="${silueta?col:osc}"/><ellipse cx="75" cy="106" rx="9" ry="5" fill="${silueta?col:osc}"/>`;
  const tono = silueta ? '' : ` style="filter:hue-rotate(${Math.round((r()-.5)*36)}deg) saturate(${(1+(c.rareza-1)*.12).toFixed(2)}) brightness(${(1.06-(c.rareza-1)*.05).toFixed(2)})"`;
  /* evoluciones (24/10/2026): la 2.ª forma lleva un aura y alas; la 3.ª, además, corona y estrellas */
  const aura = forma>1 ? `<circle cx="60" cy="68" r="${forma===3?57:52}" fill="${clara}" opacity=".75"/><circle cx="60" cy="68" r="${forma===3?57:52}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="${forma===3?'2 5':'6 6'}" opacity=".8"/>` : '';
  const alas = forma>1 ? `<path d="M28 70C10 58 6 40 12 30c8 10 14 22 22 30z" fill="${col}" opacity=".85"/><path d="M92 70c18-12 22-30 16-40-8 10-14 22-22 30z" fill="${col}" opacity=".85"/>` : '';
  const mega = forma===3 ? `<path d="M44 34l4-14 7 8 5-12 5 12 7-8 4 14z" fill="#FFC83D" stroke="#B7791F" stroke-width="1.4"/><circle cx="60" cy="18" r="2.6" fill="#E5484D"/><path d="M10 96l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M108 92l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M100 12l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#FFC83D"/>` : '';
  return `<svg class="criatura ${cls}${forma>1?' forma'+forma:''}" viewBox="0 0 120 120" aria-hidden="true"${tono}>${aura}${brillo}${alas}${pies}${tipoDeco}${cuerpo}${cara}${extra}${emoAdorno}${mega}</svg>`;
}

/* ---------------- juegos que se abren ---------------- */
const juegosAbiertos = (p=perfil()) => typeof JUEGOS==='undefined' ? 0 : Math.min(JUEGOS.length, juegosHasta(p) + Math.max(0, +cfgDe(p).juegosRegalo||0));
const faltanParaJuego = (p=perfil()) => { const k=Math.max(1,premiosCfg().estJuego); if(typeof JUEGOS!=='undefined' && juegosAbiertos(p)>=JUEGOS.length) return null; return k - (estrellasDe(p)%k); };

/* ---------------- tareas atrasadas ---------------- */
function atrasadasDe(p=perfil()){
  const P=planDe(p), c=leidasDe(p.id), hoy=diaHoyDe(p), out=[];
  for(let d=hoy-1; d>=1; d--){ const h=P.dias[d]; if(h && !c[h.id]) out.push({dia:d, h}); }
  return out;
}
function atrasadasHTML(){
  const at=atrasadasDe(); if(!at.length) return '';
  return `<div class="card atrasadas"><span class="emo-g">⏰</span><div class="tx"><b>${at.length===1?'Tienes 1 historia atrasada':'Tienes '+at.length+' historias atrasadas'}</b><span class="nota">Son de días que ya pasaron. ¡Vamos a por ellas!</span>
    <div class="lista-atr">${at.slice(0,3).map(a=>`<button class="btn btn-mini" type="button" data-atr="${a.h.id}"><span class="mini-ft">${imgHTML(a.h.portada)}</span>Día ${a.dia} · ${esc(conNombre(a.h.titulo))}</button>`).join('')}${at.length>3?`<button class="btn btn-mini" type="button" data-ir="calendario">Ver las ${at.length}</button>`:''}</div></div></div>`;
}
function activarAtrasadas(raiz){
  $$('[data-atr]', raiz).forEach(b=>b.onclick=()=>empezarHistoria(historia(b.dataset.atr)));
  const at=atrasadasDe(); if(!at.length) return;
  const cfg=cfgDe(perfil()), hoy=claveDia(new Date());
  if(cfg.recordatorio!==hoy){ cfg.recordatorio=hoy; guardarAj();
    setTimeout(()=>{ if(actual==='inicio') decir(`${nombre()}, tienes ${at.length===1?'una historia atrasada':at.length+' historias atrasadas'}. ¡Vamos a hacerla${at.length===1?'':'s'}!`); }, 900); }
}

/* ---------------- barra de premios en Inicio ---------------- */
function premiosHTML(){
  if(typeof estrellasHTML==='function') return estrellasHTML();
  const p=perfil(), cfg=premiosCfg(); const fc=faltanParaCriatura(p), fj=faltanParaJuego(p);
  const pc=Math.round(100*(cfg.criatura-fc)/cfg.criatura), pj = fj==null ? 100 : Math.round(100*(cfg.juego-fj)/cfg.juego);
  return `<div class="card premios"><div class="premio" data-ir="criaturas"><span class="emo-g">🐾</span><div class="tx"><b>Próxima criatura</b><span class="nota">${fc===1?'¡Te falta 1 actividad!':'Te faltan '+fc+' actividades'}</span><span class="barra-t"><i style="width:${pc}%;background:#8B5CF6"></i></span></div></div>
    <div class="premio" data-ir="juegos"><span class="emo-g">🎮</span><div class="tx"><b>${fj==null?'¡Tienes todos los juegos!':'Próximo juego'}</b><span class="nota">${fj==null?'Juega un ratito cuando acabes.':fj===1?'¡Te falta 1 actividad!':'Te faltan '+fj+' actividades'}</span><span class="barra-t"><i style="width:${pj}%;background:#F5A300"></i></span></div></div></div>`;
}

/* ---------------- celebrar lo nuevo ---------------- */
function comprobarPremios(){
  try{ guardarLoYaVisto(perfil()); }catch(e){}
  // las pruebas automáticas antiguas no esperan este aviso
  if((typeof EST!=='undefined' && EST && EST.sinPremiosAuto)){ return; } try{ if(localStorage.getItem('leeleejgSinPremios')) return; }catch(e){}
  const p=perfil(); const cfg=cfgDe(p); const vistos=cfg.premiosVistos || null;
  const tengo=criaturasDe(p), juegos=juegosAbiertos(p);
  const primera=!vistos;   // primera vez: se le regala todo lo que ya se ha ganado con lo leído hasta ahora
  const v=vistos||{criaturas:[], juegos:1};
  const nuevas=tengo.filter(id=>!v.criaturas.includes(id)).map(criatura).filter(Boolean);
  const juegoNuevo = juegos>v.juegos && typeof JUEGOS!=='undefined' ? JUEGOS[juegos-1] : null; const masJuegos=juegos-v.juegos;
  avisarTele(p);
  const so=sobresDe(p), sobreNuevo = so.activo && v.sobres!=null && so.ganados>v.sobres;
  if(so.activo && v.sobres==null && vistos){ cfg.premiosVistos={...v, sobres:so.ganados}; guardarAj(); }
  if(sobreNuevo && !nuevas.length && !juegoNuevo){ cfg.premiosVistos={...v, sobres:so.ganados}; guardarAj();
    const d=dialogo({titulo:'¡Un sobre de cartas!', html:`<div class="nuevo-juego"><span class="emo-g">🎴</span><div><b>¡Has ganado un sobre de cartas de verdad!</b><span class="nota">Pídeselo a papá o a mamá.</span></div></div>`, cls:'dlg-premio', botones:[{t:'¡Genial!', cls:'btn-p'}]});
    sonido('cromo'); confeti(d.el.querySelector('.dialogo')||document.body); decir(`¡${nombre()}, has ganado un sobre de cartas! Pídeselo a papá o a mamá.`); return; }
  if(!nuevas.length && !juegoNuevo) return;
  cfg.premiosVistos={criaturas:tengo, juegos, ...(so.activo?{sobres:so.ganados}:{})}; guardarAj();
  const html = (primera?`<p class="sub" style="margin-bottom:6px">¡Por todo lo que ya has leído${nuevas.length?`, tienes ${nuevas.length===1?'una criatura':nuevas.length+' criaturas'}`:''}${masJuegos>0?` y ${masJuegos===1?'un juego nuevo':masJuegos+' juegos nuevos'}`:''}!</p>`:'') + (nuevas.length?`<div class="nuevas-cri">${nuevas.slice(0,3).map(c=>`<div class="cri-carta ${c.rareza===3?'rara':''}">${criaturaSVG(c)}<b>${esc(c.nombre)}</b><span class="nota">${TIPOS_CRIATURA[c.tipo].emo} ${TIPOS_CRIATURA[c.tipo].n}${c.especial?' · ¡especial!':''}</span></div>`).join('')}</div>${nuevas.length>3?`<p class="nota">…y ${nuevas.length-3} más en tu álbum.</p>`:''}`:'')
    + (sobreNuevo?`<div class="nuevo-juego"><span class="emo-g">🎴</span><div><b>¡Y un sobre de cartas de verdad!</b><span class="nota">Pídeselo a papá o a mamá.</span></div></div>`:'')
    + (juegoNuevo?`<div class="nuevo-juego"><span class="emo-g">${juegoNuevo.emo}</span><div><b>${masJuegos>1?`¡${masJuegos} juegos nuevos!`:`¡Nuevo juego: ${esc(juegoNuevo.nombre)}!`}</b><span class="nota">Lo tienes en Juegos.</span></div></div>`:'');
  const soloEvo = nuevas.length && nuevas.every(c=>c.forma>1);
  const d=dialogo({titulo: primera ? `¡Sorpresa, ${esc(nombre())}!` : soloEvo ? (nuevas.length===1?`¡${esc(nuevas[0].nombre.replace(/^(Súper|Mega) /,''))} ha evolucionado!`:'¡Evoluciones!') : nuevas.length ? (nuevas.length===1?'¡Nuevo muñeco!':'¡Nuevos muñecos!') : '¡Nuevo juego!', html, cls:'dlg-premio',
    botones:[...(nuevas.length?[{t:'Ver mi álbum de muñecos', cls:'btn-p', fn:()=>ir('criaturas')}]:[]), ...(juegoNuevo?[{t:'Ir a los juegos', cls:nuevas.length?'btn':'btn-p', fn:()=>ir('juegos')}]:[]), {t:'¡Genial!', cls:'btn'}]});
  sonido('cromo'); confeti(d.el.querySelector('.dialogo')||document.body);
  if(primera) decir(`¡Sorpresa, ${nombre()}! Por todo lo que ya has leído tienes premios: criaturas y juegos.`); else
  decir(nuevas.length ? (soloEvo && nuevas.length===1 ? `¡Mira! ${nuevas[0].nombre.replace(/^(Súper|Mega) /,'')} ha evolucionado. ¡Ahora es ${nuevas[0].nombre}!` : `¡Has conseguido ${nuevas.length===1?'a '+nuevas[0].nombre:nuevas.length+' muñecos nuevos'}!`) + (juegoNuevo?' ¡Y un juego nuevo!':'') : `¡Nuevo juego: ${juegoNuevo.nombre}!`);
}

/* ---------------- álbum de criaturas ---------------- */
definir('criaturas', {nav:'cromos', pintar(){
  try{ guardarLoYaVisto(perfil()); }catch(e){}
  const p=perfil(), tengo=new Set(criaturasDe(p)); const base=CRIATURAS.filter(c=>tengo.has(c.id)).length; const fc=faltanParaCriatura(p), kc=Math.max(1,+premiosCfg().estCriatura);
  const evos=[...tengo].filter(id=>/@[23]$/.test(id)).length;
  const formaDe = c => tengo.has(c.id+'@3')?3:tengo.has(c.id+'@2')?2:1;
  const puntos = f => `<span class="formas">${[1,2,3].map(i=>`<i class="${i<=f?'si':''}"></i>`).join('')}</span>`;
  $('#s-criaturas').innerHTML = `${albumTabsHTML('criaturas')}
  <div class="album-cab"><div><h1 class="tit">Álbum de muñecos</h1><p class="sub">Cada ${kc} ⭐ ganas un muñeco: uno nuevo o la evolución de uno que ya tienes (Súper y Mega).</p></div>
    <div class="contador">🐾<div><b>${base} de ${CRIATURAS.length}</b><br><span>${evos} ${evos===1?'evolución':'evoluciones'} de ${CRIATURAS.length*2}</span></div></div></div>
  <div class="card album-prog"><span class="emo-g">🎁</span><div class="tx"><b>${fc===1?'¡Te falta 1 ⭐ para el próximo!':'Te faltan '+fc+' ⭐ para el próximo'}</b><span class="barra-t"><i style="width:${Math.round(100*(kc-fc)/kc)}%;background:#8B5CF6"></i></span></div></div>
  <div class="cri-grid">${CRIATURAS.map(c=>tengo.has(c.id)
    ? (()=>{ const f=formaDe(c), cf=criatura(f>1?c.id+'@'+f:c.id); return `<button type="button" class="cri-hueco tengo ${c.rareza===3||f===3?'rara':''}" data-cri="${c.id}"><span class="num">${c.n}</span>${criaturaSVG(cf)}<b>${esc(cf.nombre)}</b>${puntos(f)}</button>`; })()
    : `<div class="cri-hueco"><span class="num">${c.n}</span>${criaturaSVG(c,{silueta:true})}<b class="nota">¿?</b></div>`).join('')}</div>
  <h2 class="sub-album">Muñecos especiales de fiesta</h2><p class="nota">Solo se consiguen en su fiesta: lee las historias especiales de esos días.</p>
  <div class="cri-grid">${especiales().map(c=>tengo.has(c.id)
    ? `<button type="button" class="cri-hueco tengo rara" data-cri="${c.id}"><span class="num">★</span>${criaturaSVG(c)}<b>${esc(c.nombre)}</b></button>`
    : `<div class="cri-hueco esp"><span class="num">★</span>${criaturaSVG(c,{silueta:true})}<b class="nota">${esc(typeof nombreTemporada==='function'?nombreTemporada(c.temporada):'')}</b></div>`).join('')}</div>`;
  activarAlbumTabs();
  $$('#s-criaturas [data-cri]').forEach(b=>b.onclick=()=>{ const c=criatura(b.dataset.cri), T=TIPOS_CRIATURA[c.tipo];
    const fs=[1,2,3].filter(i=>i===1||tengo.has(c.id+'@'+i)).map(i=>criatura(i>1?c.id+'@'+i:c.id)); const ult=fs[fs.length-1];
    const falta = c.especial ? '' : fs.length<3 ? `<p class="nota">${fs.length===1?`Cuando evolucione será ${esc(FORMAS[2].pre)} ${esc(c.nombre)}.`:`Todavía le queda ser ${esc(FORMAS[3].pre)} ${esc(c.nombre)}.`}</p>` : '<p class="nota">¡Ya tiene todas sus formas!</p>';
    dialogo({cls:'dlg-premio', html:`<div class="cri-formas">${fs.map(x=>`<div class="cri-carta ${c.rareza===3||x.forma===3?'rara':''}">${criaturaSVG(x)}<b>${esc(x.nombre)}</b></div>`).join('<span class="flecha-evo">➜</span>')}</div><span class="nota">${T.emo} Tipo ${T.n} · ${'★'.repeat(c.rareza)}</span><p class="nota">${esc(T.frase)}</p>${falta}`, botones:[{t:'Cerrar', cls:'btn-p'}]});
    decir(`${ult.nombre}. Tipo ${T.n.toLowerCase()}. ${T.frase}`); });
}});
/* pestañas de los dos álbumes */
function albumTabsHTML(act){ return `<div class="album-tabs"><button type="button" data-alb="cromos" aria-pressed="${act==='cromos'}">📚 Cromos de lecturas</button><button type="button" data-alb="cromosextra" aria-pressed="${act==='cromosextra'}">📚 Cromos de extras</button><button type="button" data-alb="criaturas" aria-pressed="${act==='criaturas'}">🐾 Muñecos</button><button type="button" data-alb="pegatinas" aria-pressed="${act==='pegatinas'}">📅 Álbum del año</button><button type="button" data-alb="pasaporte" aria-pressed="${act==='pasaporte'}">🛂 Pasaporte</button><button type="button" data-alb="juegos">🎮 Juegos</button></div>`; }
function activarAlbumTabs(){ $$('[data-alb]').forEach(b=>b.onclick=()=>ir(b.dataset.alb)); }

/* ---------------- familia: resumen de la semana y ajustes de premios ---------------- */
function semanaHTML(p){
  const cfg=cfgDe(p), hoy=hoySinHora(), desde=new Date(hoy); desde.setDate(desde.getDate()-6);
  const enSemana = f => new Date(f) >= desde;
  const ses=sesDe(p.id).filter(s=>enSemana(s.fecha)), hechas=ses.filter(s=>!s.incompleta);
  const dias=[...Array(7)].map((_,i)=>{ const d=new Date(desde); d.setDate(d.getDate()+i); const k=claveDia(d); return {d, k, lee:hechas.filter(s=>claveDia(s.fecha)===k).length, juego:Math.round(((cfg.juegoDias||{})[k]||0)/60)}; });
  const dic=(cfg.dictadoLog||[]).filter(x=>enSemana(x.f)), rep=(cfg.repasoLog||[]).filter(x=>enSemana(x.f)).concat((cfg.letrasLog||[]).filter(x=>enSemana(x.f)));
  const gus=(cfg.gustosLog||[]).filter(x=>enSemana(x.f)), adi=(cfg.adivLog||[]).filter(x=>enSemana(x.f));
  const comp=media(hechas.map(pctComp)), ppm=media(hechas.map(s=>s.ppm||0).filter(Boolean));
  const at=atrasadasDe(p), tot=actividadesDe(p), cri=criaturasDe(p).length, jue=juegosAbiertos(p);
  const pal={}; hechas.forEach(s=>(s.palabras||[]).forEach(w=>{ if(w.e==='ayuda'||w.e==='practica') pal[w.p]=(pal[w.p]||0)+1; }));
  const dif=Object.entries(pal).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const ult={}; gus.forEach(x=>{ ult[x.q]=x.r; });
  const cifra=(n,t,col='var(--primary)')=>`<div class="card cifra-s"><b style="color:${col}">${n}</b><span class="nota">${t}</span></div>`;
  return `<p class="nota" style="margin:4px 0 12px">Del ${esc(desde.toLocaleDateString('es-ES',{day:'numeric',month:'long'}))} a hoy.</p>
  <div class="cifras-s">${cifra(hechas.length, hechas.length===1?'lectura terminada':'lecturas terminadas')}${cifra(dias.filter(d=>d.lee).length+' de 7','días con lectura','var(--green)')}${cifra(comp==null||isNaN(comp)?'–':Math.round(comp)+' %','comprensión','#8B5CF6')}${cifra(ppm?Math.round(ppm):'–','palabras por minuto','#F5A300')}${cifra(dic.length+rep.length,'dictados y repasos','#0EA5B7')}${cifra(dias.reduce((a,d)=>a+d.juego,0)+' min','de juegos','#DB2777')}${teleActiva()?cifra(minTxt(teleDe(p).ganados).replace(' minutos',' min'),'de tele esta semana','#0F766E'):''}${cifra(peliculaDe(p).hechos+' de '+peliculaDe(p).total,'lecturas para la película','#7C3AED')}${cifra(ses.filter(s=>!s.incompleta && esComp(s.historiaId)).length,'lecturas extra','#0369A1')}${cifra((cfg.letrasLog||[]).filter(x=>enSemana(x.f)).length,'rondas de «As letras»','#B45309')}</div>
  <div class="graf-2" style="margin-top:18px"><div class="card bloque"><h3 style="margin-bottom:10px">Día a día</h3><table><thead><tr><th>Día</th><th>Lecturas</th><th>Juegos</th></tr></thead><tbody>${dias.map(d=>`<tr><td>${esc(d.d.toLocaleDateString('es-ES',{weekday:'long', day:'numeric'}))}</td><td>${d.lee?'<span class="nb bien">'+d.lee+'</span>':'<span class="nb medio">0</span>'}</td><td>${d.juego?d.juego+' min':'–'}</td></tr>`).join('')}</tbody></table></div>
    <div class="card bloque"><h3 style="margin-bottom:10px">Para tener en cuenta</h3><ul class="lista-log">
      <li>${at.length?`<b>${at.length} ${at.length===1?'historia atrasada':'historias atrasadas'}</b> (se le recuerdan al entrar).`:'Ninguna historia atrasada. ¡Al día!'}</li>
      <li>${dif.length?'Palabras en las que pidió ayuda: '+dif.map(([w,n])=>`<b>${esc(w)}</b>${n>1?' ×'+n:''}`).join(', '):'Esta semana no ha pedido ayuda con ninguna palabra.'}</li>
      <li>Premios: ${cri} ${cri===1?'criatura':'criaturas'} y ${jue} de ${typeof JUEGOS!=='undefined'?JUEGOS.length:'?'} juegos abiertos (${tot} actividades en total).</li>
      <li>${gus.length?'Lo que ha contado de sí mismo: '+Object.entries(ult).map(([q,r])=>{ const g=(typeof GUSTOS!=='undefined'?GUSTOS:[]).find(x=>x.id===q); return `${esc(g?g.q.replace(/[¿?]/g,''):q)}: <b>${esc(r)}</b>`; }).join(' · '):'Esta semana no ha contestado preguntas sobre sus gustos.'}</li>
      <li>${adi.length?`${adi.length} adivinanzas (${adi.filter(x=>x.intentos===1).length} a la primera).`:'Ninguna adivinanza esta semana.'}</li></ul></div></div>`;
}
function premiosAdultoHTML(p){
  const c=premiosCfg(), sel=(id,vals,v,suf)=>`<select id="${id}">${vals.map(x=>`<option value="${x}" ${x===v?'selected':''}>${x===0?'Sin límite':x+suf}</option>`).join('')}</select>`;
  return teleAdultoHTML(p) + `<div class="card bloque" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Premios y juegos</h3><p class="nota" style="margin-bottom:12px">Para toda la familia. Desde el 24 de octubre todo suma estrellas: lectura del día ⭐⭐⭐, lectura extra nueva o historia nueva ⭐⭐, volver a leer ⭐, ficha, dictado, «As letras» o trabajo ⭐ (⭐⭐ con un 80 % bien o más) y cada ronda de «Aprender jugando» ⭐ (con tope al día). ${esc(p.nombre)} lleva <b>${estrellasDe(p)} ⭐</b>: ${criaturasDe(p).length} muñecos (con evoluciones y especiales) y ${juegosAbiertos(p)} juegos. Lo ganado antes del 24 de octubre se queda.</p>
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">
      <div class="campo"><label for="prMin">Minutos de juego al día</label>${sel('prMin',[5,10,15,20,30,45,60,0],c.minutos,' minutos')}</div>
      <div class="campo"><b>Antes de jugar</b><div class="interruptor"><span>Tiene que leer la historia del día</span><button type="button" class="switch" id="prLeer" role="switch" aria-checked="${!!c.trasLeer}"></button></div></div>
      <div class="campo"><label for="prSobreDia">🎴 Sobre del día: lectura del día y</label><select id="prSobreDia">${[0,2,3,4,5,6].map(x=>`<option value="${x}" ${x===+c.sobreDia?'selected':''}>${x?x+' lecturas extra':'Sin sobre del día'}</option>`).join('')}</select></div>
      <div class="campo"><b>🎁 Días sorpresa (1 o 2 por semana)</b><div class="interruptor"><span>Con ${c.sorpresaExtras} extras, sobre</span><button type="button" class="switch" id="prSorpresa" role="switch" aria-checked="${!!c.sorpresa}"></button></div></div>
      <div class="campo"><label for="prEstCri">🐾 Un muñeco cada</label>${sel('prEstCri',[5,6,8,10,12],+c.estCriatura,' ⭐')}</div>
      <div class="campo"><label for="prEstJue">🎮 Un juego nuevo cada</label>${sel('prEstJue',[15,20,30,40,50],+c.estJuego,' ⭐')}</div>
      <div class="campo"><label for="prMovil">📱 Móvil: 1 minuto cada</label>${sel('prMovil',[2,3,4,5],+c.movilCada,' ⭐')}</div>
      <div class="campo"><label for="prMovilMax">📱 Móvil como mucho (fin de semana)</label><select id="prMovilMax">${[0,15,20,30,45,60].map(x=>`<option value="${x}" ${x===+c.movilMax?'selected':''}>${x?x+' minutos':'Sin móvil'}</option>`).join('')}</select></div>
      <div class="campo"><label for="prEduMax">🧩 «Aprender jugando»: como mucho al día</label>${sel('prEduMax',[0,2,4,6,8],+c.eduMax,' ⭐').replace('>Sin límite<','>No dan ⭐<')}</div></div>
    ${sobresAdultoHTML(p)}</div>${typeof metasAdultoHTML==='function'?metasAdultoHTML(p):''}<div>
    <p class="nota" style="margin-top:8px">El usuario de pruebas no tiene límite de tiempo.</p></div>`;
}
function activarPremiosAdulto(){
  const sw=id=>$(id).getAttribute('aria-checked')==='true';
  const guarda=()=>{ aj.premios={...(aj.premios||{}), minutos:+$('#prMin').value, trasLeer:sw('#prLeer'), sobreDia:+$('#prSobreDia').value, sorpresa:sw('#prSorpresa'), estCriatura:+$('#prEstCri').value, estJuego:+$('#prEstJue').value, movilCada:+$('#prMovil').value, movilMax:+$('#prMovilMax').value, eduMax:+$('#prEduMax').value}; delete aj.premios.teleGuarda; guardarAj(); aviso('Guardado'); };
  ['#prMin','#prSobreDia','#prEstCri','#prEstJue','#prMovil','#prMovilMax','#prEduMax'].forEach(s=>$(s).onchange=guarda);
  ['#prLeer','#prSorpresa'].forEach(id=>$(id).onclick=()=>{ const b=$(id); b.setAttribute('aria-checked', String(b.getAttribute('aria-checked')!=='true')); guarda(); });
  activarTeleAdulto(lectorVisto()); activarSobresAdulto(lectorVisto()); if(typeof activarMetasAdulto==='function') activarMetasAdulto(lectorVisto());
}

/* ---------------- sobres de cartas (premio de verdad: la familia da un sobre de cartas) ---------------- */
/* 24/10/2026: antes, uno cada 15 actividades; desde ese día, el «sobre del día» (lectura del día + 4 extras; días sorpresa, 2) */
function sobresHasta(p, t=null){
  const k=+premiosCfg().sobre||0, lim=t?Math.min(+new Date(t), +CORTE_PREMIOS):+CORTE_PREMIOS;
  return (k ? Math.floor(actividadesHasta(p, lim)/k) : 0) + diasConSobre(p, t).length;
}
function sobresDe(p=perfil()){
  const cfg=premiosCfg(); const activo=(+cfg.sobreDia>0 || cfg.sorpresa) && !p.prueba;
  if(!activo) return {activo:false, ganados:0, dados:0, pend:0, faltan:null};
  const ganados=sobresHasta(p), dados=(cfgDe(p).sobresLog||[]).length;
  return {activo:true, ganados, dados, pend:Math.max(0, ganados-dados), hoy:sobreDelDia(p)};
}
function sobreHTML(){
  const p=perfil(), s=sobresDe(p); if(!s.activo) return '';
  if(s.pend) return `<button type="button" class="card acceso sobre-cartas gana" id="sobreInicio"><span class="emo-g">🎴</span><span><b>${s.pend===1?'¡Tienes un sobre de cartas!':`¡Tienes ${s.pend} sobres de cartas!`}</b><span class="nota">Pídeselo a papá o a mamá. Cuando te lo den, tocad aquí.</span></span></button>`;
  return '';   // cómo va el sobre de hoy sale en la tarjeta de estrellas
}
function sobresAdultoHTML(p){
  const s=sobresDe(p); if(!s.activo) return '';
  return `<div class="sobres-fam"><p class="nota">🎴 Sobres de cartas: ${esc(p.nombre)} ha ganado <b>${s.ganados}</b> y se le han dado <b>${s.dados}</b>.${s.pend?` <b>Tiene ${s.pend===1?'1 sobre':s.pend+' sobres'} por dar.</b>`:` Hoy: ${s.hoy.dia?'historia del día hecha':'falta la historia del día'} y ${s.hoy.extras} de ${s.hoy.meta} lecturas extra${s.hoy.sorpresa?' (¡día sorpresa!)':''}.`}</p>
    ${s.pend?`<div class="botones" style="margin-top:6px"><button class="btn btn-mini btn-p" type="button" id="sobreDado">Ya le he dado un sobre</button>${s.pend>1?`<button class="btn btn-mini btn-verde" type="button" id="sobreDadoTodos">Ya le he dado los ${s.pend}</button>`:''}</div>`:''}</div>`;
}
/* 23/10: apuntar los sobres dados (uno o todos los que tiene por dar) */
function darSobres(p, n=1){ const c=cfgDe(p); const ya=new Date().toISOString(); c.sobresLog=(c.sobresLog||[]).concat(Array.from({length:Math.max(1,n)},()=>({f:ya}))).slice(-500); guardarAj(); }
function activarSobresAdulto(p){
  const b=$('#sobreDado'); if(b) b.onclick=()=>{ darSobres(p, 1); aviso('Apuntado'); ir('evolucion','premios'); };
  const t=$('#sobreDadoTodos'); if(t) t.onclick=()=>{ darSobres(p, sobresDe(p).pend); aviso('Apuntados'); ir('evolucion','premios'); };
}
/* la tarjeta de Inicio: papá o mamá la tocan cuando le dan el sobre (con el PIN, o con una multiplicación de mayores si no hay PIN) */
function activarSobreInicio(){
  const b=$('#sobreInicio'); if(!b) return;
  b.onclick=()=>{ const p=perfil(), s=sobresDe(p); if(!s.pend) return;
    const a=12+Math.floor(Math.random()*8), m=6+Math.floor(Math.random()*4), conPin=!!aj.pin;
    const d=dialogo({titulo:'🎴 Sobre de cartas', html:`<p class="nota">Esto es para papá o mamá. ${esc(p.nombre)} tiene <b>${s.pend===1?'1 sobre':s.pend+' sobres'}</b> por recibir.</p>
      <p style="font-weight:800;margin:10px 0 6px">${conPin?'Pon el PIN de la familia:':`¿Cuánto es ${a} × ${m}?`}</p>
      <input id="sobreRes" type="${conPin?'password':'number'}" inputmode="numeric" autocomplete="off" style="width:150px;font-size:1.4rem;padding:8px;border-radius:10px;border:2px solid var(--line)"><p class="pin-msg" id="sobreMsg"></p>`,
      botones:[{t:'Ya le hemos dado 1 sobre',cls:'btn-p', mantener:true, fn:()=>dar(1)}].concat(s.pend>1?[{t:`Ya le hemos dado los ${s.pend}`,cls:'btn-verde', mantener:true, fn:()=>dar(s.pend)}]:[]).concat([{t:'Todavía no',cls:'btn'}])});
    function dar(n){ const v=($('#sobreRes',d.el).value||'').trim(); const bien = conPin ? v===aj.pin : +v===a*m;
      if(!bien){ $('#sobreMsg',d.el).textContent = conPin?'PIN incorrecto':'No es correcto'; return; }
      darSobres(p, n); d.cerrar(); sonido('cromo'); aviso(n===1?'Sobre apuntado':'Sobres apuntados'); ir('inicio'); }
    setTimeout(()=>{ const i=$('#sobreRes',d.el); if(i) i.focus(); },100); };
}
