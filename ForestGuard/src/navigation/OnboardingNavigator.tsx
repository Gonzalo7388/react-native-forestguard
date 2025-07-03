import React, { useEffect, useState, useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import CrearProyectoScreen from '../screens/admin/CrearProyectoScreen';
import AdminNavigator from './AdminNavigator';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../config/firebase';
import { UserType } from '../types/user';
import { useNavigation } from '@react-navigation/native';

export type OnboardingStackParamList = {
  CrearProyecto: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = () => {
  const auth = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  
  useEffect(() => {
    const checkProject = async () => {
      if (!auth || !auth.user) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore(app);
        console.log("Consultando usuario con ID:", auth.user?.id);

        const userRef = doc(db, 'usuarios', auth.user.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserType;

          if (userData.proyectoId) {
            // Actualizar el contexto si no tiene el proyecto aún
            if (!auth.user.proyectoId) {
              auth.setUser({
                ...auth.user,
                proyectoId: userData.proyectoId,
              });
            }

            // Redirigir a Admin
            navigation.reset({
              index: 0,
              routes: [{ name: 'Admin' as never }],
            });
          } else {
            // Redirigir a CrearProyecto
            navigation.reset({
              index: 0,
              routes: [{ name: 'CrearProyecto' as never }],
            });
          }
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CrearProyecto' as never }],
          });
        }
      } catch (error) {
        console.error('Error al verificar proyecto del usuario:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'CrearProyecto' as never }],
        });
      } finally {
        setLoading(false);
      }
    };

    checkProject();
  }, [auth]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  // Ambas pantallas están registradas permanentemente
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="CrearProyecto" component={CrearProyectoScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
