// src/screens/Operador/ConfirmarTransporteTroncosScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Text,
    ScrollView,
    Modal, // Importa Modal
    Pressable, // Importa Pressable para el modal
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker'; // Importa Picker
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Importa Iconos

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    documentId,
} from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type Tronco = {
    id: string;
    latitud: number;
    longitud: number;
    especie: string;
    descripcion: string;
    proyectoId: string;
    estado: string;
};

type ConfirmarTransporteRouteParams = {
    troncoIds: string[];
};

type ConfirmarTransporteTroncosScreenRouteProp = RouteProp<
    Record<string, ConfirmarTransporteRouteParams>,
    'ConfirmarTransporteTroncos'
>;

const ConfirmarTransporteTroncosScreen = ({
    route,
}: {
    route: ConfirmarTransporteTroncosScreenRouteProp;
}) => {
    const { troncoIds } = route.params;
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [allLoadedTroncos, setAllLoadedTroncos] = useState<Tronco[]>([]); // Todos los troncos cargados inicialmente
    const [displayedTroncos, setDisplayedTroncos] = useState<Tronco[]>([]); // Troncos actualmente mostrados/filtrados
    const [selectedTroncos, setSelectedTroncos] = useState<Set<string>>(new Set(troncoIds));
    const [loading, setLoading] = useState(true);
    const { currentProject, user } = useAuth();
    const navigation = useNavigation<any>();

    // Estados para el modal de detalles
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTroncoForDetails, setSelectedTroncoForDetails] = useState<Tronco | null>(null);

    // Estados para el filtro por especie
    const [availableSpecies, setAvailableSpecies] = useState<string[]>([]);
    const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<string>('all'); // 'all' para todas las especies


    // Función para obtener la ubicación actual
    const obtenerUbicacion = async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc);
        } catch (error) {
            console.error('Error al obtener ubicación:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
        }
    };

    // Función para cargar los troncos desde Firebase
    const cargarTroncos = async () => {
        if (!currentProject?.id) {
            Alert.alert('Error', 'No tienes un proyecto seleccionado.');
            setLoading(false);
            return;
        }
        if (troncoIds.length === 0) {
            Alert.alert('Aviso', 'No se seleccionaron troncos para confirmar.');
            setLoading(false);
            navigation.goBack();
            return;
        }

        try {
            const db = getFirestore(app);
            const troncosRef = collection(db, 'troncos');

            const chunkSize = 10; // Límite para la cláusula 'in' en Firestore (puede ser hasta 30 para documentId())
            const promises = [];
            for (let i = 0; i < troncoIds.length; i += chunkSize) {
                const chunk = troncoIds.slice(i, i + chunkSize);
                const q = query(
                    troncosRef,
                    where('proyectoId', '==', currentProject.id),
                    where('estado', '==', 'en_espera'), // Solo cargamos los que están en espera
                    where(documentId(), 'in', chunk)
                );
                promises.push(getDocs(q));
            }

            const snapshots = await Promise.all(promises);
            let troncosData: Tronco[] = [];
            snapshots.forEach(snapshot => {
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
            });

            // Filtra los troncos para asegurar que solo los IDs originales estén presentes
            const filteredTroncos = troncosData.filter(tronco => new Set(troncoIds).has(tronco.id));

            setAllLoadedTroncos(filteredTroncos); // Guarda todos los troncos cargados
            // Inicialmente, mostrar todos los troncos cargados
            setDisplayedTroncos(filteredTroncos);

            // Extraer especies únicas para el filtro
            const uniqueSpecies = Array.from(new Set(filteredTroncos.map(t => t.especie)));
            setAvailableSpecies(['all', ...uniqueSpecies.sort()]); // Añadir 'all' y ordenar

        } catch (error) {
            console.error('Error al cargar troncos:', error);
            Alert.alert('Error', 'No se pudieron cargar los troncos.');
        } finally {
            setLoading(false);
        }
    };

    // Efecto para filtrar los troncos mostrados cuando cambia el filtro de especie o los troncos cargados
    useEffect(() => {
        let filtered = allLoadedTroncos;
        if (selectedSpeciesFilter !== 'all') {
            filtered = allLoadedTroncos.filter(tronco => tronco.especie === selectedSpeciesFilter);
        }
        setDisplayedTroncos(filtered);
        // Asegúrate de que selectedTroncos refleje solo los IDs de los troncos actualmente mostrados
        // Si remueves por filtro, los troncos no deben estar en selectedTroncos para el transporte.
        // Aquí no queremos deseleccionar los que no se muestran, solo los que se remueven explícitamente.
        // La lógica de 'removerTronco' y 'removerPorEspecie' ya modifica 'selectedTroncos' y 'allLoadedTroncos'.
        // Este efecto solo filtra lo que se 'muestra', no lo que se 'transporta'.
    }, [selectedSpeciesFilter, allLoadedTroncos]);


    // Función para manejar la confirmación del transporte
    const handleConfirmTransport = async () => {
        // Asegurarse de que selectedTroncos esté actualizado con los IDs de allLoadedTroncos
        const finalTroncoIdsForTransport = Array.from(new Set(allLoadedTroncos.map(t => t.id)));

        if (finalTroncoIdsForTransport.length === 0) {
            Alert.alert('Aviso', 'No hay troncos seleccionados para transportar.');
            return;
        }

        if (!location || !user?.id || !currentProject?.id) {
            Alert.alert('Error', 'No se pudo obtener ubicación, información del operador o proyecto.');
            return;
        }

        try {
            setLoading(true);
            const db = getFirestore(app);

            // Cambiar estado de troncos a 'en_transporte'
            const batchUpdates = finalTroncoIdsForTransport.map(async troncoId => {
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
                troncoIds: finalTroncoIdsForTransport, // Usamos los IDs finales para el transporte
                proyectoId: currentProject.id,
            };
            const docRef = await addDoc(collection(db, 'transportes'), transporteData);

            navigation.navigate('TransporteEnCurso', { transporteId: docRef.id });

        } catch (error) {
            console.error('Error al iniciar transporte:', error);
            Alert.alert('Error', 'No se pudo iniciar el transporte.');
        } finally {
            setLoading(false);
        }
    };

    // Función para remover un tronco individualmente
    const removerTronco = (idToRemove: string) => {
        Alert.alert(
            'Confirmar Eliminación',
            `¿Estás seguro de que quieres remover el tronco ${idToRemove} de la lista de transporte?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Remover',
                    onPress: () => {
                        setAllLoadedTroncos(prev => {
                            const newTroncos = prev.filter(tronco => tronco.id !== idToRemove);
                            // Actualizar selectedTroncos también
                            setSelectedTroncos(new Set(newTroncos.map(t => t.id)));
                            // Re-calcular especies disponibles si es necesario
                            const uniqueSpecies = Array.from(new Set(newTroncos.map(t => t.especie)));
                            setAvailableSpecies(['all', ...uniqueSpecies.sort()]);
                            return newTroncos;
                        });
                    },
                },
            ]
        );
    };

    // Función para remover todos los troncos de una especie
    const removerPorEspecie = (especieToRemove: string) => {
        Alert.alert(
            'Confirmar Eliminación por Especie',
            `¿Estás seguro de que quieres remover TODOS los troncos de la especie "${especieToRemove}" de la lista de transporte?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Remover Todos',
                    onPress: () => {
                        setAllLoadedTroncos(prev => {
                            const newTroncos = prev.filter(tronco => tronco.especie !== especieToRemove);
                            // Actualizar selectedTroncos también
                            setSelectedTroncos(new Set(newTroncos.map(t => t.id)));
                            // Re-calcular especies disponibles
                            const uniqueSpecies = Array.from(new Set(newTroncos.map(t => t.especie)));
                            setAvailableSpecies(['all', ...uniqueSpecies.sort()]);
                            // Resetear el filtro si la especie removida era la seleccionada
                            if (selectedSpeciesFilter === especieToRemove) {
                                setSelectedSpeciesFilter('all');
                            }
                            return newTroncos;
                        });
                    },
                },
            ]
        );
    };

    // Lógica para mostrar detalles del tronco en el modal
    const showTroncoDetails = (tronco: Tronco) => {
        setSelectedTroncoForDetails(tronco);
        setModalVisible(true);
    };

    // Efecto para la inicialización
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
    }, [troncoIds, currentProject?.id]); // Dependencias para recargar si los IDs o el proyecto cambian

    // Memoizar las coordenadas para el mapa para evitar re-renders innecesarios de los Markers
    const markerCoordinates = useMemo(() => {
        return allLoadedTroncos.map(tronco => ({
            id: tronco.id,
            latitude: tronco.latitud,
            longitude: tronco.longitud,
            especie: tronco.especie,
            descripcion: tronco.descripcion,
            // pinColor se decidirá en el render del Marker
        }));
    }, [allLoadedTroncos]);


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
                {markerCoordinates.map(tronco => (
                    <Marker
                        key={tronco.id}
                        coordinate={{ latitude: tronco.latitude, longitude: tronco.longitude }}
                        title={tronco.especie}
                        description={tronco.descripcion}
                        pinColor={selectedTroncos.has(tronco.id) ? '#0000FF' : '#FFA500'} // Azul para seleccionado, Naranja para no seleccionado
                        onPress={() => {
                            const fullTronco = allLoadedTroncos.find(t => t.id === tronco.id);
                            if (fullTronco) {
                                showTroncoDetails(fullTronco);
                            }
                        }}
                    />
                ))}
            </MapView>

            <View style={styles.bottomContainer}>
                {/* Controles de filtro */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Filtrar por Especie:</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedSpeciesFilter}
                            onValueChange={(itemValue: string) => setSelectedSpeciesFilter(itemValue)}
                            style={styles.picker}
                            // Important: Ensure the text color is not the same as the background if it's dynamic
                            itemStyle={styles.pickerItem} // Apply style to individual picker items
                        >
                            <Picker.Item label="Todas las Especies" value="all" />
                            {availableSpecies.filter(s => s !== 'all').map(species => (
                                <Picker.Item key={species} label={species} value={species} />
                            ))}
                        </Picker>
                    </View>
                    {selectedSpeciesFilter !== 'all' && (
                        <TouchableOpacity
                            style={styles.removeSpeciesButton}
                            onPress={() => removerPorEspecie(selectedSpeciesFilter)}
                        >
                            <Icon name="close-circle" size={24} color="#FFF" />
                            <Text style={styles.removeSpeciesButtonText}>Remover</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Título de la sección de troncos */}
                <Text style={styles.listTitle}>Troncos para Transportar ({allLoadedTroncos.length})</Text>


                {/* ScrollView para la lista de troncos */}
                <ScrollView style={styles.scrollView}>
                    {displayedTroncos.length > 0 ? (
                        displayedTroncos.map(tronco => (
                            <View key={tronco.id} style={styles.troncoItem}>
                                <TouchableOpacity
                                    onPress={() => showTroncoDetails(tronco)}
                                    style={styles.troncoInfo}
                                >
                                    <Text style={styles.troncoEspecie}>{tronco.especie}</Text>
                                    <Text style={styles.troncoId}>ID: {tronco.id}</Text>
                                    {/* <Text style={styles.troncoDescripcion}>{tronco.descripcion}</Text> */}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removerTronco(tronco.id)}
                                >
                                    <Icon name="trash-can-outline" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noTroncosText}>
                            {selectedSpeciesFilter !== 'all'
                                ? `No hay troncos de la especie "${selectedSpeciesFilter}" en la lista.`
                                : 'No hay troncos seleccionados para transportar.'}
                        </Text>
                    )}
                </ScrollView>

                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        allLoadedTroncos.length === 0 && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmTransport}
                    disabled={allLoadedTroncos.length === 0}
                >
                    <Text style={styles.buttonText}>Confirmar Transporte ({allLoadedTroncos.length})</Text>
                </TouchableOpacity>
            </View>

            {/* Modal de Detalles del Tronco */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <Pressable style={styles.centeredView} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalView} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Detalles del Tronco</Text>
                        {selectedTroncoForDetails && (
                            <>
                                <Text style={styles.modalText}>
                                    <Text style={{ fontWeight: 'bold' }}>ID:</Text> {selectedTroncoForDetails.id}
                                </Text>
                                <Text style={styles.modalText}>
                                    <Text style={{ fontWeight: 'bold' }}>Especie:</Text> {selectedTroncoForDetails.especie}
                                </Text>
                                <Text style={styles.modalText}>
                                    <Text style={{ fontWeight: 'bold' }}>Descripción:</Text> {selectedTroncoForDetails.descripcion}
                                </Text>
                                <Text style={styles.modalText}>
                                    <Text style={{ fontWeight: 'bold' }}>Latitud:</Text> {selectedTroncoForDetails.latitud}
                                </Text>
                                <Text style={styles.modalText}>
                                    <Text style={{ fontWeight: 'bold' }}>Longitud:</Text> {selectedTroncoForDetails.longitud}
                                </Text>
                                <Text style={styles.modalText}>
                                    <Text style={{ fontWeight: 'bold' }}>Estado:</Text> {selectedTroncoForDetails.estado}
                                </Text>
                                {/* Puedes añadir más campos aquí */}
                            </>
                        )}
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonClose]}
                            onPress={() => setModalVisible(!modalVisible)}
                        >
                            <Text style={styles.textStyle}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

