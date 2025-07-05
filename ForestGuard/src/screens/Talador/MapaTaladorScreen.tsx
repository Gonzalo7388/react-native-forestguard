import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Text, // Make sure Text is imported
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { saveUserLocation } from '../../services/locationService';

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

    const obtenerUbicacion = useCallback(async () => {
        console.log('DEBUG (Talador): Iniciando obtenerUbicacion...');
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            console.log('DEBUG (Talador): Ubicación obtenida:', loc.coords);
            setLocation(loc);

            if (loc && user?.id && currentProject?.id) {
                console.log('DEBUG (Talador): Llamando a saveUserLocation desde obtenerUbicacion.');
                await saveUserLocation(
                    user.id,
                    currentProject.id,
                    {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        timestamp: new Date(loc.timestamp)
                    }
                );
            } else {
                console.warn('DEBUG (Talador): No se guarda la ubicación porque loc es nulo o user.id/currentProject.id no existe.');
            }

        } catch (error) {
            console.error('ERROR (Talador) al obtener ubicación:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
        } finally {
            console.log('DEBUG (Talador): obtenerUbicacion finalizada.');
        }
    }, [user?.id, currentProject?.id]);

    const cargarArboles = async () => {
        console.log('DEBUG (Talador): Iniciando cargarArboles...');
        if (!currentProject?.id) {
            console.warn('cargarArboles (Talador): No hay currentProject.id definido. No se cargarán árboles.');
            Alert.alert('Error', 'No tienes un proyecto seleccionado.');
            setLoading(false);
            return;
        }
        try {
            const db = getFirestore(app);
            const arbolesRef = collection(db, 'arboles');
            const q = query(
                arbolesRef,
                where('proyectoId', '==', currentProject.id)
            );
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
            console.log(`DEBUG (Talador): Cargados ${arbolesData.length} árboles.`);
        } catch (error) {
            console.error('ERROR (Talador) al cargar árboles:', error);
            Alert.alert('Error', 'No se pudieron cargar los árboles.');
        } finally {
            setLoading(false);
            console.log('DEBUG (Talador): cargarArboles finalizada.');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        const initMap = async () => {
            console.log('DEBUG (Talador): useEffect: Iniciando initMap.');
            if (!user?.id || !currentProject?.id) {
                console.log('DEBUG (Talador): useEffect: Esperando user.id o currentProject.id para iniciar la carga.');
                setLoading(true);
                return;
            }

            try {
                console.log('DEBUG (Talador): Solicitando permisos de ubicación...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para usar el mapa.');
                    setLoading(false);
                    return;
                }
                console.log('DEBUG (Talador): Permisos de ubicación concedidos.');

                console.log('DEBUG (Talador): Llamando a obtenerUbicacion inicial...');
                await obtenerUbicacion();
                console.log('DEBUG (Talador): await obtenerUbicacion inicial completado.');

                console.log('DEBUG (Talador): Llamando a cargarArboles...');
                await cargarArboles();
                console.log('DEBUG (Talador): await cargarArboles completado.');

                setLoading(false);
                console.log('DEBUG (Talador): Carga inicial completada. setLoading(false) ejecutado.');

                interval = setInterval(async () => {
                    console.log('DEBUG (Talador): Intervalo activo: Actualizando ubicación y árboles...');
                    await obtenerUbicacion();
                    await cargarArboles();
                }, 15000);
            } catch (initError) {
                console.error('ERROR FATAL (Talador) en initMap:', initError);
                Alert.alert('Error de Inicialización', 'Ocurrió un error al cargar los datos iniciales del mapa.');
                setLoading(false);
            }
        };

        if (interval) {
            clearInterval(interval);
            interval = undefined;
            console.log('DEBUG (Talador): Limpiando intervalo anterior.');
        }

        initMap();

        return () => {
            if (interval) {
                clearInterval(interval);
                console.log('DEBUG (Talador): Cleanup: Intervalo limpiado al desmontar/re-ejecutar efecto.');
            }
        };
    }, [user?.id, currentProject?.id, obtenerUbicacion]);

    if (loading || !location) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#7ED321" />
                <Text style={{ marginTop: 10, color: '#666' }}>Cargando mapa y árboles...</Text>
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
                        pinColor={arbol.estado === 'talado' ? '#808080' : '#7ED321'}
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