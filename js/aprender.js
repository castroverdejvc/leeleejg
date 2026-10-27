/* LeeLEEJG · «Aprender jugando» (24/10/2026): juegos educativos muy fáciles de jugar, de lectura, matemáticas e inglés.
   Pedido por la familia: «juegos educativos que den premios: ahorcado de letras, Simon says en inglés, veo veo…
   y todas las opciones de aprendizaje de lectura, matemáticas e inglés que se te ocurran».
   - Cada juego son rondas cortas (8 preguntas o 4 palabras): todo se oye, se toca con dibujos grandes y se puede repetir.
   - Cada ronda terminada da ⭐ (⭐⭐ con un 80 % bien o más), como mucho premiosCfg().eduMax ⭐ al día (estrellas.js).
   - Se apunta en cfg.eduLog {f, j, n, bien} (se junta entre aparatos). No gastan los minutos de juego del día.
   - La dificultad de cada juego sube sola si las últimas rondas salen bien. */
'use strict';
const EDU_N = 8;
const quitaTildes = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g,'');
const eligeUno = xs => xs[Math.floor(Math.random()*xs.length)];
const tomar = (xs, n, sin=[]) => barajar(xs.filter(x=>!sin.includes(x))).slice(0,n);

/* palabras con foto (singular, tal como están en el vocabulario): [{p:'gato', k:'gato'}] */
let _palEdu=null;
function palabrasEdu(){
  if(_palEdu) return _palEdu;
  const out=[], vistas=new Set();
  Object.entries(CONT.palabras||{}).forEach(([p,k])=>{ if(!/^[a-záéíóúüñ]+$/.test(p) || !CONT.fotos[k] || quitaTildes(p)!==k || vistas.has(k) || /^portada|_/.test(k)) return; vistas.add(k); out.push({p,k}); });
  return (_palEdu=out);
}
const palabrasLargo = (min, max) => palabrasEdu().filter(x=>x.p.length>=min && x.p.length<=max);
/* dificultad de cada juego (1-3): sube con las rondas que salen bien */
function difEdu(id, p=perfil()){
  const ult=(cfgDe(p).eduLog||[]).filter(x=>x.j===id).slice(-6); let d=1;
  for(let i=0;i<ult.length;i++){ const x=ult[i]; const pc=x.n?x.bien/x.n:0; if(pc>=0.85) d=Math.min(3,d+0.5); else if(pc<0.5) d=Math.max(1,d-0.5); }
  return Math.max(1, Math.min(3, Math.floor(d)));
}
function apuntarEdu(id, n, bien){ try{ const c=cfgDe(perfil()); c.eduLog=(c.eduLog||[]).concat([{f:new Date().toISOString(), j:id, n, bien}]).slice(-1500); guardarAj(); }catch(e){} }
const estrellasEduHoy = (p=perfil()) => estrellasEventos(p).filter(e=>e.tipo==='juego' && claveDia(e.f)===claveDia(new Date())).reduce((a,e)=>a+e.n,0);
const fotoH = k => `<span class="edu-foto">${imgHTML(k)}</span>`;
const BIEN = ['¡Muy bien!','¡Genial!','¡Eso es!','¡Fenomenal!','¡Bravo!','¡Lo has conseguido!'];
const BIEN_EN = ['Well done!','Great!','Super!','Good job!','Excellent!'];
const NL = l => (NOMBRE_LETRA.es[l]||l);

/* ---------- vocabulario en inglés (con foto del programa) ---------- */
const EN_ANIMALES = [['cat','gato','gato'],['dog','perro','perro'],['cow','vaca','vaca'],['horse','caballo','caballo'],['pig','cerdo','cerdo'],['duck','pato','pato'],['fish','pez','pez'],['bird','pájaro','pajaro'],['lion','león','leon'],['elephant','elefante','elefante'],['rabbit','conejo','conejo'],['frog','rana','rana'],['bee','abeja','abeja'],['spider','araña','arana'],['monkey','mono','mono'],['bear','oso','oso'],['tiger','tigre','tigre'],['giraffe','jirafa','jirafa'],['snake','serpiente','serpiente'],['sheep','oveja','oveja'],['chicken','gallina','gallina'],['owl','búho','buho'],['penguin','pingüino','pinguino'],['shark','tiburón','tiburon'],['whale','ballena','ballena']];
const EN_COMIDA = [['apple','manzana','manzana'],['banana','plátano','platano'],['bread','pan','pan'],['milk','leche','leche'],['egg','huevo','huevo'],['cheese','queso','queso'],['orange','naranja','naranja'],['pear','pera','pera'],['strawberry','fresa','fresa'],['grapes','uvas','uvas'],['cake','tarta','tarta'],['pizza','pizza','pizza'],['ice cream','helado','helado'],['water','agua','agua']];
const EN_COSAS = [['ball','balón','balon'],['car','coche','coche'],['house','casa','casa'],['tree','árbol','arbol'],['book','libro','libro'],['sun','sol','sol'],['moon','luna','luna'],['flower','flor','flor'],['boat','barco','barco'],['plane','avión','avion'],['train','tren','tren'],['chair','silla','silla'],['table','mesa','mesa'],['bed','cama','cama'],['door','puerta','puerta'],['window','ventana','ventana'],['clock','reloj','reloj'],['hat','sombrero','sombrero']];
const conFoto = L => L.filter(x=>CONT.fotos[x[2]] || (CONT.emoji||{})[x[2]]);
const EN_COLORES = [['red','rojo','#E5484D'],['blue','azul','#1E7BF2'],['green','verde','#18B47B'],['yellow','amarillo','#F5C400'],['orange','naranja','#FF8A1F'],['purple','morado','#8B5CF6'],['pink','rosa','#FF7FB5'],['brown','marrón','#8B5A2B'],['black','negro','#1F2937'],['white','blanco','#FFFFFF'],['grey','gris','#9CA3AF']];
const EN_NUM = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const EN_CUERPO = [['nose','la nariz','👃'],['eyes','los ojos','👀'],['ears','las orejas','👂'],['mouth','la boca','👄'],['hand','la mano','✋'],['foot','el pie','🦶'],['leg','la pierna','🦵'],['arm','el brazo','💪'],['teeth','los dientes','🦷'],['tongue','la lengua','👅'],['head','la cabeza','🙂'],['hair','el pelo','💇']];

