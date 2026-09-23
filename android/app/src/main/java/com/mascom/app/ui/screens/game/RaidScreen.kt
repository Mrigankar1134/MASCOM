package com.mascom.app.ui.screens.game

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
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
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.automirrored.rounded.DirectionsRun
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.data.remote.dto.RaidDto
import com.mascom.app.data.remote.dto.TargetDto
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Confetti
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.RoundIconButton
import com.mascom.app.ui.components.SuccessMark
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.components.shake
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import kotlinx.coroutines.delay
import java.time.Instant
import kotlin.math.max
import kotlin.random.Random

private const val FIRST_DOOR = 80
private const val SECOND_DOOR = 180

/**
 * One raid, start to finish. Every outcome on this screen came from the server: the doors arrive
 * as "closed", "safe" or "alarm" and the screen only animates the reveal.
 */
@Composable
fun RaidScreen(practice: Boolean, onExit: () -> Unit) {
    GameTheme {
        Box(Modifier.fillMaxSize()) {
            GameBackdrop(Modifier.fillMaxSize())
            if (practice) PracticeRaid(onExit) else LiveRaid(onExit)
        }
    }
}

@Composable
private fun LiveRaid(onExit: () -> Unit) {
    val vm: RaidViewModel = hiltViewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    when {
        state.loading -> Box(Modifier.fillMaxSize(), Alignment.Center) {
            CircularProgressIndicator(color = Mascom.colors.tint)
        }
        state.raid == null -> Box(Modifier.fillMaxSize().padding(32.dp), Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    state.error ?: "That raid is gone.",
                    style = MaterialTheme.typography.titleMedium,
                    color = Mascom.colors.label,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(20.dp))
                MascomButton("Back", onExit, kind = ButtonKind.Secondary)
            }
        }
        else -> RaidStage(
            raid = state.raid!!,
            busy = state.busy,
            message = state.message,
            practice = false,
            onOpen = vm::open,
            onEscape = vm::escape,
            onExpired = vm::reload,
            onDismissMessage = vm::clearMessage,
            onExit = onExit,
        )
    }
}

/**
 * Practice runs entirely on the device and is never scored or sent anywhere — it exists so the
 * three real attempts a day aren't spent learning the shape of the game.
 */
@Composable
private fun PracticeRaid(onExit: () -> Unit) {
    var round by remember { mutableIntStateOf(0) }
    var alarm by remember(round) { mutableIntStateOf(Random.nextInt(3)) }
    var opened by remember(round) { mutableStateOf(emptyList<Int>()) }

    val safeOpened = opened.count { it != alarm }
    val caught = opened.any { it == alarm }
    val settled = if (caught) 0 else if (safeOpened >= 2) SECOND_DOOR else if (safeOpened == 1) FIRST_DOOR else 0
    var escaped by remember(round) { mutableStateOf(false) }
    val phase = when {
        caught || escaped || safeOpened >= 2 -> "settled"
        safeOpened == 1 -> "decision"
        else -> "active"
    }
    val raid = RaidDto(
        id = "practice",
        mode = "practice",
        phase = phase,
        doors = List(3) { i ->
            when {
                opened.contains(i) -> if (i == alarm) "alarm" else "safe"
                phase == "settled" && i == alarm -> "alarm"
                else -> "closed"
            }
        },
        provisional = if (caught) 0 else settled,
        outcome = if (phase != "settled") null else if (caught) "caught" else "escaped",
        settledAmount = if (phase == "settled") settled else null,
        expiresAt = "",
    )

    RaidStage(
        raid = raid,
        busy = false,
        message = null,
        practice = true,
        onOpen = { door -> if (!opened.contains(door)) opened = opened + door },
        onEscape = { escaped = true },
        onExpired = {},
        onDismissMessage = {},
        onExit = onExit,
        onAgain = { round++; alarm = Random.nextInt(3) },
    )
}

