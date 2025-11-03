# SpendSense Frontend UI

A modern, responsive frontend for the SpendSense financial education platform.

## Features

- **User Selection**: Choose from users with consent
- **Persona Display**: Shows assigned financial persona with badge
- **Key Metrics**: Credit, subscriptions, savings metrics (Mint-style)
- **Recommendations Tab**: Education content and partner offers with rationales
- **What-If Simulator**: Interactive scenarios for:
  - Extra debt payments
  - Subscription cancellations
  - Increased savings
- **Transactions View**: Recent transactions and spending charts
- **Operator Dashboard**: User management and evaluation metrics

## Design Patterns

Based on research of top financial apps:
- **Mint**: Transaction lists, spending charts, metrics cards
- **Credit Karma**: Persona badges, recommendation cards with rationales
- **YNAB**: Category spending bars, goal tracking
- **PocketGuard**: Clean, minimalist design

## Getting Started

1. Start the Flask API:
```bash
python app.py
```

2. Open the frontend:
   - Navigate to `http://localhost:5000` in your browser
   - Or open `ui/index.html` directly (may have CORS issues)

3. Select a user from the dropdown

4. Explore the different tabs:
   - Recommendations
   - What-If Simulator
   - Transactions
   - Operator View

## API Endpoints Used

- `GET /users` - List all users
- `GET /profile/<user_id>` - Get user profile
- `GET /recommendations/<user_id>` - Get recommendations
- `GET /transactions/<user_id>` - Get transactions
- `POST /what-if` - Run simulations
- `GET /eval/report` - Get evaluation metrics

## File Structure

```
ui/
├── index.html      # Main HTML structure
├── styles.css      # All styling (Mint, Credit Karma, YNAB inspired)
├── app.js          # Frontend application logic
└── README.md       # This file
```

## Browser Support

Works in modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Future Enhancements

- Real-time updates
- Charts library integration (Chart.js, D3)
- Mobile app version
- User authentication
- Save scenarios to profile

