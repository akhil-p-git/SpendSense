// SpendSense Frontend Application
// Auto-detect API URL
const API_BASE_URL = window.location.origin === 'http://localhost:5000' || window.location.origin.includes('localhost:5000')
    ? window.location.origin
    : 'http://localhost:5000';

let currentUserId = null;
let currentProfile = null;
let currentRecommendations = null;
let currentSignals = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

// API Helper Functions
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

// Load Users
async function loadUsers() {
    try {
        showLoading(true);
        const data = await apiCall('/users');
        
        const userSelect = document.getElementById('userSelect');
        userSelect.innerHTML = '<option value="">-- Select a user --</option>';
        
        // Only show users with consent
        data.users
            .filter(user => user.consent)
            .forEach(user => {
                const option = document.createElement('option');
                option.value = user.user_id;
                option.textContent = `${user.name} (${user.user_id})`;
                userSelect.appendChild(option);
            });
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
    }
}

// Load User Profile
async function loadUserProfile() {
    const userId = document.getElementById('userSelect').value;
    
    if (!userId) {
        document.getElementById('mainContent').style.display = 'none';
        return;
    }
    
    currentUserId = userId;
    
    try {
        showLoading(true);
        showError(null);
        
        // Load profile
        const profile = await apiCall(`/profile/${userId}`);
        currentProfile = profile;
        currentSignals = profile.signals;
        
        // Display persona
        displayPersona(profile.persona, profile.signals);
        
        // Display metrics
        displayMetrics(profile.signals);
        
        // Load recommendations
        await loadRecommendations(userId);
        
        // Load subscriptions for What-If
        loadSubscriptions(profile.signals);
        
        showLoading(false);
        document.getElementById('mainContent').style.display = 'block';
    } catch (error) {
        showLoading(false);
    }
}

// Display Persona
function displayPersona(persona, signals) {
    const badge = document.getElementById('personaBadge');
    const description = document.getElementById('personaDescription');
    
    if (!persona.primary_persona) {
        badge.textContent = 'Unassigned';
        description.textContent = 'No persona assigned yet.';
        return;
    }
    
    badge.textContent = persona.persona_name || persona.primary_persona;
    description.textContent = persona.primary_focus || `Assigned persona: ${persona.primary_persona}`;
    
    // Color code badges
    badge.className = 'persona-badge';
    if (persona.primary_persona === 'subscription_heavy') {
        badge.classList.add('orange');
    } else if (persona.primary_persona === 'savings_builder') {
        badge.classList.add('green');
    }
}

