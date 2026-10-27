/* LeeLEEJG · «Escribo en ligada» (24/10/2026): repasar con el dedo o el lápiz del iPad letras, sílabas y palabras
   en letra ligada (la del cole), sobre una pauta. La letra sale en gris con un punto verde donde se empieza.
   Al pulsar «¡Ya está!» se comprueba que el trazo va por encima de la letra (que no se sale), que la cubre entera,
   que empieza en el punto verde y, en sílabas y palabras, que va de izquierda a derecha.
   Las palabras incluyen las que más le cuestan al leer. Cuenta como una ficha (⭐, tele y objetivos). cfg.caliLog, cfg.caliHechas. */
'use strict';
const CALI_LETRAS = ['a','e','i','o','u','l','m','p','s','t','n','d','c','r','b','f','g','j','v','z','h','ñ','y','q','x','k'];
const CALI_SILABAS = ['ma','me','mi','mo','mu','pa','pe','pi','po','pu','la','le','li','lo','lu','sa','se','si','so','su','ta','te','ti','to','tu','na','ne','ni','no','nu','da','de','di','do','du'];
const CALI_PALABRAS = ['mamá','papá','casa','sol','luna','gato','pato','mesa','oso','pelota','libro','agua','flor','coche','perro','mano','pie','nube','tomate','lápiz'];
const CALI_TIPOS = {letras:{t:'Letras', emo:'🔤', n:6, fs:240}, silabas:{t:'Sílabas', emo:'🧩', n:6, fs:200}, palabras:{t:'Palabras', emo:'📝', n:4, fs:150}};
const CALI_FUENTE = '"Playwrite ES","Segoe Script","Comic Sans MS",cursive';
let cali=null;   // la ronda en marcha

function caliPalabras(){
  const mias = (typeof listaPractica==='function' ? listaPractica() : []).map(x=>String(x).toLowerCase()).filter(x=>/^[a-záéíóúñü]{2,8}$/.test(x));
  return [...new Set([...mias.slice(0,8), ...CALI_PALABRAS])];
}
function caliRonda(tipo){
  const T=CALI_TIPOS[tipo], h=cfgDe(perfil()).caliHechas||{};
  const base = tipo==='letras' ? CALI_LETRAS : tipo==='silabas' ? CALI_SILABAS : caliPalabras();
  // primero lo que menos ha hecho bien, sin perder el orden del cole (las primeras letras antes)
  const orden = base.map((x,i)=>({x, i, n:h[x]||0})).sort((a,b)=>a.n-b.n || a.i-b.i).map(o=>o.x);
  const lista = orden.slice(0, T.n);
  return {tipo, items:lista, i:0, res:[], intentos:0};
}

/* tarjeta en Fichas */
function tarjetaCaligrafiaHTML(){
  const hoy=(cfgDe(perfil()).caliLog||[]).filter(x=>claveDia(x.f)===claveDia(new Date())).length;
  return `<div class="card bloque cali-tarjeta"><div><b style="font-size:1.4rem">✍️ Escribo en ligada</b><p class="nota">Repasa la letra del cole con el dedo o el lápiz.${hoy?` Hoy ya has hecho ${hoy===1?'una ronda':hoy+' rondas'}.`:''}</p></div>
    <div class="trabajos-grid">${Object.entries(CALI_TIPOS).map(([k,T])=>`<button type="button" class="trabajo-c" data-cali="${k}"><span class="emo-j">${T.emo}</span><b>${T.t}</b><span class="nota">${k==='palabras'?'También las que te cuestan':k==='letras'?'Una a una':'ma, pe, li…'}</span></button>`).join('')}</div></div>`;
}
function activarTarjetaCaligrafia(raiz){ $$('[data-cali]', raiz).forEach(b=>b.onclick=()=>ir('caligrafia', b.dataset.cali)); }

