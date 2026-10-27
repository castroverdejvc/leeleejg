/* LeeLEEJG · «Lectura del día» (25/10/2026): cada día, una lectura extra voluntaria sobre el santo del día y el día
   internacional o especial que se celebra (codigo/dias/MM.json → contenido.json, complementarias con «efemeride»: "MM-DD").
   No sustituye a la historia del día: cuenta como lectura extra (⭐⭐, minutos de tele, sobre del día, peli del sábado).
   Solo se propone su día; no sale en la lista de lecturas extra ni en el álbum de cromos de extras. */
'use strict';
const esLecturaDia = h => !!(h && h.efemeride);
const mmdd = d => String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const hoyDia = () => (typeof fechaTemp==='function' ? fechaTemp() : new Date());
function lecturaDelDia(f=hoyDia()){ const k=mmdd(f); return (CONT.complementarias||[]).find(x=>x.efemeride===k) || null; }
const sinTildeD = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
/* ¿hoy es el santo de alguien de casa? (por el nombre de los perfiles) */
function santoDeCasa(h){
  if(!h || !(h.nombres||[]).length) return [];
  const ns=new Set(h.nombres.map(sinTildeD));
  return (aj.perfiles||[]).filter(p=>!p.prueba).map(p=>p.nombre).filter(n=>String(n).split(/\s+/).some(w=>ns.has(sinTildeD(w))));
}
function diaHoyHTML(){
  const p=perfil(); if(p.prueba) return '';
  const h=lecturaDelDia(); if(!h) return '';
  const leida = sesDe(p.id).some(s=>!s.incompleta && s.historiaId===h.id && claveDia(s.fecha)===claveDia(new Date()));
  const yaAntes = !leida && sesDe(p.id).some(s=>!s.incompleta && s.historiaId===h.id);
  const casa=santoDeCasa(h), f=hoyDia();
  const fecha = fechaLarga(f).replace(/^./, c=>c.toUpperCase());
  return `<div class="card dia-hoy">
    <div class="dh-cab"><span class="emo-g">📅</span><div><b class="dh-fecha">${esc(fecha)}</b>
      <span class="dh-linea">🎉 <b>Santo:</b> ${esc(h.santo)}</span>
      ${h.diaDe?`<span class="dh-linea">🌍 ${esc(h.diaDe)}</span>`:''}
      ${fiestasHoyHTML()}
      ${casa.length?`<span class="dh-linea dh-casa">🎂 ¡Hoy es el santo de ${esc(casa.join(' y '))}!</span>`:''}</div></div>
    <button type="button" class="dh-leer${leida?' hecha':''}" data-dialeer="${esc(h.id)}"><span class="mini-fotos">${imgHTML(h.portada)}</span>
      <span class="tx"><b>${leida?'✓ ':''}Lectura del día: «${esc(conNombre(h.titulo))}»</b><span class="nota">${leida?'¡Ya la has leído hoy! Puedes leerla otra vez.':`Es una lectura extra, si quieres: ⭐⭐${teleCfg().extra>0?` y +${minTxt(teleCfg().extra)} de tele`:''}.${yaAntes?' (Ya la leíste otro año.)':''}`}</span></span>
      <span class="ir">${ic('dcha')}</span></button></div>`;
}
/* 27/10/2026: las fiestas de estos días (Samaín, Halloween, Día de Muertos…) también se ven aquí, como el santo */
const fiestasHoy = () => (typeof temporadasActivas==='function' ? temporadasActivas(fechaTemp(), perfil()) : []).filter(t=>t.id!=='cumple').sort((a,b)=>(a.hermanas&&b.hermanas)?a.hermanas.indexOf(a.id)-a.hermanas.indexOf(b.id):0);
const juntarY = xs => xs.length<2 ? (xs[0]||'') : xs.slice(0,-1).join(', ')+' y '+xs[xs.length-1];
function fiestasHoyHTML(){ const fs=fiestasHoy(); if(!fs.length) return '';
  return `<span class="dh-linea dh-fiestas"><b>${fs.length>1?'Fiestas':'Fiesta'}:</b> ${fs.map(t=>`<button type="button" class="dh-fiesta" data-temp="${esc(t.id)}" style="--tc:${t.color};--ts:${t.suave}">${t.emo} ${esc(t.nombre)}</button>`).join(' ')}</span>`; }
