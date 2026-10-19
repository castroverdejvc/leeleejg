/* LeeLEEJG · fiestas y estaciones (Samaín, Magosto, Navidad, Reyes, su cumpleaños, Entroido, Pascua, Día del Libro, Letras Galegas, San Xoán…)
   Cada fiesta tiene su semana cada año: salen sus historias en Inicio, los juegos se visten de fiesta y leyendo 3 se gana su criatura especial.
   Fechas: «fecha» (la semana de lunes a domingo en la que cae), «desde/hasta», «pascua» (días desde el domingo de Pascua, cambia cada año)
   o «cumple» (la semana del cumpleaños de cada lector). */
'use strict';
const TEMP_META = 3;
const listaTemporadas = () => CONT.temporadas || [];
const temporada = id => listaTemporadas().find(t=>t.id===id);
const nombreTemporada = id => (temporada(id)||{nombre:''}).nombre;
const historiasTemporada = id => CONT.historias.filter(h=>h.temporada===id);
let fechaPruebaTemporada = null;   // solo para las pruebas automáticas
const fechaTemp = () => fechaPruebaTemporada || new Date();
const cabTemporada = t => t.cab || `¡Es ${t.nombre}!`;
/* «de Samaín», «del Día del Libro», «de las Letras Galegas» */
const deTemporada = t => { const n=t.pronto||t.nombre; return /^el /.test(n) ? 'del '+n.slice(3) : 'de '+n; };

/* domingo de Pascua (calendario gregoriano) */
function pascuaDe(y){
  const a=y%19, b=Math.floor(y/100), c=y%100, d=Math.floor(b/4), e=b%4, f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3), h=(19*a+b-d-g+15)%30,
    i=Math.floor(c/4), k=c%4, l=(32+2*e+2*i-h-k)%7, m=Math.floor((a+11*h+22*l)/451), mes=Math.floor((h+l-7*m+114)/31), dia=((h+l-7*m+114)%31)+1;
  return new Date(y, mes-1, dia);
}
const diaMas = (f, n) => new Date(f.getFullYear(), f.getMonth(), f.getDate()+n);
const finDia = f => new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59);
const deMD = (anio, md) => { const [m,d]=md.split('-').map(Number); return new Date(anio, m-1, d); };   // 29-02 en un año no bisiesto pasa al 1 de marzo
/* la semana (de lunes a domingo) en la que cae una fecha */
const semanaDe = f => { const lun=diaMas(f, -((f.getDay()+6)%7)); return [lun, finDia(diaMas(lun,6))]; };
function perfilTemp(p){ if(p) return p; try{ return perfil(); }catch(e){ return null; } }

