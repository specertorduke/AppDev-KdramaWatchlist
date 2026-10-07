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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { homeService, trackerService, discoverService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toDisplayStatus, getStatusColor } from '../../utils/statusHelper';
import DefaultProfileAvatar from '../../components/DefaultProfileAvatar';


export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark, theme } = useTheme();
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
      const [res, discoverRes, trackerRes] = await Promise.all([
        homeService.getDashboard(),
        discoverService.discover({ page: 1 }).catch(() => null),
        trackerService.getWatchlist().catch(() => null),
      ]);
      setDashboardData(res.data.data);
      if (discoverRes?.data?.data) {
        const rawTrending = discoverRes.data.data.slice(0, 10);
        const userWatchlist = trackerRes?.data?.data || [];
        const statusMap = new Map();
        userWatchlist.forEach((item) => {
          const id = item.tmdb_id || item.id;
          if (id) statusMap.set(String(id), item.status);
        });

        const mergedTrending = rawTrending.map((drama) => {
          const dramaId = String(drama.tmdb_id || drama.id);
          const trackedStatus = statusMap.get(dramaId);
          return {
            ...drama,
            watch_status: trackedStatus || drama.watch_status || drama.status,
            status: trackedStatus || drama.status || drama.watch_status,
          };
        });

        setTrendingDramas(mergedTrending);
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

  const watchingEp = currentlyWatching ? Number(currentlyWatching.current_episode || 0) : 0;
  const watchingTotal = currentlyWatching ? Number(currentlyWatching.total_episodes || 0) : 0;
  const nextEpToLog = currentlyWatching?.next_episode || (watchingTotal > 0 && watchingEp < watchingTotal ? watchingEp + 1 : watchingEp + 1);
  const watchingProgress = currentlyWatching
    ? Math.min(
        100,
        currentlyWatching.progress_percentage ??
          (watchingTotal > 0 ? Math.round((watchingEp / watchingTotal) * 100) : 0)
      )
    : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Top Mobile Bar */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.bg,
            borderBottomColor: colors.line,
            borderBottomWidth: 1,
            paddingTop: insets.top > 0 ? insets.top : 8,
            height: (insets.top > 0 ? insets.top : 8) + 54,
          },
        ]}
      >
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/sarangtv-logo.png')}
            style={styles.topBarLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.logo}>
            Sarang<Text style={styles.logoTv}>TV</Text>
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.topIconButton,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 },
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
              hovered && styles.avatarButtonHovered,
              pressed && styles.avatarButtonPressed,
            ]}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profile"
          >
            {user?.avatar_url?.endsWith('.svg') ? (
              <DefaultProfileAvatar size={38} />
            ) : user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatarIconFallback,
                  { backgroundColor: user?.color || '#292546' },
                ]}
              >
                <Ionicons
                  name={user?.avatarIcon || 'person'}
                  size={18}
                  color="#FFFFFF"
                />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.bg }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.redBright} />
          </View>
        ) : (
          <>
            {/* Greeting */}
            <View style={styles.greetingBlock}>
              <Text style={[styles.greeting, { color: colors.text }]}>Annyeong, {greetingName}! ♡</Text>
              <View style={styles.subtitleRow}>
                <Text style={[styles.korean, { color: colors.pink }]}>무슨 드라마 볼까?</Text>
                <Text style={[styles.english, { color: colors.muted }]}>What drama should we watch?</Text>
              </View>
            </View>

            {/* Statistics 4-Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                value={stats.listed ?? stats.totalTracked ?? 0}
                label="Total Tracked"
                sublabel={`${stats.watching ?? 0} watching`}
                icon="bookmark-outline"
                iconColor="#7C6DAA"
                bottomColor="#9d8ade"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('Tracker', { initialTab: 'All' })}
              />
              <StatCard
                value={stats.episodes_watched ?? (Math.round(stats.hours_watched ?? 0) > 0 ? Math.round(stats.hours_watched) : stats.watching ?? 0)}
                label="Episodes Watched"
                sublabel={`${stats.completed ?? 0} completed`}
                icon="play-outline"
                iconColor="#6C85B4"
                bottomColor="#759bc7"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('Tracker', { initialTab: 'Watching' })}
              />
              <StatCard
                value={stats.plan_to_watch ?? Math.max(0, (stats.listed ?? 0) - (stats.watching ?? 0) - (stats.completed ?? 0))}
                label="Plan to Watch"
                sublabel={`${stats.on_hold ?? 0} on hold`}
                icon="checkmark-outline"
                iconColor="#4FA477"
                bottomColor="#4fb487"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('Tracker', { initialTab: 'Completed' })}
              />
              <StatCard
                value={Math.round(stats.hours_watched ?? 0)}
                suffix="h"
                label="Hours Watched"
                sublabel="Total watch time"
                icon="time-outline"
                iconColor="#C59B4A"
                bottomColor="#c6a73d"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('Profile')}
              />
            </View>

            {/* Watching Progress Section */}
            <SectionTitle text="WATCHING PROGRESS" colors={colors} />

            {currentlyWatching ? (
              <View style={[styles.watchingCard, { backgroundColor: isDark ? '#151522' : colors.card, borderWidth: 0 }]}>
                {(currentlyWatching.backdrop_url || currentlyWatching.poster_url) ? (
                  <Image
                    source={{
                      uri: currentlyWatching.backdrop_url || currentlyWatching.poster_url,
                    }}
                    style={[styles.watchingBackdropImage, { opacity: isDark ? 0.18 : 0.08 }]}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={[styles.watchingBackdropOverlay, { backgroundColor: isDark ? 'rgba(21, 21, 34, 0.88)' : (theme === 'warm' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.94)') }]} />

                <View style={styles.watchingCardContent}>
                  <View style={styles.watchingHeader}>
                    <View style={styles.watchingDot} />
                    <Text style={[styles.watchingEyebrow, { color: isDark ? '#A3A1AC' : colors.muted }]}>WATCHING PROGRESS</Text>
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
                    <CircularProgressAvatar
                      src={
                        currentlyWatching.poster_url ||
                        currentlyWatching.backdrop_url ||
                        currentlyWatching.image
                      }
                      progress={watchingProgress}
                      size={68}
                      strokeWidth={4.5}
                      colors={colors}
                      isDark={isDark}
                    />

                    <View style={styles.watchingInfo}>
                      <Text style={[styles.watchingTitle, { color: colors.text }]} numberOfLines={1}>
                        {currentlyWatching.title}
                      </Text>

                      <Text style={[styles.watchingEpisode, { color: colors.muted }]} numberOfLines={1}>
                        Ep {watchingEp} of {watchingTotal}
                        {currentlyWatching.runtime ? ` · ${currentlyWatching.runtime}` : ' · ~60 min'}
                      </Text>

                      <View style={styles.progressRow}>
                        <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2b2b35' : (colors.line || 'rgba(0,0,0,0.08)') }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${watchingProgress}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressPercentText}>{watchingProgress}%</Text>
                      </View>
                    </View>
                  </Pressable>

                  <View style={[styles.watchingFooter, { borderTopColor: colors.border }]}>
                    <View>
                      <Text style={[styles.loggedLabel, { color: colors.muted }]}>LOGGED</Text>
                      <Text style={[styles.loggedValue, { color: colors.text }]}>Today</Text>
                    </View>

                    <View style={styles.watchingActions}>
                      <Pressable
                        style={({ pressed, hovered }) => [
                          styles.detailsButton,
                          {
                            backgroundColor: isDark ? '#2a2930' : (colors.panel2 || '#EEF1F6'),
                            borderWidth: isDark ? 0 : 1,
                            borderColor: colors.border,
                          },
                          hovered && styles.detailsButtonHovered,
                          pressed && styles.detailsButtonPressed,
                        ]}
                        onPress={() =>
                          navigation.navigate('DramaDetail', { tmdbId: currentlyWatching.tmdb_id })
                        }
                      >
                        <Text style={[styles.detailsButtonText, { color: colors.text }]}>Details</Text>
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
                          <ActivityIndicator size="small" color="#061a15" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={15} color="#061a15" />
                            <Text style={styles.logButtonText}>
                              {watchingTotal > 0 && watchingEp >= watchingTotal
                                ? 'Completed'
                                : `Log Ep ${nextEpToLog}`}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.watchingCardEmpty, { backgroundColor: isDark ? '#151522' : colors.card, borderWidth: 0 }]}>
                <View style={styles.watchingHeader}>
                  <View style={styles.watchingDot} />
                  <Text style={[styles.watchingEyebrow, { color: isDark ? '#A3A1AC' : colors.muted }]}>WATCHING PROGRESS</Text>
                </View>
                <Text style={[styles.noWatchingText, { color: colors.muted }]}>
                  Explore dramas and add to your watchlist to start tracking progress.
                </Text>
              </View>
            )}

            {/* Quick Access */}
            <SectionTitle text="QUICK ACCESS" colors={colors} />

            <View style={styles.quickGrid}>
              <QuickAccess
                icon="reader-outline"
                iconBackground={colors.purple}
                title="My Tracker"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('Tracker', { initialTab: 'All' })}
              />
              <QuickAccess
                icon="add"
                iconBackground={colors.pink}
                title="Add Drama"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('AddDrama')}
              />
              <QuickAccess
                icon="pause"
                iconBackground={colors.gold}
                title="On Hold"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('Tracker', { initialTab: 'On Hold' })}
              />
              <QuickAccess
                icon="ticket-outline"
                iconBackground={colors.green}
                title="Plan to Watch"
                colors={colors}
                isDark={isDark}
                onPress={() => navigation.navigate('Tracker', { initialTab: 'Plan to Watch' })}
              />
            </View>

            {/* Trending Now - Top 10 Streaming Style */}
            <View style={styles.trendingHeaderRow}>
              <View style={styles.trendingTitleGroup}>
                <Ionicons name="flame" size={18} color="#FF4655" />
                <Text style={[styles.trendingSectionTitle, { color: colors.text }]}>Top 10 Trending Today</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Discover')}
                hitSlop={8}
                style={styles.seeAllButton}
              >
                <Text style={[styles.seeAllText, { color: colors.pink }]}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.pink} />
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
                    {/* Big Stylized Rank Number (Matching Frontend Top 10 Design) */}
                    <TrendingRankNumber rankNum={rankNum} colors={colors} isDark={isDark} />

                    {/* Poster Card */}
                    <View style={[styles.trendingPosterWrapper, { backgroundColor: isDark ? '#161622' : colors.card, borderColor: colors.border }]}>
                      <Image
                        source={{ uri: posterUri }}
                        style={styles.trendingPosterImage}
                        resizeMode="cover"
                      />
                      {(drama.watch_status || drama.status) ? (() => {
                        const formattedText = toDisplayStatus(drama.watch_status || drama.status);
                        const badgeColor = getStatusColor(formattedText, colors, isDark);
                        return (
                          <View
                            style={[
                              styles.cardStatusBadge,
                              {
                                backgroundColor: isDark ? 'rgba(12, 11, 20, 0.90)' : (colors.card || '#FFFFFF'),
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : (colors.border || 'rgba(0, 0, 0, 0.10)'),
                                borderWidth: 1,
                                shadowColor: isDark ? '#000000' : '#4A4660',
                                shadowOpacity: isDark ? 0.45 : 0.14,
                              },
                            ]}
                          >
                            <View style={[styles.cardStatusDot, { backgroundColor: badgeColor }]} />
                            <Text style={[styles.cardStatusText, { color: badgeColor }]} numberOfLines={1}>
                              {formattedText}
                            </Text>
                          </View>
                        );
                      })() : null}
                    </View>

                    <Text style={[styles.trendingDramaTitle, { color: colors.text }]} numberOfLines={1}>
                      {drama.title || drama.name}
                    </Text>
                    <Text style={[styles.trendingDramaMeta, { color: colors.muted }]} numberOfLines={1}>
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
              <View style={styles.recommendedTitleGroup}>
                <SectionTitle text="RECOMMENDED FOR YOU" colors={colors} />
                {Array.isArray(user?.favorite_genres) && user.favorite_genres.length > 0 && (
                  <View style={styles.genreTagPill}>
                    <Ionicons name="sparkles" size={11} color={colors.pink} />
                    <Text style={[styles.genreTagText, { color: colors.pink }]} numberOfLines={1}>
                      {user.favorite_genres.slice(0, 2).join(' · ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedScrollContent}
              style={styles.recommendedScrollView}
            >
              {recommended.slice(0, 15).map((drama, index) => (
                <RecommendedCard
                  key={String(drama.tmdb_id || drama.id || index)}
                  drama={drama}
                  colors={colors}
                  isDark={isDark}
                  onPress={() =>
                    navigation.navigate('DramaDetail', { tmdbId: drama.tmdb_id || drama.id })
                  }
                />
              ))}
            </ScrollView>

            <View style={styles.bottomSpace} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ text, colors }) {
  return <Text style={[styles.sectionTitle, colors && { color: colors.muted }]}>{text}</Text>;
}

function StatCard({ value, suffix, label, sublabel, icon, iconColor, bottomColor, colors, isDark, onPress }) {
  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderWidth: 0,
          shadowColor: colors.shadowColor || '#000000',
          shadowOpacity: colors.shadowOpacity ?? 0.05,
          shadowRadius: 6,
          elevation: 2,
        },
        hovered && { transform: [{ scale: 1.02 }] },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      <View style={styles.statTop}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {value}
          {suffix ? <Text style={styles.statSuffix}>{suffix}</Text> : null}
        </Text>
        <Ionicons name={icon} size={18} color={iconColor} style={{ opacity: 0.9 }} />
      </View>
      <View style={styles.statBottom}>
        <Text style={[styles.statLabel, { color: colors.text }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.statSublabel, { color: colors.muted }]} numberOfLines={1}>{sublabel}</Text>
      </View>
      <View style={[styles.statBottomBar, { backgroundColor: bottomColor || iconColor }]} />
    </Pressable>
  );
}

