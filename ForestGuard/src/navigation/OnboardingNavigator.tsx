// src/navigation/OnboardingNavigator.tsx

import React, { useEffect, useState, useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '../contexts/AuthContext';
import CrearProyectoScreen from '../screens/admin/CrearProyectoScreen';
import AdminNavigator from './AdminNavigator';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../config/firebase';
import { UserType } from '../types/user';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Loader: undefined;
  CrearProyecto: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const LoaderScreen = () => {
  const auth = useAuthContext();
  const navigation = useNavigation();

  useEffect(() => {
    const checkProject = async () => {
      if (!auth || !auth.user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'CrearProyecto' as never }],
        });
        return;
      }

      try {
        const db = getFirestore(app);
        console.log("Consultando usuario con ID:", auth.user?.id);

        const userRef = doc(db, 'usuarios', auth.user.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserType;

          if (userData.proyectos && Object.keys(userData.proyectos).length > 0) {
            // ✅ Actualizar en contexto local si aún no está
            if (!auth.user.proyectos || Object.keys(auth.user.proyectos).length === 0) {
              auth.setUser({
                ...auth.user,
                proyectos: userData.proyectos,
              });
            }
            navigation.reset({
              index: 0,
              routes: [{ name: 'Admin' as never }],
            });
          } else {
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
      }
    };

    checkProject();
  }, [auth, navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#e74c3c" />
    </View>
  );
};

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Loader" component={LoaderScreen} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="CrearProyecto" component={CrearProyectoScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