// Display Metrics
function displayMetrics(signals) {
    const metricsGrid = document.getElementById('metricsGrid');
    metricsGrid.innerHTML = '';
    
    const metrics = [];
    
    if (signals.credit && signals.credit.has_credit_card) {
        metrics.push({
            value: `$${signals.credit.total_credit_balance.toLocaleString()}`,
            label: 'Credit Balance'
        });
        metrics.push({
            value: `${signals.credit.max_utilization.toFixed(1)}%`,
            label: 'Utilization'
        });
    }
    
    if (signals.subscriptions) {
        metrics.push({
            value: `${signals.subscriptions.num_recurring_merchants}`,
            label: 'Subscriptions'
        });
        metrics.push({
            value: `$${signals.subscriptions.monthly_recurring_spend.toFixed(2)}/mo`,
            label: 'Monthly Recurring'
        });
    }
    
    if (signals.savings) {
        metrics.push({
            value: `$${signals.savings.current_savings_balance.toLocaleString()}`,
            label: 'Savings Balance'
        });
        metrics.push({
            value: `${signals.savings.emergency_fund_coverage.toFixed(1)} mo`,
            label: 'Emergency Fund'
        });
    }
    
    metrics.forEach(metric => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.label}</div>
        `;
        metricsGrid.appendChild(card);
    });
}

// Load Recommendations
async function loadRecommendations(userId) {
    try {
        const recommendations = await apiCall(`/recommendations/${userId}`);
        currentRecommendations = recommendations;
        displayRecommendations(recommendations);
    } catch (error) {
        showError('Failed to load recommendations: ' + error.message);
    }
}

// Display Recommendations
function displayRecommendations(recommendations) {
    const list = document.getElementById('recommendationsList');
    list.innerHTML = '';
    
    // Education items
    if (recommendations.education && recommendations.education.length > 0) {
        recommendations.education.forEach(item => {
            const card = createRecommendationCard(item, 'EDUCATION');
            list.appendChild(card);
        });
    }
    
    // Partner offers
    if (recommendations.offers && recommendations.offers.length > 0) {
        recommendations.offers.forEach(offer => {
            const card = createRecommendationCard(offer, 'PARTNER OFFER');
            list.appendChild(card);
        });
    }
    
    if (list.children.length === 0) {
        list.innerHTML = '<p>No recommendations available.</p>';
    }
}

// Create Recommendation Card
function createRecommendationCard(item, type) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    
    const typeBadgeClass = type === 'PARTNER OFFER' ? 'offer' : '';
    
    card.innerHTML = `
        <span class="type-badge ${typeBadgeClass}">${type}</span>
        <h4>${item.title}</h4>
        ${item.description ? `<p>${item.description}</p>` : ''}
        <div class="rationale">
            <strong>Because:</strong> ${item.rationale || 'Based on your financial patterns.'}
        </div>
        ${item.url ? `<a href="${item.url}" target="_blank" class="btn btn-primary" style="margin-top: 1rem;">Learn More</a>` : ''}
    `;
    
    return card;
}

// Load Subscriptions for What-If
function loadSubscriptions(signals) {
    const subscriptionList = document.getElementById('subscriptionList');
    subscriptionList.innerHTML = '';
    
    if (!signals.subscriptions || signals.subscriptions.num_recurring_merchants === 0) {
        subscriptionList.innerHTML = '<p>No subscriptions detected.</p>';
        return;
    }
    
    // Create checkboxes for subscriptions (simplified - would need actual subscription list from API)
    const subscriptions = [
        { name: 'Netflix', amount: 15.99 },
        { name: 'Spotify', amount: 9.99 },
        { name: 'Adobe Creative', amount: 22.99 },
        { name: 'Gym Membership', amount: 45.00 }
    ];
    
    subscriptions.forEach(sub => {
        const item = document.createElement('div');
        item.className = 'subscription-item';
        item.innerHTML = `
            <input type="checkbox" id="sub_${sub.name}" data-name="${sub.name}" data-amount="${sub.amount}" onchange="updateSubscriptionSimulation()">
            <label for="sub_${sub.name}">${sub.name} - $${sub.amount.toFixed(2)}/month</label>
        `;
        subscriptionList.appendChild(item);
    });
}

// What-If Simulations
async function updatePaymentSlider(value) {
    document.getElementById('payment-value').textContent = `$${value}`;
    
    if (!currentUserId || !currentProfile) return;
    
    // Find a credit card account
    if (!currentSignals.credit || !currentSignals.credit.has_credit_card) {
        document.getElementById('debtPaymentResults').innerHTML = '<p>No credit card found.</p>';
        return;
    }
    
    try {
        // Get account_id from user's accounts
        let accountId = null;
        try {
            const accounts = await apiCall(`/users/${currentUserId}/accounts`);
            if (accounts && accounts.accounts) {
                const creditCard = accounts.accounts.find(acc => acc.type === 'credit card');
                if (creditCard) {
                    accountId = creditCard.account_id;
                }
            }
        } catch (e) {
            console.log('Could not fetch accounts:', e);
        }
        
        // If still no account ID, try common pattern
        if (!accountId) {
            accountId = `${currentUserId}_acc_02`; // Common pattern from data generator
        }
        
        const result = await apiCall('/what-if', 'POST', {
            user_id: currentUserId,
            scenario_type: 'extra_credit_payment',
            params: {
                account_id: accountId,
                extra_monthly_payment: parseFloat(value),
                months: 12
            }
        });
        
        displayDebtPaymentResults(result);
    } catch (error) {
        document.getElementById('debtPaymentResults').innerHTML = `
            <div class="error-message">
                <p>${error.message}</p>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">Make sure the user has a credit card account.</p>
            </div>
        `;
    }
}

function displayDebtPaymentResults(result) {
    const container = document.getElementById('debtPaymentResults');
    
    if (!result.current_scenario) {
        container.innerHTML = '<p>Unable to calculate results.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="result-box">
            <h4>Projected Impact</h4>
            <div class="result-metric">
                <span>New Payoff Date</span>
                <strong>${result.extra_payment_scenario.months_to_payoff} months</strong>
            </div>
            <div class="result-metric">
                <span>Total Interest Saved</span>
                <strong>$${result.savings.interest_saved.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Months Saved</span>
                <strong>${result.savings.months_saved.toFixed(0)} months</strong>
            </div>
            <div class="result-metric">
                <span>Recommendation</span>
                <strong>${result.recommendation || 'Good strategy'}</strong>
            </div>
        </div>
    `;
}

