/* LeeLEEJG · micrófono, grabación y seguimiento de la lectura */
'use strict';
let palabras=[], lect=null;
const tLect = () => lect ? ((lect.pausadoDesde||performance.now()) - lect.t0 - lect.pausaTotal)/1000 : 0;

async function iniciarGrabacion(){
  try{
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return false;
    const st = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}});
    lect.stream=st; lect.chunks=[];
    const rec = new MediaRecorder(st); rec.ondataavailable=e=>{ if(e.data && e.data.size) lect.chunks.push(e.data); }; rec.start(1000); lect.rec=rec;
    const a=ctxAudio(); try{ await a.resume(); }catch(e){}
    const src=a.createMediaStreamSource(st); lect.src=src;
    const an = a.createAnalyser(); an.fftSize=512; src.connect(an); lect.an=an;
    return true;
  }catch(e){ registrar('Micrófono: '+e.message); return false; }
}
function pararGrabacion(l){
  if(l && l.proc){ try{ l.proc.disconnect(); }catch(e){} }
  if(l && l.ctx16){ try{ l.ctx16.close(); }catch(e){} l.ctx16=null; }
  return new Promise(res=>{
    if(!l || !l.rec || l.rec.state==='inactive'){ if(l && l.stream) l.stream.getTracks().forEach(t=>t.stop()); res(null); return; }
    l.rec.onstop=()=>{ const blob = l.chunks.length ? new Blob(l.chunks,{type:l.rec.mimeType||'audio/webm'}) : null; l.stream.getTracks().forEach(t=>t.stop()); res(blob); };
    try{ if(l.rec.state==='paused') l.rec.resume(); l.rec.stop(); }catch(e){ res(null); }
  });
}
function nivel(an){ if(!an) return 0; const b=new Uint8Array(an.fftSize); an.getByteTimeDomainData(b); let s=0; for(const v of b){ const d=(v-128)/128; s+=d*d; } return Math.min(1,Math.sqrt(s/b.length)*6); }

