# SpendSense Demo Script

**Version**: 1.0  
**Date**: November 2025  
**Duration**: 10-15 minutes  
**Audience**: Peak6 interview panel

---

## Pre-Demo Setup

### 1. Start the Application

```bash
# Navigate to project directory
cd /Users/akhilp/Documents/Gauntlet/Spensense

# Activate virtual environment (if using)
source venv/bin/activate

# Start Flask server
python app.py
```

**Expected output**:
```
Initializing SpendSense...
✓ Data loaded
SpendSense API is running!
Available endpoints: [...]
```

### 2. Open Browser

Navigate to: `http://localhost:5000`

### 3. Verify Initial State

- User dropdown should be populated
- No errors in browser console
- API responding (can check `/api/health`)

---

## Demo Flow

### **Opening (30 seconds)**

**Script**:
> "Hi, I'm excited to demo SpendSense, a consent-driven financial education platform. SpendSense analyzes transaction data to detect behavioral patterns, assign financial personas, and deliver personalized educational recommendations—all while maintaining strict guardrails around consent, eligibility, and tone.

> The key innovation here is our What-If Scenario Simulator, which lets users model financial decisions and see projected outcomes in real-time."

**Show**: 
- Point to header: "SpendSense - Personalized Financial Education Platform"
- Explain it's built for Peak6

---

### **Part 1: User Selection & Persona Assignment (2 minutes)**

#### Step 1: Select a User

**Action**: 
- Click user dropdown
- Select a user (e.g., "user_0001")

**Script**:
> "Users are only shown if they've provided consent—this is our first guardrail. Let me select a user who has active consent."

**Observe**:
- User profile loads automatically
- Persona badge appears
- Key metrics populate

#### Step 2: Explain Persona

**Script**:
> "This user has been assigned the 'High Utilization' persona. The system detected that their credit card utilization is above 50%, they're paying interest charges, and they're making minimum payments only.

> The persona assignment uses explicit rules—we chose this over machine learning for explainability and regulatory compliance. Every assignment can be traced back to specific data points."

**Show**:
- Point to persona badge
- Explain the 5 personas briefly:
  - High Utilization (Priority 1 - most urgent)
  - Variable Income Budgeter (Priority 2)
  - Subscription-Heavy (Priority 3)
  - Emergency Fund Starter (Priority 4)
  - Savings Builder (Priority 5 - optimization)

#### Step 3: Show Key Metrics

**Script**:
> "These metrics cards show the critical financial signals—inspired by Mint's dashboard design. We can see credit balance, utilization percentage, monthly interest charges, and credit limit.

> All of this analysis happens automatically from the transaction data, detecting patterns like recurring subscriptions, savings growth, credit behavior, and income stability."

**Show**:
- Point to metrics cards
- Explain what each represents

---

### **Part 2: Recommendations Tab (3 minutes)**

#### Step 1: Show Recommendations

**Action**: Click "Recommendations" tab (should be active)

**Script**:
> "The recommendations tab shows personalized education content and partner offers. Notice each recommendation includes a 'Because' rationale—this is our explainability requirement.

> For example: 'We noticed your Visa ending in 4523 is at 68% utilization. Bringing this below 30% could improve your credit score and reduce interest charges of $87/month.'"

**Show**:
- Scroll through recommendations
- Point out the "Because" rationales
- Show distinction between education vs. partner offers

#### Step 2: Explain Guardrails

**Script**:
> "Every recommendation goes through three guardrails:

> **1. Consent**: We check consent before showing any recommendations.

> **2. Eligibility**: Partner offers are filtered—for example, we won't show a balance transfer card to someone with utilization above 90% because they'd likely be declined.

> **3. Tone**: All recommendations are validated for appropriate language. We prohibit shaming phrases like 'bad habits' or 'overspending' and replace them with empowering language like 'spending patterns' or 'opportunity to optimize.'"

**Show**:
- Point to a recommendation card
- Mention the disclaimer at the bottom

#### Step 3: Show Decision Traces

