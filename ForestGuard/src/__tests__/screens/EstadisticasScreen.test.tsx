// src/__tests__/screens/EstadisticasScreen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import EstadisticasScreen from '../../screens/admin/EstadisticasScreen';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import { UserType } from '../../types/user';
import { NavigationContainer } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

jest.mock('react-native-chart-kit', () => ({
  LineChart: () => null,
  BarChart: () => null,
  PieChart: () => null,
}));

jest.mock('../../components/Header', () => 'MockedHeader');

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useFocusEffect: jest.fn(),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe('EstadisticasScreen', () => {
  const mockUser: UserType = {
    id: 'mock-user-id',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: '',
    proyectoId: 'mock-project-id-123',
    proyectos: { 'mock-project-id-123': 'administrador' },
  };

  const mockProject = {
    id: 'mock-project-id-123',
    nombre: 'Proyecto Test',
    descripcion: 'Un proyecto de prueba para estadísticas',
    administradorId: 'mock-user-id',
  };

  beforeEach(() => {
    (useFocusEffect as jest.Mock).mockImplementation(React.useCallback);

    const mockSnapshot = {
        docs: [
            { id: 'cut1', data: () => ({ arbolesCortados: 10, fecha: new Date() }) },
            { id: 'cut2', data: () => ({ arbolesCortados: 5, fecha: new Date() }) },
        ],
    };
    (require('firebase/firestore').getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
  });

  it('renders correctly and fetches data when currentProject is set', async () => {
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

    const { getByTestId } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <EstadisticasScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    await waitFor(() => {
        expect(getByTestId('estadisticas-screen')).toBeTruthy();
    });
  });

  it('shows a loading indicator or message if no currentProject is set', () => {
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

    const { getByText } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <EstadisticasScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    expect(getByText('Selecciona un proyecto para ver las estadísticas.')).toBeTruthy();
  });
});