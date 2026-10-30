/* 言語(日本語・English・한국어)。topics_i18n.js のあと、common.js より先に読む。
   ほかのゲームと同じ決まり(ここでは、T がお題の入れ物なので、訳す関数の名前は tx)。
   - 画面の文字は tx('日本語の文')。下の辞書 I18N に [英語, 韓国語] を書く。辞書にない文は日本語のまま出る。
   - {n} などは tx('{n}人目',{n:2}) のように置きかえる(HTMLもそのまま入る)。
   - 名前のあとの「さん」は SAN(名前)(英語はなし、韓国語は「님」)。
   - お題・ジャンルは、Firebase には今までどおり日本語で入れる(topic / reading / category)。
     画面に出すときに topicName() / catName() で各自の言語にする。だから、同じ部屋でもお題は人それぞれの言語で出る。
   - 答えは、日本語・英語・韓国語のどれで答えても正解(common.js の judge)。
   - 言語は URL の ?lang=ja/en/ko → localStorage の muddys-lang(全ゲーム共通)→ スマホの言語設定 の順で決める。 */

const LANGS=['ja','en','ko'];
const LANG_NAMES={ja:'日本語',en:'English',ko:'한국어'};
const LANG=(()=>{
  try{const q=new URLSearchParams(location.search).get('lang');if(LANGS.includes(q)){localStorage.setItem('muddys-lang',q);return q}}catch(e){}
  try{const s=localStorage.getItem('muddys-lang');if(LANGS.includes(s))return s}catch(e){}
  const n=String(navigator.language||'').toLowerCase();
  return n.startsWith('ko')?'ko':n.startsWith('ja')?'ja':'en'})();
document.documentElement.lang=LANG;
const LI=LANG==='en'?0:1;

function tx(ja,vars){
  const e=I18N[ja];
  let s=LANG==='ja'||!e?ja:(e[LI]??ja);
  if(vars)s=s.replace(/\{(\w+)\}/g,(m,k)=>k in vars?String(vars[k]):m);
  return s}
const SAN=n=>n+(LANG==='ja'?'さん':LANG==='ko'?'님':'');
const sitePath=p=>LANG!=='ja'?'/'+LANG+p:p;

/* お題とジャンルを、いまの言語で(訳がなければ日本語のまま) */
const topicForms=(ja,l)=>{const e=typeof TOPICS_I18N!=='undefined'&&TOPICS_I18N[ja];return e?e[l==='en'?0:1].split('|'):[]};
/* 英語は、はじめの1文字を大文字にして出す */
const topicName=ja=>{if(LANG==='ja')return ja;const w=topicForms(ja,LANG)[0];return w?(LANG==='en'?w[0].toUpperCase()+w.slice(1):w):ja};
const catName=c=>{const e=typeof CATEGORY_I18N!=='undefined'&&CATEGORY_I18N[c];return LANG==='ja'||!e?c:e[LI]};

/* ホームの「日本語 / English / 한국어」。押したら、なまえを覚えてから読みこみ直す */
const langSwitchHtml=()=>`<div class="langs">${LANGS.map(l=>`<button class="sub ${l===LANG?'on':''}" data-lang="${l}">${LANG_NAMES[l]}</button>`).join('')}</div>`;
function langSwitchInit(saveName){
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{
    const l=b.dataset.lang;if(l===LANG)return;
    try{saveName();localStorage.setItem('muddys-lang',l)}catch(e){}
    const u=new URL(location.href);u.searchParams.delete('lang');location.href=u.toString()})}

