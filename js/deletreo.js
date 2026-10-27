/* LeeLEEJG · «Spell it!» (escribe en inglés), 26/10/2026. Pedido por la familia con las fichas del cole (School things):
   «que aprenda a decir las palabras y a escribirlas: bolígrafo es pen, pues que ponga un bolígrafo y las letras esparcidas;
   él tiene que colocarlas p-e-n y, si las coloca bien, las pronuncias en inglés».
   - Palabras: las de cada ficha de inglés activa (School things: las 12 de las dos hojas) y los colores de la hoja.
   - Cada palabra: su dibujo y cómo se dice en castellano; se oye en inglés; las letras salen desordenadas y hay que
     ponerlas en orden (tocándolas o arrastrándolas). La 1.ª vez se ve la palabra en gris para copiarla; luego sin ayuda;
     cuando ya la sabe, con 2 letras de más que no van. Al acabarla: «Pen. P, E, N. It's a pen.» y le toca decirla a él.
   - Cada palabra lleva su marca (aj.deletreo[ficha:palabra] = {c, ok, ko}); salen antes las que menos sabe.
   - Cada ronda se apunta en aj.deletreoLog {f, n, bien, ficha, dichas} y cuenta como una ficha (⭐, tele, objetivos). */
'use strict';
const COLORES_EN = [['red','rojo','#E5484D'],['blue','azul','#1E7BF2'],['yellow','amarillo','#F5C400'],['green','verde','#18B47B'],['orange','naranja','#FF8A1F'],['purple','morado','#8B5CF6'],['pink','rosa','#FF7FB5'],['brown','marrón','#8B5A2B']];
const SET_COLORES = {id:'colours', titulo:'Colours', idioma:'en', frases:false, palabras:COLORES_EN.map(([t,es,c])=>({id:t, t, es, color:c}))};
const conjuntosDeletreo = () => FICHAS.filter(f=>f.activa!==false && f.idioma==='en' && f.palabras && f.palabras.length).concat([SET_COLORES]);
const DEL_N = 6;
const claveDel = (f,p) => f.id+':'+p.id;
const estadoDel = (f,p) => ((aj.deletreo||{})[claveDel(f,p)]) || {c:0, ok:0, ko:0};
function anotarDel(f,p,ok){ aj.deletreo=aj.deletreo||{}; const e={...estadoDel(f,p)}; if(ok){ e.ok++; e.c=Math.min(5,e.c+1); } else { e.ko++; e.c=Math.max(0,e.c-1); } e.u=claveDia(new Date()); aj.deletreo[claveDel(f,p)]=e; guardarAj(); }
const sabidaDel = (f,p) => estadoDel(f,p).c>=3;
/* dibujo de una palabra (foto de la ficha o, para los colores, una mancha de pintura) */
function dibujoDel(p, grande){
  if(p.color) return `<svg viewBox="0 0 120 90" class="mancha" aria-hidden="true"><path d="M60 8c18 0 22 10 34 12 14 3 20 14 16 26-3 9 4 16-2 25-8 12-24 9-34 14-12 6-26 4-36-4C26 74 10 70 9 56 8 44 16 40 15 30 14 16 30 8 42 10c6 1 10-2 18-2z" fill="${p.color}" stroke="rgba(0,0,0,.18)" stroke-width="2"/><circle cx="100" cy="76" r="6" fill="${p.color}"/><circle cx="16" cy="18" r="4" fill="${p.color}"/></svg>`;
  return imgPalabra(p, grande);
}
const NL_EN = c => (typeof NOMBRE_LETRA!=='undefined' && NOMBRE_LETRA.en[c]) || c;
const deletrearEn = t => [...t].filter(c=>c!==' ').map(NL_EN).join(', ');
const fraseDel = (f,p) => p.color ? `${p.t}.` : (f.frases ? `It's ${articulo(p.t)} ${p.t}.` : `${p.t}.`);

/* tarjeta en Fichas */
function tarjetaDeletreoHTML(){
  const cs=conjuntosDeletreo(); const hoy=(aj.deletreoLog||[]).filter(x=>claveDia(x.f)===claveDia(new Date())).length;
  return `<div class="card bloque del-tarjeta"><div><b style="font-size:1.4rem">🔤 Spell it! · Escribe en inglés</b><p class="nota">Mira el dibujo, pon las letras en orden y dilo en inglés.${hoy?` Hoy ya has hecho ${hoy===1?'una ronda':hoy+' rondas'}.`:''}</p></div>
    <div class="trabajos-grid">${cs.map(f=>{ const tot=f.palabras.length, sab=f.palabras.filter(p=>sabidaDel(f,p)).length;
      return `<button type="button" class="trabajo-c" data-del="${esc(f.id)}"><span class="del-mini">${dibujoDel(f.palabras.find(p=>!sabidaDel(f,p))||f.palabras[0])}</span><b>${esc(f.titulo)}</b><span class="nota">${sab} de ${tot} sabidas</span></button>`; }).join('')}</div></div>`;
}
function activarTarjetaDeletreo(raiz){ $$('[data-del]', raiz).forEach(b=>b.onclick=()=>empezarDeletreo(b.dataset.del)); }

