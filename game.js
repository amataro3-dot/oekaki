/* ===== ゲーム: 描く・見る・答える、場面を進める、時間切れ ===== */

/* 残り時間のバーと秒数 */
function timerHtml(){return`<div class="bar"><i id="bar"></i></div><div class="big" id="sec"></div>`}

/* ゲーム中の画面(自分の番なら 描く/見る/答える、ほかの人の番なら待つ) */
function play(){
  const r=room,n=r.order.length,act=r.order[r.step],mine=act===me.id;
  locked=false;
  const prog=`<div class="dim">${r.step+1}/${n}人目</div>`;
  /* ほかの人の番 */
  if(!mine){app.innerHTML=`${prog}<div class="card"><div class="big">${esc(nameOf(act))}さんが<br>${r.sub==='draw'?'描いています ✏️':r.sub==='view'?'絵を見ています 👀':'答えを考えています 🤔'}</div>${timerHtml()}</div>
<div>${r.order.map((id,i)=>`<span class="pl ${i===r.step?'me':''}">${esc(nameOf(id))}${r.left&&r.left[id]?'(退出)':''}</span>`).join('→')}</div>`;return}
  /* 描く */
  if(r.sub==='draw'){
    strokes=[];
    app.innerHTML=`${prog}${r.step===0?`<div class="card">お題<div class="big">${esc(r.topic)}</div></div>`:'<div class="card">見た絵を思い出して描こう！</div>'}${timerHtml()}
<canvas id="cv" width="300" height="300"></canvas><div id="tl"></div>
<button id="un" class="sub">1つ戻す</button><button id="cl" class="sub">全部消す</button><button id="dn">完了</button>`;
    setupCanvas();
    $('dn').onclick=done}
  /* 前の人の絵を見る */
  else if(r.sub==='view'){
    app.innerHTML=`${prog}<div class="card">${r.drawings&&r.drawings[r.step-1]?'前の人の絵を見て！':(r.left&&r.left[r.order[r.step-1]]?'前の人が抜けたので絵がありません':'前の人の絵が届きませんでした')}</div>${timerHtml()}<canvas id="cv" width="300" height="300"></canvas><button id="dn">わかった！</button>`;
    paint($('cv'),fin(load(r.drawings&&r.drawings[r.step-1]).l));
    $('dn').onclick=done}
  /* 最後の人が答える */
  else{
    app.innerHTML=`${prog}<div class="card">お題は何でしょう？<input id="ans" placeholder="答えを入力" autocomplete="off"><button id="dn">答える</button></div>${timerHtml()}`;
    $('dn').onclick=done;
    $('ans').onkeydown=e=>{if(e.key==='Enter')done()}}}

/* 完了ボタン(1回だけ) */
function done(){
  if(locked)return;
  locked=true;
  const b=$('dn');
  if(b){b.disabled=true;b.textContent='待っています…'}
  adv()}

/* 次の場面へ進める。phaseId を1つ上げられた人だけが書く(2人が同時に進めないように) */
async function adv(){
  const r=room,key=[r.state,r.step,r.sub,r.phaseId].join();
  if(lastAdv===key)return;
  lastAdv=key;
  const pid=r.phaseId||0,n=r.order.length,mine=r.order[r.step]===me.id;
  const c=await ref.child('phaseId').transaction(v=>(v||0)===pid?pid+1:undefined);
  if(!c.committed)return;
  const u={};
  if(r.sub==='draw'){
    /* 描いた人なら絵を送る。次の人の「見る」へ */
    if(mine)u['drawings/'+r.step]=JSON.stringify({d:Date.now()-t0,l:log});
    u.step=r.step+1;u.sub='view';u.deadline=now()+VIEW}
  else if(r.sub==='view'){
    /* 最後の人なら「答える」、ちがえば「描く」へ */
    u.sub=r.step===n-1?'answer':'draw';u.deadline=now()+(r.step===n-1?ANS:DRAW)}
  else{
    /* 答えを判定して結果へ */
    const a=mine&&$('ans')?$('ans').value.trim():'';
    u.answer=a;u.ok=judge(a,r);u.state='result'}
  await ref.update(u);}

/* 0.25秒ごと: 残り時間の表示と、時間切れの処理 */
setInterval(()=>{
  if(!room||room.state!=='play')return;
  const left=room.deadline-now(),tot=room.sub==='view'?VIEW:room.sub==='draw'?DRAW:ANS;
  if($('bar'))$('bar').style.width=Math.max(0,Math.min(100,left/tot*100))+'%';
  if($('sec'))$('sec').textContent=Math.max(0,Math.ceil(left/1000));
  /* 番の人が抜けていたら、ホストが少し待って進める */
  if(isHost()&&room.left&&room.left[room.order[room.step]]){const k=[room.state,room.step,room.sub].join();if(abKey!==k){abKey=k;abAt=Date.now()}else if(Date.now()-abAt>1200)adv();return}
  /* 時間切れ: 番の人が進める。進まなければ、8秒後にホストが代わりに進める */
  if(left<=0){if(room.order[room.step]===me.id)adv();else if(isHost()&&left<-8000)adv();}},250);
