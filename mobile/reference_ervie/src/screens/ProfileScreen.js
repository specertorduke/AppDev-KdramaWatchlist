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


export default function ProfileScreen({
  onNavigate,
  onSignOut,
}) {

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* PROFILE HEADER */}

      <View style={styles.profileHeader}>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            KJ
          </Text>
        </View>

        <View style={styles.profileInfo}>

          <Text style={styles.name}>
            Kim Ji-young
          </Text>

          <Text style={styles.email}>
            kdramaaddict@email.com
          </Text>

        </View>


        {/* EDIT PROFILE */}

        <Pressable
          style={({ pressed, hovered }) => [
            styles.editButton,

            hovered &&
              styles.editButtonHovered,

            pressed &&
              styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >

          <Ionicons
            name="create-outline"
            size={15}
            color={colors.text}
          />

        </Pressable>

      </View>


      {/* PROFILE SUMMARY */}

      <View style={styles.stats}>

        <View style={styles.statItem}>

          <Text style={styles.statValue}>
            4
          </Text>

          <Text style={styles.statLabel}>
            Dramas
          </Text>

        </View>


        <View style={styles.divider} />


        <View style={styles.statItem}>

          <Text style={styles.statValue}>
            18
          </Text>

          <Text style={styles.statLabel}>
            Episodes
          </Text>

        </View>


        <View style={styles.divider} />


        <View style={styles.statItem}>

          <Text style={styles.statValue}>
            17h
          </Text>

          <Text
            style={[
              styles.statLabel,
              styles.gold,
            ]}
          >
            Watched
          </Text>

        </View>

      </View>


      {/* PROFILE MENU */}

      <View style={styles.menu}>

        {/* MY TRACKER */}

        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,

            hovered &&
              styles.menuItemHovered,

            pressed &&
              styles.menuItemPressed,
          ]}
          onPress={() => {

            if (
              typeof onNavigate === 'function'
            ) {
              onNavigate('tracker');
            }

          }}
          accessibilityRole="button"
          accessibilityLabel="My Tracker"
        >

          <View style={styles.menuIcon}>

            <Ionicons
              name="clipboard-outline"
              size={15}
              color={colors.muted}
            />

          </View>


          <View style={styles.menuText}>

            <Text style={styles.menuTitle}>
              My Tracker
            </Text>

            <Text style={styles.menuSubtitle}>
              4 dramas tracked
            </Text>

          </View>


          <Ionicons
            name="chevron-forward"
            size={13}
            color={colors.muted}
          />

        </Pressable>


        {/* STATS & HISTORY */}

        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,

            hovered &&
              styles.menuItemHovered,

            pressed &&
              styles.menuItemPressed,
          ]}
          onPress={() => {

            if (
              typeof onNavigate === 'function'
            ) {
              onNavigate('stats');
            }

          }}
          accessibilityRole="button"
          accessibilityLabel="Stats and History"
        >

          <View style={styles.menuIcon}>

            <Ionicons
              name="bar-chart-outline"
              size={15}
              color={colors.muted}
            />

          </View>


          <View style={styles.menuText}>

            <Text style={styles.menuTitle}>
              Stats & History
            </Text>

            <Text style={styles.menuSubtitle}>
              18 episodes · 17h
            </Text>

          </View>


          <Ionicons
            name="chevron-forward"
            size={13}
            color={colors.muted}
          />

        </Pressable>


        {/* SETTINGS */}

        <Pressable
          style={({ pressed, hovered }) => [
            styles.menuItem,
            styles.menuItemLast,

            hovered &&
              styles.menuItemHovered,

            pressed &&
              styles.menuItemPressed,
          ]}
          onPress={() => {

            if (
              typeof onNavigate === 'function'
            ) {
              onNavigate('settings');
            }

          }}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >

          <View style={styles.menuIcon}>

            <Ionicons
              name="settings-outline"
              size={15}
              color={colors.muted}
            />

          </View>


          <View style={styles.menuText}>

            <Text style={styles.menuTitle}>
              Settings
            </Text>

            <Text style={styles.menuSubtitle}>
              Notifications, quality, account
            </Text>

          </View>


          <Ionicons
            name="chevron-forward"
            size={13}
            color={colors.muted}
          />

        </Pressable>

      </View>


      {/* SIGN OUT */}

      <Pressable
        style={({ pressed, hovered }) => [
          styles.signOut,

          hovered &&
            styles.signOutHovered,

          pressed &&
            styles.signOutPressed,
        ]}
        onPress={() => {

          console.log(
            'ProfileScreen: Sign Out pressed'
          );

          if (
            typeof onSignOut === 'function'
          ) {

            onSignOut();

          } else {

            console.error(
              'ProfileScreen: onSignOut is not connected.'
            );

          }

        }}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        accessibilityHint="Sign out and show the account chooser"
        hitSlop={{
          top: 8,
          bottom: 8,
          left: 8,
          right: 8,
        }}
      >

        <Ionicons
          name="log-out-outline"
          size={14}
          color={colors.redBright}
        />

        <Text style={styles.signOutText}>
          Sign Out
        </Text>

      </Pressable>


    </ScrollView>
  );
}


const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },


  content: {
    padding: 19,
    paddingBottom: 40,
  },


  /* PROFILE HEADER */

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },


  avatar: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },


  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },


  profileInfo: {
    flex: 1,
  },


  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },


  email: {
    color: colors.muted,
    fontSize: 8.5,
    marginTop: 3,
  },


  /* EDIT BUTTON */

  editButton: {
    width: 27,
    height: 27,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },


  editButtonHovered: {
    backgroundColor: colors.panel2,
    borderColor: colors.red,
    transform: [
      {
        scale: 1.04,
      },
    ],
  },


  buttonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },


  /* STATS */

  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    paddingVertical: 13,
    marginBottom: 18,
  },


  statItem: {
    flex: 1,
    alignItems: 'center',
  },


  divider: {
    width: 1,
    height: 45,
    backgroundColor: colors.line,
  },


  statValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },


  statLabel: {
    color: colors.muted,
    fontSize: 7.5,
    fontWeight: '600',
    marginTop: 3,
  },


  gold: {
    color: colors.gold,
  },


  /* PROFILE MENU */

  menu: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    overflow: 'hidden',
  },


  menuItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },


  menuItemLast: {
    borderBottomWidth: 0,
  },


  menuItemHovered: {
    backgroundColor: colors.panel2,
  },


  menuItemPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.995,
      },
    ],
  },


  menuIcon: {
    width: 28,
    alignItems: 'center',
  },


  menuText: {
    flex: 1,
    marginLeft: 3,
  },


  menuTitle: {
    color: colors.text,
    fontSize: 9.5,
    fontWeight: '800',
  },


  menuSubtitle: {
    color: colors.muted,
    fontSize: 7.5,
    marginTop: 2,
  },


  /* SIGN OUT */

  signOut: {
    height: 40,
    marginTop: 15,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(232,33,63,0.35)',
    backgroundColor: 'rgba(232,33,63,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },


  signOutHovered: {
    backgroundColor: 'rgba(232,33,63,0.14)',
    borderColor: 'rgba(232,33,63,0.6)',
    transform: [
      {
        scale: 1.01,
      },
    ],
  },


  signOutPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },


  signOutText: {
    color: colors.redBright,
    fontSize: 9,
    fontWeight: '800',
  },

});