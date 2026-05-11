"""
Unit tests for inquiry/email_builder.py and utils/sanitize.py.

Requirements: 9.2
"""

from __future__ import annotations

from datetime import datetime

import pytest

from inquiry.email_builder import build_email_payload
from models.inquiry import InquiryFormData
from utils.sanitize import sanitize_input


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_form(**overrides) -> InquiryFormData:
    """Return a minimal valid InquiryFormData, with optional field overrides."""
    defaults = dict(
        fullName="Alice Smith",
        email="alice@example.com",
        phone="+91 98765 43210",
        country="India",
        companyName="Smith Exports",
        inquiryType="PRODUCT_INQUIRY",
        productName="Alphonso Mango",
        quantity="500 kg",
        message="We are interested in importing your mangoes.",
        submitted_at=datetime(2024, 6, 1, 10, 30, 0),
    )
    defaults.update(overrides)
    return InquiryFormData(**defaults)


# ---------------------------------------------------------------------------
# sanitize_input() tests
# ---------------------------------------------------------------------------

class TestSanitizeInput:
    def test_plain_text_unchanged(self):
        assert sanitize_input("Hello World") == "Hello World"

    def test_empty_string(self):
        assert sanitize_input("") == ""

    def test_strips_bold_tag_keeps_text(self):
        # Tags are stripped; inner text is preserved then escaped
        result = sanitize_input("<b>Hello</b>")
        assert "Hello" in result
        assert "<b>" not in result
        assert "</b>" not in result

    def test_removes_script_block_entirely(self):
        result = sanitize_input("<script>alert('xss')</script>safe text")
        assert "alert" not in result
        assert "safe text" in result

    def test_removes_script_block_case_insensitive(self):
        result = sanitize_input("<SCRIPT>evil()</SCRIPT>ok")
        assert "evil" not in result
        assert "ok" in result

    def test_escapes_ampersand(self):
        result = sanitize_input("A & B")
        assert "&amp;" in result

    def test_escapes_less_than(self):
        result = sanitize_input("1 < 2")
        assert "&lt;" in result

    def test_escapes_greater_than(self):
        result = sanitize_input("2 > 1")
        assert "&gt;" in result

    def test_escapes_double_quote(self):
        result = sanitize_input('say "hello"')
        assert "&quot;" in result

    def test_escapes_single_quote(self):
        result = sanitize_input("it's fine")
        assert "&#x27;" in result

    def test_non_string_coerced(self):
        # Non-string values should be coerced to str without raising
        result = sanitize_input(42)  # type: ignore[arg-type]
        assert result == "42"

    def test_nested_tags_stripped(self):
        result = sanitize_input("<div><p>text</p></div>")
        assert "text" in result
        assert "<" not in result.replace("&lt;", "").replace("&gt;", "")


# ---------------------------------------------------------------------------
# build_email_payload() — subject tests
# ---------------------------------------------------------------------------

class TestBuildEmailPayloadSubject:
    def test_subject_format(self):
        form = _make_form(inquiryType="EXPORT_REQUEST", fullName="Bob Jones")
        payload = build_email_payload(form)
        assert payload["subject"] == "New Inquiry: EXPORT_REQUEST from Bob Jones"

    def test_subject_uses_inquiry_type_and_full_name(self):
        form = _make_form(inquiryType="GENERAL", fullName="Priya Nair")
        payload = build_email_payload(form)
        assert "GENERAL" in payload["subject"]
        assert "Priya Nair" in payload["subject"]

    def test_subject_sanitizes_html_in_name(self):
        form = _make_form(fullName="<b>Hacker</b>", inquiryType="GENERAL")
        payload = build_email_payload(form)
        assert "<b>" not in payload["subject"]
        assert "Hacker" in payload["subject"]

    def test_subject_sanitizes_script_in_inquiry_type(self):
        form = _make_form(inquiryType="<script>evil()</script>GENERAL")
        payload = build_email_payload(form)
        assert "evil" not in payload["subject"]


# ---------------------------------------------------------------------------
# build_email_payload() — body tests
# ---------------------------------------------------------------------------

