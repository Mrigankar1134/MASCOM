package com.mascom.app.ui.screens.shop

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Inventory2
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.core.util.money
import com.mascom.app.data.content.SiteContent
import com.mascom.app.domain.model.Product
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Eyebrow
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.InlineError
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RoundIconButton
import com.mascom.app.ui.components.SectionHeader
import com.mascom.app.ui.components.SwatchDot
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.components.sharedProductImage
import com.mascom.app.ui.components.shimmer
import com.mascom.app.ui.navigation.ProductRoute
import com.mascom.app.ui.theme.GlassSpec
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import com.mascom.app.ui.theme.glass
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState
import kotlinx.coroutines.delay
import java.time.LocalTime

private val CardShape = RoundedCornerShape(Radii.lg)

private fun greeting(): String = when (LocalTime.now().hour) {
    in 5..11 -> "Good morning"
    in 12..16 -> "Good afternoon"
    else -> "Good evening"
}

@Composable
fun ShopScreen(
    onProduct: (ProductRoute) -> Unit,
    onAbout: () -> Unit,
    onSignIn: () -> Unit,
    vm: ShopViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()
    val visible = state.visible

    GlassScaffold(
        title = "Shop",
        subtitle = state.user?.let { "${greeting()}, ${it.firstName}" } ?: "Merch by ${SiteContent.NAME}",
        listState = listState,
        refreshing = state.refreshing && state.loadedOnce,
        onRefresh = vm::refresh,
        actions = {
            RoundIconButton(onClick = onAbout, contentDescription = "About MASCOM") {
                Icon(Icons.Rounded.Info, null, Modifier.size(20.dp))
            }
        },
    ) {
        item(key = "hero") {
            Hero(
                state = state,
                modifier = Modifier.appear(),
                onSignIn = onSignIn,
                onOpenDrop = { state.openDrop?.let { onProduct(it.toRoute(variant = 0)) } },
            )
        }

        if (state.error != null && state.products.isNotEmpty()) {
            item(key = "error") { InlineError(state.error!!, Modifier.padding(top = 12.dp)) }
        }

        when {
            state.products.isEmpty() && !state.loadedOnce -> {
                item(key = "skeleton-header") { SectionHeader("Drops") }
                items(2, key = { "skeleton-$it" }) { SkeletonRow() }
            }
            state.products.isEmpty() && state.error != null -> item(key = "offline") {
                MessageView(
                    title = "Can't load the drops",
                    body = state.error!!,
                    actionText = "Try again",
                    onAction = vm::refresh,
                )
            }
            state.products.isEmpty() -> item(key = "empty") {
                MessageView(
                    title = "Nothing live yet",
                    body = "The next drop is on its way. Pull down to check again.",
                    icon = Icons.Rounded.Inventory2,
                )
            }
            else -> {
                item(key = "header") {
                    SectionHeader("Drops · ${visible.size}")
                }
                if (state.categories.size > 1) {
                    item(key = "categories") {
                        CategoryChips(state.categories, state.category, vm::selectCategory)
                        Spacer(Modifier.height(14.dp))
                    }
                }
                itemsIndexed(visible.chunked(2), key = { _, row -> row.joinToString { it.id } }) { index, row ->
                    Row(
                        Modifier.animateItem().padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        row.forEachIndexed { col, product ->
                            ProductCard(
                                product = product,
                                onClick = { variant -> onProduct(product.toRoute(variant)) },
                                modifier = Modifier.weight(1f).appear(index * 2 + col),
                            )
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

private fun Product.toRoute(variant: Int) = ProductRoute(
    slug = slug.ifEmpty { id },
    id = id,
    cover = variants.getOrNull(variant)?.images?.firstOrNull() ?: cover,
    variant = variant,
)

/**
 * The header photo: slowly zooming, rotating through the site's hero shots, and drifting at a
 * different speed from the page as you scroll, under a frosted caption card.
 */
@Composable
private fun Hero(state: ShopUiState, modifier: Modifier, onSignIn: () -> Unit, onOpenDrop: () -> Unit) {
    val c = Mascom.colors
    val haze = rememberHazeState()
    val drop = state.openDrop
    val shots = SiteContent.heroShots
    var shot by rememberSaveable { mutableIntStateOf(0) }
    LaunchedEffect(shots.size) {
        while (shots.size > 1) {
            delay(5200)
            shot = (shot + 1) % shots.size
        }
    }
    val zoom by rememberInfiniteTransition(label = "kenburns")
        .animateFloat(1f, 1.1f, infiniteRepeatable(tween(11000, easing = LinearEasing), RepeatMode.Reverse), label = "zoom")

    // Parallax: remember where the hero first sat on screen, and drift the photo by a fraction
    // of however far it has since scrolled.
    var restingY by remember { mutableFloatStateOf(Float.NaN) }
    var currentY by remember { mutableFloatStateOf(0f) }

    Box(
        modifier
            .fillMaxWidth()
            .aspectRatio(0.95f)
            .onGloballyPositioned {
                val y = it.positionInRoot().y
                if (restingY.isNaN()) restingY = y
                currentY = y
            }
            .clip(RoundedCornerShape(Radii.sheet / 1.4f)),
    ) {
        Crossfade(
            targetState = shots.getOrNull(shot),
            animationSpec = tween(1100),
            modifier = Modifier.fillMaxSize().hazeSource(haze),
            label = "hero-shot",
        ) { path ->
            RemoteImage(
                path,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        val scrolled = if (restingY.isNaN()) 0f else (restingY - currentY).coerceAtLeast(0f)
                        translationY = scrolled * 0.35f
                        scaleX = zoom
                        scaleY = zoom
                    },
            )
        }
        Box(
            Modifier.fillMaxSize().background(
                Brush.verticalGradient(0.35f to Color.Transparent, 1f to Color.Black.copy(alpha = 0.55f)),
            ),
        )
        // Little progress dots for the rotating photos.
        if (shots.size > 1) {
            Row(
                Modifier.align(Alignment.TopEnd).padding(14.dp).glass(haze, CircleShape, GlassSpec.StrokeThin, frost = GlassSpec.BarFrost).padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                shots.indices.forEach { i ->
                    val active = i == shot
                    val w by androidx.compose.animation.core.animateDpAsState(if (active) 16.dp else 6.dp, label = "dot")
                    Box(Modifier.size(width = w, height = 6.dp).clip(CircleShape).background(if (active) c.label else c.label3))
                }
            }
        }
        Column(
            Modifier
                .align(Alignment.BottomStart)
                .padding(12.dp)
                .fillMaxWidth()
                .glass(haze, RoundedCornerShape(Radii.card), frost = 0.45f)
                .padding(18.dp),
        ) {
            Eyebrow(if (drop != null) "Orders open" else SiteContent.INSTITUTE, color = c.tint)
            Spacer(Modifier.height(4.dp))
            Text(SiteContent.TAGLINE, style = MaterialTheme.typography.headlineLarge, color = c.label)
            Spacer(Modifier.height(4.dp))
            Text(
                when {
                    drop != null -> "${drop.name} is live. Grab yours before it's gone."
                    state.user == null -> "Sign in to be first when it lands"
                    else -> "Hey ${state.user.firstName}, the next drop is on its way."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = c.label2,
            )
            AnimatedVisibility(
                drop != null || state.user == null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut(),
            ) {
                MascomButton(
                    text = if (drop != null) "Shop the drop" else "Sign in",
                    onClick = if (drop != null) onOpenDrop else onSignIn,
                    kind = if (drop != null) ButtonKind.Primary else ButtonKind.Secondary,
                    height = 46.dp,
                    modifier = Modifier.fillMaxWidth().padding(top = 14.dp),
                )
            }
        }
    }
}

@Composable
private fun CategoryChips(categories: List<String>, selected: String?, onSelect: (String?) -> Unit) {
    val c = Mascom.colors
    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(horizontal = 2.dp)) {
        items(listOf<String?>(null) + categories, key = { it ?: "__all" }) { category ->
            val on = category == selected
            val bg by animateColorAsState(if (on) c.label else c.surface, tween(220), label = "chip-bg")
            val fg by animateColorAsState(if (on) c.page else c.label, tween(220), label = "chip-fg")
            Text(
                category ?: "All",
                style = MaterialTheme.typography.titleSmall,
                color = fg,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(bg)
                    .pressable({ onSelect(category) }, pressedScale = 0.92f)
                    .padding(horizontal = 16.dp, vertical = 9.dp),
            )
        }
    }
}

@Composable
private fun SkeletonRow() {
    Row(Modifier.padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(2) {
            Column(Modifier.weight(1f)) {
                Box(Modifier.fillMaxWidth().aspectRatio(0.8f).clip(CardShape).shimmer())
                Spacer(Modifier.height(10.dp))
                Box(Modifier.fillMaxWidth(0.8f).height(14.dp).clip(CircleShape).shimmer())
                Spacer(Modifier.height(6.dp))
                Box(Modifier.fillMaxWidth(0.4f).height(12.dp).clip(CircleShape).shimmer())
            }
        }
    }
}

@Composable
fun ProductCard(product: Product, onClick: (variant: Int) -> Unit, modifier: Modifier = Modifier) {
    val c = Mascom.colors
    var variantIndex by rememberSaveable(product.id) { mutableIntStateOf(0) }
    val image = product.variants.getOrNull(variantIndex)?.images?.firstOrNull() ?: product.cover

    Column(modifier.pressable({ onClick(variantIndex) }, pressedScale = 0.96f)) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(0.8f)
                .sharedProductImage(product.id, CardShape)
                .clip(CardShape)
                .background(c.surface),
        ) {
            Crossfade(image, animationSpec = tween(350), label = "card-variant") { path ->
                RemoteImage(path, product.name, Modifier.fillMaxSize())
            }
            val badge = when {
                !product.available -> "Sold out"
                !product.isLive -> "Coming soon"
                else -> null
            }
            if (badge != null) {
                Text(
                    badge,
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(8.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(alpha = 0.55f))
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(
            product.name,
            style = MaterialTheme.typography.titleSmall,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 2.dp),
        )
        Row(Modifier.padding(horizontal = 2.dp, vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(money(product.price), style = MaterialTheme.typography.bodyMedium, color = c.label2, modifier = Modifier.weight(1f))
            product.variants.take(4).forEachIndexed { i, v ->
                SwatchDot(
                    v.color,
                    selected = i == variantIndex,
                    size = 12,
                    modifier = Modifier.pressable({ variantIndex = i }, label = v.color, pressedScale = 0.8f),
                )
            }
            if (product.variants.size > 4) {
                Spacer(Modifier.width(2.dp))
                Text("+${product.variants.size - 4}", style = MaterialTheme.typography.labelMedium, color = c.label3)
            }
        }
    }
}
