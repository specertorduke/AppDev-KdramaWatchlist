import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState({
    episodeAlerts: true,
    progressReminders: true,
    autoMarkWatched: false,
    highQualityPosters: true,
  });

  const toggle = (key) => {
    setValues((curr) => ({ ...curr, [key]: !curr[key] }));
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: (insets.top > 0 ? insets.top : 12) + 6 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={17} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>Settings</Text>
      </View>

      {/* Notifications */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

        <SettingToggleRow
          title="New Episode Alerts"
          subtitle="Notify when tracked dramas air new episodes"
          value={values.episodeAlerts}
          onToggle={() => toggle('episodeAlerts')}
        />

        <SettingToggleRow
          title="Progress Reminders"
          subtitle="Remind me to log episodes I may have missed"
          value={values.progressReminders}
          onToggle={() => toggle('progressReminders')}
          last
        />
      </View>

      {/* Playback & Tracker Preferences */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>

        <SettingToggleRow
          title="Auto-Mark Completed"
          subtitle="Mark drama as completed when final episode is logged"
          value={values.autoMarkWatched}
          onToggle={() => toggle('autoMarkWatched')}
        />

        <SettingToggleRow
          title="High Quality Posters"
          subtitle="Load HD banners and posters over WiFi"
          value={values.highQualityPosters}
          onToggle={() => toggle('highQualityPosters')}
          last
        />
      </View>

      {/* About */}
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>ABOUT</Text>

        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0 (SarangTV Mobile)</Text>
        </View>

        <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.aboutLabel}>Theme</Text>
          <Text style={styles.aboutValue}>Dark Cinematic</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SettingToggleRow({ title, subtitle, value, onToggle, last }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#262534', true: colors.redBright }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#161424',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: '#161424',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    color: '#8D8B98',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowInfo: {
    flex: 1,
    paddingRight: 14,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  aboutLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  aboutValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
});
