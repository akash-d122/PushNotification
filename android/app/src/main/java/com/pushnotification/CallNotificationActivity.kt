package com.pushnotification

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallNotificationActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "CallNotificationActivity"
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var callerName: String = ""
    private var callerId: String = ""
    private var callId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d(TAG, "CallNotificationActivity created")
        
        setupLockScreenActivity()
        extractCallData()
        setupUI()
        startRingtoneAndVibration()
    }

    private fun setupLockScreenActivity() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun extractCallData() {
        callerName = intent.getStringExtra("caller_name") ?: "Unknown Caller"
        callerId = intent.getStringExtra("caller_id") ?: ""
        callId = intent.getStringExtra("call_id") ?: ""
        
        Log.d(TAG, "Call data - Name: $callerName, ID: $callerId, CallID: $callId")
    }

    private fun setupUI() {
        setContentView(createCallLayout())
    }

    private fun createCallLayout(): View {
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(50, 100, 50, 100)
            setBackgroundColor(android.graphics.Color.parseColor("#1a1a1a"))
        }

        val nameTextView = TextView(this).apply {
            text = callerName
            textSize = 28f
            setTextColor(android.graphics.Color.WHITE)
            gravity = android.view.Gravity.CENTER
            setPadding(0, 50, 0, 20)
        }

        val statusTextView = TextView(this).apply {
            text = "Incoming call..."
            textSize = 18f
            setTextColor(android.graphics.Color.GRAY)
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 100)
        }

        val buttonContainer = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
        }

        val declineButton = Button(this).apply {
            text = "Decline"
            setBackgroundColor(android.graphics.Color.RED)
            setTextColor(android.graphics.Color.WHITE)
            setPadding(40, 20, 40, 20)
            setOnClickListener { declineCall() }
        }

        val acceptButton = Button(this).apply {
            text = "Accept"
            setBackgroundColor(android.graphics.Color.GREEN)
            setTextColor(android.graphics.Color.WHITE)
            setPadding(40, 20, 40, 20)
            setOnClickListener { acceptCall() }
        }

        val layoutParams = android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(20, 0, 20, 0)
        }

        buttonContainer.addView(declineButton, layoutParams)
        buttonContainer.addView(acceptButton, layoutParams)

        layout.addView(nameTextView)
        layout.addView(statusTextView)
        layout.addView(buttonContainer)

        return layout
    }

    private fun startRingtoneAndVibration() {
        try {
            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            mediaPlayer = MediaPlayer().apply {
                setDataSource(this@CallNotificationActivity, ringtoneUri)
                setAudioStreamType(AudioManager.STREAM_RING)
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting ringtone", e)
        }

        try {
            vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            val pattern = longArrayOf(0, 1000, 500, 1000)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting vibration", e)
        }
    }

    private fun acceptCall() {
        Log.d(TAG, "Call accepted")
        stopRingtoneAndVibration()
        sendCallActionToReactNative("accept")
        openMainApp()
        finish()
    }

    private fun declineCall() {
        Log.d(TAG, "Call declined")
        stopRingtoneAndVibration()
        sendCallActionToReactNative("decline")
        finish()
    }

    private fun stopRingtoneAndVibration() {
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.stop()
            }
            it.release()
        }
        mediaPlayer = null
        vibrator?.cancel()
    }

    private fun sendCallActionToReactNative(action: String) {
        try {
            val reactContext = MainApplication.getReactNativeHost()?.reactInstanceManager?.currentReactContext as? ReactApplicationContext
            reactContext?.let {
                val params = Arguments.createMap().apply {
                    putString("action", action)
                    putString("call_id", callId)
                    putString("caller_name", callerName)
                    putString("caller_id", callerId)
                }
                it.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onCallAction", params)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending call action to React Native", e)
        }
    }

    private fun openMainApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("from_call", true)
            putExtra("call_id", callId)
            putExtra("caller_name", callerName)
        }
        startActivity(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRingtoneAndVibration()
        Log.d(TAG, "CallNotificationActivity destroyed")
    }

    override fun onBackPressed() {
        // Prevent back button from closing the call screen
        // User must explicitly accept or decline
    }
}
