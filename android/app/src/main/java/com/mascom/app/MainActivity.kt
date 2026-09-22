package com.mascom.app

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.core.network.ServerConfig
import com.mascom.app.core.prefs.ThemeMode
import com.mascom.app.push.PushRegistrar
import com.mascom.app.ui.AppViewModel
import com.mascom.app.ui.components.LocalUrlResolver
import com.mascom.app.ui.navigation.MascomRoot
import com.mascom.app.ui.theme.MascomTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var serverConfig: ServerConfig
    @Inject lateinit var push: PushRegistrar

    private val app: AppViewModel by viewModels()
    private var pendingOrderId by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        // Hold the splash until we know whether this is a first run (welcome) or not (shop).
        installSplashScreen().setKeepOnScreenCondition { app.welcomeSeen.value == null }
        super.onCreate(savedInstanceState)
        pendingOrderId = intent.getStringExtra(PushRegistrar.EXTRA_ORDER_ID)

        setContent {
            val mode by app.themeMode.collectAsStateWithLifecycle()
            val dark = when (mode) {
                ThemeMode.Dark -> true
                ThemeMode.Light -> false
                ThemeMode.System -> androidx.compose.foundation.isSystemInDarkTheme()
            }
            LaunchedEffect(dark) {
                val style = if (dark) {
                    SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
                } else {
                    SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT)
                }
                enableEdgeToEdge(statusBarStyle = style, navigationBarStyle = style)
            }

            val askNotifications = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
            LaunchedEffect(Unit) {
                if (push.enabled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }

            MascomTheme(mode) {
                CompositionLocalProvider(LocalUrlResolver provides serverConfig::resolve) {
                    val welcomeSeen by app.welcomeSeen.collectAsStateWithLifecycle()
                    welcomeSeen?.let { seen ->
                        MascomRoot(app, showWelcome = !seen, openOrderId = pendingOrderId, onOrderOpened = { pendingOrderId = null })
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.getStringExtra(PushRegistrar.EXTRA_ORDER_ID)?.let { pendingOrderId = it }
    }
}
