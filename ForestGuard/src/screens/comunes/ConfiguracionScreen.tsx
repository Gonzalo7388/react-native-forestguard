import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Alert, TextInput, Button
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { useAuth0 } from 'react-native-auth0';

// Importaciones de Firebase Firestore
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../../config/firebase'; // Asegúrate de que esta ruta sea correcta para tu configuración de Firebase

export default function ConfiguracionScreen() {
  const context = useContext(AuthContext);
  const { clearSession } = useAuth0();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [name, setName] = useState(context?.user?.name ?? '');
  const [phone, setPhone] = useState(context?.user?.phone ?? ''); // Inicializa con el valor existente si lo hay

  // Inicializa Firestore
  const db = getFirestore(app);

  if (!context) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Cargando configuración...</Text>
      </View>
    );
  }

  const { user, currentProject, setIsAuthenticated, setUser } = context;

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const toggleDarkMode = () => {
    setDarkModeEnabled(prev => !prev);
    console.log('Modo oscuro:', !darkModeEnabled ? 'activado' : 'desactivado');
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSession();
            setIsAuthenticated(false);
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
          }
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
        Alert.alert('Error', 'No se pudo obtener el ID de usuario para actualizar el perfil.');
        return;
    }
    
    try {
      // 1. Actualizar en Firestore
      const userDocRef = doc(db, 'usuarios', user.id);
      await updateDoc(userDocRef, {
        name: name,
        phone: phone, // Asegúrate de que el campo en Firestore sea 'phone' o el que uses.
      });

      // 2. Actualizar el estado local del usuario en el contexto
      setUser({
        ...user,
        name,
        phone,
      });

      Alert.alert('Perfil actualizado', 'Tu información ha sido actualizada correctamente.');
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error al actualizar perfil en Firestore:', error);
      Alert.alert('Error', 'No se pudo actualizar la información en la base de datos.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Perfil */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => setShowEditProfile(prev => !prev)}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.profileAvatarImg} />
          ) : (
            <Icon name="account-circle-outline" size={60} color="#000" />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Sin nombre'}</Text>
            <Text style={styles.profileRole}>
              {currentProject ? `Rol: ${user?.proyectos?.[currentProject.id] ?? 'Sin rol'}` : 'Sin proyecto activo'}
            </Text>
          </View>
          <Icon name={showEditProfile ? "chevron-up" : "chevron-down"} size={24} color="#000" />
        </TouchableOpacity>

        {showEditProfile && (
          <View style={styles.editContainer}>
            <TextInput
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Celular"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <Button title="Guardar cambios" onPress={handleSaveProfile} />
            <Button title="Cancelar" onPress={() => setShowEditProfile(false)} color="red" />
          </View>
        )}

        {/* Proyectos */}
        <Text style={styles.sectionHeading}>Mis Proyectos</Text>
        <View style={styles.settingsSection}>
          {user?.proyectos ? (
            Object.entries(user.proyectos ?? {}).map(([projectId, role], index) => (
              <View
                key={projectId}
                style={[
                  styles.settingItem,
                  index === Object.keys(user.proyectos ?? {}).length - 1 && styles.lastSettingItem
                ]}
              >
                <Icon name="folder-outline" size={24} color="#000" style={styles.settingIcon} />
                <Text style={styles.settingText}>{projectId}</Text>
                <Text style={styles.settingValue}>{role}</Text>
              </View>
            ))
          ) : (
            <Text style={{ padding: 15, color: '#666' }}>No tienes proyectos asignados.</Text>
          )}
        </View>

        {/* Preferencias */}
        <Text style={styles.sectionHeading}>Preferencias</Text>
        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <Icon name="bell-outline" size={24} color="#000" style={styles.settingIcon} />
            <Text style={styles.settingText}>Notificaciones</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#7ED321' }}
              thumbColor="#FFFFFF"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>
          <View style={styles.settingItem}>
            <Icon name="weather-night" size={24} color="#000" style={styles.settingIcon} />
            <Text style={styles.settingText}>Modo Oscuro</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#7ED321' }}
              thumbColor="#FFFFFF"
              onValueChange={toggleDarkMode}
              value={darkModeEnabled}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.footerVersion}>ForestGuard v2.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 15, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  scrollViewContent: { padding: 15 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2,
  },
  profileAvatarImg: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  profileRole: { fontSize: 14, color: '#555' },
  sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#000', marginVertical: 10 },
  settingsSection: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 15 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  lastSettingItem: { borderBottomWidth: 0 },
  settingIcon: { marginRight: 15 },
  settingText: { flex: 1, fontSize: 16, color: '#000' },
  settingValue: { fontSize: 14, color: '#555' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000', borderRadius: 10, padding: 15, marginTop: 10,
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerVersion: { textAlign: 'center', fontSize: 12, color: '#666', marginTop: 10 },
  editContainer: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10
  }
});