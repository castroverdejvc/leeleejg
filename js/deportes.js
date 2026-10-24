/* LeeLEEJG · minijuegos de deportes (24/10/2026). Pedido por la familia: penaltis (de portero, de delantero o los dos),
   baloncesto 1 contra 1, béisbol (batear o lanzar), natación, golf… «muy fáciles de jugar; según pase fases se hacen
   más difíciles; se abren según las actividades que haga». Cada juego guarda su récord.
   - Se juegan con un toque (o dos, en natación).
   - Fases: superar una abre la siguiente (deporteLog: {f, j, nivel, pts, gano, t?}).
   - Se abren con las ⭐ (DEPORTES[].est); cuentan como tiempo de juego del día, como los demás juegos. */
'use strict';
function lienzoDep(z, W=400, H=300){
  const cv=document.createElement('canvas'); const ancho=Math.min(720, (z.clientWidth||360)); const esc=ancho/W; const dpr=window.devicePixelRatio||1;
  cv.width=Math.round(W*esc*dpr); cv.height=Math.round(H*esc*dpr); cv.style.width=ancho+'px'; cv.style.height=Math.round(H*esc)+'px'; cv.className='lienzo dep';
  const x=cv.getContext('2d'); x.scale(esc*dpr, esc*dpr); z.appendChild(cv);
  const pos=e=>{ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*W, y:(e.clientY-r.top)/r.height*H}; };
  return {cv, x, W, H, pos};
}
const emoD=(x,t,X,Y,s)=>{ x.font=`${s}px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif`; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t,X,Y); };
const txtD=(x,t,X,Y,s,col='#1F2937',peso=900)=>{ x.font=`${peso} ${s}px Nunito,system-ui,sans-serif`; x.fillStyle=col; x.textAlign='center'; x.textBaseline='middle'; x.fillText(t,X,Y); };
const rrect=(x,X,Y,w,h,r)=>{ x.beginPath(); x.moveTo(X+r,Y); x.arcTo(X+w,Y,X+w,Y+h,r); x.arcTo(X+w,Y+h,X,Y+h,r); x.arcTo(X,Y+h,X,Y,r); x.arcTo(X,Y,X+w,Y,r); x.closePath(); };
const botonesDep = (z, lista) => { const d=document.createElement('div'); d.className='dep-botones'; lista.forEach(([t,fn,cls])=>{ const b=document.createElement('button'); b.type='button'; b.className='btn btn-xl '+(cls||'btn-p'); b.innerHTML=t; b.addEventListener('pointerdown', e=>{ e.preventDefault(); fn(b); }); d.appendChild(b); }); z.appendChild(d); return d; };
const marcadorDep = z => { const m=document.createElement('div'); m.className='marcador dep-marc'; z.appendChild(m); return t=>{ m.innerHTML=t; }; };

/* ============ 1 · Penaltis (tirar, parar o tanda) ============ */
function depPenaltis(z, {nivel, modo}, fin){
  const L=lienzoDep(z, 400, 300), x=L.x; const marc=marcadorDep(z);
  const P = {gx:80, gy:60, gw:240, gh:110};   // portería
  const zona = (c,f) => ({x:P.gx+P.gw*(c+0.5)/3, y:P.gy+P.gh*(f+0.5)/2});
  const listo = 0.15 + 0.06*(nivel-1);         // lo que acierta el portero de la máquina
  const turnos = []; let i=0, golesYo=0, golesCPU=0, paradas=0, tirosYo=0, tirosCPU=0;
  const N=5; const plan = modo==='tirar' ? Array(N).fill('tiro') : modo==='parar' ? Array(N).fill('parada') : Array.from({length:N*2},(_,k)=>k%2?'parada':'tiro');
  let st=null, parar=null, vivo=true;
  const dibuja = () => {
    x.clearRect(0,0,400,300);
    const g=x.createLinearGradient(0,0,0,300); g.addColorStop(0,'#BFE3FF'); g.addColorStop(.45,'#BFE3FF'); g.addColorStop(.46,'#4CAF50'); g.addColorStop(1,'#2E8B3C'); x.fillStyle=g; x.fillRect(0,0,400,300);
    for(let k=0;k<6;k++){ x.fillStyle=k%2?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)'; x.fillRect(0,140+k*27,400,27); }
    x.fillStyle='rgba(255,255,255,.7)'; x.fillRect(P.gx,P.gy,P.gw,P.gh);
    x.strokeStyle='rgba(120,120,120,.35)'; x.lineWidth=1; for(let a=P.gx;a<=P.gx+P.gw;a+=12){ x.beginPath(); x.moveTo(a,P.gy); x.lineTo(a,P.gy+P.gh); x.stroke(); } for(let b=P.gy;b<=P.gy+P.gh;b+=12){ x.beginPath(); x.moveTo(P.gx,b); x.lineTo(P.gx+P.gw,b); x.stroke(); }
    x.strokeStyle='#fff'; x.lineWidth=6; x.beginPath(); x.moveTo(P.gx,P.gy+P.gh); x.lineTo(P.gx,P.gy); x.lineTo(P.gx+P.gw,P.gy); x.lineTo(P.gx+P.gw,P.gy+P.gh); x.stroke();
    x.strokeStyle='rgba(255,255,255,.8)'; x.lineWidth=2; x.beginPath(); x.ellipse(200,250,4,2,0,0,7); x.stroke();
    if(st && st.zonas){ for(let f=0;f<2;f++) for(let c=0;c<3;c++){ const q=zona(c,f); x.strokeStyle='rgba(30,123,242,.55)'; x.lineWidth=2; x.setLineDash([5,4]); x.strokeRect(q.x-P.gw/6+3, q.y-P.gh/4+3, P.gw/3-6, P.gh/2-6); x.setLineDash([]); } }
    if(st && st.pista!=null && st.verPista){ const q=zona(st.pista%3, Math.floor(st.pista/3)); x.fillStyle='rgba(229,72,77,.35)'; x.beginPath(); x.arc(q.x,q.y,24,0,7); x.fill(); emoD(x,'🎯',q.x,q.y,22); }
    const k=st?st.portero:{x:200,y:P.gy+P.gh-30}; emoD(x, modo!=='tirar'&&st&&st.yoPortero?'🧤':'🧍', k.x, k.y, 44);
    if(st && st.yoPortero){ txtD(x,'TÚ',k.x,k.y-32,12,'#1E7BF2'); }
    const b=st?st.balon:{x:200,y:250,s:26}; emoD(x,'⚽',b.x,b.y,b.s);
    if(st && st.msg){ x.fillStyle='rgba(255,255,255,.88)'; rrect(x,110,118,180,40,14); x.fill(); txtD(x,st.msg,200,138,22,st.col||'#1F2937'); }
  };
  const pinta = () => marc(`<span>⚽ Tus goles: <b>${golesYo}</b></span>${modo!=='tirar'?`<span>🧤 Paradas: <b>${paradas}</b></span>`:''}${modo==='tanda'?`<span>🤖 Goles de la máquina: <b>${golesCPU}</b></span>`:''}<span>Tiro ${Math.min(i+1,plan.length)} de ${plan.length}</span>`);
  const anima = (de, a, ms, alFin) => { const t0=performance.now(); const paso=t=>{ if(!vivo) return; const k=Math.min(1,(t-t0)/ms); const e=1-(1-k)*(1-k);
      st.balon={x:de.x+(a.x-de.x)*e, y:de.y+(a.y-de.y)*e, s:26-10*e}; if(st.porteroA){ st.portero={x:st.porteroDe.x+(st.porteroA.x-st.porteroDe.x)*Math.min(1,e*1.4), y:st.porteroDe.y+(st.porteroA.y-st.porteroDe.y)*Math.min(1,e*1.4)}; }
      dibuja(); if(k<1) requestAnimationFrame(paso); else alFin(); }; requestAnimationFrame(paso); };
  const siguiente = () => {
    if(!vivo) return;
    if(modo==='tanda' && i>=plan.length && golesYo===golesCPU && plan.length<20){ plan.push('tiro','parada'); }   // muerte súbita
    if(i>=plan.length){ terminar(); return; }
    pinta(); const tipo=plan[i];
    st={zonas: tipo==='tiro', portero:{x:200,y:P.gy+P.gh-30}, balon:{x:200,y:250,s:26}, yoPortero: tipo==='parada'};
    if(tipo==='tiro'){ st.msg='¡Toca dónde tiras!'; st.col='#1E7BF2'; dibuja(); st.espera=true; decir('¡Toca dónde quieres tirar!'); }
    else { // el niño para: se ve unos instantes dónde va a tirar la máquina
      const obj=Math.floor(Math.random()*6); st.pista=obj; st.verPista=true; st.zonas=true; st.msg='¡Mira la diana!'; dibuja();
      const verMs=Math.max(250, 1000-90*(nivel-1)), vueloMs=Math.max(520, 1150-60*(nivel-1));
      setTimeout(()=>{ if(!vivo) return; st.verPista=nivel<=2; st.msg='¡Para!'; st.col='#E5484D'; st.espera='parar'; st.elegida=null; dibuja();
        const q=zona(obj%3, Math.floor(obj/3)); anima({x:200,y:250}, q, vueloMs, ()=>{ st.espera=false; const ok=st.elegida===obj; tirosCPU++;
          if(ok){ paradas++; st.msg='¡PARADÓN!'; st.col='#18B47B'; sonido('bien'); decir('¡Paradón!'); } else { golesCPU++; st.msg='Gol de la máquina'; st.col='#E5484D'; sonido('mal'); }
          dibuja(); pinta(); setTimeout(()=>{ i++; siguiente(); }, 1100); });
      }, verMs);
    }
  };
  L.cv.addEventListener('pointerdown', e=>{ e.preventDefault(); if(!st || !st.espera) return; const p=L.pos(e);
    const c=Math.max(0,Math.min(2,Math.floor((p.x-P.gx)/(P.gw/3)))), f=p.y<P.gy+P.gh/2?0:1; const z6=f*3+c;
    if(st.espera===true){ st.espera=false; st.msg=null; const q=zona(c,f);
      const guess = Math.random()<listo ? z6 : Math.floor(Math.random()*6); const ok = guess!==z6;
      const g=zona(guess%3, Math.floor(guess/3)); st.porteroDe={...st.portero}; st.porteroA={x:g.x, y:g.y};
      anima({x:200,y:250}, ok?q:{x:(q.x+g.x)/2,y:(q.y+g.y)/2}, 650, ()=>{ tirosYo++; if(ok){ golesYo++; st.msg='¡GOOOL!'; st.col='#18B47B'; sonido('bien'); decir('¡Gol!'); } else { st.msg='¡Parada!'; st.col='#E5484D'; sonido('mal'); }
        dibuja(); pinta(); setTimeout(()=>{ i++; siguiente(); }, 1100); });
    } else if(st.espera==='parar' && st.elegida==null){ st.elegida=z6; const g=zona(c,f); st.porteroDe={...st.portero}; st.porteroA={x:g.x,y:g.y}; }
  });
  const terminar = () => {
    const logro = modo==='tirar' ? golesYo : modo==='parar' ? paradas : golesYo;
    const gano = modo==='tirar' ? golesYo>=3 : modo==='parar' ? paradas>=(nivel<=3?2:3) : golesYo>golesCPU;
    fin({gano, pts:(nivel-1)*10 + (modo==='tanda' ? Math.max(0, golesYo-golesCPU+5) : logro*2), txt: modo==='tirar'?`${golesYo} goles de 5`:modo==='parar'?`${paradas} paradas de 5`:`${golesYo} a ${golesCPU}`});
  };
  dibuja(); setTimeout(siguiente, 300);
  return {parar(){ vivo=false; }};
}

