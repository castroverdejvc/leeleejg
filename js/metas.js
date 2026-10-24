/* LeeLEEJG · revistas, objetivos de la semana y el cofre del tesoro (24/10/2026). Decidido por la familia:
   - Revistas (de verdad, la elige con papá o mamá): como mucho 2 a la semana (de sábado a viernes):
     la 1.ª al llegar a 45 ⭐ en la semana y la 2.ª a 75 ⭐ (aj.premios.revista1 / revista2).
   - Objetivos de la semana (aj.premios.objetivos): por defecto la historia del día 7 veces, 5 lecturas extra y
     5 fichas/trabajos/rondas; la familia puede cambiarlos o poner uno suyo que marca a mano. Cumplirlos todos: +10 ⭐.
   - Cofre del tesoro (premios grandes): caja pequeña de Pokémon cada 500 ⭐ y caja grande (One Piece o Pokémon grande,
     a elegir) cada 1000 ⭐, contando desde el 24/10/2026 (aj.premios.cajaPeq / cajaGrande).
   Todo se calcula de lo hecho; lo que se da se apunta (cfg.revistasLog, cfg.cajasLog). */
'use strict';
const OBJ_DEF = [{tipo:'dia', n:7}, {tipo:'extra', n:5}, {tipo:'fichas', n:5}];
const OBJ_TIPOS = {
  dia:{emo:'📖', t:n=>`Leer la historia del día ${n===7?'los 7 días':n===1?'una vez':n+' veces'}`},
  extra:{emo:'📚', t:n=>`${n} ${n===1?'lectura extra':'lecturas extra'}`},
  fichas:{emo:'✏️', t:n=>`${n} fichas, trabajos o rondas de «Aprender jugando»`},
  dias:{emo:'📅', t:n=>`Leer ${n} días distintos`},
  estrellas:{emo:'⭐', t:n=>`Conseguir ${n} ⭐`},
  deporte:{emo:'🏆', t:n=>`Superar ${n} ${n===1?'fase':'fases'} de deportes`},
  manual:{emo:'🏠', t:(n,o)=>o.txt||'Objetivo de la familia'}
};
const OBJ_BONUS = 10;
const objetivosCfg = () => { const o=premiosCfg().objetivos; return Array.isArray(o) && o.length ? o : OBJ_DEF; };
const semanaK = d => claveDia(sabadoDe(new Date(d)));

/* marcas a mano de los objetivos de la familia: la última de cada (semana, objetivo) manda */
function marcasManual(p){ const m={}; (cfgDe(p).objManualLog||[]).slice().sort((a,b)=>a.f<b.f?-1:1).forEach(x=>{ m[x.semana+'|'+x.i]=x.quitar?null:x.f; }); return m; }

