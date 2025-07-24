import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const NotificationScreen = ({ route, navigation }) => {
  const { notification } = route.params || {};

  if (!notification) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No notification data available</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderDataItem = (key, value) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <View key={key} style={styles.dataItem}>
          <Text style={styles.dataKey}>{key}:</Text>
          <View style={styles.nestedData}>
            {Object.entries(value).map(([nestedKey, nestedValue]) =>
              renderDataItem(nestedKey, nestedValue)
            )}
          </View>
        </View>
      );
    }

    return (
      <View key={key} style={styles.dataItem}>
        <Text style={styles.dataKey}>{key}:</Text>
        <Text style={styles.dataValue}>{String(value)}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Details</Text>
        
        <View style={styles.mainInfo}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.body}>{notification.body}</Text>
          {notification.timestamp && (
            <Text style={styles.timestamp}>
              Received: {notification.timestamp}
            </Text>
          )}
        </View>
      </View>

      {notification.data && Object.keys(notification.data).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Data</Text>
          <View style={styles.dataContainer}>
            {Object.entries(notification.data).map(([key, value]) =>
              renderDataItem(key, value)
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raw Notification Object</Text>
        <Text style={styles.rawData}>
          {JSON.stringify(notification, null, 2)}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back to Home</Text>
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
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  mainInfo: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  dataContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
  },
  dataItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  dataKey: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 80,
    marginRight: 10,
  },
  dataValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  nestedData: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
  },
  rawData: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  actions: {
    padding: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default NotificationScreen;
