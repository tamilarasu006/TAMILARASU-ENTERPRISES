"""
Product data model and FilterState for TAMILARASU ENTERPRISES website.

Requirements: 12.1, 12.2, 12.3, 12.4
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import List


class ProductCategory(str, Enum):
    """Valid product categories."""
    FRUIT = "FRUIT"
    VEGETABLE = "VEGETABLE"
    GRAIN = "GRAIN"
    SPICE = "SPICE"
    OTHER = "OTHER"


# Pattern: lowercase letters, digits, and hyphens; no leading/trailing hyphens
_ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# Minimal URL validation: must start with http://, https://, or /
_URL_PATTERN = re.compile(r"^(https?://|/).+")


@dataclass
class Product:
    """
    Represents a single product in the TAMILARASU ENTERPRISES catalog.

    Required fields (must be non-empty / valid):
        id, name, category, origin, minimumOrderQuantity, imageUrl,
        description, isAvailable

    Optional fields:
        season, unit, certifications, exportDestinations,
        packagingOptions, shelfLife, tags
    """

    id: str
    name: str
    category: str  # stored as string; validated against ProductCategory enum
    origin: str
    minimumOrderQuantity: str
    imageUrl: str
    description: str
    isAvailable: bool

    # Optional fields with sensible defaults
    season: str = ""
    unit: str = ""
    certifications: List[str] = field(default_factory=list)
    exportDestinations: List[str] = field(default_factory=list)
    packagingOptions: List[str] = field(default_factory=list)
    shelfLife: str = ""
    tags: List[str] = field(default_factory=list)

    @classmethod
    def validate(cls, data: dict) -> "ValidationErrors":
        """
        Validate a product data dictionary against all field rules.

        Returns a dict of {field_name: error_message}.
        An empty dict means the record is valid.

        Rules enforced:
        - id: non-empty, matches ^[a-z0-9]+(-[a-z0-9]+)*$  (Req 12.2)
        - name: 1–100 characters                            (Req 12.1)
        - category: one of FRUIT|VEGETABLE|GRAIN|SPICE|OTHER (Req 12.3)
        - origin: non-empty                                 (Req 12.1)
        - minimumOrderQuantity: non-empty                   (Req 12.4)
        - imageUrl: valid URL                               (Req 12.1)
        - description: 1–1000 characters                   (Req 12.1)
        - isAvailable: boolean                              (Req 12.4)
        """
        errors: dict[str, str] = {}

        # --- id ---
        product_id = data.get("id", "")
        if not isinstance(product_id, str) or not product_id:
            errors["id"] = "id is required and must be a non-empty string."
        elif not _ID_PATTERN.match(product_id):
            errors["id"] = (
                "id must match pattern ^[a-z0-9]+(-[a-z0-9]+)*$ "
                "(lowercase letters, digits, and hyphens only; "
                "no leading or trailing hyphens)."
            )

        # --- name ---
        name = data.get("name", "")
        if not isinstance(name, str) or not name:
            errors["name"] = "name is required and must be a non-empty string."
        elif not (1 <= len(name) <= 100):
            errors["name"] = "name must be between 1 and 100 characters."

        # --- category ---
        category = data.get("category", "")
        valid_categories = {c.value for c in ProductCategory}
        if not isinstance(category, str) or category not in valid_categories:
            errors["category"] = (
                f"category must be one of: {', '.join(sorted(valid_categories))}."
            )

        # --- origin ---
        origin = data.get("origin", "")
        if not isinstance(origin, str) or not origin.strip():
            errors["origin"] = "origin is required and must be a non-empty string."

        # --- minimumOrderQuantity ---
        moq = data.get("minimumOrderQuantity", "")
        if not isinstance(moq, str) or not moq.strip():
            errors["minimumOrderQuantity"] = (
                "minimumOrderQuantity is required and must be a non-empty string."
            )

        # --- imageUrl ---
        image_url = data.get("imageUrl", "")
        if not isinstance(image_url, str) or not image_url:
            errors["imageUrl"] = "imageUrl is required and must be a non-empty string."
        elif not _URL_PATTERN.match(image_url):
            errors["imageUrl"] = (
                "imageUrl must be a valid URL (starting with http://, https://, or /)."
            )

        # --- description ---
        description = data.get("description", "")
        if not isinstance(description, str) or not description:
            errors["description"] = (
                "description is required and must be a non-empty string."
            )
        elif not (1 <= len(description) <= 1000):
            errors["description"] = (
                "description must be between 1 and 1000 characters."
            )

        # --- isAvailable ---
        is_available = data.get("isAvailable")
        if not isinstance(is_available, bool):
            errors["isAvailable"] = "isAvailable is required and must be a boolean."

        return errors

    @classmethod
    def from_dict(cls, data: dict) -> "Product":
        """
        Construct a Product from a dictionary.
        Raises ValueError if validation fails.
        """
        errors = cls.validate(data)
        if errors:
            raise ValueError(f"Invalid product data: {errors}")

        return cls(
            id=data["id"],
            name=data["name"],
            category=data["category"],
            origin=data["origin"],
            minimumOrderQuantity=data["minimumOrderQuantity"],
            imageUrl=data["imageUrl"],
            description=data["description"],
            isAvailable=data["isAvailable"],
            season=data.get("season", ""),
            unit=data.get("unit", ""),
            certifications=data.get("certifications", []),
            exportDestinations=data.get("exportDestinations", []),
            packagingOptions=data.get("packagingOptions", []),
            shelfLife=data.get("shelfLife", ""),
            tags=data.get("tags", []),
        )

    def to_dict(self) -> dict:
        """Serialize the Product to a plain dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "origin": self.origin,
            "minimumOrderQuantity": self.minimumOrderQuantity,
            "imageUrl": self.imageUrl,
            "description": self.description,
            "isAvailable": self.isAvailable,
            "season": self.season,
            "unit": self.unit,
            "certifications": self.certifications,
            "exportDestinations": self.exportDestinations,
            "packagingOptions": self.packagingOptions,
            "shelfLife": self.shelfLife,
            "tags": self.tags,
        }


# Type alias for the errors dict returned by Product.validate()
ValidationErrors = dict[str, str]


@dataclass
class FilterState:
    """
    Holds the active filter state for the product catalog.

    Fields:
        selectedCategory: "ALL" or a ProductCategory value (default "ALL")
        searchQuery:      free-text search string (default "")
        showAvailableOnly: when True, only available products are shown (default False)
    """

    selectedCategory: str = "ALL"
    searchQuery: str = ""
    showAvailableOnly: bool = False
