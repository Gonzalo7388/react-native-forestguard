import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card } from 'react-native-paper'; // Assuming Card component is from react-native-paper
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { app } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
// No need for Header component import if it's not used in the JSX

const screenWidth = Dimensions.get('window').width;

// --- Interfaces para los datos ---
type UserData = {
    id: string;
    name: string;
    email: string;
    proyectos?: { [projectId: string]: string };
    location?: {
        latitude: number;
        longitude: number;
        timestamp: Timestamp; // Assuming this is a Firestore Timestamp
    };
    lastLocationUpdate?: Timestamp; // Assuming this is a Firestore Timestamp
};

type AlertData = {
    id: string;
    timestamp: Timestamp; // Assuming this is a Firestore Timestamp
    resuelta: boolean;
    proyectoId: string;
    // ... other alert fields
};

// --- Main Component ---
const EstadisticasScreen = () => {
    const { currentProject } = useAuth();
    const db = getFirestore(app);

    const [loading, setLoading] = useState(true);
    const [totalHoursWorked, setTotalHoursWorked] = useState<number | string>('N/A'); // Placeholder for now
    const [incidentsReported, setIncidentsReported] = useState(0);
    const [activeWorkersCount, setActiveWorkersCount] = useState(0);
    const [avgTemperature, setAvgTemperature] = useState<number | string>('N/A'); // Placeholder for now

    const [monthlyAlertsData, setMonthlyAlertsData] = useState({
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
    });

    // Function to fetch and calculate statistics
    const fetchStatistics = useCallback(async () => {
        if (!currentProject?.id) {
            console.warn('EstadisticasScreen: No hay un proyecto seleccionado. No se cargarán estadísticas.');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // 1. Fetch Incidents Reported
            const alertsQuery = query(
                collection(db, 'alertas'),
                where('proyectoId', '==', currentProject.id)
            );
            const alertsSnapshot = await getDocs(alertsQuery);
            setIncidentsReported(alertsSnapshot.size);

            // Calculate monthly alerts for the chart
            const monthlyCounts: { [key: string]: number } = {
                '01': 0, '02': 0, '03': 0, '04': 0, '05': 0, '06': 0, // For Jan-Jun
            };
            const currentYear = new Date().getFullYear(); // Assuming current year for chart

            alertsSnapshot.forEach(docSnap => {
                const data = docSnap.data() as AlertData;
                if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                    const alertDate = data.timestamp.toDate();
                    if (alertDate.getFullYear() === currentYear) {
                        const month = (alertDate.getMonth() + 1).toString().padStart(2, '0');
                        if (monthlyCounts[month] !== undefined) {
                            monthlyCounts[month]++;
                        }
                    }
                }
            });

            setMonthlyAlertsData({
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    data: [
                        monthlyCounts['01'],
                        monthlyCounts['02'],
                        monthlyCounts['03'],
                        monthlyCounts['04'],
                        monthlyCounts['05'],
                        monthlyCounts['06'],
                    ],
                }],
            });


            // 2. Fetch Active Workers
            const usersQuery = query(
                collection(db, 'usuarios')
                // No need to filter by project ID here if you want all users,
                // but if you want only users assigned to the current project:
                // where(`proyectos.${currentProject.id}`, '!=', null) // Checks if project ID exists in their 'proyectos' map
            );
            const usersSnapshot = await getDocs(usersQuery);
            let activeCount = 0;
            const fiveMinutesAgo = new Date().getTime() - (5 * 60 * 1000); // 5 minutes in milliseconds

            usersSnapshot.forEach(docSnap => {
                const data = docSnap.data() as UserData;
                // Check if user is assigned to the current project AND has a recent location update
                if (data.proyectos && data.proyectos[currentProject.id] && data.lastLocationUpdate && typeof data.lastLocationUpdate.toDate === 'function') {
                    try {
                        const lastUpdateMillis = data.lastLocationUpdate.toDate().getTime();
                        if (lastUpdateMillis > fiveMinutesAgo) {
                            activeCount++;
                        }
                    } catch (e) {
                        console.warn(`User ${docSnap.id} has invalid lastLocationUpdate timestamp:`, data.lastLocationUpdate, e);
                    }
                }
            });
            setActiveWorkersCount(activeCount);

            // 3. Total Hours Worked (Placeholder/Simplified)
            // For a real system, this would involve tracking clock-in/clock-out or aggregating
            // time differences from location points in 'ubicaciones_recorrido'.
            // For now, let's keep it as a simple placeholder or a count of active sessions.
            // Example: Counting unique days with location data for current project
            const locationPathsQuery = query(
                collection(db, 'ubicaciones_recorrido'),
                where('projectId', '==', currentProject.id)
            );
            const locationPathsSnapshot = await getDocs(locationPathsQuery);
            const uniqueDays = new Set<string>();
            locationPathsSnapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.date) { // Assuming 'date' field is 'YYYY-MM-DD'
                    uniqueDays.add(data.date);
                }
            });
            // This is a very rough proxy: total "active days" for the project
            setTotalHoursWorked(`${uniqueDays.size} días activos (estimado)`);


            // 4. Average Temperature (Placeholder)
            // This would require a 'clima' collection with historical data or a weather API.
            setAvgTemperature('N/A'); // Keep as N/A or integrate with your climaService if it stores historical data

        } catch (error) {
            console.error('ERROR AL CARGAR ESTADÍSTICAS:', error);
            Alert.alert('Error', 'No se pudieron cargar las estadísticas.');
        } finally {
            setLoading(false);
        }
    }, [currentProject?.id, db]);

    useEffect(() => {
        fetchStatistics();
        // Set up an interval to refresh statistics periodically
        const interval = setInterval(fetchStatistics, 60000); // Refresh every 60 seconds (1 minute)
        return () => clearInterval(interval);
    }, [fetchStatistics]); // Re-run effect if fetchStatistics changes (due to currentProject.id)


    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#7ED321" />
                <Text style={styles.loadingText}>Cargando estadísticas...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <ScrollView style={styles.container}>
                <Text style={styles.titulo}>Estadísticas del Proyecto: {currentProject?.nombre || 'N/A'}</Text>

                <View style={styles.cardContainer}>
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Incidentes Reportados</Text>
                        <Text style={styles.cardData}>{incidentsReported}</Text>
                    </Card>
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Trabajadores Activos (Últimos 5 min)</Text>
                        <Text style={styles.cardData}>{activeWorkersCount}</Text>
                    </Card>
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Días Activos del Proyecto</Text>
                        <Text style={styles.cardData}>{totalHoursWorked}</Text>
                    </Card>
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Temperatura Promedio</Text>
                        <Text style={styles.cardData}>{avgTemperature}°C</Text>
                    </Card>
                </View>

                <Text style={styles.graficoTitulo}>Alertas Reportadas por Mes ({new Date().getFullYear()})</Text>
                <LineChart
                    data={monthlyAlertsData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#7ED321',
                        backgroundGradientFrom: '#7ED321',
                        backgroundGradientTo: '#7ED321',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: {
                            borderRadius: 16,
                        },
                        propsForDots: {
                            r: '6',
                            strokeWidth: '2',
                            stroke: '#FFFFFF',
                        },
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16,
                        alignSelf: 'center'
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
        backgroundColor: '#FFFFFF',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#000000',
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
        backgroundColor: '#7ED321',
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
        color: '#FFFFFF',
    },
    cardData: {
        fontSize: 18,
        color: '#000000',
    },
    graficoTitulo: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 20,
        textAlign: 'center',
        color: '#000000',
    },
});

export default EstadisticasScreen;