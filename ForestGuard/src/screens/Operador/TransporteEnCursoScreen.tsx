import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    Button,
    TextInput,
    Platform, // Importamos Platform para detectar el SO
    KeyboardAvoidingView, // Importamos KeyboardAvoidingView
    SafeAreaView, // Importamos SafeAreaView para iOS (aunque con padding funciona)
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getFirestore, doc, updateDoc, arrayUnion, Timestamp, getDoc } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useRoute, useNavigation } from '@react-navigation/native';

const db = getFirestore(app);

const TransporteEnCursoScreen = () => {
    const { user, currentProject } = useAuth();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const transporteId = route.params?.transporteId;

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [ruta, setRuta] = useState<{ latitude: number; longitude: number }[]>([]);
    const [incidenteDescripcion, setIncidenteDescripcion] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const capturarUbicacion = async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc);

            const nuevaUbicacion = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };
            setRuta(prev => [...prev, nuevaUbicacion]);

            const transporteDocRef = doc(db, 'transportes', transporteId);
            const docSnap = await getDoc(transporteDocRef);

            if (docSnap.exists()) {
                await updateDoc(transporteDocRef, {
                    ubicaciones: arrayUnion({
                        latitud: loc.coords.latitude,
                        longitud: loc.coords.longitude,
                        timestamp: Timestamp.now(),
                    }),
                });
            } else {
                console.warn('Documento de transporte aún no disponible, reintentando en siguiente ciclo.');
            }
        } catch (error) {
            console.error('Error al capturar ubicación:', error);
            // Si hay un error, aún intentamos establecer la ubicación para renderizar el mapa
            if (!location && ruta.length === 0) {
                 Alert.alert('Error de Ubicación', 'No se pudo obtener la ubicación actual. Asegúrate de tener los permisos y el GPS activado.');
            }
        }
    };

    useEffect(() => {
        const iniciarTracking = async () => {
            // Solicitar permisos de ubicación en primer plano si no están concedidos
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso de Ubicación Denegado', 'Necesitamos acceso a tu ubicación para rastrear el transporte.');
                return;
            }

            // Capturar la primera ubicación inmediatamente para centrar el mapa
            await capturarUbicacion();

            // Luego iniciar el intervalo de captura de ubicación
            intervalRef.current = setInterval(capturarUbicacion, 8000);
        };

        iniciarTracking();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const agregarIncidente = async () => {
        if (!location || incidenteDescripcion.trim() === '') {
            Alert.alert('Error', 'Ingresa una descripción y asegúrate de tener ubicación.');
            return;
        }
        const incidente = {
            latitud: location.coords.latitude,
            longitud: location.coords.longitude,
            descripcion: incidenteDescripcion,
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'transportes', transporteId), {
                incidentes: arrayUnion(incidente),
            });
            Alert.alert('Incidente agregado', 'Se registró correctamente.');
            setIncidenteDescripcion('');
        } catch (error) {
            console.error('Error al agregar incidente:', error);
            Alert.alert('Error', 'No se pudo agregar el incidente.');
        }
    };

    const finalizarTransporte = async () => {
        if (!location) {
            Alert.alert('Error', 'No se puede finalizar sin ubicación.');
            return;
        }

        Alert.alert(
            'Finalizar Transporte',
            '¿Estás seguro de que deseas finalizar este transporte?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Sí',
                    onPress: async () => {
                        try {
                            // Detener el tracking antes de finalizar
                            if (intervalRef.current) clearInterval(intervalRef.current);

                            await updateDoc(doc(db, 'transportes', transporteId), {
                                finUbicacion: {
                                    latitud: location.coords.latitude,
                                    longitud: location.coords.longitude,
                                },
                                finTimestamp: Timestamp.now(),
                                estado: 'completado',
                            });
                            Alert.alert('Transporte finalizado', 'El transporte se registró como finalizado.');
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error al finalizar transporte:', error);
                            Alert.alert('Error', 'No se pudo finalizar el transporte.');
                        }
                    },
                },
            ]
        );
    };

    return (
        // Usamos KeyboardAvoidingView como contenedor principal
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Ajusta si hay un header en tu Stack Navigator
        >
            {/* El mapa sigue ocupando el espacio principal */}
            {location && (
                <MapView
                    style={styles.map} // Estilo flex: 1 para que ocupe el espacio
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    showsUserLocation
                >
                    {ruta.length > 1 && (
                        <Polyline
                            coordinates={ruta}
                            strokeColor="#007AFF"
                            strokeWidth={4}
                        />
                    )}
                </MapView>
            )}

            {/* Los controles se colocan dentro de una View que recibirá padding */}
            <View style={styles.controlsContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Descripción incidente (opcional)"
                    value={incidenteDescripcion}
                    onChangeText={setIncidenteDescripcion}
                    multiline
                    textAlignVertical="top" // Para que el texto empiece arriba en Android
                />
                <View style={styles.buttonGroup}>
                    <Button title="Agregar Incidente" onPress={agregarIncidente} />
                    <Button title="Finalizar Transporte" onPress={finalizarTransporte} color="green" />
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default TransporteEnCursoScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0', // Un fondo claro
    },
    map: {
        flex: 1, // El mapa ocupa todo el espacio vertical disponible
    },
    controlsContainer: {
        // Añadimos paddingBottom condicional para la barra de navegación de Android
        padding: 16, // Padding general para los controles
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
        paddingBottom: Platform.OS === 'android' ? 30 : 16, // Ajusta 30 según necesidad. 16 para iOS.
                                                         // 30 es un valor de inicio, puede que necesites más (ej: 40-50)
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
        minHeight: 50, // Altura mínima para la descripción
        fontSize: 16,
    },
    buttonGroup: {
        flexDirection: 'column', // Los botones apilados verticalmente
        gap: 10, // Espacio entre los botones (React Native 0.71+)
    },
    // Si necesitas estilos para los botones individualmente, los añadirías aquí
    // Por ejemplo:
    // agregarIncidenteButton: {
    //     backgroundColor: '#007AFF', // Color azul
    // },
    // finalizarTransporteButton: {
    //     backgroundColor: 'green', // Ya lo tienes en el prop de Button, pero por si usas TouchableOpacity
    // },
});