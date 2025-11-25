// ===== Firebase 初期化 =====
const firebaseConfig = {
  apiKey: "AIzaSyBSPjdNc8NDSZxrnVRMzW2atJ_EBjLGAIE",
  authDomain: "trade-record-app.firebaseapp.com",
  projectId: "trade-record-app",
  storageBucket: "trade-record-app.firebasestorage.app",
  messagingSenderId: "407358487748",
  appId: "1:407358487748:web:aa9c1d5860a6c118149d91",
  measurementId: "G-CFBMQHRLSS",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const COLLECTION = "trades";

// 🔑 一覧表示のカラム順（DBフィールド名）
const FIELD_ORDER = [
  "date",
  "time",
  "symbol",
  "side",
  "quantity",
  "acquirePrice",
  "profit",
  "comment",
  "bad",
];

// フォームやテーブルの参照用
let form;
let tableBody;
let submitButton;
let editingId = null; // 編集中ドキュメントID（nullなら新規）

// DOM が読み込まれてから初期化
document.addEventListener("DOMContentLoaded", () => {
  form = document.getElementById("trade-form");
  tableBody = document.querySelector("#trade-table tbody");
  submitButton = form.querySelector('button[type="submit"]');

  if (!form || !tableBody || !submitButton) {
    console.error("フォームまたはテーブルが見つかりません");
    return;
  }

  // 初期表示
  renderTable();

  // フォーム送信イベント
  form.addEventListener("submit", onSubmit);
});

// フォーム送信時の処理（新規 or 更新）
async function onSubmit(e) {
  e.preventDefault();

  const symbol = document.getElementById("symbol").value.trim();
  const side = document.getElementById("side").value;
  const quantity = Number(document.getElementById("quantity").value);
  const acquirePrice = Number(document.getElementById("acquirePrice").value);

  const profitValue = document.getElementById("profit").value;
  const profit = profitValue === "" ? null : Number(profitValue);

  const date = document.getElementById("date").value;
  const timeInput = document.getElementById("time");
  const time = timeInput ? timeInput.value : "";

  const comment = document.getElementById("comment").value.trim();
  const bad = document.getElementById("bad").value.trim();

  if (!symbol || !date) {
    alert("銘柄と日付は必須です。");
    return;
  }

  // Firestoreに送るデータ
  const record = {
    symbol,
    side,
    quantity,
    acquirePrice,
    profit,
    date,
    time,
    comment,
    bad,
  };

  try {
    if (editingId) {
      // 更新モード
      record.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTION).doc(editingId).update(record);
    } else {
      // 新規追加モード
      record.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTION).add(record);
    }

    await renderTable();
    form.reset();
    clearEditingState();
  } catch (err) {
    console.error("保存エラー:", err);
    alert("保存に失敗しました。Firestore の設定やネットワークを確認してください。");
  }
}

// 編集状態のリセット
function clearEditingState() {
  editingId = null;
  document.getElementById("editId").value = "";
  submitButton.textContent = "登録";
}

// 表示用の値をフィールドごとに決める
function getDisplayValue(field, record) {
  if (field === "side") {
    if (record.side === "buy") return "買い";
    if (record.side === "sell") return "売り";
    return "";
  }

  const value = record[field];

  // null / undefined は空白表示
  if (value === null || value === undefined) return "";

  return String(value);
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

      // FIELD_ORDER の順番どおりに <td> を作る
      FIELD_ORDER.forEach((field) => {
        const td = document.createElement("td");
        td.textContent = getDisplayValue(field, record);
        tr.appendChild(td);
      });

      // 操作列（編集・削除ボタン）
      const tdActions = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.textContent = "編集";
      editBtn.addEventListener("click", () => startEdit(id, record));

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "削除";
      deleteBtn.style.marginLeft = "4px";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("本当に削除しますか？")) return;
        try {
          await db.collection(COLLECTION).doc(id).delete();
          await renderTable();
          if (editingId === id) {
            clearEditingState();
            form.reset();
          }
        } catch (err) {
          console.error("削除エラー:", err);
          alert("削除に失敗しました。");
        }
      });

      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("読み込みエラー:", err);
    alert("データの読み込みに失敗しました。Firestore の設定を確認してください。");
  }
}

// 編集開始：フォームに値を反映して更新モードに
function startEdit(id, record) {
  editingId = id;
  document.getElementById("editId").value = id;
  submitButton.textContent = "更新";

  document.getElementById("symbol").value = record.symbol || "";
  document.getElementById("side").value = record.side || "buy";
  document.getElementById("quantity").value =
    record.quantity !== undefined && record.quantity !== null
      ? record.quantity
      : "";

  document.getElementById("acquirePrice").value =
    record.acquirePrice !== undefined && record.acquirePrice !== null
      ? record.acquirePrice
      : "";

  document.getElementById("profit").value =
    record.profit !== undefined && record.profit !== null
      ? record.profit
      : "";

  document.getElementById("date").value = record.date || "";

  const timeInput = document.getElementById("time");
  if (timeInput) {
    timeInput.value = record.time || "";
  }

  document.getElementById("comment").value = record.comment || "";
  document.getElementById("bad").value = record.bad || "";
}






