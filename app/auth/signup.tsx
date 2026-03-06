// app/auth/Signup.tsx
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/src/context/AuthContext';
import { log } from '@/src/debug/log';
import { authApiClient as apiClient, userApiClient } from '@/src/services/apiClients';
import { mapGetUserResponseToRawUser, setRealCurrentUser } from '@/src/services/mockSessionUsers';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const bgPattern = require('../../assets/images/login-bg.png');

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();

  const handleSignup = async () => {
    log.debug("Handling Signup")
    // 🔎 fast, presentation-only preflight checks (server still enforces real rules)
    const trimmedEmail = email.trim().toLowerCase();

    const trimmedName = name.trim();
    if (!trimmedEmail || !password || !confirmPassword || !trimmedName) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    // very light email sanity (API still validates with EmailStr)
    const looksLikeEmail = /\S+@\S+\.\S+/.test(trimmedEmail);
    if (!looksLikeEmail) {
      Alert.alert('Error', 'Please enter a valid email.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    // ✅ call API (or mock, based on EXPO_PUBLIC_USE_MOCKS)
    try {
      setLoading(true);
      const resp = await apiClient.signup({
        email: trimmedEmail,
        password,
        confirmPassword,
        name: trimmedName,
      });

      // Required null check: fail fast on backend regression
      if (!resp?.idToken || !resp?.refreshToken) {
        throw new Error('Invalid signup response');
      }

      // Save auth in context (works for mock and real API)
      setAuth({
        idToken: resp.idToken,
        refreshToken: resp.refreshToken,
        user: resp?.user ?? { uid: 'mock-uid', email: trimmedEmail },
      });

      // Store tokens with expiry using token manager
      const { storeTokenData } = await import('@/src/services/authTokenManager');
      const { AUTH_CONFIG } = await import('@/src/config/authConfig');

      // Calculate expiry timestamp (Firebase tokens last ~1 hour)
      const expiresAt = Date.now() + AUTH_CONFIG.TOKEN_EXPIRY_MS;

      await storeTokenData({
        idToken: resp.idToken,
        refreshToken: resp.refreshToken,
        expiresAt,
      });

      if (process.env.EXPO_PUBLIC_API_MODE === 'real') {
        const userId = await apiClient.getMe();
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

      router.replace('/survey');
    } catch (e: any) {
      Alert.alert('Signup Failed', e?.message || 'Signup failed.');
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          style={styles.input}
        />

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

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.8 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating…' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => Alert.alert('TODO: Google Sign-Up flow')}
        >
          <Text style={[styles.buttonText, { color: '#000' }]}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={[styles.link, { color: '#007bff', marginTop: 20 }]}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
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
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
  },
});
