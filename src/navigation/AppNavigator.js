import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CallScreen from '../screens/CallScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['pushnotificationapp://'],
  config: {
    screens: {
      Home: '',
      Call: 'call/:callId',
      Notification: 'notification/:notificationId',
      Settings: 'settings',
    },
  },
};

const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Push Notifications Demo',
          }}
        />
        <Stack.Screen
          name="Call"
          component={CallScreen}
          options={({ route }) => ({
            title: `Call - ${route.params?.callerName || 'Unknown'}`,
          })}
        />
        <Stack.Screen
          name="Notification"
          component={NotificationScreen}
          options={{
            title: 'Notification Details',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Notification Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
