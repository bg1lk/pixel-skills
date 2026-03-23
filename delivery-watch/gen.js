const fs=require('fs'),p=require('path');
fs.writeFileSync(p.join(__dirname,'app.html'),`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>\u5FEB\u9012\u76D1\u63A7</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f380f;color:#8bac0f;font-family:'Courier New',Consolas,monospace;min-height:100vh;display:flex;flex-direction:column;align-items:center}.title-bar{width:100%;max-width:720px;background:#306230;border:3px solid #0f380f;border-bottom:none;padding:6px 12px;text-align:center;font-size:18px;font-weight:bold;color:#9bbc0f;text-shadow:2px 2px 0 #0f380f;margin-top:8px}.main{width:100%;max-width:720px;background:#1a4a1a;border:3px solid #306230;box-shadow:6px 6px 0 #0f380f;padding:12px;display:flex;flex-direction:column;gap:10px}.cam-box{position:relative;width:100%;background:#000;border:3px solid #306230;overflow:hidden}.cam-box canvas{width:100%;display:block}.cam-box.alert{border-color:#e63946;box-shadow:0 0 20px #e63946}.banner{display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#e63946;color:#fff;font-size:20px;font-weight:bold;padding:8px 20px;border:3px solid #0f380f;animation:blink .3s steps(1) infinite}@keyframes blink{50%{opacity:0}}.panel{background:#0f380f;border:2px solid #306230;padding:8px}.stats{display:flex;gap:10px;flex-wrap:wrap;font-size:11px}.stats div{flex:1;min-width:100px}.motion-bar{background:#306230;height:8px;border:1px solid #0f380f;margin-top:2px}.motion-fill{background:#8bac0f;height:100%;width:0%;transition:width .2s steps(5)}.btn-row{display:flex;gap:6px;flex-wrap:wrap}button{background:#8bac0f;color:#0f380f;border:3px solid #0f380f;box-shadow:4px 4px 0 #306230;font-family:monospace;font-size:12px;font-weight:bold;padding:6px 12px;cursor:pointer}button:hover{background:#9bbc0f;transform:translate(2px,2px);box-shadow:2px 2px 0 #306230}button:active{transform:translate(4px,4px);box-shadow:none}.tag-btn{font-size:10px;padding:2px 6px;box-shadow:2px 2px 0 #306230}.log{max-height:250px;overflow-y:auto;display:flex;flex-direction:column;gap:6px}.log-item{display:flex;gap:8px;align-items:center;background:#1a4a1a;border:1px solid #306230;padding:4px}.log-item img{width:60px;height:45px;object-fit:cover;border:1px solid #306230;image-rendering:pixelated}.log-info{flex:1;font-size:10px}.log-tags{display:flex;gap:3px}label{font-size:11px;color:#306230;display:flex;align-items:center;gap:6px}input[type=range]{width:100px;accent-color:#8bac0f}video{display:none}</style></head>
<body><div class="title-bar">\u2605 \u5FEB\u9012\u76D1\u63A7 \u2605</div><div class="main">
<div class="cam-box" id="camBox"><canvas id="cv"></canvas><div class="banner" id="alertBanner">\u26A0 \u6709\u4EBA\u6765\u4E86\uFF01</div></div>
<div class="panel"><div class="stats">
<div>\u8FD0\u52A8\u7B49\u7EA7: <div class="motion-bar"><div class="motion-fill" id="motionBar"></div></div></div>
<div>\u4ECA\u65E5\u68C0\u6D4B: <span id="totalDet">0</span> \u6B21</div>
<div>\u6700\u8FD1: <span id="lastDet">\u65E0</span></div>
</div></div>
<div class="panel"><label>\u7075\u654F\u5EA6: <input type="range" id="sens" min="1" max="10" value="5"><span id="sensV">5</span></label></div>
<div class="btn-row">
<button onclick="startCam()">\u25B6 \u5F00\u542F\u76D1\u63A7</button>
<button onclick="setBackground()">\u25C6 \u8BBE\u7F6E\u80CC\u666F</button>
<button onclick="soundOn=!soundOn">\u266A \u58F0\u97F3</button>
</div>
<div class="panel"><div class="log" id="logList">\u6682\u65E0\u68C0\u6D4B\u8BB0\u5F55</div></div></div>
<video id="vid" playsinline muted></video><canvas id="tmp" style="display:none"></canvas>
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),vid=document.getElementById('vid');
const tmp=document.getElementById('tmp'),tCtx=tmp.getContext('2d');
let stream=null,running=false,bgFrame=null,sensitivity=5,soundOn=true;
let totalDetections=0,lastDetTime=null,cooldown=false,events=[];
document.getElementById('sens').oninput=function(){sensitivity=+this.value;document.getElementById('sensV').textContent=this.value};
const audioCtx=new(window.AudioContext||window.webkitAudioContext)();
function doorbell(){if(!soundOn)return;const freqs=[659,784,880,784,659];freqs.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='square';o.frequency.value=f;g.gain.value=0.1;o.start(audioCtx.currentTime+i*0.12);o.stop(audioCtx.currentTime+i*0.12+0.1)})}
async function startCam(){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:640},height:{ideal:480}},audio:false});vid.srcObject=stream;await vid.play();cv.width=320;cv.height=240;tmp.width=160;tmp.height=120;running=true;requestAnimationFrame(loop)}catch(e){alert('\u6444\u50CF\u5934\u542F\u52A8\u5931\u8D25: '+e.message)}}
function setBackground(){tCtx.drawImage(vid,0,0,160,120);bgFrame=tCtx.getImageData(0,0,160,120)}
function loop(){if(!running)return;
ctx.drawImage(vid,0,0,320,240);
// Motion detection at low res
tCtx.drawImage(vid,0,0,160,120);
const cur=tCtx.getImageData(0,0,160,120);
if(bgFrame){
let diff=0,total=cur.data.length/4;
for(let i=0;i<cur.data.length;i+=4){
const dr=Math.abs(cur.data[i]-bgFrame.data[i]);
const dg=Math.abs(cur.data[i+1]-bgFrame.data[i+1]);
const db=Math.abs(cur.data[i+2]-bgFrame.data[i+2]);
if((dr+dg+db)/3>25)diff++}
const pct=diff/total*100;
document.getElementById('motionBar').style.width=Math.min(100,pct*5)+'%';
const thr=12-sensitivity;
if(pct>thr&&!cooldown){triggerAlert()}}
requestAnimationFrame(loop)}
function triggerAlert(){
cooldown=true;totalDetections++;
const now=new Date();
lastDetTime=now.toLocaleTimeString();
document.getElementById('totalDet').textContent=totalDetections;
document.getElementById('lastDet').textContent=lastDetTime;
// Capture photo
const capCv=document.createElement('canvas');capCv.width=320;capCv.height=240;
capCv.getContext('2d').drawImage(vid,0,0,320,240);
const dataUrl=capCv.toDataURL('image/jpeg',0.7);
events.unshift({time:now.toLocaleTimeString(),img:dataUrl,tag:''});
if(events.length>30)events.pop();
// Alert UI
doorbell();
const box=document.getElementById('camBox');box.classList.add('alert');
const banner=document.getElementById('alertBanner');banner.style.display='block';
setTimeout(()=>{box.classList.remove('alert');banner.style.display='none'},3000);
renderLog();
setTimeout(()=>{cooldown=false},10000)}
function renderLog(){
const el=document.getElementById('logList');
if(events.length===0){el.innerHTML='\u6682\u65E0\u68C0\u6D4B\u8BB0\u5F55';return}
el.innerHTML=events.map((ev,i)=>'<div class="log-item"><img src="'+ev.img+'"><div class="log-info">'+ev.time+(ev.tag?' ['+ev.tag+']':'')+'</div><div class="log-tags"><button class="tag-btn" onclick="tagEv('+i+',\\'\\u5FEB\\u9012\\')">\u5FEB\u9012</button><button class="tag-btn" onclick="tagEv('+i+',\\'\\u8DEF\\u4EBA\\')">\u8DEF\u4EBA</button><button class="tag-btn" onclick="tagEv('+i+',\\'\\u5176\\u5B83\\')">\u5176\u5B83</button></div></div>').join('')}
function tagEv(i,tag){events[i].tag=tag;renderLog()}
<\/script></body></html>`);
console.log('delivery-watch OK');