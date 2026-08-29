import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import DramaCard from '../../components/DramaCard';
import { discoverService } from '../../services/api';

export default function DiscoverScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [genres, setGenres] = useState([]);
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search K-Dramas, actors, genres..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {/* Genre Pill Horizontal List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreScroll}
          contentContainerStyle={styles.genreList}
        >
          {genres.map((g) => {
            const isSelected = selectedGenreId === g.id;
            return (
              <Pressable
                key={String(g.id || 'all')}
                style={[styles.genrePill, isSelected && styles.genrePillActive]}
                onPress={() => setSelectedGenreId(g.id)}
              >
                <Text style={[styles.genreText, isSelected && styles.genreTextActive]}>
                  {g.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Drama Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.red} />
          </View>
        ) : dramas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>No K-Dramas found</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {dramas.map((drama) => (
              <View key={drama.tmdb_id || drama.id} style={styles.gridCol}>
                <DramaCard
                  drama={drama}
                  onPress={(d) =>
                    navigation.navigate('DramaDetail', { tmdbId: d.tmdb_id || d.id })
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  genreScroll: {
    marginBottom: 20,
  },
  genreList: {
    gap: 8,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  genrePillActive: {
    backgroundColor: colors.redBright,
    borderColor: colors.redBright,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  genreTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridCol: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
});
