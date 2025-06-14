import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ResumenTrabajadorScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Resumen del Trabajador</Text>
    </View>
  );
};

export default ResumenTrabajadorScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
});
