/* LeeLEEJG · más juegos (lógica, lectura y números). Cada partida apunta aciertos y fallos. */
'use strict';
/* dificultad que se adapta: sube cuando acierta casi todo y baja cuando falla mucho (mira sus últimas partidas) */
const MAX_NIVEL = {sudoku:3, laberinto:4, series:3, sopa:2, cuenta:3, parejas:4, torres:2};
function nivelJ(id){ const max=MAX_NIVEL[id]||3; let n=0;
  (cfgDe(perfil()).juegoLog||[]).filter(x=>x.j===id).slice(-12).forEach(x=>{ const a=x.a||0, e=x.e||0, r=a+e?a/(a+e):0;
    if(r>=.85 || (a>0 && e<=1)) n++; else if(r<.5 && e>=3) n--; n=Math.max(0, Math.min(max, n)); });
  return n; }
function sacudir(b){ if(!b) return; b.classList.remove('sacude'); void b.offsetWidth; b.classList.add('sacude'); }

/* ============ 11 · Sudoku de dibujos (4×4) ============ */
function jSudoku(el){
  el.innerHTML=''; const pon=marcador(el); let sol, tab, fijo, sel=null, a=0, e=0, sim=[], huecos=0;
  const caja=i=>Math.floor(Math.floor(i/4)/2)*2+Math.floor((i%4)/2);
  const choca=(t,i,v)=>t.some((w,j)=>j!==i && w===v && (Math.floor(j/4)===Math.floor(i/4) || j%4===i%4 || caja(j)===caja(i)));
  const soluciones=(t,lim=2)=>{ const i=t.indexOf(null); if(i<0) return 1; let n=0; for(let v=0;v<4 && n<lim;v++) if(!choca(t,i,v)){ t[i]=v; n+=soluciones(t,lim-n); t[i]=null; } return n; };
  const nueva=()=>{
    const nv=nivelJ('sudoku'); huecos=Math.min(11, 5+nv*2); sim=fotosJuego(4);
    let g=[[0,1,2,3],[2,3,0,1],[1,0,3,2],[3,2,1,0]]; const perm=barajar([0,1,2,3]); g=g.map(r=>r.map(v=>perm[v]));
    const mezcla=()=>{ if(Math.random()<.5) g=[g[1],g[0],g[2],g[3]]; if(Math.random()<.5) g=[g[0],g[1],g[3],g[2]]; if(Math.random()<.5) g=[g[2],g[3],g[0],g[1]]; };
    const tr=()=>{ g=g[0].map((_,i)=>g.map(r=>r[i])); };
    mezcla(); tr(); mezcla(); if(Math.random()<.5) tr();
    sol=g.flat(); tab=sol.slice();
    for(const i of barajar([...Array(16).keys()])){ if(tab.filter(v=>v==null).length>=huecos) break; const v=tab[i]; tab[i]=null; if(soluciones(tab.slice())!==1) tab[i]=v; }
    fijo=tab.map(v=>v!=null); sel=tab.indexOf(null); a=0; e=0; pinta();
  };
  const cont=document.createElement('div'); cont.className='sudoku-zona'; el.appendChild(cont);
  const pinta=()=>{
    cont.innerHTML=`<div class="sudoku">${tab.map((v,i)=>`<button type="button" class="sd${fijo[i]?' fijo':''}${i===sel?' sel':''}${caja(i)%3===0?' c1':' c2'}" data-i="${i}">${v!=null?imgHTML(sim[v]):''}</button>`).join('')}</div>
      <div class="sudoku-pal">${sim.map((k,v)=>`<button type="button" class="sp" data-v="${v}">${imgHTML(k)}<b class="${claseTexto()}">${esc(palabraDe(k))}</b></button>`).join('')}</div>`;
    pon(`Cada dibujo, una vez en cada fila, en cada columna y en cada cuadrado. · ✓ ${a} · ✗ ${e}`);
  };
  cont.addEventListener('click', ev=>{
    const c=ev.target.closest('[data-i]'); if(c){ const i=+c.dataset.i; if(!fijo[i] && tab[i]==null){ sel=i; sonido('toc'); pinta(); } return; }
    const p=ev.target.closest('[data-v]'); if(!p || sel==null || tab[sel]!=null) return; const v=+p.dataset.v;
    if(v===sol[sel]){ tab[sel]=v; a++; sonido('bien'); decir(palabraDe(sim[v]));
      if(!tab.includes(null)){ pinta(); apuntarJuego('sudoku',{a, e, r:huecos+' huecos'}); confeti(el); sonido('cromo'); setTimeout(()=>cartel(el, `<h2>¡Sudoku resuelto! 🎉</h2><p class="nota">${e?`Con ${e} ${e===1?'fallo':'fallos'}.`:'¡Sin ningún fallo!'}</p>`, [['Otro sudoku', nueva]]), 500); return; }
      sel=tab.indexOf(null); pinta(); }
    else { e++; sonido('mal'); decir(choca(tab,sel,v)?'Ese ya está en la fila, la columna o el cuadrado.':'Ahí no va. Piénsalo otra vez.'); pinta(); sacudir(cont.querySelector(`[data-i="${sel}"]`)); }
  });
  nueva(); return {parar(){}};
}

