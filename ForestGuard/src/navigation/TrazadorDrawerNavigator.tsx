import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import TrazadorNavigator from './TrazadorNavigator';

import ProyectosScreen from '../screens/comunes/ProyectosScreen';
import ConfiguracionScreen from '../screens/comunes/ConfiguracionScreen';
import ProyectoInfoScreen from '../screens/comunes/ProyectoInfoScreen';

import DrawerContentTrazador from './drawer/DrawerContentTrazador';
import GuardarRutaAreaScreen from '../screens/Trazador/GuardarRutaAreaScreen';
import InviteWorkerScreen from '../screens/admin/InviteWorkerScreen';

const Drawer = createDrawerNavigator();

const TrazadorDrawerNavigator = () => (
  <Drawer.Navigator
    screenOptions={{ headerShown: false }}
    drawerContent={(props) => <DrawerContentTrazador {...props} />}
  >
    <Drawer.Screen
      name="TrazadorTabs"
      component={TrazadorNavigator}
      options={{ title: 'Inicio' }}
    />
    <Drawer.Screen
      name="Proyectos"
      component={ProyectosScreen}
      options={{ title: 'Proyectos' }}
    />
    <Drawer.Screen
      name="Configuracion"
      component={ConfiguracionScreen}
      options={{ title: 'Configuración' }}
    />
    <Drawer.Screen
      name="ProyectoInfo"
      component={ProyectoInfoScreen}
      options={{ title: 'Información del Proyecto' }}
    />

    <Drawer.Screen
      name="GuardarRutaArea"
      component={GuardarRutaAreaScreen}
      options={{ title: 'Guardar Ruta/Área' }}
    />
    <Drawer.Screen name="InviteWorker" component={InviteWorkerScreen} />


    {/* Aquí podrás agregar otras pantallas del trazador en el futuro */}
  </Drawer.Navigator>
);

export default TrazadorDrawerNavigator;
