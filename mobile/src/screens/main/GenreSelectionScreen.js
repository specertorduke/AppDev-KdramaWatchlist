import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const GENRE_OPTIONS = [
  { id: 'Romance', label: 'Romance', icon: 'heart', color: '#F5A9C4' },
  { id: 'Comedy', label: 'Comedy', icon: 'happy-outline', color: '#FFD166' },
  { id: 'Drama', label: 'Drama', icon: 'film-outline', color: '#B8A5FF' },
  { id: 'Mystery', label: 'Mystery & Thriller', icon: 'eye-outline', color: '#70D6FF' },
  { id: 'Action', label: 'Action & Adventure', icon: 'flash-outline', color: '#FF70A6' },
  { id: 'Sci-Fi & Fantasy', label: 'Fantasy & Sci-Fi', icon: 'planet-outline', color: '#9B5DE5' },
  { id: 'Crime', label: 'Crime & Law', icon: 'shield-checkmark-outline', color: '#06D6A0' },
  { id: 'Family', label: 'Slice of Life & Family', icon: 'cafe-outline', color: '#F39C12' },
];

export default function GenreSelectionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, updateUserPreferences, setNeedsOnboarding } = useAuth();
  const isEditing = route?.params?.isEditing || false;

  const [selected, setSelected] = useState(() => {
    return Array.isArray(user?.favorite_genres) ? user.favorite_genres : [];
  });
  const [saving, setSaving] = useState(false);

  const toggleGenre = (genreId) => {
    setSelected((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateUserPreferences({ favoriteGenres: selected });
      if (setNeedsOnboarding) setNeedsOnboarding(false);
      if (isEditing) {
        navigation.goBack();
      } else {
        // First-time onboarding complete, go straight to MainTabs
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (e) {
      console.warn('Failed to save genre preferences:', e);
      if (setNeedsOnboarding) setNeedsOnboarding(false);
      if (isEditing) navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (setNeedsOnboarding) setNeedsOnboarding(false);
    if (isEditing) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.container,
          {
            paddingTop: (insets.top > 0 ? insets.top : 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >
        {/* Header Bar */}
        <View style={styles.topHeader}>
          {isEditing ? (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View style={styles.badgePill}>
              <Ionicons name="sparkles" size={13} color="#F5A9C4" />
              <Text style={styles.badgePillText}>Personalize Your Feed</Text>
            </View>
          )}

          {!isEditing && (
            <Pressable onPress={handleSkip} hitSlop={8}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          )}
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>What do you love watching?</Text>
          <Text style={styles.subtitle}>
            Select your favorite genres so SarangTV can personalize your recommendations and home dashboard.
          </Text>
        </View>

        {/* Genre Grid */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {GENRE_OPTIONS.map((g) => {
              const isSelected = selected.includes(g.id);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggleGenre(g.id)}
                  style={({ pressed }) => [
                    styles.card,
                    isSelected && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected
                        ? { backgroundColor: g.color }
                        : styles.iconCircleDefault,
                    ]}
                  >
                    <Ionicons
                      name={g.icon}
                      size={22}
                      color={isSelected ? '#07070E' : g.color}
                    />
                  </View>

                  <Text
                    style={[
                      styles.cardLabel,
                      isSelected && styles.cardLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {g.label}
                  </Text>

                  <View
                    style={[
                      styles.checkCircle,
                      isSelected && styles.checkCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={12} color="#07070E" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleFinish}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#07070E" size="small" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  {selected.length > 0
                    ? `Continue with ${selected.length} Selected`
                    : 'Explore All Dramas'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#07070E" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07070E',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 169, 196, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgePillText: {
    color: '#F5A9C4',
    fontSize: 12,
    fontWeight: '800',
  },
  skipText: {
    color: '#8D8B98',
    fontSize: 13,
    fontWeight: '700',
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#8D8B98',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#131120',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minHeight: 120,
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: '#1E1B32',
    elevation: 6,
    shadowColor: '#F5A9C4',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconCircleDefault: {
    backgroundColor: '#1C192E',
  },
  cardLabel: {
    color: '#D7D2D6',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  checkCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#F5A9C4',
  },
  footer: {
    paddingTop: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F5A9C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#F5A9C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  primaryBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    color: '#07070E',
    fontSize: 15,
    fontWeight: '900',
  },
});
