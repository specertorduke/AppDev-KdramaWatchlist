import React, { useMemo, useState } from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { dramas } from '../data/dramas';

import DramaCard from '../components/DramaCard';


const genres = [
  'All',
  'Romance',
  'Thriller',
  'Historical',
  'Fantasy',
  'Mystery',
  'Comedy',
  'Action',
];


export default function DiscoverScreen({
  onOpenDrama,
}) {

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');
  const [showSearch, setShowSearch] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);


  const featuredDramas = dramas.slice(
    0,
    Math.min(5, dramas.length)
  );


  const featuredDrama =
    featuredDramas.length > 0
      ? featuredDramas[
          featuredIndex % featuredDramas.length
        ]
      : null;


  const getDramaImage = (drama) => {

    if (!drama) {
      return null;
    }

    return (
      drama.backdrop ||
      drama.backdropUrl ||
      drama.image ||
      drama.imageUrl ||
      drama.poster ||
      drama.posterUrl ||
      drama.thumbnail ||
      drama.cover ||
      null
    );
  };


  const previousFeatured = () => {

    if (featuredDramas.length === 0) {
      return;
    }

    setFeaturedIndex((current) =>
      current === 0
        ? featuredDramas.length - 1
        : current - 1
    );

  };


  const nextFeatured = () => {

    if (featuredDramas.length === 0) {
      return;
    }

    setFeaturedIndex(
      (current) =>
        (current + 1) % featuredDramas.length
    );

  };


  const filteredDramas = useMemo(() => {

    const search =
      query.trim().toLowerCase();

    return dramas.filter((drama) => {

      const title = String(
        drama?.title || ''
      ).toLowerCase();

      const dramaGenre = String(
        drama?.genre || ''
      ).toLowerCase();

      const koreanTitle = String(
        drama?.korean_title || ''
      ).toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        dramaGenre.includes(search) ||
        koreanTitle.includes(search);

      const matchesGenre =
        genre === 'All' ||
        dramaGenre.includes(
          genre.toLowerCase()
        );

      return matchesSearch && matchesGenre;

    });

  }, [query, genre]);


  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* HEADER */}

      <View style={styles.topHeader}>

        <View style={styles.brandArea}>

          <Text style={styles.brand}>
            SarangTV
          </Text>

          <Text style={styles.pageTitle}>
            Discover
          </Text>

        </View>


        <Pressable
          onPress={() =>
            setShowSearch(
              (current) => !current
            )
          }
          style={({ pressed }) => [
            styles.searchButton,
            pressed &&
              styles.searchButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search dramas"
        >
          <Ionicons
            name={
              showSearch
                ? 'close-outline'
                : 'search-outline'
            }
            size={22}
            color={colors.text}
          />
        </Pressable>

      </View>


      {/* SEARCH */}

      {showSearch && (

        <View style={styles.searchBox}>

          <Ionicons
            name="search-outline"
            size={17}
            color={colors.muted}
          />

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
              onPress={() =>
                setQuery('')
              }
              style={({ pressed }) => [
                styles.clearButton,
                pressed &&
                  styles.clearButtonPressed,
              ]}
            >
              <Ionicons
                name="close-circle"
                size={17}
                color={colors.muted}
              />
            </Pressable>

          )}

        </View>

      )}


      {/* FEATURED HERO */}

      {featuredDrama && (

        <View style={styles.hero}>

          {getDramaImage(featuredDrama) ? (

            <Image
              source={
                typeof getDramaImage(
                  featuredDrama
                ) === 'number'
                  ? getDramaImage(
                      featuredDrama
                    )
                  : {
                      uri: getDramaImage(
                        featuredDrama
                      ),
                    }
              }
              style={styles.heroImage}
              resizeMode="cover"
            />

          ) : (

            <View style={styles.heroFallback} />

          )}


          <View style={styles.heroOverlay} />


          {/* LEFT ARROW */}

          <Pressable
            onPress={previousFeatured}
            style={({ pressed }) => [
              styles.heroArrow,
              styles.heroArrowLeft,
              pressed &&
                styles.heroArrowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Previous featured drama"
          >
            <Ionicons
              name="chevron-back"
              size={15}
              color={colors.text}
            />
          </Pressable>


          {/* RIGHT ARROW */}

          <Pressable
            onPress={nextFeatured}
            style={({ pressed }) => [
              styles.heroArrow,
              styles.heroArrowRight,
              pressed &&
                styles.heroArrowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Next featured drama"
          >
            <Ionicons
              name="chevron-forward"
              size={15}
              color={colors.text}
            />
          </Pressable>


          {/* HERO CONTENT */}

          <View style={styles.heroContent}>

            <Text style={styles.heroEyebrow}>
              #1 THIS WEEK
            </Text>

            <Text
              style={styles.heroTitle}
              numberOfLines={1}
            >
              {featuredDrama.title}
            </Text>


            <View style={styles.heroBottomRow}>

              <Pressable
                onPress={() =>
                  onOpenDrama?.(
                    featuredDrama
                  )
                }
                style={({ pressed }) => [
                  styles.detailsButton,
                  pressed &&
                    styles.detailsButtonPressed,
                ]}
              >
                <Ionicons
                  name="play"
                  size={9}
                  color={colors.text}
                />

                <Text style={styles.detailsText}>
                  View Details
                </Text>
              </Pressable>


              <View style={styles.rating}>

                <Ionicons
                  name="star"
                  size={11}
                  color={colors.gold}
                />

                <Text style={styles.ratingText}>
                  {featuredDrama.rating ||
                    featuredDrama.score ||
                    '9.4'}
                </Text>

              </View>

            </View>

          </View>


          {/* HERO DOTS */}

          <View style={styles.heroDots}>

            {featuredDramas.map(
              (drama, index) => (

                <Pressable
                  key={
                    drama?.id ||
                    index
                  }
                  onPress={() =>
                    setFeaturedIndex(index)
                  }
                  style={styles.heroDotButton}
                  accessibilityRole="button"
                  accessibilityLabel={
                    `Show featured drama ${index + 1}`
                  }
                >

                  <View
                    style={[
                      styles.heroDot,
                      index ===
                        featuredIndex &&
                        styles.heroDotActive,
                    ]}
                  />

                </Pressable>

              )
            )}

          </View>

        </View>

      )}


      {/* GENRE FILTERS */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        keyboardShouldPersistTaps="handled"
      >

        {genres.map((item) => {

          const isActive =
            genre === item;

          return (

            <Pressable
              key={item}
              onPress={() =>
                setGenre(item)
              }
              style={({ pressed }) => [
                styles.filter,
                isActive &&
                  styles.filterActive,
                pressed &&
                  styles.filterPressed,
              ]}
            >

              <Text
                style={[
                  styles.filterText,
                  isActive &&
                    styles.filterTextActive,
                ]}
              >
                {item}
              </Text>

            </Pressable>

          );

        })}

      </ScrollView>


      {/* RESULT HEADER */}

      <View style={styles.resultHeader}>

        <Text style={styles.resultTitle}>
          {genre === 'All'
            ? 'All Dramas'
            : genre}
        </Text>

        <Text style={styles.resultCount}>
          {filteredDramas.length} results
        </Text>

      </View>


      {/* DRAMA GRID */}

      {filteredDramas.length === 0 ? (

        <View style={styles.empty}>

          <View style={styles.emptyIcon}>

            <Ionicons
              name="search-outline"
              size={26}
              color={colors.muted}
            />

          </View>

          <Text style={styles.emptyTitle}>
            No dramas found
          </Text>

          <Text style={styles.emptyText}>
            Try another search or genre.
          </Text>

        </View>

      ) : (

        <View style={styles.grid}>

          {filteredDramas.map(
            (drama, index) => (

              <Pressable
                key={
                  drama?.id ??
                  `drama-${index}`
                }
                style={({ pressed }) => [
                  styles.gridItem,
                  pressed &&
                    styles.gridItemPressed,
                ]}
                onPress={() =>
                  onOpenDrama?.(drama)
                }
              >

                <DramaCard
                  drama={drama}
                  onPress={() =>
                    onOpenDrama?.(drama)
                  }
                />

              </Pressable>

            )
          )}

        </View>

      )}

    </ScrollView>
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
  },

  brandArea: {
    justifyContent: 'center',
  },

  brand: {
    color: '#E8A9B9',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
    marginBottom: 2,
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
    transform: [
      {
        scale: 0.94,
      },
    ],
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
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  /* HERO */

  hero: {
    width: '100%',
    height: 174,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    position: 'relative',
    marginBottom: 9,
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
    left: 13,
    right: 13,
    bottom: 12,
  },

  heroEyebrow: {
    color: colors.redBright,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  heroTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
    marginBottom: 8,
  },

  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detailsButton: {
    height: 27,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.redBright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  detailsText: {
    color: colors.text,
    fontSize: 8.5,
    fontWeight: '900',
    marginLeft: 5,
  },

  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  ratingText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
  },

  heroArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  heroArrowPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  heroArrowLeft: {
    left: 8,
  },

  heroArrowRight: {
    right: 8,
  },

  heroDots: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroDotButton: {
    minWidth: 9,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  heroDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      'rgba(255,255,255,0.35)',
  },

  heroDotActive: {
    width: 12,
    backgroundColor: colors.redBright,
  },

  /* FILTERS */

  filters: {
    paddingVertical: 6,
    paddingRight: 10,
  },

  filter: {
    minHeight: 29,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  filterActive: {
    backgroundColor:
      'rgba(200,16,46,0.18)',
    borderColor: colors.red,
  },

  filterPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  filterText: {
    color: colors.muted,
    fontSize: 8.5,
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
    marginTop: 4,
    marginBottom: 8,
  },

  resultTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  resultCount: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '500',
  },

  /* GRID */

  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    rowGap: 14,
  },

  gridItem: {
    width: '48.8%',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    alignSelf: 'flex-start',
    borderRadius: 12,
  },

  gridItemPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /* EMPTY */

  empty: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 65,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 4,
  },

});