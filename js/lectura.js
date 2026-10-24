/* LeeLEEJG · leer una historia: micrófono, lectura, ayuda, preguntas, cálculo y cromo */
'use strict';
let hist=null, sesion=null, audioBlob=null, micProbado=false, sinMic=false;

/* ---------- texto con sílabas y fotos junto a su palabra ---------- */
function tokenizar(linea){
  const out=[]; const re=/\[([^|\]]+)\|([^\]]+)\]|([^\s\[]+)|(\s+)/g; let m, esp=false;
  while((m=re.exec(linea))){ if(m[4]){ esp=true; continue; }
    if(m[1]) out.push({tipo:'foto', texto:m[1], clave:m[2], esp}); else out.push({tipo:'texto', texto:m[3], esp}); esp=false; }
  return out;
}
function personajeDe(texto){
  const n=normalizar(texto); if(!n) return null;
  if(n===normalizar(nombre()) && MIS[claveLector()]) return claveLector();
  const p=PERSONAJES.find(p=>p.palabras.some(w=>normalizar(w)===n)); return p && MIS[p.clave] ? p.clave : null;
}
function pintarTexto(cont, lineas){
  cont.innerHTML=''; const lista=[];
  lineas.forEach((l,li)=>{
    const p=document.createElement('p'); p.dataset.li=li;
    tokenizar(conNombre(l)).forEach(tk=>{
      if(tk.esp) p.appendChild(document.createTextNode(' '));
      const norm=normalizar(tk.texto);
      const w=document.createElement('span'); w.className='w';
      const sil = norm ? silabasVisibles(tk.texto) : [tk.texto];
      w.innerHTML = sil.map(s=>`<span class="s">${esc(s)}</span>`).join('');
      const clave = tk.tipo==='foto' ? tk.clave : personajeDe(tk.texto);
      let nodo=w;
      if(clave){ const f=document.createElement('span'); f.className='fp'; f.appendChild(w); f.insertAdjacentHTML('beforeend', imgHTML(clave)); nodo=f; }
      if(norm){ w.dataset.i=lista.length; const pal=limpiar(tk.texto); const t=(CONT.trozos||{})[pal];
        const silRaw = t ? t.slice() : silabear(pal);
        lista.push({el:w, norm, p:pal, foto:tk.tipo==='foto', clave, sylEls:[...w.children], silRaw, sil:silRaw.map(normalizar).filter(Boolean), linea:li}); }
      p.appendChild(nodo);
    });
    cont.appendChild(p);
  });
  return lista;
}

/* ---------- leer juntos: una frase el niño y la siguiente papá, mamá o la voz del programa ---------- */
const JUNTOS_TXT = {no:'👦 Leo yo solo', adulto:'👨‍👧 Con papá o mamá', voz:'🔊 Con la voz'};
/* escucha previa: el programa lee la historia antes y luego la lee el niño */
const ESCUCHAR_TXT = {no:['📖','Leo yo directamente'], boton:['🔊','Puedo pedirla'], nuevas:['🎧','La oigo antes si es nueva']};
function marcarJuntos(){
  const modo=aj.juntos||'no';
  palabras.forEach(w=>{ w.adulto = modo!=='no' && w.linea%2===1; });
  $$('#texto p').forEach(p=>{ const ad = modo!=='no' && (+p.dataset.li)%2===1; p.classList.toggle('linea-adulto', ad); p.dataset.quien = ad ? (modo==='voz'?'🔊 La voz':'👨‍👧 Papá o mamá') : ''; });
}
function saltarLineaAdulto(){
  const l=lect; if(!l) return; const w=palabras[l.puntero||0]; if(!w || !w.adulto) return;
  let j=l.puntero; while(j<palabras.length && palabras[j].linea===w.linea) j++;
  l.turnoLinea=null; l.forzado=j; alinear();
}
/* lo llama alinear(): cuando el turno es de la línea del adulto */
function turnoJuntos(ptr){
  const l=lect; if(!l || !l.activa || l.pausadoDesde) return; const w=palabras[ptr]; const b=$('#btnSigPal');
  if(!w || !w.adulto){ if(b) b.innerHTML='Siguiente '+ic('dcha'); return; }
  if(b) b.innerHTML = aj.juntos==='voz' ? '🔊 Leyendo…' : 'Ya ha leído papá o mamá '+ic('dcha');
  if(l.turnoLinea===w.linea) return; l.turnoLinea=w.linea;
  if(aj.juntos==='voz'){ const p=w.el.closest('p'); const linea=w.linea; decir(p.textContent.replace(/\s+/g,' ').trim()).then(()=>{ if(lect===l && l.turnoLinea===linea){ const x=palabras[l.puntero||0]; if(x && x.linea===linea) saltarLineaAdulto(); } }); }
}

