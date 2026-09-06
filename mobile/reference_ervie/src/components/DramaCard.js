import React from 'react';

import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme';


export default function DramaCard({
  drama,
  onPress,
}) {
  if (!drama) {
    return null;
  }

  const rating =
    Number(drama.rating) || 0;

  const image =
    drama.image ||
    drama.imageUrl ||
    drama.poster ||
    drama.posterUrl ||
    drama.thumbnail ||
    drama.cover ||
    null;

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.card,

        hovered &&
          styles.cardHover,

        pressed &&
          styles.cardPressed,
      ]}
      onPress={() =>
        onPress?.(drama)
      }
    >
      {({ pressed, hovered }) => (
        <>
          {/* ============================================================
              POSTER
          ============================================================ */}

          <View
            style={[
              styles.posterWrap,

              hovered &&
                styles.posterWrapHover,
            ]}
          >
            {image ? (
              <Image
                source={{
                  uri: image,
                }}
                style={[
                  styles.poster,

                  hovered &&
                    styles.posterHover,
                ]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.posterFallback,

                  hovered &&
                    styles.posterFallbackHover,
                ]}
              />
            )}


            {/* TOP LEFT BADGE */}

            {drama.badge ? (
              <View
                style={[
                  styles.badge,

                  hovered &&
                    styles.badgeHover,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,

                    hovered &&
                      styles.badgeTextHover,
                  ]}
                >
                  {drama.badge}
                </Text>
              </View>
            ) : null}


            {/* TOP RIGHT STATUS */}

            {drama.status ? (
              <View
                style={[
                  styles.statusBadge,

                  hovered &&
                    styles.statusBadgeHover,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,

                    hovered &&
                      styles.statusTextHover,
                  ]}
                >
                  {drama.status}
                </Text>
              </View>
            ) : null}


            {/* RATING */}

            {rating > 0 ? (
              <View
                style={[
                  styles.ratingBadge,

                  hovered &&
                    styles.ratingBadgeHover,
                ]}
              >
                <Text
                  style={[
                    styles.ratingText,

                    hovered &&
                      styles.ratingTextHover,
                  ]}
                >
                  ★ {rating.toFixed(1)}
                </Text>
              </View>
            ) : null}


            {/* HOVER OVERLAY */}

            {hovered ? (
              <View
                pointerEvents="none"
                style={styles.hoverOverlay}
              />
            ) : null}

          </View>


          {/* ============================================================
              TITLE
          ============================================================ */}

          <Text
            style={[
              styles.title,

              hovered &&
                styles.titleHover,
            ]}
            numberOfLines={1}
          >
            {drama.title ||
              'Untitled Drama'}
          </Text>


          {/* ============================================================
              META
          ============================================================ */}

          <Text
            style={[
              styles.meta,

              hovered &&
                styles.metaHover,
            ]}
            numberOfLines={1}
          >
            {drama.genre ||
              'Drama'}

            {drama.episodes
              ? ` · ${drama.episodes} eps`
              : ''}
          </Text>

        </>
      )}
    </Pressable>
  );
}


const styles = StyleSheet.create({

  /* ================================================================
     CARD
  ================================================================ */

  card: {
    width: '100%',
    minWidth: 0,
    marginBottom: 0,
    borderRadius: 12,
  },

  cardHover: {
    transform: [
      {
        translateY: -4,
      },
      {
        scale: 1.012,
      },
    ],
  },

  cardPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },


  /* ================================================================
     POSTER
  ================================================================ */

  posterWrap: {
    width: '100%',
    aspectRatio: 0.78,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    position: 'relative',
    marginBottom: 6,
  },

  posterWrapHover: {
    borderColor: colors.red,
    backgroundColor: colors.panel2,
    elevation: 7,

    transform: [
      {
        scale: 1.015,
      },
    ],
  },

  poster: {
    width: '100%',
    height: '100%',
  },

  posterHover: {
    transform: [
      {
        scale: 1.035,
      },
    ],
  },

  posterFallback: {
    flex: 1,
    backgroundColor: colors.panel2,
  },

  posterFallbackHover: {
    backgroundColor: colors.panel,
  },


  /* ================================================================
     HOVER OVERLAY
  ================================================================ */

  hoverOverlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      'rgba(232,33,63,0.055)',

    borderRadius: 10,
  },


  /* ================================================================
     TOP LEFT BADGE
  ================================================================ */

  badge: {
    position: 'absolute',

    top: 7,
    left: 7,

    backgroundColor:
      'rgba(7,7,14,0.88)',

    borderRadius: 5,

    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  badgeHover: {
    backgroundColor:
      'rgba(232,33,63,0.88)',

    transform: [
      {
        scale: 1.05,
      },
    ],
  },

  badgeText: {
    color: '#F0EEE8',
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '900',
  },

  badgeTextHover: {
    color: '#FFFFFF',
  },


  /* ================================================================
     TOP RIGHT STATUS
  ================================================================ */

  statusBadge: {
    position: 'absolute',

    top: 7,
    right: 7,

    backgroundColor:
      'rgba(20,20,30,0.88)',

    borderRadius: 5,

    paddingHorizontal: 6,
    paddingVertical: 4,

    maxWidth: '45%',
  },

  statusBadgeHover: {
    backgroundColor:
      'rgba(232,33,63,0.18)',

    borderWidth: 1,
    borderColor: colors.redBright,
  },

  statusText: {
    color: '#BBA8FF',
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '800',
  },

  statusTextHover: {
    color: colors.redBright,
  },


  /* ================================================================
     RATING
  ================================================================ */

  ratingBadge: {
    position: 'absolute',

    left: 7,
    bottom: 7,

    backgroundColor:
      'rgba(7,7,14,0.82)',

    borderRadius: 5,

    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  ratingBadgeHover: {
    backgroundColor:
      'rgba(7,7,14,0.94)',

    transform: [
      {
        scale: 1.06,
      },
    ],
  },

  ratingText: {
    color: colors.gold,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
  },

  ratingTextHover: {
    fontWeight: '900',
  },


  /* ================================================================
     TITLE
  ================================================================ */

  title: {
    width: '100%',

    color: colors.text,

    fontSize: 10,
    lineHeight: 13,

    fontWeight: '900',

    marginTop: 1,
  },

  titleHover: {
    color: colors.redBright,
  },


  /* ================================================================
     META
  ================================================================ */

  meta: {
    width: '100%',

    color: colors.muted,

    fontSize: 7.5,
    lineHeight: 10,

    marginTop: 2,
  },

  metaHover: {
    color: colors.text,
  },

});