// src/screens/Operador/MapaOperadorScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
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
    const [selectedTroncos, setSelectedTroncos] = useState<Set<string>>(new Set());
    const { currentProject } = useAuth();
    const navigation = useNavigation<NavigationProp>();

    // Estados y refs para la funcionalidad de dibujo
    const [drawingMode, setDrawingMode] = useState(false);
    const [drawingCoordinates, setDrawingCoordinates] = useState<LatLng[]>([]);
    const mapRef = useRef<MapView>(null);

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
                                    ? '#0000FF'
                                    : '#FFA500'
                                : '#808080'
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
                {drawingMode ? ( // Renderiza los botones de dibujo si drawingMode es true
                    <>
                        <TouchableOpacity
                            style={[styles.button, styles.toggleDrawButton]} // Mantén este botón siempre visible
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
                ) : ( // Renderiza los botones de transporte si drawingMode es false
                    <>
                        <TouchableOpacity
                            style={[styles.button, styles.toggleDrawButton]} // Este botón es el mismo, pero con texto diferente
                            onPress={handleToggleDrawingMode}
                        >
                            <Icon name="gesture-tap-box" size={20} color="#fff" />
                            <Text style={styles.buttonText}>Activar Dibujo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                selectedTroncos.size === 0 ? styles.buttonDisabled : styles.buttonPrimary // Un nuevo estilo para el botón habilitado
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
        gap: 10, // Usar 'gap' si estás en React Native 0.71+, de lo contrario, usa 'marginBottom' en los botones.
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        elevation: 5,
        minHeight: 50, // Asegura una altura mínima para evitar que se "encoga" visualmente
    },
    buttonDisabled: {
        backgroundColor: '#cccccc', // Gris para deshabilitado
    },
    buttonPrimary: { // Nuevo estilo para el botón "Iniciar Transporte" habilitado
        backgroundColor: '#7ED321', // Verde
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 16,
    },
    drawButton: {
        backgroundColor: '#DC3545', // Rojo para "Finalizar Dibujo"
    },
    toggleDrawButton: {
        backgroundColor: '#007BFF', // Azul para "Activar/Salir del Dibujo"
    },
});