import React, { useMemo, useState } from 'react';

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { dramas } from '../data/dramas';


/*
|--------------------------------------------------------------------------
| TRACKER SCREEN
|--------------------------------------------------------------------------
|
| This screen:
|
| 1. Displays all tracked dramas
| 2. Displays added dramas
| 3. Filters by status
| 4. Filters favorites
| 5. Displays progress
| 6. Allows status changes
| 7. Saves status through onUpdateTracker()
|
*/


const STATUS_OPTIONS = [
  'Watching',
  'Completed',
  'Plan to Watch',
  'On Hold',
  'Dropped',
];


const DEFAULT_TRACKER_DATA = {
  status: 'Plan to Watch',
  watchedEpisodes: 0,
  rating: 0,
  notes: '',
};


export default function TrackerScreen({
  onOpenDrama,
  onNavigate,
  addedDramas = [],
  favoriteIds = [],
  trackerState = {},
  onUpdateTracker,
  onRemoveDrama,
}) {


  /*
  |--------------------------------------------------------------------------
  | TAB
  |--------------------------------------------------------------------------
  */

  const [tab, setTab] = useState('All');


  /*
  |--------------------------------------------------------------------------
  | HOVER STATES
  |--------------------------------------------------------------------------
  */

  const [backHovered, setBackHovered] =
    useState(false);

  const [addHovered, setAddHovered] =
    useState(false);

  const [hoveredTab, setHoveredTab] =
    useState(null);

  const [hoveredDrama, setHoveredDrama] =
    useState(null);

  const [hoveredStatus, setHoveredStatus] =
    useState(null);

  const [saveHovered, setSaveHovered] =
    useState(false);

  const [cancelHovered, setCancelHovered] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | STATUS MODAL
  |--------------------------------------------------------------------------
  */

  const [statusModalVisible, setStatusModalVisible] =
    useState(false);

  const [editingDrama, setEditingDrama] =
    useState(null);

  const [selectedStatus, setSelectedStatus] =
    useState('Plan to Watch');


  /*
  |--------------------------------------------------------------------------
  | ALL TRACKER DRAMAS
  |--------------------------------------------------------------------------
  */

  const allTrackerDramas = useMemo(() => {

    const combined = [
      ...dramas.slice(0, 4),

      ...(Array.isArray(addedDramas)
        ? addedDramas
        : []),
    ];


    const unique = [];


    combined.forEach((drama) => {

      if (
        !drama ||
        !drama.id
      ) {
        return;
      }


      const exists = unique.some(
        (item) =>
          item?.id === drama.id
      );


      if (!exists) {
        unique.push(drama);
      }

    });


    return unique;

  }, [addedDramas]);


  /*
  |--------------------------------------------------------------------------
  | FILTERED DRAMAS
  |--------------------------------------------------------------------------
  */

  const filteredDramas = useMemo(() => {

    return allTrackerDramas.filter((drama) => {

      const data = {
        ...DEFAULT_TRACKER_DATA,
        ...(trackerState?.[drama.id] || {}),
      };


      if (tab === 'All') {
        return true;
      }


      if (tab === 'Favorites') {

        return Array.isArray(favoriteIds)
          ? favoriteIds.includes(drama.id)
          : false;

      }


      if (tab === 'Watching') {
        return data.status === 'Watching';
      }


      if (tab === 'Completed') {
        return data.status === 'Completed';
      }


      if (tab === 'Plan') {
        return data.status === 'Plan to Watch';
      }


      if (tab === 'On Hold') {
        return data.status === 'On Hold';
      }


      if (tab === 'Dropped') {
        return data.status === 'Dropped';
      }


      return false;

    });

  }, [
    allTrackerDramas,
    favoriteIds,
    tab,
    trackerState,
  ]);


  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const counts = useMemo(() => {

    const result = {
      All: allTrackerDramas.length,
      Favorites: 0,
      Watching: 0,
      Completed: 0,
      Plan: 0,
      'On Hold': 0,
      Dropped: 0,
    };


    allTrackerDramas.forEach((drama) => {

      const data = {
        ...DEFAULT_TRACKER_DATA,
        ...(trackerState?.[drama.id] || {}),
      };


      if (
        Array.isArray(favoriteIds) &&
        favoriteIds.includes(drama.id)
      ) {
        result.Favorites += 1;
      }


      switch (data.status) {

        case 'Watching':

          result.Watching += 1;

          break;


        case 'Completed':

          result.Completed += 1;

          break;


        case 'Plan to Watch':

          result.Plan += 1;

          break;


        case 'On Hold':

          result['On Hold'] += 1;

          break;


        case 'Dropped':

          result.Dropped += 1;

          break;


        default:

          break;

      }

    });


    return result;

  }, [
    allTrackerDramas,
    favoriteIds,
    trackerState,
  ]);


  /*
  |--------------------------------------------------------------------------
  | TABS
  |--------------------------------------------------------------------------
  */

  const tabs = [
    ['All', counts.All],
    ['Favorites', counts.Favorites],
    ['Watching', counts.Watching],
    ['Completed', counts.Completed],
    ['Plan', counts.Plan],
    ['On Hold', counts['On Hold']],
    ['Dropped', counts.Dropped],
  ];


  /*
  |--------------------------------------------------------------------------
  | STATUS COLOR
  |--------------------------------------------------------------------------
  */

  const getStatusColor = (status) => {

    switch (status) {

      case 'Watching':
        return '#60A5FA';

      case 'Completed':
        return '#22C55E';

      case 'Plan to Watch':
        return '#8B5CF6';

      case 'On Hold':
        return '#FBBF24';

      case 'Dropped':
        return '#F87171';

      default:
        return '#8F8B97';

    }

  };


  /*
  |--------------------------------------------------------------------------
  | OPEN DRAMA
  |--------------------------------------------------------------------------
  */

  const handleOpenDrama = (drama) => {

    if (
      typeof onOpenDrama === 'function'
    ) {
      onOpenDrama(drama);
    }

  };


  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {

    if (
      typeof onNavigate === 'function'
    ) {
      onNavigate('home');
    }

  };


  /*
  |--------------------------------------------------------------------------
  | ADD DRAMA
  |--------------------------------------------------------------------------
  */

  const handleAddDramaPress = () => {

    if (
      typeof onNavigate === 'function'
    ) {
      onNavigate('add-drama');
    }

  };


  /*
  |--------------------------------------------------------------------------
  | OPEN STATUS EDITOR
  |--------------------------------------------------------------------------
  */

  const handleOpenStatusEditor = (
    drama,
    currentStatus
  ) => {

    if (!drama || !drama.id) {
      return;
    }


    setEditingDrama(drama);

    setSelectedStatus(
      STATUS_OPTIONS.includes(currentStatus)
        ? currentStatus
        : 'Plan to Watch'
    );

    setStatusModalVisible(true);

  };


  /*
  |--------------------------------------------------------------------------
  | CLOSE STATUS EDITOR
  |--------------------------------------------------------------------------
  */

  const handleCloseStatusEditor = () => {

    setStatusModalVisible(false);

    setEditingDrama(null);

    setSelectedStatus('Plan to Watch');

    setHoveredStatus(null);

    setSaveHovered(false);

    setCancelHovered(false);

  };


  /*
  |--------------------------------------------------------------------------
  | SAVE STATUS
  |--------------------------------------------------------------------------
  */

  const handleSaveStatus = () => {

    /*
     * Prevent undefined callback errors.
     */

    if (
      typeof onUpdateTracker !== 'function'
    ) {

      console.error(
        'TrackerScreen: onUpdateTracker is not a function.'
      );

      return;

    }


    /*
     * Prevent saving without a drama.
     */

    if (
      !editingDrama ||
      !editingDrama.id
    ) {

      console.error(
        'TrackerScreen: No drama selected for status update.'
      );

      return;

    }


    /*
     * Prevent invalid status.
     */

    if (
      !STATUS_OPTIONS.includes(
        selectedStatus
      )
    ) {

      console.error(
        'TrackerScreen: Invalid status:',
        selectedStatus
      );

      return;

    }


    /*
     * SAVE INTO APP STATE
     *
     * App.js receives this through
     * updateDramaTracker().
     */

    onUpdateTracker(
      editingDrama.id,
      {
        status: selectedStatus,
      }
    );


    /*
     * Close modal after saving.
     */

    handleCloseStatusEditor();

  };


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View style={styles.screen}>


      {/* ================================================================
          TRACKER SCROLL VIEW
      ================================================================= */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >


        {/* ============================================================
            HEADER
        ============================================================ */}

        <View style={styles.header}>

          <View style={styles.headerLeft}>

            <Pressable
              onPress={handleBack}

              onHoverIn={() =>
                setBackHovered(true)
              }

              onHoverOut={() =>
                setBackHovered(false)
              }

              style={[
                styles.backButton,

                backHovered &&
                  styles.backButtonHover,
              ]}

              hitSlop={8}

              accessibilityRole="button"

              accessibilityLabel="Go back to Home"
            >

              <Ionicons
                name="arrow-back"
                size={18}
                color={colors.text}
              />

            </Pressable>


            <View style={styles.headerText}>

              <Text style={styles.title}>
                My Tracker
              </Text>


              <Text style={styles.subtitle}>
                Keep track of what you're watching.
              </Text>

            </View>

          </View>


          {/* ADD DRAMA */}

          <Pressable
            onPress={handleAddDramaPress}

            onHoverIn={() =>
              setAddHovered(true)
            }

            onHoverOut={() =>
              setAddHovered(false)
            }

            style={[
              styles.addButton,

              addHovered &&
                styles.addButtonHover,
            ]}

            accessibilityRole="button"

            accessibilityLabel="Add drama"

            accessibilityHint="Open the Add Drama screen"

            hitSlop={5}
          >

            <Ionicons
              name="add"
              size={15}
              color="#fff"
            />


            <Text style={styles.addText}>
              Add Drama
            </Text>

          </Pressable>

        </View>


        {/* ============================================================
            TABS
        ============================================================ */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          keyboardShouldPersistTaps="handled"
        >

          {tabs.map(([name, count]) => {

            const isActive =
              tab === name;


            const isHovered =
              hoveredTab === name;


            return (

              <Pressable
                key={name}

                onPress={() =>
                  setTab(name)
                }

                onHoverIn={() =>
                  setHoveredTab(name)
                }

                onHoverOut={() =>
                  setHoveredTab(null)
                }

                style={[
                  styles.tab,

                  isActive &&
                    styles.tabActive,

                  isHovered &&
                    !isActive &&
                    styles.tabHover,
                ]}
              >

                <Text
                  style={[
                    styles.tabText,

                    isActive &&
                      styles.tabTextActive,

                    isHovered &&
                      !isActive &&
                      styles.tabTextHover,
                  ]}
                >
                  {name} ({count})
                </Text>

              </Pressable>

            );

          })}

        </ScrollView>


        {/* ============================================================
            EMPTY STATE
        ============================================================ */}

        {filteredDramas.length === 0 && (

          <View style={styles.empty}>

            <Ionicons
              name={
                tab === 'Favorites'
                  ? 'heart-outline'
                  : 'film-outline'
              }
              size={30}
              color={colors.muted}
            />


            <Text style={styles.emptyTitle}>

              {tab === 'Favorites'
                ? 'No favorites yet'
                : 'Nothing here yet'}

            </Text>


            <Text style={styles.emptyText}>

              {tab === 'Favorites'
                ? 'Tap the heart on a drama to add it to Favorites.'
                : 'Add a drama to start building your list.'}

            </Text>

          </View>

        )}


        {/* ============================================================
            DRAMA LIST
        ============================================================ */}

        <View style={styles.list}>

          {filteredDramas.map((drama) => {

            const data = {
              ...DEFAULT_TRACKER_DATA,
              ...(trackerState?.[drama.id] || {}),
            };


            const episodeTotal =
              Number(drama.episodes) || 0;


            const rawWatched =
              Number(
                data.watchedEpisodes
              ) || 0;


            const watched =
              episodeTotal > 0
                ? Math.min(
                    Math.max(
                      rawWatched,
                      0
                    ),
                    episodeTotal
                  )
                : Math.max(
                    rawWatched,
                    0
                  );


            const progress =
              episodeTotal > 0
                ? Math.round(
                    (
                      watched /
                      episodeTotal
                    ) *
                    100
                  )
                : 0;


            const statusColor =
              getStatusColor(
                data.status
              );


            const posterSource =
              drama.image ||
              drama.imageUrl ||
              drama.poster ||
              drama.posterUrl ||
              drama.thumbnail ||
              null;


            const isDramaHovered =
              hoveredDrama === drama.id;


            const isFavorite =
              Array.isArray(favoriteIds) &&
              favoriteIds.includes(
                drama.id
              );


            return (

              <View
                key={drama.id}
                style={[
                  styles.card,

                  isDramaHovered &&
                    styles.cardHover,
                ]}
              >


                {/* ==================================================
                    CLICKABLE CARD CONTENT
                ================================================== */}

                <Pressable
                  onPress={() =>
                    handleOpenDrama(drama)
                  }

                  onHoverIn={() =>
                    setHoveredDrama(drama.id)
                  }

                  onHoverOut={() =>
                    setHoveredDrama(null)
                  }

                  style={styles.cardPressable}

                  accessibilityRole="button"

                  accessibilityLabel={
                    `Open ${
                      drama.title ||
                      'drama'
                    }`
                  }
                >


                  {/* POSTER */}

                  {posterSource ? (

                    <Image
                      source={{
                        uri: posterSource,
                      }}
                      style={styles.poster}
                      resizeMode="cover"
                    />

                  ) : (

                    <View
                      style={
                        styles.posterPlaceholder
                      }
                    >

                      <Ionicons
                        name="film-outline"
                        size={18}
                        color={colors.muted}
                      />

                    </View>

                  )}


                  {/* MAIN CONTENT */}

                  <View style={styles.cardMain}>

                    <Text
                      style={styles.dramaTitle}
                      numberOfLines={1}
                    >
                      {drama.title ||
                        'Untitled Drama'}
                    </Text>


                    <Text
                      style={styles.genre}
                      numberOfLines={1}
                    >
                      {drama.genre ||
                        'Drama'}
                    </Text>


                    <Text style={styles.episodes}>
                      {watched}/
                      {episodeTotal || 0}
                      {' '}eps
                    </Text>


                    {/* PROGRESS */}

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

                            backgroundColor:
                              statusColor,
                          },
                        ]}
                      />

                    </View>


                    {/* BOTTOM ROW */}

                    <View
                      style={
                        styles.bottomRow
                      }
                    >

                      <Text
                        style={[
                          styles.rating,

                          {
                            color:
                              Number(data.rating) > 0
                                ? '#FBBF24'
                                : statusColor,
                          },
                        ]}
                      >
                        ★{' '}

                        {Number(data.rating) > 0
                          ? Number(
                              data.rating
                            ).toFixed(1)
                          : Number(
                              drama.rating ||
                                0
                            ).toFixed(1)}

                      </Text>


                      {data.notes ? (

                        <Text
                          style={
                            styles.comment
                          }
                          numberOfLines={1}
                        >
                          {data.notes}
                        </Text>

                      ) : null}

                    </View>

                  </View>

                </Pressable>


                {/* ==================================================
                    STATUS BUTTON
                ================================================== */}

                <Pressable
                  onPress={() =>
                    handleOpenStatusEditor(
                      drama,
                      data.status
                    )
                  }

                  style={[
                    styles.status,

                    {
                      borderColor:
                        statusColor,

                      backgroundColor:
                        `${statusColor}18`,
                    },
                  ]}

                  accessibilityRole="button"

                  accessibilityLabel={
                    `Update status for ${
                      drama.title ||
                      'drama'
                    }`
                  }

                  accessibilityHint="Choose and save a new tracker status"
                >

                  <Text
                    style={[
                      styles.statusText,

                      {
                        color:
                          statusColor,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {data.status ||
                      'Plan to Watch'}
                  </Text>


                  <Ionicons
                    name="chevron-down"
                    size={9}
                    color={statusColor}
                    style={styles.statusChevron}
                  />

                </Pressable>


                {/* ==================================================
                    PERCENT
                ================================================== */}

                <Text
                  style={[
                    styles.percent,

                    {
                      color:
                        statusColor,
                    },
                  ]}
                >
                  {progress}%
                </Text>


                {/* ==================================================
                    FAVORITE
                ================================================== */}

                {isFavorite && (

                  <View
                    style={
                      styles.favoriteIcon
                    }
                  >

                    <Ionicons
                      name="heart"
                      size={11}
                      color="#FF5D7D"
                    />

                  </View>

                )}

              </View>

            );

          })}

        </View>


        <View style={styles.bottomSpace} />

      </ScrollView>


      {/* ==============================================================
          STATUS MODAL
      ============================================================== */}

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={
          handleCloseStatusEditor
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>


            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>

              <View style={styles.modalHeaderText}>

                <Text style={styles.modalTitle}>
                  Update Status
                </Text>


                <Text
                  style={styles.modalSubtitle}
                  numberOfLines={1}
                >
                  {editingDrama?.title ||
                    'Drama'}
                </Text>

              </View>


              <Pressable
                onPress={
                  handleCloseStatusEditor
                }

                style={styles.closeButton}

                accessibilityRole="button"

                accessibilityLabel="Close status editor"
              >

                <Ionicons
                  name="close"
                  size={17}
                  color={colors.text}
                />

              </Pressable>

            </View>


            {/* STATUS OPTIONS */}

            <View style={styles.statusOptions}>

              {STATUS_OPTIONS.map((status) => {

                const isSelected =
                  selectedStatus === status;


                const isHovered =
                  hoveredStatus === status;


                const optionColor =
                  getStatusColor(status);


                return (

                  <Pressable
                    key={status}

                    onPress={() =>
                      setSelectedStatus(
                        status
                      )
                    }

                    onHoverIn={() =>
                      setHoveredStatus(
                        status
                      )
                    }

                    onHoverOut={() =>
                      setHoveredStatus(
                        null
                      )
                    }

                    style={[
                      styles.statusOption,

                      isSelected &&
                        {
                          borderColor:
                            optionColor,

                          backgroundColor:
                            `${optionColor}18`,
                        },

                      isHovered &&
                        !isSelected &&
                        styles.statusOptionHover,
                    ]}
                  >

                    <View
                      style={[
                        styles.statusDot,

                        {
                          backgroundColor:
                            optionColor,
                        },
                      ]}
                    />


                    <Text
                      style={[
                        styles.statusOptionText,

                        isSelected &&
                          {
                            color:
                              colors.text,

                            fontWeight:
                              '800',
                          },

                        isHovered &&
                          !isSelected &&
                          styles.statusOptionTextHover,
                      ]}
                    >
                      {status}
                    </Text>


                    {isSelected && (

                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={optionColor}
                        style={
                          styles.statusCheck
                        }
                      />

                    )}

                  </Pressable>

                );

              })}

            </View>


            {/* MODAL ACTIONS */}

            <View style={styles.modalActions}>


              {/* CANCEL */}

              <Pressable
                onPress={
                  handleCloseStatusEditor
                }

                onHoverIn={() =>
                  setCancelHovered(true)
                }

                onHoverOut={() =>
                  setCancelHovered(false)
                }

                style={[
                  styles.cancelButton,

                  cancelHovered &&
                    styles.cancelButtonHover,
                ]}
              >

                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>

              </Pressable>


              {/* SAVE */}

              <Pressable
                onPress={handleSaveStatus}

                onHoverIn={() =>
                  setSaveHovered(true)
                }

                onHoverOut={() =>
                  setSaveHovered(false)
                }

                style={[
                  styles.saveButton,

                  saveHovered &&
                    styles.saveButtonHover,
                ]}
              >

                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#fff"
                />


                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Save Status
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

    </View>
  );
}


/* =================================================================
   STYLES
================================================================= */

const styles = StyleSheet.create({

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

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
    transform: [
      {
        scale: 1.04,
      },
    ],
  },


  /*
  |--------------------------------------------------------------------------
  | TITLE
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | ADD BUTTON
  |--------------------------------------------------------------------------
  */

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.redBright,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    borderRadius: 999,
    elevation: 2,
  },


  addButtonHover: {
    backgroundColor: '#E01B43',
    transform: [
      {
        scale: 1.035,
      },
    ],
    elevation: 5,
  },


  addText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
  },


  /*
  |--------------------------------------------------------------------------
  | TABS
  |--------------------------------------------------------------------------
  */

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
    backgroundColor:
      'rgba(200,16,46,0.15)',
    borderColor: colors.red,
  },


  tabHover: {
    backgroundColor: '#211F2D',
    borderColor: '#514A60',
    transform: [
      {
        scale: 1.035,
      },
    ],
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


  tabTextHover: {
    color: '#D8D2DF',
  },


  /*
  |--------------------------------------------------------------------------
  | LIST
  |--------------------------------------------------------------------------
  */

  list: {
    gap: 10,
  },


  /*
  |--------------------------------------------------------------------------
  | CARD
  |--------------------------------------------------------------------------
  */

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


  cardHover: {
    backgroundColor: '#191824',
    borderColor: '#4B4558',
    transform: [
      {
        scale: 1.008,
      },
    ],
  },


  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    minHeight: 75,
    paddingRight: 4,
  },


  /*
  |--------------------------------------------------------------------------
  | POSTER
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | CARD CONTENT
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | BOTTOM ROW
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | STATUS BUTTON
  |--------------------------------------------------------------------------
  */

  status: {
    position: 'absolute',
    top: 10,
    right: 10,
    maxWidth: 112,
    minHeight: 22,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },


  statusText: {
    fontSize: 7,
    fontWeight: '800',
    flexShrink: 1,
  },


  statusChevron: {
    marginLeft: 3,
  },


  /*
  |--------------------------------------------------------------------------
  | PERCENT
  |--------------------------------------------------------------------------
  */

  percent: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    fontSize: 7.5,
    fontWeight: '800',
  },


  /*
  |--------------------------------------------------------------------------
  | FAVORITE
  |--------------------------------------------------------------------------
  */

  favoriteIcon: {
    position: 'absolute',
    left: 34,
    top: 47,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#15141C',
    borderWidth: 1,
    borderColor: '#FF5D7D',
    alignItems: 'center',
    justifyContent: 'center',
  },


  /*
  |--------------------------------------------------------------------------
  | EMPTY
  |--------------------------------------------------------------------------
  */

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
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
  },


  /*
  |--------------------------------------------------------------------------
  | MODAL
  |--------------------------------------------------------------------------
  */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },


  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#11111B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#302D3B',
    padding: 16,
    elevation: 12,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },


  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },


  modalHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },


  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },


  modalSubtitle: {
    color: colors.muted,
    fontSize: 8.5,
    marginTop: 3,
  },


  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1D1B27',
    borderWidth: 1,
    borderColor: '#34313F',
    alignItems: 'center',
    justifyContent: 'center',
  },


  /*
  |--------------------------------------------------------------------------
  | STATUS OPTIONS
  |--------------------------------------------------------------------------
  */

  statusOptions: {
    gap: 7,
  },


  statusOption: {
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#302D3B',
    backgroundColor: '#171621',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },


  statusOptionHover: {
    backgroundColor: '#211F2D',
    borderColor: '#514A60',
  },


  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 9,
  },


  statusOptionText: {
    flex: 1,
    color: '#AAA6B2',
    fontSize: 9,
    fontWeight: '600',
  },


  statusOptionTextHover: {
    color: '#E2DEE8',
  },


  statusCheck: {
    marginLeft: 8,
  },


  /*
  |--------------------------------------------------------------------------
  | MODAL ACTIONS
  |--------------------------------------------------------------------------
  */

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 17,
  },


  cancelButton: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#393643',
    backgroundColor: '#181721',
    alignItems: 'center',
    justifyContent: 'center',
  },


  cancelButtonHover: {
    backgroundColor: '#24222F',
    borderColor: '#575164',
  },


  cancelButtonText: {
    color: '#AAA6B2',
    fontSize: 8.5,
    fontWeight: '700',
  },


  saveButton: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: colors.redBright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },


  saveButtonHover: {
    backgroundColor: '#E01B43',
    transform: [
      {
        scale: 1.025,
      },
    ],
  },


  saveButtonText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '800',
    marginLeft: 5,
  },


  /*
  |--------------------------------------------------------------------------
  | BOTTOM SPACE
  |--------------------------------------------------------------------------
  */

  bottomSpace: {
    height: 30,
  },

});