# SpendSense - Product Requirements Document (PRD)

**Version**: 1.0  
**Date**: November 3, 2025  
**Author**: [Your Name]  
**Project**: Platinum Project - Peak6 SpendSense  

---

## Executive Summary

SpendSense is a consent-driven financial education platform that analyzes transaction data to detect behavioral patterns, assign financial personas, and deliver personalized educational content—without crossing into regulated financial advice territory.

**Key Innovation**: What-If Scenario Simulator that allows users to model financial decisions and see projected outcomes in real-time.

---

## Goals & Objectives

### Primary Goals
1. Build an explainable, auditable system for financial education
2. Detect behavioral patterns from transaction data with 100% coverage
3. Deliver personalized recommendations with clear rationales
4. Maintain strict guardrails around consent, eligibility, and tone

### Success Metrics
- **Coverage**: 100% of users assigned persona + ≥3 detected behaviors
- **Explainability**: 100% of recommendations with plain-language rationales
- **Latency**: <5 seconds per user for recommendation generation
- **Auditability**: 100% of recommendations with decision traces
- **Code Quality**: ≥10 passing unit/integration tests

---

## Core Components

### 1. Synthetic Data Generator
**Purpose**: Create realistic Plaid-style transaction data for 50-100 users

**Data Structures**:
- **Accounts**: account_id, type/subtype, balances (available, current, limit), currency
- **Transactions**: account_id, date, amount, merchant, category, payment_channel
- **Liabilities**: APRs, payment amounts, overdue status, due dates

**Requirements**:
- No real PII (fake names, masked account numbers)
- Diverse financial situations (income levels, credit behaviors, savings patterns)
- Ingest from CSV/JSON format

### 2. Behavioral Signal Detection
**Time Windows**: 30-day and 180-day rolling windows

**Signals to Detect**:

#### Subscriptions
- Recurring merchants (≥3 in 90 days with monthly/weekly cadence)
- Monthly recurring spend amount
- Subscription share of total spend

#### Savings
- Net inflow to savings accounts (savings, money market, HSA)
- Growth rate percentage
- Emergency fund coverage (savings balance / average monthly expenses)

#### Credit
- Utilization percentage (balance / limit)
- Flags for ≥30%, ≥50%, ≥80% utilization
- Minimum-payment-only detection
- Interest charges present
- Overdue status

#### Income Stability
- Payroll ACH detection
- Payment frequency and variability
- Cash-flow buffer in months

### 3. Persona Assignment System
**Total Personas**: 5

#### Persona 1: High Utilization
- **Criteria**: Card utilization ≥50% OR interest charges > 0 OR minimum-payment-only OR is_overdue = true
- **Focus**: Reduce utilization and interest; payment planning and autopay education

#### Persona 2: Variable Income Budgeter
- **Criteria**: Median pay gap > 45 days AND cash-flow buffer < 1 month
- **Focus**: Percent-based budgets, emergency fund basics, smoothing strategies

#### Persona 3: Subscription-Heavy
- **Criteria**: Recurring merchants ≥3 AND (monthly recurring spend ≥$50 OR subscription spend share ≥10%)
- **Focus**: Subscription audit, cancellation/negotiation tips, bill alerts

#### Persona 4: Savings Builder
- **Criteria**: Savings growth rate ≥2% over window OR net savings inflow ≥$200/month, AND all card utilizations < 30%
- **Focus**: Goal setting, automation, APY optimization (HYSA/CD basics)

#### Persona 5: Debt Optimizer
- **Criteria**: Has ≥2 debt accounts AND total interest charges >$100/month AND positive cash flow
- **Focus**: Debt payoff strategies (avalanche vs snowball), refinancing opportunities, interest reduction

**Prioritization Logic**: If multiple personas match, prioritize in order: 1 → 2 → 5 → 3 → 4

### 4. Recommendation Engine
**Output per User**:
- 3-5 educational items (articles, tools, calculators)
- 1-3 partner offers (balance transfer cards, HYSA, budgeting apps)
- Every item includes "because" rationale citing specific data

**Rationale Format**:
```
"We noticed your Visa ending in 4523 is at 68% utilization ($3,400 of $5,000 limit). 
Bringing this below 30% could improve your credit score and reduce interest charges of $87/month."
```

**Education Content Types**:
- Debt paydown strategy guides
- Budget templates for variable income
- Subscription audit checklists
- Emergency fund calculators
- Credit utilization explainers

**Partner Offers**:
- Balance transfer credit cards (eligibility: credit utilization ≥50%)
- High-yield savings accounts (eligibility: emergency fund <3 months)
- Budgeting apps (eligibility: variable income pattern)
- Subscription management tools (eligibility: ≥3 recurring merchants)

