# SpendSense Setup Instructions

## Quick Start

### 1. Create Virtual Environment

```bash
cd /Users/akhilp/Documents/Gauntlet/Spensense
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Demo

```bash
python demo.py
```

This will:
- Generate 50 synthetic users
- Detect behavioral signals
- Assign personas
- Generate recommendations
- Run What-If scenarios

### 4. Start the API Server

```bash
python app.py
```

The API will be available at `http://localhost:5000`

### 5. Test the API

```bash
# Get list of users
curl http://localhost:5000/users

# Get user profile (replace with actual user_id)
curl http://localhost:5000/profile/user_0001

# Get recommendations
curl http://localhost:5000/recommendations/user_0001

# Run What-If: Extra credit card payment
curl -X POST http://localhost:5000/what-if \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_0001",
    "scenario_type": "extra_credit_payment",
    "params": {
      "account_id": "user_0001_acc_02",
      "extra_monthly_payment": 200,
      "months": 12
    }
  }'
```

## Project Structure

```
Spensense/
├── ingest/
│   ├── __init__.py
│   └── data_generator.py          # Synthetic data generation
├── features/
│   ├── __init__.py
│   └── signal_detection.py        # Behavioral pattern detection
├── personas/
│   ├── __init__.py
│   └── persona_assignment.py      # 5 persona system
├── recommend/
│   ├── __init__.py
│   ├── recommendation_engine.py   # Education & partner offers
│   └── what_if_simulator.py       # What-If scenarios ⭐
├── data/                           # Generated CSV files
├── app.py                          # Flask REST API
├── demo.py                         # Full feature demo
├── requirements.txt                # Python dependencies
├── README.md                       # Complete documentation
├── PRD.md                          # Product requirements
└── SETUP.md                        # This file

```

## Features Implemented

✅ **Core Requirements:**
- Synthetic Plaid-style data (50-100 users)
- Behavioral signal detection (subscriptions, savings, credit, income)
- 5 persona assignment system with rationales
- Personalized recommendations with "because" explanations
- Consent & eligibility guardrails
- REST API with Flask

✅ **What-If Scenario Simulator (BONUS):**
- Extra credit card payments (with amortization)
- Subscription cancellations
- Increased savings (with compound interest)
- Combined scenarios

## Testing Individual Modules

```bash
# Test data generation
python -m ingest.data_generator

# Test signal detection
python -m features.signal_detection

# Test persona assignment
python -m personas.persona_assignment

# Test recommendations
python -m recommend.recommendation_engine

# Test What-If simulator
python -m recommend.what_if_simulator
```

## Next Steps

1. Run the demo to see everything in action
2. Start the API server and test endpoints
3. Review the generated data in `data/` directory
4. Explore the What-If simulator features
5. Add tests (see testing section in README.md)

## Troubleshooting

**ModuleNotFoundError**: Make sure you've activated the virtual environment and installed dependencies:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Permission errors**: Use virtual environment (don't use --break-system-packages)

**Port 5000 already in use**: Change port in app.py or kill existing process:
```bash
lsof -ti:5000 | xargs kill -9
```

## What Makes This Project Stand Out

1. **Complete What-If Simulator**: Users can model financial decisions with real math
   - Debt amortization formulas
   - Compound interest calculations
   - Personalized projections

2. **Explainability First**: Every recommendation has a plain-language rationale citing specific data

3. **Strong Guardrails**: Consent enforcement, eligibility checks, empowering tone

4. **Production-Ready Structure**: Modular, well-documented, easy to extend

5. **Custom Persona**: "Emergency Fund Starter" targets stable-income users who need savings focus

Enjoy building with SpendSense! 🚀
