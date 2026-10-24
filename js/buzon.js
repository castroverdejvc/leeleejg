/* LeeLEEJG · «Mi buzón de ideas»: una vez a la semana (o cuando la familia lo pide) se le pregunta al niño
   qué le gusta del programa y qué quiere que haya: historias de qué, qué ejercicios, si le parecen fáciles o difíciles,
   y al final puede pedir algo con su voz. Las preguntas se le leen y contesta tocando dibujos.
   Respuestas en cfg.deseosLog (se juntan entre aparatos); la familia las ve en Evolución › Gustos y premios. */
'use strict';
const BUZON = [
  {id:'gusta', q:'¿Te gusta LeeLEEJG?', ops:[['¡Mucho!','e:😀'],['Un poco','e:🙂'],['No mucho','e:🙁']]},
  {id:'mas', q:'¿Qué es lo que más te gusta?', ops:[['Leer historias','libro'],['Los cuentos','e:📖'],['Los juegos','e:🎮'],['Los trabajos del cole','e:✏️'],['Los cromos y las criaturas','e:🃏'],['Ganar tele','e:📺']]},
  {id:'menos', q:'¿Y lo que menos te gusta?', ops:[['Leer','libro'],['Las preguntas','e:❓'],['Las fichas de inglés','e:🇬🇧'],['Las letras','e:🔤'],['Los trabajos del cole','e:✏️'],['¡Nada, me gusta todo!','e:😄']]},
  {id:'historias', q:'¿De qué quieres historias nuevas?', ops:[['Fútbol','balon'],['Dinosaurios','portada_dinos'],['Animales','portada_animales'],['Superhéroes','portada_heroes'],['Cuentos conmigo dentro','e:🏰'],['El espacio','planeta']]},
  {id:'ejercicio', q:'¿Qué ejercicio nuevo te gustaría?', ops:[['Colorear dibujos','e:🖍️'],['Laberintos','e:🌀'],['Sopa de letras','e:🔤'],['Contar y sumar','e:🔢'],['Adivinanzas','e:🤔'],['Canciones','portada_canciones']]},
  {id:'dificil', q:'Las historias, ¿cómo son para ti?', ops:[['Muy fáciles','e:😎'],['Están bien','e:🙂'],['Muy difíciles','e:😓']]},
  {id:'voz', q:'¿Quieres pedir algo más? Dímelo con tu voz.', voz:true}
];
const DIAS_BUZON = 7;
function buzonToca(p=perfil()){
  if(p.prueba) return false; const c=cfgDe(p); if(c.buzonPedir) return true;
  const log=c.deseosLog||[]; if(!log.length) return sesDe(p.id).filter(s=>!s.incompleta).length>=3;   // la primera vez, cuando ya conoce el programa
  return Date.now()-new Date(log[log.length-1].f).getTime() > DIAS_BUZON*DIA_MS;
}
function buzonHTML(){
  if(!buzonToca()) return '';
  return `<button class="acceso buzon" type="button" data-ir="buzon"><span class="emo-g">📮</span><span><b>Tu buzón de ideas</b><span class="nota">¿Qué quieres que haya en LeeLEEJG? ¡Cuéntamelo!</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
let flujoBuzon=null;
definir('buzon', {nav:'inicio', pintar(){
  if(!flujoBuzon) flujoBuzon={i:0, ronda:new Date().toISOString()};
  const g=BUZON[flujoBuzon.i];
  if(!g){ flujoBuzon=null; const c=cfgDe(perfil()); delete c.buzonPedir; guardarAj(); confeti(document.body); decir('¡Gracias! Se lo voy a contar a papá y a mamá.'); ir('inicio'); return; }
  const s=$('#s-buzon');
  const cab=`<button class="volver" type="button" id="volBuzon">${ic('atras')} Inicio</button>
  <div class="card gusto"><span class="pill">📮 Buzón de ideas · ${flujoBuzon.i+1} de ${BUZON.length}</span>
    <h1 class="tit gusto-q">${esc(g.q)} <button class="btn btn-mini" type="button" id="btnOirB" aria-label="Escuchar">${ic('altavoz')}</button></h1>`;
  const apuntar=r=>{ aj.deseosLog=(aj.deseosLog||[]).concat([{f:new Date().toISOString(), q:g.id, r, ronda:flujoBuzon.ronda}]).slice(-400); guardarAj(); };
  const siguiente=()=>{ flujoBuzon.i++; ir('buzon'); };
  if(g.voz){
    s.innerHTML=cab+`<p class="nota">Toca el micrófono y habla. Por ejemplo: «Quiero historias de piratas».</p>
      <div class="botones" style="justify-content:center;margin:16px 0"><button class="btn btn-p btn-xl" type="button" id="bzHablar">🎤 Hablar</button><button class="btn btn-xl" type="button" id="bzNo">No, ya está</button></div>
      <p class="sub centro" id="bzTexto" style="min-height:2em"></p><div class="botones" id="bzOk" style="justify-content:center" hidden><button class="btn btn-verde btn-g" type="button" id="bzVale">¡Vale, apúntalo!</button><button class="btn btn-g" type="button" id="bzOtra">Otra vez</button></div></div>`;
    let texto='';
    $('#bzHablar').onclick=async()=>{ const b=$('#bzHablar'); b.disabled=true; b.textContent='🎤 Te escucho…'; $('#bzTexto').textContent='';
      const r=await escucharUna({maxSeg:15, silencio:2200, alTexto:t=>{ $('#bzTexto').textContent=t; }});
      b.disabled=false; b.textContent='🎤 Hablar'; texto=(r.texto||'').trim();
      if(r.sinMic){ $('#bzTexto').textContent='No puedo usar el micrófono. Díselo a papá o a mamá.'; return; }
      if(!texto){ $('#bzTexto').textContent='No te he oído bien. Prueba otra vez.'; decir('No te he oído bien. Prueba otra vez.'); return; }
      $('#bzTexto').textContent='«'+texto+'»'; $('#bzOk').hidden=false; decir('Has dicho: '+texto+'. ¿Lo apunto?'); };
    $('#bzVale').onclick=()=>{ apuntar(texto); sonido('bien'); siguiente(); };
    $('#bzOtra').onclick=()=>{ $('#bzOk').hidden=true; $('#bzHablar').click(); };
    $('#bzNo').onclick=()=>siguiente();
  } else {
    s.innerHTML=cab+`<p class="nota">No hay respuestas buenas ni malas: toca lo que de verdad piensas.</p>
      <div class="ops-dibujo ops-${g.ops.length}">${g.ops.map(([t,k],j)=>`<button type="button" class="op-d" data-j="${j}"><span class="ft">${fotoOpcion(k)}</span><b>${esc(t)}</b></button>`).join('')}</div></div>`;
    $$('#s-buzon .op-d').forEach(b=>b.onclick=()=>{ const o=g.ops[+b.dataset.j]; apuntar(o[0]); b.classList.add('elegida'); sonido('toc');
      decir(['¡Apuntado!','¡Muy bien!','¡Gracias!','¡Genial!'][flujoBuzon.i%4]); $$('#s-buzon .op-d').forEach(x=>x.disabled=true); setTimeout(siguiente, 900); });
  }
  const leer=()=>decir(g.q+(g.ops?' '+g.ops.map(o=>o[0].replace(/[¡!]/g,'')).join(', ')+'.':''));
  $('#btnOirB').onclick=leer; leer();
  $('#volBuzon').onclick=()=>{ flujoBuzon=null; pararEscucha&&pararEscucha(); ir('inicio'); };
}, salir(){ if(typeof pararEscucha==='function') pararEscucha(); }});

/* familia: lo que pide (última ronda y las anteriores) */
function buzonAdultoHTML(p){
  const log=cfgDe(p).deseosLog||[];
  const rondas=[...new Set(log.map(x=>x.ronda||claveDia(x.f)))].reverse();
  const fila=(r)=>{ const xs=log.filter(x=>(x.ronda||claveDia(x.f))===r); const f=xs[0]?fechaCorta(xs[0].f):'';
    return `<tr><td>${esc(f)}</td>${BUZON.map(g=>{ const x=xs.filter(y=>y.q===g.id).pop(); return `<td>${x?(g.voz?'«'+esc(x.r)+'»':esc(x.r)):'–'}${x && (g.id==='historias'||g.voz) && typeof iaEnlaceHistorias==='function' ? ` <button class="btn btn-mini" type="button" data-iaidea="${esc(x.r)}" title="Hacer historias con esto (Ayudante IA)">✨</button>`:''}</td>`; }).join('')}</tr>`; };
  return `<div class="card bloque" style="margin-top:18px"><div class="pag-cab" style="margin:0 0 6px"><h3>📮 Su buzón de ideas</h3><button class="btn btn-mini" type="button" id="buzonPedir">${cfgDe(p).buzonPedir?'Se le preguntará al abrir':'Preguntarle ahora'}</button></div>
    <p class="nota" style="margin-bottom:10px">Una vez a la semana le pregunta qué le gusta del programa y qué quiere que haya. Con «Preguntarle ahora» le sale la próxima vez que abra el programa.</p>
    ${rondas.length?`<div class="tabla-w"><table><thead><tr><th>Fecha</th><th>¿Le gusta?</th><th>Lo que más</th><th>Lo que menos</th><th>Historias de…</th><th>Ejercicio nuevo</th><th>Las historias son</th><th>Lo que pidió</th></tr></thead><tbody>${rondas.slice(0,8).map(fila).join('')}</tbody></table></div>`:'<p class="vacio">Todavía no ha contestado. Le saldrá en Inicio cuando haya leído 3 historias.</p>'}</div>`;
}
function activarBuzonAdulto(p){ const b=$('#buzonPedir'); if(b) b.onclick=()=>{ cfgDe(p).buzonPedir=true; guardarAj(); aviso('Le saldrá en Inicio'); ir('evolucion','premios'); }; }
