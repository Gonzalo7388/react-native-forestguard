import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importaciones de Firebase Firestore
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { app } from '../../config/firebase'; 
import { useAuth } from '../../hooks/useAuth'; 

const db = getFirestore(app);

// PASO 1: Define la interfaz para los datos que *realmente están dentro* del documento de Firestore (sin el ID).
interface EquipoUserData {
  name: string;
  email: string;
  avatarUrl?: string;
  estado?: string; 
  phone?: string;
  proyectos?: { [projectId: string]: string }; 
  location?: { // Si existe en tus documentos, mantenlo
    latitude: number;
    longitude: number;
  };
  lastLocationUpdate?: any; // Si existe en tus documentos, mantenlo
}

// PASO 2: Define el tipo 'EquipoUser' que usarás en tu código, incluyendo el 'id' del documento.
type EquipoUser = EquipoUserData & { id: string };


// Interface para los registros de asistencia almacenados en Firestore
interface AttendanceRecordData { // Renombrada para los datos del documento de asistencia
  userId: string;
  projectId: string;
  checkInTime: any; 
  checkOutTime?: any; 
  date: string; 
}

// Tipo para el registro de asistencia que incluye el ID del documento
type AttendanceRecord = AttendanceRecordData & { id: string };


const AsistenciaScreen = () => {
  const { currentProject } = useAuth(); 
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateDisplay, setCurrentDateDisplay] = useState(''); 
  const [currentDateForFirestore, setCurrentDateForFirestore] = useState(''); 

  const [workers, setWorkers] = useState<EquipoUser[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const [attendanceStatusMap, setAttendanceStatusMap] = useState<{[userId: string]: 'checkedIn' | 'checkedOut' | 'none'}>({});
  const [activeAttendanceSessionIdMap, setActiveAttendanceSessionIdMap] = useState<{[userId: string]: string}>({});

  const formatDateForFirestore = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDateDisplay(now.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
      setCurrentDateForFirestore(formatDateForFirestore(now));
    }, 1000);

    return () => clearInterval(timer); 
  }, []);

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
        // CORRECCIÓN PARA EL ERROR 'id' is specified more than once
        const data: EquipoUser[] = snapshot.docs
          .map(doc => {
            const userData = doc.data() as EquipoUserData; // Castea a la interfaz que NO TIENE 'id'
            return {
              id: doc.id, // Añade el ID del documento de Firestore
              ...userData // Extiende los datos del documento (sin el 'id' duplicado)
            };
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

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!currentProject?.id || !currentDateForFirestore || workers.length === 0) {
        setLoadingAttendance(false);
        return;
      }
      try {
        setLoadingAttendance(true);
        const q = query(
          collection(db, 'asistencia'),
          where('projectId', '==', currentProject.id),
          where('date', '==', currentDateForFirestore)
        );
        const snapshot = await getDocs(q);

        const newStatusMap: {[userId: string]: 'checkedIn' | 'checkedOut' | 'none'} = {};
        const newSessionIdMap: {[userId: string]: string} = {};

        workers.forEach(worker => {
            newStatusMap[worker.id] = 'none';
        });

        snapshot.docs.forEach(doc => {
          const record = { id: doc.id, ...doc.data() } as AttendanceRecord; // Aquí también se aplica el casting con el ID
          if (record.userId) {
            if (!record.checkOutTime) { 
              newStatusMap[record.userId] = 'checkedIn';
              newSessionIdMap[record.userId] = record.id; 
            } else { 
              newStatusMap[record.userId] = 'checkedOut';
            }
          }
        });
        setAttendanceStatusMap(newStatusMap);
        setActiveAttendanceSessionIdMap(newSessionIdMap);
      } catch (error) {
        console.error('Error al obtener asistencia:', error);
        Alert.alert('Error', 'No se pudo cargar la asistencia del día.');
      } finally {
        setLoadingAttendance(false);
      }
    };

    if (workers.length > 0 && currentProject?.id && currentDateForFirestore) {
      fetchAttendance();
    }
  }, [workers, currentProject?.id, currentDateForFirestore]);


  const handleCheckIn = async (workerId: string) => {
    if (!currentProject?.id || !currentDateForFirestore) {
      Alert.alert('Error', 'Información del proyecto o fecha no disponible. Inténtalo de nuevo.');
      return;
    }
    try {
      const newRecordData: AttendanceRecordData = { // Usamos AttendanceRecordData (sin 'id')
        userId: workerId,
        projectId: currentProject.id,
        checkInTime: serverTimestamp(), 
        date: currentDateForFirestore,
        checkOutTime: null, 
      };
      const docRef = await addDoc(collection(db, 'asistencia'), newRecordData); 
      
      setAttendanceStatusMap(prev => ({ ...prev, [workerId]: 'checkedIn' }));
      setActiveAttendanceSessionIdMap(prev => ({ ...prev, [workerId]: docRef.id }));
      Alert.alert('Éxito', `Entrada marcada para ${workers.find(w => w.id === workerId)?.name}.`);
    } catch (error) {
      console.error('Error al marcar entrada:', error);
      Alert.alert('Error', 'No se pudo marcar la entrada. Intenta de nuevo.');
    }
  };

  // NUEVA FUNCIÓN: Wrapper para el manejo de la salida con confirmación
  const handleCheckOutWithConfirmation = (workerId: string) => {
    const workerName = workers.find(w => w.id === workerId)?.name || 'este trabajador';
    const checkOutTimeDisplay = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    Alert.alert(
      'Confirmar Salida',
      `¿Estás seguro de que deseas marcar la salida para ${workerName} a las ${checkOutTimeDisplay}? Una vez confirmada, no podrás reestablecerla.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => handleCheckOut(workerId), // Llama a la función original de salida si confirma
        },
      ],
      { cancelable: false }
    );
  };

  const handleCheckOut = async (workerId: string) => {
    const sessionId = activeAttendanceSessionIdMap[workerId];
    if (!sessionId) {
      Alert.alert('Error', 'No hay una entrada activa para este trabajador hoy.');
      return;
    }
    try {
      const docRef = doc(db, 'asistencia', sessionId);
      await updateDoc(docRef, {
        checkOutTime: serverTimestamp(), 
      });

      setAttendanceStatusMap(prev => ({ ...prev, [workerId]: 'checkedOut' }));
      setActiveAttendanceSessionIdMap(prev => {
        const newState = { ...prev };
        delete newState[workerId]; 
        return newState;
      });
      // Ya no mostramos un Alert aquí porque ya se mostró el de confirmación
      // Alert.alert('Éxito', `Salida marcada para ${workers.find(w => w.id === workerId)?.name}.`);
    } catch (error) {
      console.error('Error al marcar salida:', error);
      Alert.alert('Error', 'No se pudo marcar la salida. Intenta de nuevo.');
    }
  };

  const renderWorkerItem = ({ item }: { item: EquipoUser }) => {
    const status = attendanceStatusMap[item.id] || 'none';

    return (
      <View style={styles.workerListItem}>
        <View style={styles.workerInfo}>
          <Icon name="account-circle-outline" size={30} color="#000" />
          <Text style={styles.workerName}>{item.name}</Text>
        </View>
        <View style={styles.workerActions}>
          {status === 'checkedIn' ? (
            <TouchableOpacity
              style={[styles.checkButtonSmall, styles.checkOutButton]}
              // CAMBIO AQUÍ: Llamamos a la función con confirmación
              onPress={() => handleCheckOutWithConfirmation(item.id)}
            >
              <Icon name="arrow-left" size={18} color="#FFFFFF" />
              <Text style={styles.checkButtonSmallText}>Salida</Text>
            </TouchableOpacity>
          ) : status === 'checkedOut' ? (
            <View style={[styles.checkButtonSmall, styles.checkedOutTextBackground]}>
                <Text style={styles.checkedOutText}>Finalizado</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.checkButtonSmall, styles.checkInButton]}
              onPress={() => handleCheckIn(item.id)}
            >
              <Icon name="arrow-right" size={18} color="#FFFFFF" />
              <Text style={styles.checkButtonSmallText}>Entrada</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const isLoading = loadingWorkers || loadingAttendance;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Aquí puedes agregar un Icono de retroceso si lo necesitas */}
        {/* <Icon name="arrow-left" size={24} color="#000000" /> */}
        <Text style={styles.headerTitle}>Registro de Asistencia</Text>
        {/* <Icon name="dots-vertical" size={24} color="#000000" /> */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.timeDateContainer}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.dateText}>{currentDateDisplay}</Text>
        </View>

        <Text style={styles.sectionTitle}>Lista de Trabajadores</Text>
        {isLoading ? (
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
    justifyContent: 'center', // Centra el título si no hay otros iconos
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
  // headerIcons: { // Se pueden mantener si los necesitas para otros iconos
  //   flexDirection: 'row',
  // },
  // headerIcon: {
  //   marginRight: 15,
  // },
  scrollViewContent: {
    padding: 20,
  },
  timeDateContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
  },
  dateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 5,
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
  workerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  checkInButton: {
    backgroundColor: '#7ED321',
  },
  checkOutButton: {
    backgroundColor: '#FF0000',
  },
  checkButtonSmallText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  checkedOutTextBackground: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  checkedOutText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AsistenciaScreen;