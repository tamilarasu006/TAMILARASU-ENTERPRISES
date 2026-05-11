"""
Unit tests for submit_inquiry() in inquiry/submission.py.

Requirements covered: 7.2, 7.3, 7.4, 7.5
"""

from __future__ import annotations

from datetime import datetime
from unittest.mock import patch

import pytest

from models.inquiry import InquiryFormData, SubmissionResult
from inquiry.submission import submit_inquiry


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_form(**overrides) -> InquiryFormData:
    """Return a fully valid InquiryFormData instance, with optional overrides."""
    defaults = dict(
        fullName="Arjun Kumar",
        email="arjun@example.com",
        country="India",
        inquiryType="GENERAL",
        message="I would like to know more about your export services.",
    )
    defaults.update(overrides)
    return InquiryFormData(**defaults)


# ---------------------------------------------------------------------------
# 1. Valid form → success=True, correct message, submitted_at is set
# ---------------------------------------------------------------------------

class TestValidFormSubmission:
    def test_returns_success_true(self):
        form = _valid_form()
        with patch("inquiry.submission.send_email", return_value=True):
            result = submit_inquiry(form)
        assert result.success is True

    def test_returns_correct_success_message(self):
        form = _valid_form()
        with patch("inquiry.submission.send_email", return_value=True):
            result = submit_inquiry(form)
        assert result.message == (
            "Your inquiry has been sent. We will contact you within 24 hours."
        )

    def test_submitted_at_is_set_on_success(self):
        form = _valid_form()
        assert form.submitted_at is None  # not set before submission
        with patch("inquiry.submission.send_email", return_value=True):
            submit_inquiry(form)
        assert isinstance(form.submitted_at, datetime)

    def test_no_errors_on_success(self):
        form = _valid_form()
        with patch("inquiry.submission.send_email", return_value=True):
            result = submit_inquiry(form)
        assert result.errors == {}


# ---------------------------------------------------------------------------
# 2. Invalid form → success=False, errors populated, submitted_at NOT set
# ---------------------------------------------------------------------------

class TestInvalidFormSubmission:
    def test_returns_success_false_for_invalid_form(self):
        form = _valid_form(fullName="")  # empty name → validation error
        with patch("inquiry.submission.send_email", return_value=True) as mock_send:
            result = submit_inquiry(form)
        assert result.success is False

    def test_errors_populated_for_invalid_form(self):
        form = _valid_form(fullName="", email="not-an-email")
        with patch("inquiry.submission.send_email", return_value=True):
            result = submit_inquiry(form)
        assert "fullName" in result.errors
        assert "email" in result.errors

    def test_submitted_at_not_set_on_validation_failure(self):
        form = _valid_form(message="short")  # too short → validation error
        with patch("inquiry.submission.send_email", return_value=True):
            submit_inquiry(form)
        assert form.submitted_at is None

    def test_email_service_not_called_on_validation_failure(self):
        form = _valid_form(country="")  # missing country → validation error
        with patch("inquiry.submission.send_email", return_value=True) as mock_send:
            submit_inquiry(form)
        mock_send.assert_not_called()


# ---------------------------------------------------------------------------
# 3. Email service failure → success=False, submitted_at IS set
# ---------------------------------------------------------------------------

class TestEmailServiceFailure:
    def test_returns_success_false_when_email_fails(self):
        form = _valid_form()
        with patch("inquiry.submission.send_email", return_value=False):
            result = submit_inquiry(form)
        assert result.success is False

    def test_error_message_when_email_fails(self):
        form = _valid_form()
        with patch("inquiry.submission.send_email", return_value=False):
            result = submit_inquiry(form)
        assert result.message == "Failed to send inquiry. Please try again."

    def test_submitted_at_is_set_even_when_email_fails(self):
        """Validation passed, so submitted_at must be stamped before email attempt."""
        form = _valid_form()
        with patch("inquiry.submission.send_email", return_value=False):
            submit_inquiry(form)
        assert isinstance(form.submitted_at, datetime)


# ---------------------------------------------------------------------------
# 4. submitted_at is set ONLY after validation passes
# ---------------------------------------------------------------------------

class TestSubmittedAtTiming:
    def test_submitted_at_set_after_validation_not_before(self):
        """
        submitted_at must be None before the call and a datetime after a
        successful submission.
        """
        form = _valid_form()
        assert form.submitted_at is None
        with patch("inquiry.submission.send_email", return_value=True):
            submit_inquiry(form)
        assert form.submitted_at is not None

    def test_submitted_at_not_set_when_validation_fails(self):
        form = _valid_form(inquiryType="INVALID_TYPE")
        with patch("inquiry.submission.send_email", return_value=True):
            submit_inquiry(form)
        assert form.submitted_at is None


# ---------------------------------------------------------------------------
# 5. Exception from email service is caught and returns failure
# ---------------------------------------------------------------------------

class TestEmailServiceException:
    def test_exception_returns_success_false(self):
        form = _valid_form()
        with patch(
            "inquiry.submission.send_email",
            side_effect=Exception("Network error"),
        ):
            result = submit_inquiry(form)
        assert result.success is False

    def test_exception_returns_correct_message(self):
        form = _valid_form()
        with patch(
            "inquiry.submission.send_email",
            side_effect=RuntimeError("Timeout"),
        ):
            result = submit_inquiry(form)
        assert result.message == "Failed to send inquiry. Please try again."

    def test_submitted_at_set_before_exception(self):
        """
        submitted_at is stamped before the email call, so it should be set
        even when the email service raises.
        """
        form = _valid_form()
        with patch(
            "inquiry.submission.send_email",
            side_effect=ConnectionError("Unreachable"),
        ):
            submit_inquiry(form)
        assert isinstance(form.submitted_at, datetime)