const I18N={
  // --- ホーム・入室 ---
  '🎨 お絵描き伝言ゲーム':['🎨 Drawing Telephone','🎨 그림 전달 게임'],
  'なまえ':['Name','이름'],
  '部屋を作る':['Create a room','방 만들기'],
  '部屋コード(4けた)':['Room code (4 digits)','방 코드 (4자리)'],
  '入室する':['Join','입장하기'],
  '2〜8人':['2–8 players','2~8명'],
  "Muddy's Games トップ":["Muddy's Games home","Muddy's Games 홈"],
  'プライバシーポリシー':['Privacy policy','개인정보 처리방침'],
  'なまえを入れてね':['Please enter your name','이름을 입력해 주세요'],
  '部屋がありません':['Room not found','방이 없어요'],
  'もう始まっています':['The game has already started','이미 시작했어요'],
  '満員です':['The room is full','인원이 다 찼어요'],
  '部屋が閉じました':['The room was closed','방이 닫혔어요'],
  '退出させられました':['You were removed from the room','방에서 내보내졌어요'],
  '部屋から外れました':['You left the room','방에서 나가게 되었어요'],
  '接続エラー: ':['Connection error: ','연결 오류: '],
  '接続中…':['Connecting…','연결 중…'],
  '部屋を出る':['Leave room','방 나가기'],
  // --- ロビー ---
  'ロビー':['Lobby','로비'],
  '部屋コード':['Room code','방 코드'],
  '{n}/8人':['{n}/8 players','{n}/8명'],
  'お題ジャンル':['Topic genre','제시어 장르'],
  'ゲーム開始':['Start game','게임 시작'],
  'ジャンル：':['Genre: ','장르: '],
  'ホストの開始を待っています…':['Waiting for the host to start…','방장이 시작하기를 기다리는 중…'],
  '{n}を退出させますか？':['Remove {n} from the room?','{n}을 방에서 내보낼까요?'],
  'ゲームの途中です。本当に部屋を出ますか？':['The game is in progress. Really leave the room?','게임 중이에요. 정말 방에서 나갈까요?'],
  // --- ゲーム ---
  '{n}/{m}人目':['Player {n}/{m}','{n}/{m}번째'],
  '{n}が':['{n} is','{n}이'],
  '描いています ✏️':['drawing ✏️','그리는 중 ✏️'],
  '絵を見ています 👀':['looking at the drawing 👀','그림을 보는 중 👀'],
  '答えを考えています 🤔':['thinking of the answer 🤔','답을 생각하는 중 🤔'],
  '(退出)':[' (left)',' (퇴장)'],
  'お題':['Your topic','제시어'],
  '見た絵を思い出して描こう！':['Draw what you remember from the picture!','본 그림을 떠올리며 그려 봐요!'],
  '1つ戻す':['Undo','되돌리기'],
  '全部消す':['Clear','모두 지우기'],
  '完了':['Done','완료'],
  '細':['Thin','가늘게'],
  '太':['Thick','굵게'],
  '前の人の絵を見て！':['Look at the previous drawing!','앞사람의 그림을 봐요!'],
  '前の人が抜けたので絵がありません':['The previous player left, so there is no drawing','앞사람이 나가서 그림이 없어요'],
  '前の人の絵が届きませんでした':['The previous drawing didn’t arrive','앞사람의 그림이 도착하지 않았어요'],
  'わかった！':['Got it!','알았다!'],
  'お題は何でしょう？':['What is the topic?','제시어는 무엇일까요?'],
  '答えを入力':['Type your answer','답을 입력'],
  '答える':['Answer','답하기'],
  '日本語・English・한국어 のどれで答えてもOK':['You can answer in Japanese, English or Korean','일본어·영어·한국어 중 어느 것으로 답해도 OK'],
  '待っています…':['Waiting…','기다리는 중…'],
  // --- 結果 ---
  '結果発表':['Results','결과 발표'],
  '{n}の答え':['{n}’s answer','{n}의 답'],
  '(無回答)':['(no answer)','(무응답)'],
  '⭕ 正解！':['⭕ Correct!','⭕ 정답!'],
  '❌ ざんねん…':['❌ Not quite…','❌ 아쉬워요…'],
  '不正解にする':['Mark as wrong','오답으로 하기'],
  '正解にする':['Mark as correct','정답으로 하기'],
  '▶ 最初から再生':['▶ Replay from the start','▶ 처음부터 재생'],
  '（退出）':[' (left)',' (퇴장)'],
  '（お題：{t}）':[' (topic: {t})',' (제시어: {t})'],
  'もう一度あそぶ':['Play again','한 번 더 하기']
};
