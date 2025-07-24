import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import NotificationService from '../services/NotificationService';

const CallScreen = ({ route, navigation }) => {
  const { callId, callerName, callerId, isIncoming } = route.params || {};
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connected');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval;
    
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [callStatus]);

  useEffect(() => {
    // Listen for call actions from native side
    const handleCallAction = (action) => {
      if (action.call_id === callId) {
        if (action.action === 'accept') {
          acceptCall();
        } else if (action.action === 'decline') {
          declineCall();
        }
      }
    };

    NotificationService.on('callAction', handleCallAction);

    return () => {
      NotificationService.off('callAction', handleCallAction);
    };
  }, [callId]);

  const acceptCall = () => {
    console.log('Call accepted');
    setCallStatus('connected');
    setCallDuration(0);
    
    Alert.alert(
      'Call Connected',
      `Connected to ${callerName}`,
      [{ text: 'OK' }]
    );
  };

  const declineCall = () => {
    console.log('Call declined');
    setCallStatus('ended');
    
    Alert.alert(
      'Call Declined',
      `Call from ${callerName} was declined`,
      [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]
    );
  };

  const endCall = () => {
    console.log('Call ended');
    setCallStatus('ended');
    
    Alert.alert(
      'Call Ended',
      `Call with ${callerName} has ended`,
      [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]
    );
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'incoming':
        return 'Incoming call...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'incoming':
        return '#FF9800';
      case 'connected':
        return '#4CAF50';
      case 'ended':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.callerInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {callerName ? callerName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        
        <Text style={styles.callerName}>{callerName || 'Unknown Caller'}</Text>
        <Text style={styles.callerId}>{callerId || 'No number'}</Text>
        
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      <View style={styles.callActions}>
        {callStatus === 'incoming' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={declineCall}>
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={acceptCall}>
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}

        {callStatus === 'connected' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.endButton]}
            onPress={endCall}>
            <Text style={styles.actionButtonText}>End Call</Text>
          </TouchableOpacity>
        )}

        {callStatus === 'ended' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.backButton]}
            onPress={() => navigation.goBack()}>
            <Text style={styles.actionButtonText}>Back to Home</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.callInfo}>
        <Text style={styles.callInfoText}>Call ID: {callId || 'Unknown'}</Text>
        <Text style={styles.callInfoText}>
          Type: {isIncoming ? 'Incoming' : 'Outgoing'}
        </Text>
        <Text style={styles.callInfoText}>
          Status: {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'space-between',
    padding: 20,
  },
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  callerName: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerId: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 40,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  endButton: {
    backgroundColor: '#F44336',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  backButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  callInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
  },
  callInfoText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default CallScreen;
