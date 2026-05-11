"""
Inquiry form data models for TAMILARASU ENTERPRISES website.

Requirements: 7.1, 8.1–8.8
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class InquiryType(str, Enum):
    """Valid inquiry type values for the contact/inquiry form."""
    PRODUCT_INQUIRY = "PRODUCT_INQUIRY"
    EXPORT_REQUEST = "EXPORT_REQUEST"
    IMPORT_REQUEST = "IMPORT_REQUEST"
    GENERAL = "GENERAL"


@dataclass
class InquiryFormData:
    """
    Holds all data submitted through the TAMILARASU ENTERPRISES inquiry form.

    Required fields:
        fullName     – visitor's full name (2–100 characters)
        email        – valid email address
        country      – visitor's country (non-empty)
        inquiryType  – one of InquiryType enum values
        message      – inquiry message body (10–1000 characters)

    Optional fields:
        phone        – international phone number
        companyName  – visitor's company name
        productName  – product of interest (pre-filled from catalog)
        quantity     – requested quantity
        submitted_at – timestamp set automatically on successful submission
    """

    # Required fields
    fullName: str
    email: str
    country: str
    inquiryType: str  # stored as string; validated against InquiryType enum
    message: str

    # Optional fields
    phone: str = ""
    companyName: str = ""
    productName: str = ""
    quantity: str = ""
    submitted_at: Optional[datetime] = field(default=None)


@dataclass
class ValidationResult:
    """
    Result returned by form validation.

    Attributes:
        is_valid – True when all required fields pass their validation rules
        errors   – map of {field_name: error_message}; empty when is_valid is True
    """

    is_valid: bool
    errors: dict[str, str] = field(default_factory=dict)


@dataclass
class SubmissionResult:
    """
    Result returned after an inquiry form submission attempt.

    Attributes:
        success – True when the inquiry was validated and the email was dispatched
        message – human-readable status message shown to the visitor
        errors  – optional map of field-specific validation errors (populated on
                  validation failure so the form can display inline messages)
    """

    success: bool
    message: str
    errors: dict[str, str] = field(default_factory=dict)
