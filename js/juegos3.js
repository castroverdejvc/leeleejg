/* LeeLEEJG · juegos de pensar con medalla (30/10/2026).
   Decidido por la familia:
   - Los juegos se abren cuando termina lo de hoy (lectura del día, repaso de fichas y ficha nueva del cole).
   - Juegos de pensar (lógica, buscar, puzles, memoria): cada partida da como mucho 1 minuto de tele, 1 minuto de móvil
     y una estrella. Se da el tanto por ciento según lo bien y lo rápido que lo haga:
       bien hecho (q): 100 % con el resultado ideal y 0 % con el «peor» (en línea recta entre los dos). En Parejas, el ideal
         es lo que haría alguien con memoria perfecta (1,6 intentos por pareja de media) y el peor 2,5 por pareja.
       rapidez (r): 100 % si tarda lo de siempre o menos (la mediana de sus 10 últimas partidas de ese juego y tamaño;
         al principio, un tiempo fijo) y 0 % si tarda el triple.
       premio = q × (50 % + 50 % de r). Oro ≥ 80 %, plata ≥ 50 %, bronce ≥ 20 %. La estrella, solo con oro.
   - Cada juego da premio 3 veces al día; después se puede seguir jugando, sin premio.
   - Los juegos de divertirse (serpiente, comecocos, bloques, burbujas, tres en raya, deportes…) se quedan, sin premio. */
'use strict';
const JUEGOS_PENSAR = ['parejas','parejaspal','quefalta','colores','dondeesta','diferencias','sopa','numeros','puzle','piezas','torres','laberinto','sudoku','series','cuenta','ordena','topos'];
const esPensar = id => JUEGOS_PENSAR.includes(id);
const PREMIOS_JUEGO_DIA = 3;
Object.assign(MAX_NIVEL, {diferencias:3, quefalta:3, dondeesta:3, numeros:3, piezas:3, parejaspal:3});
Object.assign(TIPO_JUEGO, {diferencias:'buscar', quefalta:'memoria', dondeesta:'buscar', numeros:'buscar', piezas:'lógica', parejaspal:'memoria'});
/* en línea recta: 1 en «bien», 0 en «mal» (vale también cuando más es mejor) */
const lineal = (x, bien, mal) => bien===mal ? (x<=bien?1:0) : Math.max(0, Math.min(1, (mal-x)/(mal-bien)));
const red2 = v => Math.round(v*100)/100;
let inicioPartida = null;

function medallaDe(v){ return v>=0.8 ? 'oro' : v>=0.5 ? 'plata' : v>=0.2 ? 'bronce' : ''; }
const MEDALLA = {oro:{emo:'🥇', t:'¡Oro!'}, plata:{emo:'🥈', t:'¡Plata!'}, bronce:{emo:'🥉', t:'¡Bronce!'}, '':{emo:'💪', t:'¡Sigue practicando!'}};
function premiosJuegoHoy(id, p=perfil()){ const hoy=claveDia(new Date()); return (cfgDe(p).juegoLog||[]).filter(x=>x.j===id && x.pr>0 && claveDia(x.f)===hoy); }

/* nota de una partida: d.hecho, d.ideal, d.peor (y d.tRef: segundos de referencia al principio; d.sinTiempo) */
function puntuarPartida(id, d, c){
  const q=lineal(+d.hecho, +d.ideal, +d.peor);
  const t = d.sinTiempo ? null : (d.seg!=null ? +d.seg : (inicioPartida ? (Date.now()-inicioPartida)/1000 : null));
  const k = id+':'+(d.clave!=null ? d.clave : d.ideal);
  const prev=(c.juegoLog||[]).filter(x=>x.k===k && x.t>0).slice(-10).map(x=>x.t).sort((a,b)=>a-b);
  const ref = prev.length>=3 ? prev[Math.floor(prev.length/2)] : (+d.tRef||0);
  const r = (t==null || !ref) ? 1 : lineal(t, ref, 3*ref);
  const v = q*(0.5+0.5*r), med=medallaDe(v);
  const ya=premiosJuegoHoy(id).length, cuenta=ya<PREMIOS_JUEGO_DIA;
  return {q:red2(q), r:red2(r), v:red2(v), t:t==null?null:Math.round(t), ref:Math.round(ref), k, med, cuenta, ya, pr: cuenta ? red2(v) : 0};
}