/* ============ 2 · Baloncesto 1 contra 1 ============ */
function depBaloncesto(z, {nivel}, fin){
  const L=lienzoDep(z, 400, 300), x=L.x; const marc=marcadorDep(z);
  const meta = nivel<=2 ? 7 : 11; let yo=0, cpu=0, turno='yo', fase='elegir', vivo=true, tipo=2;
  let ag=0, dir=1, msg='', col='#1F2937', balon=null;
  const vel = 0.9 + 0.18*(nivel-1);                      // velocidad de la aguja
  const ancho = () => Math.max(0.07, (tipo===3?0.16:0.24) - 0.012*(nivel-1));   // tamaño de la zona verde
  let centro=0.5;
  const dibuja = () => {
    x.clearRect(0,0,400,300); const g=x.createLinearGradient(0,0,0,300); g.addColorStop(0,'#F5D0A9'); g.addColorStop(1,'#D9A066'); x.fillStyle=g; x.fillRect(0,0,400,300);
    x.strokeStyle='#fff'; x.lineWidth=3; x.beginPath(); x.arc(200,40,150,0,Math.PI); x.stroke(); x.strokeRect(150,0,100,120);
    x.fillStyle='#fff'; x.fillRect(170,8,60,40); x.strokeStyle='#E5484D'; x.lineWidth=3; x.strokeRect(188,22,24,18);
    x.strokeStyle='#FF6B00'; x.lineWidth=4; x.beginPath(); x.ellipse(200,52,18,5,0,0,7); x.stroke();
    emoD(x, turno==='yo'?'🛡️':'🙋', turno==='yo'?250:150, 150, 40);
    emoD(x, turno==='yo'?'⛹️':'🧍', turno==='yo'?200:200, turno==='yo'?(tipo===3?235:195):100, 46);
    if(turno==='yo') txtD(x,'TÚ',200,(tipo===3?235:195)-34,12,'#1E7BF2'); else txtD(x,'TÚ',150,120,12,'#1E7BF2');
    if(balon) emoD(x,'🏀',balon.x,balon.y,24);
    if(fase==='apuntar' || fase==='tapon'){ rrect(x,40,268,320,20,10); x.fillStyle='#fff'; x.fill(); const a=ancho();
      x.fillStyle=fase==='tapon'?'#8B5CF6':'#18B47B'; rrect(x,40+320*(centro-a/2),268,320*a,20,6); x.fill();
      x.fillStyle='#1F2937'; x.fillRect(40+320*ag-3,262,6,32); }
    if(msg){ x.fillStyle='rgba(255,255,255,.9)'; rrect(x,90,120,220,40,14); x.fill(); txtD(x,msg,200,140,20,col); }
  };
  const pinta = () => marc(`<span>🧒 Tú: <b>${yo}</b></span><span>🤖 Máquina: <b>${cpu}</b></span><span>Gana el primero a <b>${meta}</b></span>`);
  let corta=null;
  const lanza = (entra, de, alFin) => { const t0=performance.now(); const ms=800; const paso=t=>{ if(!vivo) return; const k=Math.min(1,(t-t0)/ms);
      const fx=200+(entra?0:(Math.random()<.5?-1:1)*14*k), fy=52; balon={x:de.x+(fx-de.x)*k, y:de.y+(fy-de.y)*k - Math.sin(k*Math.PI)*90}; dibuja(); if(k<1) requestAnimationFrame(paso); else { balon=null; alFin(); } }; requestAnimationFrame(paso); };
  const turnoYo = () => { if(!vivo) return; turno='yo'; fase='elegir'; msg=''; dibuja(); pinta();
    botones.innerHTML=''; [['🏀 Tiro de 2',()=>empieza(2)],['🎯 Triple (3)',()=>empieza(3),'btn-verde']].forEach(([t,fn,c])=>{ const b=document.createElement('button'); b.type='button'; b.className='btn btn-xl '+(c||'btn-p'); b.textContent=t; b.onclick=fn; botones.appendChild(b); });
    decir('¡Te toca atacar! Elige tiro de dos o triple.'); };
  const empieza = t => { tipo=t; fase='apuntar'; centro=0.3+Math.random()*0.4; ag=0; dir=1; msg='¡Toca cuando esté en verde!'; col='#18B47B'; botones.innerHTML='<button type="button" class="btn btn-xl btn-p" id="bTirar">¡Tirar!</button>'; $('#bTirar',z).onclick=suelta; };
  const suelta = () => { if(fase!=='apuntar') return; fase='vuelo'; const a=ancho(); const entra=Math.abs(ag-centro)<=a/2; botones.innerHTML='';
    lanza(entra, {x:200,y:tipo===3?225:185}, ()=>{ if(entra){ yo+=tipo; msg=tipo===3?'¡TRIPLE!':'¡CANASTA!'; col='#18B47B'; sonido('bien'); decir(tipo===3?'¡Triple!':'¡Canasta!'); } else { msg='¡Fallo!'; col='#E5484D'; sonido('mal'); } dibuja(); pinta(); setTimeout(()=>{ if(yo>=meta||cpu>=meta) terminar(); else turnoCPU(); }, 1000); }); };
  const turnoCPU = () => { if(!vivo) return; turno='cpu'; tipo=Math.random()<0.3?3:2; fase='tapon'; centro=0.3+Math.random()*0.4; ag=0; dir=1; msg='¡Defiende! Toca en morado'; col='#8B5CF6'; dibuja();
    botones.innerHTML='<button type="button" class="btn btn-xl btn-verde" id="bTapon">✋ ¡Tapón!</button>'; let usado=false; $('#bTapon',z).onclick=()=>{ if(usado||fase!=='tapon') return; usado=true; resolverCPU(Math.abs(ag-centro)<=ancho()/2); };
    decir('¡Defiende!'); corta=setTimeout(()=>{ if(fase==='tapon' && !usado){ usado=true; resolverCPU(false); } }, 2600 - 120*(nivel-1)); };
  const resolverCPU = tapon => { clearTimeout(corta); fase='vuelo'; botones.innerHTML='';
    if(tapon){ msg='¡TAPÓN!'; col='#18B47B'; sonido('bien'); decir('¡Tapón!'); dibuja(); setTimeout(()=>{ if(vivo) turnoYo(); }, 1000); return; }
    const entra=Math.random() < Math.min(0.75, 0.35+0.05*(nivel-1)) * (tipo===3?0.75:1);
    lanza(entra, {x:200,y:100}, ()=>{ if(entra){ cpu+=tipo; msg='Canasta de la máquina'; col='#E5484D'; } else { msg='¡Ha fallado!'; col='#18B47B'; } dibuja(); pinta(); setTimeout(()=>{ if(yo>=meta||cpu>=meta) terminar(); else turnoYo(); }, 1000); }); };
  const terminar = () => { vivo=false; parada(); fin({gano: yo>cpu, pts:(nivel-1)*10 + Math.max(0, yo-cpu+meta), txt:`${yo} a ${cpu}`}); };
  const botones=document.createElement('div'); botones.className='dep-botones'; z.appendChild(botones);
  const parada = bucle(dt=>{ if(fase==='apuntar'||fase==='tapon'){ ag+=dir*vel*dt; if(ag>1){ ag=1; dir=-1; } if(ag<0){ ag=0; dir=1; } dibuja(); } });
  turnoYo();
  return {parar(){ vivo=false; parada(); clearTimeout(corta); }};
}

