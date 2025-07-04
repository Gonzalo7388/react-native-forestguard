// src/navigation/RootNavigator.tsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingNavigator from './OnboardingNavigator';
import MarcadorNavigator from './MarcadorNavigator';
import MarcadorDrawerNavigator from './MarcadorDrawerNavigator';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const auth = useContext(AuthContext);

  if (!auth) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!auth.isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : auth.currentRole === 'marcador' ? (
        <Stack.Screen name="MarcadorDrawerNavigator" component={MarcadorDrawerNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );

};

export default RootNavigator;
