/* LeeLEEJG · ideas de la familia (24/10/2026): pasaporte de fiestas, calendario de Adviento, carta a los Reyes
   (o al Apalpador, a Papá Noel…) escrita letra a letra, grabación para los abuelos, racha de días leyendo
   y frases que felicitan el esfuerzo. */
'use strict';

/* ---------- frases que felicitan el esfuerzo (los estudios dicen que es lo que mejor mantiene las ganas) ---------- */
const FRASES_ESFUERZO = ['Has practicado mucho y se nota.','Cada día lees un poco mejor: ¡es gracias a tu esfuerzo!','Te has esforzado de verdad. ¡Así se aprende!',
  'Has ido despacito y con cuidado. ¡Muy bien hecho!','Cuanto más lees, más fácil te resulta. ¡Sigue así!','Aunque cueste, no te rindes. ¡Eso es lo más importante!',
  'Tu cabeza trabaja muy bien cuando practicas.','¡Qué constancia! Leer cada día te hace más fuerte.'];
const fraseEsfuerzo = () => FRASES_ESFUERZO[Math.floor(Math.random()*FRASES_ESFUERZO.length)];
const esfuerzoHTML = () => `<p class="esfuerzo">💪 ${esc(fraseEsfuerzo())}</p>`;

/* ---------- racha de días leyendo ---------- */
function diasConLectura(p=perfil()){ return new Set(sesDe(p.id).filter(s=>!s.incompleta && s.fecha).map(s=>claveDia(s.fecha))); }
function rachaDe(p=perfil()){
  const dias=diasConLectura(p); let d=hoySinHora(); if(!dias.has(claveDia(d))) d=diasDespues(d,-1);
  let n=0; while(dias.has(claveDia(d))){ n++; d=diasDespues(d,-1); }
  return {n, hoy:dias.has(claveDia(hoySinHora()))};
}
/* estrellas de la racha: cada 7 días seguidos leyendo (desde el 24/10/2026), 5 ⭐ (las calcula estrellas.js) */
const RACHA_DIAS = 7, RACHA_ESTRELLAS = 5;
function eventosRacha(p){
  const prim={}; sesDe(p.id).filter(s=>!s.incompleta && s.fecha && despuesCorte(s.fecha)).forEach(s=>{ const k=claveDia(s.fecha); if(!prim[k] || s.fecha<prim[k]) prim[k]=s.fecha; });
  const ks=Object.keys(prim).sort(); const ev=[]; let n=0, ant=null;
  ks.forEach(k=>{ const d=new Date(k+'T12:00'); n = (ant && Math.round((d-ant)/DIA_MS)===1) ? n+1 : 1; ant=d; if(n%RACHA_DIAS===0) ev.push({f:prim[k], n:RACHA_ESTRELLAS, tipo:'racha'}); });
  return ev;
}
function rachaHTML(){
  const p=perfil(); if(p.prueba) return ''; const r=rachaDe(p); if(r.n<2) return '';
  const falta=RACHA_DIAS-(r.n%RACHA_DIAS);
  return `<div class="racha"><span class="fuego">🔥</span><b>${r.n} días seguidos leyendo</b><span class="nota">${falta===RACHA_DIAS?`¡Racha de ${r.n}! Has ganado ${RACHA_ESTRELLAS} ⭐.`:`Con ${falta} ${falta===1?'día':'días'} más, ¡${RACHA_ESTRELLAS} ⭐ de regalo!`}${r.hoy?'':' Lee hoy para no perderla.'}</span></div>`;
}

/* ---------- pasaporte de fiestas: un sello por cada fiesta celebrada ---------- */
definir('pasaporte', {nav:'cromos', pintar(){
  const p=perfil(); const ts=listaTemporadas().filter(t=>historiasTemporada(t.id).length);
  const sellos=ts.filter(t=>temporadaGanada(t.id,p)).length;
  $('#s-pasaporte').innerHTML = `${albumTabsHTML('pasaporte')}
  <div class="album-cab"><div><h1 class="tit">🛂 Mi pasaporte de fiestas</h1><p class="sub">Cada fiesta que celebras leyendo 3 de sus historias te pone un sello. ¡Fiestas de Galicia, de España y del mundo!</p></div>
    <div class="contador">🛂<div><b>${sellos} de ${ts.length}</b><br><span>sellos</span></div></div></div>
  <div class="pasaporte">${ts.map(t=>{ const ok=temporadaGanada(t.id,p), act=temporadaActiva(t.id,p);
    return `<button type="button" class="sello${ok?' puesto':''}${act?' ahora':''}" data-temp="${t.id}" style="--tc:${t.color};--ts:${t.suave}"><span class="sello-emo">${t.emo}</span><b>${esc(t.nombre)}</b><span class="nota">${esc(t.mundo_fiesta||(t.def?'':'')||'')}${ok?' ✓':act?' · ¡es ahora!':''}</span></button>`; }).join('')}</div>`;
  activarAlbumTabs(); activarTemporada($('#s-pasaporte'));
}});