/* cómo van los objetivos de una semana. «base» son los eventos de estrellas sin los bonus (para no dar vueltas) */
function objetivosSemana(p, desde, base){
  const hasta=diasDespues(desde,7), k=claveDia(desde), c=cfgDe(p), en=f=>{ const t=+new Date(f); return t>=+desde && t<+hasta; };
  const ev=(base||estrellasEventos(p).filter(e=>e.tipo!=='objetivos')).filter(e=>en(e.f));
  const logs=['dictadoLog','repasoLog','letrasLog','trabajosLog','eduLog'].flatMap(x=>(c[x]||[]).filter(y=>y.f && en(y.f)).map(y=>({f:y.f})));
  const dep=(c.deporteLog||[]).filter(y=>y.gano && en(y.f)).map(y=>({f:y.f}));
  const man=marcasManual(p);
  /* para cada objetivo: lista de momentos que cuentan (ordenados) → hecho y cuándo se cumplió */
  const lista=objetivosCfg().map((o,i)=>{ const n=Math.max(1,+o.n||1); let momentos=[];
    if(o.tipo==='dia') momentos=ev.filter(e=>e.tipo==='dia').map(e=>e.f);
    else if(o.tipo==='extra') momentos=ev.filter(e=>e.tipo==='extra').map(e=>e.f);
    else if(o.tipo==='fichas') momentos=logs.map(x=>x.f);
    else if(o.tipo==='dias'){ const vistos=new Set(); ev.filter(e=>['dia','extra','nueva','relee'].includes(e.tipo)).sort((a,b)=>+new Date(a.f)-+new Date(b.f)).forEach(e=>{ const d=claveDia(e.f); if(!vistos.has(d)){ vistos.add(d); momentos.push(e.f); } }); }
    else if(o.tipo==='deporte') momentos=dep.map(x=>x.f);
    else if(o.tipo==='estrellas'){ let s=0; ev.slice().sort((a,b)=>+new Date(a.f)-+new Date(b.f)).forEach(e=>{ const antes=s; s+=e.n; for(let v=antes+1; v<=s; v++) momentos.push(e.f); }); }
    else if(o.tipo==='manual'){ const f=man[k+'|'+i]; if(f) momentos=[f]; }
    momentos.sort((a,b)=>+new Date(a)-+new Date(b));
    const hecho=Math.min(n, o.tipo==='manual'?(momentos.length?1:0):momentos.length), meta=o.tipo==='manual'?1:n;
    return {i, o, n:meta, hecho, ok:hecho>=meta, cuando: hecho>=meta ? momentos[meta-1] : null, txt:(OBJ_TIPOS[o.tipo]||OBJ_TIPOS.manual).t(n,o), emo:(OBJ_TIPOS[o.tipo]||OBJ_TIPOS.manual).emo};
  });
  const todos=lista.every(x=>x.ok); const fecha=todos ? lista.map(x=>x.cuando).sort((a,b)=>+new Date(b)-+new Date(a))[0] : null;
  return {lista, todos, fecha, desde, k};
}
/* el bonus de +10 ⭐ de cada semana con todos los objetivos (lo llama estrellas.js) */
function eventosObjetivos(p, base){
  const out=[]; if(!base.length) return out;
  const primero=sabadoDe(new Date(Math.max(+CORTE_PREMIOS, +new Date(base[0].f)))); const hoy=sabadoDe(hoyTele());
  for(let d=new Date(primero); +d<=+hoy; d=diasDespues(d,7)){ const s=objetivosSemana(p, d, base); if(s.todos && s.fecha && despuesCorte(s.fecha)) out.push({f:s.fecha, n:OBJ_BONUS, tipo:'objetivos'}); }
  return out;
}

/* ---------- revistas ---------- */
function revistasSemana(p, desde){ const cfg=premiosCfg(), est=estrellasEntre(p, desde, diasDespues(desde,7)); const r1=+cfg.revista1||0, r2=+cfg.revista2||0;
  return {est, r1, r2, n: (r1 && est>=r1 ? 1 : 0) + (r2 && est>=r2 ? 1 : 0)}; }
function revistasDe(p=perfil()){
  const cfg=premiosCfg(); if(p.prueba || !(+cfg.revista1>0)) return {activo:false, ganadas:0, dadas:0, pend:0};
  let ganadas=0; for(let d=new Date(sabadoDe(CORTE_PREMIOS)); +d<=+sabadoDe(hoyTele()); d=diasDespues(d,7)) ganadas+=revistasSemana(p, d).n;
  const dadas=(cfgDe(p).revistasLog||[]).length; return {activo:true, ganadas, dadas, pend:Math.max(0, ganadas-dadas), sem:revistasSemana(p, sabadoDe(hoyTele()))};
}
function revistasHasta(p, t){ let n=0; for(let d=new Date(sabadoDe(CORTE_PREMIOS)); +diasDespues(d,7)<=+new Date(t); d=diasDespues(d,7)) n+=revistasSemana(p, d).n; return n; }

/* ---------- cofre del tesoro: cajas ---------- */
function cajasHitos(p=perfil()){
  const cfg=premiosCfg(), peq=+cfg.cajaPeq||0, gr=+cfg.cajaGrande||0, est=estrellasDe(p);
  const hitos=[]; const tope=Math.max(est, 0)+Math.max(peq,gr)*2;
  const vals=new Set(); if(peq) for(let v=peq; v<=tope; v+=peq) vals.add(v); if(gr) for(let v=gr; v<=tope; v+=gr) vals.add(v);
  [...vals].sort((a,b)=>a-b).forEach(v=>hitos.push({v, tipo: gr && v%gr===0 ? 'grande' : 'pequena'}));
  const ganados=hitos.filter(h=>h.v<=est), sig=hitos.find(h=>h.v>est)||null;
  const dadas=(cfgDe(p).cajasLog||[]).length;
  return {est, peq, gr, ganados, sig, dadas, pend:Math.max(0, ganados.length-dadas), activo:!p.prueba && (peq>0||gr>0)};
}
const nombreCaja = t => t==='grande' ? 'una caja grande (One Piece o Pokémon)' : 'una caja pequeña de Pokémon';