@Composable
private fun RaidStage(
    raid: RaidDto,
    busy: Boolean,
    message: String?,
    practice: Boolean,
    onOpen: (Int) -> Unit,
    onEscape: () -> Unit,
    onExpired: () -> Unit,
    onDismissMessage: () -> Unit,
    onExit: () -> Unit,
    onAgain: (() -> Unit)? = null,
) {
    val c = Mascom.colors
    val haptics = LocalHapticFeedback.current
    val settled = raid.phase == "settled"
    val caught = raid.outcome == "caught"
    val alarmShowing = raid.doors.contains("alarm")
    var shakes by remember { mutableIntStateOf(0) }

    // The alarm arrives as a change in the door list; the room reacts to it once.
    LaunchedEffect(alarmShowing) {
        if (alarmShowing) {
            shakes++
            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.statusBars)
            .padding(horizontal = 18.dp)
            .shake(shakes),
    ) {
        Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            RoundIconButton(onClick = onExit, contentDescription = "Leave") {
                Icon(Icons.Rounded.Close, null, Modifier.size(18.dp))
            }
            Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                Text(
                    modeTitle(raid.mode, raid.target),
                    style = MaterialTheme.typography.titleMedium,
                    color = c.label,
                )
                Text(
                    if (practice) "Practice — nothing is scored" else "One alarm. Two payouts. Your call.",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                )
            }
            if (!practice && !settled && raid.expiresAt.isNotEmpty()) {
                RaidTimer(raid.expiresAt, onExpired)
            }
        }

        GameToast(message, onDismissMessage, Modifier.padding(top = 10.dp))

        Spacer(Modifier.weight(1f))

        LootBar(raid, Modifier.padding(bottom = 22.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            raid.doors.forEachIndexed { index, door ->
                Door(
                    index = index,
                    state = door,
                    enabled = !busy && !settled && door == "closed",
                    modifier = Modifier.weight(1f).appear(index),
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.ContextClick)
                        onOpen(index)
                    },
                )
            }
        }

        Spacer(Modifier.height(26.dp))

        Box(Modifier.fillMaxWidth().height(200.dp)) {
            AnimatedContent(
                targetState = raid.phase,
                transitionSpec = {
                    (fadeIn(tween(320, delayMillis = 120)) + slideInVertically(tween(420)) { it / 3 })
                        .togetherWith(fadeOut(tween(160)))
                },
                label = "raid-phase",
            ) { phase ->
                when (phase) {
                    "settled" -> Result(raid, practice, onExit, onAgain)
                    "decision" -> Decision(raid, busy, onEscape)
                    else -> Prompt()
                }
            }
        }
        Spacer(Modifier.weight(1f))
    }

    // The room floods red for a moment when the alarm goes off.
    if (caught || alarmShowing) AlarmFlash()
    if (settled && !caught && (raid.settledAmount ?: 0) > 0) {
        Confetti(Modifier.fillMaxSize())
    }
}

private fun modeTitle(mode: String, target: TargetDto?) = when (mode) {
    "friend" -> "Raid on ${target?.alias ?: "a friend"}"
    "event" -> "Friday Big Heist"
    "practice" -> "Practice run"
    else -> "Ranked raid"
}

// ---- Doors -----------------------------------------------------------------------------------

/** A vault door that turns over to show what was behind it. */
@Composable
private fun Door(index: Int, state: String, enabled: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    val open = state != "closed"
    val flip by animateFloatAsState(
        targetValue = if (open) 180f else 0f,
        animationSpec = tween(620, easing = FastOutSlowInEasing),
        label = "flip",
    )
    val shape = RoundedCornerShape(Radii.xl)
    Box(
        modifier
            .aspectRatio(0.62f)
            .graphicsLayer {
                rotationY = flip
                cameraDistance = 14f * density
            }
            .clip(shape)
            .then(if (enabled) Modifier.pressable(onClick, label = "Open door ${index + 1}", pressedScale = 0.94f) else Modifier),
        contentAlignment = Alignment.Center,
    ) {
        if (flip <= 90f) {
            ClosedDoor(index, enabled)
        } else {
            // The back of the card would otherwise read mirrored.
            Box(Modifier.fillMaxSize().graphicsLayer { rotationY = 180f }, contentAlignment = Alignment.Center) {
                if (state == "alarm") AlarmDoor() else SafeDoor()
            }
        }
    }
}

@Composable
private fun ClosedDoor(index: Int, enabled: Boolean) {
    val c = Mascom.colors
    val glow by rememberInfiniteTransition(label = "door").animateFloat(
        initialValue = 0.25f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(tween(1800 + index * 260, easing = LinearEasing), RepeatMode.Reverse),
        label = "glow",
    )
    Box(
        Modifier
            .fillMaxSize()
            .background(Brush.linearGradient(listOf(Color(0xFF1B2750), Color(0xFF0C142E)))),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.fillMaxSize()) {
            // Brushed-steel sheen and a rim that breathes while the door can still be opened.
            drawRect(
                Brush.linearGradient(
                    listOf(Color.White.copy(alpha = 0.10f), Color.Transparent, Color.White.copy(alpha = 0.05f)),
                    start = Offset(0f, 0f),
                    end = Offset(size.width, size.height),
                ),
            )
            val rim = if (enabled) Gold.g400.copy(alpha = glow) else Color.White.copy(alpha = 0.12f)
            drawRoundRect(
                color = rim,
                topLeft = Offset(3f, 3f),
                size = androidx.compose.ui.geometry.Size(size.width - 6f, size.height - 6f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(size.minDimension * 0.16f),
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3f),
            )
            // The dial.
            val center = Offset(size.width / 2, size.height * 0.62f)
            val radius = size.minDimension * 0.22f
            drawCircle(Color.White.copy(alpha = 0.06f), radius, center)
            drawCircle(Gold.g400.copy(alpha = 0.5f), radius, center, style = androidx.compose.ui.graphics.drawscope.Stroke(2f))
            repeat(12) { tick ->
                val a = (tick / 12f) * 2f * Math.PI.toFloat()
                val from = Offset(center.x + radius * 0.78f * kotlin.math.cos(a), center.y + radius * 0.78f * kotlin.math.sin(a))
                val to = Offset(center.x + radius * 0.96f * kotlin.math.cos(a), center.y + radius * 0.96f * kotlin.math.sin(a))
                drawLine(Color.White.copy(alpha = 0.22f), from, to, strokeWidth = 2f)
            }
        }
        Text(
            "${index + 1}",
            style = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.ExtraBold, fontSize = 34.sp),
            color = Color.White.copy(alpha = 0.9f),
            modifier = Modifier.padding(bottom = 62.dp),
        )
    }
}

