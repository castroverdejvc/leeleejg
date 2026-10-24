/* LeeLEEJG · ranking de semanas y estadísticas de todo (Familia › Evolución › «Ranking y estadísticas»), 23/10/2026.
   Pedido por la familia: «un ranking por semanas de horas que leyó y horas que pudo ver tele; también por los regalos
   (cuántos muñecos, cuántos cromos…). Quiero estadísticas de todo y que me haga las valoraciones más importantes».
   Las semanas van de sábado a viernes, como la tele. Todo se calcula de lo que ya está guardado (sesiones y registros
   de cada niño), así que vale también para las semanas pasadas. */
'use strict';
let ordenRanking='lee';
const SEG_MAX_LECTURA = 30*60;   // una lectura que se quedó abierta no cuenta más de 30 minutos

/* actividades (para criaturas, juegos y sobres) hechas antes de una fecha */
function actividadesAntes(p, d){
  const c=cfgDe(p), t=+d;
  return sesDe(p.id).filter(s=>!s.incompleta && !esComp(s.historiaId) && +new Date(s.fecha)<t).length
    + ['dictadoLog','repasoLog','letrasLog'].reduce((a,k)=>a+(c[k]||[]).filter(x=>+new Date(x.f)<t).length, 0);
}
const pctDe = (bien, total) => total ? Math.round(100*bien/total) : null;
const enRango = (f, desde, hasta) => { const t=+new Date(f); return t>=+desde && t<+hasta; };

