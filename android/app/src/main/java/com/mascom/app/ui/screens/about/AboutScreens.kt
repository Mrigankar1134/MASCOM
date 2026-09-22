package com.mascom.app.ui.screens.about

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.PhotoLibrary
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.mascom.app.data.content.GalleryItem
import com.mascom.app.data.content.SiteContent
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.Eyebrow
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.ListRow
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RoundIconButton
import com.mascom.app.ui.components.SectionHeader
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii

@Composable
fun AboutScreen(onBack: () -> Unit, onGallery: () -> Unit) {
    val c = Mascom.colors
    val context = LocalContext.current
    GlassScaffold(title = SiteContent.NAME, subtitle = SiteContent.LONG_NAME, onBack = onBack) {
        item(key = "intro") {
            Card {
                Eyebrow(SiteContent.ABOUT_EYEBROW)
                Spacer(Modifier.height(6.dp))
                Text(SiteContent.ABOUT_TITLE, style = MaterialTheme.typography.headlineMedium)
                Spacer(Modifier.height(8.dp))
                Text(SiteContent.ABOUT_BODY, style = MaterialTheme.typography.bodyLarge, color = c.label2)
            }
        }
        item(key = "stats") {
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SiteContent.stats.forEach { stat ->
                    Card(Modifier.weight(1f), padding = PaddingValues(14.dp)) {
                        Text(stat.value, style = MaterialTheme.typography.headlineMedium, color = c.tint)
                        Text(stat.label, style = MaterialTheme.typography.labelMedium, color = c.label2)
                    }
                }
            }
        }
        item(key = "services") {
            SectionHeader("What we do")
            Card(padding = PaddingValues(vertical = 6.dp)) {
                SiteContent.services.forEachIndexed { i, s ->
                    Row(Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                        Text(s.no, style = MaterialTheme.typography.titleMedium, color = c.tint, modifier = Modifier.width(36.dp))
                        Column {
                            Text(s.title, style = MaterialTheme.typography.titleMedium)
                            Text(s.body, style = MaterialTheme.typography.bodyMedium, color = c.label2)
                        }
                    }
                    if (i < SiteContent.services.lastIndex) com.mascom.app.ui.components.RowDivider(52.dp)
                }
            }
        }
        item(key = "team") {
            SectionHeader("The team")
            Text(SiteContent.TEAM_BODY, style = MaterialTheme.typography.bodyMedium, color = c.label2, modifier = Modifier.padding(horizontal = 4.dp))
            Spacer(Modifier.height(12.dp))
        }
        item(key = "team-row") {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(SiteContent.coordinators, key = { it.name }) { person ->
                    Column(Modifier.width(140.dp)) {
                        RemoteImage(
                            person.photo, person.name,
                            Modifier.fillMaxWidth().aspectRatio(0.8f).clip(RoundedCornerShape(Radii.lg)).background(c.surface2),
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(person.name, style = MaterialTheme.typography.titleSmall)
                        Text(person.role, style = MaterialTheme.typography.bodySmall, color = if (person.ipm) c.tint else c.label2)
                    }
                }
            }
        }
        item(key = "links") {
            SectionHeader("More")
            Card(padding = PaddingValues(vertical = 4.dp)) {
                ListRow("Gallery", subtitle = "Past drops, fests and behind the scenes", icon = Icons.Rounded.PhotoLibrary, showChevron = true, onClick = onGallery)
            }
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MascomButton("Instagram", { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(SiteContent.INSTAGRAM))) }, Modifier.weight(1f), kind = ButtonKind.Secondary, height = 46.dp)
                MascomButton("LinkedIn", { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(SiteContent.LINKEDIN))) }, Modifier.weight(1f), kind = ButtonKind.Secondary, height = 46.dp)
            }
        }
    }
}

@Composable
fun GalleryScreen(onBack: () -> Unit) {
    val c = Mascom.colors
    var open by remember { mutableStateOf<GalleryItem?>(null) }

    GlassScaffold(title = "Gallery", onBack = onBack, horizontalPadding = false) {
        SiteContent.gallery.forEach { section ->
            item(key = section.title) {
                Column(Modifier.padding(horizontal = 20.dp)) {
                    SectionHeader(section.title)
                    Text(section.blurb, style = MaterialTheme.typography.bodyMedium, color = c.label2, modifier = Modifier.padding(horizontal = 4.dp))
                    Spacer(Modifier.height(12.dp))
                }
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(section.items, key = { it.src }) { item ->
                        Box(
                            Modifier
                                .size(width = 220.dp, height = 270.dp)
                                .clip(RoundedCornerShape(Radii.xl))
                                .background(c.surface2)
                                .pressable({ open = item }, pressedScale = 0.97f),
                        ) {
                            RemoteImage(item.src, item.title, Modifier.fillMaxSize())
                            Box(
                                Modifier.fillMaxWidth().height(90.dp).align(Alignment.BottomCenter)
                                    .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.6f)))),
                            )
                            Text(
                                item.title,
                                style = MaterialTheme.typography.titleSmall,
                                color = Color.White,
                                modifier = Modifier.align(Alignment.BottomStart).padding(12.dp),
                            )
                        }
                    }
                }
            }
        }
    }

    val item = open
    if (item != null) {
        Dialog(onDismissRequest = { open = null }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
            Box(Modifier.fillMaxSize().background(Color.Black).pressable({ open = null }, pressedScale = 1f)) {
                RemoteImage(item.src, item.title, Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                AnimatedVisibility(true, enter = fadeIn(), exit = fadeOut(), modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)) {
                    RoundIconButton(onClick = { open = null }, contentDescription = "Close") { Icon(Icons.Rounded.Close, null) }
                }
                Text(item.title, color = Color.White, style = MaterialTheme.typography.titleMedium, modifier = Modifier.align(Alignment.BottomCenter).padding(32.dp))
            }
        }
    }
}
