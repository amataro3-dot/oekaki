/* ===== Firebase: つなぐ準備・App Check・ログイン。最後に読んで、ホーム画面を出す ===== */

if(typeof firebaseConfig==='undefined'||firebaseConfig.apiKey==='YOUR_API_KEY'){
  app.innerHTML='<h1>設定が必要です</h1><div class="card">config.js に firebaseConfig を入れてください。</div>'}
else if(!Object.keys(T).length){
  app.innerHTML='<h1>お題が読み込めません</h1><div class="card">topics/topics.js を確認してください。</div>'}
else{
  firebase.initializeApp(firebaseConfig);
  /* App Check: このサイトから来たアクセスだと証明する(失敗してもゲームは続ける) */
  try{firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider('6LfFffwtAAAAAKMoDAtqJDlgLK720RWBuBENti2t'),true)}catch(e){console.warn('App Check',e)}
  db=firebase.database();
  db.ref('.info/serverTimeOffset').on('value',s=>off=s.val()||0);
  /* 見えない匿名ログイン。ログインのID(uid)を、そのままプレイヤーのIDにする(ルールで「自分の場所しか書けない」をチェックするため) */
  app.innerHTML='<h1>🎨 お絵描き伝言ゲーム</h1><div class="card dim">接続中…</div>';
  /* ログインが終わったら(だめでも、8秒たったら)ホーム画面へ */
  let started=false;
  const go=()=>{if(started)return;started=true;home()};
  try{firebase.auth().signInAnonymously().then(c=>{if(c&&c.user&&c.user.uid)me.id=c.user.uid}).catch(e=>console.warn('ログインできませんでした',e)).then(go)}catch(e){go()}
  setTimeout(go,8000);}
