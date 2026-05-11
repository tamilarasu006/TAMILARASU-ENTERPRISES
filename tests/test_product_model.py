"""
Unit tests for the Product model and its validate() classmethod.

Requirements: 12.1, 12.2, 12.3, 12.4
"""

import pytest
from models.product import Product, ProductCategory, FilterState


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_product_dict(**overrides) -> dict:
    """Return a minimal valid product dict, with optional field overrides."""
    base = {
        "id": "alphonso-mango",
        "name": "Alphonso Mango",
        "category": "FRUIT",
        "origin": "India",
        "minimumOrderQuantity": "500 kg",
        "imageUrl": "https://example.com/mango.webp",
        "description": "A premium mango variety from the Konkan coast.",
        "isAvailable": True,
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Valid product — no errors expected
# ---------------------------------------------------------------------------

class TestProductValidateValid:
    def test_valid_product_returns_no_errors(self):
        errors = Product.validate(_valid_product_dict())
        assert errors == {}

    def test_valid_product_from_dict(self):
        product = Product.from_dict(_valid_product_dict())
        assert product.id == "alphonso-mango"
        assert product.name == "Alphonso Mango"
        assert product.category == "FRUIT"
        assert product.isAvailable is True

    def test_valid_product_with_relative_image_url(self):
        errors = Product.validate(_valid_product_dict(imageUrl="/static/images/mango.webp"))
        assert errors == {}

    def test_valid_product_with_all_optional_fields(self):
        data = _valid_product_dict(
            season="March - June",
            unit="kg",
            certifications=["APEDA", "FSSAI"],
            exportDestinations=["UAE", "UK"],
            packagingOptions=["5 kg box"],
            shelfLife="14 days at 8°C",
            tags=["mango", "tropical"],
        )
        errors = Product.validate(data)
        assert errors == {}

    def test_all_valid_categories(self):
        for cat in ["FRUIT", "VEGETABLE", "GRAIN", "SPICE", "OTHER"]:
            errors = Product.validate(_valid_product_dict(category=cat))
            assert errors == {}, f"Expected no errors for category={cat}"


# ---------------------------------------------------------------------------
# id field — Requirement 12.2
# ---------------------------------------------------------------------------

class TestProductValidateId:
    def test_missing_id_raises_error(self):
        data = _valid_product_dict()
        del data["id"]
        errors = Product.validate(data)
        assert "id" in errors

    def test_empty_id_raises_error(self):
        errors = Product.validate(_valid_product_dict(id=""))
        assert "id" in errors

    def test_id_with_uppercase_raises_error(self):
        errors = Product.validate(_valid_product_dict(id="Alphonso-Mango"))
        assert "id" in errors

    def test_id_with_leading_hyphen_raises_error(self):
        errors = Product.validate(_valid_product_dict(id="-alphonso-mango"))
        assert "id" in errors

    def test_id_with_trailing_hyphen_raises_error(self):
        errors = Product.validate(_valid_product_dict(id="alphonso-mango-"))
        assert "id" in errors

    def test_id_with_spaces_raises_error(self):
        errors = Product.validate(_valid_product_dict(id="alphonso mango"))
        assert "id" in errors

    def test_id_with_special_chars_raises_error(self):
        errors = Product.validate(_valid_product_dict(id="alphonso_mango"))
        assert "id" in errors

    def test_id_single_word_is_valid(self):
        errors = Product.validate(_valid_product_dict(id="mango"))
        assert "id" not in errors

    def test_id_with_digits_is_valid(self):
        errors = Product.validate(_valid_product_dict(id="product123"))
        assert "id" not in errors

    def test_id_with_hyphens_and_digits_is_valid(self):
        errors = Product.validate(_valid_product_dict(id="mango-type-1"))
        assert "id" not in errors


# ---------------------------------------------------------------------------
# name field — Requirement 12.1
# ---------------------------------------------------------------------------

class TestProductValidateName:
    def test_missing_name_raises_error(self):
        data = _valid_product_dict()
        del data["name"]
        errors = Product.validate(data)
        assert "name" in errors

    def test_empty_name_raises_error(self):
        errors = Product.validate(_valid_product_dict(name=""))
        assert "name" in errors

    def test_name_exactly_1_char_is_valid(self):
        errors = Product.validate(_valid_product_dict(name="A"))
        assert "name" not in errors

    def test_name_exactly_100_chars_is_valid(self):
        errors = Product.validate(_valid_product_dict(name="A" * 100))
        assert "name" not in errors

    def test_name_101_chars_raises_error(self):
        errors = Product.validate(_valid_product_dict(name="A" * 101))
        assert "name" in errors


# ---------------------------------------------------------------------------
# category field — Requirement 12.3
# ---------------------------------------------------------------------------

class TestProductValidateCategory:
    def test_missing_category_raises_error(self):
        data = _valid_product_dict()
        del data["category"]
        errors = Product.validate(data)
        assert "category" in errors

    def test_invalid_category_raises_error(self):
        errors = Product.validate(_valid_product_dict(category="DAIRY"))
        assert "category" in errors

    def test_lowercase_category_raises_error(self):
        errors = Product.validate(_valid_product_dict(category="fruit"))
        assert "category" in errors

    def test_empty_category_raises_error(self):
        errors = Product.validate(_valid_product_dict(category=""))
        assert "category" in errors


# ---------------------------------------------------------------------------
# origin field — Requirement 12.1
# ---------------------------------------------------------------------------

class TestProductValidateOrigin:
    def test_missing_origin_raises_error(self):
        data = _valid_product_dict()
        del data["origin"]
        errors = Product.validate(data)
        assert "origin" in errors

    def test_empty_origin_raises_error(self):
        errors = Product.validate(_valid_product_dict(origin=""))
        assert "origin" in errors

    def test_whitespace_only_origin_raises_error(self):
        errors = Product.validate(_valid_product_dict(origin="   "))
        assert "origin" in errors


# ---------------------------------------------------------------------------
# minimumOrderQuantity field — Requirement 12.4
# ---------------------------------------------------------------------------

class TestProductValidateMOQ:
    def test_missing_moq_raises_error(self):
        data = _valid_product_dict()
        del data["minimumOrderQuantity"]
        errors = Product.validate(data)
        assert "minimumOrderQuantity" in errors

    def test_empty_moq_raises_error(self):
        errors = Product.validate(_valid_product_dict(minimumOrderQuantity=""))
        assert "minimumOrderQuantity" in errors

    def test_whitespace_only_moq_raises_error(self):
        errors = Product.validate(_valid_product_dict(minimumOrderQuantity="   "))
        assert "minimumOrderQuantity" in errors


# ---------------------------------------------------------------------------
# imageUrl field — Requirement 12.1
# ---------------------------------------------------------------------------

class TestProductValidateImageUrl:
    def test_missing_image_url_raises_error(self):
        data = _valid_product_dict()
        del data["imageUrl"]
        errors = Product.validate(data)
        assert "imageUrl" in errors

    def test_empty_image_url_raises_error(self):
        errors = Product.validate(_valid_product_dict(imageUrl=""))
        assert "imageUrl" in errors

    def test_invalid_image_url_raises_error(self):
        errors = Product.validate(_valid_product_dict(imageUrl="not-a-url"))
        assert "imageUrl" in errors

    def test_http_url_is_valid(self):
        errors = Product.validate(_valid_product_dict(imageUrl="http://example.com/img.jpg"))
        assert "imageUrl" not in errors

    def test_https_url_is_valid(self):
        errors = Product.validate(_valid_product_dict(imageUrl="https://cdn.example.com/img.webp"))
        assert "imageUrl" not in errors

    def test_relative_url_is_valid(self):
        errors = Product.validate(_valid_product_dict(imageUrl="/static/images/product.webp"))
        assert "imageUrl" not in errors


# ---------------------------------------------------------------------------
# description field — Requirement 12.1
# ---------------------------------------------------------------------------

class TestProductValidateDescription:
    def test_missing_description_raises_error(self):
        data = _valid_product_dict()
        del data["description"]
        errors = Product.validate(data)
        assert "description" in errors

    def test_empty_description_raises_error(self):
        errors = Product.validate(_valid_product_dict(description=""))
        assert "description" in errors

    def test_description_exactly_1_char_is_valid(self):
        errors = Product.validate(_valid_product_dict(description="A"))
        assert "description" not in errors

    def test_description_exactly_1000_chars_is_valid(self):
        errors = Product.validate(_valid_product_dict(description="A" * 1000))
        assert "description" not in errors

    def test_description_1001_chars_raises_error(self):
        errors = Product.validate(_valid_product_dict(description="A" * 1001))
        assert "description" in errors


# ---------------------------------------------------------------------------
# isAvailable field — Requirement 12.4
# ---------------------------------------------------------------------------

class TestProductValidateIsAvailable:
    def test_missing_is_available_raises_error(self):
        data = _valid_product_dict()
        del data["isAvailable"]
        errors = Product.validate(data)
        assert "isAvailable" in errors

    def test_string_true_raises_error(self):
        errors = Product.validate(_valid_product_dict(isAvailable="true"))
        assert "isAvailable" in errors

    def test_integer_1_raises_error(self):
        errors = Product.validate(_valid_product_dict(isAvailable=1))
        assert "isAvailable" in errors

    def test_none_raises_error(self):
        errors = Product.validate(_valid_product_dict(isAvailable=None))
        assert "isAvailable" in errors

    def test_false_boolean_is_valid(self):
        errors = Product.validate(_valid_product_dict(isAvailable=False))
        assert "isAvailable" not in errors


# ---------------------------------------------------------------------------
# from_dict raises ValueError on invalid data
# ---------------------------------------------------------------------------

class TestProductFromDict:
    def test_from_dict_raises_on_invalid_data(self):
        with pytest.raises(ValueError):
            Product.from_dict(_valid_product_dict(id="INVALID ID"))

    def test_from_dict_raises_on_missing_required_field(self):
        data = _valid_product_dict()
        del data["name"]
        with pytest.raises(ValueError):
            Product.from_dict(data)

    def test_to_dict_round_trip(self):
        data = _valid_product_dict(
            certifications=["APEDA"],
            tags=["mango"],
        )
        product = Product.from_dict(data)
        result = product.to_dict()
        assert result["id"] == data["id"]
        assert result["name"] == data["name"]
        assert result["certifications"] == ["APEDA"]
        assert result["tags"] == ["mango"]


# ---------------------------------------------------------------------------
# FilterState defaults
# ---------------------------------------------------------------------------

class TestFilterState:
    def test_default_filter_state(self):
        fs = FilterState()
        assert fs.selectedCategory == "ALL"
        assert fs.searchQuery == ""
        assert fs.showAvailableOnly is False

    def test_custom_filter_state(self):
        fs = FilterState(selectedCategory="FRUIT", searchQuery="mango", showAvailableOnly=True)
        assert fs.selectedCategory == "FRUIT"
        assert fs.searchQuery == "mango"
        assert fs.showAvailableOnly is True
