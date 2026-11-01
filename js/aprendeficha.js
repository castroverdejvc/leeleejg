/* LeeLEEJG · «Aprende la ficha»: ejercicios para aprender CUALQUIER ficha de palabras (1/11/2026).
   La familia mandó la hoja «School and family» y hojas de ideas para aprenderla («Look and choose», «Match the words»,
   «Look and write», «Word detective», «My daily routine», «Missing letters») y pidió: «haz eso con las fichas antiguas
   y con estas, y con todas las que vengan en un futuro».
   - Cada ficha de palabras con dibujos (School things, Plants, School and family y las que se creen en Familia › Fichas de clase)
     tiene estos ejercicios: aprende las palabras (el repaso), mira y elige, une, mira y escribe, detective, letras que faltan.
     «My daily routine» solo sale si la ficha trae su hoja (APR_HOJAS).
   - Si la ficha trae hojas (APR_HOJAS), la 1.ª, 2.ª… vez de cada ejercicio es igual que cada hoja; después se inventa uno
     nuevo con sus palabras y con cualquier dibujo de cada palabra (los de la hoja del cole y los de las hojas de ideas).
   - Las fichas creadas desde el 1/11/2026 son «fichas nuevas»: tarea del día hasta que se hacen enteras (como la de vocales).
     Las de antes salen en Fichas para practicar, sin ser obligatorias.
   - Los dibujos de las hojas de ideas de «School and family» son fi_famx_<hoja><n> y van con las imágenes privadas
     (mis_imagenes), nunca en la web pública. Cada ejercicio es un trabajo del cole (trabajosLog, t = 'apr_<tipo>:<ficha>'). */
'use strict';
const APR_DESDE = '2026-11-01';
const APR_TIPOS = {
  choose: {emo:'🔵', n:{en:'Look and choose', es:'Mira y elige', gl:'Mira e escolle'}, desc:'Rodea la palabra correcta.'},
  match:  {emo:'🔗', n:{en:'Match the words', es:'Une las palabras', gl:'Une as palabras'}, desc:'Une cada dibujo con su palabra.'},
  write:  {emo:'✍️', n:{en:'Look and write', es:'Mira y escribe', gl:'Mira e escribe'}, desc:'Pon cada palabra debajo de su dibujo.'},
  detect: {emo:'🔍', n:{en:'Word detective', es:'Detective de palabras', gl:'Detective de palabras'}, desc:'¿La palabra va con el dibujo?'},
  routine:{emo:'🕐', n:{en:'My daily routine', es:'Mi día', gl:'O meu día'}, desc:'Ordena tu día y dilo.'},
  letters:{emo:'🔤', n:{en:'Missing letters', es:'Letras que faltan', gl:'Letras que faltan'}, desc:'Pon las letras que faltan.'}
};
const APR_APRENDE = {en:'Learn the words', es:'Aprende las palabras', gl:'Aprende as palabras'};

