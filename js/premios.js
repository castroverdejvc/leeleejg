/* LeeLEEJG · premios: actividades hechas, álbum de criaturas, juegos que se abren y tareas atrasadas.
   Todo se calcula a partir de lo hecho (lecturas, dictados y repasos), así no se descuadra al juntar la tablet y el ordenador. */
'use strict';
const PREMIOS_DEF = {criatura:2, juego:5, minutos:15, trasLeer:true, tele:10, teleExtra:15, teleRelee:5, teleFicha:5, sobre:15};
const premiosCfg = () => ({...PREMIOS_DEF, ...(aj.premios||{})});

/* actividades (ejercicios) = lecturas terminadas + dictados + repasos de fichas + rondas de «As letras» */
function ejerciciosDe(p=perfil(), desde=null){
  const c=cfgDe(p), d=desde?new Date(desde):null, vale=f=>!d || new Date(f)>=d;
  return sesDe(p.id).filter(s=>!s.incompleta && !esComp(s.historiaId) && vale(s.fecha)).length + ['dictadoLog','repasoLog','letrasLog'].reduce((a,k)=>a+(c[k]||[]).filter(x=>vale(x.f)).length, 0);
}
const actividadesDe = (p=perfil()) => ejerciciosDe(p);
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
  {id:'hojarasco', nombre:'Hojarasco', tipo:'planta', temporada:'otono', extra:'hojas'}
].map((c,i)=>({...c, rareza:3, especial:true, n:CRIATURAS.length+i+1}));
const todasCriaturas = () => CRIATURAS.concat(CRIATURAS_ESPECIALES);
const criatura = id => todasCriaturas().find(c=>c.id===id);

/* orden en que las gana cada niño: primero las comunes, al final las raras (barajadas) */
function ordenCriaturas(p){ const s=semilla('criaturas-'+p.id); return [1,2,3].flatMap(r=>barajarCon(CRIATURAS.filter(c=>c.rareza===r), s+r)); }
function criaturasDe(p=perfil()){
  const n=Math.floor(actividadesDe(p)/Math.max(1,premiosCfg().criatura));
  const ids=ordenCriaturas(p).slice(0,n).map(c=>c.id);
  if(typeof temporadaGanada==='function') CRIATURAS_ESPECIALES.forEach(c=>{ if(temporadaGanada(c.temporada,p)) ids.push(c.id); });
  return ids;
}
const faltanParaCriatura = (p=perfil()) => { const k=Math.max(1,premiosCfg().criatura); return k - (actividadesDe(p)%k); };

/* dibujo de cada criatura (SVG hecho por el programa a partir de su nombre) */
function criaturaSVG(c, {silueta=false, cls=''}={}){
  const T=TIPOS_CRIATURA[c.tipo]; const r=azar(semilla(c.id)); const v=Math.floor(r()*4);
  const [col, clara]= silueta ? ['#C9D3E2','#C9D3E2'] : T.c; const osc = silueta ? '#B7C3D4' : 'rgba(0,0,0,.18)';
  const cuerpo = [`<ellipse cx="60" cy="74" rx="34" ry="31" fill="${col}"/>`, `<path d="M60 36c22 0 34 22 34 44 0 16-15 26-34 26S26 96 26 80c0-22 12-44 34-44z" fill="${col}"/>`,
    `<ellipse cx="60" cy="72" rx="29" ry="36" fill="${col}"/>`, `<rect x="24" y="44" width="72" height="62" rx="30" fill="${col}"/>`][v];
  let deco='';
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
    hojas:'<path d="M40 44c-8-8-6-18 4-18 0 8 2 12-4 18z" fill="#E67E22"/><path d="M80 44c8-8 6-18-4-18 0 8-2 12 4 18z" fill="#C0392B"/><path d="M60 38c-6-10 0-18 8-16-2 8-2 12-8 16z" fill="#F1C40F"/>'
  })[c.extra]||'';
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
  return `<svg class="criatura ${cls}" viewBox="0 0 120 120" aria-hidden="true"${tono}>${brillo}${pies}${tipoDeco}${cuerpo}${cara}${extra}</svg>`;
}

