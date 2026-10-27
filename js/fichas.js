/* LeeLEEJG · fichas de clase: repaso diario en el idioma de la ficha (inglés, gallego o castellano) */
'use strict';
let FICHAS=[];
const IDIOMAS={en:{nombre:'Inglés', propio:'English', bandera:'🇬🇧'}, gl:{nombre:'Gallego', propio:'Galego', bandera:'🟦'}, es:{nombre:'Castellano', propio:'Castellano', bandera:'🇪🇸'}};
/* frases que dice el programa en cada idioma */
const FRASE={
  toca:{en:x=>`Touch: ${x}.`, gl:x=>`Toca: ${x}.`, es:x=>`Toca: ${x}.`},
  bien:{en:['Very good!','Great!','Well done!','Yes!'], gl:['Moi ben!','Xenial!','Iso é!'], es:['¡Muy bien!','¡Genial!','¡Eso es!']},
  otra:{en:'Try again.', gl:'Proba outra vez.', es:'Prueba otra vez.'},
  es:{en:x=>`It's ${x}.`, gl:x=>`É ${x}.`, es:x=>`Es ${x}.`},
  repite:{en:x=>`Say: ${x}.`, gl:x=>`Di: ${x}.`, es:x=>`Di: ${x}.`},
  queEs:{es:'¿Qué es esto?', gl:'Que é isto?', en:'What is this?'}
};
const fraseBien = l => { const a=FRASE.bien[l]||FRASE.bien.es; return a[Math.floor(Math.random()*a.length)]; };
async function cargarFichas(){ try{ FICHAS=await api('/api/fichas'); if(!Array.isArray(FICHAS)) FICHAS=[]; }catch(e){ FICHAS=[]; } }
async function guardarFichas(){ aj.fichasMod=Date.now(); guardarAj(); await postJSON('/api/fichas', FICHAS); }
const imgPalabra = (p, grande) => p.img ? imgHTML(p.img, grande) : '<span class="emo">🖼️</span>';
/* 19/10: la familia pidió cambiar las fotos de la ficha «Plants» por las de la hoja nueva coloreada (van con el programa, en fichas/plants/).
   Se hace una sola vez y solo si la ficha sigue con sus fotos de antes; las imágenes antiguas no se borran (se guardan con otro nombre). */
async function actualizarFichasDeSerie(){
  /* Ficha «Plants»: la familia mandó fotos nuevas de la hoja ya coloreada. Las fotos van con las imágenes privadas
     (mis_imagenes, nunca en la web pública: llevan el nombre del niño); aquí solo se cambia a qué foto apunta la ficha.
     Las fotos antiguas no se borran. Se hace una vez (fotosV=2) y la marca de fichas hace que el iPad lo coja. */
  const f=FICHAS.find(x=>x.id==='plants');
  if(!f || (f.fotosV||1)>=2 || !(f.fotos||[]).includes('fi_plants_h1')) return false;
  const pals=f.palabras.filter(p=>/^fi_plants_[a-z]+$/.test(p.img||''));
  const faltan=['fi_plants_h3','fi_plants_h4', ...pals.map(p=>p.img+'_2')].filter(k=>!MIS[k]);
  if(faltan.length) return false;
  pals.forEach(p=>{ p.img=p.img+'_2'; });
  f.fotos=['fi_plants_h3','fi_plants_h4']; f.fotosV=2;
  await guardarFichas(); registrar('Ficha Plants: fotos nuevas de la hoja coloreada'); return true;
}
/* Fichas que la familia manda en foto y se preparan aquí: las imágenes van con las privadas (mis_imagenes, son de la
   editorial y nunca van a la web pública); la ficha se añade sola una vez, cuando están todas sus imágenes.
   Si la familia la borra, no vuelve (aj.fichasSerie apunta las ya añadidas). */