let del=null;   // ronda en curso
const repintaDel = () => { if(actual!=='deletreo') return; PANT.deletreo.pintar(); iconos($('#s-deletreo')); };
function empezarDeletreo(fid){
  const f=conjuntosDeletreo().find(x=>x.id===fid); if(!f) return;
  const orden=barajar(f.palabras).sort((a,b)=>estadoDel(f,a).c-estadoDel(f,b).c);
  del={f, items:orden.slice(0, Math.min(DEL_N, orden.length)).map(p=>({p})), i:0, res:[]}; ir('deletreo');
}
definir('deletreo', {nav:'repaso', pintar(){
  if(!del){ ir('repaso'); return; }
  const f=del.f, it=del.items[del.i], p=it.p, e=estadoDel(f,p);
  const letras=[...p.t.toLowerCase()];
  if(!it.fichas){ const extra = e.c>=2 ? barajar('abcdefghilmnoprstuy'.split('').filter(c=>!letras.includes(c))).slice(0,2) : [];
    it.fichas=barajar(letras.filter(c=>c!==' ').concat(extra).map((c,k)=>({c, k, x:0, y:0, r:0, puesta:false})));
    const n=it.fichas.length, cols=Math.min(n, window.innerWidth<560?4:7), filas=Math.ceil(n/cols);
    it.fichas.forEach((t,k)=>{ const col=k%cols, fila=Math.floor(k/cols); t.x=(col+.5)/cols*100 + (Math.random()-.5)*(60/cols); t.y=(fila+.5)/filas*100 + (Math.random()-.5)*(36/filas); t.r=Math.round((Math.random()-.5)*28); });
    it.puestas=[]; it.err=0; it.errAqui=0; it.guia = e.c===0; }
  const huecos=[]; let pos=0; letras.forEach(c=>{ if(c===' ') huecos.push({esp:true}); else { huecos.push({c, i:pos}); pos++; } });
  const sig = letras.filter(c=>c!==' ')[it.puestas.length];
  const lig = aj.letra==='ligada' ? ' ligada' : '';
  $('#s-deletreo').innerHTML = `<div class="card preg del-card"><div class="paso-cab"><span class="pill">🔤 ${esc(f.titulo)} · Spell it!</span><span class="der">${del.i+1} de ${del.items.length}<span class="barra-paso"><i style="width:${Math.round(100*(del.i+1)/del.items.length)}%"></i></span></span></div>
    <div class="del-arriba"><div class="del-dibujo">${dibujoDel(p,true)}</div><div class="del-es"><span class="nota">En castellano</span><b>${esc(p.es||'')}</b><button class="btn btn-p" type="button" id="delOir">${ic('altavoz')} ¿Cómo se dice en inglés?</button></div></div>
    <div class="del-huecos${lig}" id="delHuecos">${huecos.map(h=>h.esp?'<span class="del-esp"></span>':`<span class="del-h${h.i<it.puestas.length?' lleno':''}${h.i===it.puestas.length&&!it.hecha?' ahora':''}">${h.i<it.puestas.length?esc(h.c):it.guia?`<i class="guia">${esc(h.c)}</i>`:''}</span>`).join('')}</div>
    ${it.hecha ? `<div class="del-fin" id="delFin"></div>` : `<div class="del-zona${lig}" id="delZona">${it.fichas.map(t=>t.puesta?'':`<button type="button" class="del-f${it.errAqui>=2&&t.c===sig?' pista':''}" data-k="${t.k}" style="left:${t.x}%;top:${t.y}%;--r:${t.r}deg">${esc(t.c)}</button>`).join('')}</div>
      <p class="nota centro">${it.guia?'Copia la palabra gris: toca las letras en orden.':'Toca (o arrastra) las letras en orden.'}${e.c>=2?' ¡Cuidado, hay letras que no van!':''}</p>`}</div>`;
  const oir=()=>decir(p.t, 'en');
  $('#delOir').onclick=oir;
  if(it.hecha){ pintarFinPalabra(); return; }
  if(!it.puestas.length && !it.dicho){ it.dicho=true; decirVarias([[p.es?`${p.es}.`:'', 'es'], ['In English:', 'en'], [p.t, 'en']]); }
  const zona=$('#delZona');
  $$('#delZona .del-f').forEach(b=>{
    let x0=0, y0=0, mov=false, arrastra=false;
    b.addEventListener('pointerdown', ev=>{ ev.preventDefault(); x0=ev.clientX; y0=ev.clientY; mov=false; arrastra=true; b.setPointerCapture(ev.pointerId); b.classList.add('cogida'); });
    b.addEventListener('pointermove', ev=>{ if(!arrastra) return; const dx=ev.clientX-x0, dy=ev.clientY-y0; if(Math.hypot(dx,dy)>8) mov=true; if(mov) b.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(0deg) scale(1.12)`; });
    const soltar=ev=>{ if(!arrastra) return; arrastra=false; b.classList.remove('cogida'); b.style.transform='';
      if(mov){ const r=$('#delHuecos').getBoundingClientRect(); const dentro = ev.clientY>=r.top-30 && ev.clientY<=r.bottom+30; if(!dentro) return; }
      probar(+b.dataset.k, b); };
    b.addEventListener('pointerup', soltar); b.addEventListener('pointercancel', ()=>{ arrastra=false; b.classList.remove('cogida'); b.style.transform=''; });
  });
  function probar(k, b){
    const t=it.fichas.find(x=>x.k===k); if(!t || t.puesta) return;
    if(t.c===sig){ t.puesta=true; it.puestas.push(t.c); it.errAqui=0; sonido('toc'); decir(NL_EN(t.c), 'en');
      if(it.puestas.length===letras.filter(c=>c!==' ').length){ it.hecha=true; it.ok = it.err===0; }
      repintaDel(); }
    else { it.err++; it.errAqui++; sonido('mal'); b.classList.add('mal'); setTimeout(()=>b.classList.remove('mal'), 450);
      decir(it.errAqui>=2 ? `Look: ${NL_EN(sig)}.` : 'Try again.', 'en'); if(it.errAqui===2) setTimeout(repintaDel, 500); }
  }
  /* palabra terminada: se oye entera, deletreada y en la frase; después la dice él */
  function pintarFinPalabra(){
    const c=$('#delFin'); const frase=fraseDel(f,p);
    c.innerHTML = `<div class="del-bien">${it.ok?'⭐ ':''}¡${esc(p.t)}!</div><p class="sub centro" lang="en">${esc(frase)}</p>
      <div class="del-decir"><button class="btn btn-verde btn-xl" type="button" id="delHablar">${ic('mic')} Ahora dilo tú</button><div class="medidor" id="delMed" hidden>${'<i></i>'.repeat(12)}</div><p class="estado-mic" id="delEstado"></p></div>
      <div class="botones" style="justify-content:center"><button class="btn btn-borde" type="button" id="delOtra">${ic('altavoz')} Escuchar otra vez</button><button class="btn btn-p btn-g" type="button" id="delSig">${del.i+1<del.items.length?'Siguiente':'Terminar'} ${ic('flecha')}</button></div>`;
    if(!it.anotado){ it.anotado=true; anotarDel(f,p,it.ok); del.res.push({p, ok:it.ok}); sonido('bien'); confeti($('.del-card'));
      decirVarias([[p.t,'en'], [deletrearEn(p.t),'en'], [frase,'en'], ['Now you say it!','en']]).then(()=>{ if(actual==='deletreo' && del && del.items[del.i]===it && !it.escuchado) escuchar(); }); }
    $('#delOtra').onclick=()=>decirVarias([[p.t,'en'], [deletrearEn(p.t),'en'], [p.t,'en']]);
    $('#delSig').onclick=()=>{ pararEscucha(); del.i++; if(del.i<del.items.length) ir('deletreo'); else ir('deletreofin'); };
    $('#delHablar').onclick=escuchar;
    async function escuchar(){
      it.escuchado=true; const est=$('#delEstado'), btn=$('#delHablar'), med=$('#delMed'); if(!est) return;
      btn.disabled=true; est.className='estado-mic'; est.textContent='Te escucho…'; med.hidden=false; const barras=$$('#delMed i');
      const pals=[...new Set(f.palabras.flatMap(q=>q.t.toLowerCase().split(/\s+/)).concat(["it's",'a','an']))];
      const r=await escucharUna({idioma:'en', palabras:pals, maxSeg:6, comprobar:t=>diceRespuesta(t,p.t), alNivel:v=>barras.forEach((x,i)=>x.classList.toggle('on', i<Math.round(v*barras.length*1.6)))});
      if(actual!=='deletreo' || !del || del.items[del.i]!==it) return;
      med.hidden=true; btn.disabled=false; it.intentosDecir=(it.intentosDecir||0)+1;
      if(r.sinMic){ est.innerHTML='Dilo en voz alta y toca:'; btn.outerHTML=`<button class="btn btn-verde btn-xl" type="button" id="delYa">✅ ¡Ya lo he dicho!</button>`; $('#delYa').onclick=()=>{ it.dicha=true; sonido('bien'); decir(fraseBien('en'),'en'); $('#delYa').disabled=true; }; return; }
      if(r.ok){ it.dicha=true; est.className='estado-mic ok'; est.textContent='¡'+p.t+'! 🎉'; sonido('bien'); decir(fraseBien('en'),'en'); btn.hidden=true; return; }
      est.textContent = r.texto ? `He oído: «${r.texto}»` : 'No te he oído bien.';
      if(it.intentosDecir>=2){ decirVarias([['Listen:','en'],[p.t,'en'],['Say it with me!','en']]); btn.innerHTML=ic('mic')+' Otra vez'; }
      else { decir('Try again.', 'en'); btn.innerHTML=ic('mic')+' Otra vez'; }
    }
  }
}, salir(){ pararEscucha(); callar(); }});
definir('deletreofin', {nav:'repaso', pintar(){
  const bien=del.res.filter(r=>r.ok).length, dichas=del.items.filter(x=>x.dicha).length;
  aj.deletreoLog=(aj.deletreoLog||[]).concat([{f:new Date().toISOString(), n:del.res.length, bien, ficha:del.f.id, dichas}]).slice(-2000); guardarAj();
  $('#s-deletreofin').innerHTML = `<div class="card buen-trabajo"><h1>Great job!</h1><p class="sub">Has escrito ${del.res.length} ${del.res.length===1?'palabra':'palabras'} · ${bien} sin fallos${dichas?` · ${dichas} dichas en voz alta`:''}.</p>
    <div class="tarjetas-pal">${del.res.map(r=>`<button type="button" class="tp" data-oirp="${esc(r.p.t)}"><span class="ft">${dibujoDel(r.p)}</span><b style="${r.ok?'':'color:var(--coral)'}">${esc(r.p.t)} ${r.ok?`<i>${ic('check')}</i>`:''}</b>${r.p.es?`<span class="nota">${esc(r.p.es)}</span>`:''}</button>`).join('')}</div>
    <div class="botones" style="max-width:640px;margin:0 auto"><button class="btn btn-p btn-g" type="button" id="delOtraRonda">🔁 Otra ronda</button><button class="btn btn-borde btn-g" type="button" data-ir="repaso">${ic('hoja')} Fichas</button></div></div>`;
  $$('#s-deletreofin [data-oirp]').forEach(b=>b.onclick=()=>decir(b.dataset.oirp,'en'));
  $('#delOtraRonda').onclick=()=>empezarDeletreo(del.f.id);
  confeti($('#s-deletreofin .buen-trabajo')); sonido('cromo'); decir('Great job!','en');
  setTimeout(()=>{ if(actual==='deletreofin') comprobarPremios(); }, 2500);
}});
/* familia: cómo va con cada palabra */
function deletreoAdultoHTML(p){
  const c=cfgDe(p), est=c.deletreo||{}, log=c.deletreoLog||[];
  if(!log.length) return '';
  const filas=conjuntosDeletreo().map(f=>{ const xs=f.palabras.map(q=>({q, e:est[claveDel(f,q)]})).filter(x=>x.e); if(!xs.length) return '';
    return `<tr><td><b>${esc(f.titulo)}</b></td><td>${xs.map(x=>`<span class="${x.e.c>=3?'nb bien':x.e.ko>x.e.ok?'nb medio':''}" style="margin:2px;display:inline-block">${esc(x.q.t)} ${x.e.ok}/${x.e.ok+x.e.ko}</span>`).join(' ')}</td></tr>`; }).join('');
  return `<div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:8px">🔤 Spell it! · ${esc(p.nombre)}</h3><p class="nota">${log.length} ${log.length===1?'ronda':'rondas'}; palabras escritas sin fallos / veces escritas (en verde, las que ya sabe).</p><div class="tabla-w"><table><tbody>${filas}</tbody></table></div></div>`;
}
/* 27/10: la familia no lo encontraba dentro de Fichas → también en Inicio y en «Aprender jugando», con su propia pantalla */
definir('spellit', {nav:'repaso', pintar(){
  $('#s-spellit').innerHTML = `<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>${tarjetaDeletreoHTML()}`;
  activarTarjetaDeletreo($('#s-spellit')); decir('Spell it! Elige las palabras.');
}});
function spellitInicioHTML(){
  const cs=conjuntosDeletreo(); const f=cs.find(x=>x.id==='school')||cs[0]; if(!f) return '';
  const p=f.palabras.find(q=>!sabidaDel(f,q))||f.palabras[0];
  return `<button class="acceso spellit-c" type="button" data-ir="spellit"><span class="del-mini">${dibujoDel(p)}</span><span><b>🔤 Spell it! · Escribe en inglés</b><span class="nota">Coloca las letras (p · e · n) y escucha cómo se dice: ${esc(cs.map(x=>x.titulo).join(', '))}.</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
