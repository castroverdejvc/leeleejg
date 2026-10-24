/* LeeLEEJG · leer mejor (24/10/2026):
   1) Releer para ir más rápido: al terminar una historia leída otra vez, la gráfica de sus palabras por minuto
      en cada lectura («La primera vez 8, hoy 12 🚀»); al leer una nueva, el reto de leerla otra vez.
   2) Mis 5 palabras de hoy: cada día, 5 de las palabras con las que más ayuda pide; con cada una, oírla y leerla,
      juntar sus sílabas y encontrarla entre otras. Cuando le sale bien a la primera 3 días distintos, pasa a «ya la domino».
      Cuenta como una ficha (⭐, tele y objetivos). cfg.palDiaLog, cfg.palDia {palabra:{ok:[días], ultimo}}. */
'use strict';

/* ---------- 1 · fluidez al releer ---------- */
function fluidezDe(p, hid, s){
  const xs=sesDe(p.id).filter(x=>x.historiaId===hid && !x.incompleta && x.ppm>0 && !x.desdePalabra && (!s || x.id!==s.id)).sort((a,b)=>a.fecha<b.fecha?-1:1).map(x=>({ppm:Math.round(x.ppm), f:x.fecha}));
  if(s && s.ppm>0 && !s.desdePalabra) xs.push({ppm:Math.round(s.ppm), f:s.fecha||new Date().toISOString(), hoy:true});
  return xs;
}
function graficaFluidez(xs){
  const max=Math.max(...xs.map(x=>x.ppm), 5), W=Math.max(180, xs.length*54), H=120, bw=34;
  return `<svg class="graf-flu" viewBox="0 0 ${W} ${H+22}" width="${W}" height="${H+22}" role="img" aria-label="Palabras por minuto en cada lectura">${xs.map((x,i)=>{ const h=Math.max(6, Math.round((H-22)*x.ppm/max)), X=10+i*54;
    return `<rect x="${X}" y="${H-h}" width="${bw}" height="${h}" rx="7" fill="${x.hoy?'#16A34A':'#93C5FD'}"/><text x="${X+bw/2}" y="${H-h-6}" text-anchor="middle" font-size="13" font-weight="800" fill="#1E293B">${x.ppm}</text><text x="${X+bw/2}" y="${H+16}" text-anchor="middle" font-size="12" fill="#475569">${x.hoy?'hoy':(i+1)+'.ª'}</text>`; }).join('')}</svg>`;
}
function fluidezHTML(h, s, eraNueva){
  const p=perfil(); if(p.prueba) return '';
  if(eraNueva) return `<p class="reto-flu">🔁 <b>Reto:</b> léela otra vez otro día. La segunda vez sale más rápido, ¡ya verás! ⭐</p>`;
  const xs=fluidezDe(p, h.id, s); if(xs.length<2) return '';
  const pri=xs[0].ppm, hoy=xs[xs.length-1].ppm, mej=pri>0?Math.round(100*(hoy-pri)/pri):0;
  return `<div class="fluidez-caja"><p class="mejora-rel">${mej>=10?'🚀 ':''}La primera vez, <b>${pri}</b> palabras por minuto; hoy, <b>${hoy}</b>.${mej>=10?` ¡Has mejorado un ${mej} %!`:mej<=-10?' Hoy ha costado más: ¡no pasa nada, otro día sale mejor!':' ¡Sigue practicando!'}</p>${graficaFluidez(xs)}</div>`;
}
/* familia: cuánto mejora al releer (Evolución › Lecturas) */
function fluidezAdultoHTML(p){
  const por={}; sesDe(p.id).filter(x=>!x.incompleta && x.ppm>0 && !x.desdePalabra).sort((a,b)=>a.fecha<b.fecha?-1:1).forEach(x=>{ (por[x.historiaId]=por[x.historiaId]||[]).push(x); });
  const rel=Object.entries(por).filter(([,xs])=>xs.length>=2).map(([hid,xs])=>{ const h=historia(hid); const a=xs[0].ppm, b=xs[xs.length-1].ppm; return {t:h?conNombre(h.titulo):hid, n:xs.length, a:Math.round(a), b:Math.round(b), m:a?Math.round(100*(b-a)/a):0}; }).sort((x,y)=>y.m-x.m);
  if(!rel.length) return `<div class="card bloque" style="margin-top:18px"><h3>🔁 Fluidez al releer</h3><p class="vacio">Cuando lea una historia por segunda vez, aquí se verá si va más rápido.</p></div>`;
  const med=Math.round(media(rel.map(r=>r.m)));
  return `<div class="card bloque" style="margin-top:18px"><h3>🔁 Fluidez al releer</h3><p class="nota" style="margin-bottom:8px">Releer es de lo que más ayuda a leer con soltura. De media, al releer va un <b>${med>0?'+':''}${med} %</b> ${med>=0?'más rápido':'más despacio'} que la primera vez (${rel.length} ${rel.length===1?'historia':'historias'}).</p>
    <div class="tabla-w"><table><thead><tr><th>Historia</th><th>Veces</th><th>1.ª vez</th><th>Última</th><th>Mejora</th></tr></thead><tbody>${rel.slice(0,12).map(r=>`<tr><td>${esc(r.t)}</td><td>${r.n}</td><td>${r.a}</td><td>${r.b}</td><td><span class="nb ${r.m>=10?'bien':r.m<=-10?'mal':'medio'}">${r.m>0?'+':''}${r.m} %</span></td></tr>`).join('')}</tbody></table></div></div>`;
}