/* ============ 3 · Natación ============ */
function depNatacion(z, {nivel}, fin){
  const L=lienzoDep(z, 400, 300), x=L.x; const marc=marcadorDep(z);
  const metros = nivel<=3 ? 25 : 50; const largo=340; const meta = metros===50 ? largo*2 : largo;
  const rivales=[0,1,2].map(k=>({d:0, v:(28+6*nivel+Math.random()*8)*(0.85+0.08*k), emo:['🐬','🦭','🐢'][k], nom:['Delfín','Foca','Tortuga'][k]}));
  const yo={d:0, emo:'🏊'}; let ult=null, t=0, vivo=true, empezado=false, puestos=[];
  const dibuja = () => {
    x.fillStyle='#4FC3F7'; x.fillRect(0,0,400,300);
    for(let k=0;k<4;k++){ const y=30+k*65; x.fillStyle=k%2?'#29B6F6':'#4FC3F7'; x.fillRect(0,y-30,400,65); x.strokeStyle='#E53935'; x.setLineDash([8,6]); x.lineWidth=3; x.beginPath(); x.moveTo(0,y+35); x.lineTo(400,y+35); x.stroke(); x.setLineDash([]); }
    x.fillStyle='#1E3A8A'; x.fillRect(372,0,6,300); x.fillRect(22,0,6,300);
    const posX = d => { const v=d%(largo*2); return 30 + (v<=largo ? v : largo*2-v); };
    [yo, ...rivales].forEach((s,k)=>{ const y=30+k*65; const vuelta=Math.floor(s.d/largo)%2===1; x.save(); x.translate(posX(Math.min(s.d,meta)), y); if(!vuelta) x.scale(-1,1); emoD(x, s.emo, 0, 0, 34); x.restore(); if(k===0) txtD(x,'TÚ',posX(Math.min(s.d,meta)),y-24,11,'#1E3A8A'); });
    txtD(x, `${metros} m · ${t.toFixed(1)} s`, 200, 290, 14, '#fff');
  };
  const pinta = () => marc(`<span>Toca <b>izquierda</b> y <b>derecha</b>, una y otra vez</span><span>🏁 ${metros} metros</span>`);
  const brazada = lado => { if(!empezado || !vivo) return; const bien = ult!==lado; ult=lado; yo.d += bien ? 9 : 2.5; if(bien) sonido('toc'); if(yo.d>=meta && !puestos.includes('yo')) llega('yo'); };
  const llega = q => { puestos.push(q); if(q==='yo'){ const p=puestos.length; terminar(p); } };
  const terminar = puesto => { vivo=false; parada(); setTimeout(()=>fin({gano: puesto<=(nivel<=2?2:1), pts:(nivel-1)*10 + (5-puesto)*3, t:Math.round(t*10)/10, metros, txt:`Llegaste ${['1.º 🥇','2.º 🥈','3.º 🥉','4.º'][puesto-1]} en ${t.toFixed(1)} s`}), 500); };
  botonesDep(z, [['👈 Izquierda', ()=>brazada('i')], ['Derecha 👉', ()=>brazada('d')]]);
  const teclas = e => { if(actual!=='juego') return; if(e.key==='ArrowLeft') brazada('i'); if(e.key==='ArrowRight') brazada('d'); }; document.addEventListener('keydown', teclas);
  const parada = bucle(dt=>{ if(!empezado || !vivo) { dibuja(); return; } t+=dt; rivales.forEach((r,k)=>{ if(r.d<meta){ r.d+=r.v*dt*(0.9+0.2*Math.random()); if(r.d>=meta) puestos.push('r'+k); } }); dibuja(); });
  pinta(); dibuja();
  let cuenta=3; const cd=setInterval(()=>{ if(!vivo){ clearInterval(cd); return; } if(cuenta>0){ decir(String(cuenta)); cuenta--; } else { clearInterval(cd); empezado=true; decir('¡Ya!'); sonido('bien'); } }, 800);
  return {parar(){ vivo=false; parada(); clearInterval(cd); document.removeEventListener('keydown', teclas); }};
}

