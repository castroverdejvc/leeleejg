/* LeeLEEJG · minutos de tele del fin de semana y película.
   Reglas (decididas por la familia, 18/10/2026):
   - lectura propuesta (la del día del calendario, la primera vez): 10 min
   - lectura complementaria (las «extra», más largas), la primera vez: 15 min
   - volver a leer una historia (o cualquier otra que no sea la propuesta): 5 min
   - fichas (repaso, dictado, «As letras»): 5 min sin fallos; con fallos, el tanto por ciento de aciertos
   - la semana de la tele va de SÁBADO A VIERNES (20/10/2026): lo ganado del sábado al viernes se ve el fin de semana
     siguiente; lo que lee ese sábado y domingo ya cuenta para la semana siguiente. No se acumula: lo que no se ve
     ese fin de semana se pierde.
   - película: hay que haber hecho las lecturas propuestas de los 7 días (de sábado a viernes); se ve ese fin de semana
   Los minutos se gastan el sábado y el domingo con el reloj de la tele. */
'use strict';
const teleCfg = () => { const c=premiosCfg(); return {propuesta:+c.tele||0, extra:+c.teleExtra||0, relee:+c.teleRelee||0, ficha:+c.teleFicha||0, trabajo:c.teleTrabajo==null?1:+c.teleTrabajo||0}; };   // valores por defecto en PREMIOS_DEF
const teleActiva = () => { const t=teleCfg(); return t.propuesta>0 || t.extra>0 || t.relee>0 || t.ficha>0 || t.trabajo>0; };
let fechaPruebaTele=null;   // solo para las pruebas
const hoyTele = () => fechaPruebaTele ? new Date(fechaPruebaTele) : new Date();
const esFinde = (d=hoyTele()) => d.getDay()===0 || d.getDay()===6;
function lunesDe(d=hoyTele()){ const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }
function sabadoDe(d=hoyTele()){ const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+1)%7)); return x; }
const diasDespues = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
/* la semana (de sábado a viernes) cuyos minutos son «los del fin de semana»: entre semana, la que está en marcha;
   el sábado y el domingo, la que acabó el viernes (la que se está viendo) */
