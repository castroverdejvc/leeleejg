/* LeeLEEJG · pantallas del niño: perfiles, inicio, calendario, historias, ajustes de lectura, álbum y práctica */
'use strict';

/* ---------- 01 · ¿Quién va a leer hoy? ---------- */
definir('quien', {pintar(){
  const ps=aj.perfiles.slice().sort((a,b)=>(!!a.prueba)-(!!b.prueba));
  $('#s-quien').innerHTML = `<div class="centro"><h1 class="tit">¿Quién va a leer hoy?</h1><p class="sub">Elige tu perfil para empezar.</p></div>
  <div class="quien-grid">${ps.map(p=>{ const f=fotoLector(p), fo=fondoLector(p); const n=Object.keys(cromosDe(p)).length;
    return `<button type="button" class="quien${p.prueba?' prueba':''}" data-p="${esc(p.id)}" style="--c:${esc(p.color)};--cs:${SUAVE[p.color]||'#E2EEFF'}">
      <span class="ft">${fo?`<img src="${fo}" alt="">`:''}</span><span class="circulo">${f?`<img src="${f}" alt="">`:esc(iniciales(p.nombre))}</span>
      <b>${esc(p.nombre)}</b><span class="nota">${p.prueba?'Para probar · no cuenta':`${n} ${n===1?'cromo':'cromos'}`}</span><span class="btn">Entrar</span></button>`; }).join('')}</div>
  <div class="centro"><button class="btn btn-borde" type="button" id="btnAnadirPerfil"><span style="width:26px;height:26px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;font-size:1.2rem">+</span>Añadir perfil</button></div>`;
  $$('#s-quien .quien').forEach(b=>b.onclick=()=>{ usarPerfil(b.dataset.p); ir('inicio'); });
  $('#btnAnadirPerfil').onclick=()=>ir('perfil','nuevo');
}});

/* ---------- 02 · Inicio: la historia de hoy ---------- */
function historiaDeHoy(){ return planDe().dias[diaDeHoy()] || CONT.historias[0]; }
definir('inicio', {nav:'inicio', pintar(){
  if(!temasDe(perfil()).length){ ir('temas'); return; }
  const h=historiaDeHoy(), c=leidas(); const hecha=!!c[h.id]; const hoyLeida=hecha && misSes().some(s=>s.historiaId===h.id && claveDia(s.fecha)===claveDia(new Date())); const P=planDe(), dHoy=diaDeHoy();
  let pend=0; for(let d=1; d<dHoy; d++) if(P.dias[d] && !c[P.dias[d].id]) pend++;
  const ult = misSes().slice(-3).reverse().map(s=>historia(s.historiaId)).filter(Boolean);
  const fotosCromos = (ult.length?ult:CONT.historias.slice(0,3)).slice(0,3).map(x=>imgHTML(x.portada)).join('');
  const yo=perfil(), fo=fondoLector(yo), fy=fotoLector(yo);
  const pendRep = typeof pendientesHoy==='function' && FICHAS.length ? Math.min(10, pendientesHoy().length) : 0;
  $('#s-inicio').innerHTML = `
  <div class="banda" style="--c:${esc(yo.color)};--cs:${SUAVE[yo.color]||'#E2EEFF'}">${fo?`<img class="fondo" src="${fo}" alt="">`:''}<span class="circulo">${fy?`<img src="${fy}" alt="">`:esc(iniciales(yo.nombre))}</span><b>¡Hola, ${esc(yo.nombre)}!</b><button class="btn btn-mini banda-btn" type="button" data-ir="mipantalla">${ic('imagen')} Mi pantalla</button></div>
  ${avisoTemasHTML()}
  ${atrasadasHTML()}
  ${temporadaHTML()}
  ${marcapaginasHTML()}
  <article class="card hoy"><div class="ft">${imgHTML(h.portada,true)}</div>
    <div class="tx"><span class="pill">${h.especial?iconoEspecial(h.especial)+' ':''}Tu historia de hoy · Día ${diaPersonal(h)||dHoy}</span>
      <h1>${esc(conNombre(h.titulo))}</h1><p>${esc(conNombre(h.resumen))}</p>
      ${hecha?'<span class="pill verde">'+ic('check')+(hoyLeida?' ¡Ya la has leído hoy!':' ¡Ya la has leído!')+'</span>':''}
      <button class="btn btn-p btn-xl" type="button" id="btnLeerHoy">${hecha?'Leer otra vez':'Leer'} ${ic('flecha')}</button></div></article>
  ${premiosHTML()}
  ${teleHTML()}
  ${extraHTML()}
  ${sobreHTML()}
  ${sorpresaHTML()}
  ${chipsTemasHTML()}
  <div class="fila2">
    <button class="acceso verde" type="button" data-ir="cromos"><span class="mini-fotos">${fotosCromos}</span><span><b>Mis cromos</b><span class="nota">${Object.keys(cromosDe(perfil())).length} de ${CONT.historias.length} conseguidos.</span></span><span class="ir">${ic('dcha')}</span></button>
    <button class="acceso amarillo" type="button" data-ir="repaso"><span class="icono-g" style="color:#C98A00">${ic('hoja')}</span><span><b>Fichas y dictado</b><span class="nota">${!FICHAS.length?'Te dicto palabras y tú me dices cómo se escriben.':pendRep?`Repaso de hoy: ${pendRep} ${pendRep===1?'palabra':'palabras'}. Y dictado.`:'¡Repaso de hoy hecho! ¿Un dictado?'}</span></span><span class="ir">${ic('dcha')}</span></button>
    <button class="acceso morado" type="button" data-ir="practicar"><span class="icono-g" style="color:#7C5CF0">${ic('lapiz')}</span><span><b>Practicar</b><span class="nota">Las palabras que más te cuestan.</span></span><span class="ir">${ic('dcha')}</span></button>
  </div>
  <button class="acceso blanco" type="button" data-ir="calendario"><span class="icono-g">${ic('calendario')}</span><span><b>Ver mi calendario</b>${pend?`<span class="nota">Tienes ${pend} ${pend===1?'historia':'historias'} sin leer de otros días.</span>`:''}</span><span class="ir">${ic('dcha')}</span></button>`;
  $('#btnLeerHoy').onclick=()=>empezarHistoria(h);
  if($('#btnSeguirHist')) $('#btnSeguirHist').onclick=seguirDondeLoDejo;
  activarAvisoTemas($('#s-inicio')); activarAtrasadas($('#s-inicio')); activarTemporada($('#s-inicio'));
  setTimeout(()=>{ if(actual==='inicio') comprobarPremios(); }, 400);
}});

