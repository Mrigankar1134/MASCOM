package com.mascom.app.ui.screens.game

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.data.remote.dto.LeaderRowDto
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.LoadingView
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.Gold
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii

/** The weekly table, in three views. Ranks come from the server, ties and all. */
@Composable
fun HeistRankingsScreen(onBack: () -> Unit) {
    val vm: RankingsViewModel = hiltViewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    GameTheme {
        GlassScaffold(
            title = "Rankings",
            onBack = onBack,
            backdrop = { GameBackdrop(it) },
        ) {
            item {
                ScopeSwitch(state.scope, vm::select, Modifier.padding(top = 6.dp, bottom = 12.dp))
            }
            val board = state.board
            when {
                state.loading -> item { LoadingView() }
                board == null -> item { MessageView("Can't load the table", state.error ?: "") }
                board.rows.isEmpty() -> item {
                    MessageView(
                        title = "Nobody has scored yet",
                        body = "The first raid of the week puts someone on this board. It may as well be you.",
                        icon = Icons.Rounded.EmojiEvents,
                        tint = Mascom.colors.tint,
                    )
                }
                else -> {
                    itemsIndexed(board.rows) { index, row -> RankRow(row, index) }
                    val me = board.me
                    if (me != null && board.rows.none { it.isMe }) {
                        item { GameSection("You") }
                        item { RankRow(me, 0) }
                    }
                }
            }
        }
    }
}

/** A sliding pill between the three scopes, the same motion as the app's tab bar. */
@Composable
private fun ScopeSwitch(current: LeaderboardScope, onSelect: (LeaderboardScope) -> Unit, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    val scopes = LeaderboardScope.entries
    BoxWithConstraints(
        modifier
            .fillMaxWidth()
            .height(44.dp)
            .clip(CircleShape)
            .background(c.fill.copy(alpha = 0.28f))
            .padding(4.dp),
    ) {
        val itemWidth = maxWidth / scopes.size
        val offset by animateDpAsState(
            itemWidth * scopes.indexOf(current),
            spring(dampingRatio = 0.75f, stiffness = 420f),
            label = "scope",
        )
        Box(
            Modifier
                .offset(x = offset)
                .width(itemWidth)
                .fillMaxHeight()
                .clip(CircleShape)
                .background(c.tintSolid),
        )
        Row(Modifier.fillMaxSize()) {
            scopes.forEach { scope ->
                val selected = scope == current
                val color by animateColorAsState(if (selected) c.tintContrast else c.label2, label = "scope-fg")
                Box(
                    Modifier.weight(1f).fillMaxHeight().pressable({ onSelect(scope) }, label = scope.label),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(scope.label, style = MaterialTheme.typography.labelLarge, color = color)
                }
            }
        }
    }
}

@Composable
private fun RankRow(row: LeaderRowDto, index: Int) {
    val c = Mascom.colors
    val medal = when (row.rank) {
        1 -> Gold.g400
        2 -> Color(0xFFC0C6D4)
        3 -> Color(0xFFCD8B5A)
        else -> null
    }
    Card(
        Modifier.padding(bottom = 8.dp).appear(index),
        padding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(medal?.copy(alpha = 0.22f) ?: c.fill.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "${row.rank}",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = medal ?: c.label2,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    row.alias + if (row.isMe) " · you" else "",
                    style = MaterialTheme.typography.bodyLarge,
                    color = if (row.isMe) c.tint else c.label,
                )
                Text(
                    "${row.cohort} · ${row.attempts} raids",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                )
            }
            Coins(row.points, size = 17.sp, color = if (row.isMe) c.tint else c.label)
        }
    }
}
