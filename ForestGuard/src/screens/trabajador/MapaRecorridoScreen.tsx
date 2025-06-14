import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker } from 'react-native-maps'; // Import MapView and Polyline
import * as Location from 'expo-location'; // For location access

const screenWidth = Dimensions.get('window').width;

const MapaRecorridoScreen = () => {
  const [selectedDate, setSelectedDate] = useState('April 20, 2025');
  const [timeRange, setTimeRange] = useState({ start: '09:00 AM', end: '05:00 PM' });
  const [location, setLocation] = useState<Location.LocationObject | null>(null); // State for current location

  // Placeholder function for date selection
  const handleSelectDate = () => {
    console.log('Select Date clicked');
    // In a real app, this would open a date picker
  };

  // Placeholder function for slider value change
  const handleSliderChange = (value) => {
    console.log('Slider value changed:', value);
    // This would update timeRange based on slider value in a real implementation
  };

  // Dummy coordinates for the route path
  const routeCoordinates = [
    { latitude: -12.046374, longitude: -77.042793 }, // Lima center (example start)
    { latitude: -12.050000, longitude: -77.045000 },
    { latitude: -12.053000, longitude: -77.047000 },
    { latitude: -12.055000, longitude: -77.050000 },
    { latitude: -12.058000, longitude: -77.052000 },
    { latitude: -12.060000, longitude: -77.055000 },
    { latitude: -12.062000, longitude: -77.058000 },
    { latitude: -12.065000, longitude: -77.060000 },
    { latitude: -12.068000, longitude: -77.062000 },
    { latitude: -12.070000, longitude: -77.065000 }, // Example end point
  ];

  // Effect to get current location
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
        <Icon name="arrow-left" size={24} color="#000000" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Worker Path History</Text>
        <Icon name="dots-vertical" size={24} color="#000000" style={styles.headerIcon} />
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>{selectedDate}</Text>
        <TouchableOpacity onPress={handleSelectDate} style={styles.dateButton}>
          <Icon name="calendar-month-outline" size={20} color="#000000" />
          <Text style={styles.dateButtonText}>Select Date</Text>
        </TouchableOpacity>
      </View>

      {/* Real Map View */}
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
          {/* Draw the route path */}
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#7ED321" // Lime green for the route
            lineCap="round"
            lineJoin="round"
          />
          {/* Optionally add markers for start and end points of the route */}
          {routeCoordinates.length > 0 && (
            <>
              <Marker
                coordinate={routeCoordinates[0]}
                title="Inicio del Recorrido"
                pinColor="#000000" // Black pin for start
              />
              <Marker
                coordinate={routeCoordinates[routeCoordinates.length - 1]}
                title="Fin del Recorrido"
                pinColor="#7ED321" // Lime green pin for end
              />
            </>
          )}
        </MapView>
        {/* Location icon on the map - kept for consistency with mockup, could be redundant with showsUserLocation */}
        <View style={styles.mapLocationIcon}>
          <Icon name="map-marker" size={30} color="#000000" />
        </View>
      </View>

      {/* Time Slider */}
      <View style={styles.timeSliderContainer}>
        <Text style={styles.timeText}>{timeRange.start}</Text>
        {/* Simple visual representation of the slider thumb */}
        <View style={styles.sliderLine}>
          <View style={styles.sliderThumb} />
        </View>
        <Text style={styles.timeText}>{timeRange.end}</Text>
      </View>

      {/* Statistic Cards */}
      <View style={styles.cardWrapper}>
        <View style={styles.statisticCard}>
          <View>
            <Text style={styles.cardTitle}>Total Distance</Text>
            <Text style={styles.cardValue}>12.5 km</Text>
          </View>
          <Icon name="share-variant" size={24} color="#000000" /> {/* Share icon */}
        </View>

        <View style={styles.statisticCard}>
          <View>
            <Text style={styles.cardTitle}>Active Time</Text>
            <Text style={styles.cardValue}>7h 30m</Text>
          </View>
          <Icon name="clock-outline" size={24} color="#000000" /> {/* Clock icon */}
        </View>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light grey background
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF', // White header background
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Light grey border
  },
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black text
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF', // White background
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#000000', // Black text
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#E0E0E0', // Light grey button background
  },
  dateButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#000000', // Black text
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden', // Hide overflow for rounded corners
    borderWidth: 1, // Add a border to the map container
    borderColor: '#E0E0E0', // Light grey border
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Make map fill its container
  },
  mapPlaceholderText: { // No longer used but keeping for reference if needed
    fontSize: 16,
    color: '#666666', // Dark grey placeholder text
  },
  routePathPlaceholder: { // No longer used as Polyline is used
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: '80%',
    height: 3,
    backgroundColor: '#7ED321', // Lime green for the route path
    borderRadius: 2,
    transform: [{ rotate: '5deg' }], // Slight angle for visual interest
  },
  mapLocationIcon: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#FFFFFF', // White background for the icon
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1, // Ensure icon is above the map
  },
  timeSliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#000000', // Black time text
  },
  sliderLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0', // Light grey line
    borderRadius: 2,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7ED321', // Lime green thumb
    borderWidth: 2,
    borderColor: '#FFFFFF', // White border for the thumb
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statisticCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White card background
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: '#666666', // Dark grey title
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // Black value
  },
  bottomNavPlaceholder: {
    height: 70, // Approximate height for bottom nav
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bottomNavText: {
    color: '#666666',
    fontSize: 12,
  },
});

export default MapaRecorridoScreen;