/* ============ 4 · Béisbol (batear o lanzar) ============ */
function depBeisbol(z, {nivel, modo}, fin){
  const L=lienzoDep(z, 400, 300), x=L.x; const marc=marcadorDep(z);
  let carreras=0, outs=0, strikes=0, bolas=0, lanz=0, vivo=true, fase='espera', msg='', col='#1F2937', bola=null, cursor={x:200,y:190,vx:1,vy:1}, t0=0, dur=0;
  const ZONA={x:170,y:160,w:60,h:70};
  const dibuja = () => {
    x.fillStyle='#4CAF50'; x.fillRect(0,0,400,300); x.fillStyle='#C68B59'; x.beginPath(); x.moveTo(200,40); x.lineTo(330,170); x.lineTo(200,295); x.lineTo(70,170); x.closePath(); x.fill();
    x.fillStyle='#fff'; [[200,40],[330,170],[70,170]].forEach(([a,b])=>{ x.fillRect(a-6,b-6,12,12); }); x.beginPath(); x.moveTo(190,280); x.lineTo(210,280); x.lineTo(210,288); x.lineTo(200,295); x.lineTo(190,288); x.fill();
    x.fillStyle='#B07445'; x.beginPath(); x.arc(200,130,16,0,7); x.fill();
    emoD(x, modo==='lanzar'?'🧢':'🤖', 200, 112, 32); if(modo==='lanzar') txtD(x,'TÚ',200,86,11,'#1E7BF2');
    emoD(x, '🏏', modo==='batear'?236:236, 250, 34); emoD(x, modo==='batear'?'🧒':'🤖', 252, 262, 30); if(modo==='batear') txtD(x,'TÚ',262,236,11,'#1E7BF2');
    x.strokeStyle='rgba(255,255,255,.8)'; x.lineWidth=2; x.setLineDash([4,4]); x.strokeRect(ZONA.x,ZONA.y,ZONA.w,ZONA.h); x.setLineDash([]);
    if(modo==='batear'){ x.fillStyle='rgba(255,235,59,.35)'; x.fillRect(150,236,100,30); txtD(x,'¡Aquí!',200,272,10,'#fff',800); }
    if(fase==='apuntar'){ x.strokeStyle='#E5484D'; x.lineWidth=3; x.beginPath(); x.arc(cursor.x,cursor.y,10,0,7); x.stroke(); x.beginPath(); x.moveTo(cursor.x-15,cursor.y); x.lineTo(cursor.x+15,cursor.y); x.moveTo(cursor.x,cursor.y-15); x.lineTo(cursor.x,cursor.y+15); x.stroke(); }
    if(bola) emoD(x,'⚾',bola.x,bola.y,bola.s||18);
    if(msg){ x.fillStyle='rgba(255,255,255,.9)'; rrect(x,100,10,200,34,12); x.fill(); txtD(x,msg,200,27,18,col); }
  };
  const pinta = () => marc(modo==='batear' ? `<span>🏃 Carreras: <b>${carreras}</b></span><span>❌ Strikes: <b>${strikes}</b></span><span>🔴 Outs: <b>${outs}</b> de 3</span>`
                                        : `<span>🔴 Outs: <b>${outs}</b> de 3</span><span>🤖 Carreras de la máquina: <b>${carreras}</b> de 3</span><span>⚪ Bolas: <b>${bolas}</b></span>`);
  const botones=document.createElement('div'); botones.className='dep-botones'; z.appendChild(botones);
  // --- batear ---
  const lanzamiento = () => { if(!vivo) return; fase='vuelo'; msg=''; lanz++; t0=performance.now(); dur=Math.max(520, 1300-80*(nivel-1)) * (nivel>=4 && Math.random()<0.3 ? 1.35 : 1); bola={x:200,y:130,s:12}; sonido('toc'); };
  const batear = () => { if(fase!=='vuelo') return; const k=(performance.now()-t0)/dur; const err=Math.abs(k-0.86);
    const ventana = Math.max(0.05, 0.13-0.01*(nivel-1));
    if(err<=ventana*0.45){ resultado('¡HOME RUN!', 4); } else if(err<=ventana){ resultado('¡Buen golpe! Carrera', 1); } else if(err<=ventana*1.8){ resultado('Foul', 0, true); } else { resultado('Strike', -1); } };
  const resultado = (t, c, foul) => { fase='res'; if(c>0){ carreras+=c; col='#18B47B'; sonido('bien'); decir(c===4?'¡Home run!':'¡Buen golpe!'); const o={...bola}; const t1=performance.now(); const vuela=tt=>{ const k=Math.min(1,(tt-t1)/700); bola={x:o.x+(c===4?-160:-90)*k, y:o.y-(c===4?240:150)*k, s:18-8*k}; dibuja(); if(k<1 && vivo) requestAnimationFrame(vuela); }; requestAnimationFrame(vuela); }
    else if(c<0){ strikes++; col='#E5484D'; sonido('mal'); if(strikes>=3){ outs++; strikes=0; t='¡Strike 3! Out'; } }
    else { col='#F59E0B'; if(strikes<2) strikes++; }
    msg=t; pinta(); setTimeout(()=>{ bola=null; if(outs>=3 || lanz>=10) acabar(); else siguienteB(); }, 1100); };
  const siguienteB = () => { fase='espera'; msg='Prepárate…'; col='#1F2937'; dibuja(); setTimeout(()=>{ if(vivo) lanzamiento(); }, 700+Math.random()*700); };
  // --- lanzar ---
  const siguienteL = () => { if(!vivo) return; fase='apuntar'; msg='Toca «¡Lanzar!» cuando la diana esté bien'; col='#1E7BF2'; cursor={x:ZONA.x+ZONA.w/2, y:ZONA.y+ZONA.h/2, vx:(1.4+0.2*nivel)*(Math.random()<.5?-1:1), vy:(1.1+0.2*nivel)*(Math.random()<.5?-1:1)}; dibuja(); };
  const lanzar = () => { if(fase!=='apuntar') return; fase='vuelo'; const c={...cursor}; const t1=performance.now(); const ms=600;
    const paso=tt=>{ const k=Math.min(1,(tt-t1)/ms); bola={x:200+(c.x-200)*k, y:130+(c.y-130)*k, s:12+8*k}; dibuja(); if(k<1 && vivo) requestAnimationFrame(paso); else if(vivo) resolverL(c); }; requestAnimationFrame(paso); };
  const resolverL = c => { const dentro=c.x>=ZONA.x && c.x<=ZONA.x+ZONA.w && c.y>=ZONA.y && c.y<=ZONA.y+ZONA.h;
    if(!dentro){ bolas++; msg='Bola (fuera)'; col='#F59E0B'; sonido('mal'); if(bolas>=4){ bolas=0; carreras++; msg='4 bolas: ¡pasa a base!'; } }
    else { const dx=Math.abs(c.x-(ZONA.x+ZONA.w/2))/(ZONA.w/2), dy=Math.abs(c.y-(ZONA.y+ZONA.h/2))/(ZONA.h/2); const esquina=Math.max(dx,dy);
      const pBatea=Math.min(0.8, (0.55-0.4*esquina) + 0.04*(nivel-1));
      if(Math.random()<pBatea){ carreras++; msg='¡Ha bateado! Carrera'; col='#E5484D'; sonido('mal'); } else { strikes++; msg=strikes>=3?'¡Strike 3! Out':'¡Strike!'; col='#18B47B'; sonido('bien'); if(strikes>=3){ outs++; strikes=0; decir('¡Out!'); } } }
    pinta(); setTimeout(()=>{ bola=null; if(outs>=3 || carreras>=3) acabar(); else siguienteL(); }, 1100); };
  const acabar = () => { vivo=false; parada();
    if(modo==='batear') fin({gano: carreras>=Math.min(6, 2+Math.floor(nivel/2)), pts:(nivel-1)*10+carreras, txt:`${carreras} carreras`});
    else fin({gano: outs>=3 && carreras<3, pts:(nivel-1)*10 + outs*3 - carreras, txt:`${outs} outs y ${carreras} carreras de la máquina`}); };
  const parada = bucle(dt=>{
    if(modo==='batear' && fase==='vuelo'){ const k=(performance.now()-t0)/dur; bola={x:200+40*k, y:130+130*k, s:12+10*k}; if(k>=1.05){ resultado('Strike', -1); } }
    if(modo==='lanzar' && fase==='apuntar'){ cursor.x+=cursor.vx*dt*60; cursor.y+=cursor.vy*dt*60; if(cursor.x<ZONA.x-25||cursor.x>ZONA.x+ZONA.w+25) cursor.vx*=-1; if(cursor.y<ZONA.y-25||cursor.y>ZONA.y+ZONA.h+25) cursor.vy*=-1; }
    dibuja(); });
  if(modo==='batear'){ const b=document.createElement('button'); b.type='button'; b.className='btn btn-xl btn-p'; b.textContent='🏏 ¡Batear!'; b.addEventListener('pointerdown', e=>{ e.preventDefault(); batear(); }); botones.appendChild(b); L.cv.addEventListener('pointerdown', e=>{ e.preventDefault(); batear(); }); pinta(); siguienteB(); decir('Toca batear cuando la pelota llegue a la zona amarilla.'); }
  else { const b=document.createElement('button'); b.type='button'; b.className='btn btn-xl btn-p'; b.textContent='⚾ ¡Lanzar!'; b.addEventListener('pointerdown', e=>{ e.preventDefault(); lanzar(); }); botones.appendChild(b); L.cv.addEventListener('pointerdown', e=>{ e.preventDefault(); lanzar(); }); pinta(); siguienteL(); decir('Lanza a las esquinas del recuadro: es más difícil batear.'); }
  return {parar(){ vivo=false; parada(); }};
}

