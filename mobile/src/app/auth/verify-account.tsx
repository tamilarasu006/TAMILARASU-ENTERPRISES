import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import apiClient from '../../api/client';
import { Colors } from '../../constants/theme';
import { ShieldCheck } from 'lucide-react-native';

export default function VerifyAccountScreen() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'Email not provided');
      router.replace('/auth/login');
      return;
    }
    handleSendOtp();
  }, [email]);

  const handleSendOtp = async () => {
    try {
      setIsSending(true);
      await apiClient.post('/auth/send-email-otp', { email });
      Alert.alert('OTP Sent', 'A verification code has been sent to your email.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post('/auth/verify-email-otp', { email, otp });

      if (res.data.success) {
        Alert.alert('Success', 'Account verified successfully. You can now login.');
        router.replace('/auth/login');
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.light.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <ShieldCheck size={40} color={Colors.light.primary} />
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 8 }}>Verify Account</Text>
          <Text style={{ fontSize: 16, color: Colors.light.textSecondary, textAlign: 'center' }}>
            We've sent a 6-digit verification code to
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginTop: 4 }}>
            {email}
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8, textAlign: 'center' }}>Enter Verification Code</Text>
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

        <TouchableOpacity
          onPress={handleVerify}
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
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Verify Account</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.light.textSecondary }}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleSendOtp} disabled={isSending}>
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={{ color: Colors.light.primary, fontWeight: 'bold' }}>Resend</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          onPress={() => router.replace('/auth/login')}
          style={{ marginTop: 32, alignItems: 'center' }}
        >
          <Text style={{ color: Colors.light.textSecondary, fontWeight: '500' }}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
