package com.mascom.app.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibilityScope
import androidx.compose.animation.ExperimentalSharedTransitionApi
import androidx.compose.animation.SharedTransitionScope
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.EaseOutCubic
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.Mascom
import dev.chrisbanes.haze.HazeState
import kotlin.math.PI
import kotlin.math.sin
import kotlin.random.Random

// ---- Shared elements -------------------------------------------------------------------------

@OptIn(ExperimentalSharedTransitionApi::class)
val LocalSharedTransitionScope = compositionLocalOf<SharedTransitionScope?> { null }

/** The nav destination's own enter/exit scope, so shared elements know which side they're on. */
val LocalNavAnimatedScope = compositionLocalOf<AnimatedVisibilityScope?> { null }

/** The frosted-glass source of the current screen, for bars that float over its content. */
val LocalScreenHaze = compositionLocalOf<HazeState?> { null }

/** Lets a product photo fly between the shop grid and the product page. No-op outside a nav host. */
@OptIn(ExperimentalSharedTransitionApi::class)
@Composable
fun Modifier.sharedProductImage(productId: String, shape: Shape): Modifier {
    val shared = LocalSharedTransitionScope.current ?: return this
    val scope = LocalNavAnimatedScope.current ?: return this
    return with(shared) {
        this@sharedProductImage.sharedElement(
            sharedContentState = rememberSharedContentState("product-image-$productId"),
            animatedVisibilityScope = scope,
            boundsTransform = { _, _ -> spring(dampingRatio = 0.82f, stiffness = 320f) },
            clipInOverlayDuringTransition = OverlayClip(shape),
        )
    }
}

// ---- Entrances -------------------------------------------------------------------------------

/**
 * Fades and lifts content in once, staggered by [index]. Saved across recomposition and
 * back-navigation so lists don't replay their entrance every time you return.
 */
fun Modifier.appear(index: Int = 0, distance: Dp = 22.dp, delayStep: Int = 55): Modifier = composed {
    var shown by rememberSaveable { mutableStateOf(false) }
    val progress by animateFloatAsState(
        targetValue = if (shown) 1f else 0f,
        animationSpec = tween(520, delayMillis = (index.coerceAtMost(8)) * delayStep, easing = EaseOutCubic),
        label = "appear",
    )
    LaunchedEffect(Unit) { shown = true }
    graphicsLayer {
        alpha = progress
        translationY = (1f - progress) * distance.toPx()
    }
}

/** A slow bob, for empty-state illustrations. */
fun Modifier.floating(amplitude: Dp = 6.dp, periodMillis: Int = 2600): Modifier = composed {
    val t = rememberInfiniteTransition(label = "float")
    val phase by t.animateFloat(0f, 1f, infiniteRepeatable(tween(periodMillis, easing = LinearEasing)), label = "phase")
    graphicsLayer { translationY = sin(phase * 2 * PI).toFloat() * amplitude.toPx() }
}

/** A quick horizontal shake, for "you missed something" moments. Bump [trigger] to replay it. */
fun Modifier.shake(trigger: Int): Modifier = composed {
    val offset = remember { Animatable(0f) }
    LaunchedEffect(trigger) {
        if (trigger == 0) return@LaunchedEffect
        for (x in listOf(14f, -12f, 9f, -6f, 3f, 0f)) offset.animateTo(x, tween(55))
    }
    graphicsLayer { translationX = offset.value * density }
}

// ---- Loading ---------------------------------------------------------------------------------

/** A soft light sweep across placeholder shapes while content loads. */
fun Modifier.shimmer(): Modifier = composed {
    val c = Mascom.colors
    val base = c.fill.copy(alpha = if (c.isDark) 0.35f else 0.18f)
    val highlight = if (c.isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.7f)
    val t = rememberInfiniteTransition(label = "shimmer")
    val x by t.animateFloat(-1f, 2f, infiniteRepeatable(tween(1300, easing = LinearEasing)), label = "x")
    drawWithContent {
        drawRect(base)
        val start = size.width * x
        drawRect(
            Brush.linearGradient(
                listOf(Color.Transparent, highlight, Color.Transparent),
                start = Offset(start - size.width * 0.6f, 0f),
                end = Offset(start, size.height),
            ),
        )
    }
}

// ---- Numbers ---------------------------------------------------------------------------------

/**
 * Text whose characters roll like an odometer when they change. Aligned from the right, so
 * "₹999" → "₹1,299" rolls the digits that moved rather than reshuffling everything.
 */
