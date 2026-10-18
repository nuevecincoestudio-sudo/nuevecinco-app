const { chromium } = require('playwright');const fs=require('fs');const path=require('path');const {execFileSync}=require('child_process');
(async()=>{const mode=process.argv[2]||'preview';const only=process.argv[3];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--allow-file-access-from-files']});
const p=await b.newPage({viewport:{width:540,height:960}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+path.resolve('reels.html'));await p.evaluate(()=>window.ready);
const durs=await p.evaluate(()=>window.durs);
const out=path.resolve('..');
for(const id of Object.keys(durs)){ if(only&&id!==only)continue;
  if(mode==='preview'){const ts=id==='ciudad'?[.6,1.2,2.0,2.4,4.2,6.4,7.4,9.6,12.4,14.2,15.8,16.5]:id==='resumen'?[.5,1.3,2.0,2.9,4.6,6.8,9.4,11.6,14.0,16.3,18.7,19.95]:[.6,1.6,2.6,3.6,4.6,5.6,6.6,7.6,8.6,9.6,durs[id]-1.4,durs[id]-.05];
    const dir=`/tmp/prev/${id}`;fs.mkdirSync(dir,{recursive:true});
    for(const [i,t] of ts.entries()){const d=await p.evaluate(([id,t])=>window.frame(id,t,.7),[id,t]);fs.writeFileSync(`${dir}/${String(i).padStart(2,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'))}
    execFileSync('ffmpeg',['-y','-loglevel','error','-pattern_type','glob','-i',`${dir}/*.jpg`,'-vf','scale=270:480,tile=6x2',`/tmp/prev/${id}.jpg`]);
  } else {
    const dir=`/tmp/frames/${id}`;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
    const n=Math.round(durs[id]*30);
    for(let i=0;i<n;i++){const d=await p.evaluate(([id,t])=>window.frame(id,t),[id,i/30]);fs.writeFileSync(`${dir}/${String(i).padStart(4,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'))}
    execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','30','-i',`${dir}/%04d.jpg`,'-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-movflags','+faststart',`${out}/reel-${id}.mp4`]);
  }}
console.log(errs.length?errs.join('\n'):'sin errores');await b.close()})();
