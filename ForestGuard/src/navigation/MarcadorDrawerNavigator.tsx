// src/navigation/MarcadorDrawerNavigator.tsx

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import BottomTabNavigator from './BottomTabNavigator';
import MarcadorNavigator from './MarcadorNavigator';

import ProyectosScreen from '../screens/comunes/ProyectosScreen';
import ConfiguracionScreen from '../screens/comunes/ConfiguracionScreen';
import DrawerContentMarcador from './drawer/DrawerContentMarcador';
import RegistrarArbolScreen from '../screens/Marcador/RegistrarArbolScreen';
import InviteWorkerScreen from '../screens/admin/InviteWorkerScreen';
import ProyectoInfoScreen from '../screens/comunes/ProyectoInfoScreen';

const Drawer = createDrawerNavigator();

const MarcadorDrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{ headerShown: false }}
    drawerContent={(props) => <DrawerContentMarcador {...props} />}
  >
    <Drawer.Screen name="MarcadorTabs" component={MarcadorNavigator} options={{ title: 'Inicio' }} />
    <Drawer.Screen name="Proyectos" component={ProyectosScreen} />
    <Drawer.Screen name="Configuracion" component={ConfiguracionScreen} />
    <Drawer.Screen name="RegistrarArbol" component={RegistrarArbolScreen} options={{ title: 'Registrar Árbol' }} />
    <Drawer.Screen name="InviteWorker" component={InviteWorkerScreen} />
    <Drawer.Screen name="ProyectoInfo" component={ProyectoInfoScreen} />

  </Drawer.Navigator>
);

export default MarcadorDrawerNavigator;