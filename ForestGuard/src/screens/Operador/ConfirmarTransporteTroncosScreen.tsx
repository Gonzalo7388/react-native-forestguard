// src/screens/Operador/ConfirmarTransporteTroncosScreen.tsx 

import React, { useEffect, useState } from 'react'; 
import { View, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native'; 
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'; 
import * as Location from 'expo-location'; 
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { app } from '../../config/firebase'; 
import { useAuth } from '../../hooks/useAuth'; 
import { useNavigation } from '@react-navigation/native'; 

type Tronco = { 
    id: string; 
    latitud: number; 
    longitud: number; 
    especie: string; 
    descripcion: string; 
    proyectoId: string; 
    estado: string; 
}; 

const ConfirmarTransporteTroncosScreen = () => { 
    const [location, setLocation] = useState<Location.LocationObject | null>(null); 
    const [troncos, setTroncos] = useState<Tronco[]>([]); 
    const [selectedTroncos, setSelectedTroncos] = useState<Set<string>>(new Set()); 
    const [loading, setLoading] = useState(true); 
    const { currentProject, user } = useAuth(); 
    const navigation = useNavigation<any>(); // si no tienes ya esto arriba 

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
                where('estado', '==', 'en_espera') 
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
                    proyectoId: data.proyectoId, 
                    estado: data.estado ?? 'en_espera', 
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

    const handleConfirmTransport = async () => { 
        if (selectedTroncos.size === 0) { 
            Alert.alert('Aviso', 'Selecciona al menos un tronco para transportar.'); 
            return; 
        } 

        if (!location || !user?.id) { 
            Alert.alert('Error', 'No se pudo obtener ubicación o información del operador.'); 
            return; 
        } 

        try { 
            setLoading(true); 
            const db = getFirestore(app); 

            // Cambiar estado de troncos a 'en_transporte' 
            const batchUpdates = Array.from(selectedTroncos).map(async troncoId => { 
                const troncoDoc = doc(db, 'troncos', troncoId); 
                await updateDoc(troncoDoc, { estado: 'en_transporte' }); 
            }); 
            await Promise.all(batchUpdates); 

            // Crear documento en colección 'transportes' 
            const transporteData = { 
                startTime: serverTimestamp(), 
                startLocation: { 
                    latitude: location.coords.latitude, 
                    longitude: location.coords.longitude, 
                }, 
                operadorId: user.id, 
                troncoIds: Array.from(selectedTroncos), 
                proyectoId: currentProject.id, 
            }; 
            const docRef = await addDoc(collection(db, 'transportes'), transporteData); 

            // 🔹 Redirige al tracking inmediatamente 
            navigation.navigate('TransporteEnCurso', { transporteId: docRef.id }); 

        } catch (error) { 
            console.error('Error al iniciar transporte:', error); 
            Alert.alert('Error', 'No se pudo iniciar el transporte.'); 
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
                {troncos.map(tronco => ( 
                    <Marker 
                        key={tronco.id} 
                        coordinate={{ latitude: tronco.latitud, longitude: tronco.longitud }} 
                        title={tronco.especie} 
                        description={tronco.descripcion} 
                        pinColor={selectedTroncos.has(tronco.id) ? '#0000FF' : '#FFA500'} 
                        onPress={() => { 
                            setSelectedTroncos(prev => { 
                                const newSet = new Set(prev); 
                                if (newSet.has(tronco.id)) { 
                                    newSet.delete(tronco.id); 
                                } else { 
                                    newSet.add(tronco.id); 
                                } 
                                return newSet; 
                            }); 
                        }} 
                    /> 
                ))} 
            </MapView> 

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmTransport}> 
                <Text style={styles.buttonText}>Iniciar Transporte ({selectedTroncos.size})</Text> 
            </TouchableOpacity> 
        </View> 
    ); 
}; 

export default ConfirmarTransporteTroncosScreen; 

const styles = StyleSheet.create({ 
    container: { flex: 1 }, 
    map: { flex: 1 }, 
    loader: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF', 
    }, 
    confirmButton: { 
        position: 'absolute', 
        bottom: 30, 
        left: 20, 
        right: 20, 
        backgroundColor: '#7ED321', 
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center', 
        elevation: 5, 
    }, 
    buttonText: { 
        color: '#FFFFFF', 
        fontSize: 18, 
        fontWeight: 'bold', 
    }, 
});
