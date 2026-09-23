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
import { discoverService, trackerService } from '../../services/api';

const STATUSES = [
  'Watching',
  'Completed',
  'Plan to Watch',
  'On Hold',
  'Dropped',
];

const STATUS_COLORS = {
  Watching: '#60A5FA',
  Completed: '#10B981',
  'Plan to Watch': '#FFD76A',
  'On Hold': '#F59E0B',
  Dropped: '#EF4444',
};

const getStatusColor = (status) => {
  if (!status) return '#F5A9C4';
  const formatted = status.replace(/_/g, ' ').toLowerCase();
  if (formatted.includes('watch') && !formatted.includes('plan')) return STATUS_COLORS.Watching;
  if (formatted.includes('complete')) return STATUS_COLORS.Completed;
  if (formatted.includes('plan')) return STATUS_COLORS['Plan to Watch'];
  if (formatted.includes('hold')) return STATUS_COLORS['On Hold'];
  if (formatted.includes('drop')) return STATUS_COLORS.Dropped;
  return '#F5A9C4';
};

export default function DramaDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const tmdbId = route.params?.tmdbId;
  const { width } = useWindowDimensions();
  const [drama, setDrama] = useState(null);
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Form states
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Plan to Watch');
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
          const displayStatus = rawStatus
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          setSelectedStatus(STATUSES.includes(displayStatus) ? displayStatus : 'Plan to Watch');
          setWatchedEpisodes(Number(t.current_episode || 0));
          setSelectedRating(Number(t.rating || 0));
          setNotes(t.review_notes || '');
          setIsFavorite(Boolean(t.is_favorite));
        }
      } catch (e) {
        setTracker(null);
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
    overrideFavorite
  ) => {
    setSavingStatus(true);
    setSaveMessage('');
    const statusToSave = (overrideStatus || selectedStatus).toLowerCase().replace(/ /g, '_');
    const epToSave = overrideEpisodes !== undefined ? overrideEpisodes : watchedEpisodes;
    const rawRating = overrideRating !== undefined ? overrideRating : selectedRating;
    const ratingToSave = Number(rawRating) >= 1 && Number(rawRating) <= 10 ? Math.round(Number(rawRating)) : null;
    const notesToSave = overrideNotes !== undefined ? overrideNotes : notes;
    const favToSave = overrideFavorite !== undefined ? overrideFavorite : isFavorite;

    // Immediately update local state for instant real-time feedback
    if (overrideStatus) setSelectedStatus(overrideStatus);
    if (overrideEpisodes !== undefined) setWatchedEpisodes(epToSave);
    if (overrideRating !== undefined) setSelectedRating(rawRating || 0);
    if (overrideNotes !== undefined) setNotes(notesToSave);
    if (overrideFavorite !== undefined) setIsFavorite(favToSave);

    const payload = {
      tmdb_id: parseInt(tmdbId, 10),
      status: statusToSave,
      current_episode: Math.max(0, parseInt(epToSave, 10) || 0),
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
      setSaveMessage('Saved successfully');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Could not save changes.');
      setSaveMessage('Save failed');
      Alert.alert('Notice', msg);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleToggleFavorite = async () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    await saveTrackerChanges(undefined, undefined, undefined, undefined, nextFav);
    Alert.alert(
      nextFav ? 'Added to Favorites' : 'Removed from Favorites',
      nextFav
        ? 'This drama was saved to your Favorites collection.'
        : 'This drama was removed from your Favorites collection.'
    );
  };

  const handleToggleList = async () => {
    if (tracker) {
      try {
        await trackerService.deleteDrama(tmdbId);
        setTracker(null);
        setIsFavorite(false);
        Alert.alert('Removed', 'Drama removed from watchlist.');
      } catch (e) {
        Alert.alert('Error', 'Could not remove from watchlist.');
      }
    } else {
      await saveTrackerChanges('Plan to Watch', 0, null, '', isFavorite);
      Alert.alert('Added', 'Drama added to your watchlist.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.redBright} />
      </View>
    );
  }

  if (!drama) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorText}>Drama not found.</Text>
      </View>
    );
  }

  const progress =
    episodesTotal > 0 ? Math.min(100, Math.round((watchedEpisodes / episodesTotal) * 100)) : 0;
  const remainingEpisodes = Math.max(0, episodesTotal - watchedEpisodes);
  const tmdbScore = typeof drama.rating === 'number' && drama.rating > 0 ? Number(drama.rating).toFixed(1) : null;
  const tmdbVoteCount = drama.vote_count ? Number(drama.vote_count) : null;

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

  // Generate full episode array for current season without arbitrary hard caps
  const episodeList = Array.from({ length: currentSeasonEpisodes }, (_, index) => {
    const epNum = index + 1;
    // Check if backend returned detailed episode items with real names
    const realEp = Array.isArray(drama.episodes)
      ? drama.episodes.find((e) => e.episode_number === epNum)
      : null;
    return {
      number: epNum,
      title: realEp?.name || `Episode ${epNum}`,
    };
  });

  const INITIAL_VISIBLE_COUNT = 30;
  const hasMoreEpisodes = episodeList.length > INITIAL_VISIBLE_COUNT;
  const displayedEpisodes = showAllEpisodes
    ? episodeList
    : episodeList.slice(0, INITIAL_VISIBLE_COUNT);

  const isWide = width >= 600;

  return (
    <ScrollView
      style={styles.screen}
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
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.posterWrap}>
          {posterImage ? (
            <Image source={{ uri: posterImage }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={styles.posterFallback} />
          )}
        </View>

        <View style={styles.heroInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {drama.title || drama.name}
          </Text>

          {drama.original_title ? (
            <Text style={styles.koreanTitle} numberOfLines={1}>
              {drama.original_title}
            </Text>
          ) : null}

          {/* Clean metadata line */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{drama.release_year || '2025'}</Text>
            {networksDisplay ? (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{networksDisplay}</Text>
              </>
            ) : null}
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{episodesTotal} Episodes</Text>
          </View>

          {/* Clean TMDB Rating Tag */}
          {tmdbScore && (
            <View style={styles.heroTmdbRow}>
              <View style={styles.tmdbPill}>
                <Ionicons name="star" size={12} color="#FFD76A" />
                <Text style={styles.tmdbPillScore}>{tmdbScore}</Text>
                <Text style={styles.tmdbPillLabel}>TMDB</Text>
              </View>
              {tmdbVoteCount ? (
                <Text style={styles.tmdbVoteText}>
                  {tmdbVoteCount.toLocaleString()} ratings
                </Text>
              ) : null}
            </View>
          )}

          {/* Genres Chips */}
          {Array.isArray(drama.genres) && drama.genres.length > 0 && (
            <View style={styles.genreRow}>
              {drama.genres.slice(0, 3).map((g) => (
                <View key={g} style={styles.genreTag}>
                  <Text style={styles.genreTagText}>{g}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.watchlistButton, tracker && styles.watchlistButtonActive]}
          onPress={handleToggleList}
          disabled={savingStatus}
          accessibilityRole="button"
          accessibilityLabel={tracker ? 'In Watchlist' : 'Add to Watchlist'}
        >
          <Ionicons
            name={tracker ? 'checkmark-circle' : 'add'}
            size={19}
            color={tracker ? '#F5A9C4' : '#07070E'}
          />
          <Text style={[styles.watchlistButtonText, tracker && styles.watchlistButtonTextActive]}>
            {tracker ? 'In Watchlist' : 'Add to Watchlist'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
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
      </View>

      {/* STREAMING-STYLE TRACKING SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MY WATCH STATUS</Text>
          {progress > 0 && (
            <Text style={[styles.progressCounterText, { color: getStatusColor(selectedStatus) }]}>
              {watchedEpisodes} / {episodesTotal} ({progress}%)
            </Text>
          )}
        </View>

        {/* Minimal Progress Bar */}
        <View style={styles.cleanProgressTrack}>
          <View
            style={[
              styles.cleanProgressFill,
              {
                width: `${progress}%`,
                backgroundColor: getStatusColor(selectedStatus),
              },
            ]}
          />
        </View>

        {/* Status Filter Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusScrollContent}
          style={styles.statusScroll}
        >
          {STATUSES.map((st) => {
            const active = selectedStatus === st;
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
                  active
                    ? {
                        backgroundColor: `${chipColor}24`,
                        borderColor: chipColor,
                      }
                    : {
                        borderColor: 'rgba(255,255,255,0.08)',
                      },
                ]}
              >
                <View
                  style={[
                    styles.statusColorDot,
                    { backgroundColor: chipColor },
                  ]}
                />
                <Text
                  style={[
                    styles.statusChipText,
                    active && { color: chipColor, fontWeight: '800' },
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
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>SYNOPSIS</Text>
        <Text style={styles.synopsisText}>
          {drama.overview ||
            'A cold detective and a runaway heiress are bound together by a decade-old secret buried beneath the city’s glittering surface. Love was never part of the plan.'}
        </Text>
      </View>

      {/* SEASONS & EPISODES SECTION */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {allSeasons.length > 1 ? 'SEASONS & EPISODES' : 'EPISODES'}
          </Text>
          <Text style={styles.sectionCountText}>
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
                    isActive && styles.seasonTabPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.seasonTabPillText,
                      isActive && styles.seasonTabPillTextActive,
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
            const watched = ep.number <= watchedEpisodes;
            return (
              <Pressable
                key={ep.number}
                style={({ pressed }) => [styles.episodeRow, pressed && styles.episodeRowPressed]}
                onPress={() => {
                  const next = watched ? ep.number - 1 : ep.number;
                  setWatchedEpisodes(next);
                  saveTrackerChanges(undefined, next);
                }}
              >
                <View style={[styles.episodeBadge, watched && styles.episodeBadgeWatched]}>
                  <Text style={[styles.episodeBadgeText, watched && styles.episodeBadgeTextWatched]}>
                    {ep.number}
                  </Text>
                </View>

                <View style={styles.episodeContent}>
                  <Text
                    style={[styles.episodeTitle, watched && styles.episodeTitleWatched]}
                    numberOfLines={1}
                  >
                    {ep.title}
                  </Text>
                  <Text style={styles.episodeSubtitle}>
                    {watched ? 'Watched' : 'Mark as watched'}
                  </Text>
                </View>

                <View style={[styles.episodeCheckCircle, watched && styles.episodeCheckCircleActive]}>
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
            style={styles.showMoreButton}
            onPress={() => setShowAllEpisodes((prev) => !prev)}
            accessibilityRole="button"
          >
            <Text style={styles.showMoreButtonText}>
              {showAllEpisodes
                ? `Show Fewer Episodes`
                : `View All ${episodeList.length} Episodes (${episodeList.length - INITIAL_VISIBLE_COUNT} more)`}
            </Text>
            <Ionicons
              name={showAllEpisodes ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#F5A9C4"
            />
          </Pressable>
        )}
      </View>

      {/* RATING & PERSONAL REVIEW */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MY RATING & REVIEW</Text>
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

        {/* 10-point Tap-to-Rate Row */}
        <View style={styles.ratingNumberBar}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
            const isSelected = selectedRating === score;
            const isPassed = selectedRating >= score;
            return (
              <Pressable
                key={score}
                style={[
                  styles.scoreButton,
                  isSelected && styles.scoreButtonSelected,
                  isPassed && !isSelected && styles.scoreButtonPassed,
                ]}
                onPress={() => {
                  setSelectedRating(score);
                  saveTrackerChanges(undefined, undefined, score);
                }}
              >
                <Text
                  style={[
                    styles.scoreButtonText,
                    (isSelected || isPassed) && styles.scoreButtonTextActive,
                  ]}
                >
                  {score}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedRating > 0 && (
          <View style={styles.activeScoreRow}>
            <Ionicons name="star" size={14} color="#FFD76A" />
            <Text style={styles.activeScoreText}>
              Your rating: <Text style={styles.activeScoreHighlight}>{selectedRating} / 10</Text>
            </Text>
          </View>
        )}

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
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.notesInput}
        />

        <View style={styles.notesActionRow}>
          <Pressable
            style={[styles.saveAllButton, savingStatus && styles.saveButtonDisabled]}
            onPress={() => saveTrackerChanges(selectedStatus, watchedEpisodes, selectedRating, notes)}
            disabled={savingStatus}
          >
            <Ionicons
              name={savingStatus ? 'hourglass-outline' : 'checkmark-circle'}
              size={15}
              color="#07070E"
            />
            <Text style={styles.saveAllButtonText}>
              {savingStatus ? 'Saving...' : 'Save Review'}
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
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>INFORMATION</Text>
        <DetailRow label="Native Title" value={drama.original_title || '—'} />
        <DetailRow
          label="Genres"
          value={Array.isArray(drama.genres) ? drama.genres.join(', ') : drama.genre || 'Drama'}
        />
        <DetailRow
          label="TMDB Rating"
          value={
            tmdbScore
              ? `★ ${tmdbScore} / 10${tmdbVoteCount ? ` (${tmdbVoteCount.toLocaleString()} votes)` : ''}`
              : 'Not rated yet on TMDB'
          }
        />
        <DetailRow label="Director" value={drama.director || 'Park Ji-young'} />
        {allSeasons.length > 1 ? (
          <DetailRow label="Seasons" value={`${allSeasons.length} Seasons (${episodesTotal} Total Eps)`} />
        ) : null}
        <DetailRow label="Aired" value={String(drama.release_year || '2025')} />
        <DetailRow label="Network" value={networksDisplay || 'tvN · Netflix'} last />
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function DetailRow({ label, value, last = false }) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.detailValue} numberOfLines={1}>
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
    height: 42,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    minWidth: 84,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.97 }],
  },
  backText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    position: 'relative',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
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
    paddingLeft: 16,
    paddingTop: 4,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  koreanTitle: {
    color: '#F5A9C4',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
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
    marginHorizontal: 3,
  },
  heroTmdbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  tmdbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 106, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  tmdbPillScore: {
    color: '#FFD76A',
    fontSize: 12,
    fontWeight: '900',
  },
  tmdbPillLabel: {
    color: '#E0DEE9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tmdbVoteText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5A9C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F5A9C4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  watchlistButtonActive: {
    backgroundColor: '#1E1C2B',
    borderWidth: 1.5,
    borderColor: '#4E4968',
    shadowOpacity: 0,
    elevation: 0,
  },
  watchlistButtonText: {
    color: '#07070E',
    fontSize: 14,
    fontWeight: '800',
  },
  watchlistButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  favoriteButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: 'rgba(255,70,85,0.15)',
    borderColor: '#FF4655',
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
    color: '#F5A9C4',
    fontSize: 12,
    fontWeight: '700',
  },
  cleanProgressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cleanProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F5A9C4',
  },
  statusScroll: {
    marginHorizontal: -4,
  },
  statusScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusColorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 14,
  },
  seasonTabsContent: {
    gap: 8,
  },
  seasonTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  seasonTabPillActive: {
    backgroundColor: 'rgba(245, 169, 196, 0.2)',
    borderWidth: 1,
    borderColor: '#F5A9C4',
  },
  seasonTabPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  seasonTabPillTextActive: {
    color: '#F5A9C4',
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
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  episodeBadgeWatched: {
    backgroundColor: 'rgba(245, 169, 196, 0.15)',
  },
  episodeBadgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '800',
  },
  episodeBadgeTextWatched: {
    color: '#F5A9C4',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeCheckCircleActive: {
    backgroundColor: '#F5A9C4',
    borderColor: '#F5A9C4',
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
    color: '#F5A9C4',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingNumberBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  scoreButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonPassed: {
    backgroundColor: 'rgba(255, 215, 106, 0.1)',
  },
  scoreButtonSelected: {
    backgroundColor: '#FFD76A',
  },
  scoreButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '800',
  },
  scoreButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  activeScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  activeScoreText: {
    color: colors.muted,
    fontSize: 12,
  },
  activeScoreHighlight: {
    color: '#FFD76A',
    fontWeight: '800',
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
    minHeight: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    backgroundColor: '#F5A9C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveAllButtonText: {
    color: '#07070E',
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
});
