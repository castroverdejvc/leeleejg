/* LeeLEEJG · cuatro pestañas (30/10/2026). Pedido por la familia: «al abrir el programa el niño está perdido, todo está
   suelto». Ahora arriba hay cuatro pestañas grandes:
   - Hoy: lo que toca hoy (lectura del día, repaso de fichas y ficha nueva del cole). Cuando está todo, se abren los juegos.
   - Leer: todas las lecturas juntas (la de hoy, atrasadas, fiestas, extra, temas y calendario).
   - Actividades: escribir (fichas, dictado, ficha del cole, Spell it!), palabras y juegos.
   - Premios: tele, pelis, móvil, estrellas, sobres, objetivos, cromos y muñecos.
   Al tocar una pestaña, el programa dice su nombre. */
'use strict';
const PESTANAS = [
  {id:'inicio', t:'Hoy', icono:'casa', c:'hoy'},
  {id:'leer', t:'Leer', icono:'libro', c:'leer'},
  {id:'actividades', t:'Actividades', icono:'lapiz', c:'act'},
  {id:'premios', t:'Premios', icono:'estrella', c:'pre'}
];
/* a qué pestaña pertenece cada pantalla (para marcarla arriba) */
const PESTANA_DE_NAV = {inicio:'inicio', historias:'leer', calendario:'leer', cromos:'premios', practicar:'actividades', repaso:'actividades', juegos:'actividades'};
const PESTANA_DE_PANT = {tele:'premios', mispremios:'premios', criaturas:'premios', temporada:'leer', ordenar:'leer', extra:'leer', adviento:'actividades', carta:'actividades',
  adivinanzas:'actividades', gustos:'actividades', palabrasdia:'actividades', aprender:'actividades', aprende:'actividades', deportes:'actividades', buzon:'leer',
  leer:'leer', actividades:'actividades', premios:'premios'};
function pestanaDe(p){ const d=PANT[p]||{}; return PESTANA_DE_PANT[p] || PESTANA_DE_NAV[d.nav] || ''; }

