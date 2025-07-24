import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { NotificationModule } = NativeModules;

class NotificationService {
  constructor() {
    this.listeners = [];
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing NotificationService...');

      // Request permissions first
      await this.requestPermissions();

      // Initialize FCM
      const result = await NotificationModule.initializeFCM();
      console.log('FCM initialized with token:', result.token);

      // Store token
      await AsyncStorage.setItem('fcm_token', result.token);

      // Set up listeners
      this.setupListeners();

      // Handle initial notification (app opened from notification)
      await this.handleInitialNotification();

      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
      throw error;
    }
  }

  async requestPermissions() {
    try {
      console.log('Requesting notification permissions...');

      // Request FCM permissions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('Notification permissions not granted');
      }

      // Request Android-specific permissions
      if (Platform.OS === 'android') {
        const result = await NotificationModule.requestPermissions();
        console.log('Android permissions result:', result);

        if (result.batteryOptimized) {
          console.warn('App is battery optimized - notifications may be delayed');
          // Optionally request battery optimization exemption
          // await NotificationModule.requestBatteryOptimizationExemption();
        }
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  setupListeners() {
    console.log('Setting up notification listeners...');

    // FCM token refresh listener
    const tokenRefreshListener = messaging().onTokenRefresh(token => {
      console.log('FCM token refreshed:', token);
      AsyncStorage.setItem('fcm_token', token);
      this.emit('tokenRefresh', { token });
    });

    // Foreground message listener
    const foregroundListener = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      this.handleForegroundNotification(remoteMessage);
    });

    // Background message handler (must be outside component)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message received:', remoteMessage);
      // Background messages are handled by the native FCMService
    });

    // Native event listeners
    const notificationReceivedListener = DeviceEventEmitter.addListener(
      'onNotificationReceived',
      notification => {
        console.log('Native notification received:', notification);
        this.emit('notificationReceived', notification);
      }
    );

    const callActionListener = DeviceEventEmitter.addListener(
      'onCallAction',
      action => {
        console.log('Call action received:', action);
        this.emit('callAction', action);
      }
    );

    const tokenRefreshNativeListener = DeviceEventEmitter.addListener(
      'onTokenRefresh',
      data => {
        console.log('Native token refresh:', data);
        AsyncStorage.setItem('fcm_token', data.token);
        this.emit('tokenRefresh', data);
      }
    );

    // Store listeners for cleanup
    this.listeners = [
      tokenRefreshListener,
      foregroundListener,
      notificationReceivedListener,
      callActionListener,
      tokenRefreshNativeListener,
    ];
  }

  async handleInitialNotification() {
    try {
      // Check if app was opened from a notification
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('App opened from notification:', initialNotification);
        this.emit('notificationOpened', initialNotification);
      }
    } catch (error) {
      console.error('Error handling initial notification:', error);
    }
  }

  handleForegroundNotification(remoteMessage) {
    const { data, notification } = remoteMessage;
    
    // Emit event for React Native components to handle
    this.emit('foregroundNotification', {
      title: notification?.title || 'New Notification',
      body: notification?.body || '',
      data: data || {},
    });

    // For call notifications, you might want to show an in-app modal
    if (data?.type === 'call') {
      this.emit('incomingCall', {
        callerName: data.caller_name || 'Unknown Caller',
        callerId: data.caller_id || '',
        callId: data.call_id || '',
      });
    }
  }

  async getFCMToken() {
    try {
      // Try to get from AsyncStorage first
      let token = await AsyncStorage.getItem('fcm_token');
      
      if (!token) {
        // Get fresh token from Firebase
        token = await messaging().getToken();
        if (token) {
          await AsyncStorage.setItem('fcm_token', token);
        }
      }
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async checkNotificationSettings() {
    try {
      if (Platform.OS === 'android') {
        return await NotificationModule.checkNotificationSettings();
      }
      return { notificationsEnabled: true, batteryOptimized: false };
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return { notificationsEnabled: false, batteryOptimized: true };
    }
  }

  async clearAllNotifications() {
    try {
      if (Platform.OS === 'android') {
        await NotificationModule.clearAllNotifications();
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  async sendTestNotification(data = {}) {
    try {
      const testData = {
        title: data.title || 'Test Notification',
        body: data.body || 'This is a test notification',
        type: data.type || 'message',
        ...data,
      };

      if (Platform.OS === 'android') {
        await NotificationModule.sendTestNotification(testData);
      }
      
      console.log('Test notification sent:', testData);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = {};
    }
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners || !this.eventListeners[event]) {
      return;
    }
    this.eventListeners[event] = this.eventListeners[event].filter(
      cb => cb !== callback
    );
  }

  emit(event, data) {
    if (!this.eventListeners || !this.eventListeners[event]) {
      return;
    }
    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Cleanup
  destroy() {
    console.log('Destroying NotificationService...');
    
    // Remove FCM listeners
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener();
      }
    });

    // Clear event listeners
    if (this.eventListeners) {
      Object.keys(this.eventListeners).forEach(event => {
        this.eventListeners[event] = [];
      });
    }

    this.isInitialized = false;
  }
}

// Export singleton instance
export default new NotificationService();
