import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const MapaRecorridoScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('April 20, 2025');
  const [timeRange, setTimeRange] = useState({ start: '09:00 AM', end: '05:00 PM' });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const handleSelectDate = () => {
    console.log('Select Date clicked');
  };

  const handleSliderChange = (value: number) => {
    console.log('Slider value changed:', value);
  };

  const routeCoordinates = [
    { latitude: -12.046374, longitude: -77.042793 },
    { latitude: -12.050000, longitude: -77.045000 },
    { latitude: -12.053000, longitude: -77.047000 },
    { latitude: -12.055000, longitude: -77.050000 },
    { latitude: -12.058000, longitude: -77.052000 },
    { latitude: -12.060000, longitude: -77.055000 },
    { latitude: -12.062000, longitude: -77.058000 },
    { latitude: -12.065000, longitude: -77.060000 },
    { latitude: -12.068000, longitude: -77.062000 },
    { latitude: -12.070000, longitude: -77.065000 },
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para usar esta función.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  if (!location) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#7ED321" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
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

        <Text style={styles.headerTitle}>Worker Path History</Text>

        <TouchableOpacity onPress={() => console.log('Opciones')}>
          <Icon name="dots-vertical" size={24} color="#000000" style={styles.headerIcon} />
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>{selectedDate}</Text>
        <TouchableOpacity onPress={handleSelectDate} style={styles.dateButton}>
          <Icon name="calendar-month-outline" size={20} color="#000000" />
          <Text style={styles.dateButtonText}>Select Date</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          zoomEnabled={true}
          scrollEnabled={true}
        >
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#7ED321"
            lineCap="round"
            lineJoin="round"
          />
          {routeCoordinates.length > 0 && (
            <>
              <Marker
                coordinate={routeCoordinates[0]}
                title="Inicio del Recorrido"
                pinColor="#000000"
              />
              <Marker
                coordinate={routeCoordinates[routeCoordinates.length - 1]}
                title="Fin del Recorrido"
                pinColor="#7ED321"
              />
            </>
          )}
        </MapView>

        <View style={styles.mapLocationIcon}>
          <Icon name="map-marker" size={30} color="#000000" />
        </View>
      </View>

      {/* Time Range Slider (simulada) */}
      <View style={styles.timeSliderContainer}>
        <Text style={styles.timeText}>{timeRange.start}</Text>
        <View style={styles.sliderLine}>
          <View style={styles.sliderThumb} />
        </View>
        <Text style={styles.timeText}>{timeRange.end}</Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.cardWrapper}>
        <View style={styles.statisticCard}>
          <View>
            <Text style={styles.cardTitle}>Total Distance</Text>
            <Text style={styles.cardValue}>12.5 km</Text>
          </View>
          <Icon name="share-variant" size={24} color="#000000" />
        </View>

        <View style={styles.statisticCard}>
          <View>
            <Text style={styles.cardTitle}>Active Time</Text>
            <Text style={styles.cardValue}>7h 30m</Text>
          </View>
          <Icon name="clock-outline" size={24} color="#000000" />
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
  timeSliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timeText: { fontSize: 14, color: '#000000' },
  sliderLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7ED321',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
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
