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
    
    const userId = document.getElementById('userSelect').value;
    
    // Education items
    if (recommendations.education && recommendations.education.length > 0) {
        recommendations.education.forEach(item => {
            const card = createRecommendationCard(item, 'EDUCATION', userId);
            list.appendChild(card);
        });
    }
    
    // Partner offers
    if (recommendations.offers && recommendations.offers.length > 0) {
        recommendations.offers.forEach(offer => {
            const card = createRecommendationCard(offer, 'PARTNER OFFER', userId);
            list.appendChild(card);
        });
    }
    
    if (list.children.length === 0) {
        list.innerHTML = '<p>No recommendations available.</p>';
    }
}

// Create Recommendation Card
function createRecommendationCard(item, type, userId) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    
    const typeBadgeClass = type === 'PARTNER OFFER' ? 'offer' : '';
    const recType = type === 'PARTNER OFFER' ? 'partner_offer' : 'education';
    const recId = item.id || item.title;
    
    // Track click on card or link
    const trackClick = () => {
        if (userId) {
            trackRecommendationAcceptance(userId, recId, recType);
        }
    };
    
    card.innerHTML = `
        <span class="type-badge ${typeBadgeClass}">${type}</span>
        <h4>${item.title}</h4>
        ${item.description ? `<p>${item.description}</p>` : ''}
        <div class="rationale">
            <strong>Because:</strong> ${item.rationale || 'Based on your financial patterns.'}
        </div>
        ${item.url ? `<a href="${item.url}" target="_blank" class="btn btn-primary" style="margin-top: 1rem;" onclick="trackRecommendationAcceptance('${userId}', '${recId}', '${recType}')">Learn More</a>` : ''}
    `;
    
    // Add click tracking to entire card if no URL (for educational items that might not have links)
    if (!item.url && userId) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', trackClick);
    }
    
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
    currentScenarioResult = result;
    showExportButtons();
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
    currentScenarioResult = result;
    showExportButtons();
}

// Store current scenario result for export
let currentScenarioResult = null;