/* ============ 12 · Laberinto ============ */
function jLaberinto(el){
  let pon, N, M, muros, yo, meta, golpes, pasos, L=null, fin=false;
  const crear=()=>{ // muros[r][c] = {u,r,d,l}: 1 si hay pared
    muros=Array.from({length:M},()=>Array.from({length:N},()=>({u:1,r:1,d:1,l:1}))); const vis=Array.from({length:M},()=>Array(N).fill(false));
    const pila=[[0,0]]; vis[0][0]=true;
    while(pila.length){ const [r,c]=pila[pila.length-1]; const ops=[['u',-1,0,'d'],['d',1,0,'u'],['l',0,-1,'r'],['r',0,1,'l']].filter(([,dr,dc])=>{ const rr=r+dr, cc=c+dc; return rr>=0&&rr<M&&cc>=0&&cc<N&&!vis[rr][cc]; });
      if(!ops.length){ pila.pop(); continue; } const [d,dr,dc,o]=ops[Math.floor(Math.random()*ops.length)]; muros[r][c][d]=0; muros[r+dr][c+dc][o]=0; vis[r+dr][c+dc]=true; pila.push([r+dr,c+dc]); }
  };
  const dibuja=()=>{ const {x,cel}=L; x.fillStyle='#FFF8E7'; x.fillRect(0,0,L.W,L.H);
    x.fillStyle='#FFE4A3'; x.fillRect(meta[1]*cel+2, meta[0]*cel+2, cel-4, cel-4);
    x.strokeStyle='#7C4A1E'; x.lineWidth=Math.max(2,cel*.09); x.lineCap='round';
    for(let r=0;r<M;r++) for(let c=0;c<N;c++){ const m=muros[r][c], X=c*cel, Y=r*cel; x.beginPath();
      if(m.u){ x.moveTo(X,Y); x.lineTo(X+cel,Y); } if(m.l){ x.moveTo(X,Y); x.lineTo(X,Y+cel); } if(r===M-1&&m.d){ x.moveTo(X,Y+cel); x.lineTo(X+cel,Y+cel); } if(c===N-1&&m.r){ x.moveTo(X+cel,Y); x.lineTo(X+cel,Y+cel); } x.stroke(); }
    x.font=`${Math.floor(cel*.7)}px serif`; x.textAlign='center'; x.textBaseline='middle';
    x.fillText('🧀', (meta[1]+.5)*cel, (meta[0]+.55)*cel); x.fillText('🐭', (yo[1]+.5)*cel, (yo[0]+.55)*cel);
    pon(`Lleva al ratón hasta el queso · Pasos: ${pasos} · ✗ Choques: ${golpes}`); };
  const mover=d=>{ if(fin || d==='s' || !muros) return; const [r,c]=yo; if(muros[r][c][d]){ golpes++; sonido('mal'); dibuja(); return; }
    const [dc,dr]=DIRS[d]; yo=[r+dr,c+dc]; pasos++; sonido('toc'); dibuja();
    if(yo[0]===meta[0] && yo[1]===meta[1]){ fin=true; apuntarJuego('laberinto',{a:1, e:golpes, pts:pasos, r:`${N}×${M}`}); sonido('cromo'); confeti(el); decir('¡Has encontrado el queso!'); cartel(el, `<h2>¡Has llegado! 🧀</h2><p class="nota">${pasos} pasos y ${golpes} ${golpes===1?'choque':'choques'}.</p>`, [['Otro laberinto', nueva]]); } };
  const nueva=()=>{ const nv=nivelJ('laberinto'); N=5+nv; M=5+nv; crear(); yo=[0,0]; meta=[M-1,N-1]; golpes=0; pasos=0; fin=false;
    el.innerHTML=''; pon=marcador(el); L=lienzo(el,N,M,420); deslizar(L.cv, mover); flechas(el, mover); dibuja(); };
  const quitarT=teclas(mover);
  nueva(); return {parar(){ quitarT(); }};
}

