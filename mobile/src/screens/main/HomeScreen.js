import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { homeService, trackerService, discoverService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallPhone = width <= 380;
  const horizontalPadding = isSmallPhone ? 10 : 12;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [trendingDramas, setTrendingDramas] = useState([]);
  const [loggingEp, setLoggingEp] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [res, discoverRes] = await Promise.all([
        homeService.getDashboard(),
        discoverService.discover({ page: 1 }).catch(() => null),
      ]);
      setDashboardData(res.data.data);
      if (discoverRes?.data?.data) {
        setTrendingDramas(discoverRes.data.data.slice(0, 10));
      }
    } catch (err) {
      console.warn('Failed to load dashboard from backend, fallback displayed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

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
                onPress={() => navigation.navigate('Tracker', { initialTab: 'All' })}
              />
              <StatCard
                value={stats.watching ?? 0}
                label="Watching"
                sublabel="airing now"
                icon="play-outline"
                iconColor="#6C85B4"
                onPress={() => navigation.navigate('Tracker', { initialTab: 'Watching' })}
              />
              <StatCard
                value={stats.completed ?? 0}
                label="Completed"
                sublabel="finished"
                icon="checkmark-outline"
                iconColor="#4FA477"
                onPress={() => navigation.navigate('Tracker', { initialTab: 'Completed' })}
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
                onPress={() => navigation.navigate('Tracker', { initialTab: 'All' })}
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
                onPress={() => navigation.navigate('Tracker', { initialTab: 'On Hold' })}
              />
              <QuickAccess
                icon="ticket-outline"
                iconBackground="#252A43"
                title="Plan to Watch"
                onPress={() => navigation.navigate('Tracker', { initialTab: 'Plan to Watch' })}
              />
            </View>

            {/* Trending Now - Top 10 Streaming Style */}
            <View style={styles.trendingHeaderRow}>
              <View style={styles.trendingTitleGroup}>
                <Ionicons name="flame" size={18} color="#FF4655" />
                <Text style={styles.trendingSectionTitle}>Top 10 Trending Today</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Discover')}
                hitSlop={8}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color="#F5A9C4" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingScrollContent}
              style={styles.trendingScrollView}
            >
              {(trendingDramas.length > 0 ? trendingDramas : recommended).map((drama, index) => {
                const rankNum = index + 1;
                const posterUri =
                  drama?.poster_url ||
                  drama?.poster ||
                  drama?.image ||
                  drama?.backdrop_url ||
                  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400';
                const rating = Number(drama?.rating || drama?.vote_average) || 0;

                return (
                  <Pressable
                    key={`trending-${drama.tmdb_id || drama.id || index}`}
                    style={({ pressed }) => [
                      styles.trendingCard,
                      pressed && styles.trendingCardPressed,
                    ]}
                    onPress={() =>
                      navigation.navigate('DramaDetail', { tmdbId: drama.tmdb_id || drama.id })
                    }
                  >
                    {/* Big Stylized Rank Number (Netflix / Disney+ style) */}
                    <View style={styles.rankContainer}>
                      <Text style={styles.giantRankShadow}>{rankNum}</Text>
                      <Text style={styles.giantRank}>{rankNum}</Text>
                    </View>

                    {/* Poster Card */}
                    <View style={styles.trendingPosterWrapper}>
                      <Image
                        source={{ uri: posterUri }}
                        style={styles.trendingPosterImage}
                        resizeMode="cover"
                      />
                      {/* Rating pill */}
                      {rating > 0 && (
                        <View style={styles.trendingRatingPill}>
                          <Ionicons name="star" size={10} color="#FFD76A" />
                          <Text style={styles.trendingRatingVal}>{rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.trendingDramaTitle} numberOfLines={1}>
                      {drama.title || drama.name}
                    </Text>
                    <Text style={styles.trendingDramaMeta} numberOfLines={1}>
                      {Array.isArray(drama.genres)
                        ? drama.genres.slice(0, 2).join(' · ')
                        : drama.genre || 'K-Drama'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Recommended */}
            <View style={styles.recommendedHeaderRow}>
              <SectionTitle text="RECOMMENDED FOR YOU" />
            </View>

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
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  korean: {
    color: '#F5A9C4',
    fontSize: 13,
    fontWeight: '700',
  },
  english: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48.5%',
    minHeight: 84,
    backgroundColor: '#111119',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
    justifyContent: 'space-between',
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
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
  },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#1B1A26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#DDD8DD',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  statSublabel: {
    color: '#8D8B98',
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#8D8B98',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 9,
    marginTop: 6,
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
    marginBottom: 10,
  },
  watchingEyebrow: {
    color: '#5A9A85',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.05,
  },
  watchingPercent: {
    color: '#42D4A7',
    fontSize: 13,
    fontWeight: '900',
  },
  watchingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 6,
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
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#242431',
  },
  watchingInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  watchingTitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  watchingEpisode: {
    color: '#AAA4AC',
    fontSize: 12,
    marginTop: 4,
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#292832',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
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
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  loggedLabel: {
    color: '#8D8B98',
    fontSize: 11,
    fontWeight: '800',
  },
  loggedValue: {
    color: '#D7D2D6',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  watchingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34333C',
    backgroundColor: '#1B1A21',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
    fontWeight: '700',
  },
  logButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
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
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickCard: {
    width: '48.5%',
    minHeight: 56,
    backgroundColor: '#13131D',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickTitle: {
    flex: 1,
    color: '#DDD9DE',
    fontSize: 12,
    lineHeight: 16,
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
    top: 6,
    left: 6,
    backgroundColor: '#EFA500',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  rankText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(7, 7, 14, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  ratingText: {
    color: '#F3A0B4',
    fontSize: 10,
    fontWeight: '900',
  },
  recommendedTitle: {
    color: '#E6E1E3',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  recommendedMeta: {
    color: '#8D8B98',
    fontSize: 10,
    marginTop: 3,
  },
  /* TRENDING SECTION (POPULAR STREAMING STYLE) */
  trendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  trendingTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#F5A9C4',
    fontSize: 12,
    fontWeight: '700',
  },
  trendingScrollView: {
    marginHorizontal: -12,
    marginBottom: 20,
  },
  trendingScrollContent: {
    paddingHorizontal: 12,
    gap: 16,
  },
  trendingCard: {
    width: 130,
    position: 'relative',
  },
  trendingCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  rankContainer: {
    position: 'absolute',
    left: -14,
    bottom: 36,
    zIndex: 10,
    pointerEvents: 'none',
  },
  giantRankShadow: {
    position: 'absolute',
    left: 2,
    top: 2,
    fontSize: 82,
    lineHeight: 82,
    fontWeight: '900',
    color: '#000000',
    opacity: 0.8,
  },
  giantRank: {
    fontSize: 82,
    lineHeight: 82,
    fontWeight: '900',
    color: '#151522',
    textShadowColor: '#F5A9C4',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  trendingPosterWrapper: {
    width: 124,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginLeft: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  trendingPosterImage: {
    width: '100%',
    height: '100%',
  },
  trendingRatingPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendingRatingVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  trendingDramaTitle: {
    color: '#F0EEE8',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    marginLeft: 6,
  },
  trendingDramaMeta: {
    color: '#8D8B98',
    fontSize: 11,
    marginTop: 2,
    marginLeft: 6,
  },
  recommendedHeaderRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  bottomSpace: {
    height: 40,
  },
});
