"""
Inquiry form submission handler for TAMILARASU ENTERPRISES website.

Orchestrates validation, timestamp assignment, email dispatch, and result
reporting for the inquiry contact form.

Requirements: 7.2, 7.3, 7.4, 7.5
"""

from __future__ import annotations

from datetime import datetime, timezone

from models.inquiry import InquiryFormData, SubmissionResult
from inquiry.validator import validate_inquiry_form
from inquiry.email_builder import build_email_payload
from inquiry.email_service import send_email


def submit_inquiry(form_data: InquiryFormData) -> SubmissionResult:
    """
    Process an inquiry form submission end-to-end.

    Steps:
        1. Validate *form_data* via ``validate_inquiry_form()``.
           On failure, return a ``SubmissionResult`` with ``success=False``
           and the field-level ``errors`` dict populated (Req 7.2).
        2. Stamp ``form_data.submitted_at`` with the current UTC datetime
           **only after** validation passes (Req 7.3).
        3. Build the email payload and dispatch it via ``send_email()``.
           On failure (or exception), return ``SubmissionResult(success=False,
           message="Failed to send inquiry. Please try again.")`` (Req 7.4).
        4. On full success return ``SubmissionResult(success=True,
           message="Your inquiry has been sent. We will contact you within
           24 hours.")`` (Req 7.5).

    Args:
        form_data: The inquiry form data submitted by the visitor.

    Returns:
        A ``SubmissionResult`` describing the outcome.
    """
    # Step 1 – validate (Req 7.2)
    validation_result = validate_inquiry_form(form_data)
    if not validation_result.is_valid:
        return SubmissionResult(
            success=False,
            message="Validation failed. Please correct the errors and try again.",
            errors=validation_result.errors,
        )

    # Step 2 – stamp submitted_at AFTER validation (Req 7.3)
    form_data.submitted_at = datetime.now(timezone.utc)

    # Step 3 – build payload and send email (Req 7.4)
    try:
        email_payload = build_email_payload(form_data)
        sent = send_email(email_payload)
    except Exception:
        return SubmissionResult(
            success=False,
            message="Failed to send inquiry. Please try again.",
        )

    if not sent:
        return SubmissionResult(
            success=False,
            message="Failed to send inquiry. Please try again.",
        )

    # Step 4 – success (Req 7.5)
    return SubmissionResult(
        success=True,
        message="Your inquiry has been sent. We will contact you within 24 hours.",
    )