/* ---------- formas ---------- */
const FORMAS_G = {
  'círculo':'<circle cx="50" cy="50" r="40"/>', 'cuadrado':'<rect x="12" y="12" width="76" height="76" rx="4"/>', 'triángulo':'<path d="M50 8L92 88H8z"/>',
  'rectángulo':'<rect x="6" y="26" width="88" height="48" rx="4"/>', 'estrella':'<path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z"/>', 'corazón':'<path d="M50 88C18 64 8 48 8 32a20 20 0 0 1 42-10 20 20 0 0 1 42 10c0 16-10 32-42 56z"/>',
  'rombo':'<path d="M50 6l40 44-40 44-40-44z"/>', 'óvalo':'<ellipse cx="50" cy="50" rx="44" ry="28"/>'
};
const ART_FORMA = {'círculo':'el','cuadrado':'el','triángulo':'el','rectángulo':'el','estrella':'la','corazón':'el','rombo':'el','óvalo':'el'};
const formaSVG = (f, col) => `<svg viewBox="0 0 100 100" class="edu-forma"><g fill="${col}" stroke="rgba(0,0,0,.25)" stroke-width="2">${FORMAS_G[f]}</g></svg>`;

/* ---------- reloj ---------- */
function relojSVG(h, m){
  const ah=((h%12)+m/60)*30, am=m*6; const marcas=Array.from({length:12},(_,i)=>{ const a=i*30*Math.PI/180; return `<text x="${50+36*Math.sin(a)}" y="${54-36*Math.cos(a)}" text-anchor="middle" font-size="10" font-weight="800" fill="#334155">${i||12}</text>`; }).join('');
  return `<svg viewBox="0 0 100 100" class="edu-reloj"><circle cx="50" cy="50" r="47" fill="#fff" stroke="#1E7BF2" stroke-width="4"/>${marcas}
    <line x1="50" y1="50" x2="${50+22*Math.sin(ah*Math.PI/180)}" y2="${50-22*Math.cos(ah*Math.PI/180)}" stroke="#1F2937" stroke-width="5" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${50+32*Math.sin(am*Math.PI/180)}" y2="${50-32*Math.cos(am*Math.PI/180)}" stroke="#E5484D" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="3.5" fill="#1F2937"/></svg>`;
}
const horaTxt = (h, m) => { const n=h===1?'la una':'las '+h; return m===0?`${n} en punto`:m===30?`${n} y media`:m===15?`${n} y cuarto`:`${h===12?'la una':h===0?'la una':(h+1)===1?'la una':'las '+((h%12)+1)} menos cuarto`; };
const capE = s => s.charAt(0).toUpperCase()+s.slice(1);

/* ---------- monedas ---------- */
const monedaH = v => `<span class="moneda m${v}">${v}€</span>`;
function formasDePagar(p, monedas){ // todas las combinaciones (ordenadas de mayor a menor) que suman p
  const out=[]; const rec=(resto, i, acc)=>{ if(resto===0){ out.push(acc.slice()); return; } if(i>=monedas.length || acc.length>8) return; const v=monedas[i]; if(v<=resto){ acc.push(v); rec(resto-v, i, acc); acc.pop(); } rec(resto, i+1, acc); };
  rec(p, 0, []); return out;
}

