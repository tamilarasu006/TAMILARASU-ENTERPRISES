"""
Product catalog filtering logic for TAMILARASU ENTERPRISES website.

Requirements: 3.2, 3.3, 3.4, 3.5
"""

from __future__ import annotations

from typing import List

from models.product import FilterState, Product


def filter_products(products: List[Product], filters: FilterState) -> List[Product]:
    """
    Filter a list of products according to the active FilterState.

    Applies category, name/tag search, and availability filters in combination.
    All three criteria must be satisfied for a product to be included.

    Args:
        products: The full list of Product objects to filter. May be empty.
        filters:  The active FilterState describing which filters are applied.

    Returns:
        A new list containing only the products that satisfy every active
        filter criterion, preserving the original order. Returns an empty
        list (never None) when no products match.

    Filter rules (Requirements 3.2 – 3.5):
        - Category (Req 3.2): When selectedCategory is not "ALL", only products
          whose category equals selectedCategory are included.
        - Search (Req 3.3): When searchQuery has 2 or more characters, only
          products whose name or any tag contains the query string
          (case-insensitive) are included.
        - Availability (Req 3.4): When showAvailableOnly is True, only products
          where isAvailable is True are included.
        - Default pass-through (Req 3.5): When all FilterState fields are at
          their defaults (selectedCategory="ALL", searchQuery="",
          showAvailableOnly=False), all products are returned unchanged.
    """
    result: List[Product] = []

    # Normalise the search query once, outside the loop
    query = filters.searchQuery.lower() if filters.searchQuery else ""
    query_active = len(query) >= 2

    for product in products:
        # --- Category filter (Req 3.2) ---
        if filters.selectedCategory != "ALL":
            if product.category != filters.selectedCategory:
                continue

        # --- Search filter (Req 3.3) ---
        if query_active:
            name_match = query in product.name.lower()
            tag_match = any(query in tag.lower() for tag in product.tags)
            if not (name_match or tag_match):
                continue

        # --- Availability filter (Req 3.4) ---
        if filters.showAvailableOnly and not product.isAvailable:
            continue

        result.append(product)

    return result
