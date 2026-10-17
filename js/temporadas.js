/* LeeLEEJG · fiestas y estaciones (Samaín, Magosto, Navidad, Entroido, primavera, Pascua, verano, otoño)
   En cada temporada salen historias propias en Inicio; leyendo 3 se gana su criatura especial. */
'use strict';
const TEMP_META = 3;
const listaTemporadas = () => CONT.temporadas || [];
const temporada = id => listaTemporadas().find(t=>t.id===id);
const nombreTemporada = id => (temporada(id)||{nombre:''}).nombre;
const historiasTemporada = id => CONT.historias.filter(h=>h.temporada===id);
let fechaPruebaTemporada = null;   // solo para las pruebas automáticas

function rangoTemporada(t, anio){
  const [d,h] = (t.anos && t.anos[anio]) || [t.desde, t.hasta];
  const ini=new Date(anio+'-'+d+'T00:00:00'); let fin=new Date(anio+'-'+h+'T23:59:59');
  if(fin<ini) fin=new Date((anio+1)+'-'+h+'T23:59:59');   // cruza de año (Navidad)
  return [ini, fin];
}
function enTemporada(t, f=fechaPruebaTemporada||new Date()){
  const a=f.getFullYear();
  return [a-1, a].some(y=>{ const [i,x]=rangoTemporada(t,y); return f>=i && f<=x; });
}
const temporadasActivas = (f) => listaTemporadas().filter(t=>enTemporada(t,f) && historiasTemporada(t.id).length);
const temporadaActiva = id => { const t=temporada(id); return !!t && enTemporada(t); };
/* la próxima que empieza en los siguientes 10 días */
function temporadaProxima(){
  const hoy=fechaPruebaTemporada||new Date(); let mejor=null;
  listaTemporadas().forEach(t=>{ if(enTemporada(t,hoy) || !historiasTemporada(t.id).length) return; [hoy.getFullYear(), hoy.getFullYear()+1].forEach(y=>{ const [i]=rangoTemporada(t,y); const dias=Math.ceil((i-hoy)/DIA_MS); if(dias>0 && dias<=10 && (!mejor || dias<mejor.dias)) mejor={t, dias}; }); });
  return mejor;
}
const leidasTemporada = (id, p=perfil()) => { const l=leidasDe(p.id); return historiasTemporada(id).filter(h=>l[h.id]).length; };
const metaTemporada = id => Math.min(TEMP_META, historiasTemporada(id).length);
const temporadaGanada = (id, p=perfil()) => historiasTemporada(id).length>0 && leidasTemporada(id,p) >= metaTemporada(id);
const criaturaDeTemporada = id => (typeof CRIATURAS_ESPECIALES!=='undefined' ? CRIATURAS_ESPECIALES.find(c=>c.temporada===id) : null);

/* tarjeta de Inicio */
function temporadaHTML(){
  const act=temporadasActivas();
  if(!act.length){ const px=temporadaProxima(); return px ? `<div class="card temporada pronto" style="--tc:${px.t.color};--ts:${px.t.suave}"><span class="emo-g">${px.t.emo}</span><div class="tx"><b>${px.dias===1?'¡Mañana empieza':'¡En '+px.dias+' días llega'} ${esc(px.t.nombre)}!</b><span class="nota">${esc(px.t.frase)} Habrá historias especiales y una criatura nueva.</span></div></div>` : ''; }
  return act.map(t=>{ const n=leidasTemporada(t.id), meta=metaTemporada(t.id), ganada=n>=meta, c=criaturaDeTemporada(t.id);
    return `<div class="card temporada" style="--tc:${t.color};--ts:${t.suave}"><div class="guirnalda" aria-hidden="true">${(t.emo+' ').repeat(9)}</div>
      ${c?`<span class="cri-temp">${criaturaSVG(c,{silueta:!ganada})}</span>`:`<span class="emo-g">${t.emo}</span>`}
      <div class="tx"><b>¡Es ${esc(t.nombre)}! ${t.emo}</b><span class="nota">${ganada?`¡Ya tienes a ${esc(c?c.nombre:'tu premio')}! Puedes leer las demás historias de ${esc(t.nombre)}.`:`Lee ${meta} historias de ${esc(t.nombre)} y gana una criatura especial${c?': '+esc(c.nombre):''}.`}</span>
        <span class="barra-t"><i style="width:${Math.round(100*Math.min(n,meta)/meta)}%;background:var(--tc)"></i></span><span class="nota">${Math.min(n,meta)} de ${meta}</span></div>
      <button class="btn btn-p" type="button" data-temp="${t.id}">Historias de ${esc(t.nombre)} ${ic('flecha')}</button></div>`; }).join('');
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
  ${activa?'':`<p class="nota" style="margin:10px 0">Estas historias solo se pueden leer en ${esc(t.nombre)}.</p>`}
  <div class="historias">${hs.map(h=>{ const ok=disponible(h);
    return `<button type="button" class="hist${ok?'':' bloq'}" data-h="${h.id}"><span class="ft">${imgHTML(h.portada)}${l[h.id]?'<span class="ok">✓ Leída</span>':''}</span><span class="tx"><b>${esc(conNombre(h.titulo))}</b><span class="nota">${esc(conNombre(h.resumen))}</span></span></button>`; }).join('')}</div>
  ${adiv.length?`<div class="card bloque" style="margin-top:16px"><b>${t.emo} Adivinanzas de ${esc(t.nombre)}</b><p class="nota">Escucha y toca la respuesta.</p><div class="botones" style="margin-top:8px"><button class="btn btn-p" type="button" id="btnAdivTemp">Jugar a las adivinanzas</button></div></div>`:''}`;
  $$('#s-temporada .hist').forEach(b=>b.onclick=()=>{ const h=historia(b.dataset.h); if(disponible(h)) empezarHistoria(h); else aviso('Solo en '+t.nombre); });
  if($('#btnAdivTemp')) $('#btnAdivTemp').onclick=()=>ir('adivinanzas', {temporada:t.id});
  decir(`¡Es ${t.nombre}! ${n>=meta?'':'Lee '+meta+' historias y gana una criatura especial.'}`);
}});
