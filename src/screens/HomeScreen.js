import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import NotificationService from '../services/NotificationService';

const HomeScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    initializeApp();
    setupNotificationListeners();

    return () => {
      // Cleanup listeners when component unmounts
      NotificationService.off('foregroundNotification', handleForegroundNotification);
      NotificationService.off('incomingCall', handleIncomingCall);
      NotificationService.off('callAction', handleCallAction);
      NotificationService.off('notificationOpened', handleNotificationOpened);
    };
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize notification service
      await NotificationService.initialize();
      
      // Get FCM token
      const token = await NotificationService.getFCMToken();
      setFcmToken(token || 'No token available');
      
      // Check notification settings
      const settings = await NotificationService.checkNotificationSettings();
      setNotificationSettings(settings);
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Initialization Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setupNotificationListeners = () => {
    // Listen for foreground notifications
    NotificationService.on('foregroundNotification', handleForegroundNotification);
    
    // Listen for incoming calls
    NotificationService.on('incomingCall', handleIncomingCall);
    
    // Listen for call actions
    NotificationService.on('callAction', handleCallAction);
    
    // Listen for notification opened events
    NotificationService.on('notificationOpened', handleNotificationOpened);
  };

  const handleForegroundNotification = (notification) => {
    console.log('Foreground notification received:', notification);
    
    // Add to notifications list
    setNotifications(prev => [
      {
        id: Date.now().toString(),
        ...notification,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9), // Keep only last 10 notifications
    ]);

    // Show alert for foreground notifications
    Alert.alert(
      notification.title,
      notification.body,
      [
        { text: 'Dismiss', style: 'cancel' },
        { 
          text: 'View', 
          onPress: () => navigation.navigate('Notification', { 
            notification 
          })
        },
      ]
    );
  };

  const handleIncomingCall = (callData) => {
    console.log('Incoming call:', callData);
    
    // Navigate to call screen
    navigation.navigate('Call', {
      callId: callData.callId,
      callerName: callData.callerName,
      callerId: callData.callerId,
      isIncoming: true,
    });
  };

  const handleCallAction = (action) => {
    console.log('Call action:', action);
    
    Alert.alert(
      'Call Action',
      `Call ${action.action}ed by user`,
      [{ text: 'OK' }]
    );
  };

  const handleNotificationOpened = (notification) => {
    console.log('App opened from notification:', notification);
    
    // Handle deep linking based on notification data
    if (notification.data?.type === 'call') {
      navigation.navigate('Call', {
        callId: notification.data.call_id,
        callerName: notification.data.caller_name,
        callerId: notification.data.caller_id,
        isIncoming: false,
      });
    }
  };

  const sendTestNotification = async (type) => {
    try {
      const testData = {
        message: {
          title: 'Test Message',
          body: 'This is a test message notification',
          type: 'message',
        },
        call: {
          title: 'Incoming Call',
          body: 'John Doe is calling...',
          type: 'call',
          caller_name: 'John Doe',
          caller_id: '1234567890',
          call_id: `call_${Date.now()}`,
        },
      };

      await NotificationService.sendTestNotification(testData[type]);
      Alert.alert('Success', `Test ${type} notification sent!`);
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const refreshSettings = async () => {
    try {
      const settings = await NotificationService.checkNotificationSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <Text style={styles.tokenText} numberOfLines={3}>
          {fcmToken}
        </Text>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => {
            Alert.alert('FCM Token', fcmToken);
          }}>
          <Text style={styles.buttonText}>View Full Token</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <Text style={styles.settingText}>
          Notifications Enabled: {notificationSettings.notificationsEnabled ? '✅' : '❌'}
        </Text>
        <Text style={styles.settingText}>
          Battery Optimized: {notificationSettings.batteryOptimized ? '⚠️ Yes' : '✅ No'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={refreshSettings}>
          <Text style={styles.buttonText}>Refresh Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={() => sendTestNotification('message')}>
          <Text style={styles.buttonText}>Send Test Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.callButton]}
          onPress={() => sendTestNotification('call')}>
          <Text style={styles.buttonText}>Send Test Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications received yet</Text>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationItem}
              onPress={() => navigation.navigate('Notification', { notification })}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationBody}>{notification.body}</Text>
              <Text style={styles.notificationTime}>{notification.timestamp}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  settingText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  copyButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 5,
  },
  testButton: {
    backgroundColor: '#FF9800',
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  notificationItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationBody: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
});

export default HomeScreen;
