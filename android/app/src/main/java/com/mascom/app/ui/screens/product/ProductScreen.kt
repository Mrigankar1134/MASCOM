package com.mascom.app.ui.screens.product

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.SearchOff
import androidx.compose.material.icons.rounded.ShoppingBag
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
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.util.lerp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.core.util.money
import com.mascom.app.core.util.shortDate
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Eyebrow
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MascomTextField
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.QuantityStepper
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RollingText
import com.mascom.app.ui.components.RoundIconButton
import com.mascom.app.ui.components.SwatchDot
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.components.shake
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
import kotlin.math.absoluteValue

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProductScreen(
    route: ProductRoute,
    onBack: () -> Unit,
    onBag: () -> Unit,
    vm: ProductViewModel = hiltViewModel(key = route.slug),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val c = Mascom.colors
    val haze = rememberHazeState()
    val listState = rememberLazyListState()
    val haptics = LocalHapticFeedback.current
    val status = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val nav = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    var justAdded by remember { mutableStateOf(false) }
    var sizeShake by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        vm.events.collect { event ->
            when (event) {
                ProductEvent.Added -> {
                    haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                    justAdded = true
                    delay(1700)
                    justAdded = false
                }
                ProductEvent.NeedSize -> {
                    haptics.performHapticFeedback(HapticFeedbackType.Reject)
                    sizeShake++
                    // Bring the size picker into view if it has scrolled away.
                    listState.animateScrollToItem(2)
                }
            }
        }
    }

    val product = state.product
    Box(Modifier.fillMaxSize().background(c.page)) {
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize().hazeSource(haze),
            contentPadding = PaddingValues(bottom = nav + 120.dp),
        ) {
            // The photo is always first, even before the product loads, so the image flying in
            // from the shop grid has somewhere to land.
            item(key = "gallery") {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .aspectRatio(0.82f)
                        .sharedProductImage(route.id.ifEmpty { product?.id.orEmpty() }, RectangleShape)
                        // Clip so the drifting photo never slides under the text below it.
                        .clipToBounds(),
                ) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .graphicsLayer {
                                // Drift the photo at half speed and fade it as the page scrolls over.
                                if (listState.firstVisibleItemIndex == 0) {
                                    val scrolled = listState.firstVisibleItemScrollOffset.toFloat()
                                    translationY = scrolled * 0.5f
                                    alpha = 1f - (scrolled / size.height).coerceIn(0f, 1f) * 0.5f
                                }
                            },
                    ) {
                        if (product == null) {
                            RemoteImage(route.cover, null, Modifier.fillMaxSize())
                        } else {
                            Gallery(state.images, product.name, haze)
                        }
                    }
                    // A soft shade under the status bar keeps the clock and icons readable on any photo.
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height(status + 72.dp)
                            .background(Brush.verticalGradient(listOf(c.page.copy(alpha = 0.75f), Color.Transparent))),
                    )
                }
            }

            when {
                product == null && state.loading -> item(key = "loading") { LoadingDetails() }
                product == null -> item(key = "missing") {
                    MessageView(
                        title = "That drop isn't here",
                        body = "It may have sold out or been taken down.",
                        icon = Icons.Rounded.SearchOff,
                        actionText = "Back to the shop",
                        onAction = onBack,
                    )
                }
                else -> {
                    item(key = "info") {
                        Column(Modifier.padding(horizontal = 20.dp, vertical = 20.dp).appear(0)) {
                            product.category?.let { Eyebrow(it) }
                            Spacer(Modifier.height(4.dp))
                            Text(product.name, style = MaterialTheme.typography.displaySmall)
                            Spacer(Modifier.height(6.dp))
                            Text(money(product.price), style = MaterialTheme.typography.headlineSmall, color = c.tint)
                            if (!product.canOrder) {
                                Spacer(Modifier.height(10.dp))
                                Text(
                                    when {
                                        !product.available -> "Sold out. Keep an eye out for the next run."
                                        product.launchTime != null -> "Opens for orders on ${product.launchTime.shortDate()}."
                                        else -> "Not open for orders yet."
                                    },
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = c.warn,
                                )
                            }
                            product.description?.takeIf { it.isNotBlank() }?.let {
                                Spacer(Modifier.height(14.dp))
                                Text(it, style = MaterialTheme.typography.bodyLarge, color = c.label2)
                            }
                            product.material?.takeIf { it.isNotBlank() }?.let {
                                Spacer(Modifier.height(8.dp))
                                Text("Material: $it", style = MaterialTheme.typography.bodyMedium, color = c.label3)
                            }
                        }
                    }

                    if (product.variants.size > 1 || product.variants.firstOrNull()?.color?.isNotBlank() == true) {
                        item(key = "colors") {
                            Option("Colour", state.variant?.color, modifier = Modifier.appear(1)) {
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    product.variants.forEachIndexed { i, v ->
                                        val selected = i == state.selection.variantIndex
                                        val grow by androidx.compose.animation.core.animateFloatAsState(
                                            if (selected) 1.12f else 1f,
                                            spring(dampingRatio = 0.4f, stiffness = 500f),
                                            label = "swatch",
                                        )
                                        SwatchDot(
                                            v.color,
                                            selected = selected,
                                            modifier = Modifier
                                                .graphicsLayer { scaleX = grow; scaleY = grow }
                                                .pressable({ vm.selectVariant(i) }, label = v.color, pressedScale = 0.85f),
                                        )
                                    }
                                }
                            }
                        }
                    }

                    if (product.sizes.isNotEmpty()) {
                        item(key = "sizes") {
                            Option(
                                "Size",
                                state.selection.size,
                                error = state.selection.sizeMissing,
                                modifier = Modifier.appear(2).shake(sizeShake),
                            ) {
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    product.sizes.forEach { size ->
                                        SizeChip(size, size == state.selection.size, state.selection.sizeMissing) { vm.selectSize(size) }
                                    }
                                }
                            }
                        }
                    }

                    if (product.allowCustomName) {
                        item(key = "custom") {
                            Option("Name on it", "Optional", modifier = Modifier.appear(3)) {
                                MascomTextField(
                                    value = state.selection.customName,
                                    onValueChange = vm::setCustomName,
                                    label = "Up to 24 characters",
                                )
                            }
                        }
                    }

                    item(key = "qty") {
                        Option("Quantity", null, modifier = Modifier.appear(4)) {
                            QuantityStepper(state.selection.quantity, vm::setQuantity)
                        }
                    }
                }
            }
        }

        // Floating controls over the photo.
        Row(
            Modifier.fillMaxWidth().padding(top = status + 6.dp, start = 12.dp, end = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            RoundIconButton(onClick = onBack, contentDescription = "Back", haze = haze) {
                Icon(Icons.AutoMirrored.Rounded.ArrowBack, null, Modifier.size(20.dp))
            }
            Spacer(Modifier.weight(1f))
            Box {
                RoundIconButton(onClick = onBag, contentDescription = "Open bag", haze = haze) {
                    Icon(Icons.Rounded.ShoppingBag, null, Modifier.size(20.dp))
                }
                CountBadge(state.bagCount, Modifier.align(Alignment.TopEnd).offset(x = 4.dp, y = (-4).dp))
            }
        }

        AnimatedVisibility(
            visible = product != null,
            modifier = Modifier.align(Alignment.BottomCenter),
            enter = fadeIn(tween(300, delayMillis = 150)) + androidx.compose.animation.slideInVertically(spring(dampingRatio = 0.8f, stiffness = 300f)) { it },
            exit = fadeOut(),
        ) {
            val p = product ?: return@AnimatedVisibility
            Row(
                Modifier
                    .padding(start = 14.dp, end = 14.dp, bottom = nav + 12.dp)
                    .fillMaxWidth()
                    .glass(haze, RoundedCornerShape(Radii.card), frost = GlassSpec.BarFrost)
                    .padding(start = 20.dp, end = 8.dp, top = 8.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Total", style = MaterialTheme.typography.labelMedium, color = c.label2)
                    RollingText(money(p.price * state.selection.quantity), style = MaterialTheme.typography.titleLarge, color = c.label)
                }
                MascomButton(
                    text = when {
                        justAdded -> "Added"
                        p.canOrder -> "Add to bag"
                        p.available -> "Coming soon"
                        else -> "Sold out"
                    },
                    onClick = vm::addToBag,
                    enabled = p.canOrder,
                    kind = if (justAdded) ButtonKind.Success else ButtonKind.Primary,
                    icon = if (justAdded) Icons.Rounded.Check else Icons.Rounded.ShoppingBag,
                )
            }
        }
    }
}