/* ---------- hojas que mandó la familia (lo que sale las primeras veces) ---------- */
const APR_HOJAS = {
  family: {
    // dibujos de cada hoja de ideas, en orden: fi_famx_<hoja><n>
    dib: {
      a:['classroom','grandma','playground','getup','library','tidyup','grandad','shower','livingroom','teacher','happy','bedroom','taketurns','havelunch','scared','homework'],
      b:['gym','canteen','mum','dad','brother','sister','kitchen','bathroom'],
      c:['makethebed','gotoschool','play','wehelp','weshare','angry','sad','surprised'],
      d:['classroom','gym','playground','library','kitchen','livingroom','bedroom','bathroom'],
      e:['tidyup','getup','gotoschool','shower','play','makethebed','wehelp','weshare'],
      f:['classroom','kitchen','grandad','grandma','shower','livingroom','sad','gym'],
      g:['play','homework','getup','shower','havelunch','gotoschool'],
      h:['mum','dad','brother','sister','kitchen','bathroom','library','happy','angry','sad'],
      i:['classroom','gym','playground','canteen','library','teacher','grandad','grandma','mum','dad','brother','sister','kitchen','livingroom','tidyup','bedroom'],
      j:['bathroom','makethebed','getup','gotoschool','havelunch','homework','shower','play','wehelp','weshare','taketurns','happy','angry','sad','surprised','scared'],
      k:['classroom','gym','playground','canteen','library','teacher','grandad','grandma','mum','dad','brother','sister','kitchen','livingroom','tidyup','bedroom'],
      l:['bathroom','makethebed','getup','gotoschool','havelunch','homework','shower','play','wehelp','weshare','taketurns','happy','angry','sad','surprised','scared']
    },
    // Look and choose 1, 2 y 3: [hoja, nº de dibujo, opciones]
    choose: [
      [['a',0,['classroom','kitchen','bedroom']],['a',1,['mum','grandma','sister']],['a',2,['library','bathroom','playground']],['a',3,['getup','play','shower']],
       ['a',4,['canteen','library','gym']],['a',5,['makethebed','gotoschool','tidyup']],['a',6,['grandad','dad','brother']],['a',7,['havelunch','shower','homework']],
       ['a',8,['kitchen','classroom','livingroom']],['a',9,['teacher','sister','grandma']],['a',10,['sad','happy','angry']],['a',11,['bedroom','bathroom','playground']],
       ['a',12,['weshare','wehelp','taketurns']],['a',13,['havelunch','getup','tidyup']],['a',14,['surprised','angry','scared']],['a',15,['play','homework','makethebed']]],
      [['b',0,['classroom','gym','library']],['b',1,['canteen','playground','bedroom']],['b',2,['grandma','sister','mum']],['b',3,['brother','dad','grandad']],
       ['b',4,['brother','dad','grandma']],['b',5,['mum','grandad','sister']],['b',6,['livingroom','kitchen','classroom']],['b',7,['bathroom','bedroom','canteen']]],
      [['c',0,['tidyup','makethebed','getup']],['c',1,['gotoschool','homework','shower']],['c',2,['havelunch','makethebed','play']],['c',3,['weshare','wehelp','taketurns']],
       ['c',4,['weshare','taketurns','wehelp']],['c',5,['happy','sad','angry']],['c',6,['scared','sad','happy']],['c',7,['surprised','angry','scared']]]
    ],
    // Match the words: partes con sus dibujos (hoja, nº) y las palabras en el orden de la hoja
    match: [[{t:'1. School', h:'d', n:[0,1,2,3], pals:['playground','library','classroom','gym']}, {t:'2. Home', h:'d', n:[4,5,6,7], pals:['bathroom','bedroom','kitchen','livingroom']}]],
    // Look and write: dibujos de la hoja e y el recuadro en su orden
    write: [{h:'e', banco:['play','weshare','getup','makethebed','shower','wehelp','gotoschool','tidyup']}],
    // Word detective (con recuadro), Word detective 1 y 2: [palabra del dibujo, palabra que pone]
    detect: [
      {h:'f', items:[['classroom','classroom'],['kitchen','bedroom'],['grandad','dad'],['grandma','grandma'],['shower','play'],['livingroom','livingroom'],['sad','happy'],['gym','gym']]},
      {h:'i', items:[['classroom','classroom'],['gym','library'],['playground','playground'],['canteen','kitchen'],['library','gym'],['teacher','teacher'],['grandad','dad'],['grandma','grandma'],
        ['mum','mum'],['dad','grandad'],['brother','brother'],['sister','mum'],['kitchen','bedroom'],['livingroom','livingroom'],['tidyup','play'],['bedroom','bedroom']]},
      {h:'j', items:[['bathroom','bathroom'],['makethebed','getup'],['getup','getup'],['gotoschool','play'],['havelunch','havelunch'],['homework','gotoschool'],['shower','shower'],['play','homework'],
        ['wehelp','wehelp'],['weshare','taketurns'],['taketurns','taketurns'],['happy','sad'],['angry','angry'],['sad','happy'],['surprised','surprised'],['scared','angry']]}
    ],
    routine: {h:'g'},
    // Missing letters, 1 y 2: [palabra, posiciones que faltan (en la palabra tal cual, con espacios)]
    letters: [
      {h:'h', items:[['mum',[1]],['dad',[1]],['brother',[2]],['sister',[1]],['kitchen',[1]],['bathroom',[5,6]],['library',[1]],['happy',[1]],['angry',[0]],['sad',[1]]]},
      {h:'k', items:[['classroom',[2]],['gym',[1]],['playground',[2]],['canteen',[1]],['library',[1]],['teacher',[1]],['grandad',[2]],['grandma',[2]],
        ['mum',[1]],['dad',[1]],['brother',[2]],['sister',[1]],['kitchen',[1]],['livingroom',[1]],['tidyup',[1]],['bedroom',[1]]]},
      {h:'l', items:[['bathroom',[5]],['makethebed',[1]],['getup',[1]],['gotoschool',[9]],['havelunch',[6]],['homework',[4]],['shower',[2]],['play',[2]],
        ['wehelp',[4]],['weshare',[5]],['taketurns',[9]],['happy',[1]],['angry',[0]],['sad',[1]],['surprised',[1]],['scared',[2]]]}
    ]
  }
};