async function updateSubscriptionSimulation() {
    const checkboxes = document.querySelectorAll('#subscriptionList input[type="checkbox"]:checked');
    const subscriptions = Array.from(checkboxes).map(cb => ({
        name: cb.dataset.name,
        amount: parseFloat(cb.dataset.amount)
    }));
    
    if (subscriptions.length === 0) {
        document.getElementById('subscriptionResults').innerHTML = '';
        return;
    }
    
    if (!currentUserId) return;
    
    try {
        const result = await apiCall('/what-if', 'POST', {
            user_id: currentUserId,
            scenario_type: 'subscription_cancellation',
            params: {
                subscriptions_to_cancel: subscriptions,
                months: 12
            }
        });
        
        displaySubscriptionResults(result);
    } catch (error) {
        document.getElementById('subscriptionResults').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displaySubscriptionResults(result) {
    const container = document.getElementById('subscriptionResults');
    
    container.innerHTML = `
        <div class="result-box">
            <h4>Projected Savings</h4>
            <div class="result-metric">
                <span>Monthly Savings</span>
                <strong>$${result.monthly_savings.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Annual Savings</span>
                <strong>$${result.annual_savings.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Cash Flow Freed</span>
                <strong>${result.percent_reduction.toFixed(1)}%</strong>
            </div>
            <div style="margin-top: 1rem;">
                <strong>Alternative uses:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                    ${result.alternative_uses.map(use => `<li>${use}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

async function updateSavingsSlider(value) {
    document.getElementById('savings-value').textContent = `$${value}`;
    
    if (!currentUserId) return;
    
    const targetAmount = document.getElementById('target-amount').value;
    
    try {
        const result = await apiCall('/what-if', 'POST', {
            user_id: currentUserId,
            scenario_type: 'increased_savings',
            params: {
                monthly_amount: parseFloat(value),
                target_amount: targetAmount ? parseFloat(targetAmount) : null,
                months: 12
            }
        });
        
        displaySavingsResults(result);
    } catch (error) {
        document.getElementById('savingsResults').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displaySavingsResults(result) {
    const container = document.getElementById('savingsResults');
    
    container.innerHTML = `
        <div class="result-box">
            <h4>Projected Growth (12 months)</h4>
            <div class="result-metric">
                <span>Final Balance</span>
                <strong>$${result.projected_state.final_balance.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Your Contributions</span>
                <strong>$${result.projected_state.total_contributions.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Interest Earned</span>
                <strong>$${result.projected_state.interest_earned.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Emergency Fund Coverage</span>
                <strong>${result.projected_state.emergency_fund_months.toFixed(1)} months</strong>
            </div>
            ${result.months_to_target ? `
                <div class="result-metric">
                    <span>Time to Reach Goal</span>
                    <strong>${result.months_to_target} months</strong>
                </div>
            ` : ''}
        </div>
    `;
}

// Tab Navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'transactions') {
        loadTransactions();
    } else if (tabName === 'operator') {
        loadOperatorView();
    }
}

// Load Transactions
async function loadTransactions() {
    if (!currentUserId) return;
    
    const list = document.getElementById('transactionsList');
    list.innerHTML = '<p>Loading transactions...</p>';
    
    try {
        const data = await apiCall(`/transactions/${currentUserId}`);
        displayTransactions(data.transactions);
    } catch (error) {
        list.innerHTML = `<p class="error">Failed to load transactions: ${error.message}</p>`;
    }
}

function displayTransactions(transactions) {
    const list = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        list.innerHTML = '<p>No transactions found.</p>';
        return;
    }
    
    const transactionList = document.createElement('div');
    transactionList.className = 'transaction-list';
    
    transactions.forEach(txn => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        
        const isIncome = txn.amount < 0;
        const amountClass = isIncome ? 'positive' : '';
        const displayAmount = isIncome ? `+$${Math.abs(txn.amount).toFixed(2)}` : `-$${txn.amount.toFixed(2)}`;
        
        item.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-merchant">${txn.merchant_name}</div>
                <div class="transaction-category">${txn.category_detailed || txn.category_primary}</div>
            </div>
            <div class="transaction-amount ${amountClass}">${displayAmount}</div>
        `;
        transactionList.appendChild(item);
    });
    
    list.innerHTML = '';
    list.appendChild(transactionList);
    
    // Generate spending chart
    generateSpendingChart(transactions);
}

function generateSpendingChart(transactions) {
    const chartDiv = document.getElementById('spendingChart');
    
    // Calculate spending by category
    const categorySpending = {};
    transactions.forEach(txn => {
        if (txn.amount > 0) { // Only expenses
            const category = txn.category_primary;
            categorySpending[category] = (categorySpending[category] || 0) + txn.amount;
        }
    });
    
    // Sort by amount
    const sorted = Object.entries(categorySpending)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 categories
    
    if (sorted.length === 0) {
        chartDiv.innerHTML = '<p>No spending data available.</p>';
        return;
    }
    
    const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);
    
    chartDiv.innerHTML = sorted.map(([category, amount]) => {
        const percentage = (amount / total * 100).toFixed(1);
        const width = (amount / total * 100);
        
        return `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>${category.replace(/_/g, ' ')}</span>
                    <span><strong>$${amount.toFixed(2)}</strong> (${percentage}%)</span>
                </div>
                <div class="chart-bar" style="width: ${width}%;">${percentage}%</div>
            </div>
        `;
    }).join('');
}

// Operator View
async function loadOperatorView() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '<p>Loading users...</p>';
    
    try {
        const data = await apiCall('/users');
        
        userList.innerHTML = `
            <div class="user-row" style="background: #f5f7fa; font-weight: 600;">
                <div>User</div>
                <div>Status</div>
                <div>Email</div>
                <div>Actions</div>
            </div>
        `;
        
        data.users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'user-row';
            row.innerHTML = `
                <div>${user.name} (${user.user_id})</div>
                <div>${user.consent ? '✓ Active' : '⚠ No Consent'}</div>
                <div>${user.email}</div>
                <div>
                    <button class="btn btn-secondary" onclick="viewUser('${user.user_id}')">View</button>
                </div>
            `;
            userList.appendChild(row);
        });
    } catch (error) {
        userList.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function viewUser(userId) {
    document.getElementById('userSelect').value = userId;
    loadUserProfile();
    showTab('recommendations');
}

// Evaluation Report
async function loadEvaluationReport() {
    const reportDiv = document.getElementById('evaluationReport');
    reportDiv.innerHTML = '<p>Loading evaluation report...</p>';
    
    try {
        const report = await apiCall('/eval/report');
        
        reportDiv.innerHTML = `
            <div class="card">
                <h3>Evaluation Metrics</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                    <div class="metric-card">
                        <div class="metric-value">${report.coverage.coverage_percent.toFixed(1)}%</div>
                        <div class="metric-label">Coverage</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${report.explainability.explainability_percent.toFixed(1)}%</div>
                        <div class="metric-label">Explainability</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${report.latency.avg_latency.toFixed(2)}s</div>
                        <div class="metric-label">Avg Latency</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${report.auditability.auditability_percent.toFixed(1)}%</div>
                        <div class="metric-label">Auditability</div>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <p><strong>Overall Score:</strong> ${report.overall_score.toFixed(1)}%</p>
                    <p><strong>Targets Met:</strong> ${report.targets_met}</p>
                </div>
            </div>
        `;
    } catch (error) {
        reportDiv.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function filterUsers(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter logic would go here
    loadOperatorView();
}

// Utility Functions
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    if (message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        errorDiv.style.display = 'none';
    }
}

// Event listeners
document.getElementById('target-amount').addEventListener('input', function() {
    const savingsValue = document.getElementById('savings-slider').value;
    updateSavingsSlider(savingsValue);
});

