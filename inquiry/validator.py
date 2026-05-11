"""
Inquiry form validation for TAMILARASU ENTERPRISES website.

Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
"""

from __future__ import annotations

from models.inquiry import InquiryFormData, InquiryType, ValidationResult
from utils.validation import is_valid_email

# Field length constraints
_FULL_NAME_MIN = 2
_FULL_NAME_MAX = 100
_MESSAGE_MIN = 10
_MESSAGE_MAX = 1000

# Valid inquiry type values
_VALID_INQUIRY_TYPES = {member.value for member in InquiryType}


def validate_inquiry_form(form_data: InquiryFormData) -> ValidationResult:
    """
    Validate all required fields of an inquiry form submission.

    Validation rules:
        fullName    – required, 2–100 characters (Req 8.1, 8.2)
        email       – required, must pass is_valid_email() (Req 8.3)
        country     – required, non-empty (Req 8.4)
        inquiryType – must be one of InquiryType enum values (Req 8.5)
        message     – required, 10–1000 characters (Req 8.6, 8.7)

    The function does NOT mutate *form_data* (Req 8.8).

    Args:
        form_data: The submitted inquiry form data to validate.

    Returns:
        ``ValidationResult(is_valid=True, errors={})`` when all fields pass.
        ``ValidationResult(is_valid=False, errors={field: message})`` when any
        field fails, where *errors* maps each failing field name to a
        human-readable error message.
    """
    errors: dict[str, str] = {}

    # --- fullName (Req 8.1, 8.2) ---
    full_name = form_data.fullName
    if not full_name or not full_name.strip():
        errors["fullName"] = "Full name is required."
    elif len(full_name) < _FULL_NAME_MIN:
        errors["fullName"] = (
            f"Full name must be at least {_FULL_NAME_MIN} characters."
        )
    elif len(full_name) > _FULL_NAME_MAX:
        errors["fullName"] = (
            f"Full name must not exceed {_FULL_NAME_MAX} characters."
        )

    # --- email (Req 8.3) ---
    if not form_data.email or not form_data.email.strip():
        errors["email"] = "Email address is required."
    elif not is_valid_email(form_data.email):
        errors["email"] = "Please enter a valid email address."

    # --- country (Req 8.4) ---
    if not form_data.country or not form_data.country.strip():
        errors["country"] = "Country is required."

    # --- inquiryType (Req 8.5) ---
    if form_data.inquiryType not in _VALID_INQUIRY_TYPES:
        errors["inquiryType"] = (
            "Inquiry type must be one of: "
            + ", ".join(sorted(_VALID_INQUIRY_TYPES))
            + "."
        )

    # --- message (Req 8.6, 8.7) ---
    message = form_data.message
    if not message or not message.strip():
        errors["message"] = "Message is required."
    elif len(message) < _MESSAGE_MIN:
        errors["message"] = (
            f"Message must be at least {_MESSAGE_MIN} characters."
        )
    elif len(message) > _MESSAGE_MAX:
        errors["message"] = (
            f"Message must not exceed {_MESSAGE_MAX} characters."
        )

    if errors:
        return ValidationResult(is_valid=False, errors=errors)
    return ValidationResult(is_valid=True, errors={})
