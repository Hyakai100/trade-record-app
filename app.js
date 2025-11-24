// ローカルストレージのキー
const STORAGE_KEY = "trade_records";

// DOM 要素の取得
const form = document.getElementById("trade-form");
const tableBody = document.querySelector("#trade-table tbody");

// ページ読み込み時に保存済みデータを表示
document.addEventListener("DOMContentLoaded", () => {
  renderTable();
});

// フォーム送信イベント
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const symbol = document.getElementById("symbol").value.trim();
  const side = document.getElementById("side").value;
  const quantity = Number(document.getElementById("quantity").value);
  const price = Number(document.getElementById("price").value);
  const date = document.getElementById("date").value;

  if (!symbol || !date) return;

  const record = {
    id: Date.now(),
    symbol,
    side,
    quantity,
    price,
    date
  };

  const records = loadRecords();
  records.push(record);
  saveRecords(records);
  renderTable();
  form.reset();
});

// ローカルストレージから読み込み
function loadRecords() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

// ローカルストレージへ保存
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// テーブルの再描画
function renderTable() {
  const records = loadRecords();
  tableBody.innerHTML = "";

  records
    .sort((a, b) => a.date.localeCompare(b.date)) // 日付順
    .forEach(record => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${record.date}</td>
        <td>${record.symbol}</td>
        <td>${record.side === "buy" ? "買い" : "売り"}</td>
        <td>${record.quantity}</td>
        <td>${record.price}</td>
        <td><button data-id="${record.id}">削除</button></td>
      `;

      tableBody.appendChild(tr);
    });

  // 削除ボタンにイベント付与
  tableBody.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      const records = loadRecords().filter(r => r.id !== id);
      saveRecords(records);
      renderTable();
    });
  });
}