/* =============== los juegos de preguntas (generadores) =============== */
/* cada generador devuelve {html, voz, lang, ops:[{html, txt?}], ok, dice?(lo que se dice al acertar), opsCls?} */
const GEN = {
  veoveo(d){ const pool=palabrasLargo(3, d>=2?8:6).filter(x=>/^[a-zñ]/.test(quitaTildes(x.p)) && !/^h/.test(x.p));
    const L=eligeUno([...new Set(pool.map(x=>quitaTildes(x.p)[0]))].filter(l=>pool.filter(x=>quitaTildes(x.p)[0]===l).length>=1 && pool.filter(x=>quitaTildes(x.p)[0]!==l).length>=3));
    const buena=eligeUno(pool.filter(x=>quitaTildes(x.p)[0]===L)); const malas=tomar(pool.filter(x=>quitaTildes(x.p)[0]!==L && quitaTildes(x.p)[0]!==quitaTildes(buena.p)[0]), 3);
    const ops=barajar([buena,...malas]);
    return {html:`<div class="edu-gr">🔍 Veo veo… una cosita que empieza por <b class="letra-g">${L.toUpperCase()} ${L}</b></div>`, voz:`Veo, veo… una cosita que empieza por la letra ${NL(L)}.`, ops:ops.map(x=>({html:fotoH(x.k)+(d>=2?'':`<b>${esc(x.p)}</b>`), txt:x.p})), ok:ops.indexOf(buena), dice:`¡${capE(buena.p)}! Empieza por ${NL(L)}.`}; },
  empieza(d){ const x=eligeUno(palabrasLargo(3, d>=2?8:5).filter(x=>/^[a-zñ]/.test(quitaTildes(x.p)) && !/^h/.test(x.p))); const L=quitaTildes(x.p)[0];
    const ops=barajar([L, ...tomar('abcdefgilmnoprstuvz'.split(''), 3, [L])]);
    return {html:`${fotoH(x.k)}<div class="edu-gr">¿Con qué letra empieza?</div>`, voz:`¿Con qué letra empieza ${x.p}?`, ops:ops.map(l=>({html:`<b class="letra-op">${l.toUpperCase()} ${l}</b>`, txt:l})), ok:ops.indexOf(L), dice:`¡Sí! ${capE(x.p)} empieza por ${NL(L)}.`, opsCls:'letras'}; },
  letrafalta(d){ const x=eligeUno(palabrasLargo(3, d+3)); const w=x.p; const pos=Math.floor(Math.random()*w.length); const L=w[pos];
    const parecidas={b:'dpv',d:'bpt',p:'bdq',m:'nñ',n:'mñ',a:'eo',e:'ai',o:'au',u:'oi',i:'ey',l:'rt',r:'l',s:'z',z:'sc',c:'sz',t:'d',g:'jq',j:'g'};
    const malas=[...new Set([...(parecidas[quitaTildes(L)]||''), ...'aeioumspltrn'])].filter(c=>c!==L && c!==quitaTildes(L)); const ops=barajar([L, ...tomar(malas,3)]);
    return {html:`${fotoH(x.k)}<div class="edu-palabra">${[...w].map((c,i)=>i===pos?'<span class="hueco">_</span>':esc(c)).join('')}</div>`, voz:`¿Qué letra falta en ${w}?`, ops:ops.map(l=>({html:`<b class="letra-op">${l}</b>`, txt:l})), ok:ops.indexOf(L), dice:`¡Eso es! ${w}.`, opsCls:'letras'}; },
  leetoca(d){ const pool=palabrasLargo(3, d+4); const buena=eligeUno(pool); const malas=tomar(pool.filter(x=>x.p[0]===buena.p[0] && x!==buena).concat(tomar(pool,6)).filter(x=>x!==buena), 3); const ops=barajar([buena,...[...new Set(malas)].slice(0,3)]);
    return {html:`<div class="edu-palabra grande">${esc(buena.p)}</div><div class="edu-gr">Lee la palabra y toca su dibujo.</div>`, voz:'Lee la palabra y toca su dibujo.', ops:ops.map(x=>({html:fotoH(x.k), txt:x.p})), ok:ops.indexOf(buena), dice:`¡Muy bien! Pone ${buena.p}.`}; },
  rimas(){ const pool=palabrasLargo(3,8); const fin=x=>quitaTildes(x.p).slice(-3); const grupos={}; pool.forEach(x=>{ (grupos[fin(x)]=grupos[fin(x)]||[]).push(x); });
    const conPar=Object.values(grupos).filter(g=>g.length>=2); const g=eligeUno(conPar); const [a,b]=tomar(g,2);
    const malas=tomar(pool.filter(x=>fin(x)!==fin(a) && quitaTildes(x.p).slice(-2)!==quitaTildes(a.p).slice(-2)),3); const ops=barajar([b,...malas]);
    return {html:`${fotoH(a.k)}<div class="edu-gr">¿Qué palabra rima con <b>${esc(a.p)}</b>?</div>`, voz:`¿Qué palabra rima con ${a.p}?`, ops:ops.map(x=>({html:fotoH(x.k)+`<b>${esc(x.p)}</b>`, txt:x.p})), ok:ops.indexOf(b), dice:`¡Sí! ${a.p} y ${b.p} riman.`}; },
  // ---- matemáticas ----
  mayor(d){ const max=[10,20,100][d-1]; const menor=Math.random()<0.3 && d>=2; let ns=new Set(); const k=d===1?2:3; while(ns.size<k) ns.add(1+Math.floor(Math.random()*max)); ns=[...ns];
    const obj=menor?Math.min(...ns):Math.max(...ns); const emo=eligeUno(['🍎','⭐','🐟','⚽','🍓','🚗']);
    return {html:`<div class="edu-gr">¿${d===1?'Dónde hay más':menor?'Cuál es el número más pequeño':'Cuál es el número más grande'}?</div>`, voz: d===1?'¿Dónde hay más?':menor?'¿Cuál es el número más pequeño?':'¿Cuál es el número más grande?',
      ops:ns.map(n=>({html: d===1?`<span class="edu-emos">${emo.repeat(n)}</span><b>${n}</b>`:`<b class="num-g">${n}</b>`, txt:String(n)})), ok:ns.indexOf(obj), dice:`¡Sí! ${obj} es ${menor?'el más pequeño':'el más grande'}.`, opsCls:'nums'}; },
  vecinos(d){ const max=[10,20,100][d-1]; const n=2+Math.floor(Math.random()*(max-2)); const desp=Math.random()<0.5; const r=desp?n+1:n-1;
    const ops=barajar([r, ...tomar([n, desp?n-1:n+1, r+2, r-2, r+10, r-10].filter(x=>x>=0 && x!==r && x<=max+10), 3)]);
    return {html:`<div class="edu-gr">¿Qué número va <b>${desp?'después':'antes'}</b> del <b class="num-g">${n}</b>?</div><div class="recta">${[n-2,n-1,n,n+1,n+2].filter(x=>x>=0).map(x=>`<span class="${x===n?'yo':x===r?'hueco':''}">${x===r?'?':x}</span>`).join('')}</div>`,
      voz:`¿Qué número va ${desp?'después':'antes'} del ${n}?`, ops:ops.map(x=>({html:`<b class="num-g">${x}</b>`, txt:String(x)})), ok:ops.indexOf(r), dice:`¡Eso es! ${desp?`Después del ${n} va el ${r}`:`Antes del ${n} va el ${r}`}.`, opsCls:'nums'}; },
  sumasd(d){ const emo=eligeUno(['🍎','🍓','🐥','⭐','🎈','🍪','🐟']); const resta=d>=2 && Math.random()<0.5; let a,b,r;
    if(resta){ a=3+Math.floor(Math.random()*(d===3?8:6)); b=1+Math.floor(Math.random()*(a-1)); r=a-b; } else { a=1+Math.floor(Math.random()*(d===1?4:6)); b=1+Math.floor(Math.random()*(d===1?4:(10-a))); r=a+b; }
    const vis = resta ? `<span class="edu-emos">${emo.repeat(a-b)}<span class="tachados">${emo.repeat(b)}</span></span>` : `<span class="edu-emos">${emo.repeat(a)}</span><b class="signo">+</b><span class="edu-emos">${emo.repeat(b)}</span>`;
    const ops=barajar([r, ...tomar([r+1,r-1,r+2,r-2].filter(x=>x>=0),3)]);
    return {html:`<div class="edu-cuenta">${vis}</div><div class="edu-gr"><b class="num-g">${a} ${resta?'−':'+'} ${b} = ?</b></div>`, voz:`¿Cuánto es ${a} ${resta?'menos':'más'} ${b}?`, ops:ops.map(x=>({html:`<b class="num-g">${x}</b>`, txt:String(x)})), ok:ops.indexOf(r), dice:`¡Sí! ${a} ${resta?'menos':'más'} ${b} son ${r}.`, opsCls:'nums'}; },
  tienda(d){ const cosas=palabrasEdu().filter(x=>['manzana','platano','pan','helado','pelota','balon','libro','tarta','galleta','queso','fresa','pera','naranja','coche','cometa','caramelo','pastel','chocolate'].includes(x.k)); const c=eligeUno(cosas.length?cosas:palabrasEdu());
    const precio=d===1?2+Math.floor(Math.random()*4):d===2?3+Math.floor(Math.random()*8):6+Math.floor(Math.random()*15); const mon=d===3?[10,5,2,1]:[2,1];
    const formas=formasDePagar(precio, mon).filter(f=>f.length<=6); const buena=eligeUno(formas.length?formas:[[...Array(precio)].map(()=>1)]);
    const malas=[]; let k=0; while(malas.length<3 && k<60){ k++; const base=eligeUno(formasDePagar(precio+(Math.random()<0.5?1:-1)*(1+Math.floor(Math.random()*2)), mon).filter(f=>f.length<=6&&f.length>0)); if(base && !malas.some(m=>m.join()===base.join())) malas.push(base); }
    const ops=barajar([buena, ...malas]);
    return {html:`${fotoH(c.k)}<div class="edu-gr">${esc(capE(c.p))}: <b class="precio">${precio} €</b><br>¿Con qué monedas lo pagas justo?</div>`, voz:`${capE(c.p)} cuesta ${precio} ${precio===1?'euro':'euros'}. ¿Con qué monedas lo pagas justo?`,
      ops:ops.map(f=>({html:`<span class="monedas">${f.map(monedaH).join('')}</span>`, txt:f.join('+')})), ok:ops.indexOf(buena), dice:`¡Justo! ${buena.join(' más ')} son ${precio} euros.`}; },
  reloj(d){ const h=1+Math.floor(Math.random()*12); const mins=d===1?[0]:d===2?[0,30]:[0,30,15,45]; const m=eligeUno(mins); const buena=horaTxt(h,m);
    const otras=new Set(); while(otras.size<3){ const h2=1+Math.floor(Math.random()*12), m2=eligeUno(mins.length>1?mins:[0]); const t=horaTxt(h2,m2); if(t!==buena) otras.add(t); }
    const ops=barajar([buena,...otras]);
    return {html:`${relojSVG(h,m)}<div class="edu-gr">¿Qué hora es?</div>`, voz:'¿Qué hora es?', ops:ops.map(t=>({html:`<b>${capE(t)}</b>`, txt:t})), ok:ops.indexOf(buena), dice:`¡Sí! Son ${buena}.`.replace('Son la una','Es la una'), opsCls:'textos'}; },
  formas(d){ const nombres=Object.keys(FORMAS_G).slice(0, d===1?5:8); const f=eligeUno(nombres); const ops=barajar([f, ...tomar(nombres,3,[f])]); const cols=barajar(['#E5484D','#1E7BF2','#18B47B','#F5C400','#8B5CF6','#FF8A1F']);
    return {html:`<div class="edu-gr">Toca ${ART_FORMA[f]} <b>${f}</b></div>`, voz:`Toca ${ART_FORMA[f]} ${f}.`, ops:ops.map((x,i)=>({html:formaSVG(x, cols[i]), txt:x})), ok:ops.indexOf(f), dice:`¡Sí! ${capE(ART_FORMA[f])} ${f}.`}; },
  // ---- inglés ----
  simon(){ const L=conFoto([...EN_ANIMALES, ...EN_COSAS]); const ops=tomar(L,4); const x=eligeUno(ops); const simon=Math.random()<0.7;
    const orden=`${simon?'Simon says: touch':'Touch'} the ${x[0]}!`;
    return {lang:'en', html:`<div class="edu-gr simon-dice"><span class="simon-lbl">${simon?'🧑‍🏫 Simon says…':'🤫 …'}</span><b lang="en">${esc(orden)}</b></div>`, voz:orden,
      ops:[...ops.map(o=>({html:fotoH(o[2]), txt:o[0]})), {html:'<span class="no-toco">🙅<b>¡No lo toco!</b><small lang="en">Simon didn\'t say!</small></span>', txt:'no'}], ok: simon?ops.indexOf(x):4,
      dice: simon?`${eligeUno(BIEN_EN)} The ${x[0]}.`:`${eligeUno(BIEN_EN)} Simon didn't say!`, diceEs: simon?`${x[0]} es ${x[1]}.`:'¡Simon no lo dijo!', pista:simon?null:'Listen! Did Simon say?', opsCls:'simon-ops'}; },
  colores(d){ const L=EN_COLORES.slice(0, d===1?6:11); const x=eligeUno(L); const ops=barajar([x, ...tomar(L,3,[x])]);
    return {lang:'en', html:`<div class="edu-gr" lang="en">Touch <b>${x[0]}</b></div>`, voz:`Touch ${x[0]}.`, ops:ops.map(o=>({html:`<span class="bola-color" style="background:${o[2]}"></span>`, txt:o[0]})), ok:ops.indexOf(x), dice:`${eligeUno(BIEN_EN)} ${capE(x[0])}!`, diceEs:`${capE(x[0])} es ${x[1]}.`}; },
  numeros(d){ const max=d===1?10:20; const n=1+Math.floor(Math.random()*max); const cuantos=Math.random()<0.4 && n<=10; const ops=barajar([n, ...tomar([...Array(max)].map((_,i)=>i+1),3,[n])]);
    return {lang:'en', html: cuantos?`<span class="edu-emos">${'⭐'.repeat(n)}</span><div class="edu-gr" lang="en">How many stars?</div>`:`<div class="edu-gr" lang="en">Touch number <b>${EN_NUM[n]}</b></div>`, voz: cuantos?'How many stars?':`Touch number ${EN_NUM[n]}.`,
      ops:ops.map(x=>({html:`<b class="num-g">${x}</b>`, txt:String(x)})), ok:ops.indexOf(n), dice:`${eligeUno(BIEN_EN)} ${capE(EN_NUM[n])}!`, diceEs:`${EN_NUM[n]} es ${n}.`, opsCls:'nums'}; },
  animales(){ return GEN._voc(EN_ANIMALES, 'Where is the'); },
  comida(){ return GEN._voc(EN_COMIDA, 'Where is the'); },
  cosas(){ return GEN._voc(EN_COSAS, 'Where is the'); },
  _voc(L0, pre){ const L=conFoto(L0); const x=eligeUno(L); const ops=barajar([x, ...tomar(L,3,[x])]);
    return {lang:'en', html:`<div class="edu-gr" lang="en">${pre} <b>${esc(x[0])}</b>?</div>`, voz:`${pre} ${x[0]}?`, ops:ops.map(o=>({html:fotoH(o[2]), txt:o[0]})), ok:ops.indexOf(x), dice:`${eligeUno(BIEN_EN)} The ${x[0]}!`, diceEs:`${capE(x[0])} es ${x[1]}.`}; },
  cuerpo(){ const x=eligeUno(EN_CUERPO); const ops=barajar([x, ...tomar(EN_CUERPO,3,[x])]);
    return {lang:'en', html:`<div class="edu-gr" lang="en">Touch your <b>${x[0]}</b>!</div>`, voz:`Touch your ${x[0]}!`, ops:ops.map(o=>({html:`<span class="emo-cuerpo">${o[2]}</span>`, txt:o[0]})), ok:ops.indexOf(x), dice:`${eligeUno(BIEN_EN)} Your ${x[0]}!`, diceEs:`${capE(x[0])} es ${x[1]}.`}; }
};

