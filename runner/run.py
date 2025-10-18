#!/usr/bin/env python3
"""
ACA Runner Entry Point
Simple wrapper to start the runner service
"""

from runner import app
import os

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 5001))
    print(f"Starting ACA Runner on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
