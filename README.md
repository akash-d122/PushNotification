# React Native Push Notifications - WhatsApp Style

A comprehensive React Native application demonstrating advanced push notification capabilities with WhatsApp-like call notifications. This project showcases cross-platform notification handling across all app states (foreground, background, and killed) with Android 15 compatibility.

## 🚀 Features

- **WhatsApp-like Call Notifications**: Full-screen call interface with accept/decline actions
- **Multi-State Support**: Works in foreground, background, and killed app states
- **Android 15 Compatible**: Implements latest Android notification and foreground service APIs
- **Firebase Cloud Messaging**: Real-time push notification delivery
- **Deep Linking**: Navigate to specific screens from notifications
- **Native Android Modules**: Custom Java/Kotlin modules for advanced notification handling
- **Battery Optimization Handling**: Ensures notifications work even with power management
- **Comprehensive UI**: Multiple screens for testing and configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (18+)
- **React Native CLI**
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 11 or higher
- **Firebase Account** for FCM setup

## 🛠️ Installation

### Step 1: Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd PushNotification
npm install
```

### Step 2: Firebase Configuration

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project named `PushNotificationApp`
   - Enable Google Analytics (optional)

2. **Add Android App**:
   - Click "Add app" → Android
   - Package name: `com.pushnotification`
   - App nickname: `Push Notification App`
   - Download `google-services.json`

3. **Place Configuration File**:
   ```bash
   # Place the downloaded file in:
   android/app/google-services.json
   ```

4. **Enable Cloud Messaging**:
   - In Firebase Console, go to "Cloud Messaging"
   - Service should be automatically enabled

### Step 3: Android Setup

1. **Build the Android App**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. **Grant Permissions**:
   - Allow notification permissions when prompted
   - Disable battery optimization for the app (recommended)

## 🔧 Configuration

### Android Permissions

The app automatically requests these permissions:
- `POST_NOTIFICATIONS` - For showing notifications (Android 13+)
- `WAKE_LOCK` - To wake device for notifications
- `VIBRATE` - For notification vibration
- `FOREGROUND_SERVICE` - For background notification handling
- `USE_FULL_SCREEN_INTENT` - For call-like notifications

### Battery Optimization

For reliable notifications when the app is closed:
1. Go to Settings → Apps → Push Notification App
2. Battery → Battery optimization
3. Select "Don't optimize" for this app

## 📱 Usage

### Testing Notifications

1. **Launch the App**:
   - The home screen displays your FCM token
   - Check notification settings status

2. **Send Test Notifications**:
   - Use the "Send Test Message" button for regular notifications
   - Use the "Send Test Call" button for call-style notifications

3. **Firebase Console Testing**:
   - Go to Firebase Console → Cloud Messaging
   - Click "Send your first message"
   - Use your FCM token as the target

### Testing Different App States

1. **Foreground**: App is open and visible
   - Notifications appear as in-app alerts
   - Call notifications show the call screen

2. **Background**: App is minimized
   - System notifications appear in notification tray
   - Tapping opens the app to relevant screen

3. **Killed**: App is force-closed
   - Notifications still appear via foreground service
   - Tapping launches the app with deep linking

## 🧪 Testing with Firebase Console

### Message Notification
```json
{
  "to": "YOUR_FCM_TOKEN",
  "notification": {
    "title": "Test Message",
    "body": "This is a test message notification"
  },
  "data": {
    "type": "message"
  }
}
```

### Call Notification
```json
{
  "to": "YOUR_FCM_TOKEN",
  "priority": "high",
  "data": {
    "type": "call",
    "caller_name": "John Doe",
    "caller_id": "1234567890",
    "call_id": "call_123456"
  },
  "notification": {
    "title": "Incoming Call",
    "body": "John Doe is calling..."
  }
}
```

## 🏗️ Architecture

### Native Android Components

- **FCMService**: Handles Firebase Cloud Messaging
- **CallNotificationActivity**: Full-screen call interface
- **CallForegroundService**: Background service for Android 15
- **NotificationModule**: React Native bridge module
- **NotificationActionReceiver**: Handles notification actions

### React Native Components

- **NotificationService**: Main service for notification handling
- **AppNavigator**: Navigation with deep linking support
- **HomeScreen**: Main interface with testing controls
- **CallScreen**: Call interface matching native activity
- **SettingsScreen**: Configuration and permissions management

## 🔍 Troubleshooting

### Common Issues

1. **Notifications not appearing when app is killed**:
   - Ensure battery optimization is disabled
   - Check that FCM high-priority messages are being sent
   - Verify foreground service permissions

2. **FCM token not generating**:
   - Ensure `google-services.json` is in the correct location
   - Check Firebase project configuration
   - Verify internet connectivity

3. **Call notifications not showing full screen**:
   - Grant "Display over other apps" permission
   - Ensure `USE_FULL_SCREEN_INTENT` permission is granted
   - Check Android Do Not Disturb settings

4. **Build errors**:
   ```bash
   # Clean and rebuild
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

### Android 15 Specific Issues

- **Foreground Service Restrictions**: Ensure proper service type declaration
- **Notification Permissions**: Handle runtime permission requests
- **Battery Optimization**: Guide users to whitelist the app

## 📚 API Reference

### NotificationService Methods

```javascript
// Initialize the service
await NotificationService.initialize();

// Get FCM token
const token = await NotificationService.getFCMToken();

// Request permissions
const granted = await NotificationService.requestPermissions();

// Send test notification
await NotificationService.sendTestNotification({
  type: 'call',
  caller_name: 'John Doe'
});

// Check settings
const settings = await NotificationService.checkNotificationSettings();
```

### Event Listeners

```javascript
// Listen for foreground notifications
NotificationService.on('foregroundNotification', (notification) => {
  console.log('Received:', notification);
});

// Listen for call actions
NotificationService.on('callAction', (action) => {
  console.log('Call action:', action.action); // 'accept' or 'decline'
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different Android versions
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase team for Cloud Messaging documentation
- React Native community for excellent libraries and tools
- Android development community for notification best practices
