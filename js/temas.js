/* LeeLEEJG · temas: cada niño elige 2 temas y la historia de cada día de su calendario sale de ellos */
'use strict';
const TEMAS = [
  {id:'heroes',    nombre:'Superhéroes',      mundos:['heroes'],               foto:'portada_heroes',    emo:'🦸'},
  {id:'futbol',    nombre:'Fútbol',           mundos:['oliver','supa','liga'], foto:'portada_liga',      emo:'⚽', desc:'Goles, estadios, equipos y chutes imposibles.'},
  {id:'dinos',     nombre:'Dinosaurios',      mundos:['dinos'],                foto:'portada_dinos',     emo:'🦖'},
  {id:'animales',  nombre:'Animales',         mundos:['animales'],             foto:'portada_animales',  emo:'🐾'},
  {id:'nba',       nombre:'Baloncesto',       mundos:['nba'],                  foto:'portada_nba',       emo:'🏀'},
  {id:'deportes',  nombre:'Más deportes',     mundos:['deportes'],             foto:'esquis',            emo:'🚴'},
  {id:'ciencia',   nombre:'Ciencia y espacio',mundos:['ciencia'],              foto:'planeta',           emo:'🚀'},
  {id:'canciones', nombre:'Canciones',        mundos:['canciones'],            foto:'portada_canciones', emo:'🎵'},
  {id:'galicia',   nombre:'Galicia',          mundos:['galicia'],              foto:'faro',              emo:'🐙'},
  {id:'familia',   nombre:'Familia y cole',   mundos:['familia'],              foto:'colegio',           emo:'🏫'},
  {id:'cuentos',   nombre:'Cuentos y fábulas',mundos:['cuentos'],              foto:'cuento',            emo:'📖', desc:'Caperucita, el gato con botas, Aladino, la liebre y la tortuga… ¡y tú dentro del cuento!'}
];
const ALBUM_FIESTAS = {id:'fiestas', nombre:'Días especiales', mundos:['fiestas'], foto:'globo', emo:'🎉'};
const temaDe = id => TEMAS.find(t=>t.id===id) || (id==='fiestas' ? ALBUM_FIESTAS : null);
const temaDeMundo = m => TEMAS.find(t=>t.mundos.includes(m)) || (m==='fiestas' ? ALBUM_FIESTAS : null);
const descTema = t => t.desc || conNombre((CONT.mundos.find(m=>m.id===t.mundos[0])||{}).desc || '');
/* de más fácil a más difícil y, dentro de cada nivel, de más corta a más larga (así cada vez son un poco más largas) */
const largoH = h => h._largo || (h._largo = h.lineas.reduce((a,l)=>a+String(l).split(/\s+/).length,0));
const ordenH = (a,b) => (a.nivel-b.nivel) || (largoH(a)-largoH(b)) || ((a.dia||900)-(b.dia||900)) || String(a.id).localeCompare(String(b.id));
function historiasTema(id){ const t=temaDe(id); return t ? CONT.historias.filter(h=>t.mundos.includes(h.mundo)).sort(ordenH) : []; }
const nombreTema = id => (temaDe(id)||{nombre:id}).nombre;

/* ---------- calendario personal de cada lector ---------- */
const temasDe = p => (cfgDe(p).temas||[]).filter(t=>TEMAS.some(x=>x.id===t));
const mdF = d => (d.getMonth()+1)+'-'+d.getDate();
function fiestasDe(p){
  const m={};
  CONT.historias.filter(h=>h.mundo==='fiestas' && h.fecha).forEach(h=>{ let f=new Date(h.fecha+'T00:00:00'); if(/cumplea/i.test(h.especial||'') && p.nac) f=new Date(p.nac+'T00:00:00'); m[mdF(f)]=h; });
  return m;
}
const PLANES = {};
/* El día 1…365 de cada lector: los días ya pasados quedan fijos; los que vienen salen de sus temas,
   alternando uno y otro, de más fácil a más difícil. Los días especiales (Samaín, Navidad, su cumpleaños…) van en su fecha. */