/* ---------- fichas, palabras y dibujos ---------- */
const fichaApr = fid => (typeof FICHAS!=='undefined' ? FICHAS : []).find(f=>f.id===fid);
const hojasDe = fid => APR_HOJAS[fid] || {};
const conDibujo = f => (f.palabras||[]).filter(p=>p.img && MIS[p.img] || (CONT.fotos||{})[p.img]);
/* fichas que se pueden aprender así: activas y con 4 palabras o más con dibujo */
const fichasAprendibles = () => (typeof FICHAS!=='undefined' ? FICHAS : []).filter(f=>f.activa!==false && conDibujo(f).length>=4);
const claveDibHoja = (h,i) => `fi_famx_${h}${String(i+1).padStart(2,'0')}`;
function dibujosDe(f, id){
  const p=(f.palabras||[]).find(x=>x.id===id); const out=[];
  Object.entries(hojasDe(f.id).dib||{}).forEach(([h,ws])=>ws.forEach((w,i)=>{ if(w===id) out.push(claveDibHoja(h,i)); }));
  if(p && p.img){ out.push(p.img, p.img+'_2', p.img.replace(/_\d+$/,'')); }
  return [...new Set(out)].filter(k=>MIS[k] || (CONT.fotos||{})[k]);
}
/* el dibujo pedido si está en este aparato; si no, otro de la misma palabra */
function aprDib(f, clave, id){
  const k = clave && (MIS[clave] || (CONT.fotos||{})[clave]) ? clave : (dibujosDe(f,id)[0] || null);
  return k ? imgHTML(k, true) : '<span class="emo">🖼️</span>';
}
const dibAzarDe = (f,id) => { const ds=dibujosDe(f,id); return ds.length ? azarDe(ds) : null; };
const palDe = (f,id) => (f.palabras||[]).find(p=>p.id===id) || {id, t:id};
const idsCon = f => conDibujo(f).map(p=>p.id);
const lenguaDe = f => f.idioma || 'es';
const verPal = (f,id) => { const t=palDe(f,id).t||id; return lenguaDe(f)==='en' ? t.charAt(0).toUpperCase()+t.slice(1) : t; };
const decirPal = (f,id) => decir(verPal(f,id), lenguaDe(f));
const fraseApr = (f,id) => (typeof fraseDe==='function' && fraseDe(f, palDe(f,id), lenguaDe(f))) || verPal(f,id);
const decirFraseApr = (f,id) => decir(fraseApr(f,id), lenguaDe(f));
/* otras palabras del mismo grupo (para las opciones), y si no llegan, de otros */
function parecidasDe(f, id, n){
  const g=palDe(f,id).g, todas=idsCon(f).filter(x=>x!==id);
  return barajar(todas.filter(x=>g && palDe(f,x).g===g)).concat(barajar(todas.filter(x=>!g || palDe(f,x).g!==g))).slice(0,n);
}
const vecesApr = t => (cfgDe(perfil()).trabajosLog||[]).filter(x=>x.t===t).length;
/* la hoja que toca: la 1.ª vez la primera hoja, la 2.ª la segunda…; después, null (se inventa una) */
const hojaQueToca = (fid, tipo) => { const hs=hojasDe(fid)[tipo]; const n=vecesApr(`apr_${tipo}:${fid}`); return Array.isArray(hs) && n<hs.length ? {hoja:hs[n], n} : null; };

/* ---------- las fichas «Aprende…» (salen en Fichas y, si son nuevas, en lo de hoy) ---------- */
function aprFichas(){
  return fichasAprendibles().map(f=>{ const l=lenguaDe(f), id=IDIOMAS[l]||IDIOMAS.es, h=hojasDe(f.id);
    const tipos=['choose','match','write','detect', ...(h.routine?['routine']:[]), 'letters'];
    return {id:'apr_'+f.id, fid:f.id, titulo:f.titulo, emo:id.bandera, obligatoria:(f.creada||'')>=APR_DESDE,
      resumen:'Mira, rodea, une, escribe y completa las palabras de la ficha.',
      pasos:[{id:'apr_rep:'+f.id, emo:'📖', t:APR_APRENDE[l]||APR_APRENDE.es, rep:f.id},
        ...tipos.map(t=>({id:`apr_${t}:${f.id}`, emo:APR_TIPOS[t].emo, t:APR_TIPOS[t].n[l]||APR_TIPOS[t].n.es}))]};
  }).sort((a,b)=>(fichaApr(b.fid).creada||'').localeCompare(fichaApr(a.fid).creada||''));
}
/* para la pantalla de trabajo y la tabla de la familia */
const trabajosApr = () => aprFichas().flatMap(F=>F.pasos.filter(p=>!p.rep).map(p=>{ const tipo=p.id.split(':')[0].slice(4);
  return {id:p.id, emo:p.emo, nombre:`${p.t} · ${F.titulo}`, desc:APR_TIPOS[tipo].desc}; }));
function correrApr(tipo, z){ const [t,fid]=tipo.split(':'); const f=fichaApr(fid); const fn=FUNC_APR[t.slice(4)];
  if(!f || !fn){ ir('repaso'); return; } fn(z, f); }

