import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { discoverService, trackerService } from '../../services/api';
import {
  STATUS_OPTIONS,
  toDisplayStatus,
  toApiStatus,
  getStatusColor as getHelperStatusColor,
} from '../../utils/statusHelper';

const STATUSES = STATUS_OPTIONS;

const formatAddedDate = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
};

export default function DramaDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const getStatusColor = (status) => {
    return getHelperStatusColor(status, colors, isDark);
  };

  const tmdbId = route.params?.tmdbId;
  const { width } = useWindowDimensions();
  const [drama, setDrama] = useState(null);
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Form states
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [watchedEpisodes, setWatchedEpisodes] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const fetchDramaDetails = async () => {
    try {
      const dramaRes = await discoverService.getDramaDetail(tmdbId);
      setDrama(dramaRes.data.data);

      try {
        const trackerRes = await trackerService.getDramaProgress(tmdbId);
        if (trackerRes.data && trackerRes.data.data) {
          const t = trackerRes.data.data;
          setTracker(t);
          const rawStatus = t.status || 'plan_to_watch';
          setSelectedStatus(toDisplayStatus(rawStatus));
          setWatchedEpisodes(Number(t.current_episode || 0));
          setSelectedRating(Number(t.rating || 0));
          setNotes(t.review_notes || '');
          setIsFavorite(Boolean(t.is_favorite));
        } else {
          setTracker(null);
          setSelectedStatus(null);
        }
      } catch (e) {
        setTracker(null);
        setSelectedStatus(null);
      }
    } catch (err) {
      console.warn('Failed to load drama details:', err);
      Alert.alert('Error', 'Unable to fetch drama details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDramaDetails();
  }, [tmdbId]);

  const episodesTotal = Number(drama?.number_of_episodes || drama?.episodes || 16);

  const saveTrackerChanges = async (
    overrideStatus,
    overrideEpisodes,
    overrideRating,
    overrideNotes,
    overrideFavorite,
    isManualReviewSave = false
  ) => {
    if (isManualReviewSave) {
      setSavingReview(true);
      setSaveMessage('');
    }
    setSavingStatus(true);
    const statusToSave = toApiStatus(overrideStatus || selectedStatus);
    const epToSave = overrideEpisodes !== undefined ? overrideEpisodes : watchedEpisodes;
    const rawRating = overrideRating !== undefined ? overrideRating : selectedRating;
    const ratingToSave = Number(rawRating) >= 1 && Number(rawRating) <= 10 ? Math.round(Number(rawRating)) : null;
    const notesToSave = overrideNotes !== undefined ? overrideNotes : notes;
    const favToSave = overrideFavorite !== undefined ? overrideFavorite : isFavorite;

    // Automatic status transitions:
    // 1. If reaching/surpassing total episodes, auto-update status to Completed and notify the user
    // 2. If transitioning from 0 to 1+ episodes and status was 'Plan to Watch', auto-update to Watching
    let finalStatus = statusToSave;
    let didAutoComplete = false;
    let didAutoStart = false;

    if (episodesTotal > 0 && Number(epToSave) >= episodesTotal && finalStatus !== 'completed') {
      finalStatus = 'completed';
      didAutoComplete = true;
    } else if (Number(epToSave) > 0 && Number(epToSave) < episodesTotal && finalStatus === 'plan_to_watch' && !overrideStatus) {
      finalStatus = 'watching';
      didAutoStart = true;
    }

    const finalEpisodeCount =
      finalStatus === 'completed' && episodesTotal > 0
        ? Math.max(Number(epToSave) || 0, episodesTotal)
        : Math.max(0, parseInt(epToSave, 10) || 0);

    const displayFinalStatus = toDisplayStatus(finalStatus);

    // Immediately update local state for instant real-time feedback
    setSelectedStatus(displayFinalStatus);
    if (overrideEpisodes !== undefined || finalStatus === 'completed') setWatchedEpisodes(finalEpisodeCount);
    if (overrideRating !== undefined) setSelectedRating(rawRating || 0);
    if (overrideNotes !== undefined) setNotes(notesToSave);
    if (overrideFavorite !== undefined) setIsFavorite(favToSave);

    const payload = {
      tmdb_id: parseInt(tmdbId, 10),
      status: finalStatus,
      current_episode: finalEpisodeCount,
      total_episodes: episodesTotal > 0 ? episodesTotal : null,
      rating: ratingToSave,
      review_notes: notesToSave || null,
      is_favorite: favToSave,
    };

    try {
      if (tracker) {
        const res = await trackerService.updateProgress(tmdbId, payload);
        const data = res.data?.data;
        if (data) {
          setTracker(data);
          setIsFavorite(Boolean(data.is_favorite));
        }
      } else {
        const res = await trackerService.addDrama(payload);
        const data = res.data?.data;
        if (data) {
          setTracker(data);
          setIsFavorite(Boolean(data.is_favorite));
        }
      }
      if (isManualReviewSave) {
        setSaveMessage('Saved successfully');
      }

      if (didAutoComplete) {
        Alert.alert(
          '🎉 Drama Completed!',
          `You've watched all ${episodesTotal} episodes of "${drama?.title || 'this drama'}". Your status has been automatically updated to Completed!`,
          [{ text: 'Awesome!' }]
        );
      } else if (didAutoStart) {
        Alert.alert(
          '🍿 Now Watching',
          `You started watching "${drama?.title || 'this drama'}". Your status has been automatically updated to Watching.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Could not save changes.');
      if (isManualReviewSave) {
        setSaveMessage('Save failed');
      }
      Alert.alert('Notice', msg);
    } finally {
      setSavingStatus(false);
      setSavingReview(false);
    }
  };

  const handleToggleFavorite = async () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    await saveTrackerChanges(undefined, undefined, undefined, undefined, nextFav);
  };

  const confirmRemoveFromWatchlist = () => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove "${drama?.title || 'this drama'}" and its recorded progress from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setSavingStatus(true);
            try {
              await trackerService.deleteDrama(tmdbId);
              setTracker(null);
              setIsFavorite(false);
              setWatchedEpisodes(0);
              setSelectedRating(0);
              setNotes('');
              setSelectedStatus(null);
              Alert.alert('Removed', 'Drama removed from your watchlist.');
            } catch (e) {
              Alert.alert('Error', 'Could not remove from watchlist.');
            } finally {
              setSavingStatus(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleList = async () => {
    if (tracker) {
      confirmRemoveFromWatchlist();
    } else {
      // Set tracker optimistically so button immediately switches to 'In Watchlist'
      setTracker({ tmdb_id: tmdbId, status: 'plan_to_watch', current_episode: 0 });
      setSelectedStatus('Plan to Watch');
      await saveTrackerChanges('Plan to Watch', 0, null, '', isFavorite);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.redBright} />
      </View>
    );
  }

  if (!drama) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.muted }]}>Drama not found.</Text>
      </View>
    );
  }

  const progress =
    episodesTotal > 0 ? Math.min(100, Math.round((watchedEpisodes / episodesTotal) * 100)) : 0;
  const remainingEpisodes = Math.max(0, episodesTotal - watchedEpisodes);
  const tmdbScore = typeof drama.rating === 'number' && drama.rating > 0 ? Number(drama.rating).toFixed(1) : null;
  const tmdbVoteCount = drama.vote_count ? Number(drama.vote_count) : null;

  const formatAddedDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const posterImage =
    drama.poster_url || drama.poster || drama.image || drama.backdrop_url || null;

  const networksDisplay = Array.isArray(drama.networks) && drama.networks.length > 0
    ? drama.networks.join(' · ')
    : (drama.network || null);

  // Extract seasons from TMDB (ignoring season 0 / specials if regular seasons exist)
  const allSeasons = Array.isArray(drama.seasons) && drama.seasons.length > 0
    ? drama.seasons.filter((s) => s.season_number > 0 || drama.seasons.length === 1)
    : [];

  const currentSeason = allSeasons[selectedSeasonIndex] || allSeasons[0] || null;
  // Total episodes in the currently selected season (or drama total)
  const currentSeasonEpisodes = Math.max(
    1,
    currentSeason?.episode_count || episodesTotal || 16
  );

  // Calculate prior season episode count offset (sum of previous seasons)
  const priorSeasonEps = allSeasons.length > 1
    ? allSeasons.slice(0, selectedSeasonIndex).reduce((sum, s) => sum + (s.episode_count || 0), 0)
    : 0;

  // Season-specific progress and remaining values
  const seasonWatchedEpisodes = Math.max(
    0,
    Math.min(currentSeasonEpisodes, watchedEpisodes - priorSeasonEps)
  );
  const seasonRemainingEpisodes = Math.max(0, currentSeasonEpisodes - seasonWatchedEpisodes);
  const seasonProgress = currentSeasonEpisodes > 0
    ? Math.min(100, Math.round((seasonWatchedEpisodes / currentSeasonEpisodes) * 100))
    : 0;

  // Generate full episode array for current season without arbitrary hard caps
  const episodeList = Array.from({ length: currentSeasonEpisodes }, (_, index) => {
    const epNum = index + 1;
    const globalEpNum = priorSeasonEps + epNum;
    // Check if backend returned detailed episode items with real names
    const realEp = Array.isArray(drama.episodes)
      ? drama.episodes.find((e) => e.episode_number === epNum || e.episode_number === globalEpNum)
      : null;
    return {
      number: epNum,
      globalNumber: globalEpNum,
      title: realEp?.name || `Episode ${epNum}`,
    };
  });

  const INITIAL_VISIBLE_COUNT = 30;
  const hasMoreEpisodes = episodeList.length > INITIAL_VISIBLE_COUNT;
  const displayedEpisodes = showAllEpisodes
    ? episodeList
    : episodeList.slice(0, INITIAL_VISIBLE_COUNT);

  const castList = Array.isArray(drama.cast) ? drama.cast : [];
  const INITIAL_CAST_COUNT = 8;
  const hasMoreCast = castList.length > INITIAL_CAST_COUNT;
  const displayedCast = showAllCast ? castList : castList.slice(0, INITIAL_CAST_COUNT);
  const durationDisplay =
    drama.duration ||
    (drama.episode_runtime ? `${drama.episode_runtime} min / ep` : '60–70 min / ep');

  const isWide = width >= 600;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: isWide ? 24 : 12,
          paddingTop: (insets.top > 0 ? insets.top : 12) + 4,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top Bar / Back */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 },
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </Pressable>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={[styles.posterWrap, { backgroundColor: colors.card }]}>
          {posterImage ? (
            <Image source={{ uri: posterImage }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={styles.posterFallback} />
          )}
        </View>

        <View style={styles.heroInfo}>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {drama.title || drama.name}
            </Text>

            {drama.original_title ? (
              <Text style={[styles.koreanTitle, { color: colors.pink }]} numberOfLines={1}>
                {drama.original_title}
              </Text>
            ) : null}
          </View>

          {/* Clean metadata line */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.muted }]}>{drama.release_year || '2025'}</Text>
            {networksDisplay ? (
              <>
                <Text style={[styles.metaDot, { color: colors.muted }]}>•</Text>
                <Text style={[styles.metaText, { color: colors.muted }]}>{networksDisplay}</Text>
              </>
            ) : null}
            <Text style={[styles.metaDot, { color: colors.muted }]}>•</Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>{episodesTotal} Episodes</Text>
          </View>

          {/* Dedicated TMDB Rating & User Rating line (Switched Design Styles) */}
          {(tmdbScore || selectedRating > 0) ? (
            <View style={styles.tmdbRatingRow}>
              {/* TMDB Pill Badge Style (Gold/Yellow, borderless bg) */}
              {tmdbScore ? (
                <View style={[styles.tmdbPillBadge, { backgroundColor: isDark ? 'rgba(255, 215, 106, 0.16)' : 'rgba(245, 158, 11, 0.14)', borderWidth: 0 }]}>
                  <Text style={[styles.tmdbPillStar, { color: isDark ? '#ffd76a' : '#d97706' }]}>★</Text>
                  <Text style={[styles.tmdbPillScore, { color: isDark ? '#ffd76a' : '#d97706' }]}>{tmdbScore}</Text>
                  <Text style={[styles.tmdbPillLabel, { color: colors.muted }]}>TMDB</Text>
                  {tmdbVoteCount ? (
                    <Text style={[styles.tmdbPillVotes, { color: colors.muted }]}>
                      ({tmdbVoteCount >= 1000 ? `${(tmdbVoteCount / 1000).toFixed(1)}k` : tmdbVoteCount})
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* User Rating Dedicated Score Style (Pink/Rose theme) */}
              {selectedRating > 0 && (
                <View style={styles.userDedicatedRow}>
                  <View style={[styles.userScoreBadge, { backgroundColor: isDark ? 'rgba(235, 91, 120, 0.16)' : 'rgba(235, 91, 120, 0.12)' }]}>
                    <Text style={[styles.userScoreBadgeText, { color: colors.pink }]}>YOU</Text>
                  </View>
                  <Text style={[styles.userDedicatedScore, { color: colors.pink }]}>
                    ★ {selectedRating} <Text style={[styles.metaStarRatingSlash, { color: colors.muted }]}>/ 10</Text>
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          {/* Genres Chips */}
          {Array.isArray(drama.genres) && drama.genres.length > 0 && (
            <View style={styles.genreRow}>
              {drama.genres.slice(0, 3).map((g) => (
                <View key={g} style={[styles.genreTag, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.genreTagText, { color: colors.textSecondary || colors.text }]}>{g}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[
            styles.watchlistButton,
            {
              backgroundColor: tracker ? colors.card : colors.pink,
              borderColor: colors.border,
              borderWidth: isDark ? 0 : 1,
              shadowColor: tracker ? (colors.shadowColor || '#000000') : colors.pink,
              shadowOpacity: isDark ? (tracker ? 0.2 : 0.25) : (colors.shadowOpacity || 0.05),
              elevation: isDark ? 2 : 1,
            },
          ]}
          onPress={handleToggleList}
          disabled={savingStatus}
          accessibilityRole="button"
          accessibilityLabel={tracker ? 'In Watchlist' : 'Add to Watchlist'}
        >
          <Ionicons
            name={tracker ? 'checkmark-circle' : 'add'}
            size={19}
            color={tracker ? colors.pink : '#FFFFFF'}
          />
          <Text style={[styles.watchlistButtonText, { color: tracker ? colors.pink : '#FFFFFF' }]}>
            {tracker ? 'In Watchlist' : 'Add to Watchlist'}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.favoriteButton,
            {
              backgroundColor: isFavorite ? 'rgba(255,70,85,0.18)' : colors.card,
              borderColor: colors.border,
              borderWidth: isDark ? 0 : 1,
              shadowColor: colors.shadowColor || '#000000',
              shadowOpacity: isDark ? 0.2 : (colors.shadowOpacity || 0.05),
              elevation: isDark ? 2 : 1,
            },
            isFavorite && styles.favoriteButtonActive,
          ]}
          onPress={handleToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? '#FF4655' : colors.text}
          />
        </Pressable>

        {tracker ? (
          <Pressable
            style={({ pressed, hovered }) => [
              styles.deleteButton,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.30)' : 'rgba(239, 68, 68, 0.22)',
                borderWidth: 1,
              },
              hovered && { transform: [{ scale: 1.05 }], opacity: 0.9 },
              pressed && { transform: [{ scale: 0.95 }], opacity: 0.7 },
            ]}
            onPress={confirmRemoveFromWatchlist}
            disabled={savingStatus}
            accessibilityRole="button"
            accessibilityLabel="Remove from Watchlist"
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </Pressable>
        ) : null}
      </View>

      {/* PROGRESS TRACKING SECTION */}
      <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.progressHeaderRow}>
          <Text style={[styles.progressHeaderTitle, { color: colors.muted }]}>
            {allSeasons.length > 1 && currentSeason
              ? `PROGRESS · ${(currentSeason.name || `SEASON ${currentSeason.season_number || selectedSeasonIndex + 1}`).toUpperCase()}`
              : 'PROGRESS'}
          </Text>
          <Text style={[styles.progressHeaderMeta, { color: colors.muted }]}>
            {allSeasons.length > 1
              ? `${seasonWatchedEpisodes}/${currentSeasonEpisodes} eps (${watchedEpisodes}/${episodesTotal} total) · added ${formatAddedDate(tracker?.created_at || tracker?.updated_at)}`
              : `${watchedEpisodes}/${episodesTotal} eps · added ${formatAddedDate(tracker?.created_at || tracker?.updated_at)}`}
          </Text>
        </View>

        {/* Exact Progress Track */}
        <View style={[styles.detailProgressTrack, { backgroundColor: isDark ? '#232230' : (colors.line || 'rgba(0,0,0,0.08)') }]}>
          <View
            style={[
              styles.detailProgressBar,
              {
                width: `${allSeasons.length > 1 ? seasonProgress : progress}%`,
                backgroundColor: colors.pink,
              },
            ]}
          />
        </View>

        <View style={styles.detailProgressInfoRow}>
          <Text style={[styles.progressRemaining, { color: colors.muted }]}>
            {(() => {
              const activeRemaining = allSeasons.length > 1 ? seasonRemainingEpisodes : remainingEpisodes;
              if (activeRemaining <= 0) {
                return allSeasons.length > 1 ? 'All episodes in season watched' : 'All episodes watched';
              }
              const durationStr = String(drama?.duration || drama?.episode_runtime || '');
              const matches = durationStr.match(/\d+(?:\.\d+)?/g);
              const avgMinutes = matches && matches.length
                ? matches.map(Number).reduce((sum, val) => sum + val, 0) / matches.length
                : 60;
              const totalMin = Math.round(avgMinutes * activeRemaining);
              const hrs = Math.floor(totalMin / 60);
              const mins = totalMin % 60;
              const estimate = [hrs ? `${hrs}h` : '', mins ? `${mins}m` : ''].filter(Boolean).join(' ') || '0m';
              return `~${estimate} remaining${allSeasons.length > 1 ? ' in season' : ''}`;
            })()}
          </Text>
          <Text style={[styles.progressPctText, { color: colors.pink }]}>
            {allSeasons.length > 1 ? seasonProgress : progress}%
          </Text>
        </View>

        {/* Status Filter Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusScrollContent}
          style={styles.statusScroll}
        >
          {STATUSES.map((st) => {
            const active = Boolean(tracker) && Boolean(selectedStatus) && toDisplayStatus(selectedStatus) === st;
            const chipColor = getStatusColor(st);
            return (
              <Pressable
                key={st}
                onPress={() => {
                  setSelectedStatus(st);
                  saveTrackerChanges(st);
                }}
                style={[
                  styles.statusChip,
                  {
                    shadowColor: colors.shadowColor || '#000000',
                    shadowOpacity: isDark ? 0.2 : (colors.shadowOpacity || 0.05),
                    elevation: isDark ? 2 : 1,
                  },
                  active
                    ? {
                        backgroundColor: chipColor,
                        borderColor: st === 'Plan to Watch' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.28)',
                        borderWidth: 1,
                      }
                    : {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderWidth: isDark ? 0 : 1,
                      },
                ]}
              >
                <View
                  style={[
                    styles.statusColorDot,
                    { backgroundColor: active ? (st === 'Plan to Watch' ? '#161424' : '#FFFFFF') : chipColor },
                  ]}
                />
                <Text
                  style={[
                    styles.statusChipText,
                    { color: active ? (st === 'Plan to Watch' ? '#161424' : '#FFFFFF') : colors.muted },
                    active && { fontWeight: '800' },
                  ]}
                >
                  {st}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* SYNOPSIS SECTION */}
      <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SYNOPSIS</Text>
        <Text style={[styles.synopsisText, { color: colors.text }]}>
          {drama.overview ||
            'A cold detective and a runaway heiress are bound together by a decade-old secret buried beneath the city’s glittering surface. Love was never part of the plan.'}
        </Text>
      </View>

      {/* SEASONS & EPISODES SECTION */}
      <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {allSeasons.length > 1 ? 'SEASONS & EPISODES' : 'EPISODES'}
          </Text>
          <Text style={[styles.sectionCountText, { color: colors.muted }]}>
            {currentSeason ? `${currentSeason.episode_count || currentSeasonEpisodes} Episodes` : `${episodesTotal} Total`}
          </Text>
        </View>

        {/* Season Selector Tabs */}
        {allSeasons.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.seasonTabsContent}
            style={styles.seasonTabsScroll}
          >
            {allSeasons.map((season, idx) => {
              const isActive = selectedSeasonIndex === idx;
              const seasonName = season.name || `Season ${season.season_number || idx + 1}`;
              return (
                <Pressable
                  key={season.id || `season-${idx}`}
                  onPress={() => {
                    setSelectedSeasonIndex(idx);
                    setShowAllEpisodes(false);
                  }}
                  style={[
                    styles.seasonTabPill,
                    {
                      backgroundColor: isActive ? (isDark ? '#2A2438' : colors.pink) : colors.card,
                      borderColor: colors.border,
                      borderWidth: isDark ? 0 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.seasonTabPillText,
                      { color: isActive ? '#FFFFFF' : colors.muted },
                      isActive && { fontWeight: '800' },
                    ]}
                  >
                    {seasonName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Clean Episode Rows */}
        <View style={styles.episodeList}>
          {displayedEpisodes.map((ep) => {
            const watched = ep.globalNumber <= watchedEpisodes;
            return (
              <Pressable
                key={ep.number}
                style={({ pressed }) => [
                  styles.episodeRow,
                  { borderBottomColor: colors.border },
                  pressed && styles.episodeRowPressed,
                ]}
                onPress={() => {
                  const next = watched ? ep.globalNumber - 1 : ep.globalNumber;
                  setWatchedEpisodes(next);
                  saveTrackerChanges(undefined, next);
                }}
              >
                <View
                  style={[
                    styles.episodeBadge,
                    {
                      backgroundColor: watched ? 'rgba(235, 91, 120, 0.18)' : colors.card,
                      borderColor: colors.border,
                      borderWidth: isDark ? 0 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.episodeBadgeText,
                      { color: watched ? colors.pink : colors.text },
                    ]}
                  >
                    {ep.number}
                  </Text>
                </View>

                <View style={styles.episodeContent}>
                  <Text
                    style={[
                      styles.episodeTitle,
                      { color: watched ? colors.muted : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {ep.title}
                  </Text>
                  <Text style={[styles.episodeSubtitle, { color: colors.muted }]}>
                    {watched ? 'Watched' : 'Mark as watched'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.episodeCheckCircle,
                    {
                      backgroundColor: watched ? colors.pink : colors.card,
                      borderColor: colors.border,
                      borderWidth: isDark ? 0 : 1,
                    },
                  ]}
                >
                  {watched ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="play" size={12} color={colors.muted} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {hasMoreEpisodes && (
          <Pressable
            style={[
              styles.showMoreButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : (colors.panel2 || '#ECEEF4') },
            ]}
            onPress={() => setShowAllEpisodes((prev) => !prev)}
            accessibilityRole="button"
          >
            <Text style={[styles.showMoreButtonText, { color: colors.pink }]}>
              {showAllEpisodes
                ? `Show Fewer Episodes`
                : `View All ${episodeList.length} Episodes (${episodeList.length - INITIAL_VISIBLE_COUNT} more)`}
            </Text>
            <Ionicons
              name={showAllEpisodes ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.pink}
            />
          </Pressable>
        )}
      </View>

      {/* MY RATING SECTION */}
      <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>MY RATING</Text>
          {selectedRating > 0 && (
            <Pressable
              onPress={() => {
                setSelectedRating(0);
                saveTrackerChanges(undefined, undefined, null);
              }}
              hitSlop={8}
              style={styles.clearRatingButton}
            >
              <Ionicons name="close-circle-outline" size={13} color={colors.muted} />
              <Text style={styles.clearRatingText}>Clear</Text>
            </Pressable>
          )}
        </View>

        {/* 10 Star Rating Picker */}
        <View style={styles.detailStarPicker}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starNum) => {
            const isFilled = selectedRating >= starNum;
            return (
              <Pressable
                key={starNum}
                style={({ pressed }) => [
                  styles.starPickButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  const nextRating = selectedRating === starNum ? 0 : starNum;
                  setSelectedRating(nextRating);
                  saveTrackerChanges(undefined, undefined, nextRating > 0 ? nextRating : null);
                }}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${starNum} out of 10`}
              >
                <Ionicons
                  name={isFilled ? 'star' : 'star-outline'}
                  size={24}
                  color={isFilled ? colors.pink : isDark ? '#3c3748' : '#CBD5E1'}
                />
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.detailRatingScore, { color: colors.pink }]}>
          {selectedRating > 0 ? `${selectedRating} / 10` : 'Not rated yet'}
        </Text>

        {/* Review Notes Area */}
        <TextInput
          value={notes}
          onChangeText={(v) => {
            setNotes(v);
            setSaveMessage('');
          }}
          multiline
          textAlignVertical="top"
          placeholder="Write your personal thoughts, favorite moments, or critique..."
          placeholderTextColor={colors.muted}
          style={[
            styles.notesInput,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1, color: colors.text },
          ]}
        />

        <View style={styles.notesActionRow}>
          <Pressable
            style={[styles.saveAllButton, { backgroundColor: colors.pink }, savingReview && styles.saveButtonDisabled]}
            onPress={() => saveTrackerChanges(
              selectedStatus,
              selectedStatus === 'Completed' ? episodesTotal : watchedEpisodes,
              selectedRating,
              notes,
              isFavorite,
              true,
            )}
            disabled={savingReview}
          >
            <Ionicons
              name={savingReview ? 'hourglass-outline' : 'checkmark-circle'}
              size={15}
              color="#FFFFFF"
            />
            <Text style={styles.saveAllButtonText}>
              {savingReview ? 'Saving...' : 'Save Review'}
            </Text>
          </Pressable>

          {saveMessage ? (
            <View style={styles.saveMessageRow}>
              <Ionicons
                name={saveMessage.includes('fail') ? 'alert-circle' : 'checkmark-circle'}
                size={13}
                color={saveMessage.includes('fail') ? '#F87171' : '#22C55E'}
              />
              <Text
                style={[
                  styles.saveMessage,
                  { color: saveMessage.includes('fail') ? '#F87171' : '#22C55E' },
                ]}
              >
                {saveMessage}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* SERIES INFO / DETAILS */}
      <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>INFORMATION</Text>
        <DetailRow label="Native Title" value={drama.original_title || '—'} />
        <DetailRow
          label="Genres"
          value={Array.isArray(drama.genres) ? drama.genres.join(', ') : drama.genre || 'Drama'}
        />
        <DetailRow label="Director" value={drama.director || 'Director'} />
        <DetailRow label="Aired" value={String(drama.release_year || '2026')} />
        <DetailRow label="Duration" value={durationDisplay} />
        <DetailRow
          label="Network"
          value={networksDisplay || 'tvN · Netflix'}
          last={allSeasons.length <= 1}
        />
        {allSeasons.length > 1 ? (
          <DetailRow
            label="Seasons"
            value={`${allSeasons.length} Seasons (${episodesTotal} Total Eps)`}
            last
          />
        ) : null}
      </View>

      {/* FULL CAST SECTION */}
      {castList.length > 0 && (
        <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>FULL CAST</Text>
            <Text style={[styles.sectionCountText, { color: colors.muted }]}>{castList.length} Actors</Text>
          </View>

          <View style={styles.castList}>
            {displayedCast.map((actor, idx) => {
              const actorAvatar =
                actor.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name || 'Cast')}&background=1f1f23&color=e4e4e7`;
              return (
                <View key={actor.id || `${actor.name}-${idx}`} style={styles.castRow}>
                  <Image
                    source={{ uri: actorAvatar }}
                    style={[styles.castAvatar, { backgroundColor: isDark ? '#1E1C2B' : (colors.panel2 || '#ECEEF4') }]}
                    resizeMode="cover"
                  />
                  <View style={styles.castTextWrap}>
                    <Text style={[styles.castName, { color: colors.text }]} numberOfLines={1}>
                      {actor.name}
                    </Text>
                    <Text style={[styles.castRole, { color: colors.muted }]} numberOfLines={1}>
                      {actor.role || actor.character ? `as ${actor.role || actor.character}` : 'as Cast'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {hasMoreCast && (
            <Pressable
              style={[
                styles.showMoreButton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : (colors.panel2 || '#ECEEF4') },
              ]}
              onPress={() => setShowAllCast((prev) => !prev)}
            >
              <Text style={[styles.showMoreButtonText, { color: colors.pink }]}>
                {showAllCast ? 'Show Less' : `Show all ${castList.length} cast members`}
              </Text>
              <Ionicons
                name={showAllCast ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.pink}
              />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function DetailRow({ label, value, last = false }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }, last && styles.detailRowLast]}>
      <Text style={[styles.detailLabel, { color: colors.muted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.muted,
    fontSize: 14,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  topBar: {
    height: 44,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    minWidth: 84,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#161424',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colors.shadowOpacity ?? 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  backText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  hero: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 140,
    marginTop: 4,
  },
  posterWrap: {
    width: 105,
    height: 150,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#161424',
    position: 'relative',
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    flex: 1,
    backgroundColor: '#1E1C2B',
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
    justifyContent: 'center',
    gap: 7,
  },
  titleGroup: {
    marginBottom: 0,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  koreanTitle: {
    color: '#eb5b78',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    marginHorizontal: 2,
  },
  tmdbRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tmdbBadge: {
    backgroundColor: 'rgba(235, 91, 120, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tmdbBadgeText: {
    color: '#eb5b78',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tmdbPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  tmdbPillStar: {
    fontSize: 11,
    fontWeight: '800',
  },
  tmdbPillScore: {
    fontSize: 12,
    fontWeight: '900',
  },
  tmdbPillLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tmdbPillVotes: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  userDedicatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 3,
  },
  userScoreBadge: {
    paddingHorizontal: 5.5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  userScoreBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userDedicatedScore: {
    fontSize: 12,
    fontWeight: '800',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    backgroundColor: '#1b1926',
  },
  genreTagText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    gap: 12,
  },
  watchlistButton: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#eb5b78',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#eb5b78',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  watchlistButtonActive: {
    backgroundColor: '#161424',
    shadowOpacity: 0.2,
    shadowColor: '#000000',
    elevation: 2,
  },
  watchlistButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  watchlistButtonTextActive: {
    color: '#eb5b78',
    fontWeight: '800',
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: 'rgba(255,70,85,0.18)',
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionContainer: {
    width: '100%',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionCountText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  progressCounterText: {
    color: '#eb5b78',
    fontSize: 12,
    fontWeight: '700',
  },
  cleanProgressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1E1B2E',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cleanProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#eb5b78',
  },
  statusScroll: {
    marginHorizontal: -4,
    overflow: 'visible',
  },
  statusScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#161424',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  statusColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  synopsisText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  seasonTabsScroll: {
    marginBottom: 10,
    overflow: 'visible',
  },
  seasonTabsContent: {
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  seasonTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#161424',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  seasonTabPillActive: {
    backgroundColor: '#2A2438',
  },
  seasonTabPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  seasonTabPillTextActive: {
    color: '#eb5b78',
    fontWeight: '800',
  },
  episodeList: {
    marginTop: 4,
  },
  episodeRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  episodeRowPressed: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  episodeBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  episodeBadgeWatched: {
    backgroundColor: 'rgba(235, 91, 120, 0.18)',
  },
  episodeBadgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '800',
  },
  episodeBadgeTextWatched: {
    color: '#eb5b78',
  },
  episodeContent: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  episodeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  episodeTitleWatched: {
    color: 'rgba(255,255,255,0.45)',
  },
  episodeSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  episodeCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeCheckCircleActive: {
    backgroundColor: '#eb5b78',
  },
  showMoreButton: {
    marginTop: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  showMoreButtonText: {
    color: '#eb5b78',
    fontSize: 12,
    fontWeight: '700',
  },
  metaStarRating: {
    color: '#eb5b78',
    fontSize: 12,
    fontWeight: '800',
  },
  metaStarRatingSlash: {
    color: '#7b7585',
    fontWeight: '400',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressHeaderTitle: {
    color: '#8D8B98',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  progressHeaderMeta: {
    color: '#716b7c',
    fontSize: 12,
    fontWeight: '600',
  },
  detailProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    backgroundColor: '#232230',
    overflow: 'hidden',
  },
  detailProgressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#eb5b78',
  },
  detailProgressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  progressRemaining: {
    color: '#6e6878',
    fontSize: 12,
    fontWeight: '500',
  },
  progressPctText: {
    color: '#eb5b78',
    fontSize: 12,
    fontWeight: '800',
  },
  detailStarPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
  },
  starPickButton: {
    padding: 2,
  },
  starPickButtonPressed: {
    transform: [{ scale: 1.15 }],
  },
  detailRatingScore: {
    color: '#eb5b78',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 12,
  },
  clearRatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearRatingText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  notesInput: {
    width: '100%',
    minHeight: 84,
    borderRadius: 14,
    backgroundColor: '#161424',
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  notesActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  saveAllButton: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#eb5b78',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveAllButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveMessage: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  detailRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailRowLast: {},
  detailLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    flex: 0.8,
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1.2,
  },
  bottomSpace: {
    height: 50,
  },
  castList: {
    gap: 12,
  },
  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  castAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1C2B',
  },
  castTextWrap: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  castName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  castRole: {
    color: '#8D8A98',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
});
