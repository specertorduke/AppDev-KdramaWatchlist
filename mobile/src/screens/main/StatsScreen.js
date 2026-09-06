import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { userService } from '../../services/api';

export default function StatsScreen({ navigation }) {
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
  const averageRating = (stats?.average_rating ?? 9.5).toFixed ? stats.average_rating.toFixed(1) : '9.5';

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
      contentContainerStyle={styles.content}
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
              size={11}
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
        <Ionicons name={icon} size={14} color={colors.text} />
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
    width: 29,
    height: 29,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  mainStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    width: '48.5%',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
  },
  statIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
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
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.text,
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 2,
  },
  statSub: {
    color: colors.muted,
    fontSize: 7.5,
    marginTop: 1,
  },
  ratingPanel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  ratingLabel: {
    color: colors.muted,
    fontSize: 8,
    marginTop: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 3,
  },
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  statusRow: {
    marginBottom: 10,
  },
  statusLast: {
    marginBottom: 0,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusName: {
    fontSize: 9,
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
    fontSize: 8.5,
    fontWeight: '700',
  },
  statusTrack: {
    height: 4,
    backgroundColor: '#232230',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statusFill: {
    height: '100%',
    borderRadius: 2,
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
    marginBottom: 9,
  },
  genreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  genreName: {
    color: colors.text,
    fontSize: 8.5,
    fontWeight: '700',
  },
  genreCount: {
    color: colors.muted,
    fontSize: 8,
  },
  genreTrack: {
    height: 4,
    backgroundColor: '#232230',
    borderRadius: 2,
    overflow: 'hidden',
  },
  genreFill: {
    height: '100%',
    backgroundColor: colors.redBright,
    borderRadius: 2,
  },
  topRatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRatedPoster: {
    width: 32,
    height: 44,
    borderRadius: 5,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  topRatedInfo: {
    flex: 1,
  },
  topRatedTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  topRatedMeta: {
    color: colors.muted,
    fontSize: 7.5,
    marginTop: 2,
  },
  topRatedScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  scoreText: {
    color: colors.redBright,
    fontSize: 9,
    fontWeight: '900',
  },
});