/* =============== motor de las rondas de preguntas =============== */
function rondaEdu(z, def){
  let i=0, bien=0, err=0, item=null, vivo=true, bloqueo=false; const d=difEdu(def.id); const N=def.n||EDU_N;
  const habla = (t, l) => decir(t, l||'es');
  const pinta = () => {
    if(!vivo) return; err=0; bloqueo=false; item=GEN[def.gen](d);
    z.innerHTML = `<div class="edu-prog">${Array.from({length:N},(_,k)=>`<i class="${k<i?'ya':k===i?'ahora':''}"></i>`).join('')}</div>
      <div class="edu-preg">${item.html}<button class="ico-btn edu-oir" type="button" aria-label="Escuchar otra vez">${ic('altavoz')}</button></div>
      <div class="edu-ops n${item.ops.length} ${item.opsCls||''}">${item.ops.map((o,k)=>`<button type="button" class="edu-op" data-k="${k}">${o.html}</button>`).join('')}</div>`;
    $('.edu-oir', z).onclick=()=>habla(item.voz, item.lang);
    $$('.edu-op', z).forEach(b=>b.onclick=()=>toca(+b.dataset.k, b));
    habla(item.voz, item.lang);
  };
  const toca = (k, b) => {
    if(bloqueo || !vivo) return;
    if(k===item.ok){ bloqueo=true; if(!err) bien++; b.classList.add('bien'); sonido('bien');
      const fr=[[item.dice||eligeUno(BIEN), item.lang]].concat(item.diceEs?[[item.diceEs,'es']]:[]);
      decirVarias(fr).then(()=>{ if(!vivo) return; i++; if(i>=N) fin(); else pinta(); });
    } else { err++; b.classList.add('mal'); b.disabled=true; sonido('mal'); habla(item.pista || (item.lang==='en'?'Try again!':'Casi. Prueba otra vez.'), item.lang); }
  };
  const fin = () => finRonda(z, def, N, bien, ()=>{ i=0; bien=0; pinta(); });
  pinta();
  return {parar(){ vivo=false; callar(); }};
}
/* final de una ronda: apunta, enseña las estrellas y ofrece otra */
function finRonda(z, def, n, bien, otra){
  const p=perfil(); const antes=p.prueba?0:estrellasEduHoy(p); apuntarEdu(def.id, n, bien); const despues=p.prueba?0:estrellasEduHoy(p); const gana=despues-antes; const max=+premiosCfg().eduMax||0;
  const pc=n?bien/n:0; sonido('cromo');
  z.innerHTML = `<div class="card edu-fin"><span class="emo-g">${pc>=0.8?'🏆':pc>=0.5?'🎉':'💪'}</span><h2>${pc>=0.8?'¡Fenomenal!':pc>=0.5?'¡Muy bien!':'¡Buen trabajo!'}</h2>
    <p class="sub">${bien} de ${n} a la primera.</p>${typeof esfuerzoHTML==='function'?esfuerzoHTML():''}
    ${gana>0?`<p class="est-gana">${'⭐'.repeat(gana)} +${gana}</p>`:max>0&&!p.prueba?`<p class="nota">Hoy ya has ganado las ${max} ⭐ de «Aprender jugando». ¡Ahora juegas por diversión!</p>`:''}
    <div class="botones"><button class="btn btn-p btn-g" type="button" id="eduOtra">🔁 Otra ronda</button><button class="btn btn-g" type="button" data-ir="aprender">Más juegos</button></div></div>`;
  confeti(z.querySelector('.edu-fin'));
  decir(`${pc>=0.8?'¡Fenomenal!':pc>=0.5?'¡Muy bien!':'¡Buen trabajo!'} ${gana>0?`Has ganado ${gana===1?'una estrella':gana+' estrellas'}.`:''}`);
  $('#eduOtra', z).onclick=otra;
}

