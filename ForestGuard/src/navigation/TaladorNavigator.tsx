// src/navigation/TaladorNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapaTaladorScreen from '../screens/Talador/MapaTaladorScreen';
import RecibirAlertasScreen from '../screens/comunes/AlertasScreen';
import Header from '../components/Header';

const Tab = createBottomTabNavigator();

const TaladorNavigator = () => {
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
            title={route.name === 'MapaTalador' ? 'Mapa' : 'Alertas'}
          />
        ),
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          if (route.name === 'MapaTalador') {
            iconName = 'map-outline';
          } else if (route.name === 'Alertas') {
            iconName = 'bell-outline';
          } else {
            iconName = 'help-circle-outline'; // fallback
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MapaTalador"
        component={MapaTaladorScreen}
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

export default TaladorNavigator;
