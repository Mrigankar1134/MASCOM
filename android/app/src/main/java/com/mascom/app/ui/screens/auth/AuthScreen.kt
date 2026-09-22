package com.mascom.app.ui.screens.auth

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.glass
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.mascom.app.data.content.SiteContent
import com.mascom.app.domain.model.NewAccount
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.ui.components.InlineError
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MascomTextField
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RoundIconButton
import com.mascom.app.ui.components.Wordmark
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.screens.account.ServerDialog
import com.mascom.app.ui.screens.account.ServerViewModel
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthForm(
    val signUp: Boolean = false,
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val rollNo: String = "",
    val section: String = "",
    val phone: String = "",
    val busy: Boolean = false,
    val error: String? = null,
) {
    val passwordHint get() = when {
        !signUp || password.isEmpty() -> null
        password.length < 8 -> "At least 8 characters"
        password.none(Char::isLetter) || password.none(Char::isDigit) -> "Use at least one letter and one number"
        else -> null
    }
    val canSubmit get() = !busy && email.contains('@') && password.isNotEmpty() &&
        (!signUp || (name.trim().length >= 2 && passwordHint == null))
}

@HiltViewModel
class AuthViewModel @Inject constructor(private val auth: AuthRepository) : ViewModel() {
    private val _form = MutableStateFlow(AuthForm())
    val form = _form.asStateFlow()

    private val _done = Channel<Unit>(Channel.CONFLATED)
    val done = _done.receiveAsFlow()

    fun setMode(signUp: Boolean) = _form.update { it.copy(signUp = signUp, error = null) }
    fun edit(transform: (AuthForm) -> AuthForm) = _form.update { transform(it).copy(error = null) }

    fun submit() {
        val f = _form.value
        if (!f.canSubmit) return
        viewModelScope.launch {
            _form.update { it.copy(busy = true, error = null) }
            val result = if (f.signUp) {
                auth.signUp(NewAccount(f.name, f.email, f.password, f.rollNo, f.section, f.phone))
            } else {
                auth.signIn(f.email, f.password)
            }
            result
                .onSuccess { _done.send(Unit) }
                .onFailure { e -> _form.update { it.copy(busy = false, error = e.message) } }
        }
    }
}

@Composable
fun AuthScreen(
    startWithSignUp: Boolean,
    onDone: () -> Unit,
    onClose: () -> Unit,
    vm: AuthViewModel = hiltViewModel(),
    server: ServerViewModel = hiltViewModel(),
) {
    val form by vm.form.collectAsStateWithLifecycle()
    val baseUrl by server.baseUrl.collectAsStateWithLifecycle()
    val c = Mascom.colors
    val focus = LocalFocusManager.current
    var showServer by remember { mutableStateOf(false) }

    LaunchedEffect(startWithSignUp) { vm.setMode(startWithSignUp) }
    LaunchedEffect(Unit) { vm.done.collect { onDone() } }

    val haze = rememberHazeState()
    Box(Modifier.fillMaxSize().background(c.page)) {
        Aurora(Modifier.fillMaxSize().hazeSource(haze))

        Column(
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
        ) {
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Wordmark(Modifier.weight(1f))
                RoundIconButton(onClick = onClose, contentDescription = "Close") { Icon(Icons.Rounded.Close, null, Modifier.size(20.dp)) }
            }
            Spacer(Modifier.height(72.dp))
            AnimatedContent(
                targetState = form.signUp,
                transitionSpec = {
                    (fadeIn(tween(260, delayMillis = 60)) + slideInVertically(tween(320)) { it / 3 }) togetherWith
                        (fadeOut(tween(140)) + slideOutVertically(tween(200)) { -it / 3 })
                },
                modifier = Modifier.appear(0),
                label = "auth-title",
            ) { signUp ->
                Column {
                    Text(if (signUp) "Make an account" else "Welcome back", style = MaterialTheme.typography.displayMedium)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        if (signUp) "Use your college email. It takes a minute." else "Sign in with your college email to order.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = c.label2,
                    )
                }
            }
            Spacer(Modifier.height(22.dp))

            // The form sits on frosted glass over the drifting background.
            Column(
                Modifier
                    .appear(1)
                    .glass(haze, RoundedCornerShape(Radii.sheet / 1.5f))
                    .padding(16.dp)
                    .animateContentSize(spring(dampingRatio = 0.85f, stiffness = 380f)),
            ) {
            ModeSwitch(form.signUp, vm::setMode)
            Spacer(Modifier.height(18.dp))

            Column {
                AnimatedVisibility(form.signUp, enter = expandVertically() + fadeIn(), exit = shrinkVertically() + fadeOut()) {
                    MascomTextField(form.name, { v -> vm.edit { it.copy(name = v) } }, "Full name", Modifier.padding(bottom = 10.dp))
                }
                MascomTextField(
                    form.email, { v -> vm.edit { it.copy(email = v) } }, "College email",
                    placeholder = "you@iimamritsar.ac.in", keyboardType = KeyboardType.Email,
                )
                Spacer(Modifier.height(10.dp))
                MascomTextField(
                    form.password, { v -> vm.edit { it.copy(password = v) } }, "Password",
                    isPassword = true, keyboardType = KeyboardType.Password,
                    imeAction = if (form.signUp) ImeAction.Next else ImeAction.Done,
                    onImeAction = { if (!form.signUp) { focus.clearFocus(); vm.submit() } },
                    error = form.passwordHint,
                )
                AnimatedVisibility(form.signUp, enter = expandVertically() + fadeIn(), exit = shrinkVertically() + fadeOut()) {
                    Column {
                        Spacer(Modifier.height(10.dp))
                        Row {
                            MascomTextField(form.rollNo, { v -> vm.edit { it.copy(rollNo = v.take(32)) } }, "Roll no.", Modifier.weight(1f))
                            Spacer(Modifier.width(10.dp))
                            MascomTextField(form.section, { v -> vm.edit { it.copy(section = v.take(8)) } }, "Section", Modifier.weight(0.6f))
                        }
                        Spacer(Modifier.height(10.dp))
                        MascomTextField(
                            form.phone, { v -> vm.edit { it.copy(phone = v.take(20)) } }, "Phone (optional)",
                            keyboardType = KeyboardType.Phone, imeAction = ImeAction.Done,
                            onImeAction = { focus.clearFocus(); vm.submit() },
                        )
                    }
                }
            }

            form.error?.let {
                Spacer(Modifier.height(12.dp))
                InlineError(it)
            }
            Spacer(Modifier.height(18.dp))
            MascomButton(
                text = if (form.signUp) "Create account" else "Sign in",
                onClick = { focus.clearFocus(); vm.submit() },
                enabled = form.canSubmit,
                loading = form.busy,
                modifier = Modifier.fillMaxWidth(),
            )
            }

            Spacer(Modifier.height(28.dp))
            SiteContent.portalPoints.forEachIndexed { index, point ->
                Row(Modifier.padding(vertical = 5.dp).appear(index + 2), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(22.dp).clip(CircleShape).background(c.tintGlow), contentAlignment = Alignment.Center) {
                        Icon(Icons.Rounded.Check, null, tint = c.tint, modifier = Modifier.size(14.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Text(point, style = MaterialTheme.typography.bodyMedium, color = c.label2)
                }
            }

            Spacer(Modifier.height(24.dp))
            Text(
                "Server: ${baseUrl.removeSuffix("/")} · Change",
                style = MaterialTheme.typography.bodySmall,
                color = c.label3,
                modifier = Modifier.align(Alignment.CenterHorizontally).pressable({ showServer = true }).padding(8.dp),
            )
            Spacer(Modifier.height(16.dp).navigationBarsPadding())
        }
    }

    if (showServer) ServerDialog(baseUrl, server::save) { showServer = false }
}

