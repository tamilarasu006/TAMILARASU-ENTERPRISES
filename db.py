"""
MongoDB connection module for TAMILARASU ENTERPRISES.

Provides a singleton MongoDB client and database instance.
"""

import os
from pymongo import MongoClient
from pymongo.database import Database
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB connection URI and database name
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "tamilarasu_enterprises")

# Singleton client and database
_client: MongoClient | None = None
_db: Database | None = None


def get_db() -> Database:
    """
    Get the MongoDB database instance.
    
    Creates a connection on first call and reuses it for subsequent calls.
    """
    global _client, _db
    
    if _db is None:
        _client = MongoClient(MONGO_URI)
        _db = _client[MONGO_DB_NAME]
        
        # Test the connection
        try:
            _client.admin.command('ping')
            print(f"✓ Connected to MongoDB: {MONGO_DB_NAME}")
        except Exception as e:
            print(f"✗ MongoDB connection failed: {e}")
            raise
    
    return _db


def close_db():
    """Close the MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        print("✓ MongoDB connection closed")


# Collection names
COLLECTIONS = {
    "products": "products",
    "services": "services",
    "users": "users",
    "inquiries": "inquiries",
}
