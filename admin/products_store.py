"""
Admin product store — CRUD operations on data/products.json.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional

PRODUCTS_FILE = Path(__file__).parent.parent / "data" / "products.json"

VALID_CATEGORIES = {"FRUIT", "VEGETABLE", "GRAIN", "SPICE", "OTHER"}
ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def _load() -> list[dict]:
    if not PRODUCTS_FILE.exists():
        return []
    try:
        with open(PRODUCTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save(products: list[dict]) -> None:
    PRODUCTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)


def get_all() -> list[dict]:
    return _load()


def get_by_id(product_id: str) -> Optional[dict]:
    return next((p for p in _load() if p["id"] == product_id), None)


def validate(data: dict) -> dict[str, str]:
    errors: dict[str, str] = {}
    pid = data.get("id", "").strip()
    if not pid:
        errors["id"] = "ID is required."
    elif not ID_PATTERN.match(pid):
        errors["id"] = "ID must be lowercase letters, digits, and hyphens only."

    if not data.get("name", "").strip():
        errors["name"] = "Name is required."
    elif len(data["name"].strip()) > 100:
        errors["name"] = "Name must be 100 characters or fewer."

    cat = data.get("category", "").strip().upper()
    if cat not in VALID_CATEGORIES:
        errors["category"] = f"Category must be one of: {', '.join(sorted(VALID_CATEGORIES))}."

    if not data.get("origin", "").strip():
        errors["origin"] = "Origin is required."

    if not data.get("minimumOrderQuantity", "").strip():
        errors["minimumOrderQuantity"] = "Minimum order quantity is required."

    if not data.get("imageUrl", "").strip():
        errors["imageUrl"] = "Image URL is required."

    desc = data.get("description", "").strip()
    if not desc:
        errors["description"] = "Description is required."
    elif len(desc) > 1000:
        errors["description"] = "Description must be 1000 characters or fewer."

    is_avail = data.get("isAvailable")
    if not isinstance(is_avail, bool):
        errors["isAvailable"] = "Availability must be true or false."

    return errors


def create(data: dict) -> tuple[Optional[dict], dict[str, str]]:
    errors = validate(data)
    if errors:
        return None, errors
    products = _load()
    if any(p["id"] == data["id"] for p in products):
        return None, {"id": "A product with this ID already exists."}
    product = {
        "id": data["id"].strip(),
        "name": data["name"].strip(),
        "category": data["category"].strip().upper(),
        "origin": data["origin"].strip(),
        "minimumOrderQuantity": data["minimumOrderQuantity"].strip(),
        "imageUrl": data["imageUrl"].strip(),
        "description": data["description"].strip(),
        "isAvailable": bool(data["isAvailable"]),
        "season": data.get("season", "").strip(),
        "unit": data.get("unit", "").strip(),
        "certifications": [c.strip() for c in data.get("certifications", []) if c.strip()],
        "exportDestinations": [d.strip() for d in data.get("exportDestinations", []) if d.strip()],
        "packagingOptions": [o.strip() for o in data.get("packagingOptions", []) if o.strip()],
        "shelfLife": data.get("shelfLife", "").strip(),
        "tags": [t.strip() for t in data.get("tags", []) if t.strip()],
    }
    products.append(product)
    _save(products)
    return product, {}


def update(product_id: str, data: dict) -> tuple[Optional[dict], dict[str, str]]:
    errors = validate(data)
    if errors:
        return None, errors
    products = _load()
    for i, p in enumerate(products):
        if p["id"] == product_id:
            products[i] = {
                "id": product_id,
                "name": data["name"].strip(),
                "category": data["category"].strip().upper(),
                "origin": data["origin"].strip(),
                "minimumOrderQuantity": data["minimumOrderQuantity"].strip(),
                "imageUrl": data["imageUrl"].strip(),
                "description": data["description"].strip(),
                "isAvailable": bool(data["isAvailable"]),
                "season": data.get("season", "").strip(),
                "unit": data.get("unit", "").strip(),
                "certifications": [c.strip() for c in data.get("certifications", []) if c.strip()],
                "exportDestinations": [d.strip() for d in data.get("exportDestinations", []) if d.strip()],
                "packagingOptions": [o.strip() for o in data.get("packagingOptions", []) if o.strip()],
                "shelfLife": data.get("shelfLife", "").strip(),
                "tags": [t.strip() for t in data.get("tags", []) if t.strip()],
            }
            _save(products)
            return products[i], {}
    return None, {"id": "Product not found."}


def delete(product_id: str) -> bool:
    products = _load()
    new_products = [p for p in products if p["id"] != product_id]
    if len(new_products) == len(products):
        return False
    _save(new_products)
    return True
