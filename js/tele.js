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
/* 24/10/2026 (la familia): lectura del día 15, extra 10, releer 5, fichas hasta 5, trabajo 2; como mucho 2 horas al día el fin de semana
   (4 horas a la semana); peli del sábado con 7 extras. Lo de antes del 24/10 se cuenta con las reglas de antes. */
const corteTele = () => (typeof CORTE_PREMIOS!=='undefined' ? CORTE_PREMIOS : new Date(2026,9,24));
const teleCfg = (f) => { const c=premiosCfg(f); const antes = f && +new Date(f) < +corteTele(); const resta = c.restaFallo==null ? 0.5 : +c.restaFallo||0;   // 31/10: con las reglas de ese día
  return antes ? {propuesta:+c.tele||0, extra:+c.teleExtra||0, relee:+c.teleRelee||0, ficha:+c.teleFicha||0, trabajo:c.teleTrabajo==null?1:+c.teleTrabajo||0, resta}
               : {propuesta:+c.tDia||0, extra:+c.tExtra||0, relee:+c.tRelee||0, ficha:+c.tFicha||0, trabajo:+c.tTrabajo||0, mini:c.tMini==null?1:+c.tMini||0, resta}; };   // valores por defecto en PREMIOS_DEF
const teleMaxDia = (f) => +premiosCfg(f).teleMaxDia||0, teleMaxSemana = (f) => +premiosCfg(f).teleMaxSemana||0;
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
/* 22/10 (regla de la familia): cada pregunta fallada resta 30 segundos del tiempo de ese ejercicio,
   también si luego la acierta (fallar y acertar a la segunda = 1 fallo; fallar las dos veces = 2). */
const restaFallo = () => { const r=premiosCfg().restaFallo; return r==null ? 0.5 : +r||0; };
function fallosDe(s){
  let f=0; (s.preguntas||[]).forEach(q=>{ const i=+q.intentos||1; f += q.ok ? i-1 : i; });
  if(s.calculo && s.calculo.intentos) f += Math.max(0, (+s.calculo.intentos)-1);
  return f;
}
const conResta = (base, fallos, r=restaFallo()) => Math.max(0, medio(base - r*fallos));
function minExtra(s, T=teleCfg(s.fecha)){ return conResta(T.extra, fallosDe(s), T.resta); }
/* ¿es la historia propuesta de algún día que ya ha llegado? (el sábado vale también la del domingo) */
function esPropuesta(p, hid){
  if(esComp(hid)) return false;
  const d=planDe(p).diaDe[hid]; if(!d) return false;
  return d<=diaHoyDe(p);
}
/* lo ganado por cada cosa hecha en una semana de la tele (de sábado a viernes) */
function teleDetalle(p=perfil(), desde=semanaTele(), hasta=diasDespues(desde,7)){
  const c=cfgDe(p); const vistas=new Set(); const det={propuesta:{n:0,min:0}, extra:{n:0,min:0}, relee:{n:0,min:0}, ficha:{n:0,min:0}, trabajo:{n:0,min:0}, mini:{n:0,min:0}};
  sesDe(p.id).filter(s=>!s.incompleta).sort((a,b)=>a.fecha<b.fecha?-1:1).forEach(s=>{
    const primera=!vistas.has(s.historiaId); vistas.add(s.historiaId);
    if(new Date(s.fecha)<desde || (hasta && new Date(s.fecha)>=hasta)) return;
    const tipo = esComp(s.historiaId) ? (primera?'extra':'relee') : (primera && esPropuesta(p, s.historiaId) ? 'propuesta' : 'relee');
    const T=teleCfg(s.fecha); det[tipo].n++; det[tipo].min += tipo==='extra' ? minExtra(s, T) : conResta(T[tipo], fallosDe(s), T.resta);
  });
  LOGS_FICHA.forEach(k=>(c[k]||[]).forEach(x=>{ if(new Date(x.f)<desde || (hasta && new Date(x.f)>=hasta)) return; const n=+x.n||0, b=+x.bien||0; det.ficha.n++; det.ficha.min+= n ? (T=>conResta(T.ficha, Math.max(0,n-b), T.resta))(teleCfg(x.f)) : 0; }));
  // trabajos del cole (unir puntos, leer y marcar…): un minuto cada uno terminado
  (c.trabajosLog||[]).forEach(x=>{ if(new Date(x.f)<desde || (hasta && new Date(x.f)>=hasta)) return; det.trabajo.n++; det.trabajo.min+=(T=>conResta(T.trabajo, +x.e||0, T.resta))(teleCfg(x.f)); });
  // 28/10: sorpresas de hoy y practicar: 1 minuto cada una (tMini)
  LOGS_MINI.forEach(k=>(c[k]||[]).forEach(x=>{ if(!x.f || new Date(x.f)<desde || (hasta && new Date(x.f)>=hasta)) return; det.mini.n++; det.mini.min+=(teleCfg(x.f).mini||0); }));
  // 30/10: juegos de pensar: hasta 1 minuto por partida, según la medalla (x.pr = de 0 a 1; juegos3.js)
  det.juego={n:0,min:0}; (c.juegoLog||[]).forEach(x=>{ if(!(x.pr>0) || !x.f || new Date(x.f)<desde || (hasta && new Date(x.f)>=hasta)) return; det.juego.n++; det.juego.min+=x.pr*tJuegoMin(x.f); });
  return det;
}
const tJuegoMin = (f) => { const v=premiosCfg(f).tJuego; return v==null ? 1 : +v||0; };
const sumaBruta = det => medio(det.propuesta.min+det.extra.min+det.relee.min+det.ficha.min+det.trabajo.min+((det.mini&&det.mini.min)||0)+((det.juego&&det.juego.min)||0));
/* desde el 24/10/2026, la semana da como mucho teleMaxSemana minutos (4 horas: 2 el sábado y 2 el domingo) */
const sumaDet = (det, desde) => { const b=sumaBruta(det), m=teleMaxSemana(desde ? fechaReglaSemana(desde) : undefined); return (m>0 && (!desde || +desde>=+corteTele())) ? Math.min(m, b) : b; };
function teleDe(p=perfil()){
  const desde=semanaTele(), hasta=diasDespues(desde,7), det=teleDetalle(p, desde, hasta), k=claveDia(desde);
  const ganados=sumaDet(det, desde), bruto=sumaBruta(det);
  const log=(cfgDe(p).teleLog||[]).filter(x=>semanaDeGasto(x.f)===k);
  const gastados=log.reduce((a,x)=>a+(+x.min||0),0);
  const saldo=Math.max(0, Math.round((ganados-gastados)*10)/10);
  // como mucho teleMaxDia minutos cada día del fin de semana (lo regalado no cuenta como visto)
  const hoyK=claveDia(hoyTele()), vistoHoy=log.filter(x=>x.min>0 && claveDia(x.f)===hoyK).reduce((a,x)=>a+(+x.min||0),0);
  const md=teleMaxDia(); const hoyPuede = (esFinde() && md>0) ? Math.max(0, Math.min(saldo, Math.round((md-vistoHoy)*10)/10)) : saldo;
  // el fin de semana, lo que va leyendo ya es para el fin de semana siguiente
  const finde=esFinde(), detProx = finde ? teleDetalle(p, sabadoDe(), diasDespues(sabadoDe(),7)) : det;
  const proximo = finde ? sumaDet(detProx, sabadoDe()) : saldo;
  return {det, ganados, bruto, tope:bruto>ganados, gastados, saldo, hoyPuede, vistoHoy, desde, hasta, finde, detProx, proximo, ej:det.propuesta.n+det.extra.n+det.relee.n+det.ficha.n+det.trabajo.n};
}
const fechaCortaTele = d => d.toLocaleDateString('es-ES',{weekday:'long', day:'numeric'});
const medioTxt = n => { const e=Math.floor(n), h=n-e>=.5; return (e||!h?e:'')+(h?'½':''); };
/* 22/10: desde 60, en horas y minutos («90 minutos» → «1 hora y 30 minutos») */
const minTxt = m => { const n=Math.max(0,Math.floor(m*2)/2);
  if(n<60) return medioTxt(n)+(n===1?' minuto':' minutos');
  const h=Math.floor(n/60), r=n-h*60;
  return h+(h===1?' hora':' horas')+(r?' y '+medioTxt(r)+(r===1?' minuto':' minutos'):''); };
