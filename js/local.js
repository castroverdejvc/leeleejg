/* LeeLEEJG · modo de funcionamiento
   «servidor»: en el ordenador, con «Iniciar LeeLEEJG» (programa/app.py: voz y oído sin internet).
   «local»: en la tablet o el móvil, instalada desde la web; todo se guarda en el propio aparato (sw.js). */
'use strict';
let MODO = 'servidor';
const enLocal = () => MODO==='local';
const instalada = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true;
const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
let avisoInstalar = null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); avisoInstalar = e; });

async function prepararModo(){
  const sw = 'serviceWorker' in navigator ? navigator.serviceWorker : null;
  if(sw && sw.controller){ MODO='local'; return MODO; }
  // ¿hay un programa LeeLEEJG detrás (el ordenador)?
  try{
    const r = await fetch('/api/estado', {cache:'no-store'});
    if(r.ok && (r.headers.get('Content-Type')||'').includes('json')){ const e = await r.json(); if(e && e.version && !e.local){ MODO='servidor'; return MODO; } }
  }catch(e){}
  if(!sw) throw new Error('Este navegador no puede guardar LeeLEEJG en el aparato. Ábrelo con Chrome (Android) o Safari (iPad).');
  MODO='local';
  pintarPreparando('Preparando LeeLEEJG en este aparato…');
  await sw.register('sw.js');
  if(!sw.controller){
    await new Promise((res, rej)=>{ const t=setTimeout(()=>rej(new Error('No se pudo preparar el programa. Comprueba la conexión a internet y vuelve a abrirlo.')), 60000);
      sw.addEventListener('controllerchange', ()=>{ clearTimeout(t); res(); }, {once:true}); });
  }
  return MODO;
}
function pintarPreparando(t){ let d=document.getElementById('preparando'); if(!d){ d=document.createElement('div'); d.id='preparando'; d.className='preparando'; document.body.appendChild(d); } d.innerHTML=`<div class="card"><span>${ic('logo')}</span><p>${esc(t)}</p></div>`; }
function quitarPreparando(){ const d=document.getElementById('preparando'); if(d) d.remove(); }

/* Fotos y letras para usar sin internet: el aparato las va guardando y lo cuenta en una franja pequeña */
let precarga = {hechos:0, total:0, fin:false};
function precargarSinInternet(){
  if(!enLocal() || !navigator.serviceWorker.controller) return;
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  navigator.serviceWorker.addEventListener('message', ev=>{
    const m=ev.data||{}; if(m.tipo!=='precarga') return; precarga=m;
    let f=document.getElementById('franjaPrecarga');
    if(m.fin && !m.error && !m.fallos){ if(f) f.remove(); return; }
    if(!f){ if(m.hechos>=m.total && !m.error) return; f=document.createElement('div'); f.id='franjaPrecarga'; f.className='franja-precarga'; document.body.appendChild(f); }
    f.textContent = m.error ? 'No se pudo guardar todo para usar sin internet. Se reintentará al abrir otra vez.'
      : m.fin ? `Guardado para usar sin internet, salvo ${m.fallos} fotos. Se reintentará al abrir otra vez.`
      : `Guardando fotos para usar sin internet: ${m.hechos} de ${m.total}. No cierres el programa.`;
  });
  navigator.serviceWorker.controller.postMessage({tipo:'precargar'});
}

/* Instalar en la pantalla de inicio */
function instalarHTML(){
  if(!enLocal() || instalada()) return '';
  const como = esIOS() ? 'En el iPad: pulsa el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba) y luego <b>«Añadir a pantalla de inicio»</b>.'
    : avisoInstalar ? 'Pulsa el botón y confirma. Saldrá un icono de LeeLEEJG como el de cualquier app.'
    : 'En Chrome: menú <b>⋮</b> de arriba a la derecha y <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.';
  return `<div class="card ajuste" id="cardInstalar"><h3>${ic('descarga')} Instalar en este aparato</h3><p class="nota">${como} Después se abre desde ese icono y funciona sin internet.</p>${avisoInstalar?'<div class="botones" style="margin-top:10px"><button class="btn btn-p" type="button" id="btnInstalar">Instalar LeeLEEJG</button></div>':''}</div>`;
}
function activarInstalar(){
  const b=document.getElementById('btnInstalar'); if(!b || !avisoInstalar) return;
  b.onclick=async()=>{ const e=avisoInstalar; avisoInstalar=null; e.prompt(); try{ await e.userChoice; }catch(x){} const c=document.getElementById('cardInstalar'); if(c) c.remove(); };
}
