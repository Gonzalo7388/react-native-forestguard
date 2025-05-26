import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';

const LoginScreen = ({
  navigation,
  setIsAuthenticated,
}: {
  navigation: any;
  setIsAuthenticated: (authenticated: boolean) => void;
}) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const handleLogin = () => {
    const usuarioPrueba = 'admin';
    const contrasenaPrueba = 'admin';

    if (usuario === usuarioPrueba && contrasena === contrasenaPrueba) {
      setIsAuthenticated(true); // Esto es suficiente
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
        placeholderTextColor="#7F5F16"
        value={usuario}
        onChangeText={setUsuario}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#7F5F16"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />

      <TouchableOpacity style={styles.boton} onPress={handleLogin}>
        <Text style={styles.botonTexto}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#422E13', // Fondo marrón oscuro
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DBB95F', // Amarillo claro para el título
    marginBottom: 30,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#878532', // Verde amarillento pantanoso
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#422E13', // Textos en color marrón oscuro
  },
  boton: {
    backgroundColor: '#537636', // Verde pantanoso oscuro
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botonTexto: {
    color: '#FFFFFF', // Blanco para el texto del botón
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoginScreen;
