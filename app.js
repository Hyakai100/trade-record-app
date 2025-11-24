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

      // 1列目：日付
      const tdDate = document.createElement("td");
      tdDate.textContent = record.date || "";
      tr.appendChild(tdDate);

      // 2列目：銘柄
      const tdSymbol = document.createElement("td");
      tdSymbol.textContent = record.symbol || "";
      tr.appendChild(tdSymbol);

      // 3列目：区分
      const tdSide = document.createElement("td");
      tdSide.textContent = record.side === "buy" ? "買い" : "売り";
      tr.appendChild(tdSide);

      // 4列目：数量
      const tdQuantity = document.createElement("td");
      tdQuantity.textContent =
        record.quantity !== undefined && record.quantity !== null
          ? record.quantity
          : "";
      tr.appendChild(tdQuantity);

      // 5列目：取得価格
      const tdAcquire = document.createElement("td");
      tdAcquire.textContent =
        record.acquirePrice !== undefined && record.acquirePrice !== null
          ? record.acquirePrice
          : "";
      tr.appendChild(tdAcquire);

      // 6列目：損益額
      const tdProfit = document.createElement("td");
      tdProfit.textContent =
        record.profit !== undefined && record.profit !== null
          ? record.profit
          : "";
      tr.appendChild(tdProfit);

      // 7列目：コメント
      const tdComment = document.createElement("td");
      tdComment.textContent = record.comment || "";
      tr.appendChild(tdComment);

      // 8列目：良いところ
      const tdGood = document.createElement("td");
      tdGood.textContent = record.good || "";
      tr.appendChild(tdGood);

      // 9列目：悪いところ
      const tdBad = document.createElement("td");
      tdBad.textContent = record.bad || "";
      tr.appendChild(tdBad);

      // 10列目：削除ボタン
      const tdDelete = document.createElement("td");
      const btn = document.createElement("button");
      btn.textContent = "削除";
      btn.setAttribute("data-id", id);
      tdDelete.appendChild(btn);
      tr.appendChild(tdDelete);

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