/* ---------- 03 · Calendario ---------- */
let mesVisto=null;
definir('calendario', {nav:'calendario', pintar(){
  const hoy=hoySinHora(); if(!mesVisto) mesVisto=new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ini=fechaInicio(), fin=fechaDia(365);
  const m=mesVisto, primero=new Date(m.getFullYear(), m.getMonth(), 1), ultimoDia=new Date(m.getFullYear(), m.getMonth()+1, 0).getDate();
  const desfase=(primero.getDay()+6)%7; const c=leidas(); const dHoy=diaDeHoy();
  let celdas=''; const evs=[];
  for(let i=0;i<desfase;i++){ const d=new Date(primero); d.setDate(d.getDate()-(desfase-i)); celdas+=`<button class="dia fuera" type="button" tabindex="-1" disabled><span class="num">${d.getDate()}</span></button>`; }
  for(let dd=1; dd<=ultimoDia; dd++){
    const f=new Date(m.getFullYear(), m.getMonth(), dd); const n=diaDeFecha(f); const h=n>=1&&n<=365 ? planDe().dias[n] : null;
    if(!h || f<ini || f>fin){ celdas+=`<button class="dia fuera" type="button" disabled><span class="num">${dd}</span></button>`; continue; }
    const leido=!!c[h.id], esHoy=claveDia(f)===claveDia(hoy), ok=disponible(h);
    const cls = esHoy ? 'hoy' : leido ? 'leido' : (n<dHoy ? 'pend' : 'futuro');
    const ev = h.especial ? iconoEspecial(h.especial) : '';
    if(h.especial) evs.push([ev, h.especial.split('(')[0].trim(), dd]);
    celdas+=`<button class="dia ${cls}" type="button" data-h="${h.id}" ${ok?'':'aria-disabled="true"'} title="${esc(conNombre(h.titulo))}"><span class="num">${dd}</span>${ev?`<span class="ev">${ev}</span>`:''}${leido&&!esHoy?'<span class="ev" style="top:3px;bottom:auto;right:6px;left:auto;font-size:.7rem">✓</span>':''}</button>`;
  }
  const resto=(7-((desfase+ultimoDia)%7))%7; for(let i=1;i<=resto;i++) celdas+=`<button class="dia fuera" type="button" disabled><span class="num">${i}</span></button>`;
  const nombreMes=m.toLocaleDateString('es-ES',{month:'long', year:'numeric'});
  const puedeAtras = new Date(m.getFullYear(), m.getMonth(), 0) >= new Date(ini.getFullYear(), ini.getMonth(), 1);
  const puedeAdelante = new Date(m.getFullYear(), m.getMonth()+1, 1) <= fin;
  $('#s-calendario').innerHTML = `<div class="cal-cab"><div><h1 class="tit">Mi calendario</h1><p class="sub">Aquí puedes ver los días que has leído.</p></div>
    <div class="mes-nav"><button class="ico-btn" type="button" id="mesAnt" ${puedeAtras?'':'disabled'} aria-label="Mes anterior">${ic('izq')}</button><span style="min-width:180px;text-align:center">${esc(cap(nombreMes))}</span><button class="ico-btn" type="button" id="mesSig" ${puedeAdelante?'':'disabled'} aria-label="Mes siguiente">${ic('dcha')}</button></div></div>
  <div class="cal-cuerpo"><div class="card cal"><div class="dsem">${['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d=>`<span>${window.innerWidth<600?d.slice(0,2):d}</span>`).join('')}</div><div class="dias">${celdas}</div></div>
    <aside class="card leyenda"><div class="li"><i style="background:var(--green-2)"></i>Día leído</div><div class="li"><i style="background:var(--primary)"></i>Hoy</div><div class="li"><i style="background:#FFE9A8"></i>Pendiente</div><div class="li"><i style="background:#E4EAF3"></i>Todavía no</div>
      ${evs.length?'<hr>'+evs.map(([e,t,d])=>`<div class="ev-l"><span>${e}</span><span>${esc(conNombre(t))}<br><span class="nota">(${d} de ${m.toLocaleDateString('es-ES',{month:'long'})})</span></span></div>`).join(''):''}</aside></div>`;
  $('#mesAnt').onclick=()=>{ mesVisto=new Date(m.getFullYear(), m.getMonth()-1, 1); ir('calendario'); };
  $('#mesSig').onclick=()=>{ mesVisto=new Date(m.getFullYear(), m.getMonth()+1, 1); ir('calendario'); };
  $$('#s-calendario .dia[data-h]').forEach(b=>b.onclick=()=>{ const h=historia(b.dataset.h); if(disponible(h)) empezarHistoria(h); else dialogo({titulo:'Todavía no', html:`<p class="sub">Esta historia se abre el ${esc(fechaLarga(fechaDia(diaPersonal(h)||diaDeHoy())))}.</p>`, botones:[{t:'Vale', cls:'btn-p'}]}); });
}, salir(){ }});

/* ---------- 04 · Elige una historia ---------- */
let temaVisto=null;
const NIVEL_TXT=['Todos','Nivel 1','Nivel 2','Nivel 3','Nivel 4','Nivel 5'];
definir('historias', {nav:'historias', pintar(tema){
  if(tema!==undefined) temaVisto=tema;
  const niv=aj.nivel||0;
  const filtro=`<div class="niveles">${[0,1,2,3,4,5].map(n=>`<button type="button" class="n${n}" data-niv="${n}" aria-pressed="${n===niv}">${NIVEL_TXT[n]}</button>`).join('')}</div>`;
  const c=leidas();
  if(!temaVisto){
    $('#s-historias').innerHTML = `<div class="cab-filtros"><div><h1 class="tit">Elige una historia</h1><p class="sub">Descubre animales, héroes, deportes y muchas cosas más.</p></div>${filtro}</div>
    <div class="temas">${(()=>{ const mt=temasDe(perfil()); const mio=m=>{ const T=temaDeMundo(m.id); return T&&mt.includes(T.id)?0:1; }; return CONT.mundos.slice().sort((a,b)=>mio(a)-mio(b)); })().map(m=>{ const T=temaDeMundo(m.id); const esMio=T&&temasDe(perfil()).includes(T.id); const hs=CONT.historias.filter(h=>h.mundo===m.id && (!niv||h.nivel===niv)); const lei=hs.filter(h=>c[h.id]).length;
      const nivs=[...new Set(hs.map(h=>h.nivel))].sort(); const nv = niv || nivs[0] || 1;
      return `<button type="button" class="tema" data-m="${m.id}"><span class="ft">${imgHTML(m.foto,true)}</span><span class="tx"><b>${esc(m.nombre)}</b>${esMio?'<span class="chip tu-tema">⭐ Tu tema</span>':''}<span class="nota">${esc(conNombre(m.desc||''))}</span><span class="cuenta">${hs.length} historias · ${lei} leídas</span><span class="chip n${nv}">${niv?'Nivel '+niv:'Niveles '+nivs.join(', ')}</span></span></button>`; }).join('')}</div>`;
    $$('#s-historias .tema').forEach(b=>b.onclick=()=>ir('historias', b.dataset.m));
  } else {
    const m=mundoDe(temaVisto); const hs=CONT.historias.filter(h=>h.mundo===m.id && (!niv||h.nivel===niv));
    $('#s-historias').innerHTML = `<button class="volver" type="button" id="volTemas">${ic('atras')} Todos los temas</button>
    <div class="cab-filtros"><div><h1 class="tit">${esc(m.nombre)}</h1><p class="sub">${esc(conNombre(m.desc||''))}</p></div>${filtro}</div>
    <div class="historias">${hs.length?hs.map(h=>{ const ok=disponible(h);
      return `<button type="button" class="hist${ok?'':' bloq'}" data-h="${h.id}"><span class="ft">${imgHTML(h.portada)}${diaPersonal(h)?`<span class="dianum">Día ${diaPersonal(h)}</span>`:''}${c[h.id]?'<span class="ok">✓ Leída</span>':''}</span><span class="tx"><b>${esc(conNombre(h.titulo))}</b><span class="nota">${ok?esc(conNombre(h.resumen)):h.temporada?'Solo en '+esc(nombreTemporada(h.temporada)):(diaPersonal(h)?'Se abre el '+esc(fechaLarga(fechaDia(diaPersonal(h)))):'Cuando subas de nivel')}</span><span class="chip n${h.nivel}" style="justify-self:start">Nivel ${h.nivel}</span></span></button>`; }).join(''):'<p class="vacio">No hay historias de este nivel aquí.</p>'}</div>`;
    $('#volTemas').onclick=()=>ir('historias', null);
    $$('#s-historias .hist').forEach(b=>b.onclick=()=>{ const h=historia(b.dataset.h); if(disponible(h)) empezarHistoria(h); });
  }
  $$('#s-historias [data-niv]').forEach(b=>b.onclick=()=>{ aj.nivel=+b.dataset.niv; guardarAj(); ir('historias'); });
}});

