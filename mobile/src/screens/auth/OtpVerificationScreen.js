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
import { useAuth } from '../../context/AuthContext';

export default function OtpVerificationScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { verifyOtp, resendOtp } = useAuth();

  const initialEmail = route?.params?.email || '';
  const initialNotice = route?.params?.message || 'A 6-digit verification code has been sent to your email.';
  const rememberMe = route?.params?.rememberMe ?? true;
  const mode = route?.params?.mode || 'signup';

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

  const inputRefs = useRef([]);

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

  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleaned = value.replace(/[^0-9]/g, '');

    if (!cleaned) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      return;
    }

    // Handle pasted or multi-character input
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const updated = [...otp];
      chars.forEach((c, i) => {
        if (index + i < 6) {
          updated[index + i] = c;
        }
      });
      setOtp(updated);
      const nextFocus = Math.min(index + chars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = cleaned;
    setOtp(updated);

    if (errorMessage) {
      setErrorMessage('');
    }

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
      const result = await resendOtp({ email: targetEmail });
      setSuccessMessage(result?.message || 'A fresh verification code has been sent to your email.');
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
          err.friendlyMessage || 'Network error. Please verify your connection and try again.'
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const targetEmail = (email || emailInput || '').trim();
    if (!targetEmail) {
      setErrorMessage('Please provide your email address.');
      setIsEditingEmail(true);
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setErrorMessage('Please enter all 6 numeric digits of your verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setIsExpiredOrInvalidated(false);

    try {
      await verifyOtp({
        email: targetEmail,
        otp: otpCode,
        rememberMe,
        deviceName: Platform.OS === 'ios' ? 'iOS App' : Platform.OS === 'android' ? 'Android App' : 'Mobile App',
      });
      // Auth state update in AuthContext automatically redirects RootNavigator to MainTabs / GenreSelection
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
          err.friendlyMessage || 'Unable to connect. Please check your internet connection and try again.'
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveEmail = () => {
    if (emailInput.trim()) {
      setEmail(emailInput.trim());
      setIsEditingEmail(false);
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  const isFullCode = otp.every((d) => d !== '');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
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
          <Ionicons name="arrow-back" size={16} color="#8D8B98" />
          <Text style={styles.backButtonText}>
            {mode === 'login' ? 'Back to Log In' : 'Back to Sign Up'}
          </Text>
        </TouchableOpacity>

        {/* Header Icon & Title */}
        <View style={styles.header}>
          <View style={styles.iconBubble}>
            <Ionicons name="key-outline" size={28} color="#EB5B78" />
          </View>
          <Text style={styles.brand}>
            SARANG<Text style={styles.brandTv}>TV</Text>
          </Text>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>We sent a 6-digit verification code to:</Text>

          {/* Email Badge / Edit Form */}
          {isEditingEmail ? (
            <View style={styles.emailEditContainer}>
              <TextInput
                style={styles.emailInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter email address"
                placeholderTextColor="#5A5866"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity style={styles.emailSaveButton} onPress={handleSaveEmail}>
                <Text style={styles.emailSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emailBadge}>
              <Ionicons name="mail-outline" size={14} color="#EB5B78" style={styles.mailIcon} />
              <Text style={styles.emailBadgeText} numberOfLines={1}>
                {email}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEmailInput(email);
                  setIsEditingEmail(true);
                }}
                hitSlop={8}
                style={styles.changeEmailButton}
              >
                <Ionicons name="pencil" size={12} color="#EB5B78" />
                <Text style={styles.changeEmailText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Success Alert */}
        {successMessage ? (
          <View style={styles.alertSuccess}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.alertSuccessText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.alertError}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
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

        {/* 6-Digit OTP Inputs */}
        <View style={styles.otpGrid}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => (inputRefs.current[idx] = ref)}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                errorMessage ? styles.otpBoxError : null,
              ]}
              value={digit}
              onChangeText={(val) => handleDigitChange(idx, val)}
              onKeyPress={(e) => handleKeyPress(idx, e)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              editable={!isVerifying && !isEditingEmail}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!isFullCode || isVerifying || isEditingEmail) && styles.submitButtonDisabled]}
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
            <Text style={styles.submitButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        {/* Resend Cooldown Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
          <TouchableOpacity
            style={[styles.resendButton, cooldown > 0 && styles.resendButtonDisabled]}
            onPress={handleResend}
            disabled={cooldown > 0 || isResending || isVerifying || isEditingEmail}
          >
            {isResending ? (
              <View style={styles.resendInnerRow}>
                <ActivityIndicator size="small" color="#EB5B78" />
                <Text style={styles.resendText}>Sending...</Text>
              </View>
            ) : cooldown > 0 ? (
              <View style={styles.resendInnerRow}>
                <Ionicons name="time-outline" size={14} color="#8D8B98" />
                <Text style={styles.resendCooldownText}>Resend code in {cooldown}s</Text>
              </View>
            ) : (
              <View style={styles.resendInnerRow}>
                <Ionicons name="refresh-outline" size={14} color="#EB5B78" />
                <Text style={styles.resendText}>Resend Code</Text>
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  alertSuccessText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  alertErrorContent: {
    flex: 1,
  },
  alertErrorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '500',
  },
  alertActionBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  alertActionText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 18,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#12121A',
    borderWidth: 1.5,
    borderColor: '#242330',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
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
