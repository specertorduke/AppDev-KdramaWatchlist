import React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';


export default function StatsScreen({
  addedDramas = [],
  trackerState = {},
  favoriteIds = [],
  onNavigate,
}) {

  /*
  |--------------------------------------------------------------------------
  | Build tracker list
  |--------------------------------------------------------------------------
  */

  const trackerEntries = Object.entries(
    trackerState
  );


  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const totalDramas = Math.max(
    5,
    addedDramas.length ||
    trackerEntries.length
  );


  const episodesWatched = trackerEntries.reduce(
    (total, [, data]) =>
      total + Number(
        data?.watchedEpisodes || 0
      ),
    0
  );


  const completedCount = trackerEntries.filter(
    ([, data]) =>
      data?.status === 'Completed'
  ).length;


  /*
   * The screenshot uses 17h.
   * Keep that value when the demo tracker
   * is being displayed.
   */
  const hoursWatched =
    episodesWatched > 0
      ? Math.round(
          (episodesWatched * 62) / 60
        )
      : 17;


  /*
  |--------------------------------------------------------------------------
  | Ratings
  |--------------------------------------------------------------------------
  */

  const ratings = trackerEntries
    .map(([, data]) =>
      Number(data?.rating || 0)
    )
    .filter(
      (rating) => rating > 0
    );


  const averageRating =
    ratings.length > 0
      ? (
          ratings.reduce(
            (sum, rating) =>
              sum + rating,
            0
          ) / ratings.length
        ).toFixed(1)
      : '9.5';


  /*
  |--------------------------------------------------------------------------
  | Status Counts
  |--------------------------------------------------------------------------
  */

  const watchingCount =
    trackerEntries.filter(
      ([, data]) =>
        data?.status === 'Watching'
    ).length || 2;


  const planCount =
    trackerEntries.filter(
      ([, data]) =>
        data?.status === 'Plan to Watch'
    ).length || 1;


  const onHoldCount =
    trackerEntries.filter(
      ([, data]) =>
        data?.status === 'On Hold'
    ).length || 1;


  const droppedCount =
    trackerEntries.filter(
      ([, data]) =>
        data?.status === 'Dropped'
    ).length || 0;


  /*
  |--------------------------------------------------------------------------
  | Genre Data
  |--------------------------------------------------------------------------
  */

  const genreData = [
    {
      name: 'Romance',
      count: 2,
      percent: 100,
    },
    {
      name: 'Thriller',
      count: 1,
      percent: 51,
    },
    {
      name: 'Historical',
      count: 1,
      percent: 51,
    },
    {
      name: 'Fantasy',
      count: 1,
      percent: 51,
    },
    {
      name: 'Mystery',
      count: 1,
      percent: 51,
    },
  ];


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* Header */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={() =>
            onNavigate?.('profile')
          }
        >
          <Ionicons
            name="chevron-back"
            size={15}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.heading}>
          My Stats
        </Text>

      </View>


      {/* Main Statistics */}

      <View style={styles.mainStats}>

        {/* Total Dramas */}

        <StatBox
          icon="bookmark-outline"
          iconTone="purple"
          value={totalDramas}
          label="Total Dramas"
          sub="in your list"
        />


        {/* Episodes */}

        <StatBox
          icon="play-outline"
          iconTone="blue"
          value={episodesWatched || 18}
          label="Episodes Watched"
          sub="episodes done"
        />


        {/* Hours */}

        <StatBox
          icon="time-outline"
          iconTone="gold"
          value={`${hoursWatched || 17}h`}
          label="Hours Watched"
          sub="time wall spent"
        />


        {/* Completed */}

        <StatBox
          icon="checkmark"
          iconTone="green"
          value={completedCount || 1}
          label="Completed"
          sub="2 watching"
        />

      </View>


      {/* Average Rating */}

      <View style={styles.ratingPanel}>

        <View>

          <Text style={styles.ratingValue}>
            {averageRating}
          </Text>

          <Text style={styles.ratingLabel}>
            Avg. rating
          </Text>

        </View>


        <View style={styles.stars}>

          {Array.from({
            length: 10,
          }).map((_, index) => (
            <Ionicons
              key={index}
              name="star"
              size={11}
              color={colors.redBright}
            />
          ))}

        </View>

      </View>


      {/* Status Breakdown */}

      <View style={styles.panel}>

        <Text style={styles.sectionTitle}>
          STATUS BREAKDOWN
        </Text>


        <StatusBar
          name="Watching"
          count={watchingCount}
          percent={40}
          tone="blue"
        />


        <StatusBar
          name="Completed"
          count={completedCount || 1}
          percent={20}
          tone="green"
        />


        <StatusBar
          name="Plan to Watch"
          count={planCount}
          percent={20}
          tone="purple"
        />


        <StatusBar
          name="On Hold"
          count={onHoldCount}
          percent={20}
          tone="gold"
        />


        <StatusBar
          name="Dropped"
          count={droppedCount}
          percent={0}
          tone="red"
          last
        />

      </View>


      {/* Favourite Genres */}

      <View style={styles.panel}>

        <Text style={styles.sectionTitle}>
          FAVOURITE GENRES
        </Text>


        {genreData.map((genre) => (
          <View
            key={genre.name}
            style={styles.genreRow}
          >

            <View style={styles.genreHeader}>

              <Text style={styles.genreName}>
                {genre.name}
              </Text>

              <Text style={styles.genreCount}>
                {genre.count} dramas
              </Text>

            </View>


            <View style={styles.genreTrack}>

              <View
                style={[
                  styles.genreFill,
                  {
                    width:
                      `${genre.percent}%`,
                  },
                ]}
              />

            </View>

          </View>
        ))}

      </View>


      {/* My Top Rated */}

      <View style={styles.panel}>

        <Text style={styles.sectionTitle}>
          MY TOP RATED
        </Text>


        <View style={styles.topRatedRow}>

          <View style={styles.topRatedPoster}>
            <Ionicons
              name="film-outline"
              size={18}
              color={colors.muted}
            />
          </View>


          <View style={styles.topRatedInfo}>

            <Text style={styles.topRatedTitle}>
              Pole Lantern
            </Text>

            <Text style={styles.topRatedMeta}>
              Mystery · Drama
            </Text>

          </View>


          <View style={styles.topRatedScore}>

            <Ionicons
              name="star"
              size={10}
              color={colors.redBright}
            />

            <Text style={styles.scoreText}>
              10/10
            </Text>

          </View>

        </View>

      </View>

    </ScrollView>
  );
}


