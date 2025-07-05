import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../../config/firebase';

const db = getFirestore(app);

// Definiciones de tipos reutilizadas (idealmente en un archivo de tipos común)
interface EquipoUserData {
  name: string;
  email: string;
  avatarUrl?: string;
  estado?: string;
  phone?: string;
  proyectos?: { [projectId: string]: string };
}
type EquipoUser = EquipoUserData & { id: string };

interface WorkerEvaluationModalProps {
  worker: EquipoUser;
  attendanceRecordId: string;
  projectId: string;
  date: string;
  onClose: () => void;
}

const evaluationQuestions = [
  { id: 'q1', text: '¿Cómo calificarías tu nivel de cansancio físico general al final de la jornada?', key: 'physicalTiredness' },
  { id: 'q2', text: '¿Experimentas alguna molestia o dolor muscular/articular inusual después de la jornada?', key: 'muscleJointPain' },
  { id: 'q3', text: '¿Cómo describirías tu nivel de energía actual?', key: 'energyLevel' },
  { id: 'q4', text: '¿Sentiste dificultades para mantener la concentración o la atención durante las tareas?', key: 'concentrationDifficulty' },
  { id: 'q5', text: '¿Te sientes más irritable o de mal humor de lo normal?', key: 'irritability' },
  { id: 'q6', text: '¿Qué tan bien crees que podrás descansar esta noche?', key: 'sleepQualityProjection' },
  { id: 'q7', text: '¿Cómo describirías tu nivel de estrés o tensión general al finalizar el día?', key: 'generalStress' },
];


const WorkerEvaluationModal: React.FC<WorkerEvaluationModalProps> = ({ worker, attendanceRecordId, projectId, date, onClose }) => {
  const [answers, setAnswers] = useState<{[key: string]: number}>({
    physicalTiredness: 0,
    muscleJointPain: 0,
    energyLevel: 0,
    concentrationDifficulty: 0,
    irritability: 0,
    sleepQualityProjection: 0,
    generalStress: 0,
  });
  const [workerComments, setWorkerComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (questionKey: string, rating: number) => {
    setAnswers(prev => ({ ...prev, [questionKey]: rating }));
  };

  const handleSubmit = async () => {
    const allQuestionsAnswered = evaluationQuestions.every(q => answers[q.key] !== 0);

    if (!allQuestionsAnswered) {
      Alert.alert('Faltan respuestas', 'Por favor, responde a todas las preguntas antes de enviar la evaluación.');
      return;
    }

    setIsSubmitting(true);
    try {
      const evaluationData = {
        userId: worker.id,
        projectId: projectId,
        attendanceRecordId: attendanceRecordId,
        date: date,
        ...answers,
        workerComments: workerComments,
        additionalComments: '', // Inicialmente vacío. Solo el auxiliar lo editará.
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, 'evaluacionesPostJornada'), evaluationData);
      Alert.alert('Éxito', '¡Evaluación enviada con éxito!');
      onClose();
    } catch (error) {
      console.error('Error al enviar la evaluación:', error);
      Alert.alert('Error', 'No se pudo enviar la evaluación. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingButtons = (questionKey: string, currentRating: number) => (
    <View style={styles.ratingButtonsContainer}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <TouchableOpacity
          key={rating}
          style={[
            styles.ratingButton,
            currentRating === rating ? styles.ratingButtonActive : null,
          ]}
          onPress={() => handleRating(questionKey, rating)}
          disabled={isSubmitting}
        >
          <Text
            style={[
              styles.ratingButtonText,
              currentRating === rating ? styles.ratingButtonTextActive : null,
            ]}
          >
            {rating}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Evaluación de {worker.name}</Text>
        <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
          <Icon name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.userProfileCard}>
          <Icon name="account-circle" size={50} color="#000000" style={styles.profileAvatar} />
          <View>
            <Text style={styles.profileName}>{worker.name}</Text>
            <Text style={styles.profileDetails}>Fecha: {date}</Text>
          </View>
        </View>

        {evaluationQuestions.map((q) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionText}>{q.text}</Text>
            {renderRatingButtons(q.key, answers[q.key])}
            <View style={styles.ratingLabels}>
              <Text style={styles.ratingLabelText}>1 (Nada/Muy Bajo)</Text>
              <Text style={styles.ratingLabelText}>5 (Muy Alto/Severo)</Text>
            </View>
          </View>
        ))}

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>Comentarios del Trabajador (Opcional)</Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Comparte cualquier preocupación o nota relevante sobre tu jornada..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={4}
            value={workerComments}
            onChangeText={setWorkerComments}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>Comentarios Adicionales (para el Auxiliar)</Text>
          <TextInput
            style={[styles.commentsInput, styles.additionalCommentsDisplayOnly]}
            value="Este campo será llenado por el auxiliar/supervisor después de la revisión."
            editable={false}
            multiline
            numberOfLines={2}
          />
        </View>

      </ScrollView>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Icon name="send" size={24} color="#FFFFFF" style={styles.submitButtonIcon} />
            <Text style={styles.submitButtonText}>Enviar Evaluación</Text>
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
    paddingBottom: 100,
  },
  userProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    marginRight: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  profileDetails: {
    fontSize: 14,
    color: '#666666',
  },
  questionCard: {
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
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
  },
  ratingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  ratingButtonActive: {
    backgroundColor: '#7ED321',
    borderColor: '#7ED321',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  },
  ratingButtonTextActive: {
    color: '#FFFFFF',
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  ratingLabelText: {
    fontSize: 12,
    color: '#666666',
  },
  commentsInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  additionalCommentsDisplayOnly: {
    backgroundColor: '#E0E0E0',
    color: '#666666',
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#999999',
  },
  submitButtonIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WorkerEvaluationModal;