/* ---------- 09 · Así quiero leer ---------- */
definir('asi', {nav:'', pintar(){
  const ej = `El [perro|perro] corre en el [jardín|jardin].`;
  $('#s-asi').innerHTML = `<div class="dos-col"><div><h1 class="tit">Así quiero leer</h1><p class="sub" style="margin-bottom:22px">Elige cómo quieres ver la lectura.</p>
    <div class="grupo-aj"><b>Tipo de letra</b><div class="opciones-g"><button type="button" class="op-g" data-letra="imprenta" aria-pressed="${aj.letra!=='ligada'}"><span class="muestra" style="font-family:var(--f-lect)">Aa</span>Imprenta</button><button type="button" class="op-g" data-letra="ligada" aria-pressed="${aj.letra==='ligada'}"><span class="muestra lig">Aa</span>Ligada</button></div></div>
    <div class="grupo-aj"><b>Espacio entre letras</b><div class="opciones-g"><button type="button" class="op-g" data-esp="normal" aria-pressed="${aj.espacio!=='amplio'}"><span class="muestra" style="font-family:var(--f-lect)">casa</span>Normal</button><button type="button" class="op-g" data-esp="amplio" aria-pressed="${aj.espacio==='amplio'}"><span class="muestra" style="font-family:var(--f-lect);letter-spacing:.18em">casa</span>Amplio</button></div><span class="nota">Con más espacio entre letras y palabras se lee mejor si las letras «bailan».</span></div>
    <div class="grupo-aj"><b>Tamaño de letra</b><div class="tam-btns"><button type="button" data-tam="-" aria-label="Letra más pequeña">A−</button><span id="tamV">${aj.tam}</span><button type="button" data-tam="+" aria-label="Letra más grande">A+</button></div></div>
    <div class="grupo-aj"><b>¿Cómo leemos?</b><div class="opciones-g">${['no','adulto','voz'].map(m=>`<button type="button" class="op-g" data-jun="${m}" aria-pressed="${(aj.juntos||'no')===m}"><span class="muestra">${JUNTOS_TXT[m].split(' ')[0]}</span>${JUNTOS_TXT[m].split(' ').slice(1).join(' ')}</button>`).join('')}</div><span class="nota">«Juntos»: el niño lee una frase y la siguiente la lee papá o mamá (o la voz del programa). También se cambia al leer, con el botón de arriba.</span></div>
    <div class="grupo-aj"><b>Imágenes en la lectura</b><div class="opciones-g"><button type="button" class="op-g" data-img="con" aria-pressed="${aj.img!=='sin'}">${imgHTML('perro')}Con fotos</button><button type="button" class="op-g" data-img="sin" aria-pressed="${aj.img==='sin'}"><span class="muestra" style="color:var(--ink-3)">${ic('imagen')}</span>Sin fotos</button></div></div></div>
    <div><div class="card vista"><b>Vista previa</b><div class="texto" id="vistaTexto"></div><p class="nota">Las palabras leídas se ven <b style="color:var(--green)">verdes</b>, la palabra que toca tiene <b style="color:var(--primary-d)">subrayado azul</b> y las que faltan se ven azul oscuro.</p></div>
    <button class="btn btn-p btn-g btn-bloque" type="button" id="btnGuardarAsi" style="margin-top:18px">Guardar</button></div></div>`;
  const pv=()=>{ const t=$('#vistaTexto'); const ws=pintarTexto(t, [ej]); t.classList.toggle('ligada', aj.letra==='ligada'); t.classList.toggle('sin-fotos', aj.img==='sin'); t.classList.toggle('amplio', aj.espacio==='amplio');
    ws.forEach((w,i)=>{ if(i<1) w.el.classList.add('leida'); if(i===1){ w.el.classList.add('actual'); (w.sylEls||[]).slice(0,1).forEach(s=>s.classList.add('ok')); } }); };
  pv(); aplicarLetra();
  $$('#s-asi [data-letra]').forEach(b=>b.onclick=()=>{ aj.letra=b.dataset.letra; $$('#s-asi [data-letra]').forEach(x=>x.setAttribute('aria-pressed', String(x===b))); pv(); });
  $$('#s-asi [data-esp]').forEach(b=>b.onclick=()=>{ aj.espacio=b.dataset.esp; $$('#s-asi [data-esp]').forEach(x=>x.setAttribute('aria-pressed', String(x===b))); pv(); });
  $$('#s-asi [data-jun]').forEach(b=>b.onclick=()=>{ aj.juntos=b.dataset.jun; $$('#s-asi [data-jun]').forEach(x=>x.setAttribute('aria-pressed', String(x===b))); });
  $$('#s-asi [data-img]').forEach(b=>b.onclick=()=>{ aj.img=b.dataset.img; $$('#s-asi [data-img]').forEach(x=>x.setAttribute('aria-pressed', String(x===b))); pv(); });
  $$('#s-asi [data-tam]').forEach(b=>b.onclick=()=>{ aj.tam=Math.max(22, Math.min(84, aj.tam+(b.dataset.tam==='+'?4:-4))); $('#tamV').textContent=aj.tam; aplicarLetra(); });
  $('#btnGuardarAsi').onclick=()=>{ guardarAj(); aviso('Guardado'); ir('inicio'); };
}});

