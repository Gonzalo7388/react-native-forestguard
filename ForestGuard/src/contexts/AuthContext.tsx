import React, { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { UserType } from '../types/user';

export type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  user: UserType | null;
  setUser: Dispatch<SetStateAction<UserType | null>>; // ✅ CORRECTO
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthContext.Provider');
  }
  return context;
};