/* ---------- empezar una historia ---------- */
function empezarHistoria(h){
  hist = typeof iaVariante==='function' ? iaVariante(h) : h;   // al volver a leerla, las preguntas nuevas aprobadas (Ayudante IA)
  sesion=null; audioBlob=null; lect=null;
  sinMic=false;   // «Leer sin micrófono» vale solo para una historia: en la siguiente se vuelve a ofrecer
  if(!micProbado && navigator.mediaDevices) ir('mic'); else ir('lectura');
}
/* ---------- marcapáginas: seguir donde lo dejó ---------- */
// a mitad de leer: aj.marcapaginas = {historiaId, palabra, f}; con la lectura hecha y preguntas sin terminar: la sesión «incompleta»
const marcaLectura = h => { const m=aj.marcapaginas; return m && h && m.historiaId===h.id && m.palabra>0 ? m.palabra : 0; };
function guardarMarcapaginas(){
  if(!lect || !hist || !palabras.length) return;
  const n=Math.max(lect.puntero||0, lect.inicio||0);
  if(n>0 && n<palabras.length){ aj.marcapaginas={historiaId:hist.id, palabra:n, f:new Date().toISOString()}; guardarAj(); }
}
function sesionAMedias(){
  const ms=misSes(); for(let i=ms.length-1;i>=0;i--){ const s=ms[i]; if(!historia(s.historiaId)) continue;
    if(ms.slice(i+1).some(x=>x.historiaId===s.historiaId)) continue; if(s.incompleta) return s; }
  return null;
}
function marcapaginasHTML(){
  const s=sesionAMedias(); const m=aj.marcapaginas; const hm=m && historia(m.historiaId);
  if(s){ const h=historia(s.historiaId); const hechas=s.preguntas.length;
    return `<button class="card acceso seguir" type="button" id="btnSeguirHist"><span class="mini-fotos">${imgHTML(h.portada)}</span><span><b>Seguir donde lo dejaste</b><span class="nota">«${esc(conNombre(h.titulo))}»: ya la has leído; ${hechas?`llevas ${hechas} de ${h.preguntas.length} preguntas`:'te faltan las preguntas'}.</span></span><span class="ir">${ic('dcha')}</span></button>`; }
  if(hm && m.palabra>0) return `<button class="card acceso seguir" type="button" id="btnSeguirHist"><span class="mini-fotos">${imgHTML(hm.portada)}</span><span><b>Seguir leyendo</b><span class="nota">«${esc(conNombre(hm.titulo))}»: te quedaste a mitad de la historia.</span></span><span class="ir">${ic('dcha')}</span></button>`;
  return '';
}
function seguirDondeLoDejo(){
  const s=sesionAMedias();
  if(s){ hist=historia(s.historiaId); if(s.pregIA && typeof iaVariante==='function') hist=iaVariante(hist, true); sesion=JSON.parse(JSON.stringify(s)); sesion._audioSubido=true; audioBlob=null; lect=null;
    qi=sesion.preguntas.length; qEst=null; cEst=null;
    if(qi<hist.preguntas.length) ir('pregunta'); else if(hist.calculo && !sesion.calculo) ir('calculo'); else ir('cromonuevo');
    return; }
  const m=aj.marcapaginas; const h=m && historia(m.historiaId); if(h) empezarHistoria(h);
}
function pasos(){ return 1 + hist.preguntas.length + (hist.calculo?1:0) + 1; }
function cabPaso(n, etiqueta, extra=''){ const T=pasos(); return `<div class="paso-cab"><span class="pill${etiqueta.cls?' '+etiqueta.cls:''}">${etiqueta.t}</span>${extra}<span class="der">${n} de ${T}<span class="barra-paso"><i style="width:${Math.round(100*n/T)}%"></i></span></span></div>`; }

/* ---------- 10 · Preparar el micrófono ---------- */
function mascotaSVG(){ return `<svg class="mascota" viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="120" fill="#EAF2FE"/>
  <g stroke="#1E7BF2" stroke-width="9" stroke-linecap="round"><path d="M52 92l26 18M248 92l-26 18M40 150h30M260 150h-30M60 206l24-12M240 206l-24-12"/></g>
  <rect x="104" y="50" width="92" height="132" rx="46" fill="#fff" stroke="#C9D8EE" stroke-width="4"/><path d="M104 96a46 46 0 0 1 92 0z" fill="#2F7FF0"/>
  <g stroke="#fff" stroke-width="3" opacity=".55"><path d="M118 70h64M112 84h76"/></g>
  <circle cx="132" cy="122" r="6" fill="#13204A"/><circle cx="168" cy="122" r="6" fill="#13204A"/><path d="M134 142q16 14 32 0" stroke="#13204A" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M150 182v30" stroke="#C9D8EE" stroke-width="10"/><rect x="112" y="210" width="76" height="16" rx="8" fill="#2F7FF0"/></svg>`; }
let pruebaMic=null;
definir('mic', {pintar(){
  $('#s-mic').innerHTML = `<div class="centro" style="margin-bottom:10px"><h1 class="tit">Preparar el micrófono</h1><p class="sub">Di hola para probar. Tu voz me ayudará a leer contigo.</p></div>
  <div class="mic-pant"><div>${mascotaSVG()}</div><div class="card bloque" style="display:grid;gap:14px">
    <h2 class="centro" style="font-size:1.5rem">Di «hola» para probar</h2><div class="medidor" id="medidor">${'<i></i>'.repeat(16)}</div>
    <p class="estado-mic" id="estadoMic">Pulsa «Probar» y di hola.</p>
    <button class="btn btn-p btn-g" type="button" id="btnProbarMic">${ic('mic')} Probar</button>
    <button class="btn btn-g" type="button" id="btnSinMic">Leer sin micrófono</button></div></div>`;
  $('#btnSinMic').onclick=()=>{ sinMic=true; ir('lectura'); };
  $('#btnProbarMic').onclick=probarMic;
  setTimeout(probarMic, 250);
}, salir(){ pararPruebaMic(); }});
function pararPruebaMic(){ if(pruebaMic){ pruebaMic.fin=true; try{ pruebaMic.st.getTracks().forEach(t=>t.stop()); pruebaMic.src.disconnect(); }catch(e){} pruebaMic=null; } }
async function probarMic(){
  pararPruebaMic();
  const est=$('#estadoMic'), btn=$('#btnProbarMic'); if(!est) return;
  try{
    const st=await navigator.mediaDevices.getUserMedia({audio:true});
    if(actual!=='mic'){ st.getTracks().forEach(t=>t.stop()); return; }   // ya se ha salido de la pantalla
    const a=ctxAudio(); try{ await a.resume(); }catch(e){}
    const an=a.createAnalyser(); an.fftSize=512; const src=a.createMediaStreamSource(st); src.connect(an);
    pruebaMic={st, src, fin:false}; const yo=pruebaMic; const barras=$$('#medidor i'); const t0=Date.now(); let pico=0, oido=0;
    est.className='estado-mic'; est.textContent='Te escucho… di «hola».'; btn.disabled=true;
    (function bucle(){ if(yo.fin) return; if(actual!=='mic'){ if(pruebaMic===yo) pararPruebaMic(); return; }
      const v=nivel(an); pico=Math.max(pico*0.96, v); const on=Math.round(pico*barras.length*1.4);
      barras.forEach((b,i)=>b.classList.toggle('on', i<on)); if(v>0.16) oido++;
      if(oido>6){ est.className='estado-mic ok'; est.textContent='¡Se oye bien!'; micProbado=true; sinMic=false; btn.disabled=false; btn.innerHTML='¡A leer! '+ic('flecha'); btn.onclick=()=>ir('lectura'); pararPruebaMic(); return; }
      if(Date.now()-t0>7000){ pararPruebaMic(); ir('nooye'); return; }
      requestAnimationFrame(bucle); })();
  }catch(e){ est.className='estado-mic'; est.textContent='No hay permiso para usar el micrófono.'; btn.disabled=false; registrar('Prueba de micrófono: '+e.message); }
}

