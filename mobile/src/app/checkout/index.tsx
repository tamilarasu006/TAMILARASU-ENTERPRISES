import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient, { API_URL } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';
import { ArrowLeft, Send, ShieldCheck, Package } from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const { product: productId } = useLocalSearchParams<{ product: string }>();
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'You must be logged in to request a quote.');
      router.replace('/auth/login');
      return;
    }

    if (productId) {
      fetchProductDetails();
    } else {
      Alert.alert('Error', 'No product selected.');
      router.back();
    }
  }, [productId, isLoggedIn]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/products/${productId}`);
      setProduct(res.data.data);
      setQuantity(res.data.data.minimumOrderQuantity.toString());
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load product details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty < product.minimumOrderQuantity) {
      Alert.alert('Error', `Minimum order quantity is ${product.minimumOrderQuantity} ${product.unit}`);
      return;
    }
    if (!company || !country) {
      Alert.alert('Error', 'Company name and destination country are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        items: [{ productId: product.id, quantity: qty, price: product.price }],
        shippingAddress: 'TBD',
        billingAddress: 'TBD',
        company,
        country,
        message,
        preferredDeliveryDate,
      };

      const res = await apiClient.post('/orders', payload);
      
      Alert.alert(
        'Request Received', 
        `Your reference number is ${res.data.data.orderNumber}. Our team will review your request.`,
        [{ text: 'OK', onPress: () => router.replace('/orders/index') }]
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert('Submission Failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={{ marginTop: 16, color: Colors.light.textSecondary }}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  const imageUrl = product.imageUrl 
    ? product.imageUrl.startsWith('/uploads') ? `${API_URL}${product.imageUrl}` : product.imageUrl
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Quote</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Details Card */}
        <View style={styles.productCard}>
          <Text style={styles.cardSectionTitle}>Inquiry Details</Text>
          
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Package size={40} color={Colors.light.textSecondary} />
              </View>
            )}
          </View>
          
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{product.category}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Origin</Text>
            <Text style={styles.detailValue}>{product.origin}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Minimum Order</Text>
            <Text style={[styles.detailValue, { color: Colors.light.secondary }]}>{product.minimumOrderQuantity} {product.unit}</Text>
          </View>

          <View style={styles.infoBox}>
            <ShieldCheck size={20} color={Colors.light.primary} style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.infoBoxText}>
              This is a B2B inquiry. No payment is required at this stage. Our team will review your request and send a formal quotation.
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Company Ltd"
              placeholderTextColor={Colors.light.textMuted}
              value={company}
              onChangeText={setCompany}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination Country *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. United Arab Emirates"
              placeholderTextColor={Colors.light.textMuted}
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Required Quantity ({product.unit}) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Delivery Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.light.textMuted}
              value={preferredDeliveryDate}
              onChangeText={setPreferredDeliveryDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Requirements (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Specific packaging requirements, certifications needed, etc."
              placeholderTextColor={Colors.light.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Inquiry Request</Text>
                <Send size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primaryLight,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 8,
  },
  imageContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoBoxText: {
    flex: 1,
    color: Colors.light.primaryLight,
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
    fontSize: 15,
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
