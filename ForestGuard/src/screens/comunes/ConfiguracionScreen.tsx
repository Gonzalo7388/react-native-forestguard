import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Para iconos
import { SafeAreaView } from 'react-native-safe-area-context'; // Para manejar el área segura

const ConfiguracionScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English'); // Estado para el idioma

  // Datos simulados del usuario
  const currentUser = {
    name: 'Sarah Parker',
    role: 'Forest Ranger',
  };

  const handleGoBack = () => {
    navigation.goBack(); // Navega a la pantalla anterior
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(previousState => !previousState);
  };

  const toggleDarkMode = () => {
    setDarkModeEnabled(previousState => !previousState);
    // Aquí puedes implementar la lógica para cambiar el tema de tu aplicación
    console.log('Modo oscuro:', !darkModeEnabled ? 'activado' : 'desactivado');
  };

  const handleLanguageSelect = () => {
    console.log('Seleccionar idioma');
    // En una aplicación real, esto abriría un modal o una nueva pantalla para seleccionar el idioma
  };

  const handleHelpAndSupport = () => {
    console.log('Ayuda y soporte');
    // Navegar a una pantalla de ayuda o abrir un enlace de soporte
  };

  const handleSendFeedback = () => {
    console.log('Enviar comentarios');
    // Abrir un formulario de comentarios o un cliente de correo
  };

  const handleLogout = () => {
    console.log('Cerrar sesión');
    // Implementar la lógica de cierre de sesión (limpiar tokens, navegar a la pantalla de inicio de sesión)
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholderRight} /> {/* Placeholder para alinear el título */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Sección de Perfil */}
        <TouchableOpacity style={styles.profileCard}>
          <Icon name="account-circle-outline" size={50} color="#000000" style={styles.profileAvatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser.name}</Text>
            <Text style={styles.profileRole}>{currentUser.role}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#000000" />
        </TouchableOpacity>

        {/* Preferencias de la Aplicación */}
        <Text style={styles.sectionHeading}>App Preferences</Text>
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageSelect}>
            <Icon name="web" size={24} color="#000000" style={styles.settingIcon} />
            <Text style={styles.settingText}>Language</Text>
            <Text style={styles.settingValue}>{selectedLanguage}</Text>
            <Icon name="chevron-right" size={20} color="#000000" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Icon name="bell-outline" size={24} color="#000000" style={styles.settingIcon} />
            <Text style={styles.settingText}>Notifications</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#7ED321" }} // Gris claro para inactivo, verde limón para activo
              thumbColor={notificationsEnabled ? "#FFFFFF" : "#FFFFFF"} // Pulgar blanco
              ios_backgroundColor="#E0E0E0"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <Icon name="weather-night" size={24} color="#000000" style={styles.settingIcon} />
            <Text style={styles.settingText}>Dark Mode</Text>
            <Switch
              trackColor={{ false: "#E0E0E0", true: "#7ED321" }} // Gris claro para inactivo, verde limón para activo
              thumbColor={darkModeEnabled ? "#FFFFFF" : "#FFFFFF"} // Pulgar blanco
              ios_backgroundColor="#E0E0E0"
              onValueChange={toggleDarkMode}
              value={darkModeEnabled}
            />
          </View>
        </View>

        {/* Soporte */}
        <Text style={styles.sectionHeading}>Support</Text>
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingItem} onPress={handleHelpAndSupport}>
            <Icon name="help-circle-outline" size={24} color="#000000" style={styles.settingIcon} />
            <Text style={styles.settingText}>Help & Support</Text>
            <Icon name="chevron-right" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSendFeedback}>
            <Icon name="comment-text-outline" size={24} color="#000000" style={styles.settingIcon} />
            <Text style={styles.settingText}>Send Feedback</Text>
            <Icon name="chevron-right" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Acerca de */}
        <Text style={styles.sectionHeading}>About</Text>
        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <Icon name="information-outline" size={24} color="#000000" style={styles.settingIcon} />
            <Text style={styles.settingText}>App Version</Text>
            <Text style={styles.settingValue}>v2.1.0</Text>
          </View>
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FFFFFF" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        {/* Información de Versión del Pie de Página */}
        <Text style={styles.footerVersion}>ForestGuard v2.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Fondo gris claro
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF', // Fondo blanco del encabezado
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000', // Texto negro
  },
  placeholderRight: {
    width: 28, // Para igualar el ancho del icono de retroceso y centrar el título
  },
  scrollViewContent: {
    padding: 20,
  },
  profileCard: {
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
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Texto negro
  },
  profileRole: {
    fontSize: 14,
    color: '#666666', // Texto gris oscuro
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000', // Texto negro
    marginBottom: 10,
    marginTop: 10,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Línea divisoria gris claro
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Línea divisoria gris claro
  },
  // Eliminar el último borde inferior del último elemento de la sección
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  // Pseudo-clase para eliminar el borde inferior del último elemento
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#000000', // Texto negro
  },
  settingValue: {
    fontSize: 16,
    color: '#666666', // Texto gris oscuro para valores
    marginRight: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000', // Botón negro
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF', // Texto blanco
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerVersion: {
    fontSize: 12,
    color: '#666666', // Texto gris oscuro
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ConfiguracionScreen;