/* cada partida se apunta con sus aciertos y fallos; las de los juegos de pensar, también con su nota y su premio */
apuntarJuego = function(id, d={}){
  let res=null;
  try{
    const p=perfil(), c=cfgDe(p);
    const x={f:new Date().toISOString(), j:id, a:Math.max(0,Math.round(d.a||0)), e:Math.max(0,Math.round(d.e||0)), ...(d.r?{r:d.r}:{}), ...(d.pts!=null?{pts:d.pts}:{})};
    if(esPensar(id) && d.ideal!=null && d.peor!=null && d.hecho!=null){
      res=puntuarPartida(id, d, c);
      Object.assign(x, {q:res.q, k:res.k, med:res.med, ...(res.t!=null?{t:res.t}:{}), ...(res.pr>0?{pr:res.pr}:{})});
    }
    c.juegoLog=(c.juegoLog||[]).concat([x]).slice(-1500); guardarAj();
  }catch(e){ console.error(e); }
  inicioPartida=null;
  if(res) setTimeout(()=>avisoMedalla(id, res), 450);
  return res;
};

const segTxt = s => s>=60 ? (s%60 ? `${Math.floor(s/60)} min ${s%60} s` : (s===60?'1 minuto':`${s/60} minutos`)) : `${s} segundos`;
function premioJuegoTxt(pr){
  const tele=Math.round(pr*tJuegoMin()*60/5)*5, movil=Math.round(pr*movilJuegoMin()*60/5)*5;
  return {tele, movil, partes:[tele?`📺 +${segTxt(tele)} de tele`:'', movil && movilActivo()?`📱 +${segTxt(movil)} de móvil`:''].filter(Boolean)};
}
function avisoMedalla(id, res){
  if(actual!=='juego') return;
  const M=MEDALLA[res.med], j=JUEGOS.find(x=>x.id===id);
  const pr=premioJuegoTxt(res.pr);
  const linea = !res.cuenta ? `Hoy ${j?esc(j.nombre):'este juego'} ya te ha dado sus ${PREMIOS_JUEGO_DIA} premios. ¡Prueba otro juego!`
    : res.pr>0 ? pr.partes.join(' · ')+(res.med==='oro'?' · ⭐ +1':'') : 'Esta vez no hay premio. ¡Otra vez y lo consigues!';
  $$('.aviso-medalla').forEach(x=>x.remove());
  const a=document.createElement('div'); a.className='aviso-medalla med-'+(res.med||'no'); a.setAttribute('role','status');
  a.innerHTML=`<span class="med-emo">${M.emo}</span><div><b>${M.t}</b><span>${linea}</span>${res.cuenta?`<span class="med-quedan">Premios de este juego hoy: ${Math.min(PREMIOS_JUEGO_DIA, res.ya+(res.pr>0?1:0))} de ${PREMIOS_JUEGO_DIA}</span>`:''}</div><button type="button" class="ico-btn" aria-label="Cerrar">✕</button>`;
  a.querySelector('button').onclick=()=>a.remove();
  document.body.appendChild(a); setTimeout(()=>a.remove(), 7000);
  if(res.med==='oro') sonido('cromo');
  decir(!res.cuenta ? 'Hoy este juego ya no da más premios. ¡Prueba otro!' : res.pr>0 ? `${M.t.replace(/¡|!/g,'')}. ${res.med==='oro'?'Un minuto más de tele, de móvil y una estrella.':'Ganas un poquito de tele y de móvil.'}` : '¡Otra vez y lo consigues!');
  try{ if(typeof actualizarTeleMini==='function') actualizarTeleMini(); }catch(e){}
}

