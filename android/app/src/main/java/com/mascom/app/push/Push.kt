package com.mascom.app.push

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.mascom.app.BuildConfig
import com.mascom.app.MainActivity
import com.mascom.app.R
import com.mascom.app.core.prefs.SettingsStore
import com.mascom.app.di.ApplicationScope
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Push is optional. With a google-services.json in app/, the app subscribes to the `drops` topic
 * (announce a drop from the Firebase console) and `orders` updates addressed to it.
 * Without one, nothing here runs.
 */
@Singleton
class PushRegistrar @Inject constructor(
    @param:ApplicationContext private val context: Context,
    private val settings: SettingsStore,
    @param:ApplicationScope private val scope: CoroutineScope,
) {
    val enabled: Boolean
        get() = BuildConfig.FIREBASE_ENABLED && FirebaseApp.getApps(context).isNotEmpty()

    fun register() {
        createChannels(context)
        if (!enabled) return
        val messaging = FirebaseMessaging.getInstance()
        messaging.subscribeToTopic(TOPIC_DROPS)
        messaging.token.addOnSuccessListener { token -> scope.launch { settings.setPushToken(token) } }
    }

    fun onNewToken(token: String) {
        scope.launch { settings.setPushToken(token) }
    }

    companion object {
        const val TOPIC_DROPS = "drops"
        const val CHANNEL_DROPS = "drops"
        const val CHANNEL_ORDERS = "orders"
        const val EXTRA_ORDER_ID = "orderId"

        fun createChannels(context: Context) {
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannels(
                listOf(
                    NotificationChannel(CHANNEL_DROPS, "New drops", NotificationManager.IMPORTANCE_HIGH)
                        .apply { description = "When fresh merch goes live" },
                    NotificationChannel(CHANNEL_ORDERS, "Order updates", NotificationManager.IMPORTANCE_DEFAULT)
                        .apply { description = "Payment checks and pickup updates" },
                ),
            )
        }
    }
}

@AndroidEntryPoint
class MascomMessagingService : FirebaseMessagingService() {

    @Inject lateinit var registrar: PushRegistrar

    override fun onNewToken(token: String) = registrar.onNewToken(token)

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: return
        val body = message.notification?.body ?: message.data["body"].orEmpty()
        val orderId = message.data[PushRegistrar.EXTRA_ORDER_ID]
        val channel = if (orderId != null) PushRegistrar.CHANNEL_ORDERS else PushRegistrar.CHANNEL_DROPS

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            Log.i("MascomPush", "Notification permission not granted; dropping \"$title\"")
            return
        }

        val open = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            orderId?.let { putExtra(PushRegistrar.EXTRA_ORDER_ID, it) }
        }
        val pending = PendingIntent.getActivity(
            this, title.hashCode(), open, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val notification = NotificationCompat.Builder(this, channel)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(0xFFE0AA0F.toInt())
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()
        NotificationManagerCompat.from(this).notify(title.hashCode(), notification)
    }
}
