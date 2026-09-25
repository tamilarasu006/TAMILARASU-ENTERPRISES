import React from 'react';
import { View, Text, ScrollView, Image, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import { ArrowLeft, Target, Eye, Globe } from 'lucide-react-native';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80' }} style={styles.heroImage} />
        
        <View style={styles.card}>
          <Text style={styles.title}>TAMILARASU ENTERPRISES</Text>
          <Text style={styles.description}>
            We are a premier agricultural export company based in Tamil Nadu, India. 
            We specialize in sourcing the highest quality fruits, vegetables, spices, and grains 
            directly from local farmers and delivering them to international markets.
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={styles.iconContainer}>
              <Target size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.gridTitle}>Our Mission</Text>
            <Text style={styles.gridText}>To provide global markets with the finest Indian agricultural produce while empowering local farmers.</Text>
          </View>
          
          <View style={styles.gridItem}>
            <View style={styles.iconContainer}>
              <Eye size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.gridTitle}>Our Vision</Text>
            <Text style={styles.gridText}>To become the most trusted name in Indian agricultural exports globally.</Text>
          </View>
          
          <View style={styles.gridItem}>
            <View style={styles.iconContainer}>
              <Globe size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.gridTitle}>Global Reach</Text>
            <Text style={styles.gridText}>We currently export to the Middle East, Europe, Southeast Asia, and North America.</Text>
          </View>
        </View>
      </ScrollView>
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
  content: { paddingBottom: 40 },
  heroImage: { width: '100%', height: 200, resizeMode: 'cover' },
  card: {
    backgroundColor: Colors.light.backgroundElement,
    margin: 16, padding: 24, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginTop: -30,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 15, color: Colors.light.textSecondary, lineHeight: 22, textAlign: 'center' },
  grid: { padding: 16 },
  gridItem: {
    backgroundColor: Colors.light.backgroundElement,
    padding: 20, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.light.backgroundSelected,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  gridTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text, marginBottom: 8 },
  gridText: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 20 },
});
