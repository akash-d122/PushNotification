/**
 * Push Notification Demo App
 * React Native app with WhatsApp-like call notifications
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
