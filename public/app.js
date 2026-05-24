// --- State Management ---
const state = {
  activeTab: 'overview',
  balance: null,
  transactions: [],
  customers: [],
  banks: [],
  recipients: [],
  transfers: [],
  plans: [],
  subscriptions: [],
  settlements: [],
  resolvedAccount: null // holds temporary verified account details
};

// --- DOM References ---
const DOM = {
  navButtons: document.querySelectorAll('.nav-btn'),
  tabs: document.querySelectorAll('.tab-pane'),
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  refreshBtn: document.getElementById('refresh-all-btn'),
  toast: document.getElementById('toast'),
  
  // Overview Tab
  balanceNgn: document.getElementById('balance-ngn'),
  totalMoneyIn: document.getElementById('total-money-in'),
  totalMoneyOut: document.getElementById('total-money-out'),
  inCurrencyTag: document.getElementById('in-currency-tag'),
  outCurrencyTag: document.getElementById('out-currency-tag'),
  pendingQueueVal: document.getElementById('pending-queue-val'),
  queueCurrencyTag: document.getElementById('queue-currency-tag'),
  payoutsCount: document.getElementById('payouts-count'),
  recentPaymentsTable: document.getElementById('recent-payments-table').querySelector('tbody'),
  viewAllLink: document.querySelector('.view-all-link'),
  
  // Transactions Tab
  paymentsTable: document.getElementById('payments-table').querySelector('tbody'),
  txFilterStatus: document.getElementById('tx-filter-status'),
  verifyForm: document.getElementById('verify-form'),
  verifyRef: document.getElementById('verify-ref'),
  refundForm: document.getElementById('refund-form'),
  refundTx: document.getElementById('refund-tx'),
  refundAmount: document.getElementById('refund-amount'),
  
  // Customers Tab
  customersTable: document.getElementById('customers-table').querySelector('tbody'),
  createCustomerForm: document.getElementById('create-customer-form'),
  custEmail: document.getElementById('cust-email'),
  custFname: document.getElementById('cust-fname'),
  custLname: document.getElementById('cust-lname'),
  custPhone: document.getElementById('cust-phone'),
  
  // Transfers Tab
  resolveCountry: document.getElementById('resolve-country'),
  resolveBank: document.getElementById('resolve-bank'),
  resolveAccount: document.getElementById('resolve-account'),
  resolveForm: document.getElementById('resolve-bank-form'),
  resolveResult: document.getElementById('resolve-result'),
  resolvedName: document.getElementById('resolved-name'),
  btnVerifyAccount: document.getElementById('btn-verify-account'),
  btnSaveRecipient: document.getElementById('btn-save-recipient'),
  lookupNoticeBox: document.getElementById('lookup-notice-box'),
  manualRecipientNameGroup: document.getElementById('manual-recipient-name-group'),
  manualRecipientName: document.getElementById('manual-recipient-name'),
  
  transferForm: document.getElementById('transfer-form'),
  transferRecipient: document.getElementById('transfer-recipient'),
  transferAmount: document.getElementById('transfer-amount'),
  transferCurrency: document.getElementById('transfer-currency'),
  transferReason: document.getElementById('transfer-reason'),
  transfersHistoryList: document.getElementById('transfers-history-list'),

  // Subscriptions Tab
  createPlanForm: document.getElementById('create-plan-form'),
  planName: document.getElementById('plan-name'),
  planAmount: document.getElementById('plan-amount'),
  planCurrency: document.getElementById('plan-currency'),
  planInterval: document.getElementById('plan-interval'),
  plansTable: document.getElementById('plans-table').querySelector('tbody'),
  subscriptionsTable: document.getElementById('subscriptions-table').querySelector('tbody'),
  
  // Charge Mobile / Token Tab
  chargeForm: document.getElementById('charge-mpesa-form'),
  chargeEmail: document.getElementById('charge-email'),
  chargeAmount: document.getElementById('charge-amount'),
  chargePhone: document.getElementById('charge-phone'),
  
  chargeTokenForm: document.getElementById('charge-token-form'),
  tokenEmail: document.getElementById('token-email'),
  tokenAuth: document.getElementById('token-auth'),
  tokenAmount: document.getElementById('token-amount'),
  tokenCurrency: document.getElementById('token-currency'),
  savedCardsTable: document.getElementById('saved-cards-table').querySelector('tbody'),
  settlementsTable: document.getElementById('settlements-table').querySelector('tbody'),

  // Modals
  txModal: document.getElementById('tx-modal'),
  closeTxModal: document.getElementById('close-tx-modal'),
  modalTxBody: document.getElementById('modal-tx-body'),
  modalTxTitle: document.getElementById('modal-tx-title')
};

// --- Helper: Format Currency ---
function formatCurrency(amount, currency = 'NGN') {
  // Paystack returns amounts in standard lowest units (e.g. kobo or cents)
  // Let's divide by 100 to get main unit
  const mainUnit = parseFloat(amount || 0) / 100;
  
  const formatters = {
    NGN: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    GHS: new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }),
    KES: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }),
    ZAR: new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })
  };

  const formatter = formatters[currency.toUpperCase()] || new Intl.NumberFormat('en-US', { style: 'currency', currency });
  return formatter.format(mainUnit);
}

