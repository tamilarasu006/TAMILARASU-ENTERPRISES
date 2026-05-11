"""
Unit tests for catalog.filter.filter_products().

Requirements: 3.2, 3.3, 3.4, 3.5
"""

import pytest
from models.product import FilterState, Product
from catalog.filter import filter_products


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_product(
    product_id: str,
    name: str,
    category: str = "FRUIT",
    is_available: bool = True,
    tags: list[str] | None = None,
) -> Product:
    """Create a minimal valid Product for testing."""
    return Product(
        id=product_id,
        name=name,
        category=category,
        origin="India",
        minimumOrderQuantity="100 kg",
        imageUrl="/static/img/placeholder.webp",
        description="Test product description.",
        isAvailable=is_available,
        tags=tags or [],
    )


# Sample products used across multiple tests
MANGO = _make_product("alphonso-mango", "Alphonso Mango", "FRUIT", True, ["tropical", "sweet"])
BANANA = _make_product("cavendish-banana", "Cavendish Banana", "FRUIT", False, ["tropical"])
TOMATO = _make_product("cherry-tomato", "Cherry Tomato", "VEGETABLE", True, ["salad"])
RICE = _make_product("basmati-rice", "Basmati Rice", "GRAIN", True, ["aromatic", "long-grain"])
TURMERIC = _make_product("turmeric-powder", "Turmeric Powder", "SPICE", False, ["spice", "golden"])

ALL_PRODUCTS = [MANGO, BANANA, TOMATO, RICE, TURMERIC]


# ---------------------------------------------------------------------------
# Default / pass-through (Req 3.5)
# ---------------------------------------------------------------------------

class TestDefaultFilters:
    def test_default_filters_return_all_products(self):
        """With all defaults, every product is returned unchanged."""
        result = filter_products(ALL_PRODUCTS, FilterState())
        assert result == ALL_PRODUCTS

    def test_default_filters_preserve_order(self):
        """Original order must be preserved."""
        result = filter_products(ALL_PRODUCTS, FilterState())
        assert [p.id for p in result] == [p.id for p in ALL_PRODUCTS]

    def test_empty_product_list_returns_empty_list(self):
        result = filter_products([], FilterState())
        assert result == []

    def test_returns_list_not_none(self):
        result = filter_products([], FilterState(selectedCategory="FRUIT"))
        assert result is not None
        assert isinstance(result, list)


# ---------------------------------------------------------------------------
# Category filter (Req 3.2)
# ---------------------------------------------------------------------------

class TestCategoryFilter:
    def test_filter_by_fruit_returns_only_fruits(self):
        result = filter_products(ALL_PRODUCTS, FilterState(selectedCategory="FRUIT"))
        assert all(p.category == "FRUIT" for p in result)
        assert len(result) == 2  # MANGO and BANANA

    def test_filter_by_vegetable_returns_only_vegetables(self):
        result = filter_products(ALL_PRODUCTS, FilterState(selectedCategory="VEGETABLE"))
        assert result == [TOMATO]

    def test_filter_by_grain_returns_only_grains(self):
        result = filter_products(ALL_PRODUCTS, FilterState(selectedCategory="GRAIN"))
        assert result == [RICE]

    def test_filter_by_spice_returns_only_spices(self):
        result = filter_products(ALL_PRODUCTS, FilterState(selectedCategory="SPICE"))
        assert result == [TURMERIC]

    def test_filter_by_category_with_no_match_returns_empty(self):
        result = filter_products(ALL_PRODUCTS, FilterState(selectedCategory="OTHER"))
        assert result == []

    def test_all_category_returns_all_products(self):
        result = filter_products(ALL_PRODUCTS, FilterState(selectedCategory="ALL"))
        assert result == ALL_PRODUCTS


# ---------------------------------------------------------------------------
# Search filter (Req 3.3)
# ---------------------------------------------------------------------------

class TestSearchFilter:
    def test_search_by_name_case_insensitive(self):
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="mango"))
        assert MANGO in result

    def test_search_uppercase_matches_lowercase_name(self):
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="MANGO"))
        assert MANGO in result

    def test_search_mixed_case_matches(self):
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="MaNgO"))
        assert MANGO in result

    def test_search_by_tag_case_insensitive(self):
        # "tropical" tag is on MANGO and BANANA
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="tropical"))
        assert MANGO in result
        assert BANANA in result

    def test_search_by_tag_uppercase(self):
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="TROPICAL"))
        assert MANGO in result
        assert BANANA in result

    def test_search_partial_name_match(self):
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="rice"))
        assert RICE in result

    def test_search_with_no_match_returns_empty(self):
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="papaya"))
        assert result == []

    def test_search_query_of_1_char_is_ignored(self):
        """Queries shorter than 2 characters must not filter anything (Req 3.3)."""
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="m"))
        assert result == ALL_PRODUCTS

    def test_empty_search_query_returns_all(self):
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery=""))
        assert result == ALL_PRODUCTS

    def test_search_matches_substring_in_name(self):
        # "Basmati" contains "asma"
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="asma"))
        assert RICE in result

    def test_search_matches_substring_in_tag(self):
        # "long-grain" tag contains "grain"
        result = filter_products(ALL_PRODUCTS, FilterState(searchQuery="grain"))
        assert RICE in result


