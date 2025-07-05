// src/services/locationService.ts
import { getFirestore, collection, doc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { app } from '../config/firebase'; // Asegúrate de la ruta correcta

const db = getFirestore(app);

interface LocationPoint {
    latitude: number;
    longitude: number;
    timestamp: Date; // Usamos Date aquí antes de convertir a Timestamp
}

// Función auxiliar para formatear la fecha a YYYY-MM-DD
const formatDateForFirestore = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const saveUserLocation = async (
    userId: string,
    projectId: string,
    location: LocationPoint
) => {
    try {
        const todayFormatted = formatDateForFirestore(location.timestamp);
        const pathDocRef = doc(db, 'ubicaciones_recorrido', `${projectId}_${userId}_${todayFormatted}`);

        const newLocationPoint = {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: Timestamp.fromDate(location.timestamp) // Convierte a Firebase Timestamp
        };

        // Intentar actualizar el documento (añadir al array)
        await updateDoc(pathDocRef, {
            locations: arrayUnion(newLocationPoint)
        });
        // console.log(`Ubicación de ${userId} añadida a recorrido en Firestore.`);

    } catch (error: any) {
        // Si el documento no existe, setDoc creará uno nuevo
        if (error.code === 'not-found' || error.message.includes('No document to update')) {
             const todayFormatted = formatDateForFirestore(location.timestamp);
             const pathDocRef = doc(db, 'ubicaciones_recorrido', `${projectId}_${userId}_${todayFormatted}`);
             const newLocationPoint = {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: Timestamp.fromDate(location.timestamp)
            };
            await setDoc(pathDocRef, {
                userId: userId,
                projectId: projectId,
                date: todayFormatted,
                locations: [newLocationPoint]
            });
            console.log(`Nuevo recorrido creado y ubicación de ${userId} guardada en Firestore.`);
        } else {
            console.error('Error al guardar ubicación en Firestore:', error);
            // Aquí podrías agregar un logger o manejo de errores más sofisticado
        }
    }
};