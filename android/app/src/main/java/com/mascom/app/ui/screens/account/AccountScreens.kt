package com.mascom.app.ui.screens.account

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Badge
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.Dns
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Palette
import androidx.compose.material.icons.rounded.Phone
import androidx.compose.material.icons.rounded.PhotoCamera
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.mascom.app.BuildConfig
import com.mascom.app.core.prefs.SettingsStore
import com.mascom.app.core.prefs.ThemeMode
import com.mascom.app.data.content.SiteContent
import com.mascom.app.domain.model.ProfileEdit
import com.mascom.app.domain.model.Role
import com.mascom.app.domain.model.User
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.InlineError
import com.mascom.app.ui.components.ListRow
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MascomTextField
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RowDivider
import com.mascom.app.ui.components.SectionHeader
import com.mascom.app.ui.components.Wordmark
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.Mascom
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AccountViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val settings: SettingsStore,
) : ViewModel() {
    val user: StateFlow<User?> = auth.user
    val theme: StateFlow<ThemeMode> = settings.themeMode.stateIn(viewModelScope, SharingStarted.Eagerly, ThemeMode.System)

    private val _avatarBusy = MutableStateFlow(false)
    val avatarBusy = _avatarBusy.asStateFlow()
    private val _message = MutableStateFlow<String?>(null)
    val message = _message.asStateFlow()

    init {
        viewModelScope.launch { auth.refresh() }
    }

    fun setTheme(mode: ThemeMode) = viewModelScope.launch { settings.setThemeMode(mode) }
    fun signOut() = viewModelScope.launch { auth.signOut() }

    fun setAvatar(uri: Uri) {
        viewModelScope.launch {
            _avatarBusy.value = true
            _message.value = auth.updateAvatar(uri).exceptionOrNull()?.message
            _avatarBusy.value = false
        }
    }
}

