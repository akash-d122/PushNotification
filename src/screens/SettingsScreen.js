import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import NotificationService from '../services/NotificationService';

const SettingsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Get notification settings
      const notificationSettings = await NotificationService.checkNotificationSettings();
      setSettings(notificationSettings);
      
      // Get FCM token
      const token = await NotificationService.getFCMToken();
      setFcmToken(token || 'No token available');
      
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted');
        loadSettings(); // Refresh settings
      } else {
        Alert.alert('Permission Denied', 'Notification permissions were not granted');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const requestBatteryOptimization = async () => {
    try {
      Alert.alert(
        'Battery Optimization',
        'To ensure notifications work properly when the app is closed, please disable battery optimization for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: async () => {
              await NotificationService.requestBatteryOptimizationExemption();
              // Refresh settings after user returns
              setTimeout(loadSettings, 2000);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting battery optimization:', error);
      Alert.alert('Error', 'Failed to open battery optimization settings');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await NotificationService.clearAllNotifications();
      Alert.alert('Success', 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const copyTokenToClipboard = () => {
    Alert.alert(
      'FCM Token',
      fcmToken,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Share', onPress: () => {
          console.log('Token to share:', fcmToken);
        }},
      ]
    );
  };

  const testNotificationTypes = [
    { key: 'message', label: 'Test Message Notification', color: '#2196F3' },
    { key: 'call', label: 'Test Call Notification', color: '#4CAF50' },
  ];

  const sendTestNotification = async (type) => {
    try {
      await NotificationService.sendTestNotification({ type });
      Alert.alert('Success', `Test ${type} notification sent!`);
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Permissions</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications Enabled</Text>
          <View style={styles.settingValue}>
            <Text style={[
              styles.statusText,
              { color: settings.notificationsEnabled ? '#4CAF50' : '#F44336' }
            ]}>
              {settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>

        {!settings.notificationsEnabled && (
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={requestNotificationPermissions}>
            <Text style={styles.buttonText}>Enable Notifications</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Battery Optimization</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Battery Optimized</Text>
          <View style={styles.settingValue}>
            <Text style={[
              styles.statusText,
              { color: settings.batteryOptimized ? '#F44336' : '#4CAF50' }
            ]}>
              {settings.batteryOptimized ? 'Yes (Not Recommended)' : 'No (Recommended)'}
            </Text>
          </View>
        </View>

        {settings.batteryOptimized && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Battery optimization is enabled. This may prevent notifications 
              from working when the app is closed.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.warningButton]}
              onPress={requestBatteryOptimization}>
              <Text style={styles.buttonText}>Disable Battery Optimization</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <Text style={styles.tokenText} numberOfLines={4}>
          {fcmToken}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={copyTokenToClipboard}>
          <Text style={styles.buttonText}>View/Copy Token</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        <Text style={styles.sectionDescription}>
          Send test notifications to verify functionality
        </Text>
        
        {testNotificationTypes.map((test) => (
          <TouchableOpacity
            key={test.key}
            style={[styles.button, { backgroundColor: test.color }]}
            onPress={() => sendTestNotification(test.key)}>
            <Text style={styles.buttonText}>{test.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={loadSettings}>
          <Text style={styles.buttonText}>Refresh Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearAllNotifications}>
          <Text style={styles.buttonText}>Clear All Notifications</Text>
        </TouchableOpacity>
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
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  settingValue: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 10,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