/* ============ Mira y elige: rodea la palabra correcta ============ */
function tAprChoose(z, f){
  const hq=hojaQueToca(f.id,'choose'); let items;
  if(hq) items=hq.hoja.map(([h,i,ops])=>({k:claveDibHoja(h,i), id:hojasDe(f.id).dib[h][i], ops}));
  else items=barajar(idsCon(f)).slice(0,8).map(id=>({k:dibAzarDe(f,id), id, ops:barajar([id, ...parecidasDe(f,id,2)])}));
  const POR=4; let pag=0; const hechos=new Set();
  const pinta=()=>{
    const vis=items.slice(pag*POR, pag*POR+POR), npag=Math.ceil(items.length/POR);
    z.innerHTML=ordenHTML('Mira el dibujo y rodea la palabra correcta.')+
      `<p class="nota centro">${hq?`Hoja ${hq.n+1} · `:''}${pag+1} de ${npag}</p>
      <div class="fam-choose">${vis.map((it,j)=>{ const g=pag*POR+j;
        return `<div class="fam-cc${hechos.has(g)?' hecho':''}"><span class="fam-num">${g+1}.</span><span class="ft">${aprDib(f, it.k, it.id)}</span>
          <div class="fam-ops">${it.ops.map(o=>`<button type="button" class="fam-op${hechos.has(g)&&o===it.id?' rodeada':''}" data-g="${g}" data-o="${esc(o)}"><i class="fam-circ"></i>${esc(verPal(f,o))}</button>`).join('')}</div></div>`; }).join('')}</div>
      <div class="botones" style="justify-content:center;margin-top:12px">${pag>0?`<button class="btn btn-borde btn-g" type="button" id="aprAnt">${ic('atras')} Antes</button>`:''}
        ${pag+1<npag?`<button class="btn btn-p btn-g" type="button" id="aprSig" ${vis.every((_,j)=>hechos.has(pag*POR+j))?'':'disabled'}>Siguiente ${ic('flecha')}</button>`:''}</div>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    if($('#aprAnt', z)) $('#aprAnt', z).onclick=()=>{ pag--; pinta(); };
    if($('#aprSig', z)) $('#aprSig', z).onclick=()=>{ pag++; pinta(); };
    const elegir=b=>{ const g=+b.dataset.g, it=items[g]; if(hechos.has(g)) return;
      if(b.dataset.o===it.id){ hechos.add(g); b.classList.add('rodeada'); b.closest('.fam-cc').classList.add('hecho'); bienT(); decirFraseApr(f, it.id);
        if(hechos.size===items.length) setTimeout(terminarTrabajo, 1200);
        else if(pag+1<npag && items.slice(pag*POR, pag*POR+POR).every((_,j)=>hechos.has(pag*POR+j))) setTimeout(()=>{ if(actual==='trabajo' && !trab.fin){ pag++; pinta(); } }, 1500); }
      else { b.classList.add('mal-t'); setTimeout(()=>b.classList.remove('mal-t'), 700); malT(b, 'Mira bien el dibujo.'); } };
    $$('.fam-op', z).forEach(b=>b.onclick=()=>elegir(b));
    // también se puede rodear la palabra con el dedo o el lápiz
    tinta($('.fam-choose', z), {color:()=>'#1E7BF2', ancho:4, alTerminar:(pts, l)=>{
      const b=$$('.fam-op', z).map(x=>({x, n:pts.filter(p=>dentroDe(x,p,22)).length})).sort((a,b)=>b.n-a.n)[0];
      borrarTrazo(l); if(b && b.n>=3) elegir(b.x); }});
  };
  pinta();
}

/* ============ Une cada dibujo con su palabra ============ */
function tAprMatch(z, f){
  const hq=hojaQueToca(f.id,'match'); let partes;
  if(hq) partes=hq.hoja.map(P=>({t:P.t, dibs:P.n.map(i=>({k:claveDibHoja(P.h,i), id:hojasDe(f.id).dib[P.h][i]})), pals:P.pals}));
  else { // dos partes de 4 (por grupos si la ficha los tiene)
    const ids=idsCon(f), grupos=[...new Set(ids.map(id=>palDe(f,id).g).filter(Boolean))].filter(g=>ids.filter(id=>palDe(f,id).g===g).length>=4);
    const lotes = grupos.length>=2 ? barajar(grupos).slice(0,2).map(g=>({t:g, ids:barajar(ids.filter(id=>palDe(f,id).g===g)).slice(0,4)}))
      : (()=>{ const b=barajar(ids); return [{t:'1', ids:b.slice(0,4)}, ...(b.length>=8?[{t:'2', ids:b.slice(4,8)}]:[])]; })();
    partes=lotes.map((L,j)=>({t:grupos.length>=2?`${j+1}. ${L.t}`:'', dibs:L.ids.map(id=>({k:dibAzarDe(f,id), id})), pals:barajar(L.ids.slice())})); }
  let parte=0;
  const pinta=()=>{
    const P=partes[parte], unidos=new Set(); let sel=null;
    z.innerHTML=ordenHTML('Une cada dibujo con su palabra.')+
      `${P.t?`<h3 class="fam-sub">${esc(P.t)}</h3>`:''}${partes.length>1?`<p class="nota centro">Parte ${parte+1} de ${partes.length}</p>`:''}<div class="fam-match"><svg class="rel-lineas"></svg>
        <div class="fam-col">${P.dibs.map(d=>`<button type="button" class="fam-mdib" data-id="${esc(d.id)}"><span class="ft">${aprDib(f, d.k, d.id)}</span><i class="rel-punto"></i></button>`).join('')}</div>
        <div class="fam-col">${P.pals.map(id=>`<button type="button" class="fam-mpal" data-id="${esc(id)}"><i class="rel-punto"></i><span>${esc(verPal(f,id))}</span></button>`).join('')}</div></div>
      <p class="nota centro">Tira una línea desde el dibujo hasta su palabra, o toca el dibujo y luego la palabra.</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    const caja=$('.fam-match', z), svg=$('.rel-lineas', z);
    const linea=(a,b,col)=>{ const r=caja.getBoundingClientRect(), p1=$('.rel-punto',a).getBoundingClientRect(), p2=$('.rel-punto',b).getBoundingClientRect();
      svg.insertAdjacentHTML('beforeend', `<line x1="${p1.left+p1.width/2-r.left}" y1="${p1.top+p1.height/2-r.top}" x2="${p2.left+p2.width/2-r.left}" y2="${p2.top+p2.height/2-r.top}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`); return svg.lastElementChild; };
    const unir=(dib, pal, trazo)=>{
      if(dib.classList.contains('unida') || pal.classList.contains('unida')){ borrarTrazo(trazo); return; }
      if(dib.dataset.id===pal.dataset.id){ if(trazo) borrarTrazo(trazo); linea(dib,pal,'#1E7BF2'); unidos.add(dib.dataset.id); dib.classList.add('unida'); pal.classList.add('unida'); dib.classList.remove('sel'); sel=null; bienT(); decirPal(f, pal.dataset.id);
        if(unidos.size===P.dibs.length) setTimeout(()=>{ if(parte+1<partes.length){ parte++; decir('¡Muy bien! Ahora la segunda parte.'); pinta(); } else terminarTrabajo(); }, 1100); }
      else { if(trazo) borrarTrazo(trazo, true); else { const l=linea(dib,pal,'#E5484D'); setTimeout(()=>l.remove(), 700); } malT(pal, 'Mira bien el dibujo y lee la palabra.'); } };
    $$('.fam-mdib', z).forEach(b=>b.onclick=()=>{ if(b.classList.contains('unida')) return; sel=b; $$('.fam-mdib', z).forEach(x=>x.classList.toggle('sel', x===b)); sonido('toc'); });
    $$('.fam-mpal', z).forEach(b=>b.onclick=()=>{ if(!sel){ decir('Primero toca un dibujo.'); return; } unir(sel, b); });
    tinta(caja, {color:()=>'#334155', ancho:5, alTerminar:(pts, l)=>{
      const ini=pts[0], fin=pts[pts.length-1], en=(s,p)=>$$(s, z).find(el=>dentroDe(el,p,16));
      const dib=en('.fam-mdib',ini)||en('.fam-mdib',fin), pal=en('.fam-mpal',fin)||en('.fam-mpal',ini);
      if(!dib || !pal){ borrarTrazo(l, true); decir('Tira la línea desde el dibujo hasta su palabra.'); return; }
      unir(dib, pal, l); }});
  };
  pinta();
}

