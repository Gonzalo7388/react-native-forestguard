// src/__tests__/screens/CrearProyectoScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import CrearProyectoScreen from '../../screens/admin/CrearProyectoScreen';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import { UserType } from '../../types/user';
import { NavigationContainer } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
    }),
  };
});

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
}));

describe('CrearProyectoScreen', () => {
  it('renders correctly for an admin user', () => {
    const mockUser: UserType = {
      id: 'mock-admin-id-123',
      name: 'Mock Admin User',
      email: 'admin@test.com',
      avatarUrl: 'https://example.com/admin_avatar.png',
      proyectoId: undefined,
      proyectos: { 'new-project-id': 'administrador' },
    };

    const mockAuthContextValue: AuthContextType = {
      isAuthenticated: true,
      setIsAuthenticated: jest.fn(),
      user: mockUser,
      setUser: jest.fn(),
      currentProject: null,
      setCurrentProject: jest.fn(),
      currentRole: 'administrador',
      setCurrentRole: jest.fn(), // <--- RE-ADDED THIS LINE
      cambiarProyecto: jest.fn(),
    };

    const { getByTestId } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <CrearProyectoScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    expect(getByTestId('crear-proyecto-screen')).toBeTruthy();
  });
});