/* todo lo de una semana (de sábado a viernes) */
function statsSemana(p, desde, primeraLectura){
  const hasta=diasDespues(desde,7), k=claveDia(desde), c=cfgDe(p), P=premiosCfg();
  const todas=sesDe(p.id).filter(s=>s.fecha);
  const ses=todas.filter(s=>enRango(s.fecha, desde, hasta)), hechas=ses.filter(s=>!s.incompleta);
  const seg=ses.reduce((a,s)=>a+Math.min(SEG_MAX_LECTURA, +s.segundos||0),0);
  const dias=new Set(hechas.map(s=>claveDia(s.fecha))).size;
  // preguntas
  const qs=hechas.flatMap(s=>s.preguntas||[]); const fallos=hechas.reduce((a,s)=>a+fallosDe(s),0);
  const primera=qs.filter(q=>q.ok && (+q.intentos||1)===1).length;
  const comp=media(hechas.map(pctComp)), ppm=media(hechas.map(s=>s.ppm||0).filter(Boolean));
  const calc=hechas.filter(s=>s.calculo), calcOk=calc.filter(s=>s.calculo.ok).length;
  const ayuda={}; hechas.forEach(s=>(s.palabras||[]).forEach(w=>{ if(w.e==='ayuda'||w.e==='practica') ayuda[w.p]=(ayuda[w.p]||0)+1; }));
  // tele
  const det=teleDetalle(p, desde, hasta), gan=sumaDet(det, desde);
  const log=(c.teleLog||[]).filter(x=>semanaDeGasto(x.f)===k);
  const regalo=log.filter(x=>x.min<0).reduce((a,x)=>a-x.min,0), visto=log.filter(x=>x.min>0).reduce((a,x)=>a+x.min,0);
  const pe=peliculaDe(p, desde), ps=peliSabadoDe(p, desde);
  // premios: cromos nuevos (primera vez que lee una historia del calendario o de los temas), criaturas, juegos y sobres
  const vistas=new Set(); let cromos=0;
  todas.filter(s=>!s.incompleta).sort((a,b)=>a.fecha<b.fecha?-1:1).forEach(s=>{ if(vistas.has(s.historiaId)) return; vistas.add(s.historiaId);
    if(!esComp(s.historiaId) && enRango(s.fecha, desde, hasta)) cromos++; });
  const cambios=(c.cambios||[]).filter(x=>x.f && enRango(x.f, desde, hasta)).length;
  // 24/10/2026: muñecos, juegos y sobres con las estrellas (lo de antes, con las reglas de antes)
  const criaturas=munecosHasta(p, hasta)-munecosHasta(p, desde);
  const juegos=typeof JUEGOS!=='undefined' ? juegosHasta(p, hasta)-juegosHasta(p, desde) : 0;
  const sobres=sobresHasta(p, hasta)-sobresHasta(p, desde);
  const estrellas=estrellasEntre(p, desde, hasta), movil=movilDe(p, desde);
  const sobresDados=(c.sobresLog||[]).filter(x=>enRango(x.f, desde, hasta)).length;
  // fichas, trabajos, juegos, adivinanzas
  const reg=k2=>(c[k2]||[]).filter(x=>enRango(x.f, desde, hasta));
  const ficha=(xs)=>({n:xs.length, pct:pctDe(xs.reduce((a,x)=>a+(+x.bien||0),0), xs.reduce((a,x)=>a+(+x.n||0),0))});
  const rep=ficha(reg('repasoLog')), dic=ficha(reg('dictadoLog')), let_=ficha(reg('letrasLog')), edu=ficha(reg('eduLog'));
  const tr=reg('trabajosLog'), trA=tr.reduce((a,x)=>a+(+x.a||0),0), trE=tr.reduce((a,x)=>a+(+x.e||0),0);
  const jl=reg('juegoLog'); let segJuego=0; Object.entries(c.juegoDias||{}).forEach(([d,s])=>{ const f=new Date(d+'T12:00'); if(enRango(f, desde, hasta)) segJuego+=+s||0; });
  const adi=reg('adivLog');
  return {desde, hasta, k, enCurso: +desde===+sabadoDe(hoyTele()), antes: primeraLectura && +hasta<=+primeraLectura,
    seg, dias, lecturas:hechas.length, delDia:det.propuesta.n, extra:det.extra.n, relee:det.relee.n, aMedias:ses.length-hechas.length,
    preguntas:qs.length, primera, fallos, comp, ppm, calc:calc.length, calcOk, ayuda,
    gan, regalo, puede:gan+regalo, visto, peliV:pe.completa, peliS:ps.completa, extrasSabado:ps.total,
    cromos, cambios, criaturas, juegos, sobres, sobresDados, estrellas, movil:movil.ganados, movilJugado:movil.jugados,
    repaso:rep, dictado:dic, letras:let_, edu, trabajos:tr.length, trPct:pctDe(trA, trA+trE), partidas:jl.length, minJuego:segJuego/60,
    adivinanzas:adi.length, adivPrimera:adi.filter(x=>x.intentos===1).length};
}
function semanasDe(p=perfil()){
  const ses=sesDe(p.id).filter(s=>s.fecha), c=cfgDe(p);
  const fechas=[...ses.map(s=>+new Date(s.fecha)), ...['teleLog','repasoLog','dictadoLog','letrasLog','trabajosLog'].flatMap(k=>(c[k]||[]).map(x=>+new Date(x.f)))].filter(x=>!isNaN(x));
  if(!fechas.length) return [];
  const hoy=sabadoDe(hoyTele()); const primera=sabadoDe(new Date(Math.min(...fechas, +hoy)));
  const out=[]; for(let d=new Date(primera); d<=hoy; d=diasDespues(d,7)) out.push(statsSemana(p, new Date(d)));
  return out;
}
const conAlgo = w => w.seg>0 || w.lecturas>0 || w.puede>0 || w.visto>0 || w.repaso.n || w.dictado.n || w.letras.n || w.trabajos || (w.edu && w.edu.n);
const tiempoTxt = seg => seg<60 ? (seg>0?`${Math.round(seg)} segundos`:'—') : minTxt(Math.round(seg/60));
const premiosN = w => w.cromos + w.criaturas + w.juegos + w.sobres;
const fechaSem = w => { const fc=d=>d.toLocaleDateString('es-ES',{day:'numeric', month:'short'}); return `${fc(w.desde)} – ${fc(diasDespues(w.desde,6))}`; };