/* ---------------- juegos que se abren ---------------- */
const juegosAbiertos = (p=perfil()) => typeof JUEGOS==='undefined' ? 0 : Math.min(JUEGOS.length, 1 + Math.floor(actividadesDe(p)/Math.max(1,premiosCfg().juego)));
const faltanParaJuego = (p=perfil()) => { const k=Math.max(1,premiosCfg().juego); if(typeof JUEGOS!=='undefined' && juegosAbiertos(p)>=JUEGOS.length) return null; return k - (actividadesDe(p)%k); };

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
  const p=perfil(), cfg=premiosCfg(), act=actividadesDe(p); const fc=faltanParaCriatura(p), fj=faltanParaJuego(p);
  const pc=Math.round(100*(cfg.criatura-fc)/cfg.criatura), pj = fj==null ? 100 : Math.round(100*(cfg.juego-fj)/cfg.juego);
  return `<div class="card premios"><div class="premio" data-ir="criaturas"><span class="emo-g">🐾</span><div class="tx"><b>Próxima criatura</b><span class="nota">${fc===1?'¡Te falta 1 actividad!':'Te faltan '+fc+' actividades'}</span><span class="barra-t"><i style="width:${pc}%;background:#8B5CF6"></i></span></div></div>
    <div class="premio" data-ir="juegos"><span class="emo-g">🎮</span><div class="tx"><b>${fj==null?'¡Tienes todos los juegos!':'Próximo juego'}</b><span class="nota">${fj==null?'Juega un ratito cuando acabes.':fj===1?'¡Te falta 1 actividad!':'Te faltan '+fj+' actividades'}</span><span class="barra-t"><i style="width:${pj}%;background:#F5A300"></i></span></div></div></div>`;
}

/* ---------------- celebrar lo nuevo ---------------- */
function comprobarPremios(){
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
  const d=dialogo({titulo: primera ? `¡Sorpresa, ${esc(nombre())}!` : nuevas.length ? (nuevas.length===1?'¡Nueva criatura!':'¡Nuevas criaturas!') : '¡Nuevo juego!', html, cls:'dlg-premio',
    botones:[...(nuevas.length?[{t:'Ver mi álbum de criaturas', cls:'btn-p', fn:()=>ir('criaturas')}]:[]), ...(juegoNuevo?[{t:'Ir a los juegos', cls:nuevas.length?'btn':'btn-p', fn:()=>ir('juegos')}]:[]), {t:'¡Genial!', cls:'btn'}]});
  sonido('cromo'); confeti(d.el.querySelector('.dialogo')||document.body);
  if(primera) decir(`¡Sorpresa, ${nombre()}! Por todo lo que ya has leído tienes premios: criaturas y juegos.`); else
  decir(nuevas.length ? `¡Has conseguido ${nuevas.length===1?'a '+nuevas[0].nombre:nuevas.length+' criaturas nuevas'}!` + (juegoNuevo?' ¡Y un juego nuevo!':'') : `¡Nuevo juego: ${juegoNuevo.nombre}!`);
}

