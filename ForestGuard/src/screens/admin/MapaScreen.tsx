import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../../components/Header'; // Assuming Header component exists

// Define the RootStackParamList for navigation typing
type RootStackParamList = {
  Mapa: undefined;
  Estadisticas: undefined;
  Control: undefined;
};

// Define the structure for a User object
type Usuario = {
  id: string;
  nombre: string;
  rol: string;
  conectado: boolean;
};

// Sample user data
const usuariosPrueba: Usuario[] = [
  { id: '1', nombre: 'Carlos Perez', rol: 'Talador', conectado: true },
  { id: '2', nombre: 'Ana Torres', rol: 'Jefe de equipo', conectado: true },
  { id: '3', nombre: 'Luis Ramos', rol: 'Talador', conectado: false },
];

const MapaScreen = () => {
  // State to store the user's current location
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  // Navigation hook
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Function to get the current location
  const obtenerUbicacion = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      // In a real app, you might want to show a more user-friendly error message
    }
  };

  // Effect hook to request location permission and continuously get location updates
  useEffect(() => {
    const requestLocationAndStartUpdates = async () => {
      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para usar esta función.');
        return;
      }

      // Get initial location
      await obtenerUbicacion();

      // Set up interval to update location every 10 seconds
      const interval = setInterval(obtenerUbicacion, 10000); // every 10 seconds

      // Cleanup function to clear the interval when the component unmounts
      return () => clearInterval(interval);
    };

    requestLocationAndStartUpdates();
  }, []); // Empty dependency array means this effect runs once on mount

  // Show a loading indicator if location is not yet available
  if (!location) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7ED321" /> {/* Use the lime green for loader */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header component */}
      <Header title="Mapa" />

      {/* Map component */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE} // Specify Google Maps provider
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true} // Show the user's current location dot
        zoomEnabled={true} // Allow zooming on the map
      >
        {/* Marker for current user location */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Tú estás aquí"
          description="Ubicación actual"
          pinColor="#7ED321" // Use lime green for the user marker
        />
        {/* Static reference point marker */}
        <Marker
          coordinate={{ latitude: -12.136134, longitude: -76.986951 }}
          title="Punto de referencia"
          description="Ubicación estática"
          pinColor="#000000" // Use black for a reference marker
        />
      </MapView>

      {/* User grid container */}
      <View style={styles.grillaContainer}>
        <Text style={styles.tituloGrilla}>Usuarios Conectados</Text>
        <FlatList
          data={usuariosPrueba}
          keyExtractor={(item) => item.id}
          numColumns={2} // Display users in a 2-column grid
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

// StyleSheet for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
  },
  map: {
    flex: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for loader
  },
  grillaContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: '#000000', // Black border for separation
  },
  tituloGrilla: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000', // Black title
    marginBottom: 12,
    textAlign: 'center',
  },
  usuarioCard: {
    flex: 1,
    margin: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#7ED321', // Lime green background for cards
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  usuarioActivo: {
    color: '#FFFFFF', // White text for active users
    fontSize: 16,
    fontWeight: 'bold',
  },
  usuarioInactivo: {
    color: '#000000', // Black text for inactive users
    fontSize: 16,
  },
  rolText: {
    fontSize: 14,
    color: '#FFFFFF', // White text for role
    marginTop: 4,
  },
  // Note: botonesContainer and boton styles were not used in the provided JSX,
  // but I'm updating them here in case you reintroduce them.
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF', // White background
  },
  boton: {
    backgroundColor: '#7ED321', // Lime green button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  botonTexto: {
    color: '#FFFFFF', // White text for buttons
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MapaScreen;
