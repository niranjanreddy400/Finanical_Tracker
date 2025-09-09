// financialTracker.js
// All dashboard logic, rendering, and event handlers

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Replace with your actual Firebase config
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

// DOM Elements
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userIdDisplay = document.getElementById('user-id-display');
const loadingOverlay = document.getElementById('loading-overlay');
const dashboardTab = document.getElementById('dashboard-tab');
const stocksTab = document.getElementById('stocks-tab');
const creditsTab = document.getElementById('credits-tab');
const debtsTab = document.getElementById('debts-tab');
const budgetTab = document.getElementById('budget-tab');
const dashboardView = document.getElementById('dashboard-view');
const stocksView = document.getElementById('stocks-view');
const creditsView = document.getElementById('credits-view');
const debtsView = document.getElementById('debts-view');
const budgetView = document.getElementById('budget-view');
const confirmModal = document.getElementById('confirm-modal');
const modalMessage = document.getElementById('modal-message');

// Data Arrays
let creditsData = [];
let debtsData = [];
let stocksData = [];
let transactionsData = [];

function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
}

onAuthStateChanged(auth, async (user) => {
    showLoading(false);
    if (user) {
        userId = user.uid;
        userIdDisplay.textContent = `User ID: ${userId}`;
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        setupRealtimeListeners();
    } else {
        userId = null;
        userIdDisplay.textContent = 'User ID: N/A';
        loginContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

loginBtn.addEventListener('click', async () => {
    showLoading(true);
    try {
        await signInAnonymously(auth);
    } catch (e) {
        alert('Login failed: ' + e.message);
        showLoading(false);
    }
});

logoutBtn.addEventListener('click', async () => {
    showLoading(true);
    try {
        await signOut(auth);
    } catch (e) {
        alert('Logout failed: ' + e.message);
    }
    showLoading(false);
});

let currentModalAction = null;
function showModal(message, onConfirm) {
    modalMessage.textContent = message;
    confirmModal.classList.remove('hidden');
    currentModalAction = onConfirm;
}
document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    if (currentModalAction) currentModalAction();
});
document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    currentModalAction = null;
});

const tabs = {
    dashboard: { btn: dashboardTab, view: dashboardView },
    stocks: { btn: stocksTab, view: stocksView },
    credits: { btn: creditsTab, view: creditsView },
    debts: { btn: debtsTab, view: debtsView },
    budget: { btn: budgetTab, view: budgetView }
};
function switchTab(activeTab) {
    Object.keys(tabs).forEach(tab => {
        tabs[tab].btn.classList.toggle('active', tab === activeTab);
        tabs[tab].view.classList.toggle('hidden', tab !== activeTab);
    });
}
Object.keys(tabs).forEach(tabName => {
    tabs[tabName].btn.addEventListener('click', () => switchTab(tabName));
});
switchTab('dashboard');

function setupRealtimeListeners() {
    // Add Firestore listeners here for credits, debts, stocks, transactions
}

function renderCredits() {
    creditsView.innerHTML = `<h2 class='text-xl font-bold mb-4 text-indigo-500'>Credits</h2>`;
    if (creditsData.length === 0) {
        creditsView.innerHTML += `<div class='text-gray-400'>No credits added yet.</div>`;
    } else {
        creditsData.forEach(credit => {
            creditsView.innerHTML += `
                <div class='card mb-2'>
                    <div class='font-bold'>${credit.name}</div>
                    <div>Amount: ₹${credit.amount}</div>
                    <div>Date: ${credit.date}</div>
                    <div>Source: ${credit.source}</div>
                </div>
            `;
        });
    }
}

function renderDebts() {
    debtsView.innerHTML = `<h2 class='text-xl font-bold mb-4 text-indigo-500'>Debts</h2>`;
    if (debtsData.length === 0) {
        debtsView.innerHTML += `<div class='text-gray-400'>No debts added yet.</div>`;
    } else {
        debtsData.forEach(debt => {
            debtsView.innerHTML += `
                <div class='card mb-2'>
                    <div class='font-bold'>${debt.name}</div>
                    <div>Amount: ₹${debt.amount}</div>
                    <div>Date: ${debt.date}</div>
                    <div>Lender: ${debt.lender}</div>
                </div>
            `;
        });
    }
}

