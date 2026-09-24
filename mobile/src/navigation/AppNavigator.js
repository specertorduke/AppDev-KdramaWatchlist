import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import DramaDetailScreen from '../screens/main/DramaDetailScreen';
import StatsScreen from '../screens/main/StatsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AddDramaScreen from '../screens/main/AddDramaScreen';
import GenreSelectionScreen from '../screens/main/GenreSelectionScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ initialRouteName = 'MainTabs' }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#07070E' },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="GenreSelection" component={GenreSelectionScreen} />
      <Stack.Screen name="DramaDetail" component={DramaDetailScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AddDrama" component={AddDramaScreen} />
    </Stack.Navigator>
  );
}