/* ---------------- álbum de criaturas ---------------- */
definir('criaturas', {nav:'cromos', pintar(){
  const p=perfil(), tengo=new Set(criaturasDe(p)); const base=CRIATURAS.filter(c=>tengo.has(c.id)).length; const fc=faltanParaCriatura(p);
  $('#s-criaturas').innerHTML = `${albumTabsHTML('criaturas')}
  <div class="album-cab"><div><h1 class="tit">Álbum de criaturas</h1><p class="sub">Cada ${premiosCfg().criatura} actividades (lecturas, dictados o repasos) ganas una criatura.</p></div>
    <div class="contador">🐾<div><b>${base} de ${CRIATURAS.length}</b><br><span>${base>=CRIATURAS.length?'¡Álbum completo!':'te faltan '+(CRIATURAS.length-base)}</span></div></div></div>
  <div class="card album-prog"><span class="emo-g">🎁</span><div class="tx"><b>${fc===1?'¡Te falta 1 actividad para la próxima!':'Te faltan '+fc+' actividades para la próxima'}</b><span class="barra-t"><i style="width:${Math.round(100*(premiosCfg().criatura-fc)/premiosCfg().criatura)}%;background:#8B5CF6"></i></span></div></div>
  <div class="cri-grid">${CRIATURAS.map(c=>tengo.has(c.id)
    ? `<button type="button" class="cri-hueco tengo ${c.rareza===3?'rara':''}" data-cri="${c.id}"><span class="num">${c.n}</span>${criaturaSVG(c)}<b>${esc(c.nombre)}</b></button>`
    : `<div class="cri-hueco"><span class="num">${c.n}</span>${criaturaSVG(c,{silueta:true})}<b class="nota">¿?</b></div>`).join('')}</div>
  <h2 class="sub-album">Criaturas especiales</h2><p class="nota">Solo se consiguen en su fiesta: lee las historias especiales de esos días.</p>
  <div class="cri-grid">${CRIATURAS_ESPECIALES.map(c=>tengo.has(c.id)
    ? `<button type="button" class="cri-hueco tengo rara" data-cri="${c.id}"><span class="num">★</span>${criaturaSVG(c)}<b>${esc(c.nombre)}</b></button>`
    : `<div class="cri-hueco esp"><span class="num">★</span>${criaturaSVG(c,{silueta:true})}<b class="nota">${esc(typeof nombreTemporada==='function'?nombreTemporada(c.temporada):'')}</b></div>`).join('')}</div>`;
  activarAlbumTabs();
  $$('#s-criaturas [data-cri]').forEach(b=>b.onclick=()=>{ const c=criatura(b.dataset.cri), T=TIPOS_CRIATURA[c.tipo];
    dialogo({cls:'dlg-premio', html:`<div class="cri-carta grande ${c.rareza===3?'rara':''}">${criaturaSVG(c)}<b>${esc(c.nombre)}</b><span class="nota">${T.emo} Tipo ${T.n} · ${'★'.repeat(c.rareza)}</span><p class="nota">${esc(T.frase)}</p></div>`, botones:[{t:'Cerrar', cls:'btn-p'}]});
    decir(`${c.nombre}. Tipo ${T.n.toLowerCase()}. ${T.frase}`); });
}});
/* pestañas de los dos álbumes */
function albumTabsHTML(act){ return `<div class="album-tabs"><button type="button" data-alb="cromos" aria-pressed="${act==='cromos'}">📚 Cromos de lecturas</button><button type="button" data-alb="criaturas" aria-pressed="${act==='criaturas'}">🐾 Criaturas</button><button type="button" data-alb="juegos">🎮 Juegos</button></div>`; }
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
  return teleAdultoHTML(p) + `<div class="card bloque" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Premios y juegos</h3><p class="nota" style="margin-bottom:12px">Para toda la familia. Cuentan como actividad: cada lectura terminada, cada dictado, cada repaso de fichas y cada ronda de «As letras». ${esc(p.nombre)} lleva ${actividadesDe(p)}: ${criaturasDe(p).length} criaturas y ${juegosAbiertos(p)} juegos.</p>
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">
      <div class="campo"><label for="prCri">Una criatura cada</label>${sel('prCri',[1,2,3,4,5],c.criatura,' actividades')}</div>
      <div class="campo"><label for="prJue">Un juego nuevo cada</label>${sel('prJue',[3,4,5,6,8,10],c.juego,' actividades')}</div>
      <div class="campo"><label for="prMin">Minutos de juego al día</label>${sel('prMin',[5,10,15,20,30,45,60,0],c.minutos,' minutos')}</div>
      <div class="campo"><b>Antes de jugar</b><div class="interruptor"><span>Tiene que leer la historia del día</span><button type="button" class="switch" id="prLeer" role="switch" aria-checked="${!!c.trasLeer}"></button></div></div>
      <div class="campo"><label for="prSobre">🎴 Un sobre de cartas cada</label><select id="prSobre">${[0,5,10,15,20,25,30,40].map(x=>`<option value="${x}" ${x===c.sobre?'selected':''}>${x?x+' actividades':'Sin sobres'}</option>`).join('')}</select></div></div>
    ${sobresAdultoHTML(p)}
    <p class="nota" style="margin-top:8px">El usuario de pruebas no tiene límite de tiempo.</p></div>`;
}
function activarPremiosAdulto(){
  const sw=id=>$(id).getAttribute('aria-checked')==='true';
  const guarda=()=>{ aj.premios={...(aj.premios||{}), criatura:+$('#prCri').value, juego:+$('#prJue').value, minutos:+$('#prMin').value, trasLeer:sw('#prLeer'), sobre:+$('#prSobre').value}; delete aj.premios.teleGuarda; guardarAj(); aviso('Guardado'); };
  ['#prCri','#prJue','#prMin','#prSobre'].forEach(s=>$(s).onchange=guarda);
  ['#prLeer'].forEach(id=>$(id).onclick=()=>{ const b=$(id); b.setAttribute('aria-checked', String(b.getAttribute('aria-checked')!=='true')); guarda(); });
  activarTeleAdulto(lectorVisto()); activarSobresAdulto(lectorVisto());
}

