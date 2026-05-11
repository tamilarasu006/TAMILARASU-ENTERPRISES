# Implementation Plan: TAMILARASU ENTERPRISES Website

## Overview

This plan implements the TAMILARASU ENTERPRISES website as a Python-based static site (using a framework such as Flask + Frozen-Flask, or a Jinja2-based static generator). The implementation proceeds incrementally: data models and validation first, then core UI components, then pages, then the inquiry form and email integration, and finally wiring everything together with security and performance optimizations.

All code examples and test tasks use **Python** (with `pytest` and `hypothesis` for property-based testing).

---

## Tasks

- [x] 1. Set up project structure, data models, and validation utilities
  - Create the directory layout: `static/`, `templates/`, `data/`, `tests/`, `components/`
  - Define `Product` and `FilterState` dataclasses/TypedDicts in `models/product.py`
  - Define `InquiryFormData`, `ValidationResult`, and `SubmissionResult` dataclasses in `models/inquiry.py`
  - Define `SiteConfiguration`, `SocialLink`, `Service`, `TeamMember`, `CompanyInfo`, and `FooterData` dataclasses in `models/site.py`
  - Seed `data/products.json` with at least 5 sample product records satisfying all required fields
  - Seed `data/site_config.json` with company name, tagline, contact details, and social links
  - Set up `pytest` and `hypothesis` in `requirements.txt` / `pyproject.toml`
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 1.1 Implement `Product` model with validation
    - Write `Product` dataclass with all required fields and a `validate()` classmethod that enforces field rules (id pattern, name length, category enum, non-empty fields)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 1.2 Write property test for Product data completeness (Property 11)
    - **Property 11: Product Data Completeness**
    - Generate random `Product`-like dicts; assert that `Product.validate()` rejects any record missing a required field or with an invalid category
    - **Validates: Requirements 12.1, 12.3**

  - [x] 1.3 Implement `InquiryFormData` model and `isValidEmail()` utility
    - Write `InquiryFormData` dataclass in `models/inquiry.py`
    - Implement `is_valid_email(email: str) -> bool` in `utils/validation.py` using RFC 5322-compatible regex
    - _Requirements: 8.3_

  - [ ]* 1.4 Write property test for email validity (Property 8)
    - **Property 8: Email Validity**
    - Use `hypothesis` to generate strings; assert `is_valid_email` returns `True` iff the string has exactly one `@` with non-empty local and domain parts
    - **Validates: Requirements 8.3**

- [x] 2. Implement product catalog filtering logic
  - [x] 2.1 Implement `filter_products()` in `catalog/filter.py`
    - Write `filter_products(products: list[Product], filters: FilterState) -> list[Product]`
    - Apply category, case-insensitive name/tag search, and availability filters in combination
    - Return empty list (not `None`) when no products match; preserve original order
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Write property test for Catalog Completeness (Property 1)
    - **Property 1: Catalog Completeness**
    - For any random product list and FilterState, every product satisfying all criteria SHALL appear in the result
    - **Validates: Requirements 3.1, 3.5**

  - [ ]* 2.3 Write property test for Catalog Soundness (Property 2)
    - **Property 2: Catalog Soundness**
    - For any random product list and FilterState, every product in the result SHALL satisfy all active filter criteria
    - **Validates: Requirements 3.2, 3.3, 3.4**

  - [ ]* 2.4 Write property test for Filter Idempotency (Property 3)
    - **Property 3: Filter Idempotency**
    - Applying `filter_products` twice with the same FilterState produces an identical result to applying it once
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [x] 3. Implement inquiry form validation and submission logic
  - [x] 3.1 Implement `validate_inquiry_form()` in `inquiry/validator.py`
    - Write `validate_inquiry_form(form_data: InquiryFormData) -> ValidationResult`
    - Validate `fullName` (2–100 chars), `email` (via `is_valid_email`), `country` (non-empty), `inquiryType` (enum), `message` (10–1000 chars)
    - Return `ValidationResult(is_valid=True, errors={})` when all fields pass; return field-specific errors otherwise
    - Do not mutate `form_data`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 3.2 Write property test for Form Validation Completeness (Property 4)
    - **Property 4: Form Validation Completeness**
    - For any `InquiryFormData` with at least one required field empty or invalid, `validate_inquiry_form` SHALL return `is_valid=False` with at least one error entry
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8**

  - [ ]* 3.3 Write property test for Form Validation Soundness (Property 5)
    - **Property 5: Form Validation Soundness**
    - For any `InquiryFormData` where all required fields are present and valid, `validate_inquiry_form` SHALL return `is_valid=True` and an empty errors map
    - **Validates: Requirements 8.7**

  - [x] 3.4 Implement `build_email_payload()` and input sanitization in `inquiry/email_builder.py`
    - Write `build_email_payload(form_data: InquiryFormData) -> dict` that constructs subject and body strings
    - Implement `sanitize_input(value: str) -> str` in `utils/sanitize.py` that strips/escapes HTML tags and script content from all string fields before inclusion in the email body
    - _Requirements: 9.2_

  - [ ]* 3.5 Write property test for Input Sanitization (Property 12)
    - **Property 12: Input Sanitization**
    - For any `InquiryFormData` containing special characters or injection sequences, the email body from `build_email_payload` SHALL not contain unescaped injection sequences
    - **Validates: Requirements 9.2**

  - [x] 3.6 Implement `submit_inquiry()` in `inquiry/submission.py`
    - Write `submit_inquiry(form_data: InquiryFormData) -> SubmissionResult`
    - Call `validate_inquiry_form`; on failure return `SubmissionResult(success=False, ...)`
    - Set `form_data.submitted_at` only after successful validation
    - Call email service (EmailJS/Formspree via server-side handler); on email failure return `SubmissionResult(success=False, ...)`
    - On success return `SubmissionResult(success=True, message="Your inquiry has been sent. We will contact you within 24 hours.")`
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 3.7 Write property test for Submission Atomicity (Property 6)
    - **Property 6: Submission Atomicity**
    - For any valid `InquiryFormData`, `submit_inquiry` SHALL either dispatch email AND return `success=True`, or send no email AND return `success=False` — no partial state
    - **Validates: Requirements 7.2, 7.4**

