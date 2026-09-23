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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Group
import androidx.compose.material.icons.rounded.PersonAdd
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.data.remote.dto.FriendDto
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

/**
 * Friend raids: who you can take coins from right now, who is waiting on you, and search to add
 * someone new. The server decides raidability — the row just shows the reason it gave.
 */
@Composable
fun HeistFriendsScreen(onBack: () -> Unit, onRaid: (String) -> Unit) {
    val vm: FriendsViewModel = hiltViewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    LaunchedEffect(state.openRaid) {
        state.openRaid?.let { id ->
            vm.raidOpened()
            onRaid(id)
        }
    }

    GameTheme {
        GlassScaffold(
            title = "Friends",
            onBack = onBack,
            refreshing = state.loading && state.data != null,
            onRefresh = vm::refresh,
            backdrop = { GameBackdrop(it) },
        ) {
            item { GameToast(state.message, vm::clearMessage, Modifier.padding(top = 4.dp)) }
            item {
                MascomTextField(
                    value = state.query,
                    onValueChange = vm::search,
                    label = "Find a player",
                    placeholder = "Search by alias",
                    imeAction = ImeAction.Search,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }

            val data = state.data
            if (data == null) {
                item { if (state.loading) LoadingView() else MessageView("Can't load friends", state.error ?: "") }
                return@GlassScaffold
            }

            if (data.results.isNotEmpty()) {
                item { GameSection("Search results") }
                items(data.results, key = { "result-${it.userId}" }) { player ->
                    PlayerRow(player, state.busyWith == player.userId) {
                        MascomButton(
                            "Add",
                            { vm.request(player.userId) },
                            kind = ButtonKind.Secondary,
                            height = 38.dp,
                            icon = Icons.Rounded.PersonAdd,
                        )
                    }
                }
            }

            if (data.incoming.isNotEmpty()) {
                item { GameSection("Wants to be friends") }
                items(data.incoming, key = { "in-${it.userId}" }) { player ->
                    PlayerRow(player, state.busyWith == player.userId) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            MascomButton("Accept", { vm.accept(player.userId) }, height = 38.dp, icon = Icons.Rounded.Check)
                            IconAction(Icons.Rounded.Block, "Block") { vm.block(player.userId) }
                        }
                    }
                }
            }

            if (data.outgoing.isNotEmpty()) {
                item { GameSection("Waiting on them") }
                items(data.outgoing, key = { "out-${it.userId}" }) { player ->
                    PlayerRow(player, state.busyWith == player.userId) {
                        GameChip("Sent", tone = Mascom.colors.label3)
                    }
                }
            }

            item { GameSection("Your friends") }
            if (data.friends.isEmpty()) {
                item {
                    MessageView(
                        title = "No friends yet",
                        body = "Search for someone's alias above. Friend raids move real coins between your stashes.",
                        icon = Icons.Rounded.Group,
                        tint = Mascom.colors.tint,
                    )
                }
            } else {
                items(data.friends, key = { "friend-${it.userId}" }) { friend ->
                    PlayerRow(friend, state.busyWith == friend.userId) {
                        if (friend.raidable) {
                            MascomButton("Raid", { vm.raid(friend.userId) }, height = 38.dp)
                        } else {
                            GameChip(friend.reason ?: "Not now", tone = Mascom.colors.label3)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerRow(player: FriendDto, busy: Boolean, trailing: @Composable () -> Unit) {
    val c = Mascom.colors
    Card(Modifier.padding(bottom = 8.dp).appear(), padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(Gold.g300, Gold.g600))),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    player.alias.take(1).uppercase(),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = c.tintContrast,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(player.alias, style = MaterialTheme.typography.bodyLarge, color = c.label)
                Text(
                    buildString {
                        append(player.cohort.ifEmpty { "No cohort" })
                        if (player.raidable) append(" · up to ${player.exposure} to take")
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                )
            }
            Spacer(Modifier.width(8.dp))
            if (busy) CircularProgressIndicator(Modifier.size(22.dp), color = c.tint, strokeWidth = 2.dp) else trailing()
        }
    }
}

@Composable
private fun IconAction(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    val c = Mascom.colors
    Box(
        Modifier
            .size(38.dp)
            .clip(CircleShape)
            .background(c.fill.copy(alpha = 0.35f))
            .pressable(onClick, label = label),
        contentAlignment = Alignment.Center,
    ) { Icon(icon, label, Modifier.size(18.dp), tint = c.label2) }
}