/* ---------- 21 · Mis cromos ---------- */
let coleccion=null;
definir('cromos', {nav:'cromos', pintar(){
  const c=cromosDe(perfil()), rep=repesDe(perfil()); const nRep=Object.values(rep).reduce((a,b)=>a+b,0); const als=albumesDe(); if(!coleccion || !als.find(a=>a.id===coleccion)) coleccion=als[0].id;
  const A=als.find(a=>a.id===coleccion); const completos=als.filter(a=>a.completo).length; const falta=A.total-A.n;
  const huecos=barajarCon(A.hs.map((h,i)=>({h, n:i+1})), semilla('album-'+perfil().id+'-'+A.id));
  $('#s-cromos').innerHTML = `${albumTabsHTML('cromos')}<div class="album-cab"><div><h1 class="tit">Mis cromos</h1><p class="sub">Un álbum para cada tema. ¡Complétalos!</p></div><div class="contador">${ic('estrella').replace('<svg','<svg width="34" height="34"')}<div><b>${Object.keys(c).length} de ${CONT.historias.length}</b><br><span>cromos${completos?` · ${completos} ${completos===1?'álbum completo':'álbumes completos'}`:''}</span></div></div></div>
  <div class="card repes-barra"><span class="emo-g">🔁</span><div class="tx"><b>${nRep?`Tienes ${nRep} ${nRep===1?'cromo repetido':'cromos repetidos'}`:'Cromos repetidos'}</b><span class="nota">${nRep?'Cámbialos con otro niño de casa por cromos que te falten.':'Cuando vuelves a leer una historia que ya tenías, consigues un repe para cambiar.'}</span></div><button class="btn btn-p" type="button" data-ir="cambiar">Cambiar cromos</button></div>
  <div class="colecciones">${als.map(a=>`<button type="button" data-col="${a.id}" aria-pressed="${a.id===coleccion}" class="${a.mio?'mio':''}">${a.T.emo} ${esc(a.T.nombre)} <span>(${a.n}/${a.total})</span>${a.completo?' 🏆':''}</button>`).join('')}</div>
  <div class="card album-prog${A.completo?' completo':''}"><span class="emo-g">${A.completo?'🏆':A.T.emo}</span><div class="tx"><b>Álbum de ${esc(A.T.nombre)}${A.mio?' <span class="chip tu-tema">⭐ Tu tema</span>':''}</b><span class="nota">${A.completo?'¡Lo has completado!':`Tienes ${A.n} de ${A.total}. ${falta===1?'Te falta 1 cromo':'Te faltan '+falta+' cromos'}.`}</span><span class="barra-t"><i style="width:${Math.round(100*A.n/A.total)}%;background:var(--green)"></i></span></div></div>
  <div class="cromos">${huecos.map(({h,n})=> c[h.id]
    ? `<button type="button" class="cromo" data-h="${h.id}"><span class="num">${n}</span>${rep[h.id]?`<span class="repe">×${rep[h.id]+1}</span>`:''}${c[h.id]==='cambio'?'<span class="repe cambiado" title="Te lo dieron en un cambio">🔁</span>':''}<span class="ft">${imgHTML(h.portada)}</span><b>${esc(conNombre(h.titulo))}</b></button>`
    : `<div class="cromo bloq"><span class="num">${n}</span><span class="hueco-n">${n}</span><span class="nota">${h.temporada?esc(nombreTemporada(h.temporada)):'¿?'}</span></div>`).join('')}</div>`;
  activarAlbumTabs();
  $$('#s-cromos [data-col]').forEach(b=>b.onclick=()=>{ coleccion=b.dataset.col; ir('cromos'); });
  $$('#s-cromos .cromo[data-h]').forEach(b=>b.onclick=()=>ir('cromo', b.dataset.h));
}});

