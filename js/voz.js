/* LeeLEEJG · voz (Piper en el programa o la del navegador) y sonidos */
'use strict';
let vozNav=null; const audioVoz = new Audio(); let vozFin=null;
function vocesEs(){ try{ return speechSynthesis.getVoices().filter(v=>/^es([-_]|$)/i.test(v.lang)); }catch(e){ return []; } }
function puntuarVoz(v){ let p=0; const l=v.lang.replace('_','-').toLowerCase(); if(l==='es-es') p+=50; if(/natural|online|neural/i.test(v.name)) p+=30; if(/google/i.test(v.name)) p+=20; if(/elvira|alvaro|álvaro|helena|laura|pablo/i.test(v.name)) p+=10; return p; }
function elegirVoz(){ const vs=vocesEs().sort((a,b)=>puntuarVoz(b)-puntuarVoz(a)); vozNav = vs.find(v=>v.voiceURI===aj.voz) || vs[0] || null; }
if('speechSynthesis' in window){ try{ speechSynthesis.addEventListener('voiceschanged', elegirVoz); }catch(e){} setTimeout(elegirVoz,600); }
/* La voz del programa (Piper) se usa salvo que en «Voz y sonido» se haya elegido una del navegador (aj.vozPrograma=false).
   aj.voz guarda la voz del navegador preferida, que también sirve de respaldo. */
const usaPiper = () => EST.voz==='piper' && aj.vozPrograma!==false;
let vozTurno=0;   // cambia cada vez que se manda callar: así una frase pendiente de decirVarias no se cuela después
function callar(){ vozTurno++; try{ audioVoz.pause(); }catch(e){} if(vozFin){ const f=vozFin; vozFin=null; f(); } try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){} }
/* voz del navegador para otro idioma (inglés, gallego); si no hay gallega se usa la española */
function vozNavIdioma(idioma){
  if(idioma==='es') return vozNav;
  let vs=[]; try{ vs=speechSynthesis.getVoices(); }catch(e){}
  const pref = idioma==='en' ? ['en-GB','en-IE','en-US','en'] : idioma==='gl' ? ['gl-ES','gl','es-ES'] : [idioma];
  for(const l of pref){ const v=vs.find(v=>v.lang.replace('_','-').toLowerCase().startsWith(l.toLowerCase())); if(v) return v; }
  return null;
}
const LANG_TAG = {es:'es-ES', en:'en-GB', gl:'gl-ES'};
function decirNavegador(t, idioma='es'){
  return new Promise(res=>{
    if(!('speechSynthesis' in window)){ res(); return; }
    try{
      if(!vozNav) elegirVoz();
      const u = new SpeechSynthesisUtterance(t); const v = vozNavIdioma(idioma);
      if(v){ u.voice=v; u.lang=v.lang; } else u.lang=LANG_TAG[idioma]||'es-ES';
      u.rate=.9; u.pitch=1.05; u.volume=aj.volumen ?? .9;
      let hecho=false; const fin=(ok=true)=>{ if(!hecho){ hecho=true; res(ok); } };
      u.onend=()=>fin(true); u.onerror=e=>fin(e && (e.error==='interrupted' || e.error==='canceled')); setTimeout(()=>fin(true), 1800 + t.length*110);
      speechSynthesis.speak(u);
    }catch(e){ res(false); }
  });
}
/* mientras habla el programa, el oído no escucha (si no, oye su propia voz al pedir ayuda con una palabra) */
let vozSonando=0, vozHastaMs=0, vozDesdeMs=0;
const programaHablando = () => (vozSonando>0 && performance.now()-vozDesdeMs<15000) || performance.now()<vozHastaMs;
function decir(t, idioma='es'){
  const pr=decir0(t, idioma); if(!vozSonando) vozDesdeMs=performance.now(); vozSonando++;
  const fin=()=>{ vozSonando=Math.max(0, vozSonando-1); vozHastaMs=performance.now()+700; };
  pr.then(fin, fin); return pr;
}
function decir0(t, idioma='es'){
  callar(); if(!t) return Promise.resolve();
  if(idioma!=='es'){ if(!(EST.voces||[]).includes(idioma)) return decirNavegador(t, idioma); }
  else if(!usaPiper()){ if(EST.cargando) refrescarEstado();
    // si la voz elegida del navegador falla (p. ej. una voz «Online» sin internet), se usa la del programa
    const turno=vozTurno; return decirNavegador(t).then(ok=>{ if(!ok && EST.voz==='piper' && turno===vozTurno) return decirPiper(t, idioma); }); }
  return decirPiper(t, idioma);
}
function decirPiper(t, idioma='es'){
  return new Promise(res=>{
    let hecho=false; const fin=()=>{ if(!hecho){ hecho=true; vozFin=null; res(); } };
    vozFin=fin; audioVoz.volume = aj.volumen ?? .9;
    audioVoz.onended=fin; audioVoz.onerror=()=>{ if(!hecho){ hecho=true; vozFin=null; decirNavegador(t, idioma).then(res); } };
    audioVoz.src='/api/voz?t='+encodeURIComponent(t)+(idioma!=='es'?'&l='+idioma:'');
    audioVoz.play().catch(()=>{ if(!hecho){ hecho=true; vozFin=null; decirNavegador(t, idioma).then(res); } });
    setTimeout(fin, 4000 + t.length*150);
  });
}
/* dice una pregunta solo si está activado «Audio de preguntas» */
const decirPregunta = t => aj.audioPreguntas===false ? Promise.resolve() : decir(t);
let actx;
function ctxAudio(){ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); return actx; }
function sonido(tipo){
  try{
    const a=ctxAudio(); const v=(aj.volumen ?? .9)*.18; const notas = tipo==='bien' ? [523,659,784,1047] : tipo==='cromo' ? [523,659,784,1047,1319] : tipo==='toc' ? [784] : tipo==='clin' ? [1568,2093] : [311,247];
    notas.forEach((f,i)=>{ const o=a.createOscillator(), g=a.createGain(); o.type='triangle'; o.frequency.value=f;
      const t=a.currentTime+i*.11; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(.001,v),t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+.28);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t+.3); });
  }catch(e){}
}
/* El programa carga la voz y el oído unos segundos después de abrir la ventana */
async function refrescarEstado(){ try{ EST = await api('/api/estado'); }catch(e){} return EST; }
function vigilarEstado(){ let n=0; const t=setInterval(async()=>{ n++; await refrescarEstado(); if(!EST.cargando || n>120) clearInterval(t); }, 1500); }
async function esperarCarga(maxSeg){ const fin=Date.now()+maxSeg*1000; await refrescarEstado(); while(EST.cargando && Date.now()<fin){ await pausa(700); await refrescarEstado(); } }

