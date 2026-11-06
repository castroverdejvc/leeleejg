/* LeeLEEJG · ficha de lengua del cole «p, t, d y f» (6/11/2026). La familia mandó dos hojas:
   «Subraya la p y rodea la t» (pantalón, pito, patines, patata) · «Busca en la sopa de letras» (púa, dedo, sofá, fiesta) ·
   «Colorea lo que contiene la t» (calcetines, pintura, peonza, robot, ducha, tambor) · «Repasa y completa con p o d»
   (pelota, diana, diadema, pala) · «Tacha lo que no empieza por la f» (teléfono, fuente, puf, familia, fideos, sofá,
   fantasma, olfato, famoso).
   - La 1.ª vez cada ejercicio es igual que la hoja; «Otro igual» lo cambia (otras letras y palabras).
   - Los dibujos de la hoja son fi_ptdf_<palabra> y van con las imágenes privadas (mis_imagenes); si un aparato aún no
     los tiene, salen las fotos del programa o un dibujito, así que la ficha funciona desde el primer momento.
   - Son trabajos del cole (trabajosLog: ⭐ y minutos de tele); el repaso en ligada es de caligrafía (caliLog). */
'use strict';
const FICHA_PTDF = {id:'ptdf', titulo:'p, t, d y f', emo:'📄', resumen:'Subraya y rodea, sopa de letras, colorea, completa, repasa y tacha.', pasos:[
  {id:'ptdf_letras',  emo:'✏️', t:'Subraya la p y rodea la t'},
  {id:'ptdf_sopa',    emo:'🔎', t:'Sopa de letras'},
  {id:'ptdf_colorea', emo:'🖍️', t:'Colorea lo que contiene la t'},
  {id:'ptdf_completa',emo:'🔤', t:'Completa con p o d'},
  {id:'ptdf_repasa',  emo:'✍️', t:'Repasa: pelota, diana, diadema, pala', cali:'pelota,diana,diadema,pala'},
  {id:'ptdf_tacha',   emo:'❌', t:'Tacha lo que no empieza por f'}
]};
TRABAJOS_COLE.push(
  {id:'ptdf_letras',  emo:'✏️', nombre:'Subraya y rodea', desc:'Subraya una letra y rodea otra.'},
  {id:'ptdf_sopa',    emo:'🔎', nombre:'Sopa de letras', desc:'Busca las palabras.'},
  {id:'ptdf_colorea', emo:'🖍️', nombre:'Colorea los dibujos', desc:'Lo que contiene la letra.'},
  {id:'ptdf_completa',emo:'🔤', nombre:'Completa con dos letras', desc:'Pon la letra que falta.'},
  {id:'ptdf_tacha',   emo:'❌', nombre:'Tacha', desc:'Lo que no empieza por la letra.'});
/* dibujo de una palabra: el de la hoja si está; si no, la foto del programa o un dibujito */
const EMO_PTDF = {pintura:'🎨', robot:'🤖', ducha:'🚿', diana:'🎯', diadema:'👑', pala:'🪏'};
function dibPtdf(k){ const kk='fi_ptdf_'+sinTildeC(k), f=(CONT.palabras||{})[k] || sinTildeC(k); if(MIS[kk]) return imgHTML(kk, true); if(CONT.fotos && CONT.fotos[f]) return imgHTML(f, true); return `<span class="emo">${EMO_PTDF[k]||EMO_COLE[k]||'🖼️'}</span>`; }
const letrasDe = w => [...w].map(c=>sinTildeC(c).toLowerCase());
/* palabras sencillas y concretas para los ejercicios nuevos (las de «Otro igual»): solo cosas que un niño de 6 años
   reconoce en un dibujo. Con foto = las que tienen foto en el programa. */
const PAL_PTDF = ('gato perro pato pez oso mono vaca rana lobo foca sapo toro tigre león ratón conejo caballo oveja cerdo gallina pollo ballena delfín tortuga serpiente jirafa '+
  'elefante cebra mariposa abeja araña loro búho pingüino tiburón dinosaurio mesa silla casa sofá cama lápiz libro mapa pelota muñeca globo tambor piano guitarra '+
  'flauta campana peonza patines patata tomate pera manzana plátano fresa uva limón naranja sandía melón pan queso leche huevo pizza helado tarta sopa sol luna nube estrella '+
  'árbol flor hoja puente tren barco avión moto coche bici nido dado dedo mano pie ojo boca nariz diente foto faro fuente fideos flecha falda familia fuego fantasma pala '+
  'diana diadema robot ducha pintura calcetines saco sal taza toalla tijeras teléfono botas bolso balón paraguas castillo cohete gafas reloj llave vela piña').split(' ');
