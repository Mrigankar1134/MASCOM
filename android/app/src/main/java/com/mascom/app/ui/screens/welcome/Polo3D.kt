package com.mascom.app.ui.screens.welcome

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.withTransform
import com.mascom.app.ui.theme.Gold
import kotlin.math.min

/**
 * A polo shirt drawn with gradients and a specular highlight so it reads as a lit, rounded
 * object, the way a shaded sphere does. [tilt] (-1..1) slides the highlight and shading
 * across the body as the shirt sways, which sells the 3D turn.
 *
 * Drawn on a 200 x 200 grid and scaled to fit.
 */
@Composable
fun Polo3D(modifier: Modifier = Modifier, tilt: () -> Float = { 0f }) {
    Canvas(modifier) {
        val s = min(size.width, size.height) / 200f
        withTransform({
            translate((size.width - 200f * s) / 2f, (size.height - 200f * s) / 2f)
            scale(s, s, Offset.Zero)
        }) {
            drawPolo(tilt())
        }
    }
}

private val Deep = Gold.g700
private val Light = Gold.g200

// Shadows are a warm brown: black over gold reads olive.
private val Shade = Color(0xFF4A2C00)

private fun DrawScope.drawPolo(tilt: Float) {
    val body = Path().apply {
        moveTo(76f, 30f)
        quadraticTo(100f, 40f, 124f, 30f)       // neckline
        lineTo(158f, 40f)                         // right shoulder
        quadraticTo(178f, 52f, 195f, 84f)         // right sleeve top
        lineTo(171f, 101f)                        // right cuff
        quadraticTo(160f, 93f, 152f, 86f)         // right underarm
        quadraticTo(155f, 140f, 153f, 184f)       // right side
        quadraticTo(100f, 191f, 47f, 184f)        // hem
        quadraticTo(45f, 140f, 48f, 86f)          // left side
        quadraticTo(40f, 93f, 29f, 101f)          // left underarm
        lineTo(5f, 84f)                           // left cuff
        quadraticTo(22f, 52f, 42f, 40f)           // left sleeve top
        close()
    }
    val leftSleeve = Path().apply {
        moveTo(42f, 40f); quadraticTo(22f, 52f, 5f, 84f); lineTo(29f, 101f)
        quadraticTo(40f, 93f, 48f, 86f); quadraticTo(56f, 62f, 46f, 41f); close()
    }
    val rightSleeve = Path().apply {
        moveTo(158f, 40f); quadraticTo(178f, 52f, 195f, 84f); lineTo(171f, 101f)
        quadraticTo(160f, 93f, 152f, 86f); quadraticTo(144f, 62f, 154f, 41f); close()
    }

    // Soft contact shadow on the "floor".
    drawOval(
        Brush.radialGradient(listOf(Shade.copy(alpha = 0.22f), Color.Transparent), Offset(100f, 194f), 62f),
        topLeft = Offset(40f, 186f),
        size = Size(120f, 16f),
    )

    // The inside back of the neck, seen through the opening.
    drawOval(Deep, topLeft = Offset(79f, 22f), size = Size(42f, 18f))

    // Base colour: lit from above, falling into shadow at the hem.
    drawPath(body, Brush.verticalGradient(listOf(Gold.g300, Gold.g400, Gold.g500, Gold.g600), startY = 30f, endY = 190f))

    clipPath(body) {
        // Rounded torso: darker at both flanks, the dark side trading places as it turns.
        val shift = tilt * 18f
        drawRect(
            Brush.horizontalGradient(
                0f to Shade.copy(alpha = 0.28f - tilt * 0.08f),
                0.28f to Color.Transparent,
                0.72f to Color.Transparent,
                1f to Shade.copy(alpha = 0.28f + tilt * 0.08f),
                startX = 40f + shift,
                endX = 160f + shift,
            ),
        )
        // Sleeves sit slightly back from the torso.
        drawPath(leftSleeve, Shade.copy(alpha = 0.10f + tilt.coerceAtLeast(0f) * 0.08f))
        drawPath(rightSleeve, Shade.copy(alpha = 0.10f + (-tilt).coerceAtLeast(0f) * 0.08f))
        // Specular highlight, the glossy spot of the lit side.
        val hx = 126f - tilt * 34f
        drawCircle(
            Brush.radialGradient(listOf(Color.White.copy(alpha = 0.55f), Color.White.copy(alpha = 0.12f), Color.Transparent), Offset(hx, 66f), 70f),
            radius = 70f,
            center = Offset(hx, 66f),
        )
        // Hem falls into shade.
        drawRect(Brush.verticalGradient(listOf(Color.Transparent, Shade.copy(alpha = 0.18f)), startY = 130f, endY = 190f))
        // Fabric folds from the underarms.
        val fold = Stroke(width = 2.2f, cap = StrokeCap.Round)
        drawPath(Path().apply { moveTo(53f, 96f); quadraticTo(64f, 124f, 58f, 156f) }, Shade.copy(alpha = 0.08f), style = fold)
        drawPath(Path().apply { moveTo(147f, 96f); quadraticTo(136f, 124f, 142f, 156f) }, Shade.copy(alpha = 0.08f), style = fold)
        // Armhole seams.
        val seam = Stroke(width = 1.2f)
        drawPath(Path().apply { moveTo(44f, 41f); quadraticTo(57f, 64f, 48f, 86f) }, Deep.copy(alpha = 0.35f), style = seam)
        drawPath(Path().apply { moveTo(156f, 41f); quadraticTo(143f, 64f, 152f, 86f) }, Deep.copy(alpha = 0.35f), style = seam)
    }

    // Ribbed cuffs.
    drawCuff(Offset(5f, 84f), Offset(29f, 101f), Offset(35f, 93f), Offset(11f, 76f))
    drawCuff(Offset(195f, 84f), Offset(171f, 101f), Offset(165f, 93f), Offset(189f, 76f))

    // Placket and buttons.
    val placket = Path().apply {
        moveTo(95.5f, 44f); lineTo(104.5f, 44f); lineTo(104.5f, 92f)
        quadraticTo(100f, 95f, 95.5f, 92f); close()
    }
    drawPath(placket, Brush.verticalGradient(listOf(Gold.g400, Gold.g500), startY = 44f, endY = 94f))
    drawPath(placket, Deep.copy(alpha = 0.35f), style = Stroke(1f))
    listOf(58f, 76f).forEach { y ->
        drawCircle(Color.White.copy(alpha = 0.9f), radius = 2.6f, center = Offset(100f, y))
        drawCircle(Deep.copy(alpha = 0.4f), radius = 2.6f, center = Offset(100f, y), style = Stroke(0.8f))
    }

    // Collar stand behind the flaps, then the two flaps folding down.
    drawPath(
        Path().apply { moveTo(74f, 31f); quadraticTo(100f, 17f, 126f, 31f) },
        Brush.horizontalGradient(listOf(Gold.g500, Gold.g300, Gold.g500), startX = 74f, endX = 126f),
        style = Stroke(width = 6f, cap = StrokeCap.Round),
    )
    val leftFlap = Path().apply {
        moveTo(75f, 29f); lineTo(100f, 45f); lineTo(89f, 63f); quadraticTo(76f, 50f, 66f, 36f); close()
    }
    val rightFlap = Path().apply {
        moveTo(125f, 29f); lineTo(100f, 45f); lineTo(111f, 63f); quadraticTo(124f, 50f, 134f, 36f); close()
    }
    drawPath(leftFlap, Brush.linearGradient(listOf(Light, Gold.g400), Offset(70f, 30f), Offset(95f, 62f)))
    drawPath(rightFlap, Brush.linearGradient(listOf(Gold.g300, Gold.g500), Offset(130f, 30f), Offset(105f, 62f)))
    // A little shadow under each flap lifts it off the body.
    drawPath(Path().apply { moveTo(89f, 63f); quadraticTo(76f, 50f, 66f, 36f) }, Shade.copy(alpha = 0.18f), style = Stroke(2f))
    drawPath(Path().apply { moveTo(111f, 63f); quadraticTo(124f, 50f, 134f, 36f) }, Shade.copy(alpha = 0.18f), style = Stroke(2f))
    drawPath(leftFlap, Deep.copy(alpha = 0.3f), style = Stroke(0.9f))
    drawPath(rightFlap, Deep.copy(alpha = 0.3f), style = Stroke(0.9f))

    // The MASCOM "M", embroidered on the left chest.
    val m = Path().apply {
        moveTo(121f, 76f); lineTo(121f, 64f); lineTo(124f, 64f); lineTo(128f, 70f); lineTo(132f, 64f)
        lineTo(135f, 64f); lineTo(135f, 76f); lineTo(132.5f, 76f); lineTo(132.5f, 69f); lineTo(129f, 74f)
        lineTo(127f, 74f); lineTo(123.5f, 69f); lineTo(123.5f, 76f); close()
    }
    drawPath(m, Color(0xFF1F1602).copy(alpha = 0.75f))

    // A crisp edge for definition.
    drawPath(body, Deep.copy(alpha = 0.28f), style = Stroke(1f))
}

private fun DrawScope.drawCuff(a: Offset, b: Offset, c: Offset, d: Offset) {
    val cuff = Path().apply { moveTo(a.x, a.y); lineTo(b.x, b.y); lineTo(c.x, c.y); lineTo(d.x, d.y); close() }
    drawPath(cuff, Brush.linearGradient(listOf(Gold.g500, Gold.g600), a, c))
    // Ribbing lines.
    for (i in 1..3) {
        val t = i / 4f
        drawLine(
            Deep.copy(alpha = 0.25f),
            Offset(a.x + (d.x - a.x) * t, a.y + (d.y - a.y) * t),
            Offset(b.x + (c.x - b.x) * t, b.y + (c.y - b.y) * t),
            strokeWidth = 0.8f,
        )
    }
    drawPath(cuff, Deep.copy(alpha = 0.3f), style = Stroke(0.9f))
}
