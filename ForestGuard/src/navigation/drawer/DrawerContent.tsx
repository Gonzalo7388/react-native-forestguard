// src/navigation/drawer/DrawerContent.tsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { AuthContext } from '../../contexts/AuthContext';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

export default function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const context = useContext(AuthContext);

  if (!context) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Cargando menú...</Text>
      </View>
    );
  }

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

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('MapaRecorrido')}>
        <Text style={styles.text}>Mapa de Recorrido</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Asistencia')}>
        <Text style={styles.text}>Registro de Asistencia</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('ControlEquipamiento')}>
        <Text style={styles.text}>Control de Equipamiento</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('EvaluacionPostJornada')}>
        <Text style={styles.text}>Evaluación Post Jornada</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('ResumenTrabajador')}>
        <Text style={styles.text}>Resumen del Trabajador</Text>
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
