package com.mascom.app.ui.screens.account

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mascom.app.core.network.ServerConfig
import com.mascom.app.core.prefs.SettingsStore
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.domain.repository.ShopRepository
import com.mascom.app.ui.components.MascomTextField
import com.mascom.app.ui.theme.Mascom
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Which MASCOM server the app talks to. Switching signs you out, since sessions are per server. */
@HiltViewModel
class ServerViewModel @Inject constructor(
    private val settings: SettingsStore,
    private val auth: AuthRepository,
    private val shop: ShopRepository,
    private val config: ServerConfig,
) : ViewModel() {
    val baseUrl: StateFlow<String> =
        settings.baseUrl.stateIn(viewModelScope, SharingStarted.Eagerly, config.baseUrl.toString())

    /** Returns an error message, or null when the address was accepted. */
    fun save(raw: String): String? {
        val url = ServerConfig.normalize(raw) ?: return "That doesn't look like a web address."
        if (url.toString() == config.baseUrl.toString()) return null
        viewModelScope.launch {
            auth.signOut()
            settings.setBaseUrl(url.toString())
            config.update(url.toString())
            shop.refresh()
        }
        return null
    }
}

@Composable
fun ServerDialog(current: String, onSave: (String) -> String?, onDismiss: () -> Unit) {
    var value by remember { mutableStateOf(current) }
    var error by remember { mutableStateOf<String?>(null) }
    val submit = {
        error = onSave(value)
        if (error == null) onDismiss()
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Mascom.colors.surface,
        title = { Text("Server") },
        text = {
            Column {
                Text(
                    "The MASCOM site this app connects to. Changing it signs you out.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Mascom.colors.label2,
                )
                Spacer(Modifier.height(14.dp))
                MascomTextField(
                    value = value,
                    onValueChange = { value = it; error = null },
                    label = "Address",
                    placeholder = "https://mascom.example.in",
                    keyboardType = KeyboardType.Uri,
                    imeAction = ImeAction.Done,
                    onImeAction = { submit() },
                    error = error,
                )
            }
        },
        confirmButton = { TextButton(onClick = { submit() }) { Text("Save", color = Mascom.colors.tint) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = Mascom.colors.label2) } },
    )
}