- [x] 4. Checkpoint — Ensure all model, filter, and validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement HTML templates and UI components
  - [x] 5.1 Create base layout template (`templates/base.html`)
    - Implement `Header` component with logo, company name, and navigation links (Home, Products, Services, About, Contact)
    - Implement active-link highlighting logic (pass current page name to template context)
    - Implement hamburger menu toggle for mobile (< 768px) using vanilla JS
    - Implement `Footer` component with address, phone, `mailto:` email link, social icons, quick links, and copyright notice with current year
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 13.1, 13.2, 13.3_

  - [ ]* 5.2 Write unit tests for active navigation highlighting (Property 9)
    - **Property 9: Active Navigation Highlighting**
    - For any page route, assert that exactly one nav link is marked active and all others are inactive
    - **Validates: Requirements 1.3**

  - [x] 5.3 Create `Product_Card` component template (`templates/components/product_card.html`)
    - Render product image (with `onerror` fallback to placeholder), name, origin, MOQ, availability badge, certifications (conditional), and "Request Quote" button
    - The "Request Quote" button SHALL link to the Contact page with the product name as a query parameter
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.4 Create `Service_Card` component template (`templates/components/service_card.html`)
    - Render service icon, title, description (≤ 500 chars), and highlight items (1–5)
    - _Requirements: 5.1_

- [x] 6. Implement site pages
  - [x] 6.1 Implement Home Page (`templates/home.html` + route)
    - Render `Hero_Banner` with headline, subheadline, and CTA button linking to Products page
    - Render 3–6 featured products from `site_config.featured_product_ids`; if fewer than 3 available, render all without placeholders
    - Render brief service overview (title + ≤ 50-word description per service) with link to Services page
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Implement Product Catalog Page (`templates/catalog.html` + route)
    - Render full product grid using `filter_products()` with category, search, and availability controls
    - Implement client-side filter/search interaction (vanilla JS) that calls `filter_products` logic or re-renders via AJAX/page reload
    - Display "No results" message when filter returns empty list
    - Implement pagination: display ≤ 20 products per page with navigation controls when total > 20
    - Render product grid: ≥ 3 columns on desktop, 2 on tablet, 1–2 on mobile
    - Display maintenance message (with contact email and phone) when product data source is empty
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 12.5, 14.3_

  - [x] 6.3 Implement Services Page (`templates/services.html` + route)
    - Render all services using `Service_Card` component
    - Include link to Contact page
    - Display fallback message directing visitor to contact company when services list is empty
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.4 Implement About Page (`templates/about.html` + route)
    - Render company history, mission, vision, and core values
    - Render export destinations list
    - Render certifications with name and badge/logo
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.5 Implement Contact / Inquiry Form Page (`templates/contact.html` + route)
    - Render `Inquiry_Form` with all fields: full name, email, phone, country, company name, inquiry type, product name (pre-fillable via query param), quantity, message
    - Wire form submission to `submit_inquiry()` via POST handler
    - Display inline field-specific validation errors without clearing entered values on failure
    - Disable submit button during submission (Property 7); re-enable on failure
    - Display success confirmation message on successful submission
    - Display error message with direct email and WhatsApp fallback on email service failure
    - Add honeypot hidden field; silently discard submissions where honeypot is non-empty (Requirement 9.1)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 9.1_

  - [ ]* 5.5 Write property test for Request Quote Pre-fill (Property 10)
    - **Property 10: Request Quote Pre-fill**
    - For any product in the catalog, clicking "Request Quote" SHALL result in the Inquiry_Form product name field being pre-filled with that product's name
    - **Validates: Requirements 3.7**

