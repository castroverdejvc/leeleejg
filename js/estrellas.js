/* LeeLEEJG · estrellas ⭐ (24/10/2026): todo lo que hace suma a una sola barra, para repartir los premios de forma más homogénea.
   Decidido por la familia:
   - lectura del día (la primera vez) ⭐⭐⭐ · lectura extra nueva o historia nueva de sus temas ⭐⭐ · volver a leer ⭐
   - ficha, dictado, «As letras» o trabajo del cole ⭐ (⭐⭐ si casi todo bien: 80 % o más)
   - muñeco (criatura nueva o la evolución de una que ya tiene) cada 8 ⭐ · juego nuevo cada 30 ⭐
   - sobre de cartas del día: la lectura del día + 4 extras ese mismo día (máximo uno al día);
     días sorpresa (1 o 2 por semana, al azar): basta con 2 extras
   - móvil: 1 minuto por cada 3 ⭐ de la semana (de sábado a viernes), como mucho 30, para el sábado y el domingo
   Lo ganado antes del 24/10/2026 se queda como estaba (criatura cada 2 actividades, juego cada 5, sobre cada 15).
   Todo se calcula de lo hecho, así el iPad y el ordenador dan siempre lo mismo. */
'use strict';
const CORTE_PREMIOS = new Date(2026, 9, 24);   // sábado 24/10/2026, 00:00
const despuesCorte = f => +new Date(f) >= +CORTE_PREMIOS;

/* actividades (las de antes) hechas antes de una fecha */
function actividadesHasta(p, t){
  const c=cfgDe(p), lim=+new Date(t);
  return sesDe(p.id).filter(s=>!s.incompleta && !esComp(s.historiaId) && +new Date(s.fecha)<lim).length
    + ['dictadoLog','repasoLog','letrasLog'].reduce((a,k)=>a+(c[k]||[]).filter(x=>+new Date(x.f)<lim).length, 0);
}
const actividadesAntesCorte = p => actividadesHasta(p, CORTE_PREMIOS);
const cadaK = n => Math.max(1, +n||1);

/* ---------- las estrellas de cada cosa hecha ---------- */
const pctBien = (bien, n) => n ? bien/n : 0;
let _cacheEv={k:null, v:null};
function estrellasEventos(p=perfil()){
  const c=cfgDe(p);
  const k=[p.id, SES.length, SES.filter(s=>!s.incompleta).length, claveDia(new Date()), JSON.stringify(aj.premios||{}), ...[...LOGS_FICHA,'trabajosLog','eduLog','objManualLog','deporteLog'].map(x=>(c[x]||[]).length)].join('|');
  if(_cacheEv.k===k) return _cacheEv.v;
  const ev=calcularEventos(p, c); _cacheEv={k, v:ev}; return ev;
}
function calcularEventos(p, c){
  const ev=[], vistas=new Set();
  sesDe(p.id).filter(s=>!s.incompleta && s.fecha).sort((a,b)=>a.fecha<b.fecha?-1:1).forEach(s=>{
    const primera=!vistas.has(s.historiaId); vistas.add(s.historiaId);
    let tipo, n;
    if(esComp(s.historiaId)){ tipo=primera?'extra':'relee'; n=primera?2:1; }
    else if(primera && esPropuesta(p, s.historiaId)){ tipo='dia'; n=3; }
    else if(primera){ tipo='nueva'; n=2; }
    else { tipo='relee'; n=1; }
    ev.push({f:s.fecha, n, tipo, hid:s.historiaId, sid:s.id});
  });
  LOGS_FICHA.forEach(k=>(c[k]||[]).forEach(x=>{ if(!x.f) return; const n=+x.n||0; ev.push({f:x.f, n: 1 + (n && pctBien(+x.bien||0, n)>=0.8 ? 1 : 0), tipo:'ficha'}); }));
  (c.trabajosLog||[]).forEach(x=>{ if(!x.f) return; const a=+x.a||0, e=+x.e||0; ev.push({f:x.f, n: 1 + ((a+e) && pctBien(a, a+e)>=0.8 ? 1 : 0), tipo:'trabajo'}); });
  // juegos de «Aprender jugando»: una ronda terminada ⭐ (⭐⭐ si casi todo bien), como mucho eduMax ⭐ al día
  const maxEdu=+premiosCfg().eduMax||0, porDia={};
  (c.eduLog||[]).filter(x=>x.f).sort((a,b)=>a.f<b.f?-1:1).forEach(x=>{ const k=claveDia(x.f), ya=porDia[k]||0, n=+x.n||0;
    const d=Math.min(1 + (n && pctBien(+x.bien||0, n)>=0.8 ? 1 : 0), maxEdu-ya); if(d>0){ porDia[k]=ya+d; ev.push({f:x.f, n:d, tipo:'juego'}); } });
  if(typeof eventosRacha==='function') ev.push(...eventosRacha(p));
  if(typeof eventosObjetivos==='function') ev.push(...eventosObjetivos(p, ev.slice().sort((a,b)=>+new Date(a.f)-+new Date(b.f))));
  return ev.sort((a,b)=>+new Date(a.f)-+new Date(b.f));
}
/* estrellas entre dos fechas (por defecto, desde el 24/10/2026 hasta ahora) */
function estrellasEntre(p=perfil(), desde=CORTE_PREMIOS, hasta=null){
  const d=+new Date(desde), h=hasta?+new Date(hasta):Infinity;
  return estrellasEventos(p).filter(e=>{ const t=+new Date(e.f); return t>=d && t<h; }).reduce((a,e)=>a+e.n,0);
}
const estrellasDe = (p=perfil()) => estrellasEntre(p);
/* estrellas que da una lectura concreta (para el final de la lectura) */
function estrellasDeSesion(p, s){
  const antes=sesDe(p.id).some(x=>x.id!==s.id && !x.incompleta && x.historiaId===s.historiaId && x.fecha<s.fecha);
  if(esComp(s.historiaId)) return antes?1:2;
  return antes ? 1 : esPropuesta(p, s.historiaId) ? 3 : 2;
}
function estrellasChipHTML(s){ const p=perfil(); if(p.prueba) return ''; const n=estrellasDeSesion(p, s); return `<span class="chip chip-estrella">${'⭐'.repeat(Math.min(3,n))} +${n}</span>`; }

