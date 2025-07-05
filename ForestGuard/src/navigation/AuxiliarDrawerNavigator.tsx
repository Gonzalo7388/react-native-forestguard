import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import AuxiliarNavigator from './AuxiliarNavigator';
import DrawerContentAuxiliar from './drawer/DrawerContentAuxiliar';

import MapaRecorridoScreen from '../screens/trabajador/MapaRecorridoScreen';
import AsistenciaScreen from '../screens/trabajador/AsistenciaScreen';
import ControlEquipamientoScreen from '../screens/trabajador/ControlEquipamientoScreen';
import EvaluacionPostJornadaScreen from '../screens/trabajador/EvaluacionPostJornadaScreen';
import ResumenTrabajadorScreen from '../screens/admin/ResumenTrabajadorScreen';
import ConfiguracionScreen from '../screens/comunes/ConfiguracionScreen';
import ProyectosScreen from '../screens/comunes/ProyectosScreen';
import ProyectoInfoScreen from '../screens/comunes/ProyectoInfoScreen';

const Drawer = createDrawerNavigator();

const AuxiliarDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <DrawerContentAuxiliar {...props} />}
    >
      {/* Tabs principales del auxiliar: Mapa, Alertas, ControlEquipos */}
      <Drawer.Screen
        name="AuxiliarTabs"
        component={AuxiliarNavigator}
        options={{ title: 'Inicio' }}
      />

      {/* Funciones específicas del auxiliar */}
      <Drawer.Screen
        name="MapaRecorrido"
        component={MapaRecorridoScreen}
        options={{ title: 'Mapa de Recorridos' }}
      />
      <Drawer.Screen
        name="Asistencia"
        component={AsistenciaScreen}
        options={{ title: 'Registro de Asistencia' }}
      />
      <Drawer.Screen
        name="ControlEquipamiento"
        component={ControlEquipamientoScreen}
        options={{ title: 'Control de Equipamiento' }}
      />
      <Drawer.Screen
        name="EvaluacionPostJornada"
        component={EvaluacionPostJornadaScreen}
        options={{ title: 'Evaluación Post Jornada' }}
      />
      <Drawer.Screen
        name="ResumenTrabajador"
        component={ResumenTrabajadorScreen}
        options={{ title: 'Resumen de Trabajador' }}
      />

      {/* Comunes para todos */}
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
    </Drawer.Navigator>
  );
};

export default AuxiliarDrawerNavigator;
