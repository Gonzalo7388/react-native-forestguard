import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, LatLng, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getFirestore, collection, query, where, getDocs, doc, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

const db = getFirestore(app);

// --- Interfaces para Firestore ---
interface LocationPoint {
    latitude: number;
    longitude: number;
    timestamp: Timestamp; // Firebase Timestamp
}

interface UserPathData {
    userId: string;
    projectId: string;
    date: string; // Formato YYYY-MM-DD
    locations: LocationPoint[];
}

interface WorkerPath {
    userId: string;
    userName: string;
    locations: LocationPoint[];
    color: string; // Para dibujar cada Polyline con un color diferente
}

interface EquipoUserData {
    id: string; // Asegúrate de que la interfaz EquipoUserData tenga un 'id'
    name: string;
    email: string;
    avatarUrl?: string;
    proyectos?: { [projectId: string]: string };
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922; // Un buen valor inicial para zoom
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Colores para las polilíneas de los usuarios (más opciones para diferenciar)
const PATH_COLORS = [
    '#FF0000', // Rojo
    '#0000FF', // Azul
    '#008000', // Verde Oscuro
    '#FFFF00', // Amarillo
    '#FFA500', // Naranja
    '#800080', // Púrpura
    '#00CED1', // Turquesa
    '#FFC0CB', // Rosa
    '#A52A2A', // Marrón
    '#008080', // Teal
    '#FF6347', // Tomato
    '#4682B4', // SteelBlue
    '#DAA520', // Goldenrod
    '#ADFF2F', // GreenYellow
    '#4B0082', // Indigo
    '#FF1493', // DeepPink
];

// Función auxiliar para formatear la fecha a YYYY-MM-DD
const formatDateForFirestore = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const MapaRecorridoScreen: React.FC = () => {
    const { currentProject } = useAuth();
    const [loading, setLoading] = useState(true);
    const [workersPaths, setWorkersPaths] = useState<WorkerPath[]>([]); // Almacena los recorridos de todos los trabajadores
    const [allWorkers, setAllWorkers] = useState<EquipoUserData[]>([]); // Todos los trabajadores del proyecto para el filtro
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null); // ID del trabajador seleccionado para filtrar (null = todos)
    const [centerRegion, setCenterRegion] = useState<Region | null>(null); // Región para centrar el mapa
    const [currentDayString, setCurrentDayString] = useState(''); // Para mostrar la fecha actual

    // Función para calcular la región central del mapa para un conjunto de rutas
    const calculateRegionForPaths = useCallback((pathsToCenter: WorkerPath[]): Region | null => {
        let allLocations: LocationPoint[] = [];
        pathsToCenter.forEach(wp => {
            allLocations = allLocations.concat(wp.locations);
        });

        if (allLocations.length === 0) return null;

        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;

        allLocations.forEach(loc => {
            minLat = Math.min(minLat, loc.latitude);
            maxLat = Math.max(maxLat, loc.latitude);
            minLon = Math.min(minLon, loc.longitude);
            maxLon = Math.max(maxLon, loc.longitude);
        });

        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const deltaLat = (maxLat - minLat) * 1.2; // Añadir un poco de padding
        const deltaLon = (maxLon - minLon) * 1.2; // Añadir un poco de padding

        return {
            latitude: centerLat,
            longitude: centerLon,
            latitudeDelta: Math.max(LATITUDE_DELTA, deltaLat), // Asegurarse de que el delta no sea cero
            longitudeDelta: Math.max(LONGITUDE_DELTA, deltaLon), // Asegurarse de que el delta no sea cero
        };
    }, []);