/* ============ 13 · ¿Qué viene después? (series) ============ */
const EMO_SERIES = ['🍎','🍌','🍇','⭐','🐶','🐱','🔵','🔺','🟩','🌙','🚗','⚽'];
function jSeries(el){
  el.innerHTML=''; const pon=marcador(el); const zona=document.createElement('div'); zona.className='series'; el.appendChild(zona);
  let ronda=0, a=0, e=0, mal=false, R=8;
  const pide=()=>{
    const nv=nivelJ('series'); const em=barajar(EMO_SERIES); const [x,y,z]=em; let serie, resp, ops, txt=false;
    const tipos=['ab','ab','aab','abb','abc','mas1','mas2','crece'].slice(0, 5+Math.min(3, nv+Math.floor(ronda/3)));
    const t=tipos[Math.floor(Math.random()*tipos.length)];
    if(t==='ab'){ serie=[x,y,x,y,x]; resp=y; }
    else if(t==='aab'){ serie=[x,x,y,x,x]; resp=y; }
    else if(t==='abb'){ serie=[x,y,y,x,y]; resp=y; }
    else if(t==='abc'){ serie=[x,y,z,x,y]; resp=z; }
    else if(t==='mas1'){ const n=1+Math.floor(Math.random()*5); serie=[n,n+1,n+2,n+3]; resp=n+4; txt=true; }
    else if(t==='mas2'){ const n=Math.random()<.5?0:1; serie=[n+2,n+4,n+6]; resp=n+8; txt=true; }
    else { const k=em[3]; serie=[k,k+k,k+k+k]; resp=k+k+k+k; }
    if(txt){ ops=barajar([resp, resp+1, resp-1].map(String)); resp=String(resp); }
    else if(t==='crece'){ const k=em[3]; ops=barajar([resp, k+k+k, k+k+k+k+k]); }
    else { const otros=em.slice(3).filter(v=>v!==resp); ops=barajar([resp, ...(t==='abc'?[x,y]:[x, otros[0]])]); }
    mal=false;
    zona.innerHTML=`<p class="sub">¿Qué viene después?</p><div class="serie">${serie.map(v=>`<span class="sv">${esc(String(v))}</span>`).join('')}<span class="sv hueco">?</span></div>
      <div class="ops-serie">${ops.map(o=>`<button type="button" class="btn btn-g os" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    pon(`Serie ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}`);
    $$('.os', zona).forEach(b=>b.onclick=()=>{ if(b.dataset.o===String(resp)){ $$('.os', zona).forEach(x=>x.disabled=true); if(!mal) a++; sonido('bien'); zona.querySelector('.hueco').textContent=resp; zona.querySelector('.hueco').classList.add('ok'); ronda++;
        if(ronda>=R){ apuntarJuego('series',{a, e}); setTimeout(()=>{ sonido('cromo'); if(e===0) confeti(el); cartel(el, `<h2>${e===0?'¡Todas bien! 🎉':'¡Terminado!'}</h2><p class="nota">${a} de ${R} a la primera.</p>`, [['Otra vez', ()=>{ ronda=0; a=0; e=0; pide(); }]]); }, 600); }
        else setTimeout(pide, 700); }
      else { e++; mal=true; sonido('mal'); sacudir(b); b.disabled=true; pon(`Serie ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}`); } });
  };
  cartel(el, `<h2>¿Qué viene después?</h2><p class="nota">Mira la serie y elige lo que va en el hueco.</p>`, [['¡Empezar!', pide]]);
  return {parar(){}};
}

