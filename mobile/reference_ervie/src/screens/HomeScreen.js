import React from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { dramas } from '../data/dramas';


export default function HomeScreen({
  onOpenDrama,
  onNavigate,
  addedDramas = [],
}) {

  const { width } = useWindowDimensions();

  /*
  |--------------------------------------------------------------------------
  | Responsive sizing
  |--------------------------------------------------------------------------
  */

  const isSmallPhone = width <= 380;

  const horizontalPadding =
    isSmallPhone ? 10 : 12;


  /*
  |--------------------------------------------------------------------------
  | Recommended dramas
  |--------------------------------------------------------------------------
  */

  const recommendedDramas =
    dramas.slice(0, 6);


  /*
  |--------------------------------------------------------------------------
  | Watching drama
  |--------------------------------------------------------------------------
  */

  const watchingDrama =
    dramas.find((drama) =>
      String(drama?.title || '')
        .toLowerCase()
        .includes('midnight')
    ) ||
    dramas[0] ||
    null;


  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const listedCount =
    addedDramas.length > 0
      ? addedDramas.length
      : 4;

  const watchingCount = 1;
  const completedCount = 1;
  const hoursWatched = 17;


  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleOpenDrama = (drama) => {
    if (
      drama &&
      typeof onOpenDrama === 'function'
    ) {
      onOpenDrama(drama);
    }
  };


  const handleNavigate = (page) => {
    if (
      typeof onNavigate === 'function'
    ) {
      onNavigate(page);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <View style={styles.screen}>

      {/* ============================================================
          TOP MOBILE HEADER
      ============================================================ */}

      <View style={styles.topBar}>

        <Text style={styles.logo}>
          SarangTV
        </Text>


        <View style={styles.topBarRight}>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.topIconButton,
              hovered && styles.topIconButtonHovered,
              pressed && styles.topIconButtonPressed,
            ]}
            onPress={() =>
              handleNavigate('discover')
            }
            accessibilityLabel="Search"
          >

            <Ionicons
              name="search-outline"
              size={20}
              color={colors.text}
            />

          </Pressable>


          <Pressable
            style={({ pressed, hovered }) => [
              styles.avatarButton,
              hovered && styles.avatarButtonHovered,
              pressed && styles.avatarButtonPressed,
            ]}
            onPress={() =>
              handleNavigate('profile')
            }
            accessibilityLabel="Profile"
          >

            <Ionicons
              name="person"
              size={14}
              color="#D9D5FF"
            />

          </Pressable>

        </View>

      </View>


      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal:
              horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ==========================================================
            GREETING
        ========================================================== */}

        <View style={styles.greetingBlock}>

          <Text style={styles.greeting}>
            Annyeong, Ji-young! ♡
          </Text>


          <View style={styles.subtitleRow}>

            <Text style={styles.korean}>
              무슨 드라마 볼까?
            </Text>

            <Text style={styles.english}>
              What drama should we watch?
            </Text>

          </View>

        </View>


        {/* ==========================================================
            STATISTICS
        ========================================================== */}

        <View style={styles.statsGrid}>

          <StatCard
            value={listedCount}
            label="Listed"
            sublabel="in your list"
            icon="bookmark-outline"
            iconColor="#7C6DAA"
          />


          <StatCard
            value={watchingCount}
            label="Watching"
            sublabel="airing now"
            icon="play-outline"
            iconColor="#6C85B4"
          />


          <StatCard
            value={completedCount}
            label="Completed"
            sublabel="finished"
            icon="checkmark-outline"
            iconColor="#4FA477"
          />


          <StatCard
            value={hoursWatched}
            suffix="h"
            label="Hours"
            sublabel="time watched"
            icon="time-outline"
            iconColor="#C59B4A"
          />

        </View>


        {/* ==========================================================
            WATCHING PROGRESS
        ========================================================== */}

        <SectionTitle text="WATCHING PROGRESS" />


        <WatchingCard
          drama={watchingDrama}
          onOpenDrama={handleOpenDrama}
        />


        {/* ==========================================================
            QUICK ACCESS
        ========================================================== */}

        <SectionTitle text="QUICK ACCESS" />


        <View style={styles.quickGrid}>

          <QuickAccess
            icon="reader-outline"
            iconBackground="#252441"
            title="My Tracker"
            onPress={() =>
              handleNavigate('tracker')
            }
          />


          <QuickAccess
            icon="add"
            iconBackground="#302548"
            title="Add Drama"
            onPress={() =>
              handleNavigate('add-drama')
            }
          />


          <QuickAccess
            icon="pause"
            iconBackground="#322A3C"
            title="On Hold"
            onPress={() =>
              handleNavigate('tracker')
            }
          />


          <QuickAccess
            icon="ticket-outline"
            iconBackground="#252A43"
            title="Plan to Watch"
            onPress={() =>
              handleNavigate('tracker')
            }
          />

        </View>


        {/* ==========================================================
            RECOMMENDED
        ========================================================== */}

        <SectionTitle text="RECOMMENDED" />


        <View style={styles.recommendedGrid}>

          {recommendedDramas
            .slice(0, 4)
            .map((drama, index) => (

              <RecommendedCard
                key={String(
                  drama?.id ?? index
                )}
                drama={drama}
                rank={index + 1}
                onPress={() =>
                  handleOpenDrama(drama)
                }
              />

            ))}

        </View>


        {/* Bottom spacing */}

        <View style={styles.bottomSpace} />

      </ScrollView>

    </View>
  );
}