function planDe(p=perfil()){
  const cfg=cfgDe(p), temas=temasDe(p), plan=cfg.plan||{}, leid=leidasDe(p.id), hoy=diaHoyDe(p);
  const key=JSON.stringify([temas, cfg.inicio||'', plan, Object.keys(leid).sort(), CONT.historias.length, p.nac||'', hoy]);
  if(PLANES[p.id] && PLANES[p.id].key===key) return PLANES[p.id];
  const dias=[null], tipo=[null], diaDe={};
  if(!temas.length){   // todavía no ha elegido temas: el calendario de siempre
    for(let d=1; d<=365; d++){ const h=CONT.historias.find(x=>x.dia===d)||null; dias[d]=h; tipo[d]='calendario'; if(h && !diaDe[h.id]) diaDe[h.id]=d; }
    return (PLANES[p.id]={key, dias, tipo, diaDe});
  }
  const fiestas=fiestasDe(p), tomados=new Set(Object.values(plan));
  const colas=Object.fromEntries(temas.map(t=>[t, historiasTema(t)]));
  const resto=CONT.historias.filter(h=>h.mundo!=='fiestas' && !temas.some(t=>temaDe(t).mundos.includes(h.mundo))).sort(ordenH);
  const libre=h=>h && !tomados.has(h.id) && !leid[h.id];
  for(let d=1; d<=365; d++){
    let h=plan[d] ? historia(plan[d]) : null, t='fijo';
    if(plan[d] && !h && d<hoy){ dias[d]=null; tipo[d]='quitada'; continue; }
    if(!h){ const f=fiestas[mdF(fechaDiaDe(p,d))]; if(f && !tomados.has(f.id)){ h=f; t='fiesta'; } }
    if(!h){ const prev=dias[d-1], tp=prev && temaDeMundo(prev.mundo); let i0=0; if(tp){ const j=temas.indexOf(tp.id); if(j>=0) i0=j+1; }
      for(let i=0; i<temas.length && !h; i++) h=colas[temas[(i0+i)%temas.length]].find(libre)||null; t='tema'; }
    if(!h){ h=resto.find(libre)||null; t='sorpresa'; }
    if(!h){ h=[...temas.flatMap(x=>colas[x]), ...resto].find(x=>!tomados.has(x.id))||null; t='repaso'; }
    if(h){ tomados.add(h.id); dias[d]=h; tipo[d]=t; if(!diaDe[h.id]) diaDe[h.id]=d; }
  }
  // los días ya llegados se quedan fijos
  const fijo = Math.min(365, hoy);
  let cambio=false; for(let d=1; d<=fijo; d++) if(!plan[d] && dias[d]){ plan[d]=dias[d].id; cambio=true; }
  if(cambio){ cfg.plan=plan; guardarAj(); }
  const res={key:JSON.stringify([temas, cfg.inicio||'', plan, Object.keys(leid).sort(), CONT.historias.length, p.nac||'', hoy]), dias, tipo, diaDe};
  return (PLANES[p.id]=res);
}
const diaPersonal = (h, p=perfil()) => h ? (planDe(p).diaDe[h.id] || null) : null;
function nivelActualDe(p=perfil()){ const h=planDe(p).dias[diaHoyDe(p)]; return Math.max(h?h.nivel:1, ...sesDe(p.id).filter(s=>!esComp(s.historiaId)).map(s=>s.nivel||1)); }
/* ¿puede leerla ya? las de su calendario cuando llega su día; las de otros temas si son de su nivel */
function estaDisponible(h, p=perfil()){
  if(!h) return false; if(cfgDe(p).adelantar || leidasDe(p.id)[h.id]) return true;
  if(h.temporada) return typeof temporadaActiva==='function' && temporadaActiva(h.temporada, p);   // historias de fiesta: solo en su temporada
  const d=diaPersonal(h,p); if(d) return d<=diaHoyDe(p);
  return h.nivel<=nivelActualDe(p);
}
function estadoTema(t, p=perfil()){
  const P=planDe(p), leid=leidasDe(p.id), hoy=diaHoyDe(p), hs=historiasTema(t);
  const leidas=hs.filter(h=>leid[h.id]).length;
  const quedan=hs.filter(h=>!leid[h.id] && !(P.diaDe[h.id] && P.diaDe[h.id]<hoy)).length;
  return {total:hs.length, leidas, quedan, terminado: hs.length>0 && quedan===0};
}
/* fija los temas de un lector (la primera vez, los días pasados se quedan con lo que ya tenía su calendario) */
function fijarTemas(p, temas, motivo){
  const cfg=cfgDe(p);
  if(!(cfg.temas||[]).length){ const plan=cfg.plan||{}; const hoy=diaHoyDe(p);
    for(let d=1; d<hoy; d++){ if(!plan[d]){ const h=CONT.historias.find(x=>x.dia===d); if(h) plan[d]=h.id; } } cfg.plan=plan; }
  cfg.temas=temas.slice(0,2);
  cfg.temasLog=(cfg.temasLog||[]).concat([{f:new Date().toISOString(), temas:cfg.temas, motivo:motivo||''}]).slice(-50);
  delete PLANES[p.id]; guardarAj();
}
function pedirMas(t, p=perfil()){
  const cfg=cfgDe(p); cfg.pideMas=(cfg.pideMas||[]).filter(x=>x.tema!==t).concat([{tema:t, f:new Date().toISOString()}]); guardarAj();
}
const pidioMas = (t, p=perfil()) => (cfgDe(p).pideMas||[]).find(x=>x.tema===t);

