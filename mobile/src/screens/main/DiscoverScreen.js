import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import DramaCard from '../../components/DramaCard';
import { discoverService, trackerService } from '../../services/api';

export default function DiscoverScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [genres, setGenres] = useState([]);
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Fetch Genres (excluding empty genres that have no K-dramas)
  useEffect(() => {
    discoverService
      .getGenres()
      .then((res) => {
        const raw = res?.data?.data || [];
        const emptyNames = new Set(['news', 'reality', 'talk', 'western']);
        const filtered = raw.filter(
          (g) => !emptyNames.has(String(g.name).trim().toLowerCase())
        );
        setGenres([{ id: null, name: 'All' }, ...filtered]);
      })
      .catch((e) => {
        console.warn('Failed to load genres:', e);
        setGenres([
          { id: null, name: 'All' },
          { id: 10749, name: 'Romance' },
          { id: 18, name: 'Drama' },
          { id: 35, name: 'Comedy' },
          { id: 10759, name: 'Action' },
          { id: 9648, name: 'Mystery' },
          { id: 10765, name: 'Sci-Fi & Fantasy' },
          { id: 80, name: 'Crime' },
          { id: 10751, name: 'Family' },
          { id: 16, name: 'Animation' },
        ]);
      });
  }, []);

  // Fetch / Search Dramas function
  const fetchDramas = useCallback(
    async (targetPage = 1, isRefresh = false, isAppend = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = { page: targetPage };
        if (selectedGenreId) params.genre_id = selectedGenreId;
        if (query.trim()) params.search = query.trim();

        const fetchPromise = query.trim()
          ? discoverService.search({ query: query.trim(), page: targetPage })
          : discoverService.discover(params);

        const [res, trackerRes] = await Promise.all([
          fetchPromise,
          trackerService.getWatchlist().catch(() => null),
        ]);

        const rawDramas = res?.data?.data || [];

        // If a selected genre has no dramas (empty), remove it from the list
        if (!isAppend && selectedGenreId !== null && rawDramas.length === 0 && !query.trim()) {
          setGenres((prev) => prev.filter((g) => g.id !== selectedGenreId));
          setSelectedGenreId(null);
          return;
        }

        const userWatchlist = trackerRes?.data?.data || [];
        const statusMap = new Map();
        userWatchlist.forEach((item) => {
          const id = item.tmdb_id || item.id;
          if (id) statusMap.set(String(id), item.status);
        });

        const merged = rawDramas.map((drama) => {
          const dramaId = String(drama.tmdb_id || drama.id);
          const trackedStatus = statusMap.get(dramaId);
          return {
            ...drama,
            watch_status: trackedStatus || drama.watch_status || drama.status,
            status: trackedStatus || drama.status || drama.watch_status,
          };
        });

        if (isAppend) {
          setDramas((prev) => {
            const seen = new Set(prev.map((d) => String(d.tmdb_id || d.id)));
            const newItems = merged.filter((d) => !seen.has(String(d.tmdb_id || d.id)));
            return [...prev, ...newItems];
          });
        } else {
          setDramas(merged);
          setFeaturedIndex(0);
        }

        setPage(targetPage);
        setHasMore(Boolean(res?.data?.pagination?.has_more));
      } catch (e) {
        console.warn('Failed to fetch discover list:', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [query, selectedGenreId]
  );

  // Trigger search/filter reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDramas(1, false, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchDramas]);

  // Refresh handler: advances page or shuffles to see fresh dramas
  const handleRefresh = useCallback(() => {
    // Advance to next page so users discover new/different recommended dramas
    const nextPage = hasMore ? page + 1 : 1;
    fetchDramas(nextPage, true, false);
  }, [fetchDramas, hasMore, page]);

  // Load more handler (appends to list)
  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchDramas(page + 1, false, true);
    }
  }, [fetchDramas, hasMore, loading, loadingMore, page]);

  const featuredDramas = dramas.slice(0, Math.min(5, dramas.length));
  const featuredDrama =
    featuredDramas.length > 0 ? featuredDramas[featuredIndex % featuredDramas.length] : null;

  const previousFeatured = () => {
    if (featuredDramas.length === 0) return;
    setFeaturedIndex((current) => (current === 0 ? featuredDramas.length - 1 : current - 1));
  };

  const nextFeatured = () => {
    if (featuredDramas.length === 0) return;
    setFeaturedIndex((current) => (current + 1) % featuredDramas.length);
  };

  const getDramaImage = (drama) => {
    if (!drama) return null;
    return (
      drama.backdrop_url ||
      drama.backdrop ||
      drama.poster_url ||
      drama.poster ||
      drama.image ||
      null
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: colors.bg,
            borderBottomColor: colors.border,
            borderBottomWidth: isDark ? 0 : 1,
            paddingTop: insets.top > 0 ? insets.top : 8,
            height: (insets.top > 0 ? insets.top : 8) + 54,
          },
        ]}
      >
        <View style={styles.brandArea}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/sarangtv-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.brand, { color: colors.text }]}>
              Sarang<Text style={[styles.brandTv, { color: colors.pink }]}>TV</Text>
            </Text>
          </View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Discover</Text>
        </View>

        <Pressable
          onPress={() => setShowSearch((current) => !current)}
          style={({ pressed }) => [
            styles.searchButton,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 },
            pressed && styles.searchButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search dramas"
        >
          <Ionicons
            name={showSearch ? 'close-outline' : 'search-outline'}
            size={22}
            color={colors.text}
          />
        </Pressable>
      </View>

      <ScrollView
        style={[styles.screen, { backgroundColor: colors.bg }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 85 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.pink}
            colors={[colors.pink]}
          />
        }
      >
        {/* Search Box */}
        {showSearch && (
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 },
            ]}
          >
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search dramas..."
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
              >
                <Ionicons name="close-circle" size={17} color={colors.muted} />
              </Pressable>
            )}
          </View>
        )}

        {/* Featured Hero Carousel */}
        {featuredDrama && (
          <View style={styles.hero}>
            {getDramaImage(featuredDrama) ? (
              <Image
                source={{ uri: getDramaImage(featuredDrama) }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroFallback} />
            )}

            <View style={styles.heroOverlay} />

            {/* Left Arrow */}
            <Pressable
              onPress={previousFeatured}
              style={({ pressed }) => [
                styles.heroArrow,
                styles.heroArrowLeft,
                pressed && styles.heroArrowPressed,
              ]}
              accessibilityLabel="Previous featured drama"
            >
              <Ionicons name="chevron-back" size={15} color="#FFFFFF" />
            </Pressable>

            {/* Right Arrow */}
            <Pressable
              onPress={nextFeatured}
              style={({ pressed }) => [
                styles.heroArrow,
                styles.heroArrowRight,
                pressed && styles.heroArrowPressed,
              ]}
              accessibilityLabel="Next featured drama"
            >
              <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
            </Pressable>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <Text style={[styles.heroEyebrow, { color: colors.pink }]}>#1 THIS WEEK</Text>
              <Text style={[styles.heroTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
                {featuredDrama.title || featuredDrama.name}
              </Text>

              <View style={styles.heroBottomRow}>
                <Pressable
                  onPress={() =>
                    navigation.navigate('DramaDetail', {
                      tmdbId: featuredDrama.tmdb_id || featuredDrama.id,
                    })
                  }
                  style={({ pressed }) => [
                    styles.detailsButton,
                    { backgroundColor: colors.pink },
                    pressed && styles.detailsButtonPressed,
                  ]}
                >
                  <Ionicons name="play" size={10} color="#FFFFFF" />
                  <Text style={styles.detailsText}>View Details</Text>
                </Pressable>

                <View style={styles.rating}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={[styles.ratingText, { color: '#FFFFFF' }]}>
                    {Number(featuredDrama.rating || 9.4).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Hero Dots */}
            <View style={styles.heroDots}>
              {featuredDramas.map((drama, index) => (
                <Pressable
                  key={String(drama?.tmdb_id || drama?.id || index)}
                  onPress={() => setFeaturedIndex(index)}
                  style={styles.heroDotButton}
                >
                  <View
                    style={[styles.heroDot, index === featuredIndex && [styles.heroDotActive, { backgroundColor: colors.pink }]]}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Genre Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ overflow: 'visible', marginVertical: 6, flexGrow: 0 }}
          contentContainerStyle={styles.filters}
          keyboardShouldPersistTaps="handled"
        >
          {genres.map((item) => {
            const isActive = selectedGenreId === item.id;
            return (
              <Pressable
                key={String(item.id || 'all')}
                onPress={() => setSelectedGenreId(item.id)}
                style={({ pressed }) => [
                  styles.filter,
                  {
                    backgroundColor: isActive ? (isDark ? '#2A2438' : colors.pink) : colors.card,
                    borderWidth: 0,
                  },
                  pressed && styles.filterPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? '#FFFFFF' : colors.muted },
                    isActive && { fontWeight: '800' },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Result Header */}
        <View style={styles.resultHeader}>
          <View style={styles.resultTitleCol}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {selectedGenreId
                ? genres.find((g) => g.id === selectedGenreId)?.name || 'Dramas'
                : 'All Dramas'}
            </Text>
            <Text style={[styles.resultCount, { color: colors.muted }]}>
              {dramas.length} dramas {page > 1 ? `· Page ${page}` : ''}
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            disabled={loading || refreshing}
            style={({ pressed }) => [
              styles.refreshButton,
              { backgroundColor: isDark ? '#2A2438' : colors.pinkLight },
              pressed && styles.refreshButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Refresh recommended dramas"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.pink} />
            ) : (
              <Ionicons name="refresh" size={14} color={colors.pink} />
            )}
            <Text style={[styles.refreshButtonText, { color: colors.pink }]}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </Pressable>
        </View>

        {/* Drama Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.pink} />
          </View>
        ) : dramas.length === 0 ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.card, borderColor: colors.border, borderWidth: isDark ? 0 : 1 },
              ]}
            >
              <Ionicons name="search-outline" size={26} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No dramas found</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Try another search or genre.</Text>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              {dramas.map((drama, index) => (
                <View key={String(drama.tmdb_id || drama.id || index)} style={styles.gridItem}>
                  <DramaCard
                    drama={drama}
                    onPress={() =>
                      navigation.navigate('DramaDetail', {
                        tmdbId: drama.tmdb_id || drama.id,
                      })
                    }
                  />
                </View>
              ))}
            </View>

            {/* Load More Button */}
            {hasMore && !loading && (
              <Pressable
                onPress={handleLoadMore}
                disabled={loadingMore}
                style={({ pressed }) => [
                  styles.loadMoreButton,
                  { backgroundColor: isDark ? '#201C2E' : colors.card },
                  pressed && styles.loadMoreButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Load more dramas"
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.pink} />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={16} color={colors.pink} />
                    <Text style={[styles.loadMoreText, { color: colors.text }]}>
                      Load More Dramas
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </>
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
  content: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 105,
  },
  /* HEADER */
  topHeader: {
    width: '100%',
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
  },
  brandArea: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  brand: {
    color: '#ed8ea4',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
  },
  brandTv: {
    color: '#eb5b78',
  },
  pageTitle: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
  },
  searchButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  searchButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  /* SEARCH */
  searchBox: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161424',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  clearButton: {
    width: 25,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  clearButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  /* HERO */
  hero: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    position: 'relative',
    marginBottom: 12,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.panel2,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  heroContent: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  heroEyebrow: {
    color: colors.redBright,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    marginBottom: 10,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.redBright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  detailsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  ratingText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 4,
  },
  heroArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  heroArrowPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  heroArrowLeft: {
    left: 10,
  },
  heroArrowRight: {
    right: 10,
  },
  heroDots: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDotButton: {
    minWidth: 10,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroDotActive: {
    width: 14,
    backgroundColor: colors.redBright,
  },
  /* FILTERS */
  filters: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingRight: 10,
    marginBottom: 6,
  },
  filter: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: colors.shadowColor || '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: colors.shadowOpacity ?? 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterActive: {
    backgroundColor: '#2A2438',
  },
  filterPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.97 }],
  },
  filterText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    paddingTop: 1,
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
  /* RESULTS */
  resultHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  resultCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  /* GRID */
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    rowGap: 16,
  },
  gridItem: {
    width: '48.5%',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    alignSelf: 'flex-start',
    borderRadius: 14,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  empty: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 65,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 14,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 6,
  },
  resultTitleCol: {
    flex: 1,
    paddingRight: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  refreshButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  loadMoreButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    marginBottom: 10,
  },
  loadMoreButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
