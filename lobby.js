/* ===== ロビー: ホーム、部屋を作る・入る・出る、画面の切りかえ ===== */

/* ホーム画面(なまえ、部屋を作る、部屋コードで入る) */
function home(err){
  curKey='';
  app.innerHTML=`<h1>${tx('🎨 お絵描き伝言ゲーム')}</h1>${langSwitchHtml()}<div class="card">
<input id="nm" maxlength="8" placeholder="${tx('なまえ')}" value="${esc(me.name)}">
<button id="mk">${tx('部屋を作る')}</button><hr style="border-color:var(--bd)">
<input id="cd" inputmode="numeric" maxlength="4" placeholder="${tx('部屋コード(4けた)')}" value="${esc(LS.get('oekaki-room')||'')}">
<button id="jn" class="sub">${tx('入室する')}</button><div class="err" id="er">${err||''}</div></div><div class="dim">${tx('2〜8人')}</div>
<p class="dim" style="text-align:center;font-size:13px"><a href="${sitePath('/')}">${tx("Muddy's Games トップ")}</a>・<a href="${sitePath('/privacy.html')}">${tx('プライバシーポリシー')}</a></p>`;
  /* 言語の切りかえ: 入力中のなまえを覚えてから読みこみ直す(i18n.js) */
  langSwitchInit(()=>{const v=$('nm').value.trim();if(v)LS.set('oekaki-name',v)});
  $('mk').onclick=()=>enter(null);
  $('jn').onclick=()=>enter($('cd').value.trim());}

/* 部屋から離れたあとの片づけ */
function cleanup(){
  try{ref.off()}catch(e){}
  odSet=false;room=null;curKey='';LS.del('oekaki-room')}

/* 部屋に入る(code が null なら新しく作る) */
async function enter(code){
  const nm=$('nm').value.trim();
  if(!nm){$('er').textContent=tx('なまえを入れてね');return}
  me.name=nm;LS.set('oekaki-name',nm);
  const create=!code;
  try{
    let r=null,dupJoined=Infinity;
    const dups=[];
    if(create){
      /* あいている4けたのコードを探す */
      for(let i=0;i<20;i++){code=String(1000+Math.floor(Math.random()*9000));if(!(await db.ref('oekaki-rooms/'+code).get()).exists())break}}
    else{
      r=(await db.ref('oekaki-rooms/'+code).get()).val();
      if(!r)return $('er').textContent=tx('部屋がありません');
      const ps=r.players||{};
      if(r.state!=='lobby'){
        /* ゲーム中: 同じ名前で抜けていない人なら、その人として戻る */
        const ex=(r.order||[]).find(id=>ps[id]&&r.names&&r.names[id]===nm&&!(r.left&&r.left[id]));
        if(!ex)return $('er').textContent=tx('もう始まっています');
        me.id=ex}
      else{
        /* ロビー: 同じ名前の古い自分を探す(二重参加の解消) */
        Object.entries(ps).forEach(([id,p])=>{if(p.name===nm){dups.push(id);dupJoined=Math.min(dupJoined,p.joined||Infinity)}});
        if(Object.keys(ps).length-dups.length>=8)return $('er').textContent=tx('満員です')}}
    ref=db.ref('oekaki-rooms/'+code);
    if(create)await ref.update({state:'lobby',phaseId:0,category:'すべて'});
    const pr=ref.child('players/'+me.id);
    if((await pr.get()).exists())await pr.update({name:me.name});
    else await pr.set({name:me.name,joined:isFinite(dupJoined)?dupJoined:firebase.database.ServerValue.TIMESTAMP});
    /* 同じ名前の古い自分を消す(先に自分を入れてから。ルールで、部屋の中の人しか書けないため) */
    for(const id of dups)if(id!==me.id)await ref.child('players/'+id).remove();
    LS.set('oekaki-room',code);odSet=false;
    /* 部屋のデータが変わるたびに呼ばれる */
    ref.on('value',s=>{
      room=s.val();
      if(!room){cleanup();return home(tx('部屋が閉じました'))}
      if(!(room.players&&room.players[me.id])){const k=room.kicked&&room.kicked[me.id];cleanup();return home(k?tx('退出させられました'):tx('部屋から外れました'))}
      /* ロビーにいる間だけ、回線が切れたら自分を消す */
      if(room.state==='lobby'&&!odSet){ref.child('players/'+me.id).onDisconnect().remove();odSet=true}
      if(room.state!=='lobby'&&odSet){ref.child('players/'+me.id).onDisconnect().cancel();odSet=false}
      render();});
  }catch(e){$('er').textContent=tx('接続エラー: ')+e.message}}