/* ================================================================
   STAT CARD
================================================================ */

function StatCard({
  value,
  suffix,
  label,
  sublabel,
  icon,
  iconColor,
}) {

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.statCard,
        hovered && styles.statCardHovered,
        pressed && styles.statCardPressed,
      ]}
    >

      <View style={styles.statTop}>

        <Text style={styles.statValue}>
          {value}
          {suffix || ''}
        </Text>


        <View style={styles.statIconBox}>

          <Ionicons
            name={icon}
            size={14}
            color={iconColor}
          />

        </View>

      </View>


      <Text style={styles.statLabel}>
        {label}
      </Text>


      <Text style={styles.statSublabel}>
        {sublabel}
      </Text>

    </Pressable>
  );
}


/* ================================================================
   WATCHING CARD
================================================================ */

function WatchingCard({
  drama,
  onOpenDrama,
}) {

  if (!drama) {

    return (
      <View style={styles.watchingCard}>

        <Text style={styles.watchingEyebrow}>
          ● WATCHING PROGRESS
        </Text>

        <Text style={styles.noWatchingText}>
          Add a drama to start tracking
          your progress.
        </Text>

      </View>
    );
  }


  const episode = 4;


  const totalEpisodes =
    Number(drama.episodes) || 1;


  const progress =
    Math.min(
      100,
      Math.round(
        (episode / totalEpisodes) * 100
      )
    );


  return (
    <View style={styles.watchingCard}>

      {/* Header */}

      <View style={styles.watchingHeader}>

        <Text style={styles.watchingEyebrow}>
          ● WATCHING PROGRESS
        </Text>

        <Text style={styles.watchingPercent}>
          {progress}%
        </Text>

      </View>


      {/* Main drama area */}

      <Pressable
        style={({ pressed, hovered }) => [
          styles.watchingMain,
          hovered && styles.watchingMainHovered,
          pressed && styles.watchingMainPressed,
        ]}
        onPress={() =>
          onOpenDrama(drama)
        }
      >

        <Image
          source={{
            uri: drama.image,
          }}
          style={styles.watchingImage}
          resizeMode="cover"
        />


        <View style={styles.watchingInfo}>

          <Text
            style={styles.watchingTitle}
            numberOfLines={1}
          >
            {drama.title}
          </Text>


          <Text
            style={styles.watchingEpisode}
            numberOfLines={1}
          >
            Episode {episode} of {totalEpisodes}
            {' · '}
            {drama.runtime || '65m'}
          </Text>


          {/* Progress */}

          <View style={styles.progressTrack}>

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

        </View>

      </Pressable>


      {/* Footer */}

      <View style={styles.watchingFooter}>

        <View>

          <Text style={styles.loggedLabel}>
            LOGGED
          </Text>

          <Text style={styles.loggedValue}>
            {episode} eps
          </Text>

        </View>


        <View style={styles.watchingActions}>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.detailsButton,
              hovered && styles.detailsButtonHovered,
              pressed && styles.detailsButtonPressed,
            ]}
            onPress={() =>
              onOpenDrama(drama)
            }
          >

            <Text style={styles.detailsButtonText}>
              Details
            </Text>

          </Pressable>


          <Pressable
            style={({ pressed, hovered }) => [
              styles.logButton,
              hovered && styles.logButtonHovered,
              pressed && styles.logButtonPressed,
            ]}
            onPress={() =>
              onOpenDrama(drama)
            }
          >

            <Ionicons
              name="checkmark"
              size={12}
              color="#07100D"
            />


            <Text style={styles.logButtonText}>
              Log Ep {episode}
            </Text>

          </Pressable>

        </View>

      </View>

    </View>
  );
}


