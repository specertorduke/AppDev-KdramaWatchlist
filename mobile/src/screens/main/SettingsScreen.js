import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import PasswordRequirementsList from '../../components/PasswordRequirementsList';
import { checkPasswordRequirements } from '../../utils/passwordRequirements';

export default function SettingsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, deleteAccount } = useAuth();
  const { theme, isDark, colors, setTheme } = useTheme();
  const [values, setValues] = useState({
    episodeAlerts: true,
    progressReminders: true,
    autoMarkWatched: false,
    highQualityPosters: true,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Change Password state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentChangePassword, setCurrentChangePassword] = useState('');
  const [newChangePassword, setNewChangePassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentChangePassword, setShowCurrentChangePassword] = useState(false);
  const [showNewChangePassword, setShowNewChangePassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  const handleChangePassword = async () => {
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentChangePassword) {
      setPasswordChangeError('Please enter your current password.');
      return;
    }

    const { allRulesMet, isMatch, isDifferent } = checkPasswordRequirements(
      newChangePassword,
      confirmNewPassword,
      currentChangePassword
    );

    if (!allRulesMet) {
      setPasswordChangeError('New password must meet all complexity requirements.');
      return;
    }
    if (!isMatch) {
      setPasswordChangeError('The password confirmation does not match.');
      return;
    }
    if (!isDifferent) {
      setPasswordChangeError('The new password must be different from your current password.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await authService.changePassword({
        current_password: currentChangePassword,
        password: newChangePassword,
        password_confirmation: confirmNewPassword,
      });
      setPasswordChangeSuccess(res?.data?.message || 'Password updated successfully!');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setCurrentChangePassword('');
        setNewChangePassword('');
        setConfirmNewPassword('');
        setPasswordChangeSuccess('');
      }, 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.password?.[0] ||
        err?.response?.data?.errors?.current_password?.[0] ||
        err?.response?.data?.message ||
        'Failed to change password. Please check your credentials.';
      setPasswordChangeError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (route?.params?.openDeleteModal) {
      setDeletePassword('');
      setDeleteError('');
      setShowDeleteModal(true);
    }
  }, [route?.params?.openDeleteModal]);

  const toggle = (key) => {
    setValues((curr) => ({ ...curr, [key]: !curr[key] }));
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await deleteAccount(deletePassword);
      if (res.success) {
        setShowDeleteModal(false);
        Alert.alert(
          'Account Deleted',
          'Your account and all associated data have been permanently removed.'
        );
      } else {
        setDeleteError(res.error || 'Failed to delete account. Incorrect password.');
      }
    } catch (e) {
      setDeleteError('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: (insets.top > 0 ? insets.top : 12) + 6 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 },
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={17} color={colors.text} />
        </Pressable>
        <Text style={[styles.heading, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Appearance & Theme */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>APPEARANCE</Text>

        <ThemeOptionRow
          title="Dark Cinematic"
          subtitle="Deep cinematic blacks and vibrant pinks"
          selected={theme === 'dark'}
          onSelect={() => setTheme('dark')}
        />
        <ThemeOptionRow
          title="Light Clean"
          subtitle="Crisp daylight theme"
          selected={theme === 'light'}
          onSelect={() => setTheme('light')}
        />
        <ThemeOptionRow
          title="Warm Comfort"
          subtitle="Easy on the eyes with warm cream tones"
          selected={theme === 'warm'}
          onSelect={() => setTheme('warm')}
          last
        />
      </View>

      {/* Notifications */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>NOTIFICATIONS</Text>

        <SettingToggleRow
          title="New Episode Alerts"
          subtitle="Notify when tracked dramas air new episodes"
          value={values.episodeAlerts}
          onToggle={() => toggle('episodeAlerts')}
        />

        <SettingToggleRow
          title="Progress Reminders"
          subtitle="Remind me to log episodes I may have missed"
          value={values.progressReminders}
          onToggle={() => toggle('progressReminders')}
          last
        />
      </View>

      {/* Playback & Tracker Preferences */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>PREFERENCES</Text>

        <SettingToggleRow
          title="Auto-Mark Completed"
          subtitle="Mark drama as completed when final episode is logged"
          value={values.autoMarkWatched}
          onToggle={() => toggle('autoMarkWatched')}
        />

        <SettingToggleRow
          title="High Quality Posters"
          subtitle="Load HD banners and posters over WiFi"
          value={values.highQualityPosters}
          onToggle={() => toggle('highQualityPosters')}
          last
        />
      </View>

      {/* About */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>ABOUT</Text>

        <View style={[styles.aboutRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.aboutLabel, { color: colors.muted }]}>Version</Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0 (SarangTV Mobile)</Text>
        </View>

        <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.aboutLabel, { color: colors.muted }]}>Theme</Text>
          <Text style={[styles.aboutValue, { color: colors.pink }]}>
            {theme === 'dark' ? 'Dark Cinematic' : theme === 'warm' ? 'Warm Comfort' : 'Light Clean'}
          </Text>
        </View>
      </View>

      {/* Security: Password Change */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>SECURITY</Text>

        <Pressable
          style={({ pressed }) => [
            styles.deleteAccountRow,
            pressed && styles.deleteAccountRowPressed,
          ]}
          onPress={() => {
            setCurrentChangePassword('');
            setNewChangePassword('');
            setConfirmNewPassword('');
            setPasswordChangeError('');
            setPasswordChangeSuccess('');
            setShowChangePasswordModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Change Password"
        >
          <View style={styles.deleteAccountLeft}>
            <View style={[styles.deleteIconWrap, { backgroundColor: 'rgba(235, 91, 120, 0.15)' }]}>
              <Ionicons name="key-outline" size={17} color={colors.pink} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Change Password</Text>
              <Text style={[styles.rowSubtitle, { color: colors.muted }]}>
                Update your account password with security validation
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
        </Pressable>
      </View>

      {/* Danger Zone: Account Deletion */}
      <View style={[styles.panel, { backgroundColor: isDark ? '#17111D' : 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.25)', borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>DANGER ZONE</Text>

        <Pressable
          style={({ pressed }) => [
            styles.deleteAccountRow,
            pressed && styles.deleteAccountRowPressed,
          ]}
          onPress={() => {
            setDeletePassword('');
            setDeleteError('');
            setShowDeleteModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Delete Account"
        >
          <View style={styles.deleteAccountLeft}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash-outline" size={17} color="#EF4444" />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.deleteTitle}>Delete Account</Text>
              <Text style={[styles.deleteSubtitle, { color: colors.muted }]}>
                Permanently delete your profile, watchlist tracker, and all personal data
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color="#EF4444" />
        </Pressable>
      </View>

      <View style={{ height: 40 }} />

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.modalCard || colors.card, borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.35)', borderWidth: 1 }]}>
            <View style={styles.modalWarningHeader}>
              <View style={styles.modalWarningIcon}>
                <Ionicons name="warning-outline" size={26} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account?</Text>
                <Text style={styles.modalSubtitle}>This action cannot be undone</Text>
              </View>
              <Pressable
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.warningNoticeBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.warningNoticeText}>
                Permanently deletes your account ({user?.email}), all drama progress, ratings, and saved history.
              </Text>
            </View>

            <Text style={[styles.inputSubLabel, { color: colors.muted }]}>ENTER CURRENT PASSWORD TO CONFIRM</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#0D0C17' : (colors.panel2 || '#EEF1F6'),
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={deletePassword}
              onChangeText={(text) => {
                setDeletePassword(text);
                if (deleteError) setDeleteError('');
              }}
              placeholder="Enter account password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
            />

            {deleteError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#EF4444" />
                <Text style={styles.errorText}>{deleteError}</Text>
              </View>
            ) : null}

            <View style={[styles.modalBtnRow, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.cancelBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.deleteBtn, isDeleting && { opacity: 0.7 }]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.deleteBtnText}>Delete Permanently</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !isUpdatingPassword && setShowChangePasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.modalCard || colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.deleteWarningIconWrap, { backgroundColor: 'rgba(235, 91, 120, 0.15)' }]}>
                <Ionicons name="key-outline" size={24} color={colors.pink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>Update your account password</Text>
              </View>
              <Pressable
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
                onPress={() => !isUpdatingPassword && setShowChangePasswordModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {passwordChangeSuccess ? (
                <View style={[styles.deleteErrorBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.deleteErrorText, { color: '#10B981' }]}>{passwordChangeSuccess}</Text>
                </View>
              ) : null}

              {passwordChangeError ? (
                <View style={styles.deleteErrorBox}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.deleteErrorText}>{passwordChangeError}</Text>
                </View>
              ) : null}

              <View style={{ marginTop: 6 }}>
                <Text style={[styles.inputSubLabel, { color: colors.muted }]}>CURRENT PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#0D0C17' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border, borderWidth: 1 }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={currentChangePassword}
                    onChangeText={(text) => {
                      setCurrentChangePassword(text);
                      if (passwordChangeError) setPasswordChangeError('');
                    }}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showCurrentChangePassword}
                    editable={!isUpdatingPassword}
                  />
                  <Pressable
                    onPress={() => setShowCurrentChangePassword(!showCurrentChangePassword)}
                    style={styles.eyeButton}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showCurrentChangePassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>

                <Text style={[styles.inputSubLabel, { marginTop: 12, color: colors.muted }]}>NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#0D0C17' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border, borderWidth: 1 }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={newChangePassword}
                    onChangeText={(text) => {
                      setNewChangePassword(text);
                      if (passwordChangeError) setPasswordChangeError('');
                    }}
                    placeholder="Min. 8 chars, uppercase, number & symbol"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showNewChangePassword}
                    editable={!isUpdatingPassword}
                  />
                  <Pressable
                    onPress={() => setShowNewChangePassword(!showNewChangePassword)}
                    style={styles.eyeButton}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showNewChangePassword ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>

                <Text style={[styles.inputSubLabel, { marginTop: 12, color: colors.muted }]}>CONFIRM NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#0D0C17' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border, borderWidth: 1 }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={confirmNewPassword}
                    onChangeText={(text) => {
                      setConfirmNewPassword(text);
                      if (passwordChangeError) setPasswordChangeError('');
                    }}
                    placeholder="Repeat new password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showNewChangePassword}
                    editable={!isUpdatingPassword}
                  />
                </View>

                {/* Requirements list shown dynamically */}
                <PasswordRequirementsList
                  password={newChangePassword}
                  confirmation={confirmNewPassword}
                  currentPassword={currentChangePassword}
                  isChangePassword={true}
                />

                <View style={[styles.modalBtnRow, { marginTop: 16, borderTopColor: colors.border }]}>
                  <Pressable
                    style={[styles.cancelBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}
                    onPress={() => setShowChangePasswordModal(false)}
                    disabled={isUpdatingPassword}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.deleteBtn, { backgroundColor: colors.pink }, isUpdatingPassword && { opacity: 0.7 }]}
                    onPress={handleChangePassword}
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.deleteBtnText}>Update Password</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function SettingToggleRow({ title, subtitle, value, onToggle, last }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }, last && styles.rowLast]}>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: isDark ? '#262534' : '#E2E4EB', true: colors.redBright }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function ThemeOptionRow({ title, subtitle, selected, onSelect, last }) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      style={[styles.row, { borderBottomColor: colors.border }, last && styles.rowLast]}
      onPress={onSelect}
    >
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <View style={[styles.radioOuter, { borderColor: selected ? colors.pink : colors.muted }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: colors.pink }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: '#161424',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    color: '#8D8B98',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowInfo: {
    flex: 1,
    paddingRight: 14,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  aboutLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  aboutValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  /* Danger Zone */
  dangerTitle: {
    color: '#EF4444',
  },
  deleteAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  deleteAccountRowPressed: {
    opacity: 0.7,
  },
  deleteAccountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  deleteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  deleteSubtitle: {
    color: '#8D8B98',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#161424',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  modalWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modalWarningIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  warningNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  warningNoticeText: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    fontWeight: '600',
  },
  inputSubLabel: {
    color: '#8D8B98',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0D0C17',
    borderWidth: 1,
    borderColor: '#26233A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 9,
    marginTop: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: '#D7D4DC',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  deleteWarningIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 9,
    marginBottom: 10,
  },
  deleteErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
