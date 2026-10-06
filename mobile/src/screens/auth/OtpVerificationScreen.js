import React, { useState, useEffect, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function OtpVerificationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { verifyOtp, resendOtp, sendSignupOtp, register } = useAuth();

  const initialEmail = route?.params?.email || '';
  const initialNotice = route?.params?.message || 'A 6-digit verification code has been sent to your email.';
  const rememberMe = route?.params?.rememberMe ?? true;
  const mode = route?.params?.mode || 'signup';
  const registrationData = route?.params?.registrationData || null;

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [emailInput, setEmailInput] = useState(initialEmail);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(initialNotice);
  const [isExpiredOrInvalidated, setIsExpiredOrInvalidated] = useState(false);

  const masterInputRef = useRef(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus master input on mount
  useEffect(() => {
    if (!isEditingEmail && masterInputRef.current) {
      const timer = setTimeout(() => {
        masterInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEditingEmail]);

  const handleOtpChange = (val) => {
    // Only accept numbers up to 6 digits
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 6);
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < cleaned.length; i++) {
      updated[i] = cleaned[i];
    }
    setOtp(updated);

    if (errorMessage) {
      setErrorMessage('');
    }

    // Auto verify if all 6 digits entered
    if (cleaned.length === 6) {
      setTimeout(() => {
        handleVerifyWithCode(cleaned);
      }, 100);
    }
  };

  const handleResend = async () => {
    const targetEmail = (email || emailInput || '').trim();
    if (!targetEmail) {
      setErrorMessage('Please provide an email address.');
      setIsEditingEmail(true);
      return;
    }

    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');
    setIsExpiredOrInvalidated(false);

    try {
      let result;
      if (mode === 'signup') {
        result = await sendSignupOtp({ email: targetEmail, name: registrationData?.name });
      } else {
        result = await resendOtp({ email: targetEmail });
      }
      setSuccessMessage(result?.message || 'A fresh verification code has been sent to your email.');
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      masterInputRef.current?.focus();
    } catch (err) {
      if (err?.response?.status === 429) {
        setErrorMessage('Too many attempts. Please wait a minute before requesting another code.');
      } else if (err?.response?.status === 422) {
        const errorMsg =
          err.response.data?.errors?.email?.[0] ||
          err.response.data?.message ||
          'Unable to resend verification code.';
        setErrorMessage(errorMsg);
      } else {
        setErrorMessage(
          err.friendlyMessage || err.response?.data?.message || 'Network error. Please verify your connection and try again.'
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyWithCode = async (codeToVerify) => {
    const targetEmail = (email || emailInput || '').trim();
    if (!targetEmail) {
      setErrorMessage('Please provide your email address.');
      setIsEditingEmail(true);
      return;
    }

    const otpCode = (codeToVerify || otp.join('')).trim();
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setErrorMessage('Please enter all 6 numeric digits of your verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setIsExpiredOrInvalidated(false);

    try {
      if (mode === 'signup' && registrationData) {
        await register(
          registrationData.name,
          targetEmail,
          registrationData.password,
          registrationData.passwordConfirmation || registrationData.password_confirmation,
          registrationData.terms_privacy_accepted ?? true,
          otpCode
        );
      } else {
        await verifyOtp({
          email: targetEmail,
          otp: otpCode,
          rememberMe,
          deviceName: Platform.OS === 'ios' ? 'iOS App' : Platform.OS === 'android' ? 'Android App' : 'Mobile App',
        });
      }
    } catch (err) {
      if (err?.response?.status === 429) {
        setErrorMessage('Too many invalid attempts. Please wait before trying again.');
      } else if (err?.response?.status === 422) {
        const otpError = err.response.data?.errors?.otp?.[0];
        const generalMsg = err.response.data?.message || 'Verification failed. Please check the code.';
        const activeError = otpError || generalMsg;
        setErrorMessage(activeError);

        if (
          activeError.toLowerCase().includes('expired') ||
          activeError.toLowerCase().includes('invalidated') ||
          activeError.toLowerCase().includes('request a new one')
        ) {
          setIsExpiredOrInvalidated(true);
        }
      } else if (err?.response?.status === 404) {
        setErrorMessage('No account was found with this email.');
      } else {
        setErrorMessage(
          err.response?.data?.message || err.friendlyMessage || 'Unable to connect. Please check your internet connection and try again.'
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    handleVerifyWithCode(otp.join(''));
  };

  const handleSaveEmail = async () => {
    const newEmail = emailInput.trim();
    if (newEmail && newEmail !== email) {
      setEmail(newEmail);
      setIsEditingEmail(false);
      setErrorMessage('');
      setSuccessMessage('');
      if (mode === 'signup') {
        setIsResending(true);
        try {
          const res = await sendSignupOtp({ email: newEmail, name: registrationData?.name });
          setSuccessMessage(res?.message || `A verification code was sent to ${newEmail}`);
          setCooldown(60);
          setOtp(['', '', '', '', '', '']);
          masterInputRef.current?.focus();
        } catch (err) {
          setErrorMessage(err.response?.data?.message || 'Failed to send code to new email.');
        } finally {
          setIsResending(false);
        }
      }
    } else {
      setIsEditingEmail(false);
    }
  };

  const isFullCode = otp.every((d) => d !== '');

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
            paddingBottom: (insets.bottom > 0 ? insets.bottom : 20) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation?.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(mode === 'login' ? 'Login' : 'Register');
            }
          }}
          disabled={isVerifying}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={16} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>
            {mode === 'login' ? 'Back to Log In' : 'Back to Sign Up'}
          </Text>
        </TouchableOpacity>

        {/* Header Icon & Title */}
        <View style={styles.header}>
          <View style={[styles.iconBubble, { backgroundColor: isDark ? 'rgba(235, 91, 120, 0.12)' : 'rgba(235, 91, 120, 0.10)', borderColor: colors.pink }]}>
            <Ionicons name="key-outline" size={28} color={colors.pink} />
          </View>
          <Text style={[styles.brand, { color: colors.pink }]}>
            SARANG<Text style={[styles.brandTv, { color: colors.pink }]}>TV</Text>
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Enter Verification Code</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>We sent a 6-digit verification code to:</Text>

          {/* Email Badge / Edit Form */}
          {isEditingEmail ? (
            <View style={styles.emailEditContainer}>
              <TextInput
                style={[styles.emailInput, { backgroundColor: colors.inputBg || colors.panel2, borderColor: colors.border, color: colors.text }]}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter email address"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity style={[styles.emailSaveButton, { backgroundColor: colors.pink }]} onPress={handleSaveEmail}>
                <Text style={styles.emailSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.emailBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={14} color={colors.pink} style={styles.mailIcon} />
              <Text style={[styles.emailBadgeText, { color: colors.text }]} numberOfLines={1}>
                {email}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEmailInput(email);
                  setIsEditingEmail(true);
                }}
                hitSlop={8}
                style={[styles.changeEmailButton, { borderLeftColor: colors.border }]}
              >
                <Ionicons name="pencil" size={12} color={colors.pink} />
                <Text style={[styles.changeEmailText, { color: colors.pink }]}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Success Alert */}
        {successMessage ? (
          <View style={styles.alertSuccess}>
            <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
            <Text style={styles.alertSuccessText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.alertError}>
            <Ionicons name="alert-circle" size={19} color="#FFFFFF" />
            <View style={styles.alertErrorContent}>
              <Text style={styles.alertErrorText}>{errorMessage}</Text>
              {isExpiredOrInvalidated && (
                <TouchableOpacity
                  style={styles.alertActionBtn}
                  onPress={handleResend}
                  disabled={cooldown > 0 || isResending}
                >
                  <Text style={styles.alertActionText}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Request New Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}

        {/* 6-Digit OTP Visual Boxes & Hidden Master Input */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => masterInputRef.current?.focus()}
          style={styles.otpGridWrapper}
        >
          <View style={styles.otpGrid}>
            {otp.map((digit, idx) => {
              const isCurrent = idx === Math.min(otp.filter(Boolean).length, 5) && !digit;
              return (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    digit ? [styles.otpBoxFilled, { borderColor: colors.pink, backgroundColor: isDark ? 'rgba(235, 91, 120, 0.08)' : 'rgba(235, 91, 120, 0.06)' }] : null,
                    isCurrent && !errorMessage ? { borderColor: colors.pink, borderWidth: 2 } : null,
                    errorMessage ? styles.otpBoxError : null,
                  ]}
                >
                  <Text style={[styles.otpBoxText, { color: colors.text }]}>
                    {digit}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Master Invisible Input capturing Keyboard Autofill & multi-digit pastes */}
          <TextInput
            ref={masterInputRef}
            style={styles.hiddenMasterInput}
            value={otp.join('')}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            editable={!isVerifying && !isEditingEmail}
            autoFocus={!isEditingEmail}
            caretHidden
            aria-label="Verification Code Input"
          />
        </TouchableOpacity>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.pink },
            (!isFullCode || isVerifying || isEditingEmail) && { backgroundColor: isDark ? '#2A2735' : (colors.panel2 || '#E0E0E0'), opacity: 0.7 },
          ]}
          onPress={handleVerify}
          disabled={!isFullCode || isVerifying || isEditingEmail}
          activeOpacity={0.85}
        >
          {isVerifying ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Verifying Code...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'signup' ? 'Verify & Complete Registration' : 'Verify & Continue'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend Cooldown Section */}
        <View style={styles.resendSection}>
          <Text style={[styles.resendPrompt, { color: colors.muted }]}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={[styles.resendButton, cooldown > 0 && styles.resendButtonDisabled]}
            onPress={handleResend}
            disabled={cooldown > 0 || isResending || isVerifying || isEditingEmail}
          >
            {isResending ? (
              <View style={styles.resendInnerRow}>
                <ActivityIndicator size="small" color={colors.pink} />
                <Text style={[styles.resendText, { color: colors.pink }]}>Sending...</Text>
              </View>
            ) : cooldown > 0 ? (
              <View style={styles.resendInnerRow}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={[styles.resendCooldownText, { color: colors.muted }]}>Resend code in {cooldown}s</Text>
              </View>
            ) : (
              <View style={styles.resendInnerRow}>
                <Ionicons name="refresh-outline" size={14} color={colors.pink} />
                <Text style={[styles.resendText, { color: colors.pink }]}>Resend Code</Text>
              </View>
            )}
          </TouchableOpacity>
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButtonText: {
    color: '#D7D4DC',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(235, 91, 120, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(235, 91, 120, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  brand: {
    color: '#ed8ea4',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  brandTv: {
    color: '#eb5b78',
  },
  title: {
    color: '#F7F0F0',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8D8B98',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 4,
    maxWidth: '90%',
  },
  mailIcon: {
    marginRight: -2,
  },
  emailBadgeText: {
    color: '#F7F0F0',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
  },
  changeEmailText: {
    color: '#EB5B78',
    fontSize: 11,
    fontWeight: '700',
  },
  emailEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#242330',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  emailSaveButton: {
    backgroundColor: '#EB5B78',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
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
    marginBottom: 18,
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  alertErrorContent: {
    flex: 1,
  },
  alertErrorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  alertActionBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  alertActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  otpGridWrapper: {
    position: 'relative',
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#12121A',
    borderWidth: 1.5,
    borderColor: '#242330',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  hiddenMasterInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
    fontSize: 1,
  },
  otpBoxFilled: {
    borderColor: '#EB5B78',
    backgroundColor: 'rgba(235, 91, 120, 0.08)',
  },
  otpBoxError: {
    borderColor: '#EF4444',
  },
  submitButton: {
    backgroundColor: '#EB5B78',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  submitButtonDisabled: {
    backgroundColor: '#2A2735',
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendSection: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  resendPrompt: {
    color: '#8D8B98',
    fontSize: 13,
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendButtonDisabled: {
    opacity: 0.7,
  },
  resendInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    color: '#EB5B78',
    fontSize: 13,
    fontWeight: '700',
  },
  resendCooldownText: {
    color: '#8D8B98',
    fontSize: 13,
    fontWeight: '500',
  },
});