/* ---------- 11 · No se oye bien ---------- */
definir('nooye', {pintar(){
  $('#s-nooye').innerHTML = `<div class="nooye"><div class="ilus"><svg viewBox="0 0 300 220" aria-hidden="true"><rect x="70" y="40" width="170" height="110" rx="10" fill="#fff" stroke="#C9D8EE" stroke-width="5"/><path d="M50 160h210l-16 22H66z" fill="#C9D8EE"/>
    <circle cx="150" cy="96" r="26" fill="#E2EEFF"/><rect x="141" y="78" width="18" height="30" rx="9" fill="#1E7BF2"/><path d="M134 100a16 16 0 0 0 32 0M150 116v8" stroke="#1E7BF2" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g stroke="#9EC3F5" stroke-width="5" fill="none" stroke-linecap="round"><path d="M40 80q-12 20 0 40M24 66q-20 34 0 68"/></g></svg></div>
    <div class="centro" style="display:grid;gap:16px;justify-items:center"><h1 class="tit">No se oye bien</h1><p class="sub">Acerca el micrófono y prueba otra vez.</p>
      <button class="btn btn-p btn-g" type="button" data-ir="mic" style="min-width:280px">${ic('recargar')} Reintentar</button>
      <button class="btn btn-g" type="button" id="btnSeguirSin" style="min-width:280px">Seguir sin micrófono</button></div></div>`;
  $('#btnSeguirSin').onclick=()=>{ sinMic=true; ir('lectura'); };
}});

/* ---------- 05–08 · Lectura ---------- */
definir('lectura', {nav:'historias', pintar(modo){
  if(modo==='seguir' && lect){ reanudarLectura(); return; }
  const h=hist;
  $('#s-lectura').innerHTML = `<div class="card lect-card leyendo"><div class="lect-cab"><span class="t">${diaPersonal(h)?'Día '+diaPersonal(h):esc((temaDeMundo(h.mundo)||{nombre:''}).nombre)} · ${esc(conNombre(h.titulo))}</span><span class="der">${marcaLectura(h)?'<button class="btn btn-mini" type="button" id="btnDesdeInicio">Empezar desde el principio</button>':''}${(aj.escuchar||'boton')!=='no'?`<button class="btn btn-mini btn-escuchar" type="button" id="btnEscuchar" title="El programa la lee primero y luego la lees tú">🔊 Escúchala primero</button>`:''}<button class="btn btn-mini btn-juntos" type="button" id="btnJuntos" title="Leer solo, con papá o mamá, o con la voz del programa">${JUNTOS_TXT[aj.juntos||'no']}</button><button class="btn btn-mini btn-sig-pal" type="button" id="btnSigPal" title="Si ya la has leído y no se pone verde">Siguiente ${ic('dcha')}</button><span class="mic-ind" id="micInd"><i></i><span id="micTxt">Preparando…</span></span></span></div>
    <div class="texto ${claseTexto()} ${aj.img==='sin'?'sin-fotos':''}" id="texto"></div>
    <div class="lect-barra"><button class="ico-btn" type="button" id="btnFrase" aria-label="Escuchar la frase">${ic('altavoz')}</button><div class="prog"><i id="progLect"></i></div>
      <button class="ico-btn" type="button" id="btnPausa" aria-label="Pausa">${ic('pausa2')}</button><button class="btn btn-p" type="button" id="btnTermine">Terminé ${ic('check')}</button></div></div>
  <p class="ayuda-tecla">Si una palabra es difícil, tócala. · Si ya la has leído y no se pone verde, pulsa «Siguiente».</p>`;
  aplicarLetra();
  palabras = pintarTexto($('#texto'), h.lineas);
  marcarJuntos();
  $('#btnJuntos').onclick=()=>{ const orden=['no','adulto','voz']; aj.juntos=orden[(orden.indexOf(aj.juntos||'no')+1)%3]; guardarAj(); const ptr=lect?lect.puntero||0:0; if(ptr>0){ $('#btnJuntos').innerHTML=JUNTOS_TXT[aj.juntos]; marcarJuntos(); return; } cancelarLectura(); ir('lectura'); };
  $('#texto').addEventListener('click', e=>{ const w=e.target.closest('.w'); if(w) ayudaPalabra(+w.dataset.i); });
  $('#btnPausa').onclick=pausar;
  $('#btnSigPal').onclick=()=>{ if(!lect || !lect.activa || lect.pausadoDesde) return; const w=palabras[lect.puntero||0]; if(w && w.adulto){ saltarLineaAdulto(); return; } lect.forzado=(lect.puntero||0)+1; alinear(); };
  $('#btnTermine').onclick=()=>terminarDeLeer();
  if($('#btnEscuchar')) $('#btnEscuchar').onclick=()=>escucharPrimero();
  if($('#btnDesdeInicio')) $('#btnDesdeInicio').onclick=()=>{ aj.marcapaginas=null; guardarAj(); cancelarLectura(); empezarHistoria(h); };
  $('#btnFrase').onclick=()=>{ const i=Math.min(lect?lect.puntero||0:0, palabras.length-1); const p=palabras[i].el.closest('p'); if(lect) lect.frases=(lect.frases||0)+1; decir(p.textContent.replace(/\s+/g,' ').trim()); };
  empezarLectura();
}, salir(p){
  if(p!=='fin' && lect && lect.activa){ guardarMarcapaginas(); cancelarLectura(); }
  else if(p!=='fin' && lect && !lect.activa){ const l=lect; lect=null; pararGrabacion(l); }   // se sale mientras se prepara el micrófono
}});

