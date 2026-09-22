package com.mascom.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.mascom.app.R
import com.mascom.app.core.prefs.ThemeMode

/** The web app's design tokens (src/app/globals.css), light and dark. */
@Immutable
data class MascomColors(
    val isDark: Boolean,
    val page: Color,
    val surface: Color,
    val surface2: Color,
    val label: Color,
    val label2: Color,
    val label3: Color,
    val label4: Color,
    val separator: Color,
    val fill: Color,
    val tint: Color,
    val tintSolid: Color,
    val tintContrast: Color,
    val tintGlow: Color,
    val ok: Color,
    val warn: Color,
    val danger: Color,
    val info: Color,
    val glass: Color,
    val glassEdge: Color,
)

object Gold {
    val g100 = Color(0xFFFAEEBD)
    val g200 = Color(0xFFF6E08C)
    val g300 = Color(0xFFF2D05A)
    val g400 = Color(0xFFEFC233)
    val g500 = Color(0xFFE0AA0F)
    val g600 = Color(0xFFB8850A)
    val g700 = Color(0xFF8D6408)
}

val LightColors = MascomColors(
    isDark = false,
    page = Color(0xFFF2F2F7),
    surface = Color.White,
    surface2 = Color(0xFFF2F2F7),
    label = Color(0xEB000000),
    label2 = Color(0x9E3C3C43),
    label3 = Color(0x6B3C3C43),
    label4 = Color(0x423C3C43),
    separator = Color(0x2E3C3C43),
    fill = Color(0x33787880),
    tint = Color(0xFF97690B),
    tintSolid = Color(0xFFF0C53A),
    tintContrast = Color(0xFF1F1602),
    tintGlow = Color(0x42E0AA0F),
    ok = Color(0xFF1C7A45),
    warn = Color(0xFF9A5B00),
    danger = Color(0xFFC0271D),
    info = Color(0xFF0A62CF),
    glass = Color(0xB8FFFFFF),
    glassEdge = Color(0x99FFFFFF),
)

val DarkColors = MascomColors(
    isDark = true,
    page = Color.Black,
    surface = Color(0xFF1C1C1E),
    surface2 = Color(0xFF2C2C2E),
    label = Color(0xF5FFFFFF),
    label2 = Color(0x9EEBEBF5),
    label3 = Color(0x6BEBEBF5),
    label4 = Color(0x38EBEBF5),
    separator = Color(0xB8545458),
    fill = Color(0x5C787880),
    tint = Color(0xFFF5CF55),
    tintSolid = Color(0xFFEFC233),
    tintContrast = Color(0xFF1F1602),
    tintGlow = Color(0x3DEFC233),
    ok = Color(0xFF30D158),
    warn = Color(0xFFFFD426),
    danger = Color(0xFFFF5F57),
    info = Color(0xFF64A8FF),
    glass = Color(0x9E1C1C1E),
    glassEdge = Color(0x24FFFFFF),
)

val LocalMascomColors = staticCompositionLocalOf { LightColors }

@OptIn(ExperimentalTextApi::class)
private fun inter(weight: Int) = Font(
    resId = R.font.inter,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

val Inter = FontFamily(inter(400), inter(500), inter(600), inter(700), inter(800))

private fun style(size: Double, weight: Int, lineHeight: Double, tracking: Double = 0.0) = TextStyle(
    fontFamily = Inter,
    fontSize = size.sp,
    fontWeight = FontWeight(weight),
    lineHeight = lineHeight.sp,
    letterSpacing = tracking.em,
)

/** The Apple-style type scale from globals.css, mapped onto Material's slots. */
val MascomTypography = Typography(
    displayLarge = style(40.0, 800, 44.0, -0.035),
    displayMedium = style(34.0, 700, 41.0, -0.03),   // large title
    displaySmall = style(28.0, 700, 34.0, -0.025),   // title 1
    headlineLarge = style(28.0, 700, 34.0, -0.025),
    headlineMedium = style(22.0, 700, 28.0, -0.02),  // title 2
    headlineSmall = style(20.0, 600, 25.0, -0.015),  // title 3
    titleLarge = style(20.0, 600, 25.0, -0.015),
    titleMedium = style(17.0, 600, 22.0, -0.01),     // headline
    titleSmall = style(15.0, 600, 20.0, -0.005),
    bodyLarge = style(17.0, 400, 22.0, -0.01),       // body
    bodyMedium = style(15.0, 400, 20.0, -0.005),     // subhead
    bodySmall = style(13.0, 400, 18.0),              // footnote
    labelLarge = style(16.0, 600, 21.0, -0.01),      // callout, used on buttons
    labelMedium = style(12.0, 500, 16.0),            // caption 1
    labelSmall = style(11.0, 600, 13.0, 0.06),       // caption 2 / eyebrows
)

@Composable
fun MascomTheme(mode: ThemeMode = ThemeMode.System, content: @Composable () -> Unit) {
    val dark = when (mode) {
        ThemeMode.System -> isSystemInDarkTheme()
        ThemeMode.Light -> false
        ThemeMode.Dark -> true
    }
    val c = if (dark) DarkColors else LightColors
    val scheme = if (dark) {
        darkColorScheme(
            primary = c.tintSolid, onPrimary = c.tintContrast, primaryContainer = Gold.g700,
            onPrimaryContainer = Gold.g100, secondary = c.tint, onSecondary = c.tintContrast,
            background = c.page, onBackground = c.label, surface = c.surface, onSurface = c.label,
            surfaceVariant = c.surface2, onSurfaceVariant = c.label2, surfaceContainer = c.surface,
            surfaceContainerHigh = c.surface2, surfaceContainerHighest = c.surface2,
            outline = c.separator, outlineVariant = c.separator, error = c.danger,
        )
    } else {
        lightColorScheme(
            primary = c.tintSolid, onPrimary = c.tintContrast, primaryContainer = Gold.g100,
            onPrimaryContainer = Gold.g700, secondary = c.tint, onSecondary = Color.White,
            background = c.page, onBackground = c.label, surface = c.surface, onSurface = c.label,
            surfaceVariant = c.surface2, onSurfaceVariant = c.label2, surfaceContainer = c.surface,
            surfaceContainerHigh = c.surface, surfaceContainerHighest = c.surface2,
            outline = c.separator, outlineVariant = c.separator, error = c.danger,
        )
    }
    CompositionLocalProvider(LocalMascomColors provides c) {
        MaterialTheme(colorScheme = scheme, typography = MascomTypography) {
            // Text without an explicit colour reads LocalContentColor, which is black by default.
            CompositionLocalProvider(LocalContentColor provides c.label, content = content)
        }
    }
}

object Mascom {
    val colors: MascomColors
        @Composable get() = LocalMascomColors.current
}
