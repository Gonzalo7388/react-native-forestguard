// App.tsx
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAssets } from 'expo-asset';
import { ErrorBoundary } from 'react-error-boundary';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthContext } from './src/contexts/AuthContext';
import { Auth0Provider } from 'react-native-auth0';
import auth0Config from './src/config/authConfig';
import { UserType } from './src/types/user';
import { navigationRef, navigate } from './src/navigation/NavigationService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<any | null>(null);

  const cambiarProyecto = (proyecto: any, role: string) => {
    console.log('CAMBIANDO PROYECTO', { proyecto, role });
    setCurrentProject(proyecto);
    setCurrentRole(role);
  };


  const [assetsLoaded] = useAssets([
    require('./assets/icon.png'),
    require('./assets/splash-icon.png'),
    require('./assets/adaptive-icon.png'),
  ]);

  if (!assetsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={({ error }) => (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#2e2e2e' }}>
        <Text style={{ fontSize: 20, color: 'red', marginBottom: 10 }}>¡Algo salió mal!</Text>
        <Text style={{ fontSize: 16, color: '#fff', textAlign: 'center' }}>{error.message}</Text>
      </View>
    )}>
      <Auth0Provider domain={auth0Config.domain} clientId={auth0Config.clientId}>
        <AuthContext.Provider
          value={{
            isAuthenticated,
            setIsAuthenticated,
            user,
            setUser,
            currentRole,
            setCurrentRole,
            currentProject,
            setCurrentProject,
            cambiarProyecto,
          }}
        >
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthContext.Provider>
      </Auth0Provider>
    </ErrorBoundary>
  );
}
