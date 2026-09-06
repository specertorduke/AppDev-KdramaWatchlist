import React, { useState, useEffect, useCallback } from 'react';
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

export default function TrackerScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Status Modal State
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Plan to Watch');
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const params = {};
      if (activeTab !== 'All') {
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

  useEffect(() => {
    setLoading(true);
    fetchWatchlist();
  }, [fetchWatchlist]);

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
    ['Watching', counts.watching ?? 0],
    ['Completed', counts.completed ?? 0],
    ['Plan to Watch', counts.plan_to_watch ?? 0],
    ['On Hold', counts.on_hold ?? 0],
    ['Dropped', counts.dropped ?? 0],
  ];

  return (
    <View style={styles.screen}>
      {/* Tracker Scroll View */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
              <Text style={styles.subtitle}>Keep track of what you're watching.</Text>
            </View>
          </View>

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
            <Ionicons name="add" size={15} color="#fff" />
            <Text style={styles.addText}>Add Drama</Text>
          </Pressable>
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
            <Ionicons name="film-outline" size={30} color={colors.muted} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>Add a drama to start building your list.</Text>
          </View>
        )}

        {/* Drama List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.redBright} />
          </View>
        ) : (
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

              return (
                <View key={item.id || item.tmdb_id} style={styles.card}>
                  <Pressable
                    style={styles.cardPressable}
                    onPress={() =>
                      navigation.navigate('DramaDetail', { tmdbId: item.tmdb_id })
                    }
                  >
                    {posterSource ? (
                      <Image
                        source={{ uri: posterSource }}
                        style={styles.poster}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.posterPlaceholder}>
                        <Ionicons name="film-outline" size={18} color={colors.muted} />
                      </View>
                    )}

                    <View style={styles.cardMain}>
                      <Text style={styles.dramaTitle} numberOfLines={1}>
                        {drama.title || 'Untitled Drama'}
                      </Text>

                      <Text style={styles.genre} numberOfLines={1}>
                        {Array.isArray(drama.genres)
                          ? drama.genres.join(', ')
                          : drama.genre || 'Drama'}
                      </Text>

                      <Text style={styles.episodes}>
                        {watched}/{episodeTotal || 0} eps
                      </Text>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: statusColor },
                          ]}
                        />
                      </View>

                      <View style={styles.bottomRow}>
                        <Text
                          style={[
                            styles.rating,
                            { color: Number(item.rating) > 0 ? '#FBBF24' : statusColor },
                          ]}
                        >
                          ★ {Number(item.rating || drama.rating || 0).toFixed(1)}
                        </Text>
                        {item.review_notes ? (
                          <Text style={styles.comment} numberOfLines={1}>
                            {item.review_notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>

                  {/* Status Dropdown Button */}
                  <Pressable
                    onPress={() => handleOpenStatusEditor(item)}
                    style={[
                      styles.status,
                      { borderColor: statusColor, backgroundColor: `${statusColor}18` },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusColor }]}
                      numberOfLines={1}
                    >
                      {displayStatus}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={9}
                      color={statusColor}
                      style={styles.statusChevron}
                    />
                  </Pressable>

                  {/* Percent */}
                  <Text style={[styles.percent, { color: statusColor }]}>
                    {progress}%
                  </Text>
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
                        borderColor: optionColor,
                        backgroundColor: `${optionColor}18`,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backButtonHover: {
    backgroundColor: '#211F2D',
    borderColor: '#5B526F',
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
    backgroundColor: colors.redBright,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    borderRadius: 999,
  },
  addButtonHover: {
    backgroundColor: '#E01B43',
    transform: [{ scale: 1.035 }],
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
  },
  tabs: {
    gap: 7,
    paddingBottom: 14,
    paddingRight: 10,
  },
  tab: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  tabActive: {
    backgroundColor: 'rgba(200,16,46,0.15)',
    borderColor: colors.red,
  },
  tabText: {
    color: '#8F8B97',
    fontSize: 8.5,
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
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  list: {
    gap: 10,
  },
  card: {
    minHeight: 97,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    minHeight: 75,
    paddingRight: 4,
  },
  poster: {
    width: 42,
    height: 60,
    borderRadius: 7,
    backgroundColor: colors.bg,
  },
  posterPlaceholder: {
    width: 42,
    height: 60,
    borderRadius: 7,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  dramaTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  genre: {
    color: colors.muted,
    fontSize: 7.5,
    marginTop: 2,
  },
  episodes: {
    color: '#777582',
    fontSize: 7.5,
    marginTop: 7,
    marginBottom: 4,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#292833',
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
    gap: 9,
    marginTop: 5,
  },
  rating: {
    fontSize: 7.5,
    fontWeight: '800',
  },
  comment: {
    color: '#777580',
    fontSize: 7.5,
    fontStyle: 'italic',
    flex: 1,
  },
  status: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 7.5,
    fontWeight: '800',
  },
  statusChevron: {
    marginLeft: 3,
  },
  percent: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    fontSize: 8.5,
    fontWeight: '800',
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
    backgroundColor: colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel2,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
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
