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
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, deleteAccount } = useAuth();
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
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: (insets.top > 0 ? insets.top : 12) + 6 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={17} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>Settings</Text>
      </View>

      {/* Notifications */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

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
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>

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
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>ABOUT</Text>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0 (SarangTV Mobile)</Text>
        </View>

        <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.aboutLabel}>Theme</Text>
          <Text style={styles.aboutValue}>Dark Cinematic</Text>
        </View>
      </View>

      {/* Danger Zone: Account Deletion */}
      <View style={[styles.panel, styles.dangerPanel]}>
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
              <Text style={styles.deleteSubtitle}>
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
          <View style={styles.modalCard}>
            <View style={styles.modalWarningHeader}>
              <View style={styles.modalWarningIcon}>
                <Ionicons name="warning-outline" size={26} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Delete Account?</Text>
                <Text style={styles.modalSubtitle}>This action cannot be undone</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.warningNoticeBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.warningNoticeText}>
                Permanently deletes your account ({user?.email}), all drama progress, ratings, and saved history.
              </Text>
            </View>

            <Text style={styles.inputSubLabel}>ENTER CURRENT PASSWORD TO CONFIRM</Text>
            <TextInput
              style={styles.textInput}
              value={deletePassword}
              onChangeText={(text) => {
                setDeletePassword(text);
                if (deleteError) setDeleteError('');
              }}
              placeholder="Enter account password"
              placeholderTextColor="#686577"
              secureTextEntry
              autoCapitalize="none"
            />

            {deleteError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#EF4444" />
                <Text style={styles.errorText}>{deleteError}</Text>
              </View>
            ) : null}

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
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
    </ScrollView>
  );
}

function SettingToggleRow({ title, subtitle, value, onToggle, last }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#262534', true: colors.redBright }}
        thumbColor={colors.white}
      />
    </View>
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
  dangerPanel: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: '#17111D',
  },
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
});
