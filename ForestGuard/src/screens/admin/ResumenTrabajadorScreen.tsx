import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth'; // Para obtener el currentProject

const db = getFirestore(app);

// --- Interfaces (reutilizadas de otros archivos) ---
interface EquipoUserData {
  name: string;
  email: string;
  avatarUrl?: string;
  estado?: string;
  phone?: string;
  proyectos?: { [projectId: string]: string };
  location?: { latitude: number; longitude: number; };
  lastLocationUpdate?: any; // Firebase Timestamp
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

interface UserEquipmentStatus {
  id: string;
  name: string;
  icon: string;
  isPresent: boolean;
}
interface EquipmentChecklistRecordData {
  userId: string;
  projectId: string;
  date: string;
  equipment: UserEquipmentStatus[];
  lastUpdated: any;
}
type EquipmentChecklistRecord = EquipmentChecklistRecordData & { id: string };

interface EvaluationData {
  userId: string;
  projectId: string;
  date: string;
  attendanceRecordId: string;
  physicalTiredness: number;
  muscleJointPain: number;
  energyLevel: number;
  concentrationDifficulty: number;
  irritability: number;
  sleepQualityProjection: number;
  generalStress: number;
  workerComments: string;
  additionalComments: string;
  timestamp: any;
}
type Evaluation = EvaluationData & { id: string };

// Preguntas y etiquetas de calificación para mostrar la evaluación
const evaluationQuestionsDisplay = [
  { text: 'Cansancio Físico General', key: 'physicalTiredness' },
  { text: 'Molestias Musculares/Articulares', key: 'muscleJointPain' },
  { text: 'Nivel de Energía', key: 'energyLevel' },
  { text: 'Dificultades de Concentración', key: 'concentrationDifficulty' },
  { text: 'Irritabilidad/Mal Humor', key: 'irritability' },
  { text: 'Proyección Calidad del Sueño', key: 'sleepQualityProjection' },
  { text: 'Estrés/Tensión General', key: 'generalStress' },
];

const ratingLabels: { [key: number]: string } = {
  1: '1 (Nada/Muy Bajo)',
  2: '2 (Bajo)',
  3: '3 (Moderado)',
  4: '4 (Alto)',
  5: '5 (Muy Alto/Severo)',
};


// --- Componente ResumenTrabajadorScreen ---
// Asume que recibe workerId como prop de navegación o similar
const ResumenTrabajadorScreen: React.FC<{ route?: any }> = ({ route }) => {
  // Para propósitos de demostración, asumimos un workerId.
  // En una app real, vendría de route.params.workerId
  const workerId = route?.params?.workerId || 'google-oauth2_117552882532823193985'; // ID de ejemplo

  const { currentProject } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workerData, setWorkerData] = useState<EquipoUser | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord | null>(null);
  const [equipmentData, setEquipmentData] = useState<EquipmentChecklistRecord | null>(null);
  const [evaluationData, setEvaluationData] = useState<Evaluation | null>(null);
  const [currentDateForFirestore, setCurrentDateForFirestore] = useState('');