@Composable
private fun SafeDoor() {
    val c = Mascom.colors
    Box(
        Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF14322F), Color(0xFF0A1C2A)))),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            // A little stack of coins, springing in.
            val rise = remember { Animatable(0f) }
            LaunchedEffect(Unit) { rise.animateTo(1f, spring(dampingRatio = 0.5f, stiffness = 260f)) }
            Column(
                Modifier.graphicsLayer { scaleX = rise.value; scaleY = rise.value },
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(3.dp),
            ) {
                repeat(3) { i ->
                    Box(
                        Modifier
                            .width((34 - i * 2).dp)
                            .height(9.dp)
                            .clip(RoundedCornerShape(50))
                            .background(Brush.linearGradient(listOf(Gold.g200, Gold.g500))),
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            Text("CLEAR", style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.2.em), color = c.ok)
        }
    }
}

@Composable
private fun AlarmDoor() {
    val c = Mascom.colors
    val pulse by rememberInfiniteTransition(label = "alarm").animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(520, easing = LinearEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    Box(
        Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF4A0C1C), Color(0xFF2A0512)))),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .size(56.dp)
                .graphicsLayer { alpha = pulse }
                .clip(CircleShape)
                .background(c.danger.copy(alpha = 0.25f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Rounded.NotificationsActive, null, Modifier.size(30.dp), tint = c.danger)
        }
        Text(
            "ALARM",
            style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.2.em),
            color = c.danger,
            modifier = Modifier.padding(top = 92.dp),
        )
    }
}

/** A red wash over the whole screen the instant the alarm is hit. */
@Composable
private fun AlarmFlash() {
    val alpha = remember { Animatable(0.55f) }
    LaunchedEffect(Unit) { alpha.animateTo(0f, tween(900, easing = LinearEasing)) }
    if (alpha.value > 0.01f) {
        Canvas(Modifier.fillMaxSize()) {
            drawRect(
                Brush.radialGradient(
                    listOf(Color.Transparent, Color(0xFFFF1744).copy(alpha = alpha.value)),
                    center = Offset(size.width / 2, size.height / 2),
                    radius = size.maxDimension * 0.7f,
                ),
            )
        }
    }
}

// ---- Panels ----------------------------------------------------------------------------------

/** What is on the table right now, and what the next door is worth. */
@Composable
private fun LootBar(raid: RaidDto, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    val onTable = if (raid.phase == "settled") raid.settledAmount ?: 0 else raid.provisional
    Column(modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            if (raid.phase == "settled") "TAKE" else "ON THE TABLE",
            style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.2.em),
            color = c.label3,
        )
        Spacer(Modifier.height(4.dp))
        AnimatedContent(
            targetState = onTable,
            transitionSpec = { (slideInVertically { it } + fadeIn() + scaleIn(initialScale = 0.7f)).togetherWith(fadeOut(tween(120))) },
            label = "loot",
        ) { value ->
            Coins(value, size = 40.sp, color = if (value == 0) c.label3 else c.tint)
        }
        if (raid.rewardCap != null && raid.phase != "settled") {
            Spacer(Modifier.height(6.dp))
            GameChip("Capped at ${raid.rewardCap}", tone = c.info)
        }
    }
}

@Composable
private fun Prompt() {
    val c = Mascom.colors
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Pick a door", style = MaterialTheme.typography.headlineSmall, color = c.label)
        Spacer(Modifier.height(6.dp))
        Text(
            "Two hold $FIRST_DOOR coins. One holds the alarm — open it and you walk out with nothing.",
            style = MaterialTheme.typography.bodyMedium,
            color = c.label2,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp),
        )
    }
}

