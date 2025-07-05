// src/screens/Marcador/MapaMarcadorScreen.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Añadimos useCallback
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import FloatingActionButton from '../../components/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { saveUserLocation } from '../../services/locationService'; // <-- ¡NUEVA IMPORTACIÓN!

type MarcadorStackParamList = {
    RegistrarArbol: { currentLocation: Location.LocationObjectCoords } | undefined; // Permitir que reciba currentLocation o que sea undefined
};


type NavigationProp = NativeStackNavigationProp<MarcadorStackParamList>;

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

const MapaMarcadorScreen = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [arboles, setArboles] = useState<Arbol[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();
    const { user, currentProject } = useAuth(); // <-- Asumimos que currentProject viene de useAuth

    // Esta función ahora es un poco redundante si currentProject ya está disponible en useAuth.
    // Es preferible usar currentProject?.id directamente.
    // Si currentProject no siempre está disponible o es el ID del proyecto asignado al rol 'marcador',
    // esta función sigue siendo útil.
    const obtenerProyectoIdAsignadoMarcador = useCallback(() => {
        if (!user?.proyectos) return null;
        const proyectos = user.proyectos;
        const proyectoIdMarcador = Object.keys(proyectos).find(
            key => proyectos[key] === 'marcador'
        );
        return proyectoIdMarcador ?? null;
    }, [user?.proyectos]);


    const obtenerUbicacion = useCallback(async () => {
        console.log('DEBUG: Marcador: Iniciando obtenerUbicacion...');
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            console.log('DEBUG: Marcador: Ubicación obtenida:', loc.coords);
            setLocation(loc);

            const userId = user?.id;
            // Usamos currentProject.id si está disponible, sino la lógica del proyecto asignado al rol "marcador"
            const projectId = currentProject?.id || obtenerProyectoIdAsignadoMarcador(); 
            
            if (loc && userId && projectId) { 
                console.log('DEBUG: Marcador: Llamando a saveUserLocation.');
                await saveUserLocation(
                    userId,
                    projectId,
                    {
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        timestamp: new Date(loc.timestamp)
                    }
                );
            } else {
                console.warn('DEBUG: Marcador: No se guarda la ubicación porque userId o projectId no existen o loc es nulo.');
            }
        } catch (error) {
            console.error('ERROR EN obtenerUbicacion (Marcador):', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación.');
        }
    }, [user?.id, currentProject?.id, obtenerProyectoIdAsignadoMarcador]); // Añadir obtenerProyectoIdAsignadoMarcador a dependencias


    const cargarArboles = useCallback(async () => {
        // Preferiblemente usa currentProject.id si es el proyecto activo
        const projectId = currentProject?.id || obtenerProyectoIdAsignadoMarcador();
        
        if (!projectId) {
            console.warn('DEBUG: cargarArboles: No se pudo determinar el ID del proyecto.');
            // Alert.alert('Error', 'No hay un proyecto activo para cargar árboles o no se pudo determinar el proyecto asignado.');
            setLoading(false);
            return;
        }

        console.log(`DEBUG: Marcador: Cargando árboles para proyectoId: ${projectId}`);
        try {
            const db = getFirestore(app);
            const arbolesRef = collection(db, 'arboles');
            const q = query(arbolesRef, where('proyectoId', '==', projectId));
            const snapshot = await getDocs(q);

            const arbolesData: Arbol[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                arbolesData.push({
                    id: doc.id,
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
            console.log(`DEBUG: Marcador: Cargados ${arbolesData.length} árboles.`);
        } catch (error) {
            console.error('ERROR AL CARGAR ÁRBOLES (Marcador):', error);
            Alert.alert('Error', 'No se pudieron cargar los árboles.');
        } finally {
            setLoading(false);
        }
    }, [currentProject?.id, obtenerProyectoIdAsignadoMarcador]);


    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;

        const initScreenData = async () => {
            console.log('DEBUG: Marcador useEffect: Iniciando initScreenData.');

            // Esperar a que user y currentProject estén definidos
            if (!user?.id || (!currentProject?.id && !obtenerProyectoIdAsignadoMarcador())) {
                console.log('DEBUG: Marcador useEffect: Esperando user.id o currentProject.id/proyecto asignado para iniciar.');
                setLoading(true);
                return;
            }

            try {
                console.log('DEBUG: Marcador: Solicitando permisos de ubicación...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso requerido', 'Se requieren permisos de ubicación para el Marcador.');
                    setLoading(false);
                    console.log('DEBUG: Marcador: Permisos de ubicación NO concedidos. Init aborted.');
                    return;
                }
                console.log('DEBUG: Marcador: Permisos de ubicación concedidos.');

                console.log('DEBUG: Marcador: Llamando a obtenerUbicacion...');
                await obtenerUbicacion(); // Esto ahora llamará a saveUserLocation internamente
                console.log('DEBUG: Marcador: await obtenerUbicacion completado.');

                console.log('DEBUG: Marcador: Llamando a cargarArboles...');
                await cargarArboles();
                console.log('DEBUG: Marcador: await cargarArboles completado.');

                setLoading(false);
                console.log('DEBUG: Marcador: Carga inicial completada. setLoading(false) ejecutado.');

                // Establecer el intervalo solo si los permisos están concedidos y hay usuario/proyecto
                intervalId = setInterval(async () => {
                    console.log('DEBUG: Marcador Intervalo activo: Actualizando ubicación...');
                    await obtenerUbicacion();
                    await cargarArboles(); // Recargar árboles también por si hay cambios en el estado o nuevos árboles
                }, 15000); // Puedes ajustar este intervalo si es necesario, quizás cada 15-30 segundos para marcadores

            } catch (initError) {
                console.error('ERROR FATAL EN initScreenData (Marcador):', initError);
                Alert.alert('Error de Inicialización', 'Ocurrió un error al cargar los datos iniciales del mapa del Marcador.');
                setLoading(false);
            }
        };

        // Limpiar cualquier intervalo existente al re-renderizar o desmontar
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = undefined;
            console.log('DEBUG: Marcador: Limpiando intervalo anterior.');
        }

        initScreenData(); // Llama a la función para iniciar todo

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log('DEBUG: Marcador Cleanup: Intervalo limpiado al desmontar/re-ejecutar efecto.');
            }
        };
    }, [user?.id, currentProject?.id, obtenerUbicacion, cargarArboles, obtenerProyectoIdAsignadoMarcador]); // Añade dependencias


    if (loading || !location) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#7ED321" />
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

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialMapRegion}
                showsUserLocation
                zoomEnabled
            >
                {arboles.map(arbol => (
                    <Marker
                        key={arbol.id}
                        coordinate={{ latitude: arbol.latitud, longitude: arbol.longitud }}
                        title={arbol.especie}
                        description={`${arbol.descripcion} (Estado: ${arbol.estado.replace('_', ' ')})`} // Descripción más informativa
                        pinColor={
                            arbol.estado === 'talado'
                                ? '#888888' // gris para talado
                                : (arbol.marcadorId === user?.id ? '#7ED321' : '#2e2e2e') // verde si lo marcó el usuario, gris oscuro si no
                        }
                    />
                ))}
            </MapView>

            <FloatingActionButton
                iconName="camera"
                onPress={() => navigation.navigate('RegistrarArbol', {
                    currentLocation: location.coords // Pasar ubicación actual para pre-rellenar
                })}
            />
        </View>
    );
};

export default MapaMarcadorScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
});