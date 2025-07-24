package com.pushnotification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FCMService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"
        private const val CALL_CHANNEL_ID = "call_notifications"
        private const val CALL_CHANNEL_NAME = "Incoming Calls"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.d(TAG, "FCMService created")
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: ${remoteMessage.from}")
        Log.d(TAG, "Message data payload: ${remoteMessage.data}")

        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
        }

        handleNotification(remoteMessage)
    }

    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        sendTokenToReactNative(token)
        sendRegistrationToServer(token)
    }

    private fun handleNotification(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        val notificationType = data["type"] ?: "default"
        
        when (notificationType) {
            "call" -> handleCallNotification(data)
            "message" -> handleMessageNotification(data)
            else -> handleDefaultNotification(remoteMessage)
        }
        
        sendNotificationToReactNative(data)
    }

    private fun handleCallNotification(data: Map<String, String>) {
        val callerName = data["caller_name"] ?: "Unknown Caller"
        val callerId = data["caller_id"] ?: ""
        val callId = data["call_id"] ?: ""
        
        Log.d(TAG, "Handling call notification from: $callerName")
        
        if (isAppInForeground()) {
            Log.d(TAG, "App in foreground, sending to React Native")
            return
        }
        
        showCallNotification(callerName, callerId, callId)
        startCallForegroundService(data)
    }

    private fun handleMessageNotification(data: Map<String, String>) {
        val title = data["title"] ?: "New Message"
        val body = data["body"] ?: ""
        showMessageNotification(title, body)
    }

    private fun handleDefaultNotification(remoteMessage: RemoteMessage) {
        val title = remoteMessage.notification?.title ?: "Push Notification"
        val body = remoteMessage.notification?.body ?: ""
        showDefaultNotification(title, body)
    }

    private fun showCallNotification(callerName: String, callerId: String, callId: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val callIntent = Intent(this, CallNotificationActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("caller_name", callerName)
            putExtra("caller_id", callerId)
            putExtra("call_id", callId)
            putExtra("notification_type", "call")
        }
        
        val callPendingIntent = PendingIntent.getActivity(
            this, 0, callIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val acceptIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "ACCEPT_CALL"
            putExtra("call_id", callId)
        }
        val acceptPendingIntent = PendingIntent.getBroadcast(
            this, 1, acceptIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val declineIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "DECLINE_CALL"
            putExtra("call_id", callId)
        }
        val declinePendingIntent = PendingIntent.getBroadcast(
            this, 2, declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("Incoming Call")
            .setContentText("$callerName is calling...")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(callPendingIntent, true)
            .setOngoing(true)
            .setAutoCancel(false)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declinePendingIntent)
            .addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
            .setVibrate(longArrayOf(0, 1000, 500, 1000))
            .build()
        
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun showMessageNotification(title: String, body: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        
        notificationManager.notify(NOTIFICATION_ID + 1, notification)
    }

    private fun showDefaultNotification(title: String, body: String) {
        showMessageNotification(title, body)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CALL_CHANNEL_ID,
                CALL_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Channel for incoming call notifications"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 500, 1000)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                    null
                )
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun isAppInForeground(): Boolean {
        return try {
            val reactContext = MainApplication.getReactNativeHost()?.reactInstanceManager?.currentReactContext
            reactContext != null
        } catch (e: Exception) {
            false
        }
    }

    private fun startCallForegroundService(data: Map<String, String>) {
        val serviceIntent = Intent(this, CallForegroundService::class.java).apply {
            putExtra("caller_name", data["caller_name"])
            putExtra("caller_id", data["caller_id"])
            putExtra("call_id", data["call_id"])
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun sendTokenToReactNative(token: String) {
        try {
            val reactContext = MainApplication.getReactNativeHost()?.reactInstanceManager?.currentReactContext as? ReactApplicationContext
            reactContext?.let {
                val params = Arguments.createMap().apply {
                    putString("token", token)
                }
                it.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onTokenRefresh", params)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending token to React Native", e)
        }
    }

    private fun sendNotificationToReactNative(data: Map<String, String>) {
        try {
            val reactContext = MainApplication.getReactNativeHost()?.reactInstanceManager?.currentReactContext as? ReactApplicationContext
            reactContext?.let {
                val params = Arguments.createMap()
                data.forEach { (key, value) ->
                    params.putString(key, value)
                }
                it.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onNotificationReceived", params)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending notification to React Native", e)
        }
    }

    private fun sendRegistrationToServer(token: String) {
        // Send token to your backend server for user registration
        Log.d(TAG, "Sending token to server: $token")
        // Implement your server communication logic here
    }
}
