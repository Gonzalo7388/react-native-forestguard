// src/screens/Talador/MapaTaladorScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TaladorStackParamList = {
  ConfirmarTalaArbol: { arbolId: string };
};

type NavigationProp = NativeStackNavigationProp<TaladorStackParamList>;

type Arbol = {
  id: string;
  latitud: number;
  longitud: number;
  especie: string;
  descripcion: string;
  marcadorId: string;
  proyectoId: string;
  estado: string;
};

const MapaTaladorScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [arboles, setArboles] = useState<Arbol[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, currentProject } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const obtenerUbicacion = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación.');
    }
  };

  const cargarArboles = async () => {
    if (!currentProject?.id) {
      Alert.alert('Error', 'No tienes un proyecto seleccionado.');
      setLoading(false);
      return;
    }
    try {
      const db = getFirestore(app);
      const arbolesRef = collection(db, 'arboles');
      const q = query(arbolesRef, where('proyectoId', '==', currentProject.id));
      const snapshot = await getDocs(q);

      const arbolesData: Arbol[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        arbolesData.push({
          id: docSnap.id,
          latitud: data.latitud,
          longitud: data.longitud,
          especie: data.especie,
          descripcion: data.descripcion,
          marcadorId: data.marcadorId,
          proyectoId: data.proyectoId,
          estado: data.estado ?? 'en_pie',
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
      >
        {arboles.map(arbol => (
          <Marker
            key={arbol.id}
            coordinate={{ latitude: arbol.latitud, longitude: arbol.longitud }}
            title={arbol.especie}
            description={arbol.descripcion}
            pinColor={arbol.estado === 'talado' ? '#808080' : '#7ED321'} // gris o verde
            onPress={() => {
              if (arbol.estado === 'en_pie') {
                navigation.navigate('ConfirmarTalaArbol', { arbolId: arbol.id });
              } else {
                Alert.alert('Información', 'Este árbol ya está marcado como talado.');
              }
            }}
          />
        ))}
      </MapView>
    </View>
  );
};

export default MapaTaladorScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
