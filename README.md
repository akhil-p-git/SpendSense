# SpendSense - Financial Education Platform

> Transform transaction data into personalized financial education with explainable, rules-based logic and consent-driven guardrails.

## 🎯 Overview

SpendSense analyzes Plaid-style transaction data to detect behavioral patterns, assign financial personas, and deliver personalized educational recommendations—**without crossing into regulated financial advice**.

**Key Innovation**: What-If Scenario Simulator for modeling financial decisions in real-time.

## ✨ Features

- **Synthetic Data Generator**: Creates realistic transaction data for 50-100 users
- **Behavioral Signal Detection**: Tracks subscriptions, savings, credit, and income patterns
- **5 Financial Personas**: Automatically assigns users to personalized profiles
- **Smart Recommendations**: 3-5 educational items + 1-3 partner offers per user
- **What-If Simulator**: Model debt payments, subscription cancellations, and savings increases
- **Guardrails**: Consent management, eligibility checks, tone validation
- **Operator Dashboard**: Human oversight with approval workflows
- **Evaluation Metrics**: Coverage, explainability, latency, and auditability tracking

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- pip package manager

### Installation

#### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/spendsense.git
cd spendsense

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Generate synthetic data (if needed)
python demo.py
```

#### Frontend Setup

```bash
# Navigate to React frontend
cd ui-react

# Install dependencies
npm install

# Build for production
npm run build
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
# From project root
python app.py
```
Backend runs on: `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
# From ui-react directory
npm run dev
```
Frontend runs on: `http://localhost:5173`

#### Production Mode

```bash
# Build React app
cd ui-react
npm run build

# Start Flask (serves React build automatically)
cd ..
python app.py
```

Access the application at: `http://localhost:8000`

The Flask app will automatically:
- Serve React build from `ui-react/dist/` if available
- Fall back to old UI from `ui/` if React build not found
- Handle React Router client-side routing with a catch-all route
- Serve static assets (JS, CSS, images) from the build directory

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific test file
pytest tests/test_whatif.py -v
```

## 📊 Project Structure

```
spendsense/
├── ingest/          # Data loading and validation
├── features/        # Signal detection (subscriptions, savings, credit, income)
├── personas/        # Persona assignment logic
├── recommend/        # Recommendation engine + What-If Simulator
├── guardrails/      # Consent, eligibility, tone checks
├── db/              # Database models and utilities (SQLite)
├── ui/              # Legacy UI (HTML/CSS/JS) - backup
├── ui-react/        # Modern React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── features/    # Feature-specific views
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API service layer
│   │   ├── store/       # Zustand state management
│   │   └── types/       # TypeScript definitions
│   └── dist/        # Production build output
├── eval/            # Evaluation harness and metrics
├── tests/            # Unit and integration tests
├── data/             # Synthetic data and configs
├── docs/             # Documentation (PRD, decision log, API docs)
├── requirements.txt  # Python dependencies
├── app.py           # Flask API server
└── README.md        # This file
```

## 🎮 Usage Examples

### Generate Synthetic Data

```python
from ingest.generate_data import DataGenerator

generator = DataGenerator(num_users=100, seed=42)
users, accounts, transactions = generator.generate()
generator.save_to_files('data/')
```

### Detect Behavioral Signals

```python
from features.detector import SignalDetector

detector = SignalDetector()
signals = detector.detect_all_signals(user_id='user_123', window_days=30)

print(f"Subscriptions: {signals['subscriptions']}")
print(f"Savings rate: {signals['savings_rate']}%")
print(f"Credit utilization: {signals['credit_utilization']}%")
```

### Assign Persona

```python
from personas.classifier import PersonaClassifier

classifier = PersonaClassifier()
persona = classifier.assign_persona(signals)

print(f"Persona: {persona['name']}")
print(f"Focus areas: {persona['focus']}")
```

### Run What-If Simulation

```python
from recommend.whatif import WhatIfSimulator

simulator = WhatIfSimulator()

# Simulate extra debt payments
result = simulator.simulate_debt_payment(
    user_id='user_123',
    account_id='card_456',
    extra_payment=300
)

print(f"Payoff date: {result['payoff_date']}")
print(f"Interest saved: ${result['interest_saved']:.2f}")
```

### Get Recommendations

```python
from recommend.engine import RecommendationEngine

engine = RecommendationEngine()
recommendations = engine.generate(user_id='user_123')

for rec in recommendations:
    print(f"{rec['title']}")
    print(f"Because: {rec['rationale']}")
