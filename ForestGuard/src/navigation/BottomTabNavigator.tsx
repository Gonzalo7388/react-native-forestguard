import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapaScreen from '../screens/admin/MapaScreen';
import EstadisticasScreen from '../screens/admin/EstadisticasScreen';
import ControlEquiposScreen from '../screens/admin/ControlEquiposScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Estadísticas" component={EstadisticasScreen} />
      <Tab.Screen name="Control" component={ControlEquiposScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
