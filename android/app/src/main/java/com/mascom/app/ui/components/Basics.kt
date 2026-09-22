package com.mascom.app.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.mascom.app.domain.model.ItemStatus
import com.mascom.app.domain.model.OrderStatus
import com.mascom.app.domain.model.PaymentStatus
import com.mascom.app.ui.theme.LocalAmbientHaze
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import com.mascom.app.ui.theme.glass

/** Click with a soft spring scale on press, the way iOS controls respond. */
@Composable
fun Modifier.pressable(
    onClick: () -> Unit,
    enabled: Boolean = true,
    role: Role = Role.Button,
    label: String? = null,
    pressedScale: Float = 0.96f,
): Modifier {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(
        if (pressed && enabled) pressedScale else 1f,
        spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "press",
    )
    return this
        .scale(scale)
        .clickable(source, indication = null, enabled = enabled, onClickLabel = label, role = role, onClick = onClick)
}

@Composable
fun Hairline(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().height(0.5.dp).background(Mascom.colors.separator))
}

enum class ButtonKind { Primary, Secondary, Plain, Destructive, Success }

@Composable
fun MascomButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    kind: ButtonKind = ButtonKind.Primary,
    enabled: Boolean = true,
    loading: Boolean = false,
    icon: ImageVector? = null,
    height: Dp = 52.dp,
) {
    val c = Mascom.colors
    val haptics = LocalHapticFeedback.current
    val shape = RoundedCornerShape(Radii.md + 2.dp)
    val (bgTarget, fgTarget) = when (kind) {
        ButtonKind.Primary -> c.tintSolid to c.tintContrast
        ButtonKind.Secondary -> c.fill.copy(alpha = if (c.isDark) 0.5f else 0.24f) to c.label
        ButtonKind.Plain -> Color.Transparent to c.tint
        ButtonKind.Destructive -> c.danger.copy(alpha = 0.14f) to c.danger
        ButtonKind.Success -> c.ok to Color.White
    }
    val active = enabled && !loading
    // Colours glide rather than snap when a button changes kind, e.g. "Add to bag" to "Added".
    val bg by animateColorAsState(
        if (active || kind == ButtonKind.Plain || kind == ButtonKind.Success) bgTarget else bgTarget.copy(alpha = bgTarget.alpha * 0.5f),
        tween(280),
        label = "button-bg",
    )
    val fg by animateColorAsState(
        if (active || kind == ButtonKind.Success) fgTarget else fgTarget.copy(alpha = 0.45f),
        tween(280),
        label = "button-fg",
    )
    val glow = kind == ButtonKind.Primary || kind == ButtonKind.Success
    Box(
        modifier
            .heightIn(min = height)
            .then(
                if (glow && active) {
                    val tone = if (kind == ButtonKind.Success) c.ok.copy(alpha = 0.35f) else c.tintGlow
                    Modifier.shadow(14.dp, shape, ambientColor = tone, spotColor = tone)
                } else Modifier,
            )
            .clip(shape)
            .background(bg)
            .then(
                if (glow) {
                    // A faint top sheen keeps the fill from looking flat.
                    Modifier.background(Brush.verticalGradient(listOf(Color.White.copy(alpha = 0.22f), Color.Transparent)))
                } else Modifier,
            )
            .pressable(
                onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.ContextClick)
                    onClick()
                },
                enabled = active,
            )
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalContentColor provides fg) {
            AnimatedContent(
                targetState = Triple(loading, text, icon),
                transitionSpec = {
                    (fadeIn(tween(200, delayMillis = 60)) + slideInVertically(tween(260)) { it / 2 } + scaleIn(initialScale = 0.9f))
                        .togetherWith(fadeOut(tween(120)) + slideOutVertically(tween(200)) { -it / 2 })
                },
                contentAlignment = Alignment.Center,
                label = "button-content",
            ) { (isLoading, label, glyph) ->
                if (isLoading) {
                    CircularProgressIndicator(Modifier.size(22.dp), color = fg, strokeWidth = 2.5.dp)
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                        if (glyph != null) {
                            Icon(glyph, null, Modifier.size(20.dp))
                            Spacer(Modifier.width(8.dp))
                        }
                        Text(label, style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }
    }
}

/** A glass panel (see [glass]) that frosts the screen's ambient backdrop. */
@Composable
fun Card(
    modifier: Modifier = Modifier,
    padding: PaddingValues = PaddingValues(16.dp),
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.pressable(onClick, pressedScale = 0.985f) else Modifier)
            .glass(LocalAmbientHaze.current, RoundedCornerShape(Radii.card))
            .padding(padding),
        content = content,
    )
}