/* ============ 14 · Ordena la frase ============ */
function frasesParaOrdenar(){
  const n=Math.max(1, Math.min(5, nivelActualDe(perfil())));
  const out=[];
  CONT.historias.filter(h=>h.nivel<=n && h.mundo!=='fiestas').forEach(h=>h.lineas.forEach(l=>{
    const fotos=[...l.matchAll(/\[[^|\]]+\|([^\]]+)\]/g)].map(m=>m[1]);
    const t=conNombre(l).replace(/\[([^|\]]+)\|[^\]]+\]/g,'$1').replace(/[«»"]/g,'').trim();
    const ws=t.split(/\s+/).filter(Boolean); if(ws.length>=3 && ws.length<=6 && !/[;:]/.test(t)) out.push({t, ws, foto:fotos[0]});
  }));
  return out;
}
function jOrdena(el){
  el.innerHTML=''; const pon=marcador(el); const zona=document.createElement('div'); zona.className='ordena'; el.appendChild(zona);
  const todas=frasesParaOrdenar(); let ronda=0, a=0, e=0, R=5, frase, usadas, mal, orden;
  const pinta=()=>{ const n=usadas.size;
    zona.innerHTML=`<p class="sub">Toca las palabras en orden para formar la frase.</p>
      <div class="ord-foto">${frase.foto?imgHTML(frase.foto,true):''}</div>
      <div class="ord-frase ${claseTexto()}">${frase.ws.map((w,i)=>`<span class="ow${i<n?' puesta':''}">${i<n?esc(w):'&nbsp;'}</span>`).join('')}</div>
      <div class="ord-pal">${orden.map(i=>`<button type="button" class="btn btn-g op ${claseTexto()}" data-i="${i}" ${usadas.has(i)?'hidden':''}>${esc(frase.ws[i])}</button>`).join('')}</div>`;
    pon(`Frase ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}`);
    $$('.op', zona).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i;
      if(frase.ws[i]===frase.ws[usadas.size]){ usadas.add(i); sonido('toc');
        if(usadas.size===frase.ws.length){ if(!mal) a++; ronda++; pinta(); sonido('bien'); decir(frase.t);
          if(ronda>=R){ apuntarJuego('ordena',{a, e}); setTimeout(()=>{ sonido('cromo'); if(e===0) confeti(el); cartel(el, `<h2>${e===0?'¡Todas a la primera! 🎉':'¡Muy bien!'}</h2><p class="nota">${a} de ${R} frases sin fallar.</p>`, [['Otra vez', ()=>{ ronda=0; a=0; e=0; pide(); }]]); }, 1800); }
          else setTimeout(pide, 2200); return; }
        pinta(); }
      else { e++; mal=true; sonido('mal'); sacudir(b); pon(`Frase ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}`); } });
  };
  const pide=()=>{ frase=todas[Math.floor(Math.random()*todas.length)]; usadas=new Set(); mal=false;
    orden=barajar(frase.ws.map((w,i)=>i)); if(orden.every((v,i)=>v===i)) orden=orden.slice().reverse(); pinta(); };
  if(!todas.length){ zona.innerHTML='<p class="vacio">Todavía no hay frases.</p>'; return {parar(){}}; }
  cartel(el, `<h2>Ordena la frase</h2><p class="nota">Las palabras están desordenadas. Tócalas en orden para leer la frase.</p>`, [['¡Empezar!', pide]]);
  return {parar(){}};
}