function CircularProgressAvatar({ src, progress = 0, size = 68, strokeWidth = 4.5, colors, isDark = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  const offset = circumference - (clampedProgress / 100) * circumference;
  const imgSize = size - strokeWidth * 2 - 6;

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#272635' : (colors?.line || 'rgba(0,0,0,0.1)')}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#32d19a"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
      <Image
        source={{
          uri:
            src ||
            'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
        }}
        style={{
          width: imgSize,
          height: imgSize,
          borderRadius: imgSize / 2,
          backgroundColor: isDark ? '#1C1B2A' : (colors?.panel2 || '#EEF1F6'),
        }}
        resizeMode="cover"
      />
    </View>
  );
}

function QuickAccess({ icon, iconBackground, title, colors, isDark, onPress }) {
  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.quickCard,
        {
          backgroundColor: colors.card,
          borderWidth: 0,
          shadowColor: colors.shadowColor || '#000000',
          shadowOpacity: colors.shadowOpacity ?? 0.05,
          shadowRadius: 5,
          elevation: 2,
        },
        hovered && { transform: [{ scale: 1.02 }] },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
        <Ionicons name={icon} size={16} color={iconBackground} />
      </View>
      <Text style={[styles.quickTitle, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={12} color={colors.muted} />
    </Pressable>
  );
}

function TrendingRankNumber({ rankNum, colors, isDark = true }) {
  const fillColor = isDark ? '#151522' : (colors?.card || '#FFFFFF');
  const strokeColor = colors?.pink || '#eb5b78';
  const shadowColor = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.15)';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.rankContainer} pointerEvents="none">
        <Text
          style={[
            styles.giantRankWeb,
            {
              color: fillColor,
              WebkitTextStroke: `1.5px ${strokeColor}`,
              textShadow: `2px 2px 0px ${shadowColor}`,
            },
          ]}
        >
          {rankNum}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.rankContainer} pointerEvents="none">
      {/* 2px Drop Shadow */}
      <Text style={[styles.giantRankShadow, { color: shadowColor }]}>{rankNum}</Text>
      {/* 8-direction 1.5px pink stroke outline */}
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: -1.5 }, { translateY: -1.5 }] }]}>{rankNum}</Text>
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: 0 }, { translateY: -1.5 }] }]}>{rankNum}</Text>
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: 1.5 }, { translateY: -1.5 }] }]}>{rankNum}</Text>
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: -1.5 }, { translateY: 0 }] }]}>{rankNum}</Text>
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: 1.5 }, { translateY: 0 }] }]}>{rankNum}</Text>
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: -1.5 }, { translateY: 1.5 }] }]}>{rankNum}</Text>
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: 0 }, { translateY: 1.5 }] }]}>{rankNum}</Text>
      <Text style={[styles.giantRankStroke, { color: strokeColor, transform: [{ translateX: 1.5 }, { translateY: 1.5 }] }]}>{rankNum}</Text>
      {/* Center fill */}
      <Text style={[styles.giantRankFill, { color: fillColor }]}>{rankNum}</Text>
    </View>
  );
}