const FICHAS_NUEVAS = [
  {id:'school', titulo:'School things', idioma:'en', frases:true, fotos:['fi_school_h1','fi_school_h2'], creada:'2026-10-20T22:40:00', palabras:[
    ['pencilcase','pencil case','estuche','Pencil case'], ['pencil','pencil','lápiz','Pencil case'], ['pen','pen','bolígrafo','Pencil case'], ['crayon','crayon','cera','Pencil case'],
    ['rubber','rubber','goma','Pencil case'], ['ruler','ruler','regla','Pencil case'], ['sharpener','pencil sharpener','sacapuntas','Pencil case'], ['book','book','libro','Pencil case'],
    ['board','board','pizarra','Classroom'], ['desk','desk','mesa','Classroom'], ['computer','computer','ordenador','Classroom'], ['chair','chair','silla','Classroom']
  ].map(([id,t,es,g])=>({id, t, es, g, img:'fi_school_'+id}))}
];
async function anadirFichasNuevas(){
  aj.fichasSerie=aj.fichasSerie||[]; let n=0;
  for(const f of FICHAS_NUEVAS){
    if(aj.fichasSerie.includes(f.id) || FICHAS.some(x=>x.id===f.id)) continue;
    if([...f.fotos, ...f.palabras.map(p=>p.img)].some(k=>!MIS[k])) continue;
    FICHAS.push(JSON.parse(JSON.stringify({...f, activa:true}))); aj.fichasSerie.push(f.id); n++;
    registrar('Ficha nueva: '+f.titulo);
  }
  if(n) await guardarFichas(); return n;
}
const articulo = t => /^[aeiou]/i.test(t) ? 'an' : 'a';
const esLo = (f,p,l) => f.frases && l==='en' ? `It's ${articulo(p.t)} ${p.t}.` : FRASE.es[l](p.t);

/* ---------- repaso espaciado (cajas de Leitner) ---------- */
const DIAS_CAJA=[0,1,2,4,7,14];
const hoyISO = () => claveDia(new Date());
const masDias = n => { const d=new Date(); d.setDate(d.getDate()+n); return claveDia(d); };
function estadoPal(f,p){ aj.repaso=aj.repaso||{}; return aj.repaso[f.id+':'+p.id]; }
function anotar(f,p,ok){
  aj.repaso=aj.repaso||{}; const k=f.id+':'+p.id; const e=aj.repaso[k]||{c:0,ok:0,ko:0};
  if(ok){ e.ok++; e.c=Math.min(DIAS_CAJA.length-1, e.c+1); } else { e.ko++; e.c=0; }
  e.p=masDias(DIAS_CAJA[e.c]); e.u=hoyISO(); aj.repaso[k]=e; guardarAj();
}
const aprendida = (f,p) => { const e=estadoPal(f,p); return e && e.c>=3; };
function pendientesHoy(fichaId){
  const hoy=hoyISO(), out=[];
  FICHAS.filter(f=>f.activa!==false && (!fichaId || f.id===fichaId)).forEach(f=>f.palabras.forEach(p=>{ const e=estadoPal(f,p); if(!e || e.p<=hoy) out.push({f,p,e, pri: !e?1:(e.c===0?0:2)}); }));
  return out.sort((a,b)=>a.pri-b.pri || Math.random()-.5);
}

