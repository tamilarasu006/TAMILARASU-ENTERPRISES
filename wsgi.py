"""
WSGI entry point for production deployment.
Falls back to Flask dev server if gunicorn is unavailable.
"""
from app import app

if __name__ == "__main__":
    app.run()
