package com.mascom.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.mascom.app.ui.theme.AmbientBackdrop
import com.mascom.app.ui.theme.GlassSpec
import com.mascom.app.ui.theme.LocalAmbientHaze
import com.mascom.app.ui.theme.LocalBottomBarPadding
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.glass
import com.mascom.app.ui.theme.glassStyle
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.hazeEffect
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState

private val BarHeight = 52.dp

/**
 * An iOS-style screen: a large title that scrolls away, and a frosted bar that takes over the
 * title once content slides underneath it. Content goes in a lazy list.
 */
@Composable
fun GlassScaffold(
    title: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
    largeTitle: Boolean = true,
    subtitle: String? = null,
    listState: LazyListState = rememberLazyListState(),
    refreshing: Boolean? = null,
    onRefresh: () -> Unit = {},
    horizontalPadding: Boolean = true,
    actions: @Composable RowScope.() -> Unit = {},
    bottomBar: (@Composable BoxScope.() -> Unit)? = null,
    content: LazyListScope.() -> Unit,
) {
    val haze = rememberHazeState()
    val status = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val nav = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    val tabBarSpace = LocalBottomBarPadding.current
    val scrolled by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 0 || listState.firstVisibleItemScrollOffset > 56 }
    }
    val frosted = scrolled || !largeTitle
    val barAlpha by animateFloatAsState(if (frosted) 1f else 0f, label = "bar")

    val ambient = rememberHazeState()
    Box(modifier.fillMaxSize().background(Mascom.colors.page)) {
        // The coloured backdrop the glass frosts. Cards blur only this; the top bar blurs this
        // with the scrolling list layered on top (zIndex).
        AmbientBackdrop(Modifier.fillMaxSize().hazeSource(ambient).hazeSource(haze, zIndex = 0f))
        val list = @Composable {
            LazyColumn(
                state = listState,
                modifier = Modifier.fillMaxSize().hazeSource(haze, zIndex = 1f),
                contentPadding = PaddingValues(
                    start = if (horizontalPadding) 16.dp else 0.dp,
                    end = if (horizontalPadding) 16.dp else 0.dp,
                    top = status + BarHeight,
                    bottom = nav + tabBarSpace + if (bottomBar != null) 104.dp else 28.dp,
                ),
            ) {
                if (largeTitle) item(key = "large-title") { LargeTitle(title, subtitle, horizontalPadding) }
                content()
            }
        }
        CompositionLocalProvider(LocalAmbientHaze provides ambient) {
            if (refreshing != null) {
                PullToRefreshBox(isRefreshing = refreshing, onRefresh = onRefresh, modifier = Modifier.fillMaxSize()) {
                    list()
                }
            } else {
                list()
            }
        }

        Box(Modifier.fillMaxWidth().then(if (barAlpha > 0.01f) Modifier.hazeEffect(haze, glassStyle(barAlpha)) else Modifier)) {
            Hairline(Modifier.align(Alignment.BottomCenter).alpha(barAlpha))
            Row(
                Modifier
                    .windowInsetsPadding(WindowInsets.statusBars)
                    .fillMaxWidth()
                    .height(BarHeight)
                    .padding(horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (onBack != null) {
                    RoundIconButton(onClick = onBack, contentDescription = "Back") {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, null, Modifier.size(20.dp))
                    }
                } else {
                    Spacer(Modifier.width(6.dp))
                }
                Box(
                    Modifier.weight(1f).padding(horizontal = 8.dp),
                    contentAlignment = if (onBack != null) Alignment.Center else Alignment.CenterStart,
                ) {
                    Text(
                        title,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        // The compact title rises into place as the large one scrolls away.
                        modifier = Modifier.graphicsLayer {
                            alpha = barAlpha
                            translationY = (1f - barAlpha) * 10.dp.toPx()
                        },
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    actions()
                    if (onBack != null) Spacer(Modifier.width(38.dp))
                }
            }
        }

        if (bottomBar != null) {
            // Floating bars can frost this screen's content through LocalScreenHaze.
            CompositionLocalProvider(LocalScreenHaze provides haze) {
                Box(
                    Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, bottom = nav + tabBarSpace + 12.dp),
                    content = bottomBar,
                )
            }
        }
    }
}

@Composable
private fun LargeTitle(title: String, subtitle: String?, padded: Boolean) {
    Column(Modifier.padding(start = if (padded) 4.dp else 20.dp, end = 20.dp, top = 4.dp, bottom = 18.dp)) {
        Text(title, style = MaterialTheme.typography.displayMedium)
        if (subtitle != null) {
            Spacer(Modifier.height(2.dp))
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = Mascom.colors.label2)
        }
    }
}

/** A round button: frosted when [haze] is given (for floating over images), filled otherwise. */
@Composable
fun RoundIconButton(
    onClick: () -> Unit,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    haze: HazeState? = null,
    content: @Composable () -> Unit,
) {
    val c = Mascom.colors
    Box(
        modifier
            .size(38.dp)
            .glass(haze ?: LocalAmbientHaze.current, CircleShape, GlassSpec.StrokeThin, frost = GlassSpec.BarFrost)
            .pressable(onClick = onClick, role = Role.Button, label = contentDescription),
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalContentColor provides c.label) { content() }
    }
}
