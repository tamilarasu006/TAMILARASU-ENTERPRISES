import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';
import { ArrowRight, Globe, ShieldCheck, LogIn, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo-1.jpg')} style={styles.logo} />
          <Text style={styles.headerTitle}>TAMILARASU</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerRight}
          onPress={() => router.push(isLoggedIn ? '/profile/index' : '/auth/login')}
        >
          {isLoggedIn ? (
            <User size={24} color={Colors.light.primary} />
          ) : (
            <LogIn size={24} color={Colors.light.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Premium Fresh Produce Export</Text>
          </View>
          <Text style={styles.heroTitle}>Connecting Quality Products to Global Markets</Text>
          <Text style={styles.heroSubtitle}>
            Reliable Import & Export solutions connecting India's agricultural heartland with international markets.
          </Text>
          
          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/products/index')}
            >
              <Text style={styles.primaryButtonText}>Explore Products</Text>
              <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Global Footprint */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={28} color={Colors.light.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Global Footprint</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>From India to the World</Text>
            <Text style={styles.cardText}>
              We have established a robust logistics network connecting South Indian farms directly to major global hubs.
            </Text>
            
            {['Middle East', 'Europe', 'Southeast Asia', 'North America & Australia'].map((region, index) => (
              <View key={index} style={styles.listItem}>
                <ShieldCheck size={20} color={Colors.light.secondary} />
                <Text style={styles.listItemText}>{region}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Categories Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 24 }]}>Premium Products</Text>
          <View style={styles.gridContainer}>
            {[
              { name: 'Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80' },
              { name: 'Vegetables', image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=400&q=80' },
              { name: 'Spices', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
              { name: 'Grains & Pulses', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80' }
            ].map((cat) => (
              <TouchableOpacity 
                key={cat.name} 
                style={styles.gridItem}
                onPress={() => router.push({ pathname: '/products/index', params: { category: cat.name }})}
              >
                <Image source={{ uri: cat.image }} style={styles.gridImage} />
                <View style={styles.gridOverlay}>
                  <Text style={styles.gridText}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.outlineButton}
            onPress={() => router.push('/products/index')}
          >
            <Text style={styles.outlineButtonText}>View All Products</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Quick Links</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/about')} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/services')} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>Services</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(isLoggedIn ? '/orders/index' : '/auth/login')} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>My Orders</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copyright}>© 2026 Tamilarasu Enterprises</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  headerRight: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    padding: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    paddingVertical: 48,
  },
  badgeContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  heroButtons: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.secondary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listItemText: {
    marginLeft: 12,
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 48 - 16) / 2, // padding 24 on each side = 48, plus 16 gap
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.backgroundSelected,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  gridText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  outlineButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: Colors.light.primary,
    padding: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  footerTitle: {
    color: '#bfdbfe',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  footerLink: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  footerLinkText: {
    color: '#ffffff',
    fontSize: 15,
  },
  copyright: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});