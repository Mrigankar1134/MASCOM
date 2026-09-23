package com.mascom.app.ui.screens.game

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii

/**
 * The Games tab: a shelf, not a game. Campus Heist is playable today; Trophy Trouble is still a
 * design, and its card says so rather than dressing up a screen that can't be played yet.
 */
@Composable
fun GamesHubScreen(onCampusHeist: () -> Unit, onTrophyTrouble: () -> Unit) {
    val vm: HeistViewModel = hiltViewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { vm.refresh() }

    val heistLine = when {
        state.user == null -> "Sign in to play"
        state.home?.joined == false -> "Not joined yet · three raids a day"
        state.home != null -> {
            val home = state.home!!
            "${home.week.points} pts this week · ${home.attempts.ranked} raids left today"
        }
        else -> "Three doors, one alarm"
    }

    GameTheme {
        GlassScaffold(
            title = "Games",
            subtitle = "Two ways to lose an evening",
            backdrop = { GameBackdrop(it) },
        ) {
            item {
                GameCard(
                    name = "Campus Heist",
                    pitch = "Pick a door. Two hold coins, one holds the alarm. Raid the campus, " +
                        "raid your friends, climb the weekly table.",
                    status = "Playable",
                    statusTone = Mascom.colors.ok,
                    footer = heistLine,
                    accent = Gold.g400,
                    modifier = Modifier.padding(top = 4.dp),
                    art = { VaultArt() },
                    onClick = onCampusHeist,
                )
            }
            item {
                GameCard(
                    name = "Trophy Trouble",
                    pitch = "Four players, one trophy, two minutes. Grab it, escape your friends, " +
                        "and steal it back when they catch you.",
                    status = "In design",
                    statusTone = Mascom.colors.info,
                    footer = "3D chase game · read the design",
                    accent = Color(0xFF6EA8FF),
                    modifier = Modifier.padding(top = 14.dp),
                    art = { TrophyArt() },
                    onClick = onTrophyTrouble,
                )
            }
        }
    }
}

/** One shelf card: a painted banner, the pitch, and where the game currently stands. */
@Composable
private fun GameCard(
    name: String,
    pitch: String,
    status: String,
    statusTone: Color,
    footer: String,
    accent: Color,
    art: @Composable () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = Mascom.colors
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Radii.card))
            .background(c.surface.copy(alpha = 0.72f))
            .pressable(onClick, label = name, pressedScale = 0.985f),
    ) {
        Box(Modifier.fillMaxWidth().height(132.dp)) { art() }
        Column(Modifier.padding(PaddingValues(16.dp))) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    name,
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                    color = c.label,
                    modifier = Modifier.weight(1f),
                )
                GameChip(status, tone = statusTone)
            }
            Spacer(Modifier.height(6.dp))
            Text(pitch, style = MaterialTheme.typography.bodyMedium, color = c.label2)
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(6.dp).clip(CircleShape).background(accent))
                Spacer(Modifier.width(8.dp))
                Text(
                    footer.uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.1.em),
                    color = c.label3,
                )
            }
        }
    }
}

/** Campus Heist's banner: three vault doors under a sweep of light. */
@Composable
private fun VaultArt() {
    val sweep by rememberInfiniteTransition(label = "vault-art").animateFloat(
        initialValue = -0.3f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(tween(4200, easing = LinearEasing)),
        label = "sweep",
    )
    Canvas(Modifier.fillMaxSize()) {
        drawRect(Brush.linearGradient(listOf(Color(0xFF1B2750), Color(0xFF0A1128))))
        val doorW = size.width * 0.17f
        val doorH = size.height * 0.62f
        val gap = size.width * 0.06f
        val startX = size.width / 2 - (doorW * 1.5f + gap)
        repeat(3) { i ->
            val x = startX + i * (doorW + gap)
            val y = size.height / 2 - doorH / 2
            val alarm = i == 2
            drawRoundRect(
                brush = Brush.verticalGradient(
                    if (alarm) listOf(Color(0xFF4A0C1C), Color(0xFF2A0512))
                    else listOf(Color(0xFF243466), Color(0xFF131E42)),
                ),
                topLeft = Offset(x, y),
                size = Size(doorW, doorH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(14f),
            )
            drawRoundRect(
                color = if (alarm) Color(0xFFFF4D6D).copy(alpha = 0.5f) else Gold.g400.copy(alpha = 0.45f),
                topLeft = Offset(x, y),
                size = Size(doorW, doorH),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(14f),
                style = Stroke(width = 2.5f),
            )
            dial(Offset(x + doorW / 2, y + doorH * 0.62f), doorW * 0.24f)
        }
        // A slow band of light passing over the doors.
        drawRect(
            Brush.horizontalGradient(
                0f to Color.Transparent,
                (sweep - 0.14f).coerceIn(0f, 1f) to Color.Transparent,
                sweep.coerceIn(0f, 1f) to Color.White.copy(alpha = 0.10f),
                (sweep + 0.14f).coerceIn(0f, 1f) to Color.Transparent,
                1f to Color.Transparent,
            ),
        )
    }
}

private fun DrawScope.dial(center: Offset, radius: Float) {
    drawCircle(Color.White.copy(alpha = 0.07f), radius, center)
    drawCircle(Gold.g400.copy(alpha = 0.4f), radius, center, style = Stroke(1.5f))
}

/** Trophy Trouble's banner: a lit trophy with four runners circling it. */
@Composable
private fun TrophyArt() {
    val spin by rememberInfiniteTransition(label = "trophy-art").animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(9000, easing = LinearEasing)),
        label = "spin",
    )
    val glow by rememberInfiniteTransition(label = "trophy-glow").animateFloat(
        initialValue = 0.45f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(tween(1700, easing = LinearEasing), RepeatMode.Reverse),
        label = "glow",
    )
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            drawRect(Brush.linearGradient(listOf(Color(0xFF14284A), Color(0xFF071022))))
            val center = Offset(size.width / 2, size.height / 2)
            val radius = size.minDimension * 0.62f
            drawCircle(
                Brush.radialGradient(
                    listOf(Gold.g400.copy(alpha = 0.3f * glow), Color.Transparent),
                    center,
                    radius,
                ),
                radius,
                center,
            )
            // Four chasers on an orbit, evenly spaced and always mid-chase.
            val orbit = size.minDimension * 0.42f
            val palette = listOf(Color(0xFF2DD4BF), Color(0xFF6EA8FF), Color(0xFFFF4D6D), Color(0xFFF3CB5C))
            repeat(4) { i ->
                val angle = ((spin + i / 4f) * 2f * Math.PI).toFloat()
                val p = Offset(
                    center.x + orbit * kotlin.math.cos(angle) * 1.6f,
                    center.y + orbit * kotlin.math.sin(angle) * 0.5f,
                )
                drawCircle(palette[i].copy(alpha = 0.85f), size.minDimension * 0.045f, p)
            }
        }
        Icon(
            Icons.Rounded.EmojiEvents,
            contentDescription = null,
            modifier = Modifier.size(56.dp),
            tint = Gold.g300,
        )
    }
}
