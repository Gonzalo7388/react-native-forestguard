import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OperadorNavigator from './OperadorNavigator';
import TransporteEnCursoScreen from '../screens/Operador/TransporteEnCursoScreen';
import ConfirmarTransporteTroncosScreen from '../screens/Operador/ConfirmarTransporteTroncosScreen';
const Stack = createNativeStackNavigator();

const OperadorStackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="OperadorTabs" component={OperadorNavigator} />
            <Stack.Screen name="ConfirmarTransporteTroncos" component={ConfirmarTransporteTroncosScreen} />
            {/* ✅ Agregar aquí */}
            <Stack.Screen name="TransporteEnCurso" component={TransporteEnCursoScreen} />
        </Stack.Navigator>
    );
};

export default OperadorStackNavigator;