function renderStocks() {
    stocksView.innerHTML = `<h2 class='text-xl font-bold mb-4 text-indigo-500'>Stocks</h2>`;
    if (stocksData.length === 0) {
        stocksView.innerHTML += `<div class='text-gray-400'>No stocks added yet.</div>`;
    } else {
        stocksData.forEach(stock => {
            stocksView.innerHTML += `
                <div class='card mb-2'>
                    <div class='font-bold'>${stock.symbol}</div>
                    <div>Quantity: ${stock.quantity}</div>
                    <div>Buy Price: ₹${stock.buy_price}</div>
                    <div>Current Price: ₹${stock.current_price}</div>
                </div>
            `;
        });
    }
}

function renderTransactions() {
    const transactionsTable = document.getElementById('transactions-table');
    if (!transactionsTable) return;
    transactionsTable.innerHTML = `<h2 class='text-xl font-bold mb-4 text-indigo-500'>Transactions</h2>`;
    if (transactionsData.length === 0) {
        transactionsTable.innerHTML += `<div class='text-gray-400'>No transactions yet.</div>`;
    } else {
        transactionsData.forEach(tx => {
            transactionsTable.innerHTML += `
                <div class='card mb-2'>
                    <div class='font-bold'>${tx.type === 'inflow' ? 'Inflow' : 'Outflow'}: ${tx.category}</div>
                    <div>Amount: ₹${tx.amount}</div>
                    <div>Date: ${tx.date}</div>
                </div>
            `;
        });
    }
}

function renderBudgetCategories() {
    budgetView.innerHTML = `<h2 class='text-xl font-bold mb-4 text-indigo-500'>Budget</h2>`;
    const inflow = creditsData.reduce((a,c)=>a+c.amount,0);
    const outflow = transactionsData.filter(t=>t.type==='outflow').reduce((a,t)=>a+t.amount,0);
    budgetView.innerHTML += `
        <div class='card'>
            <div class='font-bold'>September 2025</div>
            <div>Inflow: ₹${inflow}</div>
            <div>Outflow: ₹${outflow}</div>
        </div>`;
}

// Household budget parent/subcategory logic for summary
function updateBudgetCategories() {
    const inflowCategoriesDiv = document.getElementById('inflow-categories');
    const outflowCategoriesDiv = document.getElementById('outflow-categories');
    const inflowByCategory = {};
    const outflowByCategory = {};
    transactionsData.forEach(tx => {
        if (tx.type === 'inflow') {
            if (!inflowByCategory[tx.category]) inflowByCategory[tx.category] = 0;
            inflowByCategory[tx.category] += tx.amount;
        } else {
            if (!outflowByCategory[tx.category]) outflowByCategory[tx.category] = 0;
            outflowByCategory[tx.category] += tx.amount;
        }
    });
    inflowCategoriesDiv.innerHTML = '';
    Object.entries(inflowByCategory).forEach(([cat, amt]) => {
        inflowCategoriesDiv.innerHTML += `<div class='flex justify-between'><span>${cat}</span><span>₹${amt}</span></div>`;
    });
    outflowCategoriesDiv.innerHTML = '';
    Object.entries(outflowByCategory).forEach(([cat, amt]) => {
        outflowCategoriesDiv.innerHTML += `<div class='flex justify-between'><span>${cat}</span><span>₹${amt}</span></div>`;
    });
}

function updateAllViews() {
    renderCredits();
    renderDebts();
    renderStocks();
    renderTransactions();
    renderBudgetCategories();
    renderDashboardGraphs();
}

updateAllViews();

