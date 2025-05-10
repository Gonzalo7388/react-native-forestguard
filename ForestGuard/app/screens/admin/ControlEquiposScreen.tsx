import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';

type Equipo = {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Inactivo';
  ultimaActualizacion: string;
};

const ControlEquiposScreen = () => {
  // Datos de prueba
  const [equipos, setEquipos] = useState<Equipo[]>([
    { id: '1', nombre: 'Equipo A', estado: 'Activo', ultimaActualizacion: 'Hace 2 horas' },
    { id: '2', nombre: 'Equipo B', estado: 'Inactivo', ultimaActualizacion: 'Hace 1 día' },
    { id: '3', nombre: 'Equipo C', estado: 'Activo', ultimaActualizacion: 'Hace 30 minutos' },
  ]);

  // Función para cambiar el estado del equipo
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

  // Función para renderizar cada item
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
    padding: 20,
    backgroundColor: '#422E13', // Fondo marrón oscuro
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#DBB95F', // Amarillo claro
  },
  equipoContainer: {
    backgroundColor: '#7F5F16', // Marrón claro
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: '#537636', // Verde pantanoso oscuro para borde
    borderWidth: 1,
  },
  nombreEquipo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // Blanco para los nombres de los equipos
  },
  estadoTexto: {
    fontSize: 16,
    marginBottom: 10,
    color: '#FFFFFF', // Blanco para el estado
  },
  ultimaActualizacion: {
    fontSize: 14,
    marginBottom: 10,
    color: '#DBB95F', // Amarillo claro para la fecha de última actualización
  },
  boton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  botonActivo: {
    backgroundColor: '#DBB95F', // Amarillo claro
  },
  botonInactivo: {
    backgroundColor: '#537636', // Verde pantanoso oscuro
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto blanco
  },
});

export default ControlEquiposScreen;
