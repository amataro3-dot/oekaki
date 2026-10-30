/* ===== 共通: 決まった数字、小さな道具、ゲームの状態 ===== */

/* お題(topics/topics.js の TOPICS) */
const T=(typeof TOPICS!=='undefined')?TOPICS:{};

/* 時間(ミリ秒): 描く30秒、見る10秒、答える30秒 */
const DRAW=30000,VIEW=10000,ANS=30000;

/* 小さな道具 */
const $=id=>document.getElementById(id),app=$('app');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* 答え合わせ: 空白や記号をのぞき、カタカナをひらがなにしてくらべる */
const norm=s=>(s||'').normalize('NFKC').toLowerCase().replace(/[\s・、。!！?？]/g,'').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96));
/* 英語の答えのため: a/an/the、空白・-・' のちがい、複数形の s/es を気にしない形をいくつか作る */
const normEn=s=>{const x=(s||'').normalize('NFKC').toLowerCase().trim().replace(/^(a|an|the)\s+/,'').replace(/[\s\-'’.,!?]/g,'');return[x,x.replace(/es$/,''),x.replace(/s$/,'')]};
const forms=s=>new Set([norm(s),...normEn(s)].filter(Boolean));
/* お題・読み・別の答え方に加えて、英語・韓国語の言い方(topics_i18n.js)のどれかと同じなら正解 */
const judge=(a,r)=>{
  const xs=forms(a);
  if(!norm(a))return false;
  const all=[r.topic,...String(r.reading||'').split('|'),...topicForms(r.topic,'en'),...topicForms(r.topic,'ko')];
  return all.some(t=>[...forms(t)].some(f=>xs.has(f)))};

/* スマホに覚えておく(名前・部屋コード)。使えないときは何もしない */
const LS={
  get(k){try{return localStorage.getItem(k)}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,v)}catch(e){}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}};

/* 自分(id はログインできたら uid に変わる) */
const me={id:Math.random().toString(36).slice(2,10),name:LS.get('oekaki-name')||''};

/* ゲームの状態
   db, ref: Firebase と、いまの部屋
   room: 部屋のデータ / off: サーバーとの時計のずれ / curKey: いま出している画面
   strokes, log, t0: 描いている絵 / locked: 完了を押した / lastAdv: この場面はもう進めた
   replaying: 再生中 / odSet: 切断したら消す設定をした / abKey, abAt: 抜けた人の番を飛ばす用 */
let db,ref,room=null,off=0,curKey='',strokes=[],locked=false,lastAdv='',replaying=false,odSet=false,log=[],t0=0,abKey='',abAt=0;

/* iPhone で、描いているときに画面が動かないようにする */
document.addEventListener('touchmove',e=>{if(e.target.id==='cv')e.preventDefault()},{passive:false});

/* サーバーの時計に合わせた、いまの時刻 */
const now=()=>Date.now()+off;

/* 部屋の人(入った順)、ホストか(いちばん先に入った人)、名前 */
const plist=()=>Object.entries(room.players||{}).sort((a,b)=>(a[1].joined||0)-(b[1].joined||0));
const isHost=()=>{const p=plist();return p.length&&p[0][0]===me.id};
const nameOf=id=>(room.names&&room.names[id])||(room.players&&room.players[id]&&room.players[id].name)||'？';