/* ---------- grabación para los abuelos ---------- */
const POEMAS = {
  samain:'Calabaza con farol, castañas al calor; en Samaín os mando un beso de corazón.',
  halloween:'Truco o trato, me disfrazo un rato; os mando un beso dulce como un caramelo.',
  muertos:'Flores naranjas y una vela encendida: a los que queremos los llevamos en la vida.',
  magosto:'Castañas asadas, cara tiznada; en el Magosto os quiero, ¡qué tarde tan bonita y salada!',
  navidad:'Luces en el árbol, turrón en la mesa; ¡feliz Navidad, abuelos, con mil besos de sorpresa!',
  reyes:'Melchor, Gaspar y Baltasar ya van a llegar; abuelos, os quiero, ¡y os voy a abrazar!',
  apalpador:'Baja el Apalpador del monte con su saco: castañas para todos y un beso para vosotros.',
  cumple:'Hoy soplo las velas y cumplo un año más; abuelos, ¡gracias por quererme tanto!'
};
const poemaDe = t => POEMAS[t.id] || `Os mando un beso grande desde mi casa hasta la vuestra: ¡feliz ${t.nombre}, abuelos, que la fiesta sea nuestra!`;
let grabAbuelos=null;
function grabarAbuelosHTML(t){ return `<div class="card bloque grab-abuelos"><b>🎙️ Un mensaje para los abuelos</b><p class="poema">${esc(conNombre(poemaDe(t)))}</p>
  <div class="botones"><button class="btn btn-mini" type="button" id="gaOir">${ic('altavoz')} Escuchar</button><button class="btn btn-p" type="button" id="gaGrabar">● Grabarme leyéndolo</button></div><div id="gaRes"></div></div>`; }
function activarGrabarAbuelos(t){
  const b=$('#gaGrabar'); if(!b) return; $('#gaOir').onclick=()=>decir(conNombre(poemaDe(t)));
  b.onclick=async()=>{
    if(grabAbuelos && grabAbuelos.state==='recording'){ grabAbuelos.stop(); return; }
    let st; try{ st=await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e){ aviso('No se puede usar el micrófono'); return; }
    const trozos=[]; const rec=new MediaRecorder(st); grabAbuelos=rec;
    rec.ondataavailable=e=>{ if(e.data && e.data.size) trozos.push(e.data); };
    rec.onstop=()=>{ st.getTracks().forEach(x=>x.stop()); b.textContent='● Grabar otra vez'; b.classList.remove('grabando');
      const tipo=rec.mimeType||'audio/webm'; const blob=new Blob(trozos,{type:tipo}); const ext=tipo.includes('mp4')?'m4a':'webm';
      const nom=`${nombre()}-${t.nombre}.${ext}`.replace(/\s+/g,'-'); const url=URL.createObjectURL(blob); const file=new File([blob], nom, {type:tipo});
      const puede=navigator.canShare && navigator.canShare({files:[file]});
      $('#gaRes').innerHTML=`<audio controls src="${url}"></audio><div class="botones">${puede?'<button class="btn btn-verde" type="button" id="gaEnviar">📤 Enviar a los abuelos</button>':''}<a class="btn" download="${esc(nom)}" href="${url}">⬇️ Guardar</a></div>`;
      const env=$('#gaEnviar'); if(env) env.onclick=()=>navigator.share({files:[file], title:`${nombre()} os felicita ${deTemporada(t)}`}).catch(()=>{});
      sonido('cromo'); decir('¡Qué bien! Ya puedes enviárselo a los abuelos.'); };
    rec.start(); b.textContent='■ Parar'; b.classList.add('grabando'); };
}