**Script**:
> "For auditability, every recommendation includes a decision trace showing how it was generated—which persona, which signals, which eligibility checks passed. This ensures full transparency."

**Action**: Open browser dev tools, inspect a recommendation object (if time allows)

---

### **Part 3: What-If Simulator (4 minutes)**

#### Scenario 1: Extra Debt Payment

**Action**: 
- Click "What-If Simulator" tab
- Adjust the "Extra Monthly Payment" slider

**Script**:
> "This is our What-If Scenario Simulator. Let's model what happens if this user pays an extra $300 per month on their credit card.

> *[Adjust slider to $300]*

> The system calculates the new payoff timeline, total interest saved, and months saved. As I move the slider, the projections update in real-time."

**Show**:
- Move slider, watch results update
- Point out:
  - Payoff date changes
  - Interest saved
  - Months saved
  - Utilization timeline improvement

**Script**:
> "These calculations use standard amortization formulas—transparent and explainable. We're not using black-box models, so users can verify the math themselves."

#### Scenario 2: Subscription Cancellation

**Action**: 
- Scroll to Subscription Cancellation section
- Check some subscription boxes

**Script**:
> "Let's see what happens if the user cancels some subscriptions. I'll select Netflix, Spotify, and maybe Adobe Creative.

> *[Check boxes]*

> The system shows monthly and annual savings, plus alternative uses for that money—like adding to emergency fund, paying down debt, or investing."

**Show**:
- Check/uncheck boxes
- Show savings calculations
- Point out alternative uses

#### Scenario 3: Increased Savings

**Action**:
- Scroll to Increased Savings section
- Adjust savings slider
- Enter a target amount

**Script**:
> "Finally, let's model savings growth. If the user saves $500 per month at 4.5% APY, we can see how their emergency fund grows over time.

> *[Adjust slider, enter target]*

> The system projects compound interest growth, shows when they'll reach their goal, and tracks emergency fund coverage in months."

**Show**:
- Adjust slider
- Enter target amount (e.g., 10000)
- Show projection results

---

### **Part 4: Transactions & Spending Analysis (2 minutes)**

**Action**: Click "Transactions" tab

**Script**:
> "The Transactions tab shows recent transaction history with categorization—inspired by Mint's transaction list. We can see income in green, expenses in red.

> Below that, we have a spending chart by category—similar to YNAB's category bars. This helps users see where their money is going."

**Show**:
- Scroll through transactions
- Point out income vs. expenses
- Show spending chart
- Explain category breakdown

---

### **Part 5: Operator Dashboard & Evaluation (2 minutes)**

**Action**: Click "Operator View" tab

#### Step 1: User List

**Script**:
> "The Operator Dashboard provides human oversight capabilities. We can see all users, their consent status, and filter by persona.

> This is important for review and approval workflows—operators can approve or override recommendations before they're shown to users."

**Show**:
- User list
- Consent status indicators
- Filter buttons

#### Step 2: Evaluation Metrics

**Action**: Click "Evaluation Report" button

**Script**:
> "The evaluation metrics show our key performance indicators:

> - **Coverage**: Percentage of users with assigned persona + at least 3 detected behaviors (target: 100%)
> - **Explainability**: Percentage of recommendations with rationales (target: 100%)
> - **Latency**: Average response time per user (target: <5 seconds)
> - **Auditability**: Percentage of recommendations with decision traces (target: 100%)

> These metrics are tracked in real-time as the system processes users."

**Show**:
- Point to evaluation metrics
- Explain each metric
- Show overall score

---

### **Closing (1 minute)**

#### Key Takeaways

**Script**:
> "To summarize what we've built:

> 1. **Complete pipeline**: Data ingestion → Signal detection → Persona assignment → Recommendations

> 2. **Guardrails**: Consent, eligibility, and tone validation at every step

> 3. **What-If Simulator**: Interactive scenarios for debt payments, subscription cancellations, and savings increases

> 4. **Evaluation metrics**: Real-time tracking of coverage, explainability, latency, and auditability

> 5. **Modern UI**: Design inspired by top financial apps—Mint, Credit Karma, YNAB

