// ===== Firebase 初期化 =====
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const COLLECTION = "trades"; // コレクション名（自由に変えてOK）

// ===== DOM 要素の取得 =====
const form = document.getElementById("trade-form");
const tableBody = document.querySelector("#trade-table tbody");

// ページ読み込み時に Firestore からデータを取得して表示
document.addEventListener("DOMContentLoaded", () => {
  renderTable();
});

// フォーム送信イベント
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const symbol = document.getElementById("symbol").value.trim();
  const side = document.getElementById("side").value;
  const quantity = Number(document.getElementById("quantity").value);
  const price = Number(document.getElementById("price").value);
  const date = document.getElementById("date").value;

  const comment = document.getElementById("comment").value.trim();
  const good = document.getElementById("good").value.trim();
  const bad = document.getElementById("bad").value.trim();

  if (!symbol || !date) return;

  const record = {
    symbol,
    side,
    quantity,
    price,
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
    alert("保存に失敗しました。ネットワークやFirestoreの設定を確認してください。");
  }
});

// Firestore からデータを読み込んでテーブルを描画する
async function renderTable() {
  tableBody.innerHTML = "";

  // date 昇順 or 降順は好みで：ここでは新しい日付が上に来るようにする
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("date", "desc")
    .get();

  snapshot.forEach((doc) => {
    const record = doc.data();
    const id = doc.id; // Firestore のドキュメントID

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.date || ""}</td>
      <td>${record.symbol || ""}</td>
      <td>${record.side === "buy" ? "買い" : "売り"}</td>
      <td>${record.quantity ?? ""}</td>
      <td>${record.price ?? ""}</td>
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
      await db.collection(COLLECTION).doc(id).delete();
      await renderTable();
    });
  });
}

