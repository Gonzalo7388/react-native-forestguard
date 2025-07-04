import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapaMarcadorScreen from '../screens/Marcador/MapaMarcadorScreen';
import RecibirAlertasScreen from '../screens/admin/RecibirAlertasScreen';
import Header from '../components/Header'; // Asegúrate de importar tu Header

const Tab = createBottomTabNavigator();

const MarcadorNavigator = () => {
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
        header: () => <Header title={route.name === 'MapaMarcador' ? 'Mapa' : 'Alertas'} />,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'MapaMarcador') {
            iconName = 'map-outline';
          } else if (route.name === 'Alertas') {
            iconName = 'bell-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MapaMarcador"
        component={MapaMarcadorScreen}
        options={{ title: 'Mapa' }}
      />
      <Tab.Screen
        name="Alertas"
        component={RecibirAlertasScreen}
      />
    </Tab.Navigator>
  );
};

export default MarcadorNavigator;
