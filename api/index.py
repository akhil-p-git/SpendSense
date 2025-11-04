"""
Vercel Serverless Function Entry Point
Wraps the Flask app for Vercel's serverless architecture
"""
import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel serverless function handler
def handler(request, context):
    """Handle incoming requests in Vercel's serverless environment"""
    return app(request.environ, context)

# For compatibility
application = app
