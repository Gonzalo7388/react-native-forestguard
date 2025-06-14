import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons
import { SafeAreaView } from 'react-native-safe-area-context';

const AsistenciaScreen = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false); // State for check-in status

  useEffect(() => {
    // Update time and date every second
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on component unmount
  }, []);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    console.log('Checked In!');
    // In a real app, this would log the check-in time to a backend
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    console.log('Checked Out!');
    // In a real app, this would log the check-out time to a backend
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={styles.headerIcons}>
          <Icon name="bell-outline" size={24} color="#000000" style={styles.headerIcon} />
          <Icon name="account-circle-outline" size={24} color="#000000" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Current Time and Date */}
        <View style={styles.timeDateContainer}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>

        {/* Current Status */}
        <View style={styles.sectionCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <View style={[styles.statusBadge, isCheckedIn ? styles.badgeCheckedIn : styles.badgeNotCheckedIn]}>
              <Text style={styles.badgeText}>
                {isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.checkButton, isCheckedIn ? styles.checkButtonDisabled : styles.checkButtonActive]}
            onPress={handleCheckIn}
            disabled={isCheckedIn}
          >
            <Icon name="arrow-right" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.checkButtonText}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkButton, !isCheckedIn ? styles.checkButtonDisabled : styles.checkButtonActive]}
            onPress={handleCheckOut}
            disabled={!isCheckedIn}
          >
            <Icon name="arrow-left" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.checkButtonText}>Check Out</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Required */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Verification Required</Text>
          <TouchableOpacity style={styles.verificationOption}>
            <Icon name="camera-outline" size={20} color="#000000" style={styles.optionIcon} />
            <Text style={styles.optionText}>Facial Recognition</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.verificationOption}>
            <Icon name="map-marker-outline" size={20} color="#000000" style={styles.optionIcon} />
            <Text style={styles.optionText}>Location Verification</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityText}>Check Out</Text>
            <Text style={styles.activityDate}>April 19, 2025</Text>
            <Text style={styles.activityTime}>17:30</Text>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityText}>Check In</Text>
            <Text style={styles.activityDate}>April 19, 2025</Text>
            <Text style={styles.activityTime}>09:00</Text>
          </View>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000', // Black title
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginRight: 15,
  },
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
    color: '#000000', // Black time text
  },
  dateText: {
    fontSize: 16,
    color: '#666666', // Dark grey date text
    marginTop: 5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF', // White card background
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333333', // Dark grey status label
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeCheckedIn: {
    backgroundColor: '#7ED321', // Lime green for checked in
  },
  badgeNotCheckedIn: {
    backgroundColor: '#000000', // Black for not checked in
  },
  badgeText: {
    color: '#FFFFFF', // White text for badges
    fontWeight: 'bold',
    fontSize: 14,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  checkButtonActive: {
    backgroundColor: '#000000', // Black for active buttons
  },
  checkButtonDisabled: {
    backgroundColor: '#E0E0E0', // Light grey for disabled buttons
  },
  buttonIcon: {
    marginRight: 10,
  },
  checkButtonText: {
    color: '#FFFFFF', // White text for buttons
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black section title
    marginBottom: 15,
  },
  verificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Light grey background for options
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#000000', // Black text for options
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5', // Light grey separator
  },
  activityText: {
    fontSize: 16,
    color: '#000000', // Black text
    fontWeight: 'bold',
    flex: 2, // Take more space
  },
  activityDate: {
    fontSize: 14,
    color: '#666666', // Dark grey date
    flex: 2,
    textAlign: 'center',
  },
  activityTime: {
    fontSize: 14,
    color: '#000000', // Black time
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
});

export default AsistenciaScreen;
