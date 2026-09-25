import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { Colors } from '../../constants/theme';
import { Lock, Mail, User, Phone } from 'lucide-react-native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        phone,
        password,
      });

      if (res.data.success) {
        Alert.alert('Success', 'Registration successful. Please verify your email.');
        router.push({
          pathname: '/auth/verify-account',
          params: { email },
        });
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 8 }}>Create Account</Text>
          <Text style={{ fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' }}>
            Join TAMILARASU ENTERPRISES today
          </Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>Full Name</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.backgroundSelected, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement }}>
            <User size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={{ flex: 1, padding: 16, color: Colors.light.text }}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.light.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>Email Address</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.backgroundSelected, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement }}>
            <Mail size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={{ flex: 1, padding: 16, color: Colors.light.text }}
              placeholder="Enter your email"
              placeholderTextColor={Colors.light.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>Phone Number</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.backgroundSelected, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement }}>
            <Phone size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={{ flex: 1, padding: 16, color: Colors.light.text }}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.light.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>Password</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.backgroundSelected, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement }}>
            <Lock size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={{ flex: 1, padding: 16, color: Colors.light.text }}
              placeholder="Create a strong password"
              placeholderTextColor={Colors.light.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading}
          style={{
            backgroundColor: Colors.light.primary,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: Colors.light.textSecondary }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={{ color: Colors.light.primary, fontWeight: 'bold' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
