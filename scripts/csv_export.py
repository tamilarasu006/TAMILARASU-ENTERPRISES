"""
CSV product exporter for TAMILARASU ENTERPRISES.

Connects directly to MySQL and exports all active products
with category name, images, and inventory data.

Usage:
    python3 csv_export.py [output_path]

    output_path defaults to products_export.csv

Environment variables:
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
"""
import csv
import os
import sys
import logging
from datetime import datetime

import mysql.connector

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_NAME = os.environ.get("DB_NAME", "tamilarasu_db")
DB_USER = os.environ.get("DB_USER", "tamilarasu_enterprises")
DB_PASS = os.environ.get("DB_PASS", "VSRT@1980")


def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        charset="utf8mb4",
        use_unicode=True,
    )


def fetch_products(conn) -> list:
    """
    Fetch all active products with category, images, and inventory.
    Returns a list of dicts.
    """
    cursor = conn.cursor(dictionary=True)

    # Fetch products with category
    cursor.execute(
        """
        SELECT
            p.id,
            p.name,
            p.description,
            p.price,
            c.name AS category,
            p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.active = TRUE
        ORDER BY p.id
        """
    )
    products = cursor.fetchall()

    # Fetch images for all products
    cursor.execute(
        """
        SELECT product_id, url, sort_order
        FROM product_images
        ORDER BY product_id, sort_order
        """
    )
    images_raw = cursor.fetchall()

    # Group images by product_id
    images_by_product = {}
    for img in images_raw:
        pid = img["product_id"]
        images_by_product.setdefault(pid, []).append(img["url"])

    # Fetch inventory
    cursor.execute(
        """
        SELECT product_id, quantity, out_of_stock
        FROM inventory
        """
    )
    inventory_raw = cursor.fetchall()
    inventory_by_product = {row["product_id"]: row for row in inventory_raw}

    cursor.close()

    # Merge
    for product in products:
        pid = product["id"]
        imgs = images_by_product.get(pid, [])
        # Pad to 5 image slots
        for i in range(5):
            product[f"image_url_{i + 1}"] = imgs[i] if i < len(imgs) else ""

        inv = inventory_by_product.get(pid, {})
        product["quantity"] = inv.get("quantity", 0)
        product["out_of_stock"] = bool(inv.get("out_of_stock", True))

    return products


def export_to_csv(products: list, output_path: str):
    """Write products to a CSV file."""
    fieldnames = [
        "id", "name", "description", "price", "category",
        "image_url_1", "image_url_2", "image_url_3", "image_url_4", "image_url_5",
        "quantity", "out_of_stock",
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(products)

    logging.info("Exported %d products to %s", len(products), output_path)


def main():
    output_path = sys.argv[1] if len(sys.argv) > 1 else "products_export.csv"

    logging.info("Connecting to database %s@%s:%d/%s", DB_USER, DB_HOST, DB_PORT, DB_NAME)

    try:
        conn = get_db_connection()
    except Exception as e:
        logging.error("Database connection failed: %s", e)
        sys.exit(1)

    try:
        products = fetch_products(conn)
        logging.info("Fetched %d active products", len(products))
        export_to_csv(products, output_path)
        print(f"Export complete: {len(products)} products written to {output_path}")
    except Exception as e:
        logging.error("Export failed: %s", e, exc_info=True)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
