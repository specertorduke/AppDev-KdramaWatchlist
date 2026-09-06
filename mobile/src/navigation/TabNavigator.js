import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import TrackerScreen from '../screens/main/TrackerScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const items = [
  {
    name: 'Home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
    component: HomeScreen,
  },
  {
    name: 'Discover',
    label: 'Discover',
    icon: 'search-outline',
    activeIcon: 'search',
    component: DiscoverScreen,
  },
  {
    name: 'Tracker',
    label: 'Tracker',
    icon: 'bookmark-outline',
    activeIcon: 'bookmark',
    component: TrackerScreen,
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    component: ProfileScreen,
  },
];

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.nav}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const itemConfig = items.find((i) => i.name === route.name) || items[0];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.name}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={itemConfig.label}
              style={({ pressed }) => [
                styles.item,
                isFocused && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
                <Ionicons
                  name={isFocused ? itemConfig.activeIcon : itemConfig.icon}
                  size={23}
                  color={isFocused ? colors.text : colors.muted}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {itemConfig.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {items.map((item) => (
        <Tab.Screen
          key={item.name}
          name={item.name}
          component={item.component}
        />
      ))}
    </Tab.Navigator>
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
    backgroundColor: 'rgba(245, 169, 196, 0.12)',
  },
  itemPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
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
    backgroundColor: 'rgba(245, 169, 196, 0.16)',
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
