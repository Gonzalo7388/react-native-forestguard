// src/__tests__/screens/ControlEquiposScreen.test.tsx
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import ControlEquiposScreen from '../../screens/admin/ControlEquiposScreen';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import { UserType } from '../../types/user';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('../../components/Header', () => () => <></>);

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn((q, callback) => {
    const mockSnapshot = {
      docs: [
        { id: 'eq1', data: () => ({ nombre: 'Motosierra Stihl MS 250', estado: 'Operativo', asignadoA: 'Carlos Perez', proyectoId: 'test-project-id' }) },
        { id: 'eq2', data: () => ({ nombre: 'Hacha Forestal', estado: 'En Reparacion', asignadoA: null, proyectoId: 'test-project-id' }) },
      ],
      docChanges: () => [],
    };
    callback(mockSnapshot);
    return jest.fn();
  }),
}));


describe('ControlEquiposScreen', () => {
  const mockUser: UserType = {
    id: 'admin-user-id',
    name: 'Admin User',
    email: 'admin@example.com',
    avatarUrl: '',
    proyectoId: 'test-project-id',
    proyectos: { 'test-project-id': 'administrador' },
  };

  const mockProject = {
    id: 'test-project-id',
    nombre: 'Proyecto Test Control',
    descripcion: 'Control de equipos para este proyecto',
    administradorId: 'admin-user-id',
  };

  const mockAuthContextValue: AuthContextType = {
    isAuthenticated: true,
    setIsAuthenticated: jest.fn(),
    user: mockUser,
    setUser: jest.fn(),
    currentProject: mockProject,
    setCurrentProject: jest.fn(),
    currentRole: 'administrador',
    setCurrentRole: jest.fn(), // <--- RE-ADDED THIS LINE
    cambiarProyecto: jest.fn(),
  };

  beforeEach(() => {
    (useFocusEffect as jest.Mock).mockImplementation(React.useCallback);

    (collection as jest.Mock).mockClear();
    (query as jest.Mock).mockClear();
    (where as jest.Mock).mockClear();
    (onSnapshot as jest.Mock).mockClear();
  });

  it('debería renderizar correctamente y mostrar la lista de equipos', async () => {
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <ControlEquiposScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByTestId('control-equipos-screen')).toBeTruthy();

      expect(getByText('Motosierra Stihl MS 250')).toBeTruthy();
      expect(getByText('Operativo')).toBeTruthy();
      expect(getByText('Asignado a: Carlos Perez')).toBeTruthy();
      expect(getByText('Hacha Forestal')).toBeTruthy();
      expect(getByText('En Reparacion')).toBeTruthy();
    });

    expect(collection).toHaveBeenCalledWith(expect.anything(), 'equipos');
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      where('proyectoId', '==', 'test-project-id')
    );
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('debería mostrar un mensaje si no hay proyecto seleccionado', () => {
    const mockAuthContextValueNoProject: AuthContextType = {
      ...mockAuthContextValue,
      currentProject: null,
      user: { ...mockUser, proyectoId: undefined, proyectos: {} }
    };

    const { getByText, queryByText } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValueNoProject}>
          <ControlEquiposScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    expect(getByText('No hay proyecto seleccionado.')).toBeTruthy();
    expect(queryByText('Motosierra Stihl MS 250')).toBeNull();
  });
});