/* ---------- muñecos: criaturas nuevas y sus evoluciones ---------- */
const FORMAS = {2:{pre:'Súper', n:'Súper'}, 3:{pre:'Mega', n:'Mega'}};
/* criatura u objeto evolucionado a partir de «id» o «id@2» / «id@3» */
function criaturaForma(id){
  const [bid, f]=String(id).split('@'); const b=todasCriaturas().find(c=>c.id===bid); if(!b) return null;
  const forma=+f||1; if(forma===1) return b;
  return {...b, id:bid+'@'+forma, base:bid, forma, nombre:FORMAS[forma].pre+' '+b.nombre};
}
const munecosBase0 = p => Math.floor(actividadesAntesCorte(p)/cadaK(premiosCfg().criatura));
/* el orden de los muñecos: primero los que ya tenía; después, alternando nuevos y evoluciones (las de 3.ª forma al final de cada ronda) */
const _cacheSeq = {};
function secuenciaMunecos(p){
  const n0=Math.min(CRIATURAS.length, munecosBase0(p)), k=p.id+'|'+n0; if(_cacheSeq[k]) return _cacheSeq[k];
  const orden=ordenCriaturas(p).map(c=>c.id);
  const seq=orden.slice(0,n0), tiene=new Set(seq);
  const Q={A:orden.slice(n0), B:orden.map(id=>id+'@2'), C:orden.map(id=>id+'@3')};
  const req={A:()=>null, B:id=>id.split('@')[0], C:id=>id.replace('@3','@2')};
  const patron=['A','B','A','B','A','B','C']; let i=0;
  while(Q.A.length||Q.B.length||Q.C.length){
    const pref=patron[i++%patron.length]; let puso=false;
    for(const q of [pref,'A','B','C']){ const L=Q[q]; if(!L.length) continue; const r=req[q](L[0]); if(r && !tiene.has(r)) continue; const id=L.shift(); seq.push(id); tiene.add(id); puso=true; break; }
    if(!puso) break;
  }
  return (_cacheSeq[k]=seq);
}
/* cuántos muñecos tiene ganados en una fecha */
function munecosHasta(p, t=new Date()){
  const lim=+new Date(t), k=cadaK(premiosCfg().estCriatura);
  const antes=Math.floor(actividadesHasta(p, Math.min(lim, +CORTE_PREMIOS))/cadaK(premiosCfg().criatura));
  return antes + (lim>+CORTE_PREMIOS ? Math.floor(estrellasEntre(p, CORTE_PREMIOS, lim)/k) : 0);
}
function juegosHasta(p, t=new Date()){
  const lim=+new Date(t), nJ=typeof JUEGOS!=='undefined'?JUEGOS.length:0;
  const antes=Math.floor(actividadesHasta(p, Math.min(lim, +CORTE_PREMIOS))/cadaK(premiosCfg().juego));
  const despues=lim>+CORTE_PREMIOS ? Math.floor(estrellasEntre(p, CORTE_PREMIOS, lim)/cadaK(premiosCfg().estJuego)) : 0;
  return Math.min(nJ, 1+antes+despues);
}