function palabrasPtdf(conFoto){ const vistos=new Set(), out=[];
  PAL_PTDF.forEach(p=>{ const k=(CONT.palabras||{})[p] || sinTildeC(p); if(conFoto && !(CONT.fotos && CONT.fotos[k])) return; if(vistos.has(p)) return; vistos.add(p); out.push(p); });
  return out; }

/* ============ Subraya una letra y rodea otra (letra a letra) ============ */
function tPtdfLetras(z){
  let L1='p', L2='t', ws=['pantalón','pito','patines','patata'];
  if(!primeraVezCole('ptdf_letras')){ const pool=palabrasPtdf(false).filter(w=>w.length<=8);
    const pares=[['p','t'],['m','s'],['l','n'],['d','t'],['p','d'],['m','n'],['s','l']].filter(([a,b])=>pool.filter(w=>w.includes(a)||w.includes(b)).length>=4);
    if(pares.length){ [L1,L2]=barajar(pares)[0]; ws=barajar(pool.filter(w=>w.includes(L1)||w.includes(L2))).slice(0,4); } }
  const objetivo=[]; ws.forEach((w,i)=>letrasDe(w).forEach((c,j)=>{ if(c===L1||c===L2) objetivo.push(i+':'+j); }));
  const marcas={}; let herr='sub';
  const pinta=()=>{
    z.innerHTML=ordenHTML(`Subraya la ${L1} y rodea la ${L2}.`)+
      `<div class="botones" style="justify-content:center;margin:6px 0 12px"><button type="button" class="btn btn-g ${herr==='sub'?'btn-p':'btn-borde'}" data-h="sub">✏️ Subrayar la <span class="cole-lig">${L1}</span></button><button type="button" class="btn btn-g ${herr==='rod'?'btn-p':'btn-borde'}" data-h="rod">⭕ Rodear la <span class="cole-lig">${L2}</span></button></div>
      <div class="ptdf-pals">${ws.map((w,i)=>`<div class="ptdf-pal cole-lig">${[...w].map((c,j)=>{ const m=marcas[i+':'+j]; return `<span class="ptdf-l${m?' '+m:''}" data-k="${i}:${j}">${esc(c)}</span>`; }).join('')}</div>`).join('')}</div>
      <p class="nota centro">Elige arriba si subrayas o rodeas y toca las letras.</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    $$('[data-h]', z).forEach(b=>b.onclick=()=>{ herr=b.dataset.h; sonido('toc'); pinta(); });
    $$('.ptdf-l', z).forEach(b=>b.onclick=()=>{ const k=b.dataset.k; if(marcas[k]) return; const [i,j]=k.split(':').map(Number), c=letrasDe(ws[i])[j];
      if(c===L1 && herr==='sub' || c===L2 && herr==='rod'){ marcas[k]=herr; bienT(); pinta();
        if(objetivo.every(x=>marcas[x])) setTimeout(()=>{ decir('¡Muy bien! '+ws.join(', ')+'.'); setTimeout(terminarTrabajo, 1500); }, 500); }
      else if(c===L1) malT(b, `La ${L1} se subraya. Toca «Subrayar».`);
      else if(c===L2) malT(b, `La ${L2} se rodea. Toca «Rodear».`);
      else malT(b, `Esa letra es la ${c}. Busca la ${herr==='sub'?L1:L2}.`); });
  };
  pinta();
}

/* ============ Sopa de letras ============ */
const SOPA_HOJA = {ws:['púa','dedo','sofá','fiesta'], g:['SLSNLP','OEDAUU','FIESTA','ALDEFI','ULOSAM']};
function hacerSopa(ws, F=5, C=6){
  for(let intento=0; intento<200; intento++){
    const g=Array.from({length:F},()=>Array(C).fill('')); let ok=true;
    for(const w of ws){ const W=sinTildeC(w).toUpperCase(); let puesto=false;
      for(let t=0; t<60 && !puesto; t++){ const hor=W.length>F ? true : W.length>C ? false : Math.random()<.5;
        if(hor ? W.length>C : W.length>F) break;
        const f=Math.floor(Math.random()*(hor?F:F-W.length+1)), c=Math.floor(Math.random()*(hor?C-W.length+1:C));
        const celdas=[...W].map((_,i)=>hor?[f,c+i]:[f+i,c]);
        if(celdas.every(([a,b],i)=>g[a][b]==='' || g[a][b]===W[i])){ celdas.forEach(([a,b],i)=>g[a][b]=W[i]); puesto=true; } }
      if(!puesto){ ok=false; break; } }
    if(!ok) continue;
    const ABC='ABCDEFGILMNOPRSTU';
    return g.map(r=>r.map(x=>x||ABC[Math.floor(Math.random()*ABC.length)]).join(''));
  }
  return null;
}
function tPtdfSopa(z){
  let ws=SOPA_HOJA.ws, g=SOPA_HOJA.g;
  if(!primeraVezCole('ptdf_sopa')){ const pool=palabrasPtdf(false).filter(w=>w.length<=6 && !/[ñ]/.test(w));
    for(let t=0;t<20;t++){ const cand=barajar(pool).slice(0,4); const gg=hacerSopa(cand); if(gg){ ws=cand; g=gg; break; } } }
  const F=g.length, C=g[0].length, hallada={}; const colores=['#FDE68A','#BBF7D0','#BFDBFE','#FBCFE8'];
  let ini=null, arr=null;
  const linea=(a,b)=>{ const [f1,c1]=a, [f2,c2]=b; if(f1!==f2 && c1!==c2) return null; const n=Math.max(Math.abs(f2-f1),Math.abs(c2-c1));
    const df=Math.sign(f2-f1), dc=Math.sign(c2-c1); return Array.from({length:n+1},(_,i)=>[f1+df*i, c1+dc*i]); };
  const marcadas=()=>{ const m={}; Object.entries(hallada).forEach(([w,cs])=>cs.forEach(([a,b])=>m[a+':'+b]=colores[ws.indexOf(w)%4])); return m; };
  const pinta=()=>{ const m=marcadas();
    z.innerHTML=ordenHTML('Busca en la sopa de letras.')+
      `<div class="sopa-pals">${ws.map(w=>`<span class="sopa-w cole-lig${hallada[w]?' hallada':''}" style="${hallada[w]?'background:'+colores[ws.indexOf(w)%4]:''}">${esc(w)}</span>`).join('')}</div>
      <div class="sopa" style="grid-template-columns:repeat(${C},1fr)">${g.flatMap((r,f)=>[...r].map((ch,c)=>`<span class="sopa-c${ini&&ini[0]===f&&ini[1]===c?' ini':''}" data-f="${f}" data-c="${c}" style="${m[f+':'+c]?'background:'+m[f+':'+c]:''}">${ch}</span>`)).join('')}</div>
      <p class="nota centro">Pasa el dedo por encima de la palabra, o toca su primera letra y luego la última.</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    const sopa=$('.sopa', z);
    const celdaEn=e=>{ const el=document.elementFromPoint(e.clientX, e.clientY); return el && el.classList && el.classList.contains('sopa-c') ? [+el.dataset.f, +el.dataset.c] : null; };
    sopa.onpointerdown=e=>{ const c=celdaEn(e); if(!c) return; e.preventDefault(); arr={de:c, a:c}; sopa.setPointerCapture && sopa.setPointerCapture(e.pointerId); };
    sopa.onpointermove=e=>{ if(!arr) return; const c=celdaEn(e); if(!c) return; arr.a=c; const l=linea(arr.de, c);
      $$('.sopa-c', z).forEach(x=>x.classList.toggle('pasa', !!l && l.some(([a,b])=>a===+x.dataset.f && b===+x.dataset.c))); };
    sopa.onpointerup=()=>{ if(!arr) return; const {de,a}=arr; arr=null;
      if(de[0]===a[0] && de[1]===a[1]){ if(!ini){ ini=de; sonido('toc'); pinta(); return; } probar(ini, de); ini=null; return; }
      ini=null; probar(de, a); };
  };
  const probar=(a,b)=>{ const l=linea(a,b); if(!l){ decir('Las palabras van en línea recta: de lado o de arriba abajo.'); pinta(); return; }
    const txt=l.map(([f,c])=>g[f][c]).join(''), rev=[...txt].reverse().join('');
    const w=ws.find(x=>!hallada[x] && [txt,rev].includes(sinTildeC(x).toUpperCase()));
    if(w){ hallada[w]=l; bienT(); decir(w); pinta(); if(ws.every(x=>hallada[x])) setTimeout(()=>{ decir('¡Las has encontrado todas!'); setTimeout(terminarTrabajo, 1200); }, 600); }
    else { pinta(); malT($('.sopa', z), `Ahí pone ${txt.toLowerCase()}. Busca otra vez.`); } };
  pinta();
}

