"""
Email sending service for TAMILARASU ENTERPRISES inquiry form.

Sends the email payload to Formspree via an HTTP POST request.
The Formspree endpoint URL is read from the ``FORMSPREE_ENDPOINT``
environment variable (defaults to an empty string when not set).

Requirements: 7.4
"""

from __future__ import annotations

import json
import os
import urllib.request


def send_email(payload: dict) -> bool:
    """
    Send an email payload to the configured Formspree endpoint.

    Makes an HTTP POST request with the payload serialised as JSON.
    Returns ``True`` when the service responds with a 2xx status code,
    ``False`` otherwise (including when the endpoint URL is not configured).

    Args:
        payload: A dict containing at minimum ``subject``, ``body``, and
                 ``reply_to`` keys, as produced by ``build_email_payload()``.

    Returns:
        ``True`` on success, ``False`` on failure.
    """
    endpoint = os.environ.get("FORMSPREE_ENDPOINT", "")
    if not endpoint:
        return False

    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(request) as response:
        return 200 <= response.status < 300
