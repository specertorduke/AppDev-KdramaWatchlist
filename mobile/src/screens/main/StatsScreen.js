import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { userService } from '../../services/api';

export default function StatsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService
      .getStats()
      .then((res) => {
        setStats(res.data.data || res.data.stats || res.data);
      })
      .catch((err) => {
        console.warn('Failed to load user stats:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalDramas = stats?.total_dramas ?? 5;
  const episodesWatched = stats?.episodes_watched ?? 18;
  const hoursWatched = Math.round(stats?.hours_watched ?? 17);
  const completedCount = stats?.completed_count ?? 1;
  const watchingCount = stats?.watching_count ?? 2;
  const planCount = stats?.plan_to_watch_count ?? 1;
  const onHoldCount = stats?.on_hold_count ?? 1;
  const droppedCount = stats?.dropped_count ?? 0;
  const rawAvg = stats?.average_rating;
  const averageRating = rawAvg !== null && rawAvg !== undefined && !isNaN(Number(rawAvg))
    ? Number(rawAvg).toFixed(1)
    : '0.0';

  const genreData = [
    { name: 'Romance', count: 2, percent: 100 },
    { name: 'Thriller', count: 1, percent: 51 },
    { name: 'Historical', count: 1, percent: 51 },
    { name: 'Fantasy', count: 1, percent: 51 },
    { name: 'Mystery', count: 1, percent: 51 },
  ];

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
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={15} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>My Stats</Text>
      </View>

      {/* Main Statistics */}
      <View style={styles.mainStats}>
        <StatBox
          icon="bookmark-outline"
          iconTone="purple"
          value={totalDramas}
          label="Total Dramas"
          sub="in your list"
        />
        <StatBox
          icon="play-outline"
          iconTone="blue"
          value={episodesWatched}
          label="Episodes Watched"
          sub="episodes done"
        />
        <StatBox
          icon="time-outline"
          iconTone="gold"
          value={`${hoursWatched}h`}
          label="Hours Watched"
          sub="time well spent"
        />
        <StatBox
          icon="checkmark"
          iconTone="green"
          value={completedCount}
          label="Completed"
          sub="2 watching"
        />
      </View>

      {/* Average Rating */}
      <View style={styles.ratingPanel}>
        <View>
          <Text style={styles.ratingValue}>{averageRating}</Text>
          <Text style={styles.ratingLabel}>Avg. rating</Text>
        </View>

        <View style={styles.stars}>
          {Array.from({ length: 10 }).map((_, index) => (
            <Ionicons
              key={index}
              name="star"
              size={16}
              color={colors.redBright}
            />
          ))}
        </View>
      </View>

      {/* Status Breakdown */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>STATUS BREAKDOWN</Text>

        <StatusBar
          name="Watching"
          count={watchingCount}
          percent={40}
          tone="blue"
        />
        <StatusBar
          name="Completed"
          count={completedCount}
          percent={20}
          tone="green"
        />
        <StatusBar
          name="Plan to Watch"
          count={planCount}
          percent={20}
          tone="purple"
        />
        <StatusBar
          name="On Hold"
          count={onHoldCount}
          percent={20}
          tone="gold"
        />
        <StatusBar
          name="Dropped"
          count={droppedCount}
          percent={0}
          tone="red"
          last
        />
      </View>

      {/* Favourite Genres */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>FAVOURITE GENRES</Text>

        {genreData.map((genre) => (
          <View key={genre.name} style={styles.genreRow}>
            <View style={styles.genreHeader}>
              <Text style={styles.genreName}>{genre.name}</Text>
              <Text style={styles.genreCount}>{genre.count} dramas</Text>
            </View>
            <View style={styles.genreTrack}>
              <View style={[styles.genreFill, { width: `${genre.percent}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Top Rated Panel */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>MY TOP RATED</Text>
        <View style={styles.topRatedRow}>
          <View style={styles.topRatedPoster}>
            <Ionicons name="film-outline" size={18} color={colors.muted} />
          </View>
          <View style={styles.topRatedInfo}>
            <Text style={styles.topRatedTitle}>Pole Lantern</Text>
            <Text style={styles.topRatedMeta}>Mystery · Drama</Text>
          </View>
          <View style={styles.topRatedScore}>
            <Ionicons name="star" size={10} color={colors.redBright} />
            <Text style={styles.scoreText}>10/10</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatBox({ icon, iconTone, value, label, sub }) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIcon, styles[`icon_${iconTone}`]]}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function StatusBar({ name, count, percent, tone, last }) {
  return (
    <View style={[styles.statusRow, last && styles.statusLast]}>
      <View style={styles.statusHeader}>
        <Text style={[styles.statusName, styles[`status_${tone}`]]}>{name}</Text>
        <Text style={styles.statusCount}>{count}</Text>
      </View>
      <View style={styles.statusTrack}>
        <View style={[styles.statusFill, styles[`statusFill_${tone}`], { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 17,
    paddingBottom: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  mainStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statBox: {
    width: '48.5%',
    backgroundColor: '#161424',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  icon_purple: {
    backgroundColor: '#2D204A',
  },
  icon_blue: {
    backgroundColor: '#1E2D4A',
  },
  icon_gold: {
    backgroundColor: '#3E341F',
  },
  icon_green: {
    backgroundColor: '#1C3A2E',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  statSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  ratingPanel: {
    backgroundColor: '#161424',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  ratingValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
  },
  ratingLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  panel: {
    backgroundColor: '#161424',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    color: '#8D8B98',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusLast: {
    marginBottom: 0,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusName: {
    fontSize: 12,
    fontWeight: '800',
  },
  status_blue: {
    color: '#60A5FA',
  },
  status_green: {
    color: '#34D399',
  },
  status_purple: {
    color: '#A78BFA',
  },
  status_gold: {
    color: '#FBBF24',
  },
  status_red: {
    color: '#F87171',
  },
  statusCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statusTrack: {
    height: 6,
    backgroundColor: '#232230',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusFill_blue: {
    backgroundColor: '#60A5FA',
  },
  statusFill_green: {
    backgroundColor: '#34D399',
  },
  statusFill_purple: {
    backgroundColor: '#A78BFA',
  },
  statusFill_gold: {
    backgroundColor: '#FBBF24',
  },
  statusFill_red: {
    backgroundColor: '#F87171',
  },
  genreRow: {
    marginBottom: 12,
  },
  genreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  genreName: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '700',
  },
  genreCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  genreTrack: {
    height: 6,
    backgroundColor: '#232230',
    borderRadius: 3,
    overflow: 'hidden',
  },
  genreFill: {
    height: '100%',
    backgroundColor: colors.redBright,
    borderRadius: 3,
  },
  topRatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRatedPoster: {
    width: 40,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topRatedInfo: {
    flex: 1,
  },
  topRatedTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  topRatedMeta: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  topRatedScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    color: colors.redBright,
    fontSize: 12,
    fontWeight: '900',
  },
});
