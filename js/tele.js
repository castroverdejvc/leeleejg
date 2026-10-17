/* LeeLEEJG · minutos de tele: cada ejercicio terminado (lectura, dictado, repaso, «As letras») suma minutos
   que se gastan el sábado y el domingo. La familia decide cuántos minutos y si lo que sobra se guarda. */
'use strict';
const esFinde = (d=new Date()) => d.getDay()===0 || d.getDay()===6;
function lunesDe(d=new Date()){ const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; }
function teleDe(p=perfil()){
  const c=cfgDe(p), cfg=premiosCfg();
  if(!c.teleDesde){ c.teleDesde=new Date().toISOString(); guardarAj(); }   // se empieza a contar desde hoy
  let desde=new Date(c.teleDesde); if(!cfg.teleGuarda){ const l=lunesDe(); if(l>desde) desde=l; }
  const ej=ejerciciosDe(p, desde), ganados=ej*(cfg.tele||0);
  const gastados=(c.teleLog||[]).filter(x=>new Date(x.f)>=desde).reduce((a,x)=>a+(+x.min||0),0);
  return {ej, ganados, gastados, saldo:Math.max(0, Math.round((ganados-gastados)*10)/10), desde};
}
const minTxt = m => { const n=Math.floor(m); return n===1?'1 minuto':n+' minutos'; };
function avisarTele(p=perfil()){
  if(!(premiosCfg().tele>0) || p.prueba) return; const c=cfgDe(p), t=teleDe(p);
  if(c.teleAvisado==null){ c.teleAvisado=t.ganados; guardarAj(); return; }
  if(t.ganados>c.teleAvisado){ const mas=t.ganados-c.teleAvisado; c.teleAvisado=t.ganados; guardarAj(); aviso(`📺 +${mas} minutos de tele para el fin de semana`); }
  else if(t.ganados<c.teleAvisado){ c.teleAvisado=t.ganados; guardarAj(); }
}
function apuntarTele(p, min, tipo){ const c=cfgDe(p); c.teleLog=(c.teleLog||[]).concat([{f:new Date().toISOString(), min:Math.round(min*10)/10, tipo}]).slice(-1000); guardarAj(); }

/* tarjeta de Inicio */
function teleHTML(){
  const cfg=premiosCfg(), p=perfil(); if(!(cfg.tele>0) || p.prueba) return '';
  const t=teleDe(p), finde=esFinde();
  return `<button class="acceso tele${finde?' finde':''}" type="button" data-ir="tele"><span class="emo-g">📺</span><span><b>${finde?`¡Es fin de semana! Tienes ${minTxt(t.saldo)} de tele`:`Tele del fin de semana: ${minTxt(t.saldo)}`}</b><span class="nota">${finde?(t.saldo>0?'Toca aquí para ponerlos en marcha.':`Cada ejercicio suma ${cfg.tele} minutos.`):`Cada ejercicio suma ${cfg.tele} minutos. Se gastan el sábado y el domingo.`}</span></span><span class="ir">${ic('dcha')}</span></button>`;
}

