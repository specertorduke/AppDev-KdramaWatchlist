import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import DramaCard from '../../components/DramaCard';
import { discoverService } from '../../services/api';

export default function DiscoverScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [genres, setGenres] = useState([]);
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Fetch Genres
  useEffect(() => {
    discoverService
      .getGenres()
      .then((res) => {
        setGenres([{ id: null, name: 'All' }, ...(res.data.data || [])]);
      })
      .catch((e) => {
        console.warn('Failed to load genres:', e);
        setGenres([
          { id: null, name: 'All' },
          { id: 18, name: 'Drama' },
          { id: 35, name: 'Comedy' },
          { id: 10759, name: 'Action' },
          { id: 9648, name: 'Mystery' },
          { id: 10765, name: 'Sci-Fi & Fantasy' },
        ]);
      });
  }, []);

  // Fetch / Search Dramas
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      const params = {};
      if (selectedGenreId) params.genre_id = selectedGenreId;
      if (query.trim()) params.search = query.trim();

      const fetchPromise = query.trim()
        ? discoverService.search({ query: query.trim() })
        : discoverService.discover(params);

      fetchPromise
        .then((res) => {
          if (!isCancelled) {
            setDramas(res.data.data || []);
          }
        })
        .catch((e) => {
          console.warn('Failed to fetch discover list:', e);
        })
        .finally(() => {
          if (!isCancelled) setLoading(false);
        });
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, selectedGenreId]);

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
    <View style={styles.screen}>
      {/* Header */}
      <View
        style={[
          styles.topHeader,
          {
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
            <Text style={styles.brand}>SarangTV</Text>
          </View>
          <Text style={styles.pageTitle}>Discover</Text>
        </View>

        <Pressable
          onPress={() => setShowSearch((current) => !current)}
          style={({ pressed }) => [styles.searchButton, pressed && styles.searchButtonPressed]}
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
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Box */}
        {showSearch && (
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search dramas..."
              placeholderTextColor={colors.muted}
              style={styles.input}
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
              <Ionicons name="chevron-back" size={15} color={colors.text} />
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
              <Ionicons name="chevron-forward" size={15} color={colors.text} />
            </Pressable>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>#1 THIS WEEK</Text>
              <Text style={styles.heroTitle} numberOfLines={1}>
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
                    pressed && styles.detailsButtonPressed,
                  ]}
                >
                  <Ionicons name="play" size={10} color={colors.text} />
                  <Text style={styles.detailsText}>View Details</Text>
                </Pressable>

                <View style={styles.rating}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={styles.ratingText}>
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
                    style={[styles.heroDot, index === featuredIndex && styles.heroDotActive]}
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
                  isActive && styles.filterActive,
                  pressed && styles.filterPressed,
                ]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Result Header */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {selectedGenreId
              ? genres.find((g) => g.id === selectedGenreId)?.name || 'Dramas'
              : 'All Dramas'}
          </Text>
          <Text style={styles.resultCount}>{dramas.length} results</Text>
        </View>

        {/* Drama Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.redBright} />
          </View>
        ) : dramas.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={26} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>No dramas found</Text>
            <Text style={styles.emptyText}>Try another search or genre.</Text>
          </View>
        ) : (
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
    color: '#F5A9C4',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
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
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 9,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 10,
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
    color: '#07070E',
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
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
    paddingVertical: 8,
    paddingRight: 10,
    marginBottom: 6,
  },
  filter: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  filterActive: {
    backgroundColor: 'rgba(245,169,196,0.18)',
    borderColor: colors.redBright,
  },
  filterPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.97 }],
  },
  filterText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
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
});
