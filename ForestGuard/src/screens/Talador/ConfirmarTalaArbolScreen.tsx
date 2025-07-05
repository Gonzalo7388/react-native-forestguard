// src/screens/Talador/ConfirmarTalaArbolScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { getFirestore, doc, updateDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';

const ConfirmarTalaArbolScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { arbolId } = route.params as { arbolId: string };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara.');
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

  const handleConfirmTala = async () => {
    if (!image) {
      Alert.alert('Toma una foto como evidencia antes de confirmar.');
      return;
    }
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const db = getFirestore(app);

      // Crear registro en colección 'tala_arboles'
      await addDoc(collection(db, 'tala_arboles'), {
        arbolId,
        userId: user?.id ?? null,
        fotoUri: image,
        timestamp: Timestamp.now(),
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
      });

      // Actualizar estado del árbol a 'talado'
      const arbolRef = doc(db, 'arboles', arbolId);
      await updateDoc(arbolRef, { estado: 'talado' });

      Alert.alert('Éxito', 'El árbol ha sido marcado como talado con evidencia.');
      navigation.goBack();
    } catch (error) {
      console.error('Error al confirmar tala:', error);
      Alert.alert('Error', 'No se pudo confirmar la tala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar tala del árbol</Text>
      {image ? (
        <Image source={{ uri: image }} style={styles.imagePreview} />
      ) : (
        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
          <Text style={styles.photoButtonText}>Tomar foto de evidencia</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.confirmButton, { backgroundColor: image ? '#28a745' : '#aaa' }]}
        onPress={handleConfirmTala}
        disabled={loading || !image}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar tala</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ConfirmarTalaArbolScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f0f0' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  imagePreview: { width: '100%', height: 250, borderRadius: 12, marginBottom: 20 },
  photoButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  photoButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  confirmButton: { padding: 15, borderRadius: 8, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