/* el tiempo de cada partida empieza con el primer toque (después de «¡Empezar!» u «Otra vez») */
{ const pintar0=PANT.juego.pintar;
  PANT.juego.pintar=function(id){ inicioPartida=null; pintar0.call(this, id); const z=$('#juegoZona'); if(z) z.addEventListener('pointerdown', ()=>{ if(inicioPartida==null) inicioPartida=Date.now(); }, true); }; }

/* ---------- lo mínimo posible, para saber qué es «perfecto» ---------- */
/* puzle deslizante: menos movimientos posibles (IDA* con distancia Manhattan). pos[i] = pieza en la casilla i; N*N-1 = hueco */
function optimoPuzle(pos, N=3){
  const H=N*N-1, s=pos.slice(); let hueco=s.indexOf(H), lim, hallado=-1, nodos=0;
  const dist=(i,v)=>Math.abs(i%N-v%N)+Math.abs(Math.floor(i/N)-Math.floor(v/N));
  const man=()=>s.reduce((a,v,i)=>v===H?a:a+dist(i,v),0);
  const vec=i=>[i-N,i+N,(i%N)?i-1:-1,(i%N<N-1)?i+1:-1].filter(j=>j>=0&&j<N*N);
  const busca=(g,prev,h)=>{ const f=g+h; if(f>lim) return f; if(h===0){ hallado=g; return -1; } if(++nodos>3e6) return Infinity; let min=Infinity;
    for(const j of vec(hueco)){ if(j===prev) continue; const v=s[j], hv=hueco; const h2=h-dist(j,v)+dist(hv,v);
      s[hv]=v; s[j]=H; hueco=j; const t=busca(g+1, hv, h2); hueco=hv; s[j]=v; s[hv]=H;
      if(t===-1) return -1; if(t<min) min=t; }
    return min; };
  lim=man(); if(lim===0) return 0;
  for(let it=0; it<60; it++){ const t=busca(0,-1,man()); if(t===-1) return hallado; if(t===Infinity) return Math.max(lim, 10); lim=t; }
  return lim;
}
/* laberinto: pasos del camino más corto desde la esquina de arriba a la de abajo */
function caminoLab(muros, M, N){
  const dist=Array.from({length:M},()=>Array(N).fill(-1)); dist[0][0]=0; const q=[[0,0]];
  while(q.length){ const [r,c]=q.shift(); for(const [d,dr,dc] of [['u',-1,0],['d',1,0],['l',0,-1],['r',0,1]]){ if(muros[r][c][d]) continue; const rr=r+dr, cc=c+dc; if(rr<0||rr>=M||cc<0||cc>=N||dist[rr][cc]>=0) continue; dist[rr][cc]=dist[r][c]+1; q.push([rr,cc]); } }
  return Math.max(1, dist[M-1][N-1]); }
/* intercambios mínimos para ordenar piezas: n − número de ciclos */
function cambiosMinimos(perm){ const vis=new Array(perm.length).fill(false); let ciclos=0; for(let i=0;i<perm.length;i++){ if(vis[i]) continue; ciclos++; let j=i; while(!vis[j]){ vis[j]=true; j=perm[j]; } } return perm.length-ciclos; }