const semanaTele = (d=hoyTele()) => esFinde(d) ? diasDespues(sabadoDe(d),-7) : sabadoDe(d);
/* de qué semana se descuenta un rato de tele visto (o regalado) en una fecha: el fin de semana, de la que acabó el viernes */
const semanaDeGasto = f => claveDia(semanaTele(new Date(f)));
const medio = m => Math.round(m*2)/2;
/* lecturas extra: dan los minutos enteros con 3 de 4 preguntas bien a la primera; con 2, dos tercios; con menos, como volver a leer */
function minExtra(s, T=teleCfg()){
  if(premiosCfg().extraSegun===false) return T.extra;
  const tot=+s.totalPreguntas||0, ok=+s.aciertos||0; if(!tot) return T.extra;
  const r=ok/tot; return r>=.75 ? T.extra : r>=.5 ? medio(T.extra*2/3) : Math.min(T.extra, T.relee);
}
/* ¿es la historia propuesta de algún día que ya ha llegado? (el sábado vale también la del domingo) */
function esPropuesta(p, hid){
  if(esComp(hid)) return false;
  const d=planDe(p).diaDe[hid]; if(!d) return false;
  return d<=diaHoyDe(p);
}
/* lo ganado por cada cosa hecha en una semana de la tele (de sábado a viernes) */
function teleDetalle(p=perfil(), desde=semanaTele(), hasta=diasDespues(desde,7)){
  const T=teleCfg(), c=cfgDe(p); const vistas=new Set(); const det={propuesta:{n:0,min:0}, extra:{n:0,min:0}, relee:{n:0,min:0}, ficha:{n:0,min:0}, trabajo:{n:0,min:0}};
  sesDe(p.id).filter(s=>!s.incompleta).sort((a,b)=>a.fecha<b.fecha?-1:1).forEach(s=>{
    const primera=!vistas.has(s.historiaId); vistas.add(s.historiaId);
    if(new Date(s.fecha)<desde || (hasta && new Date(s.fecha)>=hasta)) return;
    const tipo = esComp(s.historiaId) ? (primera?'extra':'relee') : (primera && esPropuesta(p, s.historiaId) ? 'propuesta' : 'relee');
    det[tipo].n++; det[tipo].min += tipo==='extra' ? minExtra(s, T) : T[tipo];
  });
  ['dictadoLog','repasoLog','letrasLog'].forEach(k=>(c[k]||[]).forEach(x=>{ if(new Date(x.f)<desde || (hasta && new Date(x.f)>=hasta)) return; const n=+x.n||0, b=+x.bien||0; det.ficha.n++; det.ficha.min+= n ? medio(T.ficha*Math.min(1,b/n)) : 0; }));
  // trabajos del cole (unir puntos, leer y marcar…): un minuto cada uno terminado
  (c.trabajosLog||[]).forEach(x=>{ if(new Date(x.f)<desde || (hasta && new Date(x.f)>=hasta)) return; det.trabajo.n++; det.trabajo.min+=T.trabajo; });
  return det;
}
const sumaDet = det => medio(det.propuesta.min+det.extra.min+det.relee.min+det.ficha.min+det.trabajo.min);
function teleDe(p=perfil()){
  const desde=semanaTele(), hasta=diasDespues(desde,7), det=teleDetalle(p, desde, hasta), k=claveDia(desde);
  const ganados=sumaDet(det);
  const gastados=(cfgDe(p).teleLog||[]).filter(x=>semanaDeGasto(x.f)===k).reduce((a,x)=>a+(+x.min||0),0);
  const saldo=Math.max(0, Math.round((ganados-gastados)*10)/10);
  // el fin de semana, lo que va leyendo ya es para el fin de semana siguiente
  const finde=esFinde(), detProx = finde ? teleDetalle(p, sabadoDe(), diasDespues(sabadoDe(),7)) : det;
  const proximo = finde ? sumaDet(detProx) : saldo;
  return {det, ganados, gastados, saldo, desde, hasta, finde, detProx, proximo, ej:det.propuesta.n+det.extra.n+det.relee.n+det.ficha.n+det.trabajo.n};
}
const fechaCortaTele = d => d.toLocaleDateString('es-ES',{weekday:'long', day:'numeric'});
const minTxt = m => { const n=Math.floor(m*2)/2; const e=Math.floor(n), h=n-e>=.5; return (e||!h?e:'')+(h?'½':'')+(n===1?' minuto':' minutos'); };
function avisarTele(p=perfil(), callado=false){
  if(!teleActiva() || p.prueba) return; const c=cfgDe(p); const sab=sabadoDe(), marca=claveDia(sab);
  const ganando=sumaDet(teleDetalle(p, sab, diasDespues(sab,7)));   // lo que se gana ahora es siempre para la semana que empezó el sábado
  if(!c.teleAvisado || typeof c.teleAvisado!=='object' || c.teleAvisado.semana!==marca){ c.teleAvisado={semana:marca, min:0}; }
  if(ganando>c.teleAvisado.min){ const mas=medio(ganando-c.teleAvisado.min); c.teleAvisado.min=ganando; guardarAj(); if(!callado) aviso(`📺 +${minTxt(mas)} de tele para el ${esFinde()?'próximo ':''}fin de semana`); }
  else if(ganando<c.teleAvisado.min){ c.teleAvisado.min=ganando; guardarAj(); }
}
function apuntarTele(p, min, tipo, cuando=new Date()){ const c=cfgDe(p); c.teleLog=(c.teleLog||[]).concat([{f:cuando.toISOString(), min:Math.round(min*10)/10, tipo}]).slice(-1000); guardarAj(); }
/* minutos que da una lectura concreta (para el final de la lectura) */
function minutosDeSesion(p, s){
  const T=teleCfg(); const antes=sesDe(p.id).some(x=>x.id!==s.id && !x.incompleta && x.historiaId===s.historiaId && x.fecha<s.fecha);
  if(esComp(s.historiaId)) return antes?T.relee:minExtra(s, T);
  return !antes && esPropuesta(p, s.historiaId) ? T.propuesta : T.relee;
}

