import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';


/*
|--------------------------------------------------------------------------
| Navigation Items
|--------------------------------------------------------------------------
*/

const items = [
  ['home', 'Home'],
  ['discover', 'Discover'],
  ['tracker', 'Tracker'],
  ['profile', 'Profile'],
];


/*
|--------------------------------------------------------------------------
| Side Navigation
|--------------------------------------------------------------------------
*/

export default function SideNav({
  active,
  onNavigate,
}) {
  return (
    <View style={styles.nav}>

      {/*
      |--------------------------------------------------------------------------
      | Brand
      |--------------------------------------------------------------------------
      */}

      <Pressable
        style={({ hovered, pressed }) => [
          styles.brand,

          hovered && styles.brandHover,

          pressed && styles.brandPressed,
        ]}
        onPress={() => onNavigate('home')}
      >
        {({ hovered }) => (
          <Text
            style={[
              styles.brandText,

              hovered && styles.brandTextHover,
            ]}
          >
            Sarang
            <Text style={styles.brandAccent}>
              TV
            </Text>
          </Text>
        )}
      </Pressable>


      {/*
      |--------------------------------------------------------------------------
      | Main Navigation
      |--------------------------------------------------------------------------
      */}

      <View style={styles.items}>

        {items.map(([id, label]) => (
          <NavItem
            key={id}
            id={id}
            label={label}
            active={active === id}
            onPress={onNavigate}
          />
        ))}

      </View>


      {/*
      |--------------------------------------------------------------------------
      | Right Actions
      |--------------------------------------------------------------------------
      */}

      <View style={styles.actions}>

        {/*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */}

        <Pressable
          style={({ hovered, pressed }) => [
            styles.iconButton,

            hovered && styles.iconButtonHover,

            pressed && styles.iconButtonPressed,
          ]}
          onPress={() => onNavigate('discover')}
        >
          {({ hovered }) => (
            <Ionicons
              name="search-outline"
              size={18}
              color={
                hovered
                  ? colors.text
                  : colors.muted
              }
            />
          )}
        </Pressable>


        {/*
        |--------------------------------------------------------------------------
        | Profile
        |--------------------------------------------------------------------------
        */}

        <Pressable
          style={({ hovered, pressed }) => [
            styles.profileButton,

            hovered && styles.profileButtonHover,

            pressed && styles.profileButtonPressed,
          ]}
          onPress={() => onNavigate('profile')}
        >
          {({ hovered }) => (
            <Ionicons
              name="person-circle-outline"
              size={27}
              color={
                hovered
                  ? colors.text
                  : colors.text
              }
            />
          )}
        </Pressable>

      </View>

    </View>
  );
}


/*
|--------------------------------------------------------------------------
| Navigation Item
|--------------------------------------------------------------------------
*/

function NavItem({
  id,
  label,
  active,
  onPress,
}) {
  return (
    <Pressable
      onPress={() => onPress(id)}
      style={({ hovered, pressed }) => [
        styles.item,

        active && styles.itemActive,

        hovered &&
          !active &&
          styles.itemHover,

        pressed &&
          styles.itemPressed,
      ]}
    >
      {({ hovered }) => (
        <Text
          style={[
            styles.itemLabel,

            active &&
              styles.itemLabelActive,

            hovered &&
              !active &&
              styles.itemLabelHover,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}


/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({

  /*
  |--------------------------------------------------------------------------
  | Navigation Bar
  |--------------------------------------------------------------------------
  */

  nav: {
    height: 52,
    width: '100%',

    backgroundColor: colors.bg,

    borderBottomWidth: 1,
    borderBottomColor: colors.line,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 22,

    zIndex: 10,

    elevation: 10,
  },


  /*
  |--------------------------------------------------------------------------
  | Brand
  |--------------------------------------------------------------------------
  */

  brand: {
    height: 52,

    justifyContent: 'center',

    marginRight: 24,

    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  brandHover: {
    opacity: 0.88,
  },

  brandPressed: {
    opacity: 0.7,
  },

  brandText: {
    color: colors.text,

    fontSize: 18,

    fontWeight: '800',

    letterSpacing: -0.4,
  },

  brandTextHover: {
    opacity: 0.9,
  },

  brandAccent: {
    color: colors.redBright,
  },


  /*
  |--------------------------------------------------------------------------
  | Navigation Items Container
  |--------------------------------------------------------------------------
  */

  items: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 20,
  },


  /*
  |--------------------------------------------------------------------------
  | Navigation Item
  |--------------------------------------------------------------------------
  */

  item: {
    height: 52,

    justifyContent: 'center',

    paddingHorizontal: 1,

    borderBottomWidth: 2,

    borderBottomColor: 'transparent',
  },

  itemActive: {
    borderBottomWidth: 2,

    borderBottomColor: colors.red,
  },

  itemHover: {
    borderBottomWidth: 2,

    borderBottomColor: colors.line,
  },

  itemPressed: {
    opacity: 0.72,
  },


  /*
  |--------------------------------------------------------------------------
  | Navigation Labels
  |--------------------------------------------------------------------------
  */

  itemLabel: {
    color: colors.muted,

    fontSize: 11,

    fontWeight: '600',
  },

  itemLabelActive: {
    color: colors.text,

    fontWeight: '800',
  },

  itemLabelHover: {
    color: colors.text,

    fontWeight: '700',
  },


  /*
  |--------------------------------------------------------------------------
  | Right Actions
  |--------------------------------------------------------------------------
  */

  actions: {
    marginLeft: 'auto',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 13,
  },


  /*
  |--------------------------------------------------------------------------
  | Search Button
  |--------------------------------------------------------------------------
  */

  iconButton: {
    width: 30,

    height: 30,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 8,
  },

  iconButtonHover: {
    backgroundColor: colors.line,
  },

  iconButtonPressed: {
    opacity: 0.7,
  },


  /*
  |--------------------------------------------------------------------------
  | Profile Button
  |--------------------------------------------------------------------------
  */

  profileButton: {
    width: 30,

    height: 30,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 8,
  },

  profileButtonHover: {
    backgroundColor: colors.line,
  },

  profileButtonPressed: {
    opacity: 0.7,
  },

});