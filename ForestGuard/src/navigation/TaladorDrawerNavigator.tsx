// src/navigation/TaladorDrawerNavigator.tsx

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import TaladorNavigator from './TaladorNavigator';

import ProyectosScreen from '../screens/comunes/ProyectosScreen';
import ConfiguracionScreen from '../screens/comunes/ConfiguracionScreen';
import ProyectoInfoScreen from '../screens/comunes/ProyectoInfoScreen';

import DrawerContentTalador from './drawer/DrawerContentTalador';
import ConfirmarTalaArbolScreen from '../screens/Talador/ConfirmarTalaArbolScreen';

const Drawer = createDrawerNavigator();

const TaladorDrawerNavigator = () => (
    <Drawer.Navigator
        screenOptions={{ headerShown: false }}
        drawerContent={(props) => <DrawerContentTalador {...props} />}
    >
        <Drawer.Screen
            name="TaladorTabs"
            component={TaladorNavigator}
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
            name="ConfirmarTalaArbol"
            component={ConfirmarTalaArbolScreen}
            options={{ title: 'Confirmar Tala Árbol' }}
        />

        {/* Aquí podrás agregar otras pantallas específicas del talador en el futuro si deseas */}
    </Drawer.Navigator>
);

export default TaladorDrawerNavigator;
