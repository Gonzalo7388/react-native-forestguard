import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useAssets } from 'expo-asset';
import { ErrorBoundary } from 'react-error-boundary';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthContext } from './src/contexts/AuthContext';

import { Auth0Provider } from 'react-native-auth0';
import auth0Config from './src/config/authConfig';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>¡Algo salió mal!</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
    </View>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [assetsLoaded] = useAssets([
    require('./assets/icon.png'),
    require('./assets/splash-icon.png'),
    require('./assets/adaptive-icon.png'),
  ]);

  if (!assetsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Auth0Provider domain={auth0Config.domain} clientId={auth0Config.clientId}>
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthContext.Provider>
      </Auth0Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2e2e2e',
  },
  errorTitle: {
    fontSize: 20,
    color: 'red',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