async function empezarLectura(){
  callar();
  lect={activa:false, ayudas:new Set(), tOk:[], ok:null, puntero:0, txtPrevio:'', txtSesion:'', srFallo:false, rec:null, chunks:[], stream:null, finPendiente:false, pausaTotal:0, pausadoDesde:null, oyendo:false, finales:[], parcial:''};
  const yo=lect; const txt=$('#micTxt');
  if(!sinMic){
    if(EST.cargando){ txt.textContent='Preparando el oído…'; await esperarCarga(25); if(lect!==yo) return; }
    yo.grabando = await iniciarGrabacion(); if(lect!==yo){ pararGrabacion(yo); return; }
  }
  lect.activa=true; lect.t0=performance.now();
  if(lect.grabando){ lect.oyendo = (EST.oido==='vosk' && aj.oidoModo!=='internet' && await iniciarOidoLocal()) || iniciarReconocimientoNavegador() || (EST.oido==='vosk' && aj.oidoModo==='internet' && await iniciarOidoLocal()); }
  if(lect!==yo) return;
  const desde=marcaLectura(hist); if(desde){ lect.inicio=desde; lect.forzado=desde; alinear(true); aviso('Seguimos donde lo dejaste'); } else pintarSeguimiento(0,0);
  pintarMic();
  if(document.activeElement) document.activeElement.blur();
  vigilarSilencio(yo);
  if(desde && $('#btnEscuchar')) $('#btnEscuchar').hidden=true;
  else if(aj.escuchar==='nuevas' && !leidas()[hist.id]) escucharPrimero();
}
/* escucha previa: el programa lee la historia frase a frase (marcada en el texto); mientras, no se escucha ni cuenta el tiempo.
   Luego empieza el niño. Queda apuntado en la lectura (la familia lo ve al revisarla). */
async function escucharPrimero(){
  const l=lect; const b=$('#btnEscuchar');
  if(!l || !l.activa || l.modelo || (l.puntero||0)>0 || l.pausadoDesde){ if(b && l && (l.puntero||0)>0) b.hidden=true; return; }
  l.modelo=true; l.escuchando=true; if(b) b.hidden=true;
  l.pausadoDesde=performance.now(); try{ l.rec && l.rec.pause(); }catch(e){} if(l.sr){ try{ l.sr.stop(); }catch(e){} }
  pintarMic(); const t=$('#micTxt'); if(t) t.textContent='Escucha…';
  await decir('Escucha primero cómo suena. Luego la lees tú.');
  for(const p of $$('#texto p')){
    if(lect!==l || !l.escuchando || actual!=='lectura') break;
    p.classList.add('modelo-lee'); await decir(p.textContent.replace(/\s+/g,' ').trim()); p.classList.remove('modelo-lee');
  }
  if(lect!==l || actual!=='lectura') return;
  l.escuchando=false; $$('#texto p.modelo-lee').forEach(p=>p.classList.remove('modelo-lee'));
  await decir('¡Ahora tú!');
  if(lect===l && actual==='lectura' && !l.cerrando) reanudarLectura();
}
function pintarMic(){ const m=$('#micInd'); if(!m||!lect) return; m.classList.toggle('on', !!(lect.grabando && !lect.pausadoDesde));
  $('#micTxt').textContent = !lect.grabando ? 'Sin micrófono' : lect.pausadoDesde ? 'En pausa' : (lect.oyendo ? 'Te escucho' : 'Grabando'); }
/* si al empezar no llega nada de sonido, se avisa sin parar la lectura */
function vigilarSilencio(l){ if(!l.an) return; let max=0; const t0=Date.now();
  (function b(){ if(lect!==l || !l.activa) return; max=Math.max(max, nivel(l.an));
    if(Date.now()-t0>8000){ if(max<0.04){ const t=$('#micTxt'); if(t) t.textContent='No te oigo bien: acércate al micrófono'; } return; }
    requestAnimationFrame(b); })(); }
