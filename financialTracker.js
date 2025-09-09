// financialTracker.js
// Full refactor: Unified Firestore model for credits, debts, stocks, budget

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

// --- Toast Notifications ---
function showToast(msg, type="success") {
  const toast = document.createElement("div");
  toast.className = `px-4 py-2 rounded-lg text-sm shadow-lg animate-fadeIn 
    ${type==="success" ? "bg-green-600" : "bg-red-600"} text-white`;
  toast.textContent = msg;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(()=> toast.remove(), 2500);
}

// --- Helpers ---
function userCol(col) { return collection(db, "users", userId, col); }
const txCol = () => userCol("transactions");

// --- Auth ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    loginContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    setupRealtimeListener();
  } else {
    userId = null;
    loginContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
});
window.onLoginClick = () => signInAnonymously(auth).catch(e=>showToast(e.message,"error"));
window.onLogoutClick = () => signOut(auth).catch(e=>showToast(e.message,"error"));

// --- Add Transaction ---
async function addTransaction(data) {
  await addDoc(txCol(), {...data, date:new Date().toISOString()});
  showToast(`${data.type} added ✅`);
}

// --- Delete Transaction ---
window.removeTx = async (id) => {
  await deleteDoc(doc(db,"users",userId,"transactions",id));
  showToast("Deleted");
};

// --- Form Handlers ---
window.onAddCreditSubmit = (e)=>{
  e.preventDefault();
  const name=document.getElementById("credit-person").value;
  const amount=parseFloat(document.getElementById("credit-amount").value);
  const rate=parseFloat(document.getElementById("credit-rate").value);
  const interest=amount*rate/100;
  addTransaction({type:"credit", category:name, amount, rate, interest, total:amount+interest, status:"Active"});
  e.target.reset();
};
window.onAddDebtSubmit = (e)=>{
  e.preventDefault();
  const name=document.getElementById("debt-person").value;
  const amount=parseFloat(document.getElementById("debt-amount").value);
  const rate=parseFloat(document.getElementById("debt-rate").value);
  const date=document.getElementById("debt-date").value;
  const interest=amount*rate/100;
  addTransaction({type:"debt", category:name, amount, rate, interest, total:amount+interest, status:"Active", date});
  e.target.reset();
};
window.onAddTransactionSubmit = (e)=>{
  e.preventDefault();
  const type=document.getElementById("transaction-type").value;
  const category=document.getElementById("transaction-category").value;
  const amount=parseFloat(document.getElementById("transaction-amount").value);
  const description=document.getElementById("transaction-description").value;
  addTransaction({type, category, amount, description});
  e.target.reset();
};

// --- Realtime Listener ---
function setupRealtimeListener() {
  onSnapshot(txCol(), (snap)=>{
    const all=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderCredits(all.filter(t=>t.type==="credit"));
    renderDebts(all.filter(t=>t.type==="debt"));
    renderTransactions(all.filter(t=>t.type==="inflow"||t.type==="outflow"));
    renderStocks(all.filter(t=>t.type==="stock"));
    updateNetWorth(all);
    updateCharts(all);
  });
}

