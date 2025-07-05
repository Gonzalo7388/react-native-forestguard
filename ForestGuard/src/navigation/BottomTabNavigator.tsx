// BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapaScreen from '../screens/admin/MapaScreen';
import EstadisticasScreen from '../screens/admin/EstadisticasScreen';
import ControlEquiposScreen from '../screens/admin/ControlEquiposScreen';
import RecibirAlertasScreen from '../screens/comunes/AlertasScreen';

import Header from '../components/Header'; // 👈 Importa tu Header modular

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#7ED321',
        tabBarInactiveTintColor: '#000000',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60 + insets.bottom,
          paddingBottom: 5 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        // 👇 Header modular por pantalla:
        header: () => {
          let title = '';
          if (route.name === 'Mapa') {
            title = 'Mapa';
          } else if (route.name === 'Estadisticas') {
            title = 'Estadísticas';
          } else if (route.name === 'Alertas') {
            title = 'Alertas';
          } else if (route.name === 'ControlEquipos') {
            title = 'Control de Equipos';
          }
          return <Header title={title} />;
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Mapa') {
            iconName = 'map-outline';
          } else if (route.name === 'Estadisticas') {
            iconName = 'chart-line';
          } else if (route.name === 'Alertas') {
            iconName = 'bell-outline';
          } else if (route.name === 'ControlEquipos') {
            iconName = 'cogs';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Estadisticas" component={EstadisticasScreen} />
      <Tab.Screen name="Alertas" component={RecibirAlertasScreen} />
      <Tab.Screen name="ControlEquipos" component={ControlEquiposScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
