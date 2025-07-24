package com.pushnotification

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationActionReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "NotificationActionReceiver"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        val callId = intent.getStringExtra("call_id") ?: ""
        
        Log.d(TAG, "Received action: $action for call: $callId")

        when (action) {
            "ACCEPT_CALL" -> handleAcceptCall(context, callId)
            "DECLINE_CALL" -> handleDeclineCall(context, callId)
        }

        clearNotification(context)
    }

    private fun handleAcceptCall(context: Context, callId: String) {
        Log.d(TAG, "Call accepted from notification")
        sendCallActionToReactNative("accept", callId)
        openMainApp(context, callId)
    }

    private fun handleDeclineCall(context: Context, callId: String) {
        Log.d(TAG, "Call declined from notification")
        sendCallActionToReactNative("decline", callId)
    }

    private fun sendCallActionToReactNative(action: String, callId: String) {
        try {
            val reactContext = MainApplication.getReactNativeHost()?.reactInstanceManager?.currentReactContext as? ReactApplicationContext
            reactContext?.let {
                val params = Arguments.createMap().apply {
                    putString("action", action)
                    putString("call_id", callId)
                    putString("source", "notification")
                }
                it.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onCallAction", params)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending call action to React Native", e)
        }
    }

    private fun openMainApp(context: Context, callId: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("from_notification", true)
            putExtra("call_id", callId)
        }
        context.startActivity(intent)
    }

    private fun clearNotification(context: Context) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
    }
}
