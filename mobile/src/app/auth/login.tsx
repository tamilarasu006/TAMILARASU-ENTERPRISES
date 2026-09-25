import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Colors } from '../../constants/theme';
import { Lock, Mail } from 'lucide-react-native';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please enter email/phone and password');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/login', {
        email: identifier,
        password,
      });

      if (res.data.success) {
        await login(res.data.data.user, res.data.data.token);
        router.replace('/');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 8 }}>Welcome Back</Text>
          <Text style={{ fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' }}>
            Login to your TAMILARASU ENTERPRISES account
          </Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>Email or Phone Number</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.backgroundSelected, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement }}>
            <Mail size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={{ flex: 1, padding: 16, color: Colors.light.text }}
              placeholder="Enter your email or phone"
              placeholderTextColor={Colors.light.textSecondary}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>Password</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.backgroundSelected, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement }}>
            <Lock size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={{ flex: 1, padding: 16, color: Colors.light.text }}
              placeholder="Enter your password"
              placeholderTextColor={Colors.light.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.push('/auth/forgot-password')}
          style={{ alignItems: 'flex-end', marginBottom: 24 }}
        >
          <Text style={{ color: Colors.light.primary, fontWeight: '600' }}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
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
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: Colors.light.textSecondary }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={{ color: Colors.light.primary, fontWeight: 'bold' }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
