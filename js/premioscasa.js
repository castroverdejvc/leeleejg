/* LeeLEEJG · premios de casa (31/10/2026). Decidido por la familia:
   - En la pestaña Premios, junto a la tele, una tarjeta con los premios de verdad que dan papá o mamá:
     sobres de cartas (como mucho 4 por semana), revistas (como mucho 2), el cofre (cajas) cuando falta el 20 %
     y los premios nuevos que crea la familia.
   - Arriba, junto a la tele pequeña: 🎴 sobres y 📰 revistas de la semana y 🎁 cuando el cofre está cerca.
   - Premios nuevos de la familia: «cada N ⭐» acumuladas (aj.premios.nuevos), con un máximo por semana si se quiere;
     se apunta lo que se da (cfg.nuevosLog). Todo se calcula de lo hecho, con las reglas de cada día (premiosCfg(fecha)). */
'use strict';
const pctCerca = () => { const v=+premiosCfg().cajaVerPct; return isNaN(v) ? 20 : v; };
const premiosNuevos = (f) => (premiosCfg(f).nuevos||[]).filter(x=>x && x.id);
const nuevoDe = (R, id) => (R.nuevos||[]).find(y=>y && y.id===id);
function nuevoHitos(p, id){
  return hitosEstrellas(p, 'nuevo:'+id, R=>{ const x=nuevoDe(R, id); return x && x.activo!==false ? Math.max(0, +x.cada||0) : 0; },
                                       R=>{ const x=nuevoDe(R, id); return x ? Math.max(0, +x.maxSemana||0) : 0; });
}
/* cómo va cada premio nuevo de la familia */
function nuevosDe(p=perfil()){
  if(p.prueba) return [];
  const log=cfgDe(p).nuevosLog||[], sab=claveDia(sabadoDe(hoyTele()));
  return premiosNuevos().map(x=>{
    const h=nuevoHitos(p, x.id), dados=log.filter(l=>l.id===x.id).length, pend=Math.max(0, h.lista.length-dados);
    const k=Math.max(1, h.n || +x.cada || 1), falta = h.sig!=null ? Math.max(1, h.sig-h.est) : null;
    const semN=h.lista.filter(e=>claveDia(sabadoDe(new Date(e.f)))===sab).length, max=Math.max(0, +x.maxSemana||0);
    const lleno = max>0 && semN>=max;
    const pc=pctCerca(); const cerca = falta!=null && (x.ver!=='cerca' || !(pc>0) || falta<=Math.ceil(k*pc/100));
    return {...x, ganados:h.lista.length, dados, pend, falta, k, hecho: falta!=null ? Math.max(0,k-falta) : 0, ver: x.activo!==false && !!h.n && cerca, semN, max, lleno};
  });
}
const pendientesNuevos = (p=perfil()) => nuevosDe(p).filter(x=>x.pend>0);