function pausar(){
  if(!lect || !lect.activa || lect.escuchando) return;
  lect.pausadoDesde=performance.now(); try{ lect.rec && lect.rec.pause(); }catch(e){} if(lect.sr){ try{ lect.sr.stop(); }catch(e){} } pintarMic();
  dialogo({titulo:'¿Seguimos?', botones:[{t:'Continuar', cls:'btn-p', fn:reanudarLectura},{t:'Volver al inicio', fn:()=>ir('inicio')}], alCerrar:reanudarLectura});
}
function reanudarLectura(){
  if(!lect) return;
  if(lect.pausadoDesde){ lect.pausaTotal += performance.now()-lect.pausadoDesde; lect.pausadoDesde=null; }
  lect.activa=true; lect.finPendiente=false;
  try{ lect.rec && lect.rec.state==='paused' && lect.rec.resume(); }catch(e){}
  if(lect.sr && !lect.srFallo){ try{ lect.sr.start(); }catch(e){} }
  pintarMic();
}
function cancelarLectura(){
  const l=lect; if(!l) return; l.activa=false; if(l.sr){ l.sr.onend=null; try{ l.sr.abort(); }catch(e){} } pararGrabacion(l); lect=null;
}
/* ---------- 07 · Ayuda con una palabra ---------- */
function ayudaPalabra(i){
  const w=palabras[i]; if(!w) return;
  const k=w.clave || claveDePalabra(w.p); const texto=w.el.textContent;
  if(lect && lect.activa){ lect.ayudas.add(i); w.el.classList.add('ayudada'); }
  const qs = typeof iaBotonSignificado==='function' ? iaBotonSignificado(texto, (w.el.closest('p')||w.el).textContent) : null;   // «¿Qué significa?» (Ayudante IA)
  dialogo({cls:'ayuda-pal', html:`<div class="ft">${k?imgHTML(k,true):'📖'}</div><div class="silabas-g">${silabasHTML(limpiar(texto)||texto)}</div>`,
    botones:[{t:ic('altavoz')+' Escuchar', cls:'btn-p', mantener:true, fn:()=>oirPalabra(texto)}, ...(qs?[qs]:[]), {t:ic('recargar')+' Volver a leer', fn:()=>{}}]});
  oirPalabra(texto);
  if(lect && lect.activa) aviso('Ayuda guardada');
}
function oirPalabra(t){ const p=limpiar(t)||t; const s=silabear(p); return decirVarias([...(s.length>1?s.map(x=>[x,'es']):[]), [p,'es']]); }

/* ---------- 12 · Terminé de leer ---------- */
function terminarDeLeer(){
  if(!lect) return; const l=lect;
  if(l.activa && !l.pausadoDesde){ l.pausadoDesde=performance.now(); try{ l.rec && l.rec.pause(); }catch(e){} if(l.sr){ try{ l.sr.stop(); }catch(e){} } }
  l.activa=false; ir('fin');
}
definir('fin', {nav:'historias', pintar(){
  const h=hist; const N=palabras.length; const leidasN=Math.min(N, lect?lect.puntero||0:0);
  const texto=h.lineas.slice(0,2).map(l=>conNombre(l).replace(/\[([^|\]]+)\|[^\]]+\]/g,'$1'));
  $('#s-fin').innerHTML = `<div class="centro"><h1 class="tit">Terminé de leer</h1><p class="sub">¿Has terminado la historia?</p></div>
  <div class="fin-grid"><div class="fin-texto"><span class="ft">${imgHTML(h.portada,true)}</span><div class="texto ${claseTexto()}">${texto.map((t,i)=>`<p style="color:${i===0?'var(--green)':'var(--ink)'}">${esc(t)}</p>`).join('')}${h.lineas.length>2?'<p class="nota">…</p>':''}</div></div>
    <div class="card fin-datos"><span class="nota">Has leído</span><b>${lect&&lect.oyendo?leidasN+' de '+N:N} palabras</b><span class="nota">en ${mmss(tLect())} minutos</span></div></div>
  <div class="botones" style="max-width:820px;margin:0 auto"><button class="btn btn-p btn-g" type="button" id="btnVerPreg">Ver preguntas ${ic('flecha')}</button><button class="btn btn-borde btn-g" type="button" id="btnSeguirLeer">Seguir leyendo</button></div>`;
  $('#btnVerPreg').onclick=()=>finalizarLectura();
  $('#btnSeguirLeer').onclick=()=>{ mostrar('lectura'); actual='lectura'; reanudarLectura(); };
}, salir(p){ if(p!=='lectura' && p!=='pregunta' && lect && !sesion) cerrarLectura(); }});

/* «Ver preguntas»: se cierra la lectura (se guarda ya, a medias) y empiezan las preguntas */
async function finalizarLectura(){ if(!lect || lect.cerrando) return; await cerrarLectura(); qi=0; qEst=null; ir('pregunta'); }
/* Cierra la lectura y la guarda como «incompleta» con su grabación; las preguntas la van completando.
   Así, si el niño sale o se cierra la ventana, no se pierde lo leído (marcapáginas). */
