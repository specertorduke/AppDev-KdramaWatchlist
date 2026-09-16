import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import TrackerScreen from '../screens/main/TrackerScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ChatbotModal, { ChatbotFloatingTrigger } from '../components/ChatbotModal';
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
    <View style={{ flex: 1 }}>
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

      {/* Floating AI Chatbot Trigger & Sheet */}
      <ChatbotFloatingTrigger />
      <ChatbotModal />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 82,
    backgroundColor: '#0B0B13',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 100,
    elevation: 20,
    paddingBottom: 6,
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
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  itemActive: {
    backgroundColor: 'rgba(245, 169, 196, 0.12)',
  },
  itemPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  iconContainer: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 3,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(245, 169, 196, 0.18)',
  },
  label: {
    color: '#8D8B98',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
