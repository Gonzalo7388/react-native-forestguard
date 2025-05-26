import React, { useState } from 'react'; // Importar useState
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAssets } from 'expo-asset';
import AdminNavigator from './src/navigation/AdminNavigator';

// Importaciones de pantallas
import LoginScreen from './src/screens/auth/LoginScreen';
import MapaScreen from './src/screens/admin/MapaScreen';
import EstadisticasScreen from './src/screens/admin/EstadisticasScreen';
import ControlEquiposScreen from './src/screens/admin/ControlEquiposScreen'; // Importar la nueva pantalla

const Stack = createStackNavigator();

export default function App() {
  const [assetsLoaded] = useAssets([ // Cargar los assets
    require('./assets/icon.png'),
    require('./assets/splash-icon.png'),
    require('./assets/adaptive-icon.png'),
  ]);

  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado de autenticación

  if (!assetsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName={isAuthenticated ? 'Mapa' : 'Login'}>
        {/* Pantalla de Login */}
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
        </Stack.Screen>

        {/* Pantallas de Admin */}
        <Stack.Screen name="Mapa" component={MapaScreen} />
        <Stack.Screen name="Estadisticas" component={EstadisticasScreen} />
        <Stack.Screen name="Control" component={ControlEquiposScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});