    // Función para cargar todos los trabajadores de un proyecto
    const fetchAllWorkersInProject = useCallback(async (projectId: string): Promise<EquipoUserData[]> => {
        try {
            const usersRef = collection(db, 'usuarios');
            const q = query(usersRef); // Obtener todos los usuarios
            const snapshot = await getDocs(q);

            const projectWorkers: EquipoUserData[] = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                // Verificar si el usuario está asignado al proyecto actual
                if (data.proyectos && Object.prototype.hasOwnProperty.call(data.proyectos, projectId)) {
                    projectWorkers.push({
                        id: docSnap.id,
                        name: data.name || 'Sin nombre',
                        email: data.email || '',
                        avatarUrl: data.avatarUrl || undefined,
                        proyectos: data.proyectos,
                    });
                }
            });
            return projectWorkers;
        } catch (error) {
            console.error('Error al cargar usuarios del proyecto:', error);
            Alert.alert('Error', 'No se pudieron cargar los usuarios del proyecto.');
            return [];
        }
    }, []); // Dependencia db no es necesaria si ya es una constante global


    // MODIFICACIÓN CRUCIAL: setupRealtimePathsListener ahora usa onSnapshot
    const setupRealtimePathsListener = useCallback(async () => {
        if (!currentProject?.id) {
            console.log('No hay un proyecto seleccionado para configurar el listener de recorridos.');
            setLoading(false);
            setWorkersPaths([]);
            setAllWorkers([]);
            setCenterRegion(null);
            return;
        }

        setLoading(true);
        // No limpiamos workersPaths aquí porque onSnapshot nos dará el estado actual
        // setWorkersPaths([]);
        // No limpiamos centerRegion aquí porque onSnapshot recalculará

        const today = new Date();
        const formattedDate = formatDateForFirestore(today);
        setCurrentDayString(today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

        console.log(`Configurando listener para recorridos del proyecto: ${currentProject.nombre} (ID: ${currentProject.id}) en la fecha: ${formattedDate}`);

        // Obtener todos los trabajadores del proyecto una vez al inicio.
        // Esto es importante porque sus nombres no cambian en tiempo real en la colección 'ubicaciones_recorrido'.
        const workers = await fetchAllWorkersInProject(currentProject.id);
        setAllWorkers(workers);

        const q = query(
            collection(db, 'ubicaciones_recorrido'),
            where('projectId', '==', currentProject.id),
            where('date', '==', formattedDate)
        );

        // onSnapshot retorna una función de desuscripción
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log('Firestore Snapshot Received! (Recorridos)');
            const fetchedPaths: WorkerPath[] = [];
            let colorIndex = 0;

            querySnapshot.forEach(docSnap => {
                const data = docSnap.data() as UserPathData;
                if (data.locations && data.locations.length > 0) {
                    const worker = workers.find(w => w.id === data.userId); // Usa los trabajadores que ya cargamos
                    const userName = worker ? worker.name : 'Usuario Desconocido';

                    const sortedLocations = [...data.locations].sort((a, b) =>
                        a.timestamp.toMillis() - b.timestamp.toMillis()
                    );

                    fetchedPaths.push({
                        userId: data.userId,
                        userName: userName,
                        locations: sortedLocations,
                        color: PATH_COLORS[colorIndex % PATH_COLORS.length],
                    });
                    colorIndex++;
                }
            });

            setWorkersPaths(fetchedPaths);
            setLoading(false); // Desactiva el loader una vez que los datos se han cargado por primera vez o se han actualizado.

            // Recalcular la región solo si el mapa está inicialmente centrado o si no hay un filtro activo.
            // Si hay un filtro, el useEffect de `displayedPaths` se encargará.
            if (selectedWorkerId === null || fetchedPaths.filter(wp => wp.userId === selectedWorkerId).length > 0) {
                const pathsForCentering = selectedWorkerId ? fetchedPaths.filter(wp => wp.userId === selectedWorkerId) : fetchedPaths;
                const calculatedRegion = calculateRegionForPaths(pathsForCentering);
                if (calculatedRegion) {
                    setCenterRegion(calculatedRegion);
                } else if (!calculatedRegion && fetchedPaths.length === 0) {
                     // Si no hay paths, intenta centrar en la ubicación actual del dispositivo como fallback
                     (async () => {
                        try {
                            let currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                            setCenterRegion({
                                latitude: currentLocation.coords.latitude,
                                longitude: currentLocation.coords.longitude,
                                latitudeDelta: LATITUDE_DELTA,
                                longitudeDelta: LONGITUDE_DELTA,
                            });
                        } catch (locError) {
                            console.warn('No se pudo obtener la ubicación actual para la región inicial:', locError);
                            setCenterRegion({
                                latitude: -12.046374, // Lima, Perú
                                longitude: -77.042793,
                                latitudeDelta: LATITUDE_DELTA,
                                longitudeDelta: LONGITUDE_DELTA,
                            });
                        }
                    })();
                    // Solo mostrar alerta si realmente no hay datos y no se ha filtrado a nada
                    if (selectedWorkerId === null) {
                         Alert.alert('Información', 'No se encontraron recorridos para el día de hoy en este proyecto.');
                    }
                }
            }


        }, (error) => {
            console.error('Error al escuchar cambios en recorridos de trabajadores:', error);
            Alert.alert('Error de Actualización', 'Ocurrió un error al obtener las actualizaciones de los recorridos.');
            setLoading(false);
        });

        // La función de retorno de useCallback es importante para la limpieza.
        // onSnapshot devuelve una función para desuscribirse.
        return unsubscribe;

    }, [currentProject?.id, calculateRegionForPaths, fetchAllWorkersInProject, selectedWorkerId]);

    // Efecto para solicitar permisos de ubicación y establecer el listener
    useEffect(() => {
        const requestLocationPermissions = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación para mostrar el mapa correctamente.');
            }
        };
        requestLocationPermissions();

        let unsubscribeFromPaths: (() => void) | undefined;
        // Llama a la función que configura el listener y guarda la función de desuscripción
        setupRealtimePathsListener().then(unsub => {
            unsubscribeFromPaths = unsub;
        });


        // Función de limpieza para cuando el componente se desmonte
        return () => {
            console.log('Limpiando listener de recorridos...');
            if (unsubscribeFromPaths) {
                unsubscribeFromPaths();
            }
        };
    }, [setupRealtimePathsListener]); // Dependencia clave para re-ejecutar si currentProject.id cambia

    // Rutas a mostrar en el mapa, filtradas por el usuario seleccionado
    const displayedPaths = selectedWorkerId
        ? workersPaths.filter(wp => wp.userId === selectedWorkerId)
        : workersPaths;

    // Recalcular la región del mapa cuando las rutas mostradas cambian (por el filtro)
    // Este useEffect se encargará del centrado cuando se aplique un filtro.
    useEffect(() => {
        // Solo recalcular si no estamos en el estado de carga inicial y workersPaths ya tiene datos
        if (!loading && workersPaths.length > 0) {
            const newRegion = calculateRegionForPaths(displayedPaths);
            if (newRegion) {
                setCenterRegion(newRegion);
            } else if (selectedWorkerId !== null && displayedPaths.length === 0) {
                // Si el usuario filtró y no hay paths para ese usuario, no hacemos nada (mantenemos el zoom anterior)
                // o podrías elegir centrarlo en una ubicación por defecto o en la propia del usuario
                console.log('No paths for selected worker, keeping current map region.');
            }
        }
    }, [displayedPaths, loading, calculateRegionForPaths, selectedWorkerId, workersPaths.length]);


    if (loading || !centerRegion) { // Esperar a que centerRegion se calcule
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#7ED321" />
                <Text style={styles.loadingText}>Cargando recorridos del proyecto...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Recorridos del Proyecto</Text>
                <Text style={styles.projectInfo}>Proyecto: {currentProject?.nombre || 'N/A'}</Text>
                <Text style={styles.dateInfo}>Fecha: {currentDayString}</Text>
                {/* Botón de recarga manual (opcional, pero útil para depuración o si los listeners fallan) */}
                 <TouchableOpacity style={styles.refreshButton} onPress={setupRealtimePathsListener}>
                    <Icon name="refresh" size={24} color="#FFF" />
                 </TouchableOpacity>
            </View>

            {/* Sección de Filtro por Usuario */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filtrar por Usuario:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollViewContent}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedWorkerId === null ? styles.filterButtonSelected : {}
                        ]}
                        onPress={() => setSelectedWorkerId(null)} // 'null' para mostrar todos
                    >
                        <Text style={[
                            styles.filterButtonText,
                            selectedWorkerId === null ? styles.filterButtonTextSelected : {}
                        ]}>
                            Todos
                        </Text>
                    </TouchableOpacity>
                    {allWorkers.map((worker) => (
                        <TouchableOpacity
                            key={worker.id}
                            style={[
                                styles.filterButton,
                                selectedWorkerId === worker.id ? styles.filterButtonSelected : {}
                            ]}
                            onPress={() => setSelectedWorkerId(worker.id)}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedWorkerId === worker.id ? styles.filterButtonTextSelected : {}
                            ]}>
                                {worker.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>


            {displayedPaths.length === 0 && !loading ? (
                <View style={styles.noDataContainer}>
                    <Icon name="map-search" size={50} color="#ccc" />
                    <Text style={styles.noDataText}>No hay recorridos para esta fecha o usuario seleccionado en este proyecto.</Text>
                    <Text style={styles.noDataSubText}>Asegúrate de que los trabajadores hayan actualizado su ubicación.</Text>
                </View>
            ) : (
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    region={centerRegion} // Usar 'region' en lugar de 'initialRegion' para permitir actualizaciones dinámicas
                    // onRegionChangeComplete={(region) => setCenterRegion(region)} // Descomentar si quieres que el estado de la región se actualice al mover el mapa
                >
                    {displayedPaths.map((workerPath) => (
                        <Polyline
                            key={workerPath.userId}
                            coordinates={workerPath.locations.map(loc => ({
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                            }))}
                            strokeColor={workerPath.color}
                            strokeWidth={4}
                            lineCap="round"
                            lineJoin="round"
                        />
                    ))}
                    {displayedPaths.map((workerPath) => {
                        const firstLoc = workerPath.locations[0];
                        const lastLoc = workerPath.locations[workerPath.locations.length - 1];
                        return (
                            <React.Fragment key={workerPath.userId + "_markers"}>
                                {/* Marcador de inicio */}
                                {firstLoc && (
                                    <Marker
                                        coordinate={{ latitude: firstLoc.latitude, longitude: firstLoc.longitude }}
                                        title={`${workerPath.userName} - Inicio`}
                                        description={`Hora: ${firstLoc.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        pinColor={workerPath.color}
                                    />
                                )}
                                {/* Marcador de fin */}
                                {lastLoc && (
                                    <Marker
                                        coordinate={{ latitude: lastLoc.latitude, longitude: lastLoc.longitude }}
                                        title={`${workerPath.userName} - Fin`}
                                        description={`Hora: ${lastLoc.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        pinColor={workerPath.color}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </MapView>
            )}

            {displayedPaths.length > 0 && (
                <View style={styles.legendContainer}>
                    <Text style={styles.legendTitle}>Leyenda:</Text>
                    <ScrollView contentContainerStyle={styles.legendScrollViewContent}>
                        {displayedPaths.map((wp) => (
                            <View key={wp.userId + "_legend"} style={styles.legendItem}>
                                <View style={[styles.legendColorBox, { backgroundColor: wp.color }]} />
                                <Text style={styles.legendText}>{wp.userName}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </SafeAreaView>
    );
};

export default MapaRecorridoScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f7', // Un fondo más suave
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        padding: 20,
        backgroundColor: '#7ED321', // Verde de tu botón
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5, // Sombra para Android
        shadowColor: '#000', // Sombra para iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        position: 'relative', // Para posicionar el botón de recarga
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    projectInfo: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    dateInfo: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
        marginTop: 5,
    },
    refreshButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.3)', // Un fondo semi-transparente
        borderRadius: 20,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 5,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    filterScrollViewContent: {
        alignItems: 'center',
    },
    filterButton: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#d0d0d0',
    },
    filterButtonSelected: {
        backgroundColor: '#7ED321',
        borderColor: '#5cb800',
    },
    filterButtonText: {
        color: '#555',
        fontWeight: '600',
    },
    filterButtonTextSelected: {
        color: '#fff',
    },
    map: {
        flex: 1, // El mapa toma el espacio restante
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    noDataText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginTop: 15,
        fontWeight: 'bold',
    },
    noDataSubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
    },
    legendContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    legendTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    legendScrollViewContent: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Permite que los elementos pasen a la siguiente línea si no caben
        justifyContent: 'center',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginBottom: 8,
    },
    legendColorBox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    legendText: {
        fontSize: 14,
        color: '#333',
    },
});