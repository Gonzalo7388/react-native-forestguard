import React from 'react';
import { render } from '@testing-library/react-native';
import EstadisticasScreen from '../screens/admin/EstadisticasScreen';

jest.mock('react-native-chart-kit', () => ({
  LineChart: () => null,
}));

jest.mock('../components/Header', () => 'MockedHeader');

describe('EstadisticasScreen', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<EstadisticasScreen />);
    expect(getByTestId('estadisticas-screen')).toBeTruthy();
  });
});
