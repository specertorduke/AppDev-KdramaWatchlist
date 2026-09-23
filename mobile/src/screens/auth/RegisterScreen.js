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
  Modal,
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policyModal, setPolicyModal] = useState(null); // 'terms' | 'privacy' | null
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleRegister = async () => {
    if (!termsAccepted) {
      setFieldErrors((prev) => ({
        ...prev,
        terms_privacy_accepted: ['You must agree to the Terms and Data Privacy Policy to create an account.'],
      }));
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setFieldErrors({});

    try {
      // Backend handles validation rules
      await register(name, email, password, passwordConfirmation, rememberMe, termsAccepted);
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
        setErrorMessage(
          err.friendlyMessage || 'Unable to connect. Please check your internet connection and try again.'
        );
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

          {/* Terms & Privacy Policy Agreement Option */}
          <View style={styles.termsGroup}>
            <View style={styles.termsRow}>
              <Pressable
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxChecked,
                  fieldErrors.terms_privacy_accepted && styles.checkboxError,
                ]}
                onPress={() => {
                  const nextVal = !termsAccepted;
                  setTermsAccepted(nextVal);
                  if (nextVal && fieldErrors.terms_privacy_accepted) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.terms_privacy_accepted;
                      return updated;
                    });
                  }
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
              >
                {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </Pressable>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => setPolicyModal('terms')}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={styles.termsLink} onPress={() => setPolicyModal('privacy')}>
                  Data Privacy Policy
                </Text>
              </Text>
            </View>
            {fieldErrors.terms_privacy_accepted && (
              <Text style={styles.fieldErrorText}>
                {fieldErrors.terms_privacy_accepted[0]}
              </Text>
            )}
          </View>

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

      {/* Terms & Privacy Policy Modal */}
      <Modal
        visible={policyModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPolicyModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name={policyModal === 'terms' ? 'document-text-outline' : 'shield-checkmark-outline'}
                  size={20}
                  color="#EB5B78"
                />
                <Text style={styles.modalTitle}>
                  {policyModal === 'terms' ? 'Terms of Service' : 'Data Privacy Policy'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPolicyModal(null)}
                style={styles.modalCloseButton}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color="#8D8B98" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalDate}>Effective: September 2026</Text>
              {policyModal === 'terms' ? (
                <>
                  <Text style={styles.sectionHeading}>1. Agreement to Terms</Text>
                  <Text style={styles.sectionBody}>
                    By creating a SarangTV account, you agree to these Terms of Service. SarangTV is
                    a platform for tracking, discovering, and logging your personal Korean Drama
                    viewing journey.
                  </Text>

                  <Text style={styles.sectionHeading}>2. User Account and Security</Text>
                  <Text style={styles.sectionBody}>
                    You are responsible for safeguarding your login credentials. Each account is
                    intended for individual use to maintain personalized watchlist data, ratings, and
                    private notes.
                  </Text>

                  <Text style={styles.sectionHeading}>3. Personal Tracking & Content</Text>
                  <Text style={styles.sectionBody}>
                    Your watchlist, watching statuses, ratings, and episode progress are stored for
                    personal non-commercial entertainment management. Automated scraping or abuse of
                    SarangTV services is strictly prohibited.
                  </Text>

                  <Text style={styles.sectionHeading}>4. Third-Party Metadata</Text>
                  <Text style={styles.sectionBody}>
                    K-Drama metadata, titles, images, and cast information are provided via The
                    Movie Database (TMDB) API and remain the intellectual property of their respective
                    creators and broadcasters.
                  </Text>

                  <Text style={styles.sectionHeading}>5. Account Termination</Text>
                  <Text style={styles.sectionBody}>
                    You may terminate your account at any time. Upon termination, all personal
                    watchlist entries and account records can be permanently deleted.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.sectionHeading}>1. Information We Collect</Text>
                  <Text style={styles.sectionBody}>
                    We collect your name, email address, and encrypted password during registration.
                    As you use the application, we store your personal watchlist items, episode
                    progress, star ratings, and personal notes.
                  </Text>

                  <Text style={styles.sectionHeading}>2. How We Use Your Information</Text>
                  <Text style={styles.sectionBody}>
                    Your information is used solely to provide and synchronize your watchlist across
                    sessions and devices. We never sell, rent, or monetize your personal data to
                    third parties or advertisers.
                  </Text>

                  <Text style={styles.sectionHeading}>3. Third-Party Integrations</Text>
                  <Text style={styles.sectionBody}>
                    SarangTV queries TMDB for drama catalog information and poster assets. No user
                    identifying details or personal data are shared with TMDB or external services.
                  </Text>

                  <Text style={styles.sectionHeading}>4. Data Security</Text>
                  <Text style={styles.sectionBody}>
                    We use industry-standard encryption, password hashing, and token-based
                    authentication (Laravel Sanctum) to ensure your account and watchlist data remain
                    safe and private.
                  </Text>

                  <Text style={styles.sectionHeading}>5. Your Privacy Rights</Text>
                  <Text style={styles.sectionBody}>
                    You retain full control over your data. You may review, update, or permanently
                    delete your account and tracking history at any time.
                  </Text>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalAcceptButton}
                onPress={() => {
                  setTermsAccepted(true);
                  if (fieldErrors.terms_privacy_accepted) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.terms_privacy_accepted;
                      return updated;
                    });
                  }
                  setPolicyModal(null);
                }}
              >
                <Text style={styles.modalAcceptButtonText}>I Understand & Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 14,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  termsGroup: {
    marginBottom: 20,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  termsText: {
    flex: 1,
    color: '#D7D4DC',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  termsLink: {
    color: '#EB5B78',
    fontWeight: '700',
    textDecorationLine: 'underline',
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
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#EB5B78',
    borderColor: '#EB5B78',
  },
  checkboxError: {
    borderColor: '#EF4444',
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
  /* Policy Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    marginVertical: 14,
  },
  modalDate: {
    color: '#8D8B98',
    fontSize: 12,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  sectionBody: {
    color: '#B0ADC0',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalAcceptButton: {
    backgroundColor: '#EB5B78',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalAcceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
