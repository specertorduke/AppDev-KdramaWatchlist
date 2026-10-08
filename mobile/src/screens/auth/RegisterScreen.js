import React, { useRef, useState } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PasswordRequirementsList from '../../components/PasswordRequirementsList';
import { checkPasswordRequirements } from '../../utils/passwordRequirements';
import { userService } from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { register, sendSignupOtp } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [policyModal, setPolicyModal] = useState(null); // 'terms' | 'privacy' | null
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameStatusMsg, setUsernameStatusMsg] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailStatusMsg, setEmailStatusMsg] = useState('');
  const usernameTimerRef = useRef(null);
  const emailTimerRef = useRef(null);

  const hasTypedConfirm = Boolean(passwordConfirmation && passwordConfirmation.length > 0);
  const passwordsMatch = Boolean(hasTypedConfirm && password && password === passwordConfirmation);
  const inputTextColor = isDark ? '#F7F0F0' : colors.text;

  const handleUsernameChange = (val) => {
    const next = String(val || '');
    setUsername(next);
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: null }));
    }

    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    const trimmed = next.trim();
    if (!trimmed) {
      setUsernameStatus(null);
      setUsernameStatusMsg('');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmed)) {
      setUsernameStatus('invalid');
      setUsernameStatusMsg('3–30 chars: letters, numbers, underscores only.');
      return;
    }

    setUsernameStatus('checking');
    setUsernameStatusMsg('');
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await userService.checkAvailability('username', trimmed);
        const data = res?.data ?? res;
        const available = Boolean(data?.available);
        setUsernameStatus(available ? 'available' : 'taken');
        setUsernameStatusMsg(available ? 'Username is available.' : 'This username is already taken.');
      } catch {
        setUsernameStatus(null);
        setUsernameStatusMsg('');
      }
    }, 400);
  };

  const handleEmailChange = (val) => {
    const next = String(val || '');
    setEmail(next);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: null }));
    }

    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    const trimmed = next.trim();
    if (!trimmed) {
      setEmailStatus(null);
      setEmailStatusMsg('');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(trimmed)) {
      setEmailStatus(null);
      setEmailStatusMsg('');
      return;
    }

    setEmailStatus('checking');
    setEmailStatusMsg('');
    emailTimerRef.current = setTimeout(async () => {
      try {
        const res = await userService.checkAvailability('email', trimmed);
        const data = res?.data ?? res;
        const available = Boolean(data?.available);
        setEmailStatus(available ? 'available' : 'taken');
        setEmailStatusMsg(available ? 'Email is available.' : 'An account with this email already exists.');
      } catch {
        setEmailStatus(null);
        setEmailStatusMsg('');
      }
    }, 400);
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setFieldErrors((prev) => ({
        ...prev,
        name: ['Please enter your display name.'],
      }));
      return;
    }

    if (!trimmedUsername) {
      setFieldErrors((prev) => ({
        ...prev,
        username: ['Please enter a username.'],
      }));
      return;
    }
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setFieldErrors((prev) => ({
        ...prev,
        username: [usernameStatusMsg || 'Please fix the username before continuing.'],
      }));
      return;
    }

    if (!trimmedEmail) {
      setFieldErrors((prev) => ({
        ...prev,
        email: ['Please enter your email address.'],
      }));
      return;
    }
    if (emailStatus === 'taken') {
      setFieldErrors((prev) => ({
        ...prev,
        email: [emailStatusMsg || 'This email is already in use.'],
      }));
      return;
    }

    const { allRulesMet, isMatch } = checkPasswordRequirements(password, passwordConfirmation);
    if (!allRulesMet) {
      setFieldErrors((prev) => ({
        ...prev,
        password: ['Password must meet all complexity requirements.'],
      }));
      return;
    }
    if (!isMatch) {
      setFieldErrors((prev) => ({
        ...prev,
        password_confirmation: ['The password confirmation does not match.'],
      }));
      return;
    }

    if (!termsAccepted) {
      setFieldErrors((prev) => ({
        ...prev,
        terms_privacy_accepted: ['You must agree to the Terms and Data Privacy Policy to create an account.'],
      }));
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessNotice('');
    setFieldErrors({});

    try {
      // 1. Send OTP verification code to the email (matches web flow)
      const res = await sendSignupOtp({ email: trimmedEmail, name: trimmedName });

      // 2. Navigate to separate OtpVerification page with registrationData
      navigation.navigate('OtpVerification', {
        email: trimmedEmail,
        registrationData: {
          name: trimmedName,
          username: trimmedUsername,
          email: trimmedEmail,
          password,
          passwordConfirmation,
          terms_privacy_accepted: true,
        },
        message: res?.message || 'A 6-digit verification code has been sent to your email.',
        mode: 'signup',
      });
    } catch (err) {
      if (err?.response?.status === 429) {
        setErrorMessage('Too many attempts. Please wait a minute before requesting another code.');
      } else if (err?.response?.status === 422) {
        const errors = err.response.data?.errors || {};
        setFieldErrors(errors);
        setErrorMessage(err.response.data?.message || 'Registration failed. Please check the inputs.');
      } else {
        // Graceful handling like frontend: navigate to OtpVerification screen so user can proceed
        console.warn('sendSignupOtp encountered error or mailer delivery issue, proceeding to verification screen:', err?.message || err);
        navigation.navigate('OtpVerification', {
          email: trimmedEmail,
          registrationData: {
            name: trimmedName,
            username: trimmedUsername,
            email: trimmedEmail,
            password,
            passwordConfirmation,
            terms_privacy_accepted: true,
          },
          message: 'Verification code sent to your email (or use demo code if offline).',
          mode: 'signup',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (insets.top > 0 ? insets.top : 20) + 12,
            paddingBottom: (insets.bottom > 0 ? insets.bottom : 20) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={16} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/sarangtv-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.brand, { color: colors.pink }]}>
            SARANG<Text style={[styles.brandTv, { color: colors.pink }]}>TV</Text>
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Start your watchlist</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Create an account to begin tracking.</Text>
        </View>

        {/* Global Success Banner */}
        {successNotice ? (
          <View style={styles.alertSuccess}>
            <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
            <Text style={styles.alertSuccessText}>{successNotice}</Text>
          </View>
        ) : null}

        {/* Global Error Banner */}
        {errorMessage ? (
          <View style={styles.alertError}>
            <Ionicons name="alert-circle" size={19} color="#FFFFFF" />
            <Text style={styles.alertErrorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Container */}
        <View style={styles.form}>
          {/* Name Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg || colors.panel2, borderColor: colors.border }, fieldErrors.name && styles.inputWrapperError]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="K-Drama Fan"
                placeholderTextColor={colors.muted}
                value={name}
                maxLength={255}
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

          {/* Username Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>@Username</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg || colors.panel2, borderColor: colors.border }, fieldErrors.username && styles.inputWrapperError]}>
              <TextInput
                style={[
                  styles.input,
                  { color: inputTextColor },
                  usernameStatus === 'taken' || usernameStatus === 'invalid' ? styles.inputError : null,
                  usernameStatus === 'available' ? styles.inputSuccess : null,
                ]}
                placeholder="kdramafan2026"
                placeholderTextColor={colors.muted}
                value={username}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.pink}
                cursorColor={colors.pink}
                onChangeText={handleUsernameChange}
              />
            </View>
            {usernameStatus === 'checking' && <Text style={styles.fieldHintChecking}>Checking…</Text>}
            {usernameStatus === 'available' && <Text style={styles.fieldHintOk}>✓ {usernameStatusMsg}</Text>}
            {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <Text style={styles.fieldHintErr}>✕ {usernameStatusMsg}</Text>}
            {fieldErrors.username && (
              <Text style={styles.fieldErrorText}>{fieldErrors.username[0]}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg || colors.panel2, borderColor: colors.border }, fieldErrors.email && styles.inputWrapperError]}>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text },
                  emailStatus === 'taken' ? styles.inputError : null,
                  emailStatus === 'available' ? styles.inputSuccess : null,
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={handleEmailChange}
              />
            </View>
            {emailStatus === 'checking' && <Text style={styles.fieldHintChecking}>Checking…</Text>}
            {emailStatus === 'available' && <Text style={styles.fieldHintOk}>✓ {emailStatusMsg}</Text>}
            {emailStatus === 'taken' && <Text style={styles.fieldHintErr}>✕ {emailStatusMsg}</Text>}
            {fieldErrors.email && (
              <Text style={styles.fieldErrorText}>{fieldErrors.email[0]}</Text>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg || colors.panel2, borderColor: colors.border }, fieldErrors.password && styles.inputWrapperError]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Create a password"
                placeholderTextColor={colors.muted}
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
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={19}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            {fieldErrors.password && (
              <Text style={styles.fieldErrorText}>{fieldErrors.password[0]}</Text>
            )}

            {/* Strength meter and compact checklist directly under Password */}
            <PasswordRequirementsList password={password} />
          </View>

          {/* Confirm Password Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.inputBg || colors.panel2, borderColor: colors.border },
                fieldErrors.password_confirmation && styles.inputWrapperError,
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Repeat your password"
                placeholderTextColor={colors.muted}
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

            <View style={styles.pwdMatchWrap}>
              {hasTypedConfirm ? (
                <View style={styles.pwdMatchRow}>
                  <Ionicons
                    name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                    size={13}
                    color={passwordsMatch ? '#10B981' : '#FF7691'}
                  />
                  <Text
                    style={[
                      styles.pwdMatchText,
                      passwordsMatch ? styles.pwdMatchTextSuccess : styles.pwdMatchTextError,
                    ]}
                  >
                    {passwordsMatch ? 'Passwords match' : "Passwords don't match yet"}
                  </Text>
                </View>
              ) : (
                <Text style={styles.pwdMatchSpacer}> </Text>
              )}
            </View>
          </View>

          {/* Terms & Privacy Policy Agreement Option */}
          <View style={styles.termsGroup}>
            <View style={styles.termsRow}>
              <Pressable
                style={[
                  styles.checkbox,
                  { backgroundColor: colors.inputBg || colors.panel2, borderColor: colors.border },
                  termsAccepted && [styles.checkboxChecked, { backgroundColor: colors.pink, borderColor: colors.pink }],
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
              <Text style={[styles.termsText, { color: colors.text }]}>
                I agree to the{' '}
                <Text style={[styles.termsLink, { color: colors.pink }]} onPress={() => setPolicyModal('terms')}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={[styles.termsLink, { color: colors.pink }]} onPress={() => setPolicyModal('privacy')}>
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
            style={[styles.submitButton, { backgroundColor: colors.pink, shadowColor: colors.pink }, loading && styles.submitButtonDisabled]}
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
            <Text style={[styles.switchPrompt, { color: colors.muted }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
              <Text style={[styles.switchLink, { color: colors.pink }]}>Log in</Text>
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
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name={policyModal === 'terms' ? 'document-text-outline' : 'shield-checkmark-outline'}
                  size={20}
                  color={colors.pink}
                />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {policyModal === 'terms' ? 'Terms of Service' : 'Data Privacy Policy'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPolicyModal(null)}
                style={styles.modalCloseButton}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              <Text style={[styles.modalDate, { color: colors.muted }]}>Effective: September 2026</Text>
              {policyModal === 'terms' ? (
                <>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>1. Agreement to Terms</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    By creating a SarangTV account, you agree to these Terms of Service. SarangTV is
                    a platform for tracking, discovering, and logging your personal Korean Drama
                    viewing journey.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>2. User Account and Security</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    You are responsible for safeguarding your login credentials. Each account is
                    intended for individual use to maintain personalized watchlist data, ratings, and
                    private notes.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>3. Personal Tracking & Content</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    Your watchlist, watching statuses, ratings, and episode progress are stored for
                    personal non-commercial entertainment management. Automated scraping or abuse of
                    SarangTV services is strictly prohibited.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>4. Third-Party Metadata</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    K-Drama metadata, titles, images, and cast information are provided via The
                    Movie Database (TMDB) API and remain the intellectual property of their respective
                    creators and broadcasters.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>5. Account Termination</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    You may terminate your account at any time. Upon termination, all personal
                    watchlist entries and account records can be permanently deleted.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>1. Information We Collect</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    We collect your name, email address, and encrypted password during registration.
                    As you use the application, we store your personal watchlist items, episode
                    progress, star ratings, and personal notes.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>2. How We Use Your Information</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    Your information is used solely to provide and synchronize your watchlist across
                    sessions and devices. We never sell, rent, or monetize your personal data to
                    third parties or advertisers.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>3. Third-Party Integrations</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    SarangTV queries TMDB for drama catalog information and poster assets. No user
                    identifying details or personal data are shared with TMDB or external services.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>4. Data Security</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    We use industry-standard encryption, password hashing, and token-based
                    authentication (Laravel Sanctum) to ensure your account and watchlist data remain
                    safe and private.
                  </Text>

                  <Text style={[styles.sectionHeading, { color: colors.text }]}>5. Your Privacy Rights</Text>
                  <Text style={[styles.sectionBody, { color: colors.muted }]}>
                    You retain full control over your data. You may review, update, or permanently
                    delete your account and tracking history at any time.
                  </Text>
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalAcceptButton, { backgroundColor: colors.pink }]}
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
    color: '#ed8ea4',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 14,
  },
  brandTv: {
    color: '#eb5b78',
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
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  alertSuccessText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    flex: 1,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F87171',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  alertErrorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#B76C7E',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#36272D',
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
  fieldHintChecking: {
    color: '#9D8AAB',
    fontSize: 11.5,
    marginTop: 6,
    fontWeight: '500',
  },
  fieldHintOk: {
    color: '#10B981',
    fontSize: 11.5,
    marginTop: 6,
    fontWeight: '600',
  },
  fieldHintErr: {
    color: '#EF4444',
    fontSize: 11.5,
    marginTop: 6,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputSuccess: {
    borderColor: '#10B981',
  },
  pwdMatchWrap: {
    minHeight: 20,
    marginTop: 6,
    justifyContent: 'center',
  },
  pwdMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pwdMatchText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  pwdMatchTextSuccess: {
    color: '#10B981',
  },
  pwdMatchTextError: {
    color: '#FF7691',
  },
  pwdMatchSpacer: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0,
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
