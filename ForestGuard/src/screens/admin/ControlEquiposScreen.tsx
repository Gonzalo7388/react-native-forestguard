import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Linking, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

const db = getFirestore(app);

// Define la interfaz para los datos del usuario tal como los recibes de Firestore
interface EquipoUser {
  // NO incluyas 'id' aquí si ya existe en doc.data() Y vas a añadir doc.id
  // Si tus documentos de Firestore ya tienen un campo 'id', y es el mismo que doc.id,
  // entonces simplemente puedes excluirlo aquí si confías en doc.id como la fuente.
  // Sin embargo, si 'id' en doc.data() es diferente, entonces la lógica sería distinta.
  // Para este error, asumimos que id: doc.id es el que queremos usar.

  name: string;
  email: string;
  avatarUrl?: string;
  estado?: string;
  phone?: string;
  proyectos?: { [projectId: string]: string };
  location?: {
    latitude: number;
    longitude: number;
  };
  lastLocationUpdate?: any;
}


const ControlEquiposScreen = () => {
  const { currentProject } = useAuth();
  // El tipo para el estado 'usuarios' debe incluir el 'id' del documento
  // por lo que definimos un tipo temporal aquí, o extendemos EquipoUser si EquipoUser no tuviera id
  type UserWithDocId = EquipoUser & { id: string };
  const [usuarios, setUsuarios] = useState<UserWithDocId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'usuarios'));
      const snapshot = await getDocs(q);

      // SOLUCIÓN AL ERROR:
      // Obtén los datos del documento y elimina la propiedad 'id' si existe,
      // luego añade el 'id' del documento de Firestore.
      const data: UserWithDocId[] = snapshot.docs
        .map(doc => {
            const docData = doc.data() as EquipoUser; // Casteamos los datos del documento
            // Si tu documento de Firestore ya contiene un campo 'id', puedes eliminarlo
            // para evitar la colisión con doc.id.
            // const { id: _, ...restOfData } = docData; // Desestructurar para omitir 'id' si existe en doc.data()
                                                      // (Comentar si estás seguro de que 'id' no está en doc.data())
            return {
                id: doc.id, // Aquí estamos usando el ID del documento de Firebase como la fuente principal del ID
                ...docData // Usamos el resto de los datos del documento
            };
        })
        .filter(user => user.proyectos && currentProject?.id && user.proyectos[currentProject.id]);
      
      setUsuarios(data);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      Alert.alert('Error', 'No se pudieron obtener los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [currentProject]);

  const handleCall = (phone: string | undefined) => {
    if (!phone) {
      Alert.alert('Sin número', 'Este usuario no tiene número de teléfono registrado.');
      return;
    }
    Linking.canOpenURL(`tel:${phone}`).then(supported => {
        if (supported) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert('Error', 'No se puede realizar la llamada desde este dispositivo.');
        }
    }).catch(err => console.error('An error occurred', err));
  };

  const filteredUsuarios = usuarios.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Especifica el tipo de 'item' como 'UserWithDocId'
  const renderItem = ({ item }: { item: UserWithDocId }) => {
    const userPhone = item.phone;
    const userRole = item.proyectos?.[currentProject?.id || '']; 

    return (
      <View style={styles.workerCard}>
        <View style={styles.avatarPlaceholder}>
          <Icon name="account" size={30} color="#000" />
        </View>
        <View style={styles.workerDetails}>
          <Text style={styles.workerName}>{item.name}</Text>
          {userRole && <Text style={styles.workerRole}>{`Rol: ${userRole}`}</Text>}
          <View style={styles.statusContainer}>
            <Icon
              name="circle"
              size={10}
              color={item.estado === 'online' ? '#7ED321' : '#000'}
              style={styles.statusDot}
            />
            <Text style={styles.workerStatus}>
              {item.estado === 'online' ? 'Online' : 'Offline'}
            </Text>
          </View>
          <View style={styles.locationContainer}>
            <Icon name="phone" size={14} color="#000" style={styles.locationIcon} />
            <Text style={styles.workerLocation}>
              {userPhone ?? 'Sin número'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => handleCall(userPhone)}
        >
          <Icon name="phone" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Icon name="magnify" size={24} color="#000" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuario..."
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredUsuarios}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
        />
      )}
    </View>
  );
};

export default ControlEquiposScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 8, marginHorizontal: 20, marginTop: 20, marginBottom: 15,
    paddingHorizontal: 10, elevation: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 40, color: '#000', fontSize: 16 },
  flatListContent: { paddingHorizontal: 20, paddingBottom: 20 },
  workerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 15, marginBottom: 15, elevation: 3,
  },
  avatarPlaceholder: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  workerDetails: { flex: 1 },
  workerName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  workerRole: { fontSize: 14, color: '#555', marginBottom: 2 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  statusDot: { marginRight: 5 },
  workerStatus: { fontSize: 14, fontWeight: 'bold' },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { marginRight: 5 },
  workerLocation: { fontSize: 14, color: '#000' },
  callButton: {
    backgroundColor: '#E0E0E0', borderRadius: 25, width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center', marginLeft: 15,
  },
});