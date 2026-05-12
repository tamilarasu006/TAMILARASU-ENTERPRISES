"""
One-time migration script: copies data from JSON files into MongoDB.

Run once:
    python scripts/migrate_to_mongo.py
"""

import json
import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from db import get_db

DATA_DIR = ROOT / "data"


def load_json(filename: str) -> list | dict:
    path = DATA_DIR / filename
    if not path.exists():
        print(f"  Skipping {filename} — file not found")
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def migrate_collection(db, collection_name: str, data: list, id_field: str = "id"):
    """Insert documents, skipping any that already exist by their id field."""
    if not data:
        print(f"  No data for '{collection_name}', skipping.")
        return

    col = db[collection_name]
    inserted = 0
    skipped = 0

    for doc in data:
        # Use the JSON id field as MongoDB _id to avoid duplicates
        doc["_id"] = doc.get(id_field, None)
        try:
            col.insert_one(doc)
            inserted += 1
        except Exception:
            # Duplicate key — already exists
            skipped += 1

    print(f"  '{collection_name}': {inserted} inserted, {skipped} skipped (already existed)")


def main():
    print("Starting migration to MongoDB...\n")
    db = get_db()

    # Products
    products = load_json("products.json")
    if isinstance(products, list):
        migrate_collection(db, "products", products, id_field="id")

    # Services
    services = load_json("services.json")
    if isinstance(services, list):
        migrate_collection(db, "services", services, id_field="id")

    # Users (passwords are already hashed — safe to migrate)
    users = load_json("users.json")
    if isinstance(users, list):
        migrate_collection(db, "users", users, id_field="id")

    print("\nMigration complete.")


if __name__ == "__main__":
    main()