/* ---------- la tarjeta de la pestaña Premios ---------- */
function premiosCasaHTML(){
  const p=perfil(); if(p.prueba) return '';
  const barra=(v,k,col)=>`<span class="barra-t"><i style="width:${Math.max(0,Math.min(100,Math.round(100*v/Math.max(1,k))))}%;background:${col}"></i></span>`;
  const faltaE=n=>n===1?'¡Te falta 1 ⭐!':`Te faltan ${n} ⭐`;
  const ok=b=>b?'✅':'⬜';
  const fila=(emo,t,nota,b='',cls='')=>`<div class="premio pc-fila${cls?' '+cls:''}"><span class="emo-g">${emo}</span><div class="tx"><b>${t}</b><span class="nota">${nota}</span>${b}</div></div>`;
  const filas=[], recoger=[];
  // sobres de cartas
  const s=sobresDe(p);
  if(s.activo){ const sd=s.hoy, tope=sd.semana.tope;
    const sem = tope ? ` · Esta semana: ${sd.semana.n} de ${tope}` : '';
    if(sd.ganado) filas.push(fila('🎴', '¡Sobre de hoy conseguido!', 'Pídeselo a papá o a mamá.'+sem, '', 'gana'));
    else if(sd.lleno) filas.push(fila('🎴', `¡Ya tienes los ${tope} sobres de esta semana!`, 'El sábado empiezan otros. Lo que leas sigue dando ⭐ y tele.', '', 'gana'));
    else if(sd.activo) filas.push(fila(sd.sorpresa?'🎁':'🎴', sd.sorpresa?'¡Hoy es día sorpresa! Sobre de cartas':'Sobre de cartas de hoy', `${ok(sd.dia)} La historia de hoy · ${ok(sd.extras>=sd.meta)} ${Math.min(sd.extras,sd.meta)} de ${sd.meta} lecturas extra${sem}`, barra((sd.dia?1:0)+Math.min(sd.extras,sd.meta), sd.meta+1, '#E11D48')));
  }
  // revistas
  const r=typeof revistasDe==='function' ? revistasDe(p) : {activo:false};
  if(r.activo && r.sem && r.sem.r1){ const w=r.sem, meta = w.est<w.r1 ? w.r1 : (w.r2 && w.est<w.r2 ? w.r2 : null), max=w.r2?2:1;
    filas.push(fila('📰', meta ? `Revista ${meta===w.r1?'1':'2'} de esta semana` : `¡Ya tienes ${max===1?'la revista':'las 2 revistas'} de esta semana!`,
      meta ? `${faltaE(meta-w.est)} Llevas ${w.est} ⭐ esta semana. (Como mucho ${max} a la semana.)` : 'La semana que viene, más.', meta ? barra(w.est, meta, '#0EA5B7') : '', meta?'':'gana'));
  }
  // cofre del tesoro: solo cuando está cerca
  const c=typeof cajasHitos==='function' ? cajasHitos(p) : {activo:false};
  if(c.activo && c.sig && c.ver) filas.push(fila('🎁', `¡El cofre del tesoro está cerca! ${esc(nombreCaja(c.sig.tipo).replace(/^una /,'Una '))}`, faltaE(c.sig.v-c.est), barra(c.est-c.ant, c.sig.v-c.ant, 'linear-gradient(90deg,#F59E0B,#E11D48)'), 'cofre-cerca'));
  // premios nuevos de la familia
  nuevosDe(p).forEach(x=>{ if(x.lleno && x.activo!==false) filas.push(fila(esc(x.emo||'🎁'), `${esc(x.nombre||'Premio')}: ¡ya tienes ${x.max===1?'el de':'los '+x.max+' de'} esta semana!`, 'La semana que viene, más.', '', 'gana'));
    else if(x.ver) filas.push(fila(esc(x.emo||'🎁'), esc(x.nombre||'Premio'), faltaE(x.falta)+(x.max?` (Como mucho ${x.max} a la semana.)`:''), barra(x.hecho, x.k, '#7C3AED'))); });
  // para recoger
  if(s.activo && s.pend) recoger.push(sobreHTML());
  if(typeof premiosRealesHTML==='function') recoger.push(premiosRealesHTML());
  nuevosDe(p).filter(x=>x.pend).forEach(x=>recoger.push(`<button type="button" class="card acceso premio-real nuevo" data-dar-nuevo="${esc(x.id)}"><span class="emo-g">${esc(x.emo||'🎁')}</span><span><b>${x.pend===1?`¡Has ganado: ${esc(x.nombre||'un premio')}!`:`¡Tienes ${x.pend}: ${esc(x.nombre||'premios')}!`}</b><span class="nota">Pídeselo a papá o a mamá. Cuando te lo den, tocad aquí.</span></span></button>`));
  const rec=recoger.join('');
  if(!filas.length && !rec) return '';
  return `${rec?`<div class="pc-recoger">${rec}</div>`:''}${filas.length?`<div class="card premios premios-casa"><div class="pc-cab"><b>🎁 Premios de casa</b><span class="nota">Te los dan papá o mamá.</span></div>${filas.join('')}</div>`:''}`;
}
function activarPremiosCasa(raiz){
  if(typeof activarSobreInicio==='function') activarSobreInicio();
  if(typeof activarPremiosReales==='function') activarPremiosReales(raiz);
  $$('[data-dar-nuevo]', raiz).forEach(b=>b.onclick=()=>{ const p=perfil(), id=b.dataset.darNuevo, x=nuevosDe(p).find(y=>y.id===id); if(!x || !x.pend) return;
    pedirPinPara(`${esc(x.emo||'🎁')} ${esc(x.nombre||'Premio')}`, `${esc(p.nombre)} tiene <b>${x.pend===1?'1':x.pend}</b> por recibir.`, 'Ya se lo hemos dado', ()=>{ darNuevo(p, id, 1); ir(actual==='premios'?'premios':'inicio'); }); });
}
function darNuevo(p, id, n=1){ const c=cfgDe(p), f=new Date().toISOString(); c.nuevosLog=(c.nuevosLog||[]).concat(Array.from({length:Math.max(1,n)},()=>({f, id}))).slice(-500); guardarAj(); }
/* papá o mamá confirman con el PIN (o con una multiplicación si no hay PIN) */
function pedirPinPara(titulo, texto, boton, fn){
  const a=12+Math.floor(Math.random()*8), m=6+Math.floor(Math.random()*4), conPin=!!aj.pin;
  const d=dialogo({titulo, html:`<p class="nota">Esto es para papá o mamá. ${texto}</p>
    <p style="font-weight:800;margin:10px 0 6px">${conPin?'Pon el PIN de la familia:':`¿Cuánto es ${a} × ${m}?`}</p>
    <input id="pcRes" type="${conPin?'password':'number'}" inputmode="numeric" autocomplete="off" style="width:150px;font-size:1.4rem;padding:8px;border-radius:10px;border:2px solid var(--line)"><p class="pin-msg" id="pcMsg"></p>`,
    botones:[{t:boton, cls:'btn-p', mantener:true, fn:()=>{ const v=($('#pcRes',d.el).value||'').trim(); const bien=conPin?v===aj.pin:+v===a*m;
      if(!bien){ $('#pcMsg',d.el).textContent=conPin?'PIN incorrecto':'No es correcto'; return; }
      d.cerrar(); sonido('cromo'); aviso('Apuntado'); fn(); }}, {t:'Todavía no', cls:'btn'}]});
  setTimeout(()=>{ const i=$('#pcRes',d.el); if(i) i.focus(); },100);
}
/* celebración cuando gana un premio nuevo de la familia (una vez cada uno) */
function avisarNuevos(){
  const p=perfil(); if(p.prueba) return; const cf=cfgDe(p), lista=nuevosDe(p); if(!lista.length) return;
  const vistos=cf.nuevosVistos && typeof cf.nuevosVistos==='object' ? {...cf.nuevosVistos} : null;
  if(!vistos){ cf.nuevosVistos=Object.fromEntries(lista.map(x=>[x.id, x.ganados])); guardarAj(); return; }
  const nuevo=lista.find(x=>vistos[x.id]!=null && x.ganados>vistos[x.id]);
  let cambio=false; lista.forEach(x=>{ if(vistos[x.id]==null || x.ganados<vistos[x.id]){ vistos[x.id]=x.ganados; cambio=true; } });
  if(nuevo){ vistos[nuevo.id]=nuevo.ganados; cambio=true;
    cuandoLibre(()=>{ const d=dialogo({titulo:`${esc(nuevo.emo||'🎁')} ¡Premio!`, html:`<p class="sub">¡Te has ganado <b>${esc(nuevo.nombre||'un premio')}</b>!</p><p class="nota">Pídeselo a papá o a mamá.</p>`, cls:'dlg-premio', botones:[{t:'¡Genial!', cls:'btn-p'}]}); sonido('cromo'); confeti(d.el.querySelector('.dialogo')||document.body); decir(`¡${nombre()}, te has ganado ${nuevo.nombre||'un premio'}! Pídeselo a papá o a mamá.`); }, 2800); }
  if(cambio){ cf.nuevosVistos=vistos; guardarAj(); }
}
