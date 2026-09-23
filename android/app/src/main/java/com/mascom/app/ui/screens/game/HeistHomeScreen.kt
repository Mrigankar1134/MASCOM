package com.mascom.app.ui.screens.game

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.Group
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.data.remote.dto.EncounterDto
import com.mascom.app.data.remote.dto.EventDto
import com.mascom.app.data.remote.dto.GameHomeDto
import com.mascom.app.data.remote.dto.LeaderRowDto
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.LoadingView
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MascomTextField
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import java.time.Duration
import java.time.Instant

/**
 * The game's home: who you are this week, what you can still do today, and the way into every
 * other heist screen. Everything shown here is the server's answer to one /api/game/me call.
 */
@Composable
fun HeistHomeScreen(
    onBack: () -> Unit,
    onRaid: (String) -> Unit,
    onPractice: () -> Unit,
    onFriends: () -> Unit,
    onRankings: () -> Unit,
    onCrew: () -> Unit,
    onSignIn: () -> Unit,
) {
    val vm: HeistViewModel = hiltViewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    // Coming back from a raid, the week's numbers have moved.
    LaunchedEffect(Unit) { vm.refresh() }

    LaunchedEffect(state.openRaid) {
        state.openRaid?.let { id ->
            vm.raidOpened()
            onRaid(id)
        }
    }

    GameTheme {
        GlassScaffold(
            title = "Campus Heist",
            subtitle = state.home?.week?.id?.let { "Week ${it.substringAfter("-W")}" },
            onBack = onBack,
            refreshing = state.loading && state.home != null,
            onRefresh = vm::refresh,
            backdrop = { GameBackdrop(it) },
        ) {
            when {
                state.user == null -> item {
                    MessageView(
                        title = "Sign in to play",
                        body = "Campus Heist runs on your MASCOM account so scores stay on one campus table.",
                        icon = Icons.Rounded.Lock,
                        tint = Mascom.colors.tint,
                        actionText = "Sign in",
                        onAction = onSignIn,
                    )
                }
                state.loading && state.home == null -> item { LoadingView() }
                state.home == null -> item {
                    MessageView(
                        title = "Can't reach the vault",
                        body = state.error ?: "Something went wrong.",
                        actionText = "Try again",
                        onAction = vm::refresh,
                    )
                }
                state.home?.joined == false -> item {
                    JoinPanel(state.home!!, busy = state.busy, message = state.message, onJoin = vm::join, onDismiss = vm::clearMessage)
                }
                else -> {
                    val home = state.home!!
                    item { GameToast(state.message, vm::clearMessage, Modifier.padding(top = 4.dp)) }
                    item { PlayerCard(home, Modifier.appear(0)) }
                    item {
                        RaidPanel(
                            home = home,
                            busy = state.busy,
                            modifier = Modifier.appear(1),
                            onRanked = vm::startRanked,
                            onResume = { home.activeRaid?.let(vm::resume) },
                            onPractice = onPractice,
                        )
                    }
                    item { GameSection("Your vault") }
                    item {
                        VaultCard(
                            home = home,
                            busy = state.busy,
                            modifier = Modifier.appear(2),
                            onArm = vm::setAlarm,
                            onToggle = vm::toggleFriendRaids,
                        )
                    }
                    item { GameSection("Where to next") }
                    item {
                        Row(Modifier.fillMaxWidth().appear(3), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            NavTile("Friends", Icons.Rounded.Group, Modifier.weight(1f), onFriends)
                            NavTile("Rankings", Icons.Rounded.EmojiEvents, Modifier.weight(1f), onRankings)
                            NavTile("Crew", Icons.Rounded.Groups, Modifier.weight(1f), onCrew)
                        }
                    }
                    item { GameSection("Friday Big Heist") }
                    item { EventCard(home.event, Modifier.appear(4), onCrew) }
                    if (home.week.top.isNotEmpty()) {
                        item { GameSection("This week's leaders") { More(onRankings) } }
                        item { LeadersCard(home.week.top, Modifier.appear(5)) }
                    }
                    if (home.encounters.isNotEmpty()) {
                        item { GameSection("Recent encounters") }
                        items(home.encounters.take(6)) { encounter -> EncounterRow(encounter) }
                    }
                    item { GameSection("How it works") }
                    item { RulesCard(Modifier.appear(6)) }
                }
            }
        }
    }
}

// ---- Joining ---------------------------------------------------------------------------------

