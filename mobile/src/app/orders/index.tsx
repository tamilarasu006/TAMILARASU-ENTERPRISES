import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';
import { ArrowLeft, ScanLine, QrCode, X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

export default function OrdersScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedQR, setSelectedQR] = useState<any>(null); // Order object for QR display

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth/login');
      return;
    }
    fetchOrders();
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/orders/my-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmOrder = async (orderId: string) => {
    try {
      await apiClient.put(`/orders/${orderId}/confirm`);
      Alert.alert('Success', 'Order Confirmed!');
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to confirm order');
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <View style={[styles.statusBadge, item.status === 'QUOTED' ? styles.statusQuoted : styles.statusPending]}>
            <Text style={[styles.statusText, item.status === 'QUOTED' ? styles.statusTextQuoted : styles.statusTextPending]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>Requested on: {new Date(item.createdAt).toLocaleDateString()}</Text>

        <View style={styles.itemsList}>
          {item.orderItems.map((oi: any) => (
            <Text key={oi.id} style={styles.itemText}>
              • {oi.product.name} (Qty: {oi.quantity})
            </Text>
          ))}
        </View>

        {item.quotedAmount && (
          <Text style={styles.quoteText}>Quote: ${item.quotedAmount}</Text>
        )}

        <View style={styles.actionsContainer}>
          {item.qrToken && (
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setSelectedQR(item)}
            >
              <QrCode size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.qrButtonText}>QR</Text>
            </TouchableOpacity>
          )}

          {item.status === 'QUOTED' && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => confirmOrder(item.id)}
            >
              <Text style={styles.confirmButtonText}>Confirm Quote</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity onPress={() => router.push('/orders/scanner')} style={styles.scanButton}>
          <ScanLine size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={fetchOrders}
        />
      )}

      {/* QR Code Modal */}
      <Modal
        visible={!!selectedQR}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedQR(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedQR(null)}
            >
              <X size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Order QR Code</Text>
            <Text style={styles.modalSubtitle}>Order: {selectedQR?.orderNumber}</Text>
            
            <View style={styles.qrContainer}>
              {selectedQR?.qrToken && (
                <QRCode value={selectedQR.qrToken} size={200} />
              )}
            </View>
            
            <Text style={styles.modalHint}>Scan this code to quickly retrieve order details securely.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1, borderBottomColor: Colors.light.backgroundSelected,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  scanButton: {
    backgroundColor: Colors.light.primary,
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, color: Colors.light.textSecondary },
  listContent: { padding: 16 },
  
  orderCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.light.backgroundSelected,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  orderNumber: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPending: { backgroundColor: '#fef3c7' },
  statusQuoted: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusTextPending: { color: '#92400e' },
  statusTextQuoted: { color: '#166534' },
  dateText: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 12 },
  itemsList: { marginBottom: 16 },
  itemText: { fontSize: 14, color: Colors.light.text, marginBottom: 4 },
  quoteText: { fontSize: 18, fontWeight: 'bold', color: Colors.light.secondary, marginBottom: 16 },
  
  actionsContainer: {
    flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8,
  },
  qrButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.text,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8,
  },
  qrButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  confirmButton: {
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 8,
  },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16, padding: 24, width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  closeButton: { position: 'absolute', top: 16, right: 16, padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text, marginBottom: 8, marginTop: 8 },
  modalSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 24 },
  qrContainer: {
    padding: 16, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.light.backgroundSelected,
    marginBottom: 24,
  },
  modalHint: { fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center' },
});
