"""
Unit tests for validate_inquiry_form() in inquiry/validator.py.

Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
"""

from __future__ import annotations

import pytest

from inquiry.validator import validate_inquiry_form
from models.inquiry import InquiryFormData, InquiryType


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_form(**overrides) -> InquiryFormData:
    """Return a fully valid InquiryFormData, with optional field overrides."""
    defaults = dict(
        fullName="John Doe",
        email="john.doe@example.com",
        country="India",
        inquiryType=InquiryType.GENERAL.value,
        message="This is a valid inquiry message.",
    )
    defaults.update(overrides)
    return InquiryFormData(**defaults)


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

class TestAllFieldsValid:
    def test_returns_is_valid_true(self):
        result = validate_inquiry_form(_make_form())
        assert result.is_valid is True

    def test_returns_empty_errors(self):
        result = validate_inquiry_form(_make_form())
        assert result.errors == {}

    def test_all_inquiry_types_accepted(self):
        for inquiry_type in InquiryType:
            result = validate_inquiry_form(_make_form(inquiryType=inquiry_type.value))
            assert result.is_valid is True, f"Expected valid for {inquiry_type}"


# ---------------------------------------------------------------------------
# fullName validation (Req 8.1, 8.2)
# ---------------------------------------------------------------------------

class TestFullNameValidation:
    def test_empty_fullname_is_invalid(self):
        result = validate_inquiry_form(_make_form(fullName=""))
        assert result.is_valid is False
        assert "fullName" in result.errors

    def test_whitespace_only_fullname_is_invalid(self):
        result = validate_inquiry_form(_make_form(fullName="   "))
        assert result.is_valid is False
        assert "fullName" in result.errors

    def test_single_char_fullname_is_invalid(self):
        """Boundary: 1 character is below the 2-character minimum."""
        result = validate_inquiry_form(_make_form(fullName="A"))
        assert result.is_valid is False
        assert "fullName" in result.errors

    def test_two_char_fullname_is_valid(self):
        """Boundary: exactly 2 characters meets the minimum."""
        result = validate_inquiry_form(_make_form(fullName="Jo"))
        assert result.is_valid is True
        assert "fullName" not in result.errors

    def test_100_char_fullname_is_valid(self):
        """Boundary: exactly 100 characters meets the maximum."""
        result = validate_inquiry_form(_make_form(fullName="A" * 100))
        assert result.is_valid is True
        assert "fullName" not in result.errors

    def test_101_char_fullname_is_invalid(self):
        """Boundary: 101 characters exceeds the maximum."""
        result = validate_inquiry_form(_make_form(fullName="A" * 101))
        assert result.is_valid is False
        assert "fullName" in result.errors


# ---------------------------------------------------------------------------
# email validation (Req 8.3)
# ---------------------------------------------------------------------------

class TestEmailValidation:
    def test_empty_email_is_invalid(self):
        result = validate_inquiry_form(_make_form(email=""))
        assert result.is_valid is False
        assert "email" in result.errors

    def test_missing_at_sign_is_invalid(self):
        result = validate_inquiry_form(_make_form(email="invalidemail.com"))
        assert result.is_valid is False
        assert "email" in result.errors

    def test_missing_domain_is_invalid(self):
        result = validate_inquiry_form(_make_form(email="user@"))
        assert result.is_valid is False
        assert "email" in result.errors

    def test_missing_local_part_is_invalid(self):
        result = validate_inquiry_form(_make_form(email="@example.com"))
        assert result.is_valid is False
        assert "email" in result.errors

    def test_double_at_sign_is_invalid(self):
        result = validate_inquiry_form(_make_form(email="user@@example.com"))
        assert result.is_valid is False
        assert "email" in result.errors

    def test_no_tld_is_invalid(self):
        result = validate_inquiry_form(_make_form(email="user@example"))
        assert result.is_valid is False
        assert "email" in result.errors

    def test_valid_email_passes(self):
        result = validate_inquiry_form(_make_form(email="valid.user+tag@sub.domain.org"))
        assert result.is_valid is True
        assert "email" not in result.errors


# ---------------------------------------------------------------------------
# country validation (Req 8.4)
# ---------------------------------------------------------------------------

class TestCountryValidation:
    def test_empty_country_is_invalid(self):
        result = validate_inquiry_form(_make_form(country=""))
        assert result.is_valid is False
        assert "country" in result.errors

    def test_whitespace_only_country_is_invalid(self):
        result = validate_inquiry_form(_make_form(country="   "))
        assert result.is_valid is False
        assert "country" in result.errors

    def test_valid_country_passes(self):
        result = validate_inquiry_form(_make_form(country="Sri Lanka"))
        assert result.is_valid is True
        assert "country" not in result.errors


# ---------------------------------------------------------------------------
# inquiryType validation (Req 8.5)
# ---------------------------------------------------------------------------

