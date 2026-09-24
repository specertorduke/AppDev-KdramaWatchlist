import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { trackerService } from '../../services/api';

const STATUS_OPTIONS = [
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
  if (!status) return colors.muted;
  const formatted = status.replace(/_/g, ' ').toLowerCase();
  if (formatted.includes('watch') && !formatted.includes('plan')) return STATUS_COLORS.Watching;
  if (formatted.includes('complete')) return STATUS_COLORS.Completed;
  if (formatted.includes('plan')) return STATUS_COLORS['Plan to Watch'];
  if (formatted.includes('hold')) return STATUS_COLORS['On Hold'];
  if (formatted.includes('drop')) return STATUS_COLORS.Dropped;
  return colors.muted;
};

export default function TrackerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'All');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync tab if navigation passes route params (e.g. from Quick Access or Home Stats)
  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  // Status Modal State
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Plan to Watch');
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const params = {};
      if (activeTab === 'Favorites') {
        params.favorite = true;
      } else if (activeTab !== 'All') {
        params.status = activeTab.toLowerCase().replace(/ /g, '_');
      }

      const res = await trackerService.getWatchlist(params);
      setItems(res.data.data || []);
      if (res.data.meta && res.data.meta.counts) {
        setCounts(res.data.meta.counts);
      }
    } catch (e) {
      console.warn('Failed to load watchlist:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchWatchlist();
    }, [fetchWatchlist])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWatchlist();
  };

  const handleOpenStatusEditor = (item) => {
    setEditingItem(item);
    const rawStatus = item.status || 'plan_to_watch';
    const displayStatus = rawStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    setSelectedStatus(STATUS_OPTIONS.includes(displayStatus) ? displayStatus : 'Plan to Watch');
    setStatusModalVisible(true);
  };

  const handleCloseStatusEditor = () => {
    setStatusModalVisible(false);
    setEditingItem(null);
  };

  const handleSaveStatus = async () => {
    if (!editingItem) return;
    setSavingStatus(true);
    try {
      const apiStatus = selectedStatus.toLowerCase().replace(/ /g, '_');
      await trackerService.updateProgress(editingItem.tmdb_id, {
        status: apiStatus,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.tmdb_id === editingItem.tmdb_id ? { ...i, status: apiStatus } : i
        )
      );
      handleCloseStatusEditor();
      fetchWatchlist();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const tabs = [
    ['All', counts.all ?? items.length],
    ['Favorites', counts.favorites ?? 0],
    ['Watching', counts.watching ?? 0],
    ['Completed', counts.completed ?? 0],
    ['Plan to Watch', counts.plan_to_watch ?? 0],
    ['On Hold', counts.on_hold ?? 0],
    ['Dropped', counts.dropped ?? 0],
  ];

  // View Mode: 'list' | 'grid'
  const [viewMode, setViewMode] = useState('list');
  const [loggingId, setLoggingId] = useState(null);

  const handleQuickIncrement = async (item, e) => {
    e?.stopPropagation?.();
    if (loggingId === item.tmdb_id) return;
    setLoggingId(item.tmdb_id);

    const nextEp = (Number(item.current_episode) || 0) + 1;
    const total = Number(item.total_episodes) || 0;
    const newStatus = total > 0 && nextEp >= total ? 'completed' : item.status;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) =>
        i.tmdb_id === item.tmdb_id
          ? {
              ...i,
              current_episode: nextEp,
              status: newStatus,
              progress_percentage: total > 0 ? Math.min(100, Math.round((nextEp / total) * 100)) : 0,
            }
          : i
      )
    );

    try {
      await trackerService.incrementEpisode(item.tmdb_id);
    } catch (err) {
      // rollback if failed
      fetchWatchlist();
    } finally {
      setLoggingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Tracker Scroll View */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (insets.top > 0 ? insets.top : 12) + 6,
            paddingBottom: Math.max(insets.bottom, 16) + 85,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.redBright}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed, hovered }) => [
                styles.backButton,
                hovered && styles.backButtonHover,
                pressed && styles.backButtonPressed,
              ]}
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back to Home"
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.title}>My Tracker</Text>
              <Text style={styles.subtitle}>
                {counts.all ? `${counts.all} dramas in collection` : 'Track your K-drama journey'}
              </Text>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.headerRightActions}>
            {/* View Mode Toggle Button */}
            <Pressable
              style={styles.viewToggleBtn}
              onPress={() => setViewMode((v) => (v === 'list' ? 'grid' : 'list'))}
              hitSlop={6}
            >
              <Ionicons
                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                size={17}
                color={colors.text}
              />
            </Pressable>

            {/* Add Drama Button */}
            <Pressable
              style={({ pressed, hovered }) => [
                styles.addButton,
                hovered && styles.addButtonHover,
                pressed && styles.addButtonPressed,
              ]}
              onPress={() => navigation.navigate('AddDrama')}
              accessibilityRole="button"
              accessibilityLabel="Add drama"
              hitSlop={5}
            >
              <Ionicons name="add" size={16} color="#07070E" />
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          keyboardShouldPersistTaps="handled"
        >
          {tabs.map(([name, count]) => {
            const isActive = activeTab === name;
            return (
              <Pressable
                key={name}
                onPress={() => setActiveTab(name)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                {name === 'Favorites' && (
                  <Ionicons
                    name="heart"
                    size={12}
                    color={isActive ? '#FF4655' : colors.muted}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {name} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="sparkles" size={30} color={colors.redBright} />
            </View>
            <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
            <Text style={styles.emptyText}>
              Discover trending K-dramas and start tracking your binge journey!
            </Text>
            <Pressable
              style={styles.emptyAddBtn}
              onPress={() => navigation.navigate('AddDrama')}
            >
              <Ionicons name="add-circle" size={16} color="#07070E" />
              <Text style={styles.emptyAddBtnText}>Explore & Add Drama</Text>
            </Pressable>
          </View>
        )}

        {/* Drama List / Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.redBright} />
          </View>
        ) : viewMode === 'grid' ? (
          /* POSTER GRID VIEW (Clean Netflix/IMDb style without dark shadow overlay or overlapping buttons) */
          <View style={styles.gridContainer}>
            {items.map((item) => {
              const drama = item.drama || {};
              const episodeTotal = Number(item.total_episodes) || Number(drama.total_episodes) || 0;
              const watched = Number(item.current_episode) || 0;
              const progress = episodeTotal > 0 ? Math.round((watched / episodeTotal) * 100) : 0;
              const displayStatus = String(item.status || 'plan_to_watch')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
              const statusColor = getStatusColor(displayStatus);
              const posterSource = drama.poster_url || drama.image || drama.poster || null;

              return (
                <Pressable
                  key={item.id || item.tmdb_id}
                  style={styles.gridCard}
                  onPress={() => navigation.navigate('DramaDetail', { tmdbId: item.tmdb_id })}
                >
                  {/* Clean Poster - Pure artwork with NO dark overlay */}
                  <View style={styles.gridPosterWrap}>
                    {posterSource ? (
                      <Image source={{ uri: posterSource }} style={styles.gridPoster} resizeMode="cover" />
                    ) : (
                      <View style={styles.gridPosterPlaceholder}>
                        <Ionicons name="film-outline" size={24} color={colors.muted} />
                      </View>
                    )}

                    {/* Clean bottom progress line */}
                    <View style={styles.gridProgressTrack}>
                      <View
                        style={[
                          styles.gridProgressFill,
                          { width: `${progress}%`, backgroundColor: statusColor },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Information Row Underneath Poster (Clean, Non-overlapping) */}
                  <View style={styles.gridInfoBox}>
                    <Text style={styles.gridTitle} numberOfLines={1}>
                      {drama.title || 'Untitled'}
                    </Text>

                    {/* Status & Quick Add Row */}
                    <View style={styles.gridActionRow}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleOpenStatusEditor(item);
                        }}
                        style={[
                          styles.gridStatusPillClean,
                          { backgroundColor: `${statusColor}22` },
                        ]}
                      >
                        <View style={[styles.statusDotSmall, { backgroundColor: statusColor }]} />
                        <Text style={[styles.gridStatusTextClean, { color: statusColor }]} numberOfLines={1}>
                          {displayStatus}
                        </Text>
                      </Pressable>

                      {item.status === 'watching' && (
                        <Pressable
                          onPress={(e) => handleQuickIncrement(item, e)}
                          style={styles.gridQuickAddClean}
                          hitSlop={5}
                        >
                          <Text style={styles.gridQuickAddTextClean}>+1</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Episodes & Progress */}
                    <View style={styles.gridMetaRow}>
                      <Text style={styles.gridEpisodesText}>
                        {watched}/{episodeTotal || '?'} eps
                      </Text>
                      {Number(item.rating) > 0 ? (
                        <View style={styles.gridRatingBadge}>
                          <Ionicons name="star" size={10} color="#FFD76A" />
                          <Text style={styles.gridRatingText}>{Number(item.rating).toFixed(0)}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.gridPercentText, { color: statusColor }]}>{progress}%</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          /* RICH LIST VIEW */
          <View style={styles.list}>
            {items.map((item) => {
              const drama = item.drama || {};
              const episodeTotal = Number(item.total_episodes) || Number(drama.total_episodes) || 0;
              const watched = Number(item.current_episode) || 0;
              const progress = episodeTotal > 0 ? Math.round((watched / episodeTotal) * 100) : 0;
              const displayStatus = String(item.status || 'plan_to_watch')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
              const statusColor = getStatusColor(displayStatus);
              const posterSource = drama.poster_url || drama.image || drama.poster || null;

              // Genre formatting: clean strings, filter out raw objects
              const genreText = Array.isArray(drama.genres)
                ? drama.genres
                    .map((g) => (typeof g === 'string' ? g : g?.name || ''))
                    .filter(Boolean)
                    .join(' · ')
                : typeof drama.genre === 'string'
                ? drama.genre
                : 'K-Drama';

              return (
                <View key={item.id || item.tmdb_id} style={styles.card}>
                  <Pressable
                    style={styles.cardPressable}
                    onPress={() =>
                      navigation.navigate('DramaDetail', { tmdbId: item.tmdb_id })
                    }
                  >
                    {/* Poster with clean Status Accent border */}
                    <View style={styles.posterContainer}>
                      {posterSource ? (
                        <Image
                          source={{ uri: posterSource }}
                          style={styles.poster}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.posterPlaceholder}>
                          <Ionicons name="film-outline" size={20} color={colors.muted} />
                        </View>
                      )}
                      <View style={[styles.posterStatusStripe, { backgroundColor: statusColor }]} />
                    </View>

                    <View style={styles.cardMain}>
                      {/* Title & Status Pill in clean top row */}
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.dramaTitle} numberOfLines={1}>
                          {drama.title || 'Untitled Drama'}
                        </Text>
                        <Pressable
                          onPress={() => handleOpenStatusEditor(item)}
                          style={[
                            styles.status,
                            { backgroundColor: `${statusColor}22` },
                          ]}
                          hitSlop={4}
                        >
                          <View style={[styles.statusDotSmall, { backgroundColor: statusColor }]} />
                          <Text
                            style={[styles.statusText, { color: statusColor }]}
                            numberOfLines={1}
                          >
                            {displayStatus}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={10}
                            color={statusColor}
                            style={styles.statusChevron}
                          />
                        </Pressable>
                      </View>

                      {/* Genre Subtext */}
                      <Text style={styles.genre} numberOfLines={1}>
                        {genreText || 'Drama'}
                      </Text>

                      {/* Episode Progress & Quick +1 Action */}
                      <View style={styles.episodeProgressRow}>
                        <Text style={styles.episodes}>
                          <Text style={styles.episodesCurrent}>{watched}</Text> / {episodeTotal || '?'} eps
                        </Text>

                        <View style={styles.progressRightGroup}>
                          {item.status === 'watching' && (
                            <Pressable
                              style={styles.quickAddEpisodeBtn}
                              onPress={(e) => handleQuickIncrement(item, e)}
                              hitSlop={6}
                            >
                              <Ionicons name="add" size={12} color="#FFFFFF" />
                              <Text style={styles.quickAddEpisodeText}>1 ep</Text>
                            </Pressable>
                          )}
                          <Text style={[styles.percentBadge, { color: statusColor }]}>
                            {progress}%
                          </Text>
                        </View>
                      </View>

                      {/* Sleek Progress Track */}
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: statusColor },
                          ]}
                        />
                      </View>

                      {/* Bottom Meta: Rating and Review */}
                      <View style={styles.bottomRow}>
                        {Number(item.rating) > 0 ? (
                          <View style={styles.ratingChip}>
                            <Ionicons name="star" size={11} color="#FFD76A" />
                            <Text style={styles.ratingChipText}>
                              {Number(item.rating).toFixed(0)}/10
                            </Text>
                          </View>
                        ) : null}

                        {item.review_notes ? (
                          <Text style={styles.comment} numberOfLines={1}>
                            "{item.review_notes}"
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Status Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseStatusEditor}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Update Status</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {editingItem?.drama?.title || 'Drama'}
                </Text>
              </View>
              <Pressable onPress={handleCloseStatusEditor} style={styles.closeButton}>
                <Ionicons name="close" size={17} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = selectedStatus === status;
                const optionColor = getStatusColor(status);

                return (
                  <Pressable
                    key={status}
                    onPress={() => setSelectedStatus(status)}
                    style={[
                      styles.statusOption,
                      isSelected && {
                        backgroundColor: `${optionColor}2E`,
                      },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: optionColor }]} />
                    <Text
                      style={[
                        styles.statusOptionText,
                        isSelected && { color: colors.text, fontWeight: '800' },
                      ]}
                    >
                      {status}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={optionColor}
                        style={styles.statusCheck}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={handleCloseStatusEditor} style={styles.cancelModalButton}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveStatus}
                style={styles.saveModalButton}
                disabled={savingStatus}
              >
                {savingStatus ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={styles.saveModalText}>Save Status</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    minHeight: 40,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonHover: {
    backgroundColor: '#1E1B30',
    transform: [{ scale: 1.04 }],
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 8.5,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5A9C4',
    paddingHorizontal: 13,
    paddingVertical: 8,
    minHeight: 34,
    borderRadius: 999,
    shadowColor: '#F5A9C4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  addButtonHover: {
    backgroundColor: '#E085A6',
    transform: [{ scale: 1.035 }],
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addText: {
    color: '#07070E',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  tabs: {
    gap: 8,
    paddingBottom: 16,
    paddingRight: 10,
  },
  tab: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#161424',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabActive: {
    backgroundColor: '#2A2438',
  },
  tabText: {
    color: '#8F8B97',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
  },
  list: {
    gap: 12,
  },
  card: {
    minHeight: 110,
    backgroundColor: '#161424',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    minHeight: 85,
    paddingRight: 4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(245, 169, 196, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5A9C4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
  },
  emptyAddBtnText: {
    color: '#07070E',
    fontSize: 13,
    fontWeight: '800',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#161424',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gridPosterWrap: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.bg,
  },
  gridPoster: {
    width: '100%',
    height: '100%',
  },
  gridPosterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel2,
  },
  gridInfoBox: {
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  gridActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  gridStatusPillClean: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    gap: 4,
  },
  gridStatusTextClean: {
    fontSize: 9.5,
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    lineHeight: 12,
  },
  gridQuickAddClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    minWidth: 28,
    backgroundColor: '#272338',
    paddingHorizontal: 8,
    borderRadius: 8,
    flexShrink: 0,
  },
  gridQuickAddTextClean: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
    lineHeight: 12,
  },
  gridProgressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  gridProgressFill: {
    height: '100%',
  },
  gridTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gridEpisodesText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  gridRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridRatingText: {
    color: '#FFD76A',
    fontSize: 11,
    fontWeight: '800',
  },
  gridPercentText: {
    fontSize: 11,
    fontWeight: '800',
  },
  posterContainer: {
    width: 62,
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.bg,
  },
  posterStatusStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel2,
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dramaTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginRight: 6,
  },
  genre: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  episodeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  episodes: {
    color: '#AAA4AC',
    fontSize: 12,
    fontWeight: '600',
  },
  episodesCurrent: {
    color: colors.text,
    fontWeight: '900',
  },
  progressRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentBadge: {
    fontSize: 11,
    fontWeight: '900',
  },
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: '#262433',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 106, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingChipText: {
    color: '#FFD76A',
    fontSize: 11,
    fontWeight: '900',
  },
  comment: {
    color: '#9E9BAA',
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
  status: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    height: 24,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
    alignSelf: 'center',
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 13,
    flexShrink: 0,
  },
  statusChevron: {
    marginLeft: 2,
    flexShrink: 0,
  },
  quickAddEpisodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    backgroundColor: '#2A243A',
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  quickAddEpisodeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  bottomSpace: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#161424',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  statusOptions: {
    gap: 8,
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E1B30',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  statusCheck: {
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#1E1B30',
  },
  cancelModalText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  saveModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redBright,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveModalText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});
