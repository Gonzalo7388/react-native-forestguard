// AdminNavigator.tsx

import { createStackNavigator } from '@react-navigation/stack';
import EstadisticasScreen from '../screens/admin/EstadisticasScreen';
import MapaScreen from '../screens/admin/MapaScreen';
import ControlEquiposScreen from '../screens/admin/ControlEquiposScreen'; // Importar la nueva pantalla
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Mapa" component={MapaScreen} />
      <Stack.Screen name="Estadisticas" component={EstadisticasScreen} />
      <Stack.Screen name="Control" component={ControlEquiposScreen} />


      {/* Otras pantallas */}
    </Stack.Navigator>
  );
};

export default AdminNavigator;