### 5. Guardrails System

#### Consent Management
- Explicit opt-in required before processing any data
- Revocable at any time
- Track consent status per user
- No recommendations without active consent

#### Eligibility Checks
- Minimum income/credit requirements
- Existing account filtering (don't offer savings if user has one)
- No predatory products (payday loans, high-fee services)
- Age and residency requirements

#### Tone Guidelines
- No shaming language (avoid: "you're overspending", "bad habits")
- Empowering, educational tone (use: "opportunity to", "you could")
- Neutral, supportive language
- Acknowledge financial stress without judgment

#### Required Disclosures
Every recommendation must include:
```
"This is educational content, not financial advice. Consult a licensed advisor for personalized guidance."
```

### 6. Operator View Dashboard
**Access Control**: 
- **RESTRICTED TO OPERATORS/TUTORS ONLY**
- Regular users cannot access analytics, persona distributions, or system health metrics
- This ensures privacy and proper access control for sensitive analytics data

**Features**:
- View detected signals for any user
- See 30-day and 180-day persona assignments
- Review generated recommendations with rationales
- Approve or override recommendations
- Access decision trace (why this recommendation was made)
- Flag recommendations for review
- Search and filter users by persona, signals, or behavior
- Analytics dashboard with persona distribution, recommendation tracking, and system health metrics

### 7. Evaluation System
**Metrics to Track**:
- Coverage percentage
- Explainability percentage
- Average latency per user
- Recommendations per persona
- User satisfaction (simulated feedback)
- Fairness metrics (demographic parity if applicable)

**Output Formats**:
- JSON metrics file
- CSV results table
- 1-2 page summary report
- Per-user decision traces

---

## 🚀 NEW FEATURE: What-If Scenario Simulator

### Purpose
Allow users to model financial decisions and see projected outcomes in real-time, turning passive recommendations into active exploration.

### Supported Scenarios

#### 1. Extra Debt Payments
**Input**: 
- Target credit card/loan
- Extra monthly payment amount

**Output**:
- New payoff date
- Total interest saved
- Month-by-month balance projection
- Break-even point

**Formula**:
```
Monthly Payment = (Principal × Monthly Rate) / (1 - (1 + Monthly Rate)^(-Months))
Interest Saved = (Original Total - New Total)
```

#### 2. Subscription Cancellations
**Input**:
- List of subscriptions to cancel
- Expected cancellation date

**Output**:
- Monthly savings amount
- Annual savings projection
- Freed-up cash flow percentage
- Alternative allocation suggestions

#### 3. Savings Increases
**Input**:
- Additional monthly savings amount
- Target duration (months)
- Expected APY (default to 4.5% for HYSA)

**Output**:
- Future balance with compound interest
- Emergency fund coverage timeline
- Goal achievement projection
- Interest earned

**Formula**:
```
Future Value = P × (((1 + r)^n - 1) / r) + Initial × (1 + r)^n
Where: P = monthly payment, r = monthly rate, n = months
```

#### 4. Budget Reallocation
**Input**:
- Category to reduce (e.g., dining out)
- Reduction amount
- Target category (e.g., savings, debt)

**Output**:
- Impact on emergency fund timeline
- Impact on debt payoff
- Spending pattern visualization
- Sustainability score

### Technical Implementation

**API Endpoint**:
```
POST /what-if/simulate
{
  "user_id": "string",
  "scenario_type": "debt_payment" | "cancel_subscriptions" | "increase_savings" | "budget_reallocation",
  "parameters": {
    // Scenario-specific params
  }
}

Response:
{
  "scenario_id": "uuid",
  "projections": {
    "timeline": [],
    "key_metrics": {},
    "visual_data": {}
  },
  "recommendations": [],
  "confidence_level": "high" | "medium" | "low"
}
```

**Data Requirements**:
- Current account balances
- Interest rates and APRs
- Transaction history (for baseline)
- Existing debt amounts and terms

**Constraints**:
- Projections limited to 60 months maximum
- Assumes stable income (flag if variable income persona)
- Includes disclaimer about assumptions
- Shows sensitivity analysis (best/worst/likely cases)

### UI/UX Components

**Interactive Sliders**:
- Debt payment amount ($0 - $2000/month)
- Savings contribution ($0 - $1000/month)
- Subscription selection (checkboxes)

**Visualization**:
- Line chart: Balance over time
- Bar chart: Interest saved comparison
- Progress bar: Goal completion percentage
- Table: Month-by-month breakdown

**Example UI Flow**:
```
1. User selects scenario type
2. Adjusts input parameters (sliders/checkboxes)
3. Clicks "Calculate Impact"
4. Sees real-time projections update
5. Can save scenario or apply recommendations
```

---

## Technical Architecture

### Tech Stack
- **Backend**: Python 3.10+
- **Database**: SQLite (relational) + Parquet (analytics)
- **API**: FastAPI or Flask
- **Frontend**: React or simple HTML/JS
- **Testing**: pytest
- **Data Generation**: Faker, NumPy, Pandas

### Module Structure
```
spendsense/
├── ingest/          # Data loading and validation
│   ├── __init__.py
│   ├── loader.py
│   └── validator.py
├── features/        # Signal detection
│   ├── __init__.py
│   ├── subscriptions.py
│   ├── savings.py
│   ├── credit.py
│   └── income.py
├── personas/        # Persona assignment
│   ├── __init__.py
│   ├── classifier.py
│   └── rules.py
├── recommend/       # Recommendation engine
│   ├── __init__.py
│   ├── engine.py
│   ├── content.py
│   └── whatif.py    # 🆕 What-If Simulator
├── guardrails/      # Consent, eligibility, tone
│   ├── __init__.py
│   ├── consent.py
│   ├── eligibility.py
│   └── tone.py
├── ui/              # Operator view and user interface
│   ├── __init__.py
│   ├── app.py
│   └── templates/
├── eval/            # Evaluation harness
│   ├── __init__.py
│   └── metrics.py
├── tests/           # Unit and integration tests
│   ├── test_features.py
│   ├── test_personas.py
│   ├── test_whatif.py
│   └── ...
├── data/            # Synthetic data and configs
│   ├── synthetic_users.json
│   └── education_content.json
├── docs/            # Documentation
│   ├── PRD.md
│   ├── DECISION_LOG.md
│   └── API.md
├── requirements.txt
├── README.md
└── main.py
```

### API Endpoints

**Core Endpoints**:
- `POST /users` - Create user
- `POST /consent` - Record consent
- `GET /profile/{user_id}` - Get behavioral profile
- `GET /recommendations/{user_id}` - Get recommendations
- `POST /feedback` - Record user feedback
- `GET /operator/review` - Operator approval queue

**What-If Simulator Endpoints**:
- `POST /what-if/simulate` - Run simulation
- `GET /what-if/scenarios/{user_id}` - Get saved scenarios
- `POST /what-if/save` - Save scenario
- `DELETE /what-if/scenarios/{scenario_id}` - Delete saved scenario

### Data Models

**User**:
```json
{
  "user_id": "uuid",
  "consent_status": "active" | "revoked",
  "consent_date": "timestamp",
  "created_at": "timestamp"
}
```

**Account**:
```json
{
  "account_id": "uuid",
  "user_id": "uuid",
  "type": "checking" | "savings" | "credit",
  "subtype": "string",
  "balance_available": "decimal",
  "balance_current": "decimal",
  "balance_limit": "decimal"
}
```

**Transaction**:
```json
{
  "transaction_id": "uuid",
  "account_id": "uuid",
  "date": "date",
  "amount": "decimal",
  "merchant_name": "string",
  "category_primary": "string",
  "category_detailed": "string"
}
```

**Persona Assignment**:
```json
{
  "user_id": "uuid",
  "persona": "string",
  "window": "30d" | "180d",
  "confidence": "decimal",
  "detected_signals": ["list"],
  "assigned_at": "timestamp"
}
```

**Recommendation**:
```json
{
  "recommendation_id": "uuid",
  "user_id": "uuid",
  "type": "education" | "partner_offer",
  "title": "string",
  "description": "string",
  "rationale": "string",
  "data_points": ["list"],
  "eligibility_passed": "boolean",
  "status": "pending" | "approved" | "rejected"
}
```

---

## Implementation Roadmap

### Phase 1: Data Foundation (3-4 hours)
- ✅ Set up project structure
- Generate synthetic dataset (50-100 users)
- Validate Plaid schema compliance
- Set up SQLite database

### Phase 2: Feature Engineering (3-4 hours)
- Build signal detection for subscriptions
- Build signal detection for savings
- Build signal detection for credit
- Build signal detection for income stability
- Write unit tests for each signal

### Phase 3: Persona System (2-3 hours)
- Implement 5 persona assignment rules
- Add prioritization logic
- Test persona classification accuracy
- Document decision criteria

### Phase 4: Recommendations (2-3 hours)
- Build recommendation engine
- Create education content catalog
- Implement partner offer logic
- Add rationale generation

### Phase 5: What-If Simulator (3-4 hours) 🆕
- Implement debt payment calculator
- Implement subscription cancellation simulator
- Implement savings projection calculator
- Build API endpoints
- Create simple UI with sliders/charts

### Phase 6: Guardrails & UX (2-3 hours)
- Add consent management
- Implement eligibility checks
- Build tone validation
- Create operator view dashboard

### Phase 7: Evaluation (1-2 hours)
- Run metrics harness
- Generate evaluation report
- Document limitations
- Create demo scenarios

**Total Estimated Time**: 16-23 hours  
**MVP Target**: End of Day (Focus on Phases 1-5)

---

## Success Criteria

| Category | Metric | Target |
|----------|--------|--------|
| Coverage | Users with persona + ≥3 behaviors | 100% |
| Explainability | Recommendations with rationales | 100% |
| Latency | Time per user | <5 sec |
| Auditability | Recommendations with traces | 100% |
| Code Quality | Unit/integration tests | ≥10 tests |
| Documentation | Schema and decision log | Complete |
| What-If Accuracy | Debt calculation error | <1% |
| What-If Performance | Simulation response time | <2 sec |

---

## Risk Assessment & Mitigation

### Technical Risks
- **Risk**: Synthetic data not realistic enough
- **Mitigation**: Use statistical distributions from real fintech benchmarks

- **Risk**: Performance issues with 100 users
- **Mitigation**: Optimize queries, use Parquet for analytics, cache calculations

- **Risk**: What-If calculations too complex
- **Mitigation**: Start with simple formulas, add complexity iteratively

### Product Risks
- **Risk**: Recommendations not actionable
- **Mitigation**: Every recommendation must have clear next steps

- **Risk**: Tone violations (shaming language)
- **Mitigation**: Automated tone checks + manual review in operator view

- **Risk**: Ineligible offers shown to users
- **Mitigation**: Multi-layer eligibility checks before display

---

## Documentation Requirements

### Required Documents
1. ✅ PRD (this document)
2. README.md with setup instructions
3. DECISION_LOG.md explaining key choices
4. API.md with endpoint documentation
5. LIMITATIONS.md documenting system constraints
6. Test coverage report

### Code Documentation
- Docstrings for all functions
- Inline comments for complex logic
- Type hints throughout
- Example usage in docstrings

---

## Compliance & Legal

### Disclaimers
All user-facing content must include:
```
"This is educational content, not financial advice. 
Consult a licensed advisor for personalized guidance."
```

### Data Privacy
- No real PII in system
- Synthetic data only for demo
- Consent required before processing
- Right to deletion supported

### Financial Regulations
- System does NOT provide:
  - Fiduciary advice
  - Investment recommendations
  - Tax guidance
  - Legal advice

---

## Demo Scenarios for Interview

### Scenario 1: High Utilization User
- **Profile**: Sarah, 28, $65K income, 72% credit utilization
- **Signals**: High utilization, interest charges, irregular payments
- **Persona**: High Utilization
- **What-If**: "What if I pay $300 extra per month?"
- **Outcome**: Payoff in 18 months, save $1,847 in interest

### Scenario 2: Subscription-Heavy User
- **Profile**: Mike, 34, $80K income, 8 active subscriptions ($247/month)
- **Signals**: 8 recurring merchants, 18% subscription spend share
- **Persona**: Subscription-Heavy
- **What-If**: "What if I cancel Netflix, Spotify, and Adobe?"
- **Outcome**: Save $47/month = $564/year, redirect to savings

### Scenario 3: Savings Builder
- **Profile**: Jennifer, 31, $95K income, $12K emergency fund
- **Signals**: Positive savings growth, low credit utilization
- **Persona**: Savings Builder
- **What-If**: "What if I increase savings by $500/month?"
- **Outcome**: Reach $30K in 3 years, earn $2,341 in interest (4.5% APY)

---

## Open Questions & Future Enhancements

### Open Questions
- Should we support joint accounts?
- How do we handle seasonal income (gig workers)?
- What's the minimum transaction history required?

### Future Enhancements
- Multi-scenario comparison (side-by-side)
- Monte Carlo simulation for risk scenarios
- Social benchmarking (anonymized peer comparison)
- Goal tracking system with milestones
- Financial health score (0-100)
- Mobile app with push notifications
- Integration with real Plaid API

---

## Contact & Resources

**Technical Contact**: Bryce Harris - bharris@peak6.com

**Key Resources**:
- Plaid API Documentation: https://plaid.com/docs/
- Behavioral Finance Principles
- FTC Guidelines on Financial Advertising

---

**Last Updated**: November 3, 2025  
**Next Review**: Post-Interview Feedback