/* ---------- sobre de cartas del día y días sorpresa ---------- */
/* los días sorpresa de una semana (de sábado a viernes): 1 o 2, siempre los mismos para ese niño */
function diasSorpresa(p, sab){
  const r=azar(semilla('sorpresa-'+p.id+'-'+claveDia(sab))); const n=r()<0.5?1:2;
  const dias=barajarCon([0,1,2,3,4,5,6], Math.floor(r()*1e9)).slice(0,n);
  return dias.map(i=>claveDia(diasDespues(sab,i)));
}
function esDiaSorpresa(p=perfil(), f=hoyTele()){ const cfg=premiosCfg(); if(!cfg.sorpresa || !despuesCorte(f) || p.prueba) return false; return diasSorpresa(p, sabadoDe(f)).includes(claveDia(f)); }
/* cómo va un día: lectura del día hecha y extras nuevas */
function sobreDelDia(p=perfil(), f=hoyTele()){
  const k=claveDia(f), cfg=premiosCfg(); const ev=estrellasEventos(p).filter(e=>claveDia(e.f)===k);
  const dia=ev.some(e=>e.tipo==='dia'), extras=ev.filter(e=>e.tipo==='extra').length, sorpresa=esDiaSorpresa(p, f);
  const meta = sorpresa ? cadaK(cfg.sorpresaExtras) : (+cfg.sobreDia||0);
  return {dia, extras, meta, sorpresa, activo: meta>0 && despuesCorte(f), ganado: meta>0 && despuesCorte(f) && dia && extras>=meta};
}
/* días con sobre ganado (desde el 24/10/2026) */
function diasConSobre(p=perfil(), hasta=null){
  const dias=new Set(estrellasEventos(p).filter(e=>despuesCorte(e.f) && (!hasta || +new Date(e.f)<+new Date(hasta))).map(e=>claveDia(e.f)));
  return [...dias].filter(k=>sobreDelDia(p, new Date(k+'T12:00')).ganado);
}

/* ---------- móvil del fin de semana ---------- */
function movilDe(p=perfil(), desde=semanaTele()){
  const cfg=premiosCfg(); const est=estrellasEntre(p, desde, diasDespues(desde,7));
  const ganados=Math.min(+cfg.movilMax||0, Math.floor(est/cadaK(cfg.movilCada)));
  const k=claveDia(desde); const jugados=(cfgDe(p).movilLog||[]).filter(x=>semanaDeGasto(x.f)===k).reduce((a,x)=>a+(+x.min||0),0);
  return {est, ganados, jugados, saldo:Math.max(0, Math.round((ganados-jugados)*10)/10), max:+cfg.movilMax||0, cada:cadaK(cfg.movilCada)};
}
function apuntarMovil(p, min, cuando=new Date()){ const c=cfgDe(p); c.movilLog=(c.movilLog||[]).concat([{f:cuando.toISOString(), min:Math.round(min*10)/10}]).slice(-500); guardarAj(); }
const movilActivo = () => (+premiosCfg().movilMax||0) > 0;

