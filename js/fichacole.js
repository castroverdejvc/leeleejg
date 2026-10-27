/* LeeLEEJG · fichas de lengua del cole hechas en el programa (28/10/2026). La familia mandó la hoja:
   «Repasa» (a e i o u) · «Une lo que corresponde» (empieza por e / por o: elefante, oso, estrella, ojos) ·
   «Subraya las palabras con m» (miel, mamá, soso, ala, mimo, mano) · «Colorea lo que contiene n» (uno, mesa, lino,
   leona, liso, mano, salsa) · «Completa con l o s» (lupa, isla, limón, sofá) · «Repasa y colorea» (lana, sol, mono).
   La 1.ª vez cada ejercicio es igual que la hoja; «Otro igual» lo cambia (otras letras y palabras).
   Los ejercicios son trabajos del cole (trabajosLog: ⭐ y minutos de tele); los de repasar, caligrafía (caliLog). */
'use strict';
const EMO_COLE = {estrella:'⭐', lupa:'🔍', sofa:'🛋️', lana:'🧶', ojos:'👀', palmera:'🌴'};
const FOTO_COLE = {ojos:'ojo', isla:'isla', limon:'limon', elefante:'elefante', oso:'oso', sol:'sol', mono:'mono'};
function dibCole(k){ const f=FOTO_COLE[k]||k; if(CONT.fotos && CONT.fotos[f]) return imgHTML(f, true); return `<span class="emo">${EMO_COLE[k]||(CONT.emoji||{})[f]||'🖼️'}</span>`; }
const sinTildeC = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g,'');
const FICHA_COLE = {id:'vocales_mnls', titulo:'Vocales y m, n, l, s', pasos:[
  {id:'repasa_vocales', emo:'✍️', t:'Repasa a, e, i, o, u', cali:'a,e,i,o,u'},
  {id:'cole_empieza', emo:'🔗', t:'Une: empieza por e / por o'},
  {id:'cole_subraya', emo:'✏️', t:'Subraya las palabras con m'},
  {id:'cole_colorea', emo:'🖍️', t:'Colorea lo que contiene n'},
  {id:'cole_completa', emo:'🔍', t:'Completa con l o s'},
  {id:'repasa_palabras', emo:'✍️', t:'Repasa: lana, sol, mono', cali:'lana,sol,mono'}
]};
const TRABAJOS_COLE = [
  {id:'cole_empieza', emo:'🔗', nombre:'Une lo que corresponde', desc:'¿Por qué letra empieza?'},
  {id:'cole_subraya', emo:'✏️', nombre:'Subraya', desc:'Las palabras que tienen la letra.'},
  {id:'cole_colorea', emo:'🖍️', nombre:'Colorea', desc:'Lo que contiene la letra.'},
  {id:'cole_completa', emo:'🔍', nombre:'Completa', desc:'Pon la letra que falta.'}
];
const primeraVezCole = t => !(cfgDe(perfil()).trabajosLog||[]).some(x=>x.t===t);
const hechoHoyCole = paso => { const c=cfgDe(perfil()), hoy=claveDia(new Date());
  if(paso.cali) return (c.caliLog||[]).some(x=>claveDia(x.f)===hoy && (x.items||[]).map(i=>i.t).join(',')===paso.cali);
  return (c.trabajosLog||[]).some(x=>claveDia(x.f)===hoy && x.t===paso.id); };
/* palabras sencillas con foto (para las variantes) */
function palabrasCole(){ return Object.entries(CONT.palabras||{}).filter(([p,k])=>/^[a-záéíóúñ]{3,7}$/.test(p) && CONT.fotos[k] && sinTildeC(p)===k && !/[kwxy]|qu|gu|ch|ll|rr/.test(p)).map(([p,k])=>({p,k})); }

