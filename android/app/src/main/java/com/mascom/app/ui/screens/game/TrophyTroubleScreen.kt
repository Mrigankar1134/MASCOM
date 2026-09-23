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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.DoubleArrow
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.theme.Mascom

/**
 * Trophy Trouble isn't built yet, so this screen says what it will be and where the work stands
 * instead of showing a Play button that does nothing.
 */
@Composable
fun TrophyTroubleScreen(onBack: () -> Unit) {
    val c = Mascom.colors
    GameTheme {
        GlassScaffold(
            title = "Trophy Trouble",
            subtitle = "Four players · one trophy · two minutes",
            onBack = onBack,
            backdrop = { GameBackdrop(it) },
        ) {
            item {
                Card(Modifier.appear(0).padding(top = 4.dp)) {
                    Text(
                        "Grab the trophy, escape your friends, and steal it back when they catch you.",
                        style = MaterialTheme.typography.titleMedium,
                        color = c.label,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "A third-person 3D chase around a hostel courtyard. Whoever holds the trophy " +
                            "longest across the two minutes wins — so carrying it is the score, and " +
                            "everyone else is trying to take it off you.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = c.label2,
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        GameChip("In design", tone = c.info, filled = true)
                        GameChip("Not playable yet", tone = c.label3)
                    }
                }
            }

            item { GameSection("The idea") }
            item {
                Card(Modifier.appear(1), padding = PaddingValues(vertical = 6.dp, horizontal = 16.dp)) {
                    Feature(Icons.Rounded.Timer, "Two-minute matches", "Possession time is the only score. Drop it and your clock stops.")
                    Feature(Icons.Rounded.Groups, "Four players", "Public queue or a private room code for your block.")
                    Feature(Icons.Rounded.Bolt, "Dash to steal", "Only a dash takes the trophy — running into someone does nothing.")
                    Feature(Icons.Rounded.DoubleArrow, "Throw to survive", "Send the trophy over a bench and beat everyone to it.")
                    Feature(Icons.Rounded.Map, "One courtyard", "Canteen edge, hostel corridor, raised walkway, and the court.")
                }
            }

            item { GameSection("Where it stands") }
            item {
                Card(Modifier.appear(2)) {
                    Phase("Design blueprint", "Rules, arena, controls and networking written up.", done = true)
                    Phase("Movement test", "Running, turning, jumping, dashing and the camera.", done = false, next = true)
                    Phase("Trophy rules", "Pickup, scoring, steals and throws.", done = false)
                    Phase("Courtyard greybox", "Chase loops, shortcuts and interception routes.", done = false)
                    Phase("Multiplayer", "Four players over a real connection.", done = false)
                    Phase("Art, then Android tuning", "Characters, lighting, and frame pacing on real phones.", done = false)
                }
            }

            item {
                Text(
                    "Nothing here is playable yet — this is the plan, not a build. " +
                        "The first thing to prove is that running around the courtyard feels good.",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 18.dp),
                )
            }
        }
    }
}

@Composable
private fun Feature(icon: ImageVector, title: String, body: String) {
    val c = Mascom.colors
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp)) {
        Icon(icon, null, Modifier.size(20.dp).padding(top = 2.dp), tint = c.tint)
        Spacer(Modifier.width(12.dp))
        Column {
            Text(title, style = MaterialTheme.typography.titleSmall, color = c.label)
            Text(body, style = MaterialTheme.typography.bodySmall, color = c.label2)
        }
    }
}

@Composable
private fun Phase(title: String, body: String, done: Boolean, next: Boolean = false) {
    val c = Mascom.colors
    val tone = if (done) c.ok else if (next) c.tint else c.label4
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.Top) {
        Box(
            Modifier.size(20.dp).clip(CircleShape).background(tone.copy(alpha = if (done) 0.9f else 0.18f)),
            contentAlignment = Alignment.Center,
        ) {
            if (done) Icon(Icons.Rounded.Check, null, Modifier.size(13.dp), tint = Color.Black.copy(alpha = 0.75f))
            else Box(Modifier.size(6.dp).clip(CircleShape).background(tone))
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(title, style = MaterialTheme.typography.titleSmall, color = if (done || next) c.label else c.label2)
                if (next) {
                    Spacer(Modifier.width(8.dp))
                    GameChip("Next", tone = c.tint)
                }
            }
            Text(body, style = MaterialTheme.typography.bodySmall, color = c.label3)
        }
    }
}
