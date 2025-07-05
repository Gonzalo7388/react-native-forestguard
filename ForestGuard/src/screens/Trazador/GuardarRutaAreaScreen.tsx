import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    Text,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    TouchableOpacity, // Usaremos TouchableOpacity para un botón más personalizable
} from 'react-native';
import MapView, { Polygon, Polyline, Marker, LatLng, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons'; // Para el ícono del botón de cancelar

type TrazadorStackParamList = {
    GuardarRutaArea: { puntos: LatLng[]; tipo: 'ruta' | 'area' };
};

const GuardarRutaAreaScreen = () => {
    const route = useRoute<RouteProp<TrazadorStackParamList, 'GuardarRutaArea'>>();
    const navigation = useNavigation();
    const { user } = useAuth();

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);

    const { puntos, tipo } = route.params;

    // Función para manejar el guardado de la ruta/área
    const handleGuardar = async () => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'Debes ingresar un nombre.');
            return;
        }

        setLoading(true);

        try {
            const db = getFirestore(app);
            const rutasAreasRef = collection(db, 'rutas_areas');

            await addDoc(rutasAreasRef, {
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                tipo,
                puntos,
                usuarioId: user?.id ?? null,
                proyectoId: user?.proyectos ? Object.keys(user.proyectos)[0] : null,
                fechaCreacion: Timestamp.now(),
            });

            Alert.alert('Guardado', 'La ruta/área se guardó correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Error guardando ruta/área:', error);
            Alert.alert('Error', 'No se pudo guardar la ruta/área.');
        } finally {
            setLoading(false);
        }
    };

    // Función para regresar o cancelar
    const handleCancelar = () => {
        Alert.alert(
            'Descartar cambios',
            '¿Estás seguro de que quieres cancelar y descartar la información?',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Sí', onPress: () => navigation.goBack() },
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardAvoidingContainer} // Contenedor principal para KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Ajusta si hay un header fijo
        >
            {puntos.length > 0 && (
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: puntos[0].latitude,
                        longitude: puntos[0].longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    zoomEnabled
                >
                    {tipo === 'area' ? (
                        <Polygon
                            coordinates={puntos}
                            fillColor="rgba(126, 211, 33, 0.3)"
                            strokeColor="#7ED321"
                            strokeWidth={2}
                        />
                    ) : (
                        <Polyline
                            coordinates={puntos}
                            strokeColor="#7ED321"
                            strokeWidth={3}
                        />
                    )}
                    {puntos.map((point, index) => (
                        <Marker key={index} coordinate={point} />
                    ))}
                </MapView>
            )}

            {/* ScrollView para el formulario, permitiendo desplazamiento */}
            <ScrollView contentContainerStyle={styles.formScrollViewContent}>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre de la ruta/área"
                        value={nombre}
                        onChangeText={setNombre}
                    />

                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, styles.descriptionInput]}
                        placeholder="Descripción opcional"
                        value={descripcion}
                        onChangeText={setDescripcion}
                        multiline
                        textAlignVertical="top" // Asegura que el texto comience en la parte superior
                    />

                    {/* Botones de acción */}
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={handleCancelar}
                            disabled={loading} // Deshabilita mientras se guarda
                        >
                            <Ionicons name="close-circle-outline" size={24} color="#fff" />
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>

                        {loading ? (
                            <ActivityIndicator size="large" color="#7ED321" />
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={handleGuardar}
                            >
                                <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                                <Text style={styles.buttonText}>
                                    Guardar {tipo === 'area' ? 'Área' : 'Ruta'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default GuardarRutaAreaScreen;

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        // Altura fija para que el mapa siempre sea visible y no se "suba"
        height: 400, // Ajusta esta altura según lo que consideres óptimo
        width: '100%',
    },
    formScrollViewContent: {
        flexGrow: 1, // Permite que el contenido del ScrollView se expanda
        // Padding inferior para el botón de guardar y la barra de navegación de Android
        paddingBottom: Platform.OS === 'android' ? 80 : 20, // 80px para Android para evitar solapamiento
    },
    formContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 8,
        fontSize: 16,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    descriptionInput: {
        height: 100, // Mayor altura para la descripción
        textAlignVertical: 'top',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    saveButton: {
        backgroundColor: '#7ED321', // Verde
    },
    cancelButton: {
        backgroundColor: '#dc3545', // Rojo para cancelar
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});