@Composable
fun SectionHeader(text: String, modifier: Modifier = Modifier, trailing: @Composable RowScope.() -> Unit = {}) {
    Row(
        modifier.fillMaxWidth().padding(start = 4.dp, end = 4.dp, top = 22.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = Mascom.colors.label2,
            modifier = Modifier.weight(1f),
        )
        trailing()
    }
}

/** One row inside a [Card] group: an optional leading icon, a title, a value and a chevron. */
@Composable
fun ListRow(
    title: String,
    modifier: Modifier = Modifier,
    value: String? = null,
    icon: ImageVector? = null,
    iconTint: Color = Mascom.colors.tint,
    subtitle: String? = null,
    showChevron: Boolean = false,
    titleColor: Color = Mascom.colors.label,
    onClick: (() -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val c = Mascom.colors
    Row(
        modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 48.dp)
            .then(if (onClick != null) Modifier.pressable(onClick, pressedScale = 0.98f) else Modifier)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Box(
                Modifier.size(30.dp).clip(RoundedCornerShape(Radii.xs)).background(iconTint.copy(alpha = 0.16f)),
                contentAlignment = Alignment.Center,
            ) { Icon(icon, null, Modifier.size(18.dp), tint = iconTint) }
            Spacer(Modifier.width(12.dp))
        }
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge, color = titleColor)
            if (subtitle != null) Text(subtitle, style = MaterialTheme.typography.bodySmall, color = c.label2)
        }
        if (value != null) {
            Text(value, style = MaterialTheme.typography.bodyLarge, color = c.label2, textAlign = TextAlign.End)
        }
        trailing?.invoke()
        if (showChevron) {
            Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, null, tint = c.label3, modifier = Modifier.padding(start = 4.dp))
        }
    }
}

@Composable
fun RowDivider(inset: Dp = 16.dp) {
    Box(Modifier.padding(start = inset)) { Hairline() }
}

/** Colour for a status word, matching the web app's STATUS_TONE map. */
@Composable
fun statusColor(status: String): Color {
    val c = Mascom.colors
    return when (status) {
        PaymentStatus.Paid.wire, OrderStatus.Confirmed.wire, OrderStatus.Delivered.wire -> c.ok
        PaymentStatus.Pending.wire, OrderStatus.VerificationPending.wire, ItemStatus.WaitingForInventory.wire -> c.warn
        OrderStatus.Processing.wire, OrderStatus.PartiallyFulfilled.wire -> c.info
        OrderStatus.Failed.wire -> c.danger
        else -> c.label2
    }
}

@Composable
fun StatusPill(status: String, modifier: Modifier = Modifier, label: String = status) {
    val tone by animateColorAsState(statusColor(status), label = "status")
    Row(
        modifier
            .clip(CircleShape)
            .background(tone.copy(alpha = 0.14f))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(6.dp).background(tone, CircleShape))
        Spacer(Modifier.width(6.dp))
        Text(label, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold), color = tone)
    }
}

@Composable
fun Eyebrow(text: String, modifier: Modifier = Modifier, color: Color = Mascom.colors.tint) {
    Text(
        text.uppercase(),
        modifier = modifier,
        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.14.em),
        color = color,
    )
}

/** The text wordmark from the site header. */
@Composable
fun Wordmark(modifier: Modifier = Modifier, color: Color = Mascom.colors.label) {
    Column(modifier) {
        Text(
            "MASCOM",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.06).em, fontSize = 22.sp),
            color = color,
        )
        Text(
            "IIM AMRITSAR",
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, letterSpacing = 0.2.em),
            color = Mascom.colors.label3,
        )
    }
}

/** Soft glowing dot behind hero content, echoing the site's gold glow. */
fun Modifier.goldGlow(color: Color): Modifier = drawBehind {
    drawCircle(
        Brush.radialGradient(listOf(color, Color.Transparent), center = center, radius = size.maxDimension * 0.7f),
        radius = size.maxDimension * 0.7f,
    )
}