/* ============ Mira y escribe: cada palabra del recuadro debajo de su dibujo (cada una, una vez) ============ */
function tAprWrite(z, f){
  const hq=hojaQueToca(f.id,'write'); let dibs, banco;
  if(hq){ const H=hq.hoja; dibs=hojasDe(f.id).dib[H.h].map((id,i)=>({k:claveDibHoja(H.h,i), id})); banco=H.banco.slice(); }
  else { const ids=barajar(idsCon(f)).slice(0,8); dibs=ids.map(id=>({k:dibAzarDe(f,id), id})); banco=barajar(ids.slice()); }
  const puesto={}; let sel=null;
  const pinta=()=>{
    z.innerHTML=ordenHTML('Mira los dibujos y escribe. Usa cada palabra una sola vez.')+
      `<div class="fam-wzona"><div class="fam-banco">${banco.map(id=>`<button type="button" class="fam-bp${Object.values(puesto).includes(id)?' usada':''}${sel===id?' sel':''}" data-id="${esc(id)}">${esc(verPal(f,id))}</button>`).join('')}</div>
      <div class="fam-write">${dibs.map((d,i)=>`<button type="button" class="fam-wd${puesto[i]?' hecho':''}" data-i="${i}"><span class="fam-num">${i+1}.</span><span class="ft">${aprDib(f, d.k, d.id)}</span>
        <span class="fam-linea ${claseTexto()}">${puesto[i]?esc(verPal(f,puesto[i])):'&nbsp;'}</span></button>`).join('')}</div></div>
      <p class="nota centro">Toca una palabra del recuadro y luego su dibujo (o tira una línea de la palabra al dibujo).</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    $$('.fam-bp', z).forEach(b=>b.onclick=()=>{ if(b.classList.contains('usada')) return; sel=b.dataset.id; $$('.fam-bp', z).forEach(x=>x.classList.toggle('sel', x===b)); sonido('toc'); });
    const poner=(i, id, el)=>{ if(puesto[i]) return; if(!id){ decir('Primero toca una palabra del recuadro.'); return; }
      if(dibs[i].id===id){ puesto[i]=id; sel=null; bienT(); decirFraseApr(f, id); pinta(); if(Object.keys(puesto).length===dibs.length) setTimeout(terminarTrabajo, 1200); }
      else malT(el, 'Esa palabra no va con este dibujo. Mira bien.'); };
    $$('.fam-wd', z).forEach(b=>b.onclick=()=>poner(+b.dataset.i, sel, b));
    tinta($('.fam-wzona', z), {color:()=>'#334155', ancho:4, alTerminar:(pts, l)=>{
      const ini=pts[0], fin=pts[pts.length-1], en=(s,p)=>$$(s, z).find(el=>dentroDe(el,p,12));
      const bp=en('.fam-bp',ini)||en('.fam-bp',fin), wd=en('.fam-wd',fin)||en('.fam-wd',ini); borrarTrazo(l);
      if(bp && wd && !bp.classList.contains('usada')) poner(+wd.dataset.i, bp.dataset.id, wd); }});
  };
  pinta();
}

/* ============ Detective: ¿la palabra va con el dibujo? Sí / No; si no, la corrige con el recuadro ============ */
function tAprDetect(z, f){
  const hq=hojaQueToca(f.id,'detect'); let items;
  if(hq){ const H=hq.hoja; items=H.items.map(([id,pone],i)=>({k:claveDibHoja(H.h,i), id, pone})); }
  else items=barajar(idsCon(f)).slice(0,8).map((id,i)=>({k:dibAzarDe(f,id), id, pone: i%2 ? (parecidasDe(f,id,1)[0]||id) : id}));
  items=items.map(x=>({...x, res:null, corregida:false}));
  const banco=barajar(items.filter(x=>x.pone!==x.id).map(x=>x.id)), usadas=new Set();
  const POR=4, npag=Math.ceil(items.length/POR); let pag=0, cual=null;
  const listo = x => x.res==='si' || (x.res==='no' && x.corregida);
  const pinta=()=>{
    const vis=items.slice(pag*POR, pag*POR+POR);
    z.innerHTML=ordenHTML('¿La palabra coincide con el dibujo? Marca sí o no. Si no coincide, elige la correcta en el recuadro.')+
      `<div class="fam-banco"><span class="nota">Palabras para corregir:</span>${banco.map(id=>`<button type="button" class="fam-bp${usadas.has(id)?' usada':''}" data-id="${esc(id)}" ${cual==null?'disabled':''}>${esc(verPal(f,id))}</button>`).join('')}</div>
      <p class="nota centro">${hq?`Hoja ${hq.n+1} · `:''}${pag+1} de ${npag}</p>
      <div class="fam-detect">${vis.map((x,j)=>{ const g=pag*POR+j;
        return `<div class="fam-dc${listo(x)?' hecho':''}${cual===g?' sel':''}"><span class="fam-num">${g+1}</span><span class="ft">${aprDib(f, x.k, x.id)}</span>
          <div class="fam-dtx"><b class="fam-dpal${x.res==='no'?' tachada':''}">${esc(verPal(f,x.pone))}</b>
            <div class="fam-sino"><button type="button" class="btn btn-g ${x.res==='si'?'btn-verde':'btn-borde'}" data-g="${g}" data-r="si" ${x.res?'disabled':''}>Sí</button><button type="button" class="btn btn-g ${x.res==='no'?'btn-rojo':'btn-borde'}" data-g="${g}" data-r="no" ${x.res?'disabled':''}>No</button></div>
            ${x.res==='no'?`<span class="fam-linea ${claseTexto()}">${x.corregida?esc(verPal(f,x.id)):'&nbsp;'}</span>`:''}</div></div>`; }).join('')}</div>
      <div class="botones" style="justify-content:center;margin-top:12px">${pag>0?`<button class="btn btn-borde btn-g" type="button" id="aprAnt">${ic('atras')} Antes</button>`:''}
        ${pag+1<npag?`<button class="btn btn-p btn-g" type="button" id="aprSig" ${vis.every(listo)?'':'disabled'}>Siguiente ${ic('flecha')}</button>`:''}</div>
      <p class="nota centro">${cual!=null?'Ahora toca en el recuadro la palabra correcta.':'Lee la palabra y mira el dibujo.'}</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    if($('#aprAnt', z)) $('#aprAnt', z).onclick=()=>{ pag--; pinta(); };
    if($('#aprSig', z)) $('#aprSig', z).onclick=()=>{ pag++; pinta(); };
    const fin=()=>{ if(items.every(listo)) setTimeout(terminarTrabajo, 1200);
      else if(pag+1<npag && items.slice(pag*POR, pag*POR+POR).every(listo)) setTimeout(()=>{ if(actual==='trabajo' && !trab.fin){ pag++; pinta(); } }, 1400); };
    $$('[data-r]', z).forEach(b=>b.onclick=()=>{ const g=+b.dataset.g, x=items[g]; if(x.res || cual!=null) return; const coincide=x.pone===x.id;
      if((b.dataset.r==='si')===coincide){ x.res=b.dataset.r; bienT();
        if(coincide){ decirFraseApr(f, x.id); pinta(); fin(); }
        else { cual=g; decir('¡Muy bien, no coincide! Ahora elige la palabra correcta en el recuadro.'); pinta(); } }
      else malT(b, coincide ? 'Mira bien: sí que coincide.' : 'Mira bien el dibujo. ¿Es eso?'); });
    $$('.fam-bp', z).forEach(b=>b.onclick=()=>{ if(cual==null || usadas.has(b.dataset.id)) return; const x=items[cual];
      if(b.dataset.id===x.id){ x.corregida=true; usadas.add(x.id); cual=null; bienT(); decirFraseApr(f, x.id); pinta(); fin(); }
      else malT(b, 'Esa no es. Mira bien el dibujo.'); });
  };
  pinta();
}