/* ---------- lo que toca hoy ---------- */
const hoyK = () => claveDia(new Date());
/* ficha nueva del cole: toca mientras no se haya hecho entera alguna vez antes de hoy */
function fichaColeEstado(p=perfil()){
  if(typeof FICHA_COLE==='undefined') return null;
  const c=cfgDe(p), hoy=hoyK();
  const hecho=(paso, soloAntes)=>{ const vale=f=>!soloAntes || claveDia(f)<hoy;
    if(paso.cali) return (c.caliLog||[]).some(x=>x.f && vale(x.f) && (x.items||[]).map(i=>i.t).join(',')===paso.cali);
    return (c.trabajosLog||[]).some(x=>x.f && vale(x.f) && x.t===paso.id); };
  const P=FICHA_COLE.pasos; if(P.every(x=>hecho(x,true))) return null;   // ya la terminó otro día: ya no es nueva
  const n=P.filter(x=>hecho(x,false)).length;
  return {n, total:P.length, hecha:n===P.length};
}
function tareasHoy(p=perfil()){
  const h=historiaDeHoy(), c=leidas(), cfg=cfgDe(p), out=[];
  out.push({id:'lectura', t:'Lectura del día', sub:conNombre(h.titulo), foto:h.portada, hecha:!!c[h.id], btn:'Leer', min:teleCfg().propuesta});
  if(typeof FICHAS!=='undefined' && FICHAS.length){
    const pend=typeof pendientesHoy==='function' ? pendientesHoy().length : 0, hecho=(cfg.repasoLog||[]).some(x=>x.f && claveDia(x.f)===hoyK());
    out.push({id:'repaso', t:'Repaso de fichas', sub: hecho ? '¡Repasado!' : pend ? `${Math.min(10,pend)} ${Math.min(10,pend)===1?'palabra':'palabras'}` : 'Hoy no hay nada que repasar', emo:'📝', hecha: hecho || !pend, btn:'Empezar', min:teleCfg().ficha});
  }
  const fc=fichaColeEstado(p);
  if(fc) out.push({id:'fichacole', t:`Ficha nueva del cole · ${fc.n} de ${fc.total}`, sub:FICHA_COLE.titulo, emo:'📄', hecha:fc.hecha, btn:fc.n?'Seguir':'Empezar'});
  return out;
}
function irATarea(id){
  if(id==='lectura') empezarHistoria(historiaDeHoy());
  else if(id==='repaso'){ if(typeof empezarRepaso==='function' && pendientesHoy().length) empezarRepaso(null); else ir('repaso'); }
  else if(id==='fichacole'){ const fc=fichaColeEstado(); const P=FICHA_COLE.pasos; const sig=P.find(x=>!hechoHoyCole(x)) || P[0];
    if(sig.cali) ir('caligrafia', 'lista:'+sig.cali); else ir('trabajo', sig.id); }
}
function tareaHTML(t, i){
  return `<div class="tarea-hoy${t.hecha?' hecha':''}"><span class="tarea-num">${t.hecha?ic('check'):i+1}</span>
    <span class="tarea-ft">${t.foto?imgHTML(t.foto):`<span class="emo-g">${t.emo}</span>`}</span>
    <span class="tarea-tx"><span class="tarea-t">${esc(t.t)}</span><b>${esc(t.sub)}</b></span>
    ${t.hecha ? `<span class="pill verde">${ic('check')} Hecho</span>${t.id==='lectura'?`<button class="btn btn-borde" type="button" data-tarea="${t.id}">Otra vez</button>`:''}`
      : `${t.min?`<span class="chip-tele">📺 +${minTxt(t.min)}</span>`:''}<button class="btn btn-p btn-g" type="button" data-tarea="${t.id}">${esc(t.btn)} ${ic('flecha')}</button>`}</div>`;
}
/* tarjeta «Lo de hoy» (en Hoy) */
function loDeHoyHTML(p=perfil()){
  const ts=tareasHoy(p), n=ts.filter(t=>t.hecha).length, todo=n===ts.length;
  return `<div class="card lo-de-hoy"><div class="ldh-cab"><h2>${todo?'¡Hoy ya lo tienes! 🎉':'Lo de hoy'}</h2><span class="nota"><b>${n} de ${ts.length}</b> hecho</span><span class="barra-t"><i style="width:${Math.round(100*n/ts.length)}%"></i></span></div>
    ${ts.map(tareaHTML).join('')}
    ${todo ? `<button class="acceso juegos-abiertos" type="button" data-ir="juegos"><span class="emo-g">🎮</span><span><b>¡Los juegos están abiertos!</b><span class="nota">Juegos de pensar: con oro, +1 minuto de tele, +1 de móvil y ⭐.</span></span><span class="ir">${ic('dcha')}</span></button>`
      : `<div class="candado-juegos">${ic('candado')}<span>Los juegos se abren cuando acabes ${ts.length===1?'esto':ts.length===2?'estas 2':'estas '+ts.length}.</span></div>`}</div>`;
}
/* en Juegos, cuando todavía no se puede jugar */
function tareasCandadoHTML(p=perfil()){
  const ts=tareasHoy(p);
  return `<div class="card lo-de-hoy candado"><div class="ldh-cab"><h2>🔒 Primero, lo de hoy</h2><span class="nota">Cuando acabes, se abren los juegos.</span></div>${ts.map(tareaHTML).join('')}</div>`;
}
function activarTareas(raiz){ $$('[data-tarea]', raiz).forEach(b=>b.onclick=()=>irATarea(b.dataset.tarea)); }

/* ---------- tarjeta con la historia de hoy (en Leer) ---------- */
function historiaHoyHTML(){
  const h=historiaDeHoy(), c=leidas(), hecha=!!c[h.id], dHoy=diaDeHoy();
  const hoyLeida=hecha && misSes().some(s=>s.historiaId===h.id && claveDia(s.fecha)===claveDia(new Date()));
  return `<article class="card hoy"><div class="ft">${imgHTML(h.portada,true)}</div>
    <div class="tx"><span class="pill">${h.especial?iconoEspecial(h.especial)+' ':''}Tu historia de hoy · Día ${diaPersonal(h)||dHoy}</span>
      <h1>${esc(conNombre(h.titulo))}</h1><p>${esc(conNombre(h.resumen))}</p>
      ${hecha?'<span class="pill verde">'+ic('check')+(hoyLeida?' ¡Ya la has leído hoy!':' ¡Ya la has leído!')+'</span>':''}
      <button class="btn btn-p btn-xl" type="button" id="btnLeerHoy">${hecha?'Leer otra vez':'Leer'} ${ic('flecha')}</button></div></article>`;
}
const accesoHTML = (ir, emo, t, nota, cls='') => `<button class="acceso ${cls}" type="button" data-ir="${ir}"><span class="emo-g">${emo}</span><span><b>${t}</b>${nota?`<span class="nota">${nota}</span>`:''}</span><span class="ir">${ic('dcha')}</span></button>`;
const seccion = (titulo, html, cls='') => html && html.trim() ? `<section class="sec-pest ${cls}"><h2 class="sec-tit">${titulo}</h2><div class="sec-grid">${html}</div></section>` : '';
const f_ = (fn, ...a) => { try{ return typeof window[fn]==='function' ? (window[fn](...a)||'') : ''; }catch(e){ console.error(fn, e); return ''; } };