/* ============ Colorea los dibujos que contienen una letra ============ */
function tPtdfColorea(z){
  let L='t', ws=['calcetines','pintura','peonza','robot','ducha','tambor'];
  if(!primeraVezCole('ptdf_colorea')){ const pool=palabrasPtdf(true);
    const ls=['t','p','d','m','l','s','n'].filter(l=>pool.filter(w=>w.includes(l)).length>=3 && pool.filter(w=>!w.includes(l)).length>=3);
    L=barajar(ls)[0]||'t'; ws=barajar([...barajar(pool.filter(w=>w.includes(L))).slice(0,3), ...barajar(pool.filter(w=>!w.includes(L))).slice(0,3)]); }
  const tiene=w=>letrasDe(w).includes(L), hechas=new Set();
  z.innerHTML=ordenHTML(`Colorea lo que contiene la ${L}.`)+
    `<div class="ptdf-dibs">${ws.map((w,i)=>`<div class="ptdf-dib" data-i="${i}"><span class="ft">${dibPtdf(w)}</span><b class="cole-lig ptdf-nom">${esc(w)}</b><button type="button" class="ptdf-oir" data-o="${i}" aria-label="Oír">🔊</button></div>`).join('')}</div>
    <div class="botones" style="justify-content:center;margin-top:10px"><button class="btn btn-p btn-g" type="button" id="coleYa">✅ ¡Ya está!</button></div>
    <p class="nota centro">Toca los dibujos para colorearlos. El altavoz te dice cómo se llaman.</p>`;
  const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
  $$('.ptdf-oir', z).forEach(b=>b.onclick=e=>{ e.stopPropagation(); decir(ws[+b.dataset.o]); });
  $$('.ptdf-dib', z).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(hechas.has(i)) return;
    if(tiene(ws[i])){ hechas.add(i); b.classList.add('coloreada'); bienT(); decir(ws[i]);
      if(ws.every((w,j)=>!tiene(w)||hechas.has(j))) setTimeout(()=>{ decir('¡Los has coloreado todos!'); setTimeout(terminarTrabajo, 1200); }, 600); }
    else malT(b, `${ws[i]}. ¿Tiene la ${L}? Escucha bien.`); });
  $('#coleYa', z).onclick=()=>{ const falta=ws.filter((w,j)=>tiene(w)&&!hechas.has(j)).length; if(falta){ decir(falta===1?'Todavía falta uno.':'Todavía faltan '+falta+'.'); sacudir($('#coleYa', z)); } else terminarTrabajo(); };
}