/* ---------- 2 · mis 5 palabras de hoy ---------- */
const PAL_DIA_N = 5, PAL_DIA_DOMINA = 3;
function palabrasDelDia(p=perfil(), d=new Date()){
  const k=claveDia(d), c=cfgDe(p), est=c.palDia||{};
  const hecha=(c.palDiaLog||[]).find(x=>claveDia(x.f)===k);
  if(hecha) return hecha.palabras.map(x=>x.p);
  const dom=w=>est[w] && est[w].dom;
  const dif=(typeof palabrasDificiles==='function'?palabrasDificiles(sesDe(p.id)):[]).map(x=>x.p).filter(w=>/^[a-záéíóúñü]{2,12}$/i.test(w) && !dom(w));
  const vistas=new Set(dif.map(w=>w.toLowerCase())), mas=[];
  const hs=sesDe(p.id).slice(-8).map(s=>historia(s.historiaId)).filter(Boolean); if(!hs.length) hs.push(historiaDeHoy());
  hs.forEach(h=>(h.lineas||[]).forEach(l=>{ for(const m of l.matchAll(/\[([^|\]]+)\|([^\]]+)\]/g)){ const w=m[1].toLowerCase(); if(!vistas.has(w) && w.length>3 && !dom(w) && /^[a-záéíóúñü]+$/.test(w)){ vistas.add(w); mas.push(w); } } }));
  return [...dif.slice(0,PAL_DIA_N), ...barajarCon(mas, semilla(p.id+k))].slice(0,PAL_DIA_N);
}
const palDiaHecho = (p=perfil()) => (cfgDe(p).palDiaLog||[]).some(x=>claveDia(x.f)===claveDia(new Date()));
function palabrasDiaHTML(){
  const p=perfil(); if(p.prueba) return '';
  const ws=palabrasDelDia(p); if(ws.length<2) return '';
  if(palDiaHecho(p)) return `<button class="acceso blanco pal-dia hecho" type="button" data-ir="palabrasdia"><span class="emo-g">✅</span><span><b>Mis palabras de hoy: ¡hechas!</b><span class="nota">${ws.map(esc).join(' · ')}</span></span><span class="ir">${ic('dcha')}</span></button>`;
  return `<button class="acceso pal-dia" type="button" data-ir="palabrasdia"><span class="emo-g">🔤</span><span><b>Mis ${ws.length} palabras de hoy</b><span class="nota">Las que más te cuestan, en un minuto. ⭐</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
let palDia=null;
definir('palabrasdia', {nav:'practicar', pintar(){
  const p=perfil(); const ws=palabrasDelDia(p);
  if(!palDia || palDia.dia!==claveDia(new Date())) palDia={dia:claveDia(new Date()), ws, i:0, paso:0, res:ws.map(w=>({p:w, err:0})), hecho:palDiaHecho(p)};
  const s=$('#s-palabrasdia');
  if(palDia.hecho && palDia.i===0 && palDia.paso===0){
    const est=cfgDe(p).palDia||{};
    s.innerHTML=`<div class="pag-cab"><h1 class="tit">🔤 Mis palabras de hoy</h1></div><div class="card bloque centro"><p class="sub">¡Ya las has practicado hoy! Mañana tendrás otras.</p>
      <div class="tarjetas-pal">${ws.map(w=>{ const k=claveDePalabra(w), e=est[w]||{}; return `<div class="tp"><span class="ft">${k?imgHTML(k):'📖'}</span><b>${esc(w)}</b><span class="nota">${e.dom?'⭐ ¡Ya la dominas!':`${(e.ok||[]).length} de ${PAL_DIA_DOMINA} días bien`}</span></div>`; }).join('')}</div>
      <div class="botones" style="justify-content:center;margin-top:14px"><button class="btn btn-borde" type="button" id="palOtraVez">🔁 Practicarlas otra vez</button><button class="btn btn-p" type="button" data-ir="inicio">${ic('casa')} Inicio</button></div></div>`;
    $('#palOtraVez').onclick=()=>{ palDia.hecho=false; palDia.extra=true; ir('palabrasdia'); }; return;
  }
  const w=palDia.ws[palDia.i]; if(w==null){ palDiaFin(); return; }
  const k=claveDePalabra(w), sil=silabear(w);
  const cab=`<div class="pag-cab"><h1 class="tit">🔤 Mis palabras de hoy</h1><div style="text-align:center"><b>${palDia.i+1} de ${palDia.ws.length}</b><div class="prog-puntos">${palDia.ws.map((_,j)=>`<i class="${j<palDia.i?'ok':j===palDia.i?'on':''}"></i>`).join('')}</div></div></div>`;
  const pasoTxt=['1 · Escúchala y léela','2 · Junta las sílabas','3 · ¿Cuál es?'][palDia.paso];
  if(palDia.paso===0){
    s.innerHTML=cab+`<div class="card practica"><div class="ft">${k?imgHTML(k,true):'📖'}</div><div><span class="pill">${pasoTxt}</span><div class="palabra-g"><div class="silabas-g" id="palSil">${sil.map((x,i)=>`<span class="s ${i%2?'b':'a'}">${esc(x)}</span>`).join('<span class="p">·</span>')}</div></div>
      <div class="botones"><button class="btn btn-borde btn-g" type="button" id="palOir">${ic('altavoz')} Escuchar</button><button class="btn btn-p btn-g" type="button" id="palLeida">¡La he leído! ${ic('flecha')}</button></div></div></div>`;
    const oir=async()=>{ const ss=$$('#palSil .s'); for(let i=0;i<sil.length && actual==='palabrasdia';i++){ ss.forEach((x,j)=>x.classList.toggle('on', j===i)); await decir(sil[i]); await pausa(120); } ss.forEach(x=>x.classList.remove('on')); if(actual==='palabrasdia') decir(w); };
    $('#palOir').onclick=oir; $('#palLeida').onclick=()=>{ palDia.paso=1; ir('palabrasdia'); };
    setTimeout(()=>{ if(actual==='palabrasdia') decir('Escucha y lee: '+w); }, 250);
  } else if(palDia.paso===1){
    const desord = sil.length>1 ? (()=>{ let a; let t=0; do{ a=barajar(sil.map((x,i)=>({x,i}))); t++; } while(t<8 && a.every((o,j)=>o.i===j)); return a; })() : sil.map((x,i)=>({x,i}));
    let puesto=0;
    s.innerHTML=cab+`<div class="card practica"><div class="ft">${k?imgHTML(k,true):'📖'}</div><div><span class="pill">${pasoTxt}</span><p class="nota">Toca las sílabas en orden para formar <b>la palabra</b>.</p>
      <div class="pal-hueco" id="palHueco">${sil.map(()=>'<span class="h"></span>').join('')}</div>
      <div class="pal-sils">${desord.map(o=>`<button type="button" class="sil-b" data-i="${o.i}">${esc(o.x)}</button>`).join('')}</div></div></div>`;
    $$('#s-palabrasdia .sil-b').forEach(b=>b.onclick=()=>{ if(+b.dataset.i===puesto){ const hs=$$('#palHueco .h'); hs[puesto].textContent=b.textContent; hs[puesto].classList.add('ok'); b.disabled=true; b.classList.add('usada'); puesto++; sonido('toc');
        if(puesto===sil.length){ sonido('bien'); decir(w); setTimeout(()=>{ palDia.paso=2; ir('palabrasdia'); }, 900); } }
      else { palDia.res[palDia.i].err++; sonido('mal'); sacudir(b); } });
    setTimeout(()=>{ if(actual==='palabrasdia') decir('Junta las sílabas de '+w); }, 250);
  } else {
    const otras=barajar(palDia.ws.filter(x=>x!==w).concat(['mesa','gato','pelota','camino','ventana','sol']).filter((x,i,a)=>a.indexOf(x)===i && x!==w)).slice(0,3);
    const ops=barajar([w, ...otras]);
    s.innerHTML=cab+`<div class="card bloque centro"><span class="pill">${pasoTxt}</span><p class="sub">Escucha y toca la palabra que oyes. <button class="btn btn-mini" type="button" id="palOir2">${ic('altavoz')}</button></p>
      <div class="pal-ops">${ops.map(x=>`<button type="button" class="pal-op ${claseTexto()}" data-w="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`;
    $('#palOir2').onclick=()=>decir(w);
    $$('#s-palabrasdia .pal-op').forEach(b=>b.onclick=()=>{ if(b.dataset.w===w){ b.classList.add('bien'); sonido('bien'); $$('#s-palabrasdia .pal-op').forEach(x=>x.disabled=true);
        setTimeout(()=>{ palDia.i++; palDia.paso=0; ir('palabrasdia'); }, 800); }
      else { palDia.res[palDia.i].err++; b.classList.add('mal'); b.disabled=true; sonido('mal'); decir('Escucha otra vez: '+w); } });
    setTimeout(()=>{ if(actual==='palabrasdia') decir('¿Cuál es '+w+'?'); }, 250);
  }
}, salir(){ if(typeof callar==='function') callar(); }});
function palDiaFin(){
  const p=perfil(), c=cfgDe(p), hoy=claveDia(new Date()), r=palDia.res.map(x=>({p:x.p, ok:x.err===0}));
  const bien=r.filter(x=>x.ok).length; const nuevas=[];
  if(!palDia.extra){
    c.palDiaLog=(c.palDiaLog||[]).concat([{f:new Date().toISOString(), n:r.length, bien, palabras:r}]).slice(-800);
    const est={...(c.palDia||{})};
    r.forEach(x=>{ const e={ok:[], ...(est[x.p]||{})}; if(x.ok && !e.ok.includes(hoy)) e.ok=e.ok.concat([hoy]).slice(-10);
      if(!e.dom && e.ok.length>=PAL_DIA_DOMINA){ e.dom=hoy; nuevas.push(x.p); aj.practica=aj.practica||{}; aj.practica[x.p]=(aj.practica[x.p]||0)+5; }
      est[x.p]=e; });
    c.palDia=est;
  }
  guardarAj();
  const est = palDia.extra ? 0 : 1 + (bien/r.length>=0.8 ? 1 : 0);
  palDia={...palDia, hecho:true, i:0, paso:0, extra:false};
  $('#s-palabrasdia').innerHTML=`<div class="card buen-trabajo"><h1>¡Buen trabajo!</h1><p class="sub">${bien} de ${r.length} a la primera.${est?` ${'⭐'.repeat(est)} +${est}`:''}</p>
    ${nuevas.length?`<p class="mejora-rel">🏅 ¡Ya dominas ${nuevas.map(w=>`<b>${esc(w)}</b>`).join(', ')}!</p>`:''}
    <div class="tarjetas-pal">${r.map(x=>{ const k=claveDePalabra(x.p); return `<div class="tp"><span class="ft">${k?imgHTML(k):'📖'}</span><b>${esc(x.p)} ${x.ok?`<i>${ic('check')}</i>`:''}</b></div>`; }).join('')}</div>
    <div class="botones" style="max-width:640px;margin:14px auto 0"><button class="btn btn-p btn-g" type="button" data-ir="inicio">${ic('casa')} Volver al inicio</button></div></div>`;
  confeti($('#s-palabrasdia .buen-trabajo')); sonido('cromo');
  decir(nuevas.length ? `¡Muy bien, ${nombre()}! ¡Ya dominas ${nuevas.join(' y ')}!` : `¡Muy bien, ${nombre()}!`);
  if(typeof avisarTele==='function') avisarTele(perfil(), true);
}
/* familia: palabras dominadas y en camino (Evolución › Palabras) */
function palabrasDiaAdultoHTML(p){
  const est=cfgDe(p).palDia||{}, log=cfgDe(p).palDiaLog||[]; if(!log.length) return '';
  const dom=Object.entries(est).filter(([,e])=>e.dom).map(([w])=>w), camino=Object.entries(est).filter(([,e])=>!e.dom && (e.ok||[]).length).map(([w,e])=>[w,(e.ok||[]).length]);
  return `<div class="card bloque" style="margin-top:18px"><h3>🔤 Mis 5 palabras de hoy</h3><p class="nota">${log.length} ${log.length===1?'día':'días'} practicados · ${log.reduce((a,x)=>a+x.bien,0)} de ${log.reduce((a,x)=>a+x.n,0)} a la primera.</p>
    ${dom.length?`<p style="margin-top:6px">Ya domina (${PAL_DIA_DOMINA} días bien): ${dom.map(w=>`<b>${esc(w)}</b>`).join(', ')}</p>`:''}${camino.length?`<p class="nota" style="margin-top:4px">En camino: ${camino.map(([w,n])=>`${esc(w)} (${n}/${PAL_DIA_DOMINA})`).join(', ')}</p>`:''}</div>`;
}