/* pantalla del reloj de la tele */
let teleReloj=null;
definir('tele', {nav:'inicio', pintar(){
  const p=perfil(), t=teleDe(p), finde=esFinde(), cfg=premiosCfg();
  const s=$('#s-tele');
  s.innerHTML=`<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
  <div class="card tele-caja"><span class="tele-ico">📺</span><h1 class="tit">Mis minutos de tele</h1>
    <div class="tele-reloj" id="teleReloj">${mmss(t.saldo*60)}</div>
    <p class="sub" id="teleTxt">${finde?(t.saldo>0?'Cuando empiece la tele, pulsa «Empezar». Si paras, se guarda lo que queda.':'¡Ya no quedan minutos! Haz ejercicios esta semana para ganar más.'):`Tienes ${minTxt(t.saldo)} para el fin de semana. Los minutos se gastan el sábado y el domingo.`}</p>
    ${finde && t.saldo>0?`<div class="botones"><button class="btn btn-p btn-xl" type="button" id="teleBtn">▶ Empezar</button></div>`:''}
    <p class="nota">Cada ejercicio (leer una historia, un dictado, un repaso o «As letras») suma ${cfg.tele} minutos.${cfg.teleGuarda?' Lo que sobra se guarda para el próximo fin de semana.':' Lo que sobra el domingo se pierde.'}</p></div>`;
  const b=$('#teleBtn'); if(!b) return;
  let corriendo=false, ini=0; const total=t.saldo*60;
  const pinta=()=>{ const usado=corriendo?(Date.now()-ini)/1000:0; const r=Math.max(0,total-usado); const e=$('#teleReloj'); if(e) e.textContent=mmss(r);
    if(corriendo && r<=0){ parar(); sonido('cromo'); decir(`¡Se acabó la tele, ${nombre()}!`); dialogo({titulo:'¡Se acabó la tele!', html:'<p class="nota">Ya has gastado todos tus minutos. ¡Esta semana puedes ganar más!</p>', botones:[{t:'Vale', cls:'btn-p', fn:()=>ir('inicio')}], cerrar:false}); } };
  const parar=()=>{ if(!corriendo) return; corriendo=false; clearInterval(teleReloj); teleReloj=null; const usado=Math.min(total,(Date.now()-ini)/1000)/60; if(usado>=.1) apuntarTele(p, usado, 'visto'); };
  b.onclick=()=>{ if(!corriendo){ corriendo=true; ini=Date.now(); b.textContent='⏸ Parar'; teleReloj=setInterval(pinta, 1000); decir('¡A disfrutar de la tele!'); } else { parar(); ir('tele'); } };
  PANT.tele._parar=parar;
}, salir(){ if(PANT.tele._parar) PANT.tele._parar(); PANT.tele._parar=null; clearInterval(teleReloj); teleReloj=null; }});

/* familia */
function teleAdultoHTML(p){
  const c=premiosCfg(), t=teleDe(p); const log=(cfgDe(p).teleLog||[]).slice(-6).reverse();
  return `<div class="card bloque" style="margin-bottom:18px"><h3 style="margin-bottom:6px">📺 Minutos de tele</h3>
    <p class="nota" style="margin-bottom:12px">Cada ejercicio terminado suma minutos que ${esc(p.nombre)} gasta el sábado y el domingo con el reloj de la tele (en Inicio). Ahora tiene <b>${minTxt(t.saldo)}</b> (${t.ej} ejercicios${c.teleGuarda?'':' esta semana'}; ${Math.round(t.gastados)} min ya vistos).</p>
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">
      <div class="campo"><label for="prTele">Minutos por ejercicio</label><select id="prTele">${[0,5,10,15,20,30].map(x=>`<option value="${x}" ${x===c.tele?'selected':''}>${x?x+' minutos':'Sin tele'}</option>`).join('')}</select></div>
      <div class="campo"><b>Lo que sobra</b><div class="interruptor"><span>Se guarda para el siguiente fin de semana</span><button type="button" class="switch" id="prTeleGuarda" role="switch" aria-checked="${!!c.teleGuarda}"></button></div></div>
      <div class="campo"><label for="teleMin">Apuntar a mano</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="teleMin" type="number" min="1" max="600" value="10" style="width:90px"><button class="btn btn-mini" type="button" id="teleVisto">Ya los ha visto</button><button class="btn btn-mini" type="button" id="teleRegalo">Regalar</button></div></div></div>
    ${log.length?`<p class="nota" style="margin-top:10px">Últimos: ${log.map(x=>`${esc(fechaCorta(x.f))} ${x.min>0?'−':'+'}${Math.abs(Math.round(x.min))} min`).join(' · ')}</p>`:''}</div>`;
}
function activarTeleAdulto(p){
  const n=()=>Math.max(1, Math.min(600, +$('#teleMin').value||0));
  $('#teleVisto').onclick=()=>{ apuntarTele(p, n(), 'visto'); aviso('Apuntado'); ir('evolucion','premios'); };
  $('#teleRegalo').onclick=()=>{ apuntarTele(p, -n(), 'regalo'); aviso('Regalados'); ir('evolucion','premios'); };
}
