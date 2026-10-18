/* LeeLEEJG · lecturas complementarias («lecturas extra»): un poco más largas, con 4 preguntas.
   Solo dan minutos de tele (no dan cromos, criaturas ni juegos). */
'use strict';
const COMPS = () => CONT.complementarias || [];
function nivelExtra(p=perfil()){ return Math.max(1, Math.min(5, nivelActualDe(p))); }
function extrasDe(p=perfil()){
  const hechas={}; sesDe(p.id).forEach(s=>{ if(!s.incompleta && esComp(s.historiaId)) hechas[s.historiaId]=(hechas[s.historiaId]||0)+1; });
  return hechas;
}
/* la siguiente que le toca: la primera sin leer de su nivel (y si no quedan, del siguiente) */
function siguienteExtra(p=perfil()){
  const n=nivelExtra(p), h=extrasDe(p);
  return COMPS().find(x=>x.nivel===n && !h[x.id]) || COMPS().find(x=>x.nivel===n+1 && !h[x.id]) || COMPS().find(x=>x.nivel<=n && !h[x.id]) || null;
}
function extraHTML(){
  const p=perfil(); if(p.prueba && !COMPS().length) return ''; if(!COMPS().length) return '';
  const T=teleCfg(); const s=siguienteExtra(p); const nHoy=sesDe(p.id).filter(x=>!x.incompleta && esComp(x.historiaId) && claveDia(x.fecha)===claveDia(new Date())).length;
  return `<button class="acceso extra-c" type="button" data-ir="extra"><span class="mini-fotos">${s?imgHTML(s.portada):'📚'}</span><span><b>📚 Lecturas extra${T.extra>0?` · +${minTxt(T.extra)} de tele`:''}</b><span class="nota">${s?`Siguiente: «${esc(conNombre(s.titulo))}». Son un poco más largas y tienen 4 preguntas.`:'¡Las has leído todas! Puedes volver a leerlas.'}${nHoy?` Hoy llevas ${nHoy}.`:''}</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
definir('extra', {nav:'historias', pintar(){
  const p=perfil(), n=nivelExtra(p), h=extrasDe(p), T=teleCfg();
  const niveles=[...new Set(COMPS().map(x=>x.nivel))].filter(x=>x<=n+1).sort((a,b)=>(a===n?-1:b===n?1:a-b));
  const carta=x=>`<button type="button" class="extra-carta${h[x.id]?' hecha':''}" data-x="${esc(x.id)}"><span class="ft">${imgHTML(x.portada)}</span><b>${esc(conNombre(x.titulo))}</b><span class="nota">${h[x.id]?`✓ Leída · otra vez +${minTxt(T.relee)}`:`+${minTxt(T.extra)} de tele`}</span></button>`;
  $('#s-extra').innerHTML = `<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
    <div class="album-cab"><div><h1 class="tit">📚 Lecturas extra</h1><p class="sub">Son un poco más largas y tienen 4 preguntas. Cada una nueva te da ${minTxt(T.extra)} de tele para el fin de semana${T.relee?`; volver a leerla, ${minTxt(T.relee)}`:''}. No dan cromos ni criaturas.</p></div>
      <div class="contador">📚<div><b>${Object.keys(h).length} de ${COMPS().length}</b><br><span>leídas</span></div></div></div>
    ${niveles.map(nv=>{ const xs=COMPS().filter(x=>x.nivel===nv); return `<h2 class="sec-extra">${nv===n?'Para ti ahora':nv>n?'Un poco más difíciles':'Más cortitas'} <span class="nota">Nivel ${nv} · ${xs.filter(x=>h[x.id]).length} de ${xs.length}</span></h2><div class="extra-grid">${xs.map(carta).join('')}</div>`; }).join('')}`;
  $$('#s-extra [data-x]').forEach(b=>b.onclick=()=>{ const x=historia(b.dataset.x); if(x) empezarHistoria(x); });
}});
/* final de una lectura extra (en vez del cromo) */
function finExtraHTML(h, s){
  const p=perfil(), min=minutosDeSesion(p, s), t=teleDe(p);
  return `<div class="card cromo-g fin-extra" id="cromoCaja"><div class="carta"><div class="ft">${imgHTML(h.portada,true)}</div><div class="pie"><b>${esc(conNombre(h.titulo))}</b><span>📚 Lectura extra</span></div></div>
    <div class="tx"><h1>${min>0?`+${minTxt(min)} de tele`:'¡Muy bien!'}</h1><p class="sub">${min>0?`Ya tienes ${minTxt(t.saldo)} para el fin de semana.`:'Has terminado la lectura extra.'}</p>
      <div class="res-mini"><span class="chip">Preguntas ${s.aciertos} de ${s.totalPreguntas}</span><span class="chip">${s.segundos<60?s.segundos+' segundos':mmss(s.segundos)+' min'}</span></div>
      ${audioBlob || s.audio ? `<button class="btn btn-verde btn-g btn-bloque" type="button" id="btnEscucharme">${ic('altavoz')} Escucharme</button>`:''}
      <button class="btn btn-borde btn-g btn-bloque" type="button" data-ir="extra">📚 Otra lectura extra</button>
      <button class="btn btn-p btn-g btn-bloque" type="button" data-ir="inicio">${ic('casa')} Volver al inicio</button>
      <p class="nota" id="guardadoTxt"></p></div></div>`;
}
