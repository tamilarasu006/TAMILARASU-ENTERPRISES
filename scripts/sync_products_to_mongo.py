"""
Sync products.json into MongoDB (upsert — replaces existing records).

Run whenever products.json changes:
    python scripts/sync_products_to_mongo.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from db import get_db

path = ROOT / "data" / "products.json"
products = json.loads(path.read_text(encoding="utf-8"))

db = get_db()
col = db["products"]

updated = 0
for p in products:
    doc = dict(p)
    doc["_id"] = p["id"]
    col.replace_one({"_id": p["id"]}, doc, upsert=True)
    updated += 1
    print(f"  Synced: {p['name']}")

print(f"\nDone. {updated} products synced to MongoDB.")
