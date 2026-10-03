import React, { useState, useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import DramaCard from '../../components/DramaCard';
import { homeService } from '../../services/api';

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isSmallPhone = width <= 380;
  const horizontalPadding = isSmallPhone ? 12 : 16;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await homeService.getDashboard();
      setDashboardData(res.data.data);
    } catch (err) {
      console.warn('Failed to load dashboard from backend, using fallback layout:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const greeting = dashboardData?.greeting?.user_name || 'K-Drama Fan';
  const stats = dashboardData?.stats || { listed: 0, watching: 0, completed: 0, hours_watched: 0 };
  const currentlyWatching = dashboardData?.currently_watching;
  const recommended = dashboardData?.recommended || [];

  return (
    <View style={styles.screen}>
      {/* Top Mobile Bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>SarangTV</Text>
        <View style={styles.topBarRight}>
          <Pressable
            style={({ pressed }) => [styles.topIconButton, pressed && styles.topIconButtonPressed]}
            onPress={() => navigation.navigate('Discover')}
          >
            <Ionicons name="search-outline" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.topIconButton, pressed && styles.topIconButtonPressed]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.red} />
          </View>
        ) : (
          <>
            {/* Header Greeting */}
            <View style={styles.header}>
              <Text style={styles.eyebrow}>ANNYEONGHASEYO</Text>
              <Text style={styles.title}>{greeting} 👋</Text>
              <Text style={styles.subtitle}>Here is your daily K-Drama watch roundup</Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats.listed ?? 0}</Text>
                <Text style={styles.statLbl}>Listed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: colors.blue }]}>{stats.watching ?? 0}</Text>
                <Text style={styles.statLbl}>Watching</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: colors.green }]}>{stats.completed ?? 0}</Text>
                <Text style={styles.statLbl}>Done</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: colors.gold }]}>
                  {Math.round(stats.hours_watched ?? 0)}h
                </Text>
                <Text style={styles.statLbl}>Watched</Text>
              </View>
            </View>

            {/* Currently Watching Hero Card */}
            {currentlyWatching ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🎬 Continue Watching</Text>
                  <Pressable onPress={() => navigation.navigate('Tracker')}>
                    <Text style={styles.sectionAction}>View all</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.watchingCard}
                  onPress={() =>
                    navigation.navigate('DramaDetail', { tmdbId: currentlyWatching.tmdb_id })
                  }
                >
                  <Image
                    source={{
                      uri:
                        currentlyWatching.poster_url ||
                        currentlyWatching.backdrop_url ||
                        'https://via.placeholder.com/300x450',
                    }}
                    style={styles.watchingPoster}
                  />
                  <View style={styles.watchingInfo}>
                    <Text style={styles.watchingTitle} numberOfLines={1}>
                      {currentlyWatching.title}
                    </Text>
                    <Text style={styles.watchingEp}>
                      Episode {currentlyWatching.current_episode} of{' '}
                      {currentlyWatching.total_episodes || '?'}
                    </Text>

                    {/* Progress bar */}
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(
                              100,
                              currentlyWatching.progress_percentage ||
                                (currentlyWatching.current_episode /
                                  (currentlyWatching.total_episodes || 1)) *
                                  100
                            )}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.progressPercent}>
                      {currentlyWatching.progress_percentage || 0}% Completed
                    </Text>
                  </View>
                </Pressable>
              </View>
            ) : null}

            {/* Recommended Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔥 Recommended For You</Text>
                <Pressable onPress={() => navigation.navigate('Discover')}>
                  <Text style={styles.sectionAction}>Discover</Text>
                </Pressable>
              </View>

              <View style={styles.grid}>
                {recommended.map((drama) => (
                  <View key={drama.tmdb_id || drama.id} style={styles.gridCol}>
                    <DramaCard
                      drama={drama}
                      onPress={(d) => navigation.navigate('DramaDetail', { tmdbId: d.tmdb_id || d.id })}
                    />
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.nav,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.redBright,
    letterSpacing: 0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.panel,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIconButtonPressed: {
    opacity: 0.7,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  statVal: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },
  statLbl: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.muted,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sectionAction: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.redBright,
  },
  watchingCard: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  watchingPoster: {
    width: 65,
    height: 90,
    borderRadius: 8,
  },
  watchingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  watchingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  watchingEp: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.redBright,
  },
  progressPercent: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.gold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridCol: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
});
