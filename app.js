// Storage Keys
const STORAGE_KEYS = {
    BALANCE: 'fal_balance',
    LAST_CLAIM: 'fal_last_claim',
    HISTORY: 'fal_history',
    WALLET: 'fal_wallet_address'
};

// Constants
const REWARD_AMOUNT = 100;
const CLAIM_INTERVAL = 30000; // 30 seconds in milliseconds
const TOKEN_CONTRACT = 'EQC3WByWfdoVF8JLJi7QUdnlZIWodjva5kNrReWcdytMbOds';
const DECIMAL = 9;
const SUPPLY = '1,000,000,000';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startCountdownTimer();
});

// Initialize the application
function initializeApp() {
    // Load balance from localStorage
    updateBalanceDisplay();
    updateHistoryDisplay();
    
    // Update withdraw page balance
    updateWithdrawBalance();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

// Navigation function
function navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName).classList.add('active');

    // Add active class to clicked button
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // Update balance displays
    if (pageName === 'withdraw') {
        updateWithdrawBalance();
    }
}

// Get current balance from localStorage
function getBalance() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.BALANCE)) || 0;
}

// Set balance in localStorage
function setBalance(amount) {
    localStorage.setItem(STORAGE_KEYS.BALANCE, amount.toString());
    updateBalanceDisplay();
    updateWithdrawBalance();
}

// Update balance display
function updateBalanceDisplay() {
    const balance = getBalance();
    document.getElementById('totalBalance').textContent = balance.toLocaleString();
    document.getElementById('withdrawBalance').textContent = balance.toLocaleString();
    document.getElementById('availableAmount').textContent = balance.toLocaleString();
}

// Check if can claim
function canClaim() {
    const lastClaim = localStorage.getItem(STORAGE_KEYS.LAST_CLAIM);
    if (!lastClaim) return true;

    const lastClaimTime = parseInt(lastClaim);
    const now = Date.now();
    return (now - lastClaimTime) >= CLAIM_INTERVAL;
}

// Get time remaining for next claim
function getTimeRemaining() {
    const lastClaim = localStorage.getItem(STORAGE_KEYS.LAST_CLAIM);
    if (!lastClaim) return 0;

    const lastClaimTime = parseInt(lastClaim);
    const now = Date.now();
    const timePassed = now - lastClaimTime;
    const timeRemaining = CLAIM_INTERVAL - timePassed;

    return Math.max(0, timeRemaining);
}

// Handle claim button click
function handleClaim() {
    if (!canClaim()) {
        showToast('Please wait before claiming again', 'error');
        return;
    }

    // Show ad modal
    showAdModal();

    // Initialize ad system
    initializeAdSystem();
}

// Initialize ad system with fallback
function initializeAdSystem() {
    // Set up fallback mechanism
    if (window.AdGigaFallback === undefined) {
        // Try to initialize if SDK exists
        if (typeof window.showGiga !== 'undefined') {
            window.AdGigaFallback = window.showGiga;
        }
    }

    // Fallback if showGiga is undefined
    if (window.showGiga === undefined) {
        window.showGiga = () => window.AdGigaFallback();
    }

    // Show the ad
    displayAd();
}

// Display ad and handle reward
function displayAd() {
    // Check if showGiga is available
    if (typeof window.showGiga !== 'function') {
        // Fallback: simulate ad watching
        simulateAd();
        return;
    }

    // Show real ad
    window.showGiga()
        .then(() => {
            // Ad watched successfully
            claimReward();
        })
        .catch((error) => {
            console.error('Ad error:', error);
            // Fallback to simulated ad
            simulateAd();
        });
}

// Simulate ad watching (fallback)
function simulateAd() {
    const adLoader = document.getElementById('adLoader');
    adLoader.innerHTML = '<div class="spinner"></div><p>Watching advertisement...</p>';

    // Simulate 5 second ad
    setTimeout(() => {
        closeAdModal();
        claimReward();
    }, 5000);
}

// Show ad modal
function showAdModal() {
    const adModal = document.getElementById('adModal');
    adModal.classList.add('active');
}

// Close ad modal
function closeAdModal() {
    const adModal = document.getElementById('adModal');
    adModal.classList.remove('active');
    const adLoader = document.getElementById('adLoader');
    adLoader.innerHTML = '<div class="spinner"></div><p>Loading advertisement...</p>';
}

// Claim reward after watching ad
function claimReward() {
    const currentBalance = getBalance();
    const newBalance = currentBalance + REWARD_AMOUNT;

    // Update balance
    setBalance(newBalance);

    // Record last claim time
    localStorage.setItem(STORAGE_KEYS.LAST_CLAIM, Date.now().toString());

    // Add to history
    addToHistory(REWARD_AMOUNT);

    // Show success message
    showToast(`Claimed ${REWARD_AMOUNT} $FAL!`, 'success');

    // Disable claim button temporarily
    disableClaimButton();

    // Reset button after cooldown
    setTimeout(() => {
        enableClaimButton();
    }, CLAIM_INTERVAL);
}

