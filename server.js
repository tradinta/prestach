require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Check if secret key is configured
if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY.includes('YOUR_')) {
  console.warn('WARNING: Paystack Secret Key is not configured correctly in the .env file.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Firebase Admin (verifies JWT identity tokens for all API actions)
const admin = require('firebase-admin');
admin.initializeApp({
  projectId: "prespaystack"
});

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: false, message: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase Auth Verification failed:', error.message);
    return res.status(401).json({ status: false, message: 'Unauthorized: Invalid or expired token' });
  }
};

// Secure all operational API endpoints behind authentication
app.use('/api', authenticateUser);

// Helper for Paystack API requests
async function paystackRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.paystack.co/${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Paystack API returned status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Paystack API error on ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

// 1. Balance & Ledger Info
app.get('/api/balance', async (req, res) => {
  try {
    const data = await paystackRequest('balance');
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// 2. Transaction Management
app.get('/api/transactions', async (req, res) => {
  try {
    // Forward query params if they exist (e.g. limit, page, status)
    const query = new URLSearchParams(req.query).toString();
    const endpoint = query ? `transaction?${query}` : 'transaction';
    const data = await paystackRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.get('/api/transactions/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const data = await paystackRequest(`transaction/verify/${reference}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post('/api/transactions/refund', async (req, res) => {
  try {
    const { transaction, amount, merchant_note, customer_note } = req.body;
    const data = await paystackRequest('refund', 'POST', {
      transaction,
      amount, // optional, in kobo (or lowest currency unit)
      merchant_note,
      customer_note
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Mobile Money Charge (M-Pesa)
app.post('/api/charge/mpesa', async (req, res) => {
  try {
    const { email, amount, phone } = req.body;
    if (!email || !amount || !phone) {
      return res.status(400).json({ status: false, message: 'Missing required parameters: email, amount, phone' });
    }

    // Auto-format phone number to international '+254...' format for M-Pesa
    let formattedPhone = phone.trim();
    let cleanedDigits = formattedPhone.replace(/\D/g, ''); // Extract only digits
    if (formattedPhone.startsWith('+')) {
      formattedPhone = '+' + cleanedDigits;
    } else if (cleanedDigits.startsWith('254')) {
      formattedPhone = '+' + cleanedDigits;
    } else if (cleanedDigits.startsWith('0')) {
      formattedPhone = '+254' + cleanedDigits.substring(1);
    } else if (cleanedDigits.startsWith('7') || cleanedDigits.startsWith('1')) {
      formattedPhone = '+254' + cleanedDigits;
    } else {
      formattedPhone = '+' + cleanedDigits;
    }

    const data = await paystackRequest('charge', 'POST', {
      email,
      amount, // expected in cents/subunit (e.g. 100 KES = 10000)
      currency: 'KES',
      mobile_money: {
        phone: formattedPhone,
        provider: 'mpesa'
      }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});


// Charge Saved Card Authorization
app.post('/api/charge/authorization', async (req, res) => {
  try {
    const { email, amount, authorization_code, currency } = req.body;
    if (!email || !amount || !authorization_code) {
      return res.status(400).json({ status: false, message: 'Missing required parameters: email, amount, authorization_code' });
    }
    const data = await paystackRequest('transaction/charge_authorization', 'POST', {
      email,
      amount, // expected in lowest currency unit (cents/kobo)
      authorization_code,
      currency: currency || 'NGN'
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});



// 3. Customers
app.get('/api/customers', async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    const endpoint = query ? `customer?${query}` : 'customer';
    const data = await paystackRequest(endpoint);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { email, first_name, last_name, phone } = req.body;
    const data = await paystackRequest('customer', 'POST', {
      email,
      first_name,
      last_name,
      phone
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// 4. Transfers & Payouts (Send Money Out)
// List supported banks
app.get('/api/banks', async (req, res) => {
  try {
    const country = req.query.country || 'nigeria';
    const data = await paystackRequest(`bank?country=${country}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Resolve Account Number (Name Enquiry)
app.get('/api/resolve-bank', async (req, res) => {
  try {
    const { account_number, bank_code } = req.query;
    if (!account_number || !bank_code) {
      return res.status(400).json({ status: false, message: 'Missing account_number or bank_code parameter' });
    }

    // Clean account number: strip spaces, strip leading '+', and extract only digits
    let cleanedAccount = account_number.trim().replace(/\s+/g, '');
    if (cleanedAccount.startsWith('+')) {
      cleanedAccount = cleanedAccount.substring(1);
    }
    cleanedAccount = cleanedAccount.replace(/\D/g, ''); // Ensure only digits are sent

    const data = await paystackRequest(`bank/resolve?account_number=${cleanedAccount}&bank_code=${bank_code}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// List Transfer Recipients
app.get('/api/transfers/recipients', async (req, res) => {
  try {
    const data = await paystackRequest('transferrecipient');
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Create Transfer Recipient
app.post('/api/transfers/recipient', async (req, res) => {
  try {
    const { type, name, account_number, bank_code, currency } = req.body;
    
    // Clean account number: strip spaces, strip leading '+', and extract only digits
    let cleanedAccount = account_number.trim().replace(/\s+/g, '');
    if (cleanedAccount.startsWith('+')) {
      cleanedAccount = cleanedAccount.substring(1);
    }
    cleanedAccount = cleanedAccount.replace(/\D/g, '');

    const data = await paystackRequest('transferrecipient', 'POST', {
      type: type || 'nuban',
      name,
      account_number: cleanedAccount,
      bank_code,
      currency: currency || 'NGN'
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Initiate Transfer
app.post('/api/transfers', async (req, res) => {
  try {
    const { source, amount, recipient, reason } = req.body;
    const data = await paystackRequest('transfer', 'POST', {
      source: source || 'balance',
      amount, // in kobo/cents (e.g. 500000 NGN = 5000 NGN)
      recipient, // recipient code (e.g. RCP_2x55x1x...)
      reason
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// List outgoing transfers
app.get('/api/transfers', async (req, res) => {
  try {
    const data = await paystackRequest('transfer');
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// List Settlements (Automated Payouts to Bank Account)
app.get('/api/settlements', async (req, res) => {
  try {
    const data = await paystackRequest('settlement');
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});


// 5. Subscriptions & Plans
// List payment plans
app.get('/api/plans', async (req, res) => {
  try {
    const data = await paystackRequest('plan');
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Create payment plan
app.post('/api/plans', async (req, res) => {
  try {
    const { name, interval, amount, currency } = req.body;
    const data = await paystackRequest('plan', 'POST', {
      name,
      interval, // e.g. daily, weekly, monthly, annually
      amount, // in kobo/lowest unit
      currency: currency || 'NGN'
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// List subscriptions
app.get('/api/subscriptions', async (req, res) => {
  try {
    const data = await paystackRequest('subscription');
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Paystack Operations Dashboard running securely!`);
  console.log(`🌎 URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