/* ---------- 3 · comprensión: «Ordena lo que pasó» (al terminar una historia) ---------- */
const lineaPlana = l => conNombre(l).replace(/\[([^|\]]+)\|[^\]]+\]/g,'$1').trim();
const fotoDeLinea = l => { const m=String(l).match(/\[([^|\]]+)\|([^\]]+)\]/); return m ? m[2] : null; };
function trozosParaOrdenar(h){
  const ls=(h.lineas||[]).filter(l=>lineaPlana(l).split(/\s+/).length>=3); if(ls.length<3) return null;
  const idx=[0, Math.floor((ls.length-1)/2), ls.length-1].filter((x,i,a)=>a.indexOf(x)===i); if(idx.length<3) return null;
  return idx.map((i,orden)=>({orden, l:ls[i], txt:lineaPlana(ls[i]), foto:fotoDeLinea(ls[i])}));
}
let ordenEst=null;
function ordenarBotonHTML(h){ return trozosParaOrdenar(h) ? `<button class="btn btn-borde btn-g btn-bloque" type="button" id="btnOrdenar">🧩 Ordena lo que pasó (+⭐)</button>` : ''; }
function activarOrdenarBoton(h){ const b=$('#btnOrdenar'); if(b) b.onclick=()=>{ ordenEst={h, t:trozosParaOrdenar(h), puesto:[], err:0}; ordenEst.mezcla=(()=>{ let a; let n=0; do{ a=barajar(ordenEst.t); n++; } while(n<8 && a.every((x,i)=>x.orden===i)); return a; })(); ir('ordenar'); }; }
definir('ordenar', {nav:'inicio', pintar(){
  if(!ordenEst){ ir('inicio'); return; } const E=ordenEst;
  $('#s-ordenar').innerHTML=`<div class="pag-cab"><h1 class="tit">🧩 Ordena lo que pasó</h1></div>
    <div class="card bloque"><p class="sub">${esc(conNombre(E.h.titulo))}: toca lo que pasó <b>primero</b>, luego lo de <b>en medio</b> y al final lo <b>último</b>.</p>
      <div class="orden-huecos">${[0,1,2].map(i=>{ const t=E.puesto[i]; return `<div class="orden-h ${t?'ok':''}"><span class="n">${i+1}</span>${t?`<span class="${claseTexto()}">${esc(t.txt)}</span>`:''}</div>`; }).join('')}</div>
      <div class="orden-ops">${E.mezcla.filter(t=>!E.puesto.includes(t)).map(t=>`<button type="button" class="orden-op" data-o="${t.orden}">${t.foto?`<span class="ft">${imgHTML(t.foto)}</span>`:''}<span class="${claseTexto()}">${esc(t.txt)}</span></button>`).join('')}</div>
      <p class="nota">Si no te acuerdas, toca el altavoz para oír cada trozo. <button class="btn btn-mini" type="button" id="ordOir">${ic('altavoz')}</button></p></div>`;
  $('#ordOir').onclick=async()=>{ for(const t of E.mezcla.filter(x=>!E.puesto.includes(x))){ if(actual!=='ordenar') return; await decir(t.txt); await pausa(250); } };
  $$('#s-ordenar .orden-op').forEach(b=>b.onclick=()=>{ const t=E.t[+b.dataset.o];
    if(t.orden===E.puesto.length){ E.puesto.push(t); sonido('bien');
      if(E.puesto.length===3){ const bien=E.err===0; apuntarEdu('ordena-historia', 3, bien?3:Math.max(0,3-E.err)); confeti($('#s-ordenar .card')); sonido('cromo');
        decir(bien?'¡Perfecto! Te acuerdas muy bien de la historia.':'¡Muy bien! Ya está ordenada.');
        $('#s-ordenar').insertAdjacentHTML('beforeend', `<div class="botones" style="justify-content:center;margin-top:14px"><button class="btn btn-p btn-g" type="button" data-ir="inicio">${ic('casa')} Volver al inicio</button></div>`);
        ordenEst=null; setTimeout(()=>{ const nuevo=$('#s-ordenar .orden-ops'); if(nuevo) nuevo.remove(); }, 0); }
      else ir('ordenar'); }
    else { E.err++; sonido('mal'); sacudir(b); decir(E.puesto.length===0?'Eso no fue lo primero. ¿Qué pasó al principio?':'Eso pasó más tarde. ¿Qué pasó antes?'); } });
  if(!E.puesto.length) setTimeout(()=>{ if(actual==='ordenar') decir('Ordena lo que pasó en la historia. ¿Qué pasó primero?'); }, 300);
}});