definir('caligrafia', {nav:'repaso', pintar(tipo){
  if(tipo && CALI_TIPOS[tipo]) cali=caliRonda(tipo);
  /* 28/10: una lista concreta (las fichas del cole: «lista:a,e,i,o,u», «lista:lana,sol,mono») */
  else if(tipo && String(tipo).startsWith('lista:')){ const xs=String(tipo).slice(6).split(',').filter(Boolean); cali={tipo: xs.every(x=>x.length===1)?'letras':'palabras', lista:tipo, items:xs, i:0, res:[], intentos:0}; }
  if(!cali){ ir('repaso'); return; }
  const T=CALI_TIPOS[cali.tipo], item=cali.items[cali.i];
  if(item==null){ caliFin(); return; }
  $('#s-caligrafia').innerHTML=`<div class="juego-cab"><button class="volver" type="button" data-ir="repaso">${ic('atras')} Fichas</button><h1 class="tit">✍️ Escribo en ligada</h1>
      <div class="prog-puntos">${cali.items.map((_,j)=>`<i class="${j<cali.i?(cali.res[j]&&cali.res[j].bien?'ok':'mal'):j===cali.i?'on':''}"></i>`).join('')}</div></div>
    <div class="card cali-caja"><p class="orden-cali">Repasa <b>${esc(item)}</b> con el dedo o el lápiz. Empieza en el <span class="punto-v">●</span> verde.</p>
      <div class="cali-zona" id="caliZona"><canvas id="caliGuia"></canvas><canvas id="caliTinta"></canvas></div>
      <p class="cali-msg" id="caliMsg" aria-live="polite"></p>
      <div class="botones" style="justify-content:center"><button class="btn btn-borde" type="button" id="caliOir">${ic('altavoz')} Escuchar</button><button class="btn" type="button" id="caliBorrar">↩️ Borrar</button><button class="btn btn-p btn-g" type="button" id="caliYa">✅ ¡Ya está!</button></div></div>`;
  $('#caliOir').onclick=()=>decir(item.length===1?`La ${item}`:item);
  caliPreparar(item, T.fs).then(()=>{ if(actual==='caligrafia') decir(item.length===1?`Escribe la ${item}`:`Escribe ${item}`); });
}});

/* ---------- la guía (letra gris y pauta) y la tinta ---------- */
async function caliPreparar(item, fs0){
  const zona=$('#caliZona'), g=$('#caliGuia'), t=$('#caliTinta');
  const W=Math.max(280, Math.min(zona.clientWidth||600, 900)), H=Math.round(Math.min(340, Math.max(220, W*0.45))), dpr=window.devicePixelRatio||1;
  [g,t].forEach(c=>{ c.width=W*dpr; c.height=H*dpr; c.style.width=W+'px'; c.style.height=H+'px'; });
  try{ if(document.fonts && document.fonts.load) await Promise.race([document.fonts.load(`400 ${fs0}px "Playwrite ES"`), pausa(1500)]); }catch(_){}
  // tamaño de la letra: que quepa a lo ancho
  const m=document.createElement('canvas').getContext('2d'); m.font=`400 ${fs0}px ${CALI_FUENTE}`;
  let fs=fs0; const ancho=m.measureText(item).width; if(ancho>W*0.86) fs=Math.floor(fs0*W*0.86/ancho);
  fs=Math.min(fs, H*0.62);
  const base=H*0.68, x0=(W-(()=>{ m.font=`400 ${fs}px ${CALI_FUENTE}`; return m.measureText(item).width; })())/2;
  const dibuja=(ctx, estilo)=>{ ctx.font=`400 ${fs}px ${CALI_FUENTE}`; ctx.textBaseline='alphabetic'; estilo(ctx); };
  // máscaras a 1 píxel por punto
  const tinta=document.createElement('canvas'); tinta.width=W; tinta.height=H; const ti=tinta.getContext('2d');
  dibuja(ti, c=>{ c.fillStyle='#000'; c.fillText(item, x0, base); });
  const tol=Math.max(10, Math.round(fs*0.09));
  const ancha=document.createElement('canvas'); ancha.width=W; ancha.height=H; const an=ancha.getContext('2d');
  dibuja(an, c=>{ c.fillStyle='#000'; c.strokeStyle='#000'; c.lineWidth=tol*2; c.lineJoin='round'; c.fillText(item, x0, base); c.strokeText(item, x0, base); });
  const dt=ti.getImageData(0,0,W,H).data, muestras=[];
  for(let y=0;y<H;y+=3) for(let x=0;x<W;x+=3) if(dt[(y*W+x)*4+3]>60) muestras.push([x,y]);
  // el punto verde: lo más bajo de la parte izquierda de la letra (en ligada, la letra entra desde abajo a la izquierda)
  let inicio=null; if(muestras.length){ const minX=Math.min(...muestras.map(p=>p[0])); const banda=muestras.filter(p=>p[0]<=minX+fs*0.08); inicio=banda.reduce((a,p)=>p[1]>a[1]?p:a, banda[0]); }
  // dibujar la pauta y la letra gris
  const gc=g.getContext('2d'); gc.setTransform(dpr,0,0,dpr,0,0); gc.clearRect(0,0,W,H);
  const xh=fs*0.42; gc.strokeStyle='#BFDBFE'; gc.lineWidth=1.2;
  [[base,'#93C5FD',2],[base-xh,'#BFDBFE',1.2],[base-fs*0.78,'#E0E7FF',1],[base+fs*0.3,'#E0E7FF',1]].forEach(([y,col,w])=>{ gc.strokeStyle=col; gc.lineWidth=w; gc.beginPath(); gc.moveTo(8,y); gc.lineTo(W-8,y); gc.stroke(); });
  dibuja(gc, c=>{ c.fillStyle='#CBD5E1'; c.fillText(item, x0, base); });
  if(inicio){ gc.fillStyle='#16A34A'; gc.beginPath(); gc.arc(inicio[0], inicio[1], 9, 0, Math.PI*2); gc.fill();
    gc.strokeStyle='#16A34A'; gc.lineWidth=3; gc.beginPath(); gc.moveTo(inicio[0]+14, inicio[1]+16); gc.lineTo(inicio[0]+40, inicio[1]+16); gc.lineTo(inicio[0]+33, inicio[1]+10); gc.moveTo(inicio[0]+40, inicio[1]+16); gc.lineTo(inicio[0]+33, inicio[1]+22); gc.stroke(); }
  cali.g={W, H, fs, tol, muestras, inicio, ancha:an.getImageData(0,0,W,H).data, trazos:[], item};
  caliTinta(t, W, H, dpr);
  $('#caliBorrar').onclick=()=>{ cali.g.trazos=[]; caliRepinta(); $('#caliMsg').textContent=''; };
  $('#caliYa').onclick=caliComprobar;
}
function caliRepinta(color='#1D4ED8'){
  const t=$('#caliTinta'); if(!t||!cali||!cali.g) return; const dpr=window.devicePixelRatio||1, c=t.getContext('2d');
  c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,cali.g.W,cali.g.H); c.strokeStyle=color; c.lineWidth=Math.max(5, cali.g.fs*0.05); c.lineCap='round'; c.lineJoin='round';
  cali.g.trazos.forEach(tr=>{ if(!tr.length) return; c.beginPath(); c.moveTo(tr[0][0],tr[0][1]); tr.forEach(p=>c.lineTo(p[0],p[1])); if(tr.length===1) c.lineTo(tr[0][0]+0.1,tr[0][1]); c.stroke(); });
}
function caliTinta(t){
  let actualT=null, idP=null;
  const pos=e=>{ const r=t.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; };
  t.onpointerdown=e=>{ if(e.button>0) return; idP=e.pointerId; try{ t.setPointerCapture(idP); }catch(_){} actualT=[pos(e)]; cali.g.trazos.push(actualT); caliRepinta(); e.preventDefault(); };
  t.onpointermove=e=>{ if(!actualT || e.pointerId!==idP) return; let co=e.getCoalescedEvents?e.getCoalescedEvents():[]; if(!co.length) co=[e]; co.forEach(ev=>actualT.push(pos(ev))); caliRepinta(); e.preventDefault(); };
  t.onpointerup=t.onpointercancel=e=>{ if(e.pointerId!==idP) return; actualT=null; idP=null; };
  t.style.touchAction='none';
}

