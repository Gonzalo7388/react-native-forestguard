import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../../config/firebase'; // Asegúrate de que la ruta sea correcta

const db = getFirestore(app);

// Definiciones de tipos (idealmente en un archivo de tipos común)
interface EquipoUserData {
  name: string;
  email: string;
  avatarUrl?: string;
  estado?: string;
  phone?: string;
  proyectos?: { [projectId: string]: string };
}
type EquipoUser = EquipoUserData & { id: string };

interface EvaluationData {
  userId: string;
  projectId: string;
  date: string;
  attendanceRecordId: string;
  physicalTiredness: number;
  mentalExhaustion: number;
  workerComments: string;
  additionalComments: string; // Este es el campo a editar
  timestamp: any;
  // ... otras propiedades de evaluación
}
type Evaluation = EvaluationData & { id: string }; // Incluye el 'id' del documento de evaluación


interface AuxiliaryCommentsModalProps {
  worker: EquipoUser;
  evaluation: Evaluation; // Recibe el objeto de evaluación completo
  onClose: () => void;
}

const AuxiliaryCommentsModal: React.FC<AuxiliaryCommentsModalProps> = ({ worker, evaluation, onClose }) => {
  const [auxiliaryComments, setAuxiliaryComments] = useState(evaluation.additionalComments || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Mapeo de valores de calificación a etiquetas descriptivas para mostrar
  const ratingLabels: { [key: number]: string } = {
    1: '1 (Nada/Muy Bajo)',
    2: '2 (Bajo)',
    3: '3 (Moderado)',
    4: '4 (Alto)',
    5: '5 (Muy Alto/Severo)',
  };

  const handleUpdateComments = async () => {
    setIsUpdating(true);
    try {
      if (!evaluation.id) {
        Alert.alert('Error', 'No se encontró el ID de la evaluación para actualizar.');
        return;
      }

      const evaluationRef = doc(db, 'evaluacionesPostJornada', evaluation.id);
      await updateDoc(evaluationRef, {
        additionalComments: auxiliaryComments,
      });

      Alert.alert('Éxito', 'Comentarios del auxiliar actualizados.');
      onClose();
    } catch (error) {
      console.error('Error al actualizar comentarios del auxiliar:', error);
      Alert.alert('Error', 'No se pudieron actualizar los comentarios. Intenta de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comentarios Auxiliar: {worker.name}</Text>
        <TouchableOpacity onPress={onClose} disabled={isUpdating}>
          <Icon name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Información del trabajador y evaluación */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Detalles de la Evaluación</Text>
          <Text style={styles.infoText}>
            <Text style={{fontWeight: 'bold'}}>Trabajador:</Text> {worker.name}
          </Text>
          <Text style={styles.infoText}>
            <Text style={{fontWeight: 'bold'}}>Fecha:</Text> {evaluation.date}
          </Text>
          <Text style={styles.infoText}>
            <Text style={{fontWeight: 'bold'}}>Cansancio Físico:</Text> {evaluation.physicalTiredness} ({ratingLabels[evaluation.physicalTiredness]})
          </Text>
          <Text style={styles.infoText}>
            <Text style={{fontWeight: 'bold'}}>Agotamiento Mental:</Text> {evaluation.mentalExhaustion} ({ratingLabels[evaluation.mentalExhaustion]})
          </Text>
          {/* Puedes añadir más detalles de las preguntas si lo deseas */}
          <Text style={styles.infoText}>
            <Text style={{fontWeight: 'bold'}}>Comentarios del Trabajador:</Text> {evaluation.workerComments || 'Ninguno.'}
          </Text>
        </View>

        {/* Campo para que el auxiliar agregue/edite comentarios */}
        <View style={styles.commentsCard}>
          <Text style={styles.commentsTitle}>Añadir/Editar Comentario del Auxiliar</Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Agrega tus observaciones o notas aquí..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={6}
            value={auxiliaryComments}
            onChangeText={setAuxiliaryComments}
            editable={!isUpdating}
          />
        </View>
      </ScrollView>

      {/* Botón de Guardar Comentarios del Auxiliar */}
      <TouchableOpacity
        style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
        onPress={handleUpdateComments}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Icon name="content-save" size={24} color="#FFFFFF" style={styles.saveButtonIcon} />
            <Text style={styles.saveButtonText}>Guardar Comentarios</Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flexShrink: 1,
    marginRight: 10,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100, // Espacio para el botón fijo
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
  },
  commentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  commentsInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  saveButtonDisabled: {
    backgroundColor: '#999999',
  },
  saveButtonIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AuxiliaryCommentsModal;