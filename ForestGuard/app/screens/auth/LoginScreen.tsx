import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';

// Definir el tipo de las props para LoginScreen
type LoginScreenProps = {
  navigation: any; // Si prefieres un tipo más estricto, puedes usar 'StackNavigationProp<RootStackParamList, 'Login'>'
  setIsAuthenticated: (authenticated: boolean) => void;
};

const LoginScreen = ({ navigation, setIsAuthenticated }: LoginScreenProps) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleLogin = () => {
    // Datos de prueba
    const usuarioPrueba = 'admin';
    const contrasenaPrueba = 'admin';

    if (usuario === usuarioPrueba && contrasena === contrasenaPrueba) {
      // Cambiar el estado de autenticación
      setIsAuthenticated(true);
      navigation.replace('Mapa'); // Redirige a la pantalla del mapa
    } else {
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Iniciar sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={usuario}
        onChangeText={setUsuario}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />
      <Button title="Iniciar sesión" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});

export default LoginScreen;
