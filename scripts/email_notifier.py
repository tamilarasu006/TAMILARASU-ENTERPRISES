"""Reusable email sender with retry logic (up to 3 attempts, exponential backoff)."""
import smtplib
import time
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = ""  # set via env SMTP_USER
SMTP_PASS = ""  # set via env SMTP_PASS


def send_email(to_addresses, subject, body_html, retries=3):
    """
    Send an HTML email with retry logic.

    Args:
        to_addresses: str or list of str — recipient email address(es)
        subject: str — email subject
        body_html: str — HTML body content
        retries: int — number of attempts (default 3)

    Returns:
        True if email was sent successfully, False otherwise
    """
    user = os.environ.get("SMTP_USER", SMTP_USER)
    password = os.environ.get("SMTP_PASS", SMTP_PASS)

    if not user:
        logging.error("SMTP_USER environment variable is not set")
        return False

    if isinstance(to_addresses, str):
        to_list = [to_addresses]
    else:
        to_list = list(to_addresses)

    for attempt in range(1, retries + 1):
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = user
            msg["To"] = ", ".join(to_list)
            msg.attach(MIMEText(body_html, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.sendmail(user, to_list, msg.as_string())

            logging.info("Email sent to %s (subject: %s)", to_list, subject)
            return True

        except smtplib.SMTPAuthenticationError as e:
            logging.error("SMTP authentication failed: %s", e)
            return False  # No point retrying auth failures

        except Exception as e:
            logging.warning("Email attempt %d/%d failed: %s", attempt, retries, e)
            if attempt < retries:
                backoff = 2 ** attempt
                logging.info("Retrying in %d seconds...", backoff)
                time.sleep(backoff)

    logging.error("All %d email attempts failed for %s", retries, to_list)
    return False


if __name__ == "__main__":
    # Quick smoke test
    test_result = send_email(
        to_addresses=os.environ.get("TEST_EMAIL", "test@example.com"),
        subject="Test Email from TAMILARASU ENTERPRISES",
        body_html="<h1>Test</h1><p>This is a test email.</p>"
    )
    print("Email sent:", test_result)
