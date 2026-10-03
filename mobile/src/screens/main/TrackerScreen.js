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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { trackerService } from '../../services/api';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'watching', label: 'Watching' },
  { key: 'completed', label: 'Completed' },
  { key: 'plan_to_watch', label: 'Plan to Watch' },
  { key: 'dropped', label: 'Dropped' },
];

export default function TrackerScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incrementingId, setIncrementingId] = useState(null);

  const fetchWatchlist = useCallback(async () => {
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;

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

  const handleIncrement = async (tmdbId) => {
    setIncrementingId(tmdbId);
    try {
      const res = await trackerService.incrementEpisode(tmdbId);
      // Update item in local list
      setItems((prev) =>
        prev.map((item) =>
          item.tmdb_id === tmdbId ? { ...item, ...res.data.data } : item
        )
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not increment episode.';
      Alert.alert('Notice', msg);
    } finally {
      setIncrementingId(null);
    }
  };

  const handleDelete = (tmdbId, title) => {
    Alert.alert('Remove Drama', `Remove "${title}" from your watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await trackerService.deleteDrama(tmdbId);
            setItems((prev) => prev.filter((item) => item.tmdb_id !== tmdbId));
          } catch (err) {
            Alert.alert('Error', 'Failed to remove drama.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>My Watchlist</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabList}
      >
        {STATUS_TABS.map((tab) => {
          const isSelected = activeTab === tab.key;
          const count = counts[tab.key] ?? null;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, isSelected && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label} {count !== null ? `(${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Watchlist Items */}
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.red} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
            <Text style={styles.emptySubtitle}>Explore and add dramas to start tracking</Text>
            <Pressable
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Discover')}
            >
              <Text style={styles.exploreBtnText}>Browse Dramas</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cardList}>
            {items.map((item) => {
              const drama = item.drama || {};
              const isIncrementing = incrementingId === item.tmdb_id;
              const isMaxed =
                item.total_episodes > 0 && item.current_episode >= item.total_episodes;

              return (
                <Pressable
                  key={item.id || item.tmdb_id}
                  style={styles.trackerCard}
                  onPress={() =>
                    navigation.navigate('DramaDetail', { tmdbId: item.tmdb_id })
                  }
                >
                  <Image
                    source={{
                      uri:
                        drama.poster_url ||
                        'https://via.placeholder.com/300x450',
                    }}
                    style={styles.poster}
                  />

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.dramaTitle} numberOfLines={1}>
                        {drama.title || 'Untitled'}
                      </Text>
                      <Pressable
                        onPress={() => handleDelete(item.tmdb_id, drama.title)}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.muted} />
                      </Pressable>
                    </View>

                    {/* Progress Info */}
                    <Text style={styles.progressText}>
                      Episode {item.current_episode} / {item.total_episodes || '?'}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              100,
                              item.progress_percentage ||
                                (item.current_episode / (item.total_episodes || 1)) * 100
                            )}%`,
                          },
                        ]}
                      />
                    </View>

                    {/* Footer / Quick +1 Action */}
                    <View style={styles.cardFooter}>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                          {String(item.status).replace(/_/g, ' ').toUpperCase()}
                        </Text>
                      </View>

                      {!isMaxed && (
                        <Pressable
                          style={[
                            styles.incrementButton,
                            isIncrementing && styles.incrementButtonDisabled,
                          ]}
                          onPress={() => handleIncrement(item.tmdb_id)}
                          disabled={isIncrementing}
                        >
                          {isIncrementing ? (
                            <ActivityIndicator size="small" color={colors.white} />
                          ) : (
                            <Text style={styles.incrementButtonText}>+1 Ep</Text>
                          )}
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.nav,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  tabScroll: {
    backgroundColor: colors.nav,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    maxHeight: 50,
  },
  tabList: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(232,33,63,0.15)',
    borderBottomWidth: 2,
    borderBottomColor: colors.redBright,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.redBright,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  exploreBtn: {
    marginTop: 16,
    backgroundColor: colors.redBright,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  cardList: {
    gap: 12,
  },
  trackerCard: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 12,
  },
  poster: {
    width: 65,
    height: 90,
    borderRadius: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dramaTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  progressText: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.redBright,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
  },
  incrementButton: {
    backgroundColor: colors.redBright,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 54,
    alignItems: 'center',
  },
  incrementButtonDisabled: {
    opacity: 0.6,
  },
  incrementButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
});
