import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    setFieldErrors({});

    try {
      // Backend handles validation (422)
      await login(email, password);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422) {
          const data = err.response.data;
          setErrorMessage(data.message || 'Validation failed.');
          setFieldErrors(data.errors || {});
        } else {
          setErrorMessage(
            err.response.data?.message || 'Invalid credentials. Please try again.'
          );
        }
      } else {
        setErrorMessage('Cannot connect to the backend server. Please ensure the API is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>SARANGTV</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to your watchlist.</Text>
        </View>

        {/* Global Error Banner */}
        {errorMessage ? (
          <View style={styles.alertError}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.alertErrorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Container */}
        <View style={styles.form}>
          {/* Email Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, fieldErrors.email && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#5A5866"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
              />
            </View>
            {fieldErrors.email && (
              <Text style={styles.fieldErrorText}>{fieldErrors.email[0]}</Text>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, fieldErrors.password && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#5A5866"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                }}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={19}
                  color="#716C77"
                />
              </Pressable>
            </View>
            {fieldErrors.password && (
              <Text style={styles.fieldErrorText}>{fieldErrors.password[0]}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Logging In...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* Switch Prompt */}
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} hitSlop={8}>
              <Text style={styles.switchLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brand: {
    color: '#EB5B78',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  title: {
    color: '#F7F0F0',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: '#8D8B98',
    fontSize: 14,
    fontWeight: '500',
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  alertErrorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    width: '100%',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: '#C5C1CC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#242330',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    color: '#F7F0F0',
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#EB5B78',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#EB5B78',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchPrompt: {
    color: '#716C77',
    fontSize: 14,
  },
  switchLink: {
    color: '#EB5B78',
    fontSize: 14,
    fontWeight: '700',
  },
});
