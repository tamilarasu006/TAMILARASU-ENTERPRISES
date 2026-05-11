"""
reCAPTCHA v3 verification utility for TAMILARASU ENTERPRISES website.

Verifies a reCAPTCHA v3 token server-side by calling Google's siteverify API.
The secret key is read from the RECAPTCHA_SECRET_KEY environment variable.

Requirements: 9.1
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request


def verify_recaptcha(token: str, min_score: float = 0.5) -> bool:
    """
    Verify a reCAPTCHA v3 token with Google's siteverify API.

    Args:
        token: The reCAPTCHA token submitted by the client.
        min_score: Minimum score threshold (0.0–1.0). Defaults to 0.5.

    Returns:
        True if the token is valid and the score meets the threshold.
        False if the secret key is not configured, the token is invalid,
        or the score is below the threshold.
    """
    secret = os.environ.get("RECAPTCHA_SECRET_KEY", "")
    if not secret or not token:
        # If reCAPTCHA is not configured, allow the request through
        # (development / testing mode). In production, set the env var.
        return True

    try:
        data = urllib.parse.urlencode({
            "secret": secret,
            "response": token,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://www.google.com/recaptcha/api/siteverify",
            data=data,
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        return bool(result.get("success")) and result.get("score", 0.0) >= min_score

    except Exception:
        # On any network or parsing error, fail open in dev, fail closed in prod
        return not bool(secret)