/* ============ 18 · Busca las diferencias ============ */
function jDiferencias(el){
  let C, F, D, base, dcha, cambios, hallados, fallos, fin;
  const nueva=()=>{
    const nv=nivelJ('diferencias'); [C,F,D]=[[3,3,2],[4,3,3],[4,4,3],[5,4,4]][nv];
    const ks=fotosJuego(C*F+D); base=ks.slice(0,C*F); dcha=base.slice(); cambios=new Set(barajar([...Array(C*F).keys()]).slice(0,D));
    [...cambios].forEach((i,n)=>{ dcha[i]=ks[C*F+n]; }); hallados=new Set(); fallos=0; fin=false; pinta();
    decir(`Busca ${D} diferencias.`);
  };
  const tabla=(arr,lado)=>`<div class="dif-tab" style="--c:${C}" data-lado="${lado}">${arr.map((k,i)=>`<button type="button" class="dif-c${hallados.has(i)?' hallada':''}" data-i="${i}">${imgHTML(k)}</button>`).join('')}</div>`;
  const pinta=()=>{ el.innerHTML=`<div class="marcador">Busca las <b>${D}</b> diferencias · Encontradas: <b>${hallados.size}</b> de ${D} · ✗ ${fallos}</div>
    <div class="dif-zona">${tabla(base,'izq')}${tabla(dcha,'dcha')}</div><p class="nota centro">Toca lo que ha cambiado, en cualquiera de los dos dibujos.</p>`; };
  el.addEventListener('click', e=>{ const b=e.target.closest('.dif-c'); if(!b || fin) return; const i=+b.dataset.i;
    if(hallados.has(i)) return;
    if(cambios.has(i)){ hallados.add(i); sonido('bien'); decir(nombreFoto(dcha[i])); pinta();
      if(hallados.size===D){ fin=true; apuntarJuego('diferencias',{a:D, e:fallos, r:`${D} diferencias`, hecho:fallos, ideal:0, peor:D, tRef:8*D, clave:C*F+'-'+D}); confeti(el);
        setTimeout(()=>cartel(el, `<h2>¡Las has encontrado todas!</h2><p class="nota">${fallos?`Con ${fallos} ${fallos===1?'fallo':'fallos'}.`:'¡Sin fallos!'}</p>`, [['Otras diferencias', nueva]]), 600); } }
    else { fallos++; sonido('mal'); sacudir(b); pinta(); } });
  cartel(el, `<h2>Busca las diferencias 🔎</h2><p class="nota">Los dos dibujos son casi iguales. Toca lo que ha cambiado.</p>`, [['¡Empezar!', nueva]]);
  return {parar(){ fin=true; }};
}

/* ============ 19 · ¿Qué falta? (memoria) ============ */
function jQueFalta(el){
  const R=4; let K, ronda, a, e, mal, ks, falta, fin=false;
  const nueva=()=>{ K=3+nivelJ('quefalta'); ronda=0; a=0; e=0; fin=false; mira(); };
  const mira=()=>{ mal=false; const todas=fotosJuego(K+3); ks=todas.slice(0,K); falta=ks[Math.floor(Math.random()*K)]; const otras=todas.slice(K);
    el.innerHTML=`<div class="marcador">Ronda ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}</div><h2 class="centro qf-tit">👀 Mira bien y acuérdate</h2>
      <div class="qf-tab" style="--c:${Math.min(K,4)}">${ks.map(k=>`<div class="qf-c">${imgHTML(k)}<b class="${claseTexto()}">${esc(nombreFoto(k))}</b></div>`).join('')}</div>
      <div class="botones" style="justify-content:center"><button class="btn btn-p btn-g" type="button" id="qfYa">¡Ya me acuerdo! ${ic('flecha')}</button></div>`;
    iconos(el); decir('Mira bien y acuérdate.');
    $('#qfYa', el).onclick=()=>pregunta(otras); };
  const pregunta=otras=>{ const quedan=barajar(ks.filter(k=>k!==falta)); const ops=barajar([falta, ...otras]);
    el.innerHTML=`<div class="marcador">Ronda ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}</div><h2 class="centro qf-tit">🫣 ¿Qué falta?</h2>
      <div class="qf-tab" style="--c:${Math.min(K,4)}">${quedan.map(k=>`<div class="qf-c">${imgHTML(k)}</div>`).join('')}<div class="qf-c qf-hueco">?</div></div>
      <div class="qf-ops">${ops.map(k=>`<button type="button" class="qf-op" data-k="${esc(k)}">${imgHTML(k)}<b class="${claseTexto()}">${esc(nombreFoto(k))}</b></button>`).join('')}</div>`;
    decir('¿Qué falta?');
    $$('.qf-op', el).forEach(b=>b.onclick=()=>{ if(fin) return;
      if(b.dataset.k===falta){ if(!mal) a++; ronda++; sonido('bien'); decir(`¡Faltaba ${nombreFoto(falta)}!`); $$('.qf-op', el).forEach(x=>x.disabled=true); b.classList.add('bien');
        if(ronda>=R){ fin=true; apuntarJuego('quefalta',{a, e, r:`${K} dibujos`, hecho:e, ideal:0, peor:Math.max(2,Math.ceil(R/2)), tRef:10*R, clave:K}); confeti(el);
          setTimeout(()=>cartel(el, `<h2>¡Qué memoria!</h2><p class="nota">${a} de ${R} a la primera.</p>`, [['Otra vez', nueva]]), 900); }
        else setTimeout(mira, 1300); }
      else { e++; mal=true; sonido('mal'); sacudir(b); b.disabled=true; } }); };
  cartel(el, `<h2>¿Qué falta? 🫣</h2><p class="nota">Mira los dibujos y acuérdate. Luego uno se esconde: ¿cuál es?</p>`, [['¡Empezar!', nueva]]);
  return {parar(){ fin=true; }};
}

