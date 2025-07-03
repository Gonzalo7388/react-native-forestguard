// src/screens/admin/InviteWorkerScreen.tsx

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DocumentData, getFirestore, doc, setDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { RouteProp, useRoute } from '@react-navigation/native';

const rolesDisponibles = ['talador', 'marcador', 'operador', 'auxiliar'];

const InviteWorkerScreen = () => {
    const route = useRoute<RouteProp<{ params: { proyecto: DocumentData } }, 'params'>>();
    const proyecto = route.params?.proyecto;
    const [email, setEmail] = useState('');
    const [rol, setRol] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = useContext(AuthContext);

    const handleInvite = async () => {
        if (!email.trim() || !rol) {
            Alert.alert("Error", "Completa todos los campos");
            return;
        }

        try {
            setLoading(true);
            const db = getFirestore(app);
            const usuariosRef = collection(db, 'usuarios');

            // Buscar si el usuario ya existe por email
            const q = query(usuariosRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Usuario existe, actualizar
                const docRef = querySnapshot.docs[0].ref;
                await setDoc(docRef, {
                    proyectoId: proyecto?.id ?? null,
                    rol: rol,
                }, { merge: true });
                Alert.alert("Invitación actualizada", "El usuario ya existía y se actualizó correctamente.");
            } else {
                // Usuario no existe, crear
                const sanitizedId = email.replace(/[^\w.-]/g, '_');
                const docRef = doc(db, 'usuarios', sanitizedId);
                await setDoc(docRef, {
                    email: email,
                    name: "",
                    avatarUrl: "",
                    rol: rol,
                    proyectoId: auth?.user?.proyectoId ?? null,
                    estado: "invitado",
                    fechaInvitacion: new Date(),
                });
                Alert.alert("Usuario invitado", "La invitación fue creada correctamente.");
            }

            setEmail('');
            setRol('');
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudo invitar al usuario.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Invitar trabajador</Text>

            <TextInput
                style={styles.input}
                placeholder="Correo Gmail del trabajador"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={rol}
                    onValueChange={(itemValue) => setRol(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Selecciona un rol" value="" />
                    {rolesDisponibles.map((r) => (
                        <Picker.Item key={r} label={r.charAt(0).toUpperCase() + r.slice(1)} value={r} />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleInvite}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? "Invitando..." : "Invitar"}</Text>
            </TouchableOpacity>
        </View>
    );
};

export default InviteWorkerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 15,
    },
    picker: {
        height: 50,
        width: '100%',
    },
    button: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