/* =============== juegos especiales =============== */
/* Adivina la palabra (ahorcado sin ahorcado: un globo que se desinfla) */
function jAhorcado(z, def){
  const N=4, d=difEdu(def.id); let i=0, bien=0, vivo=true;
  const ronda=()=>{
    if(!vivo) return; const x=eligeUno(palabrasLargo(3, d+3)); const w=x.p; const letras=new Set([...w]); const vistas=new Set(); let fallos=0; const MAXF=6;
    const abc='abcdefghijklmnñopqrstuvwxyzáéíóú'.split('');
    const teclas=d===1 ? barajar([...new Set([...letras, ...tomar(abc.filter(c=>!letras.has(c) && !'áéíóúkwxyñ'.includes(c)), 4)])]) : abc.filter(c=>!'áéíóú'.includes(c)||letras.has(c));
    const pinta=()=>{
      const hecho=[...letras].every(c=>vistas.has(c));
      z.innerHTML=`<div class="edu-prog">${Array.from({length:N},(_,k)=>`<i class="${k<i?'ya':k===i?'ahora':''}"></i>`).join('')}</div>
        <div class="ahorcado"><div class="globo-cont"><span class="globo" style="--t:${1-fallos/MAXF*0.6}">🎈</span><span class="nota">${MAXF-fallos} ${MAXF-fallos===1?'oportunidad':'oportunidades'}</span></div>
          <div>${d<3||fallos>=3?fotoH(x.k):'<span class="edu-foto pista">❓</span>'}<div class="edu-palabra">${[...w].map(c=>vistas.has(c)?`<span class="l">${esc(c)}</span>`:'<span class="l vacia">&nbsp;</span>').join('')}</div></div></div>
        <div class="teclado-edu">${teclas.map(c=>`<button type="button" class="tecla${vistas.has(c)?(letras.has(c)?' bien':' mal'):''}" data-c="${c}" ${vistas.has(c)||hecho||fallos>=MAXF?'disabled':''}>${c}</button>`).join('')}</div>
        <div class="botones"><button class="btn btn-mini" type="button" id="ahOir">${ic('altavoz')} Pista</button></div>`;
      $$('.tecla', z).forEach(b=>b.onclick=()=>{ const c=b.dataset.c; vistas.add(c);
        if(letras.has(c)){ sonido('bien'); decir(NL(c)); } else { fallos++; sonido('mal'); decir(`La ${NL(c)} no está.`); }
        pinta();
        if([...letras].every(l=>vistas.has(l))){ if(fallos<MAXF) bien++; decir(`¡Muy bien! ${w}.`).then(()=>{ if(!vivo) return; i++; if(i>=N) finRonda(z, def, N, bien, ()=>{ i=0; bien=0; ronda(); }); else ronda(); }); }
        else if(fallos>=MAXF){ letras.forEach(l=>vistas.add(l)); pinta(); decir(`¡Uy! Era ${w}.`).then(()=>{ if(!vivo) return; i++; if(i>=N) finRonda(z, def, N, bien, ()=>{ i=0; bien=0; ronda(); }); else ronda(); }); } });
      const o=$('#ahOir', z); if(o) o.onclick=()=>decir(`Es una palabra de ${w.length} letras. ${d<3?'Mira el dibujo.':''}`);
    };
    pinta(); decir(`Adivina la palabra. Tiene ${w.length} letras. Toca las letras.`);
  };
  ronda(); return {parar(){ vivo=false; callar(); }};
}
/* construir una palabra tocando piezas en orden (sílabas o letras) */
function jConstruir(z, def, modo){
  const N=4, d=difEdu(def.id); let i=0, bien=0, vivo=true;
  const ronda=()=>{
    if(!vivo) return;
    const pool = modo==='silabas' ? palabrasLargo(4, 9).filter(x=>{ const s=silabear(x.p); return s.length>=2 && s.length<=(d+1); }) : palabrasLargo(3, d+3);
    const x=eligeUno(pool); const piezas = modo==='silabas' ? silabear(x.p) : [...x.p];
    const extras = modo==='silabas' ? tomar(palabrasLargo(4,8).flatMap(y=>silabear(y.p)).filter(s=>!piezas.includes(s)), d) : tomar('aeioumspltrn'.split('').filter(c=>!piezas.includes(c)), d-1);
    const fichas=barajar([...piezas, ...extras].map((t,k)=>({t,k}))); let puestas=[], err=0;
    const pinta=()=>{
      z.innerHTML=`<div class="edu-prog">${Array.from({length:N},(_,k)=>`<i class="${k<i?'ya':k===i?'ahora':''}"></i>`).join('')}</div>
        <div class="edu-preg">${fotoH(x.k)}<div class="edu-gr">${modo==='silabas'?'Junta las sílabas':'Ordena las letras'}</div><button class="ico-btn edu-oir" type="button" aria-label="Escuchar">${ic('altavoz')}</button></div>
        <div class="huecos ${modo}">${piezas.map((_,k)=>`<span class="hueco-p${k<puestas.length?' lleno':''}">${k<puestas.length?esc(puestas[k]):''}</span>`).join('')}</div>
        <div class="fichas-p">${fichas.map(f=>`<button type="button" class="ficha-p ${modo}" data-k="${f.k}" ${f.usada?'disabled':''}>${esc(f.t)}</button>`).join('')}</div>`;
      $('.edu-oir', z).onclick=()=>decir(x.p);
      $$('.ficha-p', z).forEach(b=>b.onclick=()=>{ const f=fichas.find(y=>y.k===+b.dataset.k); if(!f || f.usada) return;
        if(f.t===piezas[puestas.length]){ f.usada=true; puestas.push(f.t); sonido('toc'); decir(f.t);
          if(puestas.length===piezas.length){ pinta(); if(!err) bien++; sonido('bien'); decir(`¡Muy bien! ${x.p}.`).then(()=>{ if(!vivo) return; i++; if(i>=N) finRonda(z, def, N, bien, ()=>{ i=0; bien=0; ronda(); }); else ronda(); }); return; }
          pinta(); }
        else { err++; sonido('mal'); b.classList.add('mal'); setTimeout(()=>b.classList.remove('mal'), 500); decir(modo==='silabas'?'Esa no va ahí. Escucha: '+x.p:'Esa letra no va ahí.'); } });
    };
    pinta(); decir(`${modo==='silabas'?'Junta las sílabas para escribir':'Ordena las letras para escribir'} ${x.p}.`);
  };
  ronda(); return {parar(){ vivo=false; callar(); }};
}
/* parejas en inglés: une cada palabra con su dibujo */
function jParejasEn(z, def){
  let vivo=true, ronda0=0;
  const ronda=()=>{
    if(!vivo) return; const L=tomar(conFoto([...EN_ANIMALES, ...EN_COMIDA, ...EN_COSAS]), 4); let sel=null, hechas=0, err=0;
    const pal=barajar(L), dib=barajar(L);
    const pinta=()=>{
      z.innerHTML=`<div class="edu-gr" lang="en">Match the words and the pictures!</div><div class="parejas-en"><div class="col">${pal.map(x=>`<button type="button" class="pe-p${x.ok?' hecho':''}${sel===x?' sel':''}" data-p="${esc(x[0])}" ${x.ok?'disabled':''} lang="en">${esc(x[0])}</button>`).join('')}</div>
        <div class="col">${dib.map(x=>`<button type="button" class="pe-d${x.ok?' hecho':''}" data-d="${esc(x[0])}" ${x.ok?'disabled':''}>${fotoH(x[2])}</button>`).join('')}</div></div>`;
      $$('.pe-p', z).forEach(b=>b.onclick=()=>{ sel=L.find(x=>x[0]===b.dataset.p); decir(sel[0],'en'); pinta(); });
      $$('.pe-d', z).forEach(b=>b.onclick=()=>{ if(!sel){ decir('Primero toca una palabra.'); return; } const x=L.find(y=>y[0]===b.dataset.d);
        if(x===sel){ x.ok=true; hechas++; sel=null; sonido('bien'); decirVarias([[`${x[0]}!`,'en'],[`${x[1]}.`,'es']]); pinta();
          if(hechas===L.length) setTimeout(()=>{ if(vivo) finRonda(z, def, L.length, Math.max(0, L.length-err), ()=>{ ronda0++; ronda(); }); }, 1200); }
        else { err++; sonido('mal'); b.classList.add('mal'); setTimeout(()=>b.classList.remove('mal'),500); decir('Try again!','en'); } });
    };
    pinta(); decir('Match the words and the pictures!','en');
  };
  ronda(); return {parar(){ vivo=false; callar(); }};
}

