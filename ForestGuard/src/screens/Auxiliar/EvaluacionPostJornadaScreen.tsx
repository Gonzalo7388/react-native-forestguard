import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFirestore, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

import WorkerEvaluationModal from './WorkerEvaluationModal';
import AuxiliaryCommentsModal from './AuxiliaryCommentsModal'; // Nuevo modal para comentarios del auxiliar

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

interface AttendanceRecordData {
  userId: string;
  projectId: string;
  checkInTime: any;
  checkOutTime?: any;
  date: string;
}
type AttendanceRecord = AttendanceRecordData & { id: string };

interface EvaluationData {
  userId: string;
  projectId: string;
  date: string;
  attendanceRecordId: string;
  physicalTiredness: number;
  mentalExhaustion: number; // Asegúrate de que esto se guarde si lo usas
  workerComments: string;
  additionalComments: string; // Campo que editará el auxiliar
  timestamp: any;
  // ... otras propiedades de evaluación
}
type Evaluation = EvaluationData & { id: string };


const EvaluacionPostJornadaScreen = () => {
  const { user, currentProject } = useAuth();
  const [workers, setWorkers] = useState<EquipoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDateForFirestore, setCurrentDateForFirestore] = useState('');

  const [isWorkerEvalModalVisible, setIsWorkerEvalModalVisible] = useState(false);
  const [isAuxCommentsModalVisible, setIsAuxCommentsModalVisible] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState<EquipoUser | null>(null);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null); // Para el modal de auxiliar

  const [activeAttendanceMap, setActiveAttendanceMap] = useState<{[userId: string]: AttendanceRecord}>({});
  const [evaluatedWorkersMap, setEvaluatedWorkersMap] = useState<{[userId: string]: Evaluation}>({});


  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    setCurrentDateForFirestore(`${year}-${month}-${day}`);
  }, []);


  useEffect(() => {
    if (!currentProject?.id || !currentDateForFirestore) {
      setLoading(false);
      setWorkers([]);
      return;
    }

    setLoading(true);
    // Inicializar variables de suscripción fuera de try-catch para asegurar que se definan
    let unsubscribeWorkers: (() => void) | undefined;
    let unsubscribeAttendance: (() => void) | undefined;
    let unsubscribeEvaluations: (() => void) | undefined;

    const fetchData = async () => {
      try {
        // Obtener todos los trabajadores asignados al proyecto actual (una vez, no en tiempo real)
        const workersQuery = query(
          collection(db, 'usuarios'),
          where(`proyectos.${currentProject.id}`, '!=', null)
        );
        const workersSnapshot = await getDocs(workersQuery);
        const fetchedWorkers: EquipoUser[] = workersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as EquipoUserData)
        }));
        setWorkers(fetchedWorkers);

        // Suscribirse a cambios en la asistencia para el proyecto y fecha actual
        const attendanceRef = collection(db, 'asistencia');
        const attendanceQ = query(
          attendanceRef,
          where('projectId', '==', currentProject.id),
          where('date', '==', currentDateForFirestore)
        );
        unsubscribeAttendance = onSnapshot(attendanceQ, (snapshot) => {
          const newActiveAttendanceMap: {[userId: string]: AttendanceRecord} = {};
          snapshot.docs.forEach(doc => {
            const record = { id: doc.id, ...doc.data() } as AttendanceRecord;
            if (record.checkInTime && !record.checkOutTime) { // Jornada activa
              newActiveAttendanceMap[record.userId] = record;
            } else if (record.checkInTime && record.checkOutTime) { // Jornada cerrada
              newActiveAttendanceMap[record.userId] = record; // También la consideramos para mostrar "Jornada Cerrada"
            }
          });
          setActiveAttendanceMap(newActiveAttendanceMap);
        }, (error) => {
          console.error("Error al suscribirse a asistencia:", error);
          Alert.alert("Error", "No se pudo cargar la asistencia.");
        });

        // Suscribirse a cambios en las evaluaciones post-jornada para el proyecto y fecha actual
        const evaluationsRef = collection(db, 'evaluacionesPostJornada');
        const evaluationsQ = query(
          evaluationsRef,
          where('projectId', '==', currentProject.id),
          where('date', '==', currentDateForFirestore)
        );
        unsubscribeEvaluations = onSnapshot(evaluationsQ, (snapshot) => {
          const newEvaluatedWorkersMap: {[userId: string]: Evaluation} = {};
          snapshot.docs.forEach(doc => {
            const evaluation = { id: doc.id, ...doc.data() } as Evaluation;
            newEvaluatedWorkersMap[evaluation.userId] = evaluation;
          });
          setEvaluatedWorkersMap(newEvaluatedWorkersMap);
        }, (error) => {
          console.error("Error al suscribirse a evaluaciones:", error);
          Alert.alert("Error", "No se pudieron cargar las evaluaciones.");
        });

      } catch (error) {
        console.error('Error al obtener datos iniciales:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      // Limpieza de suscripciones al desmontar el componente
      // Solo intenta desuscribirse si la variable está definida
      if (unsubscribeWorkers) unsubscribeWorkers();
      if (unsubscribeAttendance) unsubscribeAttendance();
      if (unsubscribeEvaluations) unsubscribeEvaluations();
    };
  }, [currentProject?.id, currentDateForFirestore]);


  const handleWorkerPress = (worker: EquipoUser) => {
    const attendanceRecord = activeAttendanceMap[worker.id];
    const evaluation = evaluatedWorkersMap[worker.id];
    const hasBeenEvaluated = !!evaluation;

    setSelectedWorker(worker);

    if (hasBeenEvaluated) {
      // Si ya está evaluado, abre el modal de comentarios del auxiliar
      setSelectedEvaluation(evaluation);
      setIsAuxCommentsModalVisible(true);
    } else if (attendanceRecord && !attendanceRecord.checkOutTime) {
      // Si tiene jornada activa y no ha sido evaluado, abre el modal de evaluación del trabajador
      setSelectedAttendanceRecord(attendanceRecord);
      setIsWorkerEvalModalVisible(true);
    } else if (attendanceRecord && attendanceRecord.checkOutTime) {
      // Si ya cerró jornada y no fue evaluado
      Alert.alert(
        'Jornada Finalizada',
        `${worker.name} ha cerrado su jornada y aún no ha sido evaluado. Puedes realizar la evaluación si es necesario, o el trabajador podrá autoevaluarse.`
      );
      // Opcional: Podrías abrir el modal de evaluación aquí si quieres permitir evaluar a alguien con jornada cerrada.
      // setSelectedAttendanceRecord(attendanceRecord);
      // setIsWorkerEvalModalVisible(true);
    } else {
      // No tiene registro de asistencia o no ha iniciado jornada
      Alert.alert(
        'Atención',
        `${worker.name} no tiene una jornada activa para hoy.`
      );
    }
  };

  const closeWorkerEvalModal = () => {
    setIsWorkerEvalModalVisible(false);
    setSelectedWorker(null);
    setSelectedAttendanceRecord(null);
  };

  const closeAuxCommentsModal = () => {
    setIsAuxCommentsModalVisible(false);
    setSelectedWorker(null);
    setSelectedEvaluation(null);
  };


  const renderWorkerItem = ({ item }: { item: EquipoUser }) => {
    const attendanceRecord = activeAttendanceMap[item.id];
    const hasBeenEvaluated = !!evaluatedWorkersMap[item.id];

    let statusText = 'No Iniciado';
    let statusColor = '#999';
    let isDisabled = true; // Por defecto, deshabilitado

    if (attendanceRecord && !attendanceRecord.checkOutTime) {
      // Jornada activa
      if (hasBeenEvaluated) {
        statusText = 'Evaluado';
        statusColor = '#7ED321'; // Verde para evaluado
        isDisabled = false; // Permite abrir el modal de comentarios
      } else {
        statusText = 'Jornada Activa';
        statusColor = '#007BFF'; // Azul para jornada activa
        isDisabled = false; // Permite abrir el modal de evaluación
      }
    } else if (attendanceRecord && attendanceRecord.checkOutTime) {
      // Jornada cerrada
      if (hasBeenEvaluated) {
        statusText = 'Evaluado (Jornada Cerrada)';
        statusColor = '#7ED321'; // Verde para evaluado, pero indicando jornada cerrada
        isDisabled = false; // Permite abrir el modal de comentarios
      } else {
        statusText = 'Jornada Cerrada';
        statusColor = '#FF0000'; // Rojo para jornada cerrada sin evaluar
        isDisabled = false; // Permite abrir el modal para posibles comentarios
      }
    }

    return (
      <TouchableOpacity
        style={[styles.workerListItem, isDisabled && styles.workerListItemDisabled]}
        onPress={() => handleWorkerPress(item)}
        disabled={isDisabled}
      >
        <View style={styles.workerInfo}>
          <Icon name="account-circle-outline" size={30} color="#000" />
          <Text style={styles.workerName}>{item.name}</Text>
        </View>
        <View style={styles.workerStatus}>
          <Text style={[styles.workerStatusText, { color: statusColor }]}>{statusText}</Text>
          <Icon name="chevron-right" size={24} color="#666" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Evaluación Post-Jornada</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.sectionTitle}>Trabajadores del Proyecto: {currentProject?.name || 'Cargando...'}</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
        ) : workers.length === 0 ? (
          <Text style={styles.noWorkersText}>No hay trabajadores asignados a este proyecto.</Text>
        ) : (
          <FlatList
            data={workers}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkerItem}
            scrollEnabled={false}
            contentContainerStyle={styles.workerListContainer}
          />
        )}
      </ScrollView>

      {/* Modal de Evaluación del Trabajador (solo si tiene jornada activa y no ha sido evaluado) */}
      {selectedWorker && selectedAttendanceRecord && !evaluatedWorkersMap[selectedWorker.id] && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isWorkerEvalModalVisible}
          onRequestClose={closeWorkerEvalModal}
        >
          <WorkerEvaluationModal
            worker={selectedWorker}
            attendanceRecordId={selectedAttendanceRecord.id}
            projectId={currentProject?.id || ''}
            date={currentDateForFirestore}
            onClose={closeWorkerEvalModal}
          />
        </Modal>
      )}

      {/* Modal de Comentarios del Auxiliar (si ya fue evaluado) */}
      {selectedWorker && selectedEvaluation && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={isAuxCommentsModalVisible}
          onRequestClose={closeAuxCommentsModal}
        >
          <AuxiliaryCommentsModal
            worker={selectedWorker}
            evaluation={selectedEvaluation}
            onClose={closeAuxCommentsModal}
          />
        </Modal>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15,
    marginTop: 10,
  },
  noWorkersText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  workerListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workerListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  workerListItemDisabled: {
    opacity: 0.6, // Hace que los elementos deshabilitados se vean borrosos
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 10,
  },
  workerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default EvaluacionPostJornadaScreen;