/* el reloj de la tele: con horas, h:mm:ss */
const relojTele = s => { s=Math.max(0,Math.round(s||0)); if(s<3600) return mmss(s); const h=Math.floor(s/3600); return h+':'+mmss(s-h*3600).padStart(5,'0'); };
function avisarTele(p=perfil(), callado=false){
  if(!teleActiva() || p.prueba) return; const c=cfgDe(p); const sab=sabadoDe(), marca=claveDia(sab);
  const ganando=sumaDet(teleDetalle(p, sab, diasDespues(sab,7)), sab);   // lo que se gana ahora es siempre para la semana que empezó el sábado
  if(!c.teleAvisado || typeof c.teleAvisado!=='object' || c.teleAvisado.semana!==marca){ c.teleAvisado={semana:marca, min:0}; }
  let mas=0;
  if(ganando>c.teleAvisado.min){ mas=medio(ganando-c.teleAvisado.min); c.teleAvisado.min=ganando; guardarAj(); if(typeof teleVolar==='function') teleVolar(mas, {voz:false}); else aviso(`📺 +${minTxt(mas)} de tele para el ${esFinde()?'próximo ':''}fin de semana`); }
  else if(ganando<c.teleAvisado.min){ c.teleAvisado.min=ganando; guardarAj(); }
  /* 28/10: lo ganado (tele, pelis y móvil) se le dice en voz, cada cosa en su idioma del día */
  if(typeof anunciarPremios==='function') anunciarPremios(p, mas);
}
function apuntarTele(p, min, tipo, cuando=new Date()){ const c=cfgDe(p); c.teleLog=(c.teleLog||[]).concat([{f:cuando.toISOString(), min:Math.round(min*10)/10, tipo}]).slice(-1000); guardarAj(); }
/* minutos que da una lectura concreta (para el final de la lectura) */
function minutosDeSesion(p, s){
  const T=teleCfg(s.fecha); const antes=sesDe(p.id).some(x=>x.id!==s.id && !x.incompleta && x.historiaId===s.historiaId && x.fecha<s.fecha);
  if(esComp(s.historiaId)) return antes?conResta(T.relee, fallosDe(s), T.resta):minExtra(s, T);
  return conResta(!antes && esPropuesta(p, s.historiaId) ? T.propuesta : T.relee, fallosDe(s), T.resta);
}

