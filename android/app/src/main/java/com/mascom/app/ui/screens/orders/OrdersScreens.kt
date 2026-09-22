package com.mascom.app.ui.screens.orders

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.EaseOutCubic
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ReceiptLong
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.core.util.dateTime
import com.mascom.app.core.util.money
import com.mascom.app.core.util.shortDate
import com.mascom.app.domain.model.Order
import com.mascom.app.domain.model.OrderStatus
import com.mascom.app.domain.model.PaymentStatus
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.Confetti
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.InlineError
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RowDivider
import com.mascom.app.ui.components.SectionHeader
import com.mascom.app.ui.components.StatusPill
import com.mascom.app.ui.components.SuccessMark
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.shimmer
import com.mascom.app.ui.components.statusColor
import com.mascom.app.ui.screens.bag.SummaryLine
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii

@Composable
fun OrdersScreen(onOrder: (String) -> Unit, onSignIn: () -> Unit, vm: OrdersViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val orders = state.orders

    GlassScaffold(
        title = "Orders",
        subtitle = orders.data?.takeIf { it.isNotEmpty() }?.let { list ->
            val open = list.count { it.status != OrderStatus.Delivered && it.status != OrderStatus.Failed }
            if (open > 0) "$open on the way" else "All collected"
        },
        refreshing = if (state.user != null) orders.loading && orders.data != null else null,
        onRefresh = vm::refresh,
    ) {
        when {
            state.user == null -> item(key = "signin") {
                MessageView(
                    title = "Sign in to see your orders",
                    body = "Track payment checks and pickups for everything you've ordered.",
                    icon = Icons.Rounded.Lock,
                    tint = Mascom.colors.tint,
                    actionText = "Sign in",
                    onAction = onSignIn,
                )
            }
            orders.data == null && orders.loading -> items(3, key = { "skeleton-$it" }) { OrderSkeleton() }
            orders.data == null && orders.error != null -> item(key = "error") {
                MessageView("Couldn't load your orders", orders.error, actionText = "Try again", onAction = vm::refresh)
            }
            orders.data.isNullOrEmpty() -> item(key = "empty") {
                MessageView(
                    title = "No orders yet",
                    body = "When you order something, you can follow it here.",
                    icon = Icons.AutoMirrored.Rounded.ReceiptLong,
                    tint = Mascom.colors.tint,
                )
            }
            else -> {
                orders.error?.let { item(key = "inline-error") { InlineError(it, Modifier.padding(bottom = 12.dp)) } }
                itemsIndexed(orders.data, key = { _, it -> it.id }) { index, order ->
                    OrderCard(
                        order,
                        onClick = { onOrder(order.orderId.ifEmpty { order.id }) },
                        modifier = Modifier.animateItem().padding(bottom = 12.dp).appear(index),
                    )
                }
            }
        }
    }
}

@Composable
private fun OrderSkeleton() {
    Card(Modifier.padding(bottom = 12.dp)) {
        Row {
            Column(Modifier.weight(1f)) {
                Box(Modifier.width(110.dp).height(16.dp).clip(CircleShape).shimmer())
                Spacer(Modifier.height(8.dp))
                Box(Modifier.width(80.dp).height(12.dp).clip(CircleShape).shimmer())
            }
            Box(Modifier.width(60.dp).height(16.dp).clip(CircleShape).shimmer())
        }
        Spacer(Modifier.height(14.dp))
        Box(Modifier.fillMaxWidth().height(6.dp).clip(CircleShape).shimmer())
    }
}

@Composable
private fun OrderCard(order: Order, onClick: () -> Unit, modifier: Modifier) {
    val c = Mascom.colors
    Card(modifier, onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(order.orderId, style = MaterialTheme.typography.titleMedium)
                Text(
                    listOfNotNull(order.placedAt?.shortDate(), "${order.units} ${if (order.units == 1) "item" else "items"}").joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label2,
                )
            }
            Text(money(order.amountPaid), style = MaterialTheme.typography.titleMedium)
        }
        Spacer(Modifier.height(12.dp))
        // Overlapping thumbnails, each ringed in the card colour so the stack reads cleanly.
        Row(horizontalArrangement = Arrangement.spacedBy((-12).dp)) {
            order.items.take(5).forEach { item ->
                RemoteImage(
                    item.image,
                    item.name,
                    Modifier
                        .size(46.dp)
                        .clip(RoundedCornerShape(Radii.sm))
                        .border(2.dp, c.surface, RoundedCornerShape(Radii.sm))
                        .background(c.surface2),
                )
            }
        }
        Spacer(Modifier.height(14.dp))
        OrderProgress(order.status, compact = true)
    }
}

