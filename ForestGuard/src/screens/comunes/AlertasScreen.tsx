import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import * as Location from 'expo-location';
import { collection, addDoc, Timestamp, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

const db = getFirestore(app);

const AlertasScreen = () => {
  const { user, currentProject } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [customDescription, setCustomDescription] = useState('');

  const tiposDeAlerta = [
    { type: 'Emergencia', icon: 'alert', color: '#FF6347' },
    { type: 'Incidente', icon: 'ambulance', color: '#FFA500' },
    { type: 'Animal Salvaje', icon: 'paw', color: '#000000', iconLib: 'fa5' },
    { type: 'Alerta de Incendio', icon: 'fire', color: '#DC143C' },
  ];

  const enviarAlerta = async (type: string, descripcion?: string) => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'No se otorgaron permisos de ubicación.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const alerta = {
        proyectoId: currentProject?.id ?? null,
        usuarioId: user?.id ?? null,
        tipo: type,
        location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        },
        timestamp: Timestamp.now(),
        descripcion: descripcion ?? `Alerta de tipo ${type}`,
        resuelta: false,
      };

      await addDoc(collection(db, 'alertas'), alerta);
      Alert.alert('Alerta enviada', `Se envió la alerta de tipo "${type}".`);
    } catch (error) {
      console.error('Error al enviar alerta:', error);
      Alert.alert('Error', 'No se pudo enviar la alerta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAlertaTap = () => {
    setTapCount(prev => {
      if (prev === 0) {
        setTimeout(() => setTapCount(0), 1000);
      }
      if (prev + 1 === 3) {
        enviarAlerta('Super Alerta', 'Activación de Super Alerta');
        return 0;
      }
      return prev + 1;
    });
  };

  const handleOtraAlerta = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Otra Alerta',
        'Ingresa la descripción de la alerta:',
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Enviar',
            onPress: (text) => {
              if (text && text.trim() !== '') {
                enviarAlerta('Otra Alerta', text.trim());
              } else {
                Alert.alert('Descripción requerida', 'Por favor ingresa una descripción para la alerta.');
              }
            }
          }
        ],
        'plain-text'
      );
    } else {
      setModalVisible(true);
    }
  };

  const enviarOtraAlertaDesdeModal = () => {
    if (customDescription.trim() === '') {
      Alert.alert('Descripción requerida', 'Por favor ingresa una descripción.');
      return;
    }
    setModalVisible(false);
    enviarAlerta('Otra Alerta', customDescription.trim());
    setCustomDescription('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enviar Alerta</Text>

      {/* Super Alerta */}
      <TouchableOpacity
        style={styles.superAlertButton}
        onPress={handleSuperAlertaTap}
        disabled={loading}
      >
        <Icon name="alert-octagram" size={40} color="#fff" />
        <Text style={styles.superAlertText}>Super Alerta (tocar 3x rápido)</Text>
      </TouchableOpacity>

      {/* Botones de alerta rápida */}
      <View style={styles.buttonsContainer}>
        {tiposDeAlerta.map((alerta, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.alertButton, { backgroundColor: alerta.color }]}
            onPress={() => enviarAlerta(alerta.type)}
            disabled={loading}
          >
            {alerta.iconLib === 'fa5' ? (
              <FontAwesome5 name={alerta.icon} size={30} color="#fff" />
            ) : (
              <Icon name={alerta.icon} size={30} color="#fff" />
            )}
            <Text style={styles.alertButtonText}>{alerta.type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botón Otra Alerta */}
      <TouchableOpacity
        style={styles.otraAlertaButton}
        onPress={handleOtraAlerta}
        disabled={loading}
      >
        <Icon name="plus-circle" size={30} color="#fff" />
        <Text style={styles.otraAlertaText}>Enviar Otra Alerta</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Enviando alerta...</Text>
        </View>
      )}

      {/* Modal para "Otra Alerta" en Android y fallback */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Otra Alerta</Text>
            <TextInput
              placeholder="Describe la alerta..."
              placeholderTextColor="#888"
              style={styles.textInput}
              value={customDescription}
              onChangeText={setCustomDescription}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSend} onPress={enviarOtraAlertaDesdeModal}>
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AlertasScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'flex-start' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#000' },
  buttonsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  alertButton: {
    width: '40%', aspectRatio: 1, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    marginVertical: 10, elevation: 4,
  },
  alertButtonText: { color: '#fff', fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  superAlertButton: {
    backgroundColor: '#000', marginBottom: 20, padding: 20, borderRadius: 15, alignItems: 'center', elevation: 5,
  },
  superAlertText: { color: '#fff', fontWeight: 'bold', marginTop: 10, textAlign: 'center', fontSize: 16 },
  otraAlertaButton: {
    backgroundColor: '#007AFF', marginTop: 20, padding: 15, borderRadius: 15, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', elevation: 4,
  },
  otraAlertaText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  textInput: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, textAlignVertical: 'top', minHeight: 80, color: '#000',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  modalButtonCancel: { backgroundColor: '#888', padding: 10, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  modalButtonSend: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
});