/* ---------- pantalla: fichas de clase (niño) ---------- */
definir('repaso', {nav:'repaso', pintar(){
  const pend=pendientesHoy(); const n=Math.min(10,pend.length);
  $('#s-repaso').innerHTML = `<div class="pag-cab"><div><h1 class="tit">Fichas y dictado</h1><p class="sub">Repasa las palabras que has aprendido en el cole y practica cómo se escriben.</p></div></div>
  ${FICHAS.length ? `<div class="card bloque repaso-hoy"><div><b style="font-size:1.4rem">${n?`Repaso de hoy: ${n} ${n===1?'palabra':'palabras'}`:'¡Hoy ya lo has repasado todo!'}</b><p class="nota">${n?'Escucha, toca la foto correcta y di cómo se dice.':'Puedes volver a repasar si quieres.'}</p></div>
    <button class="btn btn-p btn-xl" type="button" id="btnRepasoHoy">${n?'Empezar':'Repasar otra vez'} ${ic('flecha')}</button></div>
  <div class="fichas-grid">${FICHAS.filter(f=>f.activa!==false).map(f=>{ const tot=f.palabras.length, ap=f.palabras.filter(p=>aprendida(f,p)).length; const id=IDIOMAS[f.idioma]||IDIOMAS.es;
    return `<button type="button" class="ficha-c" data-f="${esc(f.id)}"><span class="ft">${f.fotos&&f.fotos[0]?imgHTML(f.fotos[f.fotos.length-1],true):imgPalabra(f.palabras[0]||{},true)}</span><span class="tx"><span class="chip">${id.bandera} ${id.propio}</span><b>${esc(f.titulo)}</b><span class="nota">${tot} palabras · ${ap} aprendidas</span><span class="barra-t" style="width:100%"><i style="width:${tot?Math.round(100*ap/tot):0}%;background:var(--green)"></i></span></span></button>`; }).join('')}</div>`
  : `<div class="card bloque centro"><p class="sub">Todavía no hay fichas. Papá o mamá pueden añadirlas en <b>Familia y profesorado › Fichas de clase</b>.</p></div>`}
  ${typeof tarjetaDeletreoHTML==='function'?tarjetaDeletreoHTML():''}${tarjetaDictadoHTML()}${typeof tarjetaCaligrafiaHTML==='function'?tarjetaCaligrafiaHTML():''}${typeof tarjetaTrabajosHTML==='function'?tarjetaTrabajosHTML():''}`;
  $('#s-repaso .pag-cab').insertAdjacentHTML('afterend', tarjetaLetrasHTML()); $('#btnLetras').onclick=empezarLetras;
  if(typeof fichaColeHTML==='function'){ $('#s-repaso .pag-cab').insertAdjacentHTML('afterend', fichaColeHTML()); activarFichaCole($('#s-repaso')); }
  if(typeof activarTarjetaTrabajos==='function') activarTarjetaTrabajos($('#s-repaso'));
  if(typeof activarTarjetaCaligrafia==='function') activarTarjetaCaligrafia($('#s-repaso'));
  activarTarjetaDictado($('#s-repaso'));
  if(typeof activarTarjetaDeletreo==='function') activarTarjetaDeletreo($('#s-repaso'));
  if($('#btnRepasoHoy')) $('#btnRepasoHoy').onclick=()=>empezarRepaso(null);
  $$('#s-repaso [data-f]').forEach(b=>b.onclick=()=>empezarRepaso(b.dataset.f));
}});

