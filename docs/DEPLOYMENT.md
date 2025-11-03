# Deployment Guide

**Version**: 1.0  
**Date**: November 2025  
**Purpose**: Production deployment instructions for SpendSense

---

## Overview

This guide covers deploying SpendSense to production, including both the Flask backend and React frontend.

## Prerequisites

### Server Requirements

- **Python 3.10+**
- **Node.js 18+** (for building React app)
- **SQLite** (included with Python)
- **Reverse proxy** (Nginx recommended)
- **Process manager** (systemd, PM2, or supervisor)

### Environment Setup

```bash
# Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Node.js dependencies
cd ui-react
npm ci  # Use ci for production (clean install)
```

## Build Process

### 1. Build React Frontend

```bash
cd ui-react

# Set production API URL
export VITE_API_URL=https://api.yourdomain.com

# Build for production
npm run build:production
```

This creates optimized production bundles in `ui-react/dist/`.

### 2. Verify Build Output

```bash
ls -la ui-react/dist/
# Should see:
# - index.html
# - assets/ directory with JS and CSS files
```

## Deployment Options

### Option 1: Flask Serves React (Recommended)

Flask serves the React build directly:

**Pros**:
- Single server to manage
- No CORS issues
- Simpler deployment

**Configuration**:

```python
# app.py already configured to serve ui-react/dist/
# Just ensure the build exists before starting Flask
```

**Start Flask**:
```bash
python app.py
```

### Option 2: Separate Frontend/Backend

React app on separate server/CDN:

**Pros**:
- Better scalability
- CDN benefits
- Separate scaling

**Configuration**:

1. **Backend** (Flask):
   ```python
   # Update CORS to allow your frontend domain
   CORS(app, resources={
       r"/*": {
           "origins": ["https://yourdomain.com"],
           "allow_headers": ["Content-Type", "Authorization"],
           "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
       }
   })
   ```

2. **Frontend** (React):
   ```env
   # .env.production
   VITE_API_URL=https://api.yourdomain.com
   ```

3. **Deploy React**:
   - Upload `ui-react/dist/` to CDN or static hosting
   - Configure CDN to serve `index.html` for all routes (SPA routing)

## Production Configuration

### Environment Variables

Create `.env` file:

```env
# Flask
FLASK_ENV=production
FLASK_DEBUG=False

# Database
DATABASE_URL=sqlite:///spendsense.db

# API
API_URL=https://api.yourdomain.com
```

### Flask Configuration

Update `app.py` for production:

```python
# Disable debug mode
app.run(debug=False, host='0.0.0.0', port=8000)

# Or use production server (gunicorn)
# gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### React Configuration

Update `vite.config.ts` for production:

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable source maps in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
```

## Using Production Server (Gunicorn)

### Install Gunicorn

```bash
pip install gunicorn
```

### Run with Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:8000 --timeout 120 app:app
```

**Options**:
- `-w 4`: 4 worker processes
- `-b 0.0.0.0:8000`: Bind to all interfaces on port 8000
- `--timeout 120`: 120 second timeout
- `app:app`: Flask app instance

### Gunicorn Configuration File

Create `gunicorn_config.py`:

```python
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
preload_app = True
```

Run:
```bash
gunicorn -c gunicorn_config.py app:app
```

## Nginx Configuration

### Reverse Proxy Setup

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # React app (SPA routing)
    location / {
        root /path/to/spendsense/ui-react/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Static files
    location /static/ {
        alias /path/to/spendsense/ui-react/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Process Management

### systemd Service

Create `/etc/systemd/system/spendsense.service`:

```ini
[Unit]
Description=SpendSense Flask Application
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/path/to/spendsense
Environment="PATH=/path/to/spendsense/venv/bin"
ExecStart=/path/to/spendsense/venv/bin/gunicorn -c gunicorn_config.py app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable spendsense
sudo systemctl start spendsense
sudo systemctl status spendsense
```

### PM2 (Alternative)

```bash
npm install -g pm2

# Create ecosystem file: ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'spendsense',
    script: 'app.py',
    interpreter: '/path/to/venv/bin/python',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      FLASK_ENV: 'production',
    },
  }],
};
```

Run:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Database Setup

### Production Database

For production, consider PostgreSQL instead of SQLite:

1. **Install PostgreSQL**:
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Update database connection**:
   ```python
   # db/database.py
   DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/spendsense')
   ```

3. **Run migrations** (if using Alembic):
   ```bash
   alembic upgrade head
   ```

### SQLite (Development)

For development, SQLite works fine:
- Database file: `spendsense.db`
- Backed up automatically
- No additional setup needed

## Security Checklist

- [ ] **HTTPS**: SSL/TLS certificates configured
- [ ] **CORS**: Restricted to production domains
- [ ] **Environment Variables**: Sensitive data not in code
- [ ] **API Keys**: Stored securely
- [ ] **Database**: Credentials secure
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Headers**: Security headers configured
- [ ] **Rate Limiting**: Implemented (Flask-Limiter)
- [ ] **Input Validation**: Server-side validation
- [ ] **SQL Injection**: Using ORM (SQLAlchemy)

## Monitoring

### Logging

Configure logging in `app.py`:

```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    file_handler = RotatingFileHandler(
        'logs/spendsense.log',
        maxBytes=10240000,
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
```

### Health Checks

Monitor health endpoint:
```bash
curl https://yourdomain.com/api/health
```

### Metrics

Track:
- API response times
- Error rates
- User activity
- System health metrics

## Backup Strategy

### Database Backup

```bash
# SQLite backup
cp spendsense.db spendsense.db.backup

# PostgreSQL backup
pg_dump spendsense > spendsense_backup.sql
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

## Rollback Procedure

If deployment fails:

1. **Stop services**:
   ```bash
   sudo systemctl stop spendsense
   # or
   pm2 stop spendsense
   ```

2. **Restore previous build**:
   ```bash
   cp ui-react/dist.backup ui-react/dist -r
   ```

3. **Restart services**:
   ```bash
   sudo systemctl start spendsense
   ```

## Post-Deployment Verification

- [ ] Health check endpoint responds
- [ ] React app loads correctly
- [ ] All API endpoints work
- [ ] User selection works
- [ ] Recommendations load
- [ ] What-If simulators work
- [ ] Operator dashboard loads
- [ ] PDF/JSON exports work
- [ ] Mobile responsive design works
- [ ] Error handling displays properly
- [ ] SSL certificate valid
- [ ] Security headers present

## Troubleshooting

### Common Issues

1. **React app not loading**:
   - Check `ui-react/dist/` exists
   - Verify Flask static_folder configuration
   - Check browser console for errors

2. **API calls failing**:
   - Verify CORS configuration
   - Check API URL in environment variables
   - Verify Flask is running

3. **Database errors**:
   - Check database file permissions
   - Verify database exists
   - Check connection string

4. **Performance issues**:
   - Check worker count (Gunicorn)
   - Monitor server resources
   - Check database queries

## Support

For deployment issues:
1. Check logs: `/var/log/spendsense/` or PM2 logs
2. Review error messages
3. Check health endpoint
4. Verify configuration files