/* ============ 20 · ¿Dónde está? (buscar) ============ */
function jDondeEsta(el){
  const R=5; let n, cols, ronda, a, e, mal, ks, obj, fin=false;
  const nueva=()=>{ const nv=nivelJ('dondeesta'); [cols,n]=[[3,9],[4,12],[4,16],[5,20]][nv]; ronda=0; a=0; e=0; fin=false; sig(); };
  const sig=()=>{ mal=false; ks=fotosJuego(n); obj=ks[Math.floor(Math.random()*n)];
    el.innerHTML=`<div class="marcador">Ronda ${ronda+1} de ${R} · ✓ ${a} · ✗ ${e}</div>
      <div class="de-pide"><span>¿Dónde está…</span><b class="${claseTexto()}">${esc(nombreFoto(obj))}</b><button class="ico-btn" type="button" id="deOir" aria-label="Oír otra vez">${ic('altavoz')}</button></div>
      <div class="de-tab" style="--c:${cols}">${barajar(ks).map(k=>`<button type="button" class="de-c" data-k="${esc(k)}">${imgHTML(k)}</button>`).join('')}</div>`;
    iconos(el); decir(`¿Dónde está ${nombreFoto(obj)}?`); $('#deOir', el).onclick=()=>decir(nombreFoto(obj));
    $$('.de-c', el).forEach(b=>b.onclick=()=>{ if(fin) return;
      if(b.dataset.k===obj){ if(!mal) a++; ronda++; sonido('bien'); b.classList.add('bien'); $$('.de-c', el).forEach(x=>x.disabled=true);
        if(ronda>=R){ fin=true; apuntarJuego('dondeesta',{a, e, r:`${n} dibujos`, hecho:e, ideal:0, peor:Math.max(2,Math.ceil(R/2)), tRef:4*R, clave:n}); confeti(el);
          setTimeout(()=>cartel(el, `<h2>¡Buen ojo! 👀</h2><p class="nota">${a} de ${R} a la primera.</p>`, [['Otra vez', nueva]]), 800); }
        else setTimeout(sig, 700); }
      else { e++; mal=true; sonido('mal'); sacudir(b); decir(nombreFoto(b.dataset.k)+'. No. Busca '+nombreFoto(obj)+'.'); } }); };
  cartel(el, `<h2>¿Dónde está? 👀</h2><p class="nota">Te digo una cosa y tú la buscas entre muchos dibujos. ¡Rápido!</p>`, [['¡Empezar!', nueva]]);
  return {parar(){ fin=true; }};
}

