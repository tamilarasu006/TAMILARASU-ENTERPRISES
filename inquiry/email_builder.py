"""
Email payload builder for TAMILARASU ENTERPRISES inquiry form.

Constructs the subject and body strings for inquiry notification emails,
sanitizing all user-supplied string fields before inclusion.

Requirements: 9.2
"""

from __future__ import annotations

from models.inquiry import InquiryFormData
from utils.sanitize import sanitize_input


def build_email_payload(form_data: InquiryFormData) -> dict:
    """
    Build an email payload dict from validated inquiry form data.

    All string fields are sanitized via ``sanitize_input()`` before being
    included in the email body, preventing HTML/script injection in the
    outgoing notification email.

    Args:
        form_data: A populated ``InquiryFormData`` instance.  The
                   ``submitted_at`` field may be ``None`` if the caller has
                   not yet stamped it; it will be rendered as an empty string
                   in that case.

    Returns:
        A dict with the following keys:

        - ``subject`` (str): ``"New Inquiry: {inquiryType} from {fullName}"``
        - ``body``    (str): Multi-line plain-text body with all form fields.
        - ``reply_to``(str): The submitter's email address (unsanitized, used
                             as a mail header value rather than body content).

    Example::

        >>> from models.inquiry import InquiryFormData
        >>> data = InquiryFormData(
        ...     fullName="Alice",
        ...     email="alice@example.com",
        ...     country="India",
        ...     inquiryType="GENERAL",
        ...     message="Hello there",
        ... )
        >>> payload = build_email_payload(data)
        >>> payload["subject"]
        'New Inquiry: GENERAL from Alice'
        >>> "Name: Alice" in payload["body"]
        True
        >>> payload["reply_to"]
        'alice@example.com'
    """
    # Sanitize all string fields that will appear in the body.
    safe_full_name = sanitize_input(form_data.fullName)
    safe_email = sanitize_input(form_data.email)
    safe_phone = sanitize_input(form_data.phone)
    safe_country = sanitize_input(form_data.country)
    safe_company = sanitize_input(form_data.companyName)
    safe_inquiry_type = sanitize_input(form_data.inquiryType)
    safe_product = sanitize_input(form_data.productName)
    safe_quantity = sanitize_input(form_data.quantity)
    safe_message = sanitize_input(form_data.message)

    # submitted_at is a datetime (or None), not user-supplied text — render
    # it directly without HTML-escaping.
    submitted_at_str = str(form_data.submitted_at) if form_data.submitted_at is not None else ""

    subject = f"New Inquiry: {safe_inquiry_type} from {safe_full_name}"

    body_lines = [
        f"Name: {safe_full_name}",
        f"Email: {safe_email}",
        f"Phone: {safe_phone}",
        f"Country: {safe_country}",
        f"Company: {safe_company}",
        f"Inquiry Type: {safe_inquiry_type}",
        f"Product: {safe_product}",
        f"Quantity: {safe_quantity}",
        f"Message: {safe_message}",
        f"Submitted At: {submitted_at_str}",
    ]
    body = "\n".join(body_lines)

    return {
        "subject": subject,
        "body": body,
        "reply_to": form_data.email,
    }