/* =============== catálogo =============== */
const APRENDER = [
  {area:'lectura', id:'ahorcado', nombre:'Adivina la palabra', emo:'🎈', desc:'Toca letras hasta descubrir la palabra.', fn:jAhorcado},
  {area:'lectura', id:'veoveo', nombre:'Veo veo', emo:'🔍', desc:'¿Qué cosa empieza por esa letra?', gen:'veoveo'},
  {area:'lectura', id:'empieza', nombre:'¿Con qué letra empieza?', emo:'🔤', desc:'Mira el dibujo y toca su primera letra.', gen:'empieza'},
  {area:'lectura', id:'letrafalta', nombre:'La letra que falta', emo:'🧩', desc:'Completa la palabra.', gen:'letrafalta'},
  {area:'lectura', id:'silabas', nombre:'Junta las sílabas', emo:'🧱', desc:'Ponlas en orden y forma la palabra.', fn:(z,d)=>jConstruir(z,d,'silabas')},
  {area:'lectura', id:'ordena', nombre:'Ordena las letras', emo:'🔀', desc:'Escribe la palabra del dibujo.', fn:(z,d)=>jConstruir(z,d,'letras')},
  {area:'lectura', id:'leetoca', nombre:'Lee y toca', emo:'👆', desc:'Lee la palabra y toca su dibujo.', gen:'leetoca'},
  {area:'lectura', id:'rimas', nombre:'Palabras que riman', emo:'🎵', desc:'Gato… pato. ¿Cuál suena igual al final?', gen:'rimas'},
  {area:'mates', id:'sumasd', nombre:'Sumas con dibujos', emo:'🍎', desc:'Cuenta y suma (o resta).', gen:'sumasd'},
  {area:'mates', id:'mayor', nombre:'¿Cuál es más?', emo:'⚖️', desc:'Encuentra el número más grande o más pequeño.', gen:'mayor'},
  {area:'mates', id:'vecinos', nombre:'Antes y después', emo:'🔢', desc:'¿Qué número va antes? ¿Y después?', gen:'vecinos'},
  {area:'mates', id:'tienda', nombre:'La tienda', emo:'🛒', desc:'Paga justo con las monedas.', gen:'tienda'},
  {area:'mates', id:'reloj', nombre:'¿Qué hora es?', emo:'⏰', desc:'Las horas en punto y las medias.', gen:'reloj'},
  {area:'mates', id:'formas', nombre:'Las formas', emo:'🔺', desc:'Círculo, cuadrado, triángulo…', gen:'formas'},
  {area:'ingles', id:'simon', nombre:'Simon says', emo:'🧑‍🏫', desc:'Toca solo si «Simon says»…', gen:'simon'},
  {area:'ingles', id:'colores', nombre:'Colours', emo:'🎨', desc:'Red, blue, green… ¡toca el color!', gen:'colores'},
  {area:'ingles', id:'numeros', nombre:'Numbers', emo:'🔟', desc:'One, two, three… hasta twenty.', gen:'numeros'},
  {area:'ingles', id:'animales', nombre:'Animals', emo:'🐶', desc:'Where is the cat?', gen:'animales'},
  {area:'ingles', id:'comida', nombre:'Food', emo:'🍕', desc:'Apple, bread, cheese…', gen:'comida'},
  {area:'ingles', id:'cosas', nombre:'Things', emo:'🏠', desc:'House, car, ball, book…', gen:'cosas'},
  {area:'ingles', id:'cuerpo', nombre:'My body', emo:'👃', desc:'Touch your nose!', gen:'cuerpo'},
  {area:'ingles', id:'parejasen', nombre:'Match it!', emo:'🃏', desc:'Une cada palabra con su dibujo.', fn:jParejasEn}
];
const AREAS_EDU = [['lectura','📖 Lectura','#1E7BF2'],['mates','🔢 Matemáticas','#F59E0B'],['ingles','🇬🇧 Inglés','#E11D48']];