/* ============ 15 · Sopa de letras ============ */
function jSopa(el){
  el.innerHTML=''; const pon=marcador(el); const zona=document.createElement('div'); zona.className='sopa-zona'; el.appendChild(zona);
  let N, g, pals, encontradas, ini=null, a=0, e=0;
  const LETRAS='aeioumpslntdcrbg';
  const nueva=()=>{
    const nv=nivelJ('sopa'); N=6+Math.min(2,nv); const cuantas=3+Math.min(2,nv);
    const cand=barajar(Object.entries(CONT.palabras||{}).filter(([p,k])=>/^[a-z]{3,5}$/.test(p) && CONT.fotos[k]).map(([p,k])=>({p,k})));
    for(let intento=0; intento<40; intento++){
      g=Array.from({length:N},()=>Array(N).fill(null)); pals=[];
      for(const c of cand){ if(pals.length>=cuantas) break; if(pals.some(x=>x.p===c.p) || c.p.length>N) continue;
        for(let t=0;t<30;t++){ const hor=Math.random()<.6; const r=Math.floor(Math.random()*(hor?N:N-c.p.length+1)), col=Math.floor(Math.random()*(hor?N-c.p.length+1:N));
          const celdas=[...c.p].map((ch,i)=>hor?[r,col+i]:[r+i,col]); if(celdas.every(([y,x],i)=>!g[y][x] || g[y][x]===c.p[i])){ celdas.forEach(([y,x],i)=>g[y][x]=c.p[i]); pals.push({...c, celdas}); break; } } }
      if(pals.length===cuantas) break; }
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(!g[r][c]) g[r][c]=LETRAS[Math.floor(Math.random()*LETRAS.length)];
    encontradas=new Set(); ini=null; a=0; e=0; pinta();
  };
  const enc=(r,c)=>pals.some(p=>encontradas.has(p.p) && p.celdas.some(([y,x])=>y===r&&x===c));
  const pinta=()=>{
    zona.innerHTML=`<div class="sopa-pals">${pals.map(p=>`<span class="sopa-p${encontradas.has(p.p)?' hecha':''}">${imgHTML(p.k)}<b class="${claseTexto()}">${esc(p.p)}</b></span>`).join('')}</div>
      <div class="sopa ${claseTexto()}" style="grid-template-columns:repeat(${N},1fr)">${g.map((f,r)=>f.map((ch,c)=>`<button type="button" class="sl${enc(r,c)?' ok':''}${ini&&ini[0]===r&&ini[1]===c?' ini':''}" data-r="${r}" data-c="${c}">${esc(ch)}</button>`).join('')).join('')}</div>`;
    pon(`Toca la primera letra y la última de cada palabra · ✓ ${a} · ✗ ${e}`);
  };
  zona.addEventListener('click', ev=>{ const b=ev.target.closest('[data-r]'); if(!b) return; const r=+b.dataset.r, c=+b.dataset.c;
    if(!ini){ ini=[r,c]; sonido('toc'); pinta(); return; }
    const [r0,c0]=ini; ini=null;
    const p=pals.find(p=>!encontradas.has(p.p) && ((p.celdas[0][0]===r0&&p.celdas[0][1]===c0&&p.celdas.at(-1)[0]===r&&p.celdas.at(-1)[1]===c) || (p.celdas[0][0]===r&&p.celdas[0][1]===c&&p.celdas.at(-1)[0]===r0&&p.celdas.at(-1)[1]===c0)));
    if(p){ encontradas.add(p.p); a++; sonido('bien'); decir(p.p); pinta();
      if(encontradas.size===pals.length){ apuntarJuego('sopa',{a, e, r:pals.length+' palabras'}); sonido('cromo'); confeti(el); setTimeout(()=>cartel(el, `<h2>¡Todas encontradas! 🎉</h2><p class="nota">${e?`Con ${e} ${e===1?'fallo':'fallos'}.`:'¡Sin fallos!'}</p>`, [['Otra sopa', nueva]]), 600); } }
    else if(r0===r && c0===c){ pinta(); }
    else { e++; sonido('mal'); pinta(); sacudir(zona.querySelector('.sopa')); }
  });
  nueva(); return {parar(){}};
}

