# SpendSense Frontend - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Backend API

```bash
# Make sure you're in the SpendSense directory
cd /Users/akhilp/Documents/Gauntlet/Spensense

# Activate virtual environment (if using one)
source venv/bin/activate  # On Mac/Linux
# or
venv\Scripts\activate  # On Windows

# Start the Flask server
python app.py
```

The server will start on `http://localhost:5000`

### 2. Open the Frontend

Simply navigate to:
```
http://localhost:5000
```

The Flask server will automatically serve the `ui/index.html` file as the root route.

### 3. Select a User

1. Use the dropdown in the header to select a user
2. Users with `consent: true` will appear in the list
3. Once selected, the dashboard will load automatically

### 4. Explore the Features

#### **Recommendations Tab**
- View personalized education content
- See partner offers with eligibility checks
- Each recommendation includes a "Because" rationale

#### **What-If Simulator Tab**
- **Extra Debt Payment**: Adjust slider to see impact of paying more on credit cards
- **Subscription Cancellation**: Check boxes to cancel subscriptions and see savings
- **Increased Savings**: Set monthly savings amount and target to see growth projection

#### **Transactions Tab**
- View recent transactions
- See spending breakdown by category
- Visual charts showing spending patterns

#### **Operator View Tab**
- View all users
- See consent status
- Load evaluation metrics
- View system performance

## 🎨 Design Features

- **Mint-style**: Transaction lists, metrics cards, clean layout
- **Credit Karma-style**: Persona badges, recommendation cards with rationales
- **YNAB-style**: Category spending bars, goal tracking
- **Responsive**: Works on desktop and mobile

## 🔧 Troubleshooting

### "No users available"
- Make sure the Flask server is running
- Check that users have `consent: true` in the generated data

### "CORS Error"
- The Flask server has CORS enabled
- Make sure you're accessing via `http://localhost:5000`, not opening the HTML file directly

### "API request failed"
- Verify Flask server is running: `python app.py`
- Check browser console for specific error messages
- Make sure you're using a user with consent enabled

### What-If Simulator Not Working
- Make sure the user has a credit card account
- Check browser console for API errors
- Some users may not have credit cards - try a different user

## 📊 API Endpoints Used

- `GET /users` - List users
- `GET /profile/<user_id>` - User profile
- `GET /recommendations/<user_id>` - Recommendations
- `GET /users/<user_id>/accounts` - User accounts
- `GET /transactions/<user_id>` - Transactions
- `POST /what-if` - Run simulations
- `GET /eval/report` - Evaluation metrics

## 🎯 Next Steps

- Test different users to see different personas
- Try various What-If scenarios
- Check the Operator View for system metrics
- Review recommendations and their rationales

Enjoy exploring SpendSense! 🎉

