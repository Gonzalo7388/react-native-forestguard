// src/screens/Operador/MapaOperadorScreen.tsx 

import React, { useEffect, useState } from 'react'; 
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native'; 
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import * as Location from 'expo-location'; 
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'; 
import { app } from '../../config/firebase'; 
import { useAuth } from '../../hooks/useAuth'; 
import { useNavigation } from '@react-navigation/native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

type OperadorStackParamList = { 
  ConfirmarTransporteTroncos: { troncoIds: string[] }; 
}; 

type NavigationProp = NativeStackNavigationProp<OperadorStackParamList>; 

type Tronco = { 
  id: string; 
  latitud: number; 
  longitud: number; 
  especie: string; 
  descripcion: string; 
  estado: string; 
  arbolId: string; 
  proyectoId: string; 
}; 

const MapaOperadorScreen = () => { 
  const [location, setLocation] = useState<Location.LocationObject | null>(null); 
  const [troncos, setTroncos] = useState<Tronco[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [selectedTroncos, setSelectedTroncos] = useState<string[]>([]); 
  const { currentProject } = useAuth(); 
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

  const cargarTroncos = async () => { 
    if (!currentProject?.id) { 
      Alert.alert('Error', 'No tienes un proyecto seleccionado.'); 
      setLoading(false); 
      return; 
    } 
    try { 
      const db = getFirestore(app); 
      const troncosRef = collection(db, 'troncos'); 
      const q = query( 
        troncosRef, 
        where('proyectoId', '==', currentProject.id), 
        where('estado', 'in', ['en_espera', 'en_transporte']) 
      ); 
      const snapshot = await getDocs(q); 

      const troncosData: Tronco[] = []; 
      snapshot.forEach(docSnap => { 
        const data = docSnap.data(); 
        troncosData.push({ 
          id: docSnap.id, 
          latitud: data.latitud, 
          longitud: data.longitud, 
          especie: data.especie, 
          descripcion: data.descripcion, 
          estado: data.estado, 
          arbolId: data.arbolId, 
          proyectoId: data.proyectoId, 
        }); 
      }); 
      setTroncos(troncosData); 
    } catch (error) { 
      console.error('Error al cargar troncos:', error); 
      Alert.alert('Error', 'No se pudieron cargar los troncos.'); 
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
    cargarTroncos(); 

    const interval = setInterval(obtenerUbicacion, 10000); 
    return () => clearInterval(interval); 
  }, []); 

  const toggleSeleccionTronco = (id: string) => { 
    if (selectedTroncos.includes(id)) { 
      setSelectedTroncos(selectedTroncos.filter(troncoId => troncoId !== id)); 
    } else { 
      setSelectedTroncos([...selectedTroncos, id]); 
    } 
  }; 

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
        {troncos.map(tronco => ( 
          <Marker 
            key={tronco.id} 
            coordinate={{ latitude: tronco.latitud, longitude: tronco.longitud }} 
            title={tronco.especie} 
            description={tronco.descripcion} 
            pinColor={ 
              tronco.estado === 'en_espera' 
                ? selectedTroncos.includes(tronco.id) 
                  ? '#FFD700' // Amarillo cuando está seleccionado 
                  : '#FFA500' // Naranja en espera 
                : '#1E90FF' // Azul en transporte 
            } 
            onPress={() => { 
              if (tronco.estado === 'en_espera') { 
                toggleSeleccionTronco(tronco.id); 
              } else { 
                Alert.alert('Información', 'Este tronco ya está en transporte.'); 
              } 
            }} 
          /> 
        ))} 
      </MapView> 

      {selectedTroncos.length > 0 && ( 
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('ConfirmarTransporteTroncos', { troncoIds: selectedTroncos })} 
        > 
          <Icon name="truck-fast" size={24} color="#fff" /> 
          <Text style={styles.buttonText}>Iniciar Transporte ({selectedTroncos.length})</Text> 
        </TouchableOpacity> 
      )} 
    </View> 
  ); 
}; 

export default MapaOperadorScreen; 

const styles = StyleSheet.create({ 
  container: { flex: 1 }, 
  map: { flex: 1 }, 
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
  }, 
  button: { 
    position: 'absolute', 
    bottom: 20, 
    left: 20, 
    right: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#7ED321', 
    padding: 15, 
    borderRadius: 10, 
    elevation: 5, 
  }, 
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 10, 
    fontSize: 16, 
  }, 
});
