import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { discoverService, trackerService } from '../../services/api';

export default function AddDramaScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  // Load existing tracker list to know what is added
  useEffect(() => {
    trackerService
      .getWatchlist()
      .then((res) => {
        const ids = new Set((res.data.data || []).map((i) => i.tmdb_id));
        setAddedIds(ids);
      })
      .catch((e) => console.warn('Could not fetch watchlist:', e));
  }, []);

  // Fetch / Search Dramas
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      const fetchPromise = search.trim()
        ? discoverService.search({ query: search.trim() })
        : discoverService.discover({});

      fetchPromise
        .then((res) => {
          if (!isCancelled) {
            setDramas(res.data.data || []);
          }
        })
        .catch((e) => console.warn('Could not fetch dramas:', e))
        .finally(() => {
          if (!isCancelled) setLoading(false);
        });
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const handleAdd = async (drama) => {
    const tmdbId = drama.tmdb_id || drama.id;
    if (!tmdbId || addingId !== null || addedIds.has(tmdbId)) return;

    setAddingId(tmdbId);
    try {
      await trackerService.addDrama({
        tmdb_id: tmdbId,
        status: 'plan_to_watch',
        current_episode: 0,
        rating: 0,
      });
      setAddedIds((prev) => new Set([...prev, tmdbId]));
      Alert.alert('Success', `"${drama.title || drama.name}" added to your watchlist!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not add drama.';
      Alert.alert('Notice', msg);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Add Drama</Text>
        </View>

        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
        >
          <Text style={styles.cancelText}>Done</Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={16} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search dramas to add..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.redBright} />
          </View>
        ) : dramas.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={30} color={colors.muted} />
            <Text style={styles.emptyTitle}>No dramas found</Text>
            <Text style={styles.emptyText}>Try searching for another title.</Text>
          </View>
        ) : (
          dramas.map((drama) => {
            const tmdbId = drama.tmdb_id || drama.id;
            const alreadyAdded = addedIds.has(tmdbId);
            const isAdding = addingId === tmdbId;
            const poster = drama.poster_url || drama.poster || drama.image || null;
            const rating = Number(drama.rating || 0).toFixed(1);

            return (
              <View key={String(tmdbId)} style={styles.dramaRow}>
                {/* Poster */}
                <View style={styles.posterWrapper}>
                  {poster ? (
                    <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
                  ) : (
                    <View style={styles.posterPlaceholder}>
                      <Ionicons name="film-outline" size={18} color={colors.muted} />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.dramaInfo}>
                  <Text style={styles.dramaTitle} numberOfLines={1}>
                    {drama.title || drama.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {Array.isArray(drama.genres) ? drama.genres.join(' · ') : drama.genre || 'Drama'}
                    {' · '}
                    {drama.release_year || '2024'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={10} color="#FF9EB0" />
                    <Text style={styles.rating}>{rating}</Text>
                  </View>
                </View>

                {/* Add Button */}
                <Pressable
                  onPress={() => handleAdd(drama)}
                  disabled={alreadyAdded || isAdding}
                  style={[
                    styles.addButton,
                    alreadyAdded && styles.addedButton,
                    isAdding && styles.addingButton,
                  ]}
                >
                  <Ionicons
                    name={isAdding ? 'hourglass-outline' : alreadyAdded ? 'checkmark' : 'add'}
                    size={15}
                    color={alreadyAdded ? '#10B981' : colors.white}
                  />
                  <Text style={[styles.addButtonText, alreadyAdded && styles.addedButtonText]}>
                    {alreadyAdded ? 'Added' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            );
          })
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.nav,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cancelPressed: {
    opacity: 0.6,
  },
  cancelText: {
    color: colors.redBright,
    fontSize: 13,
    fontWeight: '800',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  dramaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
    gap: 12,
  },
  posterWrapper: {
    width: 44,
    height: 60,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dramaInfo: {
    flex: 1,
    minWidth: 0,
  },
  dramaTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  meta: {
    color: colors.muted,
    fontSize: 8.5,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    color: '#FF9EB0',
    fontSize: 8.5,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.redBright,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addedButton: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  addingButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  addedButtonText: {
    color: '#10B981',
  },
});
