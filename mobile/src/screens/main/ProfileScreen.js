import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout, openAccountChooser, updateProfileAvatar } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(user?.avatarIcon || 'heart');
  const [selectedColor, setSelectedColor] = useState(user?.color || '#F5A9C4');

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
    '#F5A9C4', // Signature Pink
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
  }, [user]);

  const handleSaveAvatar = async (icon, color) => {
    setSelectedIcon(icon);
    setSelectedColor(color);
    await updateProfileAvatar({ avatarIcon: icon, color });
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

  useEffect(() => {
    fetchProfileStats();
  }, []);

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

  const activeColor = user?.color || selectedColor || '#F5A9C4';
  const activeIcon = user?.avatarIcon || selectedIcon;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
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
            styles.avatar,
            { backgroundColor: activeColor },
            hovered && styles.avatarHovered,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => setShowAvatarModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Change profile avatar"
        >
          {activeIcon ? (
            <Ionicons name={activeIcon} size={24} color="#FFFFFF" />
          ) : (
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={10} color="#FFFFFF" />
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

            {/* Current Preview */}
            <View style={styles.previewContainer}>
              <View style={[styles.avatarPreview, { backgroundColor: selectedColor }]}>
                <Ionicons name={selectedIcon} size={44} color="#FFFFFF" />
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

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowAvatarModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.saveAvatarBtn, { backgroundColor: selectedColor }]}
                onPress={() => handleSaveAvatar(selectedIcon, selectedColor)}
              >
                <Text style={styles.saveAvatarBtnText}>Save Profile Style</Text>
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
    marginBottom: 18,
  },
  avatar: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#F5A9C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#07070E',
    fontSize: 15,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  email: {
    color: colors.muted,
    fontSize: 8.5,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtnHovered: {
    backgroundColor: colors.panel2,
    borderColor: colors.red,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    paddingVertical: 13,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 45,
    backgroundColor: colors.line,
  },
  statValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  gold: {
    color: colors.gold,
  },
  menu: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    overflow: 'hidden',
    marginBottom: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemHovered: {
    backgroundColor: colors.panel2,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: '800',
  },
  menuSubtitle: {
    color: colors.muted,
    fontSize: 8,
    marginTop: 1,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(232,33,63,0.3)',
    backgroundColor: 'rgba(232,33,63,0.06)',
  },
  signOutHovered: {
    backgroundColor: 'rgba(232,33,63,0.12)',
    borderColor: colors.redBright,
  },
  signOutPressed: {
    opacity: 0.7,
  },
  signOutText: {
    color: colors.redBright,
    fontSize: 10,
    fontWeight: '800',
  },
  avatarHovered: {
    opacity: 0.9,
    transform: [{ scale: 1.05 }],
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E1B2E',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#07070E',
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
    backgroundColor: '#100F1B',
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
    backgroundColor: '#0A0A12',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    color: '#07070E',
    fontSize: 12,
    fontWeight: '900',
  },
});
