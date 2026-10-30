/* ===== 絵: 描く、表示する、描いた動きを再生する =====
   絵のデータ: {d: 描いた時間, l: 記録} 記録は順番に
   {k:'s'} 線(c 色, w 太さ, p 点[x,y,x,y…], t 時刻)、{k:'u'} 1つ戻す、{k:'c'} 全部消す */

/* 絵のデータを読む(古い形の、線だけの配列にも対応) */
function load(s){try{const o=s?JSON.parse(s):null;if(!o)return{d:0,l:[]};if(Array.isArray(o))return{d:0,l:o.map(x=>({...x,k:'s'}))};return o}catch(e){return{d:0,l:[]}}}

/* 記録から、最後に残った線だけを取り出す */
function fin(l){
  const a=[];
  for(const e of l){if(e.k==='s')a.push(e);else if(e.k==='u')a.pop();else if(e.k==='c')a.length=0}
  return a}

/* 白でぬりつぶす */
function clear(c){const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,300,300)}

/* 線を1本描く */
function stroke(x,s){
  x.strokeStyle=s.c;x.lineWidth=s.w;x.lineCap=x.lineJoin='round';
  x.beginPath();x.moveTo(s.p[0],s.p[1]);
  if(s.p.length<4)x.lineTo(s.p[0],s.p[1]);
  for(let i=2;i<s.p.length;i+=2)x.lineTo(s.p[i],s.p[i+1]);
  x.stroke()}

/* 消してから、線をまとめて描く */
function paint(c,ss){clear(c);const x=c.getContext('2d');ss.forEach(s=>stroke(x,s))}

/* 描く画面の準備(色・太さのボタン、指で描く、1つ戻す、全部消す) */
function setupCanvas(){
  const c=$('cv'),x=c.getContext('2d');
  let cur=null,col='#222',w=4;
  clear(c);strokes=[];log=[];t0=Date.now();
  const cols=['#222','#e11d48','#2563eb','#16a34a','#f59e0b','#fff'];
  $('tl').innerHTML=cols.map(k=>`<button class="sw ${k===col?'on':''}" data-c="${k}" style="background:${k}"></button>`).join('')+
`<button class="sub" data-w="3">${tx('細')}</button><button class="sub" data-w="8">${tx('太')}</button>`;
  $('tl').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.c){col=b.dataset.c;$('tl').querySelectorAll('.sw').forEach(s=>s.classList.toggle('on',s===b))}if(b.dataset.w)w=+b.dataset.w};
  /* 画面の位置を、絵の 300×300 の位置に直す */
  const pos=e=>{const b=c.getBoundingClientRect();return[Math.round((e.clientX-b.left)*300/b.width),Math.round((e.clientY-b.top)*300/b.height)]};
  /* 白(消しゴム)は太めにする */
  c.onpointerdown=e=>{if(locked)return;c.setPointerCapture(e.pointerId);cur={k:'s',c:col,w:col==='#fff'?Math.max(w,10):w,p:pos(e),t:[Date.now()-t0]};strokes.push(cur);log.push(cur);stroke(x,cur)};
  /* 2ピクセル以上動いたら点を足す */
  c.onpointermove=e=>{if(!cur)return;const p=pos(e),l=cur.p;if(Math.hypot(p[0]-l[l.length-2],p[1]-l[l.length-1])<2)return;l.push(p[0],p[1]);cur.t.push(Date.now()-t0);stroke(x,cur)};
  c.onpointerup=c.onpointercancel=()=>cur=null;
  $('un').onclick=()=>{if(!locked){strokes.pop();log.push({k:'u',t:Date.now()-t0});paint(c,strokes)}};
  $('cl').onclick=()=>{if(!locked){strokes=[];log.push({k:'c',t:Date.now()-t0});paint(c,strokes)}};}

/* ----- 再生 ----- */

/* 再生の速さ */
const SPEED=1.5;

/* 時刻 T の時点で見えている線 */
function at(l,T){
  const a=[];
  for(const e of l){
    if(e.k==='s'){if(!e.t||e.t[0]>T)continue;let n=0;while(n<e.t.length&&e.t[n]<=T)n++;a.push({c:e.c,w:e.w,p:e.p.slice(0,n*2)})}
    else if(e.t<=T){if(e.k==='u')a.pop();else a.length=0}}
  return a}

/* 1枚の絵を、描いた動きのまま再生する */
function playOne(c,dd){return new Promise(res=>{
  const end=Math.max(dd.d||0,...dd.l.map(e=>e.k==='s'?(e.t?e.t[e.t.length-1]:0):e.t),0)+400,s0=performance.now();
  const f=()=>{const T=(performance.now()-s0)*SPEED;paint(c,at(dd.l,T));if(T>=end)res();else requestAnimationFrame(f)};
  f()})}
