import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../../types/navigation';

const CrearProyectoScreen = () => {
    const [nombreProyecto, setNombreProyecto] = useState('');
    const db = getFirestore();
    const auth = useContext(AuthContext);

    if (!auth) {
        throw new Error("AuthContext no disponible. Asegúrate de envolver tu app en <AuthContext.Provider>.");
    }

    if (!auth.user) {
        Alert.alert('Error', 'Usuario no autenticado. Por favor, vuelva a iniciar sesión.');
        return null;
    }

    const user = auth.user; // ✅ ahora TypeScript sabe que no es null

    const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();

    const handleCrearProyecto = async () => {
        if (!nombreProyecto.trim()) {
            Alert.alert('Error', 'Ingrese un nombre de proyecto válido');
            return;
        }

        try {
            const safeUserId = auth.user!.id.replace(/[^\w.-]/g, '_');

            const proyectoRef = await addDoc(collection(db, 'proyectos'), {
                nombre: nombreProyecto,
                fechaCreacion: new Date(),
                administradorId: safeUserId,
                estado: 'activo',
            });

            await setDoc(doc(db, 'usuarios', safeUserId), {
                id: safeUserId,
                name: user.name ?? '',
                email: user.email ?? '',
                avatarUrl: user.avatarUrl ?? '',
                proyectos: {
                    ...(user.proyectos ?? {}),
                    [proyectoRef.id]: 'administrador',
                },

            }, { merge: true });

            // ✅ Actualizar el contexto local
            if (auth.setUser) {
                auth.setUser({
                    ...user,
                    proyectos: {
                        ...(user.proyectos ?? {}),
                        [proyectoRef.id]: 'administrador',
                    },
                });
            }

            Alert.alert('Proyecto creado', 'Redirigiendo...');
            // ✅ Usar reset
            navigation.reset({
                index: 0,
                routes: [{ name: 'Admin' }],
            });

        } catch (error) {
            console.error('Error creando proyecto:', error);
            Alert.alert('Error', 'No se pudo crear el proyecto');
        }
    };



    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crear Nuevo Proyecto</Text>
            <TextInput
                style={styles.input}
                placeholder="Nombre del proyecto"
                value={nombreProyecto}
                onChangeText={setNombreProyecto}
            />
            <Button title="Crear Proyecto" onPress={handleCrearProyecto} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 },
});

export default CrearProyectoScreen;
