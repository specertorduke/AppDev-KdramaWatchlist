import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';


/*
|--------------------------------------------------------------------------
| DEFAULT TRACKER DATA
|--------------------------------------------------------------------------
*/

const DEFAULT_TRACKER = {
  status: 'Plan to Watch',
  watchedEpisodes: 0,
  rating: 0,
  notes: '',
};


/*
|--------------------------------------------------------------------------
| DRAMA DETAIL SCREEN
|--------------------------------------------------------------------------
*/

export default function DramaDetailScreen({
  drama,
  onBack,

  isFavorite = false,
  onToggleFavorite,

  trackerData = DEFAULT_TRACKER,

  onUpdateTracker,

  onAddDrama,
  onRemoveDrama,
  isAdded = false,
}) {

  const { width } =
    useWindowDimensions();


  /*
  |--------------------------------------------------------------------------
  | LOCAL EDITING STATE
  |--------------------------------------------------------------------------
  |
  | These values are what the user is currently editing.
  |
  */

  const [selectedStatus, setSelectedStatus] =
    useState(
      trackerData?.status ||
      DEFAULT_TRACKER.status
    );


  const [notes, setNotes] =
    useState(
      trackerData?.notes || ''
    );


  const [selectedRating, setSelectedRating] =
    useState(
      Number(
        trackerData?.rating
      ) || 0
    );


  const [savingStatus, setSavingStatus] =
    useState(false);


  const [savingNotes, setSavingNotes] =
    useState(false);


  const [saveMessage, setSaveMessage] =
    useState('');


  /*
  |--------------------------------------------------------------------------
  | SYNC LOCAL STATE WHEN PARENT DATA CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    setSelectedStatus(
      trackerData?.status ||
      DEFAULT_TRACKER.status
    );

    setNotes(
      trackerData?.notes || ''
    );

    setSelectedRating(
      Number(
        trackerData?.rating
      ) || 0
    );

  }, [
    trackerData?.status,
    trackerData?.notes,
    trackerData?.rating,
  ]);


  /*
  |--------------------------------------------------------------------------
  | SAFETY
  |--------------------------------------------------------------------------
  */

  if (!drama) {

    return (
      <View style={styles.emptyScreen}>

        <Pressable
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >

          <Ionicons
            name="arrow-back"
            size={19}
            color={colors.text}
          />

          <Text style={styles.backText}>
            Back
          </Text>

        </Pressable>


        <Text style={styles.emptyTitle}>
          Drama not found
        </Text>

      </View>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DRAMA DATA
  |--------------------------------------------------------------------------
  */

  const image =
    drama.image ||
    drama.imageUrl ||
    drama.poster ||
    drama.posterUrl ||
    drama.thumbnail ||
    null;


  const title =
    drama.title ||
    'Untitled Drama';


  const koreanTitle =
    drama.korean_title ||
    drama.koreanTitle ||
    drama.native_title ||
    drama.nativeTitle ||
    '';


  const rating =
    Number(drama.rating) ||
    Number(drama.score) ||
    0;


  const year =
    drama.year ||
    drama.aired ||
    drama.releaseYear ||
    '2025';


  const episodes =
    Number(drama.episodes) ||
    0;


  const genre =
    drama.genre ||
    drama.genres ||
    'Drama';


  const director =
    drama.director ||
    'Park Ji-young';


  const duration =
    drama.duration ||
    drama.runtime ||
    '62 min / ep';


  const network =
    drama.network ||
    drama.platform ||
    'tvN · Netflix';


  const synopsis =
    drama.synopsis ||
    drama.description ||
    'A cold detective and a runaway heiress are bound together by a decade-old secret buried beneath the city’s glittering surface. Love was never part of the plan.';


  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  const watchedEpisodes =
    Math.min(
      episodes || 1,
      Math.max(
        0,
        Number(
          trackerData?.watchedEpisodes
        ) || 0
      )
    );


  const progress =
    episodes > 0
      ? Math.min(
          100,
          Math.round(
            (
              watchedEpisodes /
              episodes
            ) * 100
          )
        )
      : 0;


  const remainingEpisodes =
    Math.max(
      0,
      episodes - watchedEpisodes
    );


  /*
  |--------------------------------------------------------------------------
  | STATUS OPTIONS
  |--------------------------------------------------------------------------
  */

  const statuses = [
    'Watching',
    'Completed',
    'Plan to Watch',
    'On Hold',
    'Dropped',
  ];


  /*
  |--------------------------------------------------------------------------
  | EPISODES
  |--------------------------------------------------------------------------
  */

  const episodeTitles = useMemo(
    () => [
      'Neon and Rain',
      'The Fixer',
      'Architecture of Power',
      'The Missing Tower',
      'Protocol Zero',
      'Underworld',
      'Specter’s Game',
      'False Identity',
      'The Hidden Room',
      'Midnight Signal',
      'Broken Promise',
      'The Last Clue',
      'Dark Passenger',
      'Crossing Lines',
      'The Final Secret',
      'Midnight in Seoul',
    ],
    []
  );


  const episodeList =
    episodes > 0
      ? Array.from(
          {
            length: episodes,
          },
          (_, index) => ({
            number:
              index + 1,

            title:
              episodeTitles[index] ||
              `Episode ${index + 1}`,
          })
        )
      : [];


  /*
  |--------------------------------------------------------------------------
  | SAVE STATUS
  |--------------------------------------------------------------------------
  |
  | THIS IS THE IMPORTANT FIX.
  |
  | Instead of sending the current status back to App,
  | we send the locally selected status.
  |
  */

  const saveStatus = () => {

    if (
      typeof onUpdateTracker !==
      'function'
    ) {
      console.error(
        'DramaDetailScreen: onUpdateTracker is missing.'
      );

      return;
    }


    setSavingStatus(true);
    setSaveMessage('');


    try {

      onUpdateTracker({
        status: selectedStatus,
      });


      setSaveMessage(
        'Status saved'
      );

    } catch (error) {

      console.error(
        'Failed to save status:',
        error
      );

      setSaveMessage(
        'Could not save status'
      );

    } finally {

      setTimeout(() => {
        setSavingStatus(false);
      }, 250);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | SELECT STATUS
  |--------------------------------------------------------------------------
  */

  const selectStatus = (status) => {

    setSelectedStatus(status);

    setSaveMessage('');

  };


  /*
  |--------------------------------------------------------------------------
  | SAVE RATING
  |--------------------------------------------------------------------------
  */

  const changeRating = (value) => {

    setSelectedRating(value);

    setSaveMessage('');

  };


  /*
  |--------------------------------------------------------------------------
  | SAVE NOTES
  |--------------------------------------------------------------------------
  */

  const saveNotes = () => {

    if (
      typeof onUpdateTracker !==
      'function'
    ) {
      console.error(
        'DramaDetailScreen: onUpdateTracker is missing.'
      );

      return;
    }


    setSavingNotes(true);
    setSaveMessage('');


    try {

      onUpdateTracker({
        notes,
      });


      setSaveMessage(
        'Notes saved'
      );

    } catch (error) {

      console.error(
        'Failed to save notes:',
        error
      );

      setSaveMessage(
        'Could not save notes'
      );

    } finally {

      setTimeout(() => {
        setSavingNotes(false);
      }, 250);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | SAVE EVERYTHING
  |--------------------------------------------------------------------------
  |
  | This gives you one reliable save operation for:
  |
  | - status
  | - rating
  | - notes
  |
  */

  const saveAllChanges = () => {

    if (
      typeof onUpdateTracker !==
      'function'
    ) {
      console.error(
        'DramaDetailScreen: onUpdateTracker is missing.'
      );

      setSaveMessage(
        'Save function is unavailable'
      );

      return;
    }


    setSavingStatus(true);
    setSavingNotes(true);
    setSaveMessage('');


    try {

      onUpdateTracker({
        status:
          selectedStatus,

        rating:
          selectedRating,

        notes:
          notes,
      });


      setSaveMessage(
        'All changes saved'
      );

    } catch (error) {

      console.error(
        'Failed to save tracker:',
        error
      );

      setSaveMessage(
        'Could not save changes'
      );

    } finally {

      setTimeout(() => {

        setSavingStatus(false);
        setSavingNotes(false);

      }, 300);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | EPISODE UPDATE
  |--------------------------------------------------------------------------
  */

  const updateEpisode = (episodeNumber) => {

    if (
      typeof onUpdateTracker !==
      'function'
    ) {
      console.error(
        'DramaDetailScreen: onUpdateTracker is missing.'
      );

      return;
    }


    const safeEpisode =
      Math.max(
        0,
        Math.min(
          episodeNumber,
          episodes
        )
      );


    onUpdateTracker({
      watchedEpisodes:
        safeEpisode,
    });

  };


  /*
  |--------------------------------------------------------------------------
  | ADD / REMOVE FROM TRACKER
  |--------------------------------------------------------------------------
  */

  const handleListAction = () => {

    if (isAdded) {

      if (
        typeof onRemoveDrama ===
        'function'
      ) {
        onRemoveDrama(
          drama.id
        );
      }

      return;
    }


    if (
      typeof onAddDrama ===
      'function'
    ) {
      onAddDrama(drama);
    }

  };


  /*
  |--------------------------------------------------------------------------
  | RESPONSIVE WIDTH
  |--------------------------------------------------------------------------
  */

  const horizontalPadding =
    width >= 600
      ? 24
      : 12;


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal:
            horizontalPadding,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >

      {/* ================================================================
          BACK HEADER
      ================================================================ */}

      <View style={styles.topBar}>

        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.backButtonPressed,
          ]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >

          <Ionicons
            name="arrow-back"
            size={18}
            color={colors.text}
          />

          <Text style={styles.backText}>
            Back
          </Text>

        </Pressable>

      </View>


      {/* ================================================================
          HERO
      ================================================================ */}

      <View style={styles.hero}>

        <View style={styles.posterWrap}>

          {image ? (

            <Image
              source={{
                uri: image,
              }}
              style={styles.poster}
              resizeMode="cover"
            />

          ) : (

            <View
              style={
                styles.posterFallback
              }
            />

          )}


          <View style={styles.topBadge}>

            <Text
              style={styles.topBadgeText}
            >
              TOP 1
            </Text>

          </View>

        </View>


        <View style={styles.heroInfo}>

          <Text
            style={styles.title}
            numberOfLines={2}
          >
            {title}
          </Text>


          {koreanTitle ? (

            <Text
              style={styles.koreanTitle}
              numberOfLines={1}
            >
              {koreanTitle}
            </Text>

          ) : null}


          <View style={styles.metaRow}>

            <Text style={styles.metaText}>
              {year}
            </Text>

            <Text style={styles.metaDot}>
              •
            </Text>

            <Text style={styles.metaText}>
              {network}
            </Text>

            <Text style={styles.metaDot}>
              •
            </Text>

            <Text style={styles.metaText}>
              {episodes} Episodes
            </Text>

            <Text style={styles.metaDot}>
              •
            </Text>

            <Text
              style={[
                styles.metaText,
                styles.ratingMeta,
              ]}
            >
              ★ {rating.toFixed(1)}/10
            </Text>

          </View>


          <Text
            style={styles.availableText}
            numberOfLines={1}
          >
            Available on {network}
          </Text>

        </View>

      </View>


      {/* ================================================================
          ACTION BUTTONS
      ================================================================ */}

      <View style={styles.actionRow}>

        <Pressable
          style={styles.updateButton}
          onPress={() => {

            /*
             * Scroll/focus is not required.
             * The actual status controls are shown below.
             */

            setSaveMessage(
              'Choose a status below'
            );

          }}
        >

          <Ionicons
            name="options-outline"
            size={13}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.updateButtonText
            }
          >
            Update Status
          </Text>

        </Pressable>


        <Pressable
          style={[
            styles.favoriteButton,
            isFavorite &&
              styles.favoriteButtonActive,
          ]}
          onPress={
            onToggleFavorite
          }
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite
              ? 'Remove from favorites'
              : 'Add to favorites'
          }
        >

          <Ionicons
            name={
              isFavorite
                ? 'heart'
                : 'heart-outline'
            }
            size={20}
            color={
              colors.redBright
            }
          />

        </Pressable>


        <Pressable
          style={[
            styles.listButton,
            isAdded &&
              styles.listButtonActive,
          ]}
          onPress={
            handleListAction
          }
          accessibilityRole="button"
          accessibilityLabel={
            isAdded
              ? 'Remove from tracker'
              : 'Add to tracker'
          }
        >

          <Ionicons
            name={
              isAdded
                ? 'checkmark'
                : 'bookmark-outline'
            }
            size={16}
            color={
              isAdded
                ? '#FFFFFF'
                : colors.text
            }
          />

        </Pressable>

      </View>


      <View style={styles.divider} />


      {/* ================================================================
          MAIN COLUMNS
      ================================================================ */}

      <View style={styles.columns}>

        {/* ==============================================================
            LEFT COLUMN
        ============================================================== */}

        <View style={styles.leftColumn}>

          {/* SYNOPSIS */}

          <View style={styles.card}>

            <Text
              style={styles.sectionLabel}
            >
              SYNOPSIS
            </Text>

            <Text
              style={styles.synopsis}
            >
              {synopsis}
            </Text>

          </View>


          {/* DETAILS */}

          <View style={styles.card}>

            <Text
              style={styles.sectionLabel}
            >
              DETAILS
            </Text>


            <DetailRow
              label="Native Title"
              value={
                koreanTitle || '—'
              }
            />


            <DetailRow
              label="Genres"
              value={genre}
            />


            <DetailRow
              label="Director"
              value={director}
            />


            <DetailRow
              label="Aired"
              value={String(year)}
            />


            <DetailRow
              label="Duration"
              value={duration}
            />


            <DetailRow
              label="Network"
              value={network}
              last
            />

          </View>


          {/* MAIN CAST */}

          <View style={styles.card}>

            <Text
              style={styles.sectionLabel}
            >
              MAIN CAST
            </Text>


            <View style={styles.castRow}>

              <View
                style={styles.castAvatar}
              >

                <Ionicons
                  name="person"
                  size={17}
                  color={colors.muted}
                />

              </View>


              <View
                style={styles.castInfo}
              >

                <Text
                  style={styles.castName}
                  numberOfLines={1}
                >
                  Main Cast
                </Text>

                <Text
                  style={styles.castRole}
                >
                  Cast information
                </Text>

              </View>

            </View>

          </View>

        </View>


        {/* ==============================================================
            RIGHT COLUMN
        ============================================================== */}

        <View style={styles.rightColumn}>

          {/* PROGRESS */}

          <View style={styles.card}>

            <View
              style={
                styles.progressHeader
              }
            >

              <Text
                style={styles.sectionLabel}
              >
                PROGRESS
              </Text>


              <Text
                style={
                  styles.progressPercent
                }
              >
                {progress}%
              </Text>

            </View>


            <Text
              style={
                styles.progressSubtext
              }
            >
              {watchedEpisodes}/{episodes} eps
              {' · '}
              added 8/28/2025
            </Text>


            <View
              style={
                styles.progressTrack
              }
            >

              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      `${progress}%`,
                  },
                ]}
              />

            </View>


            <Text
              style={
                styles.remainingText
              }
            >
              {remainingEpisodes}{' '}
              eps remaining
            </Text>


            {/* ==========================================================
                STATUS
            ========================================================== */}

            <Text
              style={[
                styles.sectionLabel,
                styles.statusLabel,
              ]}
            >
              STATUS
            </Text>


            <View style={styles.statusGrid}>

              {statuses.map(
                (status) => {

                  const active =
                    selectedStatus ===
                    status;


                  return (

                    <Pressable
                      key={status}
                      onPress={() =>
                        selectStatus(
                          status
                        )
                      }
                      style={[
                        styles.statusPill,

                        active &&
                          styles.statusPillActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected:
                          active,
                      }}
                    >

                      <Text
                        style={[
                          styles.statusPillText,

                          active &&
                            styles.statusPillTextActive,
                        ]}
                      >
                        {status}
                      </Text>

                    </Pressable>

                  );

                }
              )}

            </View>


            {/* ==========================================================
                SAVE STATUS BUTTON
            ========================================================== */}

            <Pressable
              style={[
                styles.saveStatusButton,
                savingStatus &&
                  styles.saveButtonDisabled,
              ]}
              onPress={
                saveStatus
              }
              disabled={
                savingStatus
              }
            >

              <Ionicons
                name={
                  savingStatus
                    ? 'hourglass-outline'
                    : 'checkmark-circle-outline'
                }
                size={12}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.saveStatusButtonText
                }
              >
                {savingStatus
                  ? 'Saving...'
                  : 'Save Status'}
              </Text>

            </Pressable>


            {/* ==========================================================
                RATING
            ========================================================== */}

            <Text
              style={[
                styles.sectionLabel,
                styles.ratingLabel,
              ]}
            >
              MY RATING
            </Text>


            <View style={styles.stars}>

              {[1, 2, 3, 4, 5].map(
                (star) => {

                  const active =
                    selectedRating >=
                    star * 2;


                  return (

                    <Pressable
                      key={star}
                      onPress={() =>
                        changeRating(
                          star * 2
                        )
                      }
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={
                        `Rate ${star * 2} out of 10`
                      }
                    >

                      <Ionicons
                        name={
                          active
                            ? 'star'
                            : 'star-outline'
                        }
                        size={20}
                        color={
                          colors.gold
                        }
                      />

                    </Pressable>

                  );

                }
              )}

            </View>


            <Text
              style={styles.ratingValue}
            >
              {selectedRating > 0
                ? `${selectedRating}/10`
                : 'Not rated'}
            </Text>


            {/* ==========================================================
                NOTES
            ========================================================== */}

            <Text
              style={[
                styles.sectionLabel,
                styles.notesLabel,
              ]}
            >
              MY NOTES
            </Text>


            <TextInput
              value={notes}
              onChangeText={(value) => {

                setNotes(value);
                setSaveMessage('');

              }}
              multiline
              textAlignVertical="top"
              placeholder="Add a note..."
              placeholderTextColor={
                colors.muted
              }
              style={styles.notesInput}
              accessibilityLabel="My notes"
            />


            <View
              style={styles.notesButtons}
            >

              <Pressable
                style={[
                  styles.saveButton,
                  savingNotes &&
                    styles.saveButtonDisabled,
                ]}
                onPress={
                  saveNotes
                }
                disabled={
                  savingNotes
                }
              >

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {savingNotes
                    ? 'Saving...'
                    : 'Save Notes'}
                </Text>

              </Pressable>


              <Pressable
                style={[
                  styles.saveAllButton,
                  (
                    savingStatus ||
                    savingNotes
                  ) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={
                  saveAllChanges
                }
                disabled={
                  savingStatus ||
                  savingNotes
                }
              >

                <Ionicons
                  name="save-outline"
                  size={11}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.saveAllButtonText
                  }
                >
                  Save All
                </Text>

              </Pressable>

            </View>


            {saveMessage ? (

              <View
                style={styles.saveMessageRow}
              >

                <Ionicons
                  name={
                    saveMessage.includes(
                      'saved'
                    )
                      ? 'checkmark-circle'
                      : 'alert-circle'
                  }
                  size={11}
                  color={
                    saveMessage.includes(
                      'saved'
                    )
                      ? '#22C55E'
                      : '#F87171'
                  }
                />

                <Text
                  style={[
                    styles.saveMessage,
                    {
                      color:
                        saveMessage.includes(
                          'saved'
                        )
                          ? '#22C55E'
                          : '#F87171',
                    },
                  ]}
                >
                  {saveMessage}
                </Text>

              </View>

            ) : null}

          </View>


          {/* ============================================================
              EPISODES
          ============================================================ */}

          <View style={styles.card}>

            <View
              style={
                styles.episodesHeader
              }
            >

              <Text
                style={styles.sectionLabel}
              >
                EPISODES
              </Text>


              <Text
                style={
                  styles.totalEpisodes
                }
              >
                {episodes} Total
              </Text>

            </View>


            <View
              style={
                styles.episodeList
              }
            >

              {episodeList.map(
                (episode) => {

                  const watched =
                    episode.number <=
                    watchedEpisodes;


                  return (

                    <Pressable
                      key={
                        episode.number
                      }
                      style={
                        styles.episodeRow
                      }
                      onPress={() =>
                        updateEpisode(
                          episode.number
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        watched
                          ? `Mark episode ${episode.number} as unwatched`
                          : `Mark episode ${episode.number} as watched`
                      }
                    >

                      <View
                        style={[
                          styles.episodeCircle,
                          watched &&
                            styles.episodeCircleActive,
                        ]}
                      >

                        {watched ? (

                          <Ionicons
                            name="checkmark"
                            size={10}
                            color="#FFFFFF"
                          />

                        ) : null}

                      </View>


                      <Text
                        style={[
                          styles.episodeTitle,
                          watched &&
                            styles.episodeTitleWatched,
                        ]}
                        numberOfLines={1}
                      >
                        {episode.title}
                      </Text>


                      <Text
                        style={
                          styles.episodeNumber
                        }
                      >
                        Ep {episode.number}
                      </Text>

                    </Pressable>

                  );

                }
              )}

            </View>

          </View>

        </View>

      </View>


      <View
        style={styles.bottomSpace}
      />

    </ScrollView>
  );
}


/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({
  label,
  value,
  last = false,
}) {

  return (

    <View
      style={[
        styles.detailRow,
        last &&
          styles.detailRowLast,
      ]}
    >

      <Text
        style={styles.detailLabel}
        numberOfLines={1}
      >
        {label}
      </Text>


      <Text
        style={styles.detailValue}
        numberOfLines={1}
      >
        {value}
      </Text>

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
    backgroundColor:
      colors.bg,
  },


  content: {
    paddingTop: 8,
    paddingBottom: 80,
  },


  /*
  |--------------------------------------------------------------------------
  | BACK HEADER
  |--------------------------------------------------------------------------
  */

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
    backgroundColor:
      'rgba(255,255,255,0.025)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },


  backButtonPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },


  backText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 6,
  },


  /*
  |--------------------------------------------------------------------------
  | HERO
  |--------------------------------------------------------------------------
  */

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
    backgroundColor:
      colors.panel,
    borderWidth: 1,
    borderColor:
      colors.line,
    position: 'relative',
    flexShrink: 0,
  },


  poster: {
    width: '100%',
    height: '100%',
  },


  posterFallback: {
    flex: 1,
    backgroundColor:
      colors.panel2,
  },


  topBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor:
      '#10A9D6',
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


  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },


  updateButton: {
    height: 31,
    paddingHorizontal: 11,
    borderRadius: 7,
    backgroundColor:
      colors.redBright,
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
    borderColor:
      colors.redBright,
    marginLeft: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },


  favoriteButtonActive: {
    backgroundColor:
      'rgba(238,45,82,0.12)',
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
    backgroundColor:
      colors.redBright,
    borderColor:
      colors.redBright,
  },


  divider: {
    height: 1,
    backgroundColor:
      colors.line,
    marginTop: 13,
    marginBottom: 14,
  },


  /*
  |--------------------------------------------------------------------------
  | COLUMNS
  |--------------------------------------------------------------------------
  */

  columns: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },


  leftColumn: {
    flex: 1,
    minWidth: 0,
  },


  rightColumn: {
    flex: 0.62,
    minWidth: 0,
  },


  /*
  |--------------------------------------------------------------------------
  | CARD
  |--------------------------------------------------------------------------
  */

  card: {
    width: '100%',
    backgroundColor:
      colors.panel,
    borderWidth: 1,
    borderColor:
      colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 11,
  },


  /*
  |--------------------------------------------------------------------------
  | SECTION LABEL
  |--------------------------------------------------------------------------
  */

  sectionLabel: {
    color: '#858394',
    fontSize: 7,
    lineHeight: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 9,
  },


  /*
  |--------------------------------------------------------------------------
  | SYNOPSIS
  |--------------------------------------------------------------------------
  */

  synopsis: {
    color: colors.text,
    fontSize: 8.5,
    lineHeight: 14,
    fontWeight: '500',
  },


  /*
  |--------------------------------------------------------------------------
  | DETAILS
  |--------------------------------------------------------------------------
  */

  detailRow: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.055)',
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


  /*
  |--------------------------------------------------------------------------
  | CAST
  |--------------------------------------------------------------------------
  */

  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  castAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      '#292936',
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


  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
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
    backgroundColor:
      '#292832',
    overflow: 'hidden',
  },


  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor:
      colors.redBright,
  },


  remainingText: {
    color: colors.muted,
    fontSize: 6.5,
    marginTop: 6,
  },


  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

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
    borderColor:
      '#353540',
    backgroundColor:
      'rgba(255,255,255,0.01)',
    alignItems: 'center',
    justifyContent: 'center',
  },


  statusPillActive: {
    borderColor:
      '#5B9FFF',
    backgroundColor:
      'rgba(59,130,246,0.10)',
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


  /*
  |--------------------------------------------------------------------------
  | SAVE STATUS
  |--------------------------------------------------------------------------
  */

  saveStatusButton: {
    height: 28,
    marginTop: 9,
    borderRadius: 7,
    backgroundColor:
      colors.redBright,
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


  /*
  |--------------------------------------------------------------------------
  | RATING
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | NOTES
  |--------------------------------------------------------------------------
  */

  notesLabel: {
    marginTop: 14,
    marginBottom: 7,
  },


  notesInput: {
    width: '100%',
    minHeight: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor:
      '#353540',
    backgroundColor:
      '#171720',
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
    backgroundColor:
      colors.redBright,
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
    backgroundColor:
      '#292936',
    borderWidth: 1,
    borderColor:
      '#454351',
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


  /*
  |--------------------------------------------------------------------------
  | EPISODES
  |--------------------------------------------------------------------------
  */

  episodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
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
    borderTopColor:
      'rgba(255,255,255,0.055)',
  },


  episodeCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor:
      '#4A4855',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },


  episodeCircleActive: {
    backgroundColor:
      colors.redBright,
    borderColor:
      colors.redBright,
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


  /*
  |--------------------------------------------------------------------------
  | EMPTY
  |--------------------------------------------------------------------------
  */

  emptyScreen: {
    flex: 1,
    backgroundColor:
      colors.bg,
    padding: 12,
  },


  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 35,
    textAlign: 'center',
  },


  bottomSpace: {
    height: 30,
  },

});