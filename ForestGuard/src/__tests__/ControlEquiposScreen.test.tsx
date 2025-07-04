import React from 'react';
import { render } from '@testing-library/react-native';
import ControlEquiposScreen from '../screens/admin/ControlEquiposScreen';

describe('ControlEquiposScreen', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<ControlEquiposScreen />);
    expect(getByTestId('control-equipos-screen')).toBeTruthy();
  });
});