@Composable
private fun JoinPanel(
    home: GameHomeDto,
    busy: Boolean,
    message: String?,
    onJoin: (String, String, Boolean) -> Unit,
    onDismiss: () -> Unit,
) {
    val c = Mascom.colors
    var alias by rememberSaveable(home.suggestedAlias) { mutableStateOf(home.suggestedAlias) }
    var cohort by rememberSaveable { mutableStateOf(home.cohorts.firstOrNull().orEmpty()) }
    var optIn by rememberSaveable { mutableStateOf(true) }

    Column(Modifier.padding(top = 8.dp)) {
        GameToast(message, onDismiss, Modifier.padding(bottom = 10.dp))
        Card(padding = androidx.compose.foundation.layout.PaddingValues(20.dp)) {
            Text("Three doors. One alarm.", style = MaterialTheme.typography.headlineMedium, color = c.label)
            Spacer(Modifier.height(6.dp))
            Text(
                "Raid a stranger's vault three times a day. Open one door for ${home.rules.first} coins, " +
                    "or risk it for ${home.rules.second}. Hit the alarm and the run is worth nothing.",
                style = MaterialTheme.typography.bodyMedium,
                color = c.label2,
            )
            Spacer(Modifier.height(20.dp))
            MascomTextField(alias, { alias = it.take(18) }, "Alias", placeholder = "What the leaderboard calls you")
            Spacer(Modifier.height(14.dp))
            Text("COHORT", style = MaterialTheme.typography.labelSmall, color = c.label3)
            Spacer(Modifier.height(8.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(home.cohorts) { option ->
                    ChoiceChip(option, option == cohort) { cohort = option }
                }
            }
            Spacer(Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Let friends raid me", style = MaterialTheme.typography.bodyLarge, color = c.label)
                    Text(
                        "They can take coins from your weekly stash — and you from theirs.",
                        style = MaterialTheme.typography.bodySmall,
                        color = c.label3,
                    )
                }
                Switch(optIn, { optIn = it }, colors = switchColors())
            }
            Spacer(Modifier.height(20.dp))
            MascomButton(
                text = "Join Campus Heist",
                onClick = { onJoin(alias, cohort, optIn) },
                enabled = alias.trim().length >= 2 && cohort.isNotEmpty(),
                loading = busy,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun ChoiceChip(text: String, selected: Boolean, onClick: () -> Unit) {
    val c = Mascom.colors
    Box(
        Modifier
            .clip(CircleShape)
            .background(if (selected) c.tintSolid else c.fill.copy(alpha = 0.4f))
            .pressable(onClick, label = text)
            .padding(horizontal = 16.dp, vertical = 9.dp),
    ) {
        Text(
            text,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) c.tintContrast else c.label,
        )
    }
}

@Composable
private fun switchColors() = SwitchDefaults.colors(
    checkedThumbColor = Mascom.colors.tintContrast,
    checkedTrackColor = Mascom.colors.tintSolid,
    uncheckedTrackColor = Mascom.colors.fill,
    uncheckedBorderColor = Mascom.colors.separator,
)

// ---- Panels ----------------------------------------------------------------------------------

@Composable
private fun PlayerCard(home: GameHomeDto, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    val profile = home.profile ?: return
    Card(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(Gold.g300, Gold.g600))),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    profile.alias.take(1).uppercase(),
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                    color = c.tintContrast,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(profile.alias, style = MaterialTheme.typography.titleMedium, color = c.label)
                Text(profile.cohort, style = MaterialTheme.typography.bodySmall, color = c.label3)
            }
            Column(horizontalAlignment = Alignment.End) {
                Coins(profile.stash)
                Text("STASH LEFT", style = MaterialTheme.typography.labelSmall, color = c.label3)
            }
        }
        Spacer(Modifier.height(18.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            StatTile("points", "${home.week.points}", tone = c.tint)
            StatTile("rank", if (home.week.rank > 0) "#${home.week.rank}" else "—")
            StatTile("raids left", "${home.attempts.ranked}", tone = if (home.attempts.ranked > 0) c.ok else c.label3)
        }
    }
}

