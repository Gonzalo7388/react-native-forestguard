// src/__tests__/screens/MapaScreen.test.tsx
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import MapaScreen from '../../screens/admin/MapaScreen';
import * as Location from 'expo-location';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import { UserType } from '../../types/user';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props: any) => <View {...props}>{props.children}</View>;
  const MockMarker = (props: any) => <View {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
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
        { id: 'worker1', data: () => ({ name: 'Carlos Perez', lastKnownLocation: { latitude: -12.11, longitude: -77.01 }, proyectos: { 'test-project-id': 'talador' } }) },
        { id: 'worker2', data: () => ({ name: 'Maria Lopez', lastKnownLocation: { latitude: -12.12, longitude: -77.02 }, proyectos: { 'test-project-id': 'marcador' } }) },
      ],
      docChanges: () => [],
    };
    callback(mockSnapshot);
    return jest.fn();
  }),
}));

describe('MapaScreen', () => {
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
    nombre: 'Proyecto del Admin',
    descripcion: 'Descripción del proyecto',
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
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: -12.1,
        longitude: -77.0,
      },
    });

    (collection as jest.Mock).mockClear();
    (query as jest.Mock).mockClear();
    (where as jest.Mock).mockClear();
    (onSnapshot as jest.Mock).mockClear();
  });

  it('debería renderizar correctamente y mostrar usuarios conectados', async () => {
    const { getByText, getAllByText } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <MapaScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'users');
      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        where('proyectoId', '==', 'test-project-id'),
      );
      expect(onSnapshot).toHaveBeenCalled();

      expect(getByText('Carlos Perez')).toBeTruthy();
      expect(getByText('Maria Lopez')).toBeTruthy();
      expect(getAllByText('talador').length).toBeGreaterThan(0);
      expect(getAllByText('marcador').length).toBeGreaterThan(0);
    });
  });

  it('should display a message if no current project is set', () => {
    const mockAuthContextValueNoProject: AuthContextType = {
      ...mockAuthContextValue,
      currentProject: null,
      user: { ...mockUser, proyectoId: undefined, proyectos: {} }
    };

    const { getByText, queryByText } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValueNoProject}>
          <MapaScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    expect(getByText('No hay proyecto seleccionado.')).toBeTruthy();
    expect(queryByText('Carlos Perez')).toBeNull();
  });
});