@Composable
private fun Decision(raid: RaidDto, busy: Boolean, onEscape: () -> Unit) {
    val c = Mascom.colors
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Push your luck?", style = MaterialTheme.typography.headlineSmall, color = c.label)
        Spacer(Modifier.height(6.dp))
        Text(
            "Walk away with ${raid.provisional}, or open the second door for $SECOND_DOOR — " +
                "one of the two left is the alarm.",
            style = MaterialTheme.typography.bodyMedium,
            color = c.label2,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 12.dp),
        )
        Spacer(Modifier.height(16.dp))
        MascomButton(
            text = "Escape with ${raid.provisional}",
            onClick = onEscape,
            kind = ButtonKind.Success,
            loading = busy,
            icon = Icons.AutoMirrored.Rounded.DirectionsRun,
            modifier = Modifier.fillMaxWidth(0.8f),
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "or tap another door",
            style = MaterialTheme.typography.bodySmall,
            color = c.label3,
        )
    }
}

@Composable
private fun Result(raid: RaidDto, practice: Boolean, onExit: () -> Unit, onAgain: (() -> Unit)?) {
    val c = Mascom.colors
    val caught = raid.outcome == "caught"
    val amount = raid.settledAmount ?: 0
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        if (caught) {
            Box(Modifier.size(54.dp).clip(CircleShape).background(c.danger.copy(alpha = 0.18f)), Alignment.Center) {
                Icon(Icons.Rounded.NotificationsActive, null, Modifier.size(28.dp), tint = c.danger)
            }
        } else {
            SuccessMark(Modifier.size(54.dp), color = c.ok)
        }
        Spacer(Modifier.height(10.dp))
        Text(
            when {
                caught -> "Caught"
                raid.outcome == "timeout" -> "Time ran out"
                else -> "Clean escape"
            },
            style = MaterialTheme.typography.headlineSmall,
            color = if (caught) c.danger else c.ok,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            resultLine(raid, practice),
            style = MaterialTheme.typography.bodyMedium,
            color = c.label2,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 14.dp),
        )
        Spacer(Modifier.height(18.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            if (onAgain != null) {
                MascomButton("Again", onAgain, kind = ButtonKind.Secondary, modifier = Modifier.width(120.dp))
            }
            MascomButton(if (practice) "Done" else "Back to base", onExit, modifier = Modifier.width(160.dp))
        }
    }
}

private fun resultLine(raid: RaidDto, practice: Boolean): String {
    val amount = raid.settledAmount ?: 0
    val nominal = raid.nominalAmount
    return when {
        raid.outcome == "caught" && practice -> "The alarm was behind that one. Nothing banked."
        raid.outcome == "caught" -> "The alarm was behind that one. This attempt scores 0."
        practice -> "$amount coins — practice only, nothing was scored."
        raid.mode == "friend" && nominal != null && nominal != amount ->
            "The doors were worth $nominal, but ${raid.target?.alias ?: "they"} only had $amount left to lose. " +
                "$amount moved across."
        raid.mode == "friend" -> "$amount coins taken from ${raid.target?.alias ?: "them"}."
        else -> "$amount coins added to your week."
    }
}

// ---- Timer -----------------------------------------------------------------------------------

/** Counts the raid down. The server settles an expired raid; this just asks for the result. */
@Composable
private fun RaidTimer(expiresAt: String, onExpired: () -> Unit) {
    val c = Mascom.colors
    val deadline = remember(expiresAt) {
        runCatching { Instant.parse(expiresAt).toEpochMilli() }.getOrDefault(0L)
    }
    var remaining by remember(expiresAt) { mutableIntStateOf(secondsLeft(deadline)) }
    LaunchedEffect(expiresAt) {
        while (remaining > 0) {
            delay(1000)
            remaining = secondsLeft(deadline)
        }
        onExpired()
    }
    if (deadline == 0L) return
    val urgent = remaining in 1..29
    val blink by rememberInfiniteTransition(label = "timer").animateFloat(
        initialValue = 1f,
        targetValue = if (urgent) 0.35f else 1f,
        animationSpec = infiniteRepeatable(tween(520, easing = LinearEasing), RepeatMode.Reverse),
        label = "blink",
    )
    Row(
        Modifier
            .graphicsLayer { alpha = blink }
            .clip(CircleShape)
            .background((if (urgent) c.danger else c.fill).copy(alpha = 0.2f))
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Rounded.Timer, null, Modifier.size(14.dp), tint = if (urgent) c.danger else c.label2)
        Spacer(Modifier.width(5.dp))
        Text(
            "%d:%02d".format(remaining / 60, remaining % 60),
            style = MaterialTheme.typography.labelMedium,
            color = if (urgent) c.danger else c.label2,
        )
    }
}

private fun secondsLeft(deadline: Long): Int =
    max(0L, (deadline - System.currentTimeMillis()) / 1000).toInt()
