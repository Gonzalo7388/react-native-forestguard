// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import auth0 from '../services/auth0';
import { ensureUserInFirestore } from '../utils/firebaseUser';
import { createUserIfNotExists } from '../utils/createUserIfNotExists';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    try {
      setIsLoading(true);
      const credentials = await auth0.webAuth.authorize({ scope: 'openid profile email' });
      const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });

      console.log("✅ Auth0 userInfo:", userInfo);

      if (!userInfo.sub) {
        console.error("❌ El campo 'sub' de Auth0 no está presente, no se puede continuar.");
        return false; // o throw un error si deseas romper el flujo
      }
      const sanitizedId = userInfo.sub.replace(/[^\w.-]/g, '_');

      const userObject = {
        id: sanitizedId,
        name: userInfo.name ?? "",
        email: userInfo.email ?? "",
        avatarUrl: userInfo.picture ?? "",
      };


      await ensureUserInFirestore(userObject); // ✅ Garantiza existencia en Firestore

      setUser(userObject); // Luego actualizas tu context
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
