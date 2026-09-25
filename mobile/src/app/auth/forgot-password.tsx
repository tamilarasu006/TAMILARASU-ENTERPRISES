import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { Colors } from '../../constants/theme';
import { Mail, KeyRound, Lock } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleRequestOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/forgot-password', { email });
      setStep(2);
      Alert.alert('OTP Sent', 'A verification code has been sent to your email.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/verify-reset-otp', { email, otp });
      setStep(3);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      Alert.alert('Success', 'Password has been reset successfully. Please login.');
      router.replace('/auth/login');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <KeyRound size={40} color={Colors.light.primary} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 8 }}>
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter OTP' : 'New Password'}
          </Text>
          <Text style={{ fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' }}>
            {step === 1 
              ? 'Enter your email address to receive a password reset code.' 
              : step === 2 
              ? `We've sent a 6-digit code to ${email}`
              : 'Create a new secure password for your account.'}
          </Text>
        </View>

        {step === 1 && (
          <View style={{ marginBottom: 32 }}>
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
        )}

        {step === 2 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8, textAlign: 'center' }}>Verification Code</Text>
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: Colors.light.backgroundSelected, 
                borderRadius: 12, 
                padding: 16, 
                backgroundColor: Colors.light.backgroundElement,
                fontSize: 24,
                letterSpacing: 8,
                textAlign: 'center',
                color: Colors.light.text,
                fontWeight: 'bold'
              }}
              placeholder="000000"
              placeholderTextColor={Colors.light.textSecondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        )}

        {step === 3 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 }}>New Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.backgroundSelected, borderRadius: 12, paddingHorizontal: 12, backgroundColor: Colors.light.backgroundElement }}>
              <Lock size={20} color={Colors.light.textSecondary} />
              <TextInput
                style={{ flex: 1, padding: 16, color: Colors.light.text }}
                placeholder="Enter new password"
                placeholderTextColor={Colors.light.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={step === 1 ? handleRequestOtp : step === 2 ? handleVerifyOtp : handleResetPassword}
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
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              {step === 1 ? 'Send Reset Code' : step === 2 ? 'Verify Code' : 'Reset Password'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.replace('/auth/login')}
          style={{ alignItems: 'center' }}
        >
          <Text style={{ color: Colors.light.textSecondary, fontWeight: '500' }}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
