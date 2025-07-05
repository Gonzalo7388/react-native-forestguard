// src/navigation/OperadorDrawerNavigator.tsx

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import OperadorNavigator from './OperadorNavigator';

import ProyectosScreen from '../screens/comunes/ProyectosScreen';
import ConfiguracionScreen from '../screens/comunes/ConfiguracionScreen';
import ProyectoInfoScreen from '../screens/comunes/ProyectoInfoScreen';
import ConfirmarTransporteTroncosScreen from '../screens/Operador/ConfirmarTransporteTroncosScreen';
import TransporteEnCursoScreen from '../screens/Operador/TransporteEnCursoScreen';
import DrawerContentOperador from './drawer/DrawerContentOperador';

const Drawer = createDrawerNavigator();

const OperadorDrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{ headerShown: false }}
    drawerContent={(props) => <DrawerContentOperador {...props} />}
  >
    <Drawer.Screen
      name="OperadorTabs"
      component={OperadorNavigator}
      options={{ title: 'Inicio' }}
    />
    <Drawer.Screen
      name="Proyectos"
      component={ProyectosScreen}
      options={{ title: 'Proyectos' }}
    />
    <Drawer.Screen
      name="ProyectoInfo"
      component={ProyectoInfoScreen}
      options={{ title: 'Información del Proyecto' }}
    />
    <Drawer.Screen
      name="Configuracion"
      component={ConfiguracionScreen}
      options={{ title: 'Configuración' }}
    />
    <Drawer.Screen
      name="ConfirmarTransporteTroncos"
      component={ConfirmarTransporteTroncosScreen}
      options={{ title: 'Confirmar Transporte Troncos' }}
    />
    <Drawer.Screen
      name="TransporteEnCurso"
      component={TransporteEnCursoScreen}
      options={{ title: 'Transporte En Curso' }}
    />

    

    {/* Puedes agregar pantallas específicas adicionales aquí en el futuro */}
  </Drawer.Navigator>
);

export default OperadorDrawerNavigator;