// Zerodha API fetcher
const fetchZerodhaBtn = document.getElementById('fetch-zerodha-btn');
if (fetchZerodhaBtn) {
    fetchZerodhaBtn.addEventListener('click', async () => {
        showLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/portfolio');
            const data = await res.json();
            if (data.status === 'success') {
                stocksData = data.data;
                renderStocks();
                switchTab('stocks');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (e) {
            alert('Failed to fetch Zerodha data: ' + e.message);
        }
        showLoading(false);
    });
}

const aiAgentBtn = document.getElementById('ai-agent-btn');
if (aiAgentBtn) {
    aiAgentBtn.addEventListener('click', async () => {
        alert('AI Agent feature coming soon!');
    });
}

// Dynamically create main UI structure
function createMainUI() {
    document.body.innerHTML = `
        <div id="loading-overlay" class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 hidden">
            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
        <div id="login-container" class="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm hidden">
            <h2 class="text-3xl font-bold text-center mb-6 text-indigo-500">Login</h2>
            <p class="text-center text-gray-400 mb-6">Sign in to access your dashboard</p>
            <div class="space-y-4">
                <button id="login-btn" class="btn-primary w-full py-3 px-6">Sign in Anonymously</button>
            </div>
            <p class="text-center text-gray-500 text-sm mt-4">No password needed. Your data is tied to this device.</p>
        </div>
        <div id="app-container" class="bg-gray-800 rounded-2xl shadow-lg w-full max-w-7xl h-auto overflow-hidden flex flex-col hidden">
            <div class="p-6 bg-gray-900 flex justify-between items-center rounded-t-2xl">
                <h1 class="text-2xl font-bold text-indigo-500">My Financial Dashboard</h1>
                <div class="flex items-center space-x-4">
                    <span id="user-id-display" class="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full truncate max-w-xs">User ID: N/A</span>
                    <button id="logout-btn" class="btn-primary px-4 py-2">Logout</button>
                </div>
            </div>
            <div class="flex-grow flex flex-col p-6 space-y-4">
                <div class="flex space-x-2 border-b-2 border-gray-700">
                    <button id="dashboard-tab" class="tab-button px-4 py-2 text-sm font-medium rounded-t-lg active">Dashboard</button>
                    <button id="stocks-tab" class="tab-button px-4 py-2 text-sm font-medium rounded-t-lg">Stocks</button>
                    <button id="credits-tab" class="tab-button px-4 py-2 text-sm font-medium rounded-t-lg">Credits</button>
                    <button id="debts-tab" class="tab-button px-4 py-2 text-sm font-medium rounded-t-lg">Debts</button>
                    <button id="budget-tab" class="tab-button px-4 py-2 text-sm font-medium rounded-t-lg">Budget</button>
                </div>
                <div id="dashboard-view" class="tab-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
                <div id="stocks-view" class="tab-content hidden"></div>
                <div id="credits-view" class="tab-content hidden"></div>
                <div id="debts-view" class="tab-content hidden"></div>
                <div id="budget-view" class="tab-content hidden"></div>
            </div>
        </div>
        <div id="confirm-modal" class="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 hidden">
            <div class="modal p-6 shadow-lg w-full max-w-sm text-center">
                <h3 class="text-xl font-bold mb-4">Confirm Action</h3>
                <p id="modal-message" class="text-gray-400 mb-6"></p>
                <div class="flex justify-center space-x-4">
                    <button id="modal-confirm-btn" class="btn-primary px-4 py-2">Confirm</button>
                    <button id="modal-cancel-btn" class="btn-primary px-4 py-2">Cancel</button>
                </div>
            </div>
        </div>
    `;
}

// Call this at the top of your script to build the UI
createMainUI();

// Event handler functions for HTML onclick attributes
window.onLoginClick = async function() {
    showLoading(true);
    try {
        await signInAnonymously(auth);
    } catch (e) {
        alert('Login failed: ' + e.message);
        showLoading(false);
    }
};
window.onLogoutClick = async function() {
    showLoading(true);
    try {
        await signOut(auth);
    } catch (e) {
        alert('Logout failed: ' + e.message);
    }
    showLoading(false);
};
window.switchTab = function(tab) {
    Object.keys(tabs).forEach(t => {
        tabs[t].btn.classList.toggle('active', t === tab);
        tabs[t].view.classList.toggle('hidden', t !== tab);
    });
};
window.onFetchZerodhaClick = async function() {
    showLoading(true);
    try {
        const res = await fetch('http://localhost:5000/api/portfolio');
        const data = await res.json();
        if (data.status === 'success') {
            stocksData = data.data;
            updateStocksTable();
            switchTab('stocks');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        alert('Failed to fetch Zerodha data: ' + e.message);
    }
    showLoading(false);
};
window.onAddCreditSubmit = function(e) {
    e.preventDefault();
    const person = document.getElementById('credit-person').value;
    const amount = parseFloat(document.getElementById('credit-amount').value);
    const rate = parseFloat(document.getElementById('credit-rate').value);
    const date = new Date().toISOString().split('T')[0];
    const interest = amount * rate / 100;
    const total = amount + interest;
    creditsData.push({
        name: person,
        amount,
        rate,
        interest,
        total,
        date,
        status: 'Active'
    });
    updateCreditsTable();
    document.getElementById('add-credit-form').reset();
};
window.onAddDebtSubmit = function(e) {
    e.preventDefault();
    const person = document.getElementById('debt-person').value;
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const rate = parseFloat(document.getElementById('debt-rate').value);
    const date = document.getElementById('debt-date').value;
    const interest = amount * rate / 100;
    const total = amount + interest;
    debtsData.push({
        name: person,
        amount,
        rate,
        interest,
        total,
        date,
        status: 'Active'
    });
    updateDebtsTable();
    document.getElementById('add-debt-form').reset();
};
window.onAddTransactionSubmit = function(e) {
    e.preventDefault();
    const type = document.getElementById('transaction-type').value;
    const category = document.getElementById('transaction-category').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const date = new Date().toISOString().split('T')[0];
    transactionsData.push({
        type,
        category,
        amount,
        description,
        date
    });
    updateTransactionsTable();
    updateBudgetCategories();
    document.getElementById('add-transaction-form').reset();
};
window.onModalConfirm = function() {
    confirmModal.classList.add('hidden');
    if (currentModalAction) currentModalAction();
};
window.onModalCancel = function() {
    confirmModal.classList.add('hidden');
    currentModalAction = null;
};

// --- Credits Form Functionality ---
const addCreditForm = document.getElementById('add-credit-form');
const creditsTable = document.getElementById('credits-table');
if (addCreditForm && creditsTable) {
    addCreditForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const person = document.getElementById('credit-person').value;
        const amount = parseFloat(document.getElementById('credit-amount').value);
        const rate = parseFloat(document.getElementById('credit-rate').value);
        // Tenure replaced with Date
        const date = new Date().toISOString().split('T')[0];
        const interest = amount * rate / 100;
        const total = amount + interest;
        creditsData.push({
            name: person,
            amount,
            rate,
            interest,
            total,
            date,
            status: 'Active'
        });
        updateCreditsTable();
        addCreditForm.reset();
    });
}
function updateCreditsTable() {
    const creditsTable = document.getElementById('credits-table');
    if (!creditsTable) {
        console.warn('credits-table element not found in DOM');
        return;
    }
    creditsTable.innerHTML = '';
    creditsData.forEach((credit, idx) => {
        creditsTable.innerHTML += `
            <tr>
                <td class='px-4 py-2'>${credit.name}</td>
                <td class='px-4 py-2'>₹${credit.amount}</td>
                <td class='px-4 py-2'>${credit.rate}%</td>
                <td class='px-4 py-2'>₹${credit.interest}</td>
                <td class='px-4 py-2'>₹${credit.total}</td>
                <td class='px-4 py-2'>${credit.date}</td>
                <td class='px-4 py-2'>${credit.status}</td>
                <td class='px-4 py-2'><button onclick='removeCredit(${idx})' class='text-red-500'>Delete</button></td>
            </tr>
        `;
    });
}
window.removeCredit = function(idx) {
    creditsData.splice(idx, 1);
    updateCreditsTable();
};