/* ---------- película del fin de semana: las lecturas propuestas de los 7 días (de sábado a viernes) ---------- */
function peliculaDe(p=perfil(), lun=semanaTele()){
  const P=planDe(p), leid=leidasDe(p.id); const dias=[];
  for(let i=0;i<7;i++){ const f=new Date(lun); f.setDate(f.getDate()+i); const d=Math.round((f-inicioDe(p))/DIA_MS)+1;
    const h = d>=1 && d<=365 ? P.dias[d] : null; dias.push({f, d, h, hecho: !h || !!leid[h.id], antes: d<1}); }
  const cuenta=dias.filter(x=>x.h); const hechos=cuenta.filter(x=>x.hecho).length;
  const vista=(cfgDe(p).peliLog||[]).some(x=>x.semana===claveDia(lun));
  return {dias, hechos, total:cuenta.length, completa: cuenta.length>0 && hechos===cuenta.length, vista};
}
const LETRA_DIA = ['S','D','L','M','X','J','V'];
function peliPuntosHTML(pe, clic=false){
  const hoyK=claveDia(new Date());
  return `<div class="peli-dias">${pe.dias.map((x,i)=>{ const fut=x.f>hoySinHora(); const cls=x.antes?'nada':x.hecho?'ok':fut?'fut':'falta';
    return `<${clic&&cls==='falta'&&x.h?'button type="button" data-peli="'+esc(x.h.id)+'"':'span'} class="peli-d ${cls}${claveDia(x.f)===hoyK?' es-hoy':''}" title="${esc(fechaLarga(x.f))}${x.h?' · '+esc(conNombre(x.h.titulo)):''}"><b>${LETRA_DIA[i]}</b><i>${cls==='ok'?'✓':cls==='falta'?'!':cls==='nada'?'–':''}</i></${clic&&cls==='falta'&&x.h?'button':'span'}>`; }).join('')}</div>`;
}

/* tarjeta de Inicio */
function teleHTML(){
  const p=perfil(); if(!teleActiva() || p.prueba) return '';
  const t=teleDe(p), finde=esFinde(), pe=peliculaDe(p);
  const peliTxt = !pe.total ? '' : pe.completa ? (pe.vista?'🎬 Película de este fin de semana: ¡ya vista!':finde?'🎬 ¡Película desbloqueada!':'🎬 Película: ¡ya la tienes!') : finde ? `🎬 Película: te faltaron ${pe.total-pe.hechos} ${pe.total-pe.hechos===1?'lectura':'lecturas'}` : `🎬 Película: ${pe.hechos} de ${pe.total} lecturas de la semana`;
  return `<button class="acceso tele${finde?' finde':''}" type="button" data-ir="tele"><span class="emo-g">📺</span><span><b>${finde?`¡Es fin de semana! Tienes ${minTxt(t.saldo)} de tele`:`Tele del fin de semana: ${minTxt(t.saldo)}`}</b>${finde && t.proximo>0?`<span class="nota">Para el próximo fin de semana ya llevas ${minTxt(t.proximo)}.</span>`:''}${peliTxt?`<span class="nota">${esc(peliTxt)}</span>${peliPuntosHTML(pe)}`:''}</span><span class="ir">${ic('dcha')}</span></button>`;
}