/* ---------------- sobres de cartas (premio de verdad: la familia da un sobre de cartas) ---------------- */
function sobresDe(p=perfil()){
  const k=+premiosCfg().sobre||0; if(!k || p.prueba) return {activo:false, ganados:0, dados:0, pend:0, faltan:null};
  const act=actividadesDe(p), ganados=Math.floor(act/k), dados=(cfgDe(p).sobresLog||[]).length;
  return {activo:true, ganados, dados, pend:Math.max(0, ganados-dados), faltan:k-(act%k), cada:k};
}
function sobreHTML(){
  const p=perfil(), s=sobresDe(p); if(!s.activo) return '';
  if(s.pend) return `<div class="card acceso sobre-cartas gana"><span class="emo-g">🎴</span><span><b>${s.pend===1?'¡Tienes un sobre de cartas!':`¡Tienes ${s.pend} sobres de cartas!`}</b><span class="nota">Pídeselo a papá o a mamá.</span></span></div>`;
  return `<div class="card acceso sobre-cartas"><span class="emo-g">🎴</span><span><b>Próximo sobre de cartas</b><span class="nota">${s.faltan===1?'¡Te falta 1 actividad!':'Te faltan '+s.faltan+' actividades'}</span><span class="barra-t"><i style="width:${Math.round(100*(s.cada-s.faltan)/s.cada)}%;background:#E11D48"></i></span></span></div>`;
}
function sobresAdultoHTML(p){
  const s=sobresDe(p); if(!s.activo) return '';
  return `<div class="sobres-fam"><p class="nota">🎴 Sobres de cartas: ${esc(p.nombre)} ha ganado <b>${s.ganados}</b> y se le han dado <b>${s.dados}</b>.${s.pend?` <b>Tiene ${s.pend===1?'1 sobre':s.pend+' sobres'} por dar.</b>`:` El siguiente, dentro de ${s.faltan===1?'1 actividad':s.faltan+' actividades'}.`}</p>
    ${s.pend?`<button class="btn btn-mini btn-p" type="button" id="sobreDado">Ya le he dado un sobre</button>`:''}</div>`;
}
function activarSobresAdulto(p){
  const b=$('#sobreDado'); if(b) b.onclick=()=>{ const c=cfgDe(p); c.sobresLog=(c.sobresLog||[]).concat([{f:new Date().toISOString()}]).slice(-500); guardarAj(); aviso('Apuntado'); ir('evolucion','premios'); };
}
