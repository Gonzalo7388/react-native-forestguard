// BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import Icon for tab bar icons
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets

import MapaScreen from '../screens/admin/MapaScreen';
import EstadisticasScreen from '../screens/admin/EstadisticasScreen';
import ControlEquiposScreen from '../screens/admin/ControlEquiposScreen';
import RecibirAlertasScreen from '../screens/admin/RecibirAlertasScreen';


const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  // Get safe area insets to adjust padding for system UI (e.g., notches, navigation bar)
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#7ED321', // Lime green for active tab
        tabBarInactiveTintColor: '#000000', // Black for inactive tab
        tabBarStyle: {
          backgroundColor: '#FFFFFF', // White background for the tab bar
          borderTopWidth: 1, // Add a subtle top border
          borderTopColor: '#E0E0E0', // Light grey border color
          height: 60 + insets.bottom, // Adjust height to include bottom safe area inset
          paddingBottom: 5 + insets.bottom, // Add bottom safe area inset to padding
        },
        tabBarLabelStyle: {
          fontSize: 12, // Adjust label font size
          fontWeight: 'bold', // Make labels bold
        },
        headerShown: false, // Hide header on tabs
        tabBarIcon: ({ color, size }) => { // Define icons for each tab
          let iconName;

          if (route.name === 'Mapa') {
            iconName = 'map-outline';
          } else if (route.name === 'Estadisticas') {
            iconName = 'chart-line';
          } else if (route.name === 'Alertas') {
            iconName = 'bell-outline';
          } else if (route.name === 'ControlEquipos') {
            iconName = 'cogs'; // Or 'settings-outline', 'tools'
          }

          // You can return any component that you like here!
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
