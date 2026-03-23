const fs=require('fs'),p=require('path');
fs.writeFileSync(p.join(__dirname,'app.html'),`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>\u79BB\u5E2D\u81EA\u52A8\u9501\u5C4F</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f380f;color:#8bac0f;font-family:'Courier New',Consolas,monospace;min-height:100vh;display:flex;flex-direction:column;align-items:center}.title-bar{width:100%;max-width:720px;background:#306230;border:3px solid #0f380f;border-bottom:none;padding:6px 12px;text-align:center;font-size:18px;font-weight:bold;color:#9bbc0f;text-shadow:2px 2px 0 #0f380f;margin-top:8px}.main{width:100%;max-width:720px;background:#1a4a1a;border:3px solid #306230;box-shadow:6px 6px 0 #0f380f;padding:12px;display:flex;flex-direction:column;gap:10px}.cam-box{width:160px;height:120px;background:#000;border:3px solid #306230;overflow:hidden;margin:0 auto}.cam-box video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}.panel{background:#0f380f;border:2px solid #306230;padding:8px}.status-big{text-align:center;font-size:28px;font-weight:bold;padding:10px}.status-big.present{color:#58d854}.status-big.away{color:#e63946;animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:.5}}.bar{background:#306230;height:10px;border:1px solid #0f380f;margin:4px 0}.bar-fill{background:#8bac0f;height:100%;transition:width .3s steps(5)}.btn-row{display:flex;gap:6px;flex-wrap:wrap}button{background:#8bac0f;color:#0f380f;border:3px solid #0f380f;box-shadow:4px 4px 0 #306230;font-family:monospace;font-size:12px;font-weight:bold;padding:6px 12px;cursor:pointer}button:hover{background:#9bbc0f;transform:translate(2px,2px);box-shadow:2px 2px 0 #306230}button:active{transform:translate(4px,4px);box-shadow:none}label{font-size:11px;color:#306230;display:flex;align-items:center;gap:6px}input[type=range]{width:100px;accent-color:#8bac0f}input[type=password]{background:#0f380f;color:#8bac0f;border:2px solid #306230;padding:4px 8px;font-family:monospace;font-size:16px;width:80px;text-align:center;letter-spacing:4px}.log{max-height:150px;overflow-y:auto;font-size:10px}.log div{padding:2px 0;border-bottom:1px solid #1a4a1a}.stats-row{display:flex;gap:12px;font-size:11px;flex-wrap:wrap}
/* Lock screen overlay */
.lock-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:#0a0a2e;z-index:9999;flex-direction:column;align-items:center;justify-content:center;color:#8bac0f;font-family:monospace}.lock-overlay.active{display:flex}.lock-time{font-size:48px;font-weight:bold;color:#9bbc0f;text-shadow:3px 3px 0 #0f380f;margin:20px 0}.lock-msg{font-size:16px;color:#306230;margin:10px 0}.lock-away{font-size:14px;color:#e63946}.lock-padlock{font-size:60px;margin:10px 0}.lock-pin{margin:20px 0;display:flex;flex-direction:column;align-items:center;gap:8px}.rain{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:.15;overflow:hidden}video{display:none}</style></head>
<body>
<div class="lock-overlay" id="lockScreen">
<canvas id="rainCv" class="rain"></canvas>
<div class="lock-padlock">\u{1F512}</div>
<div class="lock-time" id="lockTime">00:00</div>
<div class="lock-msg">\u4E3B\u4EBA\u79BB\u5F00\u4E86...</div>
<div class="lock-away" id="lockAway">\u5DF2\u79BB\u5E2D 0 \u79D2</div>
<div class="lock-pin"><input type="password" id="pinInput" maxlength="4" placeholder="PIN" onkeyup="checkPin()"><div style="font-size:10px;color:#306230">\u8F93\u5165PIN\u89E3\u9501 (\u9ED8\u8BA40000)</div></div>
</div>
<div class="title-bar">\u2605 \u79BB\u5E2D\u81EA\u52A8\u9501\u5C4F \u2605</div><div class="main">
<div class="cam-box"><video id="vid" playsinline muted></video></div>
<div class="panel">
<div class="status-big present" id="statusText">\u2714 \u5728\u5E2D</div>
<div style="font-size:10px;text-align:center">\u80A4\u8272\u68C0\u6D4B: <span id="skinPct">0</span>%</div>
<div class="bar"><div class="bar-fill" id="skinBar" style="width:0%"></div></div>
</div>
<div class="panel">
<label>\u79BB\u5E2D\u8D85\u65F6: <input type="range" id="timeout" min="15" max="120" value="30" step="15"><span id="timeoutV">30</span>\u79D2</label>
<label>\u68C0\u6D4B\u9608\u503C: <input type="range" id="thresh" min="1" max="15" value="5"><span id="threshV">5</span>%</label>
<label>PIN\u7801: <input type="password" id="pinSet" maxlength="4" value="0000" style="width:60px"></label>
</div>
<div class="btn-row">
<button onclick="startCam()">\u25B6 \u5F00\u59CB\u76D1\u63A7</button>
<button onclick="paused=!paused;this.textContent=paused?'\u25B6 \u6062\u590D':'\u23F8 \u6682\u505C'">\u23F8 \u6682\u505C</button>
<button onclick="soundOn=!soundOn">\u266A \u58F0\u97F3</button>
</div>
<div class="panel"><div class="stats-row">
<div>\u4ECA\u65E5\u9501\u5C4F: <b id="lockCount">0</b> \u6B21</div>
<div>\u6700\u957F\u79BB\u5E2D: <b id="maxAway">0</b>\u79D2</div>
<div>\u5728\u5E2D\u7387: <b id="presRate">100</b>%</div>
</div></div>
<div class="panel"><div class="log" id="logList">\u7B49\u5F85\u5F00\u59CB...</div></div>
</div>
<canvas id="tmpCv" style="display:none"></canvas>
<script>
const vid=document.getElementById('vid'),tmpCv=document.getElementById('tmpCv'),tmpCtx=tmpCv.getContext('2d');
const rainCv=document.getElementById('rainCv'),rainCtx=rainCv.getContext('2d');
let stream=null,running=false,paused=false,soundOn=true;
let present=true,awayStart=null,lockTimeout=30,skinThresh=5;
let lockCount=0,maxAway=0,totalPresent=0,totalAway=0,lastTick=Date.now();
let logs=[];
const audioCtx=new(window.AudioContext||window.webkitAudioContext)();
function beep(f,d,type='square'){if(!soundOn)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type=type;o.frequency.value=f;g.gain.value=0.08;o.start();o.stop(audioCtx.currentTime+d)}
function lockSound(){beep(200,0.15);setTimeout(()=>beep(150,0.2),150)}
function unlockSound(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.1,'sine'),i*80))}
document.getElementById('timeout').oninput=function(){lockTimeout=+this.value;document.getElementById('timeoutV').textContent=this.value};
document.getElementById('thresh').oninput=function(){skinThresh=+this.value;document.getElementById('threshV').textContent=this.value};
async function startCam(){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:320},height:{ideal:240}},audio:false});vid.srcObject=stream;vid.style.display='block';await vid.play();tmpCv.width=160;tmpCv.height=120;rainCv.width=window.innerWidth;rainCv.height=window.innerHeight;running=true;addLog('\u76D1\u63A7\u5DF2\u5F00\u59CB');requestAnimationFrame(loop)}catch(e){alert('\u6444\u50CF\u5934\u542F\u52A8\u5931\u8D25: '+e.message)}}
// Matrix rain
const drops=[];for(let i=0;i<50;i++)drops.push({x:Math.random()*800,y:Math.random()*600,s:Math.random()*10+5});
function drawRain(){rainCtx.fillStyle='rgba(10,10,46,0.1)';rainCtx.fillRect(0,0,rainCv.width,rainCv.height);rainCtx.fillStyle='#8bac0f';rainCtx.font='12px monospace';drops.forEach(d=>{const ch=String.fromCharCode(0x30A0+Math.random()*96);rainCtx.fillText(ch,d.x,d.y);d.y+=d.s;if(d.y>rainCv.height){d.y=0;d.x=Math.random()*rainCv.width}})}
function loop(){if(!running)return;
const now=Date.now(),dt=(now-lastTick)/1000;lastTick=now;
if(!paused){
// Skin detection
tmpCtx.save();tmpCtx.translate(tmpCv.width,0);tmpCtx.scale(-1,1);
tmpCtx.drawImage(vid,0,0,tmpCv.width,tmpCv.height);tmpCtx.restore();
const img=tmpCtx.getImageData(0,0,160,120);
// Center 40% region
const cx=Math.floor(160*0.3),cy=Math.floor(120*0.3),cw=Math.floor(160*0.4),ch=Math.floor(120*0.4);
let skinPx=0,total=0;
for(let y=cy;y<cy+ch;y++)for(let x=cx;x<cx+cw;x++){
const i=(y*160+x)*4;const r=img.data[i],g=img.data[i+1],b=img.data[i+2];
if(r>80&&g>50&&b>30&&r>g&&r>b)skinPx++;total++}
const pct=Math.round(skinPx/total*100);
document.getElementById('skinPct').textContent=pct;
document.getElementById('skinBar').style.width=Math.min(100,pct*3)+'%';
const wasPresent=present;
present=pct>=skinThresh;
if(present){
totalPresent+=dt;
if(!wasPresent&&awayStart){
// Welcome back!
const awayDur=Math.round((now-awayStart)/1000);
if(awayDur>=lockTimeout){hideLock();unlockSound();addLog('\u6B22\u8FCE\u56DE\u6765! \u79BB\u5F00\u4E86'+awayDur+'\u79D2')}
awayStart=null}
document.getElementById('statusText').textContent='\u2714 \u5728\u5E2D';
document.getElementById('statusText').className='status-big present';
}else{
totalAway+=dt;
if(wasPresent&&!awayStart){awayStart=now}
if(awayStart){
const awayDur=Math.round((now-awayStart)/1000);
document.getElementById('statusText').textContent='\u26A0 \u79BB\u5E2D '+awayDur+'s';
document.getElementById('statusText').className='status-big away';
if(awayDur>=lockTimeout&&!isLocked()){showLock();lockSound();lockCount++;addLog('\u5DF2\u9501\u5C4F (\u79BB\u5E2D'+lockTimeout+'\u79D2)');if(awayDur>maxAway)maxAway=awayDur}}
}
// Update lock screen
if(isLocked()){
const d=new Date();document.getElementById('lockTime').textContent=d.toLocaleTimeString();
if(awayStart)document.getElementById('lockAway').textContent='\u5DF2\u79BB\u5E2D '+Math.round((now-awayStart)/1000)+' \u79D2';
drawRain()}
// Stats
document.getElementById('lockCount').textContent=lockCount;
document.getElementById('maxAway').textContent=maxAway;
const totalT=totalPresent+totalAway;
document.getElementById('presRate').textContent=totalT>0?Math.round(totalPresent/totalT*100):100;
}
requestAnimationFrame(loop)}
function isLocked(){return document.getElementById('lockScreen').classList.contains('active')}
function showLock(){document.getElementById('lockScreen').classList.add('active');document.getElementById('pinInput').value=''}
function hideLock(){document.getElementById('lockScreen').classList.remove('active')}
function checkPin(){const pin=document.getElementById('pinInput').value;const setPin=document.getElementById('pinSet').value||'0000';if(pin===setPin){hideLock();unlockSound();addLog('\u624B\u52A8PIN\u89E3\u9501')}}
function addLog(msg){const t=new Date().toLocaleTimeString();logs.unshift(t+' - '+msg);if(logs.length>50)logs.pop();
document.getElementById('logList').innerHTML=logs.map(l=>'<div>'+l+'</div>').join('')}
<\/script></body></html>`);
console.log('away-lock OK');