async function cerrarLectura(){
  const l=lect; if(!l || l.cerrando) return; l.cerrando=true;
  const ini=l.inicio||0;
  if(l.pausadoDesde){ l.pausaTotal += performance.now()-l.pausadoDesde; l.pausadoDesde=null; }
  const seg=Math.max(1,(performance.now()-l.t0-l.pausaTotal)/1000); l.activa=false;
  if(l.sr){ l.sr.onend=null; try{ l.sr.stop(); }catch(e){} }
  await cerrarOido(l);
  if(l.oidoId){ l.activa=true; alinear(); l.activa=false; }
  const blob=await pararGrabacion(l); if(lect===l) lect=null;
  const oyo = l.oyendo && !l.srFallo && (l.oidoId ? l.finales.length>0 : (l.txtPrevio+' '+l.txtSesion).trim().length>0);
  // ritmo de este niño: un niño que lee sílaba a sílaba tarda 10-15 s por palabra y no por eso lo ha leído mal
  const tiempos = palabras.map((w,i)=>l.tOk[i]).filter(t=>t!=null);
  const huecos = tiempos.slice(1).map((t,i)=>t-tiempos[i]).filter(x=>x>0).sort((a,b)=>a-b);
  const limite = Math.max(6, 3*(huecos.length ? huecos[Math.floor(huecos.length/2)] : 2));
  let prevT=null, pendientes=0;
  const estados = palabras.map((w,i)=>{
    const o={p:w.p, e:'ok'}; if(w.foto) o.d=1; if(l.tOk[i]!=null) o.t=+(+l.tOk[i]).toFixed(2);
    if(i<ini){ o.prev=1; return o; }   // leída antes de dejarlo (marcapáginas)
    if(w.adulto){ o.e='adulto'; return o; }   // la leyó papá, mamá o la voz (leer juntos)
    if(l.ayudas.has(i)){ o.e='ayuda'; o.m=1; }
    else if(oyo){
      if(!(l.ok && l.ok[i])){ o.e='pendiente'; o.a=1; pendientes++; }
      else if(prevT!=null && l.tOk[i]-prevT>limite){ o.e='pendiente'; o.a=1; pendientes++; }
    }
    if(oyo && l.tOk[i]!=null) prevT=l.tOk[i];
    return o;
  });
  // palabras cortas (el, la, en, por…) que el oído casi nunca separa: si la de antes y la de después se oyeron, cuentan como leídas
  if(oyo) estados.forEach((o,i)=>{ if(o.e!=='pendiente' || normalizar(o.p).length>3) return;
    let a=i-1; while(a>=0 && estados[a].e==='pendiente' && normalizar(estados[a].p).length<=3) a--;
    let b=i+1; while(b<estados.length && estados[b].e==='pendiente' && normalizar(estados[b].p).length<=3) b++;
    const oida = k => k>=0 && k<estados.length && (estados[k].e==='ok' || estados[k].e==='ayuda');
    if(oida(a) && oida(b) && b-a<=4){ o.e='ok'; o.i=1; delete o.a; pendientes--; } });
  const p=perfil();
  sesion={ ...(typeof pruebaNivelEnCurso!=='undefined' && pruebaNivelEnCurso===hist.id ? {pruebaNivel:true} : {}), id:nuevoId(), v:4, fecha:new Date().toISOString(), lectorId:p.id, lector:p.nombre, prueba:!!p.prueba, historiaId:hist.id, dia:diaPersonal(hist)||hist.dia, titulo:conNombre(hist.titulo), mundo:hist.mundo, nivel:hist.nivel,
    segundos:Math.round(seg), totalPalabras:palabras.length, ppm:Math.round(palabras.slice(ini).filter(w=>!w.adulto).length/(seg/60)), palabras:estados, ...(ini?{desdePalabra:ini}:{}), auto:oyo, oido:l.oidoId?'vosk':(l.sr?'navegador':'ninguno'),
    oidoStats: l.rt ? {peticiones:l.rt.n, msMedio:Math.round(l.rt.suma/l.rt.n), msMax:Math.round(l.rt.max), retrasoMedio: l.retrasos&&l.retrasos.length ? +media(l.retrasos).toFixed(2) : null, reconocidas:l.ok?l.ok.filter(Boolean).length:0} : null,
    oidoTexto: (l.oidoId ? l.finales.map(f=>f.w).join(' ') : (l.txtPrevio+' '+l.txtSesion)).trim().slice(0,2000) || undefined, oidoLimite: oyo ? +limite.toFixed(1) : undefined,
    ...(palabras.some(w=>w.adulto)?{juntos:aj.juntos}:{}), ...(l.modelo?{escuchada:true}:{}), ...(hist.pregIA?{pregIA:true}:{}), frasesEscuchadas:l.frases||0, letra:aj.letra, tam:aj.tam, imagenes:aj.img, preguntas:[], aciertos:0, totalPreguntas:hist.preguntas.length, calculo:null, revisada: pendientes===0, incompleta:true };
  if(sesion.oidoStats) registrar(`Oído ${sesion.oido}: ${sesion.oidoStats.reconocidas}/${palabras.length} palabras reconocidas, retraso medio ${sesion.oidoStats.retrasoMedio} s, petición media ${sesion.oidoStats.msMedio} ms (máx ${sesion.oidoStats.msMax})`);
  audioBlob=blob;
  if(aj.marcapaginas && aj.marcapaginas.historiaId===hist.id){ aj.marcapaginas=null; guardarAj(); }
  await guardarSesionActual();
}

