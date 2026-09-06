import React, { useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';


export default function SettingsScreen({
  onNavigate,
}) {

  const [values, setValues] = useState({
    episodeAlerts: true,
    progressReminders: true,
  });


  const toggle = (key) => {

    setValues((current) => ({
      ...current,
      [key]: !current[key],
    }));

  };


  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* HEADER */}

      <View style={styles.header}>

        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.backButtonPressed,
          ]}
          onPress={() =>
            onNavigate?.('profile')
          }
          accessibilityRole="button"
          accessibilityLabel="Go back to Profile"
        >
          <Ionicons
            name="chevron-back"
            size={15}
            color={colors.text}
          />
        </Pressable>


        <Text style={styles.heading}>
          Settings
        </Text>

      </View>


      {/* NOTIFICATIONS */}

      <View style={styles.panel}>

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            NOTIFICATIONS
          </Text>

        </View>


        {/* NEW EPISODE ALERTS */}

        <SettingRow
          title="New Episode Alerts"
          subtitle="Notify when tracked dramas air new episodes"
          value={values.episodeAlerts}
          onPress={() =>
            toggle('episodeAlerts')
          }
        />


        {/* PROGRESS REMINDERS */}

        <SettingRow
          title="Progress Reminders"
          subtitle="Remind me to log episodes I may have missed"
          value={values.progressReminders}
          onPress={() =>
            toggle('progressReminders')
          }
          last
        />

      </View>

    </ScrollView>
  );
}


function SettingRow({
  title,
  subtitle,
  value,
  onPress,
  last,
}) {

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.setting,
        last && styles.last,
        pressed &&
          styles.settingPressed,
      ]}
    >

      <View style={styles.settingText}>

        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.subtitle}>
          {subtitle}
        </Text>

      </View>


      <View
        style={[
          styles.switch,
          value &&
            styles.switchOn,
        ]}
      >

        <View
          style={[
            styles.knob,
            value &&
              styles.knobOn,
          ]}
        />

      </View>

    </Pressable>
  );
}


const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  backButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },

  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    overflow: 'hidden',
  },

  sectionHeader: {
    height: 31,
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  sectionTitle: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  setting: {
    minHeight: 54,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  settingPressed: {
    opacity: 0.7,
    backgroundColor: colors.panel2,
  },

  last: {
    borderBottomWidth: 0,
  },

  settingText: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.muted,
    fontSize: 7,
    marginTop: 2,
  },

  switch: {
    width: 34,
    height: 20,
    borderRadius: 99,
    backgroundColor: '#292833',
    padding: 3,
    justifyContent: 'center',
  },

  switchOn: {
    backgroundColor: '#E95A78',
  },

  knob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#9A98A1',
  },

  knobOn: {
    marginLeft: 14,
    backgroundColor: '#FFFFFF',
  },

});