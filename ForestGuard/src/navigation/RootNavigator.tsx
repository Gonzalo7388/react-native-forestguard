import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen'; // Asegúrate de que la ruta sea correcta
import AdminNavigator from './AdminNavigator'; // El navegador para las pantallas de admin

const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Admin" component={AdminNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