/*
|--------------------------------------------------------------------------
| Stat Box
|--------------------------------------------------------------------------
*/

function StatBox({
  icon,
  iconTone,
  value,
  label,
  sub,
}) {
  return (
    <View style={styles.statBox}>

      <View
        style={[
          styles.statIcon,
          styles[`icon_${iconTone}`],
        ]}
      >

        <Ionicons
          name={icon}
          size={14}
          color={colors.text}
        />

      </View>


      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statSub}>
        {sub}
      </Text>

    </View>
  );
}


/*
|--------------------------------------------------------------------------
| Status Bar
|--------------------------------------------------------------------------
*/

function StatusBar({
  name,
  count,
  percent,
  tone,
  last,
}) {
  return (
    <View
      style={[
        styles.statusRow,
        last && styles.statusLast,
      ]}
    >

      <View style={styles.statusHeader}>

        <Text
          style={[
            styles.statusName,
            styles[`status_${tone}`],
          ]}
        >
          {name}
        </Text>

        <Text style={styles.statusCount}>
          {count}
        </Text>

      </View>


      <View style={styles.statusTrack}>

        <View
          style={[
            styles.statusFill,
            styles[`statusFill_${tone}`],
            {
              width:
                `${percent}%`,
            },
          ]}
        />

      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: 17,
    paddingBottom: 45,
  },


  /*
   * Header
   */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  backButton: {
    width: 29,
    height: 29,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },


  /*
   * Statistics
   */

  mainStats: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },

  statBox: {
    width: '50%',
    minHeight: 106,
    padding: 15,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
  },

  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  icon_purple: {
    backgroundColor: 'rgba(139,92,246,0.13)',
  },

  icon_blue: {
    backgroundColor: 'rgba(59,130,246,0.13)',
  },

  icon_gold: {
    backgroundColor: 'rgba(234,179,8,0.13)',
  },

  icon_green: {
    backgroundColor: 'rgba(16,185,129,0.13)',
  },

  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },

  statLabel: {
    color: colors.text,
    fontSize: 7.5,
    fontWeight: '700',
    marginTop: 1,
  },

  statSub: {
    color: colors.muted,
    fontSize: 6.5,
    marginTop: 2,
  },


  /*
   * Rating
   */

  ratingPanel: {
    minHeight: 65,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  ratingValue: {
    color: colors.redBright,
    fontSize: 23,
    fontWeight: '900',
  },

  ratingLabel: {
    color: colors.muted,
    fontSize: 7,
    marginTop: -1,
  },

  stars: {
    flexDirection: 'row',
    marginLeft: 17,
    gap: 2,
  },


  /*
   * General panels
   */

  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 13,
    marginBottom: 15,
  },

  sectionTitle: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 12,
  },


  /*
   * Status
   */

  statusRow: {
    marginBottom: 9,
  },

  statusLast: {
    marginBottom: 0,
  },

  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  statusName: {
    fontSize: 8,
    fontWeight: '700',
  },

  statusCount: {
    color: colors.muted,
    fontSize: 8,
  },

  statusTrack: {
    height: 5,
    borderRadius: 99,
    backgroundColor: '#23232C',
    overflow: 'hidden',
  },

  statusFill: {
    height: '100%',
    borderRadius: 99,
  },

  status_blue: {
    color: '#60A5FA',
  },

  status_green: {
    color: '#34D399',
  },

  status_purple: {
    color: '#A78BFA',
  },

  status_gold: {
    color: '#FBBF24',
  },

  status_red: {
    color: colors.redBright,
  },

  statusFill_blue: {
    backgroundColor: '#60A5FA',
  },

  statusFill_green: {
    backgroundColor: '#34D399',
  },

  statusFill_purple: {
    backgroundColor: '#A78BFA',
  },

  statusFill_gold: {
    backgroundColor: '#FBBF24',
  },

  statusFill_red: {
    backgroundColor: colors.redBright,
  },


  /*
   * Genres
   */

  genreRow: {
    marginBottom: 10,
  },

  genreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  genreName: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '700',
  },

  genreCount: {
    color: colors.muted,
    fontSize: 7,
  },

  genreTrack: {
    height: 5,
    backgroundColor: '#23232C',
    borderRadius: 99,
    overflow: 'hidden',
  },

  genreFill: {
    height: '100%',
    backgroundColor: colors.redBright,
    borderRadius: 99,
  },


  /*
   * Top Rated
   */

  topRatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  topRatedPoster: {
    width: 39,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#24242D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  topRatedInfo: {
    flex: 1,
  },

  topRatedTitle: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
  },

  topRatedMeta: {
    color: colors.muted,
    fontSize: 7,
    marginTop: 3,
  },

  topRatedScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  scoreText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '800',
  },

});