export default ConfirmarTransporteTroncosScreen;

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
    bottomContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 0,
        overflow: 'hidden', // Asegura que los bordes redondeados se respeten
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 10,
    },
    pickerWrapper: {
        flex: 1,
        borderRadius: 5,
        // Removed overflow: 'hidden' here as it can sometimes cause issues
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#FFF',
    },
    picker: {
        height: 50, // Increased height
        width: '100%',
    },
    pickerItem: {
        // This style is for the text within the Picker.Item.
        // It's specific to iOS. For Android, you often need to adjust the Picker's own style.
        fontSize: 16,
        height: 50, // Ensure individual item height matches picker height
        color: '#333', // Ensure text color is visible against background
    },
    removeSpeciesButton: {
        marginLeft: 10,
        backgroundColor: '#DC3545', // Rojo
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    removeSpeciesButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    listTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    scrollView: {
        flex: 1,
        marginBottom: 20,
    },
    troncoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    troncoInfo: {
        flex: 1, // Permite que la información del tronco ocupe el espacio restante
    },
    troncoId: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    troncoEspecie: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    troncoDescripcion: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    removeButton: {
        backgroundColor: '#DC3545', // Rojo para el botón de remover
        padding: 8,
        borderRadius: 5,
        marginLeft: 10,
    },
    noTroncosText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#888',
    },
    confirmButton: {
        backgroundColor: '#7ED321',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 5,
        marginBottom: 20,
    },
    confirmButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Estilos para el Modal
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Fondo semitransparente
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%', // Ancho del modal
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    modalText: {
        marginBottom: 10,
        fontSize: 16,
        textAlign: 'center',
        color: '#555',
    },
    modalButton: {
        borderRadius: 10,
        padding: 12,
        elevation: 2,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonClose: {
        backgroundColor: '#2196F3', // Azul
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});