/* ---------- tarjetas de Inicio ---------- */
function metasHTML(){
  const p=perfil(); if(p.prueba) return '';
  const s=objetivosSemana(p, sabadoDe(hoyTele())), r=revistasDe(p), c=cajasHitos(p);
  const obj=`<div class="obj-lista">${s.lista.map(x=>`<div class="obj${x.ok?' ok':''}"><span class="obj-m">${x.ok?'✅':x.emo}</span><span class="obj-t">${esc(x.txt)}</span>${x.o.tipo==='manual'?'':`<span class="obj-n">${x.hecho} de ${x.n}</span>`}</div>`).join('')}</div>`;
  const rev = r.activo ? `<div class="rev-barra"><span>📰 Revistas de la semana</span><span class="barra-t doble"><i style="width:${Math.min(100,Math.round(100*r.sem.est/Math.max(1,r.sem.r2||r.sem.r1)))}%"></i>${r.sem.r2?`<b class="hito" style="left:${Math.round(100*r.sem.r1/r.sem.r2)}%">📰</b><b class="hito" style="left:100%">📰</b>`:''}</span><span class="nota">${r.sem.n>=2?'¡Ya tienes las 2 revistas de esta semana!':r.sem.n===1?`¡1.ª revista conseguida! Con ${r.sem.r2-r.sem.est} ⭐ más, la 2.ª.`:`${r.sem.est} de ${r.sem.r1} ⭐ para la 1.ª revista.`}</span></div>` : '';
  const caja = c.activo ? (()=>{ const ant=c.ganados.length?c.ganados[c.ganados.length-1].v:0, sig=c.sig; const pc=sig?Math.round(100*(c.est-ant)/(sig.v-ant)):100;
    return `<div class="cofre"><span class="cofre-emo">${pc>=90?'🎁':'🧰'}</span><div class="tx"><b>Cofre del tesoro</b><span class="nota">${sig?`Te faltan <b>${sig.v-c.est} ⭐</b> para ${nombreCaja(sig.tipo)}.`:''} Llevas ${c.est} ⭐.</span><span class="barra-t"><i style="width:${pc}%;background:linear-gradient(90deg,#F59E0B,#E11D48)"></i></span></div></div>`; })() : '';
  return `<div class="card metas"><div class="metas-cab"><b>🎯 Objetivos de la semana</b><span class="nota">${s.todos?`¡Todos conseguidos! +${OBJ_BONUS} ⭐ 🎉`:`Si los cumples todos: +${OBJ_BONUS} ⭐`}</span></div>${obj}${rev}${caja}</div>`;
}
/* premios de verdad que hay que dar (revista o caja): tarjeta grande y, al tocarla, papá o mamá lo apuntan */
function premiosRealesHTML(){
  const p=perfil(); if(p.prueba) return ''; const r=revistasDe(p), c=cajasHitos(p); let h='';
  if(r.activo && r.pend) h+=`<button type="button" class="card acceso premio-real revista" data-dar="revista"><span class="emo-g">📰</span><span><b>${r.pend===1?'¡Has ganado una revista!':`¡Tienes ${r.pend} revistas!`}</b><span class="nota">Elígela con papá o mamá. Cuando te la den, tocad aquí.</span></span></button>`;
  if(c.activo && c.pend){ const t=c.ganados[c.dadas]; h+=`<button type="button" class="card acceso premio-real caja" data-dar="caja"><span class="emo-g">🎁</span><span><b>¡GRAN PREMIO! ${esc(nombreCaja(t.tipo).replace(/^una /,'Una '))}</b><span class="nota">¡Has llegado a ${t.v} ⭐! Pídesela a papá o a mamá. Cuando te la den, tocad aquí.</span></span></button>`; }
  return h;
}
function activarPremiosReales(raiz){
  $$('[data-dar]', raiz).forEach(b=>b.onclick=()=>{ const tipo=b.dataset.dar, p=perfil();
    const a=12+Math.floor(Math.random()*8), m=6+Math.floor(Math.random()*4), conPin=!!aj.pin;
    const c=cajasHitos(p); const caja=tipo==='caja' ? c.ganados[c.dadas] : null;
    const d=dialogo({titulo: tipo==='revista'?'📰 Revista':'🎁 Gran premio', html:`<p class="nota">Esto es para papá o mamá.</p>
      ${caja && caja.tipo==='grande'?`<p style="font-weight:800;margin:8px 0 4px">¿Qué caja le habéis dado?</p><div class="botones"><label class="op-caja"><input type="radio" name="cualCaja" value="One Piece" checked> One Piece</label><label class="op-caja"><input type="radio" name="cualCaja" value="Pokémon"> Pokémon</label></div>`:''}
      <p style="font-weight:800;margin:10px 0 6px">${conPin?'Pon el PIN de la familia:':`¿Cuánto es ${a} × ${m}?`}</p>
      <input id="darRes" type="${conPin?'password':'number'}" inputmode="numeric" autocomplete="off" style="width:150px;font-size:1.4rem;padding:8px;border-radius:10px;border:2px solid var(--line)"><p class="pin-msg" id="darMsg"></p>`,
      botones:[{t:tipo==='revista'?'Ya le hemos dado la revista':'Ya le hemos dado la caja', cls:'btn-p', mantener:true, fn:()=>{ const v=($('#darRes',d.el).value||'').trim(); const bien=conPin?v===aj.pin:+v===a*m;
        if(!bien){ $('#darMsg',d.el).textContent=conPin?'PIN incorrecto':'No es correcto'; return; }
        const cf=cfgDe(p), f=new Date().toISOString();
        if(tipo==='revista') cf.revistasLog=(cf.revistasLog||[]).concat([{f}]).slice(-500);
        else { const cual=caja.tipo==='grande' ? (($$('input[name=cualCaja]',d.el).find(x=>x.checked)||{}).value||'') : 'Pokémon'; cf.cajasLog=(cf.cajasLog||[]).concat([{f, tipo:caja.tipo, v:caja.v, cual}]).slice(-200); }
        guardarAj(); d.cerrar(); sonido('cromo'); aviso('Apuntado'); ir('inicio'); }}, {t:'Todavía no', cls:'btn'}]});
    setTimeout(()=>{ const i=$('#darRes',d.el); if(i) i.focus(); },100); });
}
/* espera a que no haya otro aviso abierto (muñecos, récord…) para no amontonarlos */
function cuandoLibre(fn, ms=2400, intentos=12){ setTimeout(function prueba(){ if(actual!=='inicio') return; if(document.querySelector('#capa .velo')){ if(--intentos>0) setTimeout(prueba, 1500); return; } fn(); }, ms); }
/* celebración cuando llega a una revista o a una caja (una vez cada una) */
function avisarMetas(){
  const p=perfil(); if(p.prueba) return; const r=revistasDe(p), c=cajasHitos(p), cf=cfgDe(p);
  const vistas=cf.metasVistas||{rev:null, cajas:null}; let cambio=false;
  if(vistas.rev==null){ vistas.rev=r.ganadas; vistas.cajas=c.ganados.length; cf.metasVistas=vistas; guardarAj(); return; }
  if(c.ganados.length>vistas.cajas){ const t=c.ganados[c.ganados.length-1]; vistas.cajas=c.ganados.length; cambio=true;
    cuandoLibre(()=>{ const d=dialogo({titulo:'🎁 ¡¡GRAN PREMIO!!', html:`<div class="gran-premio"><span>🎁</span><p class="sub">¡Has llegado a <b>${t.v} ⭐</b>!</p><p class="sub">Te has ganado <b>${esc(nombreCaja(t.tipo))}</b>.</p><p class="nota">Pídesela a papá o a mamá.</p></div>`, cls:'dlg-premio', botones:[{t:'¡¡SÍ!!', cls:'btn-p'}]}); sonido('cromo'); confeti(d.el.querySelector('.dialogo')||document.body); setTimeout(()=>confeti(d.el.querySelector('.dialogo')||document.body), 700); decir(`¡Gran premio, ${nombre()}! Has llegado a ${t.v} estrellas y te has ganado ${nombreCaja(t.tipo)}.`); }, 2600); }
  else if(r.ganadas>vistas.rev){ vistas.rev=r.ganadas; cambio=true;
    cuandoLibre(()=>{ const d=dialogo({titulo:'📰 ¡Una revista!', html:`<p class="sub">¡Esta semana llevas ${r.sem.est} ⭐ y te has ganado una revista!</p><p class="nota">Elígela con papá o mamá.</p>`, cls:'dlg-premio', botones:[{t:'¡Genial!', cls:'btn-p'}]}); sonido('cromo'); confeti(d.el.querySelector('.dialogo')||document.body); decir(`¡${nombre()}, te has ganado una revista! Elígela con papá o mamá.`); }, 2400); }
  if(r.ganadas<vistas.rev || c.ganados.length<vistas.cajas){ vistas.rev=Math.min(vistas.rev, r.ganadas); vistas.cajas=Math.min(vistas.cajas, c.ganados.length); cambio=true; }
  if(cambio){ cf.metasVistas=vistas; guardarAj(); }
}

