// Setup Dexie DB
const db = new Dexie("NexGenBankSystem");

// Define schema
db.version(2).stores({
    accounts: "++id, accNo, name, nic, phone, type, address, balance, status, createdAt",
    transactions: "++id, accNo, type, amount, date",
    fixedDeposits: "++id, fdNo, accNo, amount, duration, interestRate, startDate, maturityDate",
    loans: "++id, loanNo, accNo, type, amount, duration, interestRate, emi, startDate"
});

// Helper Functions related to Database

// Generate 10-digit Account Number Using Luhn Algorithm (Mod 10 Check Digit)
function generateAccNo() {
    // Generate base 9 digits
    let base = Math.floor(100000000 + Math.random() * 900000000).toString();

    let sum = 0;
    // Calculate Luhn check digit
    // Reading from right to left (since we'll append the check digit at the end, 
    // the current last digit of base will be at an even position from right in the final 10 digit string)
    for (let i = 0; i < base.length; i++) {
        let digit = parseInt(base.charAt(base.length - 1 - i));

        // For 10 digit total, if we start counting 1 from the check digit, 
        // the last digit of base is position 2 (even). So we double it.
        if (i % 2 === 0) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }

    let checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
}

// Generate 8-digit Ref Numbers for FDs and Loans
function generateRefNo() {
    return 'REF-' + Math.floor(10000000 + Math.random() * 90000000);
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format Date
function formatDate(timestamp) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatAccNo(accStr) {
    if (!accStr) return "";
    let s = accStr.toString();
    if (s.length === 10) {
        return `${s.substring(0, 4)} ${s.substring(4, 8)} ${s.substring(8, 10)}`;
    }
    return s;
}
