import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { Colors } from '../../constants/theme';
import { X, CheckCircle } from 'lucide-react-native';

export default function ScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<any>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    try {
      const res = await apiClient.get(`/orders/qr/${data}`);
      setScannedOrder(res.data.data);
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        'Scan Error',
        err.response?.data?.message || 'Failed to retrieve order',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Requesting for camera permission...</Text>
      </SafeAreaView>
    );
  }
  
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Order QR Code</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {!scannedOrder ? (
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Point your camera at the order QR code.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <View style={styles.successIcon}>
              <CheckCircle size={24} color={Colors.light.secondary} />
            </View>
            <Text style={styles.resultTitle}>Order Found</Text>
          </View>
          
          <View style={styles.resultDetails}>
            <Text style={styles.detailRow}><Text style={styles.bold}>Order Number:</Text> {scannedOrder.orderNumber}</Text>
            <Text style={styles.detailRow}><Text style={styles.bold}>Status:</Text> {scannedOrder.status}</Text>
            <Text style={styles.detailRow}><Text style={styles.bold}>Total Amount:</Text> ${scannedOrder.totalAmount}</Text>
            <Text style={styles.detailRow}><Text style={styles.bold}>Date:</Text> {new Date(scannedOrder.createdAt).toLocaleDateString()}</Text>
            
            <Text style={[styles.bold, { marginTop: 12, marginBottom: 4 }]}>Items:</Text>
            {scannedOrder.orderItems.map((item: any) => (
              <Text key={item.id} style={styles.itemRow}>• {item.product.name} (x{item.quantity})</Text>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.scanAgainButton}
            onPress={() => {
              setScannedOrder(null);
              setScanned(false);
            }}
          >
            <Text style={styles.scanAgainText}>Scan Another Code</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  text: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSelected,
    backgroundColor: Colors.light.backgroundElement,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    margin: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  scanHint: {
    color: '#fff',
    marginTop: 24,
    fontSize: 14,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    padding: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#166534',
  },
  resultDetails: {
    backgroundColor: Colors.light.backgroundElement,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  detailRow: {
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  itemRow: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    marginLeft: 8,
  },
  scanAgainButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  scanAgainText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
