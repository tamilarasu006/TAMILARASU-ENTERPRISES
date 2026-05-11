"""
Product catalog loader for TAMILARASU ENTERPRISES website.

Reads products.json, validates each entry, skips malformed records,
and returns a list of valid Product objects.

Requirements: 14.2, 14.3
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import List

from models.product import Product

logger = logging.getLogger(__name__)


def load_products(path: str) -> List[Product]:
    """
    Load and validate products from a JSON file.

    Reads the JSON file at *path*, validates each entry using
    ``Product.validate()``, skips any malformed or incomplete entries
    (logging a warning for each), and returns a list of valid
    ``Product`` objects.

    Args:
        path: Absolute or relative path to the products JSON file.

    Returns:
        A list of valid ``Product`` objects. Returns an empty list if
        the file is missing, unreadable, or contains no valid entries.

    Requirements: 14.2, 14.3
    """
    file_path = Path(path)

    if not file_path.exists():
        logger.warning("Products file not found: %s", path)
        return []

    try:
        with open(file_path, encoding="utf-8") as fh:
            raw = json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        logger.error("Failed to read products file %s: %s", path, exc)
        return []

    if not isinstance(raw, list):
        logger.error("Products file %s must contain a JSON array.", path)
        return []

    products: List[Product] = []

    for index, entry in enumerate(raw):
        if not isinstance(entry, dict):
            logger.warning(
                "Skipping product at index %d: entry is not a JSON object.", index
            )
            continue

        entry_id = entry.get("id", f"<index {index}>")
        errors = Product.validate(entry)

        if errors:
            logger.warning(
                "Skipping product '%s' (index %d): validation errors: %s",
                entry_id,
                index,
                errors,
            )
            continue

        try:
            product = Product.from_dict(entry)
            products.append(product)
        except (ValueError, KeyError) as exc:
            logger.warning(
                "Skipping product '%s' (index %d): failed to construct: %s",
                entry_id,
                index,
                exc,
            )

    logger.info(
        "Loaded %d valid product(s) from %s (%d skipped).",
        len(products),
        path,
        len(raw) - len(products),
    )

    return products
