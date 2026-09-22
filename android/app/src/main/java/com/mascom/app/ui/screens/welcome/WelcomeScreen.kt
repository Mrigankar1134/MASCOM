package com.mascom.app.ui.screens.welcome

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.EaseOutCubic
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.util.lerp
import com.mascom.app.data.content.SiteContent
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.Mascom
import dev.chrisbanes.haze.HazeStyle
import dev.chrisbanes.haze.HazeTint
import dev.chrisbanes.haze.hazeEffect
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * The first thing a new user sees. A glossy 3D polo floats on a clean page; tap (or swipe up)
 * and a frosted-glass sheet rises over the bottom of the shirt, its gold glow bleeding through
 * the blur, with "Get started" and a blob-shaped button.
 */
@Composable
fun WelcomeScreen(onGetStarted: () -> Unit) {
    val c = Mascom.colors
    val haptics = LocalHapticFeedback.current
    val page = c.surface
    val haze = rememberHazeState()
    var revealed by rememberSaveable { mutableStateOf(false) }
    val nav = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    val reveal by animateFloatAsState(
        if (revealed) 1f else 0f,
        spring(dampingRatio = 0.84f, stiffness = 200f),
        label = "reveal",
    )
    val sway = rememberInfiniteTransition(label = "sway")
    val phase by sway.animateFloat(0f, (2 * PI).toFloat(), infiniteRepeatable(tween(7000, easing = LinearEasing)), label = "phase")
    val bounce = remember { Animatable(1f) }
    LaunchedEffect(revealed) {
        bounce.animateTo(0.9f, tween(110))
        bounce.animateTo(1f, spring(dampingRatio = 0.35f, stiffness = 380f))
    }

    BackHandler(enabled = revealed) { revealed = false }
    val open = {
        if (!revealed) {
            haptics.performHapticFeedback(HapticFeedbackType.ContextClick)
            revealed = true
        }
    }

    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .background(page)
            .clickable(remember { MutableInteractionSource() }, indication = null, enabled = !revealed, onClick = open)
            .pointerInput(Unit) { detectVerticalDragGestures { _, drag -> if (drag < -12f) open() } },
    ) {
        val w = maxWidth
        val h = maxHeight
        val shirt = w * 0.66f
        val shirtTop = h * 0.42f - shirt / 2
        // The sheet's top edge settles across the lower third of the shirt.
        val sheetTop = shirtTop + shirt * 0.68f

        // Everything behind the glass: a warm glow and the shirt.
        Box(Modifier.fillMaxSize().hazeSource(haze)) {
            Canvas(Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2, (shirtTop + shirt * 0.55f).toPx())
                val r = shirt.toPx() * 0.75f
                drawCircle(Brush.radialGradient(listOf(Gold.g400.copy(alpha = if (c.isDark) 0.28f else 0.32f), Color.Transparent), center, r), r, center)
            }
            Polo3D(
                modifier = Modifier
                    .offset(x = (w - shirt) / 2, y = shirtTop)
                    .size(shirt)
                    .graphicsLayer {
                        rotationY = sin(phase) * 16f
                        rotationX = 5f + cos(phase * 2) * 3f
                        translationY = sin(phase * 2) * 6.dp.toPx()
                        scaleX = bounce.value
                        scaleY = bounce.value
                        cameraDistance = 14f * density
                    },
                tilt = { sin(phase) },
            )
        }

        // "Tap me" prompt, fading out as the sheet arrives.
        Column(
            Modifier
                .align(Alignment.TopCenter)
                .offset(y = h * 0.74f)
                .graphicsLayer { alpha = 1f - reveal; translationY = reveal * 30f },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                "TAP ME",
                style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.12.em),
                color = c.label3,
            )
            Spacer(Modifier.height(10.dp))
            Box(Modifier.size(width = 22.dp, height = 3.dp).clip(CircleShape).background(c.label4))
        }

        // The glass sheet.
        val sheetY = lerp(h.value, sheetTop.value, reveal).dp
        Box(
            Modifier
                .offset(y = sheetY)
                .fillMaxWidth()
                .height(h - sheetTop)
                .hazeEffect(
                    haze,
                    HazeStyle(
                        backgroundColor = page,
                        tints = listOf(HazeTint(page.copy(alpha = 0.35f))),
                        blurRadius = 38.dp,
                        noiseFactor = 0f,
                        fallbackTint = HazeTint(page.copy(alpha = 0.92f)),
                    ),
                )
                // Below the glow the glass settles into the plain page.
                .background(Brush.verticalGradient(0f to Color.Transparent, 0.35f to page.copy(alpha = 0.55f), 0.6f to page)),
        ) {
            Column(
                Modifier.fillMaxSize().padding(horizontal = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Spacer(Modifier.height(14.dp))
                Box(Modifier.size(width = 22.dp, height = 3.dp).clip(CircleShape).background(c.label4))
                Spacer(Modifier.weight(0.55f))
                Staged(revealed, 150) {
                    Text("Get started", style = MaterialTheme.typography.displaySmall, color = c.label, textAlign = TextAlign.Center)
                }
                Spacer(Modifier.height(14.dp))
                Staged(revealed, 240) {
                    Text(
                        SiteContent.INTRO,
                        style = MaterialTheme.typography.bodyMedium,
                        color = c.label2,
                        textAlign = TextAlign.Center,
                    )
                }
                Spacer(Modifier.weight(1f))
                Staged(revealed, 340) {
                    BlobButton(onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                        onGetStarted()
                    })
                }
                Spacer(Modifier.height(nav + 28.dp))
            }
        }
    }
}

