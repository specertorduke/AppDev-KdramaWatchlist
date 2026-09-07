import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ChatbotProvider } from './src/context/ChatbotContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatbotProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </ChatbotProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
