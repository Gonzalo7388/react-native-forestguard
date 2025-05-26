import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type EquipoCardProps = {
  equipo: {
    id: string;
    nombre: string;
    color: string;
    icon: string;
  };
};

export default function EquipoCard({ equipo }: EquipoCardProps) {
  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: equipo.color }]}>
      <Text style={styles.icon}>{equipo.icon}</Text>
      <Text style={styles.name}>{equipo.nombre}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderLeftWidth: 5,
  },
  icon: {
    fontSize: 24,
    marginRight: 15,
  },
  name: {
    color: 'white',
    fontSize: 18,
  },
});