/* ================= HOY ================= */
definir('inicio', {nav:'inicio', pintar(){
  if(!temasDe(perfil()).length){ ir('temas'); return; }
  const yo=perfil(), fo=fondoLector(yo), fy=fotoLector(yo);
  const comp = typeof COMPS==='function' && COMPS().length;
  $('#s-inicio').innerHTML = `
  <div class="banda banda-baja" style="--c:${esc(yo.color)};--cs:${SUAVE[yo.color]||'#E2EEFF'}">${fo?`<img class="fondo" src="${fo}" alt="">`:''}<span class="circulo">${fy?`<img src="${fy}" alt="">`:esc(iniciales(yo.nombre))}</span><b>¡Hola, ${esc(yo.nombre)}!</b><button class="btn btn-mini banda-btn" type="button" data-ir="mipantalla">${ic('imagen')} Mi pantalla</button></div>
  ${f_('semanaPasadaNinoHTML')}
  ${f_('avisoTemasHTML')}
  <div class="hoy-grid">
    <div class="hoy-col">${loDeHoyHTML(yo)}</div>
    <div class="hoy-col">
      ${f_('diaHoyHTML')}
      <div class="card cuando-acabes"><h3>Cuando acabes</h3>
        ${comp ? accesoHTML('extra','📚','Lecturas extra',`+${minTxt(teleCfg().extra)} de tele cada una`) : ''}
        ${accesoHTML('juegos','🧠','Juegos de pensar', puedeJugar(yo).ok ? 'Con oro: +1 min de tele, +1 de móvil y ⭐' : '🔒 Cuando acabes lo de hoy')}
        ${accesoHTML('premios','🏆','Mis premios','Tele, pelis, móvil, sobres de cartas y revistas')}
      </div>
    </div>
  </div>`;
  activarTareas($('#s-inicio'));
  try{ activarSemanaPasadaNino(); }catch(e){}
  activarAvisoTemas($('#s-inicio')); activarTemporada($('#s-inicio'));
  setTimeout(()=>{ if(actual==='inicio') comprobarPremios(); }, 400);
  if(typeof avisarSorpresa==='function') avisarSorpresa();
  if(typeof avisarRecord==='function') avisarRecord();
  if(typeof avisarMetas==='function') avisarMetas();
  if(typeof avisarNuevos==='function') avisarNuevos();
  avisarAtrasadasHoy();
}});
/* recordatorio en voz de las historias atrasadas (antes lo hacía Inicio) */
function avisarAtrasadasHoy(){ try{ const at=atrasadasDe(); if(!at.length) return; const cfg=cfgDe(perfil()), hoy=hoyK(); if(cfg.recordatorio===hoy) return; cfg.recordatorio=hoy; guardarAj();
  setTimeout(()=>{ if(actual==='inicio') decir(`${nombre()}, tienes ${at.length===1?'una historia atrasada':at.length+' historias atrasadas'}. Están en Leer.`); }, 900); }catch(e){} }

/* ================= LEER ================= */
definir('leer', {nav:'', pintar(){
  const p=perfil(), P=planDe(), c=leidas(), dHoy=diaDeHoy(); let pend=0; for(let d=1; d<dHoy; d++) if(P.dias[d] && !c[P.dias[d].id]) pend++;
  $('#s-leer').innerHTML = `<div class="pag-cab"><div><h1 class="tit">📖 Leer</h1><p class="sub">Todas tus lecturas juntas.</p></div></div>
  ${f_('marcapaginasHTML')}
  ${historiaHoyHTML()}
  ${f_('atrasadasHTML')}
  ${f_('temporadaHTML')}
  ${seccion('Más para leer', [f_('extraHTML'), accesoHTML('historias','🗂️','Historias por temas','Todas las historias, por temas y niveles'), accesoHTML('calendario','📅','Mi calendario', pend?`Tienes ${pend} ${pend===1?'historia':'historias'} sin leer de otros días.`:'Una historia cada día'), f_('pruebaNivelHTML')].join(''))}
  ${f_('chipsTemasHTML')}
  ${f_('buzonHTML')}`;
  const s=$('#s-leer');
  $('#btnLeerHoy').onclick=()=>empezarHistoria(historiaDeHoy());
  if($('#btnSeguirHist')) $('#btnSeguirHist').onclick=seguirDondeLoDejo;
  activarAtrasadas(s); activarTemporada(s);
  if(typeof activarPruebaNivel==='function') activarPruebaNivel();
}});