/* chip del final de la lectura: lo que ha ganado y lo que le han quitado los fallos */
function teleChipHTML(s){
  const p=perfil(); if(typeof teleActiva!=='function' || !teleActiva() || p.prueba) return '';
  const m=minutosDeSesion(p, s), f=fallosDe(s), r=restaFallo()*f;
  return `<span class="chip chip-tele">📺 +${minTxt(m)}${f&&r>0?` · ${f===1?'1 fallo':f+' fallos'}: −${r===0.5?'30 s':minTxt(r)}`:''}</span>`;
}
/* ---------- película del fin de semana: las lecturas propuestas de los 7 días (de sábado a viernes) ---------- */
function peliculaDe(p=perfil(), lun=semanaTele()){
  const P=planDe(p), leid=leidasDe(p.id); const dias=[];
  for(let i=0;i<7;i++){ const f=new Date(lun); f.setDate(f.getDate()+i); const d=Math.round((f-inicioDe(p))/DIA_MS)+1;
    const h = d>=1 && d<=365 ? P.dias[d] : null; dias.push({f, d, h, hecho: !h || !!leid[h.id], antes: d<1}); }
  const cuenta=dias.filter(x=>x.h); const hechos=cuenta.filter(x=>x.hecho).length;
  const vista=(cfgDe(p).peliLog||[]).some(x=>x.semana===claveDia(lun) && !x.tipo);
  return {dias, hechos, total:cuenta.length, completa: cuenta.length>0 && hechos===cuenta.length, vista};
}
/* 22/10: la segunda peli, la del sábado, con 9 lecturas extra (las largas, nuevas) en la semana de sábado a viernes */
function peliSabadoDe(p=perfil(), lun=semanaTele()){
  const R=premiosCfg(fechaReglaSemana(lun)); const total = +lun>=+corteTele() ? (+R.peliExtras||7) : (+R.peliExtra||9); const hechas=teleDetalle(p, lun, diasDespues(lun,7)).extra.n;
  const vista=(cfgDe(p).peliLog||[]).some(x=>x.semana===claveDia(lun) && x.tipo==='sabado');
  return {hechas, total, completa: hechas>=total, vista};
}
/* la peli del viernes se ve el viernes por la noche; la tele y la del sábado, el fin de semana */
const esViernes = (d=hoyTele()) => d.getDay()===5;
const LETRA_DIA = ['S','D','L','M','X','J','V'];
function peliPuntosHTML(pe, clic=false){
  const hoyK=claveDia(new Date());
  return `<div class="peli-dias">${pe.dias.map((x,i)=>{ const fut=x.f>hoySinHora(); const cls=x.antes?'nada':x.hecho?'ok':fut?'fut':'falta';
    return `<${clic&&cls==='falta'&&x.h?'button type="button" data-peli="'+esc(x.h.id)+'"':'span'} class="peli-d ${cls}${claveDia(x.f)===hoyK?' es-hoy':''}" title="${esc(fechaLarga(x.f))}${x.h?' · '+esc(conNombre(x.h.titulo)):''}"><b>${LETRA_DIA[i]}</b><i>${cls==='ok'?'✓':cls==='falta'?'!':cls==='nada'?'–':''}</i></${clic&&cls==='falta'&&x.h?'button':'span'}>`; }).join('')}</div>`;
}

/* tarjeta de Inicio */
function teleHTML(){
  if(typeof televisorHTML==='function') return televisorHTML();
  const p=perfil(); if(!teleActiva() || p.prueba) return '';
  const t=teleDe(p), finde=esFinde(), pe=peliculaDe(p);
  const peliTxt = !pe.total ? '' : pe.completa ? (pe.vista?'🎬 Peli del viernes: ¡ya vista!':finde?'🎬 ¡Película desbloqueada!':'🎬 Peli del viernes: ¡ya la tienes!') : finde ? `🎬 Película: te faltaron ${pe.total-pe.hechos} ${pe.total-pe.hechos===1?'lectura':'lecturas'}` : `🎬 Peli del viernes: ${pe.hechos} de ${pe.total} lecturas`;
  const ps=peliSabadoDe(p); const peliS = `🍿 Peli del sábado: ${ps.completa?(ps.vista?'¡ya vista!':'¡desbloqueada!'):`${ps.hechas} de ${ps.total} lecturas extra`}`;
  return `<button class="acceso tele${finde?' finde':''}" type="button" data-ir="tele"><span class="emo-g">📺</span><span><b>${finde?`¡Es fin de semana! Tienes ${minTxt(t.saldo)} de tele`:`Tele del fin de semana: ${minTxt(t.saldo)}`}</b>${finde && t.proximo>0?`<span class="nota">Para el próximo fin de semana ya llevas ${minTxt(t.proximo)}.</span>`:''}${peliTxt?`<span class="nota">${esc(peliTxt)}</span>${peliPuntosHTML(pe)}`:''}<span class="nota">${esc(peliS)}</span></span><span class="ir">${ic('dcha')}</span></button>`;
}

