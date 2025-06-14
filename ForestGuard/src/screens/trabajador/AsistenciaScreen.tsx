import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AsistenciaScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Registro de Asistencia</Text>
    </View>
  );
};

export default AsistenciaScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
});
