import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Text,
    ScrollView,
} from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
// Ya no necesitas importar setDoc, updateDoc, arrayUnion, serverTimestamp, Timestamp aquí
// La lógica de Firestore para guardar está en locationService.ts
import { getFirestore, collection, query, where, getDocs, doc } from 'firebase/firestore'; // Mantén solo lo necesario para cargar datos
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
// Importa el nuevo servicio de ubicación
import { saveUserLocation } from '../../services/locationService'; // <--- NUEVA IMPORTACIÓN
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Interfaces (las mantienes si las usas para workers, etc.) ---
type Worker = {
    id: string;
    nombre: string;
    rol: string;
    location?: { latitude: number; longitude: number };
    activo: boolean;
};

const MapaAuxiliarScreen = () => {
    const { currentProject, user } = useAuth();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [areaCoords, setAreaCoords] = useState<{ latitude: number; longitude: number }[]>([]);
    const [rutas, setRutas] = useState<{ latitude: number; longitude: number }[][]>([]);
    const [loading, setLoading] = useState(true);

    const db = getFirestore(app);

    // *** ELIMINAMOS guardarMiUbicacionEnFirestore de aquí ***
    // La lógica de guardado está ahora en src/services/locationService.ts

    const obtenerUbicacion = useCallback(async () => {
        console.log('DEBUG: Iniciando obtenerUbicacion...');
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            console.log('DEBUG: Ubicación obtenida:', loc.coords);
            setLocation(loc);
            
            // Asegúrate de que user y currentProject estén definidos antes de guardar
            if (loc && user?.id && currentProject?.id) { 
                console.log('DEBUG: Llamando a saveUserLocation desde obtenerUbicacion.');
                // *** AQUÍ ESTÁ EL CAMBIO CLAVE: LLAMAS AL SERVICIO EXTERNO ***
                await saveUserLocation(
                    user.id,
                    currentProject.id,
                    {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        timestamp: new Date(loc.timestamp) // Convierte a Date para el servicio
                    }
                );
            } else {
                console.log('DEBUG: No se guarda la ubicación porque loc es nulo o user.id/currentProject.id no existe.');
            }
        } catch (error) {
            console.error('ERROR EN obtenerUbicacion:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación.');
        } finally {
            console.log('DEBUG: obtenerUbicacion finalizada.');
        }
    }, [user?.id, currentProject?.id]); // Las dependencias se mantienen porque necesitas user.id y currentProject.id


    const cargarWorkers = useCallback(async () => {
        console.log('DEBUG: Iniciando cargarWorkers...');
        if (!currentProject?.id) {
            console.warn('cargarWorkers: No hay currentProject.id definido. No se cargarán trabajadores.');
            setWorkers([]);
            console.log('DEBUG: cargarWorkers finalizada (sin proyecto).');
            return;
        }
        try {
            const usersRef = collection(db, 'usuarios');
            const q = query(usersRef);
            const snapshot = await getDocs(q);

            const workersData: Worker[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const isAssignedToCurrentProject = data.proyectos && Object.prototype.hasOwnProperty.call(data.proyectos, currentProject.id);
                
                if (isAssignedToCurrentProject) {
                    const isLocationValid = data.location && data.location.latitude != null && data.location.longitude != null;

                    workersData.push({
                        id: docSnap.id,
                        nombre: data.name ?? data.nombre ?? 'Sin nombre',
                        rol: data.proyectos[currentProject.id] ?? 'Desconocido',
                        location: isLocationValid ? {
                            latitude: data.location.latitude,
                            longitude: data.location.longitude,
                        } : undefined,
                        activo: isLocationValid,
                    });
                }
            });
            setWorkers(workersData);
            console.log(`DEBUG: Cargados ${workersData.length} trabajadores.`);
        } catch (error) {
            console.error('ERROR AL CARGAR TRABAJADORES:', error);
            Alert.alert('Error', 'No se pudieron cargar los trabajadores.');
        } finally {
            console.log('DEBUG: cargarWorkers finalizada.');
        }
    }, [currentProject?.id, db]);

    const cargarAreaProyecto = useCallback(async () => {
        console.log('DEBUG: Iniciando cargarAreaProyecto...');
        if (!currentProject?.id) {
            console.log('DEBUG: cargarAreaProyecto finalizada (sin proyecto).');
            return;
        }
        try {
            const q = query(collection(db, 'proyectos'), where('__name__', '==', currentProject.id));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                console.warn(`cargarAreaProyecto: No se encontró el proyecto con ID ${currentProject.id}`);
                setAreaCoords([]);
                console.log('DEBUG: cargarAreaProyecto finalizada (proyecto no encontrado).');
                return;
            }
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.area && Array.isArray(data.area)) {
                    setAreaCoords(data.area.map((coord: any) => ({
                        latitude: coord.latitude,
                        longitude: coord.longitude,
                    })));
                    console.log(`DEBUG: Área del proyecto cargada con ${data.area.length} coordenadas.`);
                } else {
                    console.log('DEBUG: El proyecto no tiene un campo "area" válido.');
                    setAreaCoords([]);
                }
            });
        } catch (error) {
            console.error('ERROR AL CARGAR ÁREA DEL PROYECTO:', error);
            Alert.alert('Error', 'No se pudo cargar el área del proyecto.');
        } finally {
            console.log('DEBUG: cargarAreaProyecto finalizada.');
        }
    }, [currentProject?.id, db]);

    const cargarRutas = useCallback(async () => {
        console.log('DEBUG: Iniciando cargarRutas...');
        if (!currentProject?.id) {
            console.log('DEBUG: cargarRutas finalizada (sin proyecto).');
            return;
        }
        try {
            const q = query(collection(db, 'rutas'), where('proyectoId', '==', currentProject.id));
            const snapshot = await getDocs(q);

            const rutasData: { latitude: number; longitude: number }[][] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.path && Array.isArray(data.path)) {
                    rutasData.push(
                        data.path.map((point: any) => ({
                            latitude: point.latitude,
                            longitude: point.longitude,
                        }))
                    );
                }
            });
            setRutas(rutasData);
            console.log(`DEBUG: Cargadas ${rutasData.length} rutas.`);
        } catch (error) {
            console.error('ERROR AL CARGAR RUTAS:', error);
            Alert.alert('Error', 'No se pudieron cargar las rutas.');
        } finally {
            console.log('DEBUG: cargarRutas finalizada.');
        }
    }, [currentProject?.id, db]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;

        const initAndStartInterval = async () => {
            console.log('DEBUG: useEffect: Iniciando initAndStartInterval.');

            if (!user?.id || !currentProject?.id) {
                console.log('DEBUG: useEffect: Esperando user.id o currentProject.id para iniciar la carga completa.');
                setLoading(true);
                return;
            }

            console.log('DEBUG: useEffect: User.id y currentProject.id están listos. Procediendo con la inicialización.');
            console.log(`DEBUG: User ID: ${user.id}, Project ID: ${currentProject.id}`);

            try {
                console.log('DEBUG: Solicitando permisos de ubicación...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso requerido', 'Se requieren permisos de ubicación.');
                    setLoading(false);
                    console.log('DEBUG: Permisos de ubicación NO concedidos. Init aborted.');
                    return;
                }
                console.log('DEBUG: Permisos de ubicación concedidos.');

                console.log('DEBUG: Llamando a obtenerUbicacion...');
                await obtenerUbicacion(); // Esto ahora llama a saveUserLocation internamente
                console.log('DEBUG: await obtenerUbicacion completado.');

                console.log('DEBUG: Llamando a cargarWorkers...');
                await cargarWorkers();
                console.log('DEBUG: await cargarWorkers completado.');

                console.log('DEBUG: Llamando a cargarAreaProyecto...');
                await cargarAreaProyecto();
                console.log('DEBUG: await cargarAreaProyecto completado.');

                console.log('DEBUG: Llamando a cargarRutas...');
                await cargarRutas();
                console.log('DEBUG: await cargarRutas completado.');

                setLoading(false);
                console.log('DEBUG: Todas las cargas iniciales completadas. setLoading(false) ejecutado.');

                // Establecer el intervalo solo si los permisos están concedidos y hay usuario/proyecto
                intervalId = setInterval(async () => {
                    console.log('DEBUG: Intervalo activo: Actualizando ubicación y trabajadores...');
                    await obtenerUbicacion(); // Esto ahora llamará a saveUserLocation
                    await cargarWorkers();
                }, 10000); // Actualiza cada 10 segundos

            } catch (initError) {
                console.error('ERROR FATAL EN initAndStartInterval:', initError);
                Alert.alert('Error de Inicialización', 'Ocurrió un error al cargar los datos iniciales del mapa.');
                setLoading(false);
            }
        };

        // Limpiar cualquier intervalo existente al re-renderizar o desmontar
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = undefined;
            console.log('DEBUG: Limpiando intervalo anterior.');
        }

        initAndStartInterval(); // Llama a la función para iniciar todo

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log('DEBUG: Cleanup: Intervalo limpiado al desmontar/re-ejecutar efecto.');
            }
        };
    }, [user?.id, currentProject?.id, obtenerUbicacion, cargarWorkers, cargarAreaProyecto, cargarRutas]);

    if (loading || !location) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#7ED321" />
                <Text style={{ marginTop: 10, color: '#666' }}>Cargando datos del mapa...</Text>
            </View>
        );
    }

    const initialMapRegion = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    } : {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 100,
        longitudeDelta: 100,
    };

    // Separar trabajadores activos e inactivos para la visualización
    const activeWorkers = workers.filter(worker => worker.activo);
    const inactiveWorkers = workers.filter(worker => !worker.activo);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialMapRegion}
                showsUserLocation
            >
                {workers.map(worker => (
                    worker.location && (
                        <Marker
                            key={worker.id}
                            coordinate={worker.location}
                            title={worker.nombre}
                            description={worker.rol + (worker.activo ? ' (Activo)' : ' (Inactivo)')}
                            pinColor={worker.activo ? "#007AFF" : "#FF0000"}
                        />
                    )
                ))}

                {areaCoords.length > 0 && (
                    <Polygon
                        coordinates={areaCoords}
                        strokeColor="#FF5733"
                        fillColor="rgba(255, 87, 51, 0.2)"
                        strokeWidth={2}
                    />
                )}

                {rutas.map((ruta, index) => (
                    <Polyline
                        key={index}
                        coordinates={ruta}
                        strokeColor="#34A853"
                        strokeWidth={3}
                    />
                ))}
            </MapView>

            <TouchableOpacity
                style={styles.centerButton}
                onPress={() => {
                    if (location) {
                        // Puedes centrar el mapa a la ubicación actual del usuario aquí
                        // Esto requiere una referencia al MapView o controlar la región del estado
                        // Por simplicidad, solo llamamos a obtenerUbicacion de nuevo para asegurar que se actualice la vista
                        obtenerUbicacion(); 
                    }
                }}
            >
                <Icon name="crosshairs-gps" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.workerListContainer}>
                <Text style={styles.listTitle}>Trabajadores en el Proyecto ({workers.length})</Text>
                <ScrollView style={styles.scrollView}>
                    {/* Sección para trabajadores activos */}
                    {activeWorkers.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Activos</Text>
                            {activeWorkers.map(worker => (
                                <View 
                                    key={worker.id} 
                                    style={[
                                        styles.workerItem, 
                                        styles.activeWorkerItem
                                    ]}
                                >
                                    <Text style={styles.workerName}>{worker.nombre}</Text>
                                    <Text style={styles.workerRole}>{worker.rol}</Text>
                                    <Text style={[styles.workerStatus, { color: '#007AFF' }]}>
                                        Activo
                                    </Text>
                                    {worker.location && (
                                        <Text style={styles.workerLocation}>
                                            Lat: {worker.location.latitude.toFixed(4)}, Lon: {worker.location.longitude.toFixed(4)}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </>
                    )}

                    {/* Sección para trabajadores inactivos */}
                    {inactiveWorkers.length > 0 && (
                        <>
                            <Text style={[styles.sectionTitle, styles.inactiveSectionTitle]}>Inactivos</Text>
                            {inactiveWorkers.map(worker => (
                                <View 
                                    key={worker.id} 
                                    style={[
                                        styles.workerItem, 
                                        styles.inactiveWorkerItem
                                    ]}
                                >
                                    <Text style={styles.workerName}>{worker.nombre}</Text>
                                    <Text style={styles.workerRole}>{worker.rol}</Text>
                                    <Text style={[styles.workerStatus, { color: '#FF0000' }]}>
                                        Inactivo
                                    </Text>
                                    {worker.location && (
                                        <Text style={styles.workerLocation}>
                                            Lat: {worker.location.latitude.toFixed(4)}, Lon: {worker.location.longitude.toFixed(4)}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </>
                    )}

                    {workers.length === 0 && (
                        <Text style={styles.noWorkersText}>No hay trabajadores en este proyecto.</Text>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

export default MapaAuxiliarScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 2,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    centerButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#7ED321',
        borderRadius: 30,
        padding: 15,
        elevation: 5,
        zIndex: 1,
    },
    workerListContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    inactiveSectionTitle: {
        color: '#888',
    },
    scrollView: {
        flex: 1,
    },
    workerItem: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    activeWorkerItem: {
        borderColor: '#7ED321',
        borderWidth: 1,
    },
    inactiveWorkerItem: {
        borderColor: '#ccc',
        borderWidth: 1,
        opacity: 0.7,
    },
    workerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    workerRole: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    workerStatus: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
    },
    workerLocation: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
    noWorkersText: {
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
        color: '#888',
        paddingBottom: 10,
    },
});