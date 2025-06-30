import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingNavigator from './OnboardingNavigator';
import { AuthContext } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!auth.isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