/** Slow-drifting pools of gold and rose light: the backdrop the frosted form floats over. */
@Composable
private fun Aurora(modifier: Modifier) {
    val c = Mascom.colors
    val t = rememberInfiniteTransition(label = "aurora")
    val phase by t.animateFloat(0f, 1f, infiniteRepeatable(tween(16000, easing = LinearEasing)), label = "phase")
    val strength = if (c.isDark) 0.75f else 1f
    Canvas(modifier) {
        val w = size.width
        val h = size.height
        val p = phase * 2 * PI
        fun blob(color: Color, x: Float, y: Float, radius: Float) {
            val center = Offset(x, y)
            drawCircle(Brush.radialGradient(listOf(color, Color.Transparent), center, radius), radius, center)
        }
        blob(Gold.g400.copy(alpha = 0.55f * strength), w * (0.25f + 0.18f * cos(p).toFloat()), h * (0.14f + 0.06f * sin(p).toFloat()), w * 0.8f)
        blob(Color(0xFFF472B6).copy(alpha = 0.26f * strength), w * (0.88f + 0.1f * sin(p * 1.3).toFloat()), h * (0.3f + 0.08f * cos(p).toFloat()), w * 0.62f)
        blob(Gold.g600.copy(alpha = 0.32f * strength), w * (0.45f + 0.22f * sin(p * 0.7).toFloat()), h * (0.62f + 0.06f * cos(p * 1.1).toFloat()), w * 0.75f)
    }
}

/** An iOS segmented control with a sliding glass thumb. */
@Composable
private fun ModeSwitch(signUp: Boolean, onChange: (Boolean) -> Unit) {
    val c = Mascom.colors
    BoxWithConstraints(
        Modifier
            .fillMaxWidth()
            .height(40.dp)
            .clip(RoundedCornerShape(Radii.sm + 2.dp))
            .background(c.fill.copy(alpha = if (c.isDark) 0.5f else 0.24f))
            .padding(3.dp),
    ) {
        val half = maxWidth / 2
        val offset by animateDpAsState(if (signUp) half else 0.dp, label = "thumb")
        Box(
            Modifier
                .offset(x = offset)
                .width(half)
                .fillMaxHeight()
                .clip(RoundedCornerShape(Radii.sm))
                .background(if (c.isDark) c.surface2 else Color.White),
        )
        Row(Modifier.fillMaxSize()) {
            listOf(false to "Sign in", true to "Sign up").forEach { (mode, label) ->
                Box(Modifier.weight(1f).fillMaxHeight().pressable({ onChange(mode) }, pressedScale = 1f), contentAlignment = Alignment.Center) {
                    Text(label, style = MaterialTheme.typography.titleSmall, color = if (mode == signUp) c.label else c.label2)
                }
            }
        }
    }
}