/* tarjeta en Fichas y en Inicio */
function fichaColeHTML(enInicio){
  const f=FICHA_COLE, hechos=f.pasos.filter(hechoHoyCole).length;
  if(enInicio) return `<button class="acceso ficha-cole-c" type="button" data-ir="repaso"><span class="emo-g">📄</span><span><b>Ficha nueva del cole: ${esc(f.titulo)}</b><span class="nota">Une, subraya, colorea, completa y repasa en ligada. Hoy: ${hechos} de ${f.pasos.length}.</span></span><span class="ir">${ic('dcha')}</span></button>`;
  return `<div class="card bloque ficha-cole"><div><b style="font-size:1.4rem">📄 Ficha del cole: ${esc(f.titulo)}</b><p class="nota">Como la hoja de clase. Cada parte terminada da ⭐ y minutos de tele. Hoy: ${hechos} de ${f.pasos.length}.</p></div>
    <div class="trabajos-grid">${f.pasos.map((p,i)=>`<button type="button" class="trabajo-c${hechoHoyCole(p)?' hecho':''}" data-cole="${i}"><span class="emo-j">${hechoHoyCole(p)?'✅':p.emo}</span><b>${i+1}. ${esc(p.t)}</b></button>`).join('')}</div></div>`;
}
function activarFichaCole(raiz){ $$('[data-cole]', raiz).forEach(b=>b.onclick=()=>{ const p=FICHA_COLE.pasos[+b.dataset.cole]; if(p.cali) ir('caligrafia', 'lista:'+p.cali); else ir('trabajo', p.id); }); }

