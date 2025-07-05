import React from 'react';
import { TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FloatingActionButtonProps = {
  onPress: () => void;
  iconName?: string;
  label?: string;
  style?: ViewStyle; // ✅ Permitir estilo externo opcional
  customStyle?: any; // Permitir estilos externos

};

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  iconName = 'add',
  label = '',
  style, // ✅ recibir
  customStyle = {}
}) => {
  return (
    <TouchableOpacity style={[styles.fab, style,customStyle]} onPress={onPress}>
      {iconName ? <Ionicons name={iconName as any} size={28} color="#fff" /> : null}
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </TouchableOpacity>
  );
};

export default FloatingActionButton;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#28a745',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
});
