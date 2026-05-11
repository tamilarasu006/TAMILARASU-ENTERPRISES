# TAMILARASU ENTERPRISES Website

A professional multi-page website for TAMILARASU ENTERPRISES — a fresh produce importing and exporting company based in Tamil Nadu, India.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Flask 3.x |
| Templates | Jinja2 |
| Frontend | HTML5, CSS3, Vanilla JS |
| Email | Formspree (via `FORMSPREE_ENDPOINT` env var) |
| Spam protection | Honeypot field + reCAPTCHA v3 |
| Testing | pytest 8.x, hypothesis 6.x |

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment variables (optional)

| Variable | Purpose | Default |
|---|---|---|
| `FORMSPREE_ENDPOINT` | Formspree form URL for email delivery | *(disabled)* |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v3 secret key | *(disabled)* |

Create a `.env` file or set them in your shell:

```bash
set FORMSPREE_ENDPOINT=https://formspree.io/f/your-form-id
set RECAPTCHA_SECRET_KEY=your-secret-key
```

### 3. Run the development server

```bash
py app.py
```

The site will be available at `http://127.0.0.1:5000`.

---

## Running Tests

```bash
py -m pytest tests/ -v
```

All 197+ tests should pass. The test suite covers:
- Data models and validation (Product, InquiryFormData)
- Catalog filtering logic (completeness, soundness, idempotency)
- Form validation (all required fields, boundary values)
- Email payload building and input sanitization
- Inquiry submission (atomicity, error handling)
- All page routes (GET and POST)
- Catalog loader (malformed entry handling)

---

## Project Structure

```
TAMILARASU ENTERPRISES/
├── app.py                  # Flask application entry point
├── requirements.txt        # Python dependencies
├── pyproject.toml          # pytest configuration
├── README.md               # This file
│
├── models/                 # Data models
│   ├── product.py          # Product, FilterState
│   ├── inquiry.py          # InquiryFormData, ValidationResult, SubmissionResult
│   └── site.py             # SiteConfiguration, SocialLink
│
├── catalog/                # Product catalog logic
│   ├── filter.py           # filter_products()
│   └── loader.py           # load_products()
│
├── inquiry/                # Inquiry form logic
│   ├── validator.py        # validate_inquiry_form()
│   ├── email_builder.py    # build_email_payload()
│   ├── email_service.py    # send_email() via Formspree
│   └── submission.py       # submit_inquiry()
│
├── utils/                  # Utilities
│   ├── validation.py       # is_valid_email()
│   ├── sanitize.py         # sanitize_input()
│   └── recaptcha.py        # verify_recaptcha()
│
├── data/                   # Data files (editable by admin)
│   ├── products.json       # Product catalog
│   ├── services.json       # Services list
│   ├── site_config.json    # Company info, social links
│   └── about.json          # About page content
│
├── templates/              # Jinja2 HTML templates
│   ├── base.html           # Base layout (header, footer)
│   ├── home.html           # Home page
│   ├── catalog.html        # Product catalog page
│   ├── services.html       # Services page
│   ├── about.html          # About page
│   ├── contact.html        # Contact / inquiry form
│   └── components/
│       ├── product_card.html
│       └── service_card.html
│
├── static/                 # Static assets
│   ├── css/
│   │   └── main.css        # Responsive stylesheet
│   └── images/
│       ├── placeholder.svg
│       └── products/       # Product images (WebP format)
│
└── tests/                  # Test suite
    ├── test_product_model.py
    ├── test_filter_products.py
    ├── test_validate_inquiry_form.py
    ├── test_email_builder.py
    ├── test_submit_inquiry.py
    ├── test_catalog_loader.py
    └── test_routes.py
```

---

## Admin: Updating the Product Catalog

The product catalog is managed through `data/products.json`. No code changes are required to add, edit, or remove products.

### Adding a product

Add a new JSON object to the array in `data/products.json`:

```json
{
  "id": "product-name",
  "name": "Product Display Name",
  "category": "FRUIT",
  "origin": "India",
  "minimumOrderQuantity": "500 kg",
  "imageUrl": "/static/images/products/product-name.webp",
  "description": "A description of the product (1–1000 characters).",
  "isAvailable": true,
  "season": "March - June",
  "unit": "kg",
  "certifications": ["FSSAI", "APEDA"],
  "exportDestinations": ["UAE", "UK"],
  "packagingOptions": ["5 kg box", "10 kg carton"],
  "shelfLife": "14 days at 8°C",
  "tags": ["fruit", "tropical", "fresh"]
}
```

### Required fields

| Field | Type | Rules |
|---|---|---|
| `id` | string | Lowercase letters, digits, hyphens only. Pattern: `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `name` | string | 1–100 characters |
| `category` | string | One of: `FRUIT`, `VEGETABLE`, `GRAIN`, `SPICE`, `OTHER` |
| `origin` | string | Non-empty |
| `minimumOrderQuantity` | string | Non-empty (e.g. "500 kg") |
| `imageUrl` | string | Valid URL or path starting with `/` |
| `description` | string | 1–1000 characters |
| `isAvailable` | boolean | `true` or `false` |

### Editing a product

Find the product by its `id` in `data/products.json` and update the fields.

### Removing a product

Delete the product's JSON object from the array.

### Applying changes

After editing `data/products.json`:
- **Development**: Restart the Flask server (`py app.py`) — changes reflect immediately on restart.
- **Production (static build)**: Trigger a rebuild/redeploy — changes reflect within the deployment pipeline time (typically < 10 minutes).

### Malformed entries

If a product entry is missing required fields or has invalid values, it will be **automatically skipped** with a warning logged to the server console. All other valid products will still load correctly.

---

## Admin: Updating Services

Edit `data/services.json` to add, edit, or remove services. Each service requires:

```json
{
  "id": "service-id",
  "title": "Service Title",
  "description": "Description (≤ 500 characters).",
  "icon": "fas fa-ship",
  "highlights": ["Highlight 1", "Highlight 2"]
}
```

---

## Admin: Updating Company Information

Edit `data/site_config.json` to update:
- Company name, tagline, logo
- Contact email, phone, WhatsApp number
- Physical address
- Social media links
- Featured product IDs (shown on home page)

Edit `data/about.json` to update:
- Company history, mission, vision, core values
- Export destinations
- Certifications

---

## Deployment

The site can be deployed to any platform that supports Python/Flask:

- **Heroku**: Add a `Procfile` with `web: gunicorn app:app`
- **Vercel**: Use the Python runtime with `vercel.json`
- **Netlify**: Use Netlify Functions or a Python serverless adapter
- **VPS/Cloud**: Run with gunicorn behind nginx

For static hosting (GitHub Pages, Netlify static), use Frozen-Flask to generate a static build:

```bash
pip install frozen-flask
py freeze.py
```

---

## Security Notes

- The company contact email is never exposed in client-side code — all form submissions go through Formspree's server-side handler.
- All form inputs are sanitized before inclusion in email bodies.
- A honeypot field silently discards bot submissions.
- reCAPTCHA v3 provides additional spam protection (configure `RECAPTCHA_SECRET_KEY`).
- Content Security Policy headers are applied to all responses.
- HTTPS enforcement should be configured at the hosting/CDN level.