/* ============ Une lo que corresponde: empieza por … ============ */
function tColeEmpieza(z){
  let L1='e', L2='o', items;
  if(primeraVezCole('cole_empieza')) items=[{k:'elefante',p:'elefante'},{k:'oso',p:'oso'},{k:'estrella',p:'estrella'},{k:'ojos',p:'ojos'}];
  else { const ws=palabrasCole(); const voc=['a','e','i','o','u'].filter(v=>ws.filter(w=>sinTildeC(w.p)[0]===v).length>=2);
    [L1,L2]=barajar(voc).slice(0,2); items=barajar([...barajar(ws.filter(w=>sinTildeC(w.p)[0]===L1)).slice(0,2), ...barajar(ws.filter(w=>sinTildeC(w.p)[0]===L2)).slice(0,2)]); }
  if(primeraVezCole('cole_empieza')) items=barajar(items);
  const hechos=new Set(); let sel=null;
  z.innerHTML=ordenHTML('Une lo que corresponde.')+`<div class="cole-une"><div class="cole-cajas">${[L1,L2].map(l=>`<button type="button" class="cole-caja" data-l="${l}"><span class="cole-lig">empieza por ${l}</span><i class="rel-punto"></i></button>`).join('')}</div>
    <div class="cole-dibs">${items.map((it,i)=>`<button type="button" class="cole-dib" data-i="${i}"><i class="rel-punto"></i><span class="ft">${dibCole(it.k)}</span><b class="cole-lig">${esc(it.p)}</b></button>`).join('')}</div></div>
    <p class="nota centro">Toca un dibujo y luego «empieza por…». Escucha: el dibujo te dice su nombre.</p>`;
  $$('.cole-dib', z).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(hechos.has(i)) return; sel=i; $$('.cole-dib', z).forEach(x=>x.classList.toggle('sel', x===b)); decir(items[i].p); });
  $$('.cole-caja', z).forEach(b=>b.onclick=()=>{ if(sel==null){ decir('Primero toca un dibujo.'); return; }
    const it=items[sel], d=$(`.cole-dib[data-i="${sel}"]`, z);
    if(sinTildeC(it.p)[0]===b.dataset.l){ hechos.add(sel); d.classList.remove('sel'); d.classList.add('hecho'); d.querySelector('.ft').insertAdjacentHTML('beforeend', `<span class="cole-marca">${b.dataset.l}</span>`); bienT(); decir(`${it.p} empieza por ${b.dataset.l}.`); sel=null;
      if(hechos.size===items.length) setTimeout(terminarTrabajo, 900); }
    else malT(d, `Escucha: ${it.p}. ¿Empieza por ${b.dataset.l}?`); });
}
/* ============ Subraya / Colorea las palabras que tienen una letra ============ */
function tColeBusca(z, modo){
  const t='cole_'+modo; let L, ws;
  if(primeraVezCole(t)) { if(modo==='subraya'){ L='m'; ws=['miel','mamá','soso','ala','mimo','mano']; } else { L='n'; ws=['uno','mesa','lino','leona','liso','mano','salsa']; } }
  else { const pool=palabrasCole().map(w=>w.p); L=barajar(['m','n','l','s','p','t','d'])[0];
    ws=barajar([...barajar(pool.filter(w=>w.includes(L))).slice(0,3), ...barajar(pool.filter(w=>!w.includes(L))).slice(0,3)]); }
  const buenas=new Set(ws.map((w,i)=>w.includes(L)?i:-1).filter(i=>i>=0)), hechas=new Set();
  const orden = modo==='subraya' ? `Subraya las palabras con ${L}.` : `Colorea lo que contiene ${L}.`;
  z.innerHTML=ordenHTML(orden)+`<div class="cole-palabras ${modo}">${ws.map((w,i)=>`<button type="button" class="cole-p" data-i="${i}"><span class="cole-lig">${esc(w)}</span></button>`).join('')}</div>
    <div class="botones" style="justify-content:center;margin-top:10px"><button class="btn btn-p btn-g" type="button" id="coleYa">✅ ¡Ya está!</button></div>
    <p class="nota centro">${modo==='subraya'?'Toca las palabras para subrayarlas.':'Toca las palabras para colorearlas.'} Toca el altavoz si quieres oírlas.</p>`;
  $$('.cole-p', z).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i;
    if(hechas.has(i)){ hechas.delete(i); b.classList.remove('marcada'); sonido('toc'); return; }
    if(buenas.has(i)){ hechas.add(i); b.classList.add('marcada'); bienT(); decir(ws[i]); if([...buenas].every(x=>hechas.has(x))) setTimeout(()=>{ decir('¡Las has encontrado todas!'); setTimeout(terminarTrabajo, 1200); }, 600); }
    else { malT(b, `${ws[i]}. ¿Tiene la ${L}? Mira bien.`); } });
  $('#coleYa', z).onclick=()=>{ const falta=[...buenas].filter(x=>!hechas.has(x)).length; if(falta){ decir(falta===1?'Todavía falta una.':'Todavía faltan '+falta+'.'); sacudir($('#coleYa', z)); } else terminarTrabajo(); };
}
/* ============ Completa con l o s ============ */
function tColeCompleta(z){
  let par=['l','s'], items;
  if(primeraVezCole('cole_completa')) items=[{k:'lupa',p:'lupa',i:0},{k:'isla',p:'isla',i:2},{k:'limon',p:'limón',i:0},{k:'sofa',p:'sofá',i:0}];
  else { par=barajar([['l','s'],['m','n'],['p','t'],['d','t'],['m','p']])[0]; const ws=palabrasCole();
    items=barajar(ws.filter(w=>par.includes(w.p[0]))).slice(0,4).map(w=>({k:w.k, p:w.p, i:0}));
    if(items.length<4){ par=['l','s']; items=[{k:'lupa',p:'lupa',i:0},{k:'isla',p:'isla',i:2},{k:'limon',p:'limón',i:0},{k:'sofa',p:'sofá',i:0}]; } }
  const hechos=new Set(); let sel=0;
  const pinta=()=>{ z.innerHTML=ordenHTML(`Completa con ${par[0]} o ${par[1]}.`)+`<div class="cole-completa">${items.map((it,j)=>`<button type="button" class="cole-cmp${j===sel&&!hechos.has(j)?' sel':''}${hechos.has(j)?' hecho':''}" data-j="${j}"><span class="ft">${dibCole(it.k)}</span><span class="cole-lig cole-pauta">${[...it.p].map((c,x)=>x===it.i?`<b class="hueco-c">${hechos.has(j)?esc(c):'_'}</b>`:esc(c)).join('')}</span></button>`).join('')}</div>
      <div class="botones cole-letras" style="justify-content:center">${par.map(l=>`<button type="button" class="btn btn-xl btn-p cole-lig" data-l="${l}">${l}</button>`).join('')}</div>
      <p class="nota centro">Toca un dibujo y luego la letra que falta.</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    $$('.cole-cmp', z).forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; if(hechos.has(j)) return; sel=j; decir(items[j].p); pinta(); });
    $$('[data-l]', z).forEach(b=>b.onclick=()=>{ const it=items[sel]; if(!it || hechos.has(sel)) return;
      if(sinTildeC(it.p[it.i])===b.dataset.l){ hechos.add(sel); bienT(); decir(it.p); const sig=items.findIndex((_,j)=>!hechos.has(j)); if(sig<0){ pinta(); setTimeout(terminarTrabajo, 900); return; } sel=sig; pinta(); }
      else malT(b, `Escucha bien: ${it.p}.`); }); };
  pinta();
}
