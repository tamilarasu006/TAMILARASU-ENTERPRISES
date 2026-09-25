import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiClient, { API_URL } from '../../api/client';
import { Colors } from '../../constants/theme';
import { ArrowLeft, Package, Search } from 'lucide-react-native';

const categories = ['All', 'Fruits', 'Vegetables', 'Spices', 'Grains & Pulses'];

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const categoryParam = params.category as string;
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'All');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const mapCategoryToDb = (uiCategory: string) => {
    switch (uiCategory) {
      case 'Fruits': return 'FRUIT';
      case 'Vegetables': return 'VEGETABLE';
      case 'Spices': return 'SPICE';
      case 'Grains & Pulses': return 'GRAIN';
      default: return uiCategory;
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === mapCategoryToDb(selectedCategory));

  const renderCategory = ({ item }: { item: string }) => {
    const isSelected = selectedCategory === item;
    return (
      <TouchableOpacity
        style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
        onPress={() => setSelectedCategory(item)}
      >
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }: { item: any }) => {
    const imageUrl = item.imageUrl 
      ? item.imageUrl.startsWith('/uploads') ? `${API_URL}${item.imageUrl}` : item.imageUrl
      : null;

    return (
      <View style={styles.productCard}>
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Package size={32} color={Colors.light.textSecondary} />
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Origin:</Text>
              <Text style={styles.detailValue}>{item.origin}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MOQ:</Text>
              <Text style={styles.detailValue}>{item.minimumOrderQuantity} {item.unit}</Text>
            </View>
          </View>

          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <TouchableOpacity
            style={styles.quoteButton}
            onPress={() => router.push({ pathname: '/checkout/index', params: { product: item.id } })}
          >
            <Text style={styles.quoteButtonText}>Request Quote</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products Catalog</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Category List */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Products List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={48} color={Colors.light.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>We couldn't find any products in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSelected,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  categoriesContainer: {
    paddingVertical: 12,
    backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSelected,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  categoryPillSelected: {
    backgroundColor: Colors.light.secondary,
    borderColor: Colors.light.secondary,
  },
  categoryText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    backgroundColor: Colors.light.backgroundSelected,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  quoteButton: {
    backgroundColor: Colors.light.primaryLight,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