/* ================================================================
   SECTION TITLE
================================================================ */

function SectionTitle({
  text,
}) {

  return (
    <Text style={styles.sectionTitle}>
      {text}
    </Text>
  );
}


/* ================================================================
   QUICK ACCESS
================================================================ */

function QuickAccess({
  icon,
  iconBackground,
  title,
  onPress,
}) {

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.quickCard,
        hovered && styles.quickCardHovered,
        pressed && styles.quickCardPressed,
      ]}
      onPress={onPress}
    >

      <View
        style={[
          styles.quickIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >

        <Ionicons
          name={icon}
          size={16}
          color="#B8A5FF"
        />

      </View>


      <Text
        style={styles.quickTitle}
        numberOfLines={1}
      >
        {title}
      </Text>


      <Ionicons
        name="chevron-forward"
        size={12}
        color={colors.muted}
      />

    </Pressable>
  );
}


/* ================================================================
   RECOMMENDED CARD
================================================================ */

function RecommendedCard({
  drama,
  rank,
  onPress,
}) {

  const rating =
    Number(drama?.rating) || 0;


  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.recommendedCard,
        hovered && styles.recommendedCardHovered,
        pressed && styles.recommendedCardPressed,
      ]}
      onPress={onPress}
    >

      <View style={styles.posterWrapper}>

        <Image
          source={{
            uri: drama?.image,
          }}
          style={styles.recommendedImage}
          resizeMode="cover"
        />


        <View style={styles.rankBadge}>

          <Text style={styles.rankText}>
            TOP {rank}
          </Text>

        </View>


        <View style={styles.ratingBadge}>

          <Text style={styles.ratingText}>
            ★ {rating.toFixed(1)}
          </Text>

        </View>

      </View>


      <Text
        style={styles.recommendedTitle}
        numberOfLines={1}
      >
        {drama?.title ||
          'Untitled Drama'}
      </Text>


      <Text
        style={styles.recommendedMeta}
        numberOfLines={1}
      >
        {drama?.genre || 'Drama'}
        {' · '}
        {drama?.episodes || 0} eps
      </Text>

    </Pressable>
  );
}


/* ================================================================
   STYLES
================================================================ */

