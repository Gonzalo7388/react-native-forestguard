import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Card } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

const EstadisticasScreen = () => {
  // Datos de ejemplo
  const datosEstadisticas = {
    horasTrabajadas: 1234,
    incidentesReportados: 5,
    trabajadoresActivos: 10,
    temperaturaPromedio: 25, // Grados Celsius
  };

  const dataGrafico = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], // Meses
    datasets: [
      {
        data: [100, 120, 130, 110, 140, 150],
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Estadísticas Generales</Text>

      <View style={styles.cardContainer}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Horas Trabajadas</Text>
          <Text style={styles.cardData}>{datosEstadisticas.horasTrabajadas} horas</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Incidentes Reportados</Text>
          <Text style={styles.cardData}>{datosEstadisticas.incidentesReportados}</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Trabajadores Activos</Text>
          <Text style={styles.cardData}>{datosEstadisticas.trabajadoresActivos}</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Temperatura Promedio</Text>
          <Text style={styles.cardData}>{datosEstadisticas.temperaturaPromedio}°C</Text>
        </Card>
      </View>

      <Text style={styles.graficoTitulo}>Horas Trabajadas por Mes</Text>
      <LineChart
        data={dataGrafico}
        width={screenWidth - 40} // Ajusta el gráfico para que se vea bien
        height={220}
        chartConfig={{
          backgroundColor: '#1cc910',
          backgroundGradientFrom: '#0e1a2b',
          backgroundGradientTo: '#0e1a2b',
          decimalPlaces: 2, // Muestra dos decimales
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffa726',
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#422E13', // Fondo marrón oscuro
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#DBB95F', // Amarillo claro para el título
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: '#7F5F16', // Marrón claro
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FFFFFF', // Blanco para los títulos de las tarjetas
  },
  cardData: {
    fontSize: 18,
    color: '#DBB95F', // Amarillo claro para los datos
  },
  graficoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#DBB95F', // Amarillo claro para el título del gráfico
  },
});


export default EstadisticasScreen;