// --- Debts Form Functionality ---
const addDebtForm = document.getElementById('add-debt-form');
const debtsTable = document.getElementById('debts-table');
if (addDebtForm && debtsTable) {
    addDebtForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const person = document.getElementById('debt-person').value;
        const amount = parseFloat(document.getElementById('debt-amount').value);
        const rate = parseFloat(document.getElementById('debt-rate').value);
        const date = document.getElementById('debt-date').value;
        const interest = amount * rate / 100;
        const total = amount + interest;
        debtsData.push({
            name: person,
            amount,
            rate,
            interest,
            total,
            date,
            status: 'Active'
        });
        updateDebtsTable();
        addDebtForm.reset();
    });
}
function updateDebtsTable() {
    debtsTable.innerHTML = '';
    debtsData.forEach((debt, idx) => {
        debtsTable.innerHTML += `
            <tr>
                <td class='px-4 py-2'>${debt.name}</td>
                <td class='px-4 py-2'>₹${debt.amount}</td>
                <td class='px-4 py-2'>${debt.date}</td>
                <td class='px-4 py-2'>${debt.rate}%</td>
                <td class='px-4 py-2'>₹${debt.interest}</td>
                <td class='px-4 py-2'>₹${debt.total}</td>
                <td class='px-4 py-2'>${debt.status}</td>
                <td class='px-4 py-2'><button onclick='removeDebt(${idx})' class='text-red-500'>Delete</button></td>
            </tr>
        `;
    });
}
window.removeDebt = function(idx) {
    debtsData.splice(idx, 1);
    updateDebtsTable();
};

