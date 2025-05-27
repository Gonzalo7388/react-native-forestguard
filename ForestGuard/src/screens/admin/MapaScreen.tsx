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
import Header from '../../components/Header';

type RootStackParamList = {
  Mapa: undefined;
  Estadisticas: undefined;
  Control: undefined;
};

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      <Header title="Mapa" />
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
        zoomEnabled={true}
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Tú estás aquí"
          description="Ubicación actual"
          pinColor="blue"
        />
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
          numColumns={2}
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
  container: {
    flex: 1,
    backgroundColor: '#422E13',
  },
  map: {
    flex: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#422E13',
  },
  grillaContainer: {
    flex: 1,
    backgroundColor: '#422E13',
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: '#878532',
  },
  tituloGrilla: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#DBB95F',
    marginBottom: 12,
    textAlign: 'center',
  },
  usuarioCard: {
    flex: 1,
    margin: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#7F5F16',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  usuarioActivo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usuarioInactivo: {
    color: '#878532',
    fontSize: 16,
  },
  rolText: {
    fontSize: 14,
    color: '#DBB95F',
    marginTop: 4,
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#422E13',
  },
  boton: {
    backgroundColor: '#537636',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MapaScreen;