/* ---------- familia ---------- */
function metasAdultoHTML(p){
  const c=premiosCfg(), obj=objetivosCfg(), s=objetivosSemana(p, sabadoDe(hoyTele())), r=revistasDe(p), cj=cajasHitos(p);
  const selTipo=(i,t)=>`<select data-objt="${i}">${Object.keys(OBJ_TIPOS).map(k=>`<option value="${k}" ${k===t?'selected':''}>${OBJ_TIPOS[k].emo} ${{dia:'Historia del día',extra:'Lecturas extra',fichas:'Fichas, trabajos o rondas',dias:'Días leyendo',estrellas:'Estrellas',deporte:'Fases de deportes',manual:'Lo marcáis vosotros'}[k]}</option>`).join('')}</select>`;
  const logC=(cfgDe(p).cajasLog||[]);
  return `<div class="card bloque" style="margin-bottom:18px"><h3 style="margin-bottom:6px">🎯 Objetivos, revistas y gran premio</h3>
    <p class="nota" style="margin-bottom:10px">Objetivos de la semana (de sábado a viernes). Si los cumple todos, +${OBJ_BONUS} ⭐. Esta semana: ${s.lista.filter(x=>x.ok).length} de ${s.lista.length}.</p>
    <div class="obj-edit">${obj.map((o,i)=>`<div class="obj-fila">${selTipo(i,o.tipo)}${o.tipo==='manual'?`<input data-objtxt="${i}" value="${esc(o.txt||'')}" placeholder="Ej.: ordenar la habitación" style="flex:1;min-width:150px"><button type="button" class="btn btn-mini ${s.lista[i]&&s.lista[i].ok?'btn-verde':''}" data-objmarca="${i}">${s.lista[i]&&s.lista[i].ok?'✓ Hecho esta semana (quitar)':'Marcar hecho esta semana'}</button>`:`<input type="number" min="1" max="200" data-objn="${i}" value="${+o.n||1}" style="width:80px">`}<button type="button" class="btn btn-mini" data-objdel="${i}" aria-label="Quitar">✕</button></div>`).join('')}</div>
    <div class="botones" style="margin:8px 0 14px">${obj.length<5?'<button type="button" class="btn btn-mini" id="objAdd">+ Añadir objetivo</button>':''}<button type="button" class="btn btn-mini" id="objDef">Volver a los de serie</button></div>
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px">
      <div class="campo"><label for="prRev1">📰 1.ª revista de la semana con</label><select id="prRev1">${[0,30,40,45,50,60].map(x=>`<option value="${x}" ${x===+c.revista1?'selected':''}>${x?x+' ⭐':'Sin revistas'}</option>`).join('')}</select></div>
      <div class="campo"><label for="prRev2">📰 2.ª revista con</label><select id="prRev2">${[0,60,70,75,80,90,100].map(x=>`<option value="${x}" ${x===+c.revista2?'selected':''}>${x?x+' ⭐':'Solo una'}</option>`).join('')}</select></div>
      <div class="campo"><label for="prCajaP">🎁 Caja pequeña de Pokémon cada</label><select id="prCajaP">${[0,300,400,500,600,750].map(x=>`<option value="${x}" ${x===+c.cajaPeq?'selected':''}>${x?x+' ⭐':'Sin cajas pequeñas'}</option>`).join('')}</select></div>
      <div class="campo"><label for="prCajaG">🎁 Caja grande (One Piece o Pokémon) cada</label><select id="prCajaG">${[0,800,1000,1200,1500,2000].map(x=>`<option value="${x}" ${x===+c.cajaGrande?'selected':''}>${x?x+' ⭐':'Sin cajas grandes'}</option>`).join('')}</select></div></div>
    <p class="nota" style="margin-top:10px">📰 Revistas: ${r.activo?`ganadas ${r.ganadas}, dadas ${r.dadas}${r.pend?` · <b>${r.pend} por dar</b>`:''}. Esta semana lleva ${r.sem.est} ⭐.`:'desactivadas.'}<br>
      🎁 Cofre: ${cj.est} ⭐ desde el 24 de octubre. ${cj.sig?`Próxima: ${esc(nombreCaja(cj.sig.tipo))} a los ${cj.sig.v} ⭐ (faltan ${cj.sig.v-cj.est}).`:''} ${cj.pend?`<b>${cj.pend} por dar.</b>`:''}${logC.length?` Dadas: ${logC.map(x=>`${x.tipo==='grande'?'grande':'pequeña'} ${esc(x.cual||'')} (${esc(fechaCorta(x.f))})`).join(', ')}.`:''}</p></div>`;
}
function activarMetasAdulto(p){
  const leer=()=>objetivosCfg().map(o=>({...o}));
  const guardaObj=obj=>{ aj.premios={...(aj.premios||{}), objetivos:obj}; guardarAj(); aviso('Guardado'); ir('evolucion','premios'); };
  $$('[data-objt]').forEach(s=>s.onchange=()=>{ const obj=leer(); const i=+s.dataset.objt; obj[i]={tipo:s.value, n:s.value==='dia'?7:s.value==='estrellas'?50:s.value==='dias'?5:3, ...(s.value==='manual'?{txt:''}:{})}; guardaObj(obj); });
  $$('[data-objn]').forEach(x=>x.onchange=()=>{ const obj=leer(); obj[+x.dataset.objn].n=Math.max(1,Math.min(200,+x.value||1)); guardaObj(obj); });
  $$('[data-objtxt]').forEach(x=>x.onchange=()=>{ const obj=leer(); obj[+x.dataset.objtxt].txt=x.value.trim().slice(0,80); guardaObj(obj); });
  $$('[data-objdel]').forEach(b=>b.onclick=()=>{ const obj=leer(); obj.splice(+b.dataset.objdel,1); guardaObj(obj.length?obj:OBJ_DEF); });
  const add=$('#objAdd'); if(add) add.onclick=()=>guardaObj(leer().concat([{tipo:'manual', txt:''}]));
  $('#objDef').onclick=()=>guardaObj(OBJ_DEF.map(o=>({...o})));
  $$('[data-objmarca]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.objmarca, k=claveDia(sabadoDe(hoyTele())); const ya=!!marcasManual(p)[k+'|'+i]; const c=cfgDe(p);
    c.objManualLog=(c.objManualLog||[]).concat([{f:new Date().toISOString(), semana:k, i, ...(ya?{quitar:true}:{})}]).slice(-500); guardarAj(); aviso(ya?'Quitado':'Marcado'); ir('evolucion','premios'); });
  [['prRev1','revista1'],['prRev2','revista2'],['prCajaP','cajaPeq'],['prCajaG','cajaGrande']].forEach(([id,k])=>{ const e=$('#'+id); if(e) e.onchange=()=>{ aj.premios={...(aj.premios||{}), [k]:+e.value}; guardarAj(); aviso('Guardado'); ir('evolucion','premios'); }; });
}
