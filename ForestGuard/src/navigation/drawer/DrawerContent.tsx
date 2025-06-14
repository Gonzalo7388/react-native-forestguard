// src/navigation/drawer/DrawerContent.tsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { AuthContext } from '../../contexts/AuthContext';

export default function DrawerContent() {
  const context = useContext(AuthContext);

  if (!context) throw new Error('AuthContext is required');

  const { setIsAuthenticated } = context;

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => setIsAuthenticated(false) },
    ]);
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Menú</Text>

      <TouchableOpacity style={styles.option} onPress={() => alert('Funcionalidad futura')}>
        <Text style={styles.text}>Opción 1</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => alert('Funcionalidad futura')}>
        <Text style={styles.text}>Opción 2</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={handleLogout}>
        <Text style={[styles.text, { color: 'red' }]}>Cerrar sesión</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#2e2e2e',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  option: {
    marginVertical: 10,
    paddingVertical: 10,
  },
  text: {
    fontSize: 18,
    color: '#fff',
  },
});