let rep=null;   // sesión de repaso en curso
function empezarRepaso(fichaId){
  let items=pendientesHoy(fichaId);
  if(!items.length){ items=[]; FICHAS.filter(f=>f.activa!==false && (!fichaId||f.id===fichaId)).forEach(f=>f.palabras.forEach(p=>items.push({f,p,e:estadoPal(f,p)}))); items=barajar(items); }
  items=items.slice(0,10);
  if(!items.length){ ir('repaso'); return; }
  rep={items, i:0, res:[], intentos:0}; ir('repasoitem');
}
const modoDe = it => (!it.e || it.e.c===0) ? 'toca' : (it.f.frases && it.e.c===1) ? 'sino' : 'di';
definir('repasoitem', {nav:'repaso', pintar(){
  const it=rep.items[rep.i]; const f=it.f, p=it.p, l=f.idioma||'es'; const id=IDIOMAS[l]||IDIOMAS.es; it.modo=it.modo||modoDe(it);
  const cab=`<div class="paso-cab"><span class="pill">${id.bandera} ${esc(f.titulo)} · ${id.propio}</span><span class="der">${rep.i+1} de ${rep.items.length}<span class="barra-paso"><i style="width:${Math.round(100*(rep.i+1)/rep.items.length)}%"></i></span></span></div>`;
  rep.intentos=0;
  if(it.modo==='toca'){
    const otros=barajar(FICHAS.filter(x=>x.idioma===f.idioma).flatMap(x=>x.palabras.map(q=>({f:x,p:q}))).filter(o=>o.p.id!==p.id)).slice(0,3);
    it.ops = it.ops || barajar([{f,p,ok:true}, ...otros.map(o=>({...o,ok:false}))]);
    $('#s-repasoitem').innerHTML = `<div class="card preg">${cab}<h2>${esc(FRASE.toca[l](p.t))}</h2><button class="altavoz" type="button" id="rpOir" aria-label="Escuchar">${ic('altavoz')}</button>
      <div class="ops ops4" style="grid-template-columns:repeat(${it.ops.length},minmax(0,1fr))">${it.ops.map((o,i)=>`<button type="button" class="op" data-i="${i}"><span class="ft">${imgPalabra(o.p,true)}</span><b class="et" style="visibility:hidden">${esc(o.p.t)}</b></button>`).join('')}</div>
      <div class="pie-preg" id="rpPie"></div></div>`;
    const oir=()=>decir(FRASE.toca[l](p.t), l);
    $('#rpOir').onclick=oir; setTimeout(oir, 250);
    $$('#s-repasoitem .op').forEach(b=>b.onclick=()=>{ const o=it.ops[+b.dataset.i]; rep.intentos++;
      if(o.ok){ $$('#s-repasoitem .op').forEach(x=>x.disabled=true); b.classList.add('bien'); b.querySelector('.et').style.visibility='visible'; sonido('bien'); decirVarias([[fraseBien(l),l],[p.t,l]]); resultado(rep.intentos===1); }
      else { b.classList.add('mal'); b.disabled=true; b.querySelector('.et').style.visibility='visible'; sonido('mal'); decir(FRASE.otra[l], l);
        if(rep.intentos>=2){ const k=it.ops.findIndex(x=>x.ok); const bb=$(`#s-repasoitem .op[data-i="${k}"]`); bb.classList.add('bien'); bb.querySelector('.et').style.visibility='visible'; $$('#s-repasoitem .op').forEach(x=>x.disabled=true); setTimeout(()=>decir(esLo(f,p,l), l), 900); resultado(false); } } });
  } else if(it.modo==='sino'){
    // «Is it a ruler?» → «Yes, it is.» / «No, it isn't.» (como en la ficha del cole)
    if(!it.q){ const otros=f.palabras.filter(q=>q.id!==p.id); it.q = Math.random()<.5 || !otros.length ? p : otros[Math.floor(Math.random()*otros.length)]; }
    const q=it.q, si=q.id===p.id, preg=`Is it ${articulo(q.t)} ${q.t}?`;
    $('#s-repasoitem').innerHTML = `<div class="card preg">${cab}<div class="di-grid"><div class="di-ft">${imgPalabra(p,true)}</div>
      <div class="di-tx"><h2 style="text-align:left;margin:0">${esc(preg)}</h2><button class="ico-btn" type="button" id="rpOir" aria-label="Escuchar la pregunta">${ic('altavoz')}</button>
        <div class="botones sino"><button class="btn btn-verde btn-g" type="button" data-sn="1">Yes, it is.</button><button class="btn btn-rojo btn-g" type="button" data-sn="0">No, it isn't.</button></div>
        <p class="estado-mic" id="rpEstado"></p></div></div><div class="pie-preg" id="rpPie"></div></div>`;
    const oir=()=>decir(preg, 'en'); $('#rpOir').onclick=oir; setTimeout(oir, 250);
    $$('#s-repasoitem [data-sn]').forEach(b=>b.onclick=()=>{ const ok=(b.dataset.sn==='1')===si; $$('#s-repasoitem [data-sn]').forEach(x=>x.disabled=true);
      const res = si ? `Yes, it is. It's ${articulo(p.t)} ${p.t}.` : `No, it isn't. It's ${articulo(p.t)} ${p.t}.`;
      $('#rpEstado').className='estado-mic '+(ok?'ok':''); $('#rpEstado').innerHTML=`<span class="respuesta-g">${esc(res)}</span>`;
      if(ok){ b.classList.add('bien'); sonido('bien'); decirVarias([[fraseBien('en'),'en'],[res,'en']]); } else { b.classList.add('mal'); sonido('mal'); decir(res,'en'); }
      resultado(ok); });
  } else {
    const pregunta = l==='es' ? FRASE.queEs.es : l==='gl' ? `Como se di «${p.es||'?'}» en galego?` : f.frases ? "What's this?" : `How do you say «${p.es||'?'}» in English?`;
    $('#s-repasoitem').innerHTML = `<div class="card preg">${cab}<div class="di-grid"><div class="di-ft">${imgPalabra(p,true)}</div>
      <div class="di-tx"><h2 style="text-align:left;margin:0">${esc(pregunta)}</h2><button class="ico-btn" type="button" id="rpOir" aria-label="Escuchar la pregunta">${ic('altavoz')}</button>
        <button class="btn btn-p btn-xl" type="button" id="rpHablar">${ic('mic')} Responder</button><div class="medidor" id="rpMed" hidden>${'<i></i>'.repeat(12)}</div>
        <p class="estado-mic" id="rpEstado"></p><div class="botones" id="rpBotones"><button class="btn btn-g" type="button" id="rpNose">No lo sé</button></div></div></div>
      <div class="pie-preg" id="rpPie"></div></div>`;
    const oirP=()=> l==='en' && !f.frases ? decirVarias([['How do you say','en'],[p.es||'','es'],['in English?','en']]) : decir(pregunta, l);
    $('#rpOir').onclick=oirP;
    $('#rpNose').onclick=()=>{ pararEscucha(); mostrarRespuesta(false); };
    $('#rpHablar').onclick=escuchar;
    oirP().then(()=>{ if(actual==='repasoitem' && rep && rep.items[rep.i]===it) escuchar(); });
    async function escuchar(){
      const est=$('#rpEstado'), btn=$('#rpHablar'), med=$('#rpMed'); if(!est) return;
      btn.disabled=true; est.className='estado-mic'; est.textContent='Te escucho…'; med.hidden=false; const barras=$$('#rpMed i');
      const r=await escucharUna({idioma:l, palabras:FICHAS.filter(x=>x.idioma===l).flatMap(x=>x.palabras.map(q=>q.t)).join(' ').toLowerCase().split(/\s+/), maxSeg:7,
        comprobar:t=>diceRespuesta(t,p.t), alNivel:v=>barras.forEach((b,i)=>b.classList.toggle('on', i<Math.round(v*barras.length*1.6)))});
      if(actual!=='repasoitem' || rep.items[rep.i]!==it) return;
      med.hidden=true; btn.disabled=false; rep.intentos++;
      if(r.sinMic){ elegirEscrito(); return; }
      if(r.ok){ est.className='estado-mic ok'; est.textContent='¡'+p.t+'!'; mostrarRespuesta(rep.intentos===1); return; }
      est.textContent = r.texto ? `He oído: «${r.texto}»` : 'No te he oído bien.';
      if(rep.intentos>=2){ mostrarRespuesta(false); return; }
      decir(FRASE.otra[l], l); btn.innerHTML=ic('mic')+' Otra vez';
    }
    function elegirEscrito(){ // sin micrófono: elegir la palabra escrita
      const otros=barajar(FICHAS.filter(x=>x.idioma===f.idioma).flatMap(x=>x.palabras).filter(q=>q.id!==p.id)).slice(0,2);
      const ops=barajar([p,...otros]);
      $('#rpBotones').innerHTML = ops.map(q=>`<button class="btn btn-borde btn-g" type="button" data-q="${esc(q.id)}">${esc(q.t)}</button>`).join('');
      $('#rpEstado').textContent='Toca la respuesta:';
      $$('#rpBotones [data-q]').forEach(b=>b.onclick=()=>mostrarRespuesta(b.dataset.q===p.id && rep.intentos<=1));
    }
    function mostrarRespuesta(ok){
      pararEscucha(); $('#rpHablar').hidden=true; $('#rpBotones').innerHTML='';
      const est=$('#rpEstado'); est.className='estado-mic '+(ok?'ok':''); est.innerHTML = `<span class="respuesta-g">${esc(p.t)}</span>`;
      const frase = f.frases && l==='en' ? `It's ${articulo(p.t)} ${p.t}.` : p.t;
      if(f.frases && l==='en') est.innerHTML = `<span class="respuesta-g">${esc(frase)}</span>`;
      if(ok){ sonido('bien'); decirVarias([[fraseBien(l),l],[frase,l]]); } else { decirVarias([[esLo(f,p,l),l],[FRASE.repite[l](frase),l]]); }
      resultado(ok);
    }
  }
}, salir(){ pararEscucha(); callar(); }});
function resultado(ok){
  const it=rep.items[rep.i]; if(it.anotado) return; it.anotado=true;
  if(!it.extra) anotar(it.f, it.p, ok);
  rep.res.push({f:it.f, p:it.p, ok, modo:it.modo});
  // si falla, la vuelve a ver al final; si acierta tocándola por primera vez, al final también tiene que decirla
  if(!ok && !it.extra) rep.items.push({f:it.f, p:it.p, e:it.e, modo:'toca', extra:true});
  else if(ok && it.modo==='toca' && !it.extra && rep.items.filter(x=>x.extra && x.modo==='di').length<5) rep.items.push({f:it.f, p:it.p, e:it.e, modo:'di', extra:true});
  $('#rpPie').innerHTML = `<button class="btn btn-p btn-g" type="button" id="rpSig">${rep.i+1<rep.items.length?'Siguiente':'Terminar'} ${ic('flecha')}</button>`;
  $('#rpSig').onclick=()=>{ rep.i++; if(rep.i<rep.items.length) ir('repasoitem'); else ir('repasofin'); };
}
definir('repasofin', {nav:'repaso', pintar(){
  const unicos=[...new Map(rep.res.map(r=>[r.p.id, r])).values()]; const bien=unicos.filter(r=>rep.res.filter(x=>x.p.id===r.p.id).every(x=>x.ok)).length;
  const _ant=typeof fotoPremios==='function'?fotoPremios():null;
  aj.repasoLog=aj.repasoLog||[]; aj.repasoLog.push({f:new Date().toISOString(), n:unicos.length, bien, fichas:[...new Set(unicos.map(r=>r.f.id))]}); aj.repasoLog=aj.repasoLog.slice(-2000); guardarAj();
  const l=(rep.items[0]&&rep.items[0].f.idioma)||'es';
  $('#s-repasofin').innerHTML = `<div class="card buen-trabajo"><h1>${l==='en'?'Great job!':l==='gl'?'Bo traballo!':'¡Buen trabajo!'}</h1><p class="sub">Has repasado ${unicos.length} ${unicos.length===1?'palabra':'palabras'} · ${bien} a la primera.</p>${typeof premioChipHTML==='function'?premioChipHTML(_ant):''}
    <div class="tarjetas-pal">${unicos.map(r=>`<div class="tp"><span class="ft">${imgPalabra(r.p)}</span><b style="${rep.res.filter(x=>x.p.id===r.p.id).every(x=>x.ok)?'':'color:var(--coral)'}">${esc(r.p.t)} ${rep.res.filter(x=>x.p.id===r.p.id).every(x=>x.ok)?`<i>${ic('check')}</i>`:''}</b>${r.p.es?`<span class="nota">${esc(r.p.es)}</span>`:''}</div>`).join('')}</div>${libroSVG()}
    <div class="botones" style="max-width:640px;margin:0 auto"><button class="btn btn-p btn-g" type="button" data-ir="inicio">${ic('casa')} Volver al inicio</button><button class="btn btn-borde btn-g" type="button" data-ir="repaso">${ic('hoja')} Fichas</button></div></div>`;
  confeti($('#s-repasofin .buen-trabajo')); sonido('cromo');
  setTimeout(()=>{ if(actual==='repasofin') comprobarPremios(); }, 2500);
  decir(l==='en'?'Great job!':l==='gl'?'Bo traballo!':`¡Buen trabajo, ${nombre()}!`, l);
}});