@Composable
fun RollingText(text: String, style: TextStyle, modifier: Modifier = Modifier, color: Color = Color.Unspecified) {
    var previous by remember { mutableStateOf(text) }
    val goingUp = (text.filter(Char::isDigit).toLongOrNull() ?: 0L) >= (previous.filter(Char::isDigit).toLongOrNull() ?: 0L)
    LaunchedEffect(text) { previous = text }
    Row(modifier, verticalAlignment = Alignment.CenterVertically) {
        text.forEachIndexed { index, char ->
            key(text.length - index) {
                AnimatedContent(
                    targetState = char,
                    transitionSpec = {
                        val dir = if (goingUp) 1 else -1
                        (slideInVertically(spring(dampingRatio = 0.8f, stiffness = 500f)) { it * dir } + fadeIn(tween(160))) togetherWith
                            (slideOutVertically(tween(180)) { -it * dir } + fadeOut(tween(120))) using SizeTransform(clip = false)
                    },
                    label = "roll",
                ) { androidx.compose.material3.Text(it.toString(), style = style, color = color) }
            }
        }
    }
}

/** Counts up from zero to [target] the first time it's shown, then eases between values. */
@Composable
fun animatedCount(target: Double, durationMillis: Int = 1100): Double {
    val value = remember { Animatable(0f) }
    LaunchedEffect(target) { value.animateTo(target.toFloat(), tween(durationMillis, easing = FastOutSlowInEasing)) }
    return value.value.toDouble()
}

// ---- Celebration -----------------------------------------------------------------------------

/** A ring that springs open and a check mark that draws itself. */
@Composable
fun SuccessMark(modifier: Modifier = Modifier, color: Color = Mascom.colors.ok) {
    val ring = remember { Animatable(0f) }
    val check = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        ring.animateTo(1f, spring(dampingRatio = 0.45f, stiffness = 220f))
    }
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(220)
        check.animateTo(1f, tween(460, easing = FastOutSlowInEasing))
    }
    Canvas(modifier) {
        val r = size.minDimension / 2
        drawCircle(color.copy(alpha = 0.16f), radius = r * ring.value)
        drawCircle(color, radius = r * 0.64f * ring.value)
        val w = size.width
        val h = size.height
        val path = Path().apply {
            moveTo(w * 0.35f, h * 0.51f)
            lineTo(w * 0.46f, h * 0.62f)
            lineTo(w * 0.67f, h * 0.40f)
        }
        val measure = PathMeasure().apply { setPath(path, false) }
        val segment = Path()
        measure.getSegment(0f, measure.length * check.value, segment, true)
        drawPath(segment, Color.White, style = Stroke(width = r * 0.13f, cap = StrokeCap.Round, join = StrokeJoin.Round))
    }
}

private class Particle(
    val x: Float,
    val vx: Float,
    val vy: Float,
    val spin: Float,
    val color: Color,
    val w: Float,
    val h: Float,
    val delay: Float,
)

/** A one-shot burst of gold confetti that falls and fades. Draws only; never blocks touches. */
@Composable
fun Confetti(modifier: Modifier = Modifier, count: Int = 90) {
    val c = Mascom.colors
    val palette = listOf(Gold.g300, Gold.g500, Gold.g100, c.ok, c.info, Color(0xFFF472B6))
    val particles = remember {
        val rnd = Random(7)
        List(count) {
            Particle(
                x = 0.5f + (rnd.nextFloat() - 0.5f) * 0.3f,
                vx = (rnd.nextFloat() - 0.5f) * 1.3f,
                vy = -0.55f - rnd.nextFloat() * 0.55f,
                spin = (rnd.nextFloat() - 0.5f) * 6f,
                color = palette[rnd.nextInt(palette.size)],
                w = 6f + rnd.nextFloat() * 6f,
                h = 10f + rnd.nextFloat() * 8f,
                delay = rnd.nextFloat() * 0.12f,
            )
        }
    }
    val t = remember { Animatable(0f) }
    LaunchedEffect(Unit) { t.animateTo(1f, tween(3200, easing = LinearEasing)) }
    if (t.value >= 1f) return
    Canvas(modifier) {
        val origin = Offset(size.width / 2, size.height * 0.28f)
        particles.forEach { p ->
            val time = ((t.value - p.delay) / (1f - p.delay)).coerceIn(0f, 1f)
            if (time <= 0f) return@forEach
            val x = origin.x + (p.x - 0.5f) * size.width + p.vx * time * size.width * 0.6f
            val y = origin.y + (p.vy * time + 1.5f * time * time) * size.height * 0.55f
            val alpha = if (time > 0.7f) (1f - time) / 0.3f else 1f
            rotate(p.spin * time * 360f, pivot = Offset(x, y)) {
                drawRect(
                    color = p.color.copy(alpha = alpha),
                    topLeft = Offset(x - p.w * density / 4, y - p.h * density / 4),
                    size = Size(p.w * density / 2, p.h * density / 2),
                )
            }
        }
    }
}
