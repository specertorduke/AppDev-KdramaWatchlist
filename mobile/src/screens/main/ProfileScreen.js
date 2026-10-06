import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Modal,
  Image,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Edit3,
  ClipboardList,
  BarChart3,
  Sparkles as LucideSparkles,
  Settings as LucideSettings,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { userService, authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { pickAndCompressAvatar, takeAndCompressAvatar } from '../../services/imageService';
import { checkPasswordRequirements } from '../../utils/passwordRequirements';
import PasswordRequirementsList from '../../components/PasswordRequirementsList';
import DefaultProfileAvatar from '../../components/DefaultProfileAvatar';


export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    user,
    logout,
    updateProfileAvatar,
    updateProfileName,
    updateUserEmail,
  } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Avatar States
  const [selectedIcon, setSelectedIcon] = useState(user?.avatarIcon || 'heart');
  const [selectedColor, setSelectedColor] = useState(user?.color || '#eb5b78');
  const [customImage, setCustomImage] = useState(user?.avatar_url || null);
  const [avatarMode, setAvatarMode] = useState(user?.avatar_url ? 'photo' : 'persona');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Email Change Flow States (Industry Standard: Password Re-auth + New Email OTP Verification)
  const [showEmailFlow, setShowEmailFlow] = useState(false);
  const [emailStep, setEmailStep] = useState('input'); // 'input' | 'otp'
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Password Change States
  const [showPasswordChangeFlow, setShowPasswordChangeFlow] = useState(false);
  const [currentChangePassword, setCurrentChangePassword] = useState('');
  const [newChangePassword, setNewChangePassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const AVATAR_ICONS = [
    { id: 'heart', icon: 'heart', label: 'Romance Lead' },
    { id: 'sparkles', icon: 'sparkles', label: 'K-Drama Star' },
    { id: 'film', icon: 'film', label: 'Binge Watcher' },
    { id: 'flame', icon: 'flame', label: 'Plot Twist' },
    { id: 'ribbon', icon: 'ribbon', label: 'Award Winner' },
    { id: 'glasses', icon: 'glasses', label: 'Chaebol Heir' },
    { id: 'planet', icon: 'planet', label: 'Fantasy / Sci-Fi' },
    { id: 'flash', icon: 'flash', label: 'Action Hero' },
    { id: 'cafe', icon: 'cafe', label: 'Coffee Prince' },
    { id: 'happy', icon: 'happy', label: 'Second Lead' },
    { id: 'musical-notes', icon: 'musical-notes', label: 'OST Lover' },
    { id: 'paw', icon: 'paw', label: 'Drama Mascot' },
  ];

  const COLOR_PALETTES = [
    '#eb5b78', // Signature Rose / Accent
    '#E085A6', // Deep Rose
    '#6B2638', // Wine
    '#29234D', // Midnight Plum
    '#3A315A', // Royal Violet
    '#19313B', // Deep Teal
    '#2D4B3E', // Forest Sage
    '#D97706', // Sunset Amber
  ];

  useEffect(() => {
    if (user?.name) setEditName(user.name);
    if (user?.avatarIcon) setSelectedIcon(user.avatarIcon);
    if (user?.color) setSelectedColor(user.color);
    setCustomImage(user?.avatar_url || null);
    setAvatarMode(user?.avatar_url ? 'photo' : 'persona');
  }, [user]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleOpenEditModal = () => {
    setEditName(user?.name || '');
    setSelectedIcon(user?.avatarIcon || 'heart');
    setSelectedColor(user?.color || '#eb5b78');
    setCustomImage(user?.avatar_url || null);
    setAvatarMode(user?.avatar_url ? 'photo' : 'persona');
    setShowEmailFlow(false);
    setEmailStep('input');
    setNewEmail('');
    setPassword('');
    setEmailOtp('');
    setEmailError('');
    setEmailSuccess('');
    setShowPasswordChangeFlow(false);
    setCurrentChangePassword('');
    setNewChangePassword('');
    setConfirmNewPassword('');
    setPasswordChangeError('');
    setPasswordChangeSuccess('');
    setShowEditModal(true);
  };

  const handlePickCustomImage = async () => {
    setIsProcessingImage(true);
    try {
      const result = await pickAndCompressAvatar();
      if (result?.base64) {
        setCustomImage(result.base64);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsProcessingImage(true);
    try {
      const result = await takeAndCompressAvatar();
      if (result?.base64) {
        setCustomImage(result.base64);
      }
    } catch (e) {
      console.warn('Camera error:', e);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveCustomPhoto = () => {
    setCustomImage(null);
  };

  // Step 1: Request Email Change (validates password & sends OTP to new email)
  const handleRequestEmailChange = async () => {
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailError('Please enter your new email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (trimmedEmail === user?.email?.toLowerCase()) {
      setEmailError('New email must be different from current email.');
      return;
    }
    if (!password) {
      setEmailError('Please enter your current password to continue.');
      return;
    }

    setIsRequestingOtp(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      await userService.requestEmailChange({
        new_email: trimmedEmail,
        password: password,
      });
      setEmailStep('otp');
      setResendTimer(60);
      setEmailOtp('');
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.new_email?.[0] ||
        e?.response?.data?.errors?.password?.[0] ||
        'Failed to request email change. Please check your password.';
      setEmailError(msg);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Step 2: Verify 6-digit OTP and update email in database & local state
  const handleVerifyEmailChange = async () => {
    const trimmedOtp = emailOtp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setEmailError('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setEmailError('');

    try {
      const trimmedEmail = newEmail.trim().toLowerCase();
      await userService.verifyEmailChange({
        new_email: trimmedEmail,
        otp: trimmedOtp,
      });

      // Update user state and AsyncStorage in auth context
      await updateUserEmail(trimmedEmail);

      setEmailSuccess('Email updated successfully!');
      setShowEmailFlow(false);
      setEmailStep('input');
      setNewEmail('');
      setPassword('');
      setEmailOtp('');
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        'Verification failed. The code may be invalid or expired.';
      setEmailError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Change Password with client-side validation against all password requirements
  const handleChangePasswordSubmit = async () => {
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (!currentChangePassword) {
      setPasswordChangeError('Current password is required.');
      return;
    }

    if (newChangePassword === currentChangePassword) {
      setPasswordChangeError('The new password must be different from your current password.');
      return;
    }

    const { isValid, missingRules } = checkPasswordRequirements(newChangePassword, confirmNewPassword);
    if (!isValid) {
      setPasswordChangeError(`Password does not meet requirements:\n• ${missingRules.join('\n• ')}`);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authService.changePassword({
        current_password: currentChangePassword,
        password: newChangePassword,
        password_confirmation: confirmNewPassword,
      });

      setPasswordChangeSuccess('Password updated successfully!');
      setCurrentChangePassword('');
      setNewChangePassword('');
      setConfirmNewPassword('');
      setShowPasswordChangeFlow(false);
      Alert.alert('Success', 'Your password has been changed successfully.');
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.errors?.password?.[0] ||
        e?.response?.data?.errors?.current_password?.[0] ||
        'Failed to update password. Please check your credentials.';
      setPasswordChangeError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Save changes to Name and Avatar
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // 1. Update Name if changed
      if (editName.trim() && editName.trim() !== user?.name) {
        const nameRes = await updateProfileName(editName.trim());
        if (!nameRes.success) {
          Alert.alert('Error', nameRes.error || 'Failed to update name.');
          setIsSavingProfile(false);
          return;
        }
      }

      // 2. Update Avatar
      if (avatarMode === 'photo') {
        if (customImage !== user?.avatar_url) {
          await updateProfileAvatar({
            avatarIcon: null,
            avatarUrl: customImage,
          });
        }
      } else {
        if (
          selectedIcon !== user?.avatarIcon ||
          selectedColor !== user?.color ||
          user?.avatar_url
        ) {
          await updateProfileAvatar({
            avatarIcon: selectedIcon,
            color: selectedColor,
            avatarUrl: null,
          });
        }
      }

      setShowEditModal(false);
    } catch (e) {
      console.warn('Failed to save profile:', e);
      Alert.alert('Error', 'Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchProfileStats = async () => {
    try {
      const res = await userService.getProfile();
      if (res.data && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (e) {
      console.warn('Failed to load profile stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileStats();
  };

  const getInitials = (name) => {
    if (!name) return 'KJ';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await logout();
  };

  const activeColor = user?.color || selectedColor || '#eb5b78';
  const activeIcon = user?.avatarIcon || selectedIcon;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: (insets.top > 0 ? insets.top : 12) + 6,
          paddingBottom: Math.max(insets.bottom, 16) + 85,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.redBright}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.avatarWrapper,
            hovered && styles.avatarHovered,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleOpenEditModal}
          accessibilityRole="button"
          accessibilityLabel="Edit profile and avatar"
        >
          {user?.avatar_url?.endsWith('.svg') ? (
            <DefaultProfileAvatar size={80} />
          ) : user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatarPhoto}
              resizeMode="cover"
            />
          ) : activeIcon ? (
            <View style={[styles.avatarIconCircle, { backgroundColor: activeColor }]}>
              <Ionicons name={activeIcon} size={36} color="#FFFFFF" />
            </View>
          ) : (
            <View style={[styles.avatarIconCircle, { backgroundColor: activeColor }]}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'Kim Ji-young'}</Text>
          <Text style={[styles.email, { color: colors.muted }]}>{user?.email || 'kdramaaddict@email.com'}</Text>
        </View>

        <Pressable
          style={({ pressed, hovered }) => [
            styles.pencilEditButton,
            { backgroundColor: colors.card, borderWidth: 0 },
            hovered && styles.pencilEditButtonHovered,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleOpenEditModal}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Edit3 size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Profile Summary */}
      <View style={[styles.stats, { backgroundColor: colors.card, borderWidth: 0 }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.total_dramas ?? 4}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Dramas</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats?.episodes_watched ?? 18}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Episodes</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.gold, { color: colors.gold }]}>
            {Math.round(stats?.hours_watched ?? 17)}h
          </Text>
          <Text style={[styles.statLabel, styles.gold, { color: colors.gold }]}>Watched</Text>
        </View>
      </View>

      {/* Profile Menu */}
      <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        {/* My Tracker */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            { borderBottomColor: colors.border },
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('Tracker')}
          accessibilityRole="button"
          accessibilityLabel="My Tracker"
        >
          <View style={styles.menuIcon}>
            <ClipboardList size={18} color={colors.pink} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>My Tracker</Text>
            <Text style={[styles.menuSubtitle, { color: colors.muted }]}>
              {stats?.total_dramas ?? 1} dramas tracked
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>

        {/* Stats & History */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            { borderBottomColor: colors.border },
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('Stats')}
          accessibilityRole="button"
          accessibilityLabel="Stats and History"
        >
          <View style={styles.menuIcon}>
            <BarChart3 size={18} color={colors.blue} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Stats & History</Text>
            <Text style={[styles.menuSubtitle, { color: colors.muted }]}>
              {stats?.episodes_watched ?? 4} episodes · {Math.round(stats?.hours_watched ?? 4)}h
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>

        {/* Favorite Genres & Taste */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            { borderBottomColor: colors.border },
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('GenreSelection', { isEditing: true })}
          accessibilityRole="button"
          accessibilityLabel="Favorite Genres"
        >
          <View style={styles.menuIcon}>
            <LucideSparkles size={18} color={colors.purple} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Favorite Genres</Text>
            <Text style={[styles.menuSubtitle, { color: colors.muted }]}>
              {Array.isArray(user?.favorite_genres) && user.favorite_genres.length > 0
                ? user.favorite_genres.join(', ')
                : 'Select your preferred genres'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>

        {/* Settings */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            styles.menuItemLast,
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <View style={styles.menuIcon}>
            <LucideSettings size={18} color={colors.muted} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Notifications, appearance, and preferences</Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      </View>

      {/* Sign Out Button */}
      <Pressable
        style={({ pressed, hovered }) => [
          styles.signOut,
          hovered && styles.signOutHovered,
          pressed && styles.signOutPressed,
        ]}
        onPress={handleSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={14} color={colors.redBright} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      {/* Comprehensive Edit Profile Modal: Avatar, Name & Industry-Standard Email Flow */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>Customize your persona, name, and email</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowEditModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              contentContainerStyle={styles.modalBodyScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* SECTION 1: DISPLAY NAME */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionHeading, { color: colors.muted }]}>DISPLAY NAME</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBg || colors.panel2, color: colors.text, borderColor: colors.border }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>

              {/* SECTION 2: EMAIL (INDUSTRY STANDARD FLOW) */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionHeading, { color: colors.muted }]}>EMAIL ADDRESS</Text>

                {!showEmailFlow ? (
                  <View style={[styles.emailCard, { backgroundColor: isDark ? '#0D0C17' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border }]}>
                    <View style={styles.emailCurrentRow}>
                      <View style={styles.emailCurrentLeft}>
                        <Ionicons name="mail-outline" size={17} color={colors.muted} />
                        <Text style={[styles.emailCurrentText, { color: colors.text }]} numberOfLines={1}>
                          {user?.email || 'No email set'}
                        </Text>
                      </View>
                      <View style={styles.emailBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text style={styles.emailBadgeText}>Verified</Text>
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.changeEmailTriggerBtn,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        setShowEmailFlow(true);
                        setEmailStep('input');
                        setNewEmail('');
                        setPassword('');
                        setEmailOtp('');
                        setEmailError('');
                        setEmailSuccess('');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Change email address"
                    >
                      <Ionicons name="swap-horizontal" size={14} color={colors.pink} />
                      <Text style={[styles.changeEmailTriggerText, { color: colors.pink }]}>Change Email</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={[styles.emailFlowCard, { backgroundColor: isDark ? '#12101F' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border }]}>
                    {emailStep === 'input' ? (
                      <>
                        <View style={styles.emailFlowStepHeader}>
                          <Ionicons name="shield-checkmark-outline" size={16} color={colors.pink} />
                          <Text style={[styles.emailFlowTitle, { color: colors.text }]}>Change Account Email</Text>
                        </View>
                        <Text style={[styles.emailFlowDesc, { color: colors.muted }]}>
                          For your security, please enter your new email and confirm your current password. A 6-digit verification code will be sent to the new email.
                        </Text>

                        <Text style={[styles.inputSubLabel, { color: colors.muted }]}>NEW EMAIL ADDRESS</Text>
                        <TextInput
                          style={[styles.textInput, { backgroundColor: colors.inputBg || colors.panel2, color: colors.text, borderColor: colors.border }]}
                          value={newEmail}
                          onChangeText={(text) => {
                            setNewEmail(text);
                            if (emailError) setEmailError('');
                          }}
                          placeholder="e.g. name@example.com"
                          placeholderTextColor={colors.muted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />

                        <Text style={[styles.inputSubLabel, { color: colors.muted, marginTop: 12 }]}>CURRENT PASSWORD</Text>
                        <TextInput
                          style={[styles.textInput, { backgroundColor: colors.inputBg || colors.panel2, color: colors.text, borderColor: colors.border }]}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (emailError) setEmailError('');
                          }}
                          placeholder="Enter current password"
                          placeholderTextColor={colors.muted}
                          secureTextEntry
                        />

                        {emailError ? (
                          <View style={styles.emailErrorBox}>
                            <Ionicons name="alert-circle" size={15} color="#EF4444" />
                            <Text style={styles.emailErrorText}>{emailError}</Text>
                          </View>
                        ) : null}

                        <View style={styles.emailBtnRow}>
                          <Pressable
                            style={[styles.emailSecondaryBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)' }]}
                            onPress={() => {
                              setShowEmailFlow(false);
                              setEmailError('');
                            }}
                            disabled={isRequestingOtp}
                          >
                            <Text style={[styles.emailSecondaryBtnText, { color: colors.text }]}>Cancel</Text>
                          </Pressable>

                          <Pressable
                            style={[styles.emailPrimaryBtn, { backgroundColor: colors.pink }, isRequestingOtp && { opacity: 0.7 }]}
                            onPress={handleRequestEmailChange}
                            disabled={isRequestingOtp}
                          >
                            {isRequestingOtp ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Text style={styles.emailPrimaryBtnText}>Send Code</Text>
                                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                              </>
                            )}
                          </Pressable>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.emailFlowStepHeader}>
                          <Ionicons name="mail-unread-outline" size={16} color={colors.pink} />
                          <Text style={[styles.emailFlowTitle, { color: colors.text }]}>Enter Verification Code</Text>
                        </View>
                        <Text style={[styles.emailFlowDesc, { color: colors.muted }]}>
                          We sent a 6-digit confirmation code to{' '}
                          <Text style={{ color: colors.text, fontWeight: '800' }}>{newEmail}</Text>.
                          Enter it below to confirm your new email.
                        </Text>

                        <TextInput
                          style={[styles.emailOtpInput, { backgroundColor: isDark ? '#0D0C17' : (colors.panel2 || '#FFFFFF'), color: colors.text, borderColor: colors.pink }]}
                          value={emailOtp}
                          onChangeText={(text) => {
                            setEmailOtp(text.replace(/[^0-9]/g, ''));
                            if (emailError) setEmailError('');
                          }}
                          placeholder="••••••"
                          placeholderTextColor={colors.muted}
                          keyboardType="number-pad"
                          maxLength={6}
                          autoFocus
                        />

                        {emailError ? (
                          <View style={styles.emailErrorBox}>
                            <Ionicons name="alert-circle" size={15} color="#EF4444" />
                            <Text style={styles.emailErrorText}>{emailError}</Text>
                          </View>
                        ) : null}

                        <View style={styles.resendRow}>
                          {resendTimer > 0 ? (
                            <Text style={[styles.resendTimerText, { color: colors.muted }]}>
                              Resend code in <Text style={{ color: colors.pink }}>{resendTimer}s</Text>
                            </Text>
                          ) : (
                            <Pressable
                              onPress={handleRequestEmailChange}
                              disabled={isRequestingOtp}
                            >
                              <Text style={[styles.resendLinkText, { color: colors.pink }]}>Resend verification code</Text>
                            </Pressable>
                          )}
                        </View>

                        <View style={styles.emailBtnRow}>
                          <Pressable
                            style={[styles.emailSecondaryBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)' }]}
                            onPress={() => {
                              setEmailStep('input');
                              setEmailError('');
                            }}
                            disabled={isVerifyingOtp}
                          >
                            <Text style={[styles.emailSecondaryBtnText, { color: colors.text }]}>Back</Text>
                          </Pressable>

                          <Pressable
                            style={[styles.emailPrimaryBtn, { backgroundColor: colors.pink }, isVerifyingOtp && { opacity: 0.7 }]}
                            onPress={handleVerifyEmailChange}
                            disabled={isVerifyingOtp}
                          >
                            {isVerifyingOtp ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Text style={styles.emailPrimaryBtnText}>Verify & Update</Text>
                            )}
                          </Pressable>
                        </View>
                      </>
                    )}
                  </View>
                )}

                {emailSuccess ? (
                  <View style={styles.emailSuccessBox}>
                    <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                    <Text style={styles.emailSuccessText}>{emailSuccess}</Text>
                  </View>
                ) : null}
              </View>

              {/* SECTION 3: PASSWORD & SECURITY */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionHeading, { color: colors.muted }]}>PASSWORD & SECURITY</Text>

                {!showPasswordChangeFlow ? (
                  <View style={[styles.emailCard, { backgroundColor: isDark ? '#0D0C17' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border }]}>
                    <View style={styles.emailCurrentRow}>
                      <View style={styles.emailCurrentLeft}>
                        <Ionicons name="lock-closed-outline" size={17} color={colors.muted} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.emailCurrentText, { color: colors.text }]}>Account Password</Text>
                          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                            Must meet all 8+ char, mixed-case, number & symbol rules
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.changeEmailTriggerBtn,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => {
                        setShowPasswordChangeFlow(true);
                        setCurrentChangePassword('');
                        setNewChangePassword('');
                        setConfirmNewPassword('');
                        setPasswordChangeError('');
                        setPasswordChangeSuccess('');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Change password"
                    >
                      <Ionicons name="key-outline" size={14} color={colors.pink} />
                      <Text style={[styles.changeEmailTriggerText, { color: colors.pink }]}>Change Password</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={[styles.emailFlowCard, { backgroundColor: isDark ? '#12101F' : (colors.panel2 || '#EEF1F6'), borderColor: colors.border }]}>
                    <View style={styles.emailFlowStepHeader}>
                      <Ionicons name="shield-checkmark-outline" size={16} color={colors.pink} />
                      <Text style={[styles.emailFlowTitle, { color: colors.text }]}>Change Account Password</Text>
                    </View>
                    <Text style={[styles.emailFlowDesc, { color: colors.muted }]}>
                      Enter your current password and pick a strong new password that differs from your current one.
                    </Text>

                    <Text style={[styles.inputSubLabel, { color: colors.muted }]}>CURRENT PASSWORD</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: colors.inputBg || colors.panel2, color: colors.text, borderColor: colors.border }]}
                      value={currentChangePassword}
                      onChangeText={(t) => {
                        setCurrentChangePassword(t);
                        if (passwordChangeError) setPasswordChangeError('');
                      }}
                      placeholder="Enter current password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                    />

                    <Text style={[styles.inputSubLabel, { color: colors.muted, marginTop: 12 }]}>NEW PASSWORD</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: colors.inputBg || colors.panel2, color: colors.text, borderColor: colors.border }]}
                      value={newChangePassword}
                      onChangeText={(t) => {
                        setNewChangePassword(t);
                        if (passwordChangeError) setPasswordChangeError('');
                      }}
                      placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                    />

                    <Text style={[styles.inputSubLabel, { color: colors.muted, marginTop: 12 }]}>CONFIRM NEW PASSWORD</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: colors.inputBg || colors.panel2, color: colors.text, borderColor: colors.border }]}
                      value={confirmNewPassword}
                      onChangeText={(t) => {
                        setConfirmNewPassword(t);
                        if (passwordChangeError) setPasswordChangeError('');
                      }}
                      placeholder="Re-enter new password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry
                    />

                    <PasswordRequirementsList
                      password={newChangePassword}
                      confirmPassword={confirmNewPassword}
                    />

                    {passwordChangeError ? (
                      <View style={styles.emailErrorBox}>
                        <Ionicons name="alert-circle" size={15} color="#EF4444" />
                        <Text style={styles.emailErrorText}>{passwordChangeError}</Text>
                      </View>
                    ) : null}

                    <View style={styles.emailBtnRow}>
                      <Pressable
                        style={[styles.emailSecondaryBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.06)' }]}
                        onPress={() => {
                          setShowPasswordChangeFlow(false);
                          setPasswordChangeError('');
                        }}
                        disabled={isUpdatingPassword}
                      >
                        <Text style={[styles.emailSecondaryBtnText, { color: colors.text }]}>Cancel</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.emailPrimaryBtn, { backgroundColor: colors.pink }, isUpdatingPassword && { opacity: 0.7 }]}
                        onPress={handleChangePasswordSubmit}
                        disabled={isUpdatingPassword}
                      >
                        {isUpdatingPassword ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.emailPrimaryBtnText}>Update Password</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}

                {passwordChangeSuccess ? (
                  <View style={styles.emailSuccessBox}>
                    <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                    <Text style={styles.emailSuccessText}>{passwordChangeSuccess}</Text>
                  </View>
                ) : null}
              </View>

              {/* SECTION 4: AVATAR & DRAMA PERSONA */}
              <View style={styles.editSection}>
                <Text style={[styles.editSectionHeading, { color: colors.muted }]}>PROFILE PICTURE & PERSONA</Text>

                {/* Mode Switcher */}
                <View style={[styles.modeTabBar, { backgroundColor: isDark ? '#0F0E1A' : (colors.panel2 || '#ECEEF4') }]}>
                  <Pressable
                    style={[
                      styles.modeTab,
                      avatarMode === 'photo' && [styles.modeTabActive, { backgroundColor: isDark ? '#25213B' : colors.card }],
                    ]}
                    onPress={() => setAvatarMode('photo')}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={15}
                      color={avatarMode === 'photo' ? (isDark ? '#FFFFFF' : colors.pink) : colors.muted}
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        { color: colors.muted },
                        avatarMode === 'photo' && { color: colors.text, fontWeight: '800' },
                      ]}
                    >
                      Custom Photo
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.modeTab,
                      avatarMode === 'persona' && [styles.modeTabActive, { backgroundColor: isDark ? '#25213B' : colors.card }],
                    ]}
                    onPress={() => setAvatarMode('persona')}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={15}
                      color={avatarMode === 'persona' ? (isDark ? '#FFFFFF' : colors.pink) : colors.muted}
                    />
                    <Text
                      style={[
                        styles.modeTabText,
                        { color: colors.muted },
                        avatarMode === 'persona' && { color: colors.text, fontWeight: '800' },
                      ]}
                    >
                      Drama Persona
                    </Text>
                  </Pressable>
                </View>

                {avatarMode === 'photo' ? (
                  <View style={styles.modeContent}>
                    {/* Photo Preview */}
                    <View style={[styles.previewContainer, { backgroundColor: isDark ? '#0F0E1A' : (colors.panel2 || '#F0F2F6') }]}>
                      <View
                        style={[
                          styles.avatarPreview,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.pink,
                            borderWidth: 2,
                            shadowColor: colors.shadowColor || '#000000',
                            shadowOpacity: isDark ? 0.3 : (colors.shadowOpacity || 0.05),
                            elevation: isDark ? 4 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.avatarPreviewInner, { backgroundColor: isDark ? '#1E1B2D' : colors.card }]}>
                          {customImage?.endsWith('.svg') ? (
                            <DefaultProfileAvatar size={60} />
                          ) : customImage ? (
                            <Image
                              source={{ uri: customImage }}
                              style={styles.avatarPreviewPhoto}
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons name="person-outline" size={40} color={colors.muted} />
                          )}
                        </View>
                      </View>
                      <Text style={[styles.previewLabel, { color: colors.text }]}>
                        {customImage ? 'Custom Photo Selected' : 'No Photo Selected'}
                      </Text>

                      {/* Photo Actions */}
                      <View style={styles.customPhotoBtnRow}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.photoActionBtn,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            pressed && styles.buttonPressed,
                          ]}
                          onPress={handlePickCustomImage}
                          disabled={isProcessingImage}
                          accessibilityRole="button"
                          accessibilityLabel="Choose Photo from gallery"
                        >
                          {isProcessingImage ? (
                            <ActivityIndicator size="small" color={colors.text} />
                          ) : (
                            <>
                              <Ionicons name="image-outline" size={14} color={colors.text} />
                              <Text style={[styles.photoActionBtnText, { color: colors.text }]}>Choose Photo</Text>
                            </>
                          )}
                        </Pressable>

                        {Platform.OS !== 'web' && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.photoActionBtn,
                              { backgroundColor: colors.card, borderColor: colors.border },
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={handleTakePhoto}
                            disabled={isProcessingImage}
                            accessibilityRole="button"
                            accessibilityLabel="Take Photo with camera"
                          >
                            <Ionicons name="camera-outline" size={14} color={colors.text} />
                            <Text style={[styles.photoActionBtnText, { color: colors.text }]}>Take Photo</Text>
                          </Pressable>
                        )}

                        {customImage ? (
                          <Pressable
                            style={({ pressed }) => [
                              styles.photoRemoveBtn,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={handleRemoveCustomPhoto}
                            accessibilityRole="button"
                            accessibilityLabel="Remove custom photo"
                          >
                            <Ionicons name="trash-outline" size={13} color="#EF4444" />
                            <Text style={styles.photoRemoveBtnText}>Remove</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>

                    <View style={[styles.modeNoticeBox, { backgroundColor: isDark ? '#0F0E1A' : (colors.panel2 || '#F0F2F6'), borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
                      <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
                      <Text style={[styles.modeNoticeText, { color: colors.muted }]}>
                        Custom photo replaces your Drama Persona icon and is compressed and optimized for fast loading.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modeContent}>
                    {/* Persona Preview */}
                    <View style={[styles.previewContainer, { backgroundColor: isDark ? '#0F0E1A' : (colors.panel2 || '#F0F2F6') }]}>
                      <View
                        style={[
                          styles.avatarPreview,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.pink,
                            borderWidth: 2,
                            shadowColor: colors.shadowColor || '#000000',
                            shadowOpacity: isDark ? 0.3 : (colors.shadowOpacity || 0.05),
                            elevation: isDark ? 4 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.avatarPreviewInner, { backgroundColor: selectedColor }]}>
                          <Ionicons name={selectedIcon} size={42} color="#FFFFFF" />
                        </View>
                      </View>
                      <Text style={[styles.previewLabel, { color: colors.text }]}>
                        {AVATAR_ICONS.find((i) => i.icon === selectedIcon)?.label || 'Profile Icon'}
                      </Text>
                    </View>

                    {/* Color Swatches */}
                    <Text style={[styles.modalSectionHeading, { color: colors.muted }]}>CHOOSE COLOR THEME</Text>
                    <View style={styles.colorPaletteRow}>
                      {COLOR_PALETTES.map((col) => {
                        const isSelected = selectedColor === col;
                        return (
                          <Pressable
                            key={col}
                            style={[
                              styles.colorSwatch,
                              { backgroundColor: col },
                              isSelected && styles.colorSwatchActive,
                            ]}
                            onPress={() => setSelectedColor(col)}
                            accessibilityRole="button"
                            accessibilityLabel={`Select color ${col}`}
                          >
                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Icon Grid */}
                    <Text style={[styles.modalSectionHeading, { color: colors.muted }]}>SELECT DRAMA PERSONA</Text>
                    <View style={styles.iconGrid}>
                      {AVATAR_ICONS.map((item) => {
                        const isSelected = selectedIcon === item.icon;
                        return (
                          <Pressable
                            key={item.id}
                            style={[
                              styles.iconTile,
                              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                              isSelected && [styles.iconTileActive, { borderColor: selectedColor, backgroundColor: isDark ? '#1E1A2C' : (colors.panel2 || '#ECEEF4') }],
                            ]}
                            onPress={() => setSelectedIcon(item.icon)}
                            accessibilityRole="button"
                            accessibilityLabel={item.label}
                          >
                            <View
                              style={[
                                styles.iconTileBg,
                                { backgroundColor: isSelected ? selectedColor : (isDark ? '#1C1B2A' : '#E2E6ED') },
                              ]}
                            >
                              <Ionicons name={item.icon} size={22} color={isSelected ? '#FFFFFF' : colors.text} />
                            </View>
                            <Text
                              style={[
                                styles.iconTileLabel,
                                { color: colors.muted },
                                isSelected && { color: colors.text, fontWeight: '800' },
                              ]}
                              numberOfLines={1}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* SECTION 4: DANGER ZONE (ACCOUNT DELETION) */}
              <View style={[styles.editSection, { marginTop: 14, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.editSectionHeading, { color: '#EF4444' }]}>DANGER ZONE</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteAccountEditBtn,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    setShowEditModal(false);
                    navigation.navigate('Settings', { openDeleteModal: true });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Delete Account"
                >
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  <Text style={styles.deleteAccountEditText}>Delete Account</Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
              <Pressable
                style={[styles.cancelBtn, { backgroundColor: isDark ? '#1C192E' : (colors.panel2 || '#EEF1F6') }]}
                onPress={() => setShowEditModal(false)}
                disabled={isSavingProfile}
              >
                <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveAvatarBtn,
                  { backgroundColor: colors.pink },
                  isSavingProfile && { opacity: 0.7 },
                ]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveAvatarBtnText}>Save Profile</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 19,
    paddingTop: 48,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  avatarWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#eb5b78',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#f59ac6',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarIconCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  email: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  pencilEditButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#161424',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity ?? 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pencilEditButtonHovered: {
    backgroundColor: 'rgba(235, 91, 120, 0.08)',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161424',
    borderWidth: 0,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity ?? 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  gold: {
    color: colors.gold,
  },
  menu: {
    backgroundColor: '#161424',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemHovered: {
    backgroundColor: 'rgba(235, 91, 120, 0.08)',
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  menuSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 33, 63, 0.12)',
  },
  signOutHovered: {
    backgroundColor: 'rgba(232, 33, 63, 0.18)',
  },
  signOutPressed: {
    opacity: 0.7,
  },
  signOutText: {
    color: colors.redBright,
    fontSize: 14,
    fontWeight: '800',
  },
  avatarHovered: {
    opacity: 0.9,
    transform: [{ scale: 1.05 }],
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: colors.card,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
    elevation: 3,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 3,
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F0E1A',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#1E1B2E',
  },
  modeTabText: {
    color: '#8D8B98',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modeContent: {
    width: '100%',
  },
  modeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F0E1A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  modeNoticeText: {
    flex: 1,
    color: '#8D8B98',
    fontSize: 11,
    lineHeight: 15,
  },
  /* MODAL STYLES */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#161424',
    borderRadius: 20,
    padding: 22,
    maxHeight: '90%',
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.shadowOpacity ? colors.shadowOpacity * 1.5 : 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#8D8B98',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalBodyScroll: {
    maxHeight: 460,
  },
  modalBodyScrollContent: {
    paddingBottom: 8,
  },
  editSection: {
    marginBottom: 18,
  },
  editSectionHeading: {
    color: '#8D8B98',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
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
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emailCard: {
    backgroundColor: '#0D0C17',
    borderWidth: 1,
    borderColor: '#26233A',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  emailCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  emailCurrentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  emailCurrentText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emailBadgeText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '800',
  },
  changeEmailTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(235, 91, 120, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(235, 91, 120, 0.28)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  changeEmailTriggerText: {
    color: '#eb5b78',
    fontSize: 12,
    fontWeight: '700',
  },
  emailFlowCard: {
    backgroundColor: '#12101F',
    borderWidth: 1,
    borderColor: '#363050',
    borderRadius: 12,
    padding: 14,
  },
  emailFlowStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  emailFlowTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  emailFlowDesc: {
    color: '#8D8B98',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  emailOtpInput: {
    backgroundColor: '#0D0C17',
    borderWidth: 1.5,
    borderColor: '#eb5b78',
    borderRadius: 10,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    marginVertical: 8,
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: 6,
  },
  resendTimerText: {
    color: '#8D8B98',
    fontSize: 11.5,
    fontWeight: '600',
  },
  resendLinkText: {
    color: '#eb5b78',
    fontSize: 11.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  emailBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  emailSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emailSecondaryBtnText: {
    color: '#D7D4DC',
    fontSize: 11.5,
    fontWeight: '600',
  },
  emailPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#eb5b78',
  },
  emailPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  emailErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  emailErrorText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  emailSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  emailSuccessText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: '#0F0E1A',
    borderRadius: 14,
  },
  avatarPreview: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#eb5b78',
    padding: 3,
    backgroundColor: '#eb5b78',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarPreviewInner: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPreviewPhoto: {
    width: '100%',
    height: '100%',
  },
  customPhotoBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E1B2D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  photoActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  photoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  photoRemoveBtnText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '700',
  },
  previewLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  modalSectionHeading: {
    color: '#8D8B98',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  iconScroll: {
    maxHeight: 180,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconTile: {
    width: '31%',
    backgroundColor: '#141322',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconTileActive: {
    backgroundColor: '#1E1A2C',
  },
  iconTileBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconTileLabel: {
    color: '#A19EA9',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconTileLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
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
  saveAvatarBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveAvatarBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteAccountEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 11,
  },
  deleteAccountEditText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