```

## 🔧 API Endpoints

### Core Endpoints
- `POST /users` - Create new user
- `POST /consent` - Record user consent
- `GET /profile/{user_id}` - Get behavioral profile
- `GET /recommendations/{user_id}` - Get personalized recommendations
- `POST /feedback` - Record user feedback

### What-If Simulator Endpoints
- `POST /what-if/simulate` - Run financial scenario simulation
- `GET /what-if/scenarios/{user_id}` - Get saved scenarios
- `POST /what-if/save` - Save scenario for later
- `DELETE /what-if/scenarios/{id}` - Delete saved scenario

### Operator Endpoints
- `GET /operator/review` - Get recommendations pending approval
- `POST /operator/approve/{id}` - Approve recommendation
- `POST /operator/reject/{id}` - Reject recommendation
- `GET /operator/users` - List all users with filters

See [docs/API.md](docs/API.md) for detailed API documentation.

## 📈 Evaluation Metrics

The system tracks these key metrics:

| Metric | Target | Description |
|--------|--------|-------------|
| Coverage | 100% | Users with assigned persona + ≥3 detected behaviors |
| Explainability | 100% | Recommendations with plain-language rationales |
| Latency | <5 sec | Time to generate recommendations per user |
| Auditability | 100% | Recommendations with complete decision traces |
| What-If Accuracy | <1% error | Debt/savings calculation accuracy |

Run evaluation:
```bash
python -m eval.metrics --output results/
```

## 🎨 What-If Simulator Features

### Supported Scenarios

#### 1. Extra Debt Payments
Model the impact of additional monthly payments on:
- Payoff timeline
- Total interest saved
- Monthly cash flow

#### 2. Subscription Cancellations
See the impact of canceling subscriptions:
- Monthly savings
- Annual savings projection
- Alternative allocation suggestions

#### 3. Savings Increases
Project future savings with compound interest:
- Future balance
- Interest earned
- Emergency fund coverage timeline

#### 4. Budget Reallocation
Model moving money between categories:
- Impact on debt payoff
- Impact on savings goals
- Sustainability analysis

## 🛡️ Guardrails

### Consent Management
- Explicit opt-in required before processing any data
- Users can revoke consent at any time
- No recommendations without active consent

### Eligibility Checks
- Minimum income/credit requirements verified
- No offers for products user already has
- No predatory products (payday loans, high-fee services)

### Tone Guidelines
- No shaming language
- Empowering, educational tone
- Neutral, supportive phrasing

### Required Disclaimer     
Every recommendation includes:
> "This is educational content, not financial advice. Consult a licensed advisor for personalized guidance."

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
pytest tests/ -v

# Specific test suites
pytest tests/test_features.py       # Signal detection tests
pytest tests/test_personas.py       # Persona assignment tests
pytest tests/test_whatif.py         # What-If simulator tests
pytest tests/test_guardrails.py     # Consent & eligibility tests
pytest tests/test_integration.py    # End-to-end tests
```

Current coverage: **85%** (target: 80%+)

## 📚 Documentation

- [PRD.md](docs/PRD.md) - Complete product requirements
- [DECISION_LOG.md](docs/DECISION_LOG.md) - Key technical decisions and rationale
- [API.md](docs/API.md) - API endpoint documentation
- [LIMITATIONS.md](docs/LIMITATIONS.md) - Known limitations and constraints

## 🎯 Demo Scenarios

### Scenario 1: High Utilization User (Sarah)
- 28 years old, $65K income
- 72% credit utilization, $3,400 balance on $5,000 limit
- **What-If**: Pay $300 extra per month
- **Result**: Payoff in 18 months, save $1,847 in interest

### Scenario 2: Subscription-Heavy User (Mike)
- 34 years old, $80K income
- 8 active subscriptions totaling $247/month
- **What-If**: Cancel Netflix, Spotify, Adobe
- **Result**: Save $564/year, redirect to emergency fund

### Scenario 3: Savings Builder (Jennifer)
- 31 years old, $95K income
- $12K emergency fund, low credit utilization
- **What-If**: Increase savings by $500/month
- **Result**: Reach $30K in 3 years, earn $2,341 in interest (4.5% APY)

## 🏗️ Tech Stack

### Backend
- **Language**: Python 3.10+
- **API Framework**: Flask + Flask-CORS
- **Database**: SQLite (SQLAlchemy ORM)
- **Testing**: pytest
- **Data Generation**: Faker, NumPy, Pandas
- **PDF Generation**: ReportLab

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **HTTP Client**: Axios
- **Charts**: Recharts

## 📝 License

This is a demonstration project for Peak6 interview process.

## 👤 Author

**[Your Name]**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Peak6 for the project specification
- Plaid for API inspiration
- Anthropic's Claude for development assistance (AI was used as a coding tool, not in the application itself)

## 📞 Contact

For questions or feedback:
- **Technical Contact**: Bryce Harris - bharris@peak6.com
- **Project Repository**: https://github.com/yourusername/spendsense

---

**Disclaimer**: This system provides educational content only and does not constitute financial, investment, tax, or legal advice. Users should consult qualified professionals for personalized guidance.

---

Built with ❤️ for Peak6 | November 2025