/* ---------- calendario de Adviento: del 1 al 24 de diciembre, una ventanita cada día que lee ---------- */
const ADVIENTO = [
  ['🎄','En muchas casas se pone el árbol de Navidad a principios de diciembre.'],['⭐','La estrella de la punta del árbol recuerda a la estrella que guio a los Reyes.'],
  ['🧔','En Galicia, en las montañas de Lugo y Ourense, el Apalpador baja del monte y deja castañas.'],['🪵','En Cataluña cuidan al Tió de Nadal, un tronco con cara, y el día de Navidad «da» turrón.'],
  ['🥾','La noche del 5 al 6 de diciembre, San Nicolás deja dulces en los zapatos.'],['🌰','Adivinanza: tengo erizo y no soy animal, en otoño me asan. ¿Qué soy? ¡La castaña!'],
  ['🎶','Los villancicos son canciones de Navidad. ¡Canta uno hoy con tu familia!'],['🧑‍🌾','En el País Vasco, el Olentzero es un carbonero que baja del monte con regalos.'],
  ['🦌','Papá Noel viaja en un trineo tirado por renos. ¡Uno se llama Rudolph y tiene la nariz roja!'],['🍬','El turrón se hace con almendras y miel. ¡Es un dulce muy antiguo!'],
  ['🏘️','El belén es una maqueta con casitas, pastores, ovejas y el portal.'],['❄️','Ningún copo de nieve es igual a otro. ¡Cada uno es único, como tú!'],
  ['🧹','En Italia, la Befana vuela en escoba la noche de Reyes y deja dulces.'],['🕯️','Janucá es la fiesta judía de las luces: encienden una vela más cada noche.'],
  ['💌','Hoy es buen día para escribir tu carta. ¡En LeeLEEJG te ayudamos!'],['🎁','Un buen regalo puede ser un dibujo hecho por ti. ¡Hazle uno a alguien!'],
  ['🌟','El 21 de diciembre es la noche más larga del año: empieza el invierno.'],['🍊','En Navidad se comen muchas mandarinas y naranjas. ¡Tienen mucha vitamina!'],
  ['🎅','Papá Noel y Santa Claus son el mismo señor con dos nombres.'],['🐑','Adivinanza: tengo lana y digo «bee». ¿Quién soy? ¡La oveja del belén!'],
  ['🔔','Las campanas suenan en muchos villancicos: ¡din, don, din!'],['👪','La Navidad es para estar con la familia y con los amigos.'],
  ['🥘','Hoy es Nochebuena por la noche: la familia cena junta. ¡Mañana es Navidad!'],['🎉','¡Mañana es Navidad! Gracias por leer todos los días. ¡Eres un campeón!']
];
const esDiciembre = (f=new Date()) => f.getMonth()===11 && f.getDate()<=24;
function advientoAbiertas(p=perfil(), anio=new Date().getFullYear()){
  const dias=diasConLectura(p); const out=new Set();
  for(let d=1; d<=24; d++){ const k=`${anio}-12-${String(d).padStart(2,'0')}`; if(dias.has(k)) out.add(d); }
  return out;
}
function advientoHTML(){
  const p=perfil(); if(!esDiciembre() && !(p.prueba && new Date().getMonth()>=10)) return '';
  const hoy=new Date().getDate(), ab=advientoAbiertas(p);
  return `<button class="acceso adviento-c" type="button" data-ir="adviento"><span class="emo-g">🎄</span><span><b>Calendario de Adviento</b><span class="nota">${ab.has(hoy)?'¡Hoy ya has abierto tu ventanita!':'Lee la historia de hoy y abre la ventanita del día '+hoy+'.'} Llevas ${ab.size} de 24.</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
definir('adviento', {nav:'inicio', pintar(){
  const p=perfil(), f=new Date(), anio=f.getFullYear(), hoy=f.getMonth()===11?f.getDate():0, ab=advientoAbiertas(p, anio);
  $('#s-adviento').innerHTML = `<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
  <div class="album-cab"><div><h1 class="tit">🎄 Calendario de Adviento</h1><p class="sub">Del 1 al 24 de diciembre: el día que lees, se abre su ventanita.</p></div><div class="contador">🎁<div><b>${ab.size} de 24</b><br><span>abiertas</span></div></div></div>
  <div class="adviento">${ADVIENTO.map(([e,t],i)=>{ const d=i+1, abierta=ab.has(d), futura=d>hoy;
    return abierta ? `<button type="button" class="vent abierta" data-a="${i}"><span class="num">${d}</span><span class="e">${e}</span></button>`
      : `<div class="vent${futura?' futura':d===hoy?' hoy':' pasada'}"><span class="num">${d}</span>${d===hoy?'<span class="nota">¡Lee hoy!</span>':''}</div>`; }).join('')}</div>`;
  $$('#s-adviento [data-a]').forEach(b=>b.onclick=()=>{ const [e,t]=ADVIENTO[+b.dataset.a]; dialogo({titulo:`Día ${+b.dataset.a+1}`, html:`<div class="vent-dlg"><span>${e}</span><p>${esc(t)}</p></div>`, botones:[{t:'¡Qué bien!', cls:'btn-p'}]}); decir(t); });
  if(hoy && ab.has(hoy)){ const c=cfgDe(p), k=claveDia(f); if(c.advientoVisto!==k){ c.advientoVisto=k; guardarAj(); const [e,t]=ADVIENTO[hoy-1]; setTimeout(()=>{ dialogo({titulo:`¡Ventanita del día ${hoy}!`, html:`<div class="vent-dlg"><span>${e}</span><p>${esc(t)}</p></div>`, cls:'dlg-premio', botones:[{t:'¡Qué bien!', cls:'btn-p'}]}); sonido('cromo'); decir(t); }, 400); } }
}});

/* ---------- carta a los Reyes (o al Apalpador, a Papá Noel…): elige y escribe letra a letra ---------- */
const DESTINOS_CARTA = [['reyes','Queridos Reyes Magos','👑👑👑'],['apalpador','Querido Apalpador','🧔🌰'],['papanoel','Querido Papá Noel','🎅'],['olentzero','Querido Olentzero','🧑‍🌾'],['befana','Querida Befana','🧹'],['sannicolas','Querido San Nicolás','🥾']];
const DESEOS = ['balon','bicicleta','libro','coche','tren','cometa','pelota','patines','muneca','robot','puzle','dinosaurio','lapices','pinturas','avion','barco','camion','casco','guitarra','tambor','pelicula','mochila','reloj','perro'];
let cartaEst=null;
definir('carta', {nav:'inicio', pintar(){
  const p=perfil(); if(!cartaEst) cartaEst={paso:'destino', destino:null, deseos:[], escribiendo:null};
  const E=cartaEst, s=$('#s-carta'); const cab=`<button class="volver" type="button" id="cartaVolver">${ic('atras')} ${E.paso==='destino'?'Inicio':'Atrás'}</button><h1 class="tit">💌 Mi carta</h1>`;
  if(E.paso==='destino'){
    s.innerHTML=`${cab}<p class="sub">¿A quién le escribes?</p><div class="destinos">${DESTINOS_CARTA.map(([id,t,e])=>`<button type="button" class="destino" data-d="${id}"><span class="emo-g">${e}</span><b>${esc(t.replace(/^Querid[oa]s? /,''))}</b></button>`).join('')}</div>`;
    $$('#s-carta [data-d]').forEach(b=>b.onclick=()=>{ E.destino=b.dataset.d; E.paso='deseos'; ir('carta'); });
    $('#cartaVolver').onclick=()=>{ cartaEst=null; ir('inicio'); }; decir('¿A quién le escribes la carta?'); return;
  }
  if(E.paso==='deseos'){
    const ops=DESEOS.map(k=>({k, p:(Object.entries(CONT.palabras||{}).find(([pp,v])=>v===k && !pp.includes(' '))||[k])[0]})).filter(x=>CONT.fotos[x.k]||(CONT.emoji||{})[x.k]);
    s.innerHTML=`${cab}<p class="sub">Elige hasta 3 cosas que te gustaría pedir. Luego las escribirás tú.</p>
      <div class="deseos">${ops.map(x=>`<button type="button" class="deseo${E.deseos.includes(x.p)?' elegido':''}" data-p="${esc(x.p)}">${fotoH(x.k)}<b>${esc(x.p)}</b></button>`).join('')}</div>
      <div class="botones" style="justify-content:center;margin-top:14px"><button class="btn btn-p btn-xl" type="button" id="cartaSig" ${E.deseos.length?'':'disabled'}>Escribir mi carta ${ic('flecha')}</button></div>`;
    $$('#s-carta [data-p]').forEach(b=>b.onclick=()=>{ const w=b.dataset.p; if(E.deseos.includes(w)) E.deseos=E.deseos.filter(x=>x!==w); else if(E.deseos.length<3) E.deseos.push(w); else aviso('Como mucho 3'); sonido('toc'); decir(w); ir('carta'); });
    $('#cartaSig').onclick=()=>{ E.paso='escribir'; E.escribiendo={i:0, hechas:[], letras:''}; ir('carta'); };
    $('#cartaVolver').onclick=()=>{ E.paso='destino'; ir('carta'); }; return;
  }
  if(E.paso==='escribir'){
    const W=E.escribiendo; const w=E.deseos[W.i]; const pos=W.letras.length; const sig=w[pos];
    const abc=[...new Set([...w, ...'aeioulmnprstcbdgv'])].sort((a,b)=>a.localeCompare(b,'es'));
    s.innerHTML=`${cab}<p class="sub">Escribe <b>${esc(w)}</b> letra a letra (${W.i+1} de ${E.deseos.length}).</p>
      <div class="huecos letras">${[...w].map((c,k)=>`<span class="hueco-p${k<pos?' lleno':''}${k===pos?' ahora':''}">${k<pos?esc(c):''}</span>`).join('')}</div>
      <div class="teclado-edu">${abc.map(c=>`<button type="button" class="tecla${(W.err||0)>=2 && c===sig?' pista':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="botones" style="justify-content:center"><button class="btn btn-mini" type="button" id="cartaOir">${ic('altavoz')} Escuchar la palabra</button></div>`;
    $('#cartaOir').onclick=()=>decir(w);
    $$('#s-carta .tecla').forEach(b=>b.onclick=()=>{ const c=b.dataset.c;
      if(c===sig){ W.letras+=c; W.err=0; sonido('toc'); decir(NOMBRE_LETRA.es[quitaTildes(c)]||c);
        if(W.letras.length===w.length){ W.hechas.push(w); sonido('bien'); decir(`¡Muy bien! ${w}.`); W.i++; W.letras=''; if(W.i>=E.deseos.length){ E.paso='final'; guardarCarta(); } }
        ir('carta'); }
      else { W.err=(W.err||0)+1; sonido('mal'); b.classList.add('mal'); if(W.err>=2) ir('carta'); } });
    $('#cartaVolver').onclick=()=>{ E.paso='deseos'; ir('carta'); };
    if(!pos) decir(`Escribe ${w}.`); return;
  }
  const d=DESTINOS_CARTA.find(x=>x[0]===E.destino)||DESTINOS_CARTA[0];
  const art=w=>{ const k=(CONT.palabras||{})[w]; return /a$/.test(w)&&!/^(mapa|planeta|tema|problema|programa|día)$/.test(w)?'una '+w:'un '+w; };
  const lista=E.deseos.map(art); const txt=lista.length>1?lista.slice(0,-1).join(', ')+' y '+lista[lista.length-1]:lista[0];
  s.innerHTML=`${cab}<div class="carta-papel" id="cartaPapel"><p class="carta-cab">${esc(d[1])}:</p><p>Este año he leído mucho y me he esforzado.</p><p>Me gustaría ${esc(txt)}.</p><p>Muchas gracias. Un beso muy grande,</p><p class="firma">${esc(nombre())} ${d[2]}</p></div>
    <div class="botones" style="justify-content:center"><button class="btn btn-mini" type="button" id="cartaLeer">${ic('altavoz')} Leer la carta</button><button class="btn btn-p" type="button" id="cartaImprimir">🖨️ Imprimir</button><button class="btn" type="button" id="cartaNueva">Escribir otra</button></div>`;
  $('#cartaLeer').onclick=()=>decir(`${d[1]}. Este año he leído mucho y me he esforzado. Me gustaría ${txt}. Muchas gracias. Un beso muy grande, ${nombre()}.`);
  $('#cartaImprimir').onclick=()=>{ document.body.classList.add('imprime-carta'); window.print(); setTimeout(()=>document.body.classList.remove('imprime-carta'), 500); };
  $('#cartaNueva').onclick=()=>{ cartaEst=null; ir('carta'); };
  $('#cartaVolver').onclick=()=>{ cartaEst=null; ir('inicio'); };
  confeti($('#cartaPapel'));
}, salir(){ }});
function guardarCarta(){ const c=cfgDe(perfil()); const E=cartaEst; c.cartas=(c.cartas||[]).concat([{f:new Date().toISOString(), a:E.destino, deseos:E.deseos.slice()}]).slice(-30); guardarAj(); }
function cartaHTML(){
  const f=new Date(); const enFechas = (f.getMonth()===10 && f.getDate()>=15) || f.getMonth()===11 || (f.getMonth()===0 && f.getDate()<=5);
  if(!enFechas) return '';
  return `<button class="acceso carta-c" type="button" data-ir="carta"><span class="emo-g">💌</span><span><b>Escribe tu carta</b><span class="nota">A los Reyes Magos, al Apalpador, a Papá Noel… ¡la escribes tú, letra a letra!</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
