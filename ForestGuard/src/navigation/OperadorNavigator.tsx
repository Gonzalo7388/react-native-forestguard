// src/navigation/OperadorNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';

import MapaOperadorScreen from '../screens/Operador/MapaOperadorScreen';
import RecibirAlertasScreen from '../screens/admin/RecibirAlertasScreen';

const Tab = createBottomTabNavigator();

const OperadorNavigator = () => {
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
        header: () => (
          <Header
            title={
              route.name === 'MapaOperador'
                ? 'Mapa Operador'
                : route.name === 'Alertas'
                ? 'Alertas'
                : ''
            }
          />
        ),
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'MapaOperador') {
            iconName = 'map-outline';
          } else if (route.name === 'Alertas') {
            iconName = 'bell-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MapaOperador"
        component={MapaOperadorScreen}
        options={{ title: 'Mapa' }}
      />
      <Tab.Screen
        name="Alertas"
        component={RecibirAlertasScreen}
        options={{ title: 'Alertas' }}
      />

      
    </Tab.Navigator>
  );
};

export default OperadorNavigator;
