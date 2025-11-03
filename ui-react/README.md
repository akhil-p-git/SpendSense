# SpendSense React Frontend

Modern React 18 frontend for the SpendSense financial education platform, built with TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, and Axios.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query (React Query)** - Server state management and data fetching
- **Zustand** - Client state management
- **Axios** - HTTP client

## Project Structure

```
ui-react/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components (Button, Card, Loading, etc.)
│   │   └── layout/          # Layout components (Header, Tabs, etc.)
│   ├── features/
│   │   ├── users/           # User selection and management
│   │   ├── profile/         # User profile and persona display
│   │   ├── recommendations/ # Recommendations display
│   │   ├── whatif/          # What-If scenario simulator
│   │   ├── transactions/    # Transaction history
│   │   └── operator/        # Operator dashboard
│   ├── hooks/               # Custom React hooks (useApi, etc.)
│   ├── services/            # API service layer (Axios)
│   ├── store/               # Zustand store
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Flask backend running on http://localhost:8000

### Installation

```bash
cd ui-react
npm install
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Configuration

The frontend connects to the Flask backend at `http://localhost:8000` by default. You can configure this by setting the `VITE_API_URL` environment variable.

## Features

- ✅ User selection and profile display
- ✅ Persona assignment visualization
- ✅ Recommendations with acceptance tracking
- 🔄 What-If Simulator (in progress)
- 🔄 Transactions view (in progress)
- 🔄 Operator Dashboard (in progress)

## State Management

- **Zustand** - Global app state (current user, active tab, loading states)
- **TanStack Query** - Server state caching and synchronization
- **React Router** - Navigation state

## Styling

Uses Tailwind CSS with a custom color scheme matching the original design:
- Primary: Blue (#2563eb)
- Success: Green
- Warning: Orange
- Danger: Red

