import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

// Definir el tipo para la respuesta de la API
type Ubicacion = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  timestamp: string;
};

const MapaScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  useEffect(() => {
    // Solicitar permiso para acceder a la ubicación
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para usar esta función.');
        return;
      }

      // Obtener la ubicación actual
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Obtener las ubicaciones desde la API
      try {
        const response = await axios.get<Ubicacion[]>('http://127.0.0.1:8000/api/ubicaciones/');
        setUbicaciones(response.data);
      } catch (error) {
        console.error('Error al obtener las ubicaciones:', error);
      }
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
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      {/* Mostrar la ubicación actual */}
      <Marker
        coordinate={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }}
        title="Tú estás aquí"
        description="Ubicación actual"
      />

      {/* Mostrar las ubicaciones de la API */}
      {ubicaciones.map((ubicacion) => (
        <Marker
          key={ubicacion.id}
          coordinate={{
            latitude: ubicacion.latitud,
            longitude: ubicacion.longitud,
          }}
          title={ubicacion.nombre}
          description={`Lat: ${ubicacion.latitud}, Lon: ${ubicacion.longitud}`}
        />
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapaScreen;