/* ---------- 4 · prueba de nivel del mes: una historia nueva de su nivel, para ver cuánto avanza ---------- */
const DIAS_PRUEBA_NIVEL = 28;
let pruebaNivelEnCurso=null;
function pruebaNivelToca(p=perfil()){
  if(p.prueba) return false; const c=cfgDe(p), log=c.nivelLog||[];
  if(c.nivelPedir) return true;
  if(sesDe(p.id).filter(s=>!s.incompleta).length<5) return false;
  if(!log.length) return true;
  return Date.now()-new Date(log[log.length-1].f).getTime() > DIAS_PRUEBA_NIVEL*DIA_MS;
}
function nivelLector(p){ const ns=sesDe(p.id).filter(s=>!s.incompleta && !esComp(s.historiaId)).slice(-6).map(s=>+s.nivel||1).sort((a,b)=>a-b); return ns.length ? ns[Math.floor(ns.length/2)] : 1; }
function historiaPruebaNivel(p=perfil()){
  const n=nivelLector(p), leid=leidasDe(p.id), P=typeof planDe==='function'?planDe(p):null, hoy=diaHoyDe(p);
  const cerca=h=>{ const d=P && P.diaDe ? P.diaDe[h.id] : null; return d && d>=hoy && d<=hoy+90; };
  const cand=CONT.historias.filter(h=>!leid[h.id] && !h.especial && (+h.nivel||1)===n && !cerca(h) && (h.lineas||[]).length>=3);
  if(!cand.length) return null;
  return barajarCon(cand, semilla(p.id+'-nivel-'+claveDia(new Date()).slice(0,7)))[0];
}
function pruebaNivelHTML(){
  const p=perfil(); if(!pruebaNivelToca(p) || !historiaPruebaNivel(p)) return '';
  return `<button class="acceso prueba-nivel" type="button" id="btnPruebaNivel"><span class="emo-g">📏</span><span><b>La lectura especial del mes</b><span class="nota">Una historia nueva para ver cuánto has avanzado. ¡Léela lo mejor que puedas! ⭐⭐</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
function activarPruebaNivel(){ const b=$('#btnPruebaNivel'); if(!b) return; b.onclick=()=>{ const h=historiaPruebaNivel(); if(!h) return; pruebaNivelEnCurso=h.id; empezarHistoria(h); }; }
/* al terminar la historia (lo llama lectura.js) */
function registrarPruebaNivel(s){
  if(!s || !s.pruebaNivel) return; const p=perfil(), c=cfgDe(p);
  if((c.nivelLog||[]).some(x=>x.sid===s.id)) return;
  c.nivelLog=(c.nivelLog||[]).concat([{f:s.fecha||new Date().toISOString(), sid:s.id, hid:s.historiaId, titulo:s.titulo, nivel:s.nivel, ppm:Math.round(s.ppm||0), comp:pctComp(s), seg:s.segundos||0}]).slice(-60);
  delete c.nivelPedir; pruebaNivelEnCurso=null; guardarAj();
}
function pruebasNivelAdultoHTML(p, conBoton=true){
  const log=cfgDe(p).nivelLog||[];
  const filas=log.map((x,i)=>{ const a=log[i-1]; const d=a&&a.ppm?Math.round(100*(x.ppm-a.ppm)/a.ppm):null; return `<tr><td>${esc(fechaCorta(x.f))}</td><td>${esc(x.titulo||'')}</td><td>${x.nivel||'–'}</td><td><b>${x.ppm||'–'}</b>${d!=null?` <small class="${d>=0?'verde':'rojo'}">${d>0?'+':''}${d} %</small>`:''}</td><td>${x.comp==null?'–':x.comp+' %'}</td></tr>`; }).join('');
  return `<div class="card bloque" style="margin-top:18px"><div class="pag-cab" style="margin:0 0 6px"><h3>📏 Lectura especial del mes (prueba de nivel)</h3>${conBoton?`<button class="btn btn-mini no-imprimir" type="button" id="btnNivelPedir">${cfgDe(p).nivelPedir?'Le saldrá al abrir':'Hacer una ahora'}</button>`:''}</div>
    <p class="nota" style="margin-bottom:8px">Una vez al mes le sale en Inicio una historia nueva de su nivel. Así se ve, con un texto que no conoce, cuántas palabras por minuto lee y cuánto entiende.</p>
    ${log.length?`<div class="tabla-w"><table><thead><tr><th>Fecha</th><th>Historia</th><th>Nivel</th><th>Palabras/min</th><th>Comprensión</th></tr></thead><tbody>${filas}</tbody></table></div>`:'<p class="vacio">Todavía no ha hecho ninguna.</p>'}</div>`;
}
function activarPruebasNivelAdulto(p){ const b=$('#btnNivelPedir'); if(b) b.onclick=()=>{ cfgDe(p).nivelPedir=true; guardarAj(); aviso('Le saldrá en Inicio'); ir('evolucion','lecturas'); }; }