/* ---------- pantalla: ¿Qué te gusta? ---------- */
let temasSel=[];
definir('temas', {nav:'', pintar(o){
  o=o||{}; const p=perfil(); const actuales=temasDe(p);
  const cambiar=o.cambiar||null; const otro = cambiar ? actuales.find(t=>t!==cambiar) : null;
  temasSel = cambiar ? [] : actuales.slice();
  const necesita = cambiar ? 1 : 2;
  const tit = cambiar ? 'Elige un tema nuevo' : `¿Qué te gusta, ${esc(p.nombre)}?`;
  const sub = cambiar ? `En lugar de ${esc(nombreTema(cambiar))}.${otro?` Sigues con ${esc(nombreTema(otro))}.`:''}` : 'Elige 2 temas. Cada día leerás una historia de ellos.';
  $('#s-temas').innerHTML = `<div class="centro"><h1 class="tit">${tit}</h1><p class="sub">${sub}</p></div>
  <div class="temas-elegir">${TEMAS.map(t=>{ const e=estadoTema(t.id,p); const fijo = !!cambiar && t.id===otro; const acabado = !!cambiar && e.terminado;
    return `<button type="button" class="tema-e" data-t="${t.id}" aria-pressed="false" ${fijo||acabado?'disabled':''}>
      <span class="ft">${imgHTML(t.foto,true)}<span class="emo-t">${t.emo}</span><span class="marca">${ic('check')}</span></span>
      <span class="tx"><b>${esc(t.nombre)}</b><span class="nota">${esc(descTema(t))}</span><span class="chip">${fijo?'Ya lo tienes':acabado?'Ya lo has terminado':`${e.total} historias${e.leidas?` · ${e.leidas} leídas`:''}`}</span></span></button>`; }).join('')}</div>
  <div class="pie-temas"><span class="cuenta-sel" id="tmCuenta"></span><button class="btn btn-p btn-xl" type="button" id="tmListo" disabled>¡Listo! ${ic('flecha')}</button></div>`;
  const pintarSel=()=>{ $$('#s-temas [data-t]').forEach(b=>{ const on=temasSel.includes(b.dataset.t); b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on)); });
    const n=temasSel.length; $('#tmCuenta').textContent = n<necesita ? (necesita===1?'Elige 1 tema':`Elige ${necesita-n} ${necesita-n===1?'tema más':'temas'}`) : (cambiar?`Nuevo tema: ${nombreTema(temasSel[0])}`:`${nombreTema(temasSel[0])} y ${nombreTema(temasSel[1])}`);
    $('#tmListo').disabled = n!==necesita; };
  $$('#s-temas [data-t]').forEach(b=>b.onclick=()=>{ const t=b.dataset.t;
    if(temasSel.includes(t)) temasSel=temasSel.filter(x=>x!==t);
    else { temasSel.push(t); if(temasSel.length>necesita) temasSel.shift(); sonido('toc'); decir(nombreTema(t)); }
    pintarSel(); });
  $('#tmListo').onclick=()=>{
    const nuevos = cambiar ? [otro, temasSel[0]].filter(Boolean) : temasSel.slice();
    fijarTemas(p, nuevos, cambiar ? 'cambia '+nombreTema(cambiar) : (actuales.length?'cambia':'primera vez'));
    decir(`¡Genial! Ahora leerás historias de ${nuevos.map(nombreTema).join(' y ')}.`);
    $('#tmListo').disabled=true; confeti($('#s-temas')); setTimeout(()=>ir(o.volver || 'inicio'), 1200);
  };
  pintarSel();
  decir(cambiar ? 'Elige un tema nuevo.' : `¿Qué te gusta, ${p.nombre}? Elige dos temas.`);
}, salir(){ callar(); }});