@Composable
private fun RaidPanel(
    home: GameHomeDto,
    busy: Boolean,
    modifier: Modifier = Modifier,
    onRanked: () -> Unit,
    onResume: () -> Unit,
    onPractice: () -> Unit,
) {
    val c = Mascom.colors
    val active = home.activeRaid
    val left = home.attempts.ranked
    val sweep by rememberInfiniteTransition(label = "cta").animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2600, easing = LinearEasing), RepeatMode.Restart),
        label = "sweep",
    )
    Card(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                if (active != null) "A raid is still open" else "Ranked raid",
                style = MaterialTheme.typography.titleMedium,
                color = c.label,
                modifier = Modifier.weight(1f),
            )
            GameChip(
                if (left == 1) "1 left today" else "$left left today",
                tone = if (left > 0) c.ok else c.danger,
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(
            when {
                active != null -> "Finish it before the timer runs out."
                left > 0 -> "The server picks someone on campus. Three doors, one alarm."
                else -> "You're out of ranked raids. They come back at midnight."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = c.label2,
        )
        Spacer(Modifier.height(16.dp))
        Box {
            MascomButton(
                text = if (active != null) "Resume raid" else "Start raid",
                onClick = if (active != null) onResume else onRanked,
                enabled = active != null || left > 0,
                loading = busy,
                icon = Icons.Rounded.PlayArrow,
                height = 56.dp,
                modifier = Modifier.fillMaxWidth(),
            )
            // A light sweeps across the call to action while a raid is available.
            if (active == null && left > 0 && !busy) {
                Box(
                    Modifier
                        .matchParentSize()
                        .clip(RoundedCornerShape(Radii.md + 2.dp))
                        .graphicsLayer { alpha = 0.35f }
                        .background(
                            Brush.horizontalGradient(
                                0f to Color.Transparent,
                                (sweep - 0.12f).coerceIn(0f, 1f) to Color.Transparent,
                                sweep.coerceIn(0f, 1f) to Color.White.copy(alpha = 0.55f),
                                (sweep + 0.12f).coerceIn(0f, 1f) to Color.Transparent,
                                1f to Color.Transparent,
                            ),
                        ),
                )
            }
        }
        Spacer(Modifier.height(6.dp))
        MascomButton(
            text = "Practice run",
            onClick = onPractice,
            kind = ButtonKind.Plain,
            height = 44.dp,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun VaultCard(
    home: GameHomeDto,
    busy: Boolean,
    modifier: Modifier = Modifier,
    onArm: (Int) -> Unit,
    onToggle: (Boolean) -> Unit,
) {
    val c = Mascom.colors
    val profile = home.profile ?: return
    val locked = home.vault.lockedForToday
    Card(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.Shield, null, Modifier.size(20.dp), tint = c.tint)
            Spacer(Modifier.width(8.dp))
            Text("Today's alarm", style = MaterialTheme.typography.titleMedium, color = c.label, modifier = Modifier.weight(1f))
            if (locked) GameChip("Locked in", tone = c.info, icon = Icons.Rounded.Lock)
        }
        Spacer(Modifier.height(4.dp))
        Text(
            if (locked) {
                "Friends raiding you today hit the alarm on door ${(home.vault.alarmSlot ?: 0) + 1}. " +
                    "You can move it again tomorrow."
            } else {
                "Pick the door that trips the alarm when a friend raids you. One choice a day."
            },
            style = MaterialTheme.typography.bodyMedium,
            color = c.label2,
        )
        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            repeat(3) { slot ->
                val armed = home.vault.alarmSlot == slot
                MiniDoor(
                    index = slot,
                    armed = armed,
                    dimmed = locked && !armed,
                    enabled = !locked && !busy,
                    modifier = Modifier.weight(1f),
                    onClick = { onArm(slot) },
                )
            }
        }
        Spacer(Modifier.height(16.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Let friends raid me", style = MaterialTheme.typography.bodyLarge, color = c.label)
                Text(
                    "${profile.stash} of ${home.rules.weeklyStash} coins left this week" +
                        if (profile.reserved > 0) " · ${profile.reserved} held in a raid" else "",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                )
            }
            Switch(profile.socialOptIn, onToggle, enabled = !busy, colors = switchColors())
        }
    }
}

/** The small door used to arm the alarm; it glows red once it's the armed one. */
@Composable
private fun MiniDoor(
    index: Int,
    armed: Boolean,
    dimmed: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = Mascom.colors
    val pulse by rememberInfiniteTransition(label = "armed").animateFloat(
        initialValue = 0.45f,
        targetValue = if (armed) 1f else 0.45f,
        animationSpec = infiniteRepeatable(tween(1100, easing = LinearEasing), RepeatMode.Reverse),
        label = "pulse",
    )
    Column(
        modifier
            .clip(RoundedCornerShape(Radii.md))
            .background(if (armed) c.danger.copy(alpha = 0.16f) else c.fill.copy(alpha = if (dimmed) 0.12f else 0.3f))
            .then(if (enabled) Modifier.pressable(onClick, label = "Arm door ${index + 1}") else Modifier)
            .padding(vertical = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (armed) {
            Icon(
                Icons.Rounded.NotificationsActive,
                null,
                Modifier.size(20.dp).graphicsLayer { alpha = pulse },
                tint = c.danger,
            )
        } else {
            Text(
                "${index + 1}",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = if (dimmed) c.label4 else c.label2,
            )
        }
    }
}

@Composable
private fun NavTile(label: String, icon: ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val c = Mascom.colors
    Column(
        modifier
            .clip(RoundedCornerShape(Radii.lg))
            .background(c.surface.copy(alpha = 0.7f))
            .pressable(onClick, label = label)
            .padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, null, Modifier.size(22.dp), tint = c.tint)
        Spacer(Modifier.height(6.dp))
        Text(label, style = MaterialTheme.typography.labelMedium, color = c.label2)
    }
}

