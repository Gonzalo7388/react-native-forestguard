// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import auth0 from '../services/auth0';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    try {
      setIsLoading(true);
      const credentials = await auth0.webAuth.authorize({ scope: 'openid profile email' });
      const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
      setUser(userInfo);
      return true;
    } catch (err) {
      console.error('Login failed', err);
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
      console.error('Logout failed', err);
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
  };
};
