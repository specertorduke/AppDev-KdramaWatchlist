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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { pickAndCompressAvatar, takeAndCompressAvatar } from '../../services/imageService';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, openAccountChooser, updateProfileAvatar } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(user?.avatarIcon || 'heart');
  const [selectedColor, setSelectedColor] = useState(user?.color || '#eb5b78');
  const [customImage, setCustomImage] = useState(user?.avatar_url || null);
  const [avatarMode, setAvatarMode] = useState(user?.avatar_url ? 'photo' : 'persona');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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
    if (user?.avatarIcon) setSelectedIcon(user.avatarIcon);
    if (user?.color) setSelectedColor(user.color);
    setCustomImage(user?.avatar_url || null);
    setAvatarMode(user?.avatar_url ? 'photo' : 'persona');
  }, [user]);

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

  const handleSaveAvatar = async () => {
    if (avatarMode === 'photo') {
      if (!customImage) {
        Alert.alert(
          'No Photo Selected',
          'Please choose a photo from your gallery or take a new one first.'
        );
        return;
      }
      await updateProfileAvatar({
        avatarIcon: null,
        avatarUrl: customImage,
      });
    } else {
      await updateProfileAvatar({
        avatarIcon: selectedIcon,
        color: selectedColor,
        avatarUrl: null,
      });
    }
    setShowAvatarModal(false);
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
      style={styles.screen}
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
          onPress={() => setShowAvatarModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Change profile avatar"
        >
          <View style={styles.avatarBorderRing}>
            <View style={[styles.avatarCircle, { backgroundColor: activeColor }]}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatarPhoto}
                  resizeMode="cover"
                />
              ) : activeIcon ? (
                <Ionicons name={activeIcon} size={24} color="#FFFFFF" />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
              )}
            </View>
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={11} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name || 'Kim Ji-young'}</Text>
          <Text style={styles.email}>{user?.email || 'kdramaaddict@email.com'}</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.headerActionBtn,
              hovered && styles.headerActionBtnHovered,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setShowAvatarModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose Avatar"
          >
            <Ionicons name="color-palette-outline" size={15} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.headerActionBtn,
              hovered && styles.headerActionBtnHovered,
              pressed && styles.buttonPressed,
            ]}
            onPress={openAccountChooser}
            accessibilityRole="button"
            accessibilityLabel="Switch Profile"
          >
            <Ionicons name="people-outline" size={15} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.headerActionBtn,
              hovered && styles.headerActionBtnHovered,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="settings-outline" size={15} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Profile Summary */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.total_dramas ?? 4}</Text>
          <Text style={styles.statLabel}>Dramas</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.episodes_watched ?? 18}</Text>
          <Text style={styles.statLabel}>Episodes</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.gold]}>
            {Math.round(stats?.hours_watched ?? 17)}h
          </Text>
          <Text style={[styles.statLabel, styles.gold]}>Watched</Text>
        </View>
      </View>

      {/* Profile Menu */}
      <View style={styles.menu}>
        {/* My Tracker */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('Tracker')}
          accessibilityRole="button"
          accessibilityLabel="My Tracker"
        >
          <View style={styles.menuIcon}>
            <Ionicons name="clipboard-outline" size={15} color={colors.muted} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>My Tracker</Text>
            <Text style={styles.menuSubtitle}>
              {stats?.total_dramas ?? 4} dramas tracked
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </Pressable>

        {/* Stats & History */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('Stats')}
          accessibilityRole="button"
          accessibilityLabel="Stats and History"
        >
          <View style={styles.menuIcon}>
            <Ionicons name="bar-chart-outline" size={15} color={colors.muted} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Stats & History</Text>
            <Text style={styles.menuSubtitle}>
              {stats?.episodes_watched ?? 18} episodes · {Math.round(stats?.hours_watched ?? 17)}h
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </Pressable>

        {/* Favorite Genres & Taste */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('GenreSelection', { isEditing: true })}
          accessibilityRole="button"
          accessibilityLabel="Favorite Genres"
        >
          <View style={styles.menuIcon}>
            <Ionicons name="sparkles-outline" size={15} color="#eb5b78" />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Favorite Genres</Text>
            <Text style={styles.menuSubtitle}>
              {Array.isArray(user?.favorite_genres) && user.favorite_genres.length > 0
                ? user.favorite_genres.join(', ')
                : 'Select your preferred genres'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </Pressable>

        {/* Settings */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <View style={styles.menuIcon}>
            <Ionicons name="settings-outline" size={15} color={colors.muted} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Settings</Text>
            <Text style={styles.menuSubtitle}>Notifications, quality, account</Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </Pressable>

        {/* Switch Account */}
        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            styles.menuItemLast,
            hovered && styles.menuItemHovered,
            pressed && styles.menuItemPressed,
          ]}
          onPress={openAccountChooser}
          accessibilityRole="button"
          accessibilityLabel="Switch Account"
        >
          <View style={styles.menuIcon}>
            <Ionicons name="people-outline" size={15} color={colors.muted} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Switch Account</Text>
            <Text style={styles.menuSubtitle}>Who's tracking? · Change active profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
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

      {/* Netflix-Style Profile Avatar Chooser Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose Profile Style</Text>
                <Text style={styles.modalSubtitle}>Pick an icon and theme for your profile</Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowAvatarModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Mode Switcher: Custom Photo OR Drama Persona */}
            <View style={styles.modeTabBar}>
              <Pressable
                style={[
                  styles.modeTab,
                  avatarMode === 'photo' && styles.modeTabActive,
                ]}
                onPress={() => setAvatarMode('photo')}
              >
                <Ionicons
                  name="camera-outline"
                  size={15}
                  color={avatarMode === 'photo' ? '#FFFFFF' : '#8D8B98'}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    avatarMode === 'photo' && styles.modeTabTextActive,
                  ]}
                >
                  Custom Photo
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modeTab,
                  avatarMode === 'persona' && styles.modeTabActive,
                ]}
                onPress={() => setAvatarMode('persona')}
              >
                <Ionicons
                  name="happy-outline"
                  size={15}
                  color={avatarMode === 'persona' ? '#FFFFFF' : '#8D8B98'}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    avatarMode === 'persona' && styles.modeTabTextActive,
                  ]}
                >
                  Drama Persona
                </Text>
              </Pressable>
            </View>

            {avatarMode === 'photo' ? (
              <View style={styles.modeContent}>
                {/* Photo Preview */}
                <View style={styles.previewContainer}>
                  <View style={styles.avatarPreview}>
                    <View style={[styles.avatarPreviewInner, { backgroundColor: '#1E1B2D' }]}>
                      {customImage ? (
                        <Image
                          source={{ uri: customImage }}
                          style={styles.avatarPreviewPhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="person-outline" size={40} color="#8D8B98" />
                      )}
                    </View>
                  </View>
                  <Text style={styles.previewLabel}>
                    {customImage ? 'Custom Photo Selected' : 'No Photo Selected'}
                  </Text>

                  {/* Photo Actions */}
                  <View style={styles.customPhotoBtnRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.photoActionBtn,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={handlePickCustomImage}
                      disabled={isProcessingImage}
                      accessibilityRole="button"
                      accessibilityLabel="Choose Photo from gallery"
                    >
                      {isProcessingImage ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="image-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.photoActionBtnText}>Choose Photo</Text>
                        </>
                      )}
                    </Pressable>

                    {Platform.OS !== 'web' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.photoActionBtn,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={handleTakePhoto}
                        disabled={isProcessingImage}
                        accessibilityRole="button"
                        accessibilityLabel="Take Photo with camera"
                      >
                        <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.photoActionBtnText}>Take Photo</Text>
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

                <View style={styles.modeNoticeBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#8D8B98" />
                  <Text style={styles.modeNoticeText}>
                    Using a custom photo replaces your Drama Persona icon. Your photo is automatically cropped to a square and optimized.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.modeContent}>
                {/* Persona Preview */}
                <View style={styles.previewContainer}>
                  <View style={styles.avatarPreview}>
                    <View style={[styles.avatarPreviewInner, { backgroundColor: selectedColor }]}>
                      <Ionicons name={selectedIcon} size={42} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.previewLabel}>
                    {AVATAR_ICONS.find((i) => i.icon === selectedIcon)?.label || 'Profile Icon'}
                  </Text>
                </View>

                {/* Color Swatches */}
                <Text style={styles.modalSectionHeading}>CHOOSE COLOR THEME</Text>
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
                <Text style={styles.modalSectionHeading}>SELECT DRAMA PERSONA</Text>
                <ScrollView style={styles.iconScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.iconGrid}>
                    {AVATAR_ICONS.map((item) => {
                      const isSelected = selectedIcon === item.icon;
                      return (
                        <Pressable
                          key={item.id}
                          style={[
                            styles.iconTile,
                            isSelected && [styles.iconTileActive, { borderColor: selectedColor }],
                          ]}
                          onPress={() => setSelectedIcon(item.icon)}
                          accessibilityRole="button"
                          accessibilityLabel={item.label}
                        >
                          <View style={[styles.iconTileBg, { backgroundColor: isSelected ? selectedColor : '#1C1B2A' }]}>
                            <Ionicons name={item.icon} size={22} color="#FFFFFF" />
                          </View>
                          <Text style={[styles.iconTileLabel, isSelected && styles.iconTileLabelActive]} numberOfLines={1}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowAvatarModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveAvatarBtn,
                  { backgroundColor: avatarMode === 'photo' ? '#eb5b78' : selectedColor },
                ]}
                onPress={handleSaveAvatar}
              >
                <Text style={styles.saveAvatarBtnText}>
                  {avatarMode === 'photo' ? 'Save Custom Photo' : 'Save Drama Persona'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    width: 66,
    height: 66,
    marginRight: 14,
  },
  avatarBorderRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#61374c',
    padding: 2.5,
    backgroundColor: '#07070E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActionBtnHovered: {
    backgroundColor: '#1E1B30',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161424',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    backgroundColor: '#1C192E',
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
    backgroundColor: '#1E1B2E',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#07070E',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
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
    borderWidth: 2.5,
    borderColor: '#61374c',
    padding: 3,
    backgroundColor: '#07070E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
});
