import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from './BottomTabNavigator';
import MarcadorNavigator from './MarcadorNavigator';

import DrawerContent from './drawer/DrawerContent';

import MapaRecorridoScreen from '../screens/trabajador/MapaRecorridoScreen';
import AsistenciaScreen from '../screens/trabajador/AsistenciaScreen';
import ControlEquipamientoScreen from '../screens/trabajador/ControlEquipamientoScreen';
import EvaluacionPostJornadaScreen from '../screens/trabajador/EvaluacionPostJornadaScreen';
import ResumenTrabajadorScreen from '../screens/admin/ResumenTrabajadorScreen';
import ConfiguracionScreen from '../screens/comunes/ConfiguracionScreen';
import ProyectosScreen from '../screens/comunes/ProyectosScreen';
import InviteWorkerScreen from '../screens/admin/InviteWorkerScreen';
import ProyectoInfoScreen from '../screens/comunes/ProyectoInfoScreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="Tabs" component={BottomTabNavigator} />
      <Drawer.Screen name="MarcadorNavigator" component={MarcadorNavigator} />
      <Drawer.Screen name="MapaRecorrido" component={MapaRecorridoScreen} />
      <Drawer.Screen name="Asistencia" component={AsistenciaScreen} />
      <Drawer.Screen name="ControlEquipamiento" component={ControlEquipamientoScreen} />
      <Drawer.Screen name="EvaluacionPostJornada" component={EvaluacionPostJornadaScreen} />
      <Drawer.Screen name="ResumenTrabajador" component={ResumenTrabajadorScreen} />
      <Drawer.Screen name="Proyectos" component={ProyectosScreen} />
      <Drawer.Screen name="InviteWorker" component={InviteWorkerScreen} />
      <Drawer.Screen name="Configuracion" component={ConfiguracionScreen} />
      <Drawer.Screen name="ProyectoInfo" component={ProyectoInfoScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;