package com.pushnotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_PACKAGE_REPLACED -> {
                Log.d(TAG, "Boot completed or package replaced: ${intent.action}")
                initializeAfterBoot(context)
            }
        }
    }

    private fun initializeAfterBoot(context: Context) {
        Log.d(TAG, "Initializing app components after boot")
        
        // Initialize any necessary services or components
        // for receiving push notifications after device boot
        // Firebase handles most initialization automatically
    }
}