  // Función auxiliar para formatear la fecha a YYYY-MM-DD
  const formatDateForFirestore = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para formatear timestamps de Firebase a hora legible
  const formatFirebaseTimestampToTime = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    // Establecer la fecha actual para las consultas
    setCurrentDateForFirestore(formatDateForFirestore(new Date()));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!workerId || !currentProject?.id || !currentDateForFirestore) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Obtener datos del trabajador
        const workerDocRef = doc(db, 'usuarios', workerId);
        const workerDocSnap = await getDoc(workerDocRef);
        if (workerDocSnap.exists()) {
          setWorkerData({ id: workerDocSnap.id, ...(workerDocSnap.data() as EquipoUserData) });
        } else {
          Alert.alert('Error', 'Trabajador no encontrado.');
          setWorkerData(null);
        }

        // 2. Obtener registro de asistencia para el día actual
        const attendanceQuery = query(
          collection(db, 'asistencia'),
          where('userId', '==', workerId),
          where('projectId', '==', currentProject.id),
          where('date', '==', currentDateForFirestore)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        if (!attendanceSnapshot.empty) {
          setAttendanceData({ id: attendanceSnapshot.docs[0].id, ...(attendanceSnapshot.docs[0].data() as AttendanceRecordData) });
        } else {
          setAttendanceData(null);
        }

        // 3. Obtener registro de equipamiento para el día actual
        const equipmentDocId = `${workerId}_${currentProject.id}_${currentDateForFirestore}`;
        const equipmentDocRef = doc(db, 'equipamiento_registros', equipmentDocId);
        const equipmentDocSnap = await getDoc(equipmentDocRef);
        if (equipmentDocSnap.exists()) {
          setEquipmentData({ id: equipmentDocSnap.id, ...(equipmentDocSnap.data() as EquipmentChecklistRecordData) });
        } else {
          setEquipmentData(null);
        }

        // 4. Obtener evaluación post-jornada para el día actual
        const evaluationQuery = query(
          collection(db, 'evaluacionesPostJornada'),
          where('userId', '==', workerId),
          where('projectId', '==', currentProject.id),
          where('date', '==', currentDateForFirestore)
        );
        const evaluationSnapshot = await getDocs(evaluationQuery);
        if (!evaluationSnapshot.empty) {
          setEvaluationData({ id: evaluationSnapshot.docs[0].id, ...(evaluationSnapshot.docs[0].data() as EvaluationData) });
        } else {
          setEvaluationData(null);
        }

      } catch (error) {
        console.error('Error al cargar datos del trabajador:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos del trabajador.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workerId, currentProject?.id, currentDateForFirestore]); // Dependencias para re-ejecutar la carga

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Cargando resumen del trabajador...</Text>
      </SafeAreaView>
    );
  }

  if (!workerData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.noDataText}>No se encontró información para el trabajador.</Text>
      </SafeAreaView>
    );
  }

  const workerRole = workerData.proyectos?.[currentProject?.id || ''] || 'Sin rol asignado';
  const attendanceStatusText = attendanceData
    ? (attendanceData.checkInTime && !attendanceData.checkOutTime ? 'Jornada Activa' : 'Jornada Finalizada')
    : 'Sin Registro de Asistencia';
  const attendanceStatusColor = attendanceData
    ? (attendanceData.checkInTime && !attendanceData.checkOutTime ? '#7ED321' : '#FF0000')
    : '#999999';

  const evaluationStatusText = evaluationData ? 'Evaluación Completada' : 'Evaluación Pendiente';
  const evaluationStatusColor = evaluationData ? '#7ED321' : '#FFC107'; // Verde si completada, Amarillo si pendiente

  const equipmentSummaryText = equipmentData
    ? `${equipmentData.equipment.filter(item => item.isPresent).length} de ${equipmentData.equipment.length} ítems presentes.`
    : 'Sin registro de equipamiento.';
  const equipmentSummaryColor = equipmentData && equipmentData.equipment.every(item => item.isPresent) ? '#7ED321' : '#FFC107';


  return (
    <SafeAreaView style={styles.container}>
      {/* Header Profile Section */}
      <View style={styles.profileHeader}>
        <Icon name="account-circle-outline" size={50} color="#000000" style={styles.profileAvatar} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{workerData.name}</Text>
          <Text style={styles.profileId}>{workerRole} en {currentProject?.nombre || 'Proyecto Desconocido'}</Text>
        </View>
        {/* Puedes añadir un botón de "volver" o "opciones" aquí */}
        {/* <TouchableOpacity>
          <Icon name="dots-vertical" size={24} color="#000000" />
        </TouchableOpacity> */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Card: Estado General del Día */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado General del Día ({currentDateForFirestore})</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Asistencia:</Text>
            <View style={[styles.statusBadge, { backgroundColor: attendanceStatusColor }]}>
              <Text style={styles.statusBadgeText}>{attendanceStatusText}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Evaluación Post-Jornada:</Text>
            <View style={[styles.statusBadge, { backgroundColor: evaluationStatusColor }]}>
              <Text style={styles.statusBadgeText}>{evaluationStatusText}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Equipamiento:</Text>
            <View style={[styles.statusBadge, { backgroundColor: equipmentSummaryColor }]}>
              <Text style={styles.statusBadgeText}>{equipmentSummaryText}</Text>
            </View>
          </View>
        </View>

        {/* Card: Detalles de Asistencia */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles de Asistencia</Text>
          {attendanceData ? (
            <>
              <View style={styles.attendanceRow}>
                <Icon name="clock-in" size={20} color="#000000" style={styles.attendanceIcon} />
                <Text style={styles.attendanceTypeText}>Hora de Entrada:</Text>
                <Text style={styles.attendanceTimeText}>{formatFirebaseTimestampToTime(attendanceData.checkInTime)}</Text>
              </View>
              {attendanceData.checkOutTime ? (
                <View style={styles.attendanceRow}>
                  <Icon name="clock-out" size={20} color="#000000" style={styles.attendanceIcon} />
                  <Text style={styles.attendanceTypeText}>Hora de Salida:</Text>
                  <Text style={styles.attendanceTimeText}>{formatFirebaseTimestampToTime(attendanceData.checkOutTime)}</Text>
                </View>
              ) : (
                <Text style={styles.cardDetailText}>Salida aún no registrada.</Text>
              )}
            </>
          ) : (
            <Text style={styles.cardDetailText}>No hay registro de asistencia para hoy.</Text>
          )}
        </View>

        {/* Card: Detalles de Equipamiento */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles de Equipamiento</Text>
          {equipmentData && equipmentData.equipment.length > 0 ? (
            equipmentData.equipment.map((item) => (
              <View key={item.id} style={styles.equipmentRow}>
                <Icon name={item.icon} size={20} color="#000000" style={styles.equipmentIcon} />
                <Text style={styles.equipmentNameText}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.isPresent ? '#7ED321' : '#FF0000' }]}>
                  <Text style={styles.statusBadgeText}>{item.isPresent ? 'Presente' : 'Ausente'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.cardDetailText}>No hay registro de equipamiento para hoy.</Text>
          )}
        </View>

        {/* Card: Evaluación Post-Jornada */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evaluación Post-Jornada</Text>
          {evaluationData ? (
            <>
              {evaluationQuestionsDisplay.map((q) => (
                <View key={q.key} style={styles.evaluationRow}>
                  <Text style={styles.evaluationQuestion}>{q.text}:</Text>
                  <Text style={styles.evaluationAnswer}>
                    {ratingLabels[(evaluationData as any)[q.key]] || 'N/A'}
                  </Text>
                </View>
              ))}
              <Text style={styles.evaluationCommentsTitle}>Comentarios del Trabajador:</Text>
              <Text style={styles.evaluationCommentsText}>{evaluationData.workerComments || 'Sin comentarios.'}</Text>
              <Text style={styles.evaluationCommentsTitle}>Comentarios del Auxiliar:</Text>
              <Text style={styles.evaluationCommentsText}>{evaluationData.additionalComments || 'Sin comentarios.'}</Text>
            </>
          ) : (
            <Text style={styles.cardDetailText}>No hay evaluación post-jornada para hoy.</Text>
          )}
        </View>

        {/* Path History Card (Simulated Map View) - Mantener como placeholder si no hay mapa real */}
        {workerData.location && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historial de Ubicación</Text>
            <View style={styles.mapViewPlaceholder}>
              <Text style={styles.mapPlaceholderText}>Mapa de Ubicación</Text>
              <Text style={styles.mapPlaceholderText}>Lat: {workerData.location.latitude?.toFixed(4)}, Long: {workerData.location.longitude?.toFixed(4)}</Text>
            </View>
            <Text style={styles.mapUpdateTime}>Última actualización: {formatFirebaseTimestampToTime(workerData.lastLocationUpdate)}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollViewContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileAvatar: {
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  profileId: {
    fontSize: 14,
    color: '#666666',
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDetailText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceIcon: {
    marginRight: 10,
  },
  attendanceTypeText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  attendanceTimeText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentNameText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    marginLeft: 10,
  },
  evaluationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  evaluationQuestion: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  evaluationAnswer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  evaluationCommentsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    marginBottom: 5,
  },
  evaluationCommentsText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
  },
  mapViewPlaceholder: {
    backgroundColor: '#E0E0E0',
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666666',
  },
  mapUpdateTime: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
});

export default ResumenTrabajadorScreen;