/* 画面の切りかえ。場面が変わったときだけ作り直す(lobby / play / result) */
function render(){
  const r=room;
  const key=r.state==='lobby'?'L'+plist().map(p=>p[0]).join()+r.category:r.state==='result'?'R'+r.ok+isHost():[r.state,r.step,r.sub].join();
  if(key===curKey)return;
  curKey=key;
  if(r.state==='lobby')lobby();else if(r.state==='play')play();else result();
  app.insertAdjacentHTML('beforeend','<div style="margin-top:22px"><button class="sub" id="lv">'+tx('部屋を出る')+'</button></div>');
  $('lv').onclick=leave;}

/* ロビー画面(ホストはジャンルを選んで開始、✕で退出させる) */
function lobby(){
  const p=plist(),h=isHost();
  app.innerHTML=`<h1>${tx('ロビー')}</h1><div class="card"><div class="dim">${tx('部屋コード')}</div><div class="code">${ref.key}</div>
<div>${p.map(([id,v])=>`<span class="pl ${id===me.id?'me':''}">${esc(v.name)}${h&&id!==me.id?` <b class="kk" data-id="${id}">✕</b>`:''}</span>`).join('')}</div><div class="dim">${tx('{n}/8人',{n:p.length})}</div></div>
${h?`<div class="card">${tx('お題ジャンル')}<select id="cat">${['すべて',...Object.keys(T)].map(c=>`<option value="${esc(c)}" ${c===room.category?'selected':''}>${esc(catName(c))}</option>`).join('')}</select>
<button id="st" ${p.length<2?'disabled':''}>${tx('ゲーム開始')}</button></div>`:`<div class="card">${tx('ジャンル：')}${esc(catName(room.category))}<br><span class="dim">${tx('ホストの開始を待っています…')}</span></div>`}`;
  if(h){
    $('cat').onchange=e=>ref.update({category:e.target.value});
    $('st').onclick=start;
    document.querySelectorAll('.kk').forEach(b=>b.onclick=()=>kick(b.dataset.id))}}

/* ゲーム開始(ホスト): 順番をまぜて、お題を1つ選ぶ */
function start(){
  const ids=plist().map(p=>p[0]);
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
  const pool=(room.category==='すべて'||!T[room.category])?Object.values(T).flat():T[room.category];
  const pk=pool[Math.floor(Math.random()*pool.length)].split('|'),topic=pk[0],rd=pk.slice(1).join('|');
  const names={};
  ids.forEach(i=>names[i]=room.players[i].name);
  ref.update({state:'play',order:ids,names,topic,reading:rd||topic,step:0,sub:'draw',deadline:now()+DRAW,drawings:null,answer:null,ok:null,phaseId:(room.phaseId||0)+1,left:null});}

/* ホストが、ほかの人を退出させる */
async function kick(id){
  if(!confirm(tx('{n}を退出させますか？',{n:SAN(nameOf(id))})))return;
  await ref.child('kicked/'+id).set(true);
  await ref.child('players/'+id).remove()}

/* 部屋を出る(書き込む順番はルールに合わせてある。変えるとはじかれる) */
async function leave(){
  const r=room,id=me.id;
  if(r.state==='play'&&!confirm(tx('ゲームの途中です。本当に部屋を出ますか？')))return;
  const others=Object.keys(r.players||{}).filter(k=>k!==id).length,rf=ref;
  rf.child('players/'+id).onDisconnect().cancel();
  cleanup();
  try{
    if(!others)await rf.remove();/* 最後の1人なら部屋ごと消す(自分がまだ部屋の中にいるうちに) */
    else{if(r.state==='play')await rf.child('left/'+id).set(true);await rf.child('players/'+id).remove()}}catch(e){}
  home()}
