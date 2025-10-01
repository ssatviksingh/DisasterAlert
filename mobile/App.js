import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlertsScreen from './src/screens/AlertsScreen';
import SOSScreen from './src/screens/SOSScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Alerts">
        <Stack.Screen name="Alerts" component={AlertsScreen} />
        <Stack.Screen name="SOS" component={SOSScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