// --- Renderers ---
function renderCredits(list){
  const table=document.getElementById("credits-table");
  table.innerHTML="";
  list.forEach(c=>{
    table.innerHTML+=`
      <tr>
        <td>${c.category}</td><td>₹${c.amount}</td><td>${c.rate}%</td>
        <td>₹${c.interest}</td><td>₹${c.total}</td><td>${c.date?.slice(0,10)||""}</td><td>${c.status}</td>
        <td><button onclick="removeTx('${c.id}')" class="text-red-500">Delete</button></td>
      </tr>`;
  });
}
function renderDebts(list){
  const table=document.getElementById("debts-table");
  table.innerHTML="";
  list.forEach(d=>{
    table.innerHTML+=`
      <tr>
        <td>${d.category}</td><td>₹${d.amount}</td><td>${d.date?.slice(0,10)||""}</td>
        <td>${d.rate}%</td><td>₹${d.interest}</td><td>₹${d.total}</td><td>${d.status}</td>
        <td><button onclick="removeTx('${d.id}')" class="text-red-500">Delete</button></td>
      </tr>`;
  });
}
function renderTransactions(list){
  const table=document.getElementById("transactions-table");
  table.innerHTML="";
  list.forEach(t=>{
    table.innerHTML+=`
      <tr>
        <td>${t.date?.slice(0,10)||""}</td><td>${t.type}</td><td>${t.category}</td><td>₹${t.amount}</td><td>${t.description||""}</td>
        <td><button onclick="removeTx('${t.id}')" class="text-red-500">Delete</button></td>
      </tr>`;
  });
}
function renderStocks(list){
  const table=document.getElementById("stocks-table");
  table.innerHTML="";
  list.forEach(s=>{
    const value=s.quantity*s.current_price;
    const pnl=(s.current_price-s.buy_price)*s.quantity;
    table.innerHTML+=`
      <tr>
        <td>${s.category}</td><td>${s.quantity}</td><td>₹${s.buy_price}</td><td>₹${s.current_price}</td>
        <td>₹${value.toFixed(2)}</td><td class="${pnl>=0?'text-green-400':'text-red-400'}">₹${pnl.toFixed(2)}</td>
      </tr>`;
  });
}

// --- Net Worth & Charts ---
function updateNetWorth(all){
  const credits=all.filter(t=>t.type==="credit").reduce((a,c)=>a+c.amount,0);
  const debts=all.filter(t=>t.type==="debt").reduce((a,d)=>a+d.amount,0);
  const stocks=all.filter(t=>t.type==="stock").reduce((a,s)=>a+s.quantity*s.current_price,0);
  const net=(credits+stocks-debts);
  netWorthDisplay.textContent=`₹ ${net.toLocaleString()}`;
}
let charts={};
function updateCharts(all){
  const credits=all.filter(t=>t.type==="credit").reduce((a,c)=>a+c.amount,0);
  const debts=all.filter(t=>t.type==="debt").reduce((a,d)=>a+d.amount,0);
  const stocks=all.filter(t=>t.type==="stock").reduce((a,s)=>a+s.quantity*s.current_price,0);
  const inflow=all.filter(t=>t.type==="inflow").reduce((a,t)=>a+t.amount,0);
  const outflow=all.filter(t=>t.type==="outflow").reduce((a,t)=>a+t.amount,0);

  // Net Worth Bar
  if(!charts.netWorth){
    charts.netWorth=new Chart(document.getElementById("netWorthChart"),{type:"bar",data:{labels:["Credits","Stocks","Debts"],datasets:[{data:[credits,stocks,debts],backgroundColor:["#00ffb0","#1fa2ff","#e50914"]}]},options:{plugins:{legend:{display:false}}}});
  } else {
    charts.netWorth.data.datasets[0].data=[credits,stocks,debts];
    charts.netWorth.update();
  }
  // Stocks Pie
  if(!charts.stocks){
    charts.stocks=new Chart(document.getElementById("stocksChart"),{type:"pie",data:{labels:all.filter(t=>t.type==="stock").map(s=>s.category),datasets:[{data:all.filter(t=>t.type==="stock").map(s=>s.current_price*s.quantity),backgroundColor:["#e50914","#00ffb0","#1fa2ff","#f9d923","#ff2e63","#08d9d6"]}]},options:{plugins:{legend:{position:"bottom"}}}});
  } else {
    charts.stocks.data.labels=all.filter(t=>t.type==="stock").map(s=>s.category);
    charts.stocks.data.datasets[0].data=all.filter(t=>t.type==="stock").map(s=>s.current_price*s.quantity);
    charts.stocks.update();
  }
  // Budget Pie
  if(!charts.budget){
    charts.budget=new Chart(document.getElementById("budgetPieChart"),{type:"doughnut",data:{labels:["Inflow","Outflow"],datasets:[{data:[inflow,outflow],backgroundColor:["#00ffb0","#e50914"]}]},options:{plugins:{legend:{position:"bottom"}}}});
  } else {
    charts.budget.data.datasets[0].data=[inflow,outflow];
    charts.budget.update();
  }
}