/* [inicio, fin] de la temporada del año «anio» (la que empieza ese año); null si ese lector no la tiene (cumpleaños sin fecha) */
function rangoTemporada(t, anio, p){
  if(t.anos && t.anos[anio]){ const [d,h]=t.anos[anio]; const ini=deMD(anio,d); let fin=finDia(deMD(anio,h)); if(fin<ini) fin=finDia(deMD(anio+1,h)); return [ini, fin]; }
  if(t.pascua){ const E=pascuaDe(anio); return [diaMas(E,t.pascua[0]), finDia(diaMas(E,t.pascua[1]))]; }
  if(t.cumple){ const pf=perfilTemp(p), nac=pf && /^\d{4}-\d\d-\d\d$/.test(pf.nac||'') ? pf.nac.slice(5) : null; return nac ? semanaDe(deMD(anio, nac)) : null; }
  if(t.fecha) return semanaDe(deMD(anio, t.fecha));
  const ini=deMD(anio, t.desde); let fin=finDia(deMD(anio, t.hasta));
  if(fin<ini) fin=finDia(deMD(anio+1, t.hasta));   // cruza de año (Navidad)
  return [ini, fin];
}
/* la vez de esta temporada que incluye la fecha f (o null) */
function vezTemporada(t, f=fechaTemp(), p){
  const a=f.getFullYear();
  for(const y of [a-1, a, a+1]){ const r=rangoTemporada(t,y,p); if(r && f>=r[0] && f<=r[1]) return r; }
  return null;
}
const enTemporada = (t, f=fechaTemp(), p) => !!vezTemporada(t, f, p);
const largoTemporada = (t, f, p) => { const r=vezTemporada(t,f,p); return r ? r[1]-r[0] : Infinity; };
/* las que están ahora, primero las más cortas (la semana del Libro antes que «Primavera») */
const temporadasActivas = (f, p) => listaTemporadas().filter(t=>enTemporada(t,f,p) && historiasTemporada(t.id).length).sort((a,b)=>largoTemporada(a,f,p)-largoTemporada(b,f,p));
const temporadaActiva = (id, p) => { const t=temporada(id); return !!t && enTemporada(t, fechaTemp(), p); };
/* la próxima que empieza en los siguientes 10 días */
function temporadaProxima(p){
  const hoy=fechaTemp(); let mejor=null;
  listaTemporadas().forEach(t=>{ if(enTemporada(t,hoy,p) || !historiasTemporada(t.id).length) return; [hoy.getFullYear(), hoy.getFullYear()+1].forEach(y=>{ const r=rangoTemporada(t,y,p); if(!r) return; const dias=Math.ceil((r[0]-hoy)/DIA_MS); if(dias>0 && dias<=10 && (!mejor || dias<mejor.dias)) mejor={t, dias}; }); });
  return mejor;
}
/* la fiesta de ahora para vestir los juegos (la más corta, que es la más «de ese día») */
const fiestaJuego = () => temporadasActivas().find(t=>t.juego && t.juego.cosas && t.juego.cosas.length>=6) || null;
const leidasTemporada = (id, p=perfil()) => { const l=leidasDe(p.id); return historiasTemporada(id).filter(h=>l[h.id]).length; };
const metaTemporada = id => Math.min(TEMP_META, historiasTemporada(id).length);
const temporadaGanada = (id, p=perfil()) => historiasTemporada(id).length>0 && leidasTemporada(id,p) >= metaTemporada(id);
const criaturaDeTemporada = id => (typeof CRIATURAS_ESPECIALES!=='undefined' ? CRIATURAS_ESPECIALES.find(c=>c.temporada===id) : null);

/* tarjeta de Inicio: las dos primeras grandes; si coinciden más fiestas, el resto en pequeño */
function temporadaHTML(){
  const act=temporadasActivas();
  if(!act.length){ const px=temporadaProxima(); return px ? `<div class="card temporada pronto" style="--tc:${px.t.color};--ts:${px.t.suave}"><span class="emo-g">${px.t.emo}</span><div class="tx"><b>${px.dias===1?'¡Mañana empieza la semana de':'¡En '+px.dias+' días llega'} ${esc(px.t.pronto||px.t.nombre)}!</b><span class="nota">${esc(px.t.frase)} Habrá historias especiales, juegos de fiesta y una criatura nueva.</span></div></div>` : ''; }
  const grande=t=>{ const n=leidasTemporada(t.id), meta=metaTemporada(t.id), ganada=n>=meta, c=criaturaDeTemporada(t.id);
    return `<div class="card temporada" style="--tc:${t.color};--ts:${t.suave}"><div class="guirnalda" aria-hidden="true">${(t.emo+' ').repeat(9)}</div>
      ${c?`<span class="cri-temp">${criaturaSVG(c,{silueta:!ganada})}</span>`:`<span class="emo-g">${t.emo}</span>`}
      <div class="tx"><b>${esc(cabTemporada(t))} ${t.emo}</b><span class="nota">${ganada?`¡Ya tienes a ${esc(c?c.nombre:'tu premio')}! Puedes leer las demás historias ${esc(deTemporada(t))}.`:`Lee ${meta} historias ${esc(deTemporada(t))} y gana una criatura especial${c?': '+esc(c.nombre):''}.`}</span>
        <span class="barra-t"><i style="width:${Math.round(100*Math.min(n,meta)/meta)}%;background:var(--tc)"></i></span><span class="nota">${Math.min(n,meta)} de ${meta}</span></div>
      <button class="btn btn-p" type="button" data-temp="${t.id}">Historias ${esc(deTemporada(t))} ${ic('flecha')}</button></div>`; };
  const peque=t=>`<button type="button" class="temp-mini" data-temp="${t.id}" style="--tc:${t.color};--ts:${t.suave}"><span>${t.emo}</span><b>${esc(t.nombre)}</b><span class="nota">${leidasTemporada(t.id)} de ${metaTemporada(t.id)}</span></button>`;
  return act.slice(0,2).map(grande).join('') + (act.length>2 ? `<div class="temp-minis"><span class="nota">También es…</span>${act.slice(2).map(peque).join('')}</div>` : '');
}
function activarTemporada(raiz){ $$('[data-temp]', raiz).forEach(b=>b.onclick=()=>ir('temporada', b.dataset.temp)); }