/* ---------- 22 · Mi cromo ---------- */
definir('cromo', {nav:'cromos', pintar(id){
  const h=historia(id); const m=mundoDe(h.mundo); const ss=misSes().filter(s=>s.historiaId===id); const ult=ss[ss.length-1];
  const texto=h.lineas.slice(0,3).map(l=>conNombre(l).replace(/\[([^|\]]+)\|[^\]]+\]/g,'$1'));
  $('#s-cromo').innerHTML = `<button class="volver" type="button" data-ir="cromos">${ic('atras')} Mis cromos</button>
  <div class="card detalle"><div class="ft">${imgHTML(h.portada,true)}</div><div class="tx"><span class="pill verde" style="justify-self:start">${esc(m.nombre)}</span><h1>${esc(conNombre(h.titulo))}</h1>
    ${ult?`<p class="nota" style="display:flex;gap:8px;align-items:center"><span style="width:20px;height:20px;display:inline-flex">${ic('calendario')}</span>Leído el ${esc(new Date(ult.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}))}${ss.length>1?` · ${ss.length} veces`:''}</p>`:''}
    <div class="texto ${claseTexto()}">${texto.map(t=>`<p>${esc(t)}</p>`).join('')}</div>
    <div class="botones"><button class="btn btn-borde btn-g" type="button" id="btnReleer">${ic('libro')} Volver a leer</button>${ult&&ult.audio?`<button class="btn btn-p btn-g" type="button" id="btnOirme">${ic('altavoz')} Escuchar mi lectura</button>`:''}</div></div></div>`;
  $('#btnReleer').onclick=()=>empezarHistoria(h);
  if(ult && ult.audio) $('#btnOirme').onclick=()=>sonarAudio('/api/audio/'+ult.id);
}});