/* ---------- 13–16 · Comprensión ---------- */
let qi=0, qEst=null;
function nuevaQ(){ const q=hist.preguntas[qi]; return {intentos:0, resuelta:false, pista:false, mal:new Set(), orden:barajar(q.ops.map((o,i)=>({t:o[0], k:o[1], ok:i===q.ok})))}; }
definir('pregunta', {nav:'historias', pintar(){
  if(!qEst) qEst=nuevaQ();
  const q=hist.preguntas[qi]; const e=qEst; const T=hist.preguntas.length;
  const puntos=`<span class="puntos" style="margin-left:6px">${hist.preguntas.map((_,i)=>`<i class="${i<qi?'ok':i===qi?'on':''}"></i>`).join('')}</span>`;
  const etiqueta = e.resuelta ? {t:'Respuesta correcta', cls:'verde'} : e.intentos ? {t:'Volver a intentarlo', cls:'morada'} : {t:`Pregunta ${qi+1} de ${T} · Escucha y toca`};
  $('#s-pregunta').innerHTML = `<div class="card preg">${cabPaso(2+qi, etiqueta, puntos)}
    <h2>${esc(conNombre(q.q))}</h2>
    ${e.intentos && !e.resuelta ? '<div class="aviso-int">Escucha otra vez y prueba.</div>' : ''}
    ${e.resuelta ? '' : `<button class="altavoz" type="button" id="btnOirQ" aria-label="Escuchar la pregunta">${ic('altavoz')}</button>`}
    <div class="ops">${e.orden.map((o,i)=>{ const cls = o.ok && e.resuelta ? 'bien' : e.mal.has(i) ? 'mal' : '';
      return `<button type="button" class="op ${cls}" data-i="${i}" ${e.resuelta||e.mal.has(i)?'disabled':''}><span class="ft">${imgHTML(o.k,true)}</span><b>${o.ok&&e.resuelta?'¡Eso es!':esc(cap(conNombre(o.t)))}</b></button>`; }).join('')}</div>
    <div class="pie-preg">${!e.resuelta && e.intentos ? `<button class="btn btn-borde btn-g" type="button" id="btnPista">${ic('bombilla')} Una pista</button>` : ''}${e.resuelta?`<button class="btn btn-p btn-g" type="button" id="btnSigQ">Siguiente ${ic('flecha')}</button>`:''}</div></div>`;
  const oirQ=()=>{ const b=$('#btnOirQ'); if(b) b.classList.add('hablando'); decir(conNombre(q.q)).then(()=>{ const b2=$('#btnOirQ'); if(b2) b2.classList.remove('hablando'); }); };
  if($('#btnOirQ')) $('#btnOirQ').onclick=oirQ;
  $$('#s-pregunta .op').forEach(b=>b.onclick=()=>responder(+b.dataset.i));
  if($('#btnPista')) $('#btnPista').onclick=()=>{ e.pista=true; ir('pista'); };
  if($('#btnSigQ')) $('#btnSigQ').onclick=siguientePregunta;
  if(!e.intentos && !e.resuelta && !e.leida){ e.leida=true; const intro = qi===0 ? `¡Muy bien, ${nombre()}! Ahora unas preguntas. ` : ''; if(aj.audioPreguntas===false){ if(intro) decir(intro); } else { const b=$('#btnOirQ'); if(b) b.classList.add('hablando'); decir(intro+conNombre(q.q)).then(()=>{ const b2=$('#btnOirQ'); if(b2) b2.classList.remove('hablando'); }); } }
}, salir(p){ if(p!=='pista' && p!=='pregunta') callar(); }});
function responder(i){
  const e=qEst, o=e.orden[i], q=hist.preguntas[qi]; if(e.resuelta) return; e.intentos++;
  if(o.ok){ e.resuelta=true; sonido('bien'); const f=['¡Muy bien!','¡Eso es!','¡Genial!','¡Correcto!'][Math.floor(Math.random()*4)]; decir(f);
    sesion.preguntas.push({q:conNombre(q.q), ok:e.intentos===1, intentos:e.intentos, pista:e.pista}); sesion.aciertos=sesion.preguntas.filter(x=>x.ok).length; guardarSesionActual(); }
  else { e.mal.add(i); sonido('mal'); decir('Casi. Escucha otra vez y prueba.'); }
  ir('pregunta');
}
function siguientePregunta(){ qi++; qEst=null; if(qi<hist.preguntas.length) ir('pregunta'); else if(hist.calculo){ cEst=null; ir('calculo'); } else ir('cromonuevo'); }
/* 16 · Una pista: la frase de la historia donde está la respuesta */
definir('pista', {nav:'historias', pintar(){
  const q=hist.preguntas[qi]; const ok=q.ops[q.ok]; const clave=ok[1];
  let linea = hist.lineas.find(l=>l.includes('|'+clave+']')) || hist.lineas.find(l=>normalizar(l).includes(normalizar(ok[0]))) || hist.lineas[0];
  const html = esc(conNombre(linea)).replace(/\[([^|\]]+)\|([^\]]+)\]/g, (m,t,k)=> k===clave ? `<span class="clave">${t}</span>` : t);
  const T=pasos();
  $('#s-pista').innerHTML = `<div class="card preg"><div class="paso-cab"><span class="pill">Una pista</span><span class="der"><span class="pill morada">${ic('bombilla')} Con ayuda</span>${2+qi} de ${T}</span></div>
    <div class="pista-frase">${html}</div><div class="pista-ft">${imgHTML(fotoURL(clave)?clave:hist.portada,true)}</div>
    <div class="centro" style="margin-top:18px"><button class="btn btn-borde btn-g" type="button" id="btnVolverQ">${ic('atras')} Volver a la pregunta</button></div></div>`;
  $('#btnVolverQ').onclick=()=>ir('pregunta');
  decir(conNombre(linea).replace(/\[([^|\]]+)\|[^\]]+\]/g,'$1'));
}});

/* ---------- 17–19 · Reto de números y «Lo vemos juntos»: en calculo.js (24/10/2026) ---------- */