/** Fades and lifts its content in, [delay] ms after the sheet starts to rise. */
@Composable
private fun Staged(visible: Boolean, delay: Int, content: @Composable () -> Unit) {
    val p by animateFloatAsState(
        if (visible) 1f else 0f,
        if (visible) tween(520, delayMillis = delay, easing = EaseOutCubic) else tween(160),
        label = "staged",
    )
    Box(Modifier.graphicsLayer { alpha = p; translationY = (1f - p) * 28.dp.toPx() }) { content() }
}

/** A glossy gold blob that slowly changes shape, with a soft glow beneath it. */
@Composable
private fun BlobButton(onClick: () -> Unit) {
    val c = Mascom.colors
    val t = rememberInfiniteTransition(label = "blob")
    val phase by t.animateFloat(0f, (2 * PI).toFloat(), infiniteRepeatable(tween(5200, easing = LinearEasing)), label = "blob-phase")
    Box(
        Modifier.size(112.dp).pressable(onClick, label = "Get started", pressedScale = 0.9f),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val glowCenter = Offset(center.x, center.y + 8.dp.toPx())
            val glow = size.minDimension * 0.5f
            drawCircle(Brush.radialGradient(listOf(Gold.g500.copy(alpha = 0.45f), Color.Transparent), glowCenter, glow), glow, glowCenter)
            val blob = blobPath(size, size.minDimension * 0.33f, phase)
            drawPath(blob, Brush.linearGradient(listOf(Gold.g300, Gold.g500, Gold.g600), Offset(size.width * 0.2f, 0f), Offset(size.width * 0.8f, size.height)))
            drawPath(
                blob,
                Brush.radialGradient(
                    listOf(Color.White.copy(alpha = 0.5f), Color.Transparent),
                    Offset(size.width * 0.38f, size.height * 0.3f),
                    size.minDimension * 0.3f,
                ),
            )
        }
        Icon(Icons.AutoMirrored.Rounded.ArrowForward, contentDescription = null, tint = c.tintContrast, modifier = Modifier.width(26.dp))
    }
}

/** A closed, smooth blob through six wobbling points (Catmull-Rom converted to cubics). */
private fun blobPath(size: Size, radius: Float, phase: Float): Path {
    val cx = size.width / 2
    val cy = size.height / 2
    val n = 6
    val points = (0 until n).map { i ->
        val a = i * 2 * PI / n + 0.3
        val r = radius * (1f + 0.10f * sin(phase + i * 1.7f) + 0.05f * cos(phase * 2 + i))
        Offset(cx + (r * cos(a)).toFloat(), cy + (r * sin(a)).toFloat())
    }
    return Path().apply {
        moveTo(points[0].x, points[0].y)
        for (i in 0 until n) {
            val p0 = points[(i - 1 + n) % n]
            val p1 = points[i]
            val p2 = points[(i + 1) % n]
            val p3 = points[(i + 2) % n]
            val c1 = p1 + (p2 - p0) / 6f
            val c2 = p2 - (p3 - p1) / 6f
            cubicTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y)
        }
        close()
    }
}