@Composable
fun AccountScreen(
    onEdit: () -> Unit,
    onAbout: () -> Unit,
    onWelcome: () -> Unit,
    onSignIn: () -> Unit,
    onSignUp: () -> Unit,
    vm: AccountViewModel = hiltViewModel(),
    server: ServerViewModel = hiltViewModel(),
) {
    val user by vm.user.collectAsStateWithLifecycle()
    val theme by vm.theme.collectAsStateWithLifecycle()
    val avatarBusy by vm.avatarBusy.collectAsStateWithLifecycle()
    val message by vm.message.collectAsStateWithLifecycle()
    val baseUrl by server.baseUrl.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val c = Mascom.colors
    var showServer by remember { mutableStateOf(false) }
    var themeMenu by remember { mutableStateOf(false) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri -> uri?.let(vm::setAvatar) }

    GlassScaffold(title = if (user != null) "You" else "Account") {
        val u = user
        if (u == null) {
            item(key = "guest") {
                Card {
                    Wordmark()
                    Spacer(Modifier.height(12.dp))
                    Text("Sign in to order merch, track your pickups, and hear about drops first.", style = MaterialTheme.typography.bodyMedium, color = c.label2)
                    Spacer(Modifier.height(16.dp))
                    MascomButton("Sign in", onSignIn, Modifier.fillMaxWidth())
                    Spacer(Modifier.height(8.dp))
                    MascomButton("Create an account", onSignUp, Modifier.fillMaxWidth(), kind = ButtonKind.Secondary)
                }
            }
        } else {
            item(key = "profile") {
                Card {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(68.dp)
                                .clip(CircleShape)
                                .background(c.tintGlow)
                                .pressable({ picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }, label = "Change photo"),
                            contentAlignment = Alignment.Center,
                        ) {
                            if (u.profilePicUrl != null) {
                                RemoteImage(u.profilePicUrl, u.name, Modifier.fillMaxSize())
                            } else {
                                Text(u.name.split(' ').mapNotNull { it.firstOrNull() }.take(2).joinToString(""), style = MaterialTheme.typography.headlineSmall, color = c.tint)
                            }
                            if (avatarBusy) CircularProgressIndicator(Modifier.size(28.dp), color = c.tint, strokeWidth = 2.dp)
                        }
                        Spacer(Modifier.width(14.dp))
                        Column(Modifier.weight(1f)) {
                            Text(u.name, style = MaterialTheme.typography.headlineSmall)
                            Text(u.email, style = MaterialTheme.typography.bodySmall, color = c.label2)
                            val roles = u.roles.filter { it != Role.Student }.joinToString(" · ") { it.name }
                            if (roles.isNotEmpty()) Text(roles, style = MaterialTheme.typography.labelMedium, color = c.tint)
                        }
                        Icon(Icons.Rounded.CameraAlt, "Change photo", tint = c.label3, modifier = Modifier.size(20.dp))
                    }
                }
                message?.let { InlineError(it, Modifier.padding(top = 10.dp)) }
            }
            item(key = "details") {
                SectionHeader("Details") {
                    Text("Edit", style = MaterialTheme.typography.titleSmall, color = c.tint, modifier = Modifier.pressable(onEdit))
                }
                Card(padding = PaddingValues(vertical = 4.dp)) {
                    ListRow("Roll no.", value = u.rollNo.orDash(), icon = Icons.Rounded.Badge, onClick = onEdit)
                    RowDivider(58.dp)
                    ListRow("Section", value = u.section.orDash(), icon = Icons.Rounded.Badge, iconTint = c.info, onClick = onEdit)
                    RowDivider(58.dp)
                    ListRow(
                        "Room",
                        value = listOfNotNull(u.hostel, u.block, u.roomNo).filter { it.isNotBlank() }.joinToString(" · ").ifEmpty { "—" },
                        icon = Icons.Rounded.Home, iconTint = c.ok, onClick = onEdit,
                    )
                    RowDivider(58.dp)
                    ListRow("Phone", value = u.phone.orDash(), icon = Icons.Rounded.Phone, iconTint = c.warn, onClick = onEdit)
                }
            }
        }

        item(key = "app") {
            SectionHeader("App")
            Card(padding = PaddingValues(vertical = 4.dp)) {
                Box {
                    ListRow(
                        "Appearance",
                        value = theme.name,
                        icon = Icons.Rounded.Palette,
                        iconTint = c.info,
                        showChevron = true,
                        onClick = { themeMenu = true },
                    )
                    DropdownMenu(themeMenu, onDismissRequest = { themeMenu = false }, modifier = Modifier.background(c.surface)) {
                        ThemeMode.entries.forEach { mode ->
                            DropdownMenuItem(text = { Text(mode.name) }, onClick = { vm.setTheme(mode); themeMenu = false })
                        }
                    }
                }
                RowDivider(58.dp)
                ListRow("About MASCOM", icon = Icons.Rounded.Info, showChevron = true, onClick = onAbout)
                RowDivider(58.dp)
                ListRow("Welcome screen", icon = Icons.Rounded.AutoAwesome, iconTint = c.tint, showChevron = true, onClick = onWelcome)
                RowDivider(58.dp)
                ListRow(
                    "Instagram",
                    value = SiteContent.INSTAGRAM_HANDLE,
                    icon = Icons.Rounded.PhotoCamera,
                    iconTint = c.danger,
                    onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(SiteContent.INSTAGRAM))) },
                )
                RowDivider(58.dp)
                ListRow(
                    "Server",
                    subtitle = baseUrl.removeSuffix("/"),
                    icon = Icons.Rounded.Dns,
                    iconTint = c.label2,
                    showChevron = true,
                    onClick = { showServer = true },
                )
            }
        }

        if (user != null) {
            item(key = "signout") {
                Spacer(Modifier.height(22.dp))
                Card(padding = PaddingValues(vertical = 4.dp)) {
                    ListRow("Sign out", icon = Icons.AutoMirrored.Rounded.Logout, iconTint = c.danger, titleColor = c.danger, onClick = vm::signOut)
                }
            }
        }

        item(key = "version") {
            Text(
                "MASCOM for Android · ${BuildConfig.VERSION_NAME}",
                style = MaterialTheme.typography.bodySmall,
                color = c.label3,
                modifier = Modifier.fillMaxWidth().padding(top = 20.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
    }

    if (showServer) ServerDialog(baseUrl, server::save) { showServer = false }
}

private fun String?.orDash() = this?.takeIf { it.isNotBlank() } ?: "—"

@HiltViewModel
class EditProfileViewModel @Inject constructor(private val auth: AuthRepository) : ViewModel() {
    private val _form = MutableStateFlow(
        auth.user.value.let { u ->
            ProfileEdit(
                name = u?.name.orEmpty(), phone = u?.phone.orEmpty(), rollNo = u?.rollNo.orEmpty(),
                section = u?.section.orEmpty(), hostel = u?.hostel.orEmpty(), block = u?.block.orEmpty(),
                roomNo = u?.roomNo.orEmpty(), gender = u?.gender,
            )
        },
    )
    val form = _form.asStateFlow()
    private val _busy = MutableStateFlow(false)
    val busy = _busy.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()
    private val _saved = Channel<Unit>(Channel.CONFLATED)
    val saved = _saved.receiveAsFlow()

    fun edit(transform: (ProfileEdit) -> ProfileEdit) {
        _form.update(transform)
        _error.value = null
    }

    fun save() {
        if (_form.value.name.trim().length < 2) {
            _error.value = "Your name needs at least 2 characters."
            return
        }
        viewModelScope.launch {
            _busy.value = true
            auth.updateProfile(_form.value)
                .onSuccess { _saved.send(Unit) }
                .onFailure { _error.value = it.message }
            _busy.value = false
        }
    }
}

@Composable
fun EditProfileScreen(onBack: () -> Unit, vm: EditProfileViewModel = hiltViewModel()) {
    val form by vm.form.collectAsStateWithLifecycle()
    val busy by vm.busy.collectAsStateWithLifecycle()
    val error by vm.error.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) { vm.saved.collect { onBack() } }

    GlassScaffold(
        title = "Your details",
        largeTitle = false,
        onBack = onBack,
        bottomBar = { MascomButton("Save", vm::save, Modifier.fillMaxWidth(), loading = busy) },
    ) {
        item {
            Text(
                "The team uses these to hand over your order, so keep your room current.",
                style = MaterialTheme.typography.bodyMedium,
                color = Mascom.colors.label2,
                modifier = Modifier.padding(4.dp, 8.dp, 4.dp, 16.dp),
            )
            Column {
                MascomTextField(form.name, { v -> vm.edit { it.copy(name = v.take(80)) } }, "Full name")
                Spacer(Modifier.height(10.dp))
                Row {
                    MascomTextField(form.rollNo, { v -> vm.edit { it.copy(rollNo = v.take(32)) } }, "Roll no.", Modifier.weight(1f))
                    Spacer(Modifier.width(10.dp))
                    MascomTextField(form.section, { v -> vm.edit { it.copy(section = v.take(8)) } }, "Section", Modifier.weight(0.6f))
                }
                Spacer(Modifier.height(10.dp))
                MascomTextField(form.phone, { v -> vm.edit { it.copy(phone = v.take(20)) } }, "Phone", keyboardType = KeyboardType.Phone)
                SectionHeader("Where to find you")
                MascomTextField(form.hostel, { v -> vm.edit { it.copy(hostel = v.take(40)) } }, "Hostel")
                Spacer(Modifier.height(10.dp))
                Row {
                    MascomTextField(form.block, { v -> vm.edit { it.copy(block = v.take(20)) } }, "Block", Modifier.weight(1f))
                    Spacer(Modifier.width(10.dp))
                    MascomTextField(
                        form.roomNo, { v -> vm.edit { it.copy(roomNo = v.take(20)) } }, "Room", Modifier.weight(1f),
                        imeAction = ImeAction.Done, onImeAction = vm::save,
                    )
                }
                SectionHeader("Gender")
                Row {
                    listOf("Male", "Female", "Other").forEach { g ->
                        val selected = form.gender == g
                        MascomButton(
                            g,
                            { vm.edit { it.copy(gender = if (selected) null else g) } },
                            Modifier.weight(1f).padding(end = 8.dp),
                            kind = if (selected) ButtonKind.Primary else ButtonKind.Secondary,
                            height = 42.dp,
                        )
                    }
                }
                error?.let { InlineError(it, Modifier.padding(top = 14.dp)) }
            }
        }
    }
}