/* ---------- 20 · Tu nuevo cromo ---------- */
definir('cromonuevo', {nav:'cromos', pintar(){
  const h=hist;
  if(esComp(h.id)){   // lectura extra: sin cromo, solo minutos de tele
    sesion.aciertos=sesion.preguntas.filter(p=>p.ok).length; delete sesion.incompleta;
    $('#s-cromonuevo').innerHTML = `<div class="card" style="padding:20px 26px 6px">${cabPaso(pasos(), {t:'Lectura extra terminada', cls:'verde'})}</div>` + finExtraHTML(h, sesion);
    const miAudio = audioBlob || (sesion.audio ? '/api/audio/'+sesion.id : null); const be=$('#btnEscucharme'); if(be && miAudio) be.onclick=()=>sonarAudio(miAudio);
    guardarSesionActual().then(()=>{ const m=minutosDeSesion(perfil(), sesion); if(m>0){ confeti($('#cromoCaja')); sonido('cromo'); decir(`¡Muy bien, ${nombre()}! Has ganado ${minTxt(m)} de tele.`); avisarTele(perfil(), true); } else decir(`¡Muy bien, ${nombre()}!`); });
    return; } const eraNueva=!cromosDe(perfil())[h.id]; const m=mundoDe(h.mundo);
  const TA=temaDeMundo(h.mundo)||{id:h.mundo, nombre:m.nombre, emo:'⭐'}; const hsA=historiasTema(TA.id); const lA=leidas(); const nA=hsA.filter(x=>lA[x.id]||x.id===h.id).length; const albumCompleto=eraNueva && hsA.length>0 && nA===hsA.length;
  sesion.aciertos=sesion.preguntas.filter(p=>p.ok).length;
  const mejora = eraNueva ? null : mejoraRelectura(h, sesion);
  const T=pasos(); const miAudio = audioBlob || (sesion.audio ? '/api/audio/'+sesion.id : null);
  $('#s-cromonuevo').innerHTML = `<div class="card" style="padding:20px 26px 6px">${cabPaso(T, {t: eraNueva?'Tu nuevo cromo':'Historia terminada', cls:'verde'})}</div>
  <div class="card cromo-g" id="cromoCaja" style="margin-top:-10px;border-top-left-radius:0;border-top-right-radius:0"><div class="carta"><div class="ft">${imgHTML(h.portada,true)}</div><div class="pie"><b>${esc(conNombre(h.titulo))}</b><span>${TA.emo} ${esc(TA.nombre)} · ${nA} de ${hsA.length}</span></div></div>
    <div class="tx"><h1>${eraNueva?'¡Nuevo cromo!':'¡Muy bien!'}</h1><p class="sub">${albumCompleto?`🏆 ¡Has completado el álbum de ${esc(TA.nombre)}!`:eraNueva?`Has aprendido sobre ${esc(m.nombre.toLowerCase())}.`:'¡Cromo repetido! Ya tenías este, así que te llevas un repe para cambiar con otro niño.'}</p>${typeof esfuerzoHTML==='function'?esfuerzoHTML():''}
      ${typeof fluidezHTML==='function' ? fluidezHTML(h, sesion, eraNueva) : (mejora?`<p class="mejora-rel">🚀 ¡Hoy la has leído más rápido! La otra vez, ${mejora.antes} palabras por minuto; hoy, ${mejora.hoy}.</p>`:'')}
      <div class="res-mini"><span class="chip">Preguntas ${sesion.aciertos} de ${sesion.totalPreguntas}</span>${teleChipHTML(sesion)}${typeof estrellasChipHTML==='function'?estrellasChipHTML(sesion):''}${sesion.calculo?`<span class="chip">Números ${sesion.calculo.ok?'✓':'con ayuda'}</span>`:''}<span class="chip">${sesion.segundos<60?sesion.segundos+' segundos':mmss(sesion.segundos)+' min'}</span></div>
      ${miAudio?`<button class="btn btn-verde btn-g btn-bloque" type="button" id="btnEscucharme">${ic('altavoz')} Escucharme</button>`:''}
      ${typeof ordenarBotonHTML==='function' ? ordenarBotonHTML(h) : ''}
      <button class="btn btn-borde btn-g btn-bloque" type="button" data-ir="cromos">${ic('album')} Ver mi álbum</button>
      <button class="btn btn-p btn-g btn-bloque" type="button" data-ir="inicio">${ic('casa')} Volver al inicio</button>
      <p class="nota" id="guardadoTxt"></p></div></div>`;
  if(miAudio) $('#btnEscucharme').onclick=()=>sonarAudio(miAudio);
  if(typeof activarOrdenarBoton==='function') activarOrdenarBoton(h);
  if(typeof registrarPruebaNivel==='function') registrarPruebaNivel(sesion);
  if(eraNueva){ confeti($('#cromoCaja')); sonido('cromo'); }
  coleccion=TA.id;
  if(albumCompleto){ setTimeout(()=>{ confeti($('#cromoCaja')); sonido('bien'); }, 1600); }
  decir(albumCompleto ? `¡Nuevo cromo, ${nombre()}! ¡Y has completado el álbum de ${TA.nombre}!` : eraNueva ? `¡Nuevo cromo, ${nombre()}! ${conNombre(h.titulo)}.` : mejora ? `¡Muy bien, ${nombre()}! Hoy la has leído más rápido que la otra vez. ¡Practicar funciona!` : `¡Muy bien, ${nombre()}! Has terminado la historia.`);
  delete sesion.incompleta; guardarSesionActual().then(()=>setTimeout(()=>{ if(actual==='cromonuevo') comprobarPremios(); }, albumCompleto?3600:2600));
}});
/* al volver a leer una historia: si hoy ha ido más rápido que la última vez, se le dice (solo lo bueno; con lecturas oídas por el programa) */
function mejoraRelectura(h, s){
  if(!s || !s.ppm || !s.auto || s.desdePalabra) return null;
  const prev=sesDe(s.lectorId).filter(x=>x.historiaId===h.id && x.id!==s.id && !x.incompleta && x.ppm>0 && x.auto && !x.desdePalabra).sort((a,b)=>a.fecha<b.fecha?-1:1).at(-1);
  if(!prev || s.ppm < prev.ppm*1.1 || s.ppm-prev.ppm < 2) return null;
  return {antes:prev.ppm, hoy:s.ppm};
}
/* guarda la lectura en curso (cada vez que avanza); las peticiones van en fila para no pisarse */
let colaGuardar=Promise.resolve();
function guardarSesionActual(){
  if(!sesion) return colaGuardar; const sAhora=sesion, blob=audioBlob; const copia=JSON.parse(JSON.stringify(sAhora)); delete copia._audioSubido; delete copia.audio;
  colaGuardar = colaGuardar.then(async()=>{
    try{
      await guardarSesion(copia);
      if(blob && !sAhora._audioSubido){ await api('/api/audio/'+sAhora.id, {method:'POST', body:blob}); sAhora._audioSubido=true; sAhora.audio=true; }
      const s=normSesion(JSON.parse(JSON.stringify(copia))); s.audio=!!sAhora.audio; if(!copia.incompleta) delete s.incompleta;
      const i=SES.findIndex(x=>x.id===s.id); if(i>=0) SES[i]=s; else SES.push(s);
    }catch(e){ const t=$('#guardadoTxt'); if(t) t.textContent='No se pudo guardar esta lectura: '+e.message; registrar('Guardar sesión: '+e.message); }
  });
  return colaGuardar;
}
