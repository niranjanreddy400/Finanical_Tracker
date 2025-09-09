// financialTracker.js
// Refactored with Firestore persistence + realtime sync

import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Firebase Config (replace with secure keys) ---
const firebaseConfig = {
  apiKey: "AIzaSyB-oqOuVoNJWmpW1KAq8eqEXiQtvYfxSdk",
  authDomain: "financialtracker-mani.firebaseapp.com",
  projectId: "financialtracker-mani",
  storageBucket: "financialtracker-mani.firebasestorage.app",
  messagingSenderId: "291386637366",
  appId: "1:291386637366:web:090b26f9652a394cbdec97",
  measurementId: "G-HF9JZC689P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let userId = null;

// --- DOM Elements ---
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const netWorthDisplay = document.getElementById('net-worth-display');

// --- Toasts ---
function showToast(msg, type="success") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-5 right-5 px-4 py-2 rounded-lg text-sm shadow-lg z-50 
    ${type==="success" ? "bg-green-600" : "bg-red-600"}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(()=> toast.remove(), 2500);
}

// --- Auth ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    setupRealtimeListeners();
  } else {
    userId = null;
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
});
window.onLoginClick = () => signInAnonymously(auth).catch(e => showToast(e.message,"error"));
window.onLogoutClick = () => signOut(auth).catch(e => showToast(e.message,"error"));

// --- Firestore Collections ---
function userCol(col) {
  return collection(db, "users", userId, col);
}

// --- Realtime Listeners ---
function setupRealtimeListeners() {
  listenAndRender("credits", renderCredits);
  listenAndRender("debts", renderDebts);
  listenAndRender("transactions", renderTransactions);
  listenAndRender("stocks", renderStocks);
}

function listenAndRender(col, renderer) {
  onSnapshot(userCol(col), (snap) => {
    const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
    renderer(data);
    updateNetWorth();
    updateCharts();
  });
}

// --- Add Handlers ---
window.onAddCreditSubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("credit-person").value;
  const amount = parseFloat(document.getElementById("credit-amount").value);
  const rate = parseFloat(document.getElementById("credit-rate").value);
  const date = new Date().toISOString().split("T")[0];
  const interest = amount * rate / 100;
  await addDoc(userCol("credits"), { name, amount, rate, interest, total: amount+interest, date, status:"Active" });
  e.target.reset();
  showToast("Credit added ✅");
};

window.onAddDebtSubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("debt-person").value;
  const amount = parseFloat(document.getElementById("debt-amount").value);
  const rate = parseFloat(document.getElementById("debt-rate").value);
  const date = document.getElementById("debt-date").value;
  const interest = amount * rate / 100;
  await addDoc(userCol("debts"), { name, amount, rate, interest, total: amount+interest, date, status:"Active" });
  e.target.reset();
  showToast("Debt added ✅");
};

window.onAddTransactionSubmit = async (e) => {
  e.preventDefault();
  const type = document.getElementById("transaction-type").value;
  const category = document.getElementById("transaction-category").value;
  const amount = parseFloat(document.getElementById("transaction-amount").value);
  const description = document.getElementById("transaction-description").value;
  const date = new Date().toISOString().split("T")[0];
  await addDoc(userCol("transactions"), { type, category, amount, description, date });
  e.target.reset();
  showToast("Transaction added ✅");
};

// --- Delete Handlers ---
window.removeDoc = async (col, id) => {
  await deleteDoc(doc(db, "users", userId, col, id));
  showToast("Deleted");
};

// --- Renderers ---
function renderCredits(data) {
  const table = document.getElementById("credits-table");
  table.innerHTML = "";
  data.forEach(c=>{
    table.innerHTML += `
      <tr>
        <td>${c.name}</td><td>₹${c.amount}</td><td>${c.rate}%</td>
        <td>₹${c.interest}</td><td>₹${c.total}</td><td>${c.date}</td><td>${c.status}</td>
        <td><button onclick="removeDoc('credits','${c.id}')" class="text-red-500">Delete</button></td>
      </tr>`;
  });
}
function renderDebts(data) {
  const table = document.getElementById("debts-table");
  table.innerHTML = "";
  data.forEach(d=>{
    table.innerHTML += `
      <tr>
        <td>${d.name}</td><td>₹${d.amount}</td><td>${d.date}</td>
        <td>${d.rate}%</td><td>₹${d.interest}</td><td>₹${d.total}</td><td>${d.status}</td>
        <td><button onclick="removeDoc('debts','${d.id}')" class="text-red-500">Delete</button></td>
      </tr>`;
  });
}
function renderTransactions(data) {
  const table = document.getElementById("transactions-table");
  table.innerHTML = "";
  data.forEach(t=>{
    table.innerHTML += `
      <tr>
        <td>${t.date}</td><td>${t.type}</td><td>${t.category}</td><td>₹${t.amount}</td><td>${t.description||""}</td>
        <td><button onclick="removeDoc('transactions','${t.id}')" class="text-red-500">Delete</button></td>
      </tr>`;
  });
}
function renderStocks(data) {
  const table = document.getElementById("stocks-table");
  table.innerHTML = "";
  data.forEach(s=>{
    const value = s.quantity * s.current_price;
    const pnl = (s.current_price - s.buy_price) * s.quantity;
    table.innerHTML += `
      <tr>
        <td>${s.symbol}</td><td>${s.quantity}</td><td>₹${s.buy_price}</td><td>₹${s.current_price}</td>
        <td>₹${value.toFixed(2)}</td><td class="${pnl>=0?'text-green-400':'text-red-400'}">₹${pnl.toFixed(2)}</td>
      </tr>`;
  });
}

// --- Net Worth & Charts ---
function updateNetWorth() {
  // Sum credits, stocks, debts from tables
  const creditSum = [...document.querySelectorAll("#credits-table tr td:nth-child(2)")]
    .map(td=>parseFloat(td.textContent.replace(/[₹,]/g,""))||0).reduce((a,b)=>a+b,0);
  const debtSum = [...document.querySelectorAll("#debts-table tr td:nth-child(2)")]
    .map(td=>parseFloat(td.textContent.replace(/[₹,]/g,""))||0).reduce((a,b)=>a+b,0);
  const stockSum = [...document.querySelectorAll("#stocks-table tr td:nth-child(5)")]
    .map(td=>parseFloat(td.textContent.replace(/[₹,]/g,""))||0).reduce((a,b)=>a+b,0);
  const net = (creditSum + stockSum - debtSum);
  netWorthDisplay.textContent = `₹ ${net.toLocaleString()}`;
}

let charts = {};
function updateCharts() {
  if (!charts.netWorth) {
    charts.netWorth = new Chart(document.getElementById("netWorthChart"), {type:"bar", data:{labels:["Credits","Stocks","Debts"],datasets:[{label:"Value",data:[0,0,0],backgroundColor:["#00ffb0","#1fa2ff","#e50914"]}]}, options:{plugins:{legend:{display:false}}}});
  }
  charts.netWorth.data.datasets[0].data = [
    parseFloat(netWorthDisplay.textContent.replace(/[₹,]/g,""))||0,
  ];
  charts.netWorth.update();
}
