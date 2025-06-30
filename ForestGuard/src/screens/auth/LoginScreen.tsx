import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as AuthSession from 'expo-auth-session';
import auth0Config from '../../config/authConfig';
import { useAuthContext } from '../../contexts/AuthContext';

const discovery = {
  authorizationEndpoint: `https://${auth0Config.domain}/authorize`,
  tokenEndpoint: `https://${auth0Config.domain}/oauth/token`,
  revocationEndpoint: `https://${auth0Config.domain}/v2/logout`,
};

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);

  const redirectUri = auth0Config.redirectUri;

  const { setIsAuthenticated, setUser } = useAuthContext();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const authRequest = new AuthSession.AuthRequest({
        clientId: auth0Config.clientId,
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
      });

      await authRequest.makeAuthUrlAsync(discovery);
      const result = await authRequest.promptAsync(discovery);

      if (result.type !== 'success') {
        Alert.alert('Cancelado', 'El inicio de sesión fue cancelado');
        return;
      }

      console.log('✅ Código recibido:', result.params.code);

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: auth0Config.clientId,
          code: result.params.code,
          redirectUri,
          extraParams: {
            code_verifier: authRequest.codeVerifier!,
          },
        },
        discovery
      );

      console.log('✅ Token recibido:', tokenResponse);

      if (!tokenResponse.idToken) {
        Alert.alert('Error', 'No se pudo obtener el token de acceso');
        return;
      }

      // Decodificar el idToken para obtener info del usuario:
      const base64Url = tokenResponse.idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      console.log('✅ Usuario decodificado:', userInfo);

      const sanitizedId = userInfo.sub.replace(/[^\w.-]/g, '_');

      const userObject = {
        id: sanitizedId,
        name: userInfo.name ?? "",
        email: userInfo.email ?? "",
        avatarUrl: userInfo.picture ?? "",
      };

      setUser(userObject);
      setIsAuthenticated(true);


      Alert.alert('Login exitoso', `Bienvenido, ${userInfo.name || userInfo.email}`);
    } catch (error) {
      console.error('❌ Error durante login:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.appIconContainer}>
        <Icon name="shield-check" size={60} color="#7ED321" />
      </View>

      <Text style={styles.projectName}>Aretz Dend</Text>
      <Text style={styles.tagline}>Secure your digital forest</Text>

      <Text style={styles.welcomeText}>Welcome Back</Text>
      <Text style={styles.loginSubText}>Login to your account</Text>

      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.signInButtonText}>Sign In with Auth0</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footerText}>
        © 2025 Aretz Dend. All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appIconContainer: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  loginSubText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 30,
  },
  signInButton: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#666666',
  },
});

export default LoginScreen;
