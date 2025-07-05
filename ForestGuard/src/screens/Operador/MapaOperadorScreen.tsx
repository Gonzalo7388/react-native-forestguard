import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Text,
    Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polygon, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth'; // Make sure useAuth provides the user object
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { saveUserLocation } from '../../services/locationService'; // Import the service

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
    const [selectedTroncos, setSelectedTroncos] = useState<Set<string>>(new Set());
    const { currentProject, user } = useAuth(); // Destructure user from useAuth
    const navigation = useNavigation<NavigationProp>();

    // Estados y refs para la funcionalidad de dibujo
    const [drawingMode, setDrawingMode] = useState(false);
    const [drawingCoordinates, setDrawingCoordinates] = useState<LatLng[]>([]);
    const mapRef = useRef<MapView>(null);

    const obtenerUbicacion = useCallback(async () => {
        console.log('DEBUG (Operador): Iniciando obtenerUbicacion...');
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            console.log('DEBUG (Operador): Ubicación obtenida:', loc.coords);
            setLocation(loc);

            // --- INICIO DEL CAMBIO CLAVE ---
            // Guardar la ubicación del usuario en Firestore
            if (loc && user?.id && currentProject?.id) {
                console.log('DEBUG (Operador): Llamando a saveUserLocation desde obtenerUbicacion.');
                await saveUserLocation(
                    user.id,
                    currentProject.id,
                    {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        timestamp: new Date(loc.timestamp) // Ensure timestamp is a Date object
                    }
                );
            } else {
                console.warn('DEBUG (Operador): No se guarda la ubicación porque loc es nulo o user.id/currentProject.id no existe.');
            }
            // --- FIN DEL CAMBIO CLAVE ---

        } catch (error) {
            console.error('ERROR (Operador) al obtener ubicación:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
        } finally {
            console.log('DEBUG (Operador): obtenerUbicacion finalizada.');
        }
    }, [user?.id, currentProject?.id]); // Add user.id and currentProject.id to dependencies

    const cargarTroncos = async () => {
        console.log('DEBUG (Operador): Iniciando cargarTroncos...');
        if (!currentProject?.id) {
            console.warn('cargarTroncos (Operador): No hay currentProject.id definido. No se cargarán troncos.');
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
            console.log(`DEBUG (Operador): Cargados ${troncosData.length} troncos.`);
        } catch (error) {
            console.error('ERROR (Operador) al cargar troncos:', error);
            Alert.alert('Error', 'No se pudieron cargar los troncos.');
        } finally {
            setLoading(false);
            console.log('DEBUG (Operador): cargarTroncos finalizada.');
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        const initMap = async () => {
            console.log('DEBUG (Operador): useEffect: Iniciando initMap.');
            if (!user?.id || !currentProject?.id) {
                console.log('DEBUG (Operador): useEffect: Esperando user.id o currentProject.id para iniciar la carga.');
                setLoading(true);
                return;
            }

            try {
                console.log('DEBUG (Operador): Solicitando permisos de ubicación...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para usar el mapa.');
                    setLoading(false);
                    return;
                }
                console.log('DEBUG (Operador): Permisos de ubicación concedidos.');

                console.log('DEBUG (Operador): Llamando a obtenerUbicacion inicial...');
                await obtenerUbicacion();
                console.log('DEBUG (Operador): await obtenerUbicacion inicial completado.');

                console.log('DEBUG (Operador): Llamando a cargarTroncos...');
                await cargarTroncos();
                console.log('DEBUG (Operador): await cargarTroncos completado.');

                setLoading(false);
                console.log('DEBUG (Operador): Carga inicial completada. setLoading(false) ejecutado.');

                // Configurar el intervalo para actualizar ubicación y troncos
                interval = setInterval(async () => {
                    console.log('DEBUG (Operador): Intervalo activo: Actualizando ubicación y troncos...');
                    await obtenerUbicacion();
                    await cargarTroncos(); // También es bueno recargar troncos periódicamente
                }, 15000); // Actualiza cada 15 segundos
            } catch (initError) {
                console.error('ERROR FATAL (Operador) en initMap:', initError);
                Alert.alert('Error de Inicialización', 'Ocurrió un error al cargar los datos iniciales del mapa.');
                setLoading(false);
            }
        };

        if (interval) {
            clearInterval(interval);
            interval = undefined;
            console.log('DEBUG (Operador): Limpiando intervalo anterior.');
        }

        initMap();

        return () => {
            if (interval) {
                clearInterval(interval);
                console.log('DEBUG (Operador): Cleanup: Intervalo limpiado al desmontar/re-ejecutar efecto.');
            }
        };
    }, [user?.id, currentProject?.id, obtenerUbicacion]); // Add obtenerUbicacion to dependencies

    const toggleSeleccionTronco = (id: string) => {
        setSelectedTroncos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // --- Funciones para la funcionalidad de dibujo ---
    const handleMapPress = (event: any) => {
        const { coordinate } = event.nativeEvent;

        if (drawingMode) {
            setDrawingCoordinates(prev => [...prev, coordinate]);
        }
    };

    const handleToggleDrawingMode = () => {
        setDrawingMode(prev => !prev);
        setDrawingCoordinates([]);
    };

    const handleSelectByDrawing = () => {
        if (drawingCoordinates.length < 3) {
            Alert.alert('Aviso', 'Dibuja al menos 3 puntos para formar un polígono de selección.');
            return;
        }

        const newSelectedTroncos = new Set(selectedTroncos);
        let newlySelectedCount = 0;
        troncos.forEach(tronco => {
            if (tronco.estado === 'en_espera') {
                const troncoPoint = { latitude: tronco.latitud, longitude: tronco.longitud };
                if (isPointInPolygon(troncoPoint, drawingCoordinates)) {
                    if (!newSelectedTroncos.has(tronco.id)) {
                        newSelectedTroncos.add(tronco.id);
                        newlySelectedCount++;
                    }
                }
            }
        });
        setSelectedTroncos(newSelectedTroncos);
        setDrawingMode(false); // Desactiva el modo de dibujo
        setDrawingCoordinates([]); // Limpia el polígono dibujado
        Alert.alert(
            'Selección por Dibujo',
            `Se han seleccionado ${newlySelectedCount} troncos nuevos.`
        );
    };

    const isPointInPolygon = (point: LatLng, polygon: LatLng[]) => {
        let x = point.longitude, y = point.latitude;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            let xi = polygon[i].longitude, yi = polygon[i].latitude;
            let xj = polygon[j].longitude, yj = polygon[j].latitude;

            let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };
    // --- Fin funciones de dibujo ---


    if (loading || !location) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#7ED321" />
                <Text style={{ marginTop: 10, color: '#666' }}>Cargando mapa y troncos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation
                onPress={handleMapPress}
            >
                {troncos.map(tronco => (
                    <Marker
                        key={tronco.id}
                        coordinate={{ latitude: tronco.latitud, longitude: tronco.longitud }}
                        title={tronco.especie}
                        description={tronco.descripcion}
                        pinColor={
                            tronco.estado === 'en_espera'
                                ? selectedTroncos.has(tronco.id)
                                    ? '#0000FF' // Azul para seleccionado
                                    : '#FFA500' // Naranja para en espera
                                : '#808080' // Gris para en transporte
                        }
                        onPress={() => {
                            if (tronco.estado === 'en_espera' && !drawingMode) {
                                toggleSeleccionTronco(tronco.id);
                            } else if (tronco.estado === 'en_transporte') {
                                Alert.alert('Información', 'Este tronco ya está en transporte.');
                            } else if (drawingMode) {
                                Alert.alert('Aviso', 'Desactiva el modo de dibujo para seleccionar marcadores individualmente.');
                            }
                        }}
                    />
                ))}

                {drawingMode && drawingCoordinates.length > 0 && (
                    <Polygon
                        coordinates={drawingCoordinates}
                        strokeColor="#FF0000"
                        fillColor="rgba(255,0,0,0.3)"
                        strokeWidth={2}
                    />
                )}
            </MapView>

            <View style={styles.bottomButtonsContainer}>
                {drawingMode ? (
                    <>
                        <TouchableOpacity
                            style={[styles.button, styles.toggleDrawButton]}
                            onPress={handleToggleDrawingMode}
                        >
                            <Icon name="gesture-tap-box" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Salir del Dibujo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.drawButton]}
                            onPress={handleSelectByDrawing}
                        >
                            <Text style={styles.buttonText}>Finalizar Dibujo ({drawingCoordinates.length} puntos)</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.button, styles.toggleDrawButton]}
                            onPress={handleToggleDrawingMode}
                        >
                            <Icon name="gesture-tap-box" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Activar Dibujo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                selectedTroncos.size === 0 ? styles.buttonDisabled : styles.buttonPrimary
                            ]}
                            onPress={() =>
                                selectedTroncos.size > 0 &&
                                navigation.navigate('ConfirmarTransporteTroncos', { troncoIds: Array.from(selectedTroncos) })
                            }
                            disabled={selectedTroncos.size === 0}
                        >
                            <Text style={styles.buttonText}>
                                Iniciar Transporte ({selectedTroncos.size})
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
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
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'column',
        gap: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        elevation: 5,
        minHeight: 50,
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
    },
    buttonPrimary: {
        backgroundColor: '#7ED321',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 16,
    },
    drawButton: {
        backgroundColor: '#DC3545',
    },
    toggleDrawButton: {
        backgroundColor: '#007BFF',
    },
});