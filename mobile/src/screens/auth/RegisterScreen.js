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
  Image,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage('');
    setFieldErrors({});

    try {
      // Backend handles validation rules
      await register(name, email, password, passwordConfirmation, rememberMe);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422) {
          const data = err.response.data;
          setErrorMessage(data.message || 'Registration failed.');
          setFieldErrors(data.errors || {});
        } else {
          setErrorMessage(
            err.response.data?.message || 'Registration failed. Please check inputs.'
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
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={16} color="#8D8B98" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/sarangtv-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brand}>SARANGTV</Text>
          <Text style={styles.title}>Start your watchlist</Text>
          <Text style={styles.subtitle}>Create an account to begin tracking.</Text>
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
          {/* Name Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <View style={[styles.inputWrapper, fieldErrors.name && styles.inputWrapperError]}>
              <TextInput
                style={styles.input}
                placeholder="DramaFan2026"
                placeholderTextColor="#5A5866"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                }}
              />
            </View>
            {fieldErrors.name && (
              <Text style={styles.fieldErrorText}>{fieldErrors.name[0]}</Text>
            )}
          </View>

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
                placeholder="Min. 8 characters"
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

          {/* Confirm Password Field */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <View
              style={[
                styles.inputWrapper,
                fieldErrors.password_confirmation && styles.inputWrapperError,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor="#5A5866"
                secureTextEntry={!showPassword}
                value={passwordConfirmation}
                onChangeText={(val) => {
                  setPasswordConfirmation(val);
                  if (fieldErrors.password_confirmation) {
                    setFieldErrors((prev) => ({ ...prev, password_confirmation: null }));
                  }
                }}
              />
            </View>
            {fieldErrors.password_confirmation && (
              <Text style={styles.fieldErrorText}>{fieldErrors.password_confirmation[0]}</Text>
            )}
          </View>

          {/* Remember Profile Option */}
          <Pressable
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.rememberText}>Save login as a profile</Text>
          </Pressable>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Creating Account...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Switch Prompt */}
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
              <Text style={styles.switchLink}>Log in</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#8D8B98',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  brand: {
    color: '#F5A9C4',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 14,
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
    marginBottom: 16,
  },
  label: {
    color: '#C5C1CC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#242330',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#3D3C4E',
    backgroundColor: '#12121A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EB5B78',
    borderColor: '#EB5B78',
  },
  rememberText: {
    color: '#D7D4DC',
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#EB5B78',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
    marginTop: 22,
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