/* pantalla del reloj de la tele */
let teleReloj=null;
definir('tele', {nav:'inicio', pintar(){
  const p=perfil(), t=teleDe(p), finde=esFinde(), T=teleCfg(), pe=peliculaDe(p), ps=peliSabadoDe(p), d=t.det;
  const fila=(emo,txt,x,cada)=>`<tr><td>${emo} ${txt}</td><td>${x.n}</td><td>${cada}</td><td><b>${minTxt(x.min)}</b></td></tr>`;
  const s=$('#s-tele');
  s.innerHTML=`<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
  <div class="card tele-caja"><span class="tele-ico">📺</span><h1 class="tit">Mis minutos de tele</h1>
    <div class="tele-reloj" id="teleReloj">${relojTele((finde?t.hoyPuede:t.saldo)*60)}</div>
    <p class="sub" id="teleTxt">${finde?(t.hoyPuede>0?`Hoy puedes ver hasta ${minTxt(t.hoyPuede)}${t.saldo>t.hoyPuede?` (en total te quedan ${minTxt(t.saldo)})`:''}. Cuando empiece la tele, pulsa «Empezar». Si paras, se guarda lo que queda.`:t.saldo>0?`Hoy ya has visto ${minTxt(t.vistoHoy)}, lo máximo de un día. Te quedan ${minTxt(t.saldo)} para mañana.`:'¡Ya no quedan minutos de este fin de semana!')+(t.proximo>0?` Lo que lees hoy ya es para el próximo fin de semana: llevas ${minTxt(t.proximo)}.`:' Lo que leas hoy ya cuenta para el próximo fin de semana.'):`Tienes ${minTxt(t.saldo)} para el sábado y el domingo (como mucho ${minTxt(teleMaxDia()||t.saldo)} cada día). Cuenta lo que hagas hasta el viernes.`}${t.tope?` ¡Has llegado al máximo de la semana (${minTxt(teleMaxSemana())})! Lo que leas de más sigue dando ⭐.`:''}</p>
    ${finde && t.hoyPuede>0?`<div class="botones"><button class="btn btn-p btn-xl" type="button" id="teleBtn">▶ Empezar</button></div>`:''}</div>
  <div class="tele-cols">
    <div class="card bloque"><h3>${finde?'Para este fin de semana ganaste':'Para el fin de semana llevas'}</h3><p class="nota" style="margin:-4px 0 8px">Del ${esc(fechaCortaTele(t.desde))} al ${esc(fechaCortaTele(diasDespues(t.desde,6)))}</p><table class="tele-tabla"><thead><tr><th></th><th>Hechas</th><th>Cada una</th><th>Total</th></tr></thead><tbody>
      ${fila('📖','Lecturas del día',d.propuesta,minTxt(T.propuesta))}${fila('📚','Lecturas extra',d.extra,minTxt(T.extra))}${fila('🔁','Volver a leer',d.relee,minTxt(T.relee))}${fila('✏️','Fichas',d.ficha,`hasta ${minTxt(T.ficha)}`)}${d.juego&&d.juego.n?fila('🧩','Juegos de pensar',d.juego,`hasta ${minTxt(tJuegoMin())}`):''}${T.trabajo>0||d.trabajo.n?fila('🖍️','Trabajos del cole',d.trabajo,minTxt(T.trabajo)):''}${(T.mini>0||(d.mini&&d.mini.n))?fila('🎁','Sorpresas y practicar',d.mini||{n:0,min:0},minTxt(T.mini)):''}
      <tr class="tot"><td>Total</td><td></td><td></td><td><b>${minTxt(t.ganados)}</b></td></tr>${t.gastados>0?`<tr><td>Ya visto</td><td></td><td></td><td>−${minTxt(t.gastados)}</td></tr>`:''}</tbody></table>
      <p class="nota">${restaFallo()>0?`Cada pregunta fallada resta ${restaFallo()===0.5?'30 segundos':minTxt(restaFallo())} a lo que da ese ejercicio. ¡Lee despacio y piensa antes de tocar!`:'Las preguntas falladas no restan minutos.'}</p>
      ${(CONT.complementarias||[]).length?`<div class="botones"><button class="btn btn-p" type="button" data-ir="extra">📚 Lecturas extra (+${minTxt(T.extra)})</button></div>`:''}</div>
    <div class="pelis-col"><div class="card bloque peli-caja"><h3>🎬 Peli del viernes por la noche</h3>
      <p class="nota">De lunes a viernes no hay tele. Si lees la historia de cada día, de sábado a viernes, el viernes por la noche ves una película.</p>
      ${peliPuntosHTML(pe, true)}
      ${pe.completa ? (pe.vista ? `<p class="sub">¡Ya habéis visto la peli del viernes! 🍿</p>` : `<p class="sub"><b>¡Película desbloqueada!</b> ${finde||esViernes()?'Elegid una película y ¡a disfrutar! 🍿':'La verás el viernes por la noche. 🍿'}</p>${finde||esViernes()?`<button class="btn btn-verde" type="button" id="peliVista">Ya la hemos visto</button>`:''}`)
        : finde ? `<p class="sub">Esta vez faltaron ${pe.total-pe.hechos===1?'1 lectura':(pe.total-pe.hechos)+' lecturas'}. Desde hoy empieza otra semana: ¡a por la próxima película!</p>` : `<p class="sub">Te ${pe.total-pe.hechos===1?'falta 1 lectura':'faltan '+(pe.total-pe.hechos)+' lecturas'}. ${pe.dias.some(x=>!x.hecho && x.h && x.f<=hoySinHora())?'Toca un día en rojo para leerla.':''}</p>`}</div>
    <div class="card bloque peli-caja peli-sabado"><h3>🍿 Peli del sábado</h3>
      <p class="nota">Si de sábado a viernes haces ${ps.total} lecturas extra o más, el sábado ves otra película.</p>
      <div class="peli-barra" role="img" aria-label="${ps.hechas} de ${ps.total} lecturas extra"><span style="width:${Math.min(100,Math.round(ps.hechas*100/ps.total))}%"></span><b>${Math.min(ps.hechas,ps.total)} de ${ps.total}</b></div>
      ${ps.completa ? (ps.vista ? `<p class="sub">¡Ya habéis visto la peli del sábado! 🍿</p>` : `<p class="sub"><b>¡Peli del sábado desbloqueada!</b> ${finde?'Elegid una película y ¡a disfrutar! 🍿':'La verás el sábado. 🍿'}</p>${finde?`<button class="btn btn-verde" type="button" id="peliVistaS">Ya la hemos visto</button>`:''}`)
        : finde ? `<p class="sub">Esta vez hiciste ${ps.hechas}. ¡Desde hoy empieza otra semana!</p>` : `<p class="sub">Te ${ps.total-ps.hechas===1?'falta 1 lectura extra':'faltan '+(ps.total-ps.hechas)+' lecturas extra'}.</p>`}
      ${(CONT.complementarias||[]).length && !finde && !ps.completa?`<div class="botones"><button class="btn" type="button" data-ir="extra">📚 Ir a las lecturas extra</button></div>`:''}</div></div></div>
  ${typeof movilActivo==='function' && movilActivo() ? movilCajaHTML(p, finde) : ''}`;
  if(typeof activarMovilCaja==='function') activarMovilCaja(p);
  $$('#s-tele [data-peli]').forEach(b=>b.onclick=()=>{ const h=historia(b.dataset.peli); if(h && estaDisponible(h)) empezarHistoria(h); else if(h) aviso('Esa historia todavía no ha llegado'); });
  const vista=(tipo)=>{ const c=cfgDe(p); c.peliLog=(c.peliLog||[]).concat([{f:new Date().toISOString(), semana:claveDia(semanaTele()), ...(tipo?{tipo}:{})}]).slice(-200); guardarAj(); sonido('cromo'); if(PANT.tele._parar) PANT.tele._parar(); ir('tele'); };
  const pv=$('#peliVista'); if(pv) pv.onclick=()=>vista();
  const pvs=$('#peliVistaS'); if(pvs) pvs.onclick=()=>vista('sabado');
  const b=$('#teleBtn'); if(!b) return;
  let corriendo=false, ini=0; const total=t.hoyPuede*60;
  const pinta=()=>{ const usado=corriendo?(Date.now()-ini)/1000:0; const r=Math.max(0,total-usado); const e=$('#teleReloj'); if(e) e.textContent=relojTele(r);
    if(corriendo && r<=0){ parar(); sonido('cromo'); decir(`¡Se acabó la tele, ${nombre()}!`); dialogo({titulo:'¡Se acabó la tele!', html:'<p class="nota">Ya has gastado todos tus minutos. ¡La semana que viene puedes ganar más!</p>', botones:[{t:'Vale', cls:'btn-p', fn:()=>ir('inicio')}], cerrar:false}); } };
  const parar=()=>{ if(!corriendo) return; corriendo=false; clearInterval(teleReloj); teleReloj=null; const usado=Math.min(total,(Date.now()-ini)/1000)/60; if(usado>=.1) apuntarTele(p, usado, 'visto', new Date(ini)); };
  b.onclick=()=>{ if(!corriendo){ corriendo=true; ini=Date.now(); b.textContent='⏸ Parar'; teleReloj=setInterval(pinta, 1000); decir('¡A disfrutar de la tele!'); } else { parar(); ir('tele'); } };
  PANT.tele._parar=parar;
}, salir(){ if(PANT.tele._parar) PANT.tele._parar(); PANT.tele._parar=null; clearInterval(teleReloj); teleReloj=null; }});