/* ============ 5 · Golf (minigolf) ============ */
const HOYOS = [
  {par:2, ini:[60,240], hoyo:[330,70], muros:[]},
  {par:2, ini:[60,250], hoyo:[340,60], muros:[[180,100,20,200]]},
  {par:3, ini:[50,150], hoyo:[350,150], muros:[[150,0,20,190],[240,110,20,190]]},
  {par:3, ini:[60,260], hoyo:[340,50], muros:[[120,120,180,18],[220,200,18,100]], agua:[[260,30,60,50]]},
  {par:3, ini:[50,50], hoyo:[350,250], muros:[[100,80,200,18],[100,200,200,18]], mueve:true},
  {par:4, ini:[40,260], hoyo:[360,40], muros:[[90,0,18,220],[180,80,18,220],[270,0,18,220]], mueve:true}
];
function depGolf(z, {nivel}, fin){
  const L=lienzoDep(z, 400, 300), x=L.x; const marc=marcadorDep(z);
  const H=HOYOS[Math.min(HOYOS.length-1, nivel-1)]; let b={x:H.ini[0], y:H.ini[1], vx:0, vy:0}; let golpes=0, fase='angulo', ang=0, dirA=1, pot=0, dirP=1, msg='', vivo=true, tm=0;
  const muros = () => H.muros.map((m,k)=> H.mueve && k===0 ? [m[0]+Math.sin(tm*1.6)*40, m[1], m[2], m[3]] : m);
  const dibuja = () => {
    x.fillStyle='#2E7D32'; x.fillRect(0,0,400,300); x.fillStyle='#43A047'; rrect(x,10,10,380,280,24); x.fill();
    (H.agua||[]).forEach(a=>{ x.fillStyle='#4FC3F7'; rrect(x,a[0],a[1],a[2],a[3],14); x.fill(); });
    muros().forEach(m=>{ x.fillStyle='#8D6E63'; rrect(x,m[0],m[1],m[2],m[3],5); x.fill(); });
    x.fillStyle='#1B5E20'; x.beginPath(); x.arc(H.hoyo[0],H.hoyo[1],11,0,7); x.fill(); emoD(x,'⛳',H.hoyo[0]+8,H.hoyo[1]-18,26);
    x.fillStyle='#fff'; x.beginPath(); x.arc(b.x,b.y,7,0,7); x.fill(); x.strokeStyle='#ccc'; x.lineWidth=1; x.stroke();
    if(fase==='angulo' || fase==='fuerza'){ const l=fase==='fuerza'?30+pot*60:60; x.strokeStyle='#FFEB3B'; x.lineWidth=4; x.setLineDash([6,5]); x.beginPath(); x.moveTo(b.x,b.y); x.lineTo(b.x+Math.cos(ang)*l, b.y+Math.sin(ang)*l); x.stroke(); x.setLineDash([]); }
    if(fase==='fuerza'){ rrect(x,20,272,160,14,7); x.fillStyle='#fff'; x.fill(); x.fillStyle=pot>0.75?'#E5484D':pot>0.4?'#F59E0B':'#18B47B'; rrect(x,20,272,160*pot,14,7); x.fill(); }
    if(msg){ x.fillStyle='rgba(255,255,255,.9)'; rrect(x,110,130,180,36,12); x.fill(); txtD(x,msg,200,148,18,'#1F2937'); }
  };
  const pinta = () => marc(`<span>⛳ Hoyo de la fase ${nivel} · par <b>${H.par}</b></span><span>Golpes: <b>${golpes}</b></span><span>${fase==='angulo'?'1.º toca para elegir hacia dónde':fase==='fuerza'?'2.º toca para elegir la fuerza':''}</span>`);
  const toca = () => { if(fase==='angulo'){ fase='fuerza'; pot=0; dirP=1; pinta(); } else if(fase==='fuerza'){ fase='rueda'; golpes++; const v=3+pot*9; b.vx=Math.cos(ang)*v; b.vy=Math.sin(ang)*v; sonido('toc'); pinta(); } };
  L.cv.addEventListener('pointerdown', e=>{ e.preventDefault(); toca(); });
  botonesDep(z, [['⛳ ¡Toca!', toca]]);
  const angIni = () => Math.atan2(H.hoyo[1]-b.y, H.hoyo[0]-b.x);
  let base=angIni();
  const parada = bucle(dt=>{ tm+=dt;
    if(fase==='angulo'){ ang+=dirA*dt*(0.9+0.12*nivel); if(ang>base+1.2) dirA=-1; if(ang<base-1.2) dirA=1; }
    if(fase==='fuerza'){ pot+=dirP*dt*(0.8+0.1*nivel); if(pot>1){ pot=1; dirP=-1; } if(pot<0){ pot=0; dirP=1; } }
    if(fase==='rueda'){ const pasos=4; for(let s=0;s<pasos;s++){ b.x+=b.vx/pasos; b.y+=b.vy/pasos;
        if(b.x<17||b.x>383){ b.vx*=-0.8; b.x=Math.max(17,Math.min(383,b.x)); } if(b.y<17||b.y>283){ b.vy*=-0.8; b.y=Math.max(17,Math.min(283,b.y)); }
        muros().forEach(m=>{ if(b.x>m[0]-7 && b.x<m[0]+m[2]+7 && b.y>m[1]-7 && b.y<m[1]+m[3]+7){ const dl=b.x-(m[0]-7), dr=m[0]+m[2]+7-b.x, du=b.y-(m[1]-7), dd=m[1]+m[3]+7-b.y; const mn=Math.min(dl,dr,du,dd);
          if(mn===dl){ b.x=m[0]-7; b.vx=-Math.abs(b.vx)*0.8; } else if(mn===dr){ b.x=m[0]+m[2]+7; b.vx=Math.abs(b.vx)*0.8; } else if(mn===du){ b.y=m[1]-7; b.vy=-Math.abs(b.vy)*0.8; } else { b.y=m[1]+m[3]+7; b.vy=Math.abs(b.vy)*0.8; } } }); }
      b.vx*=0.975; b.vy*=0.975; const v=Math.hypot(b.vx,b.vy); const dh=Math.hypot(b.x-H.hoyo[0], b.y-H.hoyo[1]);
      (H.agua||[]).forEach(a=>{ if(b.x>a[0]&&b.x<a[0]+a[2]&&b.y>a[1]&&b.y<a[1]+a[3]){ b={x:H.ini[0],y:H.ini[1],vx:0,vy:0}; golpes++; msg='¡Al agua! +1'; sonido('mal'); setTimeout(()=>{ msg=''; },900); } });
      if(dh<11 && v<6){ fase='dentro'; b.x=H.hoyo[0]; b.y=H.hoyo[1]; sonido('bien'); const dif=golpes-H.par; msg=golpes===1?'¡HOYO EN UNO!':dif<0?'¡Bajo par!':dif===0?'¡Par!':'¡Dentro!'; decir(msg.replace(/[¡!]/g,'')); dibuja(); setTimeout(()=>{ vivo=false; parada(); fin({gano: golpes<=H.par+1, pts:(nivel-1)*10 + Math.max(0, H.par+4-golpes)*2, txt:`${golpes} ${golpes===1?'golpe':'golpes'} (par ${H.par})`}); }, 1300); }
      else if(v<0.15){ b.vx=0; b.vy=0; if(golpes>=H.par+4){ fase='dentro'; vivo=false; parada(); fin({gano:false, pts:(nivel-1)*10, txt:`${golpes} golpes sin meterla`}); return; } fase='angulo'; base=angIni(); ang=base; pinta(); } }
    dibuja(); });
  ang=base; pinta(); decir('Primero elige hacia dónde. Luego, la fuerza.');
  return {parar(){ vivo=false; parada(); }};
}

