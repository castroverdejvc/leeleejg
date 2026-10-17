/* LeeLEEJG · arranque */
'use strict';
$('#yoBtn').onclick=e=>{ const m=$('#menuYo'); m.hidden=!m.hidden; $('#yoBtn').setAttribute('aria-expanded', String(!m.hidden)); e.stopPropagation(); };

/* lee contenido, ajustes y lecturas (también se usa después de juntar una copia de otro aparato) */
async function cargarDatos(){
  const [cont, est, datos, mis] = await Promise.all([api('contenido.json'), api('/api/estado').catch(()=>EST), api('/api/datos').catch(()=>({})), api('/api/misimagenes').catch(()=>({}))]);
  CONT=cont; EST=est; MIS=mis||{}; if(EST.cargando) vigilarEstado();
  await cargarFichas();
  aj = ajPorDefecto();
  if(datos.ajustes) aj={...aj, ...datos.ajustes};
  if(!aj.perfiles || !aj.perfiles.length) aj.perfiles=[PERFIL_INICIAL()];
  if(!aj.perfiles.find(p=>p.id===aj.perfil)) aj.perfil=aj.perfiles[0].id;
  aj.perfiles.forEach(p=>{ if(!p.cfg) p.cfg = p.id===aj.perfil ? Object.fromEntries(PKEYS.map(k=>[k, aj[k]])) : {...cfgBase(p), inicio:aj.inicio}; delete p.cfg.mundo; /* ajuste de una versión antigua, sin uso */ });
  if(!aj.perfiles.some(p=>p.prueba)) aj.perfiles.push({id:'pruebas', nombre:'Pruebas', color:'#64748B', prueba:true, cfg:cfgBase({prueba:true})});
  Object.assign(aj, cfgBase(perfil()), perfil().cfg||{});
  SES=(datos.sesiones||[]).map(normSesion).sort((a,b)=>a.fecha<b.fecha?-1:1);
  huellasAj=null; sellarCambios();   // punto de partida para saber qué cambia desde ahora
  return datos;
}

(async function arrancar(){
  try{
    await prepararModo();
    const datos = await cargarDatos();
    iconos(); pintarCabecera(); aplicarLetra(); elegirVoz();
    ir(aj.perfiles.length>1 ? 'quien' : 'inicio');
    guardarAj();
    quitarPreparando();
    if(enLocal()){ precargarSinInternet(); if(!datos.ajustes && !/^#nube=/.test(location.hash)) bienvenidaAparato(); }
    else if(!nubeConf()) setTimeout(sincroAlAbrir, 1500);
    nubeArrancar();   // copias automáticas (si están activadas)
  }catch(e){
    quitarPreparando();
    document.body.innerHTML=`<div class="main"><div class="card bloque"><h2>No se pudo abrir LeeLEEJG</h2><p class="sub">${esc(e.message)}</p><p class="nota">${MODO==='local'?'Cierra LeeLEEJG y ábrelo otra vez. La primera vez necesita internet.':'Cierra esta ventana y abre otra vez «Iniciar LeeLEEJG».'}</p></div></div>`;
    registrar('Arranque: '+e.message); console.error(e);
  }
})();

/* En el ordenador: al abrir, junta lo que la tablet haya dejado en Google Drive y deja allí la copia del ordenador */
async function sincroAlAbrir(){
  let r=null; try{ r = await sincroOrdenador(); }catch(e){ registrar(NUBE+' al abrir: '+e.message); }
  if(r && r.total){
    aviso('Juntado de la tablet: '+resumenUnion(sumar(r.unidos.map(u=>u.r))));
    if(['quien','inicio'].includes(actual)) ir(actual);
  }
}

/* Primera vez en una tablet: traer lo del ordenador o empezar aquí */
function bienvenidaAparato(){
  dialogo({titulo:'LeeLEEJG en este aparato', html:`<p class="nota" style="margin-bottom:6px">Si ya usáis LeeLEEJG en el ordenador, trae sus datos (niños, temas, lecturas): busca en Google Drive, carpeta <b>LeeLEEJG</b>, el archivo <b>LeeLEEJG-ordenador</b>.</p><p class="nota">Si no, empieza aquí y pon el nombre del niño en <b>Familia › Usuarios</b>.</p>`,
    botones:[{t:'Traer los datos del ordenador', cls:'btn-p', fn:async()=>{ try{ const r=await traerTablet(); if(r && r.total) location.reload(); else if(r && r.propia) aviso('Ese archivo es de este mismo aparato'); }catch(e){ dialogo({titulo:'No se pudo', html:`<p class="nota">${esc(e.message)}</p>`, botones:[{t:'Vale',cls:'btn-p'}]}); } }},
      {t:'Empezar aquí', cls:'btn'}]});
}