/* ---------- tarjeta de Inicio: estrellas, muñeco, juego y sobre de hoy ---------- */
function estrellasHTML(){
  const p=perfil(); if(p.prueba) return '';
  const cfg=premiosCfg(), est=estrellasDe(p), kc=cadaK(cfg.estCriatura), kj=cadaK(cfg.estJuego);
  const fc=kc-(est%kc), fj=juegosAbiertos(p)>=(typeof JUEGOS!=='undefined'?JUEGOS.length:0) ? null : kj-(est%kj);
  const sd=sobreDelDia(p), seq=secuenciaMunecos(p), sig=seq[munecosHasta(p)] ? criaturaForma(seq[munecosHasta(p)]) : null;
  const sigTxt = !sig ? '¡Los tienes todos!' : sig.forma>1 ? '¡Toca una evolución!' : 'Un muñeco nuevo';
  const barra=(v,k,col)=>`<span class="barra-t"><i style="width:${Math.round(100*v/k)}%;background:${col}"></i></span>`;
  const ok=b=>b?'✅':'⬜';
  const sobre = sd.activo ? `<div class="premio sobre-dia${sd.sorpresa?' sorpresa':''}${sd.ganado?' gana':''}"><span class="emo-g">${sd.sorpresa?'🎁':'🎴'}</span><div class="tx"><b>${sd.ganado?'¡Sobre de hoy conseguido!':sd.sorpresa?'¡Hoy es día sorpresa!':'Sobre de cartas de hoy'}</b>
      <span class="nota">${sd.ganado?'Pídeselo a papá o a mamá.':`${ok(sd.dia)} La historia de hoy · ${ok(sd.extras>=sd.meta)} ${Math.min(sd.extras,sd.meta)} de ${sd.meta} lecturas extra`}</span>${sd.ganado?'':barra(Math.min(sd.meta+1,(sd.dia?1:0)+Math.min(sd.extras,sd.meta)), sd.meta+1, '#E11D48')}</div></div>` : '';
  return `<div class="card premios estrellas-card"><div class="estrellas-cab"><span class="est-n">⭐ ${est}</span><span class="nota">estrellas desde el 24 de octubre</span>${typeof rachaHTML==='function'?rachaHTML():''}</div>
    <div class="premio" data-ir="criaturas"><span class="emo-g">🐾</span><div class="tx"><b>Próximo muñeco · ${esc(sigTxt)}</b><span class="nota">${fc===1?'¡Te falta 1 ⭐!':'Te faltan '+fc+' ⭐'}</span>${barra(kc-fc,kc,'#8B5CF6')}</div></div>
    <div class="premio" data-ir="juegos"><span class="emo-g">🎮</span><div class="tx"><b>${fj==null?'¡Tienes todos los juegos!':'Próximo juego'}</b><span class="nota">${fj==null?'Juega un ratito cuando acabes.':fj===1?'¡Te falta 1 ⭐!':'Te faltan '+fj+' ⭐'}</span>${fj==null?'':barra(kj-fj,kj,'#F5A300')}</div></div>
    ${sobre}</div>`;
}
/* aviso por la mañana del día sorpresa (una vez al día) */
function avisarSorpresa(){
  const p=perfil(); const sd=sobreDelDia(p); if(!sd.activo || !sd.sorpresa || sd.ganado) return;
  const c=cfgDe(p), hoy=claveDia(new Date()); if(c.sorpresaAvisada===hoy) return; c.sorpresaAvisada=hoy; guardarAj();
  setTimeout(()=>{ if(actual!=='inicio') return; decir(`¡${nombre()}, hoy es día sorpresa! Si lees la historia de hoy y ${sd.meta} lecturas extra, ganas un sobre de cartas.`); }, 1600);
}

/* ---------- álbum de cromos de las lecturas extra (cada extra nueva = un cromo) ---------- */
definir('cromosextra', {nav:'cromos', pintar(){
  const p=perfil(), h=extrasDe(p), lista=COMPS();
  const n=lista.filter(x=>h[x.id]).length;
  $('#s-cromosextra').innerHTML = `${albumTabsHTML('cromosextra')}
  <div class="album-cab"><div><h1 class="tit">Cromos de lecturas extra</h1><p class="sub">Cada lectura extra nueva te da su cromo (y ⭐⭐).</p></div>
    <div class="contador">📚<div><b>${n} de ${lista.length}</b><br><span>${n>=lista.length?'¡Álbum completo!':'te faltan '+(lista.length-n)}</span></div></div></div>
  <div class="cromos">${lista.map((x,i)=>h[x.id]
    ? `<button type="button" class="cromo" data-x="${esc(x.id)}"><span class="ft">${imgHTML(x.portada)}</span><b>${esc(conNombre(x.titulo))}</b><span class="nota">Nivel ${x.nivel}${h[x.id]>1?' · ×'+h[x.id]:''}</span></button>`
    : `<div class="cromo vacio-c"><span class="ft"><span class="num-c">${i+1}</span></span><b class="nota">¿?</b></div>`).join('')}</div>`;
  activarAlbumTabs();
  $$('#s-cromosextra [data-x]').forEach(b=>b.onclick=()=>{ const x=historia(b.dataset.x); if(x) empezarHistoria(x); });
}});

