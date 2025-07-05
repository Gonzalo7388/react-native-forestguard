import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importaciones de Firebase Firestore
import { getFirestore, collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

const db = getFirestore(app);

// --- Interfaces ---

// Interfaz para los datos del usuario tal como están en Firestore (sin el ID del documento)
interface EquipoUserData {
  name: string;
  email: string;
  avatarUrl?: string;
  estado?: string; // e.g., 'online', 'offline'
  phone?: string;
  proyectos?: { [projectId: string]: string }; // Map of projectId to role
  location?: { latitude: number; longitude: number; };
  lastLocationUpdate?: any;
}

// Tipo para el usuario que incluye el ID del documento de Firestore
type EquipoUser = EquipoUserData & { id: string };

// Interfaz para los registros de asistencia almacenados en Firestore
// COPIADO DE AsistenciaScreen para resolver 'Cannot find name AttendanceRecordData'
interface AttendanceRecordData {
  userId: string;
  projectId: string;
  checkInTime: any;
  checkOutTime?: any;
  date: string;
}

// Interfaz para un ítem de equipamiento estándar (definición)
interface StandardEquipmentItem {
  id: string;
  name: string;
  icon: string;
}

// Interfaz para un ítem de equipamiento con su estado (para el checklist del usuario)
// Cambiamos 'status' de 'Own'|'Company' a 'isPresent': boolean
interface UserEquipmentStatus extends StandardEquipmentItem {
  isPresent: boolean; // true si está presente, false si está ausente
}

// Interfaz para el registro de equipamiento en Firestore
interface EquipmentChecklistRecord {
  userId: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  equipment: UserEquipmentStatus[];
  lastUpdated: any; // Firebase Timestamp
}

// --- Definiciones de Equipamiento Estándar Obligatorio para TODOS los roles ---
const MANDATORY_EQUIPMENT: StandardEquipmentItem[] = [
  { id: 'mand1', name: 'Casco de Seguridad', icon: 'hard-hat' },
  { id: 'mand2', name: 'Guantes de Trabajo', icon: 'gloves-box' },
];

// --- Definiciones de Equipamiento Estándar por Rol (adicional al obligatorio) ---
const ROLE_SPECIFIC_EQUIPMENT_MAP: { [role: string]: StandardEquipmentItem[] } = {
  marcador: [
    { id: 'm1', name: 'GPS de Mano', icon: 'map-marker-radius' },
    { id: 'm2', name: 'Cinta Métrica', icon: 'ruler' },
    { id: 'm3', name: 'Radio de Comunicación', icon: 'radio' },
    { id: 'm4', name: 'Chaleco Reflectante', icon: 'safety-goggles' },
    { id: 'm5', name: 'Spray para Marcar Árboles', icon: 'spray-bottle' }, // Nuevo
  ],
  trazador: [
    { id: 't1', name: 'Brújula', icon: 'compass' },
    { id: 't2', name: 'Machete/Hacha', icon: 'axe' },
    { id: 't3', name: 'Botas de Seguridad', icon: 'shoe-safety' },
    { id: 't4', name: 'Kit de Primeros Auxilios', icon: 'medical-bag' },
  ],
  operador: [ // Operador de transporte
    { id: 'o1', name: 'Protección Auditiva', icon: 'ear-protection' },
    { id: 'o2', name: 'Gafas de Seguridad', icon: 'sunglasses' },
    { id: 'o3', name: 'Arnés de Seguridad', icon: 'safety-belt' },
    { id: 'o4', name: 'Herramientas Específicas', icon: 'tools' },
    { id: 'o5', name: 'Forwarder', icon: 'truck-flatbed' }, // Nuevo
  ],
  administrador: [
    { id: 'a1', name: 'Laptop/Tablet', icon: 'laptop' },
    { id: 'a2', name: 'Teléfono Satelital', icon: 'satellite-uplink' },
    { id: 'a3', name: 'Documentación de Proyecto', icon: 'file-document' },
    { id: 'a4', name: 'Radio de Comunicación', icon: 'radio' },
  ],
  talador: [
    { id: 'ta1', name: 'Motosierra', icon: 'saw' },
    { id: 'ta2', name: 'Pantalones Anti-corte', icon: 'pants-cargo' },
    { id: 'ta3', name: 'Casco con Visor', icon: 'face-mask' },
    { id: 'ta4', name: 'Botas Anti-corte', icon: 'shoe-safety' },
    { id: 'ta5', name: 'Kit de Afilado', icon: 'knife' },
    { id: 'ta6', name: 'Harvester (Opcional)', icon: 'robot-industrial' }, // Nuevo
  ],
};

// --- Componente ControlEquipamientoScreen ---
const ControlEquipamientoScreen = () => {
  const { currentProject } = useAuth();
  const [workers, setWorkers] = useState<EquipoUser[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingEquipmentChecklists, setLoadingEquipmentChecklists] = useState(true);

  // Mapa de estado de asistencia: userId -> 'checkedIn' | 'checkedOut' | 'none'
  const [attendanceStatusMap, setAttendanceStatusMap] = useState<{[userId: string]: 'checkedIn' | 'checkedOut' | 'none'}>({});
  // Mapa para el checklist de equipamiento de cada trabajador: userId -> UserEquipmentStatus[]
  const [workerEquipmentChecklists, setWorkerEquipmentChecklists] = useState<{[userId: string]: UserEquipmentStatus[]}>({});

  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null); // Para expandir/colapsar checklists
  const [currentDateForFirestore, setCurrentDateForFirestore] = useState('');

  // --- Funciones de Utilidad ---
  const formatDateForFirestore = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Efectos de Carga de Datos ---

  // 1. Efecto para obtener la fecha actual
  useEffect(() => {
    setCurrentDateForFirestore(formatDateForFirestore(new Date()));
  }, []);

  // 2. Efecto para obtener la lista de trabajadores del proyecto actual
  useEffect(() => {
    const fetchWorkers = async () => {
      if (!currentProject?.id) {
        setLoadingWorkers(false);
        setWorkers([]);
        return;
      }
      try {
        setLoadingWorkers(true);
        const q = query(collection(db, 'usuarios'));
        const snapshot = await getDocs(q);
        const data: EquipoUser[] = snapshot.docs
          .map(doc => {
            const userData = doc.data() as EquipoUserData;
            return { id: doc.id, ...userData };
          })
          .filter(user => user.proyectos && user.proyectos[currentProject.id]);
        setWorkers(data);
      } catch (error) {
        console.error('Error al obtener trabajadores:', error);
        Alert.alert('Error', 'No se pudieron cargar los trabajadores.');
      } finally {
        setLoadingWorkers(false);
      }
    };
    fetchWorkers();
  }, [currentProject?.id]);

  // 3. Efecto para obtener la asistencia y los checklists de equipamiento del día
  useEffect(() => {
    const fetchAttendanceAndEquipment = async () => {
      if (!currentProject?.id || !currentDateForFirestore || workers.length === 0) {
        setLoadingAttendance(false);
        setLoadingEquipmentChecklists(false);
        return;
      }

      setLoadingAttendance(true);
      setLoadingEquipmentChecklists(true);

      const newAttendanceStatusMap: {[userId: string]: 'checkedIn' | 'checkedOut' | 'none'} = {};
      const newWorkerEquipmentChecklists: {[userId: string]: UserEquipmentStatus[]} = {};

      // Inicializar estados por defecto
      workers.forEach(worker => {
        newAttendanceStatusMap[worker.id] = 'none';

        const workerRole = worker.proyectos?.[currentProject.id];
        // Combinar equipamiento obligatorio con el específico del rol
        const roleSpecific = ROLE_SPECIFIC_EQUIPMENT_MAP[workerRole || ''] || [];
        const combinedEquipment = [...MANDATORY_EQUIPMENT, ...roleSpecific];

        // Asegurarse de que no haya duplicados si un ítem obligatorio ya está en el específico del rol
        const uniqueEquipment = Array.from(new Map(combinedEquipment.map(item => [item.id, item])).values());
        
        newWorkerEquipmentChecklists[worker.id] = uniqueEquipment.map(item => ({ ...item, isPresent: false })); // Default to false (ausente)
      });

      try {
        // Cargar registros de asistencia
        const attendanceQuery = query(
          collection(db, 'asistencia'),
          where('projectId', '==', currentProject.id),
          where('date', '==', currentDateForFirestore)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);

        attendanceSnapshot.docs.forEach(docSnap => {
          const record = docSnap.data() as AttendanceRecordData;
          if (record.userId) {
            if (!record.checkOutTime) {
              newAttendanceStatusMap[record.userId] = 'checkedIn';
            } else {
              newAttendanceStatusMap[record.userId] = 'checkedOut';
            }
          }
        });
        setAttendanceStatusMap(newAttendanceStatusMap);
        setLoadingAttendance(false);

        // Cargar registros de equipamiento
        const equipmentQuery = query(
          collection(db, 'equipamiento_registros'),
          where('projectId', '==', currentProject.id),
          where('date', '==', currentDateForFirestore)
        );
        const equipmentSnapshot = await getDocs(equipmentQuery);

        equipmentSnapshot.docs.forEach(docSnap => {
          const record = docSnap.data() as EquipmentChecklistRecord;
          if (record.userId && record.equipment) {
            // Merge con el equipamiento por defecto para añadir nuevos ítems si se actualizan las definiciones de rol
            const currentWorkerDefaultEquipment = newWorkerEquipmentChecklists[record.userId] || [];
            const mergedEquipmentMap = new Map(currentWorkerDefaultEquipment.map(item => [item.id, item]));
            record.equipment.forEach(item => mergedEquipmentMap.set(item.id, item));
            newWorkerEquipmentChecklists[record.userId] = Array.from(mergedEquipmentMap.values());
          }
        });
        setWorkerEquipmentChecklists(newWorkerEquipmentChecklists);
        setLoadingEquipmentChecklists(false);

      } catch (error) {
        console.error('Error al obtener asistencia o equipamiento:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos de asistencia o equipamiento.');
        setLoadingAttendance(false);
        setLoadingEquipmentChecklists(false);
      }
    };

    if (workers.length > 0 && currentProject?.id && currentDateForFirestore) {
      fetchAttendanceAndEquipment();
    }
  }, [workers, currentProject?.id, currentDateForFirestore]);


  // --- Lógica de Interacción ---

  // Función para alternar el estado (isPresent) de un ítem de equipamiento
  const toggleEquipmentPresentStatus = useCallback((workerId: string, equipmentItemId: string) => {
    setWorkerEquipmentChecklists(prevChecklists => {
      const currentChecklist = prevChecklists[workerId] || [];
      const updatedChecklist = currentChecklist.map(item =>
        item.id === equipmentItemId
          ? { ...item, isPresent: !item.isPresent } // Cambia el estado de presente/ausente
          : item
      );
      // Para asegurar que TypeScript infiera correctamente el tipo de retorno:
      return {
        ...prevChecklists,
        [workerId]: updatedChecklist,
      } as { [userId: string]: UserEquipmentStatus[] }; // Casteo explícito aquí
    });
  }, []);

  // Función para guardar el checklist de equipamiento de un trabajador
  const handleConfirmChecklist = async (workerId: string) => {
    if (!currentProject?.id || !currentDateForFirestore) {
      Alert.alert('Error', 'Información del proyecto o fecha no disponible. No se pudo guardar.');
      return;
    }
    const currentChecklist = workerEquipmentChecklists[workerId];
    if (!currentChecklist || currentChecklist.length === 0) {
      Alert.alert('Error', 'No hay equipamiento para guardar para este trabajador.');
      return;
    }

    try {
      // El ID del documento de equipamiento será una combinación de userId, projectId y date
      const docId = `${workerId}_${currentProject.id}_${currentDateForFirestore}`;
      const docRef = doc(db, 'equipamiento_registros', docId);

      const record: EquipmentChecklistRecord = {
        userId: workerId,
        projectId: currentProject.id,
        date: currentDateForFirestore,
        equipment: currentChecklist,
        lastUpdated: serverTimestamp(),
      };

      await setDoc(docRef, record, { merge: true }); // Usa setDoc con merge para crear o actualizar
      Alert.alert('Éxito', `Checklist de equipamiento guardado para ${workers.find(w => w.id === workerId)?.name}.`);
    } catch (error) {
      console.error('Error al guardar checklist de equipamiento:', error);
      Alert.alert('Error', 'No se pudo guardar el checklist de equipamiento.');
    }
  };

  // --- Renderizado de Items ---

  const renderEquipmentItem = (item: UserEquipmentStatus, workerId: string, isChecklistEditable: boolean) => (
    <View style={styles.equipmentCard} key={item.id}>
      <View style={styles.equipmentInfo}>
        <Icon name={item.icon} size={24} color="#000000" style={styles.equipmentIcon} />
        <Text style={styles.equipmentName}>{item.name}</Text>
      </View>
      <TouchableOpacity
        onPress={() => toggleEquipmentPresentStatus(workerId, item.id)} // Llama a la nueva función
        style={[styles.checkboxContainer, !isChecklistEditable && styles.checkboxDisabled]}
        disabled={!isChecklistEditable}
      >
        <Icon
          name={item.isPresent ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={item.isPresent ? '#7ED321' : '#666666'}
        />
      </TouchableOpacity>
    </View>
  );

  const renderWorkerCard = ({ item: worker }: { item: EquipoUser }) => {
    const workerRole = worker.proyectos?.[currentProject?.id || ''] || 'Sin rol';
    const attendanceStatus = attendanceStatusMap[worker.id] || 'none';
    const isChecklistEditable = attendanceStatus === 'checkedIn'; // Solo editable si la asistencia está abierta

    // Obtener el checklist del trabajador, o el estándar si no hay uno guardado
    const workerChecklist = workerEquipmentChecklists[worker.id] || [];

    return (
      <View style={styles.workerContainer}>
        {/* Encabezado del trabajador */}
        <TouchableOpacity
          style={styles.workerHeader}
          onPress={() => setExpandedWorkerId(expandedWorkerId === worker.id ? null : worker.id)}
        >
          <Icon name="account-circle-outline" size={30} color="#000" style={{ marginRight: 10 }} />
          <View style={styles.workerHeaderTextContent}>
            <Text style={styles.workerNameText}>{worker.name}</Text>
            <Text style={styles.workerRoleText}>{`Rol: ${workerRole}`}</Text>
            <Text style={[
                styles.workerAttendanceStatus,
                attendanceStatus === 'checkedIn' ? styles.attendanceOpen : styles.attendanceClosed
            ]}>
                {attendanceStatus === 'checkedIn' ? 'Asistencia Abierta' : 'Asistencia Cerrada'}
            </Text>
          </View>
          <Icon
            name={expandedWorkerId === worker.id ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#000"
          />
        </TouchableOpacity>

        {/* Sección de Equipamiento (colapsable) */}
        {expandedWorkerId === worker.id && (
          <View style={styles.equipmentSection}>
            <Text style={styles.equipmentSectionTitle}>Equipamiento ({workerRole})</Text>
            {workerChecklist.length > 0 ? (
              workerChecklist.map(eqItem => renderEquipmentItem(eqItem, worker.id, isChecklistEditable))
            ) : (
              <Text style={styles.noEquipmentText}>No hay equipamiento definido para este rol.</Text>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButtonWorker,
                !isChecklistEditable && styles.confirmButtonWorkerDisabled
              ]}
              onPress={() => handleConfirmChecklist(worker.id)}
              disabled={!isChecklistEditable}
            >
              <Text style={styles.confirmButtonWorkerText}>Guardar Checklist</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const isLoading = loadingWorkers || loadingAttendance || loadingEquipmentChecklists;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Control de Equipamiento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
        ) : workers.length === 0 ? (
          <Text style={styles.noWorkersText}>No hay trabajadores asignados a este proyecto.</Text>
        ) : (
          <FlatList
            data={workers}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkerCard}
            scrollEnabled={false} // Permitir que el ScrollView padre maneje el scroll
            contentContainerStyle={styles.workerListFlatList}
          />
        )}
      </ScrollView>
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
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 20,
  },
  noWorkersText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
  },
  workerListFlatList: {
    // Estilos para el contenedor de la FlatList
  },
  workerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  workerHeaderTextContent: {
    flex: 1,
    marginLeft: 5,
  },
  workerNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  workerRoleText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  workerAttendanceStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 5,
  },
  attendanceOpen: {
    color: '#7ED321', // Verde para asistencia abierta
  },
  attendanceClosed: {
    color: '#FF0000', // Rojo para asistencia cerrada
  },
  equipmentSection: {
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  equipmentSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  noEquipmentText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 10,
  },
  equipmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  equipmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipmentIcon: {
    marginRight: 10,
  },
  equipmentName: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  checkboxContainer: {
    padding: 5, // Aumenta el área táctil del checkbox
  },
  checkboxDisabled: {
    opacity: 0.4, // Reduce la opacidad cuando está deshabilitado
  },
  confirmButtonWorker: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  confirmButtonWorkerDisabled: {
    backgroundColor: '#E0E0E0',
  },
  confirmButtonWorkerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ControlEquipamientoScreen;