"""
Unit tests for catalog/loader.py.

Requirements: 14.2, 14.3
"""

from __future__ import annotations

import json
import os
import tempfile

import pytest

from catalog.loader import load_products
from models.product import Product


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_ENTRY = {
    "id": "alphonso-mango",
    "name": "Alphonso Mango",
    "category": "FRUIT",
    "origin": "India",
    "minimumOrderQuantity": "500 kg",
    "imageUrl": "/static/images/products/alphonso-mango.webp",
    "description": "Premium Alphonso mangoes from India.",
    "isAvailable": True,
}

VALID_ENTRY_2 = {
    "id": "basmati-rice",
    "name": "Basmati Rice",
    "category": "GRAIN",
    "origin": "India",
    "minimumOrderQuantity": "1 MT",
    "imageUrl": "/static/images/products/basmati-rice.webp",
    "description": "Premium long-grain Basmati rice.",
    "isAvailable": True,
}

MALFORMED_ENTRY = {
    "id": "bad product",   # invalid id pattern (space)
    "name": "",            # empty name
    "category": "INVALID",
    "origin": "",
    "minimumOrderQuantity": "",
    "imageUrl": "not-a-url",
    "isAvailable": "yes",  # not a boolean
}


def _write_json(data, path: str) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestLoadProductsValidFile:
    def test_loads_all_valid_products(self, tmp_path):
        f = tmp_path / "products.json"
        _write_json([VALID_ENTRY, VALID_ENTRY_2], str(f))
        result = load_products(str(f))
        assert len(result) == 2
        assert all(isinstance(p, Product) for p in result)

    def test_product_fields_are_correct(self, tmp_path):
        f = tmp_path / "products.json"
        _write_json([VALID_ENTRY], str(f))
        result = load_products(str(f))
        assert result[0].id == "alphonso-mango"
        assert result[0].name == "Alphonso Mango"
        assert result[0].category == "FRUIT"

    def test_empty_array_returns_empty_list(self, tmp_path):
        f = tmp_path / "products.json"
        _write_json([], str(f))
        result = load_products(str(f))
        assert result == []


class TestLoadProductsMalformedEntries:
    def test_malformed_entry_is_skipped(self, tmp_path):
        f = tmp_path / "products.json"
        _write_json([MALFORMED_ENTRY], str(f))
        result = load_products(str(f))
        assert result == []

    def test_valid_entries_load_despite_malformed_entry(self, tmp_path):
        f = tmp_path / "products.json"
        _write_json([VALID_ENTRY, MALFORMED_ENTRY, VALID_ENTRY_2], str(f))
        result = load_products(str(f))
        assert len(result) == 2
        ids = [p.id for p in result]
        assert "alphonso-mango" in ids
        assert "basmati-rice" in ids

    def test_non_dict_entry_is_skipped(self, tmp_path):
        f = tmp_path / "products.json"
        _write_json([VALID_ENTRY, "not-a-dict", 42, None], str(f))
        result = load_products(str(f))
        assert len(result) == 1

    def test_missing_required_field_is_skipped(self, tmp_path):
        incomplete = {k: v for k, v in VALID_ENTRY.items() if k != "description"}
        f = tmp_path / "products.json"
        _write_json([incomplete], str(f))
        result = load_products(str(f))
        assert result == []


class TestLoadProductsMissingFile:
    def test_missing_file_returns_empty_list(self, tmp_path):
        result = load_products(str(tmp_path / "nonexistent.json"))
        assert result == []

    def test_invalid_json_returns_empty_list(self, tmp_path):
        f = tmp_path / "products.json"
        f.write_text("{ not valid json }", encoding="utf-8")
        result = load_products(str(f))
        assert result == []

    def test_non_array_json_returns_empty_list(self, tmp_path):
        f = tmp_path / "products.json"
        _write_json({"products": []}, str(f))
        result = load_products(str(f))
        assert result == []


class TestLoadProductsRealFile:
    def test_loads_real_products_json(self):
        """Integration test: load the actual data/products.json."""
        real_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data", "products.json"
        )
        if not os.path.exists(real_path):
            pytest.skip("data/products.json not found")
        result = load_products(real_path)
        assert len(result) >= 5, "Expected at least 5 products in data/products.json"
        assert all(isinstance(p, Product) for p in result)
