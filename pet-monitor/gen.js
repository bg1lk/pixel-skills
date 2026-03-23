const fs=require('fs'),p=require('path');
fs.writeFileSync(p.join(__dirname,'app.html'),`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>\u5BA0\u7269\u76D1\u63A7</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f380f;color:#8bac0f;font-family:'Courier New',Consolas,monospace;min-height:100vh;display:flex;flex-direction:column;align-items:center}.title-bar{width:100%;max-width:720px;background:#306230;border:3px solid #0f380f;border-bottom:none;padding:6px 12px;text-align:center;font-size:18px;font-weight:bold;color:#9bbc0f;text-shadow:2px 2px 0 #0f380f;margin-top:8px}.main{width:100%;max-width:720px;background:#1a4a1a;border:3px solid #306230;box-shadow:6px 6px 0 #0f380f;padding:12px;display:flex;flex-direction:column;gap:10px}.cam-box{position:relative;width:100%;background:#000;border:3px solid #306230;overflow:hidden}.cam-box canvas{width:100%;display:block}.panel{background:#0f380f;border:2px solid #306230;padding:8px}.stats{display:flex;gap:10px;flex-wrap:wrap;font-size:11px}.stats div{flex:1;min-width:80px}.motion-bar{background:#306230;height:10px;border:1px solid #0f380f;margin:4px 0}.motion-fill{background:#8bac0f;height:100%;width:0%;transition:width .2s steps(5)}.btn-row{display:flex;gap:6px;flex-wrap:wrap}button{background:#8bac0f;color:#0f380f;border:3px solid #0f380f;box-shadow:4px 4px 0 #306230;font-family:monospace;font-size:12px;font-weight:bold;padding:6px 12px;cursor:pointer}button:hover{background:#9bbc0f;transform:translate(2px,2px);box-shadow:2px 2px 0 #306230}button:active{transform:translate(4px,4px);box-shadow:none}.tab-row{display:flex;gap:0}.tab{background:#306230;color:#8bac0f;border:3px solid #0f380f;padding:6px 12px;cursor:pointer;font-family:monospace;font-size:12px;font-weight:bold}.tab.active{background:#8bac0f;color:#0f380f}.timeline{display:flex;gap:4px;overflow-x:auto;padding:4px 0}.timeline img{width:60px;height:45px;object-fit:cover;border:2px solid #306230;cursor:pointer;image-rendering:pixelated}.timeline img:hover{border-color:#8bac0f}.heatmap{display:flex;gap:2px;align-items:flex-end;height:60px}.heatmap-bar{width:12px;background:#8bac0f;border:1px solid #0f380f;min-height:2px}label{font-size:11px;color:#306230;display:flex;align-items:center;gap:6px}input[type=range]{width:100px;accent-color:#8bac0f}video{display:none}.report{display:none}.report.active{display:block}</style></head>
<body><div class="title-bar">\u2605 \u5BA0\u7269\u76D1\u63A7 \u2605</div><div class="main">
<div class="tab-row"><div class="tab active" onclick="showTab(0,this)">\u76D1\u63A7\u4E2D</div><div class="tab" onclick="showTab(1,this)">\u5BA0\u7269\u65E5\u62A5</div></div>
<div id="monitorView">
<div class="cam-box"><canvas id="cv"></canvas></div>
<div class="panel"><div class="stats">
<div>\u8FD0\u52A8\u7B49\u7EA7: <div class="motion-bar"><div class="motion-fill" id="motionBar"></div></div></div>
<div>\u68C0\u6D4B\u6B21\u6570: <b id="detCount">0</b></div>
<div>\u72B6\u6001: <span id="monStatus">\u5F85\u673A</span></div>
</div></div>
<div class="panel"><label>\u7075\u654F\u5EA6: <input type="range" id="sens" min="1" max="10" value="5"><span id="sensV">5</span></label></div>
<div class="btn-row">
<button onclick="startMon()">\u25B6 \u5F00\u59CB\u76D1\u63A7</button>
<button onclick="stopMon()">\u25A0 \u505C\u6B62</button>
<button onclick="soundOn=!soundOn">\u266A \u58F0\u97F3</button>
</div>
<div class="panel"><div style="font-size:11px;color:#306230;margin-bottom:4px">\u6D3B\u52A8\u65F6\u95F4\u7EBF:</div><div class="timeline" id="timeline">\u6682\u65E0\u622A\u56FE</div></div>
</div>
<div id="reportView" class="report">
<div class="panel" style="text-align:center;font-size:14px;margin-bottom:8px">\u{1F43E} \u5BA0\u7269\u65E5\u62A5 \u{1F43E}</div>
<div class="panel"><div class="stats">
<div>\u603B\u6D3B\u52A8\u6B21\u6570: <b id="rTotal">0</b></div>
<div>\u6700\u6D3B\u8DC3\u65F6\u6BB5: <b id="rPeak">-</b></div>
<div>\u76D1\u63A7\u65F6\u957F: <b id="rDur">0</b>\u5206</div>
</div></div>
<div class="panel"><div style="font-size:11px;color:#306230;margin-bottom:4px">\u6BCF\u5C0F\u65F6\u6D3B\u52A8\u70ED\u529B\u56FE:</div><div class="heatmap" id="heatmap"></div><div style="font-size:9px;color:#306230;margin-top:2px;display:flex;justify-content:space-between"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div></div>
<div class="panel"><div style="font-size:11px;color:#306230;margin-bottom:4px">\u6240\u6709\u622A\u56FE:</div><div class="timeline" id="reportTimeline" style="flex-wrap:wrap">\u6682\u65E0</div></div>
<div class="btn-row"><button onclick="exportAll()">\u25C6 \u4E0B\u8F7D\u6240\u6709\u622A\u56FE</button></div>
</div></div>
<video id="vid" playsinline muted></video><canvas id="tmp" style="display:none"></canvas>
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),vid=document.getElementById('vid');
const tmp=document.getElementById('tmp'),tCtx=tmp.getContext('2d');
let stream=null,running=false,soundOn=true,sensitivity=5;
let prevFrame=null,detCount=0,events=[],hourlyData=new Array(24).fill(0);
let startTime=null,cooldown=false;
const audioCtx=new(window.AudioContext||window.webkitAudioContext)();
function petSound(){if(!soundOn)return;const freqs=[880,1100,880];freqs.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='square';o.frequency.value=f;g.gain.value=0.06;o.start(audioCtx.currentTime+i*0.08);o.stop(audioCtx.currentTime+i*0.08+0.06)})}
document.getElementById('sens').oninput=function(){sensitivity=+this.value;document.getElementById('sensV').textContent=this.value};
function showTab(i,el){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');
document.getElementById('monitorView').style.display=i===0?'block':'none';
document.getElementById('reportView').className=i===1?'report active':'report';
if(i===1)renderReport()}
async function startMon(){try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:640},height:{ideal:480}},audio:false});vid.srcObject=stream;await vid.play();cv.width=320;cv.height=240;tmp.width=160;tmp.height=120;running=true;startTime=Date.now();document.getElementById('monStatus').textContent='\u76D1\u63A7\u4E2D...';prevFrame=null;requestAnimationFrame(loop)}catch(e){alert('\u6444\u50CF\u5934\u542F\u52A8\u5931\u8D25: '+e.message)}}
function stopMon(){running=false;if(stream)stream.getTracks().forEach(t=>t.stop());document.getElementById('monStatus').textContent='\u5DF2\u505C\u6B62'}
function loop(){if(!running)return;
ctx.drawImage(vid,0,0,320,240);
tCtx.drawImage(vid,0,0,160,120);
const cur=tCtx.getImageData(0,0,160,120);
if(prevFrame){
let diff=0,total=cur.data.length/4;
for(let i=0;i<cur.data.length;i+=4){
const dr=Math.abs(cur.data[i]-prevFrame.data[i]);
const dg=Math.abs(cur.data[i+1]-prevFrame.data[i+1]);
const db=Math.abs(cur.data[i+2]-prevFrame.data[i+2]);
if((dr+dg+db)/3>20)diff++}
const pct=diff/total*100;
document.getElementById('motionBar').style.width=Math.min(100,pct*5)+'%';
const thr=10-sensitivity;
if(pct>thr&&!cooldown){
cooldown=true;detCount++;
document.getElementById('detCount').textContent=detCount;
const capCv=document.createElement('canvas');capCv.width=320;capCv.height=240;
capCv.getContext('2d').drawImage(vid,0,0,320,240);
const dataUrl=capCv.toDataURL('image/jpeg',0.6);
const now=new Date();
events.push({time:now.toLocaleTimeString(),hour:now.getHours(),img:dataUrl});
hourlyData[now.getHours()]++;
if(events.length>50)events.shift();
petSound();renderTimeline();
setTimeout(()=>{cooldown=false},5000)}}
prevFrame=cur;
requestAnimationFrame(loop)}
function renderTimeline(){
const el=document.getElementById('timeline');
if(events.length===0){el.innerHTML='\u6682\u65E0\u622A\u56FE';return}
el.innerHTML=events.slice(-20).map(ev=>'<img src="'+ev.img+'" title="'+ev.time+'">').join('')}
function renderReport(){
document.getElementById('rTotal').textContent=detCount;
const dur=startTime?Math.round((Date.now()-startTime)/60000):0;
document.getElementById('rDur').textContent=dur;
let peak=0,peakH=0;hourlyData.forEach((v,i)=>{if(v>peak){peak=v;peakH=i}});
document.getElementById('rPeak').textContent=peak>0?peakH+':00':'-';
// Heatmap
const maxV=Math.max(1,...hourlyData);
document.getElementById('heatmap').innerHTML=hourlyData.map((v,i)=>'<div class="heatmap-bar" style="height:'+Math.max(2,v/maxV*56)+'px" title="'+i+'h: '+v+'\u6B21"></div>').join('');
// Report timeline
const el=document.getElementById('reportTimeline');
el.innerHTML=events.length?events.map(ev=>'<img src="'+ev.img+'" title="'+ev.time+'">').join(''):'\\u6682\\u65E0'}
function exportAll(){events.forEach((ev,i)=>{const a=document.createElement('a');a.download='pet_'+i+'_'+ev.time.replace(/:/g,'')+'.jpg';a.href=ev.img;a.click()})}
<\/script></body></html>`);
console.log('pet-monitor OK');