/* ============ Completa con dos letras (la primera letra de la palabra) ============ */
function tPtdfCompleta(z){
  let par=['p','d'], items=['pelota','diana','diadema','pala'].map(p=>({p, i:0}));
  if(!primeraVezCole('ptdf_completa')){ const ws=palabrasPtdf(true);
    const pares=[['p','d'],['p','t'],['d','t'],['m','n'],['l','s'],['p','b']].filter(pr=>pr.every(l=>ws.some(w=>w[0]===l)) && ws.filter(w=>pr.includes(w[0])).length>=4);
    if(pares.length){ par=barajar(pares)[0]; const a=barajar(ws.filter(w=>w[0]===par[0])).slice(0,2), b=barajar(ws.filter(w=>w[0]===par[1])).slice(0,2);
      items=barajar([...a,...b, ...barajar(ws.filter(w=>par.includes(w[0]) && !a.includes(w) && !b.includes(w)))]).slice(0,4).map(p=>({p, i:0})); } }
  const hechos=new Set(); let sel=0;
  const pinta=()=>{ z.innerHTML=ordenHTML(`Completa con ${par[0]} o ${par[1]}.`)+`<div class="cole-completa">${items.map((it,j)=>`<button type="button" class="cole-cmp${j===sel&&!hechos.has(j)?' sel':''}${hechos.has(j)?' hecho':''}" data-j="${j}"><span class="ft">${dibPtdf(it.p)}</span><span class="cole-lig cole-pauta">${[...it.p].map((c,x)=>x===it.i?`<b class="hueco-c">${hechos.has(j)?esc(c):'_'}</b>`:esc(c)).join('')}</span></button>`).join('')}</div>
      <div class="botones cole-letras" style="justify-content:center">${par.map(l=>`<button type="button" class="btn btn-xl btn-p cole-lig" data-l="${l}">${l}</button>`).join('')}</div>
      <p class="nota centro">Toca un dibujo y luego la letra que falta.</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    $$('.cole-cmp', z).forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; if(hechos.has(j)) return; sel=j; decir(items[j].p); pinta(); });
    $$('[data-l]', z).forEach(b=>b.onclick=()=>{ const it=items[sel]; if(!it || hechos.has(sel)) return;
      if(sinTildeC(it.p[it.i])===b.dataset.l){ hechos.add(sel); bienT(); decir(it.p); const sig=items.findIndex((_,j)=>!hechos.has(j)); if(sig<0){ pinta(); setTimeout(terminarTrabajo, 900); return; } sel=sig; pinta(); }
      else malT(b, `Escucha bien: ${it.p}.`); }); };
  pinta();
}

/* ============ Tacha lo que NO empieza por una letra ============ */
const TACHA_HOJA = {L:'f', ws:['teléfono','fuente','puf','familia','fideos','sofá','fantasma','olfato','famoso']};
function tPtdfTacha(z){
  let L=TACHA_HOJA.L, ws=TACHA_HOJA.ws;
  if(!primeraVezCole('ptdf_tacha')){ const pool=palabrasPtdf(false);
    const ls=['f','p','t','d','m','s','l','c','b'].filter(l=>pool.filter(w=>w[0]===l).length>=5);
    L=barajar(ls)[0]||'f';
    const si=barajar(pool.filter(w=>w[0]===L)).slice(0,5), no=barajar(pool.filter(w=>w[0]!==L && sinTildeC(w).includes(L))).slice(0,4);
    ws=barajar([...si, ...(no.length>=3?no:barajar(pool.filter(w=>w[0]!==L)).slice(0,4))]); }
  const tachar=new Set(ws.map((w,i)=>sinTildeC(w)[0]!==L?i:-1).filter(i=>i>=0)), hechas=new Set();
  z.innerHTML=ordenHTML(`Tacha lo que no empieza por la ${L}.`)+
    `<div class="cole-palabras tacha">${ws.map((w,i)=>`<button type="button" class="cole-p" data-i="${i}"><span class="cole-lig">${esc(w)}</span></button>`).join('')}</div>
    <div class="botones" style="justify-content:center;margin-top:10px"><button class="btn btn-p btn-g" type="button" id="coleYa">✅ ¡Ya está!</button></div>
    <p class="nota centro">Toca las palabras para tacharlas.</p>`;
  const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
  $$('.cole-p', z).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(hechas.has(i)) return;
    if(tachar.has(i)){ hechas.add(i); b.classList.add('tachada'); bienT(); decir(`${ws[i]} no empieza por ${L}.`);
      if([...tachar].every(x=>hechas.has(x))) setTimeout(()=>{ decir('¡Muy bien!'); setTimeout(terminarTrabajo, 1100); }, 900); }
    else malT(b, `${ws[i]} empieza por ${L}. Esa no se tacha.`); });
  $('#coleYa', z).onclick=()=>{ const falta=[...tachar].filter(x=>!hechas.has(x)).length; if(falta){ decir(falta===1?'Todavía falta una.':'Todavía faltan '+falta+'.'); sacudir($('#coleYa', z)); } else terminarTrabajo(); };
}

const FUNC_PTDF = {ptdf_letras:tPtdfLetras, ptdf_sopa:tPtdfSopa, ptdf_colorea:tPtdfColorea, ptdf_completa:tPtdfCompleta, ptdf_tacha:tPtdfTacha};
