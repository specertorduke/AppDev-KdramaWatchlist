import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
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
    if (!name) return 'KD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name || 'K-Drama Fan'}</Text>
            <Text style={styles.email}>{user?.email || 'user@sarangtv.app'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_dramas ?? 0}</Text>
            <Text style={styles.statLabel}>Dramas</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.episodes_watched ?? 0}</Text>
            <Text style={styles.statLabel}>Episodes</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.gold }]}>
              {Math.round(stats?.hours_watched ?? 0)}h
            </Text>
            <Text style={styles.statLabel}>Watched</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menu}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => navigation.navigate('Tracker')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="bookmark-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>My Watchlist</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => navigation.navigate('Discover')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="compass-outline" size={20} color={colors.text} />
              <Text style={styles.menuItemText}>Discover Dramas</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              styles.logoutItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={logout}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>Sign Out</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.nav,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.redBright,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: colors.muted,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
  },
  divider: {
    width: 1,
    backgroundColor: colors.line,
  },
  menu: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuItemPressed: {
    backgroundColor: colors.panel2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
});