- [ ] 7. Checkpoint — Ensure all page routes render correctly and form validation works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement responsive design and accessibility
  - [ ] 8.1 Add responsive CSS (`static/css/main.css`)
    - Implement mobile-first CSS with breakpoints at 768px (tablet) and 1024px (desktop)
    - Product grid: 1-column on mobile, 2-column on tablet, ≥ 3-column on desktop
    - Inquiry form: single-column stacked layout on mobile with submit button fully visible
    - All interactive elements (buttons, links, inputs) SHALL have minimum touch target size of 44×44px on mobile
    - Ensure no horizontal overflow, clipped content, or overlapping elements at any breakpoint
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 8.2 Implement image optimization and lazy loading
    - Serve all product images in WebP format with at least 3 responsive size variants (mobile, tablet, desktop) using `<picture>` / `srcset`
    - Apply `loading="lazy"` to all images below the initial viewport fold
    - Implement `onerror` fallback on all `<img>` tags to display a placeholder image
    - _Requirements: 4.4, 11.2, 11.3_

- [ ] 9. Implement security controls
  - [ ] 9.1 Configure Content Security Policy and HTTPS enforcement
    - Add CSP HTTP response headers restricting inline scripts and limiting resource origins to a trusted allowlist
    - Configure server/hosting to redirect all HTTP traffic to HTTPS
    - Ensure company contact email is not exposed in client-side source code (route through server-side handler or restricted-key form service)
    - _Requirements: 9.3, 9.4_

  - [ ] 9.2 Integrate reCAPTCHA v3 on the Inquiry Form
    - Add reCAPTCHA v3 script to the contact page template
    - Verify reCAPTCHA token server-side before processing form submission
    - _Requirements: 9.1_

- [ ] 10. Implement CDN delivery and performance optimizations
  - [ ] 10.1 Configure static asset delivery via CDN
    - Configure hosting (Netlify/Vercel/GitHub Pages) to serve `static/` assets via CDN
    - Ensure origin server is available as fallback
    - _Requirements: 11.4_

  - [ ] 10.2 Implement progressive enhancement
    - Verify that navigation, product listing, and product detail pages are readable and functionally usable with JavaScript disabled
    - Ensure forms degrade gracefully (server-side validation fallback)
    - _Requirements: 11.5_

- [ ] 11. Implement admin product catalog management
  - [ ] 11.1 Implement product data loader with malformed-entry handling (`catalog/loader.py`)
    - Write `load_products(path: str) -> list[Product]` that reads `data/products.json`, validates each entry using `Product.validate()`, skips malformed/incomplete entries without crashing, and logs skipped entries
    - _Requirements: 14.2, 14.3_

  - [ ] 11.2 Document the product data update workflow
    - Add a `README.md` section explaining how an admin edits `data/products.json` (or CMS) to add, edit, or remove products without touching source code or build scripts
    - Confirm that a static site rebuild reflects changes within 10 minutes (or 60 seconds for live CMS)
    - _Requirements: 14.1, 14.2_

- [ ] 12. Final checkpoint — Ensure all tests pass and the full site is functional
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property-based tests use `hypothesis`; all unit tests use `pytest`
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (filter logic, form validation, email safety)
- Unit tests validate specific examples and edge cases
- The implementation language is **Python** throughout

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.5", "3.6"] },
    { "id": 5, "tasks": ["3.7", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 7, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 8, "tasks": ["6.5", "11.1"] },
    { "id": 9, "tasks": ["5.5", "8.1", "8.2"] },
    { "id": 10, "tasks": ["9.1", "9.2", "10.1", "10.2", "11.2"] }
  ]
}
```
