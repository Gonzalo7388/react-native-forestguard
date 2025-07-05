import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingNavigator from './OnboardingNavigator';
import MarcadorDrawerNavigator from './MarcadorDrawerNavigator';
import TrazadorDrawerNavigator from './TrazadorDrawerNavigator';
import TaladorDrawerNavigator from './TaladorDrawerNavigator'; // ✅ Importa tu navigator

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
      ) : auth.currentRole === 'trazador' ? (
        <Stack.Screen name="TrazadorDrawerNavigator" component={TrazadorDrawerNavigator} />
      ) : auth.currentRole === 'talador' ? ( // ✅ Agregado correctamente
        <Stack.Screen name="TaladorDrawerNavigator" component={TaladorDrawerNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