/* ---------- comprobar ---------- */
function caliNota(g){
  const pts=g.trazos.flat(); if(pts.length<4) return {vacio:true};
  const dentroDe=([x,y])=>{ x=Math.round(x); y=Math.round(y); if(x<0||y<0||x>=g.W||y>=g.H) return false; return g.ancha[(y*g.W+x)*4+3]>40; };
  const dentro=pts.filter(dentroDe).length/pts.length;
  // lo cubierto: las muestras de la letra que tienen tinta del niño cerca
  const m=document.createElement('canvas'); m.width=g.W; m.height=g.H; const c=m.getContext('2d'); c.strokeStyle='#000'; c.lineWidth=g.tol*2; c.lineCap='round'; c.lineJoin='round';
  g.trazos.forEach(tr=>{ c.beginPath(); c.moveTo(tr[0][0],tr[0][1]); tr.forEach(p=>c.lineTo(p[0],p[1])); if(tr.length===1) c.lineTo(tr[0][0]+0.1,tr[0][1]); c.stroke(); });
  const d=c.getImageData(0,0,g.W,g.H).data; const cub=g.muestras.filter(([x,y])=>d[(y*g.W+x)*4+3]>40).length/Math.max(1,g.muestras.length);
  const p0=g.trazos[0][0]; const empieza = !g.inicio || Math.hypot(p0[0]-g.inicio[0], p0[1]-g.inicio[1]) <= Math.max(3*g.tol, 32);
  const q=Math.max(1, Math.floor(pts.length/4)); const xi=media(pts.slice(0,q).map(p=>p[0])), xf=media(pts.slice(-q).map(p=>p[0]));
  const derecha = g.item.length<2 || xf>xi;
  return {dentro, cubre:cub, empieza, derecha, ok: dentro>=0.72 && cub>=0.62 && empieza && derecha};
}
function caliComprobar(){
  if(!cali||!cali.g) return; const n=caliNota(cali.g), msg=$('#caliMsg');
  if(n.vacio){ msg.textContent='Primero repasa la letra gris con el dedo o el lápiz.'; decir('Primero repasa la letra gris'); return; }
  cali.intentos++;
  if(n.ok){
    caliRepinta('#16A34A'); sonido('bien'); msg.textContent=['¡Muy bien!','¡Qué bonita!','¡Genial!','¡Perfecta!'][cali.i%4]+' ⭐'; decir(msg.textContent.replace('⭐',''));
    caliSiguiente(true); return; }
  const que = !n.empieza ? 'Empieza en el punto verde.' : !n.derecha ? 'Se escribe de izquierda a derecha, como cuando lees.' : n.dentro<0.72 ? 'Te has salido un poco de la letra. Ve despacito por encima de la gris.' : 'Te falta un trozo. Repásala entera, sin levantar mucho el lápiz.';
  sonido('mal'); caliRepinta('#E5484D');
  if(cali.intentos>=3){ msg.textContent=que+' Vamos con la siguiente.'; decir('¡Casi! Vamos con la siguiente'); caliSiguiente(false); return; }
  msg.textContent=que; decir(que); setTimeout(()=>{ if(cali && cali.g){ cali.g.trazos=[]; caliRepinta(); } }, 1400);
}
function caliSiguiente(ok){
  const item=cali.items[cali.i]; cali.res.push({t:item, ok: ok && cali.intentos===1, bien:ok, int:cali.intentos});
  if(ok){ const c=cfgDe(perfil()); c.caliHechas={...(c.caliHechas||{}), [item]:((c.caliHechas||{})[item]||0)+1}; }
  cali.i++; cali.intentos=0; const yo=cali;
  setTimeout(()=>{ if(cali===yo && actual==='caligrafia') ir('caligrafia'); }, 1300);
}
function caliFin(){
  const r=cali.res, bien=r.filter(x=>x.bien).length, c=cfgDe(perfil());
  const _ant=typeof fotoPremios==='function'?fotoPremios():null;
  c.caliLog=(c.caliLog||[]).concat([{f:new Date().toISOString(), tipo:cali.tipo, n:r.length, bien, items:r.map(x=>({t:x.t, ok:x.bien, int:x.int}))}]).slice(-1500); guardarAj();
  const est = 1 + (r.length && bien/r.length>=0.8 ? 1 : 0); const tipo=cali.lista||cali.tipo; cali=null;
  $('#s-caligrafia').innerHTML=`<div class="card buen-trabajo"><h1>¡Buen trabajo!</h1><p class="sub">Has escrito ${bien} de ${r.length} en ligada.</p>${typeof premioChipHTML==='function'?premioChipHTML(_ant):''}
    <div class="cali-hechas">${r.map(x=>`<span class="${x.bien?'ok':'mal'}">${esc(x.t)}</span>`).join('')}</div>
    <div class="botones" style="max-width:640px;margin:14px auto 0"><button class="btn btn-p btn-g" type="button" id="caliOtra">✍️ Otra ronda</button><button class="btn btn-borde btn-g" type="button" data-ir="repaso">${ic('hoja')} Fichas</button><button class="btn btn-borde btn-g" type="button" data-ir="inicio">${ic('casa')} Inicio</button></div></div>`;
  $('#caliOtra').onclick=()=>ir('caligrafia', tipo);
  confeti($('#s-caligrafia .buen-trabajo')); sonido('cromo'); decir(`¡Muy bien, ${nombre()}! Has escrito ${bien} de ${r.length}.`);
  if(typeof avisarTele==='function') avisarTele(perfil(), true);
}
/* familia: cómo va la caligrafía (en Familia › Fichas de clase) */
function caligrafiaAdultoHTML(p){
  const log=cfgDe(p).caliLog||[]; if(!log.length) return '';
  const it=log.flatMap(x=>x.items||[]); const porT={}; it.forEach(x=>{ const o=porT[x.t]||(porT[x.t]={n:0,b:0}); o.n++; if(x.ok) o.b++; });
  const dificiles=Object.entries(porT).filter(([,o])=>o.n>=2).sort((a,b)=>a[1].b/a[1].n-b[1].b/b[1].n).slice(0,8);
  return `<div class="card bloque" style="margin-top:18px"><h3>✍️ Escribo en ligada · ${esc(p.nombre)}</h3><p class="nota">${log.length} ${log.length===1?'ronda':'rondas'}, ${it.filter(x=>x.ok).length} de ${it.length} bien (${Math.round(100*it.filter(x=>x.ok).length/Math.max(1,it.length))} %).${dificiles.length?' Lo que más le cuesta: '+dificiles.map(([t,o])=>`<b>${esc(t)}</b> (${o.b}/${o.n})`).join(', ')+'.':''}</p></div>`;
}
