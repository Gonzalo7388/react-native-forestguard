import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ControlEquipamientoScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Control de Equipamiento</Text>
    </View>
  );
};

export default ControlEquipamientoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
});
