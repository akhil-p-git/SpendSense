# SpendSense - Product Requirements Document

## Project Overview

SpendSense is an explainable, consent-aware financial recommendation system that analyzes transaction data to deliver personalized financial education. The system detects behavioral patterns, assigns user personas, and provides actionable recommendations while maintaining strict guardrails around consent, eligibility, and tone.

This document outlines the requirements from the Peak6 Platinum Project specification.

## Core Requirements

### 1. Data Ingestion (Plaid-Style) 
- [x] Generate 50-100 synthetic users
- [x] No real PII (fake names, masked account numbers)
- [x] Diverse financial situations
- [x] Ingest from CSV/JSON

**Data Schema:**
- **Accounts**: account_id, type/subtype, balances, currency, holder_category
- **Transactions**: account_id, date, amount, merchant, payment_channel, category, pending status
- **Liabilities**: Credit card APRs, payment amounts, overdue status, due dates

### 2. Behavioral Signal Detection 
Compute signals for 30-day and 180-day windows:

**Subscriptions:**
- [x] Recurring merchants (e3 in 90 days)
- [x] Monthly recurring spend
- [x] Subscription share of total spend

**Savings:**
- [x] Net inflow to savings accounts
- [x] Growth rate
- [x] Emergency fund coverage

**Credit:**
- [x] Utilization calculations
- [x] Flags for e30%, e50%, e80% utilization
- [x] Minimum-payment-only detection
- [x] Interest charges present
- [x] Overdue status

**Income Stability:**
- [x] Payroll ACH detection
- [x] Payment frequency and variability
- [x] Cash-flow buffer in months

### 3. Persona Assignment (5 Personas) 

**Persona 1: High Utilization**
- Criteria: Utilization e50% OR interest charges OR minimum-payment-only OR overdue
- Focus: Reduce utilization and interest; payment planning

**Persona 2: Variable Income Budgeter**
- Criteria: Median pay gap > 45 days AND cash-flow buffer < 1 month
- Focus: Percent-based budgets, emergency fund basics

**Persona 3: Subscription-Heavy**
- Criteria: Recurring merchants e3 AND (monthly spend e$50 OR subscription share e10%)
- Focus: Subscription audit, cancellation tips

**Persona 4: Savings Builder**
- Criteria: Savings growth e2% OR net inflow e$200/month, AND all cards <30% utilization
- Focus: Goal setting, automation, APY optimization

**Persona 5: Emergency Fund Starter** (Custom)
- Criteria: Emergency fund < 1 month AND stable income AND no high utilization
- Focus: Building emergency fund, automatic transfers
- Rationale: Users with stable income need focused guidance on financial resilience

### 4. Personalization & Recommendations 
- [x] 3-5 education items per user
- [x] 1-3 partner offers with eligibility checks
- [x] Every item includes "because" rationale
- [x] Plain-language explanations (no jargon)

**Example Rationale:**
"We noticed your Visa ending in 4523 is at 68% utilization ($3,400 of $5,000 limit). Bringing this below 30% could improve your credit score and reduce interest charges of $87/month."

### 5. Consent, Eligibility & Tone Guardrails 

**Consent:**
- [x] Explicit opt-in required
- [x] Users can revoke consent
- [x] Consent status tracked
- [x] No recommendations without consent

**Eligibility:**
- [x] Check minimum requirements
- [x] Filter based on existing accounts
- [x] Avoid harmful suggestions

**Tone:**
- [x] No shaming language
- [x] Empowering, educational tone
- [x] Neutral, supportive language

**Disclosure:**
- [x] Every recommendation includes: "This is educational content, not financial advice."

### 6. What-If Scenario Simulator  (BONUS FEATURE)

**Scenarios Supported:**
1. **Extra Credit Card Payments**
   - Calculate interest saved
   - Project payoff date
   - Show utilization improvement

2. **Subscription Cancellations**
   - Calculate monthly/annual savings
   - Show alternative uses for money

3. **Increased Savings**
   - Project balance growth with compound interest
   - Calculate emergency fund timeline
   - Show time to reach goals

**Why This Matters:**
- Demonstrates actionable education focus
- Provides engagement through personalized projections
- Helps users visualize impact of financial decisions

## Technical Architecture

### Modular Structure 
```
ingest/          - Data loading and validation
features/        - Signal detection and feature engineering
personas/        - Persona assignment logic
recommend/       - Recommendation engine + What-If simulator
data/            - CSV data storage
app.py           - Flask REST API
```

### Storage 
- CSV files for data
- In-memory processing
- JSON for API responses

### API Endpoints 
- POST /users - Create user
- POST /consent - Record consent
- GET /profile/{user_id} - Get behavioral profile
- GET /recommendations/{user_id} - Get recommendations
- POST /what-if - Run what-if scenarios

## Success Criteria

| Category | Metric | Target | Status |
|----------|--------|--------|--------|
| Coverage | Users with persona + e3 behaviors | 100% |  |
| Explainability | Recommendations with rationales | 100% |  |
| Latency | Time to generate recommendations | <5 seconds |  |
| Code Quality | Passing tests | e10 tests | = Pending |
| Documentation | Complete README and decision log | Complete |  |

## Deliverables

- [x] Synthetic Plaid-style data generator (50-100 users)
- [x] Feature pipeline detecting subscriptions, savings, credit, income patterns
- [x] Persona assignment system (5 personas)
- [x] Recommendation engine with plain-language rationales
- [x] Consent and eligibility guardrails
- [x] **What-If Scenario Simulator** (BONUS)
- [x] REST API with Flask
- [x] Complete documentation

## Core Principles

 **Transparency over sophistication** - Every recommendation has clear rationale
 **User control over automation** - Explicit consent, can be revoked
 **Education over sales** - Focus on financial literacy
 **Fairness built in** - No predatory products, empowering tone

## Next Steps

1. Add operator view for human oversight
2. Build evaluation harness with metrics
3. Add unit/integration tests (e10)
4. Create user interface (web app mockup)
5. Document AI tools and prompts used
6. Prepare demo video/presentation

## Contact

For questions or clarifications:
**Bryce Harris** - bharris@peak6.com

---

*Last Updated: November 2025*
