package com.pushnotification

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

class CallForegroundService : Service() {

    companion object {
        private const val TAG = "CallForegroundService"
        private const val FOREGROUND_CHANNEL_ID = "call_foreground_service"
        private const val FOREGROUND_NOTIFICATION_ID = 2001
    }

    private var callerName: String = ""
    private var callerId: String = ""
    private var callId: String = ""

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "CallForegroundService created")
        createForegroundNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "CallForegroundService started")

        intent?.let {
            callerName = it.getStringExtra("caller_name") ?: "Unknown Caller"
            callerId = it.getStringExtra("caller_id") ?: ""
            callId = it.getStringExtra("call_id") ?: ""
        }

        startForeground(FOREGROUND_NOTIFICATION_ID, createForegroundNotification())
        launchCallNotificationActivity()

        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "CallForegroundService destroyed")
    }

    private fun createForegroundNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                FOREGROUND_CHANNEL_ID,
                "Call Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Foreground service for handling incoming calls"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createForegroundNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, FOREGROUND_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("Handling incoming call")
            .setContentText("Processing call from $callerName")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun launchCallNotificationActivity() {
        val callIntent = Intent(this, CallNotificationActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("caller_name", callerName)
            putExtra("caller_id", callerId)
            putExtra("call_id", callId)
            putExtra("from_service", true)
        }

        try {
            startActivity(callIntent)
            Log.d(TAG, "Call notification activity launched")
        } catch (e: Exception) {
            Log.e(TAG, "Error launching call notification activity", e)
        }
    }

    fun stopService() {
        Log.d(TAG, "Stopping foreground service")
        stopForeground(true)
        stopSelf()
    }
}