> The system processes 75 synthetic users, maintains 100% explainability, and all recommendations include decision traces for full auditability."

#### Technical Highlights

**Script**:
> "From a technical perspective:

> - **Flask API** with CORS for frontend integration
> - **Rules-based persona assignment** for explainability
> - **Modular architecture** with clear separation of concerns
> - **Comprehensive test suite** (unit tests for all modules)
> - **Synthetic data generation** that mimics Plaid-style transactions

> The codebase is production-ready with proper error handling, logging, and documentation."

---

## Demo Tips

### Do's ✅

1. **Move deliberately**: Give each section 2-3 minutes
2. **Explain the "why"**: Always explain design choices, not just features
3. **Show guardrails**: Emphasize consent, eligibility, tone validation
4. **Highlight innovation**: The What-If Simulator is the key differentiator
5. **Use real numbers**: Reference actual calculations and projections
6. **Test different users**: Show how different personas get different recommendations

### Don'ts ❌

1. **Don't rush**: Take time to explain each feature
2. **Don't skip guardrails**: They're a key differentiator
3. **Don't ignore errors**: If something breaks, explain how you'd handle it
4. **Don't oversell**: Acknowledge limitations (synthetic data, simple formulas)

---

## Backup Plans

### If API Doesn't Start

```bash
# Check if port 5000 is in use
lsof -i :5000

# Try a different port
# Edit app.py: app.run(debug=True, port=5001)
```

### If Frontend Doesn't Load

1. Check browser console for errors
2. Verify Flask is running: `curl http://localhost:5000/api/health`
3. Try opening `ui/index.html` directly (may have CORS issues)
4. Check that `static_folder='ui'` is set in Flask app

### If What-If Simulator Fails

1. Make sure user has a credit card account
2. Try a different user from dropdown
3. Check browser console for API errors
4. Verify account_id format matches data generator pattern

---

## Key Talking Points

### 1. Explainability

> "Every recommendation has a 'Because' rationale citing specific data points. This isn't just good UX—it's a regulatory requirement. Users need to understand why they're seeing a recommendation."

### 2. Guardrails

> "Our guardrails system is three-layered: consent, eligibility, and tone. This prevents harm by ensuring we only process data with permission, only show eligible offers, and only use empowering language."

### 3. What-If Simulator

> "The What-If Simulator turns passive recommendations into active exploration. Users can model decisions before making them, seeing real-time projections of outcomes."

### 4. Persona System

> "The 5 personas are prioritized by financial urgency—we address the most harmful situations first. High utilization debt is Priority 1 because it has immediate costs in interest charges."

### 5. Evaluation Metrics

> "We track coverage, explainability, latency, and auditability in real-time. This ensures we meet our targets: 100% coverage, 100% explainability, <5 second latency."

---

## Expected Questions & Answers

### Q: "Why not use machine learning for persona assignment?"

**A**: "We chose rules-based logic for explainability and regulatory compliance. Every persona assignment can be traced to specific criteria. ML could discover patterns, but black-box models are harder to audit and explain to users."

### Q: "How do you handle edge cases?"

**A**: "We have extensive error handling—missing account IDs, empty transaction lists, division by zero checks. The guardrails system also filters edge cases like users without credit cards trying to use debt payment simulator."

### Q: "What about real Plaid integration?"

**A**: "The current system uses synthetic data that mimics Plaid's schema. Real integration would require Plaid API setup, authentication, and production infrastructure. The architecture is designed to swap in real data easily."

### Q: "How scalable is this?"

**A**: "Currently optimized for demo scale (75 users). For production, we'd add database persistence, caching, and potentially async processing. The modular architecture makes scaling straightforward."

### Q: "How do you ensure recommendations are accurate?"

**A**: "We use standard financial formulas (amortization, compound interest) that are well-tested. All calculations are transparent and explainable. We also have disclaimer language stating this is educational content, not financial advice."

---

**Demo Duration**: ~10-15 minutes  
**Preparation Time**: 5 minutes (start server, open browser)  
**Total Time**: 15-20 minutes

---

Good luck with your demo! 🚀

