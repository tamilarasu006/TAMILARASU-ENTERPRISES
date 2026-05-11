"""
Input sanitization utilities for TAMILARASU ENTERPRISES website.

Strips or escapes HTML tags and script content from user-supplied strings
before they are included in email bodies or other output contexts.

Requirements: 9.2
"""

from __future__ import annotations

import html
import re

# Matches <script ...>...</script> blocks (case-insensitive, non-greedy).
_SCRIPT_TAG_PATTERN = re.compile(
    r"<script[^>]*>.*?</script>",
    re.IGNORECASE | re.DOTALL,
)

# Matches any remaining HTML/XML tag after script blocks have been removed.
_HTML_TAG_PATTERN = re.compile(r"<[^>]+>")


def sanitize_input(value: str) -> str:
    """
    Sanitize a user-supplied string for safe inclusion in email bodies.

    Processing steps (applied in order):
    1. Remove ``<script>…</script>`` blocks (including their content).
    2. Strip all remaining HTML/XML tags.
    3. HTML-escape the result so that any residual special characters
       (``<``, ``>``, ``&``, ``"``, ``'``) are converted to their safe
       HTML entity equivalents.

    Args:
        value: The raw string to sanitize.  Non-string values are coerced to
               ``str`` before processing.

    Returns:
        A sanitized string safe for inclusion in plain-text email bodies.

    Examples:
        >>> sanitize_input("<b>Hello</b>")
        '&lt;b&gt;Hello&lt;/b&gt;'
        >>> sanitize_input("<script>alert('xss')</script>safe text")
        'safe text'
        >>> sanitize_input("Normal text")
        'Normal text'
        >>> sanitize_input("")
        ''
    """
    if not isinstance(value, str):
        value = str(value)

    # Step 1: Remove script blocks (content included).
    value = _SCRIPT_TAG_PATTERN.sub("", value)

    # Step 2: Strip remaining HTML tags (keep inner text).
    value = _HTML_TAG_PATTERN.sub("", value)

    # Step 3: Escape any residual special characters.
    value = html.escape(value, quote=True)

    return value