/* pantalla del reloj de la tele */
let teleReloj=null;
definir('tele', {nav:'inicio', pintar(){
  const p=perfil(), t=teleDe(p), finde=esFinde(), T=teleCfg(), pe=peliculaDe(p), d=t.det;
  const fila=(emo,txt,x,cada)=>`<tr><td>${emo} ${txt}</td><td>${x.n}</td><td>${cada}</td><td><b>${minTxt(x.min)}</b></td></tr>`;
  const s=$('#s-tele');
  s.innerHTML=`<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
  <div class="card tele-caja"><span class="tele-ico">📺</span><h1 class="tit">Mis minutos de tele</h1>
    <div class="tele-reloj" id="teleReloj">${mmss(t.saldo*60)}</div>
    <p class="sub" id="teleTxt">${finde?(t.saldo>0?'Cuando empiece la tele, pulsa «Empezar». Si paras, se guarda lo que queda.':'¡Ya no quedan minutos de este fin de semana!')+(t.proximo>0?` Lo que lees hoy ya es para el próximo fin de semana: llevas ${minTxt(t.proximo)}.`:' Lo que leas hoy ya cuenta para el próximo fin de semana.'):`Tienes ${minTxt(t.saldo)} para el sábado y el domingo. Cuenta lo que hagas hasta el viernes.`}</p>
    ${finde && t.saldo>0?`<div class="botones"><button class="btn btn-p btn-xl" type="button" id="teleBtn">▶ Empezar</button></div>`:''}</div>
  <div class="tele-cols">
    <div class="card bloque"><h3>${finde?'Para este fin de semana ganaste':'Para el fin de semana llevas'}</h3><p class="nota" style="margin:-4px 0 8px">Del ${esc(fechaCortaTele(t.desde))} al ${esc(fechaCortaTele(diasDespues(t.desde,6)))}</p><table class="tele-tabla"><thead><tr><th></th><th>Hechas</th><th>Cada una</th><th>Total</th></tr></thead><tbody>
      ${fila('📖','Lecturas del día',d.propuesta,minTxt(T.propuesta))}${fila('📚','Lecturas extra',d.extra,(premiosCfg().extraSegun===false?'':'hasta ')+minTxt(T.extra))}${fila('🔁','Volver a leer',d.relee,minTxt(T.relee))}${fila('✏️','Fichas',d.ficha,`hasta ${minTxt(T.ficha)}`)}${T.trabajo>0||d.trabajo.n?fila('🖍️','Trabajos del cole',d.trabajo,minTxt(T.trabajo)):''}
      <tr class="tot"><td>Total</td><td></td><td></td><td><b>${minTxt(t.ganados)}</b></td></tr>${t.gastados>0?`<tr><td>Ya visto</td><td></td><td></td><td>−${minTxt(t.gastados)}</td></tr>`:''}</tbody></table>
      <p class="nota">Las fichas dan ${minTxt(T.ficha)} si no hay ningún fallo; con fallos, la parte de los aciertos.${premiosCfg().extraSegun===false?'':` Las lecturas extra dan ${minTxt(T.extra)} si aciertas 3 de las 4 preguntas a la primera.`}</p>
      ${(CONT.complementarias||[]).length?`<div class="botones"><button class="btn btn-p" type="button" data-ir="extra">📚 Lecturas extra (+${minTxt(T.extra)})</button></div>`:''}</div>
    <div class="card bloque peli-caja"><h3>🎬 Película del fin de semana</h3>
      <p class="nota">Para ver una película el fin de semana, lee la historia de cada día, de sábado a viernes.</p>
      ${peliPuntosHTML(pe, true)}
      ${pe.completa ? (pe.vista ? `<p class="sub">¡Ya habéis visto la película de este fin de semana! 🍿</p>` : `<p class="sub"><b>¡Película desbloqueada!</b> ${finde?'Elegid una película y ¡a disfrutar! 🍿':'Ya puedes verla el fin de semana. 🍿'}</p>${finde?`<button class="btn btn-verde" type="button" id="peliVista">Ya la hemos visto</button>`:''}`)
        : finde ? `<p class="sub">Esta vez faltaron ${pe.total-pe.hechos===1?'1 lectura':(pe.total-pe.hechos)+' lecturas'}. Desde hoy empieza otra semana: ¡a por la próxima película!</p>` : `<p class="sub">Te ${pe.total-pe.hechos===1?'falta 1 lectura':'faltan '+(pe.total-pe.hechos)+' lecturas'}. ${pe.dias.some(x=>!x.hecho && x.h && x.f<=hoySinHora())?'Toca un día en rojo para leerla.':''}</p>`}</div></div>`;
  $$('#s-tele [data-peli]').forEach(b=>b.onclick=()=>{ const h=historia(b.dataset.peli); if(h && estaDisponible(h)) empezarHistoria(h); else if(h) aviso('Esa historia todavía no ha llegado'); });
  const pv=$('#peliVista'); if(pv) pv.onclick=()=>{ const c=cfgDe(p); c.peliLog=(c.peliLog||[]).concat([{f:new Date().toISOString(), semana:claveDia(semanaTele())}]).slice(-200); guardarAj(); sonido('cromo'); if(PANT.tele._parar) PANT.tele._parar(); ir('tele'); };
  const b=$('#teleBtn'); if(!b) return;
  let corriendo=false, ini=0; const total=t.saldo*60;
  const pinta=()=>{ const usado=corriendo?(Date.now()-ini)/1000:0; const r=Math.max(0,total-usado); const e=$('#teleReloj'); if(e) e.textContent=mmss(r);
    if(corriendo && r<=0){ parar(); sonido('cromo'); decir(`¡Se acabó la tele, ${nombre()}!`); dialogo({titulo:'¡Se acabó la tele!', html:'<p class="nota">Ya has gastado todos tus minutos. ¡La semana que viene puedes ganar más!</p>', botones:[{t:'Vale', cls:'btn-p', fn:()=>ir('inicio')}], cerrar:false}); } };
  const parar=()=>{ if(!corriendo) return; corriendo=false; clearInterval(teleReloj); teleReloj=null; const usado=Math.min(total,(Date.now()-ini)/1000)/60; if(usado>=.1) apuntarTele(p, usado, 'visto', new Date(ini)); };
  b.onclick=()=>{ if(!corriendo){ corriendo=true; ini=Date.now(); b.textContent='⏸ Parar'; teleReloj=setInterval(pinta, 1000); decir('¡A disfrutar de la tele!'); } else { parar(); ir('tele'); } };
  PANT.tele._parar=parar;
}, salir(){ if(PANT.tele._parar) PANT.tele._parar(); PANT.tele._parar=null; clearInterval(teleReloj); teleReloj=null; }});