/* ================= ACTIVIDADES ================= */
definir('actividades', {nav:'', pintar(){
  const p=perfil(), pj=puedeJugar(p), pendRep = typeof pendientesHoy==='function' && FICHAS.length ? Math.min(10, pendientesHoy().length) : 0;
  $('#s-actividades').innerHTML = `<div class="pag-cab"><div><h1 class="tit">✏️ Actividades</h1><p class="sub">Escribir, palabras y juegos.</p></div></div>
  ${seccion('✍️ Escribir', [f_('fichaColeHTML', true),
      accesoHTML('repaso','📝','Fichas y dictado', !FICHAS.length?'Te dicto palabras y tú me dices cómo se escriben.':pendRep?`Repaso de hoy: ${pendRep} ${pendRep===1?'palabra':'palabras'}. Y dictado.`:'¡Repaso de hoy hecho! ¿Un dictado?'),
      f_('spellitInicioHTML')].join(''))}
  ${seccion('🔤 Palabras', [f_('palabrasDiaHTML'), accesoHTML('practicar','✏️','Practicar','Las palabras que más te cuestan.'), f_('sorpresaHTML')].join(''))}
  ${seccion('🎮 Jugar', [ pj.ok ? accesoHTML('juegos','🧠','Juegos de pensar','Parejas, ¿qué falta?, diferencias, puzles… Con oro: +1 min de tele, +1 de móvil y ⭐', 'juegos-abiertos')
        : `<div class="card acceso candado-acc"><span class="emo-g">🔒</span><span><b>Juegos de pensar</b><span class="nota">Se abren cuando acabes lo de hoy.</span></span><button class="btn btn-p" type="button" data-ir="inicio">Ver lo de hoy</button></div>`,
      f_('aprenderHTML'), f_('deportesHTML'), f_('advientoHTML'), f_('cartaHTML')].join(''))}`;
  const s=$('#s-actividades');
  if(typeof activarFichaCole==='function') activarFichaCole(s);
}});

/* ================= PREMIOS ================= */
definir('premios', {nav:'', pintar(){
  const p=perfil();
  const ult = misSes().filter(x=>!esComp(x.historiaId)).slice(-3).reverse().map(x=>historia(x.historiaId)).filter(Boolean);
  const fotosCromos = (ult.length?ult:CONT.historias.slice(0,3)).slice(0,3).map(x=>imgHTML(x.portada)).join('');
  $('#s-premios').innerHTML = `<div class="pag-cab"><div><h1 class="tit">🏆 Premios</h1><p class="sub">Todo lo que vas ganando.</p></div></div>
  ${f_('teleHTML')}
  ${typeof premiosCasaHTML==='function' ? f_('premiosCasaHTML') : f_('premiosRealesHTML')}
  ${typeof estrellasHTML==='function' ? f_('estrellasHTML', false) : f_('premiosHTML')}
  ${seccion('Mis colecciones', [f_('misPremiosBotonHTML'),
      `<button class="acceso verde" type="button" data-ir="cromos"><span class="mini-fotos">${fotosCromos}</span><span><b>Mis cromos</b><span class="nota">${Object.keys(cromosDe(p)).length} de ${CONT.historias.length} conseguidos.</span></span><span class="ir">${ic('dcha')}</span></button>`,
      accesoHTML('criaturas','🐾','Mis muñecos','El álbum de muñecos que vas ganando')].join(''))}
  ${f_('motivacionHTML')}
  ${f_('metasHTML', true)}`;
  const s=$('#s-premios');
  if(typeof televisorInicio==='function') televisorInicio();
  if(typeof activarPremiosCasa==='function') activarPremiosCasa(s);
  else { if(typeof activarSobreInicio==='function') activarSobreInicio(); if(typeof activarPremiosReales==='function') activarPremiosReales(s); }
}});

/* ---------- barra de arriba: cuatro pestañas; el programa dice su nombre al tocarla ---------- */
function pintarPestanas(){
  const nav=$('#navNino'); if(!nav) return;
  nav.classList.add('pestanas');
  nav.innerHTML=PESTANAS.map(t=>`<button type="button" class="pest pest-${t.c}" data-nav="${t.id}"><span data-icono="${t.icono}"></span><span>${t.t}</span></button>`).join('');
  nav.addEventListener('click', e=>{ const b=e.target.closest('[data-nav]'); if(!b) return; const t=PESTANAS.find(x=>x.id===b.dataset.nav); if(t && typeof decir==='function') decir(t.t); }, true);
  iconos(nav);
}
pintarPestanas();
{ const mostrar0=mostrar;
  mostrar=function(p){ mostrar0(p); const t=pestanaDe(p); $$('#navNino button').forEach(b=>b.setAttribute('aria-current', b.dataset.nav===t ? 'page' : 'false')); }; }
