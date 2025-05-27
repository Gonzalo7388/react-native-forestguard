import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const context = useContext(AuthContext);

  if (!context) {
    // Si no está envuelto en <AuthContext.Provider>, lanza error
    throw new Error('MenuScreen must be used within an AuthContext.Provider');
  }

  const { setIsAuthenticated } = context;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => setIsAuthenticated(false) }
      ]
    );
  };

  return (
    <View style={styles.container}>
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
    </View>
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
