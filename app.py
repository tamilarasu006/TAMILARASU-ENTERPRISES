"""
Flask application entry point for TAMILARASU ENTERPRISES website.

Loads product and site-configuration data at startup, registers all page
routes, injects shared template context (current_year, site_config), and
applies hardened Content Security Policy and security headers via an
after_request hook (task 9.1).

Security notes (Req 9.3, 9.4):
- The company contact email is never embedded in client-side JS or static
  HTML attributes; it is injected server-side via Flask template context
  (SITE_CONFIG.contactEmail) and rendered only in the HTML body by Jinja2.
  No JavaScript variable or data attribute exposes the address.
- CSP restricts script execution to 'self' plus the reCAPTCHA origin;
  'unsafe-inline' is intentionally absent from script-src.
- HSTS (Strict-Transport-Security) enforces HTTPS for one year including
  subdomains once the site is deployed behind TLS.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash

from models.product import Product, FilterState
from models.site import SiteConfiguration
from inquiry.submission import submit_inquiry
from models.inquiry import InquiryFormData
from utils.recaptcha import verify_recaptcha
from auth.users import (
    get_user_by_email, create_user, verify_password,
    ensure_default_admin, STATUS_APPROVED, STATUS_PENDING,
    get_all_users, update_user_status, delete_user, ROLE_ADMIN,
)
from admin.products_store import (
    get_all as get_all_products_raw,
    get_by_id as get_product_by_id,
    create as create_product,
    update as update_product,
    delete as delete_product,
)
from admin.services_store import (
    get_all as get_all_services_raw,
    get_by_id as get_service_by_id,
    create as create_service,
    update as update_service,
    delete as delete_service,
)

# ── Application factory ────────────────────────────────────────────────────────

app = Flask(__name__)
# Secret key for session signing — override via SECRET_KEY env var in production
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")

# ── Load data at startup ───────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent

def _load_json(path: Path) -> object:
    """Read and parse a JSON file; return an empty structure on error."""
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


# Products
_raw_products = _load_json(BASE_DIR / "data" / "products.json") or []
PRODUCTS: list[Product] = []
for _entry in _raw_products:
    try:
        PRODUCTS.append(Product.from_dict(_entry))
    except (ValueError, KeyError):
        # Skip malformed entries (Req 14.3)
        pass

# Site configuration
_raw_config = _load_json(BASE_DIR / "data" / "site_config.json") or {}
SITE_CONFIG: SiteConfiguration = SiteConfiguration.from_dict(_raw_config)


def _load_services() -> list[dict]:
    """Load services from data/services.json; return empty list on error."""
    raw = _load_json(BASE_DIR / "data" / "services.json")
    if isinstance(raw, list):
        return raw
    return []


SERVICES: list[dict] = _load_services()

# About page data
ABOUT_DATA: dict = _load_json(BASE_DIR / "data" / "about.json") or {}

# ── Context processor ──────────────────────────────────────────────────────────

@app.context_processor
def inject_globals() -> dict:
    """Inject variables available in every template."""
    return {
        "current_year": datetime.now(timezone.utc).year,
        "site_config": SITE_CONFIG,
        # reCAPTCHA v3 site key (public key — safe to expose in HTML).
        # Defaults to empty string so templates render without errors in
        # dev/test environments where the key is not configured.
        "recaptcha_site_key": os.environ.get("RECAPTCHA_SITE_KEY", ""),
    }

# ── Content Security Policy and security headers (task 9.1) ───────────────────

@app.after_request
def add_security_headers(response):
    """
    Attach hardened security headers to every response (Req 9.3, 9.4).

    CSP policy:
    - default-src 'self'
    - script-src 'self' + Google reCAPTCHA origin only; NO 'unsafe-inline'
    - style-src 'self' 'unsafe-inline' + Google Fonts + Cloudflare CDN
      ('unsafe-inline' is retained for styles only — not scripts — because
      the templates use inline <style> blocks for page-specific CSS)
    - font-src 'self' + Google Fonts + Cloudflare CDN
    - img-src 'self' data: (data: URIs used for placeholder SVG fallbacks)
    - connect-src 'self' + Google reCAPTCHA (token verification XHR)
    - frame-src https://www.google.com (reCAPTCHA iframe challenge)
    - frame-ancestors 'none' (equivalent to X-Frame-Options: DENY)

    HSTS enforces HTTPS for one year including subdomains once the site is
    deployed behind TLS (Req 9.4).

    HTTP → HTTPS redirect:
    When running behind a reverse proxy (e.g. Heroku, Render, Nginx) the
    original protocol is forwarded in the X-Forwarded-Proto header.  If
    that header is present and equals "http" we issue a 301 redirect to
    the HTTPS equivalent of the same URL.
    """
    # ── HTTP → HTTPS redirect (Req 9.4) ──────────────────────────────────────
    forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
    if forwarded_proto == "http":
        https_url = request.url.replace("http://", "https://", 1)
        return redirect(https_url, code=301)

    # ── Content Security Policy (Req 9.4) ────────────────────────────────────
    csp = (
        "default-src 'self'; "
        # Scripts: self + reCAPTCHA only — no 'unsafe-inline'
        "script-src 'self' https://www.google.com/recaptcha/ "
        "https://www.gstatic.com/recaptcha/; "
        # Styles: unsafe-inline kept for inline <style> blocks; no scripts
        "style-src 'self' 'unsafe-inline' "
        "https://fonts.googleapis.com "
        "https://cdnjs.cloudflare.com; "
        "font-src 'self' "
        "https://fonts.gstatic.com "
        "https://cdnjs.cloudflare.com; "
        "img-src 'self' data:; "
        # connect-src: allow reCAPTCHA token verification calls
        "connect-src 'self' https://www.google.com/recaptcha/; "
        # frame-src: reCAPTCHA v3 may render a challenge iframe
        "frame-src https://www.google.com; "
        "frame-ancestors 'none';"
    )
    response.headers["Content-Security-Policy"] = csp

    # ── Additional security headers ───────────────────────────────────────────
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── Page routes ────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    """Home page — hero banner + featured products + service overview."""
    featured_ids = SITE_CONFIG.featuredProductIds
    product_map = {p.id: p for p in PRODUCTS}
    featured = [product_map[pid] for pid in featured_ids if pid in product_map]

    # Clamp to 3–6 featured products; if fewer than 3 available show all
    if len(featured) > 6:
        featured = featured[:6]

    return render_template(
        "home.html",
        active_page="home",
        featured_products=featured,
        products=PRODUCTS,
        services=SERVICES,
    )


@app.route("/products")
def products():
    """Product catalog page with filtering and search."""
    category = request.args.get("category", "ALL").upper()
    query = request.args.get("q", "")
    available_only = request.args.get("available", "").lower() in ("1", "true", "yes")
    page = max(1, int(request.args.get("page", 1)))

    filters = FilterState(
        selectedCategory=category,
        searchQuery=query,
        showAvailableOnly=available_only,
    )

    from catalog.filter import filter_products
    filtered = filter_products(PRODUCTS, filters)

    # Pagination (Req 3.8): ≤ 20 per page
    page_size = 20
    total = len(filtered)
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = min(page, total_pages)
    start = (page - 1) * page_size
    paginated = filtered[start: start + page_size]

    return render_template(
        "catalog.html",
        active_page="products",
        products=paginated,
        all_products=PRODUCTS,
        filters=filters,
        current_page=page,
        total_pages=total_pages,
        total_products=total,
        contact_email=SITE_CONFIG.contactEmail,
        contact_phone=SITE_CONFIG.contactPhone,
    )


@app.route("/services")
def services():
    """Services page."""
    services_data = _load_json(BASE_DIR / "data" / "services.json") or []
    return render_template(
        "services.html",
        active_page="services",
        services=services_data,
        contact_email=SITE_CONFIG.contactEmail,
    )


@app.route("/about")
def about():
    """About page — company history, mission, vision, values, destinations, certifications."""
    return render_template(
        "about.html",
        active_page="about",
        about=ABOUT_DATA,
    )


@app.route("/contact", methods=["GET"])
def contact():
    """Contact / inquiry form page (GET)."""
    prefill_product = request.args.get("product", "")
    return render_template(
        "contact.html",
        active_page="contact",
        prefill_product=prefill_product,
        form_errors={},
        form_data={},
        contact_email=SITE_CONFIG.contactEmail,
        whatsapp_number=SITE_CONFIG.whatsappNumber,
    )


@app.route("/contact", methods=["POST"])
def contact_submit():
    """Contact / inquiry form page (POST) — handles form submission."""
    # Honeypot check (Req 9.1): silently discard if honeypot field is filled
    if request.form.get("website", ""):
        # Return a success-like response without processing
        return render_template(
            "contact.html",
            active_page="contact",
            prefill_product=request.form.get("product_name", ""),
            form_errors={},
            form_data={},
            submission_success=True,
            contact_email=SITE_CONFIG.contactEmail,
            whatsapp_number=SITE_CONFIG.whatsappNumber,
        )

    # ── reCAPTCHA v3 verification (Req 9.1 / task 9.2) ───────────────────────
    # Skip verification when RECAPTCHA_SECRET_KEY is not configured so that
    # development and test environments work without reCAPTCHA credentials.
    recaptcha_secret = os.environ.get("RECAPTCHA_SECRET_KEY", "")
    if recaptcha_secret:
        token = request.form.get("g-recaptcha-response", "")
        if not verify_recaptcha(token):
            return render_template(
                "contact.html",
                active_page="contact",
                prefill_product=request.form.get("product_name", ""),
                form_errors={},
                form_data={},
                submission_success=False,
                submission_error=(
                    "Security check failed. Please refresh the page and try again."
                ),
                contact_email=SITE_CONFIG.contactEmail,
                whatsapp_number=SITE_CONFIG.whatsappNumber,
            ), 400


    form_data_dict = {
        "fullName": request.form.get("full_name", "").strip(),
        "email": request.form.get("email", "").strip(),
        "phone": request.form.get("phone", "").strip(),
        "country": request.form.get("country", "").strip(),
        "companyName": request.form.get("company_name", "").strip(),
        "inquiryType": request.form.get("inquiry_type", "").strip(),
        "productName": request.form.get("product_name", "").strip(),
        "quantity": request.form.get("quantity", "").strip(),
        "message": request.form.get("message", "").strip(),
    }

    form_obj = InquiryFormData(
        fullName=form_data_dict["fullName"],
        email=form_data_dict["email"],
        phone=form_data_dict["phone"],
        country=form_data_dict["country"],
        companyName=form_data_dict["companyName"],
        inquiryType=form_data_dict["inquiryType"],
        productName=form_data_dict["productName"],
        quantity=form_data_dict["quantity"],
        message=form_data_dict["message"],
    )

    result = submit_inquiry(form_obj)

    if result.success:
        return render_template(
            "contact.html",
            active_page="contact",
            prefill_product="",
            form_errors={},
            form_data={},
            submission_success=True,
            contact_email=SITE_CONFIG.contactEmail,
            whatsapp_number=SITE_CONFIG.whatsappNumber,
        )

    # Validation or email failure — re-render with errors and preserved values
    return render_template(
        "contact.html",
        active_page="contact",
        prefill_product=form_data_dict["productName"],
        form_errors=result.errors or {},
        form_data=form_data_dict,
        submission_success=False,
        submission_error=result.message if not result.errors else None,
        contact_email=SITE_CONFIG.contactEmail,
        whatsapp_number=SITE_CONFIG.whatsappNumber,
    ), 422


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.route("/register", methods=["GET"])
def register():
    """Registration page (GET)."""
    if session.get("user_id"):
        return redirect(url_for("home"))
    return render_template("register.html", active_page="register",
                           errors={}, form_data={}, error=None)


@app.route("/register", methods=["POST"])
def register_submit():
    """Registration form handler (POST)."""
    if session.get("user_id"):
        return redirect(url_for("home"))

    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    password = request.form.get("password", "")
    confirm = request.form.get("confirm_password", "")

    errors: dict[str, str] = {}
    form_data = {"name": name, "email": email}

    # Validation
    if not name:
        errors["name"] = "Full name is required."
    elif len(name) < 2:
        errors["name"] = "Name must be at least 2 characters."

    if not email:
        errors["email"] = "Email address is required."
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors["email"] = "Enter a valid email address."

    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."
    elif not any(c.isdigit() for c in password) or not any(c.isalpha() for c in password):
        errors["password"] = "Password must contain at least one letter and one number."

    if not confirm:
        errors["confirm_password"] = "Please confirm your password."
    elif password and confirm != password:
        errors["confirm_password"] = "Passwords do not match."

    if not errors and get_user_by_email(email):
        errors["email"] = "An account with this email already exists."

    if errors:
        return render_template("register.html", active_page="register",
                               errors=errors, form_data=form_data, error=None), 422

    create_user(name=name, email=email, password=password, role="user")
    # Auto-approve: immediately set status to approved so user can log in
    from auth.users import update_user_status
    new_user = get_user_by_email(email)
    if new_user:
        update_user_status(new_user["id"], STATUS_APPROVED)
    return redirect(url_for("login") + "?registered=1")


@app.route("/login", methods=["GET"])
def login():
    """Login page (GET)."""
    if session.get("user_id"):
        return redirect(url_for("home"))
    registered = request.args.get("registered") == "1"
    pending = request.args.get("pending") == "1"
    return render_template("login.html", active_page="login",
                           errors={}, form_data={}, error=None,
                           registered=registered, pending=pending)


@app.route("/login", methods=["POST"])
def login_submit():
    """Login form handler (POST)."""
    if session.get("user_id"):
        return redirect(url_for("home"))

    email = request.form.get("email", "").strip()
    password = request.form.get("password", "")
    form_data = {"email": email}
    errors: dict[str, str] = {}

    if not email:
        errors["email"] = "Email address is required."
    if not password:
        errors["password"] = "Password is required."

    if errors:
        return render_template("login.html", active_page="login",
                               errors=errors, form_data=form_data, error=None), 422

    user = get_user_by_email(email)

    if not user or not verify_password(user, password):
        return render_template("login.html", active_page="login",
                               errors={}, form_data=form_data,
                               error="Invalid email or password."), 401

    if user["status"] != STATUS_APPROVED:
        return render_template("login.html", active_page="login",
                               errors={}, form_data=form_data,
                               error="Your account has been suspended. Please contact support."), 403

    # Set session
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]
    session["user_role"] = user["role"]

    next_url = request.args.get("next", "")
    if next_url and next_url.startswith("/"):
        return redirect(next_url)
    return redirect(url_for("home"))


@app.route("/logout")
def logout():
    """Clear session and redirect to home."""
    session.clear()
    return redirect(url_for("home"))


# ── Admin helpers ─────────────────────────────────────────────────────────────

def _require_admin():
    """Return a redirect response if the current user is not an admin, else None."""
    if not session.get("user_id"):
        return redirect(url_for("login") + "?next=/admin")
    if session.get("user_role") != ROLE_ADMIN:
        return render_template("login.html", active_page="login",
                               errors={}, form_data={}, error="Admin access required.",
                               registered=False, pending=False), 403
    return None


def _parse_csv(value: str) -> list[str]:
    """Split a comma-separated string into a cleaned list."""
    return [v.strip() for v in value.split(",") if v.strip()]


# ── Admin routes ───────────────────────────────────────────────────────────────

@app.route("/admin")
def admin_dashboard():
    guard = _require_admin()
    if guard:
        return guard
    raw_products = get_all_products_raw()
    raw_services = get_all_services_raw()
    all_users = get_all_users()
    pending_count = sum(1 for u in all_users if u.get("status") == STATUS_PENDING)
    return render_template(
        "admin/dashboard.html",
        admin_page="dashboard",
        products=raw_products,
        services=raw_services,
        total_products=len(raw_products),
        available_products=sum(1 for p in raw_products if p.get("isAvailable")),
        total_services=len(raw_services),
        pending_users=pending_count,
    )


# ── Admin: Products ────────────────────────────────────────────────────────────

@app.route("/admin/products")
def admin_products():
    guard = _require_admin()
    if guard:
        return guard
    q = request.args.get("q", "").lower()
    products = get_all_products_raw()
    if q:
        products = [p for p in products
                    if q in p.get("name", "").lower() or q in p.get("id", "").lower()]
    return render_template("admin/products.html", admin_page="products",
                           products=products, q=q)


@app.route("/admin/products/new", methods=["GET"])
def admin_product_new():
    guard = _require_admin()
    if guard:
        return guard
    return render_template("admin/product_form.html", admin_page="products",
                           product=None, errors={}, form_data={})


@app.route("/admin/products/new", methods=["POST"])
def admin_product_create():
    guard = _require_admin()
    if guard:
        return guard
    form = request.form
    data = {
        "id": form.get("id", "").strip(),
        "name": form.get("name", "").strip(),
        "category": form.get("category", "").strip().upper(),
        "origin": form.get("origin", "").strip(),
        "minimumOrderQuantity": form.get("minimumOrderQuantity", "").strip(),
        "imageUrl": form.get("imageUrl", "").strip(),
        "description": form.get("description", "").strip(),
        "isAvailable": form.get("isAvailable") == "1",
        "season": form.get("season", "").strip(),
        "unit": form.get("unit", "").strip(),
        "certifications": _parse_csv(form.get("certifications", "")),
        "exportDestinations": _parse_csv(form.get("exportDestinations", "")),
        "packagingOptions": _parse_csv(form.get("packagingOptions", "")),
        "shelfLife": form.get("shelfLife", "").strip(),
        "tags": _parse_csv(form.get("tags", "")),
    }
    product, errors = create_product(data)
    if errors:
        form_data = {k: form.get(k, "") for k in form}
        form_data["isAvailable"] = "1" if data["isAvailable"] else ""
        return render_template("admin/product_form.html", admin_page="products",
                               product=None, errors=errors, form_data=form_data), 422
    # Reload PRODUCTS list so the public site reflects the change immediately
    global PRODUCTS
    PRODUCTS = [p for p in [_try_product(r) for r in get_all_products_raw()] if p]
    flash(f"Product '{product['name']}' created successfully.", "success")
    return redirect(url_for("admin_products"))


@app.route("/admin/products/<product_id>/edit", methods=["GET"])
def admin_product_edit(product_id):
    guard = _require_admin()
    if guard:
        return guard
    raw = get_product_by_id(product_id)
    if not raw:
        flash("Product not found.", "error")
        return redirect(url_for("admin_products"))
    from models.product import Product
    try:
        product = Product.from_dict(raw)
    except ValueError:
        product = None
    return render_template("admin/product_form.html", admin_page="products",
                           product=product or type("P", (), raw)(), errors={}, form_data={})


@app.route("/admin/products/<product_id>/edit", methods=["POST"])
def admin_product_update(product_id):
    guard = _require_admin()
    if guard:
        return guard
    form = request.form
    data = {
        "id": product_id,
        "name": form.get("name", "").strip(),
        "category": form.get("category", "").strip().upper(),
        "origin": form.get("origin", "").strip(),
        "minimumOrderQuantity": form.get("minimumOrderQuantity", "").strip(),
        "imageUrl": form.get("imageUrl", "").strip(),
        "description": form.get("description", "").strip(),
        "isAvailable": form.get("isAvailable") == "1",
        "season": form.get("season", "").strip(),
        "unit": form.get("unit", "").strip(),
        "certifications": _parse_csv(form.get("certifications", "")),
        "exportDestinations": _parse_csv(form.get("exportDestinations", "")),
        "packagingOptions": _parse_csv(form.get("packagingOptions", "")),
        "shelfLife": form.get("shelfLife", "").strip(),
        "tags": _parse_csv(form.get("tags", "")),
    }
    updated, errors = update_product(product_id, data)
    if errors:
        raw = get_product_by_id(product_id)
        from models.product import Product
        try:
            product_obj = Product.from_dict(raw) if raw else None
        except ValueError:
            product_obj = None
        form_data = {k: form.get(k, "") for k in form}
        form_data["isAvailable"] = "1" if data["isAvailable"] else ""
        return render_template("admin/product_form.html", admin_page="products",
                               product=product_obj, errors=errors, form_data=form_data), 422
    global PRODUCTS
    PRODUCTS = [p for p in [_try_product(r) for r in get_all_products_raw()] if p]
    flash(f"Product '{updated['name']}' updated successfully.", "success")
    return redirect(url_for("admin_products"))


@app.route("/admin/products/<product_id>/delete", methods=["POST"])
def admin_product_delete(product_id):
    guard = _require_admin()
    if guard:
        return guard
    raw = get_product_by_id(product_id)
    name = raw["name"] if raw else product_id
    if delete_product(product_id):
        global PRODUCTS
        PRODUCTS = [p for p in [_try_product(r) for r in get_all_products_raw()] if p]
        flash(f"Product '{name}' deleted.", "success")
    else:
        flash("Product not found.", "error")
    return redirect(url_for("admin_products"))


def _try_product(raw: dict):
    from models.product import Product
    try:
        return Product.from_dict(raw)
    except (ValueError, KeyError):
        return None


# ── Admin: Services ────────────────────────────────────────────────────────────

@app.route("/admin/services")
def admin_services():
    guard = _require_admin()
    if guard:
        return guard
    return render_template("admin/services.html", admin_page="services",
                           services=get_all_services_raw())


@app.route("/admin/services/new", methods=["GET"])
def admin_service_new():
    guard = _require_admin()
    if guard:
        return guard
    return render_template("admin/service_form.html", admin_page="services",
                           service=None, errors={}, form_data={})


@app.route("/admin/services/new", methods=["POST"])
def admin_service_create():
    guard = _require_admin()
    if guard:
        return guard
    form = request.form
    data = {
        "title": form.get("title", "").strip(),
        "description": form.get("description", "").strip(),
        "icon": form.get("icon", "").strip(),
        "highlights": form.get("highlights", ""),
    }
    service, errors = create_service(data)
    if errors:
        return render_template("admin/service_form.html", admin_page="services",
                               service=None, errors=errors, form_data=form), 422
    global SERVICES
    SERVICES = _load_services()
    flash(f"Service '{service['title']}' created successfully.", "success")
    return redirect(url_for("admin_services"))


@app.route("/admin/services/<service_id>/edit", methods=["GET"])
def admin_service_edit(service_id):
    guard = _require_admin()
    if guard:
        return guard
    svc = get_service_by_id(service_id)
    if not svc:
        flash("Service not found.", "error")
        return redirect(url_for("admin_services"))
    return render_template("admin/service_form.html", admin_page="services",
                           service=type("S", (), svc)(), errors={}, form_data={})


@app.route("/admin/services/<service_id>/edit", methods=["POST"])
def admin_service_update(service_id):
    guard = _require_admin()
    if guard:
        return guard
    form = request.form
    data = {
        "title": form.get("title", "").strip(),
        "description": form.get("description", "").strip(),
        "icon": form.get("icon", "").strip(),
        "highlights": form.get("highlights", ""),
    }
    updated, errors = update_service(service_id, data)
    if errors:
        svc = get_service_by_id(service_id)
        svc_obj = type("S", (), svc)() if svc else None
        return render_template("admin/service_form.html", admin_page="services",
                               service=svc_obj, errors=errors, form_data=form), 422
    global SERVICES
    SERVICES = _load_services()
    flash(f"Service '{updated['title']}' updated successfully.", "success")
    return redirect(url_for("admin_services"))


@app.route("/admin/services/<service_id>/delete", methods=["POST"])
def admin_service_delete(service_id):
    guard = _require_admin()
    if guard:
        return guard
    svc = get_service_by_id(service_id)
    title = svc["title"] if svc else service_id
    if delete_service(service_id):
        global SERVICES
        SERVICES = _load_services()
        flash(f"Service '{title}' deleted.", "success")
    else:
        flash("Service not found.", "error")
    return redirect(url_for("admin_services"))


# ── Admin: Users ───────────────────────────────────────────────────────────────

@app.route("/admin/users")
def admin_users():
    guard = _require_admin()
    if guard:
        return guard
    return render_template("admin/users.html", admin_page="users",
                           users=get_all_users())


@app.route("/admin/users/<user_id>/approve", methods=["POST"])
def admin_user_approve(user_id):
    guard = _require_admin()
    if guard:
        return guard
    update_user_status(user_id, STATUS_APPROVED)
    flash("User approved.", "success")
    return redirect(url_for("admin_users"))


@app.route("/admin/users/<user_id>/reject", methods=["POST"])
def admin_user_reject(user_id):
    guard = _require_admin()
    if guard:
        return guard
    update_user_status(user_id, "rejected")
    flash("User suspended/rejected.", "success")
    return redirect(url_for("admin_users"))


@app.route("/admin/users/<user_id>/delete", methods=["POST"])
def admin_user_delete(user_id):
    guard = _require_admin()
    if guard:
        return guard
    if user_id == session.get("user_id"):
        flash("You cannot delete your own account.", "error")
        return redirect(url_for("admin_users"))
    delete_user(user_id)
    flash("User deleted.", "success")
    return redirect(url_for("admin_users"))


# ── Startup tasks ──────────────────────────────────────────────────────────────

# Ensure at least one admin account exists
ensure_default_admin()


# ── Development server ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True)