const styles = StyleSheet.create({

  /* ================================================================
     SCREEN
  ================================================================ */

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },


  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },


  content: {
    paddingTop: 14,
    paddingBottom: 20,
  },


  /* ================================================================
     TOP BAR
  ================================================================ */

  topBar: {
    height: 45,

    paddingHorizontal: 10,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    backgroundColor:
      colors.bg,

    borderBottomWidth: 1,

    borderBottomColor:
      'rgba(255,255,255,0.06)',
  },


  logo: {
    color: '#E9A8B8',

    fontSize: 16,

    fontWeight: '900',

    letterSpacing: -0.4,
  },


  topBarRight: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,
  },


  topIconButton: {
    width: 28,

    height: 32,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 8,
  },


  topIconButtonHovered: {
    backgroundColor:
      'rgba(255,255,255,0.07)',

    transform: [
      {
        scale: 1.05,
      },
    ],
  },


  topIconButtonPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.94,
      },
    ],
  },


  avatarButton: {
    width: 25,

    height: 25,

    borderRadius: 999,

    backgroundColor:
      '#292546',

    borderWidth: 1,

    borderColor:
      '#B24B65',

    alignItems: 'center',

    justifyContent: 'center',
  },


  avatarButtonHovered: {
    backgroundColor:
      '#3A315E',

    borderColor:
      '#E9A8B8',

    transform: [
      {
        scale: 1.08,
      },
    ],
  },


  avatarButtonPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.95,
      },
    ],
  },


  /* ================================================================
     GREETING
  ================================================================ */

  greetingBlock: {
    marginBottom: 12,
  },


  greeting: {
    color: colors.text,

    fontSize: 23,

    lineHeight: 27,

    fontWeight: '900',

    letterSpacing: -0.7,
  },


  subtitleRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 3,

    flexWrap: 'wrap',
  },


  korean: {
    color: '#D8CDD1',

    fontSize: 9,

    fontWeight: '700',

    marginRight: 6,
  },


  english: {
    color: colors.muted,

    fontSize: 8.5,

    fontStyle: 'italic',
  },


  /* ================================================================
     STATISTICS
  ================================================================ */

  statsGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent:
      'space-between',

    marginBottom: 13,
  },


  statCard: {
    width: '48.5%',

    height: 74,

    backgroundColor:
      '#111119',

    borderWidth: 1,

    borderColor:
      colors.line,

    borderRadius: 12,

    paddingHorizontal: 10,

    paddingVertical: 9,

    marginBottom: 8,
  },


  statCardHovered: {
    backgroundColor:
      '#181722',

    borderColor:
      '#4A4558',

    transform: [
      {
        translateY: -2,
      },
      {
        scale: 1.015,
      },
    ],
  },


  statCardPressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },


  statTop: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',
  },


  statValue: {
    color: colors.text,

    fontSize: 21,

    lineHeight: 22,

    fontWeight: '900',
  },


  statIconBox: {
    width: 22,

    height: 22,

    borderRadius: 6,

    backgroundColor:
      '#1B1A26',

    alignItems: 'center',

    justifyContent: 'center',
  },


  statLabel: {
    color: '#DDD8DD',

    fontSize: 9.5,

    fontWeight: '800',

    marginTop: 4,
  },


  statSublabel: {
    color: '#77727F',

    fontSize: 7.5,

    marginTop: 1,
  },


  /* ================================================================
     SECTION TITLES
  ================================================================ */

  sectionTitle: {
    color: '#77727F',

    fontSize: 7.5,

    fontWeight: '900',

    letterSpacing: 1.3,

    marginBottom: 7,

    marginTop: 2,
  },


  /* ================================================================
     WATCHING CARD
  ================================================================ */

  watchingCard: {
    width: '100%',

    backgroundColor:
      '#0F0F16',

    borderWidth: 1,

    borderColor:
      colors.line,

    borderRadius: 12,

    padding: 10,

    marginBottom: 13,
  },


  watchingHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    marginBottom: 8,
  },


  watchingEyebrow: {
    color: '#5A9A85',

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 1.05,
  },


  watchingPercent: {
    color: '#42D4A7',

    fontSize: 8,

    fontWeight: '900',
  },


  watchingMain: {
    flexDirection: 'row',

    alignItems: 'center',

    borderRadius: 9,

    padding: 4,
  },


  watchingMainHovered: {
    backgroundColor:
      'rgba(255,255,255,0.035)',

    transform: [
      {
        scale: 1.008,
      },
    ],
  },


  watchingMainPressed: {
    opacity: 0.7,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },


  watchingImage: {
    width: 43,

    height: 43,

    borderRadius: 999,

    backgroundColor:
      '#242431',
  },


  watchingInfo: {
    flex: 1,

    marginLeft: 9,

    minWidth: 0,
  },


  watchingTitle: {
    color: colors.text,

    fontSize: 11,

    lineHeight: 14,

    fontWeight: '900',
  },


  watchingEpisode: {
    color: '#AAA4AC',

    fontSize: 7.5,

    marginTop: 2,
  },


  progressTrack: {
    width: '100%',

    height: 3,

    backgroundColor:
      '#292832',

    borderRadius: 999,

    overflow: 'hidden',

    marginTop: 6,
  },


  progressFill: {
    height: '100%',

    backgroundColor:
      '#32C89A',

    borderRadius: 999,
  },


  watchingFooter: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    marginTop: 8,
  },


  loggedLabel: {
    color: '#66626E',

    fontSize: 6.5,

    fontWeight: '800',
  },


  loggedValue: {
    color: '#D7D2D6',

    fontSize: 8,

    fontWeight: '700',

    marginTop: 1,
  },


  watchingActions: {
    flexDirection: 'row',

    alignItems: 'center',
  },


  detailsButton: {
    height: 27,

    paddingHorizontal: 9,

    borderRadius: 7,

    borderWidth: 1,

    borderColor:
      '#34333C',

    backgroundColor:
      '#1B1A21',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 5,
  },


  detailsButtonHovered: {
    backgroundColor:
      '#272531',

    borderColor:
      '#514D60',

    transform: [
      {
        translateY: -1,
      },
    ],
  },


  detailsButtonPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },


  detailsButtonText: {
    color: '#C6C1C5',

    fontSize: 7.5,

    fontWeight: '700',
  },


  logButton: {
    height: 27,

    paddingHorizontal: 8,

    borderRadius: 7,

    backgroundColor:
      '#35CDA0',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },


  logButtonHovered: {
    backgroundColor:
      '#4AE0B2',

    transform: [
      {
        translateY: -1,
      },
      {
        scale: 1.025,
      },
    ],
  },


  logButtonPressed: {
    opacity: 0.72,

    transform: [
      {
        scale: 0.96,
      },
    ],
  },


  logButtonText: {
    color: '#07100D',

    fontSize: 7.5,

    fontWeight: '900',

    marginLeft: 3,
  },


  noWatchingText: {
    color: colors.muted,

    fontSize: 9,

    textAlign: 'center',

    paddingVertical: 18,
  },


  /* ================================================================
     QUICK ACCESS
  ================================================================ */

  quickGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent:
      'space-between',

    marginBottom: 13,
  },


  quickCard: {
    width: '48.5%',

    height: 47,

    backgroundColor:
      '#13131D',

    borderWidth: 1,

    borderColor:
      colors.line,

    borderRadius: 10,

    paddingHorizontal: 8,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 7,
  },


  quickCardHovered: {
    backgroundColor:
      '#1B1A27',

    borderColor:
      '#4A4558',

    transform: [
      {
        translateY: -2,
      },
      {
        scale: 1.015,
      },
    ],
  },


  quickCardPressed: {
    opacity: 0.65,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },


  quickIcon: {
    width: 27,

    height: 27,

    borderRadius: 7,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 7,
  },


  quickTitle: {
    flex: 1,

    color: '#DDD9DE',

    fontSize: 8.5,

    lineHeight: 11,

    fontWeight: '800',
  },


  /* ================================================================
     RECOMMENDED
  ================================================================ */

  recommendedGrid: {
    width: '100%',

    flexDirection: 'row',

    justifyContent:
      'space-between',
  },


  recommendedCard: {
    width: '23.7%',

    minWidth: 0,

    borderRadius: 9,
  },


  recommendedCardHovered: {
    transform: [
      {
        translateY: -4,
      },
      {
        scale: 1.025,
      },
    ],

    opacity: 0.96,
  },


  recommendedCardPressed: {
    opacity: 0.7,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },


  posterWrapper: {
    width: '100%',

    aspectRatio: 0.69,

    borderRadius: 8,

    overflow: 'hidden',

    position: 'relative',

    backgroundColor:
      '#171720',

    borderWidth: 1,

    borderColor:
      colors.line,
  },


  recommendedImage: {
    width: '100%',

    height: '100%',
  },


  rankBadge: {
    position: 'absolute',

    top: 5,

    left: 4,

    backgroundColor:
      '#EFA500',

    paddingHorizontal: 4,

    paddingVertical: 2,

    borderRadius: 4,
  },


  rankText: {
    color: '#FFF',

    fontSize: 5.5,

    fontWeight: '900',
  },


  ratingBadge: {
    position: 'absolute',

    bottom: 4,

    left: 4,

    backgroundColor:
      'rgba(7, 7, 14, 0.80)',

    paddingHorizontal: 4,

    paddingVertical: 2,

    borderRadius: 4,
  },


  ratingText: {
    color: '#F3A0B4',

    fontSize: 6.5,

    fontWeight: '900',
  },


  recommendedTitle: {
    color: '#E6E1E3',

    fontSize: 7.5,

    lineHeight: 10,

    fontWeight: '800',

    marginTop: 5,
  },


  recommendedMeta: {
    color: '#77727F',

    fontSize: 6.5,

    marginTop: 2,
  },


  /* ================================================================
     BOTTOM SPACE
  ================================================================ */

  bottomSpace: {
    height: 35,
  },

});