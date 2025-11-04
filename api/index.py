"""
Vercel Serverless Function Entry Point
Wraps the Flask app for Vercel's serverless architecture
"""
import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel expects the WSGI application to be exposed as 'handler' or 'application'
# Flask app is WSGI-compatible, so we can expose it directly
handler = app
application = app