/* aviso en Inicio cuando se acaba un tema */
function avisoTemasHTML(){
  const p=perfil(); const ts=temasDe(p); if(!ts.length) return '';
  return ts.map(t=>{ const e=estadoTema(t,p); const T=temaDe(t);
    if(e.terminado){ const pm=pidioMas(t,p);
      return `<div class="card aviso-tema"><span class="emo-g">${T.emo}</span><div><b>¡Has terminado todas las historias de ${esc(T.nombre)}!</b><span class="nota">${pm?'Ya hemos pedido más historias. Mientras llegan, puedes elegir otro tema.':'¿Quieres más historias de este tema o prefieres elegir otro?'}</span></div>
        <div class="botones">${pm?'':`<button class="btn btn-borde btn-g" type="button" data-mas="${t}">Quiero más de ${esc(T.nombre)}</button>`}<button class="btn btn-p btn-g" type="button" data-cambia="${t}">Elegir otro tema</button></div></div>`; }
    if(e.quedan>0 && e.quedan<=3) return `<div class="card aviso-tema suave"><span class="emo-g">${T.emo}</span><div><b>Te ${e.quedan===1?'queda 1 historia':'quedan '+e.quedan+' historias'} de ${esc(T.nombre)}</b><span class="nota">Cuando las termines podrás pedir más o elegir otro tema.</span></div></div>`;
    return ''; }).join('');
}
function activarAvisoTemas(raiz){
  $$('[data-mas]', raiz).forEach(b=>b.onclick=()=>{ pedirMas(b.dataset.mas); aviso('¡Se lo diremos a tu familia!'); decir(`¡Muy bien! Pediremos más historias de ${nombreTema(b.dataset.mas)}.`); ir('inicio'); });
  $$('[data-cambia]', raiz).forEach(b=>b.onclick=()=>ir('temas', {cambiar:b.dataset.cambia}));
}
function chipsTemasHTML(p=perfil()){
  const ts=temasDe(p); if(!ts.length) return '';
  return `<div class="mis-temas-chips"><span class="nota">Tus temas:</span>${ts.map(t=>`<span class="chip">${temaDe(t).emo} ${esc(nombreTema(t))}</span>`).join('')}<button class="btn btn-mini" type="button" data-ir="mipantalla">Cambiar</button></div>`;
}
/* Mi pantalla: mis temas */
function misTemasHTML(p=perfil()){
  const ts=temasDe(p);
  return `<div class="card bloque" style="margin-top:20px"><h3>Mis temas</h3><p class="nota" style="margin:6px 0 12px">Cada día lees una historia de tus temas. Cuando termines uno, eliges otro.</p>
    ${ts.length?`<div class="mis-temas">${ts.map(t=>{ const T=temaDe(t), e=estadoTema(t,p); const puede=e.leidas>=5 || e.terminado;
      return `<div class="mi-tema"><span class="ft">${imgHTML(T.foto)}</span><div class="tx"><b>${T.emo} ${esc(T.nombre)}</b><span class="nota">${e.leidas} de ${e.total} historias leídas</span><span class="barra-t"><i style="width:${e.total?Math.round(100*e.leidas/e.total):0}%;background:var(--green)"></i></span></div>
        <button class="btn btn-mini" type="button" data-cambia="${t}" ${puede?'':'disabled'} title="${puede?'':'Podrás cambiarlo cuando leas 5 historias'}">Cambiar</button></div>`; }).join('')}</div>
      <p class="nota" style="margin-top:8px">Puedes cambiar un tema cuando hayas leído 5 historias de él.</p>`
    : `<button class="btn btn-p btn-g" type="button" data-ir="temas">Elegir mis temas</button>`}</div>`;
}

