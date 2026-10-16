/* LeeLEEJG · recortar una imagen (mover y acercar) y elegir imágenes */
'use strict';
/* abrirRecorte(File|URL, {aspecto, redonda, titulo, ancho}) → Promise<Blob|null> */
function abrirRecorte(fuente, {aspecto=1.5, redonda=false, titulo='Recortar imagen', ancho=900}={}){
  return new Promise(async res=>{
    let bmp;
    try{ bmp = fuente instanceof Blob ? await createImageBitmap(fuente) : await createImageBitmap(await (await fetch(fuente)).blob()); }
    catch(e){ dialogo({titulo:'No se pudo abrir la imagen', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); res(null); return; }
    const st={z:1, x:.5, y:.5};
    const d=dialogo({titulo, cls:'dlg-recorte', html:`<p class="nota">Mueve la imagen con el ratón o el dedo y acércala con la barra.</p>
      <div class="recorte" id="rcCaja" style="aspect-ratio:${aspecto};${redonda?'border-radius:50%':''}"><canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas><div class="marco" ${redonda?'style="border-radius:50%"':''}></div></div>
      <div class="zoom"><span>−</span><input type="range" min="1" max="6" step="0.01" value="1" id="rcZoom" aria-label="Acercar"><span>+</span></div>`,
      botones:[{t:'Usar esta imagen', cls:'btn-p', fn:async()=>{ res(await recortar(ancho, Math.round(ancho/aspecto))); }},{t:'Cancelar', fn:()=>res(null)}], alCerrar:()=>res(null)});
    const caja=$('#rcCaja', d.el), cv=caja.querySelector('canvas');
    const geom=(W,H)=>{ const s=Math.max(W/bmp.width, H/bmp.height)*st.z; const dw=bmp.width*s, dh=bmp.height*s;
      return {dw, dh, x:Math.min(0, Math.max(W-dw, W/2-st.x*dw)), y:Math.min(0, Math.max(H-dh, H/2-st.y*dh))}; };
    const pinta=()=>{ const W=caja.clientWidth, H=caja.clientHeight; if(!W) return; cv.width=W; cv.height=H; const g=geom(W,H); cv.getContext('2d').drawImage(bmp, g.x, g.y, g.dw, g.dh); };
    const recortar=(W,H)=>new Promise(r=>{ const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,W,H); const g=geom(W,H); x.drawImage(bmp,g.x,g.y,g.dw,g.dh); c.toBlob(r,'image/jpeg',.86); });
    let ini=null;
    caja.onpointerdown=e=>{ caja.setPointerCapture(e.pointerId); ini={x:e.clientX, y:e.clientY, sx:st.x, sy:st.y}; };
    caja.onpointermove=e=>{ if(!ini) return; const g=geom(caja.clientWidth, caja.clientHeight); st.x=Math.max(0,Math.min(1, ini.sx-(e.clientX-ini.x)/g.dw)); st.y=Math.max(0,Math.min(1, ini.sy-(e.clientY-ini.y)/g.dh)); pinta(); };
    caja.onpointerup=caja.onpointercancel=()=>{ ini=null; };
    caja.onwheel=e=>{ e.preventDefault(); st.z=Math.max(1,Math.min(6, st.z*(e.deltaY<0?1.08:.93))); $('#rcZoom',d.el).value=st.z; pinta(); };
    $('#rcZoom',d.el).oninput=e=>{ st.z=+e.target.value; pinta(); };
    setTimeout(pinta, 30);
  });
}
/* elegir un archivo de imagen del ordenador o la tableta */
function elegirArchivo(){ return new Promise(res=>{ const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=()=>res(i.files[0]||null); i.click(); }); }
async function subirImagen(clave, blob){ await api('/api/misimagenes/'+clave,{method:'POST', body:blob}); MIS[clave]=Date.now(); }
/* galería de nuestras fotos para escoger una (devuelve la clave) */
function elegirDeGaleria(titulo='Elige una foto'){
  return new Promise(res=>{
    let q=''; const d=dialogo({titulo, cls:'dlg-ancho', alCerrar:()=>res(null), html:`<input class="buscar" id="galBuscar" type="search" placeholder="Buscar (p. ej. árbol, perro, sol)" style="width:100%"><div class="lista-img" id="galLista" style="max-height:52vh;overflow:auto;text-align:left"></div>`});
    const pinta=()=>{ const n=normalizar(q); const items = n ? Object.entries(CONT.palabras).filter(([p,k])=>normalizar(p).includes(n) && fotoURL(k)) : CONT.mundos.map(m=>[m.nombre, m.foto]).concat(Object.entries(CONT.palabras).filter(([p,k])=>fotoURL(k)).slice(0,40));
      const vistos=new Set(); $('#galLista',d.el).innerHTML = items.filter(([,k])=>!vistos.has(k) && vistos.add(k)).slice(0,90).map(([p,k])=>`<button type="button" class="it-img" data-k="${esc(k)}"><span class="ft"><img src="${fotoURL(k)}" alt=""></span><b>${esc(p)}</b></button>`).join('') || '<p class="vacio">No hay fotos con esa palabra.</p>';
      $$('#galLista [data-k]',d.el).forEach(b=>b.onclick=()=>{ d.cerrar(); res(b.dataset.k); }); };
    $('#galBuscar',d.el).oninput=e=>{ q=e.target.value; pinta(); }; pinta();
  });
}