definir('aprender', {nav:'juegos', pintar(){
  const p=perfil(), max=+premiosCfg().eduMax||0, hoy=p.prueba?0:estrellasEduHoy(p);
  const log=cfgDe(p).eduLog||[]; const jugado=id=>log.filter(x=>x.j===id).length;
  $('#s-aprender').innerHTML = `<button class="volver" type="button" data-ir="juegos">${ic('atras')} Juegos</button>
  <div class="album-cab"><div><h1 class="tit">🧩 Aprender jugando</h1><p class="sub">Juegos de leer, de números y de inglés. Cada ronda terminada te da ⭐${max?` (hoy llevas ${hoy} de ${max})`:''}.</p></div></div>
  ${AREAS_EDU.map(([a,t,col])=>`<h2 class="sec-extra" style="color:${col}">${t}</h2>${a==='ingles' && typeof spellitInicioHTML==='function' ? spellitInicioHTML() : ''}<div class="juegos-grid edu-grid">${APRENDER.filter(j=>j.area===a).map(j=>`<button type="button" class="juego-c edu-c" data-e="${j.id}" style="--ec:${col}"><span class="emo-j">${j.emo}</span><b>${esc(j.nombre)}</b><span class="nota">${esc(j.desc)}</span>${jugado(j.id)?`<span class="pill">${jugado(j.id)} ${jugado(j.id)===1?'ronda':'rondas'}</span>`:''}</button>`).join('')}</div>`).join('')}`;
  $$('#s-aprender [data-e]').forEach(b=>b.onclick=()=>ir('aprende', b.dataset.e));
  decir('Aprender jugando. Elige un juego.');
}});
let eduVivo=null;
definir('aprende', {nav:'juegos', pintar(id){
  const j=APRENDER.find(x=>x.id===id); if(!j){ ir('aprender'); return; }
  $('#s-aprende').innerHTML = `<div class="juego-cab"><button class="volver" type="button" data-ir="aprender">${ic('atras')} Aprender jugando</button><h1 class="tit">${j.emo} ${esc(j.nombre)}</h1></div><div class="edu-zona" id="eduZona"></div>`;
  const z=$('#eduZona'); if(eduVivo){ try{ eduVivo.parar(); }catch(e){} }
  eduVivo = j.fn ? j.fn(z, j) : rondaEdu(z, j);
}, salir(){ if(eduVivo){ try{ eduVivo.parar(); }catch(e){} eduVivo=null; } }});

/* tarjeta para Inicio y Juegos */
function aprenderHTML(){
  const p=perfil(), max=+premiosCfg().eduMax||0, hoy=p.prueba?0:estrellasEduHoy(p);
  return `<button class="acceso aprender-c" type="button" data-ir="aprender"><span class="emo-g">🧩</span><span><b>Aprender jugando</b><span class="nota">Adivina la palabra, Veo veo, la tienda, Simon says… ${max?(hoy>=max?'¡Hoy ya tienes tus ⭐!':`Gana hasta ${max-hoy} ⭐ más hoy.`):''}</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