/* --- Oído sin internet (Vosk en el programa) --- */
async function iniciarOidoLocal(){
  try{
    const sil = new Set(); palabras.forEach(w=>(w.silRaw||[]).forEach(x=>{ if(x && x!==w.p){ sil.add(x); const n=normalizar(x); if(n) sil.add(n); } }));
    const r = await postJSON('/api/oido/inicio', {palabras: [...new Set(palabras.map(w=>w.p))], silabas:[...sil]});
    lect.oidoId = r.id; lect.cola = []; lect.enviando=false; lect.finales=[]; lect.parcial=''; lect.parcialT=null;
    // contexto propio a 16 kHz: el navegador remuestrea bien, que es lo que espera el reconocedor
    let a=null, ratio=1;
    try{ a = new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000}); lect.src16=a.createMediaStreamSource(lect.stream); lect.ctx16=a; }
    catch(e){ a=null; }
    if(!a){ a=ctxAudio(); ratio=a.sampleRate/16000; lect.src16=lect.src; }
    try{ await a.resume(); }catch(e){}
    const proc = a.createScriptProcessor(2048,1,1); lect.proc=proc;
    lect.src16.connect(proc); const mudo=a.createGain(); mudo.gain.value=0; proc.connect(mudo).connect(a.destination);
    let resto=[], tot=0;
    proc.onaudioprocess = ev=>{
      if(!lect || !lect.activa || lect.pausadoDesde) return;
      if(typeof programaHablando==='function' && programaHablando()) return;   // no se oye a sí mismo
      const d=ev.inputBuffer.getChannelData(0); let out;
      if(ratio===1){ out=new Int16Array(d.length); for(let i=0;i<d.length;i++){ const v=Math.max(-1,Math.min(1,d[i])); out[i]=v<0?v*0x8000:v*0x7fff; } }
      else { const n=Math.floor(d.length/ratio); out=new Int16Array(n); for(let i=0;i<n;i++){ const i0=Math.floor(i*ratio), i1=Math.min(d.length,Math.floor((i+1)*ratio)); let sum=0; for(let j=i0;j<i1;j++) sum+=d[j]; const v=Math.max(-1,Math.min(1,sum/Math.max(1,i1-i0))); out[i]=v<0?v*0x8000:v*0x7fff; } }
      resto.push(out); tot+=out.length;
      if(tot>=2400){ const junto=new Int16Array(tot); let o=0; resto.forEach(x=>{ junto.set(x,o); o+=x.length; }); resto=[]; tot=0; lect.cola.push(junto); enviarOido(); }
    };
    return true;
  }catch(e){ registrar('Oído local no disponible: '+e.message); return false; }
}
async function enviarOido(){
  const l=lect; if(!l || !l.oidoId || l.enviando) return;
  l.enviando=true;
  try{
    while(l.cola.length){
      const trozos=l.cola.splice(0); const n=trozos.reduce((a,b)=>a+b.length,0); const junto=new Int16Array(n); let o=0; trozos.forEach(x=>{ junto.set(x,o); o+=x.length; });
      const t0=performance.now(); const r=await api('/api/oido/'+l.oidoId, {method:'POST', body:junto.buffer}); const ms=performance.now()-t0;
      l.rt=l.rt||{n:0,suma:0,max:0}; l.rt.n++; l.rt.suma+=ms; l.rt.max=Math.max(l.rt.max,ms);
      l.finales=r.finales||[]; l.parcial=r.parcial||''; l.parcialT=r.parcialT||null; alinear();
    }
  }catch(e){ registrar('Oído: '+e.message); }
  l.enviando=false;
}
async function cerrarOido(l){
  if(!l || !l.oidoId) return;
  try{ while(l.enviando) await pausa(50); const r=await api('/api/oido/'+l.oidoId+'/fin',{method:'POST', body:new ArrayBuffer(0)}); l.finales=r.finales||l.finales; l.parcial=''; l.parcialT=null; }catch(e){}
}
/* --- Oído del navegador (respaldo, necesita internet) --- */
function iniciarReconocimientoNavegador(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if(!SR) return false;
  try{
    const r = new SR(); r.lang='es-ES'; r.continuous=true; r.interimResults=true; r.maxAlternatives=1;
    r.onresult=e=>{ if(!lect) return; let t=[]; for(let i=0;i<e.results.length;i++) t.push(e.results[i][0].transcript); lect.txtSesion=t.join(' '); alinear(); };
    r.onerror=e=>{ if(!lect) return; if(['not-allowed','service-not-allowed','audio-capture','network','language-not-supported'].includes(e.error)){ lect.srFallo=true; lect.oyendo=false; alinear(true); } };
    r.onend=()=>{ if(!lect) return; lect.txtPrevio += ' '+lect.txtSesion; lect.txtSesion=''; if(lect.activa && !lect.srFallo && !lect.pausadoDesde) setTimeout(()=>{ if(lect && lect.activa && !lect.pausadoDesde){ try{ r.start(); }catch(e){} } },120); };
    r.start(); lect.sr=r; return true;
  }catch(e){ return false; }
}

