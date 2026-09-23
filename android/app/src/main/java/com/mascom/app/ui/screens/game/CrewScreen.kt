package com.mascom.app.ui.screens.game

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalClipboard
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.data.remote.dto.CrewDto
import com.mascom.app.data.remote.dto.CrewRowDto
import com.mascom.app.data.remote.dto.EventDto
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
import kotlinx.coroutines.launch

/**
 * The Friday Big Heist: a crew of three, one run each, one shared score. The roster locks the
 * moment the event opens, which is why "leave" disappears at 6 PM.
 */
@Composable
fun HeistCrewScreen(onBack: () -> Unit, onRaid: (String) -> Unit) {
    val vm: CrewViewModel = hiltViewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.openRaid) {
        state.openRaid?.let { id ->
            vm.raidOpened()
            onRaid(id)
        }
    }

    GameTheme {
        GlassScaffold(
            title = "Friday Big Heist",
            onBack = onBack,
            refreshing = state.loading && state.crew != null,
            onRefresh = vm::refresh,
            backdrop = { GameBackdrop(it) },
        ) {
            item { GameToast(state.message, vm::clearMessage, Modifier.padding(top = 4.dp)) }

            val data = state.crew
            when {
                state.loading && data == null -> item { LoadingView() }
                data == null -> item { MessageView("Can't reach the event", state.error ?: "") }
                else -> {
                    item { EventBanner(data.event, Modifier.appear(0)) }
                    val crew = data.crew
                    if (crew == null) {
                        item { GameSection("Get a crew together") }
                        item { CrewSetup(state.busy, Modifier.appear(1), vm::create, vm::join) }
                    } else {
                        item { GameSection("Your crew") }
                        item {
                            CrewCard(
                                crew = crew,
                                event = data.event,
                                busy = state.busy,
                                modifier = Modifier.appear(1),
                                onLeave = vm::leave,
                                onStart = vm::startEventRaid,
                            )
                        }
                    }
                    val board = state.board
                    if (board != null && board.rows.isNotEmpty()) {
                        item { GameSection("Crew table") }
                        itemsIndexed(board.rows) { index, row -> CrewRow(row, board.maxScore, index) }
                    }
                }
            }
        }
    }
}

@Composable
private fun EventBanner(event: EventDto, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    Card(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (event.open) c.ok.copy(alpha = 0.18f) else c.fill.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (event.open) Icons.Rounded.Bolt else Icons.Rounded.Groups,
                    null,
                    Modifier.size(22.dp),
                    tint = if (event.open) c.ok else c.tint,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    if (event.open) "Open now" else "Opens Friday, 6 PM",
                    style = MaterialTheme.typography.titleMedium,
                    color = if (event.open) c.ok else c.label,
                )
                Text(
                    "${event.crewSize} raiders · up to ${event.maxScore} coins together",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label2,
                )
            }
        }
    }
}