/* ============ 21 · Sigue los números (buscar) ============ */
function jNumeros(el){
  let N, cols, toca, e, fin=false, orden;
  const nueva=()=>{ const nv=nivelJ('numeros'); [cols,N]=[[3,9],[4,12],[4,16],[5,20]][nv]; toca=1; e=0; fin=false; orden=barajar([...Array(N).keys()].map(i=>i+1)); pinta(); decir('Toca los números en orden. Empieza por el uno.'); };
  const pinta=()=>{ el.innerHTML=`<div class="marcador">Toca el <b>${toca<=N?toca:N}</b> · ✗ ${e}</div>
    <div class="num-tab" style="--c:${cols}">${orden.map(v=>`<button type="button" class="num-c${v<toca?' hecho':''}" data-v="${v}">${v}</button>`).join('')}</div>`; };
  el.addEventListener('click', ev=>{ const b=ev.target.closest('.num-c'); if(!b || fin) return; const v=+b.dataset.v; if(v<toca) return;
    if(v===toca){ toca++; sonido('toc'); b.classList.add('hecho'); const m=el.querySelector('.marcador'); if(m) m.innerHTML=`Toca el <b>${Math.min(toca,N)}</b> · ✗ ${e}`;
      if(toca>N){ fin=true; apuntarJuego('numeros',{a:N, e, r:`del 1 al ${N}`, hecho:e, ideal:0, peor:Math.max(2,Math.ceil(N/4)), tRef:Math.ceil(2.5*N), clave:N}); sonido('cromo'); confeti(el);
        setTimeout(()=>cartel(el, `<h2>¡Del 1 al ${N}!</h2><p class="nota">${e?`Con ${e} ${e===1?'fallo':'fallos'}.`:'¡Sin fallos!'}</p>`, [['Otra vez', nueva]]), 600); } }
    else { e++; sonido('mal'); sacudir(b); decir(String(toca)); const m=el.querySelector('.marcador'); if(m) m.innerHTML=`Toca el <b>${toca}</b> · ✗ ${e}`; } });
  cartel(el, `<h2>Sigue los números 🔢</h2><p class="nota">Toca los números en orden: 1, 2, 3… ¡Lo más rápido que puedas!</p>`, [['¡Empezar!', nueva]]);
  return {parar(){ fin=true; }};
}

/* ============ 22 · Puzle de piezas (cambiar de sitio) ============ */
function jPiezas(el){
  let L, k, perm, sel, mov, ideal, fin=false;
  const nueva=()=>{ const nv=nivelJ('piezas'); L=[2,3,3,4][nv];
    const ks=Object.keys(CONT.fotos).filter(q=>CONT.fotos[q]==='b' && !/^portada|lobitos/.test(q)); const kf=clavesFiesta().filter(q=>CONT.fotos[q]==='b');
    k = kf.length && Math.random()<.6 ? kf[Math.floor(Math.random()*kf.length)] : ks[Math.floor(Math.random()*ks.length)];
    do { perm=barajar([...Array(L*L).keys()]); } while(perm.filter((v,i)=>v===i).length > Math.floor(L*L/3));
    ideal=cambiosMinimos(perm); sel=null; mov=0; fin=false; pinta(); };
  const pinta=()=>{ const src=fotoURL(k,true), den=Math.max(1,L-1);
    el.innerHTML=`<div class="marcador">Cambios: <b>${mov}</b> · <span class="pz-mini" style="background-image:url('${src}')"></span> Así tiene que quedar</div>
      <div class="pzs" style="--l:${L}">${perm.map((v,i)=>`<button type="button" class="pzs-c${sel===i?' sel':''}" data-i="${i}" style="background-image:url('${src}');background-size:${L*100}% ${L*100}%;background-position:${(v%L)/den*100}% ${Math.floor(v/L)/den*100}%"></button>`).join('')}</div>
      <p class="nota centro">Toca una pieza y luego otra para cambiarlas de sitio.</p>`; };
  el.addEventListener('click', e=>{ const b=e.target.closest('.pzs-c'); if(!b || fin) return; const i=+b.dataset.i;
    if(sel==null){ sel=i; sonido('toc'); pinta(); return; }
    if(sel===i){ sel=null; pinta(); return; }
    [perm[sel],perm[i]]=[perm[i],perm[sel]]; sel=null; mov++; sonido('toc'); pinta();
    if(perm.every((v,j)=>v===j)){ fin=true; apuntarJuego('piezas',{a:1, e:Math.max(0,mov-ideal), r:`${L}×${L} en ${mov} cambios`, hecho:mov, ideal, peor:2*ideal+2, tRef:5*ideal, clave:L}); sonido('cromo'); confeti(el); decir(nombreFoto(k));
      setTimeout(()=>cartel(el, `<h2>¡Puzle hecho! 🖼️</h2><p class="nota">En ${mov} cambios (lo mínimo eran ${ideal}). Era: <b>${esc(nombreFoto(k))}</b>.</p>`, [['Otro puzle', nueva]]), 500); } });
  cartel(el, `<h2>Puzle de piezas 🖼️</h2><p class="nota">La foto está desordenada. Cambia las piezas de sitio hasta verla bien.</p>`, [['¡Empezar!', nueva]]);
  return {parar(){ fin=true; }};
}

