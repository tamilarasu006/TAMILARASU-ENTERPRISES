import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../api/client';
import { Colors } from '../constants/theme';
import { ArrowLeft, Box, CheckCircle } from 'lucide-react-native';

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/services');
      setServices(res.data.data);
    } catch (err) {
      console.error('Error fetching services', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderService = ({ item }: { item: any }) => {
    const highlights = item.highlights ? item.highlights.split(',') : [];

    return (
      <View style={styles.serviceCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Box size={24} color={Colors.light.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>{item.title}</Text>
            <Text style={styles.serviceCategory}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.serviceDescription}>{item.description}</Text>
        
        {highlights.length > 0 && (
          <View style={styles.highlightsContainer}>
            {highlights.map((h: string, idx: number) => (
              <View key={idx} style={styles.highlightItem}>
                <CheckCircle size={16} color={Colors.light.secondary} style={{ marginRight: 8 }} />
                <Text style={styles.highlightText}>{h.trim()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Services</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  serviceCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.light.backgroundSelected,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  serviceTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  serviceCategory: { fontSize: 14, color: Colors.light.secondary, fontWeight: '600', marginTop: 4 },
  serviceDescription: { fontSize: 15, color: Colors.light.textSecondary, lineHeight: 22, marginBottom: 16 },
  highlightsContainer: { backgroundColor: Colors.light.background, padding: 16, borderRadius: 12 },
  highlightItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  highlightText: { fontSize: 14, color: Colors.light.text, flex: 1 },
});
