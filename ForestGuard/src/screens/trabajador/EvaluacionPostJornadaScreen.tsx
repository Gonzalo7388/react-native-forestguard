import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EvaluacionPostJornadaScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Evaluación Post Jornada</Text>
    </View>
  );
};

export default EvaluacionPostJornadaScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
});
