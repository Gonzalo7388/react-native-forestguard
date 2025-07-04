// src/screens/Marcador/MapaMarcadorScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import FloatingActionButton from '../../components/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Para navegación tipada si luego se desea pasar params al registrar árbol
type MarcadorStackParamList = {
  RegistrarArbol: undefined;
};

type NavigationProp = NativeStackNavigationProp<MarcadorStackParamList>;

const MapaMarcadorScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const obtenerUbicacion = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    }
  };

  useEffect(() => {
    const solicitarPermiso = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación.');
        return;
      }
      await obtenerUbicacion();
      const interval = setInterval(obtenerUbicacion, 10000);
      return () => clearInterval(interval);
    };
    solicitarPermiso();
  }, []);

  if (!location) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7ED321" />
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
        showsUserLocation
        zoomEnabled
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Tu ubicación"
          description="Estás aquí"
          pinColor="#7ED321"
        />
      </MapView>

      <FloatingActionButton
        iconName="camera"
        onPress={() => navigation.navigate('RegistrarArbol')}
      />
    </View>
  );
};

export default MapaMarcadorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
