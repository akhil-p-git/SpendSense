"""
Vercel Serverless Function Entry Point
Wraps the Flask app for Vercel's serverless architecture
"""
import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Suppress database initialization warnings in serverless environment
os.environ['SERVERLESS'] = '1'

try:
    from app import app

    # Vercel expects the WSGI application to be exposed as 'handler' or 'application'
    # Flask app is WSGI-compatible, so we can expose it directly
    handler = app
    application = app
except Exception as e:
    # If app fails to import, create a minimal error handler
    from flask import Flask, jsonify

    app = Flask(__name__)

    @app.route('/')
    @app.route('/<path:path>')
    def error_handler(path=''):
        return jsonify({
            'error': 'Application initialization failed',
            'details': str(e),
            'message': 'Please check Vercel function logs for more details'
        }), 500

    handler = app
    application = app
