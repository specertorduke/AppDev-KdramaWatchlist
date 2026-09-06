import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';


const items = [

  {
    id: 'home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },

  {
    id: 'discover',
    label: 'Discover',
    icon: 'search-outline',
    activeIcon: 'search',
  },

  {
    id: 'tracker',
    label: 'Tracker',
    icon: 'bookmark-outline',
    activeIcon: 'bookmark',
  },

  {
    id: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },

];


export default function MobileNav({
  active,
  onNavigate,
}) {

  const handleNavigate = (id) => {

    if (typeof onNavigate === 'function') {
      onNavigate(id);
    } else {
      console.error(
        'MobileNav: onNavigate is not connected.'
      );
    }

  };


  return (
    <View style={styles.wrapper}>

      <View style={styles.nav}>

        {items.map((item) => {

          const isActive =
            active === item.id;


          return (
            <Pressable
              key={item.id}
              onPress={() =>
                handleNavigate(item.id)
              }
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                isActive &&
                  styles.itemActive,
                pressed &&
                  styles.itemPressed,
              ]}
            >

              <View
                style={[
                  styles.iconContainer,
                  isActive &&
                    styles.iconContainerActive,
                ]}
              >

                <Ionicons
                  name={
                    isActive
                      ? item.activeIcon
                      : item.icon
                  }
                  size={23}
                  color={
                    isActive
                      ? colors.text
                      : colors.muted
                  }
                />

              </View>


              <Text
                style={[
                  styles.label,
                  isActive &&
                    styles.labelActive,
                ]}
              >
                {item.label}
              </Text>

            </Pressable>
          );

        })}

      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  wrapper: {
    width: '100%',
    height: 76,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    zIndex: 100,
    elevation: 20,
  },

  nav: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  item: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 3,
  },

  itemActive: {
    backgroundColor:
      'rgba(232, 33, 63, 0.10)',
  },

  itemPressed: {
    opacity: 0.6,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  iconContainer: {
    width: 34,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 2,
  },

  iconContainerActive: {
    backgroundColor:
      'rgba(232, 33, 63, 0.12)',
  },

  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },

  labelActive: {
    color: colors.text,
    fontWeight: '800',
  },

});