/* ============ Mi día: ordena los dibujos según tu día y dilo (solo fichas con su hoja de rutina) ============ */
function tAprRoutine(z, f){
  const R=hojasDe(f.id).routine; if(!R){ ir('repaso'); return; }
  const l=lenguaDe(f), ids=hojasDe(f.id).dib[R.h].slice();
  const dibs = vecesApr('apr_routine:'+f.id)===0 ? ids.map((id,i)=>({k:claveDibHoja(R.h,i), id})) : barajar(ids).map(id=>({k:dibAzarDe(f,id), id}));
  const orden=[]; let fase='ordena', paso=0, intentos=0;
  const pinta=()=>{
    const enOrden = fase==='di';
    z.innerHTML=ordenHTML(enOrden ? 'Ahora di cada cosa en voz alta, en el orden de tu día.' : 'Toca los dibujos en el orden de tu día, del 1 al '+dibs.length+'.')+
      `<div class="fam-rutina">${(enOrden ? orden.map(i=>({...dibs[i], i})) : dibs.map((d,i)=>({...d, i}))).map((d,j)=>{ const num=orden.indexOf(d.i)+1;
        return `<button type="button" class="fam-rd${num?' puesta':''}${enOrden&&j===paso?' sel':''}${enOrden&&j<paso?' hecho':''}" data-i="${d.i}" ${enOrden?'disabled':''}>
          <span class="ft">${aprDib(f, d.k, d.id)}</span><span class="fam-caja">${num||''}</span><b>${esc(verPal(f,d.id))}</b></button>`; }).join('')}</div>
      ${enOrden ? `<div class="fam-decir"><button class="btn btn-p btn-xl" type="button" id="aprHablar">${ic('mic')} Decir</button><div class="medidor" id="aprMed" hidden>${'<i></i>'.repeat(12)}</div><p class="estado-mic" id="aprEstado"></p></div>`
        : `<div class="botones" style="justify-content:center;margin-top:12px"><button class="btn btn-borde btn-g" type="button" id="aprBorra" ${orden.length?'':'disabled'}>↩️ Quitar el último</button>
          <button class="btn btn-p btn-g" type="button" id="aprYa" ${orden.length===dibs.length?'':'disabled'}>✅ ¡Ya está mi día!</button></div>`}`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    if(!enOrden){
      $$('.fam-rd', z).forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(orden.includes(i)) return; orden.push(i); sonido('toc'); decirPal(f, dibs[i].id); pinta(); });
      $('#aprBorra', z).onclick=()=>{ orden.pop(); pinta(); };
      $('#aprYa', z).onclick=()=>{ fase='di'; paso=0; pinta(); preguntar(); };
    } else $('#aprHablar', z).onclick=escuchar;
  };
  const idAhora = () => dibs[orden[paso]].id;
  const PREG = {en:n=>`Number ${n}. What do you do?`, es:n=>`Número ${n}. ¿Qué haces?`, gl:n=>`Número ${n}. Que fas?`};
  const preguntar = () => decirVarias([[(PREG[l]||PREG.es)(paso+1), l]]).then(()=>{ if(actual==='trabajo' && fase==='di' && !trab.fin) escuchar(); });
  const siguiente = ok => { if(ok) bienT(); else { trab.e++; marcaTrab(); }
    paso++; intentos=0; if(paso>=orden.length){ pinta(); setTimeout(terminarTrabajo, 900); return; } setTimeout(()=>{ if(actual==='trabajo' && !trab.fin){ pinta(); preguntar(); } }, 1600); };
  async function escuchar(){
    const id=idAhora(), t=palDe(f,id).t, est=$('#aprEstado', z), btn=$('#aprHablar', z), med=$('#aprMed', z); if(!est) return;
    btn.disabled=true; est.className='estado-mic'; est.textContent='Te escucho…'; med.hidden=false; const barras=$$('#aprMed i', z);
    const pals=[...new Set((f.palabras||[]).flatMap(q=>q.t.toLowerCase().split(/\s+/)).concat(l==='en'?['i','a','have','do']:[]))];
    const r=await escucharUna({idioma:l, palabras:pals, maxSeg:6, comprobar:x=>diceRespuesta(x,t), alNivel:v=>barras.forEach((b,i)=>b.classList.toggle('on', i<Math.round(v*barras.length*1.6)))});
    if(actual!=='trabajo' || fase!=='di' || idAhora()!==id) return;
    med.hidden=true; btn.disabled=false; intentos++;
    if(r.sinMic){ est.textContent='Dilo en voz alta y toca:'; btn.outerHTML=`<button class="btn btn-verde btn-xl" type="button" id="aprYaDicho">✅ ¡Ya lo he dicho!</button>`;
      $('#aprYaDicho', z).onclick=()=>{ $('#aprYaDicho', z).disabled=true; decirFraseApr(f, id); siguiente(true); }; return; }
    if(r.ok){ est.className='estado-mic ok'; est.textContent='¡'+verPal(f,id)+'! 🎉'; decirFraseApr(f, id); siguiente(intentos===1); return; }
    est.textContent = r.texto ? `He oído: «${r.texto}»` : 'No te he oído bien.';
    if(intentos>=2){ decirVarias([[l==='en'?'Listen:':'Escucha:', l],[fraseApr(f,id), l]]); siguiente(false); return; }
    decir(l==='en'?'Try again.':'Prueba otra vez.', l); btn.innerHTML=ic('mic')+' Otra vez';
  }
  pinta();
}

