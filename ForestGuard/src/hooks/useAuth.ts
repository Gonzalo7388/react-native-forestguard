// src/hooks/useAuth.ts

import { useEffect, useState } from 'react';
import auth0 from '../services/auth0';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../config/firebase';


export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    try {
      setIsLoading(true);

      // 1️⃣ Login con Auth0
      const credentials = await auth0.webAuth.authorize({
        scope: 'openid profile email',
        additionalParameters: {
          prompt: 'login', // <- Esto forzará la solicitud de credenciales en cada login
        },
      });

      const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });

      console.log("✅ Auth0 userInfo:", userInfo);

      if (!userInfo.sub) {
        console.error("❌ El campo 'sub' de Auth0 no está presente, no se puede continuar.");
        return false;
      }

      const sanitizedId = userInfo.sub.replace(/[^\w.-]/g, '_');

      // 2️⃣ Prepara objeto base
      const userObject: any = {
        id: sanitizedId,
        name: userInfo.name ?? "",
        email: userInfo.email ?? "",
        avatarUrl: userInfo.picture ?? "",
      };

      // 3️⃣ Verificar si ya existe en Firestore y cargar rol/proyectoId
      const db = getFirestore(app);
      const userDocRef = doc(db, 'usuarios', sanitizedId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("✅ Usuario encontrado en Firestore:", userData);

        userObject.proyectoId = userData.proyectoId ?? null;
        userObject.rol = userData.rol ?? 'trabajador';
        userObject.estado = userData.estado ?? 'activo';
      } else {
        // 4️⃣ Si no existe, crearlo en Firestore con defaults
        console.log("ℹ️ Usuario no existía en Firestore, creando con datos por defecto...");
        await setDoc(userDocRef, {
          email: userInfo.email ?? "",
          name: userInfo.name ?? "",
          avatarUrl: userInfo.picture ?? "",
          rol: 'trabajador',
          estado: 'activo',
          proyectoId: null,
        });

        userObject.proyectoId = null;
        userObject.rol = 'trabajador';
        userObject.estado = 'activo';
      }

      // 5️⃣ Actualizar el contexto
      setUser(userObject);
      return true;

    } catch (err) {
      console.error('❌ Login failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth0.webAuth.clearSession();
      setUser(null);
    } catch (err) {
      console.error('❌ Logout failed:', err);
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
  };
};
