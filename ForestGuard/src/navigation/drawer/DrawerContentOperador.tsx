// src/navigation/drawer/DrawerContentOperador.tsx

import React, { useContext } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { AuthContext } from '../../contexts/AuthContext';
import { useAuth0 } from 'react-native-auth0';

export default function DrawerContentOperador({ navigation }: DrawerContentComponentProps) {
  const context = useContext(AuthContext);
  const { clearSession } = useAuth0();

  if (!context) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cargando menú...</Text>
      </View>
    );
  }

  const { setIsAuthenticated } = context;

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSession();
            setIsAuthenticated(false);
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
          }
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Menú Operador</Text>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('OperadorTabs')}>
        <Text style={styles.text}>Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Proyectos')}>
        <Text style={styles.text}>Proyectos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Configuracion')}>
        <Text style={styles.text}>Configuración</Text>
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
