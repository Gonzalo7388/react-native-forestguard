import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../components/Header';

// ✅ Pantallas específicas del AUXILIAR
import MapaAuxiliarScreen from '../screens/Auxiliar/MapaAuxiliarScreen';
import RecibirAlertasScreen from '../screens/comunes/AlertasScreen';
import ControlEquiposScreen from '../screens/admin/ControlEquiposScreen';

const Tab = createBottomTabNavigator();

const AuxiliarNavigator = () => {
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
        header: () => {
          let title = '';
          if (route.name === 'MapaAuxiliar') {
            title = 'Mapa de Trabajadores';
          } else if (route.name === 'Alertas') {
            title = 'Alertas';
          } else if (route.name === 'ControlEquipos') {
            title = 'Control de Equipos';
          }
          return <Header title={title} />;
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = '';

          if (route.name === 'MapaAuxiliar') {
            iconName = 'map-marker-radius-outline';
          } else if (route.name === 'Alertas') {
            iconName = 'bell-outline';
          } else if (route.name === 'ControlEquipos') {
            iconName = 'cogs';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MapaAuxiliar"
        component={MapaAuxiliarScreen}
        options={{ title: 'Mapa' }}
      />
      <Tab.Screen
        name="Alertas"
        component={RecibirAlertasScreen}
        options={{ title: 'Alertas' }}
      />
      <Tab.Screen
        name="ControlEquipos"
        component={ControlEquiposScreen}
        options={{ title: 'Control Equipos' }}
      />
    </Tab.Navigator>
  );
};

export default AuxiliarNavigator;
