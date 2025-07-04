// src/screens/Marcador/MapaMarcadorScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import FloatingActionButton from '../../components/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

type MarcadorStackParamList = {
  RegistrarArbol: undefined;
};

type NavigationProp = NativeStackNavigationProp<MarcadorStackParamList>;

type Arbol = {
  id: string;
  latitud: number;
  longitud: number;
  especie: string;
  descripcion: string;
  marcadorId: string;
  proyectoId: string;
};

const MapaMarcadorScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();


  const obtenerProyectoId = () => {
    if (!user?.proyectos) return null;
    const proyectos = user.proyectos;
    // Extraer el primer proyecto donde el usuario sea marcador
    const proyectoIdMarcador = Object.keys(proyectos).find(
      key => proyectos[key] === 'marcador'
    );
    return proyectoIdMarcador ?? null;
  };

  const obtenerUbicacion = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    }
  };

  const cargarArboles = async () => {
    const proyectoId = obtenerProyectoId();
    if (!proyectoId) {
      Alert.alert('Error', 'const obtenerProyectoId.');
      setLoading(false);
      return;
    }
    try {
      const db = getFirestore(app);
      const arbolesRef = collection(db, 'arboles');
      const q = query(arbolesRef, where('proyectoId', '==', proyectoId));
      const snapshot = await getDocs(q);

      const arbolesData: Arbol[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        arbolesData.push({
          id: doc.id,
          latitud: data.latitud,
          longitud: data.longitud,
          especie: data.especie,
          descripcion: data.descripcion,
          marcadorId: data.marcadorId,
          proyectoId: data.proyectoId,
        });
      });
      setArboles(arbolesData);
    } catch (error) {
      console.error('Error al cargar árboles:', error);
      Alert.alert('Error', 'No se pudieron cargar los árboles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const solicitarPermiso = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación.');
        setLoading(false);
        return;
      }
      await obtenerUbicacion();
    };

    solicitarPermiso();
    cargarArboles();

    const interval = setInterval(obtenerUbicacion, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !location) {
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
        {arboles.map(arbol => (
          <Marker
            key={arbol.id}
            coordinate={{ latitude: arbol.latitud, longitude: arbol.longitud }}
            title={arbol.especie}
            description={arbol.descripcion}
            pinColor={
              arbol.marcadorId === user?.id ? '#7ED321' : '#2e2e2e'
            } // verde si es del marcador actual, gris oscuro si de otros
          />
        ))}
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
