// ===== Firebase 初期化 =====
const firebaseConfig = {
  apiKey: "AIzaSyBSPjdNc8NDSZxrnVRMzW2atJ_EBjLGAIE",
  authDomain: "trade-record-app.firebaseapp.com",
  projectId: "trade-record-app",
  storageBucket: "trade-record-app.firebasestorage.app",
  messagingSenderId: "407358487748",
  appId: "1:407358487748:web:aa9c1d5860a6c118149d91",
  measurementId: "G-CFBMQHRLSS"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const COLLECTION = "trades"; // コレクション名

// フォームやテーブルの参照用（あとで代入する）
let form;
let tableBody;

// DOM が読み込まれてから初期化
document.addEventListener("DOMContentLoaded", () => {
  form = document.getElementById("trade-form");
  tableBody = document.querySelector("#trade-table tbody");

  if (!form || !tableBody) {
    console.error("フォームまたはテーブルが見つかりません");
    return;
  }

  // 初期表示
  renderTable();

  // フォーム送信イベント
  form.addEventListener("submit", onSubmit);
});

// フォーム送信時の処理
async function onSubmit(e) {
  e.preventDefault();

  const symbol = document.getElementById("symbol").value.trim();
  const side = document.getElementById("side").value;
  const quantity = Number(document.getElementById("quantity").value);
  const acquirePrice = Number(document.getElementById("acquirePrice").value);
  const date = document.getElementById("date").value;
  
  const comment = document.getElementById("comment").value.trim();
  const good = document.getElementById("good").value.trim();
  const bad = document.getElementById("bad").value.trim();

  const profitValue = document.getElementById("profit").value;
  const profit = profitValue === "" ? null : Number(profitValue);
  
  if (!symbol || !date) {
    alert("銘柄と日付は必須です。");
    return;
  }

  const record = {
    symbol,
    side,
    quantity,
    acquirePrice,
    profit,
    date,
    comment,
    good,
    bad,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection(COLLECTION).add(record);
    await renderTable();
    form.reset();
  } catch (err) {
    console.error("保存エラー:", err);
    alert("保存に失敗しました。Firestore の設定やネットワークを確認してください。");
  }
}

// Firestore からデータを読み込んでテーブルを描画する
async function renderTable() {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("date", "desc") // 新しい日付が上
      .get();

    snapshot.forEach((doc) => {
      const record = doc.data();
      const id = doc.id;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${record.date || ""}</td>
        <td>${record.symbol || ""}</td>
        <td>${record.side === "buy" ? "買い" : "売り"}</td>
        <td>${record.quantity ?? ""}</td>
        <td>${record.acquirePrice ?? ""}</td>
        <td>${record.profit ?? ""}</td>
        <td>${record.comment || ""}</td>
        <td>${record.good || ""}</td>
        <td>${record.bad || ""}</td>
        <td><button data-id="${id}">削除</button></td>
      `;
      tableBody.appendChild(tr);
    });

    // 削除ボタンにイベント付与
    tableBody.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          await db.collection(COLLECTION).doc(id).delete();
          await renderTable();
        } catch (err) {
          console.error("削除エラー:", err);
          alert("削除に失敗しました。");
        }
      });
    });
  } catch (err) {
    console.error("読み込みエラー:", err);
    alert("データの読み込みに失敗しました。Firestore の設定を確認してください。");
  }
}



