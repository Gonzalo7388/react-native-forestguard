import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from './BottomTabNavigator';
import DrawerContent from './drawer/DrawerContent';
import MapaRecorridoScreen from '../screens/trabajador/MapaRecorridoScreen';
import AsistenciaScreen from '../screens/trabajador/AsistenciaScreen';
import ControlEquipamientoScreen from '../screens/trabajador/ControlEquipamientoScreen';
import EvaluacionPostJornadaScreen from '../screens/trabajador/EvaluacionPostJornadaScreen';
import ResumenTrabajadorScreen from '../screens/admin/ResumenTrabajadorScreen';
import ConfiguracionScreen from '../screens/comunes/ConfiguracionScreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="Tabs" component={BottomTabNavigator} />
      <Drawer.Screen name="MapaRecorrido" component={MapaRecorridoScreen} />
      <Drawer.Screen name="Asistencia" component={AsistenciaScreen} />
      <Drawer.Screen name="ControlEquipamiento" component={ControlEquipamientoScreen} />
      <Drawer.Screen name="EvaluacionPostJornada" component={EvaluacionPostJornadaScreen} />
      <Drawer.Screen name="ResumenTrabajador" component={ResumenTrabajadorScreen} />
      <Drawer.Screen name="Configuracion" component={ConfiguracionScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
