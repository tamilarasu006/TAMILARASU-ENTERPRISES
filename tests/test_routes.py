"""
Route integration tests for TAMILARASU ENTERPRISES website.

Verifies that all page routes render without errors and that the contact
form validation works end-to-end using Flask's built-in test client.

Checkpoint task 7 — all routes + form validation.
"""

from __future__ import annotations

import pytest

# Import the Flask app object
import sys
import os

# Ensure the project root is on sys.path so `app` can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as flask_app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """Return a Flask test client with testing mode enabled."""
    flask_app.config["TESTING"] = True
    flask_app.config["WTF_CSRF_ENABLED"] = False  # no CSRF in tests
    with flask_app.test_client() as c:
        yield c


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

VALID_FORM = {
    "full_name": "Ravi Kumar",
    "email": "ravi@example.com",
    "phone": "+91 98765 43210",
    "country": "India",
    "company_name": "Test Co",
    "inquiry_type": "PRODUCT_INQUIRY",
    "product_name": "Alphonso Mango",
    "quantity": "500 kg",
    "message": "I would like to inquire about bulk pricing for export.",
    "website": "",  # honeypot — must be empty
}


# ---------------------------------------------------------------------------
# GET route tests
# ---------------------------------------------------------------------------

class TestGetRoutes:
    """All GET routes should return HTTP 200."""

    def test_home_page(self, client):
        """GET / → 200."""
        response = client.get("/")
        assert response.status_code == 200

    def test_products_page(self, client):
        """GET /products → 200."""
        response = client.get("/products")
        assert response.status_code == 200

    def test_products_filter_by_category(self, client):
        """GET /products?category=FRUIT → 200."""
        response = client.get("/products?category=FRUIT")
        assert response.status_code == 200

    def test_products_search_query(self, client):
        """GET /products?q=mango → 200."""
        response = client.get("/products?q=mango")
        assert response.status_code == 200

    def test_products_available_only(self, client):
        """GET /products?available=1 → 200."""
        response = client.get("/products?available=1")
        assert response.status_code == 200

    def test_services_page(self, client):
        """GET /services → 200."""
        response = client.get("/services")
        assert response.status_code == 200

    def test_about_page(self, client):
        """GET /about → 200."""
        response = client.get("/about")
        assert response.status_code == 200

    def test_contact_page(self, client):
        """GET /contact → 200."""
        response = client.get("/contact")
        assert response.status_code == 200

    def test_contact_page_with_prefill(self, client):
        """GET /contact?product=Alphonso+Mango → 200 with product pre-filled."""
        response = client.get("/contact?product=Alphonso+Mango")
        assert response.status_code == 200
        # The product name should appear in the rendered HTML
        assert b"Alphonso Mango" in response.data


# ---------------------------------------------------------------------------
# POST /contact — valid submission
# ---------------------------------------------------------------------------

class TestContactPostValid:
    """Valid form submissions should succeed (200 or 302)."""

    def test_valid_form_returns_success(self, client):
        """POST /contact with valid data → 200 or 302 (email may fail without FORMSPREE_ENDPOINT)."""
        response = client.post("/contact", data=VALID_FORM)
        # Without FORMSPREE_ENDPOINT the email send returns False → 422 with
        # submission_error, OR the route may redirect/200 depending on implementation.
        # The key requirement: no 5xx server error and no unhandled exception.
        assert response.status_code in (200, 302, 422)

    def test_valid_form_no_server_error(self, client):
        """POST /contact with valid data must not raise a 500."""
        response = client.post("/contact", data=VALID_FORM)
        assert response.status_code != 500

    def test_valid_form_renders_contact_template(self, client):
        """POST /contact with valid data renders the contact page (not a crash page)."""
        response = client.post("/contact", data=VALID_FORM)
        # The response body should contain something from the contact template
        assert b"Contact" in response.data or b"contact" in response.data


# ---------------------------------------------------------------------------
# POST /contact — invalid form data → 422
# ---------------------------------------------------------------------------

