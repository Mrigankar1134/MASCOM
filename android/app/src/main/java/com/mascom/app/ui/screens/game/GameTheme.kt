package com.mascom.app.ui.screens.game

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.LocalMascomColors
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.MascomColors
import com.mascom.app.ui.theme.MascomTypography
import com.mascom.app.ui.theme.Radii
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Campus Heist keeps its own palette whatever the rest of the app is set to: a night-time vault in
 * deep navy, gold for coins, teal for a clean escape and red for the alarm. Everything else in the
 * app reads these through [LocalMascomColors], so shared components come along without changes.
 */
val GameColors = MascomColors(
    isDark = true,
    page = Color(0xFF060A18),
    surface = Color(0xFF111A38),
    surface2 = Color(0xFF1A2550),
    label = Color(0xF7FFFFFF),
    label2 = Color(0xAEC3CEF0),
    label3 = Color(0x7AC3CEF0),
    label4 = Color(0x3DC3CEF0),
    separator = Color(0x2EFFFFFF),
    fill = Color(0x4D4C5C99),
    tint = Color(0xFFF3CB5C),
    tintSolid = Color(0xFFEFC233),
    tintContrast = Color(0xFF1F1602),
    tintGlow = Color(0x4DEFC233),
    ok = Color(0xFF2DD4BF),
    warn = Color(0xFFFFC44D),
    danger = Color(0xFFFF4D6D),
    info = Color(0xFF6EA8FF),
    glass = Color(0x99111A38),
    glassEdge = Color(0x24FFFFFF),
)

private val GameScheme = darkColorScheme(
    primary = GameColors.tintSolid,
    onPrimary = GameColors.tintContrast,
    primaryContainer = Gold.g700,
    onPrimaryContainer = Gold.g100,
    secondary = GameColors.ok,
    onSecondary = Color(0xFF042F2A),
    background = GameColors.page,
    onBackground = GameColors.label,
    surface = GameColors.surface,
    onSurface = GameColors.label,
    surfaceVariant = GameColors.surface2,
    onSurfaceVariant = GameColors.label2,
    surfaceContainer = GameColors.surface,
    surfaceContainerHigh = GameColors.surface2,
    surfaceContainerHighest = GameColors.surface2,
    outline = GameColors.separator,
    outlineVariant = GameColors.separator,
    error = GameColors.danger,
)

@Composable
fun GameTheme(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalMascomColors provides GameColors) {
        MaterialTheme(colorScheme = GameScheme, typography = MascomTypography) {
            CompositionLocalProvider(LocalContentColor provides GameColors.label, content = content)
        }
    }
}

/**
 * The backdrop every heist screen frosts: a slow sweep of vault light. Two pools drift on long,
 * out-of-phase cycles so a screen left open never looks frozen.
 */
@Composable
fun GameBackdrop(modifier: Modifier = Modifier) {
    val t = rememberInfiniteTransition(label = "vault")
    val phase by t.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(26_000, easing = LinearEasing)),
        label = "phase",
    )
    val pulse by t.animateFloat(
        initialValue = 0.75f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(tween(5200, easing = LinearEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    Canvas(modifier) {
        val w = size.width
        val h = size.height
        drawRect(Brush.verticalGradient(listOf(Color(0xFF0B1330), Color(0xFF05091A)), 0f, h))

        fun pool(color: Color, x: Float, y: Float, radius: Float) {
            val center = Offset(x, y)
            drawCircle(Brush.radialGradient(listOf(color, color.copy(alpha = 0f)), center, radius), radius, center)
        }
        val a = (phase * 2 * PI).toFloat()
        pool(Gold.g400.copy(alpha = 0.22f * pulse), w * (0.18f + 0.1f * cos(a)), h * (0.18f + 0.05f * sin(a)), w * 0.75f)
        pool(Color(0xFF2DD4BF).copy(alpha = 0.14f), w * (0.9f - 0.12f * sin(a)), h * (0.55f + 0.07f * cos(a)), w * 0.6f)
        pool(Color(0xFFFF4D6D).copy(alpha = 0.12f * pulse), w * 0.1f, h * (0.95f + 0.04f * sin(a)), w * 0.65f)
        // A faint floor grid, so the vault has a room around it.
        val step = h / 14f
        var y = h * 0.55f
        while (y < h) {
            drawLine(Color.White.copy(alpha = 0.03f), Offset(0f, y), Offset(w, y), strokeWidth = 1f)
            y += step
        }
    }
}

/** A coin amount, always written the same way: gold, tabular, with the coin mark. */
@Composable
fun Coins(
    amount: Int,
    modifier: Modifier = Modifier,
    size: androidx.compose.ui.unit.TextUnit = 17.sp,
    color: Color = Mascom.colors.tint,
) {
    Row(modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .size(with(androidx.compose.ui.platform.LocalDensity.current) { (size.value * 0.78f).dp })
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(Gold.g200, Gold.g500))),
        )
        Spacer(Modifier.width(5.dp))
        Text(
            "$amount",
            style = MaterialTheme.typography.titleMedium.copy(fontSize = size, fontWeight = FontWeight.Bold),
            color = color,
        )
    }
}

/** A small state chip: "3 left", "ALARM", "ESCAPED". */
@Composable
fun GameChip(
    text: String,
    modifier: Modifier = Modifier,
    tone: Color = Mascom.colors.label2,
    icon: ImageVector? = null,
    filled: Boolean = false,
) {
    Row(
        modifier
            .clip(CircleShape)
            .background(if (filled) tone else tone.copy(alpha = 0.16f))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(icon, null, Modifier.size(13.dp), tint = if (filled) Color.Black.copy(alpha = 0.75f) else tone)
            Spacer(Modifier.width(5.dp))
        }
        Text(
            text.uppercase(),
            style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.08.em),
            color = if (filled) Color.Black.copy(alpha = 0.8f) else tone,
        )
    }
}

/** One number in the header strip: points, rank, attempts left. */
@Composable
fun StatTile(label: String, value: String, modifier: Modifier = Modifier, tone: Color = Mascom.colors.label) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            value,
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
            color = tone,
            textAlign = TextAlign.Center,
        )
        Text(
            label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = Mascom.colors.label3,
            textAlign = TextAlign.Center,
        )
    }
}

/** A transient line of feedback that slides in under the title and clears itself. */
@Composable
fun GameToast(message: String?, onDismiss: () -> Unit, modifier: Modifier = Modifier) {
    LaunchedEffect(message) {
        if (message != null) {
            kotlinx.coroutines.delay(3200)
            onDismiss()
        }
    }
    AnimatedVisibility(
        visible = message != null,
        modifier = modifier,
        enter = slideInVertically { -it } + fadeIn(),
        exit = slideOutVertically { -it } + fadeOut(),
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Radii.md))
                .background(Mascom.colors.surface2.copy(alpha = 0.96f))
                .padding(horizontal = 14.dp, vertical = 10.dp),
        ) {
            Text(message.orEmpty(), style = MaterialTheme.typography.bodyMedium, color = Mascom.colors.label)
        }
    }
}

/** The section heading used down the heist screens. */
@Composable
fun GameSection(title: String, modifier: Modifier = Modifier, trailing: @Composable () -> Unit = {}) {
    Row(
        modifier.fillMaxWidth().padding(start = 4.dp, end = 4.dp, top = 24.dp, bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            title.uppercase(),
            style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.16.em),
            color = Mascom.colors.tint,
        )
        trailing()
    }
}