/* familia */
function teleAdultoHTML(p){
  const T=teleCfg(), t=teleDe(p), pe=peliculaDe(p); const log=(cfgDe(p).teleLog||[]).slice(-6).reverse(); const d=t.det;
  const sel=(id,vals,v)=>`<select id="${id}">${vals.map(x=>`<option value="${x}" ${x===v?'selected':''}>${x?x+(x===1?' minuto':' minutos'):'Nada'}</option>`).join('')}</select>`;
  return `<div class="card bloque" style="margin-bottom:18px"><h3 style="margin-bottom:6px">📺 Tele y película del fin de semana</h3>
    <p class="nota" style="margin-bottom:12px">Se cuenta de sábado a viernes y se ve el fin de semana siguiente; no se acumula. ${t.finde?'Para este fin de semana':'Para el fin de semana'} (del ${esc(fechaCortaTele(t.desde))} al ${esc(fechaCortaTele(diasDespues(t.desde,6)))}) ${esc(p.nombre)} ${t.finde?'ganó':'lleva'} <b>${minTxt(t.ganados)}</b> (${d.propuesta.n} lecturas del día, ${d.extra.n} extra, ${d.relee.n} releídas, ${d.ficha.n} fichas, ${d.trabajo.n} trabajos)${t.gastados>0?`, ha visto ${minTxt(t.gastados)}`:''} y le quedan <b>${minTxt(t.saldo)}</b>.${t.finde?` Para el próximo fin de semana ya lleva ${minTxt(t.proximo)}.`:''}
      Película: ${pe.completa?(pe.vista?'ya vista esta semana.':'<b>desbloqueada</b>.'):`${pe.hechos} de ${pe.total} lecturas de la semana.`}</p>
    ${peliPuntosHTML(pe)}
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:12px">
      <div class="campo"><label for="prTele">Lectura del día</label>${sel('prTele',[0,5,10,15,20],T.propuesta)}</div>
      <div class="campo"><label for="prTeleExtra">Lectura extra</label>${sel('prTeleExtra',[0,5,10,15,20,30],T.extra)}</div>
      <div class="campo"><label for="prTeleRelee">Volver a leer</label>${sel('prTeleRelee',[0,2,5,10],T.relee)}</div>
      <div class="campo"><label for="prTeleFicha">Ficha sin fallos</label>${sel('prTeleFicha',[0,2,5,10],T.ficha)}</div>
      <div class="campo"><label for="prTeleTrabajo">Trabajo del cole</label>${sel('prTeleTrabajo',[0,1,2,3,5],T.trabajo)}</div>
      <div class="campo"><b>Lecturas extra</b><div class="interruptor"><span>Los minutos dependen de las preguntas (3 de 4 bien: todos; 2: dos tercios; menos: como volver a leer)</span><button type="button" class="switch" id="prExtraSegun" role="switch" aria-checked="${premiosCfg().extraSegun!==false}"></button></div></div>
      <div class="campo"><label for="teleMin">Apuntar a mano</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="teleMin" type="number" min="1" max="600" value="10" style="width:90px"><button class="btn btn-mini" type="button" id="teleVisto">Ya los ha visto</button><button class="btn btn-mini" type="button" id="teleRegalo">Regalar</button></div></div></div>
    ${log.length?`<p class="nota" style="margin-top:10px">Últimos: ${log.map(x=>`${esc(fechaCorta(x.f))} ${x.min>0?'−':'+'}${Math.abs(Math.round(x.min))} min`).join(' · ')}</p>`:''}</div>`;
}
function activarTeleAdulto(p){
  const n=()=>Math.max(1, Math.min(600, +$('#teleMin').value||0));
  $('#teleVisto').onclick=()=>{ apuntarTele(p, n(), 'visto'); aviso('Apuntado'); ir('evolucion','premios'); };
  $('#teleRegalo').onclick=()=>{ apuntarTele(p, -n(), 'regalo'); aviso('Regalados'); ir('evolucion','premios'); };
  const es=$('#prExtraSegun'); if(es) es.onclick=()=>{ aj.premios={...(aj.premios||{}), extraSegun: es.getAttribute('aria-checked')!=='true'}; guardarAj(); aviso('Guardado'); ir('evolucion','premios'); };
  [['prTele','tele'],['prTeleExtra','teleExtra'],['prTeleRelee','teleRelee'],['prTeleFicha','teleFicha'],['prTeleTrabajo','teleTrabajo']].forEach(([id,k])=>{ const e=$('#'+id); if(e) e.onchange=()=>{ aj.premios={...(aj.premios||{}), [k]:+e.value}; guardarAj(); aviso('Guardado'); ir('evolucion','premios'); }; });
}