/* familia */
function teleAdultoHTML(p, sinAjustes=false){   // 31/10: los minutos de cada tarea y los topes se cambian ahora en Premios
  const T=teleCfg(), t=teleDe(p), pe=peliculaDe(p), ps=peliSabadoDe(p); const log=(cfgDe(p).teleLog||[]).slice(-6).reverse(); const d=t.det;
  const sel=(id,vals,v)=>`<select id="${id}">${vals.map(x=>`<option value="${x}" ${x===v?'selected':''}>${x?x+(x===1?' minuto':' minutos'):'Nada'}</option>`).join('')}</select>`;
  return `<div class="card bloque" style="margin-bottom:18px"><h3 style="margin-bottom:6px">📺 Tele y películas</h3>
    <p class="nota" style="margin-bottom:12px">Se cuenta de sábado a viernes y se ve el fin de semana siguiente; no se acumula. ${t.finde?'Para este fin de semana':'Para el fin de semana'} (del ${esc(fechaCortaTele(t.desde))} al ${esc(fechaCortaTele(diasDespues(t.desde,6)))}) ${esc(p.nombre)} ${t.finde?'ganó':'lleva'} <b>${minTxt(t.ganados)}</b> (${d.propuesta.n} lecturas del día, ${d.extra.n} extra, ${d.relee.n} releídas, ${d.ficha.n} fichas, ${d.trabajo.n} trabajos)${t.gastados>0?`, ha visto ${minTxt(t.gastados)}`:''} y le quedan <b>${minTxt(t.saldo)}</b>.${t.finde?` Para el próximo fin de semana ya lleva ${minTxt(t.proximo)}.`:''}
      Peli del viernes: ${pe.completa?(pe.vista?'ya vista esta semana.':'<b>desbloqueada</b>.'):`${pe.hechos} de ${pe.total} lecturas de la semana.`}
      Peli del sábado: ${ps.completa?(ps.vista?'ya vista esta semana.':'<b>desbloqueada</b>.'):`${ps.hechas} de ${ps.total} lecturas extra.`}
      ${typeof movilActivo==='function' && movilActivo() ? (()=>{ const m=movilDe(p); return `Móvil: ${minTxt(m.ganados)} de ${minTxt(m.max)} para este fin de semana${m.jugados?`, ha jugado ${minTxt(m.jugados)}`:''}. `; })() : ''}De lunes a viernes no hay tele; los minutos son para el sábado y el domingo.${restaFallo()>0?` Cada fallo en las preguntas resta ${restaFallo()===0.5?'30 segundos':minTxt(restaFallo())} a lo que da ese ejercicio.`:''}</p>
    ${peliPuntosHTML(pe)}
    <div class="fam-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:12px">${sinAjustes?'':`
      <div class="campo"><label for="prTele">Lectura del día</label>${sel('prTele',[0,5,10,15,20],T.propuesta)}</div>
      <div class="campo"><label for="prTeleExtra">Lectura extra</label>${sel('prTeleExtra',[0,5,10,15,20,30],T.extra)}</div>
      <div class="campo"><label for="prTeleRelee">Volver a leer</label>${sel('prTeleRelee',[0,2,5,10],T.relee)}</div>
      <div class="campo"><label for="prTeleFicha">Ficha sin fallos</label>${sel('prTeleFicha',[0,2,5,10],T.ficha)}</div>
      <div class="campo"><label for="prTeleTrabajo">Trabajo del cole</label>${sel('prTeleTrabajo',[0,1,2,3,5],T.trabajo)}</div>
      <div class="campo"><label for="prTeleMini">Sorpresas de hoy / Practicar</label>${sel('prTeleMini',[0,1,2,3],T.mini)}</div>
      <div class="campo"><label for="prTeleMaxDia">Como mucho cada día del fin de semana</label><select id="prTeleMaxDia">${[[0,'Sin límite'],[60,'1 hora'],[90,'1 hora y media'],[120,'2 horas'],[150,'2 horas y media'],[180,'3 horas']].map(([x,t])=>`<option value="${x}" ${x===teleMaxDia()?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="campo"><label for="prTeleMaxSem">Como mucho por fin de semana</label><select id="prTeleMaxSem">${[[0,'Sin límite'],[120,'2 horas'],[180,'3 horas'],[240,'4 horas'],[300,'5 horas']].map(([x,t])=>`<option value="${x}" ${x===teleMaxSemana()?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="campo"><label for="prRestaFallo">Cada fallo resta</label><select id="prRestaFallo">${[[0,'Nada'],[0.5,'30 segundos'],[1,'1 minuto']].map(([x,t])=>`<option value="${x}" ${x===restaFallo()?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="campo"><label for="prPeliExtra">Peli del sábado: lecturas extra</label><select id="prPeliExtra">${[5,6,7,8,9,10,12].map(x=>`<option value="${x}" ${x===(+premiosCfg().peliExtras||7)?'selected':''}>${x}</option>`).join('')}</select></div>`}
      <div class="campo"><label for="teleMin">Apuntar a mano (minutos de tele)</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="teleMin" type="number" min="1" max="600" value="10" style="width:90px"><button class="btn btn-mini" type="button" id="teleVisto">Ya los ha visto</button><button class="btn btn-mini" type="button" id="teleRegalo">Regalar</button></div></div></div>
    ${log.length?`<p class="nota" style="margin-top:10px">Últimos: ${log.map(x=>`${esc(fechaCorta(x.f))} ${x.min>0?'−':'+'}${Math.abs(Math.round(x.min))} min`).join(' · ')}</p>`:''}</div>`;
}
function activarTeleAdulto(p){
  const n=()=>Math.max(1, Math.min(600, +$('#teleMin').value||0));
  $('#teleVisto').onclick=()=>{ apuntarTele(p, n(), 'visto'); aviso('Apuntado'); irPremiosFam(); };
  $('#teleRegalo').onclick=()=>{ apuntarTele(p, -n(), 'regalo'); aviso('Regalados'); irPremiosFam(); };
  [['prTele','tDia'],['prTeleExtra','tExtra'],['prTeleRelee','tRelee'],['prTeleFicha','tFicha'],['prTeleTrabajo','tTrabajo'],['prTeleMini','tMini'],['prRestaFallo','restaFallo'],['prPeliExtra','peliExtras'],['prTeleMaxDia','teleMaxDia'],['prTeleMaxSem','teleMaxSemana']].forEach(([id,k])=>{ const e=$('#'+id); if(e) e.onchange=()=>{ guardarPremios({[k]:+e.value}); aviso('Guardado'); irPremiosFam(); }; });
}

/* ---------- la semana que acabó el viernes (de sábado a viernes): para el niño el fin de semana y para la familia ---------- */
function semanaPasadaDe(p=perfil()){
  const hasta=sabadoDe(), desde=diasDespues(hasta,-7);
  const det=teleDetalle(p, desde, hasta); const ganados=sumaDet(det, desde);
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

