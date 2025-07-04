import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getFirestore, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../../contexts/AuthContext';

const ProyectosScreen = () => {
    const auth = useAuthContext();
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
                let proyectosData: DocumentData[] = [];

                const userProjectIds = auth.user.proyectos ? Object.keys(auth.user.proyectos) : [];

                if (userProjectIds.length > 0) {
                    // Firestore permite máx 10 elementos en 'in', dividir si se requiere
                    const batches = [];
                    const batchSize = 10;
                    for (let i = 0; i < userProjectIds.length; i += batchSize) {
                        const batchIds = userProjectIds.slice(i, i + batchSize);
                        const q = query(proyectosRef, where('__name__', 'in', batchIds));
                        batches.push(getDocs(q));
                    }

                    const snapshots = await Promise.all(batches);

                    snapshots.forEach(snapshot => {
                        snapshot.forEach(doc => {
                            proyectosData.push({ id: doc.id, ...doc.data() });
                        });
                    });
                }

                // Si además deseas incluir proyectos donde es admin pero aún no esté en el mapa:
                const qAdmin = query(proyectosRef, where('administradorId', '==', auth.user.id));
                const snapAdmin = await getDocs(qAdmin);
                snapAdmin.forEach(doc => {
                    proyectosData.push({ id: doc.id, ...doc.data() });
                });

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
        const userRoleInProject = auth?.user?.proyectos?.[proyecto.id];

        console.log('DEBUG CLICK', {
            userRole: userRoleInProject ?? 'sin rol',
            userProyectoId: auth?.user?.proyectoId ?? 'sin proyecto activo',
            proyectoId: proyecto.id,
        });

        if (proyecto.administradorId === auth?.user?.id) {
            navigation.navigate('InviteWorker', { proyecto });
        } else {
            if (userRoleInProject === 'marcador') {
                auth.cambiarProyecto(proyecto, 'marcador');
            } else {
                Alert.alert('Próximamente', 'Pantalla de detalle aún no implementada.');
            }
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
                renderItem={({ item }) => {
                    const userRoleInProject = auth?.user?.proyectos?.[item.id] ??
                        (item.administradorId === auth?.user?.id ? 'administrador' : 'sin rol');

                    return (
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => handleProyectoPress(item)}
                        >
                            <Text style={styles.projectName}>{item.nombre}</Text>
                            <Text style={styles.projectDesc}>{item.descripcion ?? 'Sin descripción'}</Text>
                            <Text style={{ color: '#888', marginTop: 4 }}>
                                Rol en este proyecto: {userRoleInProject}
                            </Text>
                        </TouchableOpacity>
                    );
                }}

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
