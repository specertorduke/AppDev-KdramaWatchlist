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
import { colors } from '../../theme';
import { homeService, trackerService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallPhone = width <= 380;
  const horizontalPadding = isSmallPhone ? 10 : 12;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loggingEp, setLoggingEp] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await homeService.getDashboard();
      setDashboardData(res.data.data);
    } catch (err) {
      console.warn('Failed to load dashboard from backend, fallback displayed:', err);
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

  const greetingName = dashboardData?.greeting?.user_name || 'Ji-young';
  const stats = dashboardData?.stats || { listed: 4, watching: 1, completed: 1, hours_watched: 17 };
  const currentlyWatching = dashboardData?.currently_watching;
  const recommended = dashboardData?.recommended || [];

  const handleIncrement = async (tmdbId) => {
    if (!tmdbId || loggingEp) return;
    setLoggingEp(true);
    try {
      await trackerService.incrementEpisode(tmdbId);
      fetchDashboard();
    } catch (err) {
      console.warn('Could not increment episode:', err);
    } finally {
      setLoggingEp(false);
    }
  };

  const watchingEp = currentlyWatching?.current_episode || 4;
  const watchingTotal = currentlyWatching?.total_episodes || 16;
  const watchingProgress = Math.min(
    100,
    currentlyWatching?.progress_percentage ||
      Math.round((watchingEp / (watchingTotal || 1)) * 100)
  );

  return (
    <View style={styles.screen}>
      {/* Top Mobile Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/sarangtv-logo.png')}
            style={styles.topBarLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.logo}>SarangTV</Text>
        </View>

        <View style={styles.topBarRight}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.topIconButton,
              hovered && styles.topIconButtonHovered,
              pressed && styles.topIconButtonPressed,
            ]}
            onPress={() => navigation.navigate('Discover')}
            accessibilityLabel="Search"
          >
            <Ionicons name="search-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.avatarButton,
              { backgroundColor: user?.color || '#292546' },
              hovered && styles.avatarButtonHovered,
              pressed && styles.avatarButtonPressed,
            ]}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profile"
          >
            <Ionicons
              name={user?.avatarIcon || 'person'}
              size={13}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.redBright} />
          </View>
        ) : (
          <>
            {/* Greeting */}
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>Annyeong, {greetingName}! ♡</Text>
              <View style={styles.subtitleRow}>
                <Text style={styles.korean}>무슨 드라마 볼까?</Text>
                <Text style={styles.english}>What drama should we watch?</Text>
              </View>
            </View>

            {/* Statistics 4-Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                value={stats.listed ?? 0}
                label="Listed"
                sublabel="in your list"
                icon="bookmark-outline"
                iconColor="#7C6DAA"
                onPress={() => navigation.navigate('Tracker')}
              />
              <StatCard
                value={stats.watching ?? 0}
                label="Watching"
                sublabel="airing now"
                icon="play-outline"
                iconColor="#6C85B4"
                onPress={() => navigation.navigate('Tracker')}
              />
              <StatCard
                value={stats.completed ?? 0}
                label="Completed"
                sublabel="finished"
                icon="checkmark-outline"
                iconColor="#4FA477"
                onPress={() => navigation.navigate('Tracker')}
              />
              <StatCard
                value={Math.round(stats.hours_watched ?? 0)}
                suffix="h"
                label="Hours"
                sublabel="time watched"
                icon="time-outline"
                iconColor="#C59B4A"
                onPress={() => navigation.navigate('Profile')}
              />
            </View>

            {/* Watching Progress Section */}
            <SectionTitle text="WATCHING PROGRESS" />

            {currentlyWatching ? (
              <View style={styles.watchingCard}>
                <View style={styles.watchingHeader}>
                  <Text style={styles.watchingEyebrow}>● WATCHING PROGRESS</Text>
                  <Text style={styles.watchingPercent}>{watchingProgress}%</Text>
                </View>

                <Pressable
                  style={({ pressed, hovered }) => [
                    styles.watchingMain,
                    hovered && styles.watchingMainHovered,
                    pressed && styles.watchingMainPressed,
                  ]}
                  onPress={() =>
                    navigation.navigate('DramaDetail', { tmdbId: currentlyWatching.tmdb_id })
                  }
                >
                  <Image
                    source={{
                      uri:
                        currentlyWatching.poster_url ||
                        currentlyWatching.backdrop_url ||
                        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
                    }}
                    style={styles.watchingImage}
                    resizeMode="cover"
                  />

                  <View style={styles.watchingInfo}>
                    <Text style={styles.watchingTitle} numberOfLines={1}>
                      {currentlyWatching.title}
                    </Text>

                    <Text style={styles.watchingEpisode} numberOfLines={1}>
                      Episode {watchingEp} of {watchingTotal}
                      {currentlyWatching.runtime ? ` · ${currentlyWatching.runtime}` : ' · 65m'}
                    </Text>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${watchingProgress}%` },
                        ]}
                      />
                    </View>
                  </View>
                </Pressable>

                <View style={styles.watchingFooter}>
                  <View>
                    <Text style={styles.loggedLabel}>LOGGED</Text>
                    <Text style={styles.loggedValue}>{watchingEp} eps</Text>
                  </View>

                  <View style={styles.watchingActions}>
                    <Pressable
                      style={({ pressed, hovered }) => [
                        styles.detailsButton,
                        hovered && styles.detailsButtonHovered,
                        pressed && styles.detailsButtonPressed,
                      ]}
                      onPress={() =>
                        navigation.navigate('DramaDetail', { tmdbId: currentlyWatching.tmdb_id })
                      }
                    >
                      <Text style={styles.detailsButtonText}>Details</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed, hovered }) => [
                        styles.logButton,
                        hovered && styles.logButtonHovered,
                        pressed && styles.logButtonPressed,
                      ]}
                      onPress={() => handleIncrement(currentlyWatching.tmdb_id)}
                      disabled={loggingEp}
                    >
                      {loggingEp ? (
                        <ActivityIndicator size="small" color="#07100D" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={12} color="#07100D" />
                          <Text style={styles.logButtonText}>Log Ep {watchingEp}</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.watchingCardEmpty}>
                <Text style={styles.watchingEyebrow}>● WATCHING PROGRESS</Text>
                <Text style={styles.noWatchingText}>
                  Explore dramas and add to your watchlist to start tracking progress.
                </Text>
              </View>
            )}

            {/* Quick Access */}
            <SectionTitle text="QUICK ACCESS" />

            <View style={styles.quickGrid}>
              <QuickAccess
                icon="reader-outline"
                iconBackground="#252441"
                title="My Tracker"
                onPress={() => navigation.navigate('Tracker')}
              />
              <QuickAccess
                icon="add"
                iconBackground="#302548"
                title="Add Drama"
                onPress={() => navigation.navigate('AddDrama')}
              />
              <QuickAccess
                icon="pause"
                iconBackground="#322A3C"
                title="On Hold"
                onPress={() => navigation.navigate('Tracker')}
              />
              <QuickAccess
                icon="ticket-outline"
                iconBackground="#252A43"
                title="Plan to Watch"
                onPress={() => navigation.navigate('Tracker')}
              />
            </View>

            {/* Recommended */}
            <SectionTitle text="RECOMMENDED" />

            <View style={styles.recommendedGrid}>
              {recommended.slice(0, 4).map((drama, index) => (
                <RecommendedCard
                  key={String(drama.tmdb_id || drama.id || index)}
                  drama={drama}
                  rank={index + 1}
                  onPress={() =>
                    navigation.navigate('DramaDetail', { tmdbId: drama.tmdb_id || drama.id })
                  }
                />
              ))}
            </View>

            <View style={styles.bottomSpace} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ text }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function StatCard({ value, suffix, label, sublabel, icon, iconColor, onPress }) {
  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.statCard,
        hovered && styles.statCardHovered,
        pressed && styles.statCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.statTop}>
        <Text style={styles.statValue}>
          {value}
          {suffix || ''}
        </Text>
        <View style={styles.statIconBox}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSublabel}>{sublabel}</Text>
    </Pressable>
  );
}

function QuickAccess({ icon, iconBackground, title, onPress }) {
  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.quickCard,
        hovered && styles.quickCardHovered,
        pressed && styles.quickCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={16} color="#B8A5FF" />
      </View>
      <Text style={styles.quickTitle} numberOfLines={1}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={12} color={colors.muted} />
    </Pressable>
  );
}

function RecommendedCard({ drama, rank, onPress }) {
  const rating = Number(drama?.rating) || 0;
  const image =
    drama?.poster_url ||
    drama?.image ||
    drama?.poster ||
    drama?.backdrop_url ||
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400';

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.recommendedCard,
        hovered && styles.recommendedCardHovered,
        pressed && styles.recommendedCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.posterWrapper}>
        <Image source={{ uri: image }} style={styles.recommendedImage} resizeMode="cover" />
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>TOP {rank}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ {rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.recommendedTitle} numberOfLines={1}>
        {drama.title || drama.name}
      </Text>
      <Text style={styles.recommendedMeta} numberOfLines={1}>
        {Array.isArray(drama.genres) ? drama.genres.join(', ') : drama.genre || 'Drama'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarLogoImage: {
    width: 28,
    height: 28,
  },
  logo: {
    color: '#F5A9C4',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconButton: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  topIconButtonHovered: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ scale: 1.05 }],
  },
  topIconButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  avatarButton: {
    width: 25,
    height: 25,
    borderRadius: 999,
    backgroundColor: '#292546',
    borderWidth: 1,
    borderColor: '#B24B65',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonHovered: {
    backgroundColor: '#3A315E',
    borderColor: '#E9A8B8',
    transform: [{ scale: 1.08 }],
  },
  avatarButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.95 }],
  },
  content: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  greetingBlock: {
    marginBottom: 12,
  },
  greeting: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
  },
  korean: {
    color: '#D8CDD1',
    fontSize: 9,
    fontWeight: '700',
    marginRight: 6,
  },
  english: {
    color: colors.muted,
    fontSize: 8.5,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  statCard: {
    width: '48.5%',
    height: 74,
    backgroundColor: '#111119',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  statCardHovered: {
    backgroundColor: '#181722',
    borderColor: '#4A4558',
    transform: [{ translateY: -2 }, { scale: 1.015 }],
  },
  statCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 22,
    fontWeight: '900',
  },
  statIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#1B1A26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#DDD8DD',
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 4,
  },
  statSublabel: {
    color: '#77727F',
    fontSize: 7.5,
    marginTop: 1,
  },
  sectionTitle: {
    color: '#77727F',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 7,
    marginTop: 2,
  },
  watchingCard: {
    width: '100%',
    backgroundColor: '#0F0F16',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
    marginBottom: 13,
  },
  watchingCardEmpty: {
    width: '100%',
    backgroundColor: '#0F0F16',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 16,
    marginBottom: 13,
  },
  noWatchingText: {
    color: colors.muted,
    fontSize: 9,
    textAlign: 'center',
    paddingVertical: 18,
  },
  watchingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  watchingEyebrow: {
    color: '#5A9A85',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.05,
  },
  watchingPercent: {
    color: '#42D4A7',
    fontSize: 8,
    fontWeight: '900',
  },
  watchingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    padding: 4,
  },
  watchingMainHovered: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    transform: [{ scale: 1.008 }],
  },
  watchingMainPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },
  watchingImage: {
    width: 43,
    height: 43,
    borderRadius: 999,
    backgroundColor: '#242431',
  },
  watchingInfo: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
  },
  watchingTitle: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  watchingEpisode: {
    color: '#AAA4AC',
    fontSize: 7.5,
    marginTop: 2,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#292832',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#32C89A',
    borderRadius: 999,
  },
  watchingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  loggedLabel: {
    color: '#66626E',
    fontSize: 6.5,
    fontWeight: '800',
  },
  loggedValue: {
    color: '#D7D2D6',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  watchingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButton: {
    height: 27,
    paddingHorizontal: 9,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#34333C',
    backgroundColor: '#1B1A21',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  detailsButtonHovered: {
    backgroundColor: '#272531',
    borderColor: '#514D60',
    transform: [{ translateY: -1 }],
  },
  detailsButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  detailsButtonText: {
    color: '#C6C1C5',
    fontSize: 7.5,
    fontWeight: '700',
  },
  logButton: {
    height: 27,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: '#35CDA0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonHovered: {
    backgroundColor: '#4AE0B2',
    transform: [{ translateY: -1 }, { scale: 1.025 }],
  },
  logButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  logButtonText: {
    color: '#07100D',
    fontSize: 7.5,
    fontWeight: '900',
    marginLeft: 3,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  quickCard: {
    width: '48.5%',
    height: 47,
    backgroundColor: '#13131D',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  quickCardHovered: {
    backgroundColor: '#1B1A27',
    borderColor: '#4A4558',
    transform: [{ translateY: -2 }, { scale: 1.015 }],
  },
  quickCardPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.97 }],
  },
  quickIcon: {
    width: 27,
    height: 27,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  quickTitle: {
    flex: 1,
    color: '#DDD9DE',
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
  },
  recommendedGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendedCard: {
    width: '23.7%',
    minWidth: 0,
    borderRadius: 9,
  },
  recommendedCardHovered: {
    transform: [{ translateY: -4 }, { scale: 1.025 }],
    opacity: 0.96,
  },
  recommendedCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  posterWrapper: {
    width: '100%',
    aspectRatio: 0.69,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#171720',
    borderWidth: 1,
    borderColor: colors.line,
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
  },
  rankBadge: {
    position: 'absolute',
    top: 5,
    left: 4,
    backgroundColor: '#EFA500',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankText: {
    color: '#FFF',
    fontSize: 5.5,
    fontWeight: '900',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(7, 7, 14, 0.80)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#F3A0B4',
    fontSize: 6.5,
    fontWeight: '900',
  },
  recommendedTitle: {
    color: '#E6E1E3',
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: '800',
    marginTop: 5,
  },
  recommendedMeta: {
    color: '#77727F',
    fontSize: 6.5,
    marginTop: 2,
  },
  bottomSpace: {
    height: 35,
  },
});