// Scenario Type Navigation
function showScenarioType(type) {
    // Hide all scenario sections
    document.querySelectorAll('.scenario-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Update tab states
    document.querySelectorAll('.scenario-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show selected section
    if (type === 'basic') {
        document.getElementById('basic-scenarios').style.display = 'block';
    } else if (type === 'goal') {
        document.getElementById('goal-scenarios').style.display = 'block';
    } else if (type === 'combined') {
        document.getElementById('combined-scenarios').style.display = 'block';
        loadCombinedSubscriptionList();
    } else if (type === 'compare') {
        document.getElementById('compare-scenarios').style.display = 'block';
    }
    
    // Hide export buttons when switching
    hideExportButtons();
}

// Goal-Based Planning
function updateGoalMonthsSlider(value) {
    document.getElementById('goal-months-value').textContent = value;
}

async function runGoalBasedPlanning() {
    if (!currentUserId || !currentProfile) return;
    
    const targetMonths = parseInt(document.getElementById('goal-months-slider').value);
    const maxPayment = document.getElementById('max-payment').value ? parseFloat(document.getElementById('max-payment').value) : null;
    
    try {
        // Get account ID
        const accounts = await apiCall(`/users/${currentUserId}/accounts`);
        const creditCard = accounts.accounts.find(acc => acc.type === 'credit card');
        if (!creditCard) {
            throw new Error('No credit card found');
        }
        
        const result = await apiCall('/what-if', 'POST', {
            user_id: currentUserId,
            scenario_type: 'goal_based_payment',
            params: {
                account_id: creditCard.account_id,
                target_months: targetMonths,
                max_monthly_payment: maxPayment
            }
        });
        
        displayGoalResults(result);
    } catch (error) {
        document.getElementById('goalResults').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayGoalResults(result) {
    const container = document.getElementById('goalResults');
    
    const feasibleClass = result.is_feasible ? 'positive' : 'warning';
    
    container.innerHTML = `
        <div class="result-box" style="margin-top: 1rem;">
            <h4>Goal-Based Plan Results</h4>
            <div class="result-metric">
                <span>Required Monthly Payment</span>
                <strong>$${result.required_monthly_payment.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Current Minimum Payment</span>
                <strong>$${result.current_minimum_payment.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Payment Increase Needed</span>
                <strong>$${result.payment_increase.toFixed(2)}</strong>
            </div>
            <div class="result-metric ${feasibleClass}">
                <span>Feasible with Goal?</span>
                <strong>${result.is_feasible ? 'Yes' : 'No'}</strong>
            </div>
            ${!result.is_feasible ? `
                <div class="result-metric">
                    <span>Actual Months with Max Payment</span>
                    <strong>${result.actual_months.toFixed(0)} months</strong>
                </div>
            ` : ''}
            <div class="result-metric">
                <span>Interest Saved</span>
                <strong>$${result.impact.interest_saved.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Months Saved</span>
                <strong>${result.impact.months_saved.toFixed(0)} months</strong>
            </div>
            ${result.recommendation ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px;">
                    <strong>Recommendation:</strong> ${result.recommendation}
                </div>
            ` : ''}
        </div>
    `;
    currentScenarioResult = result;
    showExportButtons();
}

// Combined Scenarios
function loadCombinedSubscriptionList() {
    const container = document.getElementById('combined-subscription-list');
    const subscriptions = [
        { name: 'Netflix', amount: 15.99 },
        { name: 'Spotify', amount: 9.99 },
        { name: 'Adobe Creative', amount: 22.99 },
        { name: 'Gym Membership', amount: 45.00 }
    ];
    
    container.innerHTML = subscriptions.map(sub => `
        <label style="display: block; margin-bottom: 0.5rem;">
            <input type="checkbox" class="combined-sub" data-name="${sub.name}" data-amount="${sub.amount}" onchange="updateCombinedScenario()">
            ${sub.name} - $${sub.amount}/month
        </label>
    `).join('');
}

function updateCombinedScenario() {
    const extraPayment = document.getElementById('combined-extra-payment');
    const paymentAmount = document.getElementById('combined-payment-amount');
    paymentAmount.disabled = !extraPayment.checked;
    
    const increaseSavings = document.getElementById('combined-increase-savings');
    const savingsAmount = document.getElementById('combined-savings-amount');
    savingsAmount.disabled = !increaseSavings.checked;
}

async function runCombinedScenario() {
    if (!currentUserId || !currentProfile) return;
    
    const scenarios = [];
    
    // Extra payment
    if (document.getElementById('combined-extra-payment').checked) {
        const amount = parseFloat(document.getElementById('combined-payment-amount').value);
        if (amount > 0) {
            const accounts = await apiCall(`/users/${currentUserId}/accounts`);
            const creditCard = accounts.accounts.find(acc => acc.type === 'credit card');
            if (creditCard) {
                scenarios.push({
                    type: 'extra_credit_payment',
                    account_id: creditCard.account_id,
                    amount: amount
                });
            }
        }
    }
    
    // Cancel subscriptions
    if (document.getElementById('combined-cancel-subscriptions').checked) {
        const selected = Array.from(document.querySelectorAll('.combined-sub:checked')).map(cb => ({
            name: cb.dataset.name,
            amount: parseFloat(cb.dataset.amount)
        }));
        if (selected.length > 0) {
            scenarios.push({
                type: 'subscription_cancellation',
                subscriptions: selected
            });
        }
    }
    
    // Increase savings
    if (document.getElementById('combined-increase-savings').checked) {
        const amount = parseFloat(document.getElementById('combined-savings-amount').value);
        if (amount > 0) {
            scenarios.push({
                type: 'increased_savings',
                amount: amount
            });
        }
    }
    
    if (scenarios.length === 0) {
        document.getElementById('combinedResults').innerHTML = '<p class="error">Please select at least one scenario.</p>';
        return;
    }
    
    try {
        const result = await apiCall('/what-if', 'POST', {
            user_id: currentUserId,
            scenario_type: 'combined',
            params: {
                scenarios: scenarios,
                months: 12
            }
        });
        
        displayCombinedResults(result);
    } catch (error) {
        document.getElementById('combinedResults').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayCombinedResults(result) {
    const container = document.getElementById('combinedResults');
    
    container.innerHTML = `
        <div class="result-box" style="margin-top: 1rem;">
            <h4>Combined Scenario Impact</h4>
            <div class="result-metric">
                <span>Monthly Cash Flow Impact</span>
                <strong class="${result.monthly_cash_flow_impact >= 0 ? 'positive' : ''}">$${result.monthly_cash_flow_impact.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Annual Cash Flow Impact</span>
                <strong class="${result.annual_cash_flow_impact >= 0 ? 'positive' : ''}">$${result.annual_cash_flow_impact.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Total Interest Saved</span>
                <strong>$${result.total_interest_saved.toFixed(2)}</strong>
            </div>
            <div class="result-metric">
                <span>Total Subscription Savings</span>
                <strong>$${result.total_subscription_savings.toFixed(2)}</strong>
            </div>
            ${result.recommendation ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px;">
                    <strong>Recommendation:</strong> ${result.recommendation}
                </div>
            ` : ''}
            ${result.summary ? `
                <div style="margin-top: 1rem;">
                    <strong>Summary:</strong>
                    <ul style="margin-top: 0.5rem;">
                        ${result.summary.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    currentScenarioResult = result;
    showExportButtons();
}

// Comparison Mode
function updateCompareScenario(letter) {
    const type = document.getElementById(`compare-${letter}-type`).value;
    const paramsDiv = document.getElementById(`compare-${letter}-params`);
    
    if (!type) {
        paramsDiv.innerHTML = '';
        return;
    }
    
    if (type === 'extra_credit_payment') {
        paramsDiv.innerHTML = `
            <input type="number" id="compare-${letter}-amount" placeholder="Extra payment amount" class="input-field" style="width: 100%;">
        `;
    } else if (type === 'subscription_cancellation') {
        paramsDiv.innerHTML = `
            <div id="compare-${letter}-subs" style="margin-top: 0.5rem;"></div>
        `;
        // Load subscription checkboxes
        const subscriptions = [
            { name: 'Netflix', amount: 15.99 },
            { name: 'Spotify', amount: 9.99 },
            { name: 'Adobe Creative', amount: 22.99 },
            { name: 'Gym Membership', amount: 45.00 }
        ];
        document.getElementById(`compare-${letter}-subs`).innerHTML = subscriptions.map(sub => `
            <label style="display: block; margin-bottom: 0.5rem;">
                <input type="checkbox" class="compare-sub" data-name="${sub.name}" data-amount="${sub.amount}">
                ${sub.name} - $${sub.amount}/month
            </label>
        `).join('');
    } else if (type === 'increased_savings') {
        paramsDiv.innerHTML = `
            <input type="number" id="compare-${letter}-amount" placeholder="Monthly savings amount" class="input-field" style="width: 100%;">
            <input type="number" id="compare-${letter}-target" placeholder="Target amount (optional)" class="input-field" style="width: 100%; margin-top: 0.5rem;">
        `;
    }
}

async function runComparison() {
    if (!currentUserId || !currentProfile) return;
    
    const typeA = document.getElementById('compare-a-type').value;
    const typeB = document.getElementById('compare-b-type').value;
    
    if (!typeA || !typeB) {
        document.getElementById('compareResults').innerHTML = '<p class="error">Please select both scenarios to compare.</p>';
        return;
    }
    
    try {
        // Build scenario A
        const scenarioA = { type: typeA };
        if (typeA === 'extra_credit_payment') {
            const accounts = await apiCall(`/users/${currentUserId}/accounts`);
            const creditCard = accounts.accounts.find(acc => acc.type === 'credit card');
            scenarioA.account_id = creditCard.account_id;
            scenarioA.amount = parseFloat(document.getElementById('compare-a-amount').value);
        } else if (typeA === 'subscription_cancellation') {
            scenarioA.subscriptions = Array.from(document.querySelectorAll('#compare-a-subs .compare-sub:checked')).map(cb => ({
                name: cb.dataset.name,
                amount: parseFloat(cb.dataset.amount)
            }));
        } else if (typeA === 'increased_savings') {
            scenarioA.amount = parseFloat(document.getElementById('compare-a-amount').value);
            const target = document.getElementById('compare-a-target').value;
            scenarioA.target_amount = target ? parseFloat(target) : null;
        }
        
        // Build scenario B
        const scenarioB = { type: typeB };
        if (typeB === 'extra_credit_payment') {
            const accounts = await apiCall(`/users/${currentUserId}/accounts`);
            const creditCard = accounts.accounts.find(acc => acc.type === 'credit card');
            scenarioB.account_id = creditCard.account_id;
            scenarioB.amount = parseFloat(document.getElementById('compare-b-amount').value);
        } else if (typeB === 'subscription_cancellation') {
            scenarioB.subscriptions = Array.from(document.querySelectorAll('#compare-b-subs .compare-sub:checked')).map(cb => ({
                name: cb.dataset.name,
                amount: parseFloat(cb.dataset.amount)
            }));
        } else if (typeB === 'increased_savings') {
            scenarioB.amount = parseFloat(document.getElementById('compare-b-amount').value);
            const target = document.getElementById('compare-b-target').value;
            scenarioB.target_amount = target ? parseFloat(target) : null;
        }
        
        const result = await apiCall('/what-if', 'POST', {
            user_id: currentUserId,
            scenario_type: 'compare',
            params: {
                scenario_a: scenarioA,
                scenario_b: scenarioB
            }
        });
        
        displayComparisonResults(result);
    } catch (error) {
        document.getElementById('compareResults').innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayComparisonResults(result) {
    const container = document.getElementById('compareResults');
    const metrics = result.comparison_metrics || {};
    
    container.innerHTML = `
        <div class="result-box" style="margin-top: 1rem;">
            <h4>Scenario Comparison</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                <div>
                    <h5>Scenario A: ${result.scenario_a.scenario_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                </div>
                <div>
                    <h5>Scenario B: ${result.scenario_b.scenario_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                </div>
            </div>
            ${metrics.better_scenario ? `
                <div class="result-metric" style="margin-top: 1rem;">
                    <span>Better Scenario</span>
                    <strong>Scenario ${metrics.better_scenario.toUpperCase()}</strong>
                </div>
            ` : ''}
            ${metrics.recommendation ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px;">
                    <strong>Recommendation:</strong> ${metrics.recommendation}
                </div>
            ` : ''}
        </div>
    `;
    currentScenarioResult = result;
    showExportButtons();
}

// Export Functionality
function showExportButtons() {
    document.getElementById('export-buttons').style.display = 'block';
}

function hideExportButtons() {
    document.getElementById('export-buttons').style.display = 'none';
}

async function exportScenario(format) {
    if (!currentScenarioResult || !currentUserId) {
        alert('No scenario results to export. Please run a scenario first.');
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch('/what-if/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scenario_result: currentScenarioResult,
                user_id: currentUserId,
                format: format
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Export failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scenario_report_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showError('Failed to export scenario: ' + error.message);
    }
}

// Update displayDebtPaymentResults to store results
const originalDisplayDebtPaymentResults = displayDebtPaymentResults;
window.displayDebtPaymentResults = function(result) {
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
    currentScenarioResult = result;
    showExportButtons();
};

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

// Operator View - Load all analytics
async function loadOperatorView() {
    // Load analytics in parallel
    await Promise.all([
        loadPersonaDistribution(),
        loadRecommendationTracking(),
        loadSystemHealth(),
        applyFilters()  // Load filtered users
    ]);
    loadEvaluationReport();
}

// Persona Distribution Chart
async function loadPersonaDistribution() {
    const chartDiv = document.getElementById('personaChart');
    chartDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const data = await apiCall('/operator/persona-distribution');
        
        if (!data.distribution || Object.keys(data.distribution).length === 0) {
            chartDiv.innerHTML = '<p>No persona data available yet.</p>';
            return;
        }
        
        // Create pie chart using SVG
        const total = data.total_users;
        const entries = Object.entries(data.distribution);
        
        // Colors for personas
        const colors = {
            'High Utilization': '#ef4444',
            'Variable Income': '#f59e0b',
            'Subscription-Heavy': '#8b5cf6',
            'Emergency Fund Starter': '#06b6d4',
            'Savings Builder': '#10b981'
        };
        
        let svg = `
            <div style="display: flex; align-items: center; gap: 2rem;">
                <div style="flex: 1;">
                    <svg width="200" height="200" viewBox="0 0 200 200">
        `;
        
        let currentAngle = 0;
        const radius = 80;
        const centerX = 100;
        const centerY = 100;
        
        entries.forEach(([personaName, data], index) => {
            const percentage = data.percentage / 100;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const startAngleRad = (startAngle - 90) * Math.PI / 180;
            const endAngleRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const color = colors[personaName] || '#94a3b8';
            
            svg += `
                <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
                      fill="${color}" 
                      stroke="#fff" 
                      stroke-width="2"
                      opacity="0.8"
                      onmouseover="this.style.opacity='1'" 
                      onmouseout="this.style.opacity='0.8'">
                    <title>${personaName}: ${data.percentage}% (${data.count} users)</title>
                </path>
            `;
            
            currentAngle += angle;
        });
        
        svg += `
                    </svg>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        `;
        
        entries.forEach(([personaName, data]) => {
            const color = colors[personaName] || '#94a3b8';
            svg += `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 16px; height: 16px; background: ${color}; border-radius: 3px;"></div>
                    <span>${personaName}: <strong>${data.count}</strong> (${data.percentage}%)</span>
                </div>
            `;
        });
        
        svg += `
                    </div>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                        <strong>Total Users:</strong> ${total}
                    </div>
                </div>
            </div>
        `;
        
        chartDiv.innerHTML = svg;
    } catch (error) {
        chartDiv.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

// Recommendation Tracking
async function loadRecommendationTracking() {
    const trackingDiv = document.getElementById('recommendationTracking');
    trackingDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const data = await apiCall('/operator/recommendation-tracking');
        
        let html = `
            <div style="margin-top: 1rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <div style="font-size: 2rem; font-weight: bold; color: #2563eb;">
                            ${data.total_views}
                        </div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Total Views</div>
                    </div>
                    <div>
                        <div style="font-size: 2rem; font-weight: bold; color: #10b981;">
                            ${data.total_acceptances}
                        </div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Acceptances</div>
                    </div>
                </div>
                <div style="margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">
                        ${data.acceptance_rate}%
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem;">Acceptance Rate</div>
                </div>
        `;
        
        if (Object.keys(data.by_type).length > 0) {
            html += '<div><strong>By Type:</strong></div><div style="margin-top: 0.5rem;">';
            Object.entries(data.by_type).forEach(([type, stats]) => {
                html += `
                    <div style="padding: 0.5rem; margin-bottom: 0.25rem; background: #f3f4f6; border-radius: 4px;">
                        <div style="font-weight: 600;">${type}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            ${stats.views} views, ${stats.acceptances} acceptances 
                            (${stats.acceptance_rate}% rate)
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        html += '</div>';
        trackingDiv.innerHTML = html;
    } catch (error) {
        trackingDiv.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

// System Health
async function loadSystemHealth() {
    const healthDiv = document.getElementById('systemHealth');
    healthDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const data = await apiCall('/operator/system-health');
        
        const formatUptime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        };
        
        const healthHtml = `
            <div style="margin-top: 1rem;">
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">Uptime</div>
                    <div style="font-size: 1.25rem; font-weight: bold;">${formatUptime(data.uptime_seconds)}</div>
                </div>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: ${data.latency.target_met ? '#d1fae5' : '#fee2e2'}; border-radius: 8px;">
                    <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">Latency</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${data.latency.target_met ? '#059669' : '#dc2626'};">
                        ${data.latency.avg_seconds}s
                    </div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
                        Max: ${data.latency.max_seconds}s | Min: ${data.latency.min_seconds}s
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
                    <div>
                        <div style="font-size: 0.875rem; color: #6b7280;">Users</div>
                        <div style="font-size: 1.25rem; font-weight: bold;">${data.users.total}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">${data.users.consent_rate_percent}% consent</div>
                    </div>
                    <div>
                        <div style="font-size: 0.875rem; color: #6b7280;">API Calls</div>
                        <div style="font-size: 1.25rem; font-weight: bold;">${data.api_calls.total}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">${data.api_calls.avg_per_minute}/min</div>
                    </div>
                </div>
                
                <div style="padding: 1rem; background: #f9fafb; border-radius: 8px;">
                    <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">Recommendations</div>
                    <div style="font-size: 1.25rem; font-weight: bold;">${data.recommendations.acceptance_rate_percent}%</div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">
                        ${data.recommendations.total_acceptances} / ${data.recommendations.total_views} acceptances
                    </div>
                </div>
            </div>
        `;
        
        healthDiv.innerHTML = healthHtml;
    } catch (error) {
        healthDiv.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

// Apply filters
async function applyFilters() {
    const personaFilter = document.getElementById('personaFilter').value;
    const signalFilter = document.getElementById('signalFilter').value;
    const consentFilter = document.getElementById('consentFilter').value;
    
    const userList = document.getElementById('userList');
    userList.innerHTML = '<p>Loading users...</p>';
    
    try {
        const params = new URLSearchParams();
        if (personaFilter) params.append('persona', personaFilter);
        if (signalFilter) params.append('signal_type', signalFilter);
        if (consentFilter) params.append('has_consent', consentFilter);
        
        const url = `/operator/users${params.toString() ? '?' + params.toString() : ''}`;
        const data = await apiCall(url);
        
        // Build header
        userList.innerHTML = `
            <div class="user-row" style="background: #f5f7fa; font-weight: 600;">
                <div>User</div>
                <div>Persona</div>
                <div>Signals</div>
                <div>Status</div>
                <div>Actions</div>
            </div>
        `;
        
        if (data.users.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'user-row';
            emptyRow.innerHTML = '<div colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">No users match the filters</div>';
            userList.appendChild(emptyRow);
            return;
        }
        
        // Build user rows
        data.users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'user-row';
            
            // Format signals
            const signals = [];
            if (user.signals.has_subscriptions) signals.push('Subscriptions');
            if (user.signals.has_savings_signals) signals.push('Savings');
            if (user.signals.has_credit_signals) signals.push('Credit');
            if (user.signals.has_income_signals) signals.push('Income');
            const signalsText = signals.length > 0 ? signals.join(', ') : 'None';
            
            row.innerHTML = `
                <div>${user.name}<br><span style="font-size: 0.75rem; color: #6b7280;">${user.user_id}</span></div>
                <div>${user.persona || 'Unassigned'}</div>
                <div style="font-size: 0.875rem;">${signalsText}</div>
                <div>${user.consent ? '<span style="color: #10b981;">✓ Active</span>' : '<span style="color: #ef4444;">⚠ No Consent</span>'}</div>
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

// Export PDF
async function exportEvaluationPDF() {
    try {
        showLoading(true);
        const response = await fetch('/operator/eval/export-pdf');
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'PDF export failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spendsense_evaluation_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showError('Failed to export PDF: ' + error.message);
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

// Track recommendation acceptance (call when user clicks a recommendation)
async function trackRecommendationAcceptance(userId, recommendationId, recType) {
    try {
        await apiCall('/operator/recommendation/accept', 'POST', {
            user_id: userId,
            recommendation_id: recommendationId,
            type: recType,
            action: 'clicked'
        });
    } catch (error) {
        console.error('Failed to track recommendation acceptance:', error);
    }
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