/* ---------- 23–24 · Practicar ---------- */
function agregado(ms){ const a={}; ms.forEach(s=>(s.palabras||[]).forEach(p=>{ const x=a[p.p]||(a[p.p]={veces:0,prac:0,ayuda:0}); x.veces++; if(p.e==='practica') x.prac++; if(p.e==='ayuda') x.ayuda++; })); return a; }
function palabrasDificiles(ms){
  const a=agregado(ms), pr=aj.practica||{};
  return Object.entries(a).map(([p,x])=>({p, n:x.prac+x.ayuda - 2*((pr[p]||0)), veces:x.veces})).filter(x=>x.n>0 && x.p.length>1).sort((x,y)=>y.n-x.n);
}
function palabrasDominadas(ms){ return Object.entries(agregado(ms)).filter(([,a])=>a.prac===0 && a.ayuda===0 && a.veces>=2).map(([p])=>p); }
function listaPractica(){
  const dif=palabrasDificiles(misSes()).map(x=>x.p);
  const extra=[]; const vistas=new Set(dif);
  const hs = misSes().length ? misSes().slice(-6).map(s=>historia(s.historiaId)).filter(Boolean) : [historiaDeHoy()];
  hs.forEach(h=>h.lineas.forEach(l=>{ for(const m of l.matchAll(/\[([^|\]]+)\|([^\]]+)\]/g)){ const p=m[1].toLowerCase(); if(!vistas.has(p) && p.length>2){ vistas.add(p); extra.push(p); } } }));
  return [...dif, ...barajar(extra)].slice(0,10);
}
let practLista=[], practI=0, practHechas=[];
definir('practicar', {nav:'practicar', pintar(reiniciar){
  if(reiniciar!==false || !practLista.length){ practLista=listaPractica(); practI=0; practHechas=[]; }
  const p=practLista[practI]; if(!p){ ir('practicafin'); return; }
  const k=claveDePalabra(p); const sil=silabear(p);
  $('#s-practicar').innerHTML = `<div class="pag-cab"><h1 class="tit">Practicar una palabra</h1><div style="text-align:center"><b>${practI+1} de ${practLista.length}</b><div class="prog-puntos">${practLista.map((_,i)=>`<i class="${i<practI?'ok':i===practI?'on':''}"></i>`).join('')}</div></div></div>
  <div class="card practica"><div class="ft">${k?imgHTML(k,true):'📖'}</div><div><div class="palabra-g"><div class="silabas-g" id="silP">${sil.map((s,i)=>`<span class="s ${i%2?'b':'a'}" data-i="${i}">${esc(s)}</span>`).join('<span class="p">·</span>')}</div></div>
    <div class="botones"><button class="btn btn-borde btn-g" type="button" id="btnOirP">${ic('altavoz')} Escuchar</button><button class="btn btn-p btn-g" type="button" id="btnSigP">Siguiente palabra ${ic('flecha')}</button></div></div></div>
  ${tarjetaDictadoHTML()}`;
  activarTarjetaDictado($('#s-practicar'));
  const oir=async()=>{ const ss=$$('#silP .s'); let turno=null; const sigue=()=>turno===null || (turno===vozTurno && actual==='practicar');
    for(let i=0;i<sil.length && sigue();i++){ ss.forEach((x,j)=>x.classList.toggle('on', j===i)); const pr=decir(sil[i]); turno=vozTurno; await pr; await pausa(120); }
    if(!sigue()) return; ss.forEach(x=>x.classList.remove('on')); await decir(p); };
  $('#btnOirP').onclick=oir;
  $('#btnSigP').onclick=()=>{ aj.practica=aj.practica||{}; aj.practica[p]=(aj.practica[p]||0)+1; guardarAj(); practHechas.push(p); practI++; if(practI>=practLista.length) ir('practicafin'); else ir('practicar', false); };
  setTimeout(oir, 300);
}, salir(){ callar(); }});
definir('practicafin', {nav:'practicar', pintar(){
  const n=practHechas.length;
  $('#s-practicafin').innerHTML = `<div class="card buen-trabajo"><h1>¡Buen trabajo!</h1><p class="sub">Has practicado ${n} ${n===1?'palabra':'palabras'}.</p>
    <div class="tarjetas-pal">${practHechas.slice(-6).map(p=>{ const k=claveDePalabra(p); return `<div class="tp"><span class="ft">${k?imgHTML(k):'📖'}</span><b>${esc(p)} <i>${ic('check')}</i></b></div>`; }).join('')}</div>
    ${libroSVG()}
    <div class="botones" style="max-width:640px;margin:0 auto"><button class="btn btn-p btn-g" type="button" data-ir="inicio">${ic('casa')} Volver al inicio</button><button class="btn btn-borde btn-g" type="button" id="btnMasP">${ic('recargar')} Practicar más</button><button class="btn btn-borde btn-g" type="button" data-dic="lecturas">${ic('lapiz')} Hacer un dictado</button></div></div>`;
  activarTarjetaDictado($('#s-practicafin'));
  $('#btnMasP').onclick=()=>ir('practicar', true);
  decir(`¡Buen trabajo, ${nombre()}! Has practicado ${n} palabras.`);
}});
function libroSVG(){ return `<svg class="libro-ilus" viewBox="0 0 420 120" aria-hidden="true"><path d="M30 100 Q120 70 210 98 Q300 70 390 100 L390 110 Q300 84 210 112 Q120 84 30 110z" fill="#BFD9FF"/><path d="M60 92 Q130 60 210 88 L210 100 Q130 74 60 104z" fill="#fff" stroke="#9EC3F5"/><path d="M360 92 Q290 60 210 88 L210 100 Q290 74 360 104z" fill="#fff" stroke="#9EC3F5"/>
  <path d="M40 98 C30 70 50 50 44 30 M60 96 C64 74 80 66 76 48" stroke="#18B47B" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M380 98 C390 70 370 50 376 30 M360 96 C356 74 340 66 344 48" stroke="#8B5CF6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>
  <g fill="#F5B301"><circle cx="150" cy="40" r="5"/><circle cx="270" cy="36" r="5"/><circle cx="210" cy="22" r="6"/></g><g stroke="#F5B301" stroke-width="3" stroke-linecap="round"><path d="M190 52l-8-14M230 52l8-14M210 50V30"/></g></svg>`; }