/* --- Seguimiento: palabra entera o sílaba a sílaba («vol-cán»), sin volver atrás --- */
const nuevoEstadoAl = () => ({ptr:0, sp:0, acc:'', ok:{}, tw:{}});
function pasoAl(st, t){
  const N=palabras.length; if(st.ptr>=N || !t.w) return;
  const cerrar=i=>{ st.ok[i]=true; st.tw[i]=t.s; st.ptr=i+1; st.sp=0; st.acc=''; st.rep=0; };
  const w=palabras[st.ptr], sil=w.sil||[];
  // 1) la palabra que toca (entera o parecida)
  if(coincide(t.w, w.norm)){ cerrar(st.ptr); return; }
  // 2) la siguiente, si ya se ha empezado la que toca o es corta
  if(st.ptr+1<N && (t.w.length>=3 || st.sp>0) && coincide(t.w, palabras[st.ptr+1].norm)){ cerrar(st.ptr+1); return; }
  // 3) sílaba a sílaba de la que toca: se admite saltarse una sílaba y repetir la última
  if(sil.length>1){
    let j=-1; for(let x=Math.max(0,st.sp-1); x<Math.min(sil.length, st.sp+2); x++){ if(t.w===sil[x] || (sil[x].length>=3 && coincide(t.w, sil[x]))){ j=x; break; } }
    if(j<0 && st.sp>0 && coincide(st.acc+t.w, w.norm)) j=sil.length-1;
    if(j<0 && st.sp>0 && w.norm.startsWith(t.w) && t.w.length>=3) j=Math.max(st.sp, Math.min(sil.length-1, j));
    if(j>=0){ if(j+1>st.sp){ st.sp=j+1; st.acc+=t.w; } if(st.sp>=sil.length || coincide(st.acc, w.norm) || (sil.length>=3 && st.sp>=sil.length-1)) cerrar(st.ptr); return; }
  }
  // 4) se ha ido más adelante: una palabra clara (4 letras o más) hasta 8 palabras después, o de 3 letras hasta 3 después
  for(let k=2; k<9 && st.ptr+k<N; k++){
    const v=palabras[st.ptr+k].norm;
    if((t.w.length>=4 && v.length>=4 && coincide(t.w, v)) || (k<4 && t.w.length===3 && t.w===v)){ cerrar(st.ptr+k); return; }
  }
  // 5) empieza la siguiente palabra sílaba a sílaba cuando la que toca ya iba por la mitad
  const sig=palabras[st.ptr+1];
  if(sig && sil.length>1 && st.sp*2>=sil.length && (sig.sil||[]).length>1 && t.w===sig.sil[0] && t.w.length>=2){ st.ok[st.ptr]=true; st.tw[st.ptr]=t.s; st.ptr++; st.sp=1; st.acc=t.w; return; }
}
function tokensNavegador(){ return (lect.txtPrevio+' '+lect.txtSesion).split(/\s+/).map(normalizar).filter(Boolean).map(w=>({w, s:null})); }
function alinear(forzarPintado){
  const l=lect; if(!l || (!l.activa && !forzarPintado)) return;
  let st;
  if(l.oidoId){
    if(!l.al){ l.al=nuevoEstadoAl(); l.nFin=0; }
    const par = (l.parcialT ? l.parcialT.map(p=>({w:normalizar(p.w), s:p.s})) : (l.parcial||'').split(/\s+/).map(w=>({w:normalizar(w), s:null}))).filter(t=>t.w);
    if(l.finales.length>l.nFin){ let salta=l.saltar||0; l.saltar=0;
      while(l.nFin<l.finales.length){ const f=l.finales[l.nFin++]; if(salta>0){ salta--; continue; } pasoAl(l.al, {w:normalizar(f.w), s:f.s}); } }
    if(l.forzado!=null && l.forzado>l.al.ptr){ l.al.ptr=l.forzado; l.al.sp=0; l.al.acc=''; l.saltar=Math.max(l.saltar||0, l.parcialVisto||0); }
    st={ptr:l.al.ptr, sp:l.al.sp, acc:l.al.acc, ok:{...l.al.ok}, tw:{...l.al.tw}};
    par.slice(l.saltar||0).forEach(t=>pasoAl(st, t)); l.parcialVisto=par.length;
  } else {
    st=nuevoEstadoAl(); if(l.sr) tokensNavegador().forEach(t=>pasoAl(st, t));
    if(l.forzado!=null && l.forzado>st.ptr){ st.ptr=l.forzado; st.sp=0; st.acc=''; }
  }
  const ahora=tLect();
  palabras.forEach((w,i)=>{ if(st.ok[i] && l.tOk[i]==null){ l.tOk[i] = st.tw[i]!=null ? st.tw[i] : ahora; if(st.tw[i]!=null){ (l.retrasos=l.retrasos||[]).push(Math.max(0, ahora-st.tw[i])); } } });
  l.ok=palabras.map((w,i)=>!!st.ok[i]); l.puntero=st.ptr; l.spActual=st.sp;
  pintarSeguimiento(st.ptr, st.sp);
  if(typeof turnoJuntos==='function') turnoJuntos(st.ptr);
  if(st.ptr>=palabras.length && !l.finPendiente && l.activa){ l.finPendiente=true; setTimeout(()=>{ if(lect===l && l.activa) terminarDeLeer(); }, 1100); }
}
/* pinta: verde lo leído (también sílaba a sílaba), subrayado azul la palabra que toca */
function pintarSeguimiento(ptr, sp){
  const oye = lect && lect.oyendo;
  palabras.forEach((w,i)=>{
    w.el.classList.toggle('leida', i<ptr);
    w.el.classList.toggle('actual', i===ptr && !!oye);
    const ss=w.sylEls||[]; let n=0;
    if(i===ptr && sp>0 && (w.sil||[]).length>1) n=Math.min(ss.length-1, Math.max(1, Math.round(sp/w.sil.length*ss.length)));
    ss.forEach((s,k)=>s.classList.toggle('ok', i<ptr || k<n));
  });
  const bar=$('#progLect'); if(bar) bar.style.width = Math.round(100*Math.min(ptr,palabras.length)/Math.max(1,palabras.length))+'%';
}
/* Papá o mamá pueden avanzar a mano si el oído se atasca: barra espaciadora o flecha → */
document.addEventListener('keydown', e=>{
  if(actual!=='lectura' || !lect || !lect.activa || lect.pausadoDesde) return;
  if(e.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) && e.key===' ') return;
  if(e.key===' ' || e.key==='ArrowRight'){ e.preventDefault(); lect.forzado=(lect.puntero||0)+1; alinear(); }
});

