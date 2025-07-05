import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DocumentData, getFirestore, collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { AuthContext } from '../../contexts/AuthContext';
import { RouteProp, useRoute } from '@react-navigation/native';

const rolesDisponibles = ['talador','trazador', 'marcador', 'operador', 'auxiliar'];

const InviteWorkerScreen = () => {
    const route = useRoute<RouteProp<{ params: { proyecto: DocumentData } }, 'params'>>();
    const proyecto = route.params?.proyecto;

    const [email, setEmail] = useState('');
    const [rol, setRol] = useState('');
    const [loading, setLoading] = useState(false);

    const [suggestions, setSuggestions] = useState<string[]>([]); // 💡 sugerencias de emails

    const auth = useContext(AuthContext);

    const fetchSuggestions = async (text: string) => {
        if (!text.includes('@')) return setSuggestions([]);

        try {
            const db = getFirestore(app);
            const usuariosRef = collection(db, 'usuarios');
            const q = query(usuariosRef, where("email", ">=", text), where("email", "<=", text + "\uf8ff"));
            const querySnapshot = await getDocs(q);

            const emails = querySnapshot.docs.map(doc => doc.data().email).filter(Boolean);
            setSuggestions(emails);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
    };

    const handleInvite = async () => {
        if (!email.trim() || !rol) {
            Alert.alert("Error", "Completa todos los campos");
            return;
        }

        try {
            setLoading(true);
            const db = getFirestore(app);
            const usuariosRef = collection(db, 'usuarios');

            const q = query(usuariosRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await setDoc(docRef, {
                    proyectos: {
                        [proyecto?.id]: rol,
                    },
                    estado: "invitado",
                }, { merge: true });
                Alert.alert("Invitación actualizada", "El usuario ya existía y se actualizó correctamente.");
            } else {
                const sanitizedId = email.replace(/[^\w.-]/g, '_');
                const docRef = doc(db, 'usuarios', sanitizedId);
                await setDoc(docRef, {
                    email: email,
                    name: "",
                    avatarUrl: "",
                    proyectos: {
                        [proyecto?.id]: rol,
                    },
                    estado: "invitado",
                    fechaInvitacion: new Date(),
                    emailPendingInvitation: true,
                });
                Alert.alert("Usuario invitado", "La invitación fue creada correctamente.");
            }

            setEmail('');
            setRol('');
            setSuggestions([]);
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
                onChangeText={(text) => {
                    setEmail(text);
                    fetchSuggestions(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {suggestions.length > 0 && (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item}
                    style={styles.suggestionList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => {
                                setEmail(item);
                                setSuggestions([]);
                            }}
                        >
                            <Text>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

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
        marginBottom: 5,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginVertical: 15,
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
    suggestionList: {
        maxHeight: 150,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
});