/* ---- Reproductor con onda (grabaciones) ---- */
function crearReproductor(cont, fuente){
  const url = typeof fuente==='string' ? fuente : URL.createObjectURL(fuente); const audio=new Audio(url); audio.preload='auto';
  const wrap=document.createElement('div'); wrap.className='player';
  wrap.innerHTML=`<button class="play" type="button" aria-label="Reproducir">${ic('play')}</button><canvas height="44"></canvas><span class="tiempo">0:00 / 0:00</span>`;
  cont.appendChild(wrap);
  const btn=wrap.querySelector('.play'), cv=wrap.querySelector('canvas'), tx=wrap.querySelector('.tiempo');
  let picos=null, dur=0, paraEn=null;
  const dibujar=()=>{ const w=cv.clientWidth, h=cv.clientHeight, dpr=window.devicePixelRatio||1; if(!w) return; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
    const x=cv.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
    const nb=Math.floor(w/5); const prog = dur ? audio.currentTime/dur : 0;
    for(let i=0;i<nb;i++){ const v = picos ? picos[Math.floor(i*picos.length/nb)] : .15; const bh=Math.max(3,v*h); x.fillStyle = i/nb<=prog ? '#1E7BF2' : '#AFC8EE'; x.fillRect(i*5,(h-bh)/2,3,bh); } };
  const tiempo=()=>{ tx.textContent=`${mmss(audio.currentTime)} / ${mmss(dur)}`; dibujar(); };
  (async()=>{ try{ const blob = typeof fuente==='string' ? await (await fetch(fuente)).blob() : fuente; const buf=await ctxAudio().decodeAudioData(await blob.arrayBuffer());
      dur=buf.duration; const d=buf.getChannelData(0); const n=140, paso=Math.max(1,Math.floor(d.length/n)); picos=[]; let mx=0;
      for(let i=0;i<n;i++){ let m=0; for(let j=i*paso;j<(i+1)*paso && j<d.length;j+=16){ const v=Math.abs(d[j]); if(v>m) m=v; } picos.push(m); if(m>mx) mx=m; }
      picos=picos.map(v=>mx?v/mx:0); tiempo(); }catch(e){ dibujar(); } })();
  audio.onloadedmetadata=()=>{ if(isFinite(audio.duration)) dur=audio.duration; tiempo(); };
  audio.ontimeupdate=()=>{ tiempo(); if(paraEn!=null && audio.currentTime>=paraEn){ audio.pause(); paraEn=null; } };
  audio.onplay=()=>{ btn.innerHTML=ic('pause'); }; audio.onpause=audio.onended=()=>{ btn.innerHTML=ic('play'); };
  btn.onclick=()=>{ paraEn=null; if(audio.paused){ audio.volume=aj.volumen ?? .9; audio.play().catch(()=>{}); } else audio.pause(); };
  cv.onclick=e=>{ if(!dur) return; const r=cv.getBoundingClientRect(); audio.currentTime=dur*(e.clientX-r.left)/r.width; tiempo(); };
  setTimeout(dibujar,60); window.addEventListener('resize',dibujar);
  return { audio, trozo(t){ if(t==null) return; paraEn=t+1.1; audio.currentTime=Math.max(0,t-.6); audio.volume=aj.volumen ?? .9; audio.play().catch(()=>{}); }, parar(){ audio.pause(); } };
}
function sonarAudio(fuente){ const url = typeof fuente==='string' ? fuente : URL.createObjectURL(fuente); const a=new Audio(url); a.volume=aj.volumen ?? .9; a.play().catch(()=>{}); return a; }

/* varias frases seguidas, cada una en su idioma: decirVarias([['How do you say','en'],['raíces','es'],['in English?','en']]) */
async function decirVarias(trozos){ for(const [t,l] of trozos){ const pr=decir(t, l||'es'); const turno=vozTurno; await pr; if(turno!==vozTurno) return; } }