// --- Helper: Format Date ---
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// --- Helper: Toast Notification ---
function showToast(message, type = 'info') {
  DOM.toast.textContent = message;
  DOM.toast.className = `toast ${type}`;
  DOM.toast.classList.remove('hidden');
  
  setTimeout(() => {
    DOM.toast.classList.add('hidden');
  }, 4000);
}

// --- API Service Calls ---
const API = {
  async fetchBalance() {
    try {
      const response = await fetch('/api/balance');
      const resData = await response.json();
      if (resData.status) {
        state.balance = resData.data;
        updateBalanceUI();
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  },

  async fetchTransactions(status = '') {
    try {
      const url = status ? `/api/transactions?status=${status}` : '/api/transactions';
      const response = await fetch(url);
      const resData = await response.json();
      if (resData.status) {
        state.transactions = resData.data;
        updateTransactionsUI();
      } else {
        showToast(resData.message || 'Failed to load transactions', 'error');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  },

  async fetchCustomers() {
    try {
      const response = await fetch('/api/customers');
      const resData = await response.json();
      if (resData.status) {
        state.customers = resData.data;
        updateCustomersUI();
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  },

  async fetchBanks(country) {
    try {
      const response = await fetch(`/api/banks?country=${country}`);
      const resData = await response.json();
      if (resData.status) {
        state.banks = resData.data;
        populateBanksDropdown();
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  },

  async fetchTransfers() {
    try {
      const response = await fetch('/api/transfers');
      const resData = await response.json();
      if (resData.status) {
        state.transfers = resData.data;
        updateTransfersUI();
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
    }
  },

  async fetchRecipients() {
    try {
      const response = await fetch('/api/transfers/recipients');
      const resData = await response.json();
      if (resData.status) {
        state.recipients = resData.data;
        updateTransfersUI();
      }
    } catch (err) {
      console.error('Error fetching recipients:', err);
    }
  },

  async fetchPlans() {
    try {
      const response = await fetch('/api/plans');
      const resData = await response.json();
      if (resData.status) {
        state.plans = resData.data;
        updatePlansUI();
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  },

  async fetchSubscriptions() {
    try {
      const response = await fetch('/api/subscriptions');
      const resData = await response.json();
      if (resData.status) {
        state.subscriptions = resData.data;
        updateSubscriptionsUI();
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  },

  async fetchSettlements() {
    try {
      const response = await fetch('/api/settlements');
      const resData = await response.json();
      if (resData.status) {
        state.settlements = resData.data;
        updateSettlementsUI();
      }
    } catch (err) {
      console.error('Error fetching settlements:', err);
    }
  }
};

// --- UI Rendering Engines ---

function updateBalanceUI() {
  // Determine primary currency from transactions first, fallback to KES
  let primaryCurrency = 'KES';
  if (state.transactions && state.transactions.length > 0) {
    primaryCurrency = state.transactions[0].currency;
  } else if (state.balance && state.balance.length > 0) {
    primaryCurrency = state.balance[0].currency;
  }

  // 1. Wallet Balance (current active balance in primary currency)
  let walletBalanceVal = 0;
  if (state.balance && state.balance.length > 0) {
    const balObj = state.balance.find(b => b.currency === primaryCurrency) || state.balance[0];
    if (balObj) {
      walletBalanceVal = balObj.balance;
      primaryCurrency = balObj.currency;
    }
  }
  DOM.balanceNgn.textContent = formatCurrency(walletBalanceVal, primaryCurrency);
  document.querySelector('#balance-grid .metric-card:first-child .currency-tag').textContent = primaryCurrency;
  document.querySelector('#balance-grid .metric-card:first-child .metric-title').textContent = 'Wallet Balance';

  // 2. Total Money In (sum of successful transactions)
  let totalInSubunit = 0;
  state.transactions.forEach(tx => {
    if (tx.status === 'success' && tx.currency === primaryCurrency) {
      totalInSubunit += tx.amount;
    }
  });
  DOM.totalMoneyIn.textContent = formatCurrency(totalInSubunit, primaryCurrency);
  DOM.inCurrencyTag.textContent = primaryCurrency;

  // 3. Total Settled Out (sum of successful settlements + successful manual payouts)
  let totalOutSubunit = 0;
  state.settlements.forEach(s => {
    if (s.status === 'success' && s.currency === primaryCurrency) {
      totalOutSubunit += (s.effective_amount || s.total_amount || 0);
    }
  });
  state.transfers.forEach(t => {
    if (t.status === 'success' && t.currency === primaryCurrency) {
      totalOutSubunit += t.amount;
    }
  });
  DOM.totalMoneyOut.textContent = formatCurrency(totalOutSubunit, primaryCurrency);
  DOM.outCurrencyTag.textContent = primaryCurrency;

  // 4. Pending Payout Queue (Total processed - settled out - current wallet balance)
  let pendingQueueSubunit = totalInSubunit - totalOutSubunit - walletBalanceVal;
  if (pendingQueueSubunit < 0) pendingQueueSubunit = 0;
  DOM.pendingQueueVal.textContent = formatCurrency(pendingQueueSubunit, primaryCurrency);
  DOM.queueCurrencyTag.textContent = primaryCurrency;

  // 5. Payout Operations Count
  const totalPayoutEntries = state.settlements.length + state.transfers.length;
  DOM.payoutsCount.textContent = totalPayoutEntries;
}

function updateTransactionsUI() {
  // 1. Overview recent table (max 5)
  const recent = state.transactions.slice(0, 5);
  if (recent.length === 0) {
    DOM.recentPaymentsTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions found</td></tr>`;
  } else {
    DOM.recentPaymentsTable.innerHTML = recent.map(tx => `
      <tr>
        <td>
          <div class="cust-details">
            <span class="cust-name font-weight-semibold">${(tx.customer.first_name || '') + ' ' + (tx.customer.last_name || '')}</span>
            <span class="cust-email text-muted text-sm block">${tx.customer.email}</span>
          </div>
        </td>
        <td class="text-code">${tx.reference}</td>
        <td class="font-weight-semibold">${formatCurrency(tx.amount, tx.currency)}</td>
        <td><span class="status-badge ${tx.status}">${tx.status}</span></td>
        <td>${formatDate(tx.created_at)}</td>
      </tr>
    `).join('');
  }

  // 2. Full Transactions Tab Table
  if (state.transactions.length === 0) {
    DOM.paymentsTable.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No transactions found</td></tr>`;
  } else {
    DOM.paymentsTable.innerHTML = state.transactions.map(tx => `
      <tr>
        <td>
          <div class="cust-details">
            <strong>${(tx.customer.first_name || '') + ' ' + (tx.customer.last_name || '')}</strong>
            <span class="text-muted block text-sm">${tx.customer.email}</span>
          </div>
        </td>
        <td class="text-code">${tx.reference}</td>
        <td><strong>${formatCurrency(tx.amount, tx.currency)}</strong></td>
        <td><span class="status-badge ${tx.status}">${tx.status}</span></td>
        <td><span class="text-capitalize text-sm">${tx.channel || 'N/A'}</span></td>
        <td>${formatDate(tx.created_at)}</td>
        <td>
          <button class="btn btn-secondary btn-icon compact-btn" onclick="viewTransactionDetails('${tx.reference}')">
            Details
          </button>
        </td>
      </tr>
    `).join('');
  }

  // 3. Update Saved Cards Directory under Request Payment Tab
  updateSavedCardsUI();
  
  // 4. Update dynamic money ledger metrics
  updateBalanceUI();
}

function updateSavedCardsUI() {
  if (!DOM.savedCardsTable) return;
  const cardsMap = new Map();

  // Extract all unique successful authorizations from transactions
  state.transactions.forEach(tx => {
    if (tx.status === 'success' && tx.authorization && tx.authorization.authorization_code) {
      const auth = tx.authorization;
      const key = `${tx.customer.email}-${auth.authorization_code}`;
      if (!cardsMap.has(key)) {
        cardsMap.set(key, {
          email: tx.customer.email,
          brand: auth.brand,
          last4: auth.last4,
          bank: auth.bank || 'N/A',
          country: auth.country_code || 'N/A',
          auth_code: auth.authorization_code
        });
      }
    }
  });

  const cards = Array.from(cardsMap.values());

  if (cards.length === 0) {
    DOM.savedCardsTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No saved cards found in transactions history.</td></tr>`;
    return;
  }

  DOM.savedCardsTable.innerHTML = cards.map(c => `
    <tr>
      <td><strong>${c.email}</strong></td>
      <td class="text-capitalize">${c.brand}</td>
      <td>•••• •••• •••• ${c.last4}</td>
      <td>${c.bank} (${c.country})</td>
      <td class="text-code">${c.auth_code}</td>
      <td>
        <button class="btn btn-secondary compact-btn" onclick="useSavedCard('${c.email}', '${c.auth_code}')">
          Use Card
        </button>
      </td>
    </tr>
  `).join('');
}

window.useSavedCard = function(email, authCode) {
  DOM.tokenEmail.value = email;
  DOM.tokenAuth.value = authCode;
  
  showToast('Saved card details auto-populated!', 'info');
  DOM.tokenEmail.focus();
};

function updateCustomersUI() {
  if (state.customers.length === 0) {
    DOM.customersTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No registered customers</td></tr>`;
  } else {
    DOM.customersTable.innerHTML = state.customers.map(c => `
      <tr>
        <td><strong>${(c.first_name || '') + ' ' + (c.last_name || '') || 'Anonymous'}</strong></td>
        <td>${c.email}</td>
        <td>${c.phone || 'N/A'}</td>
        <td class="text-code">${c.customer_code}</td>
        <td>${formatDate(c.createdAt)}</td>
      </tr>
    `).join('');
  }
}

function populateBanksDropdown() {
  if (state.banks.length === 0) {
    DOM.resolveBank.innerHTML = `<option value="">No banks found</option>`;
    return;
  }
  DOM.resolveBank.innerHTML = '<option value="">-- Choose Bank --</option>' + 
    state.banks.map(bank => `<option value="${bank.code}">${bank.name}</option>`).join('');
}

function toggleTransfersVerificationLayout() {
  const country = DOM.resolveCountry.value;
  const bankCode = DOM.resolveBank.value;
  const isMpesa = country === 'kenya' && bankCode === 'MPESA';

  DOM.lookupNoticeBox.classList.toggle('hidden', !isMpesa);
  DOM.manualRecipientNameGroup.classList.toggle('hidden', !isMpesa);

  if (isMpesa) {
    DOM.btnVerifyAccount.classList.add('hidden');
    DOM.btnSaveRecipient.classList.remove('hidden');
    DOM.btnSaveRecipient.textContent = 'Save M-Pesa Recipient';
    DOM.resolveAccount.placeholder = 'e.g. 0769175333 or 254769175333';
  } else {
    DOM.btnVerifyAccount.classList.remove('hidden');
    DOM.btnSaveRecipient.classList.add('hidden');
    DOM.btnSaveRecipient.textContent = 'Add as Recipient';
    DOM.resolveAccount.placeholder = '10 digits (e.g. 0123456789)';
  }
}

function updateTransfersUI() {
  // 1. Recipient dropdown list
  if (!state.recipients || state.recipients.length === 0) {
    DOM.transferRecipient.innerHTML = `<option value="">No saved recipients found. Verify an account first.</option>`;
  } else {
    DOM.transferRecipient.innerHTML = '<option value="">-- Select Registered Payout Account --</option>' + 
      state.recipients.map(r => `
        <option value="${r.recipient_code}" data-currency="${r.currency || 'NGN'}">
          ${r.name || (r.details && r.details.account_name)} (${(r.details && r.details.bank_name) || 'Mobile Wallet'} - ${(r.details && r.details.account_number) || r.recipient_code})
        </option>
      `).join('');
  }

  // 2. Update metric payout count
  DOM.payoutsCount.textContent = state.transfers.length;

  // 3. Transfers history list
  if (state.transfers.length === 0) {
    DOM.transfersHistoryList.innerHTML = `<div class="text-center text-muted py-4 text-sm">No payout transfers initiated yet</div>`;
  } else {
    DOM.transfersHistoryList.innerHTML = state.transfers.map(t => `
      <div class="transfer-item">
        <div class="transfer-item-left">
          <span class="transfer-recipient-name">${t.recipient?.details?.account_name || 'Transfer Recipient'}</span>
          <span class="transfer-bank-desc">${t.recipient?.details?.bank_name} • ${t.recipient?.details?.account_number}</span>
          <span class="text-muted text-sm font-mono block">Ref: ${t.transfer_code}</span>
        </div>
        <div class="transfer-item-right">
          <span class="transfer-amount">${formatCurrency(t.amount, t.currency)}</span>
          <span class="status-badge ${t.status === 'success' ? 'success' : t.status === 'failed' ? 'failed' : 'pending'}">${t.status}</span>
        </div>
      </div>
    `).join('');
  }
  
  // Update dynamic money ledger metrics
  updateBalanceUI();
}

function updateSettlementsUI() {
  if (!DOM.settlementsTable) return;
  if (!state.settlements || state.settlements.length === 0) {
    DOM.settlementsTable.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No automated payouts found.</td></tr>`;
    return;
  }

  DOM.settlementsTable.innerHTML = state.settlements.map(s => `
    <tr>
      <td><span class="font-mono text-sm">${s.id}</span></td>
      <td><strong>Primary Settlement Account</strong></td>
      <td>${formatCurrency(s.total_amount, s.currency)}</td>
      <td class="text-danger">-${formatCurrency(s.total_fees || 0, s.currency)}</td>
      <td class="text-success font-weight-bold">${formatCurrency(s.effective_amount, s.currency)}</td>
      <td>${formatDate(s.settlement_date)}</td>
      <td><span class="status-badge ${s.status === 'success' ? 'success' : s.status === 'failed' ? 'failed' : 'pending'}">${s.status}</span></td>
    </tr>
  `).join('');

  // Update dynamic money ledger metrics
  updateBalanceUI();
}

function updatePlansUI() {
  if (state.plans.length === 0) {
    DOM.plansTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No plans created</td></tr>`;
  } else {
    DOM.plansTable.innerHTML = state.plans.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td class="text-code">${p.plan_code}</td>
        <td><strong>${formatCurrency(p.amount, p.currency)}</strong></td>
        <td class="text-capitalize">${p.interval}</td>
        <td>${p.subscriptions?.length || 0}</td>
      </tr>
    `).join('');
  }
}

function updateSubscriptionsUI() {
  if (state.subscriptions.length === 0) {
    DOM.subscriptionsTable.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No active subscriptions found</td></tr>`;
  } else {
    DOM.subscriptionsTable.innerHTML = state.subscriptions.map(s => `
      <tr>
        <td>${s.customer.email}</td>
        <td class="text-code">${s.subscription_code}</td>
        <td>${s.plan.name}</td>
        <td><span class="status-badge ${s.status === 'active' ? 'success' : 'failed'}">${s.status}</span></td>
        <td>${formatDate(s.createdAt)}</td>
        <td class="text-code">${s.authorization?.authorization_code || 'N/A'}</td>
      </tr>
    `).join('');
  }
}

// --- Dynamic Modal View Details ---
window.viewTransactionDetails = function(reference) {
  const tx = state.transactions.find(t => t.reference === reference);
  if (!tx) {
    showToast('Transaction details not loaded locally', 'error');
    return;
  }

  DOM.modalTxTitle.textContent = `Receipt Reference: ${tx.reference}`;
  
  let modalContent = `
    <div class="modal-badge-wrapper">
      <span class="status-badge ${tx.status}" style="font-size: 14px; padding: 6px 16px;">${tx.status}</span>
    </div>
    <div class="modal-row">
      <span>Amount Paid:</span>
      <span>${formatCurrency(tx.amount, tx.currency)}</span>
    </div>
    <div class="modal-row">
      <span>Customer Name:</span>
      <span>${(tx.customer.first_name || '') + ' ' + (tx.customer.last_name || '') || 'N/A'}</span>
    </div>
    <div class="modal-row">
      <span>Customer Email:</span>
      <span>${tx.customer.email}</span>
    </div>
    <div class="modal-row">
      <span>Transaction Date:</span>
      <span>${formatDate(tx.created_at)}</span>
    </div>
    <div class="modal-row">
      <span>Payment Channel:</span>
      <span class="text-capitalize">${tx.channel}</span>
    </div>
    <div class="modal-row">
      <span>IP Address:</span>
      <span>${tx.ip_address || 'N/A'}</span>
    </div>
  `;

  // Authorization details if card
  if (tx.authorization) {
    const auth = tx.authorization;
    if (auth.card_type) {
      modalContent += `
        <hr class="modal-divider">
        <h4>💳 Card Information</h4>
        <div class="modal-row">
          <span>Card Brand:</span>
          <span class="text-capitalize">${auth.brand} (${auth.card_type})</span>
        </div>
        <div class="modal-row">
          <span>Last 4 Digits:</span>
          <span>•••• •••• •••• ${auth.last4}</span>
        </div>
        <div class="modal-row">
          <span>Bank Name:</span>
          <span>${auth.bank || 'N/A'}</span>
        </div>
        <div class="modal-row">
          <span>Country:</span>
          <span>${auth.country_code || 'N/A'}</span>
        </div>
        <div class="modal-row">
          <span>Auth Token (for recurring charges):</span>
          <span class="text-code">${auth.authorization_code}</span>
        </div>
      `;
    } else if (auth.bank) {
      modalContent += `
        <hr class="modal-divider">
        <h4>🏦 Direct Bank Debit</h4>
        <div class="modal-row">
          <span>Bank Name:</span>
          <span>${auth.bank}</span>
        </div>
      `;
    }
  }

  DOM.modalTxBody.innerHTML = modalContent;
  DOM.txModal.classList.remove('hidden');
};

// --- Tab Switching Manager ---
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Toggle tab contents
  DOM.tabs.forEach(tab => {
    tab.classList.toggle('active', tab.id === `${tabId}-tab`);
  });
  
  // Toggle sidebar navigation buttons active state
  DOM.navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Update Header Labels
  const titles = {
    overview: { main: 'Overview', sub: 'Real-time status of your backend operations' },
    transactions: { main: 'Transactions & Payments', sub: 'Verify references, issue refunds, and audit balances' },
    customers: { main: 'Customers Hub', sub: 'Inspect profiles, add records, and review accounts' },
    transfers: { main: 'Transfers & Payouts', sub: 'Perform bank lookups and send out secure real-time money transfers' },
    charge: { main: 'Request Payment', sub: 'Initiate dynamic M-Pesa mobile money collection prompts' },
    subscriptions: { main: 'Billing Plans & Recurring', sub: 'Establish payment terms, plans, and monitor automatic renewals' }
  };

  const selected = titles[tabId] || { main: 'Operations console', sub: '' };
  DOM.pageTitle.textContent = selected.main;
  DOM.pageSubtitle.textContent = selected.sub;

  // Trigger content loading logic based on what tab is opened
  loadTabSpecificData(tabId);
}

function loadTabSpecificData(tabId) {
  switch (tabId) {
    case 'overview':
      API.fetchBalance();
      API.fetchTransactions();
      API.fetchTransfers();
      API.fetchRecipients();
      API.fetchSettlements();
      break;
    case 'transactions':
      API.fetchTransactions();
      break;
    case 'customers':
      API.fetchCustomers();
      break;
    case 'transfers':
      API.fetchTransfers();
      API.fetchRecipients();
      API.fetchSettlements();
      // Load initial Nigeria banks
      API.fetchBanks(DOM.resolveCountry.value);
      break;
    case 'subscriptions':
      API.fetchPlans();
      API.fetchSubscriptions();
      break;
  }
}

// --- Event Listeners and Submissions ---

function initEventListeners() {
  // Navigation
  DOM.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Overview page View All link redirect
  DOM.viewAllLink.addEventListener('click', (e) => {
    const target = e.target.getAttribute('data-target-tab');
    if (target) switchTab(target);
  });

  // Refresh Manual Action button
  DOM.refreshBtn.addEventListener('click', () => {
    showToast('Refreshing all backend operations...', 'info');
    loadTabSpecificData(state.activeTab);
  });

  // Transaction Status Filtering
  DOM.txFilterStatus.addEventListener('change', (e) => {
    API.fetchTransactions(e.target.value);
  });

  // Modal Close Action
  DOM.closeTxModal.addEventListener('click', () => DOM.txModal.classList.add('hidden'));
  window.addEventListener('click', (e) => {
    if (e.target === DOM.txModal) DOM.txModal.classList.add('hidden');
  });

  // Verify Single Payment form
  DOM.verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ref = DOM.verifyRef.value.trim();
    if (!ref) return;

    showToast(`Verifying reference: ${ref}...`, 'info');
    try {
      const response = await fetch(`/api/transactions/verify/${ref}`);
      const resData = await response.json();
      if (resData.status) {
        showToast('Payment verified successfully!', 'success');
        // Cache transaction & open transaction details modal
        state.transactions = [resData.data, ...state.transactions];
        updateTransactionsUI();
        viewTransactionDetails(resData.data.reference);
      } else {
        showToast(resData.message || 'Transaction verification failed', 'error');
      }
    } catch (err) {
      showToast('Error sending verification call', 'error');
    }
  });

  // Issue Refund Action form
  DOM.refundForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ref = DOM.refundTx.value.trim();
    const amountVal = DOM.refundAmount.value ? parseInt(DOM.refundAmount.value) : null;
    if (!ref) return;

    showToast(`Processing refund request...`, 'info');
    try {
      const response = await fetch('/api/transactions/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: ref,
          amount: amountVal,
          merchant_note: 'Console Admin action'
        })
      });
      const resData = await response.json();
      if (resData.status) {
        showToast(`Refund processed! Code: ${resData.data.refund_no || 'Done'}`, 'success');
        DOM.refundForm.reset();
        API.fetchTransactions();
      } else {
        showToast(resData.message || 'Refund request declined by Paystack', 'error');
      }
    } catch (err) {
      showToast('Error connection to refund gateway', 'error');
    }
  });

  // Create Customer Form
  DOM.createCustomerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.custEmail.value.trim();
    const fname = DOM.custFname.value.trim();
    const lname = DOM.custLname.value.trim();
    const phone = DOM.custPhone.value.trim();

    showToast(`Registering customer...`, 'info');
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: fname,
          last_name: lname,
          phone
        })
      });
      const resData = await response.json();
      if (resData.status) {
        showToast('Customer created successfully!', 'success');
        DOM.createCustomerForm.reset();
        API.fetchCustomers();
      } else {
        showToast(resData.message || 'Failed to create customer', 'error');
      }
    } catch (err) {
      showToast('Error creating customer on network', 'error');
    }
  });

  // Country Selection bank changer
  DOM.resolveCountry.addEventListener('change', async (e) => {
    await API.fetchBanks(e.target.value);
    toggleTransfersVerificationLayout();
  });

  // Bank Selection changer
  DOM.resolveBank.addEventListener('change', () => {
    toggleTransfersVerificationLayout();
  });

  // Resolve Bank Account (Verify bank / Name enquiry)
  DOM.resolveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bankCode = DOM.resolveBank.value;
    const accountNum = DOM.resolveAccount.value.trim();

    if (!bankCode || !accountNum) {
      showToast('Please select bank and enter account number', 'error');
      return;
    }

    showToast('Resolving bank details with central hub...', 'info');
    DOM.resolveResult.classList.add('hidden');
    DOM.btnSaveRecipient.classList.add('hidden');

    try {
      const response = await fetch(`/api/resolve-bank?account_number=${accountNum}&bank_code=${bankCode}`);
      const resData = await response.json();
      
      if (resData.status) {
        showToast('Account details verified!', 'success');
        DOM.resolvedName.textContent = resData.data.account_name;
        DOM.resolveResult.classList.remove('hidden');
        DOM.btnSaveRecipient.classList.remove('hidden');
        
        // Cache this resolved account in temporary state
        state.resolvedAccount = {
          account_number: resData.data.account_number,
          bank_code: bankCode,
          bank_name: DOM.resolveBank.options[DOM.resolveBank.selectedIndex].text,
          account_name: resData.data.account_name
        };
      } else {
        showToast(resData.message || 'Account not found or verification failed', 'error');
      }
    } catch (err) {
      showToast('Error validating account. Please check parameters.', 'error');
    }
  });

  // Save resolved account as Payout Recipient
  DOM.btnSaveRecipient.addEventListener('click', async () => {
    let accountName = '';
    let accountNumber = '';
    let bankCode = '';
    let typeVal = 'nuban';
    let currencyVal = 'NGN';
    
    if (DOM.resolveCountry.value === 'kenya') {
      const manualName = DOM.manualRecipientName.value.trim();
      const phoneNum = DOM.resolveAccount.value.trim();
      bankCode = DOM.resolveBank.value;
      
      if (!manualName || !phoneNum || !bankCode) {
        showToast('Please enter recipient name, phone number, and select M-Pesa network', 'error');
        return;
      }
      
      accountName = manualName;
      accountNumber = phoneNum;
      typeVal = 'mobile_money';
      currencyVal = 'KES';
    } else {
      if (!state.resolvedAccount) return;
      accountName = state.resolvedAccount.account_name;
      accountNumber = state.resolvedAccount.account_number;
      bankCode = state.resolvedAccount.bank_code;
      typeVal = 'nuban';
      currencyVal = DOM.resolveCountry.value === 'ghana' ? 'GHS' : 'NGN';
    }

    showToast('Creating payout recipient on Paystack...', 'info');
    try {
      const response = await fetch('/api/transfers/recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeVal,
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: currencyVal
        })
      });
      const resData = await response.json();
      
      if (resData.status) {
        showToast('Recipient saved successfully!', 'success');
        
        // Clear verify UI
        DOM.resolveForm.reset();
        DOM.manualRecipientName.value = '';
        DOM.resolveResult.classList.add('hidden');
        
        if (DOM.resolveCountry.value === 'kenya') {
          // Keep Kenya selections intact but clear input
          DOM.resolveCountry.value = 'kenya';
          DOM.btnVerifyAccount.classList.add('hidden');
          DOM.btnSaveRecipient.classList.remove('hidden');
        } else {
          DOM.btnSaveRecipient.classList.add('hidden');
        }
        
        state.resolvedAccount = null;
        
        // Reload transfers & recipients data to update dropdowns
        API.fetchTransfers();
        API.fetchRecipients();
      } else {
        showToast(resData.message || 'Failed to save recipient', 'error');
      }
    } catch (err) {
      showToast('Error saving recipient configuration', 'error');
    }
  });

  // Handle Send Payout form submission
  DOM.transferForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipient = DOM.transferRecipient.value;
    const amountVal = parseFloat(DOM.transferAmount.value);
    const reason = DOM.transferReason.value.trim();

    if (!recipient || isNaN(amountVal) || amountVal <= 0) {
      showToast('Please select recipient and provide a positive amount', 'error');
      return;
    }

    // Convert amount to kobo/lowest unit (times 100)
    const amountInKobo = Math.round(amountVal * 100);

    showToast('Initiating balance payout...', 'info');
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'balance',
          amount: amountInKobo,
          recipient,
          reason
        })
      });
      const resData = await response.json();
      
      if (resData.status) {
        showToast('Payout transfer initiated successfully!', 'success');
        DOM.transferForm.reset();
        
        // Refresh balance & transfers logs
        API.fetchBalance();
        API.fetchTransfers();
      } else {
        showToast(resData.message || 'Transfer rejected by server', 'error');
      }
    } catch (err) {
      showToast('Error connection to payout service', 'error');
    }
  });

  // Handle Recipient change currency detection
  DOM.transferRecipient.addEventListener('change', (e) => {
    const selectedOpt = e.target.options[e.target.selectedIndex];
    if (selectedOpt && selectedOpt.getAttribute('data-currency')) {
      DOM.transferCurrency.value = selectedOpt.getAttribute('data-currency');
    }
  });

  // Create Billing Plan
  DOM.createPlanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = DOM.planName.value.trim();
    const amountVal = parseFloat(DOM.planAmount.value);
    const currency = DOM.planCurrency.value;
    const interval = DOM.planInterval.value;

    if (!name || isNaN(amountVal) || amountVal <= 0) {
      showToast('Provide positive amount and valid name', 'error');
      return;
    }

    const amountInKobo = Math.round(amountVal * 100);

    showToast('Creating payment plan...', 'info');
    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          amount: amountInKobo,
          currency,
          interval
        })
      });
      const resData = await response.json();
      if (resData.status) {
        showToast('Billing plan created successfully!', 'success');
        DOM.createPlanForm.reset();
        
        // Reload plans UI
        API.fetchPlans();
      } else {
        showToast(resData.message || 'Failed to create plan', 'error');
      }
    } catch (err) {
      showToast('Error registering plan', 'error');
    }
  });

  // Charge Customer Form Submission
  DOM.chargeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.chargeEmail.value.trim();
    const amountVal = parseFloat(DOM.chargeAmount.value);
    const phone = DOM.chargePhone.value.trim();

    if (!email || isNaN(amountVal) || amountVal <= 0 || !phone) {
      showToast('Please provide email, positive amount, and phone number', 'error');
      return;
    }

    // Convert KES to cents/subunit (KES is times 100)
    const amountInCents = Math.round(amountVal * 100);

    showToast('Sending M-Pesa payment prompt...', 'info');
    try {
      const response = await fetch('/api/charge/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: amountInCents,
          phone
        })
      });
      const resData = await response.json();
      
      if (resData.status) {
        const txStatus = resData.data.status;
        const ref = resData.data.reference;
        
        if (txStatus === 'send_otp' || txStatus === 'pending' || txStatus === 'pay_offline') {
          showToast(`Prompt initiated! Ref: ${ref}. Check M-Pesa phone.`, 'success');
        } else if (txStatus === 'success') {
          showToast('Payment completed instantly!', 'success');
        } else {
          showToast(`Response status: ${txStatus}`, 'info');
        }
        
        DOM.chargeForm.reset();
        
        // Refresh transactions list after a short delay
        setTimeout(() => {
          API.fetchTransactions();
        }, 4000);
        
      } else {
        showToast(resData.message || 'M-Pesa request failed', 'error');
      }
    } catch (err) {
      showToast('Error connecting to charging gateway', 'error');
    }
  });

  // Charge Saved Card Form Submission
  DOM.chargeTokenForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.tokenEmail.value.trim();
    const authCode = DOM.tokenAuth.value.trim();
    const amountVal = parseFloat(DOM.tokenAmount.value);
    const currency = DOM.tokenCurrency.value;

    if (!email || !authCode || isNaN(amountVal) || amountVal <= 0) {
      showToast('Please provide email, authorization code, and a positive amount', 'error');
      return;
    }

    // Convert amount to subunit (multiply by 100)
    const amountSubunit = Math.round(amountVal * 100);

    showToast('Attempting to charge saved card...', 'info');
    try {
      const response = await fetch('/api/charge/authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: amountSubunit,
          authorization_code: authCode,
          currency
        })
      });
      const resData = await response.json();
      
      if (resData.status) {
        const tx = resData.data;
        if (tx.status === 'success') {
          showToast(`Charge successful! Reference: ${tx.reference}`, 'success');
        } else if (tx.status === 'failed') {
          const reason = tx.gateway_response || tx.message || 'Decline reason not provided';
          showToast(`Charge failed: ${reason} (Ref: ${tx.reference})`, 'error');
        } else {
          showToast(`Charge status: ${tx.status || 'Pending'}`, 'info');
        }
        
        DOM.chargeTokenForm.reset();
        
        // Refresh balance & transactions list
        API.fetchBalance();
        API.fetchTransactions();
      } else {
        showToast(resData.message || 'Charge authorization attempt failed', 'error');
      }
    } catch (err) {
      showToast('Error sending token charge request', 'error');
    }
  });

  // --- Firebase Authentication Event Handlers ---
  const loginForm = document.getElementById('login-form');
  const btnSignout = document.getElementById('btn-signout');
  const authErrorBox = document.getElementById('auth-error-box');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    authErrorBox.classList.add('hidden');
    showToast('Signing in...', 'info');

    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      showToast('Successfully signed in!', 'success');
    } catch (err) {
      console.error(err);
      authErrorBox.textContent = err.message || 'Login failed. Please verify credentials.';
      authErrorBox.classList.remove('hidden');
      showToast('Sign in failed', 'error');
    }
  });

  btnSignout.addEventListener('click', async () => {
    try {
      await firebase.auth().signOut();
      showToast('Successfully signed out!', 'success');
    } catch (err) {
      showToast('Failed to sign out', 'error');
    }
  });
}

