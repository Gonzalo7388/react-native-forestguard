import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For various icons
import { SafeAreaView } from 'react-native-safe-area-context'; // For safe area handling

const ResumenTrabajadorScreen = () => {
  // Dummy data to populate the screen
  const workerData = {
    name: 'John Cooper',
    id: '#W2389',
    status: 'On Site',
    location: 'Zone B-12',
    since: '07:30 AM',
    attendance: [
      { type: 'Check In', time: '07:30 AM' },
      { type: 'Break', time: '12:00 PM' },
      // Add more attendance records as needed
    ],
    physicalCondition: {
      heartRate: '72 BPM',
      temperature: '36.5°C',
    },
    equipmentStatus: [
      { name: 'Safety Helmet', status: 'Active' },
      { name: 'Safety Vest', status: 'Active' },
      // Add more equipment as needed
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Profile Section */}
      <View style={styles.profileHeader}>
        <Icon name="account-circle-outline" size={50} color="#000000" style={styles.profileAvatar} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{workerData.name}</Text>
          <Text style={styles.profileId}>Site Worker {workerData.id}</Text>
        </View>
        <TouchableOpacity>
          <Icon name="dots-vertical" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Current Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Status</Text>
            <View style={[styles.statusBadge, workerData.status === 'On Site' ? styles.statusOnSite : styles.statusOffSite]}>
              <Text style={styles.statusBadgeText}>{workerData.status}</Text>
            </View>
          </View>
          <Text style={styles.cardDetailText}>Location: {workerData.location}</Text>
          <Text style={styles.cardDetailText}>Since: {workerData.since}</Text>
        </View>

        {/* Today's Attendance Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Attendance</Text>
          {workerData.attendance.map((record, index) => (
            <View key={index} style={styles.attendanceRow}>
              <Icon
                name={record.type === 'Check In' ? 'login-variant' : 'coffee'} // Different icons for check-in/break
                size={20}
                color="#000000"
                style={styles.attendanceIcon}
              />
              <Text style={styles.attendanceTypeText}>{record.type}</Text>
              <Text style={styles.attendanceTimeText}>{record.time}</Text>
            </View>
          ))}
        </View>

        {/* Path History Card (Simulated Map View) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Path History</Text>
          <View style={styles.mapViewPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Site Map View</Text>
          </View>
          <Text style={styles.mapUpdateTime}>Last updated: 5 mins ago</Text>
        </View>

        {/* Physical Condition Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Physical Condition</Text>
          <View style={styles.physicalConditionRow}>
            <View style={styles.physicalItem}>
              <Icon name="heart-pulse" size={24} color="#000000" />
              <Text style={styles.physicalLabel}>Heart Rate</Text>
              <Text style={styles.physicalValue}>{workerData.physicalCondition.heartRate}</Text>
            </View>
            <View style={styles.physicalItem}>
              <Icon name="thermometer" size={24} color="#000000" />
              <Text style={styles.physicalLabel}>Temperature</Text>
              <Text style={styles.physicalValue}>{workerData.physicalCondition.temperature}</Text>
            </View>
          </View>
        </View>

        {/* Equipment Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Equipment Status</Text>
          {workerData.equipmentStatus.map((item, index) => (
            <View key={index} style={styles.equipmentRow}>
              <Icon name="tools" size={20} color="#000000" style={styles.equipmentIcon} /> {/* Generic tool icon */}
              <Text style={styles.equipmentNameText}>{item.name}</Text>
              <View style={[styles.statusBadge, styles.statusActiveEquipment]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light grey background
  },
  scrollViewContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF', // White background
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
    color: '#000000', // Black text
  },
  profileId: {
    fontSize: 14,
    color: '#666666', // Dark grey text
  },
  card: {
    backgroundColor: '#FFFFFF', // White card background
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black title
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusOnSite: {
    backgroundColor: '#7ED321', // Lime green for On Site
  },
  statusOffSite: {
    backgroundColor: '#000000', // Black for Off Site
  },
  statusActiveEquipment: {
    backgroundColor: '#7ED321', // Lime green for active equipment
  },
  statusBadgeText: {
    color: '#FFFFFF', // White text for badges
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDetailText: {
    fontSize: 14,
    color: '#333333', // Dark grey detail text
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
    color: '#000000', // Black text
    flex: 1,
  },
  attendanceTimeText: {
    fontSize: 16,
    color: '#000000', // Black text
    fontWeight: 'bold',
  },
  mapViewPlaceholder: {
    backgroundColor: '#E0E0E0', // Light grey for map placeholder
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666666', // Dark grey text
  },
  mapUpdateTime: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  physicalConditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  physicalItem: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5F5F5', // Slightly darker grey for physical items
    borderRadius: 8,
    width: '48%', // For two items per row
  },
  physicalLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  physicalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 3,
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
});

export default ResumenTrabajadorScreen;
