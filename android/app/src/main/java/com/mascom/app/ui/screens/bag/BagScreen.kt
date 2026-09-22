package com.mascom.app.ui.screens.bag

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.ShoppingBag
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.mascom.app.core.util.money
import com.mascom.app.domain.model.BagLine
import com.mascom.app.domain.repository.BagRepository
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.LocalScreenHaze
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.QuantityStepper
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RollingText
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.GlassSpec
import com.mascom.app.ui.theme.LocalAmbientHaze
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import com.mascom.app.ui.theme.glass
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BagViewModel @Inject constructor(private val bag: BagRepository) : ViewModel() {
    val lines: StateFlow<List<BagLine>?> =
        bag.lines.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    fun setQuantity(key: String, quantity: Int) = viewModelScope.launch { bag.setQuantity(key, quantity) }
    fun remove(key: String) = viewModelScope.launch { bag.remove(key) }
}

private val LineShape = RoundedCornerShape(Radii.card)

@Composable
fun BagScreen(
    onCheckout: () -> Unit,
    onProduct: (String) -> Unit,
    onShop: () -> Unit,
    vm: BagViewModel = hiltViewModel(),
) {
    val lines by vm.lines.collectAsStateWithLifecycle()
    val c = Mascom.colors
    val list = lines.orEmpty()
    val subtotal = list.sumOf { it.total }
    val units = list.sumOf { it.quantity }

    GlassScaffold(
        title = "Bag",
        subtitle = if (list.isNotEmpty()) "$units ${if (units == 1) "item" else "items"} · swipe left to remove" else null,
        bottomBar = if (list.isNotEmpty()) {
            { CheckoutBar(subtotal, onCheckout) }
        } else null,
    ) {
        if (lines != null && list.isEmpty()) {
            item(key = "empty") {
                MessageView(
                    title = "Your bag is empty",
                    body = "Find something you like in the shop and it'll wait for you here.",
                    icon = Icons.Rounded.ShoppingBag,
                    tint = c.tint,
                    actionText = "Browse the shop",
                    onAction = onShop,
                )
            }
            return@GlassScaffold
        }

        itemsIndexed(list, key = { _, line -> line.key }) { index, line ->
            Box(Modifier.animateItem().padding(bottom = 10.dp).appear(index)) {
                SwipeToRemove(onRemove = { vm.remove(line.key) }) {
                    BagRow(
                        line,
                        onClick = { onProduct(line.slug.ifEmpty { line.productId }) },
                        onQuantity = { vm.setQuantity(line.key, it) },
                        onRemove = { vm.remove(line.key) },
                    )
                }
            }
        }

        item(key = "summary") {
            Card(Modifier.animateItem().padding(top = 6.dp)) {
                SummaryLine("Subtotal", money(subtotal))
                Spacer(Modifier.height(6.dp))
                SummaryLine("Delivery", "Collect on campus")
                Spacer(Modifier.height(10.dp))
                Text(
                    "Got a coupon? Add it at checkout. Prices are confirmed when you place the order.",
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                )
            }
        }
    }
}

/** A frosted bar pinned over the list: the running total rolls as quantities change. */
@Composable
private fun CheckoutBar(subtotal: Double, onCheckout: () -> Unit) {
    val c = Mascom.colors
    Row(
        Modifier
            .fillMaxWidth()
            .glass(LocalScreenHaze.current, RoundedCornerShape(Radii.card), frost = GlassSpec.BarFrost)
            .padding(start = 20.dp, end = 8.dp, top = 8.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text("Subtotal", style = MaterialTheme.typography.labelMedium, color = c.label2)
            RollingText(money(subtotal), style = MaterialTheme.typography.titleLarge, color = c.label)
        }
        MascomButton("Checkout", onCheckout, icon = Icons.AutoMirrored.Rounded.ArrowForward)
    }
}

/** Swipe a line left to reveal a red bin that grows as you pull; let go past the line to remove. */
@Composable
private fun SwipeToRemove(onRemove: () -> Unit, content: @Composable () -> Unit) {
    val c = Mascom.colors
    val haptics = LocalHapticFeedback.current
    val state = rememberSwipeToDismissBoxState()
    LaunchedEffect(state.currentValue) {
        if (state.currentValue == SwipeToDismissBoxValue.EndToStart) {
            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
            onRemove()
        }
    }
    SwipeToDismissBox(
        state = state,
        enableDismissFromStartToEnd = false,
        backgroundContent = {
            val pulling = state.dismissDirection == SwipeToDismissBoxValue.EndToStart
            val grow by animateFloatAsState(if (state.targetValue == SwipeToDismissBoxValue.EndToStart) 1.3f else 1f, label = "bin")
            Box(
                Modifier
                    .fillMaxSize()
                    .clip(LineShape)
                    .background(if (pulling) c.danger else Color.Transparent)
                    .padding(end = 26.dp),
                contentAlignment = Alignment.CenterEnd,
            ) {
                Icon(
                    Icons.Rounded.DeleteOutline,
                    contentDescription = "Remove",
                    tint = Color.White,
                    modifier = Modifier.size(26.dp).graphicsLayer { scaleX = grow; scaleY = grow },
                )
            }
        },
    ) { content() }
}

@Composable
private fun BagRow(line: BagLine, onClick: () -> Unit, onQuantity: (Int) -> Unit, onRemove: () -> Unit) {
    val c = Mascom.colors
    Row(
        Modifier
            .fillMaxWidth()
            .glass(LocalAmbientHaze.current, LineShape)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(84.dp).clip(RoundedCornerShape(Radii.md)).background(c.surface2).pressable(onClick)) {
            RemoteImage(line.image, line.name, Modifier.fillMaxSize())
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(line.name, style = MaterialTheme.typography.titleSmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
            val detail = listOfNotNull(line.color, line.size?.let { "Size $it" }, line.customName?.let { "“$it”" })
            if (detail.isNotEmpty()) {
                Text(detail.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = c.label2)
            }
            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                QuantityStepper(line.quantity, onQuantity)
                Box(Modifier.size(34.dp).pressable(onRemove, label = "Remove"), contentAlignment = Alignment.Center) {
                    Icon(Icons.Rounded.DeleteOutline, null, tint = c.label3, modifier = Modifier.size(20.dp))
                }
            }
        }
        RollingText(money(line.total), style = MaterialTheme.typography.titleSmall, modifier = Modifier.align(Alignment.Top).padding(top = 2.dp))
    }
}

@Composable
fun SummaryLine(label: String, value: String, strong: Boolean = false, valueColor: Color? = null) {
    val c = Mascom.colors
    Row(Modifier.fillMaxWidth()) {
        Text(
            label,
            style = if (strong) MaterialTheme.typography.titleMedium else MaterialTheme.typography.bodyMedium,
            color = if (strong) c.label else c.label2,
            modifier = Modifier.weight(1f),
        )
        Text(
            value,
            style = if (strong) MaterialTheme.typography.titleMedium else MaterialTheme.typography.bodyMedium,
            color = valueColor ?: c.label,
        )
    }
}
