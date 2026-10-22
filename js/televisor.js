/* LeeLEEJG · la tele dibujada (22/10/2026, pedido por la familia).
   - En Inicio, una tele grande con los minutos en la pantalla, la peli del viernes (7 fotogramas de sábado a viernes),
     la barra de la peli del sábado (lecturas extra) y lo que le falta para la próxima media hora.
   - Arriba, en todas las pantallas del niño, una tele pequeña con los minutos que va ganando.
   - Cada vez que gana minutos salen relojitos «+10» que vuelan a la tele, suena un «clin» por minuto, la voz lo dice
     y el número sube; al volver a Inicio, la tele grande recibe de golpe lo nuevo desde la última vez que la vio.
   El fin de semana la tele grande enseña lo que puede ver ahora; lo que gana ese día ya es para el fin de semana siguiente. */
'use strict';
/* lo que se está ganando ahora (entre semana, para el fin de semana que viene; el fin de semana, para el siguiente) */
function teleGanando(p=perfil()){ const t=teleDe(p); return t.finde ? t.proximo : t.saldo; }
const claveGanando = () => claveDia(sabadoDe());
const medioNum = m => (Number.isInteger(m)?String(m):String(m).replace('.5','½'));
/* en la pantalla: hasta 59, los minutos; desde 60, «1 h 35» y debajo «1 hora y 35 minutos» */
const textoMin = m => { m=Math.round(m*2)/2; if(m<60) return medioNum(m); const h=Math.floor(m/60), r=m-h*60; return r?`${h}h ${medioNum(r)}`:`${h} ${h===1?'hora':'horas'}`; };
const subMin = m => { m=Math.round(m*2)/2; if(m<60) return 'minutos'; const h=Math.floor(m/60), r=m-h*60; return r?`${h===1?'hora':'horas'} y ${r===1?'minuto':'minutos'}`:'de tele'; };
/* pone el número en la pantalla (y la línea de debajo, si la hay) */
function ponTeleNum(el, v){ if(el.tagName.toLowerCase()!=='text'){ el.textContent=minTxt(v); return; }
  const t=textoMin(v); el.textContent=t; const largo=t.length>4; const chico=!!el.closest('.chica');
  el.setAttribute('font-size', chico ? (largo?16:28) : (largo?19:26));
  const sub=el.parentNode && el.parentNode.querySelector('.tele-sub'); if(sub) sub.textContent=subMin(v); }

function teleSVG(min, chico){
  // tele de las de antes, con antenas, botones y patas; el número va en la pantalla
  return `<svg viewBox="0 0 120 100" class="tele-svg${chico?' chica':''}" aria-hidden="true">
    <line x1="60" y1="18" x2="40" y2="3" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/><line x1="60" y1="18" x2="80" y2="2" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="40" cy="3" r="2.6" fill="#F59E0B"/><circle cx="80" cy="2" r="2.6" fill="#F59E0B"/>
    <rect x="6" y="16" width="108" height="72" rx="12" fill="#2F6FD6"/><rect x="6" y="16" width="108" height="72" rx="12" fill="none" stroke="#1E4FA3" stroke-width="2"/>
    <rect x="14" y="24" width="76" height="56" rx="7" fill="#0F172A"/><rect x="14" y="24" width="76" height="56" rx="7" fill="url(#brillo)"/>
    <defs><linearGradient id="brillo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38BDF8" stop-opacity=".35"/><stop offset=".6" stop-color="#0F172A" stop-opacity="0"/></linearGradient></defs>
    <circle cx="102" cy="36" r="5" fill="#FDE68A"/><circle cx="102" cy="52" r="5" fill="#FCA5A5"/><rect x="97" y="64" width="10" height="3" rx="1.5" fill="#1E4FA3"/><rect x="97" y="70" width="10" height="3" rx="1.5" fill="#1E4FA3"/>
    <rect x="24" y="88" width="8" height="9" rx="2" fill="#1E4FA3"/><rect x="88" y="88" width="8" height="9" rx="2" fill="#1E4FA3"/>
    <text x="52" y="${chico?60:57}" text-anchor="middle" class="tele-num" font-size="${textoMin(min).length>4?(chico?16:19):(chico?28:26)}" font-weight="900" fill="#FDE047">${textoMin(min)}</text>
    ${chico?'':`<text x="52" y="72" text-anchor="middle" class="tele-sub" font-size="8" font-weight="800" fill="#E0F2FE">${subMin(min)}</text>`}
  </svg>`;
}