class TestInquiryTypeValidation:
    def test_invalid_inquiry_type_is_invalid(self):
        result = validate_inquiry_form(_make_form(inquiryType="UNKNOWN_TYPE"))
        assert result.is_valid is False
        assert "inquiryType" in result.errors

    def test_empty_inquiry_type_is_invalid(self):
        result = validate_inquiry_form(_make_form(inquiryType=""))
        assert result.is_valid is False
        assert "inquiryType" in result.errors

    def test_lowercase_inquiry_type_is_invalid(self):
        """Enum values are uppercase; lowercase should not match."""
        result = validate_inquiry_form(_make_form(inquiryType="general"))
        assert result.is_valid is False
        assert "inquiryType" in result.errors

    def test_product_inquiry_type_is_valid(self):
        result = validate_inquiry_form(_make_form(inquiryType="PRODUCT_INQUIRY"))
        assert result.is_valid is True

    def test_export_request_type_is_valid(self):
        result = validate_inquiry_form(_make_form(inquiryType="EXPORT_REQUEST"))
        assert result.is_valid is True

    def test_import_request_type_is_valid(self):
        result = validate_inquiry_form(_make_form(inquiryType="IMPORT_REQUEST"))
        assert result.is_valid is True

    def test_general_type_is_valid(self):
        result = validate_inquiry_form(_make_form(inquiryType="GENERAL"))
        assert result.is_valid is True


# ---------------------------------------------------------------------------
# message validation (Req 8.6, 8.7)
# ---------------------------------------------------------------------------

class TestMessageValidation:
    def test_empty_message_is_invalid(self):
        result = validate_inquiry_form(_make_form(message=""))
        assert result.is_valid is False
        assert "message" in result.errors

    def test_whitespace_only_message_is_invalid(self):
        result = validate_inquiry_form(_make_form(message="   "))
        assert result.is_valid is False
        assert "message" in result.errors

    def test_9_char_message_is_invalid(self):
        """Boundary: 9 characters is below the 10-character minimum."""
        result = validate_inquiry_form(_make_form(message="A" * 9))
        assert result.is_valid is False
        assert "message" in result.errors

    def test_10_char_message_is_valid(self):
        """Boundary: exactly 10 characters meets the minimum."""
        result = validate_inquiry_form(_make_form(message="A" * 10))
        assert result.is_valid is True
        assert "message" not in result.errors

    def test_1000_char_message_is_valid(self):
        """Boundary: exactly 1000 characters meets the maximum."""
        result = validate_inquiry_form(_make_form(message="A" * 1000))
        assert result.is_valid is True
        assert "message" not in result.errors

    def test_1001_char_message_is_invalid(self):
        """Boundary: 1001 characters exceeds the maximum."""
        result = validate_inquiry_form(_make_form(message="A" * 1001))
        assert result.is_valid is False
        assert "message" in result.errors


# ---------------------------------------------------------------------------
# Multiple fields invalid simultaneously (Req 8.8)
# ---------------------------------------------------------------------------

class TestMultipleFieldsInvalid:
    def test_all_fields_empty_returns_all_errors(self):
        form = InquiryFormData(
            fullName="",
            email="",
            country="",
            inquiryType="",
            message="",
        )
        result = validate_inquiry_form(form)
        assert result.is_valid is False
        assert "fullName" in result.errors
        assert "email" in result.errors
        assert "country" in result.errors
        assert "inquiryType" in result.errors
        assert "message" in result.errors

    def test_two_fields_invalid_returns_two_errors(self):
        result = validate_inquiry_form(_make_form(fullName="A", email="bad-email"))
        assert result.is_valid is False
        assert "fullName" in result.errors
        assert "email" in result.errors
        # Other fields should not have errors
        assert "country" not in result.errors
        assert "inquiryType" not in result.errors
        assert "message" not in result.errors


# ---------------------------------------------------------------------------
# Immutability (Req 8.8)
# ---------------------------------------------------------------------------

class TestFormDataNotMutated:
    def test_valid_form_data_unchanged(self):
        form = _make_form()
        original_values = {
            "fullName": form.fullName,
            "email": form.email,
            "country": form.country,
            "inquiryType": form.inquiryType,
            "message": form.message,
        }
        validate_inquiry_form(form)
        assert form.fullName == original_values["fullName"]
        assert form.email == original_values["email"]
        assert form.country == original_values["country"]
        assert form.inquiryType == original_values["inquiryType"]
        assert form.message == original_values["message"]

    def test_invalid_form_data_unchanged(self):
        form = InquiryFormData(
            fullName="A",
            email="bad",
            country="",
            inquiryType="WRONG",
            message="short",
        )
        original_values = {
            "fullName": form.fullName,
            "email": form.email,
            "country": form.country,
            "inquiryType": form.inquiryType,
            "message": form.message,
        }
        validate_inquiry_form(form)
        assert form.fullName == original_values["fullName"]
        assert form.email == original_values["email"]
        assert form.country == original_values["country"]
        assert form.inquiryType == original_values["inquiryType"]
        assert form.message == original_values["message"]
