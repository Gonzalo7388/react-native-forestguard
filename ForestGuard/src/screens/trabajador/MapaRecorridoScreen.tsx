import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapaRecorridoScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Mapa de Recorrido del Trabajador</Text>
    </View>
  );
};

export default MapaRecorridoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