/* ============ 16 · ¿Cuántos hay? ============ */
function jCuenta(el){
  el.innerHTML=''; const pon=marcador(el); const zona=document.createElement('div'); zona.className='cuenta-j'; el.appendChild(zona);
  let ronda=0, a=0, e=0, R=8, mal;
  const pide=()=>{
    const nv=nivelJ('cuenta'); const max=Math.min(12, 5+nv*2+Math.floor(ronda/3)); mal=false;
    const mas = ronda%3===2;   // una de cada tres: ¿dónde hay más?
    const em=barajar(EMO_SERIES)[0];
    if(mas){ let n1=1+Math.floor(Math.random()*max), n2; do{ n2=1+Math.floor(Math.random()*max); }while(n2===n1);
      const grupo=n=>`<div class="grupo-c">${Array.from({length:n},()=>`<span>${em}</span>`).join('')}</div>`;
      zona.innerHTML=`<p class="sub">¿Dónde hay más?</p><div class="dos-grupos"><button type="button" class="gc" data-g="0">${grupo(n1)}</button><button type="button" class="gc" data-g="1">${grupo(n2)}</button></div>`;
      $$('.gc', zona).forEach(b=>b.onclick=()=>{ const ok=(+b.dataset.g===0)===(n1>n2); responde(ok, b, `Hay ${Math.max(n1,n2)}`); });
    } else {
      const n=1+Math.floor(Math.random()*max); const ops=barajar([...new Set([n, Math.max(1,n-1), n+1, n+2])]).slice(0,3); if(!ops.includes(n)) ops[0]=n;
      zona.innerHTML=`<p class="sub">¿Cuántos hay?</p><div class="grupo-c grande">${Array.from({length:n},()=>`<span style="transform:rotate(${Math.round(Math.random()*30-15)}deg)">${em}</span>`).join('')}</div>
        <div class="ops-serie">${barajar(ops).map(o=>`<button type="button" class="btn btn-g os" data-o="${o}">${o}</button>`).join('')}</div>`;
      $$('.os', zona).forEach(b=>b.onclick=()=>responde(+b.dataset.o===n, b, `Hay ${n}`));
    }
    pon(`Ronda ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}`);
  };
  const responde=(ok, b, frase)=>{
    if(ok){ $$('.os,.gc', zona).forEach(x=>x.disabled=true); if(!mal) a++; ronda++; sonido('bien'); decir(frase);
      if(ronda>=R){ apuntarJuego('cuenta',{a, e}); setTimeout(()=>{ sonido('cromo'); if(e===0) confeti(el); cartel(el, `<h2>${e===0?'¡Todas bien! 🎉':'¡Terminado!'}</h2><p class="nota">${a} de ${R} a la primera.</p>`, [['Otra vez', ()=>{ ronda=0; a=0; e=0; pide(); }]]); }, 700); }
      else setTimeout(pide, 900); }
    else { e++; mal=true; sonido('mal'); sacudir(b); b.disabled=true; pon(`Ronda ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}`); }
  };
  cartel(el, `<h2>¿Cuántos hay?</h2><p class="nota">Cuenta los dibujos y elige el número. A veces te pregunto dónde hay más.</p>`, [['¡Empezar!', pide]]);
  return {parar(){}};
}

