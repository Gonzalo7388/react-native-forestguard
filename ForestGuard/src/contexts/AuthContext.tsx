import React, { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { UserType } from '../types/user';

export type AuthContextType = {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  user: UserType | null;
  setUser: Dispatch<SetStateAction<UserType | null>>;
  currentRole: string | null; // 'admin', 'marcador', etc.
  setCurrentRole: Dispatch<SetStateAction<string | null>>;
  currentProject: any | null; // Puedes tipar mejor según tu estructura de proyecto
  setCurrentProject: Dispatch<SetStateAction<any | null>>;
  cambiarProyecto: (proyecto: any, role: string) => void;
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthContext.Provider');
  }
  return context;
};
