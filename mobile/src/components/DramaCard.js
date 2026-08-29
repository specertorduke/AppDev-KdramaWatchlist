import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme';

export default function DramaCard({ drama, onPress }) {
  if (!drama) return null;

  const rating = Number(drama.rating) || 0;
  const image =
    drama.poster_url ||
    drama.poster ||
    drama.image ||
    drama.imageUrl ||
    drama.backdrop_url ||
    null;

  const title = drama.title || drama.name || 'Untitled Drama';
  const genres = Array.isArray(drama.genres) 
    ? drama.genres.join(', ') 
    : drama.genre || 'Drama';
  const episodes = drama.total_episodes || drama.episodes;

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.card,
        hovered && styles.cardHover,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress?.(drama)}
    >
      {({ pressed, hovered }) => (
        <>
          <View style={[styles.posterWrap, hovered && styles.posterWrapHover]}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={[styles.poster, hovered && styles.posterHover]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.posterFallback, hovered && styles.posterFallbackHover]} />
            )}

            {/* Status / Badge */}
            {drama.watch_status || drama.status ? (
              <View style={[styles.statusBadge, hovered && styles.statusBadgeHover]}>
                <Text style={[styles.statusText, hovered && styles.statusTextHover]}>
                  {String(drama.watch_status || drama.status).replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            ) : null}

            {/* Rating */}
            {rating > 0 ? (
              <View style={[styles.ratingBadge, hovered && styles.ratingBadgeHover]}>
                <Text style={styles.ratingText}>★ {rating.toFixed(1)}</Text>
              </View>
            ) : null}

            {hovered && <View pointerEvents="none" style={styles.hoverOverlay} />}
          </View>

          <Text style={[styles.title, hovered && styles.titleHover]} numberOfLines={1}>
            {title}
          </Text>

          <Text style={[styles.meta, hovered && styles.metaHover]} numberOfLines={1}>
            {genres} {episodes ? `· ${episodes} eps` : ''}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 0,
    borderRadius: 12,
  },
  cardHover: {
    transform: [{ translateY: -4 }, { scale: 1.012 }],
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
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
    transform: [{ scale: 1.015 }],
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterHover: {
    transform: [{ scale: 1.035 }],
  },
  posterFallback: {
    flex: 1,
    backgroundColor: colors.panel2,
  },
  posterFallbackHover: {
    backgroundColor: colors.panel,
  },
  hoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232,33,63,0.055)',
    borderRadius: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: 'rgba(20,20,30,0.88)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    maxWidth: '55%',
  },
  statusBadgeHover: {
    backgroundColor: 'rgba(232,33,63,0.18)',
    borderWidth: 1,
    borderColor: colors.redBright,
  },
  statusText: {
    color: '#BBA8FF',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '800',
  },
  statusTextHover: {
    color: colors.redBright,
  },
  ratingBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    backgroundColor: 'rgba(7,7,14,0.82)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  ratingBadgeHover: {
    backgroundColor: 'rgba(7,7,14,0.94)',
    transform: [{ scale: 1.06 }],
  },
  ratingText: {
    color: colors.gold,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },
  title: {
    width: '100%',
    color: colors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  titleHover: {
    color: colors.redBright,
  },
  meta: {
    width: '100%',
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
  },
  metaHover: {
    color: colors.text,
  },
});