/* ---------- la semana que acabó el viernes (de sábado a viernes): para el niño el fin de semana y para la familia ---------- */
function semanaPasadaDe(p=perfil()){
  const hasta=sabadoDe(), desde=diasDespues(hasta,-7);
  const det=teleDetalle(p, desde, hasta); const ganados=medio(det.propuesta.min+det.extra.min+det.relee.min+det.ficha.min+det.trabajo.min);
  const enSem=f=>{ const d=new Date(f); return d>=desde && d<hasta; };
  const vistos=(cfgDe(p).teleLog||[]).filter(x=>semanaDeGasto(x.f)===claveDia(desde)).reduce((a,x)=>a+(+x.min||0),0);
  const pe=peliculaDe(p, desde);
  const jl=(cfgDe(p).juegoLog||[]).filter(x=>enSem(x.f)); const A=jl.reduce((s,x)=>s+(x.a||0),0), E=jl.reduce((s,x)=>s+(x.e||0),0);
  return {desde, hasta, det, ganados, vistos:Math.max(0,vistos), pe, partidas:jl.length, pctJuegos: A+E?Math.round(100*A/(A+E)):null};
}
function semanaPasadaNinoHTML(){
  const p=perfil(); if(p.prueba || !teleActiva() || !esFinde()) return '';
  const sp=semanaPasadaDe(p), k=claveDia(sp.desde); if(cfgDe(p).resumenVisto===k) return '';
  const lect=sp.det.propuesta.n+sp.det.extra.n+sp.det.relee.n; if(!lect && !sp.det.ficha.n && !sp.det.trabajo.n) return '';
  return `<div class="card resumen-semana" id="resSemana"><span class="emo-g">🗓️</span><div><b>Tu semana (de sábado a viernes)</b>
    <span class="nota">Leíste ${lect} ${lect===1?'historia':'historias'} (${sp.det.extra.n} extra), hiciste ${sp.det.ficha.n} ${sp.det.ficha.n===1?'ficha':'fichas'} y ganaste ${minTxt(sp.ganados)} de tele para este fin de semana. ${sp.pe.completa?'¡Y conseguiste la película! 🎬':`Para la película te faltaron ${sp.pe.total-sp.pe.hechos} ${sp.pe.total-sp.pe.hechos===1?'lectura':'lecturas'}.`} Lo que leas desde hoy ya cuenta para el próximo fin de semana.</span></div>
    <button class="btn btn-p" type="button" id="resSemanaOk">¡Vale!</button></div>`;
}
function activarSemanaPasadaNino(){ const b=$('#resSemanaOk'); if(b) b.onclick=()=>{ const p=perfil(); cfgDe(p).resumenVisto=claveDia(semanaPasadaDe(p).desde); guardarAj(); const c=$('#resSemana'); if(c) c.remove(); }; }
function semanaPasadaFamHTML(p){
  const sp=semanaPasadaDe(p);
  const f=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long'}); const fin=new Date(sp.hasta); fin.setDate(fin.getDate()-1);
  return `<div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:8px">Última semana de la tele (del sábado ${esc(f(sp.desde))} al viernes ${esc(f(fin))})</h3>
    <ul class="lista-log"><li>Lecturas: <b>${sp.det.propuesta.n}</b> del día, <b>${sp.det.extra.n}</b> extra y <b>${sp.det.relee.n}</b> releídas · fichas: <b>${sp.det.ficha.n}</b> · trabajos del cole: <b>${sp.det.trabajo.n}</b>.</li>
      <li>Tele: ganó <b>${minTxt(sp.ganados)}</b> y ${esFinde()?'lleva vistos':'vio'} <b>${minTxt(sp.vistos)}</b> el fin de semana.</li>
      <li>Película: ${sp.pe.completa?'<b>conseguida</b>':`no (${sp.pe.hechos} de ${sp.pe.total} lecturas de la semana)`}${sp.pe.vista?' · vista':''}.</li>
      <li>Juegos: ${sp.partidas?`${sp.partidas} partidas, ${sp.pctJuegos==null?'–':sp.pctJuegos+' %'} de aciertos`:'no jugó'}.</li></ul></div>`;
}
