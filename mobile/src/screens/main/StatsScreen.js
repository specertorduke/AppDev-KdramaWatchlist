import React, { useState, useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { userService, trackerService } from '../../services/api';

export default function StatsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userService.getStats().catch(() => null),
      trackerService.getWatchlist().catch(() => null),
    ])
      .then(([statsRes, watchlistRes]) => {
        if (statsRes) {
          setStats(statsRes.data?.data || statsRes.data?.stats || statsRes.data);
        }
        if (watchlistRes) {
          const raw = watchlistRes.data?.data || watchlistRes.data || [];
          setWatchlist(Array.isArray(raw) ? raw : []);
        }
      })
      .catch((err) => {
        console.warn('Failed to load user stats/watchlist:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Compute genre distribution from actual watchlist items
  const genreData = useMemo(() => {
    if (!watchlist.length) {
      return [
        { name: 'Romance', count: 2, percent: 100 },
        { name: 'Thriller', count: 1, percent: 50 },
        { name: 'Historical', count: 1, percent: 50 },
      ];
    }
    const counts = {};
    watchlist.forEach((d) => {
      const drama = d.drama || d;
      let gList = [];
      const rawGenres = drama.genres || d.genres || drama.genre || d.genre;
      if (Array.isArray(rawGenres)) {
        gList = rawGenres.map((g) => (typeof g === 'string' ? g : g?.name || '')).filter(Boolean);
      } else if (typeof rawGenres === 'string') {
        gList = rawGenres.split(/[,·•|/]/).map((g) => g.trim()).filter(Boolean);
      }
      gList.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const max = sorted[0]?.count || 1;
    return sorted.slice(0, 5).map((g) => ({
      ...g,
      percent: Math.round((g.count / max) * 100),
    }));
  }, [watchlist]);

  // Compute top rated drama from actual user rating
  const topRatedDrama = useMemo(() => {
    const rated = watchlist.filter((d) => {
      const r = d.rating ?? d.my_rating ?? d.drama?.rating;
      return r !== null && r !== undefined && Number(r) > 0;
    });
    if (!rated.length) return null;
    const best = [...rated].sort((a, b) => {
      const rA = Number(a.rating ?? a.my_rating ?? a.drama?.rating ?? 0);
      const rB = Number(b.rating ?? b.my_rating ?? b.drama?.rating ?? 0);
      return rB - rA;
    })[0];

    const drama = best.drama || {};
    const title = drama.title || drama.name || best.title || 'Untitled Drama';
    const poster = drama.poster_url || drama.image || drama.poster || best.poster_url || best.poster || best.image || null;
    const tmdbId = best.tmdb_id || drama.tmdb_id || best.id;
    const rawGenres = drama.genres || best.genres || drama.genre || best.genre || [];
    const genres = Array.isArray(rawGenres)
      ? rawGenres.map((g) => (typeof g === 'string' ? g : g?.name || '')).filter(Boolean)
      : typeof rawGenres === 'string'
      ? rawGenres.split(/[,·•|/]/).map((g) => g.trim()).filter(Boolean)
      : [];

    return {
      ...best,
      title,
      poster,
      tmdbId,
      genres,
      ratingScore: Number(best.rating ?? best.my_rating ?? drama.rating ?? 0),
    };
  }, [watchlist]);

  // Compute activity history from tracked items
  const activityHistory = useMemo(() => {
    if (!watchlist.length) return [];
    return watchlist.slice(0, 8).map((item) => {
      const drama = item.drama || {};
      const title = drama.title || drama.name || item.title || 'Untitled Drama';
      const poster = drama.poster_url || drama.image || drama.poster || item.poster_url || item.poster || item.image || null;
      const tmdbId = item.tmdb_id || drama.tmdb_id || item.id;
      const totalEpisodes = Number(item.total_episodes) || Number(drama.total_episodes) || Number(item.episodes) || 16;
      const currentEp = Number(item.current_episode) || 0;

      let action = `Added to ${item.status || 'Watchlist'}`;
      if (item.status === 'Completed') {
        action = `Completed all ${totalEpisodes} episodes`;
      } else if (currentEp > 0) {
        action = `Watched Ep. ${currentEp} of ${totalEpisodes}`;
      }
      return {
        id: item.id || tmdbId || Math.random().toString(),
        tmdbId,
        title,
        poster,
        action,
        status: item.status,
        dateStr: item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
      };
    });
  }, [watchlist]);

  const totalDramas = stats?.total_dramas ?? watchlist.length;
  const episodesWatched = stats?.episodes_watched ?? watchlist.reduce((acc, d) => acc + (d.current_episode || 0), 0);
  const hoursWatched = Math.round(stats?.hours_watched ?? episodesWatched);
  const completedCount = stats?.status_breakdown?.completed ?? stats?.completed_count ?? watchlist.filter(d => d.status === 'Completed').length;
  const watchingCount = stats?.status_breakdown?.watching ?? stats?.watching_count ?? watchlist.filter(d => d.status === 'Watching').length;
  const planCount = stats?.status_breakdown?.plan_to_watch ?? stats?.plan_to_watch_count ?? watchlist.filter(d => d.status === 'Plan to Watch' || d.status === 'Plan').length;
  const onHoldCount = stats?.status_breakdown?.on_hold ?? stats?.on_hold_count ?? watchlist.filter(d => d.status === 'On Hold').length;
  const droppedCount = stats?.status_breakdown?.dropped ?? stats?.dropped_count ?? watchlist.filter(d => d.status === 'Dropped').length;
  const rawAvg = stats?.average_rating;
  const averageRating = rawAvg !== null && rawAvg !== undefined && !isNaN(Number(rawAvg))
    ? Number(rawAvg).toFixed(1)
    : (watchlist.filter(d => d.rating).length > 0
        ? (watchlist.filter(d => d.rating).reduce((sum, d) => sum + Number(d.rating), 0) / watchlist.filter(d => d.rating).length).toFixed(1)
        : '0.0');

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
          style={[
            styles.backButton,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 },
          ]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={15} color={colors.text} />
        </Pressable>
        <Text style={[styles.heading, { color: colors.text }]}>My Stats</Text>
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
          sub={`${watchingCount} watching`}
        />
      </View>

      {/* Average Rating */}
      <View style={[styles.ratingPanel, { backgroundColor: colors.card, borderWidth: 0 }]}>
        <View>
          <Text style={[styles.ratingValue, { color: colors.text }]}>{averageRating}</Text>
          <Text style={[styles.ratingLabel, { color: colors.muted }]}>Avg. rating</Text>
        </View>

        <View style={styles.stars}>
          {Array.from({ length: 10 }).map((_, index) => (
            <Ionicons
              key={index}
              name="star"
              size={16}
              color={index < Math.round(Number(averageRating) || 0) ? colors.pink : (isDark ? '#2B2839' : '#D1D5DB')}
            />
          ))}
        </View>
      </View>

      {/* Status Breakdown */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderWidth: 0 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>STATUS BREAKDOWN</Text>

        <StatusBar
          name="Watching"
          count={watchingCount}
          percent={totalDramas > 0 ? Math.round((watchingCount / totalDramas) * 100) : 0}
          tone="blue"
          colors={colors}
          isDark={isDark}
        />
        <StatusBar
          name="Completed"
          count={completedCount}
          percent={totalDramas > 0 ? Math.round((completedCount / totalDramas) * 100) : 0}
          tone="green"
          colors={colors}
          isDark={isDark}
        />
        <StatusBar
          name="Plan to Watch"
          count={planCount}
          percent={totalDramas > 0 ? Math.round((planCount / totalDramas) * 100) : 0}
          tone="yellow"
          colors={colors}
          isDark={isDark}
        />
        <StatusBar
          name="On Hold"
          count={onHoldCount}
          percent={totalDramas > 0 ? Math.round((onHoldCount / totalDramas) * 100) : 0}
          tone="gold"
          colors={colors}
          isDark={isDark}
        />
        <StatusBar
          name="Dropped"
          count={droppedCount}
          percent={totalDramas > 0 ? Math.round((droppedCount / totalDramas) * 100) : 0}
          tone="red"
          last
          colors={colors}
          isDark={isDark}
        />
      </View>

      {/* Favourite Genres */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>FAVOURITE GENRES</Text>

        {genreData.map((genre) => (
          <View key={genre.name} style={styles.genreRow}>
            <View style={styles.genreHeader}>
              <Text style={[styles.genreName, { color: colors.text }]}>{genre.name}</Text>
              <Text style={[styles.genreCount, { color: colors.muted }]}>{genre.count} dramas</Text>
            </View>
            <View style={[styles.genreTrack, { backgroundColor: isDark ? '#232230' : (colors.line || 'rgba(0,0,0,0.08)') }]}>
              <View style={[styles.genreFill, { width: `${genre.percent}%`, backgroundColor: colors.pink }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Top Rated Panel */}
      {topRatedDrama && (
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>MY TOP RATED</Text>
          <Pressable
            style={styles.topRatedRow}
            onPress={() => topRatedDrama.tmdbId && navigation.navigate('DramaDetail', { tmdbId: topRatedDrama.tmdbId })}
          >
            {topRatedDrama.poster ? (
              <Image
                source={{ uri: topRatedDrama.poster }}
                style={styles.topRatedPosterImg}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.topRatedPoster, { backgroundColor: isDark ? colors.bg : (colors.panel2 || '#EEF1F6') }]}>
                <Ionicons name="film-outline" size={18} color={colors.muted} />
              </View>
            )}
            <View style={styles.topRatedInfo}>
              <Text style={[styles.topRatedTitle, { color: colors.text }]} numberOfLines={1}>
                {topRatedDrama.title}
              </Text>
              <Text style={[styles.topRatedMeta, { color: colors.muted }]}>
                {(Array.isArray(topRatedDrama.genres) ? topRatedDrama.genres : []).slice(0, 2).join(' · ') || 'Drama'}
              </Text>
            </View>
            <View style={styles.topRatedScore}>
              <Ionicons name="star" size={12} color={colors.pink} />
              <Text style={[styles.scoreText, { color: colors.pink }]}>
                {(topRatedDrama.ratingScore || 0).toFixed(1)}/10
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {/* Activity History Section (Combined from Web) */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>ACTIVITY HISTORY</Text>
        {activityHistory.length > 0 ? (
          <View style={styles.historyList}>
            {activityHistory.map((item) => (
              <Pressable
                key={String(item.id)}
                style={styles.historyItem}
                onPress={() => item.tmdbId && navigation.navigate('DramaDetail', { tmdbId: item.tmdbId })}
              >
                {item.poster ? (
                  <Image source={{ uri: item.poster }} style={styles.historyThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.historyThumb, { backgroundColor: isDark ? colors.bg : (colors.panel2 || '#EEF1F6') }]}>
                    <Ionicons name="film-outline" size={14} color={colors.muted} />
                  </View>
                )}
                <View style={styles.historyDetails}>
                  <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.historyAction, { color: colors.muted }]} numberOfLines={1}>
                    {item.action}
                  </Text>
                </View>
                <Text style={[styles.historyDate, { color: colors.muted }]}>{item.dateStr}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={32} color={colors.muted} />
            <Text style={[styles.emptyHistoryTitle, { color: colors.text }]}>No history yet</Text>
            <Text style={[styles.emptyHistorySub, { color: colors.muted }]}>
              Your watch activity will appear here as you track dramas.
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatBox({ icon, iconTone, value, label, sub }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.statBox,
        { backgroundColor: colors.card, borderWidth: 0 },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: isDark
              ? (iconTone === 'purple' ? '#2D204A' : iconTone === 'blue' ? '#1E2D4A' : iconTone === 'gold' ? '#3E341F' : '#1C3A2E')
              : (iconTone === 'purple' ? 'rgba(139, 92, 246, 0.14)' : iconTone === 'blue' ? 'rgba(96, 165, 250, 0.14)' : iconTone === 'gold' ? 'rgba(255, 215, 106, 0.25)' : 'rgba(16, 185, 129, 0.14)'),
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={isDark ? '#FFFFFF' : (iconTone === 'purple' ? colors.purple : iconTone === 'blue' ? colors.blue : iconTone === 'gold' ? (colors.gold || '#B87A04') : colors.green)}
        />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statSub, { color: colors.muted }]}>{sub}</Text>
    </View>
  );
}

function StatusBar({ name, count, percent, tone, last, colors, isDark }) {
  return (
    <View style={[styles.statusRow, last && styles.statusLast]}>
      <View style={styles.statusHeader}>
        <Text style={[styles.statusName, styles[`status_${tone}`]]}>{name}</Text>
        <Text style={[styles.statusCount, { color: colors.muted }]}>{count}</Text>
      </View>
      <View style={[styles.statusTrack, { backgroundColor: isDark ? '#232230' : (colors.line || 'rgba(0,0,0,0.08)') }]}>
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
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
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
    borderWidth: 0,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity ?? 0.04,
    shadowRadius: 4,
    elevation: 2,
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
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity ?? 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 34,
    paddingTop: 2,
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
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity ?? 0.04,
    shadowRadius: 4,
    elevation: 2,
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
  status_yellow: {
    color: '#FFD76A',
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
  statusFill_yellow: {
    backgroundColor: '#FFD76A',
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
  topRatedPosterImg: {
    width: 40,
    height: 52,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#1E1C2A',
  },
  historyList: {
    marginTop: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  historyThumb: {
    width: 36,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#1E1C2A',
  },
  historyDetails: {
    flex: 1,
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  historyAction: {
    fontSize: 11,
    marginTop: 3,
  },
  historyDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyHistorySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
