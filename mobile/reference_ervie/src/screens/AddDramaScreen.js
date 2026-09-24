import React, { useMemo, useState } from 'react';

import {
  Alert,
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


/*
|--------------------------------------------------------------------------
| Add Drama Screen
|--------------------------------------------------------------------------
|
| Flow:
|
| Tracker
|   ↓
| Add Drama
|   ↓
| Search drama
|   ↓
| Press +
|   ↓
| onAddDrama(drama)
|   ↓
| App.js adds it to tracker
|
*/


export default function AddDramaScreen({
  addedDramas = [],
  onAddDrama,
  onBack,
}) {

  const [search, setSearch] = useState('');

  const [addingId, setAddingId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Search / Drama List
  |--------------------------------------------------------------------------
  */

  const dramaList = useMemo(() => {

    if (!Array.isArray(dramas)) {
      return [];
    }

    const cleanSearch =
      search
        .trim()
        .toLowerCase();

    if (!cleanSearch) {
      return dramas;
    }

    return dramas.filter((drama) => {

      const title =
        String(
          drama?.title || ''
        ).toLowerCase();

      const koreanTitle =
        String(
          drama?.korean_title ||
          drama?.koreanTitle ||
          ''
        ).toLowerCase();

      const genre =
        String(
          drama?.genre || ''
        ).toLowerCase();

      const year =
        String(
          drama?.year || ''
        ).toLowerCase();

      return (
        title.includes(cleanSearch) ||
        koreanTitle.includes(cleanSearch) ||
        genre.includes(cleanSearch) ||
        year.includes(cleanSearch)
      );

    });

  }, [search]);


  /*
  |--------------------------------------------------------------------------
  | Check if drama is already added
  |--------------------------------------------------------------------------
  */

  const isDramaAdded = (drama) => {

    if (!Array.isArray(addedDramas)) {
      return false;
    }

    const dramaId =
      drama?.id;

    const dramaTitle =
      String(
        drama?.title || ''
      )
        .trim()
        .toLowerCase();

    return addedDramas.some((item) => {

      if (!item) {
        return false;
      }

      if (
        dramaId &&
        item.id === dramaId
      ) {
        return true;
      }

      const existingTitle =
        String(
          item.title || ''
        )
          .trim()
          .toLowerCase();

      return (
        dramaTitle &&
        existingTitle === dramaTitle
      );

    });

  };


  /*
  |--------------------------------------------------------------------------
  | Get poster
  |--------------------------------------------------------------------------
  */

  const getPoster = (drama) => {

    return (
      drama?.image ||
      drama?.imageUrl ||
      drama?.poster ||
      drama?.posterUrl ||
      drama?.thumbnail ||
      ''
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Get genre
  |--------------------------------------------------------------------------
  */

  const getGenreText = (drama) => {

    if (Array.isArray(drama?.genre)) {
      return drama.genre.join(' · ');
    }

    return String(
      drama?.genre || 'Drama'
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Get rating
  |--------------------------------------------------------------------------
  */

  const getRating = (drama) => {

    const value =
      Number(
        drama?.rating ??
        drama?.score ??
        0
      );

    if (!Number.isFinite(value)) {
      return '0.0';
    }

    return value.toFixed(1);

  };


  /*
  |--------------------------------------------------------------------------
  | ADD DRAMA
  |--------------------------------------------------------------------------
  */

  const handleAdd = async (drama) => {

    if (!drama) {
      return;
    }

    if (addingId !== null) {
      return;
    }

    if (isDramaAdded(drama)) {

      Alert.alert(
        'Already added',
        `"${drama.title}" is already in your tracker.`
      );

      return;
    }

    if (
      typeof onAddDrama !== 'function'
    ) {

      Alert.alert(
        'Unable to add drama',
        'The Add Drama function is not connected to the app.'
      );

      console.error(
        'AddDramaScreen: onAddDrama is not a function'
      );

      return;
    }

    try {

      setAddingId(
        drama.id
      );

      console.log(
        'ADD DRAMA PRESSED:',
        drama
      );

      const result =
        await Promise.resolve(
          onAddDrama(drama)
        );

      console.log(
        'ADD DRAMA RESULT:',
        result
      );

    } catch (error) {

      console.error(
        'ADD DRAMA ERROR:',
        error
      );

      Alert.alert(
        'Unable to add drama',
        'Something went wrong while adding this drama.'
      );

    } finally {

      setAddingId(null);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | BACK / CANCEL
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {

    if (addingId !== null) {
      return;
    }

    if (
      typeof onBack === 'function'
    ) {
      onBack();
    }

  };


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View style={styles.screen}>

      {/* HEADER */}

      <View style={styles.header}>

        <View style={styles.headerLeft}>

          <Text style={styles.title}>
            Add Drama
          </Text>

        </View>


        <Pressable
          onPress={handleBack}
          disabled={addingId !== null}
          hitSlop={10}
          style={({ pressed, hovered }) => [
            styles.cancelButton,

            hovered &&
              styles.cancelHovered,

            pressed &&
              styles.cancelPressed,

            addingId !== null &&
              styles.cancelDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >

          <Text style={styles.cancelText}>
            Cancel
          </Text>

        </Pressable>

      </View>


      {/* SEARCH */}

      <View style={styles.searchWrapper}>

        <Ionicons
          name="search-outline"
          size={15}
          color={colors.muted}
          style={styles.searchIcon}
        />


        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search dramas to add..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          returnKeyType="search"
        />


        {search.length > 0 && (

          <Pressable
            onPress={() => setSearch('')}
            hitSlop={8}
            style={({ pressed, hovered }) => [
              styles.clearButton,

              hovered &&
                styles.clearButtonHovered,

              pressed &&
                styles.clearButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >

            <Ionicons
              name="close-circle"
              size={15}
              color={colors.muted}
            />

          </Pressable>

        )}

      </View>


      {/* DRAMA LIST */}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {dramaList.length === 0 && (

          <View style={styles.empty}>

            <Ionicons
              name="search-outline"
              size={30}
              color={colors.muted}
            />

            <Text style={styles.emptyTitle}>
              No dramas found
            </Text>

            <Text style={styles.emptyText}>
              Try searching for another drama.
            </Text>

          </View>

        )}


        {dramaList.map((drama, index) => {

          const alreadyAdded =
            isDramaAdded(drama);

          const isAdding =
            addingId === drama.id;

          const poster =
            getPoster(drama);

          const genreText =
            getGenreText(drama);

          const year =
            drama?.year ||
            drama?.releaseYear ||
            '2025';

          const rating =
            getRating(drama);


          return (

            /*
             * IMPORTANT:
             *
             * hovered is declared directly here:
             *
             * style={({ pressed, hovered }) => ...}
             *
             * This prevents "hovered is not defined".
             */

            <Pressable
              key={
                drama?.id ||
                `drama-${index}`
              }
              disabled={addingId !== null}
              style={({ pressed, hovered }) => [
                styles.dramaRow,

                hovered &&
                  styles.dramaRowHovered,

                pressed &&
                  styles.dramaRowPressed,

                alreadyAdded &&
                  styles.dramaRowAdded,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                alreadyAdded
                  ? `${drama?.title} already added`
                  : `Drama ${drama?.title}`
              }
            >

              {/* POSTER */}

              <View style={styles.posterWrapper}>

                {poster ? (

                  <Image
                    source={{
                      uri: poster,
                    }}
                    style={styles.poster}
                    resizeMode="cover"
                  />

                ) : (

                  <View
                    style={styles.posterPlaceholder}
                  >

                    <Ionicons
                      name="film-outline"
                      size={18}
                      color={colors.muted}
                    />

                  </View>

                )}

              </View>


              {/* INFO */}

              <View style={styles.dramaInfo}>

                <Text
                  style={styles.dramaTitle}
                  numberOfLines={1}
                >
                  {drama?.title ||
                    'Untitled Drama'}
                </Text>


                <Text
                  style={styles.meta}
                  numberOfLines={1}
                >
                  {genreText}
                  {' · '}
                  {year}
                </Text>


                <View style={styles.ratingRow}>

                  <Ionicons
                    name="star"
                    size={10}
                    color="#FF9EB0"
                  />

                  <Text style={styles.rating}>
                    {rating}
                  </Text>

                </View>

              </View>


              {/* ADD BUTTON */}

              <Pressable
                onPress={() =>
                  handleAdd(drama)
                }
                disabled={
                  alreadyAdded ||
                  addingId !== null
                }
                hitSlop={8}
                style={({ pressed, hovered }) => [

                  styles.addButton,

                  hovered &&
                    !alreadyAdded &&
                    !isAdding &&
                    styles.addHovered,

                  alreadyAdded &&
                    styles.addedButton,

                  isAdding &&
                    styles.addingButton,

                  pressed &&
                    !alreadyAdded &&
                    !isAdding &&
                    styles.addPressed,

                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  alreadyAdded
                    ? `${drama?.title} already added`
                    : `Add ${drama?.title}`
                }
              >

                <Ionicons
                  name={
                    isAdding
                      ? 'hourglass-outline'
                      : alreadyAdded
                        ? 'checkmark'
                        : 'add'
                  }
                  size={18}
                  color={
                    alreadyAdded
                      ? colors.muted
                      : colors.text
                  }
                />

              </Pressable>

            </Pressable>

          );

        })}


        <View style={styles.bottomSpace} />

      </ScrollView>

    </View>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },


  /* HEADER */

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  headerLeft: {
    flex: 1,
  },

  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },

  cancelButton: {
    minWidth: 45,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 5,
  },

  cancelHovered: {
    opacity: 0.75,
  },

  cancelPressed: {
    opacity: 0.55,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  cancelDisabled: {
    opacity: 0.4,
  },

  cancelText: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '600',
  },


  /* SEARCH */

  searchWrapper: {
    height: 34,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 9,
    borderRadius: 8,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchIcon: {
    marginLeft: 10,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: 9,
    paddingHorizontal: 7,
    paddingVertical: 0,
  },

  clearButton: {
    marginRight: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  clearButtonHovered: {
    opacity: 0.7,
  },

  clearButtonPressed: {
    opacity: 0.45,
    transform: [
      {
        scale: 0.9,
      },
    ],
  },


  /* LIST */

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 20,
  },


  /* DRAMA ROW */

  dramaRow: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#171620',
    backgroundColor: 'transparent',
  },

  dramaRowHovered: {
    backgroundColor: colors.panel2,
  },

  dramaRowPressed: {
    opacity: 0.82,
  },

  dramaRowAdded: {
    opacity: 0.78,
  },


  /* POSTER */

  posterWrapper: {
    width: 30,
    height: 43,
    marginRight: 8,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.panel,
  },

  poster: {
    width: '100%',
    height: '100%',
  },

  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101019',
  },


  /* INFO */

  dramaInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 8,
  },

  dramaTitle: {
    color: colors.text,
    fontSize: 9.5,
    fontWeight: '900',
    lineHeight: 12,
  },

  meta: {
    color: colors.muted,
    fontSize: 7,
    marginTop: 2,
    lineHeight: 9,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  rating: {
    color: '#FF9EB0',
    fontSize: 7,
    fontWeight: '800',
    marginLeft: 3,
  },


  /* ADD BUTTON */

  addButton: {
    width: 30,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    borderRadius: 8,
  },

  addHovered: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [
      {
        scale: 1.04,
      },
    ],
  },

  addPressed: {
    opacity: 0.45,
    transform: [
      {
        scale: 0.88,
      },
    ],
  },

  addingButton: {
    opacity: 0.55,
  },

  addedButton: {
    opacity: 0.45,
  },


  /* EMPTY */

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 70,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 8.5,
    textAlign: 'center',
    marginTop: 4,
  },


  /* BOTTOM */

  bottomSpace: {
    height: 60,
  },

});