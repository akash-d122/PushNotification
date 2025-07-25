/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);

  // Background messages are handled by the native FCMService
  // This handler provides additional JavaScript-level processing if needed
});

AppRegistry.registerComponent(appName, () => App);
