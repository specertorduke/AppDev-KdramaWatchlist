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

  const saveTrackerChanges = async (overrideStatus, overrideEpisodes, overrideRating, overrideNotes) => {
    setSavingStatus(true);
    setSaveMessage('');
    const statusToSave = (overrideStatus || selectedStatus).toLowerCase().replace(/ /g, '_');
    const epToSave = overrideEpisodes !== undefined ? overrideEpisodes : watchedEpisodes;
    const ratingToSave = overrideRating !== undefined ? overrideRating : selectedRating;
    const notesToSave = overrideNotes !== undefined ? overrideNotes : notes;

    const payload = {
      tmdb_id: tmdbId,
      status: statusToSave,
      current_episode: epToSave,
      rating: ratingToSave,
      review_notes: notesToSave,
    };

    try {
      if (tracker) {
        const res = await trackerService.updateProgress(tmdbId, payload);
        setTracker(res.data.data);
      } else {
        const res = await trackerService.addDrama(payload);
        setTracker(res.data.data);
      }
      setSaveMessage('Saved successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not save changes.';
      setSaveMessage('Save failed');
      Alert.alert('Notice', msg);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleToggleList = async () => {
    if (tracker) {
      try {
        await trackerService.deleteDrama(tmdbId);
        setTracker(null);
        Alert.alert('Removed', 'Drama removed from tracker.');
      } catch (e) {
        Alert.alert('Error', 'Could not remove from tracker.');
      }
    } else {
      await saveTrackerChanges('Plan to Watch', 0, 0, '');
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

  const episodesTotal = Number(drama.number_of_episodes || drama.episodes || 16);
  const progress =
    episodesTotal > 0 ? Math.min(100, Math.round((watchedEpisodes / episodesTotal) * 100)) : 0;
  const remainingEpisodes = Math.max(0, episodesTotal - watchedEpisodes);
  const ratingValue = Number(drama.rating || 9.2);

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
        { paddingHorizontal: isWide ? 24 : 12 },
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
            <Text style={styles.metaDot}>•</Text>
            <Text style={[styles.metaText, styles.ratingMeta]}>
              ★ {ratingValue.toFixed(1)}/10
            </Text>
          </View>

          <Text style={styles.availableText} numberOfLines={1}>
            Available on tvN · Netflix
          </Text>
        </View>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <Pressable
          style={styles.updateButton}
          onPress={() => saveTrackerChanges()}
          disabled={savingStatus}
        >
          <Ionicons name="options-outline" size={13} color="#FFFFFF" />
          <Text style={styles.updateButtonText}>
            {savingStatus ? 'Saving...' : 'Update Status'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={() => setIsFavorite((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={colors.redBright}
          />
        </Pressable>

        <Pressable
          style={[styles.listButton, tracker && styles.listButtonActive]}
          onPress={handleToggleList}
          accessibilityRole="button"
          accessibilityLabel={tracker ? 'Remove from tracker' : 'Add to tracker'}
        >
          <Ionicons
            name={tracker ? 'checkmark' : 'bookmark-outline'}
            size={16}
            color={tracker ? '#FFFFFF' : colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.divider} />

      {/* Two Columns Container */}
      <View style={[styles.columns, !isWide && styles.columnsStacked]}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          {/* SYNOPSIS */}
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
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
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

            {/* RATING */}
            <Text style={[styles.sectionLabel, styles.ratingLabel]}>MY RATING</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = selectedRating >= star * 2;
                return (
                  <Pressable
                    key={star}
                    onPress={() => {
                      const r = star * 2;
                      setSelectedRating(r);
                      setSaveMessage('');
                    }}
                    hitSlop={4}
                  >
                    <Ionicons
                      name={active ? 'star' : 'star-outline'}
                      size={20}
                      color={colors.gold}
                    />
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.ratingValue}>
              {selectedRating > 0 ? `${selectedRating}/10` : 'Not rated'}
            </Text>

            {/* NOTES */}
            <Text style={[styles.sectionLabel, styles.notesLabel]}>MY NOTES</Text>
            <TextInput
              value={notes}
              onChangeText={(v) => {
                setNotes(v);
                setSaveMessage('');
              }}
              multiline
              textAlignVertical="top"
              placeholder="Add a note..."
              placeholderTextColor={colors.muted}
              style={styles.notesInput}
            />

            <View style={styles.notesButtons}>
              <Pressable
                style={[styles.saveButton, savingStatus && styles.saveButtonDisabled]}
                onPress={() => saveTrackerChanges(undefined, undefined, undefined, notes)}
                disabled={savingStatus}
              >
                <Text style={styles.saveButtonText}>
                  {savingStatus ? 'Saving...' : 'Save Notes'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.saveAllButton, savingStatus && styles.saveButtonDisabled]}
                onPress={() => saveTrackerChanges(selectedStatus, watchedEpisodes, selectedRating, notes)}
                disabled={savingStatus}
              >
                <Ionicons name="save-outline" size={11} color="#FFFFFF" />
                <Text style={styles.saveAllButtonText}>Save All</Text>
              </Pressable>
            </View>

            {saveMessage ? (
              <View style={styles.saveMessageRow}>
                <Ionicons
                  name={saveMessage.includes('fail') ? 'alert-circle' : 'checkmark-circle'}
                  size={11}
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
    minWidth: 76,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
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
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },
  hero: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 118,
  },
  posterWrap: {
    width: 82,
    height: 116,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    position: 'relative',
    flexShrink: 0,
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
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: '900',
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 15,
    paddingTop: 2,
  },
  title: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  koreanTitle: {
    color: colors.text,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  metaText: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: '600',
  },
  metaDot: {
    color: colors.muted,
    fontSize: 8,
    marginHorizontal: 4,
  },
  ratingMeta: {
    color: colors.redBright,
    fontWeight: '900',
  },
  availableText: {
    color: colors.muted,
    fontSize: 7,
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
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  rightColumn: {
    flex: 0.62,
    minWidth: 0,
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 11,
  },
  sectionLabel: {
    color: '#858394',
    fontSize: 7,
    lineHeight: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 9,
  },
  synopsis: {
    color: colors.text,
    fontSize: 8.5,
    lineHeight: 14,
    fontWeight: '500',
  },
  detailRow: {
    minHeight: 25,
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
    color: '#777486',
    fontSize: 6.5,
    fontWeight: '600',
    flex: 0.8,
  },
  detailValue: {
    color: colors.text,
    fontSize: 6.8,
    fontWeight: '800',
    textAlign: 'right',
    flex: 1.2,
  },
  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  castAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#292936',
    alignItems: 'center',
    justifyContent: 'center',
  },
  castInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  castName: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '800',
  },
  castRole: {
    color: colors.muted,
    fontSize: 6.5,
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  progressPercent: {
    color: colors.redBright,
    fontSize: 7,
    fontWeight: '900',
  },
  progressSubtext: {
    color: colors.muted,
    fontSize: 6.5,
    marginTop: -4,
    marginBottom: 6,
  },
  progressTrack: {
    width: '100%',
    height: 3,
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
    fontSize: 6.5,
    marginTop: 6,
  },
  statusLabel: {
    marginTop: 13,
    marginBottom: 7,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    minHeight: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#353540',
    backgroundColor: 'rgba(255,255,255,0.01)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillActive: {
    borderColor: '#5B9FFF',
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  statusPillText: {
    color: '#AAA7B3',
    fontSize: 6.3,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#67A7FF',
    fontWeight: '900',
  },
  saveStatusButton: {
    height: 28,
    marginTop: 9,
    borderRadius: 7,
    backgroundColor: colors.redBright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  saveStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    marginLeft: 5,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  ratingLabel: {
    marginTop: 14,
    marginBottom: 7,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    color: colors.muted,
    fontSize: 6.5,
    fontWeight: '700',
    marginTop: 5,
  },
  notesLabel: {
    marginTop: 14,
    marginBottom: 7,
  },
  notesInput: {
    width: '100%',
    minHeight: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#353540',
    backgroundColor: '#171720',
    color: colors.text,
    fontSize: 7.5,
    lineHeight: 12,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  notesButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  saveButton: {
    alignSelf: 'flex-start',
    height: 23,
    paddingHorizontal: 11,
    borderRadius: 6,
    backgroundColor: colors.redBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 6.5,
    fontWeight: '900',
  },
  saveAllButton: {
    height: 23,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#292936',
    borderWidth: 1,
    borderColor: '#454351',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAllButtonText: {
    color: '#FFFFFF',
    fontSize: 6.5,
    fontWeight: '900',
    marginLeft: 4,
  },
  saveMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  saveMessage: {
    fontSize: 6.5,
    fontWeight: '800',
    marginLeft: 4,
  },
  episodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalEpisodes: {
    color: colors.muted,
    fontSize: 6.5,
    marginTop: -8,
  },
  episodeList: {
    marginTop: -1,
  },
  episodeRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.055)',
  },
  episodeCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
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
    fontSize: 6.8,
    fontWeight: '700',
    marginLeft: 8,
    marginRight: 5,
  },
  episodeTitleWatched: {
    color: '#AAA7B3',
  },
  episodeNumber: {
    color: colors.muted,
    fontSize: 6.3,
    width: 24,
    textAlign: 'right',
  },
  bottomSpace: {
    height: 30,
  },
});