private val Steps = listOf("Placed", "Paid", "Making", "Collected")

private fun OrderStatus.step() = when (this) {
    OrderStatus.VerificationPending -> 0
    OrderStatus.Confirmed -> 1
    OrderStatus.Processing, OrderStatus.PartiallyFulfilled -> 2
    OrderStatus.Delivered -> 3
    OrderStatus.Failed -> -1
}

/**
 * Where the order is, as a track that fills up to the current stage when it appears.
 * A failed order shows a clear red message instead of a stalled track.
 */
@Composable
private fun OrderProgress(status: OrderStatus, compact: Boolean) {
    val c = Mascom.colors
    val step = status.step()
    if (step < 0) {
        Row(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(Radii.sm)).background(c.danger.copy(alpha = 0.1f)).padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Rounded.ErrorOutline, null, tint = c.danger, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Payment couldn't be verified", style = MaterialTheme.typography.bodySmall, color = c.danger)
        }
        return
    }
    val progress = remember { Animatable(0f) }
    LaunchedEffect(step) { progress.animateTo(step / (Steps.size - 1f), tween(900, delayMillis = 150, easing = EaseOutCubic)) }
    val dot = if (compact) 12.dp else 22.dp

    Column(Modifier.fillMaxWidth()) {
        Box(Modifier.fillMaxWidth().height(dot)) {
            // The track runs between the first and last dot centres.
            Canvas(Modifier.fillMaxSize()) {
                val inset = size.width / Steps.size / 2
                val y = size.height / 2
                val stroke = if (compact) 3.dp.toPx() else 4.dp.toPx()
                drawLine(c.fill.copy(alpha = 0.4f), Offset(inset, y), Offset(size.width - inset, y), stroke, StrokeCap.Round)
                val end = inset + (size.width - inset * 2) * progress.value
                drawLine(c.ok, Offset(inset, y), Offset(end, y), stroke, StrokeCap.Round)
            }
            Row(Modifier.fillMaxSize()) {
                Steps.indices.forEach { i ->
                    val reached = progress.value * (Steps.size - 1) >= i - 0.01f
                    val tone by animateColorAsState(if (reached) c.ok else c.surface2, tween(200), label = "step-dot")
                    val pop = remember { Animatable(1f) }
                    LaunchedEffect(reached) {
                        if (reached && i > 0) {
                            pop.animateTo(1.35f, tween(100))
                            pop.animateTo(1f, spring(dampingRatio = 0.4f, stiffness = 420f))
                        }
                    }
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        Box(
                            Modifier
                                .size(dot)
                                .graphicsLayer { scaleX = pop.value; scaleY = pop.value }
                                .clip(CircleShape)
                                .background(tone)
                                .border(if (reached) 0.dp else 1.5.dp, c.separator, CircleShape),
                            contentAlignment = Alignment.Center,
                        ) {
                            if (!compact && reached) Icon(Icons.Rounded.Check, null, tint = androidx.compose.ui.graphics.Color.White, modifier = Modifier.size(14.dp))
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth()) {
            Steps.forEachIndexed { i, label ->
                Text(
                    label,
                    style = MaterialTheme.typography.labelMedium,
                    color = if (i <= step) c.label else c.label3,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
fun OrderDetailScreen(id: String, placed: Boolean, onBack: () -> Unit, vm: OrderDetailViewModel = hiltViewModel(key = id)) {
    val state by vm.state.collectAsStateWithLifecycle()
    val c = Mascom.colors
    val order = state.data

    Box(Modifier.fillMaxSize()) {
        GlassScaffold(
            title = order?.orderId ?: "Order",
            largeTitle = false,
            onBack = onBack,
            refreshing = state.loading && order != null,
            onRefresh = vm::refresh,
        ) {
            if (placed) {
                item(key = "placed") {
                    Column(
                        Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 18.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        SuccessMark(Modifier.size(104.dp))
                        Spacer(Modifier.height(14.dp))
                        Text("Order placed!", style = MaterialTheme.typography.displaySmall, modifier = Modifier.appear(2))
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "We'll confirm once your payment is checked. Keep your pickup code handy.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = c.label2,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 24.dp).appear(3),
                        )
                    }
                }
            }

            when {
                order == null && state.loading -> item {
                    Card {
                        Box(Modifier.fillMaxWidth().height(90.dp).clip(RoundedCornerShape(Radii.md)).shimmer())
                    }
                }
                order == null -> item {
                    MessageView("Couldn't open this order", state.error ?: "Try again in a moment.", actionText = "Try again", onAction = vm::refresh)
                }
                else -> {
                    item(key = "code") { PickupCode(order, Modifier.appear(if (placed) 4 else 0)) }
                    item(key = "progress") {
                        Card(Modifier.padding(top = 12.dp).appear(if (placed) 5 else 1)) {
                            Text("Progress", style = MaterialTheme.typography.titleSmall, color = c.label2)
                            Spacer(Modifier.height(14.dp))
                            OrderProgress(order.status, compact = false)
                        }
                    }
                    item(key = "items") {
                        Column(Modifier.appear(if (placed) 6 else 2)) {
                            SectionHeader("Items")
                            Card(padding = PaddingValues(0.dp)) {
                                order.items.forEachIndexed { index, item ->
                                    Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                        RemoteImage(item.image, item.name, Modifier.size(56.dp).clip(RoundedCornerShape(Radii.sm)).background(c.surface2))
                                        Spacer(Modifier.width(12.dp))
                                        Column(Modifier.weight(1f)) {
                                            Text(item.name, style = MaterialTheme.typography.titleSmall)
                                            val detail = listOfNotNull(item.color, item.size?.let { "Size $it" }, item.customName?.let { "“$it”" }, "×${item.quantity}")
                                            Text(detail.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = c.label2)
                                            Spacer(Modifier.height(6.dp))
                                            StatusPill(item.status.wire)
                                        }
                                        Text(money(item.unitPrice * item.quantity), style = MaterialTheme.typography.titleSmall)
                                    }
                                    if (index < order.items.lastIndex) RowDivider(inset = 80.dp)
                                }
                            }
                        }
                    }
                    item(key = "payment") {
                        Column(Modifier.appear(if (placed) 7 else 3)) {
                            SectionHeader("Payment")
                            Card {
                                SummaryLine("Subtotal", money(order.subtotal))
                                if (order.discount > 0) {
                                    Spacer(Modifier.height(6.dp))
                                    SummaryLine("Discount${order.couponCode?.let { " ($it)" }.orEmpty()}", "−${money(order.discount)}", valueColor = c.ok)
                                }
                                Spacer(Modifier.height(8.dp))
                                SummaryLine("Paid", money(order.amountPaid), strong = true)
                                Spacer(Modifier.height(12.dp))
                                order.paidTo?.let { SummaryLine("Paid to", it) }
                                order.paymentReference?.takeIf { it.isNotBlank() }?.let {
                                    Spacer(Modifier.height(6.dp))
                                    SummaryLine("UTR", it)
                                }
                                Spacer(Modifier.height(6.dp))
                                SummaryLine("Status", order.paymentStatus.wire, valueColor = statusColor(order.paymentStatus.wire))
                                order.verificationNotes?.takeIf { it.isNotBlank() }?.let {
                                    Spacer(Modifier.height(10.dp))
                                    Text(it, style = MaterialTheme.typography.bodySmall, color = c.label2)
                                }
                            }
                        }
                    }
                    item(key = "timeline") {
                        val events = order.items.flatMap { it.history }.filter { it.at != null }.distinctBy { it.status to it.at }.sortedByDescending { it.at }
                        if (events.isNotEmpty()) {
                            Column(Modifier.appear(if (placed) 8 else 4)) {
                                SectionHeader("Timeline")
                                Card {
                                    events.forEachIndexed { index, event ->
                                        Row {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Box(Modifier.size(10.dp).clip(CircleShape).background(statusColor(event.status)))
                                                if (index < events.lastIndex) Box(Modifier.width(2.dp).height(36.dp).background(c.separator))
                                            }
                                            Spacer(Modifier.width(12.dp))
                                            Column(Modifier.padding(bottom = 10.dp)) {
                                                Text(event.status, style = MaterialTheme.typography.titleSmall)
                                                Text(
                                                    listOfNotNull(event.at?.dateTime(), event.notes).joinToString(" · "),
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = c.label2,
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (placed) Confetti(Modifier.fillMaxSize())
    }
}

@Composable
private fun PickupCode(order: Order, modifier: Modifier) {
    val c = Mascom.colors
    Card(modifier) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("PICKUP CODE", style = MaterialTheme.typography.labelSmall, color = c.label2)
            Spacer(Modifier.height(4.dp))
            Text(order.orderId, style = MaterialTheme.typography.displayMedium, color = c.tint)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatusPill(order.status.wire)
                if (order.paymentStatus != PaymentStatus.Paid) {
                    StatusPill(order.paymentStatus.wire, label = "Payment ${order.paymentStatus.wire.lowercase()}")
                }
            }
            order.placedAt?.let {
                Spacer(Modifier.height(8.dp))
                Text("Placed ${it.dateTime()}", style = MaterialTheme.typography.bodySmall, color = c.label3)
            }
        }
    }
}
