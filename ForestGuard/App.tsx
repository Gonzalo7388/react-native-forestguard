import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAssets } from 'expo-asset';

// Importaciones de pantallas
import EquiposScreen from './app/screens/EquiposScreen';
import MapaScreen from './app/screens/MapaScreen';
import ComunicacionScreen from './app/screens/ComunicacionScreen';

type RootTabParamList = {
  Equipos: undefined;
  Mapa: undefined;
  Comunicacion: undefined;
};

type TabBarIconProps = {
  color: string;
  size: number;
};

const Tab = createBottomTabNavigator();

export default function App() {
  const [assetsLoaded] = useAssets([
    require('./assets/icon.png'),
    require('./assets/splash-icon.png'),
    require('./assets/adaptive-icon.png')
  ]);

  if (!assetsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  const screenOptions = ({ route }: { route: { name: keyof RootTabParamList } }): BottomTabNavigationOptions => ({
    tabBarIcon: ({ color, size }: TabBarIconProps) => {
      let iconName: keyof typeof Ionicons.glyphMap = 'help'; // Valor por defecto

      switch (route.name) {
        case 'Equipos': iconName = 'people'; break;
        case 'Mapa': iconName = 'map'; break;
        case 'Comunicacion': iconName = 'radio'; break;
      }
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#e74c3c',
    tabBarInactiveTintColor: '#95a5a6',
    tabBarStyle: styles.tabBar,
    headerShown: false,
  });

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Equipos" component={EquiposScreen} />
        <Tab.Screen name="Mapa" component={MapaScreen} />
        <Tab.Screen name="Comunicacion" component={ComunicacionScreen} />
      </Tab.Navigator>
    </NavigationContainer>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  tabBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});