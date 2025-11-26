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

// 🔑 一覧表示のカラム順（DBのフィールド名）
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

let form;
let tableBody;
let submitButton;
let editingId = null; // null → 新規モード / 文字列ID → 編集モード

document.addEventListener("DOMContentLoaded", () => {
  form = document.getElementById("trade-form");
  tableBody = document.querySelector("#trade-table tbody");
  submitButton = form.querySelector('button[type="submit"]');

  if (!form || !tableBody || !submitButton) {
    console.error("フォームまたはテーブルが見つかりません");
    return;
  }

  renderTable();
  form.addEventListener("submit", onSubmit);
});

// フォーム送信（新規 or 更新）
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
      // 更新
      record.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTION).doc(editingId).update(record);
    } else {
      // 新規
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

function clearEditingState() {
  editingId = null;
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

// Firestore からデータを読み込んでテーブルを描画
async function renderCards() {
  const list = document.getElementById("record-list");
  list.innerHTML = "";

  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("date", "desc")
    .orderBy("time", "desc")
    .get();

  snapshot.forEach((doc) => {
    const r = doc.data();
    const id = doc.id;

    const card = document.createElement("div");
    card.className = "record-card";

    card.innerHTML = `
      <div class="record-top">
        <div>${r.date ?? ""}</div>
        <div>${r.time ?? ""}</div>
        <div>${r.symbol ?? ""}</div>
        <div>${r.side === "buy" ? "買い" : "売り"}</div>
        <div>数量 ${r.quantity ?? ""}</div>
        <div>${r.acquirePrice ?? ""}</div>
        <div>${r.profit ?? ""}</div>
      </div>

      <div class="record-bottom">
        <div class="record-text">
          ${r.comment || ""} / ${r.bad || ""}
        </div>

        <div class="record-actions">
          <button class="edit-btn" data-id="${id}">編集</button>
          <button class="delete-btn" data-id="${id}">削除</button>
        </div>
      </div>
    `;

    list.appendChild(card);
  });

  // 編集ボタン
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const docData = snapshot.docs.find(d => d.id === id).data();
      startEdit(id, docData);
    });
  });

  // 削除ボタン
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("削除しますか？")) return;
      await db.collection(COLLECTION).doc(id).delete();
      renderCards();
    });
  });
}

// 編集開始：フォームに反映して「更新モード」に切り替え
function startEdit(id, record) {
  editingId = id;
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