/* ---------- zona de adultos: fichas de clase ---------- */
let fichaEd=null;
definir('fichas', {zona:'adulto', pintar(id){
  if(id==='nueva'){ fichaEd={id:nuevoId().slice(-8), titulo:'', idioma:'en', fotos:[], palabras:[], creada:new Date().toISOString(), nueva:true}; }
  else if(id){ const f=FICHAS.find(x=>x.id===id); fichaEd=f?JSON.parse(JSON.stringify(f)):null; }
  else if(id===null) fichaEd=null;
  const s=$('#s-fichas');
  if(!fichaEd){
    s.innerHTML = `<div class="pag-cab"><div><h1>Fichas de clase</h1><p class="sub">Añade las fichas del cole para que las repase cada día en su idioma (inglés, gallego o castellano).</p></div><button class="btn btn-p" type="button" id="fNueva">+ Nueva ficha</button></div>
    <div class="fichas-grid">${FICHAS.map(f=>{ const idm=IDIOMAS[f.idioma]||IDIOMAS.es; return `<div class="ficha-c"><span class="ft">${f.fotos&&f.fotos[0]?imgHTML(f.fotos[f.fotos.length-1],true):imgPalabra(f.palabras[0]||{},true)}</span><span class="tx"><span class="chip">${idm.bandera} ${idm.nombre}</span><b>${esc(f.titulo)}</b><span class="nota">${f.palabras.length} palabras${f.activa===false?' · desactivada':''}</span>
      <span class="botones"><button class="btn btn-mini" type="button" data-ed="${esc(f.id)}">Editar</button><button class="btn btn-mini btn-rojo" type="button" data-bo="${esc(f.id)}">Borrar</button></span></span></div>`; }).join('') || '<p class="vacio">Todavía no hay fichas.</p>'}</div>
    ${FICHAS.length?progresoFichasHTML():''}${dictadosAdultoHTML()}${aj.perfiles.filter(p=>!p.prueba).map(letrasAdultoHTML).join('')}${typeof trabajosAdultoHTML==='function'?aj.perfiles.filter(p=>!p.prueba).map(trabajosAdultoHTML).join(''):''}${typeof caligrafiaAdultoHTML==='function'?aj.perfiles.filter(p=>!p.prueba).map(caligrafiaAdultoHTML).join(''):''}${typeof deletreoAdultoHTML==='function'?aj.perfiles.filter(p=>!p.prueba).map(deletreoAdultoHTML).join(''):''}`;
    $('#fNueva').onclick=()=>ir('fichas','nueva');
    $$('#s-fichas [data-ed]').forEach(b=>b.onclick=()=>ir('fichas', b.dataset.ed));
    $$('#s-fichas [data-bo]').forEach(b=>b.onclick=()=>{ const f=FICHAS.find(x=>x.id===b.dataset.bo); dialogo({titulo:`¿Borrar la ficha «${esc(f.titulo)}»?`, html:'<p class="nota">Se quita del repaso. Las imágenes quedan en la carpeta de datos.</p>', botones:[{t:'Conservar',cls:'btn'},{t:'Borrar',cls:'btn-rojo', fn:async()=>{ FICHAS=FICHAS.filter(x=>x.id!==f.id); await guardarFichas(); ir('fichas', null); }}]}); });
    return;
  }
  const f=fichaEd;
  s.innerHTML = `<div class="pag-cab"><h1>${f.nueva?'Nueva ficha':'Editar ficha'}</h1><button class="btn" type="button" id="fVolver">${ic('atras')} Todas las fichas</button></div>
  <div class="card bloque"><div class="ficha-ed-cab"><div class="campo" style="flex:2"><label for="fTit">Título</label><input id="fTit" value="${esc(f.titulo)}" placeholder="Por ejemplo: Plants"></div>
    <div class="campo" style="flex:1"><label for="fIdi">Idioma de la ficha</label><select id="fIdi">${Object.entries(IDIOMAS).map(([k,v])=>`<option value="${k}" ${k===f.idioma?'selected':''}>${v.bandera} ${v.nombre}</option>`).join('')}</select></div>
    <div class="campo" style="flex:1"><b>En el repaso</b><div class="interruptor"><span>Activa</span><button type="button" class="switch" id="fAct" role="switch" aria-checked="${f.activa!==false}"></button></div></div></div>
    <div class="campo"><b>Fotos de la ficha</b><div class="fotos-ficha">${(f.fotos||[]).map((k,i)=>`<span class="ff">${imgHTML(k,true)}<button type="button" data-qf="${i}" aria-label="Quitar">×</button></span>`).join('')}<button class="soltar" type="button" id="fFoto" style="min-height:110px;width:150px"><span class="mas">+</span><b>Añadir foto</b><span class="nota">La ficha en blanco o hecha</span></button></div>
      <span class="nota">Con la foto de la ficha hecha podéis recortar los dibujos del niño para usarlos en el repaso.</span></div>
    <h3 style="margin:10px 0">Palabras</h3>
    <div class="tabla-w"><table class="tabla-pal"><thead><tr><th>Imagen</th><th>Palabra (${(IDIOMAS[f.idioma]||IDIOMAS.es).nombre.toLowerCase()})</th><th>En castellano</th><th>Grupo</th><th></th></tr></thead><tbody>
    ${f.palabras.map((p,i)=>`<tr><td><button type="button" class="img-pal" data-img="${i}">${p.img?imgHTML(p.img):'<span class="emo">＋</span>'}</button></td><td><input data-c="t" data-i="${i}" value="${esc(p.t)}" placeholder="roots"></td><td><input data-c="es" data-i="${i}" value="${esc(p.es||'')}" placeholder="raíces"></td><td><input data-c="g" data-i="${i}" value="${esc(p.g||'')}" placeholder="Parts" style="max-width:130px"></td><td><button class="btn btn-mini" type="button" data-oir="${i}">${ic('altavoz')}</button> <button class="btn btn-mini btn-rojo" type="button" data-qp="${i}">×</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="botones" style="margin-top:14px"><button class="btn btn-borde" type="button" id="fMas">+ Añadir palabra</button><button class="btn btn-p btn-g" type="button" id="fGuardar">Guardar ficha</button></div></div>`;
  const leer=()=>{ f.titulo=$('#fTit').value.trim(); f.idioma=$('#fIdi').value; f.activa=$('#fAct').getAttribute('aria-checked')==='true'; $$('#s-fichas [data-c]').forEach(x=>{ f.palabras[+x.dataset.i][x.dataset.c]=x.value.trim(); }); };
  $('#fVolver').onclick=()=>ir('fichas', null);
  $('#fAct').onclick=e=>e.currentTarget.setAttribute('aria-checked', String(e.currentTarget.getAttribute('aria-checked')!=='true'));
  $('#fIdi').onchange=()=>{ leer(); ir('fichas'); };
  $('#fMas').onclick=()=>{ leer(); f.palabras.push({id:nuevoId().slice(-6), t:'', es:''}); ir('fichas'); setTimeout(()=>{ const ins=$$('#s-fichas [data-c="t"]'); ins[ins.length-1].focus(); },50); };
  $$('#s-fichas [data-qp]').forEach(b=>b.onclick=()=>{ leer(); f.palabras.splice(+b.dataset.qp,1); ir('fichas'); });
  $$('#s-fichas [data-qf]').forEach(b=>b.onclick=()=>{ leer(); f.fotos.splice(+b.dataset.qf,1); ir('fichas'); });
  $$('#s-fichas [data-oir]').forEach(b=>b.onclick=()=>{ leer(); const p=f.palabras[+b.dataset.oir]; decir(p.t, f.idioma); });
  $('#fFoto').onclick=async()=>{ leer(); const a=await elegirArchivo(); if(!a) return; const bl=await abrirRecorte(a,{aspecto:.75, titulo:'Encuadra la ficha', ancho:1200}); if(!bl) return; const k='fi_'+f.id+'_h'+nuevoId().slice(-4); await subirImagen(k, bl); f.fotos.push(k); ir('fichas'); };
  $$('#s-fichas [data-img]').forEach(b=>b.onclick=()=>{ leer(); elegirImagenPalabra(f, f.palabras[+b.dataset.img]); });
  $('#fGuardar').onclick=async()=>{ leer(); if(!f.titulo){ $('#fTit').focus(); return; } f.palabras=f.palabras.filter(p=>p.t); delete f.nueva;
    const i=FICHAS.findIndex(x=>x.id===f.id); if(i>=0) FICHAS[i]=f; else FICHAS.push(f);
    try{ await guardarFichas(); aviso('Ficha guardada'); ir('fichas', null); }catch(e){ dialogo({titulo:'No se pudo guardar', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); } };
}});
function elegirImagenPalabra(f, p){
  dialogo({titulo:`Imagen para «${esc(p.t||'…')}»`, botones:[
    ...(f.fotos||[]).map((k,i)=>({t:`${ic('imagen')} Recortar de la foto de la ficha${f.fotos.length>1?' '+(i+1):''}`, cls:'btn-p', fn:async()=>{ const bl=await abrirRecorte(fotoURL(k,true),{aspecto:1.5, titulo:'Recorta el dibujo'}); if(bl){ const kk='fi_'+f.id+'_'+p.id; await subirImagen(kk, bl); p.img=kk; ir('fichas'); } }})),
    {t:`${ic('camara')} Subir una imagen`, fn:async()=>{ const a=await elegirArchivo(); if(!a) return; const bl=await abrirRecorte(a,{aspecto:1.5}); if(bl){ const kk='fi_'+f.id+'_'+p.id; await subirImagen(kk, bl); p.img=kk; ir('fichas'); } }},
    {t:`${ic('libro')} Elegir de nuestras fotos`, fn:async()=>{ const k=await elegirDeGaleria(); if(k){ p.img=k; ir('fichas'); } }}]});
}
function progresoFichasHTML(){
  const ps=aj.perfiles.filter(p=>!p.prueba);
  return `<div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:12px">Cómo va cada niño</h3><div class="tabla-w"><table><thead><tr><th>Ficha</th>${ps.map(p=>`<th>${esc(p.nombre)}<small>aprendidas</small></th>`).join('')}</tr></thead><tbody>
  ${FICHAS.map(f=>`<tr><td><b>${esc(f.titulo)}</b></td>${ps.map(p=>{ const r=(p.id===aj.perfil?aj.repaso:(p.cfg&&p.cfg.repaso))||{}; const ap=f.palabras.filter(q=>(r[f.id+':'+q.id]||{}).c>=3).length; const vistos=f.palabras.filter(q=>r[f.id+':'+q.id]).length; return `<td>${ap} / ${f.palabras.length}<span class="nota"> · ${vistos} vistas</span></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
  <p class="nota" style="margin-top:8px">Una palabra cuenta como aprendida cuando la acierta varios días seguidos. Las que falla vuelven al día siguiente.</p></div>`;
}
