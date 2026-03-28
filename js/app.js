document.addEventListener('DOMContentLoaded', () => {

    const DOM = {
        app: document.getElementById('app'),
        loginSec: document.getElementById('login-section'),
        dashboardSec: document.getElementById('dashboard-section'),
        loginForm: document.getElementById('login-form'),
        usernameInput: document.getElementById('username'),
        passwordInput: document.getElementById('password'),
        loginError: document.getElementById('login-error'),
        logoutBtn: document.getElementById('logout-btn'),
        navLinks: document.querySelectorAll('.nav-links a'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Forms
        accForm: document.getElementById('account-form'),
        transForm: document.getElementById('transaction-form'),
        fdForm: document.getElementById('fd-form'),
        loanForm: document.getElementById('loan-form'),

        // Inputs
        searchAccountInput: document.getElementById('search-account'),
        transAccNo: document.getElementById('trans-acc-no'),
        fdAccNo: document.getElementById('fd-acc-no'),
        loanAccNo: document.getElementById('loan-acc-no'),

        // Tables / UIs
        accountsBody: document.getElementById('accounts-table-body'),
        transBody: document.getElementById('recent-transactions'),
        fdsBody: document.getElementById('fds-table-body'),
        loansBody: document.getElementById('loans-table-body'),

        // Stats
        statAccounts: document.getElementById('stat-accounts'),
        statDeposits: document.getElementById('stat-deposits'),
        statLoans: document.getElementById('stat-loans'),
        statFds: document.getElementById('stat-fds'),

        // Inquiry
        inqAccNo: document.getElementById('inq-acc-no'),
        btnInquiry: document.getElementById('btn-inquiry'),
        inquiryResult: document.getElementById('inquiry-result'),
        inquiryError: document.getElementById('inquiry-error'),
        btnGenerateLetter: document.getElementById('btn-generate-letter')
    };

    // --- State Management ---
    let currentUser = localStorage.getItem('localBankAdmin');

    initApp();

    function initApp() {
        if (currentUser) {
            showDashboard();
            loadDashboardData();
        } else {
            showLogin();
        }
    }

    // --- Auth Logic ---
    DOM.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = DOM.usernameInput.value.trim();
        const p = DOM.passwordInput.value.trim();

        if (u === 'admin' && p === 'admin123') {
            localStorage.setItem('localBankAdmin', 'admin');
            currentUser = 'admin';
            DOM.loginError.innerText = '';
            showDashboard();
            loadDashboardData();
        } else {
            DOM.loginError.innerText = 'Invalid username or password';
        }
    });

    DOM.logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('localBankAdmin');
        currentUser = null;
        DOM.usernameInput.value = '';
        DOM.passwordInput.value = '';
        showLogin();
    });

    function showLogin() {
        DOM.dashboardSec.classList.add('hidden');
        DOM.loginSec.classList.remove('hidden');
    }

    function showDashboard() {
        DOM.loginSec.classList.add('hidden');
        DOM.dashboardSec.classList.remove('hidden');
    }

    // --- Tab Navigation ---
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active classes
            DOM.navLinks.forEach(l => l.classList.remove('active'));
            DOM.tabContents.forEach(tc => tc.classList.add('hidden'));

            // Add active class to clicked
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');

            // Refresh data based on tab
            if (targetId === 'dashboard-tab') loadDashboardData();
            if (targetId === 'account-tab') loadAccountsData();
            if (targetId === 'fd-tab') loadFDsData();
            if (targetId === 'loan-tab') loadLoansData();
        });
    });

    // --- Inquiry Logic ---
    let currentInquiryAcc = null;

    DOM.btnInquiry.addEventListener('click', async () => {
        const accNo = parseInt(DOM.inqAccNo.value);
        if (!accNo) return;

        try {
            const acc = await db.accounts.get({ accNo: accNo });
            if (acc) {
                currentInquiryAcc = acc;
                DOM.inquiryError.innerText = '';
                DOM.inquiryResult.classList.remove('hidden');

                document.getElementById('inq-acc-no-disp').innerText = acc.accNo;
                document.getElementById('inq-name').innerText = acc.name;
                document.getElementById('inq-nic').innerText = acc.nic;
                document.getElementById('inq-phone').innerText = acc.phone;
                document.getElementById('inq-type').innerText = acc.type;
                document.getElementById('inq-address').innerText = acc.address;
                document.getElementById('inq-date').innerText = formatDate(acc.createdAt);
                document.getElementById('inq-balance').innerText = formatCurrency(acc.balance);
            } else {
                DOM.inquiryError.innerText = 'Account not found. Please check the number.';
                DOM.inquiryResult.classList.add('hidden');
                currentInquiryAcc = null;
            }
        } catch (error) {
            console.error("Error fetching account:", error);
            DOM.inquiryError.innerText = 'Error fetching account.';
            DOM.inquiryResult.classList.add('hidden');
            currentInquiryAcc = null;
        }
    });

    DOM.btnGenerateLetter.addEventListener('click', () => {
        if (!currentInquiryAcc) return;

        const acc = currentInquiryAcc;
        const letterHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Account Confirmation Letter - ${acc.accNo}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
                    .header h1 { color: #6366f1; margin: 0; font-size: 28px; }
                    .header p { margin: 5px 0 0 0; color: #666; }
                    .date { text-align: right; margin-bottom: 30px; font-weight: bold; }
                    .content { margin-bottom: 40px; }
                    .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; outline: 1px solid #ddd; }
                    .details-table td { padding: 12px; border: 1px solid #eee; }
                    .details-table td:first-child { font-weight: bold; width: 35%; color: #555; background: #f9f9f9; }
                    .footer { margin-top: 60px; text-align: center; color: #888; font-size: 14px; }
                    .signature-area { margin-top: 80px; display: flex; justify-content: space-between; }
                    .sig-box { width: 40%; text-align: center; border-top: 1px dashed #333; padding-top: 10px; font-weight: bold; }
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align: right; margin-bottom: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Print Document</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #ccc; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px; font-weight: bold;">Close Window</button>
                </div>
                <div class="header">
                    <h1>Local Bank System</h1>
                    <p>Official Account Confirmation Document</p>
                </div>
                <div class="date">
                    Date: ${new Date().toLocaleDateString()}
                </div>
                <div class="content">
                    <p><strong>To Whom It May Concern,</strong></p>
                    <p>This letter formally confirms that the individual named below holds an active account with Local Bank System. The details provided reflect the current records maintained by our branch.</p>
                    
                    <table class="details-table">
                        <tr><td>Account Name</td><td>${acc.name}</td></tr>
                        <tr><td>Account Number</td><td style="font-weight: bold; font-size: 1.1em;">${acc.accNo}</td></tr>
                        <tr><td>Account Type</td><td style="text-transform: capitalize;">${acc.type} Account</td></tr>
                        <tr><td>NIC / ID Number</td><td>${acc.nic}</td></tr>
                        <tr><td>Phone Number</td><td>${acc.phone}</td></tr>
                        <tr><td>Registered Address</td><td>${acc.address}</td></tr>
                        <tr><td>Account Opening Date</td><td>${formatDate(acc.createdAt)}</td></tr>
                        <tr><td>Current Balance</td><td style="font-weight: bold;">${formatCurrency(acc.balance)}</td></tr>
                    </table>
                </div>
                <div class="signature-area">
                    <div class="sig-box">
                        <br>Authorized Signatory<br>Bank Manager
                    </div>
                    <div class="sig-box">
                        <br>Signature<br>Account Holder
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Local Bank System. This is a computer-generated document and requires signatures for official verification.</p>
                </div>
                <script>
                    window.onload = function() { 
                        setTimeout(() => window.print(), 500); 
                    };
                </script>
            </body>
            </html>
        `;

        const printWin = window.open('', '_blank', 'width=850,height=900');
        printWin.document.write(letterHtml);
        printWin.document.close();
    });

    // --- Format Info Helper ---
    async function showAccInfo(inputEl, detailsEl) {
        let val = inputEl.value;
        if (!val) {
            detailsEl.innerText = '';
            return;
        }
        let acc = await db.accounts.get({ accNo: parseInt(val) });
        if (acc) {
            detailsEl.innerHTML = `Name: ${acc.name} | Balance: <strong style="color:var(--secondary-color)">${formatCurrency(acc.balance)}</strong>`;
        } else {
            detailsEl.innerText = 'Account not found';
        }
    }

    DOM.transAccNo.addEventListener('input', () => showAccInfo(DOM.transAccNo, document.getElementById('trans-acc-details')));
    DOM.fdAccNo.addEventListener('input', () => showAccInfo(DOM.fdAccNo, document.getElementById('fd-acc-details')));
    DOM.loanAccNo.addEventListener('input', () => showAccInfo(DOM.loanAccNo, document.getElementById('loan-acc-details')));

    // --- Form Submissions ---

    // 1. Account Opening
    DOM.accForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const initialDep = parseFloat(document.getElementById('acc-initial-deposit').value);
        const accNo = generateAccNo();

        try {
            await db.transaction('rw', db.accounts, db.transactions, async () => {
                const accId = await db.accounts.add({
                    accNo: accNo,
                    name: document.getElementById('acc-name').value.trim(),
                    nic: document.getElementById('acc-nic').value.trim(),
                    phone: document.getElementById('acc-phone').value.trim(),
                    type: document.getElementById('acc-type').value,
                    address: document.getElementById('acc-address').value.trim(),
                    balance: initialDep,
                    createdAt: Date.now()
                });

                if (initialDep > 0) {
                    await db.transactions.add({
                        accNo: accNo,
                        type: 'deposit',
                        amount: initialDep,
                        date: Date.now()
                    });
                }
            });
            alert(`Account created successfully! Account No: ${accNo}`);
            DOM.accForm.reset();
            loadAccountsData();
        } catch (error) {
            alert("Error creating account: " + error);
        }
    });

    // Search Accounts Filter
    DOM.searchAccountInput.addEventListener('input', loadAccountsData);

    // 2. Transaction (Deposit/Withdrawal)
    DOM.transForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const accNo = parseInt(DOM.transAccNo.value);
        const type = document.getElementById('trans-type').value;
        const amount = parseFloat(document.getElementById('trans-amount').value);

        try {
            await db.transaction('rw', db.accounts, db.transactions, async () => {
                const acc = await db.accounts.get({ accNo: accNo });
                if (!acc) throw new Error("Account not found");

                if (type === 'withdrawal') {
                    if (acc.balance < amount) throw new Error("Insufficient funds");
                    acc.balance -= amount;
                } else {
                    acc.balance += amount;
                }

                await db.accounts.put(acc);
                await db.transactions.add({
                    accNo: accNo,
                    type: type,
                    amount: amount,
                    date: Date.now()
                });
            });
            alert(`Transaction successful!`);
            DOM.transForm.reset();
            document.getElementById('trans-acc-details').innerText = '';
            showAccInfo({ value: accNo }, document.getElementById('trans-acc-details')); // re-show after clearing won't work perfectly due to reset, so just clear.
        } catch (error) {
            alert(error.message);
        }
    });

    // 3. Fixed Deposit
    DOM.fdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const accNo = parseInt(DOM.fdAccNo.value);
        const amount = parseFloat(document.getElementById('fd-amount').value);
        const durationMenu = document.getElementById('fd-duration');
        const duration = parseInt(durationMenu.value);

        let interestRate = 4;
        if (duration === 6) interestRate = 5;
        if (duration === 12) interestRate = 7;
        if (duration === 24) interestRate = 8;

        const maturityDate = new Date();
        maturityDate.setMonth(maturityDate.getMonth() + duration);

        try {
            await db.transaction('rw', db.accounts, db.fixedDeposits, db.transactions, async () => {
                const acc = await db.accounts.get({ accNo: accNo });
                if (!acc) throw new Error("Account not found");
                if (acc.balance < amount) throw new Error("Insufficient funds in account to create FD. Please deposit first.");

                // Deduct from account
                acc.balance -= amount;
                await db.accounts.put(acc);

                // Add withdrawal transaction
                await db.transactions.add({
                    accNo: accNo,
                    type: 'withdrawal', // Transfer to FD
                    amount: amount,
                    date: Date.now()
                });

                // Create FD record
                await db.fixedDeposits.add({
                    fdNo: generateAccNo(),
                    accNo: accNo,
                    amount: amount,
                    duration: duration,
                    interestRate: interestRate,
                    startDate: Date.now(),
                    maturityDate: maturityDate.getTime()
                });
            });
            alert("Fixed Deposit opened successfully!");
            DOM.fdForm.reset();
            document.getElementById('fd-acc-details').innerText = '';
            loadFDsData();
        } catch (error) {
            alert(error.message);
        }
    });

    // 4. Loan Section
    DOM.loanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const accNo = parseInt(DOM.loanAccNo.value);
        const amount = parseFloat(document.getElementById('loan-amount').value);
        const duration = parseInt(document.getElementById('loan-duration').value); // in months
        const typeMenu = document.getElementById('loan-type');
        const type = typeMenu.value;

        let interestRate = 12; // default personal
        if (type === 'housing') interestRate = 8;
        if (type === 'vehicle') interestRate = 10;

        // Simple EMI calculation
        const r = interestRate / (12 * 100);
        const n = duration;
        const emi = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

        try {
            await db.transaction('rw', db.accounts, db.loans, db.transactions, async () => {
                const acc = await db.accounts.get({ accNo: accNo });
                if (!acc) throw new Error("Account not found");

                // Disburse Loan to account
                acc.balance += amount;
                await db.accounts.put(acc);

                // Add deposit transaction
                await db.transactions.add({
                    accNo: accNo,
                    type: 'deposit', // Disbursal
                    amount: amount,
                    date: Date.now()
                });

                // Create Loan record
                await db.loans.add({
                    loanNo: generateAccNo(),
                    accNo: accNo,
                    type: type,
                    amount: amount,
                    duration: duration,
                    interestRate: interestRate,
                    emi: emi,
                    startDate: Date.now()
                });
            });
            alert("Loan approved and amount disbursed to account!");
            DOM.loanForm.reset();
            document.getElementById('loan-acc-details').innerText = '';
            loadLoansData();
        } catch (error) {
            alert(error.message);
        }
    });

    // --- UI Data Loaders ---

    async function loadDashboardData() {
        const accountsCount = await db.accounts.count();
        const allTrans = await db.transactions.where('type').equals('deposit').toArray();
        const totalDeposits = allTrans.reduce((sum, t) => sum + t.amount, 0);
        const loansCount = await db.loans.count();
        const fdsCount = await db.fixedDeposits.count();

        DOM.statAccounts.innerText = accountsCount;
        DOM.statDeposits.innerText = formatCurrency(totalDeposits);
        DOM.statLoans.innerText = loansCount;
        DOM.statFds.innerText = fdsCount;

        // Recent Transactions (Last 5)
        const recentTrans = await db.transactions.orderBy('date').reverse().limit(5).toArray();
        DOM.transBody.innerHTML = '';
        recentTrans.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(t.date)}</td>
                <td>${t.accNo}</td>
                <td style="color:${t.type === 'deposit' ? 'var(--secondary-color)' : 'var(--accent-color)'}; text-transform: capitalize;">${t.type}</td>
                <td>${formatCurrency(t.amount)}</td>
            `;
            DOM.transBody.appendChild(tr);
        });
    }

    async function loadAccountsData() {
        const query = DOM.searchAccountInput.value.toLowerCase();
        let accounts = await db.accounts.toArray();

        if (query) {
            accounts = accounts.filter(acc =>
                acc.accNo.toString().includes(query) ||
                acc.name.toLowerCase().includes(query)
            );
        }

        DOM.accountsBody.innerHTML = '';
        accounts.forEach(acc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${acc.accNo}</td>
                <td>${acc.name}</td>
                <td style="text-transform: capitalize;">${acc.type}</td>
                <td style="color:var(--secondary-color); font-weight: 500;">${formatCurrency(acc.balance)}</td>
            `;
            DOM.accountsBody.appendChild(tr);
        });
    }

    async function loadFDsData() {
        const fds = await db.fixedDeposits.toArray();
        DOM.fdsBody.innerHTML = '';
        fds.forEach(fd => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fd.fdNo}</td>
                <td>${fd.accNo}</td>
                <td>${formatCurrency(fd.amount)}</td>
                <td>${fd.duration} Months</td>
                <td>${formatDate(fd.startDate)}</td>
                <td>${formatDate(fd.maturityDate)}</td>
            `;
            DOM.fdsBody.appendChild(tr);
        });
    }

    async function loadLoansData() {
        const loans = await db.loans.toArray();
        DOM.loansBody.innerHTML = '';
        loans.forEach(loan => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${loan.loanNo}</td>
                <td>${loan.accNo}</td>
                <td style="text-transform: capitalize;">${loan.type}</td>
                <td>${formatCurrency(loan.amount)}</td>
                <td>${formatCurrency(loan.emi)}</td>
            `;
            DOM.loansBody.appendChild(tr);
        });
    }

});
