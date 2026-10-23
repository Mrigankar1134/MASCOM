package com.mascom.app.ui.screens.welcome

import android.content.res.AssetManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.animation.core.FloatExponentialDecaySpec
import androidx.compose.animation.core.animateDecay
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.math.floor

private const val FRAME_COUNT = 120
private const val DEGREES_PER_FRAME = 360f / FRAME_COUNT

/**
 * The 3D polo: a 360-degree turntable rendered in Blender (android/art/render_polo.py), played
 * back as images. It turns slowly on its own so the chest "M" and the IIM AMRITSAR back print both
 * come round. Drag sideways to spin it yourself; it carries on with your flick, then settles back
 * into the slow turn. Adjacent frames are blended to smooth the 3-degree steps.
 *
 * Being plain images, it can sit under the frosted-glass sheet and be blurred like anything else.
 */
@Composable
fun PoloTurntable(modifier: Modifier = Modifier, spinSpeed: Float = 30f) {
    val context = LocalContext.current
    val frames = remember { PoloFrames(context.assets) }
    DisposableEffect(Unit) { onDispose { frames.clear() } }

    var angle by remember { mutableFloatStateOf(0f) }
    var dragging by remember { mutableStateOf(false) }
    var coasting by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    var fling by remember { mutableStateOf<Job?>(null) }

    // Idle: a slow turn, paused while you hold or flick it.
    LaunchedEffect(dragging, coasting) {
        if (dragging || coasting) return@LaunchedEffect
        var last = 0L
        while (true) {
            withFrameNanos { now ->
                if (last != 0L) angle += spinSpeed * (now - last) / 1_000_000_000f
                last = now
            }
        }
    }

    val position = ((angle % 360f) + 360f) % 360f / DEGREES_PER_FRAME
    val index = floor(position).toInt()
    // A brief cross-fade in the middle of each 3-degree step: frames sit crisp almost all the time,
    // so sharp detail like the back print never lingers as a double image, but steps don't pop.
    val blend = ((position - index - 0.44f) / 0.12f).coerceIn(0f, 1f).let { it * it * (3 - 2 * it) }

    // Keep the frames around the current angle decoded, a little further in the direction of travel.
    LaunchedEffect(index) {
        for (k in listOf(0, 1, 2, -1, 3, 4, -2, 5, 6)) frames.ensure(index + k)
    }

    val fadeIn by animateFloatAsState(if (frames.version > 0) 1f else 0f, tween(500), label = "turntable-in")

    Canvas(
        modifier.pointerInput(Unit) {
            val tracker = VelocityTracker()
            detectHorizontalDragGestures(
                onDragStart = {
                    fling?.cancel()
                    coasting = false
                    dragging = true
                    tracker.resetTracking()
                },
                onDragEnd = {
                    dragging = false
                    val velocity = tracker.calculateVelocity().x * DRAG_DEGREES_PER_PX
                    coasting = true
                    fling = scope.launch {
                        animateDecay(angle, velocity, FloatExponentialDecaySpec(frictionMultiplier = 1.4f)) { value, _ -> angle = value }
                        coasting = false
                    }
                },
                onDragCancel = { dragging = false },
            ) { change, dx ->
                change.consume()
                tracker.addPosition(change.uptimeMillis, change.position)
                angle += dx * DRAG_DEGREES_PER_PX
            }
        },
    ) {
        // Reading the version here redraws as soon as a newly decoded frame lands.
        if (frames.version == 0) return@Canvas
        // Soft contact shadow under the hem (the renders have no floor).
        val shadowCenter = Offset(size.width / 2, size.height * 0.905f)
        drawOval(
            Brush.radialGradient(
                listOf(Color(0xFF4A2C00).copy(alpha = 0.28f * fadeIn), Color.Transparent),
                center = shadowCenter,
                radius = size.width * 0.34f,
            ),
            topLeft = Offset(size.width * 0.16f, shadowCenter.y - size.height * 0.035f),
            size = Size(size.width * 0.68f, size.height * 0.07f),
        )
        val base = frames.nearest(index) ?: return@Canvas
        val dst = IntSize(size.width.toInt(), size.height.toInt())
        drawImage(base, dstOffset = IntOffset.Zero, dstSize = dst, alpha = fadeIn, filterQuality = FilterQuality.High)
        frames.get(index + 1)?.let { next ->
            if (blend > 0.02f) {
                drawImage(next, dstOffset = IntOffset.Zero, dstSize = dst, alpha = blend * fadeIn, filterQuality = FilterQuality.High)
            }
        }
    }
}

private const val DRAG_DEGREES_PER_PX = 0.35f

/** Decodes turntable frames from assets on demand and keeps a small window of them in memory. */
private class PoloFrames(private val assets: AssetManager) {
    private val cache = LruCache<Int, ImageBitmap>(24)
    private val pending = mutableSetOf<Int>()

    /** Bumped whenever a frame finishes decoding, so the canvas redraws. */
    var version by mutableIntStateOf(0)
        private set

    fun get(i: Int): ImageBitmap? = cache.get(i.mod(FRAME_COUNT))

    /** The requested frame, or the closest one already decoded while it loads. */
    fun nearest(i: Int): ImageBitmap? {
        get(i)?.let { return it }
        for (d in 1..FRAME_COUNT / 2) {
            get(i - d)?.let { return it }
            get(i + d)?.let { return it }
        }
        return null
    }

    suspend fun ensure(i: Int) {
        val key = i.mod(FRAME_COUNT)
        if (cache.get(key) != null || !pending.add(key)) return
        val image = withContext(Dispatchers.IO) {
            runCatching {
                assets.open("polo/polo_%03d.webp".format(key)).use { stream ->
                    // Hardware bitmaps live in GPU memory, not the app heap.
                    BitmapFactory.decodeStream(stream, null, BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.HARDWARE })
                }?.asImageBitmap()
            }.getOrNull()
        }
        pending.remove(key)
        if (image != null) {
            cache.put(key, image)
            version++
        }
    }

    fun clear() = cache.evictAll()
}
