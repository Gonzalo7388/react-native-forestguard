import React, { useState } from 'react'; // Importar useState
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAssets } from 'expo-asset';

// Importaciones de pantallas
import LoginScreen from './app/screens/auth/LoginScreen';
import MapaScreen from './app/screens/admin/MapaScreen';

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

        {/* Pantalla de Mapa */}
        <Stack.Screen name="Mapa" component={MapaScreen} />
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
