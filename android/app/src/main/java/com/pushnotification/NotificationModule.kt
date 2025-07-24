package com.pushnotification

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.google.firebase.messaging.FirebaseMessaging

class NotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "NotificationModule"
    }

    override fun getName(): String {
        return "NotificationModule"
    }

    @ReactMethod
    fun initializeFCM(promise: Promise) {
        try {
            FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                    promise.reject("TOKEN_ERROR", "Failed to get FCM token", task.exception)
                    return@addOnCompleteListener
                }

                val token = task.result
                Log.d(TAG, "FCM Token: $token")

                val result = Arguments.createMap().apply {
                    putString("token", token)
                }
                promise.resolve(result)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing FCM", e)
            promise.reject("INIT_ERROR", "Failed to initialize FCM", e)
        }
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        try {
            val context = reactApplicationContext
            val result = Arguments.createMap()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val areNotificationsEnabled = notificationManager.areNotificationsEnabled()
                result.putBoolean("notifications", areNotificationsEnabled)
                
                if (!areNotificationsEnabled) {
                    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(intent)
                }
            } else {
                result.putBoolean("notifications", true)
            }

            val batteryOptimized = isBatteryOptimized()
            result.putBoolean("batteryOptimized", batteryOptimized)

            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting permissions", e)
            promise.reject("PERMISSION_ERROR", "Failed to request permissions", e)
        }
    }

    @ReactMethod
    fun checkNotificationSettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            val result = Arguments.createMap().apply {
                putBoolean("notificationsEnabled", notificationManager.areNotificationsEnabled())
                putBoolean("batteryOptimized", isBatteryOptimized())
            }

            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking notification settings", e)
            promise.reject("SETTINGS_ERROR", "Failed to check notification settings", e)
        }
    }

    @ReactMethod
    fun requestBatteryOptimizationExemption(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${context.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting battery optimization exemption", e)
            promise.reject("BATTERY_ERROR", "Failed to request battery optimization exemption", e)
        }
    }

    @ReactMethod
    fun handleNotificationTap(data: ReadableMap, promise: Promise) {
        try {
            Log.d(TAG, "Handling notification tap: $data")
            
            val notificationType = if (data.hasKey("type")) data.getString("type") else "default"
            
            val result = Arguments.createMap().apply {
                putString("type", notificationType)
                putBoolean("handled", true)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error handling notification tap", e)
            promise.reject("TAP_ERROR", "Failed to handle notification tap", e)
        }
    }

    @ReactMethod
    fun sendTestNotification(data: ReadableMap, promise: Promise) {
        try {
            val title = if (data.hasKey("title")) data.getString("title") else "Test Notification"
            val body = if (data.hasKey("body")) data.getString("body") else "This is a test notification"
            val type = if (data.hasKey("type")) data.getString("type") else "message"
            
            Log.d(TAG, "Sending test notification: $title - $body")
            
            val testData = mapOf(
                "type" to type,
                "title" to title,
                "body" to body,
                "test" to "true"
            )
            
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending test notification", e)
            promise.reject("TEST_ERROR", "Failed to send test notification", e)
        }
    }

    @ReactMethod
    fun clearAllNotifications(promise: Promise) {
        try {
            val context = reactApplicationContext
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancelAll()
            
            Log.d(TAG, "All notifications cleared")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing notifications", e)
            promise.reject("CLEAR_ERROR", "Failed to clear notifications", e)
        }
    }

    @ReactMethod
    fun getAppState(promise: Promise) {
        try {
            val isInForeground = isAppInForeground()
            
            val result = Arguments.createMap().apply {
                putString("state", if (isInForeground) "foreground" else "background")
                putBoolean("isInForeground", isInForeground)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting app state", e)
            promise.reject("STATE_ERROR", "Failed to get app state", e)
        }
    }

    private fun isBatteryOptimized(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val context = reactApplicationContext
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            !powerManager.isIgnoringBatteryOptimizations(context.packageName)
        } else {
            false
        }
    }

    private fun isAppInForeground(): Boolean {
        return try {
            val reactContext = reactApplicationContext
            reactContext.hasActiveReactInstance()
        } catch (e: Exception) {
            false
        }
    }
}