function RecommendedCard({ drama, colors, isDark, onPress }) {
  const rating = Number(drama?.rating) || 0;
  const image =
    drama?.poster_url ||
    drama?.image ||
    drama?.poster ||
    drama?.backdrop_url ||
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400';

  const status = drama?.watch_status || drama?.status;

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.recommendedCard,
        hovered && styles.recommendedCardHovered,
        pressed && styles.recommendedCardPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.posterWrapper,
          {
            backgroundColor: isDark ? '#161622' : (colors.panel2 || '#EEF1F6'),
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.border || 'rgba(0, 0, 0, 0.08)'),
          },
        ]}
      >
        <Image source={{ uri: image }} style={styles.recommendedImage} resizeMode="cover" />

        {status ? (() => {
          const formattedText = toDisplayStatus(status);
          const badgeColor = getStatusColor(formattedText, colors, isDark);
          return (
            <View
              style={[
                styles.cardStatusBadge,
                {
                  backgroundColor: isDark ? 'rgba(12, 11, 20, 0.90)' : (colors.card || '#FFFFFF'),
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : (colors.border || 'rgba(0, 0, 0, 0.10)'),
                  borderWidth: 1,
                  shadowColor: isDark ? '#000000' : '#4A4660',
                  shadowOpacity: isDark ? 0.45 : 0.14,
                },
              ]}
            >
              <View style={[styles.cardStatusDot, { backgroundColor: badgeColor }]} />
              <Text style={[styles.cardStatusText, { color: badgeColor }]} numberOfLines={1}>
                {formattedText}
              </Text>
            </View>
          );
        })() : null}
      </View>
      <Text style={[styles.recommendedTitle, { color: colors.text }]} numberOfLines={1}>
        {drama.title || drama.name}
      </Text>
      <Text style={[styles.recommendedMeta, { color: colors.muted }]} numberOfLines={1}>
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
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarLogoImage: {
    width: 32,
    height: 32,
  },
  logo: {
    color: '#f09ab0',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  logoTv: {
    color: '#E85D75',
    fontWeight: '800',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#151322',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  topIconButtonHovered: {
    backgroundColor: '#1E1B30',
    transform: [{ scale: 1.05 }],
  },
  topIconButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#eb5b78',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#f59ac6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  avatarIconFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonHovered: {
    opacity: 0.9,
    transform: [{ scale: 1.06 }],
  },
  avatarButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
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
    minHeight: 110,
    backgroundColor: '#11111b',
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 11,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardHovered: {
    backgroundColor: '#181826',
    transform: [{ translateY: -2 }, { scale: 1.015 }],
  },
  statCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 36,
    paddingTop: 2,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statSuffix: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statBottom: {
    marginTop: 8,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statSublabel: {
    color: '#8D8B98',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  statBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.85,
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
    backgroundColor: '#111119',
    borderWidth: 0,
    borderRadius: 17,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  watchingBackdropImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  watchingBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 25, 0.75)',
  },
  watchingCardContent: {
    position: 'relative',
    zIndex: 2,
    padding: 18,
  },
  watchingCardEmpty: {
    width: '100%',
    backgroundColor: '#111119',
    borderWidth: 0,
    borderRadius: 17,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  noWatchingText: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 18,
    lineHeight: 16,
  },
  watchingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  watchingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#36d29c',
    marginRight: 8,
  },
  watchingEyebrow: {
    color: '#807985',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  watchingMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchingMainHovered: {
    transform: [{ scale: 1.008 }],
  },
  watchingMainPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },
  watchingInfo: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  watchingTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  watchingEpisode: {
    color: '#7c7883',
    fontSize: 12.5,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#2b2b35',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#32d19a',
    borderRadius: 2,
  },
  progressPercentText: {
    color: '#38d4a0',
    fontSize: 11.5,
    fontWeight: '800',
  },
  watchingFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  loggedLabel: {
    color: '#777582',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  loggedValue: {
    color: '#ddd8e0',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  watchingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2a2930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonHovered: {
    backgroundColor: '#35333e',
    transform: [{ translateY: -1 }],
  },
  detailsButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  detailsButtonText: {
    color: '#c4c0c5',
    fontSize: 13,
    fontWeight: '800',
  },
  logButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#30d49d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  logButtonHovered: {
    backgroundColor: '#40e2ab',
    transform: [{ translateY: -1 }, { scale: 1.02 }],
  },
  logButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  logButtonText: {
    color: '#061a15',
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: '#161424',
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  quickCardHovered: {
    backgroundColor: '#1E1B30',
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
  recommendedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  recommendedTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  genreTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(235, 91, 120, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  genreTagText: {
    color: '#eb5b78',
    fontSize: 10,
    fontWeight: '800',
  },
  tuneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161424',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tuneButtonText: {
    color: '#eb5b78',
    fontSize: 11,
    fontWeight: '800',
  },
  recommendedScrollView: {
    marginHorizontal: -12,
    marginBottom: 20,
  },
  recommendedScrollContent: {
    paddingHorizontal: 12,
    gap: 14,
  },
  recommendedGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendedCard: {
    width: 124,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  recommendedCardHovered: {
    transform: [{ translateY: -2 }],
    opacity: 0.95,
  },
  recommendedCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  posterWrapper: {
    width: '100%',
    aspectRatio: 0.69,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  cardStatusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(12, 11, 20, 0.90)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 96,
  },
  cardStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    flexShrink: 0,
  },
  cardStatusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
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
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '800',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  recommendedMeta: {
    color: '#8D8B98',
    fontSize: 11,
    marginTop: 2,
    paddingHorizontal: 2,
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
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    left: -8,
    bottom: 24,
    zIndex: 2,
    pointerEvents: 'none',
    overflow: 'visible',
  },
  giantRankWeb: {
    color: '#151522',
    fontSize: 80,
    fontWeight: '900',
    lineHeight: 96,
    paddingTop: 8,
    includeFontPadding: false,
    ...Platform.select({
      web: {
        WebkitTextStroke: '1.5px #F5A9C4',
        textShadow: '2px 2px 0px #000000',
        userSelect: 'none',
      },
    }),
  },
  giantRankShadow: {
    position: 'absolute',
    left: 2,
    top: 2,
    fontSize: 80,
    lineHeight: 96,
    fontWeight: '900',
    paddingTop: 8,
    color: '#000000',
    includeFontPadding: false,
  },
  giantRankStroke: {
    position: 'absolute',
    left: 0,
    top: 0,
    fontSize: 80,
    lineHeight: 96,
    fontWeight: '900',
    color: '#F5A9C4',
    paddingTop: 8,
    includeFontPadding: false,
  },
  giantRankFill: {
    fontSize: 80,
    lineHeight: 96,
    fontWeight: '900',
    color: '#151522',
    paddingTop: 8,
    includeFontPadding: false,
  },
  trendingPosterWrapper: {
    width: 124,
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#161622',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
