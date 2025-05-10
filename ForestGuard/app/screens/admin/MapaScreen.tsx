import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, FlatList } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

type Usuario = {
  id: string;
  nombre: string;
  rol: string;
  conectado: boolean;
};

const usuariosPrueba: Usuario[] = [
  { id: '1', nombre: 'Carlos Perez', rol: 'Talador', conectado: true },
  { id: '2', nombre: 'Ana Torres', rol: 'Jefe de equipo', conectado: true },
  { id: '3', nombre: 'Luis Ramos', rol: 'Talador', conectado: false },
];

const MapaScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const obtenerUbicacion = async () => {
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para usar esta función.');
        return;
      }
      await obtenerUbicacion();
      const interval = setInterval(obtenerUbicacion, 10000); // cada 10 segundos
      return () => clearInterval(interval);
    })();
  }, []);

  if (!location) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        zoomEnabled={true} // Deshabilitar zoom automático al cambiar la ubicación
      >
        {/* Ubicación actual */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Tú estás aquí"
          description="Ubicación actual"
          pinColor="blue"
        />

        {/* Ubicación estática */}
        <Marker
          coordinate={{ latitude: -12.136134, longitude: -76.986951 }}
          title="Punto de referencia"
          description="Ubicación estática"
          pinColor="red"
        />
      </MapView>

      <View style={styles.grillaContainer}>
        <Text style={styles.tituloGrilla}>Usuarios Conectados</Text>
        <FlatList
          data={usuariosPrueba}
          keyExtractor={(item) => item.id}
          numColumns={2} // Dos columnas en la grilla
          renderItem={({ item }) => (
            <View style={styles.usuarioCard}>
              <Text
                style={item.conectado ? styles.usuarioActivo : styles.usuarioInactivo}
              >
                {item.nombre}
              </Text>
              <Text style={styles.rolText}>{item.rol}</Text>
              <Text
                style={item.conectado ? styles.usuarioActivo : styles.usuarioInactivo}
              >
                {item.conectado ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 2 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grillaContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  tituloGrilla: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  usuarioCard: {
    flex: 1,
    margin: 10,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3, // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  usuarioActivo: {
    color: 'green',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usuarioInactivo: {
    color: 'gray',
    fontSize: 16,
  },
  rolText: {
    fontSize: 14,
    color: '#777',
  },
});

export default MapaScreen;