JUEGOS.push(
  {id:'sudoku', nombre:'Sudoku de dibujos', emo:'🔲', desc:'Cada dibujo, una vez en cada fila, columna y cuadrado.', fn:jSudoku},
  {id:'series', nombre:'¿Qué viene después?', emo:'🔁', desc:'Descubre cómo sigue la serie.', fn:jSeries},
  {id:'ordena', nombre:'Ordena la frase', emo:'🧾', desc:'Pon las palabras en orden y lee la frase.', fn:jOrdena},
  {id:'laberinto', nombre:'Laberinto', emo:'🐭', desc:'Lleva al ratón hasta el queso.', fn:jLaberinto},
  {id:'sopa', nombre:'Sopa de letras', emo:'🔤', desc:'Encuentra las palabras escondidas.', fn:jSopa},
  {id:'cuenta', nombre:'¿Cuántos hay?', emo:'🔢', desc:'Cuenta los dibujos y di dónde hay más.', fn:jCuenta}
);
/* tipo de cada juego (para el resumen de la familia) */
const TIPO_JUEGO = {parejas:'memoria', tresraya:'lógica', serpiente:'habilidad', comecocos:'habilidad', topos:'lectura', bloques:'habilidad', colores:'memoria', burbujas:'habilidad', puzle:'lógica', torres:'lógica',
  sudoku:'lógica', series:'lógica', ordena:'lectura', laberinto:'lógica', sopa:'lectura', cuenta:'números'};

/* ---------- familia: aciertos y fallos en los juegos ---------- */
function juegosAdultoHTML(p){
  const log=cfgDe(p).juegoLog||[]; const desde=new Date(hoySinHora()); desde.setDate(desde.getDate()-6);
  if(!log.length) return `<div class="card bloque"><h3>Juegos</h3><p class="vacio">Todavía no ha terminado ninguna partida.</p></div>`;
  const filas=JUEGOS.map(j=>{ const ps=log.filter(x=>x.j===j.id); if(!ps.length) return null; const sem=ps.filter(x=>new Date(x.f)>=desde);
    const A=ps.reduce((s,x)=>s+(x.a||0),0), E=ps.reduce((s,x)=>s+(x.e||0),0); const pct=A+E?Math.round(100*A/(A+E)):null;
    const ult=ps.slice(-5).map(x=>x.e===0?'✓':'✗'+x.e).join(' ');
    return {j, n:ps.length, sem:sem.length, A, E, pct, ult, r:ps.at(-1).r||''}; }).filter(Boolean);
  const pctTxt=v=>v==null?'–':`<span class="nb ${v>=85?'bien':v>=60?'medio':'mal'}">${v} %</span>`;
  return `<div class="card bloque"><h3 style="margin-bottom:6px">🎮 Juegos: aciertos y fallos</h3>
    <p class="nota" style="margin-bottom:10px">Cada partida terminada apunta lo que acierta y lo que falla. En los de lógica los fallos son movimientos o respuestas equivocadas; en los de habilidad, cuando pierde.</p>
    <table><thead><tr><th>Juego</th><th>Tipo</th><th>Partidas</th><th>Esta semana</th><th>Aciertos</th><th>Fallos</th><th>% acierto</th><th>Últimas</th></tr></thead><tbody>
    ${filas.sort((x,y)=>y.n-x.n).map(f=>`<tr><td>${f.j.emo} ${esc(f.j.nombre)}${f.r?`<br><span class="nota">Última: ${esc(f.r)}</span>`:''}</td><td>${esc(TIPO_JUEGO[f.j.id]||'')}</td><td>${f.n}</td><td>${f.sem}</td><td>${f.A}</td><td>${f.E}</td><td>${pctTxt(f.pct)}</td><td style="white-space:nowrap">${esc(f.ult)}</td></tr>`).join('')}</tbody></table></div>`;
}
