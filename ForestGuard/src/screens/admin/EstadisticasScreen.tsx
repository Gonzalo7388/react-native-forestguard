import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card } from 'react-native-paper'; // Assuming Card component is from react-native-paper
import Header from '../../components/Header'; // Header component is assumed to exist

const screenWidth = Dimensions.get('window').width;

const EstadisticasScreen = () => {
  // Sample statistics data
  const datosEstadisticas = {
    horasTrabajadas: 1234,
    incidentesReportados: 5,
    trabajadoresActivos: 10,
    temperaturaPromedio: 25,
  };

  // Data for the line chart
  const dataGrafico = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        data: [100, 120, 130, 110, 140, 150],
      },
    ],
  };

  return (
    <View testID='estadisticas-screen' style={{ flex: 1, backgroundColor: '#FFFFFF' }}> {/* White background for the main view */}
      {/* Header component */}
      <Header title="Estadísticas" />

      <ScrollView style={styles.container}>
        <Text style={styles.titulo}>Estadísticas Generales</Text>

        {/* Container for statistic cards */}
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
          width={screenWidth - 40} // Chart width (screen width minus padding)
          height={220}
          chartConfig={{
            backgroundColor: '#7ED321', // Lime green background for the chart
            backgroundGradientFrom: '#7ED321', // Lime green gradient start
            backgroundGradientTo: '#7ED321', // Lime green gradient end
            decimalPlaces: 0, // No decimal places for data on the chart
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White lines and labels
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White labels
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6', // Radius of data points
              strokeWidth: '2', // Stroke width of data points
              stroke: '#FFFFFF', // White stroke for data points
            },
          }}
          bezier // Smooth curves for the line chart
          style={{
            marginVertical: 8,
            borderRadius: 16,
            alignSelf: 'center' // Center the chart
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF', // White background
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000000', // Black title
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%', // Two cards per row
    marginBottom: 10,
    backgroundColor: '#7ED321', // Lime green background for cards
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
    color: '#FFFFFF', // White text for card titles
  },
  cardData: {
    fontSize: 18,
    color: '#000000', // Black text for card data
  },
  graficoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#000000', // Black title for chart
  },
});

export default EstadisticasScreen;
