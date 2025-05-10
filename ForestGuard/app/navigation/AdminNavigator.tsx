import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MapaScreen from '../screens/admin/MapaScreen'; // Ajusta la importación si es necesario

const Stack = createStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Mapa">
      <Stack.Screen name="Mapa" component={MapaScreen} />
      {/* Agrega más pantallas si es necesario */}
    </Stack.Navigator>
  );
};

export default AdminNavigator;
