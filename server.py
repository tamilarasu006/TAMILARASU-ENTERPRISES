"""
Production-ready server entry point.
Uses waitress (pure Python WSGI server — no C extensions needed).
Falls back to Flask dev server if waitress is not available.
"""
import os
from app import app

port = int(os.environ.get("PORT", 5000))

try:
    from waitress import serve
    print(f"Starting waitress server on port {port}")
    serve(app, host="0.0.0.0", port=port, threads=4)
except ImportError:
    print(f"waitress not found, using Flask dev server on port {port}")
    app.run(host="0.0.0.0", port=port)
