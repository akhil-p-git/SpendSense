# Migration Guide: Old UI to React UI

**Version**: 1.0  
**Date**: November 2025  
**Status**: Production Ready

---

## Overview

This guide documents the migration from the original HTML/CSS/JavaScript UI (`/ui`) to the new React-based UI (`/ui-react`). The React UI provides better maintainability, performance, and user experience while maintaining full API compatibility.

## Migration Steps

### 1. Prerequisites

- Node.js 18+ installed
- Python 3.10+ with virtual environment activated
- All dependencies installed:
  ```bash
  # Backend
  pip install -r requirements.txt
  
  # Frontend
  cd ui-react
  npm install
  ```

### 2. Build React Application

```bash
cd ui-react
npm run build
```

This will:
- Type-check TypeScript code
- Build optimized production bundle
- Output to `ui-react/dist/`

### 3. Verify Build Output

Check that `ui-react/dist/` contains:
- `index.html`
- `assets/` directory with JS and CSS files

### 4. Start Flask Backend

```bash
# From project root
python app.py
```

The Flask app will automatically:
- Detect if `ui-react/dist` exists
- Serve React build if available, otherwise fall back to old UI
- All API endpoints remain unchanged

### 5. Access the Application

- **React UI**: `http://localhost:5173` (Vite dev server) or served via Flask
- **Backend API**: `http://localhost:8000`

## API Compatibility

### ✅ Fully Compatible

All existing API endpoints remain unchanged:
- `GET /users` - List all users
- `GET /profile/<user_id>` - Get user profile
- `GET /recommendations/<user_id>` - Get recommendations
- `POST /what-if` - Run scenarios
- `GET /operator/*` - Operator endpoints
- All other endpoints

### Response Formats

All API responses maintain the same structure. The React UI uses TypeScript types that match the existing API contracts.

## Known Issues & Limitations

### 1. Old UI Still Available

The old UI in `/ui` is preserved for backup. Flask will automatically fall back to it if the React build is not found.

### 2. CORS Configuration

CORS is configured to allow all origins in development. For production, update CORS settings in `app.py`:

```python
CORS(app, resources={
    r"/*": {
        "origins": ["https://yourdomain.com"],
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})
```

### 3. Static File Serving

React Router requires all routes to serve `index.html` for client-side routing. The Flask app handles this with a catch-all route.

### 4. Environment Variables

The React app uses environment variables prefixed with `VITE_`. Set these in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

For production, update the API URL to your production backend.

## Rollback Procedure

If you need to rollback to the old UI:

### Option 1: Remove React Build

```bash
# Remove or rename React build directory
mv ui-react/dist ui-react/dist.backup
```

Flask will automatically fall back to serving `/ui` folder.

### Option 2: Temporarily Disable React Route

In `app.py`, comment out the catch-all route:

```python
# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def serve_react_app(path):
#     ...
```

### Option 3: Use Different Ports

Run old UI and React UI on different ports:
- Old UI: Flask serves on port 8000
- React UI: Vite dev server on port 5173

## Verification Checklist

After migration, verify:

- [ ] React app builds without errors
- [ ] Flask serves React app correctly
- [ ] All API endpoints respond correctly
- [ ] User selection works
- [ ] Navigation between tabs works
- [ ] What-If simulators calculate correctly
- [ ] Recommendations display properly
- [ ] Operator dashboard loads
- [ ] PDF/JSON exports work
- [ ] Mobile responsive design works
- [ ] Error handling displays properly

## Performance Improvements

The React UI provides several performance benefits:

1. **Code Splitting**: Pages are lazy-loaded, reducing initial bundle size
2. **Caching**: React Query caches API responses, reducing server load
3. **Optimistic Updates**: UI updates immediately before server confirmation
4. **Memoization**: Components memoized to prevent unnecessary re-renders

## Support

For issues or questions:
1. Check the testing checklist in `docs/TESTING_CHECKLIST.md`
2. Review component architecture in `docs/ARCHITECTURE.md`
3. Check API documentation in `ui-react/API_DOCUMENTATION.md`

## Next Steps

After successful migration:
1. Monitor error logs
2. Collect user feedback
3. Remove old UI folder after confirming stability (optional)
4. Update production deployment scripts