// --- Initialize Dashboard Application ---
function init() {
  initEventListeners();
}

function initDashboard() {
  // Set default tab on load (Overview)
  switchTab('overview');
}

// Monkey patch window.fetch to automatically include Firebase ID Token in Bearer header
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  if (url.startsWith('/api')) {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        const idToken = await user.getIdToken();
        options.headers = options.headers || {};
        options.headers['Authorization'] = `Bearer ${idToken}`;
      } catch (err) {
        console.error('Failed to get Firebase ID token:', err);
      }
    }
  }
  return originalFetch(url, options);
};

// --- Firebase Initialization & Authentication Flow ---
const firebaseConfig = {
  apiKey: "AIzaSyBEw1M5uOs4zLnsGHiJvh3dtzNDkjchByQ",
  authDomain: "prespaystack.firebaseapp.com",
  projectId: "prespaystack",
  storageBucket: "prespaystack.firebasestorage.app",
  messagingSenderId: "559697312731",
  appId: "1:559697312731:web:07fa05c51e7dcab3fe85fe",
  measurementId: "G-SVGC9708SY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Global Auth state handler
auth.onAuthStateChanged((user) => {
  const authScreen = document.getElementById('auth-screen');
  const appContainer = document.querySelector('.app-container');
  
  if (user) {
    // User is logged in
    authScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    // Clear login inputs
    document.getElementById('auth-email').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error-box').classList.add('hidden');
    
    // Start dashboard data fetching
    initDashboard();
  } else {
    // User is logged out
    authScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');
  }
});

// Kickstart script on DOM loaded
document.addEventListener('DOMContentLoaded', init);
