// app/auth/login.tsx (or wherever your Login screen lives)

import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { log } from '@/src/debug/log';
import { authApiClient, userApiClient } from '@/src/services/apiClients';
import { mapGetUserResponseToRawUser, setRealCurrentUser } from '@/src/services/mockSessionUsers';
const bgPattern = require('../../assets/images/login-bg.png');

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    log.debug("Calling login function")
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);

      // 🔑 Call your API (mock/real decided by EXPO_PUBLIC_API_MODE)
      const res = await authApiClient.login({ email, password });

      // Store tokens with expiry using token manager
      const { storeTokenData } = await import('@/src/services/authTokenManager');
      const { AUTH_CONFIG } = await import('@/src/config/authConfig');
      
      // Calculate expiry timestamp (Firebase tokens last ~1 hour)
      const expiresAt = Date.now() + AUTH_CONFIG.TOKEN_EXPIRY_MS;
      
      await storeTokenData({
        idToken: res.idToken,
        refreshToken: res.refreshToken,
        expiresAt,
      });

      console.log('Logged in user:', res.user.email);

      if (process.env.EXPO_PUBLIC_API_MODE === 'real') {
        const userId = await authApiClient.getMe();
        if (userId) {
          try {
            const userRes = await userApiClient.getUser(userId);
            const rawUser = userRes?.user
              ? mapGetUserResponseToRawUser(userRes.user, userId)
              : undefined;
            setRealCurrentUser(userId, rawUser ?? undefined);
          } catch {
            setRealCurrentUser(userId);
          }
        }
      }

      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={bgPattern}
      resizeMode="repeat"
      style={styles.background}
      imageStyle={{ opacity: 0.07 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Log In</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, submitting && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('TODO: Forgot Password flow')}>
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => Alert.alert('TODO: Google Sign-In flow')}
        >
          <Text style={[styles.buttonText, { color: '#000' }]}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={[styles.link, { color: '#007bff', textAlign: 'center', marginTop: 20 }]}>
            Don’t have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#555', textAlign: 'center', marginTop: 12 },
});