/* ---------- caja del móvil en la pantalla de la tele ---------- */
let movilReloj=null;
function movilCajaHTML(p, finde){
  const m=movilDe(p), sig=finde?movilDe(p, sabadoDe()):null;
  return `<div class="card bloque movil-caja"><h3>📱 Juegos del móvil</h3>
    <p class="nota">Cada ${m.cada} ⭐ de la semana (de sábado a viernes) es 1 minuto de juegos del móvil para el sábado y el domingo. Como mucho ${minTxt(m.max)}.</p>
    <div class="peli-barra" role="img" aria-label="${m.ganados} de ${m.max} minutos"><span style="width:${Math.min(100,Math.round(m.ganados*100/Math.max(1,m.max)))}%;background:#0EA5B7"></span><b>${minTxt(m.ganados)} de ${minTxt(m.max)}</b></div>
    ${finde ? (m.saldo>0 ? `<div class="tele-reloj movil-reloj" id="movilReloj">${relojTele(m.saldo*60)}</div><div class="botones"><button class="btn btn-p" type="button" id="movilBtn">▶ Empezar a jugar</button></div>`
                         : `<p class="sub">${m.ganados?'¡Ya has jugado todos tus minutos de móvil!':'Esta vez no hay minutos de móvil.'}</p>`)
            : `<p class="sub">Llevas ${m.est} ⭐ esta semana: ${minTxt(m.ganados)} de móvil para el fin de semana.${m.ganados<m.max?` Con ${m.cada*(Math.floor(m.ganados)+1)-m.est} ⭐ más, otro minuto.`:''}</p>`}
    ${finde && sig && sig.ganados>0?`<p class="nota">Para el próximo fin de semana ya llevas ${minTxt(sig.ganados)}.</p>`:''}</div>`;
}
function activarMovilCaja(p){
  const b=$('#movilBtn'); if(!b) return; const m=movilDe(p); let corriendo=false, ini=0; const total=m.saldo*60;
  const parar=()=>{ if(!corriendo) return; corriendo=false; clearInterval(movilReloj); movilReloj=null; const usado=Math.min(total,(Date.now()-ini)/1000)/60; if(usado>=.1) apuntarMovil(p, usado, new Date(ini)); };
  const pinta=()=>{ const r=Math.max(0,total-(Date.now()-ini)/1000); const e=$('#movilReloj'); if(e) e.textContent=relojTele(r);
    if(r<=0){ parar(); sonido('cromo'); decir(`¡Se acabó el móvil, ${nombre()}!`); ir('tele'); } };
  b.onclick=()=>{ if(!corriendo){ corriendo=true; ini=Date.now(); b.textContent='⏸ Parar'; movilReloj=setInterval(pinta,1000); decir('¡A jugar!'); } else { parar(); ir('tele'); } };
  const salir=PANT.tele.salir; PANT.tele.salir=function(){ parar(); PANT.tele.salir=salir; if(salir) salir.apply(this, arguments); };
}