/* lo que se dice al tocar la fecha */
function decirDiaHoy(){
  const h=lecturaDelDia(); if(!h) return;
  const casa=santoDeCasa(h);
  const fs=fiestasHoy(); decir(`Hoy es ${fechaLarga(hoyDia())}. Es ${h.santo}.${h.diaNino?' '+h.diaNino:''}${fs.length?` Es la semana de ${juntarY(fs.map(t=>t.nombre))}.`:''}${casa.length?` ¡Felicidades, ${casa.join(' y ')}!`:''}`);
}
document.addEventListener('click', ev=>{
  const b=ev.target.closest && ev.target.closest('[data-dialeer]');
  if(b){ const h=historia(b.dataset.dialeer); if(h) empezarHistoria(h); return; }
  const c=ev.target.closest && ev.target.closest('.dia-hoy .dh-cab');
  if(c) decirDiaHoy();
});

/* ---------- 25/10/2026: cada lectura del día da su pegatina para el «Álbum del año» (un hueco por día) ---------- */
const MESES_P = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_C = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const COLOR_MES = ['#3B82F6','#EC4899','#10B981','#84CC16','#F59E0B','#F97316','#EF4444','#06B6D4','#8B5CF6','#D97706','#92400E','#0EA5E9'];
const lecturasDia = () => (CONT.complementarias||[]).filter(x=>x.efemeride);
/* las que tiene: {MM-DD: {f: primera vez que la leyó, n: veces}} */
function pegatinasDe(p=perfil()){
  const m={}; sesDe(p.id).filter(s=>!s.incompleta && /^c_dia_\d{4}$/.test(s.historiaId||'')).sort((a,b)=>a.fecha<b.fecha?-1:1).forEach(s=>{
    const k=s.historiaId.slice(6,8)+'-'+s.historiaId.slice(8,10); if(!m[k]) m[k]={f:s.fecha, n:0}; m[k].n++; });
  return m;
}
const nombreCorto = h => (h.nombres&&h.nombres.length) ? h.nombres.slice(0,2).join(' y ') : String(h.santo||'').replace(/^(San|Santa|Santo|Santos|Santas)\s+/,'');
function pegatinaHTML(h, {grande=false, quien='', anio=''}={}){
  const [mm,dd]=h.efemeride.split('-').map(Number), col=COLOR_MES[mm-1];
  if(!grande) return `<span class="pegatina" style="--pc:${col}"><span class="pg-fecha">${dd} ${MESES_C[mm-1]}</span><span class="pg-ft">${imgHTML(h.portada)}</span></span><span class="pg-pie" style="--pc:${col}">${esc((h.nombres&&h.nombres[0])||nombreCorto(h))}</span>`;
  return `<span class="pegatina grande" style="--pc:${col}"><span class="pg-fecha">${dd} ${MESES_C[mm-1]}</span><span class="pg-ft">${imgHTML(h.portada)}</span><span class="pg-nombre">${esc(nombreCorto(h))}</span>${quien?`<span class="pg-quien">${esc(quien)}${anio?' · '+anio:''}</span>`:''}</span>`;
}
let mesPegatinas=null;
definir('pegatinas', {nav:'cromos', pintar(arg){
  const p=perfil(), tengo=pegatinasDe(p), todas=lecturasDia(), hoy=hoyDia(), kHoy=mmdd(hoy);
  if(arg!=null && arg!=='') mesPegatinas=+arg; if(mesPegatinas==null) mesPegatinas=hoy.getMonth()+1;
  const mes=mesPegatinas, delMes=todas.filter(x=>+x.efemeride.slice(0,2)===mes).sort((a,b)=>a.efemeride<b.efemeride?-1:1);
  const n=Object.keys(tengo).length, nMes=delMes.filter(x=>tengo[x.efemeride]).length;
  const futuro = x => { const [m,d]=x.efemeride.split('-').map(Number); return m>hoy.getMonth()+1 || (m===hoy.getMonth()+1 && d>hoy.getDate()); };
  const hueco = x => { const k=x.efemeride, t=tengo[k], d=+k.slice(3);
    if(t) return `<button type="button" class="pg-hueco tiene" data-pg="${esc(x.id)}">${pegatinaHTML(x)}</button>`;
    if(k===kHoy) return `<button type="button" class="pg-hueco hoy" data-dialeer="${esc(x.id)}"><span class="pg-vacia" style="--pc:${COLOR_MES[mes-1]}"><b>${d}</b><span>¡Hoy!</span></span><span class="nota">Lee la lectura del día</span></button>`;
    return `<div class="pg-hueco"><span class="pg-vacia${futuro(x)?' futura':''}" style="--pc:${COLOR_MES[mes-1]}"><b>${d}</b><span>${futuro(x)?'🔒':'·'}</span></span></div>`; };
  $('#s-pegatinas').innerHTML = `${albumTabsHTML('pegatinas')}
    <div class="album-cab"><div><h1 class="tit">📅 Álbum del año</h1><p class="sub">Cada día hay una lectura del día con el santo y lo que se celebra. Si la lees ese día, ¡su pegatina va a tu álbum!</p></div>
      <div class="contador">📅<div><b>${n} de ${todas.length||366}</b><br><span>pegatinas</span></div></div></div>
    <div class="pg-meses">${MESES_P.map((m,i)=>{ const c=todas.filter(x=>+x.efemeride.slice(0,2)===i+1 && tengo[x.efemeride]).length; return `<button type="button" data-pgmes="${i+1}" aria-pressed="${i+1===mes}" style="--pc:${COLOR_MES[i]}">${m.slice(0,3)}${c?` <span class="pg-c">${c}</span>`:''}</button>`; }).join('')}</div>
    <h2 class="pg-tit-mes" style="--pc:${COLOR_MES[mes-1]}">${MESES_P[mes-1].replace(/^./,c=>c.toUpperCase())} <span class="nota">${nMes} de ${delMes.length}</span></h2>
    <div class="pg-grid">${delMes.map(hueco).join('')}</div>`;
  activarAlbumTabs();
  $$('#s-pegatinas [data-pgmes]').forEach(b=>b.onclick=()=>ir('pegatinas', b.dataset.pgmes));
  $$('#s-pegatinas [data-pg]').forEach(b=>b.onclick=()=>verPegatina(b.dataset.pg));
}});
function verPegatina(id){
  const h=historia(id), p=perfil(); if(!h) return; const t=pegatinasDe(p)[h.efemeride];
  const [mm,dd]=h.efemeride.split('-').map(Number);
  const d=dialogo({titulo:`${dd} de ${MESES_P[mm-1]}`, cls:'dlg-pegatina', html:`<div class="pg-ver">${pegatinaHTML(h,{grande:true, quien:p.nombre, anio:t?new Date(t.f).getFullYear():''})}
      <p><b>🎉 ${esc(h.santo)}</b>${h.diaDe?`<br>🌍 ${esc(h.diaDe)}`:''}</p><p class="nota">«${esc(conNombre(h.titulo))}»${t?` · leída ${t.n===1?'1 vez':t.n+' veces'}, la primera el ${esc(fechaLarga(new Date(t.f)))} de ${new Date(t.f).getFullYear()}`:''}</p></div>`,
    botones:[{t:'Leerla otra vez', cls:'btn', fn:()=>empezarHistoria(h)}, {t:'¡Qué bonita!', cls:'btn-p'}]});
  decir(`${h.santo}.${h.diaNino?' '+h.diaNino:''}`);
  return d;
}
