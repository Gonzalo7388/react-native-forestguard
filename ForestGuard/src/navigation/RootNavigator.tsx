import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminNavigator from './AdminNavigator';
import { AuthContext } from '../contexts/AuthContext';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const auth = useContext(AuthContext);

  if (!auth || typeof auth.setIsAuthenticated !== 'function') {
    return null; // También podrías usar un <LoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!auth.isAuthenticated ? (
        <Stack.Screen
          name="Login"
          children={(props) => (
            <LoginScreen {...props} setIsAuthenticated={auth.setIsAuthenticated} />
          )}
        />
      ) : (
        <Stack.Screen name="Admin" component={AdminNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
