// App.tsx
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAssets } from 'expo-asset';
import RootNavigator from './src/navigation/RootNavigator'; // ✅ Usa el correcto

export default function App() {
  console.log('App.tsx se está ejecutando'); // <--- prueba simple

  const [assetsLoaded] = useAssets([
    require('./assets/icon.png'),
    require('./assets/splash-icon.png'),
    require('./assets/adaptive-icon.png'),
  ]);

  console.log('assetsLoaded:', assetsLoaded); // <--- Agrega esto


  const [isAuthenticated, setIsAuthenticated] = useState(false);


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
      <RootNavigator isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
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