/* ---------- álbumes de cromos por tema ---------- */
function albumesDe(p=perfil()){
  const ts=temasDe(p); const orden=[...ts, ...TEMAS.map(t=>t.id).filter(t=>!ts.includes(t)), 'fiestas'];
  const leid=typeof cromosDe==='function' ? cromosDe(p) : leidasDe(p.id);
  return orden.map(id=>{ const T=temaDe(id), hs=historiasTema(id); const n=hs.filter(h=>leid[h.id]).length; return {id, T, hs, n, total:hs.length, mio:ts.includes(id), completo: hs.length>0 && n===hs.length}; }).filter(a=>a.total);
}

/* ---------- familia: temas e intereses de cada niño ---------- */
function temasAdultoHTML(p){
  const cfg=cfgDe(p), ts=temasDe(p), ms=sesDe(p.id);
  const porTema={}; ms.forEach(s=>{ const T=temaDeMundo(s.mundo); if(!T) return; const x=porTema[T.id]||(porTema[T.id]={n:0, comp:[], ppm:[], ult:null}); x.n++; x.comp.push(pctComp(s)); if(s.ppm) x.ppm.push(s.ppm); x.ult=s.fecha; });
  const fila=(id)=>{ const T=temaDe(id), e=estadoTema(id,p), x=porTema[id]||{n:0,comp:[],ppm:[]};
    return `<tr><td><b>${T.emo} ${esc(T.nombre)}</b>${ts.includes(id)?' <span class="nb bien">elegido</span>':''}</td><td>${e.leidas} / ${e.total}</td><td>${x.comp.length?Math.round(media(x.comp))+' %':'–'}</td><td>${x.ppm.length?Math.round(media(x.ppm)):'–'}</td><td>${ts.includes(id)?(e.terminado?'<span class="nb medio">terminado</span>':`quedan ${e.quedan}`):'—'}</td></tr>`; };
  const otros=Object.keys(porTema).filter(id=>!ts.includes(id)).sort((a,b)=>porTema[b].n-porTema[a].n);
  const pm=(cfg.pideMas||[]).filter(x=>temaDe(x.tema) && estadoTema(x.tema,p).terminado); const log=(cfg.temasLog||[]).slice().reverse();
  return `<div class="graf-2"><div class="card bloque"><h3 style="margin-bottom:12px">Sus temas</h3>
      ${ts.length?`<div class="mis-temas">${ts.map(t=>{ const T=temaDe(t), e=estadoTema(t,p); return `<div class="mi-tema"><span class="ft">${imgHTML(T.foto)}</span><div class="tx"><b>${T.emo} ${esc(T.nombre)}</b><span class="nota">${e.leidas} de ${e.total} leídas${e.terminado?' · terminado':` · quedan ${e.quedan}`}</span><span class="barra-t"><i style="width:${e.total?Math.round(100*e.leidas/e.total):0}%;background:var(--green)"></i></span></div></div>`; }).join('')}</div>`:'<p class="vacio">Todavía no ha elegido sus temas. Se los pregunta la próxima vez que entre.</p>'}
      <div class="botones" style="margin-top:12px"><button class="btn btn-borde" type="button" id="btnCambiaTemas">${ic('usuarios')} ${ts.length?'Cambiar sus temas':'Elegir sus temas'}</button></div>
      ${pm.length?`<div class="pide-mas"><b>${esc(p.nombre)} ha pedido más historias de:</b> ${pm.map(x=>`${temaDe(x.tema)?temaDe(x.tema).emo:''} ${esc(nombreTema(x.tema))} <span class="nota">(${esc(fechaCorta(x.f))})</span>`).join(', ')}<p class="nota" style="margin-top:6px">Pídeselas a Claude («hazme 15 historias más de ${esc(nombreTema(pm[0].tema).toLowerCase())} para ${esc(p.nombre)}») y añádelas abajo, en «Historias nuevas».</p></div>`:''}</div>
    <div class="card bloque"><h3 style="margin-bottom:12px">También le interesa</h3>${otros.length?`<p class="nota" style="margin-bottom:8px">Historias que ha leído por su cuenta de otros temas:</p><div class="palabras-chips">${otros.map(id=>`<span>${temaDe(id).emo} ${esc(nombreTema(id))}<small>×${porTema[id].n}</small></span>`).join('')}</div>`:'<p class="vacio">Todavía no ha leído historias de otros temas por su cuenta.</p>'}
      ${log.length?`<h3 style="margin:18px 0 10px">Temas elegidos</h3><ul class="lista-log">${log.slice(0,8).map(x=>`<li><b>${esc(fechaCorta(x.f))}</b> · ${x.temas.map(nombreTema).map(esc).join(' y ')}</li>`).join('')}</ul>`:''}</div></div>
  <div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:12px">Lecturas por tema</h3><div class="tabla-w"><table><thead><tr><th>Tema</th><th>Leídas</th><th>Comprensión</th><th>Palabras/min</th><th>Estado</th></tr></thead><tbody>${[...ts, ...otros].map(fila).join('') || '<tr><td colspan="5" class="vacio">Sin lecturas todavía.</td></tr>'}</tbody></table></div></div>
  <div class="card bloque" style="margin-top:18px" id="histNuevas"><h3>Historias nuevas</h3><p class="nota" style="margin:6px 0 12px">Para añadir historias a un tema, pídeselas a Claude y te dará un archivo <b>.json</b>. Añádelo aquí y aparecen en el tema y en el calendario de quien tenga ese tema.</p><div id="listaNuevas" class="nota">Cargando…</div>
    <div class="botones" style="margin-top:12px"><button class="btn btn-p" type="button" id="btnAddHist">+ Añadir historias (.json)</button></div></div>`;
}
async function activarTemasAdulto(p){
  $('#btnCambiaTemas').onclick=()=>{ usarPerfil(p.id); ir('temas', {volver:'evolucion'}); };
  const pintarLista=async()=>{ let l=[]; try{ l=await api('/api/historias-nuevas'); }catch(e){}
    $('#listaNuevas').innerHTML = l.length ? `<table><thead><tr><th>Archivo</th><th>Historias</th><th>Temas</th><th></th></tr></thead><tbody>${l.map(x=>`<tr><td>${esc(x.archivo)}</td><td>${x.n}</td><td>${esc(Object.entries(x.mundos||{}).map(([m,n])=>(temaDeMundo(m)||{nombre:m}).nombre+' ('+n+')').join(', '))}</td><td><button class="btn btn-mini btn-rojo" type="button" data-qn="${esc(x.archivo)}">Quitar</button></td></tr>`).join('')}</tbody></table>` : 'Todavía no se ha añadido ninguna.';
    $$('#listaNuevas [data-qn]').forEach(b=>b.onclick=()=>dialogo({titulo:'¿Quitar estas historias?', html:'<p class="nota">El archivo se mueve a la papelera de la carpeta de datos. Las lecturas ya hechas se conservan.</p>', botones:[{t:'Conservar',cls:'btn'},{t:'Quitar',cls:'btn-rojo', fn:async()=>{ await borrar('/api/historias-nuevas/'+encodeURIComponent(b.dataset.qn)); await recargarContenido(); ir('evolucion','temas'); }}]}));
  };
  pintarLista();
  $('#btnAddHist').onclick=async()=>{
    const i=document.createElement('input'); i.type='file'; i.accept='.json,application/json';
    i.onchange=async()=>{ const f=i.files[0]; if(!f) return; let datos; try{ datos=JSON.parse(await f.text()); }catch(e){ dialogo({titulo:'Ese archivo no vale', html:'<p class="nota">No es un archivo de historias (.json).</p>', botones:[{t:'Vale',cls:'btn-p'}]}); return; }
      try{ const r=await postJSON('/api/historias-nuevas', {nombre:f.name, historias:Array.isArray(datos)?datos:datos.historias});
        await recargarContenido(); aviso(`${r.n} historias añadidas`);
        if(r.descartadas && r.descartadas.length) dialogo({titulo:`${r.n} historias añadidas`, html:`<p class="nota">No se han podido añadir ${r.descartadas.length}: ${esc(r.descartadas.slice(0,5).join('; '))}</p>`, botones:[{t:'Vale',cls:'btn-p'}]});
        ir('evolucion','temas');
      }catch(e){ dialogo({titulo:'No se pudieron añadir', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); } };
    i.click();
  };
}
async function recargarContenido(){ try{ CONT=await api('contenido.json?v='+Date.now()); for(const k in PLANES) delete PLANES[k]; }catch(e){ registrar('Recargar contenido: '+e.message); } }
