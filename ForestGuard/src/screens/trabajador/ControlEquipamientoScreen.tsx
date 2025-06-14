import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons like helmet, gloves, boots, glasses, ear, checkbox
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView

const ControlEquipamientoScreen = () => {
  // State to manage equipment list and their status (simulated 'Own' or 'Company')
  const [equipmentList, setEquipmentList] = useState([
    { id: '1', name: 'Safety Helmet', icon: 'hard-hat', status: 'Own' },
    { id: '2', name: 'Work Gloves', icon: 'gloves-box', status: 'Own' },
    { id: '3', name: 'Safety Boots', icon: 'shoe-safety', status: 'Own' },
    { id: '4', name: 'Safety Glasses', icon: 'sunglasses', status: 'Own' },
    { id: '5', name: 'Ear Protection', icon: 'ear-protection', status: 'Own' },
  ]);

  const [isConfirmed, setIsConfirmed] = useState(false); // State for the confirmation checkbox

  // Function to toggle equipment status (simulated dropdown)
  const toggleStatus = (id: string) => {
    setEquipmentList((prevList) =>
      prevList.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Own' ? 'Company' : 'Own' }
          : item
      )
    );
  };

  // Function to handle confirmation button press
  const handleConfirmStatus = () => {
    if (isConfirmed) {
      console.log('Equipment status confirmed!');
      // In a real app, you would send this data to a backend
      // and potentially navigate away or show a success message.
    } else {
      console.log('Please confirm equipment information.');
      // Show an alert or a modal asking the user to confirm
    }
  };

  const renderEquipmentItem = (item: any) => (
    <View style={styles.equipmentCard} key={item.id}>
      <View style={styles.equipmentInfo}>
        <Icon name={item.icon} size={24} color="#000000" style={styles.equipmentIcon} />
        <Text style={styles.equipmentName}>{item.name}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleStatus(item.id)} style={styles.statusDropdown}>
        <Text style={styles.statusText}>{item.status}</Text>
        <Icon name="chevron-down" size={20} color="#000000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}> {/* Wrapped the main View with SafeAreaView */}
      {/* Header */}
      <View style={styles.header}>
        <Icon name="arrow-left" size={24} color="#000000" />
        <Text style={styles.headerTitle}>Equipment Checklist</Text>
        <Icon name="dots-vertical" size={24} color="#000000" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.instructionText}>
          Please review and confirm your equipment status
        </Text>

        {/* Render each equipment item */}
        {equipmentList.map(renderEquipmentItem)}

        {/* Confirmation Checkbox */}
        <TouchableOpacity style={styles.confirmCheckboxContainer} onPress={() => setIsConfirmed(!isConfirmed)}>
          <Icon
            name={isConfirmed ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={isConfirmed ? '#7ED321' : '#000000'} // Lime green when checked, black when unchecked
          />
          <Text style={styles.confirmCheckboxText}>
            I confirm that all equipment information provided is accurate
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmButton, !isConfirmed && styles.confirmButtonDisabled]}
        onPress={handleConfirmStatus}
        disabled={!isConfirmed}
      >
        <Text style={styles.confirmButtonText}>Confirm Equipment Status</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light grey background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF', // White header background
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black title
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100, // Add padding at the bottom for the fixed button
  },
  instructionText: {
    fontSize: 16,
    color: '#666666', // Dark grey text
    marginBottom: 20,
    textAlign: 'center', // Center the text as in mockup
  },
  equipmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White card background
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  equipmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  equipmentIcon: {
    marginRight: 15,
  },
  equipmentName: {
    fontSize: 16,
    color: '#000000', // Black text
    fontWeight: 'bold',
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0', // Light grey background for dropdown
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#000000', // Black text
    marginRight: 5,
  },
  confirmCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30, // Space before button
  },
  confirmCheckboxText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#000000', // Black text
    flex: 1, // Allow text to wrap
  },
  confirmButton: {
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000', // Black button
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 0, // Make corners sharp
    borderTopRightRadius: 0, // Make corners sharp
    borderRadius: 0, // Ensure no border radius at bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, // Shadow at the top
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#E0E0E0', // Light grey when disabled
  },
  confirmButtonText: {
    color: '#FFFFFF', // White text for button
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ControlEquipamientoScreen;
