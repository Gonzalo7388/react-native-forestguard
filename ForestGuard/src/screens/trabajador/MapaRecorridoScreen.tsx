import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, LatLng, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native'; // Importar useRoute

import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth'; // Para obtener el currentProject
import DateTimePicker from '@react-native-community/datetimepicker'; // Para el selector de fecha

const db = getFirestore(app);

// --- Interfaces para Firestore ---
interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: any; // Firebase Timestamp
}

interface UserPathData {
  userId: string;
  projectId: string;
  date: string;
  locations: LocationPoint[];
}
type UserPath = UserPathData & { id: string };

interface EquipoUserData {
  name: string;
  email: string;
  avatarUrl?: string;
  proyectos?: { [projectId: string]: string };
}
type EquipoUser = EquipoUserData & { id: string };

const screenWidth = Dimensions.get('window').width;

// --- Funciones Auxiliares ---
// Función para calcular distancia entre dos lat/lon puntos usando la fórmula Haversine
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180; // lat en radianes
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // en metros
    return d / 1000; // en kilómetros
};

// Función para formatear la fecha a YYYY-MM-DD
const formatDateForFirestore = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para formatear timestamps de Firebase a hora legible
const formatFirebaseTimestampToTime = (timestamp: any): string => {
  if (!timestamp || !timestamp.toDate) return 'N/A';
  return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Función para formatear duración en horas y minutos
const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};


const MapaRecorridoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute(); // Usar useRoute para obtener parámetros de navegación
  const { user, currentProject } = useAuth(); // Obtener usuario y proyecto actual

  // workerId es el ID del trabajador cuyo recorrido queremos ver
  // Puede venir de navigation.params o ser el propio usuario si es "Mi Recorrido"
  const targetWorkerId = (route.params as { workerId?: string })?.workerId || user?.id; 

  const [loading, setLoading] = useState(true);
  const [workerName, setWorkerName] = useState('Trabajador');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [pathCoordinates, setPathCoordinates] = useState<LatLng[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [activeTime, setActiveTime] = useState(0); // en milisegundos
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para mostrar el mapa.');
        setLoading(false);
        return;
      }
      
      // Obtener la ubicación actual del dispositivo para una región inicial si no hay path
      let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setInitialRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Si no hay targetWorkerId o currentProject, no se puede cargar el recorrido
      if (!targetWorkerId || !currentProject?.id) {
        Alert.alert('Error', 'No se pudo identificar al trabajador o el proyecto.');
        setLoading(false);
        return;
      }

      await fetchPathData(targetWorkerId, currentProject.id, selectedDate);
    })();
  }, [targetWorkerId, currentProject?.id, selectedDate]); // Depende del workerId, projectId y selectedDate

  const fetchPathData = async (workerId: string, projectId: string, date: Date) => {
    setLoading(true);
    try {
      // 1. Obtener nombre del trabajador
      const workerDocRef = doc(db, 'usuarios', workerId);
      const workerDocSnap = await getDoc(workerDocRef);
      if (workerDocSnap.exists()) {
        const workerData = workerDocSnap.data() as EquipoUserData;
        setWorkerName(workerData.name || 'Trabajador Desconocido');
      } else {
        setWorkerName('Trabajador No Encontrado');
      }

      // 2. Obtener datos de recorrido
      const formattedDate = formatDateForFirestore(date);
      const pathDocId = `${workerId}_${projectId}_${formattedDate}`;
      const pathDocRef = doc(db, 'ubicaciones_recorrido', pathDocId);
      const pathDocSnap = await getDoc(pathDocRef);

      let coordinates: LatLng[] = [];
      let totalDist = 0;
      let activeMs = 0;

      if (pathDocSnap.exists()) {
        const pathData = pathDocSnap.data() as UserPathData;
        const sortedLocations = pathData.locations.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        
        coordinates = sortedLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));

        // Calcular distancia y tiempo activo
        if (coordinates.length > 1) {
          for (let i = 0; i < coordinates.length - 1; i++) {
            totalDist += haversineDistance(
              coordinates[i].latitude, coordinates[i].longitude,
              coordinates[i+1].latitude, coordinates[i+1].longitude
            );
          }
          activeMs = sortedLocations[sortedLocations.length - 1].timestamp.toMillis() - sortedLocations[0].timestamp.toMillis();
        }
      } else {
        console.log(`No hay datos de recorrido para ${workerName} el ${formattedDate}`);
      }

      setPathCoordinates(coordinates);
      setTotalDistance(parseFloat(totalDist.toFixed(2))); // Redondear a 2 decimales
      setActiveTime(activeMs);

      // Ajustar la región inicial del mapa si hay coordenadas de recorrido
      if (coordinates.length > 0) {
        const firstPoint = coordinates[0];
        setInitialRegion({
          latitude: firstPoint.latitude,
          longitude: firstPoint.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } else if (!initialRegion) {
        // Fallback a la ubicación actual si no hay path y no se ha cargado initialRegion
        let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setInitialRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }

    } catch (error) {
      console.error('Error al cargar datos del recorrido:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del recorrido.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios'); // En iOS, se mantiene abierto hasta que se confirma
    if (selectedDate) {
      setSelectedDate(currentDate);
    }
  };

  if (loading || !initialRegion) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#7ED321" />
        <Text style={styles.loadingText}>Cargando mapa de recorrido...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000000" style={styles.headerIcon} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Recorrido de {workerName}</Text>

        <TouchableOpacity onPress={() => Alert.alert('Opciones', 'Aquí irán opciones futuras.')}>
          <Icon name="dots-vertical" size={24} color="#000000" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Icon name="calendar-month-outline" size={20} color="#000000" />
          <Text style={styles.dateButtonText}>Seleccionar Fecha</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()} // No permitir fechas futuras
          />
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          // followsUserLocation={true} // Esto puede interferir si queremos ver el recorrido pasado
          zoomEnabled={true}
          scrollEnabled={true}
        >
          {pathCoordinates.length > 0 && (
            <>
              <Polyline
                coordinates={pathCoordinates}
                strokeWidth={4}
                strokeColor="#7ED321"
                lineCap="round"
                lineJoin="round"
              />
              <Marker
                coordinate={pathCoordinates[0]}
                title="Inicio del Recorrido"
                pinColor="#000000"
              />
              {pathCoordinates.length > 1 && ( // Asegurarse de que haya al menos dos puntos para el fin
                <Marker
                  coordinate={pathCoordinates[pathCoordinates.length - 1]}
                  title="Fin del Recorrido"
                  pinColor="#7ED321"
                />
              )}
            </>
          )}
        </MapView>

        <View style={styles.mapLocationIcon}>
          <Icon name="map-marker" size={30} color="#000000" />
        </View>
      </View>

      {/* Time Range Slider (Eliminado según lo acordado) */}
      {/* Estadísticas */}
      <View style={styles.cardWrapper}>
        <View style={styles.statisticCard}>
          <View>
            <Text style={styles.cardTitle}>Distancia Total</Text>
            <Text style={styles.cardValue}>{totalDistance} km</Text>
          </View>
          <Icon name="walk" size={24} color="#000000" />
        </View>

        <View style={styles.statisticCard}>
          <View>
            <Text style={styles.cardTitle}>Tiempo Activo</Text>
            <Text style={styles.cardValue}>{formatDuration(activeTime)}</Text>
          </View>
          <Icon name="timer-outline" size={24} color="#000000" />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateText: { fontSize: 16, color: '#000000' },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  dateButtonText: { marginLeft: 5, fontSize: 14, color: '#000000' },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapLocationIcon: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  // timeSliderContainer y relacionados han sido eliminados.
  cardWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  statisticCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, color: '#666666', marginBottom: 5 },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: '#000000' },
});

export default MapaRecorridoScreen;