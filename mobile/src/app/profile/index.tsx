import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/theme';
import { ArrowLeft, User, LogOut, Settings, Key, Mail, ShieldCheck } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoggedIn, updateUser } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Forms State
  const [editForm, setEditForm] = useState({
    name: '', dateOfBirth: '', gender: '', companyName: '', 
    address: '', city: '', state: '', country: '', postalCode: ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [activeTab, setActiveTab] = useState('overview'); // overview, edit, security

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth/login');
      return;
    }
    fetchProfile();
  }, [isLoggedIn]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/profile');
      const data = res.data.data;
      setProfileData(data);
      updateUser(data);
      
      setEditForm({
        name: data.name || '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        gender: data.gender || '',
        companyName: data.companyName || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postalCode: data.postalCode || ''
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      const res = await apiClient.put('/profile', editForm);
      setProfileData(res.data.data);
      updateUser(res.data.data);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    try {
      setIsSaving(true);
      await apiClient.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      Alert.alert('Success', 'Password changed successfully! Please log in again.', [
        { text: 'OK', onPress: () => {
            logout();
            router.replace('/auth/login');
          } 
        }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/auth/login');
      }}
    ]);
  };

  if (isLoading || !profileData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </SafeAreaView>
    );
  }

  const completionPercent = profileData.completion || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={20} color={Colors.light.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('overview')}
        >
          <User size={20} color={activeTab === 'overview' ? Colors.light.primary : Colors.light.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'edit' && styles.tabButtonActive]}
          onPress={() => setActiveTab('edit')}
        >
          <Settings size={20} color={activeTab === 'edit' ? Colors.light.primary : Colors.light.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'security' && styles.tabButtonActive]}
          onPress={() => setActiveTab('security')}
        >
          <ShieldCheck size={20} color={activeTab === 'security' ? Colors.light.primary : Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profileData.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
              
              <View style={styles.badgesContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{profileData.role}</Text>
                </View>
                {profileData.emailVerified && (
                  <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.badgeText, { color: '#166534' }]}>Email Verified</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.completionHeader}>
                <Text style={styles.cardTitle}>Profile Completion</Text>
                <Text style={styles.completionText}>{completionPercent}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${completionPercent}%` }]} />
              </View>
              {completionPercent < 100 && (
                <Text style={styles.hintText}>Complete your profile in the settings tab.</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'edit' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={editForm.name} onChangeText={t => setEditForm({...editForm, name: t})} />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput style={styles.input} value={editForm.companyName} onChangeText={t => setEditForm({...editForm, companyName: t})} />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput style={styles.input} value={editForm.city} onChangeText={t => setEditForm({...editForm, city: t})} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Country</Text>
                <TextInput style={styles.input} value={editForm.country} onChangeText={t => setEditForm({...editForm, country: t})} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.input} value={editForm.address} onChangeText={t => setEditForm({...editForm, address: t})} />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'security' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Key size={24} color={Colors.light.primary} style={{ marginRight: 12 }} />
                <Text style={styles.cardTitle}>Change Password</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput style={styles.input} secureTextEntry value={passwordForm.currentPassword} onChangeText={t => setPasswordForm({...passwordForm, currentPassword: t})} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput style={styles.input} secureTextEntry value={passwordForm.newPassword} onChangeText={t => setPasswordForm({...passwordForm, newPassword: t})} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput style={styles.input} secureTextEntry value={passwordForm.confirmPassword} onChangeText={t => setPasswordForm({...passwordForm, confirmPassword: t})} />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1, borderBottomColor: Colors.light.backgroundSelected,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  logoutButton: { padding: 8 },
  
  tabsContainer: {
    flexDirection: 'row', backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1, borderBottomColor: Colors.light.backgroundSelected,
  },
  tabButton: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: Colors.light.primary },
  
  content: { padding: 24, paddingBottom: 40 },
  section: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text, marginBottom: 16 },
  
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: Colors.light.text, marginBottom: 4 },
  profileEmail: { fontSize: 16, color: Colors.light.textSecondary, marginBottom: 12 },
  
  badgesContainer: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#3730a3', textTransform: 'uppercase' },
  
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.light.backgroundSelected,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  completionText: { fontSize: 16, fontWeight: 'bold', color: Colors.light.primary },
  progressBarBg: { height: 8, backgroundColor: Colors.light.backgroundSelected, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.light.primary },
  hintText: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 8 },
  
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: Colors.light.backgroundSelected,
    borderRadius: 12, padding: 14, backgroundColor: Colors.light.background,
    color: Colors.light.text, fontSize: 15,
  },
  
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