/* ============ 6 · Bolos ============ */
function depBolos(z, {nivel}, fin){
  const L=lienzoDep(z, 400, 300), x=L.x; const marc=marcadorDep(z);
  const RONDAS=5; let ronda=1, tiro=1, total=0, fase='pos', bx=200, dirX=1, efe=0, dirE=1, bola=null, vivo=true, msg='';
  const nuevos = () => { const p=[]; [[0],[-1,1],[-2,0,2],[-3,-1,1,3]].forEach((fila,r)=>fila.forEach(c=>p.push({x:200+c*13, y:70-r*14, de:false}))); return p; };
  let bolos=nuevos();
  const dibuja = () => { x.fillStyle='#5D4037'; x.fillRect(0,0,400,300); x.fillStyle='#F3D9A4'; x.fillRect(130,0,140,300); x.fillStyle='#E0C08A'; for(let k=0;k<7;k++) x.fillRect(130+k*20,0,2,300);
    x.fillStyle='#424242'; x.fillRect(118,0,12,300); x.fillRect(270,0,12,300);
    bolos.forEach(p=>{ if(!p.de){ x.fillStyle='#fff'; x.beginPath(); x.ellipse(p.x,p.y,5,8,0,0,7); x.fill(); x.fillStyle='#E5484D'; x.fillRect(p.x-5,p.y-3,10,2); } else { x.fillStyle='rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(p.x,p.y,8,4,0.6,0,7); x.fill(); } });
    const by = bola ? bola.y : 270; const bxx = bola ? bola.x : bx; x.fillStyle='#1E3A8A'; x.beginPath(); x.arc(bxx,by,11,0,7); x.fill(); x.fillStyle='#93C5FD'; x.beginPath(); x.arc(bxx-3,by-4,3,0,7); x.fill();
    if(fase==='efecto'){ x.strokeStyle='#FFEB3B'; x.lineWidth=3; x.setLineDash([6,5]); x.beginPath(); x.moveTo(bx,265); x.lineTo(bx+efe*70, 120); x.stroke(); x.setLineDash([]); }
    if(msg){ x.fillStyle='rgba(255,255,255,.92)'; rrect(x,110,130,180,36,12); x.fill(); txtD(x,msg,200,148,18,'#1F2937'); } };
  const pinta = () => marc(`<span>🎳 Ronda <b>${ronda}</b> de ${RONDAS} · tiro ${tiro}</span><span>Bolos: <b>${total}</b></span><span>${fase==='pos'?'1.º toca para elegir la posición':fase==='efecto'?'2.º toca para elegir la dirección':''}</span>`);
  const toca = () => { if(fase==='pos'){ fase='efecto'; efe=0; pinta(); } else if(fase==='efecto'){ fase='rueda'; bola={x:bx, y:265, vx:efe*1.6, vy:-6}; sonido('toc'); pinta(); } };
  L.cv.addEventListener('pointerdown', e=>{ e.preventDefault(); toca(); }); botonesDep(z, [['🎳 ¡Toca!', toca]]);
  const tras = () => { const tirados=bolos.filter(p=>p.de && !p.contado); tirados.forEach(p=>p.contado=true); total+=tirados.length; const quedan=bolos.filter(p=>!p.de).length;
    msg = quedan===0 ? (tiro===1?'¡PLENO!':'¡SEMIPLENO!') : `${tirados.length} ${tirados.length===1?'bolo':'bolos'}`; if(quedan===0){ sonido('bien'); decir(tiro===1?'¡Pleno!':'¡Semipleno!'); total+= tiro===1?5:2; }
    pinta(); setTimeout(()=>{ msg=''; bola=null;
      if(tiro===1 && quedan>0){ tiro=2; } else { ronda++; tiro=1; bolos=nuevos(); }
      if(ronda>RONDAS){ vivo=false; parada(); fin({gano: total>=Math.min(45, 18+4*(nivel-1)), pts:(nivel-1)*10 + total, txt:`${total} puntos`}); return; }
      fase='pos'; pinta(); }, 1200); };
  const parada = bucle(dt=>{ const vel=(1+0.25*(nivel-1));
    if(fase==='pos'){ bx+=dirX*dt*90*vel; if(bx>255){ bx=255; dirX=-1; } if(bx<145){ bx=145; dirX=1; } }
    if(fase==='efecto'){ efe+=dirE*dt*1.4*vel; if(efe>1){ efe=1; dirE=-1; } if(efe<-1){ efe=-1; dirE=1; } }
    if(fase==='rueda' && bola){ bola.x+=bola.vx; bola.y+=bola.vy; if(bola.x<140||bola.x>260){ bola.vx=0; bola.x=Math.max(124,Math.min(276,bola.x)); }
      bolos.forEach(p=>{ if(!p.de && Math.hypot(p.x-bola.x,p.y-bola.y)<16){ p.de=true; p.vx=(p.x-bola.x)*0.2+(Math.random()-.5); p.vy=-2; } });
      bolos.forEach(p=>{ if(p.de && p.vx!=null && !p.quieto){ p.x+=p.vx; p.y+=p.vy; p.vx*=0.9; p.vy*=0.9; bolos.forEach(q=>{ if(!q.de && Math.hypot(q.x-p.x,q.y-p.y)<13){ q.de=true; q.vx=(q.x-p.x)*0.25; q.vy=-1.5; } }); if(Math.hypot(p.vx,p.vy)<0.2) p.quieto=true; } });
      if(bola.y<-20){ fase='res'; setTimeout(tras, 600); } }
    dibuja(); });
  pinta(); decir('Toca para elegir dónde tiras y luego hacia dónde.');
  return {parar(){ vivo=false; parada(); }};
}

/* ============ 7 · Tiro con arco ============ */
function depArco(z, {nivel}, fin){
  const L=lienzoDep(z, 400, 300), x=L.x; const marc=marcadorDep(z);
  const N=5; let fl=0, total=0, vivo=true, t=0, fase='apuntar', marcas=[], msg='';
  const diana = () => ({x:200 + (nivel>=3 ? Math.sin(t*(0.6+0.15*nivel))*70 : 0), y:120 + (nivel>=5 ? Math.cos(t*0.9)*25 : 0)});
  const mira = () => { const a=8+5*nivel; return {x:200+Math.sin(t*1.7)*a+Math.sin(t*3.1)*a*0.4, y:120+Math.cos(t*1.3)*a*0.8+Math.sin(t*2.3)*a*0.3}; };
  const anillos=[[60,'#FFFFFF',1],[50,'#FFFFFF',2],[40,'#1F2937',3],[32,'#1F2937',4],[25,'#1E7BF2',5],[19,'#1E7BF2',6],[14,'#E5484D',7],[10,'#E5484D',8],[6,'#FFD54F',9],[3,'#FFD54F',10]];
  const dibuja = () => { x.fillStyle='#A5D6A7'; x.fillRect(0,0,400,300); x.fillStyle='#81C784'; x.fillRect(0,200,400,100);
    const d=diana(); x.fillStyle='#8D6E63'; x.fillRect(d.x-4,d.y+55,8,80); anillos.forEach(([r,c])=>{ x.fillStyle=c; x.beginPath(); x.arc(d.x,d.y,r,0,7); x.fill(); x.strokeStyle='rgba(0,0,0,.25)'; x.lineWidth=1; x.stroke(); });
    marcas.forEach(m=>{ emoD(x,'📍',d.x+m.dx,d.y+m.dy-8,16); });
    if(fase==='apuntar'){ const m=mira(); x.strokeStyle='#E5484D'; x.lineWidth=2; x.beginPath(); x.arc(m.x,m.y,12,0,7); x.moveTo(m.x-18,m.y); x.lineTo(m.x+18,m.y); x.moveTo(m.x,m.y-18); x.lineTo(m.x,m.y+18); x.stroke(); }
    emoD(x,'🏹',200,270,40);
    if(msg){ x.fillStyle='rgba(255,255,255,.92)'; rrect(x,130,10,140,34,12); x.fill(); txtD(x,msg,200,27,18,'#1F2937'); } };
  const pinta = () => marc(`<span>🎯 Flecha <b>${Math.min(fl+1,N)}</b> de ${N}</span><span>Puntos: <b>${total}</b></span><span>Necesitas <b>${meta}</b></span>`);
  const meta = Math.min(40, 20 + 3*(nivel-1));
  const tira = () => { if(fase!=='apuntar') return; fase='vuelo'; const m=mira(), d=diana(); const dist=Math.hypot(m.x-d.x, m.y-d.y);
    const p = anillos.slice().reverse().find(([r])=>dist<=r); const pts=p?p[2]:0; total+=pts; fl++; if(dist<=60) marcas.push({dx:m.x-d.x, dy:m.y-d.y});
    msg = pts===10?'¡DIANA! 10':pts?`${pts} ${pts===1?'punto':'puntos'}`:'¡Fuera!'; sonido(pts>=7?'bien':pts?'toc':'mal'); if(pts===10) decir('¡Diana!');
    pinta(); setTimeout(()=>{ msg=''; if(fl>=N){ vivo=false; parada(); fin({gano: total>=meta, pts:(nivel-1)*10 + total, txt:`${total} puntos`}); } else fase='apuntar'; }, 900); };
  L.cv.addEventListener('pointerdown', e=>{ e.preventDefault(); tira(); }); botonesDep(z, [['🏹 ¡Disparar!', tira]]);
  const parada = bucle(dt=>{ t+=dt; dibuja(); });
  pinta(); decir('Toca para disparar cuando la mira esté en el centro.');
  return {parar(){ vivo=false; parada(); }};
}

/* =============== catálogo, fases y récords =============== */
const DEPORTES = [
  {id:'penaltis', nombre:'Penaltis', emo:'⚽', desc:'Tira, para… ¡o una tanda contra la máquina!', est:0, fn:depPenaltis, modos:[['tirar','⚽ Tirar'],['parar','🧤 Parar'],['tanda','⚽🧤 Tanda']]},
  {id:'baloncesto', nombre:'Baloncesto 1 contra 1', emo:'🏀', desc:'Tira cuando esté en verde y pon tapones.', est:8, fn:depBaloncesto},
  {id:'natacion', nombre:'Natación', emo:'🏊', desc:'Izquierda, derecha… ¡a por la medalla!', est:18, fn:depNatacion},
  {id:'beisbol', nombre:'Béisbol', emo:'⚾', desc:'Batea en el momento justo o lanza a las esquinas.', est:30, fn:depBeisbol, modos:[['batear','🏏 Batear'],['lanzar','⚾ Lanzar']]},
  {id:'arco', nombre:'Tiro con arco', emo:'🎯', desc:'Dispara cuando la mira esté en el centro.', est:45, fn:depArco},
  {id:'bolos', nombre:'Bolos', emo:'🎳', desc:'Elige posición y dirección… ¡pleno!', est:60, fn:depBolos},
  {id:'golf', nombre:'Minigolf', emo:'⛳', desc:'Elige hacia dónde y con qué fuerza.', est:80, fn:depGolf}
];
const depLog = (p=perfil()) => cfgDe(p).deporteLog || [];
const claveDep = (id, modo) => modo ? id+'_'+modo : id;
function faseMaxDep(j, p=perfil()){ const g=depLog(p).filter(x=>x.j===j && x.gano).map(x=>+x.nivel||1); return Math.min(10, (g.length?Math.max(...g):0)+1); }
function recordDep(j, nivel, p=perfil()){ const xs=depLog(p).filter(x=>x.j===j && (!nivel || +x.nivel===nivel)); return xs.length ? Math.max(...xs.map(x=>+x.pts||0)) : null; }
const estrellasTotales = (p=perfil()) => (typeof estrellasDe==='function' ? estrellasDe(p) : 0);
const deporteAbierto = (d, p=perfil()) => p.prueba || estrellasTotales(p) >= d.est;
function apuntarDep(j, r, nivel){ try{ const c=cfgDe(perfil()); c.deporteLog=(c.deporteLog||[]).concat([{f:new Date().toISOString(), j, nivel, pts:r.pts, gano:!!r.gano, ...(r.t!=null?{t:r.t, m:r.metros}:{})}]).slice(-1500); guardarAj(); }catch(e){}
  if(typeof apuntarJuego==='function') apuntarJuego('dep_'+j, {a:r.gano?1:0, e:r.gano?0:1, pts:r.pts}); }

definir('deportes', {nav:'juegos', pintar(){
  const p=perfil(), est=estrellasTotales(p), pj=typeof puedeJugar==='function'?puedeJugar(p):{ok:true};
  $('#s-deportes').innerHTML = `<button class="volver" type="button" data-ir="juegos">${ic('atras')} Juegos</button>
  <div class="album-cab"><div><h1 class="tit">🏆 Deportes</h1><p class="sub">Minijuegos muy fáciles: cada fase superada abre otra más difícil. ¡Bate tus récords! Se abren nuevos deportes con las ⭐.</p></div><div class="contador">⭐<div><b>${est}</b><br><span>estrellas</span></div></div></div>
  ${pj.ok?'':`<div class="card aviso-juego"><span class="emo-g">${pj.por==='leer'?'📖':'🌙'}</span><div><b>${pj.por==='leer'?'Primero, la lectura de hoy':'Hoy ya has jugado tu rato'}</b><span class="nota">${pj.por==='leer'?'Cuando leas una historia hoy, podrás jugar.':'¡Mañana más!'}</span></div></div>`}
  <div class="juegos-grid">${DEPORTES.map(d=>{ const ab=deporteAbierto(d,p); const fases=(d.modos||[[null]]).map(([m])=>faseMaxDep(claveDep(d.id,m),p)); const rec=Math.max(-1,...(d.modos||[[null]]).map(([m])=>recordDep(claveDep(d.id,m),null,p)??-1));
    return ab ? `<button type="button" class="juego-c dep-c" data-dep="${d.id}" ${pj.ok?'':'disabled'}><span class="emo-j">${d.emo}</span><b>${esc(d.nombre)}</b><span class="nota">${esc(d.desc)}</span><span class="pill">Fase ${Math.max(...fases)}${rec>=0?` · récord ${rec}`:''}</span></button>`
              : `<div class="juego-c bloq"><span class="emo-j">🔒</span><b>${esc(d.nombre)}</b><span class="nota">Se abre con ${d.est} ⭐ (te faltan ${d.est-est})</span></div>`; }).join('')}</div>`;
  $$('#s-deportes [data-dep]').forEach(b=>b.onclick=()=>ir('juego', 'dep:'+b.dataset.dep));
}});
/* el juego dentro de la pantalla «juego» (así cuenta el tiempo de juego del día) */
function deporteJuego(z, d){
  let vivoJ=null, modo=null;
  const elegirModo = () => { if(!d.modos){ elegirFase(); return; }
    z.innerHTML=`<div class="card dep-modo"><h2>${d.emo} ¿Cómo quieres jugar?</h2><div class="botones">${d.modos.map(([m,t])=>`<button type="button" class="btn btn-xl btn-p" data-m="${m}">${t}</button>`).join('')}</div></div>`;
    $$('[data-m]', z).forEach(b=>b.onclick=()=>{ modo=b.dataset.m; elegirFase(); }); decir('¿Cómo quieres jugar?'); };
  const elegirFase = (fx) => { const j=claveDep(d.id, modo); const max=faseMaxDep(j); const nivel=fx||max;
    const rec=recordDep(j); z.innerHTML=`<div class="card dep-modo"><h2>${d.emo} Fase ${nivel}</h2><p class="sub">${nivel===1?'¡La más fácil! Para empezar.':nivel===max?'¡Tu fase más difícil hasta ahora!':'Una fase que ya superaste.'}</p>${rec!=null?`<p class="nota">🏅 Tu récord: <b>${rec}</b> puntos</p>`:''}
      <div class="fases">${Array.from({length:max},(_,k)=>`<button type="button" class="fase${k+1===nivel?' sel':''}" data-f="${k+1}">${k+1}</button>`).join('')}${max<10?`<span class="fase bloq">🔒</span>`:''}</div>
      <div class="botones"><button type="button" class="btn btn-xl btn-verde" id="depYa">▶ ¡A jugar!</button>${d.modos?'<button type="button" class="btn" id="depModo">Cambiar de modo</button>':''}</div></div>`;
    $$('[data-f]', z).forEach(b=>b.onclick=()=>elegirFase(+b.dataset.f)); const cm=$('#depModo', z); if(cm) cm.onclick=()=>{ modo=null; elegirModo(); };
    $('#depYa', z).onclick=()=>jugar(nivel); };
  const jugar = nivel => { z.innerHTML=''; const j=claveDep(d.id, modo); const recAntes=recordDep(j);
    vivoJ=d.fn(z, {nivel, modo}, r=>{ apuntarDep(j, r, nivel); const max=faseMaxDep(j); const nueva = r.gano && max>nivel;
      const recTxt = recAntes==null ? '' : r.pts>recAntes ? `<p class="record">🏅 ¡NUEVO RÉCORD! ${r.pts} puntos</p>` : recAntes===r.pts ? `<p class="nota">🏅 ¡Igualas tu récord (${recAntes})! Un poco más y lo batirás.</p>` : recAntes-r.pts<=Math.max(2, Math.round(recAntes*0.1)) ? `<p class="nota">🏅 ¡A solo ${recAntes-r.pts} ${recAntes-r.pts===1?'punto':'puntos'} de tu récord (${recAntes})!</p>` : `<p class="nota">🏅 Tu récord: ${recAntes} puntos.</p>`;
      const cart=document.createElement('div'); cart.className='cartel-juego'; cart.innerHTML=`<div><span class="emo-g">${r.gano?'🏆':'💪'}</span><h2>${r.gano?(nueva?`¡Fase ${nivel} superada!`:'¡Muy bien!'):'¡Casi!'}</h2><p class="sub">${esc(r.txt||'')} · ${r.pts} puntos</p>${recTxt}${r.gano&&nueva?`<p class="nota">Se abre la fase ${nivel+1}: un poco más difícil.</p>`:!r.gano?'<p class="nota">¡Inténtalo otra vez, seguro que lo consigues!</p>':''}<div class="botones"></div></div>`;
      const bs=cart.querySelector('.botones'); const bt=(t,fn,cls)=>{ const b=document.createElement('button'); b.type='button'; b.className='btn btn-g '+cls; b.textContent=t; b.onclick=fn; bs.appendChild(b); };
      if(nueva) bt(`▶ Fase ${nivel+1}`, ()=>jugar(nivel+1), 'btn-verde'); bt('🔁 Otra vez', ()=>jugar(nivel), nueva?'btn':'btn-p'); bt('Elegir fase', ()=>elegirFase(nivel), 'btn');
      z.style.position='relative'; z.appendChild(cart); if(r.gano){ sonido('cromo'); confeti(cart.firstElementChild); }
      decir(r.pts>(recAntes??Infinity) ? `¡Nuevo récord! ${r.pts} puntos.` : r.gano ? (nueva?`¡Fase ${nivel} superada!`:'¡Muy bien!') : '¡Casi! Inténtalo otra vez.'); });
  };
  elegirModo();
  return {parar(){ if(vivoJ){ try{ vivoJ.parar(); }catch(e){} } }};
}
function deportesHTML(){ const p=perfil(), est=estrellasTotales(p); const n=DEPORTES.filter(d=>deporteAbierto(d,p)).length; const sig=DEPORTES.find(d=>!deporteAbierto(d,p));
  return `<button class="acceso deportes-c" type="button" data-ir="deportes"><span class="emo-g">🏆</span><span><b>Deportes</b><span class="nota">Penaltis, baloncesto, natación… ${n} de ${DEPORTES.length} abiertos.${sig?` ${sig.nombre}: con ${sig.est} ⭐ (te faltan ${sig.est-est}).`:''}</span></span><span class="ir">${ic('dcha')}</span></button>`; }