/* pantalla de la temporada */
let tempVista=null;
definir('temporada', {nav:'inicio', pintar(id){
  if(id) tempVista=id; const t=temporada(tempVista); if(!t){ ir('inicio'); return; }
  const hs=historiasTemporada(t.id), l=leidas(), activa=temporadaActiva(t.id), c=criaturaDeTemporada(t.id), n=leidasTemporada(t.id), meta=metaTemporada(t.id);
  const adiv = typeof adivinanzasDe==='function' ? adivinanzasDe(t.id) : [];
  $('#s-temporada').innerHTML = `<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
  <div class="card temporada cab" style="--tc:${t.color};--ts:${t.suave}"><div class="guirnalda" aria-hidden="true">${(t.emo+' ').repeat(12)}</div>
    ${c?`<span class="cri-temp">${criaturaSVG(c,{silueta:n<meta})}</span>`:''}<div class="tx"><h1 class="tit">${t.emo} ${esc(t.nombre)}</h1><p class="sub">${esc(t.frase)}</p>
    <span class="nota">${n>=meta?`¡Has ganado a ${esc(c?c.nombre:'tu premio')}!`:`Lee ${meta} y gana ${c?'a '+esc(c.nombre):'un premio'}: llevas ${n}.`}</span></div></div>
  ${activa?'':`<p class="nota" style="margin:10px 0">Estas historias solo se pueden leer en la semana ${esc(deTemporada(t))}.</p>`}
  <div class="historias">${hs.map(h=>{ const ok=disponible(h);
    return `<button type="button" class="hist${ok?'':' bloq'}" data-h="${h.id}"><span class="ft">${imgHTML(h.portada)}${l[h.id]?'<span class="ok">✓ Leída</span>':''}</span><span class="tx"><b>${esc(conNombre(h.titulo))}</b><span class="nota">${esc(conNombre(h.resumen))}</span></span></button>`; }).join('')}</div>
  ${activa && t.juego && typeof juegoFiestaHTML==='function' ? juegoFiestaHTML(t) : ''}
  ${adiv.length?`<div class="card bloque" style="margin-top:16px"><b>${t.emo} Adivinanzas ${esc(deTemporada(t))}</b><p class="nota">Escucha y toca la respuesta.</p><div class="botones" style="margin-top:8px"><button class="btn btn-p" type="button" id="btnAdivTemp">Jugar a las adivinanzas</button></div></div>`:''}`;
  $$('#s-temporada .hist').forEach(b=>b.onclick=()=>{ const h=historia(b.dataset.h); if(disponible(h)) empezarHistoria(h); else aviso('Solo en la semana '+deTemporada(t)); });
  if($('#btnAdivTemp')) $('#btnAdivTemp').onclick=()=>ir('adivinanzas', {temporada:t.id});
  if(typeof activarJuegoFiesta==='function') activarJuegoFiesta($('#s-temporada'));
  decir(`${activa?cabTemporada(t):t.nombre} ${n>=meta?'':'Lee '+meta+' historias y gana una criatura especial.'}`);
}});
