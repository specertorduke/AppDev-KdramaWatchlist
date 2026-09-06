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
  const { user, logout, openAccountChooser, removeSavedAccount } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </View>

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
            <Ionicons name="create-outline" size={15} color={colors.text} />
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
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
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
});