/* ---------- motivación: esta semana frente a la pasada, récord y podio de semanas (24/10/2026) ---------- */
function semanasEstrellas(p=perfil()){
  const ev=estrellasEventos(p); if(!ev.length) return [];
  const hoySab=sabadoDe(hoyTele()); let d=sabadoDe(new Date(ev[0].f)); const out=[];
  for(; +d<=+hoySab; d=diasDespues(d,7)){ const h=diasDespues(d,7); out.push({desde:new Date(d), est:ev.filter(e=>{ const t=+new Date(e.f); return t>=+d && t<+h; }).reduce((a,e)=>a+e.n,0), actual:+d===+hoySab}); }
  return out;
}
const ORD = n => n+'.º';
function puestoDe(sem, w){ return 1 + sem.filter(x=>x!==w && x.est>w.est).length; }
function motivacionDe(p=perfil()){
  const sem=semanasEstrellas(p); const cur=sem.find(w=>w.actual); if(!cur) return null;
  const ahora=hoyTele(), pasada=diasDespues(cur.desde,-7);
  const pasadaHastaAhora = estrellasEntre(p, pasada, new Date(+pasada + (+ahora - +cur.desde)));
  const cerradas=sem.filter(w=>!w.actual); const rec=cerradas.reduce((m,w)=>!m||w.est>m.est?w:m, null);
  const ult=sem.slice(-3).reverse();   // esta, hace 1, hace 2
  return {cur, dif: cur.est - pasadaHastaAhora, hayPasada: cerradas.some(w=>+w.desde===+pasada), rec, falta: rec ? rec.est - cur.est : null,
    puestos: ult.map((w,i)=>({w, i, puesto:puestoDe(sem, w)})), total:sem.length, sem};
}
function motivacionHTML(){
  const p=perfil(); if(p.prueba) return ''; const m=motivacionDe(p); if(!m || m.total<1) return '';
  const fc=d=>d.toLocaleDateString('es-ES',{day:'numeric', month:'short'});
  const comp = !m.hayPasada ? 'Es tu primera semana con estrellas.' : m.dif>0 ? `Vas <b>${m.dif} ⭐ por delante</b> de la semana pasada a estas horas. ¡Sigue así!` : m.dif<0 ? `Vas <b>${-m.dif} ⭐ por detrás</b> de la semana pasada a estas horas. ¡Tú puedes!` : 'Vas igual que la semana pasada a estas horas.';
  const recTxt = !m.rec ? '' : m.falta<0 ? `🏅 <b>¡Nuevo récord!</b> Superas tu mejor semana (${m.rec.est} ⭐).` : m.falta===0 ? `🏅 ¡Igualas tu récord de ${m.rec.est} ⭐! Una estrella más y lo batirás.` : m.falta<=5 ? `🏅 ¡Estás a <b>${m.falta} ${m.falta===1?'estrella':'estrellas'}</b> de tu récord (${m.rec.est} ⭐)!` : `🏅 Tu récord: ${m.rec.est} ⭐ (semana del ${fc(m.rec.desde)}). Te faltan ${m.falta}.`;
  const nomb=i=>i===0?'Esta semana':i===1?'La pasada':'Hace 2 semanas';
  const top=m.sem.filter(w=>w.est>0).sort((a,b)=>b.est-a.est || b.desde-a.desde).slice(0,3);
  const escalon=(w,pos)=>w?`<div class="esc e${pos}${w.actual?' yo':''}"><span class="med">${['🥇','🥈','🥉'][pos-1]}</span><b>${w.est} ⭐</b><span class="nota">${w.actual?'¡esta semana!':fc(w.desde)}</span><i></i></div>`:'<div class="esc vacio"></div>';
  return `<div class="card motivacion"><div class="mot-tx"><b>🏆 Tu semana: ${m.cur.est} ⭐</b><span class="nota">${comp}</span>${recTxt?`<span class="nota">${recTxt}</span>`:''}
      <span class="puestos">${m.puestos.map(x=>`<span class="pst${x.i===0?' yo':''}">${nomb(x.i)}: <b>${x.puesto<=3?['🥇','🥈','🥉'][x.puesto-1]:''} ${ORD(x.puesto)}</b>${x.i===0?' <small>(de momento)</small>':''}</span>`).join('')}</span></div>
    ${m.total>=2?`<div class="podio">${escalon(top[1],2)}${escalon(top[0],1)}${escalon(top[2],3)}</div>`:''}</div>`;
}
/* celebrar un récord nuevo (una vez por semana) */
function avisarRecord(){
  const p=perfil(); if(p.prueba) return; const m=motivacionDe(p); if(!m || !m.rec || m.falta>=0) return;
  const c=cfgDe(p), k=claveDia(m.cur.desde); if(c.recordAvisado===k) return; c.recordAvisado=k; guardarAj();
  (typeof cuandoLibre==='function' ? cuandoLibre : (fn,ms)=>setTimeout(()=>{ if(actual==='inicio') fn(); },ms))(()=>{ const d=dialogo({titulo:'🏅 ¡Nuevo récord!', html:`<p class="sub">Esta semana llevas <b>${m.cur.est} ⭐</b>: ¡más que en ninguna otra semana!</p>`, cls:'dlg-premio', botones:[{t:'¡Bien!', cls:'btn-p'}]}); sonido('cromo'); confeti(d.el.querySelector('.dialogo')||document.body); decir(`¡Nuevo récord, ${nombre()}! Esta semana llevas ${m.cur.est} estrellas.`); }, 2200);
}