/* ---------- la tele pequeña de arriba ---------- */
function actualizarTeleMini(){
  const b=document.getElementById('teleMini'); if(!b) return;
  const p=aj && aj.perfiles && perfil(); const ver = p && !p.prueba && teleActiva() && PANT[actual] && PANT[actual].zona==='nino' && actual!=='quien';
  b.hidden=!ver; if(!ver) return;
  if(b.dataset.animando) return;
  const g=teleGanando(p); b.innerHTML=teleSVG(g, true); b.title=`${minTxt(g)} de tele para el ${esFinde()?'próximo ':''}fin de semana`;
}

/* ---------- la tele grande de Inicio ---------- */
const HITOS = [30,60,90,120,150,180,240,300,360];
const nombreHito = m => m===30?'media hora':m===60?'1 hora':m===90?'hora y media':m%60===0?`${m/60} horas`:`${Math.floor(m/60)} horas y media`;
function faltaTxt(p, g){
  const T=teleCfg(); const hito=HITOS.find(h=>h>g); if(!hito) return '¡Tienes un montón de tele!';
  const falta=hito-g; const h=historiaDeHoy(); const hoyLeida=!!leidas()[h.id];
  if(!hoyLeida && T.propuesta>0) return `Lee la historia de hoy (+${minTxt(T.propuesta)})${T.propuesta>=falta?` y llegas a ${nombreHito(hito)}`:''}.`;
  const cada = T.extra>0 ? T.extra : T.relee; if(!cada) return '';
  const n=Math.ceil(falta/cada); const que = T.extra>0 ? (n===1?'lectura extra':'lecturas extra') : (n===1?'historia':'historias');
  return `Lee ${n===1?'una':n} ${que} más y llegas a ${nombreHito(hito)}.`;
}
function televisorHTML(){
  const p=perfil(); if(!teleActiva() || p.prueba) return '';
  const t=teleDe(p), finde=t.finde, pe=peliculaDe(p); const g=teleGanando(p);
  const peli = pe.total ? `<div class="peli-rollo" aria-label="Película: ${pe.hechos} de ${pe.total}">${pe.dias.map((x,i)=>`<span class="fot ${x.antes?'nada':x.hecho?'ok':x.f>hoySinHora()?'fut':'falta'}"><b>${LETRA_DIA[i]}</b>${x.hecho&&!x.antes?'🎬':''}</span>`).join('')}</div>
    <span class="nota">${pe.completa?(pe.vista?'🎬 Peli del viernes: ¡vista!':finde||esViernes()?'🎬 ¡Peli del viernes desbloqueada!':'🎬 ¡Ya tienes la peli del viernes!'):`🎬 Peli del viernes: ${pe.hechos} de ${pe.total} lecturas`}</span>` : '';
  const ps=peliSabadoDe(p);
  const peliS = `<span class="peli-sab"><span class="peli-barra chica" aria-hidden="true"><span style="width:${Math.min(100,Math.round(ps.hechas*100/ps.total))}%"></span></span>
    <span class="nota">${ps.completa?(ps.vista?'🍿 Peli del sábado: ¡vista!':'🍿 ¡Peli del sábado desbloqueada!'):`🍿 Peli del sábado: ${ps.hechas} de ${ps.total} lecturas extra`}</span></span>`;
  return `<button class="televisor${finde?' finde':''}" type="button" data-ir="tele" id="televisor">
    <span class="tv-caja" id="tvGrande">${teleSVG(finde?t.saldo:g)}</span>
    <span class="tv-tx"><b>${finde?(t.saldo>0?'¡Es fin de semana! Tu tele de hoy':'¡Es fin de semana!'):'Tu tele del fin de semana'}</b>
      <span class="tv-total">${finde?(t.saldo>0?`Puedes ver <b>${minTxt(t.saldo)}</b>`:''):`Llevas <b id="tvTotal">${minTxt(g)}</b>`}</span>
      ${finde?`<span class="nota">Para el próximo fin de semana ya llevas <b id="tvProx">${minTxt(g)}</b>.</span>`:''}
      <span class="falta">${esc(faltaTxt(p, g))}</span>${peli}${peliS}</span></button>`;
}
/* al pintar Inicio: si ha ganado minutos desde la última vez que vio la tele grande, entran volando */
function televisorInicio(){
  const p=perfil(); if(!teleActiva() || p.prueba || !document.getElementById('televisor')) return;
  const c=cfgDe(p), k=claveGanando(), g=teleGanando(p);
  const antes = c.teleVistaInicio && c.teleVistaInicio.k===k ? c.teleVistaInicio.min : null;
  c.teleVistaInicio={k, min:g}; guardarAj();
  if(antes==null || g<=antes) return;
  const destino = esFinde() ? document.getElementById('tvProx') : document.querySelector('#tvGrande .tele-num');
  // mientras llega, el número enseña lo de antes
  if(destino) ponTeleNum(destino, antes); const tt=document.getElementById('tvTotal'); if(tt && !esFinde()) tt.textContent=minTxt(antes);
  setTimeout(()=>{   // después de que la pantalla vuelva arriba: si la tele no se ve, se baja hasta ella
    const tv=document.getElementById('televisor'); if(!tv || actual!=='inicio') return; const r=tv.getBoundingClientRect();
    const fuera = r.top<0 || r.bottom>window.innerHeight; if(fuera) tv.scrollIntoView({behavior:'smooth', block:'center'});
    setTimeout(()=>{ if(actual==='inicio') teleVolar(g-antes, {de:antes, a:g, destino, voz:true}); }, fuera?900:500);
  }, 80);
}