/* ============ 23 · Parejas de palabras (memoria y lectura) ============ */
function jParejasPal(el){
  let n, fin=false;
  const empezar=()=>{ n=3+nivelJ('parejaspal'); fin=false;
    const ks=fotosJuego(n); const cartas=barajar([...ks.map(k=>({k,t:'f'})), ...ks.map(k=>({k,t:'p'}))]);
    el.innerHTML=''; const pon=marcador(el); const g=document.createElement('div'); g.className='parejas pp p'+n; el.appendChild(g);
    let abiertas=[], hechas=0, intentos=0, bloq=false; pon(`Parejas: 0 de ${n} · Intentos: 0`);
    cartas.forEach(cd=>{ const b=document.createElement('button'); b.type='button'; b.className='carta-j'; b.dataset.k=cd.k;
      b.innerHTML=`<span class="dorso">?</span><span class="cara">${cd.t==='f'?imgHTML(cd.k):`<b class="pp-pal ${claseTexto()}">${esc(nombreFoto(cd.k))}</b>`}</span>`;
      b.onclick=()=>{ if(bloq || fin || b.classList.contains('abierta')) return; b.classList.add('abierta'); sonido('toc'); abiertas.push(b);
        if(abiertas.length===2){ intentos++; const [x,y]=abiertas; abiertas=[];
          if(x.dataset.k===y.dataset.k){ hechas++; x.classList.add('hecha'); y.classList.add('hecha'); decir(nombreFoto(x.dataset.k));
            if(hechas===n){ fin=true; apuntarJuego('parejaspal',{a:n, e:intentos-n, r:n+' parejas', hecho:intentos, ideal:Math.ceil(1.6*n), peor:Math.ceil(2.5*n), tRef:8*n, clave:n}); sonido('cromo'); confeti(el);
              setTimeout(()=>cartel(el, `<h2>¡Todas las parejas!</h2><p class="nota">En ${intentos} intentos.</p>`, [['Otra vez', empezar]]), 700); } }
          else { bloq=true; setTimeout(()=>{ x.classList.remove('abierta'); y.classList.remove('abierta'); bloq=false; }, 1000); } }
        pon(`Parejas: ${hechas} de ${n} · Intentos: ${intentos}`); };
      g.appendChild(b); }); };
  cartel(el, `<h2>Parejas de palabras 🔤</h2><p class="nota">Unas cartas tienen un dibujo y otras su palabra. ¡Júntalas!</p>`, [['¡Empezar!', empezar]]);
  return {parar(){ fin=true; }};
}

JUEGOS.push(
  {id:'parejaspal', nombre:'Parejas de palabras', emo:'🔤', desc:'Junta cada palabra con su dibujo.', fn:jParejasPal},
  {id:'quefalta', nombre:'¿Qué falta?', emo:'🫣', desc:'Mira, acuérdate y di qué dibujo se ha escondido.', fn:jQueFalta},
  {id:'dondeesta', nombre:'¿Dónde está?', emo:'👀', desc:'Encuentra lo que te digo entre muchos dibujos.', fn:jDondeEsta},
  {id:'diferencias', nombre:'Busca las diferencias', emo:'🔎', desc:'Encuentra lo que ha cambiado.', fn:jDiferencias},
  {id:'numeros', nombre:'Sigue los números', emo:'🔢', desc:'Toca los números en orden, muy rápido.', fn:jNumeros},
  {id:'piezas', nombre:'Puzle de piezas', emo:'🖼️', desc:'Cambia las piezas de sitio hasta ver la foto.', fn:jPiezas}
);