// --- Transactions Form Functionality ---
const addTransactionForm = document.getElementById('add-transaction-form');
const transactionsTable = document.getElementById('transactions-table');
if (addTransactionForm && transactionsTable) {
    addTransactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('transaction-type').value;
        const category = document.getElementById('transaction-category').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const description = document.getElementById('transaction-description').value;
        const date = new Date().toISOString().split('T')[0];
        transactionsData.push({
            type,
            category,
            amount,
            description,
            date
        });
        updateTransactionsTable();
        updateBudgetCategories();
        addTransactionForm.reset();
    });
}
function updateTransactionsTable() {
    transactionsTable.innerHTML = '';
    transactionsData.forEach((tx, idx) => {
        transactionsTable.innerHTML += `
            <tr>
                <td class='px-4 py-2'>${tx.date}</td>
                <td class='px-4 py-2'>${tx.type}</td>
                <td class='px-4 py-2'>${tx.category}</td>
                <td class='px-4 py-2'>₹${tx.amount}</td>
                <td class='px-4 py-2'>${tx.description}</td>
                <td class='px-4 py-2'><button onclick='removeTransaction(${idx})' class='text-red-500'>Delete</button></td>
            </tr>
        `;
    });
}
window.removeTransaction = function(idx) {
    transactionsData.splice(idx, 1);
    updateTransactionsTable();
};

// --- Stocks Table Functionality ---
const stocksTable = document.getElementById('stocks-table');
function updateStocksTable() {
    stocksTable.innerHTML = '';
    stocksData.forEach((stock, idx) => {
        const value = stock.quantity * stock.current_price;
        const pnl = (stock.current_price - stock.buy_price) * stock.quantity;
        stocksTable.innerHTML += `
            <tr>
                <td class='px-4 py-2'>${stock.symbol}</td>
                <td class='px-4 py-2'>${stock.quantity}</td>
                <td class='px-4 py-2'>₹${stock.buy_price}</td>
                <td class='px-4 py-2'>₹${stock.current_price}</td>
                <td class='px-4 py-2'>₹${value.toFixed(2)}</td>
                <td class='px-4 py-2'>₹${pnl.toFixed(2)}</td>
            </tr>
        `;
    });
}
// Call updateStocksTable after stocksData changes

// --- Initial Table Renders ---
updateCreditsTable();
updateDebtsTable();
updateTransactionsTable();
updateStocksTable();

function renderDashboardGraphs() {
    // Net Worth Bar Chart
    const ctxNetWorth = document.getElementById('netWorthChart').getContext('2d');
    new Chart(ctxNetWorth, {
        type: 'bar',
        data: {
            labels: ['Stocks', 'Credits', 'Debts'],
            datasets: [{
                label: 'Value',
                data: [
                    stocksData.reduce((a,s)=>a+s.current_price*s.quantity,0),
                    creditsData.reduce((a,c)=>a+c.amount,0),
                    debtsData.reduce((a,d)=>a+d.amount,0)
                ],
                backgroundColor: ['#e50914', '#00ffb0', '#1fa2ff']
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
    // Stocks Pie Chart
    const ctxStocks = document.getElementById('stocksChart').getContext('2d');
    new Chart(ctxStocks, {
        type: 'pie',
        data: {
            labels: stocksData.map(s=>s.symbol),
            datasets: [{
                data: stocksData.map(s=>s.current_price*s.quantity),
                backgroundColor: ['#e50914', '#00ffb0', '#1fa2ff', '#f9d923', '#ff2e63', '#08d9d6']
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom' } }
        }
    });
    // Budget Pie Chart
    const ctxBudget = document.getElementById('budgetPieChart').getContext('2d');
    const inflow = creditsData.reduce((a,c)=>a+c.amount,0);
    const outflow = transactionsData.filter(t=>t.type==='outflow').reduce((a,t)=>a+t.amount,0);
    new Chart(ctxBudget, {
        type: 'doughnut',
        data: {
            labels: ['Inflow', 'Outflow'],
            datasets: [{
                data: [inflow, outflow],
                backgroundColor: ['#00ffb0', '#e50914']
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom' } }
        }
    });
}