/* ---------- Mi pantalla: cada niño elige su foto (círculo) y su imagen grande ---------- */
const FONDOS = ['portada_dinos','trex','portada_heroes','portada_oliver','portada_supa','portada_liga','portada_nba','portada_animales','delfin','lobo','planeta','castillo','playa','faro','arcoiris','bosque','volcan','estadio'];
definir('mipantalla', {nav:'', pintar(){
  const p=perfil(); const fo=fondoLector(p), fy=fotoLector(p);
  const propias=['fondo_'+p.id].filter(k=>MIS[k]);
  $('#s-mipantalla').innerHTML = `<h1 class="tit">Mi pantalla</h1><p class="sub" style="margin-bottom:16px">Elige tu foto y tu imagen grande.</p>
  <div class="banda grande" style="--c:${esc(p.color)};--cs:${SUAVE[p.color]||'#E2EEFF'}">${fo?`<img class="fondo" src="${fo}" alt="">`:''}<span class="circulo">${fy?`<img src="${fy}" alt="">`:esc(iniciales(p.nombre))}</span><b>¡Hola, ${esc(p.nombre)}!</b></div>
  <div class="dos-col" style="margin-top:20px"><div class="card bloque"><h3>Mi foto (el círculo)</h3><p class="nota" style="margin:6px 0 12px">Una foto tuya, de tu mascota o de lo que más te guste.</p>
      <div class="botones"><button class="btn btn-p btn-g" type="button" id="mpFoto">${ic('camara')} ${fy?'Cambiar mi foto':'Poner mi foto'}</button>${fy?`<button class="btn btn-g" type="button" id="mpQuitaFoto">Quitar</button>`:''}</div>
      <h3 style="margin-top:22px">Mi color</h3><div class="colores" style="margin-top:10px">${COLORES.map(c=>`<button type="button" style="--c:${c}" data-col="${c}" aria-pressed="${c===p.color}" aria-label="Color"></button>`).join('')}</div></div>
    <div class="card bloque"><h3>Mi imagen grande (el rectángulo)</h3><p class="nota" style="margin:6px 0 12px">Elige una o sube la tuya.</p>
      <div class="lista-img fondos">${propias.map(k=>`<button type="button" class="it-img" data-fo="${k}" aria-pressed="${fondoLector(p)===fotoURL(k,true)}"><span class="ft"><img src="${fotoURL(k)}" alt=""><span class="tuya">Mía</span></span></button>`).join('')}
        ${FONDOS.filter(k=>fotoURL(k)).map(k=>`<button type="button" class="it-img" data-fo="${k}" aria-pressed="${p.fondo===k}"><span class="ft"><img src="${fotoURL(k)}" alt=""></span></button>`).join('')}
        <button type="button" class="it-img" data-fo="" aria-pressed="${!fo}"><span class="ft" style="background:${SUAVE[p.color]||'#E2EEFF'}"></span><b>Solo color</b></button></div>
      <div class="botones" style="margin-top:12px"><button class="btn btn-borde btn-g" type="button" id="mpSubir">${ic('imagen')} Subir mi imagen</button></div></div></div>
  ${misTemasHTML(p)}`;
  activarAvisoTemas($('#s-mipantalla'));
  $('#mpFoto').onclick=async()=>{ const a=await elegirArchivo(); if(!a) return; const b=await abrirRecorte(a,{aspecto:1, redonda:true, titulo:'Tu foto', ancho:600}); if(!b) return; await subirImagen('lector_'+p.id, b); pintarCabecera(); ir('mipantalla'); };
  if($('#mpQuitaFoto')) $('#mpQuitaFoto').onclick=async()=>{ const k=claveLector(p); await borrar('/api/misimagenes/'+k).catch(()=>{}); delete MIS[k]; pintarCabecera(); ir('mipantalla'); };
  $('#mpSubir').onclick=async()=>{ const a=await elegirArchivo(); if(!a) return; const b=await abrirRecorte(a,{aspecto:3, titulo:'Tu imagen grande', ancho:1500}); if(!b) return; await subirImagen('fondo_'+p.id, b); p.fondo='fondo_'+p.id; guardarAj(); ir('mipantalla'); };
  $$('#s-mipantalla [data-fo]').forEach(b=>b.onclick=()=>{ p.fondo=b.dataset.fo; if(!p.fondo && MIS['fondo_'+p.id]) p.fondo='__nada'; guardarAj(); ir('mipantalla'); });
  $$('#s-mipantalla [data-col]').forEach(b=>b.onclick=()=>{ p.color=b.dataset.col; guardarAj(); pintarCabecera(); ir('mipantalla'); });
}});
