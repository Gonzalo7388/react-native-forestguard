// BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import MapaScreen from '../screens/admin/MapaScreen';
import EstadisticasScreen from '../screens/admin/EstadisticasScreen';
import ControlEquiposScreen from '../screens/admin/ControlEquiposScreen';
import RecibirAlertasScreen from '../screens/admin/RecibirAlertasScreen';


const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#e74c3c',
        tabBarStyle: { backgroundColor: '#422E13' },
        headerShown: false, // para que no se muestre header en tabs
      }}
    >
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Estadisticas" component={EstadisticasScreen} />
      <Tab.Screen name="Alertas" component={RecibirAlertasScreen} />
      <Tab.Screen name="ControlEquipos" component={ControlEquiposScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
