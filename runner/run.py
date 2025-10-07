#!/usr/bin/env python3
"""
Entry point for the ACA Runner service
"""
import os
import sys
from app import create_app

def main():
    # Set default environment variables if not set
    os.environ.setdefault('PORT', '5001')
    os.environ.setdefault('BACKEND_URL', 'http://localhost:3000')
    os.environ.setdefault('SUBMISSIONS_DIR', './data/submissions')
    os.environ.setdefault('RESULTS_DIR', './data/results')
    os.environ.setdefault('TASKS_DIR', './tasks')
    
    # Create and run the Flask app
    app = create_app()
    port = int(os.environ.get('PORT', 5001))
    
    print(f"Starting ACA Runner on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == '__main__':
    main()