/* ---------- pantalla de juegos: los de pensar (con medalla) y los de divertirse ---------- */
function medallasHoyHTML(id){ const ps=premiosJuegoHoy(id); const q=PREMIOS_JUEGO_DIA-ps.length;
  return `<span class="juego-med">${ps.map(x=>MEDALLA[x.med||''].emo).join('')}${q>0?`<i>${'○'.repeat(q)}</i>`:' <i>hoy ya no da premio</i>'}</span>`; }
definir('juegos', {nav:'juegos', pintar(){
  const p=perfil(), pj=puedeJugar(p), c=premiosCfg(), n=juegosAbiertos(p), fj=faltanParaJuego(p);
  const pensar=JUEGOS_PENSAR.map(id=>JUEGOS.find(j=>j.id===id)).filter(Boolean), divertirse=JUEGOS.filter(j=>!esPensar(j.id));
  const carta=j=>{ const ab=juegoAbierto(j,p);
    return ab ? `<button type="button" class="juego-c" data-j="${j.id}" ${pj.ok?'':'disabled'}><span class="emo-j">${j.emo}</span><b>${esc(j.nombre)}</b><span class="nota">${esc(j.desc)}</span>${esPensar(j.id)?medallasHoyHTML(j.id):''}</button>`
      : `<div class="juego-c bloq"><span class="emo-j">🔒</span><b>${esc(j.nombre)}</b><span class="nota">${fj!=null?(fj===1?'Se abre con 1 ⭐ más':'Se abre con '+fj+' ⭐ más'):'Sigue leyendo para abrirlo'}</span></div>`; };
  $('#s-juegos').innerHTML = `<button class="volver" type="button" data-ir="actividades">${ic('atras')} Actividades</button>
    <div class="pag-cab"><div><h1 class="tit">Juegos</h1><p class="sub">Juegos de pensar: cuanto mejor y más rápido, más premio.</p></div></div>
    ${pj.ok ? (c.minutos>0 && !p.prueba ? `<div class="card aviso-juego"><span>⏱ Hoy te quedan <b>${Math.ceil(quedaJuego(p)/60)} minutos</b> de juego.</span></div>` : '')
      : pj.por==='leer' ? tareasCandadoHTML(p)
      : `<div class="card aviso-juego"><span class="emo-g">🌙</span><div><b>Hoy ya has jugado ${c.minutos} minutos</b><span class="nota">¡Mañana más! Ahora puedes leer otra historia o hacer un dictado.</span></div></div>`}
    <div class="card medallas-expl"><span class="emo-g">🥇</span><div><b>Oro: +1 minuto de tele, +1 minuto de móvil y ⭐</b><span class="nota">Plata y bronce dan un poco menos. Cada juego da premio ${PREMIOS_JUEGO_DIA} veces al día.</span></div></div>
    ${fiestaJ() && typeof juegoFiestaHTML==='function' ? juegoFiestaHTML(fiestaJ()) : ''}
    <h2 class="sec-tit">🧠 Juegos de pensar</h2>
    <div class="juegos-grid">${pensar.map(carta).join('')}</div>
    <h2 class="sec-tit">🎈 Para divertirse <span class="nota">· sin premio</span></h2>
    <div class="juegos-grid">${divertirse.map(carta).join('')}</div>
    ${typeof deportesHTML==='function' ? deportesHTML() : ''}`;
  if(typeof activarJuegoFiesta==='function') activarJuegoFiesta($('#s-juegos'));
  activarTareas($('#s-juegos'));
  $$('#s-juegos [data-j]').forEach(b=>b.onclick=()=>ir('juego', b.dataset.j));
}});
