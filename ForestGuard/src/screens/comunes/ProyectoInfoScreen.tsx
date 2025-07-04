import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuthContext } from '../../contexts/AuthContext';

const ProyectoInfoScreen = () => {
    const navigation = useNavigation<any>();
    const { params } = useRoute<RouteProp<{ params: { proyecto: any } }, 'params'>>();
    const auth = useAuthContext();
    const proyecto = params.proyecto;

    const handleIrAProyecto = () => {
        if (!auth) return;
        auth.cambiarProyecto(proyecto, 'administrador');
        Alert.alert('Proyecto cambiado', `Ahora estás trabajando en: ${proyecto.nombre}`);
        navigation.navigate('Tabs'); // <-- Navega explícitamente al mapa
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{proyecto.nombre}</Text>
            <Text style={styles.text}>Estado: {proyecto.estado}</Text>
            <Text style={styles.text}>ID: {proyecto.id}</Text>

            {auth?.user?.id === proyecto.administradorId && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('InviteWorker', { proyecto })}
                >
                    <Text style={styles.buttonText}>Invitar trabajadores</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#28a745' }]}
                onPress={handleIrAProyecto}
            >
                <Text style={styles.buttonText}>Ir a proyecto</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ProyectoInfoScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    text: { fontSize: 16, marginBottom: 5 },
    button: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
