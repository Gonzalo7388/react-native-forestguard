import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import * as Location from 'expo-location';

const RegistrarArbolScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [motivo, setMotivo] = useState('');
  const [especie, setEspecie] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { user } = useAuth();

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSaveTree = async () => {
    if (!descripcion || !motivo || !especie || !image) {
      Alert.alert('Completa todos los campos y toma una foto.');
      return;
    }

    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});

      const db = getFirestore(app);
      await addDoc(collection(db, 'arboles'), {
        descripcion,
        motivo,
        especie,
        imagenUri: image,
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        marcadorId: user?.id ?? null,
        proyectoId: user?.proyectoId ?? null,
        timestamp: new Date(),
      });

      Alert.alert('Registro exitoso', 'El árbol ha sido registrado correctamente.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo registrar el árbol.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar árbol</Text>

      {image ? (
        <Image source={{ uri: image }} style={styles.imagePreview} />
      ) : (
        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
          <Text style={styles.photoButtonText}>Tomar foto del árbol</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={descripcion}
        onChangeText={setDescripcion}
      />
      <TextInput
        style={styles.input}
        placeholder="Motivo de tala"
        value={motivo}
        onChangeText={setMotivo}
      />
      <TextInput
        style={styles.input}
        placeholder="Especie"
        value={especie}
        onChangeText={setEspecie}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveTree} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar registro</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default RegistrarArbolScreen;

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
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});