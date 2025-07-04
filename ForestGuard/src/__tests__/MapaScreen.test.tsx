import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MapaScreen from '../screens/admin/MapaScreen';
import * as Location from 'expo-location';
import { NavigationContainer } from '@react-navigation/native';

beforeAll(() => {
  jest.useFakeTimers(); // Simula timers
});

afterAll(() => {
  jest.useRealTimers(); // Limpieza
});

// Mock de expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

// Mock de react-native-maps
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

// Mock del componente Header
jest.mock('../components/Header', () => () => <></>);

describe('MapaScreen', () => {
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
  });

  it('debería renderizar correctamente y mostrar usuarios conectados', async () => {
    const { getByText, getAllByText } = render(
      <NavigationContainer>
        <MapaScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getAllByText('Carlos Perez')).toBeTruthy();
      expect(getAllByText('Talador')).toBeTruthy();
      expect(getAllByText('Conectado')).toBeTruthy();
    });
  });
});
