import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE, LatLng, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import FloatingActionButton from '../../components/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TrazadorStackParamList = {
    GuardarRutaArea: { puntos: LatLng[]; tipo: 'ruta' | 'area' };
};

const MapaTrazadorScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<TrazadorStackParamList>>();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [points, setPoints] = useState<LatLng[]>([]);
    const [mode, setMode] = useState<'area' | 'ruta' | null>(null);
    const [recording, setRecording] = useState(false);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const solicitarPermiso = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Se requieren permisos de ubicación.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc);
        } catch (error) {
            console.error('Error solicitando permisos de ubicación:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
        }
    };

    const handleMapPress = (event: MapPressEvent) => {
        if (!mode || recording) return;
        const { coordinate } = event.nativeEvent;
        setPoints(prev => [...prev, coordinate]);
    };

    const startRecording = () => {
        if (!mode) {
            Alert.alert('Selecciona primero Ruta o Área');
            return;
        }
        if (recording) {
            Alert.alert('Ya está grabando', 'Detén la grabación antes de iniciar otra.');
            return;
        }
        const intervalSeconds = 5; // se puede pedir input al usuario si deseas personalizar
        setRecording(true);

        const id = setInterval(async () => {
            try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const coord = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                };
                setPoints(prev => [...prev, coord]);
            } catch (error) {
                console.error('Error obteniendo ubicación mientras se graba:', error);
            }
        }, intervalSeconds * 1000);

        setIntervalId(id);
    };

    const stopRecording = () => {
        if (intervalId) clearInterval(intervalId);
        setRecording(false);
    };

    const finalizar = () => {
        if (points.length < 2) {
            Alert.alert('No hay suficientes puntos', 'Agrega más puntos antes de finalizar.');
            return;
        }
        Alert.alert(
            `Finalizar ${mode === 'area' ? 'área' : 'ruta'}`,
            '¿Deseas finalizar y guardar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Finalizar',
                    onPress: () => {
                        navigation.navigate('GuardarRutaArea', {
                            puntos: points,
                            tipo: mode!,
                        });
                        // Reset para iniciar otra captura luego
                        setPoints([]);
                        setMode(null);
                        setRecording(false);
                        if (intervalId) clearInterval(intervalId);
                    },
                },
            ]
        );
    };

    useEffect(() => {
        solicitarPermiso();
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    if (!location) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#7ED321" />
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
                onPress={handleMapPress}
            >
                {mode === 'area' && points.length > 0 && (
                    <Polygon
                        coordinates={points}
                        fillColor="rgba(126, 211, 33, 0.3)"
                        strokeColor="#7ED321"
                        strokeWidth={2}
                    />
                )}
                {mode === 'ruta' && points.length > 0 && (
                    <Polyline
                        coordinates={points}
                        strokeColor="#7ED321"
                        strokeWidth={3}
                    />
                )}
                {points.map((point, index) => (
                    <Marker key={index} coordinate={point} />
                ))}
            </MapView>

            {mode && (
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#999' }]}
                        onPress={() => {
                            setMode(null);
                            setPoints([]);
                            setRecording(false);
                            if (intervalId) clearInterval(intervalId);
                        }}
                    >
                        <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                    {!recording ? (
                        <TouchableOpacity style={styles.button} onPress={startRecording}>
                            <Text style={styles.buttonText}>Iniciar Grabación</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#d9534f' }]} onPress={stopRecording}>
                            <Text style={styles.buttonText}>Detener Grabación</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#5bc0de' }]} onPress={finalizar}>
                        <Text style={styles.buttonText}>Finalizar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!mode && (
                <>
                    <FloatingActionButton
                        iconName="grid"
                        onPress={() => setMode('area')}
                    />
                    <FloatingActionButton
                        iconName="walk"
                        onPress={() => setMode('ruta')}
                        style={{ bottom: 100 }}
                    />
                </>
            )}
        </View>
    );
};

export default MapaTrazadorScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    button: {
        backgroundColor: '#7ED321',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
});
