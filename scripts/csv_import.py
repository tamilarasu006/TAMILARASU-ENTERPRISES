"""
CSV product importer for TAMILARASU ENTERPRISES.

Usage:
    python3 csv_import.py products.csv

Expected CSV columns:
    name, description, price, category_slug, image_url_1, image_url_2,
    image_url_3, image_url_4, image_url_5

Environment variables:
    API_TOKEN  — Bearer token for admin API authentication
    API_BASE   — Base URL of the API (default: http://localhost:8080)
"""
import csv
import sys
import os
import json
import logging
import urllib.request
import urllib.error

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

API_BASE = os.environ.get("API_BASE", "http://localhost:8080")
API_TOKEN = os.environ.get("API_TOKEN", "")

REQUIRED_COLUMNS = {"name", "description", "price", "category_slug"}
EXPECTED_HEADERS = ["name", "description", "price", "category_slug",
                    "image_url_1", "image_url_2", "image_url_3", "image_url_4", "image_url_5"]


def validate_row(row: dict, row_num: int) -> list:
    """
    Validate a single CSV row.

    Returns a list of error dicts: [{row, field, error}]
    """
    errors = []

    # name
    if not row.get("name", "").strip():
        errors.append({"row": row_num, "field": "name", "error": "Name is required"})

    # price
    price_str = row.get("price", "").strip()
    if not price_str:
        errors.append({"row": row_num, "field": "price", "error": "Price is required"})
    else:
        try:
            price = float(price_str)
            if price <= 0:
                errors.append({"row": row_num, "field": "price", "error": "Price must be positive"})
        except ValueError:
            errors.append({"row": row_num, "field": "price", "error": f"Invalid price value: '{price_str}'"})

    # category_slug
    if not row.get("category_slug", "").strip():
        errors.append({"row": row_num, "field": "category_slug", "error": "Category slug is required"})

    return errors


def create_product_via_api(row: dict) -> dict:
    """
    POST a product to the admin API.

    Returns the created product dict.
    Raises urllib.error.HTTPError on failure.
    """
    image_urls = []
    for i in range(1, 6):
        url = row.get(f"image_url_{i}", "").strip()
        if url:
            image_urls.append(url)

    payload = {
        "name": row["name"].strip(),
        "description": row.get("description", "").strip(),
        "price": float(row["price"].strip()),
        "categorySlug": row["category_slug"].strip(),
        "imageUrls": image_urls,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/admin/products",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_TOKEN}",
        },
        method="POST",
    )

    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 csv_import.py <path_to_csv>", file=sys.stderr)
        sys.exit(1)

    csv_path = sys.argv[1]

    if not os.path.isfile(csv_path):
        print(f"Error: File not found: {csv_path}", file=sys.stderr)
        sys.exit(1)

    all_errors = []
    valid_rows = []

    # Phase 1: Read and validate all rows
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        # Normalize headers
        if reader.fieldnames is None:
            print("Error: Empty CSV file", file=sys.stderr)
            sys.exit(1)

        for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
            row_errors = validate_row(row, row_num)
            if row_errors:
                all_errors.extend(row_errors)
            else:
                valid_rows.append((row_num, row))

    # Phase 2: Report errors if any
    if all_errors:
        print("\n=== CSV Validation Errors ===")
        print(f"Found {len(all_errors)} error(s):\n")
        for err in all_errors:
            print(f"  Row {err['row']}, Field '{err['field']}': {err['error']}")
        print(f"\nImport aborted. Fix the above errors and retry.")
        sys.exit(1)

    # Phase 3: Import all valid rows
    logging.info("All %d rows validated. Starting import...", len(valid_rows))
    imported = 0
    import_errors = []

    for row_num, row in valid_rows:
        try:
            product = create_product_via_api(row)
            logging.info("Row %d: Created product id=%s name='%s'",
                         row_num, product.get("id"), product.get("name"))
            imported += 1
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            import_errors.append({"row": row_num, "error": f"HTTP {e.code}: {body}"})
            logging.error("Row %d: API error %d: %s", row_num, e.code, body)
        except Exception as e:
            import_errors.append({"row": row_num, "error": str(e)})
            logging.error("Row %d: Unexpected error: %s", row_num, e)

    print(f"\n=== Import Complete ===")
    print(f"  Imported: {imported}")
    print(f"  Errors:   {len(import_errors)}")

    if import_errors:
        print("\nImport errors:")
        for err in import_errors:
            print(f"  Row {err['row']}: {err['error']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
