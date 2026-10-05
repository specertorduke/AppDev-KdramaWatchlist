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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/api';
import PasswordRequirementsList from '../../components/PasswordRequirementsList';
import { checkPasswordRequirements } from '../../utils/passwordRequirements';

export default function LoginScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { login, savedAccounts } = useAuth();
  const [email, setEmail] = useState(route?.params?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(route?.params?.message || '');
  const [fieldErrors, setFieldErrors] = useState({});

  const [needsVerification, setNeedsVerification] = useState(false);

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetNewConfirm, setResetNewConfirm] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetFieldErrors, setResetFieldErrors] = useState({});

  const hasTypedResetConfirm = Boolean(resetNewConfirm && resetNewConfirm.length > 0);
  const resetPasswordsMatch = Boolean(hasTypedResetConfirm && resetNewPassword && resetNewPassword === resetNewConfirm);

  const handleRequestPasswordReset = async () => {
    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setForgotError('Please enter your account email.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await authService.forgotPassword({ email: trimmed });
      setForgotSuccess(res?.data?.message || 'Password reset code sent to your email.');
      setForgotStep('reset');
    } catch (err) {
      setForgotError(
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        'Failed to send password reset code. Please check your email.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmPasswordReset = async () => {
    const trimmedToken = forgotToken.trim();
    const trimmedEmail = forgotEmail.trim();
    setForgotError('');
    setForgotSuccess('');
    setResetFieldErrors({});

    if (!trimmedToken) {
      setResetFieldErrors({ token: ['Please enter the reset code or token from your email.'] });
      return;
    }

    const { allRulesMet, isMatch } = checkPasswordRequirements(resetNewPassword, resetNewConfirm);
    if (!allRulesMet) {
      setResetFieldErrors({ password: ['Password must meet all complexity requirements.'] });
      return;
    }
    if (!isMatch) {
      setResetFieldErrors({ password_confirmation: ['The password confirmation does not match.'] });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authService.resetPassword({
        email: trimmedEmail,
        token: trimmedToken,
        password: resetNewPassword,
        password_confirmation: resetNewConfirm,
      });
      setForgotSuccess(res?.data?.message || 'Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setEmail(trimmedEmail);
        setPassword('');
      }, 2000);
    } catch (err) {
      if (err?.response?.status === 422 && err.response.data?.errors) {
        setResetFieldErrors(err.response.data.errors);
      }
      setForgotError(
        err?.response?.data?.message || 'Failed to reset password. Please check token and requirements.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    setFieldErrors({});
    setNeedsVerification(false);

    try {
      // Backend handles validation (422)
      await login(email, password, rememberMe);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422) {
          const data = err.response.data;
          const msg = data.message || 'Validation failed.';
          setErrorMessage(msg);
          setFieldErrors(data.errors || {});

          if (
            msg.toLowerCase().includes('not been verified') ||
            msg.toLowerCase().includes('verify your email') ||
            data.errors?.email?.[0]?.toLowerCase()?.includes('verify')
          ) {
            setNeedsVerification(true);
          }
        } else {
          setErrorMessage(
            err.response.data?.message || 'Invalid credentials. Please try again.'
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
        {savedAccounts && savedAccounts.length > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('AccountChooser');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text} />
            <Text style={styles.backButtonText}>Profiles</Text>
          </TouchableOpacity>
        )}

        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/sarangtv-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brand}>
            SARANG<Text style={styles.brandTv}>TV</Text>
          </Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to your watchlist.</Text>
        </View>

        {/* Global Error Banner */}
        {errorMessage ? (
          <View style={styles.alertError}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <View style={styles.alertErrorContent}>
              <Text style={styles.alertErrorText}>{errorMessage}</Text>
              {needsVerification && (
                <TouchableOpacity
                  style={styles.verifyActionBtn}
                  onPress={() => {
                    navigation.navigate('OtpVerification', {
                      email: email.trim(),
                      message: errorMessage,
                      rememberMe,
                      mode: 'login',
                    });
                  }}
                >
                  <Text style={styles.verifyActionText}>Enter Verification Code</Text>
                  <Ionicons name="arrow-forward" size={12} color="#FCA5A5" />
                </TouchableOpacity>
              )}
            </View>
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
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={19}
                  color="#9D5A6C"
                />
              </Pressable>
            </View>
            {fieldErrors.password && (
              <Text style={styles.fieldErrorText}>{fieldErrors.password[0]}</Text>
            )}
          </View>

          {/* Forgot Password Button */}
          <TouchableOpacity
            style={styles.forgotPasswordBtn}
            onPress={() => {
              setShowForgotModal(true);
              setForgotStep('request');
              setForgotEmail(email.trim());
              setForgotError('');
              setForgotSuccess('');
              setResetFieldErrors({});
            }}
            hitSlop={8}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

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

      {/* Forgot / Reset Password Modal */}
      <Modal
        visible={showForgotModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !forgotLoading && setShowForgotModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {forgotStep === 'request' ? 'Reset Password' : 'Create New Password'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {forgotStep === 'request'
                    ? 'Receive a reset code to your email'
                    : 'Enter reset code and choose a new secure password'}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => !forgotLoading && setShowForgotModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {forgotSuccess ? (
                <View style={styles.modalAlertSuccess}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.modalAlertSuccessText}>{forgotSuccess}</Text>
                </View>
              ) : null}

              {forgotError ? (
                <View style={styles.modalAlertError}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.modalAlertErrorText}>{forgotError}</Text>
                </View>
              ) : null}

              {forgotStep === 'request' ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.label}>Account Email</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#5A5866"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={forgotEmail}
                      onChangeText={(val) => {
                        setForgotEmail(val);
                        if (forgotError) setForgotError('');
                      }}
                      editable={!forgotLoading}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: 16 }, forgotLoading && styles.submitButtonDisabled]}
                    onPress={handleRequestPasswordReset}
                    disabled={forgotLoading}
                    activeOpacity={0.85}
                  >
                    {forgotLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Send Reset Code</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ alignSelf: 'center', marginTop: 14 }}
                    onPress={() => setForgotStep('reset')}
                  >
                    <Text style={styles.switchLink}>Already have a code? Reset here</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor="#5A5866"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      editable={!forgotLoading}
                    />
                  </View>

                  <Text style={[styles.label, { marginTop: 12 }]}>Reset Token / Code</Text>
                  <View style={[styles.inputWrapper, resetFieldErrors.token && styles.inputWrapperError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Paste code or token"
                      placeholderTextColor="#5A5866"
                      value={forgotToken}
                      onChangeText={(val) => {
                        setForgotToken(val);
                        if (resetFieldErrors.token) setResetFieldErrors((prev) => ({ ...prev, token: null }));
                      }}
                      editable={!forgotLoading}
                    />
                  </View>
                  {resetFieldErrors.token && (
                    <Text style={styles.fieldErrorText}>{resetFieldErrors.token[0]}</Text>
                  )}

                  <Text style={[styles.label, { marginTop: 12 }]}>New Password</Text>
                  <View style={[styles.inputWrapper, resetFieldErrors.password && styles.inputWrapperError]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#7A6369"
                      secureTextEntry={!showResetNewPassword}
                      value={resetNewPassword}
                      onChangeText={(val) => {
                        setResetNewPassword(val);
                        if (resetFieldErrors.password) setResetFieldErrors((prev) => ({ ...prev, password: null }));
                      }}
                      editable={!forgotLoading}
                    />
                    <Pressable
                      onPress={() => setShowResetNewPassword((prev) => !prev)}
                      style={styles.eyeButton}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={showResetNewPassword ? 'Hide password' : 'Show password'}
                    >
                      <Ionicons
                        name={showResetNewPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={19}
                        color="#9D5A6C"
                      />
                    </Pressable>
                  </View>
                  {resetFieldErrors.password && (
                    <Text style={styles.fieldErrorText}>{resetFieldErrors.password[0]}</Text>
                  )}

                  {/* Password requirements list directly under New Password */}
                  <PasswordRequirementsList password={resetNewPassword} />

                  <Text style={[styles.label, { marginTop: 12 }]}>Confirm New Password</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      resetFieldErrors.password_confirmation && styles.inputWrapperError,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Repeat your password"
                      placeholderTextColor="#7A6369"
                      secureTextEntry={!showResetNewPassword}
                      value={resetNewConfirm}
                      onChangeText={(val) => {
                        setResetNewConfirm(val);
                        if (resetFieldErrors.password_confirmation) {
                          setResetFieldErrors((prev) => ({ ...prev, password_confirmation: null }));
                        }
                      }}
                      editable={!forgotLoading}
                    />
                  </View>
                  {resetFieldErrors.password_confirmation && (
                    <Text style={styles.fieldErrorText}>{resetFieldErrors.password_confirmation[0]}</Text>
                  )}

                  <View style={styles.pwdMatchWrap}>
                    {hasTypedResetConfirm ? (
                      <View style={styles.pwdMatchRow}>
                        <Ionicons
                          name={resetPasswordsMatch ? 'checkmark-circle' : 'close-circle'}
                          size={13}
                          color={resetPasswordsMatch ? '#10B981' : '#FF7691'}
                        />
                        <Text
                          style={[
                            styles.pwdMatchText,
                            resetPasswordsMatch ? styles.pwdMatchTextSuccess : styles.pwdMatchTextError,
                          ]}
                        >
                          {resetPasswordsMatch ? 'Passwords match' : "Passwords don't match yet"}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.pwdMatchSpacer}> </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      style={[styles.modalSecondaryBtn, { flex: 1 }]}
                      onPress={() => setForgotStep('request')}
                      disabled={forgotLoading}
                    >
                      <Text style={styles.modalSecondaryBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitButton, { flex: 2, marginTop: 0 }, forgotLoading && styles.submitButtonDisabled]}
                      onPress={handleConfirmPasswordReset}
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>Reset Password</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
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
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
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
  verifyActionBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  verifyActionText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  form: {
    width: '100%',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: '#B76C7E',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121A',
    borderWidth: 1,
    borderColor: '#36272D',
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
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#EB5B78',
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#11111B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#8D8B98',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    marginLeft: 12,
  },
  modalBodyScroll: {
    maxHeight: 520,
  },
  modalAlertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  modalAlertSuccessText: {
    color: '#10B981',
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  modalAlertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  modalAlertErrorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  modalSecondaryBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