# ---------------------------------------------------------------------------
# Availability filter (Req 3.4)
# ---------------------------------------------------------------------------

class TestAvailabilityFilter:
    def test_show_available_only_excludes_unavailable(self):
        result = filter_products(ALL_PRODUCTS, FilterState(showAvailableOnly=True))
        assert all(p.isAvailable for p in result)

    def test_show_available_only_includes_available(self):
        result = filter_products(ALL_PRODUCTS, FilterState(showAvailableOnly=True))
        assert MANGO in result
        assert TOMATO in result
        assert RICE in result

    def test_show_available_only_excludes_banana_and_turmeric(self):
        result = filter_products(ALL_PRODUCTS, FilterState(showAvailableOnly=True))
        assert BANANA not in result
        assert TURMERIC not in result

    def test_show_available_false_returns_all(self):
        result = filter_products(ALL_PRODUCTS, FilterState(showAvailableOnly=False))
        assert result == ALL_PRODUCTS

    def test_all_unavailable_returns_empty(self):
        unavailable = [
            _make_product("p1", "Product 1", is_available=False),
            _make_product("p2", "Product 2", is_available=False),
        ]
        result = filter_products(unavailable, FilterState(showAvailableOnly=True))
        assert result == []


# ---------------------------------------------------------------------------
# Combined filters (Req 3.2 + 3.3 + 3.4)
# ---------------------------------------------------------------------------

class TestCombinedFilters:
    def test_category_and_availability_combined(self):
        """FRUIT + available only → only MANGO (BANANA is unavailable)."""
        filters = FilterState(selectedCategory="FRUIT", showAvailableOnly=True)
        result = filter_products(ALL_PRODUCTS, filters)
        assert result == [MANGO]

    def test_category_and_search_combined(self):
        """FRUIT + search 'banana' → only BANANA."""
        filters = FilterState(selectedCategory="FRUIT", searchQuery="banana")
        result = filter_products(ALL_PRODUCTS, filters)
        assert result == [BANANA]

    def test_search_and_availability_combined(self):
        """search 'tropical' + available only → only MANGO (BANANA unavailable)."""
        filters = FilterState(searchQuery="tropical", showAvailableOnly=True)
        result = filter_products(ALL_PRODUCTS, filters)
        assert result == [MANGO]

    def test_all_three_filters_combined(self):
        """FRUIT + search 'tropical' + available only → only MANGO."""
        filters = FilterState(
            selectedCategory="FRUIT",
            searchQuery="tropical",
            showAvailableOnly=True,
        )
        result = filter_products(ALL_PRODUCTS, filters)
        assert result == [MANGO]

    def test_all_three_filters_no_match_returns_empty(self):
        """SPICE + search 'mango' + available only → empty."""
        filters = FilterState(
            selectedCategory="SPICE",
            searchQuery="mango",
            showAvailableOnly=True,
        )
        result = filter_products(ALL_PRODUCTS, filters)
        assert result == []

    def test_combined_filters_preserve_order(self):
        """Products that pass all filters must appear in original order."""
        products = [MANGO, TOMATO, RICE]
        filters = FilterState(showAvailableOnly=True)
        result = filter_products(products, filters)
        assert result == [MANGO, TOMATO, RICE]


# ---------------------------------------------------------------------------
# Return type and immutability
# ---------------------------------------------------------------------------

class TestReturnBehavior:
    def test_result_is_a_new_list(self):
        """filter_products must not return the same list object."""
        original = list(ALL_PRODUCTS)
        result = filter_products(original, FilterState())
        assert result is not original

    def test_original_list_is_not_mutated(self):
        original = list(ALL_PRODUCTS)
        filter_products(original, FilterState(selectedCategory="FRUIT"))
        assert original == ALL_PRODUCTS

    def test_no_duplicates_in_result(self):
        result = filter_products(ALL_PRODUCTS, FilterState())
        ids = [p.id for p in result]
        assert len(ids) == len(set(ids))
