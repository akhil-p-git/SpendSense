# Vercel Deployment Guide for SpendSense

## Issue: Serverless Function Size Limit

Vercel has a 250 MB unzipped size limit for serverless functions. This project uses pandas + numpy which are large dependencies.

## Optimizations Applied

### 1. Reduced Dependencies
- Removed unused packages: `fastparquet`, `pyarrow`, `cramjam`, `fsspec`
- Removed test dependencies: `pytest`, `pluggy`, `iniconfig`
- Removed dev-only dependencies: `Faker`, `Pygments`
- Downgraded to smaller versions of pandas (2.2.0) and numpy (1.26.4)

### 2. Updated `.vercelignore`
- Excludes test files, docs, and large data files
- Excludes React source files (only deploys built files)
- Excludes development dependencies

### 3. Optimized `vercel.json`
- Set Python runtime to 3.9 for better optimization
- Configured function memory and duration limits

## Deployment Steps

### 1. Build the React Frontend
```bash
cd ui-react
npm install
npm run build
cd ..
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

## If Size Limit Still Exceeded

If the deployment still fails, consider these options:

### Option A: Split PDF Export to Separate Function
The PDF export feature uses `reportlab` and `pillow` which are large. You can:

1. Create a separate serverless function for PDF export
2. Remove reportlab and pillow from main requirements.txt
3. Create `api/export.py` with its own requirements.txt

### Option B: Use Alternative Deployment Platform
Consider platforms with larger limits:
- **AWS Lambda**: 250 MB zipped, 512 MB unzipped (with layers up to 250 MB additional)
- **Google Cloud Functions**: 500 MB
- **Railway**: No strict size limits
- **Render**: More flexible limits

### Option C: Optimize Pandas/Numpy Build
Create a custom build script to strip unnecessary files:

```bash
# In package.json or build script
pip install --no-cache-dir -t ./packages pandas numpy
find ./packages -name "*.pyc" -delete
find ./packages -name "__pycache__" -delete
find ./packages -name "*.so" | xargs strip
```

### Option D: Use Vercel + External API
- Deploy the React frontend on Vercel
- Deploy the Python API on Railway/Render
- Update API endpoints in React to point to external API

## Monitoring Deployment Size

Check the size of your dependencies:
```bash
# Create a clean virtual environment
python3 -m venv test_env
source test_env/bin/activate
pip install -r requirements.txt
du -sh test_env/
```

Target: Keep under 200 MB to leave room for Vercel's deployment overhead.

## Development vs Production

- **Development**: Use `requirements-dev.txt`
  ```bash
  pip install -r requirements-dev.txt
  ```

- **Production**: Use `requirements.txt`
  ```bash
  pip install -r requirements.txt
  ```
