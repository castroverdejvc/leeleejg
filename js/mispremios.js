/* LeeLEEJG · «Mis premios» (24/10/2026): todo lo que gana, en una sola pantalla para el niño, con dibujos y barras:
   sus estrellas, lo próximo (muñeco, juego, revista, caja) y cuánto le falta, el sobre de hoy, lo del fin de semana
   (tele, móvil, pelis), lo que tiene para recoger y sus colecciones. Solo enseña: no cambia ninguna regla. */
'use strict';
function misPremiosBotonHTML(){
  const p=perfil(); if(p.prueba || typeof estrellasDe!=='function') return '';
  const pend=premiosPorRecoger(p).reduce((a,x)=>a+x.n,0);
  return `<button class="acceso mis-premios-b" type="button" data-ir="mispremios"><span class="emo-g">🎁</span><span><b>Mis premios</b><span class="nota">${pend?`¡Tienes ${pend} ${pend===1?'premio':'premios'} para recoger!`:'Todo lo que tienes y lo que te falta.'}</span></span><span class="ir">${ic('dcha')}</span></button>`;
}
function premiosPorRecoger(p){
  const r=[];
  try{ const s=sobresDe(p); if(s.pend) r.push({emo:'🎴', t:s.pend===1?'un sobre de cartas':`${s.pend} sobres de cartas`, n:s.pend}); }catch(_){}
  try{ if(typeof revistasDe==='function'){ const v=revistasDe(p); if(v.pend) r.push({emo:'📰', t:v.pend===1?'una revista':`${v.pend} revistas`, n:v.pend}); } }catch(_){}
  try{ if(typeof cajasHitos==='function'){ const c=cajasHitos(p); if(c.activo && c.pend) r.push({emo:'🎁', t:c.pend===1?'una caja del cofre':`${c.pend} cajas del cofre`, n:c.pend}); } }catch(_){}
  return r;
}
definir('mispremios', {nav:'inicio', pintar(){
  try{ guardarLoYaVisto(perfil()); }catch(e){}
  const p=perfil(), cfg=premiosCfg(), est=estrellasDe(p), sem=estrellasEntre(p, sabadoDe(hoyTele()), diasDespues(sabadoDe(hoyTele()),7));
  const barra=(v,k,col)=>`<span class="barra-t"><i style="width:${Math.max(0,Math.min(100,Math.round(100*v/Math.max(1,k))))}%;background:${col}"></i></span>`;
  const falta=n=>n<=0?'¡Ya lo tienes!':n===1?'¡Te falta 1 ⭐!':`Te faltan ${n} ⭐`;
  const fila=(emo,t,nota,b='')=>`<div class="mp-fila"><span class="emo-g">${emo}</span><div class="tx"><b>${t}</b><span class="nota">${nota}</span>${b}</div></div>`;
  // próximos
  const kc=cadaK(cfg.estCriatura), kj=cadaK(cfg.estJuego); const nJ=typeof JUEGOS!=='undefined'?JUEGOS.length:0;
  const prox=[fila('🐾','Próximo muñeco', falta(kc-(est%kc)), barra(est%kc,kc,'#8B5CF6'))];
  if(juegosAbiertos(p)<nJ) prox.push(fila('🎮','Próximo juego', falta(kj-(est%kj)), barra(est%kj,kj,'#F5A300')));
  if(typeof revistasDe==='function'){ const v=revistasDe(p); if(v.activo){ const r1=+cfg.revista1||0, r2=+cfg.revista2||0; const meta = sem<r1 ? r1 : sem<r2 ? r2 : null;
    prox.push(fila('📰', meta?`Revista ${meta===r1?'1':'2'} de esta semana`:'¡Las 2 revistas de esta semana!', meta?`${falta(meta-sem)} (llevas ${sem} esta semana)`:'¡Conseguidas!', meta?barra(sem,meta,'#0EA5B7'):'')); } }
  if(typeof cajasHitos==='function'){ const c=cajasHitos(p); if(c.activo && c.sig) prox.push(fila('🎁', `Cofre del tesoro: ${c.sig.tipo==='grande'?'caja grande':'caja pequeña'}`, falta(c.sig.v-est), barra(est,c.sig.v,'#E11D48'))); }
  // hoy
  const sd=typeof sobreDelDia==='function'?sobreDelDia(p):null; const ok=b=>b?'✅':'⬜';
  const hoy = sd && sd.activo ? fila(sd.sorpresa?'🎁':'🎴', sd.ganado?'¡Sobre de hoy conseguido!':sd.sorpresa?'¡Hoy es día sorpresa!':'Sobre de cartas de hoy', sd.ganado?'Pídeselo a papá o a mamá.':`${ok(sd.dia)} La historia de hoy · ${ok(sd.extras>=sd.meta)} ${Math.min(sd.extras,sd.meta)} de ${sd.meta} lecturas extra`, sd.ganado?'':barra((sd.dia?1:0)+Math.min(sd.extras,sd.meta), sd.meta+1, '#E11D48')) : '';
  // fin de semana
  const fin=[];
  if(teleActiva()){ const t=teleDe(p); const g=t.finde?t.saldo:t.saldo; fin.push(fila('📺', t.finde?`Tele de hoy: ${minTxt(g)}`:`Tele del fin de semana: ${minTxt(g)}`, t.finde?'Para el sábado y el domingo.':'La ves el sábado y el domingo.')); }
  if(typeof movilDe==='function' && movilActivo()){ const m=movilDe(p); fin.push(fila('📱', `Móvil: ${minTxt(m.saldo)}`, m.ganados>=m.max?'¡Ya tienes el máximo!':`1 minuto cada ${m.cada} ⭐ (como mucho ${m.max})`, barra(m.ganados,m.max,'#64748B'))); }
  const pe=peliculaDe(p), ps=peliSabadoDe(p);
  if(pe.total) fin.push(fila('🎬', pe.completa?'¡Peli del viernes conseguida!':'Peli del viernes', pe.completa?(pe.vista?'Ya la has visto. 🍿':'El viernes por la noche.'):`${pe.hechos} de ${pe.total} historias del día`, pe.completa?'':barra(pe.hechos,pe.total,'#F59E0B')));
  fin.push(fila('🍿', ps.completa?'¡Peli del sábado conseguida!':'Peli del sábado', ps.completa?(ps.vista?'Ya la has visto.':'¡El sábado!'):`${ps.hechas} de ${ps.total} lecturas extra`, ps.completa?'':barra(ps.hechas,ps.total,'#F59E0B')));
  // para recoger y colecciones
  const rec=premiosPorRecoger(p);
  const nM=criaturasDe(p).length, nC=Object.keys(cromosDe(p)).length;
  $('#s-mispremios').innerHTML=`<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
    <div class="card mp-cab"><span class="mp-est">⭐ ${est}</span><div><h1 class="tit">Mis premios</h1><p class="nota">Esta semana llevas <b>${sem} ⭐</b>. Cada lectura, ficha y juego de aprender te da estrellas.</p></div></div>
    ${rec.length?`<div class="card bloque mp-recoger"><h3>🙌 Para recoger</h3>${rec.map(x=>fila(x.emo, `Tienes ${x.t}`, 'Pídeselo a papá o a mamá.')).join('')}</div>`:''}
    <div class="mp-grid">
      <div class="card bloque"><h3>🎯 Lo próximo</h3>${prox.join('')}</div>
      <div class="card bloque"><h3>📅 Hoy</h3>${hoy||'<p class="nota">Hoy no hay sobre de cartas.</p>'}${typeof palabrasDiaHTML==='function' && !palDiaHecho(p)?fila('🔤','Mis palabras de hoy','Un minuto y ⭐'):''}</div>
      <div class="card bloque"><h3>🛋️ Fin de semana</h3>${fin.join('')}</div>
      <div class="card bloque"><h3>🧸 Mis colecciones</h3>
        <button type="button" class="mp-fila mp-link" data-ir="criaturas"><span class="emo-g">🐾</span><div class="tx"><b>${nM} ${nM===1?'muñeco':'muñecos'}</b><span class="nota">Ver mis muñecos</span></div></button>
        <button type="button" class="mp-fila mp-link" data-ir="cromos"><span class="emo-g">🃏</span><div class="tx"><b>${nC} ${nC===1?'cromo':'cromos'}</b><span class="nota">Ver mi álbum</span></div></button>
        <button type="button" class="mp-fila mp-link" data-ir="juegos"><span class="emo-g">🎮</span><div class="tx"><b>${juegosAbiertos(p)} de ${nJ} juegos</b><span class="nota">Ir a los juegos</span></div></button></div>
    </div>`;
  decir(`Tienes ${est} estrellas. ${rec.length?'¡Y tienes premios para recoger! ':''}Mira lo que te falta para el próximo premio.`);
}});
