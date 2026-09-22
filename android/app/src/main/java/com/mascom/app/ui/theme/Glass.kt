package com.mascom.app.ui.theme

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.HazeStyle
import dev.chrisbanes.haze.HazeTint
import dev.chrisbanes.haze.hazeEffect
import kotlin.math.hypot

object Radii {
    val xs = 8.dp
    val sm = 10.dp
    val md = 14.dp
    val lg = 18.dp
    val xl = 22.dp
    val xxl = 26.dp
    val card = 28.dp
    val sheet = 40.dp
}

/**
 * The glass recipe from the design spec (glass-morphism.png):
 *  1. A radial white fill, 40% at the top-left fading to 0%.
 *  2. A background blur of 42 (Figma), which is about a 24dp Gaussian radius here.
 *  3. An outside stroke built from three stacked radial fills, each 100% to 0%:
 *     #151515, #e64467 and #ffffff.
 * The spec draws a 412 x 660 frame with a 3.5 stroke; strokes are scaled down for real-size UI.
 */
object GlassSpec {
    val Blur = 24.dp
    /** Base frost under panels: light, so the backdrop colour carries through as in the spec. */
    const val PanelFrost = 0.2f
    /** Bars that float over photos (tab bar, action bars) need more body to keep labels readable. */
    const val BarFrost = 0.62f
    val Stroke = 1.5.dp
    val StrokeThin = 1.dp
    val Ink = Color(0xFF151515)
    val Rose = Color(0xFFE64467)
}

/** Space the floating tab bar takes at the bottom of top-level screens (0 elsewhere). */
val LocalBottomBarPadding = compositionLocalOf { 0.dp }

/** The app-wide blur source: everything under the nav host, which the tab bar frosts. */
val LocalAppHaze = compositionLocalOf<HazeState?> { null }

/** The current screen's ambient backdrop, which cards and panels frost. */
val LocalAmbientHaze = compositionLocalOf<HazeState?> { null }

/** The blur for full-width bars (top bar), which fade in with [tintAlpha] as content scrolls under. */
@Composable
fun glassStyle(tintAlpha: Float = 1f, blur: Dp = GlassSpec.Blur): HazeStyle {
    val c = Mascom.colors
    return HazeStyle(
        backgroundColor = c.page,
        tints = listOf(HazeTint(c.glass.copy(alpha = c.glass.alpha * tintAlpha))),
        blurRadius = blur,
        noiseFactor = 0f,
        fallbackTint = HazeTint(c.surface.copy(alpha = 0.94f)),
    )
}

/**
 * A glass surface built from the spec. [state] is what it blurs: the screen's ambient backdrop for
 * cards, or a photo or list for floating controls. With no source it falls back to a frosted tint.
 */
@Composable
fun Modifier.glass(
    state: HazeState?,
    shape: Shape = RoundedCornerShape(Radii.card),
    stroke: Dp = GlassSpec.Stroke,
    frost: Float = GlassSpec.PanelFrost,
): Modifier {
    val c = Mascom.colors
    // Step 1: white 40% to 0%. Dark mode starts lower so panels don't turn milky.
    val fillStart = Color.White.copy(alpha = if (c.isDark) 0.14f else 0.40f)
    // A base tint under the fill keeps text readable over strong colours.
    val base = (if (c.isDark) c.surface else Color.White).copy(alpha = frost)
    val style = HazeStyle(
        backgroundColor = c.page,
        tints = listOf(HazeTint(base)),
        blurRadius = GlassSpec.Blur,
        noiseFactor = 0f,
        fallbackTint = HazeTint(if (c.isDark) c.surface.copy(alpha = 0.9f) else Color.White.copy(alpha = 0.82f)),
    )
    // Step 3: the three stroke fills. #151515 vanishes on a dark page, so dark mode lifts it to white.
    val strokeInk = if (c.isDark) Color.White.copy(alpha = 0.55f) else GlassSpec.Ink
    val strokeLight = if (c.isDark) Color.White.copy(alpha = 0.3f) else Color.White

    return this
        .drawWithContent {
            drawContent()
            if (stroke > 0.dp) drawOutsideStroke(shape, stroke.toPx(), strokeInk, strokeLight)
        }
        .clip(shape)
        .then(
            if (state != null) Modifier.hazeEffect(state, style)
            else Modifier.background(if (c.isDark) c.surface.copy(alpha = 0.72f) else Color.White.copy(alpha = 0.62f)),
        )
        .drawBehind {
            drawRect(
                Brush.radialGradient(
                    colors = listOf(fillStart, fillStart.copy(alpha = 0f)),
                    center = Offset.Zero,
                    radius = hypot(size.width, size.height).coerceAtLeast(1f),
                ),
            )
        }
}

/** Draws the stroke just outside the shape's edge, layering the three radial fills from the spec. */
private fun DrawScope.drawOutsideStroke(shape: Shape, width: Float, ink: Color, light: Color) {
    val outer = Size(size.width + width, size.height + width)
    val outline = shape.createOutline(outer, layoutDirection, this)
    val diagonal = hypot(outer.width, outer.height)
    val strokeStyle = Stroke(width)
    translate(-width / 2, -width / 2) {
        // 1. #151515, from the top-left corner.
        drawOutline(outline, Brush.radialGradient(listOf(ink, ink.copy(alpha = 0f)), Offset.Zero, diagonal * 0.95f), style = strokeStyle)
        // 2. #e64467, from the bottom-right corner.
        drawOutline(
            outline,
            Brush.radialGradient(listOf(GlassSpec.Rose, GlassSpec.Rose.copy(alpha = 0f)), Offset(outer.width, outer.height), diagonal * 0.85f),
            style = strokeStyle,
        )
        // 3. #ffffff, from the top-right corner.
        drawOutline(
            outline,
            Brush.radialGradient(listOf(light, light.copy(alpha = 0f)), Offset(outer.width, 0f), diagonal * 0.6f),
            style = strokeStyle,
        )
    }
}

/**
 * The colour a screen's glass frosts over: soft pools of rose and gold on the page, standing in
 * for the red disc behind the glass in the spec's "Result" frame. It stays put while content
 * scrolls, so cards pick up changing colour as they pass over it.
 */
@Composable
fun AmbientBackdrop(modifier: Modifier = Modifier) {
    val c = Mascom.colors
    val strength = if (c.isDark) 0.7f else 1f
    Canvas(modifier) {
        val w = size.width
        val h = size.height
        fun pool(color: Color, x: Float, y: Float, radius: Float) {
            val center = Offset(x, y)
            drawCircle(Brush.radialGradient(listOf(color, color.copy(alpha = 0f)), center, radius), radius, center)
        }
        drawRect(c.page)
        pool(GlassSpec.Rose.copy(alpha = 0.42f * strength), w * 0.95f, h * 0.2f, w * 0.62f)
        pool(Gold.g400.copy(alpha = 0.45f * strength), w * 0.02f, h * 0.48f, w * 0.7f)
        pool(GlassSpec.Rose.copy(alpha = 0.3f * strength), w * 0.8f, h * 0.86f, w * 0.55f)
        pool(Gold.g300.copy(alpha = 0.35f * strength), w * 0.3f, h * 1.02f, w * 0.5f)
    }
}