// Disable claim button
function disableClaimButton() {
    const claimBtn = document.getElementById('claimBtn');
    claimBtn.disabled = true;
}

// Enable claim button
function enableClaimButton() {
    const claimBtn = document.getElementById('claimBtn');
    claimBtn.disabled = false;
}

// Update claim button state
function updateClaimButtonState() {
    const claimBtn = document.getElementById('claimBtn');
    if (!canClaim()) {
        claimBtn.disabled = true;
    } else {
        claimBtn.disabled = false;
    }
}

// Start countdown timer
function startCountdownTimer() {
    setInterval(() => {
        const timeRemaining = getTimeRemaining();
        const seconds = Math.ceil(timeRemaining / 1000);

        const timerDisplay = document.getElementById('nextClaimTimer');
        if (timerDisplay) {
            timerDisplay.textContent = `00:${seconds.toString().padStart(2, '0')}`;
        }

        updateClaimButtonState();
    }, 1000);
}

// Add claim to history
function addToHistory(amount) {
    let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];

    const now = new Date();
    const timeString = now.toLocaleTimeString();

    history.unshift({
        amount: amount,
        time: timeString,
        timestamp: Date.now()
    });

    // Keep only last 10 claims
    history = history.slice(0, 10);

    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No claims yet. Start earning!</div>';
        return;
    }

    let html = '';
    history.forEach((item, index) => {
        html += `
            <div class="history-item">
                <span class="history-time">${item.time}</span>
                <span class="history-amount">+${item.amount} $FAL</span>
            </div>
        `;
    });

    historyList.innerHTML = html;

    // Update total claimed
    const totalClaimed = history.reduce((sum, item) => sum + item.amount, 0);
    document.getElementById('totalClaimed').textContent = totalClaimed.toLocaleString();
}

// Clear history
function clearHistory() {
    if (confirm('Are you sure you want to clear your history?')) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
        updateHistoryDisplay();
        showToast('History cleared', 'success');
    }
}

// Go to dashboard
function goToDashboard() {
    navigateToPage('dashboard');
}

// Update withdraw balance
function updateWithdrawBalance() {
    const balance = getBalance();
    document.getElementById('withdrawBalance').textContent = balance.toLocaleString();
    document.getElementById('availableAmount').textContent = balance.toLocaleString();
}

// Connect wallet (TON Connect)
function connectWallet() {
    // For now, simulate wallet connection
    // In production, integrate with TON Connect SDK

    const connectBtn = document.getElementById('connectWalletBtn');
    const walletDisplay = document.getElementById('walletDisplay');
    const withdrawForm = document.getElementById('withdrawForm');

    // Simulate wallet address
    const walletAddress = 'UQC3WByWfdoVF8JLJi7QUdnlZIWodjva5kNrReWcdytM' + Math.random().toString(36).substr(2, 9);

    // Store wallet address
    localStorage.setItem(STORAGE_KEYS.WALLET, walletAddress);

    // Update display
    walletDisplay.innerHTML = `<p class="wallet-address">${walletAddress}</p>`;
    connectBtn.textContent = 'WALLET CONNECTED ✓';
    connectBtn.disabled = true;
    withdrawForm.style.display = 'block';

    showToast('Wallet connected successfully!', 'success');
}

// Process withdrawal
function processWithdrawal() {
    const withdrawAmount = parseInt(document.getElementById('withdrawAmount').value);
    const balance = getBalance();

    if (!withdrawAmount || withdrawAmount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    if (withdrawAmount > balance) {
        showToast('Insufficient balance', 'error');
        return;
    }

    const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET);
    if (!walletAddress) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    // Simulate withdrawal (in production, this would interact with TON blockchain)
    const newBalance = balance - withdrawAmount;
    setBalance(newBalance);

    // Clear input
    document.getElementById('withdrawAmount').value = '';

    showToast(`Withdrew ${withdrawAmount} $FAL to your wallet!`, 'success');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Get user ID from Telegram (if available)
function getTelegramUserInfo() {
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        return window.Telegram.WebApp.initDataUnsafe.user;
    }
    return null;
}

// Initialize Telegram Web App
function initializeTelegramWebApp() {
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        // Optional: Set app appearance
        window.Telegram.WebApp.setHeaderColor('#0a0e27');
        window.Telegram.WebApp.setBackgroundColor('#0a0e27');
    }
}

// Call Telegram initialization on load
window.addEventListener('load', function() {
    initializeTelegramWebApp();
});

// Prevent balance reset on page refresh by using unload event
window.addEventListener('beforeunload', function() {
    // Balance is automatically saved in localStorage
    // No need to do anything here
});

// Auto-save balance periodically
setInterval(() => {
    // This ensures balance is always saved
    const balance = getBalance();
    localStorage.setItem(STORAGE_KEYS.BALANCE, balance.toString());
}, 5000);