/* --- Escuchar una respuesta corta (repaso de fichas): Vosk en ese idioma o el reconocimiento del navegador --- */
let escuchaActual=null;
function pararEscucha(){ if(escuchaActual){ escuchaActual.parar(); escuchaActual=null; } }
async function escucharUna({idioma='es', palabras=[], maxSeg=6, silencio=1300, comprobar=()=>false, alNivel=null, alTexto=null}={}){
  pararEscucha();
  let cancelada=false; const previa={parar:()=>{ cancelada=true; }}; escuchaActual=previa;
  let st; try{ st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}}); }catch(e){ if(escuchaActual===previa) escuchaActual=null; return {sinMic:!cancelada, texto:''}; }
  if(cancelada){ st.getTracks().forEach(t=>t.stop()); return {texto:'', ok:false}; }
  return new Promise(async res=>{
    const u={fin:false, texto:'', finales:[], parcial:''}; let ctx=null, proc=null, sr=null, t0=performance.now(), ultimaVoz=0, habla=false;
    const terminar=async ok=>{ if(u.fin) return; u.fin=true; try{ proc&&proc.disconnect(); }catch(e){} try{ sr&&sr.abort(); }catch(e){}
      if(u.id){ try{ const r=await api('/api/oido/'+u.id+'/fin',{method:'POST', body:new ArrayBuffer(0)}); u.finales=r.finales||u.finales; }catch(e){} }
      st.getTracks().forEach(t=>t.stop()); try{ fuenteNivel.disconnect(); }catch(e){} try{ ctx&&ctx.close(); }catch(e){}
      const texto = u.id ? u.finales.map(f=>f.w).join(' ') + (u.parcial?' '+u.parcial:'') : u.texto;
      escuchaActual=null; res({texto:texto.trim(), ok: ok || comprobar(texto)}); };
    escuchaActual={parar:()=>terminar(false)};
    const a=ctxAudio(); try{ await a.resume(); }catch(e){} const an=a.createAnalyser(); an.fftSize=512; const fuenteNivel=a.createMediaStreamSource(st); fuenteNivel.connect(an);
    (function vigila(){ if(u.fin) return; const v=nivel(an); alNivel && alNivel(v); const ahora=performance.now();
      if(v>0.08){ habla=true; ultimaVoz=ahora; }
      if(ahora-t0>maxSeg*1000 || (habla && ahora-ultimaVoz>silencio)) { setTimeout(()=>terminar(false), 250); return; }
      requestAnimationFrame(vigila); })();
    if((EST.oidos||[]).includes(idioma)){
      try{
        const r=await postJSON('/api/oido/inicio', {palabras, idioma}); u.id=r.id;
        let ratio=1; try{ ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000}); }catch(e){ ctx=null; }
        const c = ctx || a; if(!ctx) ratio=a.sampleRate/16000; try{ await c.resume(); }catch(e){}
        proc=c.createScriptProcessor(2048,1,1); c.createMediaStreamSource(st).connect(proc); const mudo=c.createGain(); mudo.gain.value=0; proc.connect(mudo).connect(c.destination);
        let cola=[], enviando=false, tot=0, resto=[];
        const enviar=async()=>{ if(enviando||u.fin) return; enviando=true;
          while(cola.length && !u.fin){ const tr=cola.splice(0); const n=tr.reduce((x,y)=>x+y.length,0); const j=new Int16Array(n); let o=0; tr.forEach(x=>{ j.set(x,o); o+=x.length; });
            try{ const r=await api('/api/oido/'+u.id,{method:'POST', body:j.buffer}); u.finales=r.finales||[]; u.parcial=r.parcial||'';
              const txt=u.finales.map(f=>f.w).join(' ')+' '+u.parcial; alTexto && alTexto(txt); if(comprobar(txt)){ terminar(true); break; } }catch(e){ break; } }
          enviando=false; };
        proc.onaudioprocess=ev=>{ if(u.fin) return; const d=ev.inputBuffer.getChannelData(0); let out;
          if(ratio===1){ out=new Int16Array(d.length); for(let i=0;i<d.length;i++){ const v=Math.max(-1,Math.min(1,d[i])); out[i]=v<0?v*0x8000:v*0x7fff; } }
          else { const n=Math.floor(d.length/ratio); out=new Int16Array(n); for(let i=0;i<n;i++){ const v=Math.max(-1,Math.min(1,d[Math.floor(i*ratio)])); out[i]=v<0?v*0x8000:v*0x7fff; } }
          resto.push(out); tot+=out.length; if(tot>=2400){ const j=new Int16Array(tot); let o=0; resto.forEach(x=>{ j.set(x,o); o+=x.length; }); resto=[]; tot=0; cola.push(j); enviar(); } };
        return;
      }catch(e){ u.id=null; registrar('Escucha local ('+idioma+'): '+e.message); }
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ return; }
    try{ sr=new SR(); sr.lang=LANG_TAG[idioma]||'es-ES'; sr.continuous=silencio>1500; sr.interimResults=true; sr.maxAlternatives=3;
      sr.onresult=e=>{ let t=[], m=[]; for(let i=0;i<e.results.length;i++){ m.push(e.results[i][0].transcript); for(let k=0;k<e.results[i].length;k++) t.push(e.results[i][k].transcript); } u.texto=(alTexto?m:t).join(' '); alTexto && alTexto(u.texto); if(comprobar(u.texto)) terminar(true); };
      sr.onerror=()=>{}; sr.start(); }catch(e){}
  });
}
/* ¿ha dicho la respuesta? todas las palabras con contenido de la respuesta deben aparecer */
const VACIAS = new Set(['the','a','an','to','of','o','os','as','el','la','los','las','un','una','de','do','da']);
function diceRespuesta(texto, respuesta){
  const oido=String(texto).split(/\s+/).map(normalizar).filter(Boolean);
  const obj=String(respuesta).split(/\s+/).map(normalizar).filter(w=>w && !VACIAS.has(w));
  if(!obj.length) return false;
  return obj.every(w=>oido.some(t=>coincide(t,w) || (w.length<=4 && t===w) || (w.endsWith('s') && coincide(t, w.slice(0,-1)))));
}