/* ---------- valoraciones: lo más importante, en frases ---------- */
function valoracionesDe(p, sem){
  const V=[]; const cerr=sem.filter(w=>!w.enCurso && conAlgo(w)); const cur=sem.find(w=>w.enCurso);
  const prom=(xs,f)=>media(xs.map(f)); const ult=cerr.slice(-2), ant=cerr.slice(-6,-2);
  const tend=(f, umbral=0.15)=>{ if(ult.length<2 || ant.length<2) return 0; const a=prom(ant,f), b=prom(ult,f); if(a==null||b==null||!a) return 0; const r=(b-a)/a; return r>umbral?1:r<-umbral?-1:0; };
  const nombre=esc(p.nombre);
  if(!cerr.length){ V.push(['info', `Todavía no hay ninguna semana terminada. ${cur&&cur.lecturas?`Esta semana lleva ${cur.lecturas} ${cur.lecturas===1?'lectura':'lecturas'} y ${tiempoTxt(cur.seg)} leyendo.`:''}`]); return V; }
  // 1 · tiempo leyendo y su tendencia
  const mejor=cerr.slice().sort((a,b)=>b.seg-a.seg)[0];
  const t=tend(w=>w.seg);
  V.push([t<0?'ojo':'bien', `Su mejor semana leyendo fue la del ${fechaSem(mejor)}: <b>${tiempoTxt(mejor.seg)}</b> y ${mejor.lecturas} lecturas. ${t>0?'Las dos últimas semanas lee <b>más</b> que antes. 📈':t<0?'Las dos últimas semanas lee <b>menos</b> que antes. 📉':cerr.length>=4?'Últimamente lee más o menos lo mismo.':''}`]);
  // 2 · constancia y peli del viernes
  const diasM=prom(cerr.slice(-4), w=>w.dias); const pelisV=cerr.filter(w=>w.peliV).length;
  V.push([diasM>=5?'bien':diasM>=3?'info':'ojo', `Lee de media <b>${Math.round(diasM*10)/10} días de 7</b> (últimas ${Math.min(4,cerr.length)} semanas). Peli del viernes conseguida <b>${pelisV} de ${cerr.length}</b> ${cerr.length===1?'semana':'semanas'}.${diasM<5?' Lo que más ayuda es leer un poco todos los días.':''}`]);
  // 3 · comprensión
  const compU=prom(cerr.slice(-3), w=>w.comp), tc=tend(w=>w.comp, 0.08);
  if(compU!=null) V.push([compU>=80?'bien':compU>=60?'info':'ojo', `Comprensión: acierta el <b>${Math.round(compU)} %</b> de las preguntas (últimas semanas).${tc>0?' Va mejorando. 📈':tc<0?' Ha bajado: puede que lea deprisa para acabar o que las historias le cuesten más. 📉':''}${compU<60?' Conviene leer la historia con él y preguntarle de palabra.':''}`]);
  // 4 · fallos (cada uno resta 30 s de tele)
  const fl=cerr.slice(-3), fPorLect=media(fl.map(w=>w.lecturas?w.fallos/w.lecturas:null));
  if(fPorLect!=null) V.push([fPorLect<=1?'bien':fPorLect<=2?'info':'ojo', `Falla de media <b>${Math.round(fPorLect*10)/10}</b> ${Math.round(fPorLect*10)/10===1?'vez':'veces'} por lectura.${restaFallo()>0?` Con la resta de ${restaFallo()===0.5?'30 segundos':minTxt(restaFallo())}, son unos ${minTxt(fPorLect*restaFallo()*prom(fl,w=>w.lecturas))} de tele menos a la semana.`:''}`]);
  // 5 · fluidez
  const ppmU=prom(cerr.slice(-3), w=>w.ppm), tp=tend(w=>w.ppm, 0.1);
  if(ppmU!=null) V.push([tp<0?'ojo':tp>0?'bien':'info', `Lee unas <b>${Math.round(ppmU)} palabras por minuto</b>.${tp>0?' Cada vez más rápido. 📈':tp<0?' Algo más despacio que antes (puede ser porque las historias son más largas o difíciles).':''}`]);
  // 6 · lecturas extra y peli del sábado
  const exM=prom(cerr.slice(-4), w=>w.extra); const pelisS=cerr.filter(w=>w.peliS).length; const meta=cur?cur.extrasSabado:(+premiosCfg().peliExtras||7);
  V.push([pelisS?'bien':'info', `Hace de media <b>${Math.round(exM*10)/10} lecturas extra</b> a la semana (para la peli del sábado hacen falta ${meta}). Peli del sábado: <b>${pelisS} de ${cerr.length}</b>.${cur&&!cur.peliS&&cur.extra?` Esta semana lleva ${cur.extra} de ${meta}.`:''}`]);
  // 7 · tele
  const totP=cerr.reduce((a,w)=>a+w.puede,0), totV=cerr.reduce((a,w)=>a+w.visto,0);
  V.push(['info', `Tele: en total pudo ver <b>${minTxt(totP)}</b>${totV?` y vio ${minTxt(totV)}`:''} (de media ${minTxt(totP/cerr.length)} por fin de semana).${!totV&&totP?' Lo que ve no se está apuntando con el reloj de la tele: si lo usáis, sabréis cuánto ve de verdad.':''}`]);
  // 8 · juegos frente a lectura
  const ju=cerr.slice(-2).reduce((a,w)=>a+w.minJuego,0), le=cerr.slice(-2).reduce((a,w)=>a+w.seg/60,0);
  if(ju>0) V.push([ju>le*1.5?'ojo':'info', `Juegos: ${minTxt(ju)} en las dos últimas semanas, frente a ${minTxt(le)} leyendo.${ju>le*1.5?' Juega bastante más de lo que lee.':''}`]);
  // 9 · fichas
  const fx=cerr.slice(-4); const fN=fx.reduce((a,w)=>a+w.repaso.n+w.dictado.n+w.letras.n,0);
  const fp=t2=>media(fx.map(w=>w[t2].pct)); const tipos=[['repaso','repaso de fichas'],['dictado','dictado'],['letras','«As letras»']].map(([k2,n])=>[n, fp(k2)]).filter(x=>x[1]!=null);
  if(fN) V.push([tipos.some(x=>x[1]<60)?'ojo':'bien', `Fichas: ${fN} en las últimas semanas, con estos aciertos: ${tipos.map(([n,v])=>`${n} <b>${Math.round(v)} %</b>`).join(' · ')}.${tipos.filter(x=>x[1]<60).map(([n])=>` Le cuesta el ${n}.`).join('')}`]);
  else V.push(['info', 'Últimamente no ha hecho fichas (repaso, dictado o «As letras»).']);
  // 10 · palabras que más le cuestan (últimas 4 semanas)
  const pal={}; cerr.slice(-4).concat(cur?[cur]:[]).forEach(w=>Object.entries(w.ayuda).forEach(([k2,n])=>{ pal[k2]=(pal[k2]||0)+n; }));
  const top=Object.entries(pal).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if(top.length) V.push(['info', `Palabras en las que más pide ayuda: ${top.map(([w,n])=>`<b>${esc(w)}</b>${n>1?' ×'+n:''}`).join(', ')}.`]);
  // 11 · atrasadas
  const at=typeof atrasadasDe==='function'?atrasadasDe(p).length:0;
  if(at) V.push(['ojo', `Tiene <b>${at} ${at===1?'historia atrasada':'historias atrasadas'}</b> del calendario.`]);
  // 12 · premios
  const tot=k2=>sem.reduce((a,w)=>a+w[k2],0); const so=typeof sobresDe==='function'?sobresDe(p):{pend:0};
  V.push(['bien', `Premios desde el principio: ${tot('cromos')} ${tot('cromos')===1?'cromo':'cromos'}, ${tot('criaturas')} ${tot('criaturas')===1?'criatura':'criaturas'}, ${tot('juegos')} ${tot('juegos')===1?'juego nuevo':'juegos nuevos'} y ${tot('sobres')} ${tot('sobres')===1?'sobre':'sobres'} de cartas.${so.pend?` <b>Tiene ${so.pend===1?'1 sobre':so.pend+' sobres'} por dar.</b>`:''}`]);
  return V;
}