@Composable
private fun CrewSetup(busy: Boolean, modifier: Modifier = Modifier, onCreate: (String) -> Unit, onJoin: (String) -> Unit) {
    val c = Mascom.colors
    var name by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    Column(modifier) {
        Card {
            Text("Start a crew", style = MaterialTheme.typography.titleMedium, color = c.label)
            Spacer(Modifier.height(4.dp))
            Text(
                "You get a code to share. Two more can join until the event opens.",
                style = MaterialTheme.typography.bodySmall,
                color = c.label2,
            )
            Spacer(Modifier.height(14.dp))
            MascomTextField(name, { name = it.take(24) }, "Crew name")
            Spacer(Modifier.height(12.dp))
            MascomButton(
                "Create crew",
                { onCreate(name) },
                enabled = name.trim().length >= 2,
                loading = busy,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Spacer(Modifier.height(12.dp))
        Card {
            Text("Join with a code", style = MaterialTheme.typography.titleMedium, color = c.label)
            Spacer(Modifier.height(14.dp))
            MascomTextField(
                value = code,
                onValueChange = { code = it.take(5).uppercase() },
                label = "Crew code",
                placeholder = "5 letters and numbers",
                imeAction = ImeAction.Done,
                onImeAction = { onJoin(code) },
            )
            Spacer(Modifier.height(12.dp))
            MascomButton(
                "Join crew",
                { onJoin(code) },
                kind = ButtonKind.Secondary,
                enabled = code.trim().length == 5,
                loading = busy,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun CrewCard(
    crew: CrewDto,
    event: EventDto,
    busy: Boolean,
    modifier: Modifier = Modifier,
    onLeave: () -> Unit,
    onStart: () -> Unit,
) {
    val c = Mascom.colors
    val clipboard = LocalClipboard.current
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    Card(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(crew.name, style = MaterialTheme.typography.headlineSmall, color = c.label)
                Text(
                    "${crew.members.size} of ${event.crewSize} raiders",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Coins(crew.score)
                Text("CREW SCORE", style = MaterialTheme.typography.labelSmall, color = c.label3)
            }
        }
        Spacer(Modifier.height(14.dp))
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(Radii.md))
                .background(c.fill.copy(alpha = 0.28f))
                .pressable(
                    onClick = {
                        scope.launch {
                            clipboard.setClipEntry(
                                androidx.compose.ui.platform.ClipEntry(
                                    android.content.ClipData.newPlainText("Crew code", crew.code),
                                ),
                            )
                        }
                    },
                    label = "Copy crew code",
                )
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text("CREW CODE", style = MaterialTheme.typography.labelSmall, color = c.label3)
                Text(
                    crew.code,
                    style = MaterialTheme.typography.headlineSmall.copy(letterSpacing = 0.3.em, fontWeight = FontWeight.Bold),
                    color = c.tint,
                )
            }
            Icon(Icons.Rounded.ContentCopy, "Copy", Modifier.size(18.dp), tint = c.label2)
        }
        Spacer(Modifier.height(14.dp))
        crew.members.forEach { member ->
            Row(Modifier.fillMaxWidth().padding(vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(Gold.g300, Gold.g600))),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        member.alias.take(1).uppercase(),
                        style = MaterialTheme.typography.labelLarge,
                        color = c.tintContrast,
                    )
                }
                Spacer(Modifier.width(10.dp))
                Text(member.alias, style = MaterialTheme.typography.bodyLarge, color = c.label, modifier = Modifier.weight(1f))
                if (member.score != null) {
                    Coins(member.score, size = 15.sp, color = c.label2)
                } else {
                    GameChip(if (event.open) "Yet to run" else "Ready", tone = c.label3)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        if (event.open) {
            MascomButton(
                "Enter the vault",
                onStart,
                loading = busy,
                icon = Icons.Rounded.Bolt,
                modifier = Modifier.fillMaxWidth(),
            )
        } else {
            MascomButton("Leave crew", onLeave, kind = ButtonKind.Destructive, loading = busy, modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
private fun CrewRow(row: CrewRowDto, maxScore: Int, index: Int) {
    val c = Mascom.colors
    val progress = if (maxScore > 0) row.score.toFloat() / maxScore else 0f
    Card(Modifier.padding(bottom = 8.dp).appear(index), padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "${row.rank}",
                style = MaterialTheme.typography.titleMedium,
                color = if (row.rank == 1) c.tint else c.label3,
                modifier = Modifier.width(26.dp),
            )
            Column(Modifier.weight(1f)) {
                Text(
                    row.name + if (row.isMine) " · yours" else "",
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (row.isMine) c.tint else c.label,
                )
                Text("${row.members} raiders", style = MaterialTheme.typography.bodySmall, color = c.label3)
            }
            Coins(row.score, size = 15.sp, color = c.label2)
        }
        Spacer(Modifier.height(10.dp))
        // How far this crew got towards the 540 a perfect night is worth.
        Box(Modifier.fillMaxWidth().height(5.dp).clip(CircleShape).background(c.fill.copy(alpha = 0.3f))) {
            Box(
                Modifier
                    .fillMaxWidth(progress.coerceIn(0f, 1f))
                    .height(5.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(Gold.g500, Gold.g300))),
            )
        }
    }
}
