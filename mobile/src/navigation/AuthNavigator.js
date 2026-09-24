import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AccountChooserScreen from '../screens/auth/AccountChooserScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { savedAccounts, isChoosingAccount } = useAuth();
  const initialRouteName = (savedAccounts && savedAccounts.length > 0) || isChoosingAccount ? 'AccountChooser' : 'Login';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0F19' },
      }}
    >
      <Stack.Screen name="AccountChooser" component={AccountChooserScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

