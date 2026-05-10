"""
Daily sales report generator for TAMILARASU ENTERPRISES.

Queries orders for the previous day, computes aggregates,
stores the report in the `reports` table, and emails it to admins.

Schedule via cron:
    0 0 * * * python3 /path/to/daily_report.py
"""
import os
import json
import logging
from datetime import date, timedelta, datetime

import mysql.connector

from email_notifier import send_email

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# Database configuration from environment variables
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_NAME = os.environ.get("DB_NAME", "tamilarasu_db")
DB_USER = os.environ.get("DB_USER", "tamilarasu_enterprises")
DB_PASS = os.environ.get("DB_PASS", "VSRT@1980")

# Admin email addresses (comma-separated)
ADMIN_EMAILS_RAW = os.environ.get("ADMIN_EMAILS", "")
ADMIN_EMAILS = [e.strip() for e in ADMIN_EMAILS_RAW.split(",") if e.strip()]


def get_db_connection():
    """Create and return a MySQL database connection."""
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        charset="utf8mb4",
        use_unicode=True,
    )


def generate_report(report_date: date) -> dict:
    """
    Generate sales report for the given date.

    Returns a dict with:
        - report_date: date
        - total_sales: Decimal
        - order_count: int
        - top_products: list of {product_name, quantity_sold, revenue}
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    start_dt = datetime.combine(report_date, datetime.min.time())
    end_dt = datetime.combine(report_date, datetime.max.time())

    # Total sales and order count
    cursor.execute(
        """
        SELECT
            COALESCE(SUM(total), 0) AS total_sales,
            COUNT(*) AS order_count
        FROM orders
        WHERE created_at BETWEEN %s AND %s
          AND status != 'CANCELLED'
        """,
        (start_dt, end_dt),
    )
    summary = cursor.fetchone()
    total_sales = float(summary["total_sales"])
    order_count = int(summary["order_count"])

    # Top 5 products by quantity sold
    cursor.execute(
        """
        SELECT
            oi.product_name,
            SUM(oi.quantity) AS quantity_sold,
            SUM(oi.unit_price * oi.quantity) AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at BETWEEN %s AND %s
          AND o.status != 'CANCELLED'
        GROUP BY oi.product_name
        ORDER BY quantity_sold DESC
        LIMIT 5
        """,
        (start_dt, end_dt),
    )
    top_products = [
        {
            "product_name": row["product_name"],
            "quantity_sold": int(row["quantity_sold"]),
            "revenue": float(row["revenue"]),
        }
        for row in cursor.fetchall()
    ]

    cursor.close()
    conn.close()

    return {
        "report_date": report_date,
        "total_sales": total_sales,
        "order_count": order_count,
        "top_products": top_products,
    }


def store_report(report: dict) -> int:
    """
    Insert the report into the `reports` table.
    Returns the inserted report ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO reports (report_date, total_sales, order_count, top_products)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            total_sales = VALUES(total_sales),
            order_count = VALUES(order_count),
            top_products = VALUES(top_products),
            generated_at = CURRENT_TIMESTAMP
        """,
        (
            report["report_date"].isoformat(),
            report["total_sales"],
            report["order_count"],
            json.dumps(report["top_products"]),
        ),
    )
    conn.commit()
    report_id = cursor.lastrowid
    cursor.close()
    conn.close()
    logging.info("Report stored with id=%s for date=%s", report_id, report["report_date"])
    return report_id


def build_report_html(report: dict) -> str:
    """Build an HTML email body for the daily report."""
    top_products_rows = ""
    for p in report["top_products"]:
        top_products_rows += f"""
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">{p['product_name']}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">{p['quantity_sold']}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹{p['revenue']:.2f}</td>
        </tr>"""

    return f"""
    <html>
    <body style="font-family:Arial,sans-serif;color:#333;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <h1 style="color:#1a3c5e;">Daily Sales Report</h1>
        <p><strong>Date:</strong> {report['report_date']}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:12px;background:#f8f9fa;border:1px solid #dee2e6;">
              <strong>Total Sales</strong><br>
              <span style="font-size:24px;color:#1a3c5e;">₹{report['total_sales']:.2f}</span>
            </td>
            <td style="padding:12px;background:#f8f9fa;border:1px solid #dee2e6;">
              <strong>Order Count</strong><br>
              <span style="font-size:24px;color:#1a3c5e;">{report['order_count']}</span>
            </td>
          </tr>
        </table>
        <h2 style="color:#1a3c5e;">Top Products</h2>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1a3c5e;color:white;">
              <th style="padding:10px;text-align:left;">Product</th>
              <th style="padding:10px;text-align:center;">Qty Sold</th>
              <th style="padding:10px;text-align:right;">Revenue</th>
            </tr>
          </thead>
          <tbody>{top_products_rows}</tbody>
        </table>
        <p style="margin-top:20px;color:#666;font-size:12px;">
          Generated by TAMILARASU ENTERPRISES automated reporting system.
        </p>
      </div>
    </body>
    </html>
    """


def main():
    report_date = date.today() - timedelta(days=1)
    logging.info("Generating daily report for %s", report_date)

    try:
        report = generate_report(report_date)
        logging.info(
            "Report: total_sales=%.2f, order_count=%d, top_products=%d",
            report["total_sales"],
            report["order_count"],
            len(report["top_products"]),
        )

        store_report(report)

        if not ADMIN_EMAILS:
            logging.warning("No ADMIN_EMAILS configured — skipping email delivery")
            return

        html = build_report_html(report)
        subject = f"Daily Sales Report — {report_date} — TAMILARASU ENTERPRISES"
        success = send_email(ADMIN_EMAILS, subject, html)
        if success:
            logging.info("Report emailed to %s", ADMIN_EMAILS)
        else:
            logging.error("Failed to email report to admins")

    except Exception as e:
        logging.error("Daily report generation failed: %s", e, exc_info=True)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
