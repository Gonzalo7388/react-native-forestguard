import React from 'react';
import { render } from '@testing-library/react-native';
import CrearProyectoScreen from '../screens/admin/CrearProyectoScreen';
import { AuthContext } from '../contexts/AuthContext';
import { UserType } from '../types/user';
import { NavigationContainer } from '@react-navigation/native';

describe('CrearProyectoScreen', () => {
  it('renders correctly', () => {
    const mockUser: UserType = {
      id: 'mock-id-123',
      name: 'Mock Tester',
      email: 'mock@test.com',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'administrador',
      proyectoId: 'mock-proyecto-id',
    };

    const mockAuthContextValue = {
      isAuthenticated: true,
      setIsAuthenticated: jest.fn(),
      user: mockUser,
      setUser: jest.fn(),
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
