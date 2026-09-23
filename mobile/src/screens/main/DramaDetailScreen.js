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

  const episodeTitles = [
    'Neon and Rain', 'The Fixer', 'Architecture of Power', 'The Missing Tower',
    'Protocol Zero', 'Underworld', 'Specter’s Game', 'False Identity',
    'The Hidden Room', 'Midnight Signal', 'Broken Promise', 'The Last Clue',
    'Dark Passenger', 'Crossing Lines', 'The Final Secret', 'Midnight in Seoul',
  ];

  const episodeList = Array.from({ length: Math.min(episodesTotal, 16) }, (_, index) => ({
    number: index + 1,
    title: episodeTitles[index] || `Episode ${index + 1}`,
  }));

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
          <Ionicons name="arrow-back" size={18} color={colors.text} />
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
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>TOP 1</Text>
          </View>
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

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{drama.release_year || '2025'}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>tvN · Netflix</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{episodesTotal} Episodes</Text>
          </View>

          {/* Clear TMDB Rating Pill in Hero */}
          {tmdbScore && (
            <View style={styles.heroTmdbRow}>
              <View style={styles.tmdbPill}>
                <Ionicons name="star" size={13} color="#FFD76A" />
                <Text style={styles.tmdbPillScore}>{tmdbScore}</Text>
                <Text style={styles.tmdbPillLabel}>TMDB</Text>
              </View>
              {tmdbVoteCount ? (
                <Text style={styles.tmdbVoteText}>
                  ({tmdbVoteCount.toLocaleString()} votes)
                </Text>
              ) : null}
            </View>
          )}

          <Text style={styles.availableText} numberOfLines={1}>
            Available on tvN · Netflix
          </Text>
        </View>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.watchlistButton, tracker && styles.watchlistButtonActive]}
          onPress={handleToggleList}
          disabled={savingStatus}
          accessibilityRole="button"
          accessibilityLabel={tracker ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <Ionicons
            name={tracker ? 'checkmark-circle' : 'add'}
            size={20}
            color={tracker ? '#FFFFFF' : '#07070E'}
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

      <View style={styles.divider} />

      {/* Content Cards */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>SYNOPSIS</Text>
        <Text style={styles.synopsis}>
          {drama.overview ||
            'A cold detective and a runaway heiress are bound together by a decade-old secret buried beneath the city’s glittering surface. Love was never part of the plan.'}
        </Text>
      </View>

      {/* DETAILS */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>DETAILS</Text>
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
        <DetailRow label="Aired" value={String(drama.release_year || '2025')} />
        <DetailRow label="Duration" value={drama.duration || '62 min / ep'} />
        <DetailRow label="Network" value="tvN · Netflix" last />
      </View>

      {/* MAIN CAST */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>MAIN CAST</Text>
        <View style={styles.castRow}>
          <View style={styles.castAvatar}>
            <Ionicons name="person" size={17} color={colors.muted} />
          </View>
          <View style={styles.castInfo}>
            <Text style={styles.castName} numberOfLines={1}>Main Cast</Text>
            <Text style={styles.castRole}>Cast information</Text>
          </View>
        </View>
      </View>

      {/* PROGRESS */}
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionLabel}>PROGRESS</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>

            <Text style={styles.progressSubtext}>
              {watchedEpisodes}/{episodesTotal} eps · added recently
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            <Text style={styles.remainingText}>
              {remainingEpisodes} eps remaining
            </Text>

            {/* STATUS */}
            <Text style={[styles.sectionLabel, styles.statusLabel]}>STATUS</Text>
            <View style={styles.statusGrid}>
              {STATUSES.map((st) => {
                const active = selectedStatus === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => {
                      setSelectedStatus(st);
                      setSaveMessage('');
                    }}
                    style={[styles.statusPill, active && styles.statusPillActive]}
                  >
                    <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
                      {st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* SAVE STATUS BUTTON */}
            <Pressable
              style={[styles.saveStatusButton, savingStatus && styles.saveButtonDisabled]}
              onPress={() => saveTrackerChanges(selectedStatus)}
              disabled={savingStatus}
            >
              <Ionicons
                name={savingStatus ? 'hourglass-outline' : 'checkmark-circle-outline'}
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.saveStatusButtonText}>
                {savingStatus ? 'Saving...' : 'Save Status'}
              </Text>
            </Pressable>
          </View>

          {/* MY RATING & REVIEW CARD */}
          <View style={styles.card}>
            <View style={styles.reviewHeaderRow}>
              <View>
                <Text style={styles.sectionLabel}>MY RATING & REVIEW</Text>
                <Text style={styles.reviewSublabel}>Your personal score & notes</Text>
              </View>
              {selectedRating > 0 ? (
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
              ) : null}
            </View>

            {/* Rating Display Badge - Only shown when user has actually rated */}
            {selectedRating > 0 ? (
              <View style={styles.myRatingBadgeRow}>
                <View style={[styles.myRatingBadge, styles.myRatingBadgeActive]}>
                  <Ionicons name="star" size={16} color={colors.gold} />
                  <Text style={[styles.myRatingBadgeText, styles.myRatingBadgeTextActive]}>
                    {selectedRating} / 10
                  </Text>
                </View>
                <Text style={styles.ratingHintText}>Your rating</Text>
              </View>
            ) : (
              <View style={styles.unratedPromptRow}>
                <Text style={styles.unratedPromptText}>
                  Slide or tap on the bar to set your score (1–10)
                </Text>
              </View>
            )}

            {/* Interactive Rating Slider (1 to 10 scale) */}
            <View style={styles.sliderSection}>
              <View
                style={styles.sliderTouchArea}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(evt) => {
                  const touchX = evt.nativeEvent.locationX;
                  // Slider width is card width minus paddings (~320px on mobile)
                  // Calculate score from 1 to 10 based on relative touch position
                  const targetWidth = evt.currentTarget?.offsetWidth || 300;
                  const ratio = Math.max(0, Math.min(1, touchX / targetWidth));
                  const score = Math.max(1, Math.min(10, Math.round(ratio * 9 + 1)));
                  setSelectedRating(score);
                  setSaveMessage('');
                }}
                onResponderMove={(evt) => {
                  const touchX = evt.nativeEvent.locationX;
                  const targetWidth = evt.currentTarget?.offsetWidth || 300;
                  const ratio = Math.max(0, Math.min(1, touchX / targetWidth));
                  const score = Math.max(1, Math.min(10, Math.round(ratio * 9 + 1)));
                  setSelectedRating(score);
                }}
                onResponderRelease={(evt) => {
                  const touchX = evt.nativeEvent.locationX;
                  const targetWidth = evt.currentTarget?.offsetWidth || 300;
                  const ratio = Math.max(0, Math.min(1, touchX / targetWidth));
                  const score = Math.max(1, Math.min(10, Math.round(ratio * 9 + 1)));
                  setSelectedRating(score);
                  saveTrackerChanges(undefined, undefined, score);
                }}
              >
                {/* Background Track */}
                <View style={styles.sliderTrackBg}>
                  {/* Filled track up to current rating */}
                  <View
                    style={[
                      styles.sliderTrackFill,
                      {
                        width:
                          selectedRating > 0
                            ? `${((selectedRating - 1) / 9) * 100}%`
                            : '0%',
                      },
                    ]}
                  />
                  {/* Slider Thumb */}
                  {selectedRating > 0 ? (
                    <View
                      style={[
                        styles.sliderThumb,
                        {
                          left: `${((selectedRating - 1) / 9) * 100}%`,
                        },
                      ]}
                    >
                      <Ionicons name="star" size={11} color="#0D0C13" />
                    </View>
                  ) : (
                    <View style={[styles.sliderThumb, styles.sliderThumbUnset, { left: '0%' }]} />
                  )}
                </View>
              </View>

              {/* Step indicator labels 1 to 10 for quick tapping */}
              <View style={styles.sliderStepsRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
                  const isCurrent = selectedRating === step;
                  return (
                    <Pressable
                      key={step}
                      onPress={() => {
                        setSelectedRating(step);
                        setSaveMessage('');
                        saveTrackerChanges(undefined, undefined, step);
                      }}
                      hitSlop={6}
                      style={styles.sliderStepTouchable}
                    >
                      <Text
                        style={[
                          styles.sliderStepText,
                          isCurrent && styles.sliderStepTextActive,
                        ]}
                      >
                        {step}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* MY REVIEW / NOTES */}
            <Text style={[styles.sectionLabel, styles.notesLabel]}>PERSONAL REVIEW / NOTES</Text>
            <TextInput
              value={notes}
              onChangeText={(v) => {
                setNotes(v);
                setSaveMessage('');
              }}
              multiline
              textAlignVertical="top"
              placeholder="What did you think of this drama? Write your personal thoughts, favorite moments, or critique..."
              placeholderTextColor={colors.muted}
              style={styles.notesInput}
            />

            <View style={styles.notesButtons}>
              <Pressable
                style={[styles.saveButton, savingStatus && styles.saveButtonDisabled]}
                onPress={() => saveTrackerChanges(undefined, undefined, undefined, notes)}
                disabled={savingStatus}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={15} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {savingStatus ? 'Saving...' : 'Save Review'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.saveAllButton, savingStatus && styles.saveButtonDisabled]}
                onPress={() => saveTrackerChanges(selectedStatus, watchedEpisodes, selectedRating, notes)}
                disabled={savingStatus}
              >
                <Ionicons name="save-outline" size={15} color="#FFFFFF" />
                <Text style={styles.saveAllButtonText}>Save All Changes</Text>
              </Pressable>
            </View>

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

          {/* EPISODES */}
          <View style={styles.card}>
            <View style={styles.episodesHeader}>
              <Text style={styles.sectionLabel}>EPISODES</Text>
              <Text style={styles.totalEpisodes}>{episodesTotal} Total</Text>
            </View>

            <View style={styles.episodeList}>
              {episodeList.map((ep) => {
                const watched = ep.number <= watchedEpisodes;
                return (
                  <Pressable
                    key={ep.number}
                    style={styles.episodeRow}
                    onPress={() => {
                      const next = watched ? ep.number - 1 : ep.number;
                      setWatchedEpisodes(next);
                      saveTrackerChanges(undefined, next);
                    }}
                  >
                    <View style={[styles.episodeCircle, watched && styles.episodeCircleActive]}>
                      {watched ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
                    </View>
                    <Text
                      style={[styles.episodeTitle, watched && styles.episodeTitleWatched]}
                      numberOfLines={1}
                    >
                      {ep.title}
                    </Text>
                    <Text style={styles.episodeNumber}>Ep {ep.number}</Text>
                  </Pressable>
                );
              })}
            </View>
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
    backgroundColor: colors.panel2,
  },
  topBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#10A9D6',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 16,
    paddingTop: 2,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
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
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: colors.muted,
    fontSize: 12,
    marginHorizontal: 2,
  },
  heroTmdbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tmdbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 106, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 7,
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
  availableText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  updateButton: {
    height: 31,
    paddingHorizontal: 11,
    borderRadius: 7,
    backgroundColor: colors.redBright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    marginLeft: 5,
  },
  favoriteButton: {
    width: 31,
    height: 31,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.redBright,
    marginLeft: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: 'rgba(238,45,82,0.12)',
  },
  listButton: {
    width: 31,
    height: 31,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    marginLeft: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listButtonActive: {
    backgroundColor: colors.redBright,
    borderColor: colors.redBright,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginTop: 13,
    marginBottom: 14,
  },
  columns: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  columnsStacked: {
    flexDirection: 'column',
    gap: 0,
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  rightColumn: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    color: '#8D8B98',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  synopsis: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  detailRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.055)',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    color: '#8D8B98',
    fontSize: 13,
    fontWeight: '600',
    flex: 0.8,
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    flex: 1.2,
  },
  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  castAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#292936',
    alignItems: 'center',
    justifyContent: 'center',
  },
  castInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  castName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  castRole: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  progressPercent: {
    color: colors.redBright,
    fontSize: 14,
    fontWeight: '900',
  },
  progressSubtext: {
    color: colors.muted,
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
  },
  progressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#292832',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.redBright,
  },
  remainingText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  statusLabel: {
    marginTop: 16,
    marginBottom: 10,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#353540',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillActive: {
    borderColor: '#5B9FFF',
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  statusPillText: {
    color: '#AAA7B3',
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#67A7FF',
    fontWeight: '900',
  },
  saveStatusButton: {
    minHeight: 40,
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: colors.redBright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  saveStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 6,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewSublabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  clearRatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  clearRatingText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  myRatingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
    gap: 10,
  },
  myRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191822',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  myRatingBadgeActive: {
    backgroundColor: 'rgba(255, 215, 106, 0.1)',
    borderColor: 'rgba(255, 215, 106, 0.4)',
  },
  myRatingBadgeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  myRatingBadgeTextActive: {
    color: '#FFD76A',
    fontWeight: '900',
  },
  ratingHintText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  unratedPromptRow: {
    marginTop: 10,
    marginBottom: 8,
  },
  unratedPromptText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  sliderSection: {
    marginVertical: 10,
  },
  sliderTouchArea: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
    cursor: 'pointer',
  },
  sliderTrackBg: {
    height: 8,
    width: '100%',
    backgroundColor: '#1E1D2A',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderTrackFill: {
    position: 'absolute',
    left: 0,
    height: '100%',
    backgroundColor: '#FFD76A',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD76A',
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  sliderThumbUnset: {
    backgroundColor: '#4A4858',
  },
  sliderStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  sliderStepTouchable: {
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  sliderStepText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  sliderStepTextActive: {
    color: '#FFD76A',
    fontWeight: '900',
    fontSize: 13,
  },
  notesLabel: {
    marginTop: 14,
    marginBottom: 8,
  },
  notesInput: {
    width: '100%',
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#353540',
    backgroundColor: '#171720',
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.redBright,
    gap: 7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  saveAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#232230',
    borderWidth: 1,
    borderColor: '#3D3B4E',
    gap: 7,
  },
  saveAllButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  saveMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  saveMessage: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
  },
  episodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalEpisodes: {
    color: colors.muted,
    fontSize: 12,
  },
  episodeList: {
    marginTop: 4,
  },
  episodeRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.055)',
    paddingVertical: 4,
  },
  episodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#4A4855',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  episodeCircleActive: {
    backgroundColor: colors.redBright,
    borderColor: colors.redBright,
  },
  episodeTitle: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
    marginRight: 8,
  },
  episodeTitleWatched: {
    color: '#8D8B98',
  },
  episodeNumber: {
    color: colors.muted,
    fontSize: 12,
    width: 32,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
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
  bottomSpace: {
    height: 40,
  },
});
