import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';

type Equipo = {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Inactivo';
  ultimaActualizacion: string;
};

const ControlEquiposScreen = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([
    { id: '1', nombre: 'Equipo A', estado: 'Activo', ultimaActualizacion: 'Hace 2 horas' },
    { id: '2', nombre: 'Equipo B', estado: 'Inactivo', ultimaActualizacion: 'Hace 1 día' },
    { id: '3', nombre: 'Equipo C', estado: 'Activo', ultimaActualizacion: 'Hace 30 minutos' },
  ]);

  const cambiarEstado = (id: string) => {
    setEquipos((prevEquipos) =>
      prevEquipos.map((equipo) =>
        equipo.id === id
          ? { ...equipo, estado: equipo.estado === 'Activo' ? 'Inactivo' : 'Activo' }
          : equipo
      )
    );
    Alert.alert('Estado actualizado', 'El estado del equipo ha sido cambiado');
  };

  const renderItem = ({ item }: { item: Equipo }) => (
    <View style={styles.equipoContainer}>
      <Text style={styles.nombreEquipo}>{item.nombre}</Text>
      <Text style={styles.estadoTexto}>Estado: {item.estado}</Text>
      <Text style={styles.ultimaActualizacion}>Última actualización: {item.ultimaActualizacion}</Text>
      <TouchableOpacity
        style={[styles.boton, item.estado === 'Activo' ? styles.botonActivo : styles.botonInactivo]}
        onPress={() => cambiarEstado(item.id)}
      >
        <Text style={styles.botonTexto}>
          {item.estado === 'Activo' ? 'Desactivar' : 'Activar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Control de Equipos" />

      <Text style={styles.titulo}>Control de Equipos</Text>
      <FlatList
        data={equipos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#422E13',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#DBB95F',
  },
  equipoContainer: {
    backgroundColor: '#7F5F16',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    marginHorizontal: 20,
    borderColor: '#537636',
    borderWidth: 1,
  },
  nombreEquipo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  estadoTexto: {
    fontSize: 16,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  ultimaActualizacion: {
    fontSize: 14,
    marginBottom: 10,
    color: '#DBB95F',
  },
  boton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  botonActivo: {
    backgroundColor: '#DBB95F',
  },
  botonInactivo: {
    backgroundColor: '#537636',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ControlEquiposScreen;