/** Swipeable photos: each page slides at a slower rate than the frame (parallax) and dips in scale. */
@Composable
private fun Gallery(images: List<String>, name: String, haze: dev.chrisbanes.haze.HazeState) {
    val c = Mascom.colors
    val pager = rememberPagerState { images.size.coerceAtLeast(1) }
    Box(Modifier.fillMaxSize()) {
        HorizontalPager(pager, Modifier.fillMaxSize(), key = { images.getOrNull(it) ?: it }) { page ->
            Box(Modifier.fillMaxSize().clip(RectangleShape)) {
                RemoteImage(
                    images.getOrNull(page),
                    name,
                    Modifier.fillMaxSize().graphicsLayer {
                        val offset = (pager.currentPage - page) + pager.currentPageOffsetFraction
                        translationX = offset * size.width * 0.45f
                        val s = lerp(1f, 1.12f, offset.absoluteValue.coerceIn(0f, 1f))
                        scaleX = s
                        scaleY = s
                    },
                )
            }
        }
        if (images.size > 1) {
            Row(
                Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 16.dp)
                    .glass(haze, CircleShape, GlassSpec.StrokeThin, frost = GlassSpec.BarFrost)
                    .padding(horizontal = 10.dp, vertical = 7.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                repeat(images.size) { i ->
                    val active = i == pager.currentPage
                    val w by animateDpAsState(if (active) 18.dp else 6.dp, spring(dampingRatio = 0.7f), label = "dot-w")
                    val dot by animateColorAsState(if (active) c.label else c.label3, label = "dot")
                    Box(Modifier.size(width = w, height = 6.dp).clip(CircleShape).background(dot))
                }
            }
        }
    }
}

