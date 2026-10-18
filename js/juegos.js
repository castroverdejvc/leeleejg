/* LeeLEEJG · juegos de toda la vida (hechos para LeeLEEJG). Se abre uno cada pocas actividades;
   la familia decide cuántos minutos al día y si hay que leer antes. */
'use strict';
const DIRS = {l:[-1,0], r:[1,0], u:[0,-1], d:[0,1]};
const OPUESTA = {l:'r', r:'l', u:'d', d:'u'};
function lienzo(el, cols, rows, maxW=460){
  const ancho=Math.min(maxW, (el.clientWidth||360)-4, (window.innerHeight-260)*cols/rows); const cel=Math.max(14, Math.floor(ancho/cols));
  const cv=document.createElement('canvas'); const dpr=window.devicePixelRatio||1; cv.width=cols*cel*dpr; cv.height=rows*cel*dpr; cv.style.width=cols*cel+'px'; cv.style.height=rows*cel+'px'; cv.className='lienzo';
  const x=cv.getContext('2d'); x.scale(dpr,dpr); el.appendChild(cv); return {cv, x, cel, W:cols*cel, H:rows*cel};
}
function flechas(el, fn, extra=''){
  const d=document.createElement('div'); d.className='flechas';
  d.innerHTML=`<button type="button" data-d="u" class="fu" aria-label="Arriba">▲</button><button type="button" data-d="l" class="fl" aria-label="Izquierda">◀</button><button type="button" data-d="d" class="fd" aria-label="Abajo">▼</button><button type="button" data-d="r" class="fr" aria-label="Derecha">▶</button>${extra}`;
  d.addEventListener('pointerdown', e=>{ const b=e.target.closest('[data-d]'); if(b){ e.preventDefault(); fn(b.dataset.d); } });
  el.appendChild(d); return d;
}
function teclas(fn){ const h=e=>{ const m={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',' ':'s',Enter:'s'}[e.key]; if(m && actual==='juego'){ e.preventDefault(); fn(m); } }; document.addEventListener('keydown',h); return ()=>document.removeEventListener('keydown',h); }
function deslizar(cv, fn){ let x0=null,y0=null; cv.addEventListener('touchstart',e=>{ x0=e.touches[0].clientX; y0=e.touches[0].clientY; },{passive:true});
  cv.addEventListener('touchend',e=>{ if(x0==null) return; const t=e.changedTouches[0]; const dx=t.clientX-x0, dy=t.clientY-y0; x0=null; if(Math.max(Math.abs(dx),Math.abs(dy))<18) return; fn(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u')); }); }
function marcador(el){ const m=document.createElement('div'); m.className='marcador'; el.appendChild(m); return t=>{ m.innerHTML=t; }; }
/* cartel encima del juego (ganar, perder…) */
function cartel(el, html, botones){ const c=document.createElement('div'); c.className='cartel-juego'; c.innerHTML=`<div>${html}<div class="botones"></div></div>`; botones.forEach(([t,fn,cls])=>{ const b=document.createElement('button'); b.type='button'; b.className='btn btn-g '+(cls||'btn-p'); b.textContent=t; b.onclick=()=>{ c.remove(); fn&&fn(); }; c.querySelector('.botones').appendChild(b); }); el.appendChild(c); return c; }
function bucle(fn){ let vivo=true, t0=performance.now(); const paso=t=>{ if(!vivo) return; const dt=Math.min(.1,(t-t0)/1000); t0=t; fn(dt); requestAnimationFrame(paso); }; requestAnimationFrame(paso); return ()=>{ vivo=false; }; }
/* cada partida se apunta con sus aciertos y fallos (la familia lo ve en Evolución › Juegos) */
function apuntarJuego(id, d={}){ try{ const c=cfgDe(perfil()); c.juegoLog=(c.juegoLog||[]).concat([{f:new Date().toISOString(), j:id, a:Math.max(0,Math.round(d.a||0)), e:Math.max(0,Math.round(d.e||0)), ...(d.r?{r:d.r}:{}), ...(d.pts!=null?{pts:d.pts}:{})}]).slice(-1500); guardarAj(); }catch(e){} }
const fotosJuego = n => barajarCon(Object.keys(CONT.fotos).filter(k=>!/^portada|lobitos|_/.test(k) && CONT.palabras && Object.values(CONT.palabras).includes(k)), Date.now()).slice(0,n);
const palabraDe = k => { const e=Object.entries(CONT.palabras||{}).find(([p,v])=>v===k && !p.includes(' ')); return e?e[0]:k; };

/* ============ 1 · Parejas (memoria) ============ */
function jParejas(el){
  let n=4+(typeof nivelJ==='function'?nivelJ('parejas'):2), parar=false;
  const empezar=()=>{
    el.innerHTML=''; const pon=marcador(el); const ks=fotosJuego(n); const cartas=barajarCon([...ks,...ks], Date.now());
    const g=document.createElement('div'); g.className='parejas p'+n; el.appendChild(g);
    let abiertas=[], hechas=0, intentos=0, bloq=false; pon(`Parejas: 0 de ${n} · Intentos: 0`);
    cartas.forEach((k,i)=>{ const b=document.createElement('button'); b.type='button'; b.className='carta-j'; b.innerHTML=`<span class="dorso">?</span><span class="cara">${imgHTML(k)}<b class="${claseTexto()}">${esc(palabraDe(k))}</b></span>`; b.dataset.k=k;
      b.onclick=()=>{ if(bloq || b.classList.contains('abierta')) return; b.classList.add('abierta'); sonido('toc'); abiertas.push(b);
        if(abiertas.length===2){ intentos++; const [a,c]=abiertas; abiertas=[];
          if(a.dataset.k===c.dataset.k){ hechas++; a.classList.add('hecha'); c.classList.add('hecha'); decir(palabraDe(a.dataset.k)); if(hechas===n){ apuntarJuego('parejas',{a:n, e:intentos-n, r:n+' parejas'}); sonido('cromo'); confeti(el); setTimeout(()=>{ if(!parar) cartel(el, `<h2>¡Todas las parejas!</h2><p class="nota">Lo has hecho en ${intentos} intentos.</p>`, [['Otra vez',()=>{ n=Math.min(8,n+1); empezar(); }]]); }, 700); } }
          else { bloq=true; setTimeout(()=>{ a.classList.remove('abierta'); c.classList.remove('abierta'); bloq=false; }, 900); } }
        pon(`Parejas: ${hechas} de ${n} · Intentos: ${intentos}`); };
      g.appendChild(b); });
  };
  empezar(); return {parar(){ parar=true; }};
}

/* ============ 2 · Tres en raya ============ */
function jTresRaya(el){
  let tab, turno, fin, ganadas=0, partidas=0; const LIN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const quien=t=>{ for(const l of LIN) if(t[l[0]] && t[l[0]]===t[l[1]] && t[l[1]]===t[l[2]]) return t[l[0]]; return t.every(Boolean)?'empate':null; };
  el.innerHTML=''; const pon=marcador(el); const g=document.createElement('div'); g.className='tres'; el.appendChild(g);
  const pinta=()=>{ g.innerHTML=tab.map((v,i)=>`<button type="button" data-i="${i}" class="${v||''}">${v==='x'?'✖':v==='o'?'⭕':''}</button>`).join(''); pon(`Tú eres ✖ · Ganadas: ${ganadas} de ${partidas}`); };
  const juegaMaquina=()=>{ const libres=tab.map((v,i)=>v?null:i).filter(i=>i!=null);
    const prueba=(q)=>libres.find(i=>{ const t=tab.slice(); t[i]=q; return quien(t)===q; });
    let i=prueba('o'); if(i==null && Math.random()<.7) i=prueba('x'); if(i==null && !tab[4] && Math.random()<.5) i=4; if(i==null) i=libres[Math.floor(Math.random()*libres.length)];
    tab[i]='o'; turno='x'; sonido('toc'); cierre(); };
  const cierre=()=>{ pinta(); const q=quien(tab); if(!q) return; fin=true; partidas++; apuntarJuego('tresraya', q==='x'?{a:1,r:'gana'}:q==='empate'?{r:'empate'}:{e:1,r:'pierde'}); if(q==='x'){ ganadas++; sonido('cromo'); confeti(el); decir('¡Has ganado!'); } else decir(q==='empate'?'¡Empate!':'¡Esta vez gano yo!');
    pinta(); setTimeout(()=>cartel(el, `<h2>${q==='x'?'¡Has ganado! 🎉':q==='empate'?'¡Empate!':'Gana la máquina'}</h2>`, [['Otra partida', nueva]]), 600); };
  const nueva=()=>{ tab=Array(9).fill(null); fin=false; turno=partidas%2===0?'x':'o'; pinta(); if(turno==='o') setTimeout(juegaMaquina, 500); };
  g.addEventListener('click', e=>{ const b=e.target.closest('[data-i]'); if(!b || fin || turno!=='x') return; const i=+b.dataset.i; if(tab[i]) return; tab[i]='x'; turno='o'; sonido('toc'); cierre(); if(!fin) setTimeout(()=>{ if(!fin) juegaMaquina(); }, 450); });
  nueva(); return {parar(){}};
}

/* ============ 3 · Serpiente ============ */
function jSerpiente(el){
  el.innerHTML=''; const N=14; const pon=marcador(el); const L=lienzo(el,N,N,420); const {x,cel}=L;
  let s, dir, sig, comida, puntos, mejor=0, t=0, vel, vivo=false;
  const nuevaComida=()=>{ do{ comida=[Math.floor(Math.random()*N), Math.floor(Math.random()*N)]; }while(s.some(p=>p[0]===comida[0]&&p[1]===comida[1])); };
  const reinicia=()=>{ s=[[6,7],[5,7],[4,7]]; dir='r'; sig='r'; puntos=0; vel=4.5; nuevaComida(); vivo=true; };
  const girar=d=>{ if(d==='s') return; if(d!==OPUESTA[dir]) sig=d; };
  const quitarT=teclas(girar); deslizar(L.cv, girar); flechas(el, girar);
  const dibuja=()=>{ x.fillStyle='#E9F7EF'; x.fillRect(0,0,L.W,L.H); x.fillStyle='#D8F0E2'; for(let i=0;i<N;i++) for(let j=0;j<N;j++) if((i+j)%2) x.fillRect(i*cel,j*cel,cel,cel);
    x.fillStyle='#E5484D'; x.beginPath(); x.arc((comida[0]+.5)*cel,(comida[1]+.55)*cel,cel*.38,0,7); x.fill(); x.fillStyle='#2FB36B'; x.fillRect((comida[0]+.48)*cel,(comida[1]+.08)*cel,cel*.1,cel*.22);
    s.forEach((p,i)=>{ x.fillStyle=i?(i%2?'#18B47B':'#22C08A'):'#0E8F5F'; x.beginPath(); x.roundRect ? x.roundRect(p[0]*cel+1,p[1]*cel+1,cel-2,cel-2,cel*.35) : x.rect(p[0]*cel+1,p[1]*cel+1,cel-2,cel-2); x.fill(); });
    const h=s[0]; x.fillStyle='#fff'; x.beginPath(); x.arc((h[0]+.33)*cel,(h[1]+.35)*cel,cel*.13,0,7); x.arc((h[0]+.67)*cel,(h[1]+.35)*cel,cel*.13,0,7); x.fill();
    pon(`Manzanas: ${puntos} · Récord: ${mejor}`); };
  reinicia(); dibuja();
  const pararB=bucle(dt=>{ if(!vivo) return; t+=dt; if(t<1/vel) return; t=0; dir=sig; const [dx,dy]=DIRS[dir]; const h=[(s[0][0]+dx+N)%N, (s[0][1]+dy+N)%N];
    if(s.slice(0,-1).some(p=>p[0]===h[0]&&p[1]===h[1])){ vivo=false; mejor=Math.max(mejor,puntos); apuntarJuego('serpiente',{a:puntos, e:1, r:'se muerde'}); sonido('mal'); dibuja(); cartel(el, `<h2>¡Uy, te has mordido!</h2><p class="nota">Has comido ${puntos} manzanas.</p>`, [['Otra vez',()=>{ reinicia(); dibuja(); }]]); return; }
    s.unshift(h); if(h[0]===comida[0]&&h[1]===comida[1]){ puntos++; vel=Math.min(9, vel+.25); sonido('toc'); nuevaComida(); } else s.pop(); dibuja(); });
  return {parar(){ pararB(); quitarT(); }};
}

/* ============ 4 · Comecocos ============ */
const MAPA_COCOS = ["###############","#o.....#.....o#","#.##.......##.#","#.#..##.##..#.#","#...#.....#...#","##.##.#G#.##.##","#.....#G#.....#","#.###.....###.#","#.....#P#.....#","#.#.#######.#.#","#.#....#....#.#","#o..##...##..o#","###############"];
function jComecocos(el){
  el.innerHTML=''; const W=MAPA_COCOS[0].length, H=MAPA_COCOS.length; const pon=marcador(el); const L=lienzo(el,W,H,480); const {x,cel}=L;
  const muro=(c,r)=>!MAPA_COCOS[r] || MAPA_COCOS[r][c]===undefined || MAPA_COCOS[r][c]==='#';
  let cocos, jug, bichos, vidas, puntos, susto, vivo, nivel=1, espera=0;
  const ent=(c,r,v)=>({fc:c,fr:r,tc:c,tr:r,t:0,dir:null,sig:null,v});
  const pos=e=>[e.fc+(e.tc-e.fc)*e.t, e.fr+(e.tr-e.fr)*e.t];
  const colocar=()=>{ let p=null; const gs=[]; MAPA_COCOS.forEach((f,r)=>[...f].forEach((ch,c)=>{ if(ch==='P') p=[c,r]; if(ch==='G') gs.push([c,r]); }));
    jug=ent(p[0],p[1],4.2); bichos=[['#FF6B9A',gs[0]],['#4FC3F7',gs[1]],['#FFB020',gs[0]]].slice(0, nivel>1?3:2).map(([col,g],i)=>({...ent(g[0],g[1],2.1+.25*nivel), col, sale:1.5+i*2.5, casa:g})); espera=1; };
  const nueva=(sigNivel)=>{ if(!sigNivel){ vidas=3; puntos=0; nivel=1; } cocos=new Map(); MAPA_COCOS.forEach((f,r)=>[...f].forEach((ch,c)=>{ if(ch==='.'||ch==='o') cocos.set(c+','+r, ch); })); susto=0; colocar(); vivo=true; };
  const mover=(e, elegir)=>{ return dt=>{ e.t+=dt*e.v*(e===jug?1:(susto>0?.6:1)); if(e.fc===e.tc && e.fr===e.tr) e.t=1;
      if(e.t>=1){ e.fc=e.tc; e.fr=e.tr; e.t=e.t>=1&&e.fc===e.tc&&e.fr===e.tr?0:e.t-1; const d=elegir(e); if(d){ e.dir=d; e.tc=e.fc+DIRS[d][0]; e.tr=e.fr+DIRS[d][1]; } else e.t=0; } }; };
  const libres=(e)=>Object.keys(DIRS).filter(d=>!muro(e.fc+DIRS[d][0], e.fr+DIRS[d][1]));
  const elegirJug=e=>{ if(e.sig && !muro(e.fc+DIRS[e.sig][0], e.fr+DIRS[e.sig][1])) return e.sig; if(e.dir && !muro(e.fc+DIRS[e.dir][0], e.fr+DIRS[e.dir][1])) return e.dir; return null; };
  const elegirBicho=e=>{ let ops=libres(e); if(ops.length>1 && e.dir) ops=ops.filter(d=>d!==OPUESTA[e.dir]); if(!ops.length) return null;
    if(Math.random()<(susto>0?.2:.55)){ const [px,py]=pos(jug); const dist=d=>Math.hypot(e.fc+DIRS[d][0]-px, e.fr+DIRS[d][1]-py); ops.sort((a,b)=>susto>0?dist(b)-dist(a):dist(a)-dist(b)); return ops[0]; }
    return ops[Math.floor(Math.random()*ops.length)]; };
  const girar=d=>{ if(d==='s') return; jug.sig=d; if(jug.dir && d===OPUESTA[jug.dir] && jug.t>0){ [jug.fc,jug.tc]=[jug.tc,jug.fc]; [jug.fr,jug.tr]=[jug.tr,jug.fr]; jug.t=1-jug.t; jug.dir=d; } else if(!jug.dir || jug.t===0){ jug.dir=d; } };
  const quitarT=teclas(girar); deslizar(L.cv, girar); flechas(el, girar);
  /* bichos: bolitas peludas con antenas y un solo ojo */
  const bichoSVG=(cx,cy,col,r)=>{ x.strokeStyle=col; x.lineWidth=Math.max(1.5,r*.14); x.beginPath(); x.moveTo(cx-r*.35,cy-r*.6); x.lineTo(cx-r*.55,cy-r*1.05); x.moveTo(cx+r*.35,cy-r*.6); x.lineTo(cx+r*.55,cy-r*1.05); x.stroke();
    x.fillStyle=col; x.beginPath(); x.arc(cx-r*.55,cy-r*1.05,r*.16,0,7); x.arc(cx+r*.55,cy-r*1.05,r*.16,0,7); x.fill();
    x.beginPath(); for(let i=0;i<14;i++){ const a=i/14*Math.PI*2, rr=r*(i%2?.82:.95); x.lineTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr); } x.closePath(); x.fill();
    x.fillStyle='#fff'; x.beginPath(); x.arc(cx,cy-r*.12,r*.34,0,7); x.fill(); x.fillStyle='#1F2937'; x.beginPath(); x.arc(cx+r*.06,cy-r*.08,r*.16,0,7); x.fill();
    x.strokeStyle='#1F2937'; x.lineWidth=Math.max(1,r*.09); x.beginPath(); x.arc(cx,cy+r*.3,r*.25,.2,Math.PI-.2); x.stroke(); };
  let boca=0;
  const dibuja=()=>{ x.fillStyle='#16123A'; x.fillRect(0,0,L.W,L.H);
    MAPA_COCOS.forEach((f,r)=>[...f].forEach((ch,c)=>{ if(ch==='#'){ x.fillStyle='#3B4CCA'; x.beginPath(); x.roundRect?x.roundRect(c*cel+2,r*cel+2,cel-4,cel-4,cel*.25):x.rect(c*cel+2,r*cel+2,cel-4,cel-4); x.fill(); } }));
    cocos.forEach((t,k)=>{ const [c,r]=k.split(',').map(Number); x.fillStyle='#FFE6A8'; x.beginPath(); x.arc((c+.5)*cel,(r+.5)*cel, t==='o'?cel*.28:cel*.1,0,7); x.fill(); });
    bichos.forEach(b=>{ const [bx,by]=pos(b); bichoSVG((bx+.5)*cel,(by+.5)*cel, susto>0?(susto<1.5&&Math.floor(susto*6)%2?'#fff':'#5B6CFF'):b.col, cel*.4); });
    const [px,py]=pos(jug); const ang={r:0,d:Math.PI/2,l:Math.PI,u:-Math.PI/2}[jug.dir||'r']; const a=.25+.22*Math.abs(Math.sin(boca*10));
    x.fillStyle='#FFD43B'; x.beginPath(); x.moveTo((px+.5)*cel,(py+.5)*cel); x.arc((px+.5)*cel,(py+.5)*cel,cel*.42,ang+a,ang+2*Math.PI-a); x.closePath(); x.fill();
    pon(`Puntos: ${puntos} · Vidas: ${'❤️'.repeat(Math.max(0,vidas))} · Nivel ${nivel}`); };
  nueva(); dibuja();
  const pararB=bucle(dt=>{ if(!vivo) return; if(espera>0){ espera-=dt; dibuja(); return; } boca+=dt; if(susto>0) susto-=dt;
    mover(jug, elegirJug)(dt);
    const k=jug.fc+','+jug.fr; if(cocos.has(k) && (jug.t<.5)){ const t=cocos.get(k); cocos.delete(k); puntos+= t==='o'?50:10; if(t==='o'){ susto=7; sonido('bien'); } }
    bichos.forEach(b=>{ if(b.sale>0){ b.sale-=dt; return; } mover(b, elegirBicho)(dt); const [bx,by]=pos(b), [px,py]=pos(jug);
      if(Math.hypot(bx-px,by-py)<.6){ if(susto>0){ puntos+=200; sonido('cromo'); Object.assign(b, ent(b.casa[0],b.casa[1],b.v), {sale:3}); }
        else { vidas--; sonido('mal'); if(vidas<=0){ vivo=false; apuntarJuego('comecocos',{e:3, pts:puntos, r:'nivel '+nivel}); dibuja(); cartel(el, `<h2>¡Te han pillado!</h2><p class="nota">Has hecho ${puntos} puntos.</p>`, [['Jugar otra vez',()=>{ nueva(); dibuja(); }]]); } else colocar(); } } });
    if(vivo && !cocos.size){ vivo=false; apuntarJuego('comecocos',{a:1, pts:puntos, r:'nivel '+nivel+' superado'}); sonido('cromo'); confeti(el); dibuja(); cartel(el, `<h2>¡Te los has comido todos! 🎉</h2>`, [['Siguiente nivel',()=>{ nivel++; nueva(true); dibuja(); }]]); return; }
    dibuja(); });
  return {parar(){ pararB(); quitarT(); }};
}

/* ============ 5 · Topos lectores ============ */
function jTopos(el){
  el.innerHTML=''; const pon=marcador(el); const g=document.createElement('div'); g.className='topos'; el.appendChild(g);
  const pal=Object.entries(CONT.palabras||{}).filter(([p,k])=>/^[a-zñ]{2,6}$/.test(p) && CONT.fotos[k]).map(([p,k])=>({p,k}));
  let objetivo, aciertos=0, fallos=0, tiempo=40, vivo=false, pararB=null;
  g.innerHTML=Array.from({length:9},(_,i)=>`<div class="hueco"><button type="button" class="topo" data-i="${i}" hidden><span class="${claseTexto()}"></span></button></div>`).join('');
  const nuevoObj=()=>{ objetivo=pal[Math.floor(Math.random()*pal.length)]; decir('Toca: '+objetivo.p); pon(`Toca: <b class="${claseTexto()}">${esc(objetivo.p)}</b> ${imgHTML(objetivo.k,false,'mini-obj')} · Aciertos: ${aciertos} · ⏱ ${Math.ceil(tiempo)}`); };
  const sacar=()=>{ const libres=[...g.querySelectorAll('.topo')].filter(b=>b.hidden); if(!libres.length) return; const b=libres[Math.floor(Math.random()*libres.length)];
    const w = Math.random()<.4 ? objetivo : pal[Math.floor(Math.random()*pal.length)]; b.dataset.p=w.p; b.querySelector('span').textContent=w.p; b.hidden=false; b.classList.remove('mal');
    b._t=setTimeout(()=>{ b.hidden=true; }, 1700+Math.random()*900); };
  g.addEventListener('pointerdown', e=>{ const b=e.target.closest('.topo'); if(!b || !vivo || b.hidden) return; clearTimeout(b._t);
    if(b.dataset.p===objetivo.p){ aciertos++; sonido('bien'); b.hidden=true; nuevoObj(); } else { fallos++; b.classList.add('mal'); sonido('mal'); setTimeout(()=>{ b.hidden=true; }, 300); } });
  const empezar=()=>{ aciertos=0; fallos=0; tiempo=40; vivo=true; nuevoObj(); let ac=0; pararB && pararB();
    pararB=bucle(dt=>{ if(!vivo) return; tiempo-=dt; ac+=dt; if(ac>.75){ ac=0; sacar(); } pon(`Toca: <b class="${claseTexto()}">${esc(objetivo.p)}</b> ${imgHTML(objetivo.k,false,'mini-obj')} · ✓ ${aciertos} · ✗ ${fallos} · ⏱ ${Math.max(0,Math.ceil(tiempo))}`);
      if(tiempo<=0){ vivo=false; apuntarJuego('topos',{a:aciertos, e:fallos}); g.querySelectorAll('.topo').forEach(b=>b.hidden=true); sonido('cromo'); cartel(el, `<h2>¡Tiempo!</h2><p class="nota">Has acertado ${aciertos} palabras${fallos?` y has fallado ${fallos}`:' sin fallar ninguna'}.</p>`, [['Otra vez', empezar]]); } }); };
  cartel(el, `<h2>Topos lectores</h2><p class="nota">Salen topos con palabras. Toca solo los que tengan la palabra que te digo.</p>`, [['¡Empezar!', empezar]]);
  return {parar(){ vivo=false; pararB && pararB(); }};
}

/* ============ 6 · Bloques ============ */
const PIEZAS = [[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
const COL_PIEZAS = ['#4FC3F7','#FFD43B','#B07CF5','#3B82F6','#FF9F43','#FF6B6B','#2FD08A'];
function jBloques(el){
  el.innerHTML=''; const C=10, R=16; const pon=marcador(el); const L=lienzo(el,C,R,320); const {x,cel}=L;
  let tab, p, lineas, vivo, t=0, mejor=0;
  const girar=m=>m[0].map((_,i)=>m.map(f=>f[i]).reverse());
  const choca=(m,px,py)=>m.some((f,j)=>f.some((v,i)=>v && (px+i<0 || px+i>=C || py+j>=R || (py+j>=0 && tab[py+j][px+i]))));
  const nuevaP=()=>{ const k=Math.floor(Math.random()*PIEZAS.length); p={m:PIEZAS[k], c:COL_PIEZAS[k], x:Math.floor((C-PIEZAS[k][0].length)/2), y:-1}; if(choca(p.m,p.x,p.y+1)){ vivo=false; mejor=Math.max(mejor,lineas); apuntarJuego('bloques',{a:lineas, r:'se llena'}); sonido('mal'); dibuja(); cartel(el, `<h2>¡Se ha llenado!</h2><p class="nota">Has hecho ${lineas} líneas.</p>`, [['Otra vez',()=>{ reinicia(); }]]); } };
  const fijar=()=>{ p.m.forEach((f,j)=>f.forEach((v,i)=>{ if(v && p.y+j>=0) tab[p.y+j][p.x+i]=p.c; })); let n=0; tab=tab.filter(f=>{ if(f.every(Boolean)){ n++; return false; } return true; }); while(tab.length<R) tab.unshift(Array(C).fill(null)); if(n){ lineas+=n; sonido('bien'); } else sonido('toc'); nuevaP(); };
  const accion=d=>{ if(!vivo) return; if(d==='l'&&!choca(p.m,p.x-1,p.y)) p.x--; else if(d==='r'&&!choca(p.m,p.x+1,p.y)) p.x++; else if(d==='u'||d==='s'){ const m=girar(p.m); for(const dx of [0,-1,1,-2,2]) if(!choca(m,p.x+dx,p.y)){ p.m=m; p.x+=dx; break; } } else if(d==='d'){ if(!choca(p.m,p.x,p.y+1)) p.y++; else fijar(); } dibuja(); };
  const quitarT=teclas(accion); deslizar(L.cv, accion);
  const fl=flechas(el, accion); fl.querySelector('.fu').textContent='↻'; fl.querySelector('.fu').setAttribute('aria-label','Girar');
  L.cv.addEventListener('click', ()=>accion('u'));
  const celda=(c,r,col)=>{ x.fillStyle=col; x.fillRect(c*cel+1,r*cel+1,cel-2,cel-2); x.fillStyle='rgba(255,255,255,.35)'; x.fillRect(c*cel+2,r*cel+2,cel-4,cel*.25); };
  const dibuja=()=>{ x.fillStyle='#1B1F3B'; x.fillRect(0,0,L.W,L.H); x.strokeStyle='rgba(255,255,255,.05)'; for(let i=0;i<=C;i++){ x.beginPath(); x.moveTo(i*cel,0); x.lineTo(i*cel,L.H); x.stroke(); }
    tab.forEach((f,r)=>f.forEach((v,c)=>{ if(v) celda(c,r,v); })); if(vivo) p.m.forEach((f,j)=>f.forEach((v,i)=>{ if(v && p.y+j>=0) celda(p.x+i,p.y+j,p.c); }));
    pon(`Líneas: ${lineas} · Récord: ${mejor}`); };
  const reinicia=()=>{ tab=Array.from({length:R},()=>Array(C).fill(null)); lineas=0; vivo=true; nuevaP(); dibuja(); };
  reinicia();
  const pararB=bucle(dt=>{ if(!vivo) return; t+=dt; if(t<Math.max(.25, .9-lineas*.03)) return; t=0; if(!choca(p.m,p.x,p.y+1)) p.y++; else fijar(); dibuja(); });
  return {parar(){ pararB(); quitarT(); }};
}

/* ============ 7 · Colores en orden ============ */
function jColores(el){
  el.innerHTML=''; const pon=marcador(el); const g=document.createElement('div'); g.className='simon'; el.appendChild(g);
  const C=[['#2FB36B',392],['#E5484D',330],['#F5B301',262],['#1E7BF2',196]]; let serie=[], i=0, turno=false, mejor=0;
  g.innerHTML=C.map(([c],k)=>`<button type="button" data-k="${k}" style="--c:${c}"></button>`).join('');
  const nota=f=>{ try{ const a=ctxAudio(), o=a.createOscillator(), gg=a.createGain(); o.frequency.value=f; o.type='sine'; gg.gain.setValueAtTime(.0001,a.currentTime); gg.gain.exponentialRampToValueAtTime((aj.volumen??.9)*.2,a.currentTime+.02); gg.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.35); o.connect(gg).connect(a.destination); o.start(); o.stop(a.currentTime+.4); }catch(e){} };
  const luz=k=>{ const b=g.children[k]; b.classList.add('on'); nota(C[k][1]); setTimeout(()=>b.classList.remove('on'), 380); };
  const mostrar=async()=>{ turno=false; pon(`Mira y escucha… · Serie: ${serie.length} · Récord: ${mejor}`); await pausa(700); for(const k of serie){ if(actual!=='juego') return; luz(k); await pausa(650); } turno=true; i=0; pon(`¡Tu turno! · Serie: ${serie.length} · Récord: ${mejor}`); };
  g.addEventListener('pointerdown', e=>{ const b=e.target.closest('[data-k]'); if(!b||!turno) return; const k=+b.dataset.k; luz(k);
    if(k!==serie[i]){ turno=false; mejor=Math.max(mejor, serie.length-1); apuntarJuego('colores',{a:serie.length-1, e:1, r:'serie de '+(serie.length-1)}); sonido('mal'); cartel(el, `<h2>¡Casi!</h2><p class="nota">Has llegado a ${serie.length-1} colores.</p>`, [['Otra vez',()=>{ serie=[Math.floor(Math.random()*4)]; mostrar(); }]]); return; }
    i++; if(i===serie.length){ turno=false; serie.push(Math.floor(Math.random()*4)); setTimeout(mostrar, 500); } });
  cartel(el, `<h2>Colores en orden</h2><p class="nota">Mira qué colores se encienden y tócalos en el mismo orden.</p>`, [['¡Empezar!',()=>{ serie=[Math.floor(Math.random()*4)]; mostrar(); }]]);
  return {parar(){ turno=false; }};
}

/* ============ 8 · Burbujas ============ */
function jBurbujas(el){
  el.innerHTML=''; const COLS=8, FILAS=12; const pon=marcador(el); const L=lienzo(el,COLS,FILAS+2.5,400); const {x,cel}=L; const R=cel/2, DY=R*Math.sqrt(3);
  const COLB=['#E5484D','#1E7BF2','#F5B301','#2FB36B','#8B5CF6'];
  let g, bola, sig, ang=-Math.PI/2, puntos, vivo, ncol=4, tiros=0, par=0, buenos=0;   // par: qué filas van desplazadas (cambia al bajar una fila)
  const imp=r=>(r+par)%2, cols=r=> imp(r) ? COLS-1 : COLS;
  const cx=(r,c)=> R + c*cel + (imp(r)?R:0), cy=r=> R + r*DY;
  const vec=(r,c)=>{ const o = imp(r) ? [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]] : [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]; return o.map(([dr,dc])=>[r+dr,c+dc]).filter(([a,b])=>a>=0&&a<FILAS&&b>=0&&b<cols(a)); };
  const quedan=()=>{ const s=new Set(); g.forEach(f=>f.forEach(v=>{ if(v) s.add(v); })); return [...s]; };
  const nuevaBola=()=>{ const q=quedan(); return q.length ? q[Math.floor(Math.random()*q.length)] : COLB[0]; };
  const nueva=()=>{ par=0; g=Array.from({length:FILAS},(_,r)=>Array(cols(r)).fill(null)); for(let r=0;r<5;r++) for(let c=0;c<cols(r);c++) g[r][c]=COLB[Math.floor(Math.random()*ncol)]; puntos=0; tiros=0; buenos=0; vivo=true; bola=null; sig=nuevaBola(); dibuja(); };
  const bajar=()=>{ par^=1; g=[Array(cols(0)).fill(null).map(()=>COLB[Math.floor(Math.random()*ncol)]), ...g.slice(0,FILAS-1)]; };
  const pegar=(px,py)=>{ let best=null, bd=1e9; for(let r=0;r<FILAS;r++) for(let c=0;c<cols(r);c++) if(!g[r][c]){ const d=Math.hypot(cx(r,c)-px, cy(r)-py); if(d<bd && (r===0 || vec(r,c).some(([a,b])=>g[a][b]))){ bd=d; best=[r,c]; } } return best; };
  const resolver=(r,c)=>{ const col=g[r][c], grupo=[[r,c]], vis=new Set([r+','+c]);
    for(let i=0;i<grupo.length;i++) vec(...grupo[i]).forEach(([a,b])=>{ if(g[a][b]===col && !vis.has(a+','+b)){ vis.add(a+','+b); grupo.push([a,b]); } });
    if(grupo.length<3){ sonido('toc'); return 0; }
    grupo.forEach(([a,b])=>g[a][b]=null);
    const unidas=new Set(), cola=[]; for(let cc=0;cc<cols(0);cc++) if(g[0][cc]){ unidas.add('0,'+cc); cola.push([0,cc]); }
    for(let i=0;i<cola.length;i++) vec(...cola[i]).forEach(([a,b])=>{ if(g[a][b] && !unidas.has(a+','+b)){ unidas.add(a+','+b); cola.push([a,b]); } });
    let caen=0; g.forEach((f,a)=>f.forEach((v,b)=>{ if(v && !unidas.has(a+','+b)){ g[a][b]=null; caen++; } }));
    sonido('bien'); return grupo.length+caen*2; };
  const disparar=()=>{ if(!vivo || bola) return; bola={x:L.W/2, y:L.H-R*1.6, vx:Math.cos(ang)*cel*14, vy:Math.sin(ang)*cel*14, c:sig}; sig=nuevaBola(); };
  const apuntar=e=>{ const r=L.cv.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top; ang=Math.atan2(Math.min(py-(L.H-R*1.6), -cel*.4), px-L.W/2); ang=Math.max(-Math.PI+.15, Math.min(-.15, ang)); dibuja(); };
  L.cv.addEventListener('pointermove', apuntar); L.cv.addEventListener('pointerdown', e=>{ apuntar(e); }); L.cv.addEventListener('pointerup', e=>{ apuntar(e); disparar(); });
  const quitarT=teclas(d=>{ if(d==='l') ang=Math.max(-Math.PI+.15, ang-.08); if(d==='r') ang=Math.min(-.15, ang+.08); if(d==='s'||d==='u') disparar(); dibuja(); });
  const circ=(px,py,col)=>{ x.fillStyle=col; x.beginPath(); x.arc(px,py,R*.94,0,7); x.fill(); x.fillStyle='rgba(255,255,255,.45)'; x.beginPath(); x.arc(px-R*.3,py-R*.3,R*.28,0,7); x.fill(); };
  const dibuja=()=>{ x.fillStyle='#EAF3FF'; x.fillRect(0,0,L.W,L.H); x.fillStyle='#FDE1E1'; x.fillRect(0,cy(FILAS-1)+R,L.W,2);
    g.forEach((f,r)=>f.forEach((v,c)=>{ if(v) circ(cx(r,c),cy(r),v); }));
    const ox=L.W/2, oy=L.H-R*1.6; x.strokeStyle='rgba(30,123,242,.45)'; x.setLineDash([4,6]); x.lineWidth=2; x.beginPath(); x.moveTo(ox,oy); x.lineTo(ox+Math.cos(ang)*cel*3, oy+Math.sin(ang)*cel*3); x.stroke(); x.setLineDash([]);
    if(bola) circ(bola.x,bola.y,bola.c); else circ(ox,oy,sig);
    pon(`Puntos: ${puntos} · Toca donde quieres lanzar`); };
  nueva();
  const pararB=bucle(dt=>{ if(!vivo || !bola) return; const pasos=4; for(let k=0;k<pasos && bola;k++){ bola.x+=bola.vx*dt/pasos; bola.y+=bola.vy*dt/pasos;
      if(bola.x<R){ bola.x=R; bola.vx*=-1; } if(bola.x>L.W-R){ bola.x=L.W-R; bola.vx*=-1; }
      let choca = bola.y<=R; if(!choca) for(let r=0;r<FILAS && !choca;r++) for(let c=0;c<cols(r);c++) if(g[r][c] && Math.hypot(cx(r,c)-bola.x, cy(r)-bola.y)<cel*.88){ choca=true; break; }
      if(choca){ const s=pegar(bola.x,bola.y); if(s){ g[s[0]][s[1]]=bola.c; const pts=resolver(s[0],s[1]); puntos+=pts*10; tiros++; if(pts) buenos++; if(!pts && tiros%7===0) bajar(); }
        bola=null; if(!quedan().length){ vivo=false; apuntarJuego('burbujas',{a:buenos, e:tiros-buenos, pts:puntos, r:'todas'}); sonido('cromo'); confeti(el); dibuja(); cartel(el, `<h2>¡Todas explotadas! 🎉</h2><p class="nota">${puntos} puntos.</p>`, [['Otra vez',()=>{ ncol=Math.min(5,ncol+1); nueva(); }]]); return; }
        if(g[FILAS-1].some(Boolean)){ vivo=false; apuntarJuego('burbujas',{a:buenos, e:tiros-buenos, pts:puntos, r:'llegan abajo'}); sonido('mal'); dibuja(); cartel(el, `<h2>¡Han llegado abajo!</h2><p class="nota">${puntos} puntos.</p>`, [['Otra vez', nueva]]); return; } } }
    dibuja(); });
  return {parar(){ pararB(); quitarT(); }};
}

/* ============ 9 · Puzle deslizante ============ */
function jPuzle(el){
  el.innerHTML=''; const pon=marcador(el); const N=3; let pos, mov, k, malos=0;
  const cont=document.createElement('div'); cont.className='puzle'; el.appendChild(cont);
  const pinta=()=>{ const src=fotoURL(k,true); cont.innerHTML=pos.map((v,i)=>v===N*N-1?`<div class="pz vacio"></div>`:`<button type="button" class="pz" data-i="${i}" style="background-image:url('${src}');background-position:${(v%N)*50}% ${Math.floor(v/N)*50}%"><span>${v+1}</span></button>`).join('');
    pon(`Movimientos: ${mov} · <span class="pz-mini" style="background-image:url('${src}')"></span> Así tiene que quedar`); };
  const vecinos=i=>[i-N,i+N,(i%N)?i-1:-1,(i%N<N-1)?i+1:-1].filter(j=>j>=0&&j<N*N);
  const nueva=()=>{ const ks=Object.keys(CONT.fotos).filter(q=>CONT.fotos[q]==='b' && !/^portada|lobitos/.test(q)); k=ks[Math.floor(Math.random()*ks.length)]; pos=[...Array(N*N).keys()]; mov=0; malos=0;
    let hueco=N*N-1, prev=-1; for(let s=0;s<80;s++){ const op=vecinos(hueco).filter(j=>j!==prev); const j=op[Math.floor(Math.random()*op.length)]; [pos[hueco],pos[j]]=[pos[j],pos[hueco]]; prev=hueco; hueco=j; }
    if(pos.every((v,i)=>v===i)) return nueva(); pinta(); };
  cont.addEventListener('click', e=>{ const b=e.target.closest('[data-i]'); if(!b) return; const i=+b.dataset.i, h=pos.indexOf(N*N-1); if(!vecinos(i).includes(h)){ malos++; sonido('mal'); return; }
    [pos[i],pos[h]]=[pos[h],pos[i]]; mov++; sonido('toc'); pinta(); if(pos.every((v,j)=>v===j)){ apuntarJuego('puzle',{a:1, e:malos, pts:mov, r:mov+' movimientos'}); sonido('cromo'); confeti(el); decir(palabraDe(k)); cartel(el, `<h2>¡Puzle hecho! 🎉</h2><p class="nota">En ${mov} movimientos. Era: <b>${esc(palabraDe(k))}</b>.</p>`, [['Otro puzle', nueva]]); } });
  nueva(); return {parar(){}};
}

/* ============ 10 · Torres ============ */
function jTorres(el){
  el.innerHTML=''; const pon=marcador(el); let n=3+(typeof nivelJ==='function'?nivelJ('torres'):0), t, mov, sel=null, malos=0;
  const cont=document.createElement('div'); cont.className='torres'; el.appendChild(cont);
  const COL=['#E5484D','#F5A300','#2FB36B','#1E7BF2','#8B5CF6'];
  const pinta=()=>{ cont.innerHTML=t.map((pila,i)=>`<button type="button" class="poste${sel===i?' sel':''}" data-p="${i}"><span class="palo"></span>${pila.map(d=>`<span class="disco" style="width:${30+d*14}%;background:${COL[d-1]}"></span>`).join('')}</button>`).join('');
    pon(`Pasa todos los discos al último palo. Nunca un disco grande encima de uno pequeño. · Movimientos: ${mov} (lo mínimo son ${2**n-1}) · ✗ ${malos}`); };
  const nueva=()=>{ t=[[...Array(n).keys()].map(i=>n-i),[],[]]; mov=0; malos=0; sel=null; pinta(); };
  cont.addEventListener('click', e=>{ const b=e.target.closest('[data-p]'); if(!b) return; const i=+b.dataset.p;
    if(sel==null){ if(t[i].length){ sel=i; sonido('toc'); } }
    else { const d=t[sel][t[sel].length-1], arriba=t[i][t[i].length-1]; if(i!==sel && (!arriba || arriba>d)){ t[i].push(t[sel].pop()); mov++; sonido('toc'); } else if(i!==sel){ malos++; sonido('mal'); } sel=null; }
    pinta(); if(t[2].length===n){ apuntarJuego('torres',{a:1, e:malos, pts:mov, r:`${n} discos en ${mov} movimientos`+(mov===2**n-1?' (perfecto)':'')}); sonido('cromo'); confeti(el); cartel(el, `<h2>¡Torre terminada! 🎉</h2><p class="nota">${mov} movimientos.${mov===2**n-1?' ¡Perfecto!':''}</p>`, [[n<5?`Probar con ${n+1} discos`:'Otra vez',()=>{ n=Math.min(5,n+1); nueva(); }],['Repetir',nueva,'btn']]); } });
  nueva(); return {parar(){}};
}

const JUEGOS = [
  {id:'parejas', nombre:'Parejas', emo:'🃏', desc:'Encuentra las cartas iguales.', fn:jParejas},
  {id:'tresraya', nombre:'Tres en raya', emo:'⭕', desc:'Pon tres en línea antes que la máquina.', fn:jTresRaya},
  {id:'serpiente', nombre:'La serpiente', emo:'🐍', desc:'Come manzanas sin morderte la cola.', fn:jSerpiente},
  {id:'comecocos', nombre:'Comecocos', emo:'🟡', desc:'Cómete todos los puntos y escapa de los bichos.', fn:jComecocos},
  {id:'topos', nombre:'Topos lectores', emo:'🐹', desc:'Toca el topo con la palabra que te digo.', fn:jTopos},
  {id:'bloques', nombre:'Bloques', emo:'🧱', desc:'Encaja las piezas y haz líneas.', fn:jBloques},
  {id:'colores', nombre:'Colores en orden', emo:'🌈', desc:'Repite la serie de colores.', fn:jColores},
  {id:'burbujas', nombre:'Burbujas', emo:'🫧', desc:'Junta 3 burbujas del mismo color.', fn:jBurbujas},
  {id:'puzle', nombre:'Puzle', emo:'🧩', desc:'Mueve las piezas hasta ver la foto.', fn:jPuzle},
  {id:'torres', nombre:'Torres', emo:'🗼', desc:'Un juego de lógica: mueve la torre de palo en palo.', fn:jTorres}
];

/* ---------- tiempo de juego y permiso ---------- */
function segJuegoHoy(p=perfil()){ return (cfgDe(p).juegoDias||{})[claveDia(new Date())] || 0; }
const leidoHoy = (p=perfil()) => sesDe(p.id).some(s=>!s.incompleta && !esComp(s.historiaId) && claveDia(s.fecha)===claveDia(new Date()));
function puedeJugar(p=perfil()){
  if(p.prueba) return {ok:true};
  const c=premiosCfg();
  if(c.trasLeer && !leidoHoy(p)) return {ok:false, por:'leer'};
  if(c.minutos>0 && segJuegoHoy(p) >= c.minutos*60) return {ok:false, por:'tiempo'};
  return {ok:true};
}
const quedaJuego = (p=perfil()) => Math.max(0, premiosCfg().minutos*60 - segJuegoHoy(p));

definir('juegos', {nav:'juegos', pintar(){
  const p=perfil(), n=juegosAbiertos(p), fj=faltanParaJuego(p), pj=puedeJugar(p), c=premiosCfg();
  $('#s-juegos').innerHTML = `${albumTabsHTML('juegos')}<div class="album-cab"><div><h1 class="tit">Mis juegos</h1><p class="sub">Cada ${c.juego} actividades se abre un juego nuevo.</p></div>
    <div class="contador">🎮<div><b>${n} de ${JUEGOS.length}</b><br><span>${fj==null?'¡todos abiertos!':fj===1?'te falta 1 actividad':'te faltan '+fj+' actividades'}</span></div></div></div>
  ${pj.ok ? (c.minutos>0 && !p.prueba ? `<div class="card aviso-juego"><span>⏱ Hoy te quedan <b>${Math.ceil(quedaJuego(p)/60)} minutos</b> de juego.</span></div>` : '')
    : pj.por==='leer' ? `<div class="card aviso-juego"><span class="emo-g">📖</span><div><b>Primero, la lectura de hoy</b><span class="nota">Cuando leas una historia hoy, podrás jugar.</span></div><button class="btn btn-p" type="button" data-ir="inicio">Ir a leer</button></div>`
    : `<div class="card aviso-juego"><span class="emo-g">🌙</span><div><b>Hoy ya has jugado ${c.minutos} minutos</b><span class="nota">¡Mañana más! Ahora puedes leer otra historia o hacer un dictado.</span></div></div>`}
  <div class="juegos-grid">${JUEGOS.map((j,i)=> i<n
    ? `<button type="button" class="juego-c" data-j="${j.id}" ${pj.ok?'':'disabled'}><span class="emo-j">${j.emo}</span><b>${esc(j.nombre)}</b><span class="nota">${esc(j.desc)}</span></button>`
    : `<div class="juego-c bloq"><span class="emo-j">🔒</span><b>${i===n?'Próximo juego':'¿?'}</b><span class="nota">${i===n&&fj!=null?(fj===1?'¡Te falta 1 actividad!':'Te faltan '+fj+' actividades'):'Sigue leyendo para abrirlo'}</span></div>`).join('')}</div>`;
  activarAlbumTabs();
  $$('#s-juegos [data-j]').forEach(b=>b.onclick=()=>ir('juego', b.dataset.j));
}});

let juegoVivo=null, relojJuego=null;
definir('juego', {nav:'juegos', pintar(id){
  const j=JUEGOS.find(x=>x.id===id); const p=perfil();
  if(!j || JUEGOS.indexOf(j)>=juegosAbiertos(p) || !puedeJugar(p).ok){ ir('juegos'); return; }
  $('#s-juego').innerHTML = `<div class="juego-cab"><button class="volver" type="button" data-ir="juegos">${ic('atras')} Juegos</button><h1 class="tit">${j.emo} ${esc(j.nombre)}</h1><span class="pill" id="relojJuego"></span></div><div class="juego-zona" id="juegoZona"></div>`;
  const z=$('#juegoZona'); juegoVivo = j.fn(z);
  const limite=!p.prueba && premiosCfg().minutos>0;
  const pinta=()=>{ const r=$('#relojJuego'); if(r) r.textContent = limite ? `⏱ ${Math.ceil(quedaJuego()/60)} min` : ''; r && (r.hidden=!limite); };
  pinta(); clearInterval(relojJuego); let n=0;
  relojJuego=setInterval(()=>{ if(actual!=='juego' || document.hidden) return; const c=aj; const hoy=claveDia(new Date());
    const jd=c.juegoDias={...(c.juegoDias||{})}; jd[hoy]=(jd[hoy]||0)+5; Object.keys(jd).sort().slice(0,-40).forEach(k=>delete jd[k]); n++; if(n%6===0) guardarAj(); pinta();
    if(limite && quedaJuego()<=0){ guardarAj(); PANT.juego.salir(); dialogo({titulo:'¡Se acabó el tiempo de juego!', html:`<p class="nota">Hoy ya has jugado ${premiosCfg().minutos} minutos. ¡Mañana más!</p>`, botones:[{t:'Vale', cls:'btn-p', fn:()=>ir('inicio')}], cerrar:false}); decir('Se acabó el tiempo de juego por hoy. ¡Mañana más!'); } }, 5000);
}, salir(){ clearInterval(relojJuego); relojJuego=null; if(juegoVivo){ try{ juegoVivo.parar(); }catch(e){} juegoVivo=null; } guardarAj(); }});
