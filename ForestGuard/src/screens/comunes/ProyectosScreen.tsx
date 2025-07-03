import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getFirestore, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProyectosScreen = () => {
    const auth = useContext(AuthContext);
    const [proyectos, setProyectos] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();

    useEffect(() => {
        const fetchProyectos = async () => {
            if (!auth?.user) {
                setLoading(false);
                return;
            }

            try {
                const db = getFirestore(app);
                const proyectosRef = collection(db, 'proyectos');

                const qMiembros = query(proyectosRef, where('miembros', 'array-contains', auth.user.id));
                const qAdmin = query(proyectosRef, where('administradorId', '==', auth.user.id));

                const [snapMiembros, snapAdmin] = await Promise.all([
                    getDocs(qMiembros),
                    getDocs(qAdmin)
                ]);

                const proyectosData = [
                    ...snapMiembros.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    ...snapAdmin.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                ];

                // Eliminar duplicados por id
                const uniqueProjects = proyectosData.filter(
                    (project, index, self) => index === self.findIndex(p => p.id === project.id)
                );

                setProyectos(uniqueProjects);
            } catch (e) {
                console.error(e);
                Alert.alert('Error', 'No se pudieron cargar los proyectos.');
            } finally {
                setLoading(false);
            }
        };

        fetchProyectos();
    }, [auth]);


    const handleProyectoPress = (proyecto: DocumentData) => {
        if (proyecto.administradorId === auth?.user?.id) {
            // ✅ Es administrador en este proyecto, ir a InviteWorkerScreen
            navigation.navigate('InviteWorker', { proyecto });
        } else {
            // ✅ No es admin, mostrar vista de trabajador o detalle
            navigation.navigate('DetalleProyectoTrabajador', { proyecto });
        }
    };


    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7ED321" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Proyectos Asociados</Text>
            <FlatList
                data={proyectos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => handleProyectoPress(item)}
                    >
                        <Text style={styles.projectName}>{item.nombre}</Text>
                        <Text style={styles.projectDesc}>{item.descripcion ?? 'Sin descripción'}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No tienes proyectos asociados.</Text>}
            />
        </View>
    );
};

export default ProyectosScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    item: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
    },
    projectName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    projectDesc: {
        fontSize: 14,
        color: '#555',
    },
});
