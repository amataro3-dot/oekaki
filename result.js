/* ===== 結果: 答え合わせ、みんなの絵、最初から再生 ===== */

/* 結果画面(ホストは 正解/不正解 の切りかえと、もう一度あそぶ) */
function result(){
  const r=room,n=r.order.length;
  app.innerHTML=`<h1>結果発表</h1><div class="card"><div class="dim">お題</div><div class="big">${esc(r.topic)}</div>
<div class="dim">${esc(nameOf(r.order[n-1]))}さんの答え</div><div class="big">${esc(r.answer||'(無回答)')}</div>
<div class="big ${r.ok?'ok':'ng'}">${r.ok?'⭕ 正解！':'❌ ざんねん…'}</div>
${isHost()?`<button class="sub" id="tg">${r.ok?'不正解にする':'正解にする'}</button>`:''}</div>
<button id="rp">▶ 最初から再生</button>
${r.order.slice(0,n-1).map((id,i)=>`<div class="card"><b>${i+1}. ${esc(nameOf(id))}${r.left&&r.left[id]?'（退出）':''}${i===0?`（お題：${esc(r.topic)}）`:''}</b><canvas data-i="${i}" width="300" height="300"></canvas></div>`).join('')}
${isHost()?'<button id="ag">もう一度あそぶ</button>':''}`;
  /* みんなの絵を描く */
  document.querySelectorAll('canvas[data-i]').forEach(c=>paint(c,fin(load(r.drawings&&r.drawings[c.dataset.i]).l)));
  $('rp').onclick=replay;
  if($('tg'))$('tg').onclick=()=>ref.update({ok:!r.ok});
  /* もう一度あそぶ: ゲームのデータを消してロビーへ */
  if($('ag'))$('ag').onclick=()=>ref.update({state:'lobby',order:null,names:null,topic:null,reading:null,step:null,sub:null,deadline:null,drawings:null,answer:null,ok:null,left:null,kicked:null});}

/* 1枚目から順に、描いた動きを再生する */
async function replay(){
  if(replaying)return;
  replaying=true;
  const cs=[...document.querySelectorAll('canvas[data-i]')];
  cs.forEach(clear);
  for(const c of cs){
    c.scrollIntoView({block:'center',behavior:'smooth'});
    await sleep(600);
    const dd=load(room.drawings&&room.drawings[c.dataset.i]);
    await playOne(c,dd);
    paint(c,fin(dd.l));
    await sleep(500)}
  replaying=false}