@Composable
private fun EventCard(event: EventDto, modifier: Modifier = Modifier, onCrew: () -> Unit) {
    val c = Mascom.colors
    Card(modifier, onClick = onCrew) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    if (event.open) "The vault is open" else "Friday, 6–11 PM",
                    style = MaterialTheme.typography.titleMedium,
                    color = if (event.open) c.ok else c.label,
                )
                Text(
                    when {
                        event.open -> "Crews of three. Every member gets one run."
                        event.crew != null -> "${event.crew.name} · ${event.crew.size}/${event.crewSize} in the crew"
                        else -> "Find two others and take the big vault together."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label2,
                )
            }
            if (!event.open) Countdown(event.startsAt)
            else GameChip("Live", tone = c.ok, filled = true, icon = Icons.Rounded.Bolt)
        }
    }
}

/** Time until the Friday event, in whole days and hours — the exact second doesn't matter. */
@Composable
private fun Countdown(startsAt: String) {
    val c = Mascom.colors
    val text = remember(startsAt) {
        val start = runCatching { Instant.parse(startsAt) }.getOrNull() ?: return@remember ""
        val gap = Duration.between(Instant.now(), start)
        when {
            gap.isNegative -> "soon"
            gap.toDays() >= 1 -> "in ${gap.toDays()}d ${gap.toHours() % 24}h"
            gap.toHours() >= 1 -> "in ${gap.toHours()}h ${gap.toMinutes() % 60}m"
            else -> "in ${gap.toMinutes()}m"
        }
    }
    Text(text, style = MaterialTheme.typography.labelMedium, color = c.tint)
}

@Composable
private fun LeadersCard(rows: List<LeaderRowDto>, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    Card(modifier, padding = androidx.compose.foundation.layout.PaddingValues(vertical = 6.dp)) {
        rows.forEach { row ->
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "${row.rank}",
                    style = MaterialTheme.typography.titleMedium,
                    color = if (row.rank == 1) c.tint else c.label3,
                    modifier = Modifier.width(28.dp),
                )
                Column(Modifier.weight(1f)) {
                    Text(
                        row.alias + if (row.isMe) " · you" else "",
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (row.isMe) c.tint else c.label,
                    )
                    Text(row.cohort, style = MaterialTheme.typography.bodySmall, color = c.label3)
                }
                Coins(row.points, size = 15.sp, color = c.label2)
            }
        }
    }
}

@Composable
private fun EncounterRow(encounter: EncounterDto) {
    val c = Mascom.colors
    val caught = encounter.outcome == "caught"
    val tone = when {
        caught -> c.danger
        encounter.raided -> c.ok
        else -> c.warn
    }
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(tone))
        Spacer(Modifier.width(12.dp))
        Text(
            buildString {
                append(if (encounter.raided) "You raided ${encounter.otherAlias}" else "${encounter.otherAlias} raided you")
                if (caught) append(" — alarm")
            },
            style = MaterialTheme.typography.bodyMedium,
            color = c.label,
            modifier = Modifier.weight(1f),
        )
        Text(
            if (caught) "0" else (if (encounter.raided) "+" else "−") + "${encounter.amount}",
            style = MaterialTheme.typography.titleSmall,
            color = if (caught) c.label3 else tone,
        )
    }
}

@Composable
private fun RulesCard(modifier: Modifier = Modifier) {
    val c = Mascom.colors
    var open by rememberSaveable { mutableStateOf(false) }
    Card(modifier, onClick = { open = !open }) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("The rules, in short", style = MaterialTheme.typography.titleMedium, color = c.label, modifier = Modifier.weight(1f))
            Text(if (open) "Hide" else "Read", style = MaterialTheme.typography.labelLarge, color = c.tint)
        }
        AnimatedVisibility(open) {
            Column(Modifier.padding(top = 12.dp)) {
                Rule("Three doors", "One hides the alarm. The first safe door pays 80, the second takes you to 180.")
                Rule("Three ranked raids a day", "Plus three friend raids. Points add up over the campus week.")
                Rule("Friend raids move real coins", "You start each week with 300 in your stash, and nobody can lose more than 120 a day.")
                Rule("Fridays are bigger", "6 to 11 PM, crews of three run one vault each for a shared score.")
            }
        }
    }
}

@Composable
private fun Rule(title: String, body: String) {
    val c = Mascom.colors
    Column(Modifier.padding(bottom = 12.dp)) {
        Text(title, style = MaterialTheme.typography.titleSmall, color = c.tint)
        Text(body, style = MaterialTheme.typography.bodyMedium, color = c.label2)
    }
}

@Composable
private fun More(onClick: () -> Unit) {
    Text(
        "SEE ALL",
        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.12.em),
        color = Mascom.colors.label2,
        modifier = Modifier.pressable(onClick, label = "See all"),
        textAlign = TextAlign.End,
    )
}
