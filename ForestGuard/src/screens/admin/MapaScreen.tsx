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
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { saveUserLocation } from '../../services/locationService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Interfaces (mantén todas las que definiste antes) ---
type Worker = {
    id: string;
    nombre: string;
    rol: string;
    location?: { latitude: number; longitude: number };
    activo: boolean;
};

type AlertData = {
    id: string;
    descripcion: string;
    location: { latitude: number; longitude: number };
    tipo: string;
    resuelta: boolean;
    timestamp: Date;
};

type TreeData = {
    id: string;
    descripcion: string;
    especie: string;
    estado: string;
    latitud: number;
    longitud: number;
    timestamp: Date;
};

type TrunkData = {
    id: string;
    descripcion: string;
    especie: string;
    estado: string;
    latitud: number;
    longitud: number;
    timestamp: Date;
};

type TransportRouteData = {
    id: string;
    points: { latitude: number; longitude: number; timestamp: Date }[];
    status: string;
};


const MapaScreen = () => {
    const { currentProject, user } = useAuth();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [areaCoords, setAreaCoords] = useState<{ latitude: number; longitude: number }[]>([]);
    const [rutas, setRutas] = useState<{ latitude: number; longitude: number }[][]>([]);
    
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [trees, setTrees] = useState<TreeData[]>([]);
    const [trunks, setTrunks] = useState<TrunkData[]>([]);
    const [transportRoutes, setTransportRoutes] = useState<TransportRouteData[]>([]);

    const [loading, setLoading] = useState(true);

    const db = getFirestore(app);

    const obtenerUbicacion = useCallback(async () => {
        console.log('DEBUG: Iniciando obtenerUbicacion...');
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            console.log('DEBUG: Ubicación obtenida:', loc.coords);
            setLocation(loc);
            
            if (loc && user?.id && currentProject?.id) { 
                console.log('DEBUG: Llamando a saveUserLocation desde obtenerUbicacion.');
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
                console.log('DEBUG: No se guarda la ubicación porque loc es nulo o user.id/currentProject.id no existe.');
            }
        } catch (error) {
            console.error('ERROR EN obtenerUbicacion:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación.');
        } finally {
            console.log('DEBUG: obtenerUbicacion finalizada.');
        }
    }, [user?.id, currentProject?.id]);

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
                    let isActive = false;

                    // --- INICIO DEL CAMBIO CLAVE ---
                    // Verifica que data.location y data.location.timestamp existan antes de llamar .toDate()
                    if (isLocationValid && data.location.timestamp) {
                        // Asegúrate de que data.location.timestamp sea realmente un Firestore Timestamp
                        // o un objeto con un método toDate. Si no estás seguro, puedes añadir un try-catch
                        // o un chequeo más profundo (ej. `typeof data.location.timestamp.toDate === 'function'`)
                        try {
                            isActive = (new Date().getTime() - data.location.timestamp.toDate().getTime() < (5 * 60 * 1000));
                        } catch (e) {
                            console.warn(`Worker ${docSnap.id} has invalid timestamp:`, data.location.timestamp, e);
                            isActive = false; // Si hay un error, considera al trabajador inactivo
                        }
                    }
                    // --- FIN DEL CAMBIO CLAVE ---

                    workersData.push({
                        id: docSnap.id,
                        nombre: data.name ?? data.nombre ?? 'Sin nombre',
                        rol: data.proyectos[currentProject.id] ?? 'Desconocido',
                        location: isLocationValid ? {
                            latitude: data.location.latitude,
                            longitude: data.location.longitude,
                        } : undefined,
                        activo: isActive,
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
                if (data.puntos && Array.isArray(data.puntos)) {
                    rutasData.push(
                        data.puntos.map((point: any) => ({
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

    const cargarAlertas = useCallback(async () => {
        console.log('DEBUG: Iniciando cargarAlertas...');
        if (!currentProject?.id) {
            console.warn('cargarAlertas: No hay currentProject.id definido. No se cargarán alertas.');
            setAlerts([]);
            return;
        }
        try {
            const q = query(collection(db, 'alertas'), where('proyectoId', '==', currentProject.id));
            const snapshot = await getDocs(q);
            const alertsData: AlertData[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                // Asegúrate de que location y timestamp existan y sean válidos
                if (data.location && data.location.latitude != null && data.location.longitude != null && data.timestamp && typeof data.timestamp.toDate === 'function') {
                    alertsData.push({
                        id: docSnap.id,
                        descripcion: data.descripcion || '',
                        location: {
                            latitude: data.location.latitude,
                            longitude: data.location.longitude,
                        },
                        tipo: data.tipo || 'Desconocido',
                        resuelta: data.resuelta || false,
                        timestamp: data.timestamp.toDate(),
                    });
                } else {
                    console.warn(`Alerta ${docSnap.id} tiene datos de ubicación o timestamp inválidos. Saltando.`);
                }
            });
            setAlerts(alertsData);
            console.log(`DEBUG: Cargadas ${alertsData.length} alertas.`);
        } catch (error) {
            console.error('ERROR AL CARGAR ALERTAS:', error);
            Alert.alert('Error', 'No se pudieron cargar las alertas.');
        } finally {
            console.log('DEBUG: cargarAlertas finalizada.');
        }
    }, [currentProject?.id, db]);

    const cargarArboles = useCallback(async () => {
        console.log('DEBUG: Iniciando cargarArboles...');
        if (!currentProject?.id) {
            console.warn('cargarArboles: No hay currentProject.id definido. No se cargarán árboles.');
            setTrees([]);
            return;
        }
        try {
            const q = query(collection(db, 'arboles'), where('proyectoId', '==', currentProject.id));
            const snapshot = await getDocs(q);
            const treesData: TreeData[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                // Asegúrate de que latitud, longitud y timestamp existan y sean válidos
                if (data.latitud != null && data.longitud != null && data.timestamp && typeof data.timestamp.toDate === 'function') {
                    treesData.push({
                        id: docSnap.id,
                        descripcion: data.descripcion || '',
                        especie: data.especie || 'Desconocida',
                        estado: data.estado || 'Desconocido',
                        latitud: data.latitud,
                        longitud: data.longitud,
                        timestamp: data.timestamp.toDate(),
                    });
                } else {
                    console.warn(`Árbol ${docSnap.id} tiene datos de ubicación o timestamp inválidos. Saltando.`);
                }
            });
            setTrees(treesData);
            console.log(`DEBUG: Cargados ${treesData.length} árboles.`);
        } catch (error) {
            console.error('ERROR AL CARGAR ÁRBOLES:', error);
            Alert.alert('Error', 'No se pudieron cargar los árboles.');
        } finally {
            console.log('DEBUG: cargarArboles finalizada.');
        }
    }, [currentProject?.id, db]);

    const cargarTroncos = useCallback(async () => {
        console.log('DEBUG: Iniciando cargarTroncos...');
        if (!currentProject?.id) {
            console.warn('cargarTroncos: No hay currentProject.id definido. No se cargarán troncos.');
            setTrunks([]);
            return;
        }
        try {
            const q = query(collection(db, 'troncos'), where('proyectoId', '==', currentProject.id));
            const snapshot = await getDocs(q);
            const trunksData: TrunkData[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                // Asegúrate de que latitud, longitud y timestamp existan y sean válidos
                if (data.latitud != null && data.longitud != null && data.timestamp && typeof data.timestamp.toDate === 'function') {
                    trunksData.push({
                        id: docSnap.id,
                        descripcion: data.descripcion || '',
                        especie: data.especie || 'Desconocida',
                        estado: data.estado || 'Desconocido',
                        latitud: data.latitud,
                        longitud: data.longitud,
                        timestamp: data.timestamp.toDate(),
                    });
                } else {
                    console.warn(`Tronco ${docSnap.id} tiene datos de ubicación o timestamp inválidos. Saltando.`);
                }
            });
            setTrunks(trunksData);
            console.log(`DEBUG: Cargados ${trunksData.length} troncos.`);
        } catch (error) {
            console.error('ERROR AL CARGAR TRONCOS:', error);
            Alert.alert('Error', 'No se pudieron cargar los troncos.');
        } finally {
            console.log('DEBUG: cargarTroncos finalizada.');
        }
    }, [currentProject?.id, db]);

    const cargarTransportes = useCallback(async () => {
        console.log('DEBUG: Iniciando cargarTransportes...');
        if (!currentProject?.id) {
            console.warn('cargarTransportes: No hay currentProject.id definido. No se cargarán rutas de transporte.');
            setTransportRoutes([]);
            return;
        }
        try {
            const q = query(collection(db, 'transportes'), where('proyectoId', '==', currentProject.id));
            const snapshot = await getDocs(q);
            const transportRoutesData: TransportRouteData[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.ubicaciones && Array.isArray(data.ubicaciones) && data.ubicaciones.length > 1) {
                    const validPoints = data.ubicaciones.filter((point: any) => 
                        point.latitud != null && point.longitud != null && point.timestamp && typeof point.timestamp.toDate === 'function'
                    ).map((point: any) => ({
                        latitude: point.latitud,
                        longitude: point.longitud,
                        timestamp: point.timestamp.toDate(),
                    }));

                    if (validPoints.length > 1) { // Asegurarse de que haya al menos dos puntos válidos para una ruta
                        transportRoutesData.push({
                            id: docSnap.id,
                            points: validPoints,
                            status: data.estado || 'desconocido',
                        });
                    } else {
                        console.warn(`Transporte ${docSnap.id} no tiene suficientes puntos válidos o timestamps válidos. Saltando.`);
                    }
                }
            });
            setTransportRoutes(transportRoutesData);
            console.log(`DEBUG: Cargadas ${transportRoutesData.length} rutas de transporte.`);
        } catch (error) {
            console.error('ERROR AL CARGAR TRANSPORTES:', error);
            Alert.alert('Error', 'No se pudieron cargar las rutas de transporte.');
        } finally {
            console.log('DEBUG: cargarTransportes finalizada.');
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
                await obtenerUbicacion();
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

                console.log('DEBUG: Llamando a cargarAlertas...');
                await cargarAlertas();
                console.log('DEBUG: await cargarAlertas completado.');

                console.log('DEBUG: Llamando a cargarArboles...');
                await cargarArboles();
                console.log('DEBUG: await cargarArboles completado.');

                console.log('DEBUG: Llamando a cargarTroncos...');
                await cargarTroncos();
                console.log('DEBUG: await cargarTroncos completado.');

                console.log('DEBUG: Llamando a cargarTransportes...');
                await cargarTransportes();
                console.log('DEBUG: await cargarTransportes completado.');


                setLoading(false);
                console.log('DEBUG: Todas las cargas iniciales completadas. setLoading(false) ejecutado.');

                intervalId = setInterval(async () => {
                    console.log('DEBUG: Intervalo activo: Actualizando ubicación y datos...');
                    await obtenerUbicacion();
                    await cargarWorkers();
                    await cargarAlertas();
                    await cargarTransportes();
                }, 15000);

            } catch (initError) {
                console.error('ERROR FATAL EN initAndStartInterval:', initError);
                Alert.alert('Error de Inicialización', 'Ocurrió un error al cargar los datos iniciales del mapa.');
                setLoading(false);
            }
        };

        if (intervalId) {
            clearInterval(intervalId);
            intervalId = undefined;
            console.log('DEBUG: Limpiando intervalo anterior.');
        }

        initAndStartInterval();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log('DEBUG: Cleanup: Intervalo limpiado al desmontar/re-ejecutar efecto.');
            }
        };
    }, [user?.id, currentProject?.id, obtenerUbicacion, cargarWorkers, cargarAreaProyecto, cargarRutas, cargarAlertas, cargarArboles, cargarTroncos, cargarTransportes]);

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
                {/* Marcadores de Trabajadores */}
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

                {/* Polígono del Área del Proyecto */}
                {areaCoords.length > 0 && (
                    <Polygon
                        coordinates={areaCoords}
                        strokeColor="#FF5733"
                        fillColor="rgba(255, 87, 51, 0.2)"
                        strokeWidth={2}
                    />
                )}

                {/* Rutas Predefinidas */}
                {rutas.map((ruta, index) => (
                    <Polyline
                        key={`ruta-${index}`}
                        coordinates={ruta}
                        strokeColor="#34A853"
                        strokeWidth={3}
                    />
                ))}

                {/* Marcadores de Alertas */}
                {alerts.map(alert => (
                    <Marker
                        key={alert.id}
                        coordinate={alert.location}
                        title={`Alerta: ${alert.tipo}`}
                        description={alert.descripcion + (alert.resuelta ? ' (Resuelta)' : ' (Pendiente)')}
                        pinColor={alert.resuelta ? "#FFD700" : "#FF4500"}
                    >
                         <Icon name="alert-decagram" size={24} color={alert.resuelta ? "#FFD700" : "#FF4500"} />
                    </Marker>
                ))}

                {/* Marcadores de Árboles */}
                {trees.map(tree => (
                    <Marker
                        key={tree.id}
                        coordinate={{ latitude: tree.latitud, longitude: tree.longitud }}
                        title={`Árbol: ${tree.especie}`}
                        description={`Estado: ${tree.estado} - ${tree.descripcion}`}
                        pinColor={tree.estado === 'talado' ? "#A52A2A" : "#006400"}
                    >
                         <Icon name="tree" size={24} color={tree.estado === 'talado' ? "#A52A2A" : "#006400"} />
                    </Marker>
                ))}

                {/* Marcadores de Troncos */}
                {trunks.map(trunk => (
                    <Marker
                        key={trunk.id}
                        coordinate={{ latitude: trunk.latitud, longitude: trunk.longitud }}
                        title={`Tronco: ${trunk.especie}`}
                        description={`Estado: ${trunk.estado} - ${trunk.descripcion}`}
                        pinColor={"#8B4513"}
                    >
                        <Icon name="forest" size={24} color="#8B4513" />
                    </Marker>
                ))}

                {/* Rutas de Transporte (Polylines) */}
                {transportRoutes.map(route => (
                    <Polyline
                        key={route.id}
                        coordinates={route.points}
                        strokeColor={route.status === 'completado' ? "#00BFFF" : "#FF6347"}
                        strokeWidth={4}
                        lineDashPattern={route.status === 'completado' ? undefined : [10, 5]}
                    />
                ))}

            </MapView>

            <TouchableOpacity
                style={styles.centerButton}
                onPress={() => {
                    if (location) {
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

export default MapaScreen;

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