@Composable
private fun SizeChip(size: String, selected: Boolean, missing: Boolean, onClick: () -> Unit) {
    val c = Mascom.colors
    val bg by animateColorAsState(if (selected) c.tintSolid else c.surface, tween(200), label = "size-bg")
    val fg by animateColorAsState(if (selected) c.tintContrast else c.label, tween(200), label = "size-fg")
    val edge by animateColorAsState(
        when {
            selected -> Color.Transparent
            missing -> c.danger
            else -> c.separator
        },
        label = "size-edge",
    )
    val pop = remember { Animatable(1f) }
    LaunchedEffect(selected) {
        if (selected) {
            pop.animateTo(1.1f, tween(90))
            pop.animateTo(1f, spring(dampingRatio = 0.4f, stiffness = 500f))
        }
    }
    Box(
        Modifier
            .graphicsLayer { scaleX = pop.value; scaleY = pop.value }
            .clip(RoundedCornerShape(Radii.sm))
            .background(bg)
            .border(1.dp, edge, RoundedCornerShape(Radii.sm))
            .pressable(onClick, label = size, pressedScale = 0.9f)
            .padding(horizontal = 18.dp, vertical = 11.dp),
    ) {
        Text(size, style = MaterialTheme.typography.titleSmall, color = fg)
    }
}

@Composable
private fun CountBadge(count: Int, modifier: Modifier) {
    val c = Mascom.colors
    val pop = remember { Animatable(1f) }
    var last by remember { mutableIntStateOf(count) }
    LaunchedEffect(count) {
        if (count > last) {
            pop.snapTo(1.6f)
            pop.animateTo(1f, spring(dampingRatio = 0.3f, stiffness = 380f))
        }
        last = count
    }
    AnimatedVisibility(count > 0, modifier = modifier, enter = scaleIn(spring(dampingRatio = 0.4f)), exit = scaleOut()) {
        Box(
            Modifier
                .graphicsLayer { scaleX = pop.value; scaleY = pop.value }
                .size(18.dp)
                .clip(CircleShape)
                .background(c.danger),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                if (count > 9) "9+" else "$count",
                color = Color.White,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, letterSpacing = 0.sp),
            )
        }
    }
}

@Composable
private fun LoadingDetails() {
    Column(Modifier.padding(20.dp)) {
        Box(Modifier.width(90.dp).height(12.dp).clip(CircleShape).shimmer())
        Spacer(Modifier.height(12.dp))
        Box(Modifier.fillMaxWidth(0.7f).height(28.dp).clip(CircleShape).shimmer())
        Spacer(Modifier.height(10.dp))
        Box(Modifier.width(80.dp).height(20.dp).clip(CircleShape).shimmer())
        Spacer(Modifier.height(20.dp))
        repeat(3) {
            Box(Modifier.fillMaxWidth().height(12.dp).clip(CircleShape).shimmer())
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun Option(
    title: String,
    value: String?,
    modifier: Modifier = Modifier,
    error: Boolean = false,
    content: @Composable () -> Unit,
) {
    val c = Mascom.colors
    Column(modifier.padding(horizontal = 20.dp, vertical = 10.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
            when {
                value != null -> Text(value, style = MaterialTheme.typography.bodyMedium, color = if (error) c.danger else c.label2)
                error -> Text("Pick one", style = MaterialTheme.typography.bodyMedium, color = c.danger)
            }
        }
        Spacer(Modifier.height(10.dp))
        content()
    }
}