/* ---------- la pestaña ---------- */
const METRICAS = {
  lee:   {t:'📖 Leyendo',     v:w=>w.seg},
  tele:  {t:'📺 Tele',         v:w=>w.puede},
  premios:{t:'🎁 Premios',     v:w=>premiosN(w)},
  comp:  {t:'🧠 Comprensión',  v:w=>w.comp==null?-1:w.comp},
  dias:  {t:'📅 Días leyendo', v:w=>w.dias}
};
function rankingSemanasHTML(p){
  const todas=semanasDe(p), sem=todas.filter(conAlgo);
  if(!sem.length) return `<div class="card bloque"><h3>🏆 Ranking de semanas</h3><p class="vacio">Todavía no hay semanas con lecturas.</p></div>`;
  const M=METRICAS[ordenRanking]||METRICAS.lee;
  const orden=sem.slice().sort((a,b)=>M.v(b)-M.v(a) || b.desde-a.desde);
  const maxSeg=Math.max(1,...sem.map(w=>w.seg)), maxTele=Math.max(1,...sem.map(w=>w.puede));
  const medalla=i=>['🥇','🥈','🥉'][i]||`${i+1}.`;
  const barra=(v,m,col)=>`<span class="rk-barra"><i style="width:${Math.max(2,Math.round(100*v/m))}%;background:${col}"></i></span>`;
  const sum=k=>sem.reduce((a,w)=>a+w[k],0);
  const ico={bien:'✅', ojo:'⚠️', info:'💡'};
  const V=valoracionesDe(p, todas);
  const cifra=(n,t,col)=>`<div class="card cifra-s"><b style="color:${col}">${n}</b><span class="nota">${t}</span></div>`;
  const compT=media(sem.map(w=>w.comp)), ppmT=media(sem.map(w=>w.ppm));
  const premiosTxt=w=>[w.cromos?`🃏 ${w.cromos}`:'', w.criaturas?`🐾 ${w.criaturas}`:'', w.juegos?`🎮 ${w.juegos}`:'', w.sobres?`🎴 ${w.sobres}`:''].filter(Boolean).join(' ')||'—';
  return `<div class="card bloque valoracion"><h3 style="margin-bottom:8px">📝 Valoración de ${esc(p.nombre)}</h3><ul class="val-lista">${V.map(([tipo,txt])=>`<li class="val-${tipo}"><span>${ico[tipo]}</span><span>${txt}</span></li>`).join('')}</ul></div>
  <div class="cifras-s cifras-est" style="margin:16px 0">${cifra(tiempoTxt(sum('seg')),'leyendo en total','var(--primary)')}${cifra(sum('lecturas'),'lecturas terminadas','var(--green)')}${cifra(compT==null?'–':Math.round(compT)+' %','comprensión media','#8B5CF6')}${cifra(ppmT==null?'–':Math.round(ppmT),'palabras por minuto','#F5A300')}${cifra(minTxt(sum('puede')),'de tele que pudo ver','#2F6FD6')}${cifra(sum('cromos'),'cromos','#E11D48')}${cifra(sum('criaturas'),'criaturas','#0EA5B7')}${cifra(sum('peliV')+sum('peliS'),'pelis conseguidas','#F59E0B')}</div>
  <div class="card bloque ranking-sem"><div class="pag-cab" style="margin:0 0 6px"><h3>🏆 Ranking de semanas</h3>
      <div class="botones rk-orden">${Object.entries(METRICAS).map(([k2,m])=>`<button type="button" class="btn btn-mini${ordenRanking===k2?' btn-p':''}" data-rk="${k2}">${m.t}</button>`).join('')}</div></div>
    <p class="nota" style="margin-bottom:10px">Semanas de sábado a viernes, como la tele. Toca una semana para ver todo lo que hizo. «Tele» es lo que pudo ver (lo ganado más lo regalado); premios: 🃏 cromos nuevos · 🐾 criaturas · 🎮 juegos nuevos · 🎴 sobres de cartas.</p>
    <div class="tabla-w"><table class="rk-tabla"><thead><tr><th></th><th>Semana</th><th>Leyendo</th><th>Lecturas</th><th>Comprensión</th><th>Tele</th><th>Premios</th><th>Pelis</th></tr></thead><tbody>
    ${orden.map((w,i)=>`<tr class="${w.enCurso?'en-curso':''}" data-sem="${w.k}" tabindex="0"><td class="rk-pos">${medalla(i)}</td><td>${fechaSem(w)}${w.enCurso?' <span class="pill">en curso</span>':''}</td>
      <td data-l="Leyendo"><b>${tiempoTxt(w.seg)}</b>${barra(w.seg,maxSeg,'#5CCB8F')}</td><td data-l="Lecturas">${w.lecturas}${w.extra?` <small>(${w.extra} extra)</small>`:''}</td>
      <td data-l="Comprensión">${w.comp==null?'—':Math.round(w.comp)+' %'}</td>
      <td data-l="Tele"><b>${w.puede>0?minTxt(w.puede):'—'}</b>${w.regalo>0?` <small>(${minTxt(w.regalo)} regalados)</small>`:''}${barra(w.puede,maxTele,'#2F6FD6')}</td>
      <td data-l="Premios">${premiosTxt(w)}</td><td data-l="Pelis">${w.peliV?'🎬':''}${w.peliS?'🍿':''}${!w.peliV&&!w.peliS?'—':''}</td></tr>`).join('')}
    <tr class="tot"><td></td><td>Total (${sem.length} ${sem.length===1?'semana':'semanas'})</td><td data-l="Leyendo">${tiempoTxt(sum('seg'))}</td><td data-l="Lecturas">${sum('lecturas')}</td><td data-l="Comprensión">${compT==null?'—':Math.round(compT)+' %'}</td><td data-l="Tele">${minTxt(sum('puede'))}</td><td data-l="Premios">${premiosTxt({cromos:sum('cromos'),criaturas:sum('criaturas'),juegos:sum('juegos'),sobres:sum('sobres')})}</td><td></td></tr>
    </tbody></table></div><p class="nota" style="margin-top:8px">🎬 peli del viernes · 🍿 peli del sábado</p></div>`;
}
/* el detalle de una semana: todo lo que hizo */
function detalleSemanaHTML(p, w){
  const fila=(t,v)=>`<tr><td>${t}</td><td><b>${v}</b></td></tr>`;
  const pc=v=>v==null?'—':v+' %';
  const ficha=(f)=>f.n?`${f.n} · ${pc(f.pct)}`:'—';
  const ay=Object.entries(w.ayuda).sort((a,b)=>b[1]-a[1]).slice(0,8);
  return `<div class="det-sem"><div class="graf-2">
    <div><h3>📖 Lectura</h3><table class="tele-tabla">${fila('Tiempo leyendo', tiempoTxt(w.seg))}${fila('Días con lectura', w.dias+' de 7')}${fila('Lecturas terminadas', w.lecturas)}${fila('· del día', w.delDia)}${fila('· extra', w.extra)}${fila('· volver a leer', w.relee)}${w.aMedias?fila('Dejadas a medias', w.aMedias):''}${fila('Palabras por minuto', w.ppm==null?'—':Math.round(w.ppm))}</table>
      <h3>🧠 Preguntas</h3><table class="tele-tabla">${fila('Comprensión', w.comp==null?'—':Math.round(w.comp)+' %')}${fila('Bien a la primera', w.preguntas?`${w.primera} de ${w.preguntas}`:'—')}${fila('Fallos', w.fallos)}${fila('Cálculo bien', w.calc?`${w.calcOk} de ${w.calc}`:'—')}</table></div>
    <div><h3>📺 Tele</h3><table class="tele-tabla">${fila('Ganada', minTxt(w.gan))}${w.regalo?fila('Regalada', minTxt(w.regalo)):''}${fila('Pudo ver', minTxt(w.puede))}${fila('Vista (apuntada)', w.visto?minTxt(w.visto):'—')}${fila('Peli del viernes', w.peliV?'🎬 sí':'no')}${fila('Peli del sábado', w.peliS?'🍿 sí':`no (${w.extra} de ${w.extrasSabado})`)}</table>
      <h3>🎁 Premios</h3><table class="tele-tabla">${fila('Cromos nuevos', w.cromos)}${w.cambios?fila('Cambios de cromos', w.cambios):''}${fila('Criaturas', w.criaturas)}${fila('Juegos nuevos', w.juegos)}${fila('Sobres de cartas ganados', w.sobres)+fila('Sobres dados', w.sobresDados)}${fila('Estrellas', w.estrellas+' ⭐')}${w.movil?fila('Móvil ganado', minTxt(w.movil)):''}</table>
      <h3>✏️ Fichas y más</h3><table class="tele-tabla">${fila('Repaso de fichas', ficha(w.repaso))}${fila('Dictados', ficha(w.dictado))}${fila('«As letras»', ficha(w.letras))}${fila('Aprender jugando', ficha(w.edu))}${fila('Trabajos del cole', w.trabajos?`${w.trabajos} · ${pc(w.trPct)}`:'—')}${fila('Juegos', w.partidas||w.minJuego?`${w.partidas} partidas · ${minTxt(w.minJuego)}`:'—')}${fila('Adivinanzas', w.adivinanzas?`${w.adivinanzas} (${w.adivPrimera} a la primera)`:'—')}</table></div></div>
    ${ay.length?`<p class="nota">Pidió ayuda con: ${ay.map(([x,n])=>`<b>${esc(x)}</b>${n>1?' ×'+n:''}`).join(', ')}</p>`:''}</div>`;
}
function activarRanking(){
  $$('#s-evolucion [data-rk]').forEach(b=>b.onclick=()=>{ ordenRanking=b.dataset.rk; ir('evolucion','ranking'); });
  const p=lectorVisto();
  $$('#s-evolucion [data-sem]').forEach(tr=>{ const abre=()=>{ const w=semanasDe(p).find(x=>x.k===tr.dataset.sem); if(!w) return;
      dialogo({titulo:`Semana del ${fechaSem(w)}`, html:detalleSemanaHTML(p, w), cls:'dlg-ancho', botones:[{t:'Cerrar', cls:'btn'}]}); };
    tr.onclick=abre; tr.onkeydown=e=>{ if(e.key==='Enter') abre(); }; });
}