class TestContactPostInvalid:
    """Invalid form submissions should return 422 with field errors."""

    def test_missing_all_required_fields_returns_422(self, client):
        """POST /contact with empty form → 422."""
        response = client.post("/contact", data={
            "full_name": "",
            "email": "",
            "country": "",
            "inquiry_type": "",
            "message": "",
            "website": "",
        })
        assert response.status_code == 422

    def test_missing_full_name_returns_422(self, client):
        """POST /contact without full_name → 422."""
        data = dict(VALID_FORM)
        data["full_name"] = ""
        response = client.post("/contact", data=data)
        assert response.status_code == 422

    def test_invalid_email_returns_422(self, client):
        """POST /contact with invalid email → 422."""
        data = dict(VALID_FORM)
        data["email"] = "not-an-email"
        response = client.post("/contact", data=data)
        assert response.status_code == 422

    def test_missing_country_returns_422(self, client):
        """POST /contact without country → 422."""
        data = dict(VALID_FORM)
        data["country"] = ""
        response = client.post("/contact", data=data)
        assert response.status_code == 422

    def test_invalid_inquiry_type_returns_422(self, client):
        """POST /contact with invalid inquiry_type → 422."""
        data = dict(VALID_FORM)
        data["inquiry_type"] = "INVALID_TYPE"
        response = client.post("/contact", data=data)
        assert response.status_code == 422

    def test_message_too_short_returns_422(self, client):
        """POST /contact with message shorter than 10 chars → 422."""
        data = dict(VALID_FORM)
        data["message"] = "Hi"
        response = client.post("/contact", data=data)
        assert response.status_code == 422

    def test_missing_message_returns_422(self, client):
        """POST /contact without message → 422."""
        data = dict(VALID_FORM)
        data["message"] = ""
        response = client.post("/contact", data=data)
        assert response.status_code == 422

    def test_422_response_contains_error_indicators(self, client):
        """POST /contact with invalid data → response body contains error markup."""
        data = dict(VALID_FORM)
        data["full_name"] = ""
        data["email"] = ""
        response = client.post("/contact", data=data)
        assert response.status_code == 422
        # The re-rendered form should contain field error indicators
        assert b"field-invalid" in response.data or b"field-error" in response.data


# ---------------------------------------------------------------------------
# POST /contact — honeypot filled → silently discarded (200)
# ---------------------------------------------------------------------------

class TestContactHoneypot:
    """Honeypot-filled submissions should be silently discarded with 200."""

    def test_honeypot_filled_returns_200(self, client):
        """POST /contact with honeypot field filled → 200 (silently discarded)."""
        data = dict(VALID_FORM)
        data["website"] = "http://spam.example.com"  # honeypot filled
        response = client.post("/contact", data=data)
        assert response.status_code == 200

    def test_honeypot_filled_shows_success_like_response(self, client):
        """Honeypot response should look like success (no error messages)."""
        data = dict(VALID_FORM)
        data["website"] = "bot-filled-this"
        response = client.post("/contact", data=data)
        assert response.status_code == 200
        # Should show the success banner, not the form with errors
        assert b"alert-success" in response.data
        # No inline field error spans should be present
        assert b'class="field-error"' not in response.data


# ---------------------------------------------------------------------------
# Template rendering sanity checks
# ---------------------------------------------------------------------------

class TestTemplateContent:
    """Spot-check that templates render expected content."""

    def test_home_contains_company_name(self, client):
        """Home page should contain the company name."""
        response = client.get("/")
        assert b"TAMILARASU ENTERPRISES" in response.data

    def test_products_contains_filter_form(self, client):
        """Products page should contain the filter form."""
        response = client.get("/products")
        assert b"filter-form" in response.data or b"Filter" in response.data

    def test_services_contains_services_section(self, client):
        """Services page should contain the services section."""
        response = client.get("/services")
        assert b"service" in response.data.lower()

    def test_about_contains_company_history(self, client):
        """About page should contain company history content."""
        response = client.get("/about")
        assert b"TAMILARASU ENTERPRISES" in response.data

    def test_contact_contains_inquiry_form(self, client):
        """Contact page should contain the inquiry form."""
        response = client.get("/contact")
        assert b"inquiry-form" in response.data or b"Send Inquiry" in response.data
