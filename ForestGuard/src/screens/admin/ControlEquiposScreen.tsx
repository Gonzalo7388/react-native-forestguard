import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons like user, phone, map-marker
import Header from '../../components/Header'; // Assuming Header component exists


// Define the type for an Equipo (Equipment) object
type Equipo = {
  id: string;
  nombre: string;
  estado: 'Online' | 'Offline'; // Changed to 'Online' | 'Offline' to match mockup
  ubicacion: string; // Added location to match mockup
};

const ControlEquiposScreen = () => {
  // State to manage the list of equipment (now workers to match the mockup's context)
  const [equipos, setEquipos] = useState<Equipo[]>([
    { id: '1', nombre: 'John Cooper', estado: 'Online', ubicacion: 'Sector A-3, North Forest' },
    { id: '2', nombre: 'Sarah Martinez', estado: 'Offline', ubicacion: 'Sector B-1, East Forest' },
    { id: '3', nombre: 'Mike Johnson', estado: 'Online', ubicacion: 'Sector C-2, West Forest' },
  ]);

  // Function to handle a call action (simulated)
  const handleCall = (nombre: string) => {
    console.log(`Llamando a ${nombre}...`);
    // In a real app, this would initiate a call or video call.
  };

  // Render function for each item in the FlatList, now designed as a worker card
  const renderItem = ({ item }: { item: Equipo }) => (
    <View style={styles.workerCard}>
      {/* User avatar/icon */}
      <View style={styles.avatarPlaceholder}>
        <Icon name="account" size={30} color="#000000" />
      </View>

      {/* Worker details */}
      <View style={styles.workerDetails}>
        <Text style={styles.workerName}>{item.nombre}</Text>
        <View style={styles.statusContainer}>
          <Icon
            name="circle"
            size={10}
            color={item.estado === 'Online' ? '#7ED321' : '#000000'} // Lime green for online, black for offline
            style={styles.statusDot}
          />
          <Text
            style={[
              styles.workerStatus,
              item.estado === 'Online' ? styles.statusOnline : styles.statusOffline,
            ]}
          >
            {item.estado}
          </Text>
        </View>
        <View style={styles.locationContainer}>
          <Icon name="map-marker" size={14} color="#000000" style={styles.locationIcon} />
          <Text style={styles.workerLocation}>{item.ubicacion}</Text>
        </View>
      </View>

      {/* Call button */}
      <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item.nombre)}>
        <Icon name="phone" size={24} color="#000000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View testID='control-equipos-screen' style={styles.container}>
      <Header title="Mapa" />

      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <Icon name="magnify" size={24} color="#000000" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search workers..." // Placeholder text as in mockup
          placeholderTextColor="#666666"
        />
      </View>

      {/* List of workers/equipment */}
      <FlatList
        data={equipos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light grey background to match mockup
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for search bar
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000000', // Black text color
    fontSize: 16,
  },
  flatListContent: {
    paddingHorizontal: 20, // Add horizontal padding to the list content
    paddingBottom: 20, // Add bottom padding
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background for worker cards
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0', // Light grey for avatar background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#7ED321', // Lime green border for avatar
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black text for worker name
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusDot: {
    marginRight: 5,
  },
  workerStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusOnline: {
    color: '#7ED321', // Lime green for online status
  },
  statusOffline: {
    color: '#000000', // Black for offline status
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 5,
  },
  workerLocation: {
    fontSize: 14,
    color: '#000000', // Black text for location
  },
  callButton: {
    backgroundColor: '#E0E0E0', // Light grey background for call button
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
});

export default ControlEquiposScreen;