/* ============ Letras que faltan ============ */
const VOCALES_APR = ['a','e','i','o','u'];
function tAprLetters(z, f){
  const hq=hojaQueToca(f.id,'letters'), l=lenguaDe(f), mayus=l==='en'; let items;
  if(hq){ const H=hq.hoja; items=H.items.map(([id,h],i)=>({k:claveDibHoja(H.h,i), id, w:palDe(f,id).t, h})); }
  else items=barajar(conDibujo(f).filter(p=>/[aeiou]/.test(p.t) && p.t.length>=3)).slice(0,8).map(p=>{
    const vs=[...p.t].map((c,i)=>VOCALES_APR.includes(c)?i:-1).filter(i=>i>=0);
    return {k:dibAzarDe(f,p.id), id:p.id, w:p.t, h:barajar(vs).slice(0, p.t.replace(/ /g,'').length>=7 && vs.length>1 ? 2 : 1).sort((a,b)=>a-b)}; });
  items=items.filter(x=>x.h.every(i=>x.w[i])); items.forEach(x=>x.puestas=[]);
  const letras=[...new Set([...VOCALES_APR, ...items.flatMap(x=>x.h.map(i=>x.w[i]))])];
  const lleno = x => x.puestas.length===x.h.length;
  const POR=8, npag=Math.ceil(items.length/POR); let pag=0, sel=0;
  const ver = c => mayus ? c.toUpperCase() : c;
  const pinta=()=>{
    const vis=items.slice(pag*POR, pag*POR+POR);
    z.innerHTML=ordenHTML('Mira el dibujo y completa las letras que faltan.')+
      `${npag>1?`<p class="nota centro">${hq?`Hoja ${hq.n+1} · `:''}${pag+1} de ${npag}</p>`:''}
      <div class="cole-completa fam-letras">${vis.map((x,jj)=>{ const j=pag*POR+jj; return `<button type="button" class="cole-cmp${j===sel&&!lleno(x)?' sel':''}${lleno(x)?' hecho':''}" data-j="${j}"><span class="ft">${aprDib(f, x.k, x.id)}</span>
        <span class="fam-mayus${mayus?'':' '+claseTexto()}">${[...x.w].map((c,i)=>{ if(c===' ') return '<i class="fam-esp"></i>'; const hi=x.h.indexOf(i); return hi<0 ? esc(ver(c)) : `<b class="hueco-c">${hi<x.puestas.length?esc(ver(c)):'_'}</b>`; }).join(mayus?' ':'')}</span></button>`; }).join('')}</div>
      <div class="botones cole-letras" style="justify-content:center">${letras.map(c=>`<button type="button" class="btn btn-xl btn-p" data-l="${esc(c)}">${esc(ver(c))}</button>`).join('')}</div>
      <div class="botones" style="justify-content:center;margin-top:8px">${pag>0?`<button class="btn btn-borde btn-g" type="button" id="aprAnt">${ic('atras')} Antes</button>`:''}
        ${pag+1<npag?`<button class="btn btn-p btn-g" type="button" id="aprSig" ${vis.every(lleno)?'':'disabled'}>Siguiente ${ic('flecha')}</button>`:''}</div>
      <p class="nota centro">Toca un dibujo y luego la letra que falta.</p>`;
    const o=$('#oirOrden', z); if(o) o.onclick=()=>decir(textoOrden());
    if($('#aprAnt', z)) $('#aprAnt', z).onclick=()=>{ pag--; sel=items.findIndex((y,j)=>j>=pag*POR && !lleno(y)); pinta(); };
    if($('#aprSig', z)) $('#aprSig', z).onclick=()=>{ pag++; sel=items.findIndex((y,j)=>j>=pag*POR && !lleno(y)); pinta(); };
    $$('.cole-cmp', z).forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; if(lleno(items[j])) return; sel=j; pinta(); });
    $$('[data-l]', z).forEach(b=>b.onclick=()=>{ const x=items[sel]; if(!x || lleno(x)) return;
      const falta=x.w[x.h[x.puestas.length]];
      if(b.dataset.l===falta){ x.puestas.push(falta); decir(l==='en' && typeof NL_EN==='function' ? NL_EN(falta) : falta, l);
        if(lleno(x)){ bienT(); setTimeout(()=>decirPal(f, x.id), 700);
          const sig=items.findIndex((y,j)=>j>=pag*POR && j<pag*POR+POR && !lleno(y));
          if(items.every(lleno)){ pinta(); setTimeout(terminarTrabajo, 1400); return; }
          if(sig<0){ pinta(); if(pag+1<npag) setTimeout(()=>{ if(actual==='trabajo' && !trab.fin){ pag++; sel=pag*POR; pinta(); } }, 1500); return; }
          sel=sig; }
        pinta(); }
      else malT(b, 'Esa letra no es. Mira bien la palabra.'); });
  };
  pinta();
}

const FUNC_APR = {choose:tAprChoose, match:tAprMatch, write:tAprWrite, detect:tAprDetect, routine:tAprRoutine, letters:tAprLetters};