/* ---------- relojitos que vuelan a la tele y el número que sube ---------- */
let teleVolando=false;
function teleVolar(min, {de=null, a=null, destino=null, voz=true}={}){
  if(!(min>0)) return;
  const mini=document.getElementById('teleMini');
  destino = destino || (mini && !mini.hidden ? mini.querySelector('.tele-num') : null);
  if(!destino){ if(voz) decir(`¡${minTxt(min)} más de tele!`); return; }
  if(de==null){ a=teleGanando(); de=Math.max(0, a-min); }
  const quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caja=destino.closest('button')||destino; if(mini && caja===mini) mini.dataset.animando='1';
  const tot=document.getElementById('tvTotal'); const ponNum=v=>{ ponTeleNum(destino, v); if(tot && caja.id==='televisor') tot.textContent=minTxt(v); };
  ponNum(de);
  if(voz) decir(`¡${minTxt(min)} más de tele!`);
  const r=destino.getBoundingClientRect(); const fx=r.left+r.width/2, fy=r.top+r.height/2;
  const n=quieto?0:Math.min(6, Math.max(1, Math.round(min/3)));
  for(let i=0;i<n;i++){
    const el=document.createElement('span'); el.className='reloj-vuela'; el.textContent = i===0 ? `⏱️ +${min<60?medioNum(Math.round(min*2)/2):textoMin(min)}` : '⏱️';
    const x0=window.innerWidth/2+(Math.random()-.5)*160, y0=window.innerHeight*0.62+(Math.random()-.5)*80;
    el.style.left=x0+'px'; el.style.top=y0+'px'; document.body.appendChild(el);
    setTimeout(()=>{ el.style.transform=`translate(${fx-x0}px, ${fy-y0}px) scale(.5)`; el.style.opacity='.2'; }, 60+i*140);
    setTimeout(()=>{ el.remove(); sonido('clin'); }, 900+i*140);
  }
  // el número sube minuto a minuto
  const t0=quieto?0:900+(n-1)*140, pasos=Math.max(1, Math.min(20, Math.ceil(a-de))); let k=0;
  setTimeout(function sube(){ k++; const v=de+(a-de)*k/pasos; ponNum(v); caja.classList.add('tele-late'); setTimeout(()=>caja.classList.remove('tele-late'),160);
    if(k%2===1 || k===pasos) sonido('clin');
    if(k<pasos) setTimeout(sube, 90); else { if(mini) delete mini.dataset.animando; actualizarTeleMini(); } }, t0);
}
