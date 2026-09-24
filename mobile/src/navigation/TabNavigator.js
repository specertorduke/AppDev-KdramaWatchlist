import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View style={[styles.outerContainer, { paddingBottom: bottomInset + 4 }]} pointerEvents="box-none">
      <View style={styles.floatingBar}>
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
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.itemContent, isFocused && styles.itemContentActive]}>
                <Ionicons
                  name={isFocused ? itemConfig.activeIcon : itemConfig.icon}
                  size={21}
                  color={isFocused ? '#F5A9C4' : 'rgba(255,255,255,0.45)'}
                />
                <Text style={[styles.label, isFocused && styles.labelActive]}>
                  {itemConfig.label}
                </Text>
                {isFocused && <View style={styles.activeIndicatorDot} />}
              </View>
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
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  floatingBar: {
    width: '100%',
    maxWidth: 500,
    height: 64,
    backgroundColor: '#161424',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    // Lifted shadow effect with deep contrast
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    position: 'relative',
  },
  itemContentActive: {
    backgroundColor: 'rgba(245, 169, 196, 0.14)',
  },
  itemPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  label: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeIndicatorDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F5A9C4',
  },
});
