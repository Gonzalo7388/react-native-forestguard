import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Para iconos como el micrófono y la cámara
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'; // Para iconos de animales
import { useNavigation } from '@react-navigation/native'; // Hook para la navegación
import Header from '../../components/Header'; // Assuming Header component exists

// Definición de tipos para las alertas
interface Alert {
  id: string;
  type: string;
  location: string;
  timestamp: string;
  description: string;
  resolved: boolean;
}

const RecibirAlertasScreen = () => {
  const navigation = useNavigation();

  // Estado para las alertas recibidas
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'Emergencia',
      location: 'Sector B-12',
      timestamp: '2025-06-14 10:30 AM',
      description: 'Trabajador caído cerca del río. Se requiere asistencia médica urgente.',
      resolved: false,
    },
    {
      id: '2',
      type: 'Incidente',
      location: 'Sector C-05',
      timestamp: '2025-06-14 09:15 AM',
      description: 'Pequeño incendio forestal reportado. Se están tomando medidas iniciales.',
      resolved: false,
    },
    {
      id: '3',
      type: 'Animal Salvaje',
      location: 'Sector A-01',
      timestamp: '2025-06-14 08:00 AM',
      description: 'Avistamiento de puma. Se recomienda precaución en la zona.',
      resolved: true,
    },
    {
      id: '4',
      type: 'Alerta de Incendio',
      location: 'Sector B-12',
      timestamp: '2025-06-14 07:45 AM',
      description: 'Detección de humo en el área. Enviando equipo de verificación.',
      resolved: false,
    },
  ]);

  // Estado para controlar la visibilidad del modal de detalles de la alerta
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Función para manejar la acción de resolver una alerta
  const handleResolveAlert = (id: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === id ? { ...alert, resolved: !alert.resolved } : alert
      )
    );
    // Actualizar el estado de la alerta seleccionada en el modal si está abierta
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert((prev) => prev ? { ...prev, resolved: !prev.resolved } : null);
    }
  };

  // Función para abrir el modal con los detalles de la alerta
  const openAlertDetails = (alert: Alert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  // Función para cerrar el modal
  const closeAlertDetails = () => {
    setModalVisible(false);
    setSelectedAlert(null);
  };

  // Renderiza un ítem de alerta
  const renderAlertItem = (alert: Alert) => (
    <TouchableOpacity
      key={alert.id}
      style={[styles.alertCard, alert.resolved ? styles.alertResolved : styles.alertUnresolved]}
      onPress={() => openAlertDetails(alert)}
    >
      <View style={styles.alertHeader}>
        
        {/* Icons are kept with their original colors for visual distinction of alert types */}
        {alert.type === 'Emergencia' && <Icon name="alert-outline" size={24} color="#FF6347" />}
        {alert.type === 'Incidente' && <Icon name="ambulance" size={24} color="#FFA500" />}
        {alert.type === 'Animal Salvaje' && <FontAwesome5 name="paw" size={20} color="#000000" />}
        {alert.type === 'Alerta de Incendio' && <Icon name="fire" size={24} color="#DC143C" />}
        <Text style={styles.alertType}>{alert.type}</Text>
      </View>
      <Text style={styles.alertLocation}>Ubicación: {alert.location}</Text>
      <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
      <Text style={styles.alertDescription} numberOfLines={2}>{alert.description}</Text>
      <View style={styles.alertStatusContainer}>
        <Text style={[styles.alertStatusText, alert.resolved ? styles.statusResolved : styles.statusUnresolved]}>
          {alert.resolved ? 'Resuelta' : 'Pendiente'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
            <Header title="Alertas" />

      {/* El header anterior y el simulado han sido eliminados */}

      <View style={styles.locationContainer}>
        <Icon name="map-marker" size={20} color="#000000" />
        <Text style={styles.currentLocationText}>Ubicación Actual</Text>
        <Text style={styles.sectorText}>Sector B-12</Text>
      </View>

      <ScrollView style={styles.alertsList}>
        <Text style={styles.sectionTitle}>Alertas Recibidas</Text> {/* Título principal */}
        {alerts.length > 0 ? (
          alerts.map(renderAlertItem)
        ) : (
          <Text style={styles.noAlertsText}>No hay alertas recientes.</Text>
        )}
      </ScrollView>

      {/* Botón de cámara flotante para videollamada */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          console.log('Iniciar videollamada');
        }}
      >
        <Icon name="video" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para detalles de la alerta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeAlertDetails}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedAlert && (
              <>
                <Text style={styles.modalTitle}>{selectedAlert.type}</Text>
                <Text style={styles.modalText}>Ubicación: {selectedAlert.location}</Text>
                <Text style={styles.modalText}>Fecha/Hora: {selectedAlert.timestamp}</Text>
                <Text style={styles.modalText}>Descripción:</Text>
                <Text style={styles.modalDescription}>{selectedAlert.description}</Text>
                <Text style={[styles.modalStatus, selectedAlert.resolved ? styles.statusResolved : styles.statusUnresolved]}>
                  Estado: {selectedAlert.resolved ? 'Resuelta' : 'Pendiente'}
                </Text>

                <Pressable
                  style={[styles.button, selectedAlert.resolved ? styles.buttonUnresolve : styles.buttonResolve]}
                  onPress={() => handleResolveAlert(selectedAlert.id)}
                >
                  <Text style={styles.textStyle}>
                    {selectedAlert.resolved ? 'Marcar como Pendiente' : 'Marcar como Resuelta'}
                  </Text>
                </Pressable>
              </>
            )}
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={closeAlertDetails}
            >
              <Text style={styles.textStyle}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fondo blanco
  },
  // Header styles removed as per request
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF', // Fondo blanco
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 20, // Adjusted margin top after removing the header
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light grey border
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000', // Texto negro
    marginLeft: 5,
  },
  sectorText: {
    fontSize: 16,
    color: '#000000', // Texto negro
    marginLeft: 'auto',
    fontWeight: 'bold',
  },
  alertsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000', // Texto negro
    marginBottom: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFFFFF', // Fondo blanco
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertResolved: {
    borderColor: '#7ED321', // Verde limón para resueltas
    borderWidth: 1,
  },
  alertUnresolved: {
    borderColor: '#000000', // Negro para pendientes
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000000', // Texto negro
  },
  alertLocation: {
    fontSize: 14,
    color: '#333333', // Gris oscuro para la ubicación
    marginBottom: 4,
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#333333', // Gris oscuro para la fecha/hora
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#333333', // Gris oscuro para la descripción
  },
  alertStatusContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  alertStatusText: {
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  statusResolved: {
    color: '#FFFFFF', // Texto blanco
    backgroundColor: '#7ED321', // Fondo verde limón
  },
  statusUnresolved: {
    color: '#FFFFFF', // Texto blanco
    backgroundColor: '#000000', // Fondo negro
  },
  noAlertsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#333333', // Gris oscuro
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#7ED321', // Verde limón
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo semitransparente
  },
  modalView: {
    margin: 20,
    backgroundColor: '#FFFFFF', // Fondo blanco
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000000', // Texto negro
  },
  modalText: {
    marginBottom: 10,
    fontSize: 16,
    color: '#333333', // Gris oscuro
  },
  modalDescription: {
    fontSize: 15,
    color: '#333333', // Gris oscuro
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    borderRadius: 20,
    padding: 12,
    elevation: 2,
    marginTop: 10,
    minWidth: 150,
  },
  buttonResolve: {
    backgroundColor: '#7ED321', // Verde limón
  },
  buttonUnresolve: {
    backgroundColor: '#000000', // Negro
  },
  buttonClose: {
    backgroundColor: '#000000', // Negro
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RecibirAlertasScreen;