class TestBuildEmailPayloadBody:
    def test_all_fields_present_in_body(self):
        form = _make_form()
        body = build_email_payload(form)["body"]
        assert "Name:" in body
        assert "Email:" in body
        assert "Phone:" in body
        assert "Country:" in body
        assert "Company:" in body
        assert "Inquiry Type:" in body
        assert "Product:" in body
        assert "Quantity:" in body
        assert "Message:" in body
        assert "Submitted At:" in body

    def test_body_contains_field_values(self):
        form = _make_form()
        body = build_email_payload(form)["body"]
        assert "Alice Smith" in body
        assert "alice@example.com" in body
        assert "India" in body
        assert "Smith Exports" in body
        assert "PRODUCT_INQUIRY" in body
        assert "Alphonso Mango" in body
        assert "500 kg" in body
        assert "We are interested in importing your mangoes." in body

    def test_body_contains_submitted_at(self):
        form = _make_form(submitted_at=datetime(2024, 6, 1, 10, 30, 0))
        body = build_email_payload(form)["body"]
        assert "2024-06-01" in body

    def test_body_submitted_at_none(self):
        form = _make_form(submitted_at=None)
        body = build_email_payload(form)["body"]
        assert "Submitted At:" in body  # key present even if value is empty

    def test_body_sanitizes_html_in_message(self):
        form = _make_form(message="<b>Bold</b> message with enough chars")
        body = build_email_payload(form)["body"]
        assert "<b>" not in body
        assert "Bold" in body

    def test_body_neutralizes_script_injection(self):
        form = _make_form(
            fullName="<script>alert(1)</script>Alice",
            message="<script>steal(document.cookie)</script>legit message here",
        )
        body = build_email_payload(form)["body"]
        assert "<script>" not in body
        assert "alert" not in body
        assert "steal" not in body
        assert "legit message here" in body

    def test_body_sanitizes_all_string_fields(self):
        """HTML tags in every string field must be stripped from the body."""
        form = _make_form(
            fullName="<i>Name</i>",
            email="<i>email@x.com</i>",
            phone="<i>+1234</i>",
            country="<i>India</i>",
            companyName="<i>Corp</i>",
            inquiryType="<i>GENERAL</i>",
            productName="<i>Mango</i>",
            quantity="<i>100kg</i>",
            message="<i>message with enough characters here</i>",
        )
        body = build_email_payload(form)["body"]
        assert "<i>" not in body
        assert "</i>" not in body

    def test_body_fields_on_separate_lines(self):
        form = _make_form()
        body = build_email_payload(form)["body"]
        lines = body.splitlines()
        # Each field label should appear on its own line
        labels = ["Name:", "Email:", "Phone:", "Country:", "Company:",
                  "Inquiry Type:", "Product:", "Quantity:", "Message:", "Submitted At:"]
        for label in labels:
            assert any(line.startswith(label) for line in lines), (
                f"Expected a line starting with '{label}'"
            )


# ---------------------------------------------------------------------------
# build_email_payload() — reply_to tests
# ---------------------------------------------------------------------------

class TestBuildEmailPayloadReplyTo:
    def test_reply_to_equals_form_email(self):
        form = _make_form(email="buyer@trade.ae")
        payload = build_email_payload(form)
        assert payload["reply_to"] == "buyer@trade.ae"

    def test_reply_to_is_raw_email_not_sanitized(self):
        """reply_to is used as a mail header, not body text — it should be
        the original email value from the form."""
        form = _make_form(email="user@domain.com")
        payload = build_email_payload(form)
        assert payload["reply_to"] == form.email


# ---------------------------------------------------------------------------
# build_email_payload() — return structure tests
# ---------------------------------------------------------------------------

class TestBuildEmailPayloadStructure:
    def test_returns_dict(self):
        form = _make_form()
        payload = build_email_payload(form)
        assert isinstance(payload, dict)

    def test_has_required_keys(self):
        form = _make_form()
        payload = build_email_payload(form)
        assert "subject" in payload
        assert "body" in payload
        assert "reply_to" in payload

    def test_subject_is_string(self):
        form = _make_form()
        assert isinstance(build_email_payload(form)["subject"], str)

    def test_body_is_string(self):
        form = _make_form()
        assert isinstance(build_email_payload(form)["body"], str)

    def test_reply_to_is_string(self):
        form = _make_form()
        assert isinstance(build_email_payload(form)["reply_to"], str)

    def test_optional_fields_empty_strings(self):
        """Optional fields default to empty string — body should still include
        their labels without raising errors."""
        form = InquiryFormData(
            fullName="Min User",
            email="min@example.com",
            country="India",
            inquiryType="GENERAL",
            message="Short enough message here.",
        )
        payload = build_email_payload(form)
        assert "Phone:" in payload["body"]
        assert "Company:" in payload["body"]
        assert "Product:" in payload["body"]
        assert "Quantity:" in payload["body"]
