import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import i18n from '../../i18n/i18n';

export default function PerfilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{(i18n as any).t('perfil')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
});
