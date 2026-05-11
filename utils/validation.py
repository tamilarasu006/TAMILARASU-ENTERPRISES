"""
Input validation utilities for TAMILARASU ENTERPRISES website.

Requirements: 8.3
"""

from __future__ import annotations

import re

# RFC 5322-compatible email regex.
#
# Breakdown:
#   Local part  – one or more characters from the allowed set (letters, digits,
#                 and the special characters !#$%&'*+/=?^_`{|}~.-), with the
#                 constraint that dots may not appear at the start, end, or
#                 consecutively.
#   @           – exactly one at-sign
#   Domain part – one or more dot-separated labels, each consisting of letters,
#                 digits, or hyphens (hyphens not at start/end of a label).
#
# The pattern enforces:
#   - Non-empty local part
#   - Exactly one @ symbol
#   - Non-empty domain part with at least one dot-separated label
#
# Note: full RFC 5322 allows quoted strings and comments; this regex covers the
# vast majority of real-world addresses while remaining readable and testable.
_EMAIL_PATTERN = re.compile(
    r"^"
    r"[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]"          # first char of local part
    r"(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]*"      # rest of local part (may include dots)
    r"[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-])?"         # last char of local part (no trailing dot)
    r"@"                                          # exactly one @
    r"(?:[a-zA-Z0-9]"                            # first char of each domain label
    r"(?:[a-zA-Z0-9-]*[a-zA-Z0-9])?"            # rest of domain label (no trailing hyphen)
    r"\.)+"                                       # dot separator (at least one label + dot)
    r"[a-zA-Z]{2,}"                              # top-level domain (at least 2 letters)
    r"$",
    re.ASCII,
)


def is_valid_email(email: str) -> bool:
    """
    Return True if *email* is a structurally valid email address.

    Validation rules (Requirement 8.3):
    - Must be a non-empty string.
    - Must contain exactly one ``@`` symbol.
    - The local part (before ``@``) must be non-empty.
    - The domain part (after ``@``) must be non-empty and contain at least one
      dot-separated label followed by a top-level domain of two or more letters.

    Args:
        email: The string to validate.

    Returns:
        ``True`` if the email matches the expected format, ``False`` otherwise.

    Examples:
        >>> is_valid_email("user@example.com")
        True
        >>> is_valid_email("invalid-email")
        False
        >>> is_valid_email("")
        False
        >>> is_valid_email("two@@signs.com")
        False
    """
    if not isinstance(email, str) or not email:
        return False

    # Quick structural check: exactly one @ with non-empty parts on both sides
    at_count = email.count("@")
    if at_count != 1:
        return False

    local, domain = email.split("@", 1)
    if not local or not domain:
        return False

    return bool(_EMAIL_PATTERN.match(email))
