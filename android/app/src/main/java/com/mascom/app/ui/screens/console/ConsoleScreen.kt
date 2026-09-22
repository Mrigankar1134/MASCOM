package com.mascom.app.ui.screens.console

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.EaseOutCubic
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.lazy.itemsIndexed
import com.mascom.app.ui.components.animatedCount
import com.mascom.app.ui.components.appear
import kotlin.math.roundToInt
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Done
import androidx.compose.material.icons.rounded.Flag
import androidx.compose.material.icons.rounded.Inbox
import androidx.compose.material.icons.automirrored.rounded.Undo
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mascom.app.core.util.dateTime
import com.mascom.app.core.util.money
import com.mascom.app.domain.model.ConsoleStats
import com.mascom.app.domain.model.DayPoint
import com.mascom.app.domain.model.Order
import com.mascom.app.domain.model.PaymentStatus
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.InlineError
import com.mascom.app.ui.components.LoadingView
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MascomTextField
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RoundIconButton
import com.mascom.app.ui.components.SectionHeader
import com.mascom.app.ui.components.StatusPill
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun ConsoleScreen(vm: ConsoleViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var proof by remember { mutableStateOf<String?>(null) }
    var rejecting by remember { mutableStateOf<Order?>(null) }

    LaunchedEffect(state.message) {
        if (state.message != null) {
            delay(2500)
            vm.dismissMessage()
        }
    }

    GlassScaffold(
        title = "Console",
        subtitle = state.stats.data?.let { if (it.scopeAll) "All collections" else it.recipientName?.let { n -> "Payments to $n" } },
        refreshing = (state.stats.loading && state.stats.data != null) || (state.queue.loading && state.queue.data != null),
        onRefresh = vm::refresh,
    ) {
        item(key = "tabs") {
            Segmented(
                options = ConsoleTab.entries.map { tab ->
                    if (tab == ConsoleTab.Verify) {
                        val pending = state.stats.data?.pending ?: 0
                        if (pending > 0) "Verify · $pending" else "Verify"
                    } else tab.name
                },
                selected = state.tab.ordinal,
                onSelect = { vm.setTab(ConsoleTab.entries[it]) },
            )
            state.message?.let {
                Spacer(Modifier.height(10.dp))
                Text(
                    it,
                    style = MaterialTheme.typography.titleSmall,
                    color = Mascom.colors.label,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(Radii.md)).background(Mascom.colors.surface).padding(12.dp),
                )
            }
            Spacer(Modifier.height(14.dp))
        }

        when (state.tab) {
            ConsoleTab.Overview -> {
                val stats = state.stats
                when {
                    stats.data == null && stats.loading -> item { LoadingView() }
                    stats.data == null -> item { MessageView("Couldn't load stats", stats.error.orEmpty(), actionText = "Try again", onAction = vm::refresh) }
                    else -> item(key = "overview") { Overview(stats.data) }
                }
            }
            ConsoleTab.Verify -> {
                item(key = "filters") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(PaymentStatus.Pending, PaymentStatus.Paid, PaymentStatus.Failed, null).forEach { status ->
                            Chip(status?.wire ?: "All", selected = state.filter == status) { vm.setFilter(status) }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    MascomTextField(state.query, vm::setQuery, "Search order, UTR or payee")
                    Spacer(Modifier.height(12.dp))
                }
                val queue = state.queue
                when {
                    queue.data == null && queue.loading -> item { LoadingView() }
                    queue.data == null -> item { MessageView("Couldn't load the queue", queue.error.orEmpty(), actionText = "Try again", onAction = vm::refresh) }
                    queue.data.isEmpty() -> item {
                        MessageView(
                            title = if (state.filter == PaymentStatus.Pending) "All caught up" else "Nothing here",
                            body = if (state.filter == PaymentStatus.Pending) "No payments are waiting for a check." else "No orders match this filter.",
                            icon = Icons.Rounded.Inbox,
                            tint = Mascom.colors.ok,
                        )
                    }
                    else -> {
                        queue.error?.let { item { InlineError(it, Modifier.padding(bottom = 10.dp)) } }
                        // Handled orders slide out of a filtered queue and the rest close the gap.
                        itemsIndexed(queue.data, key = { _, it -> it.id }) { index, order ->
                            Column(Modifier.animateItem().appear(index)) {
                                VerifyCard(
                                    order = order,
                                    busy = order.id in state.busy,
                                    onProof = { proof = order.screenshotUrl },
                                    onApprove = { vm.setPayment(order, PaymentStatus.Paid) },
                                    onReject = { rejecting = order },
                                    onReset = { vm.setPayment(order, PaymentStatus.Pending) },
                                )
                                Spacer(Modifier.height(12.dp))
                            }
                        }
                    }
                }
            }
        }
    }

    rejecting?.let { order ->
        RejectDialog(order, onDismiss = { rejecting = null }) { notes ->
            vm.setPayment(order, PaymentStatus.Failed, notes)
            rejecting = null
        }
    }

    proof?.let { path ->
        Dialog(onDismissRequest = { proof = null }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
            Box(Modifier.fillMaxSize().background(Color.Black)) {
                RemoteImage(path, "Payment proof", Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                RoundIconButton({ proof = null }, "Close", Modifier.align(Alignment.TopEnd).padding(20.dp)) { Icon(Icons.Rounded.Close, null) }
            }
        }
    }
}

@Composable
private fun Overview(stats: ConsoleStats) {
    val c = Mascom.colors
    Column {
        val whole: (Double) -> String = { "${it.roundToInt()}" }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatTile("Revenue", stats.revenue, { money(it) }, Modifier.weight(1f).appear(0))
            StatTile("Orders", stats.orders.toDouble(), whole, Modifier.weight(1f).appear(1))
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatTile("Awaiting check", stats.pending.toDouble(), whole, Modifier.weight(1f).appear(2), tone = if (stats.pending > 0) c.warn else null)
            StatTile("Paid", stats.paid.toDouble(), whole, Modifier.weight(1f).appear(3))
            StatTile("Units", stats.units.toDouble(), whole, Modifier.weight(1f).appear(4))
        }

        SectionHeader("Orders · last 14 days")
        Card { DailyBars(stats.series) }

        if (stats.topProducts.isNotEmpty()) {
            SectionHeader("Top drops")
            Card(padding = PaddingValues(vertical = 6.dp)) {
                val max = stats.topProducts.maxOf { it.sold }.coerceAtLeast(1)
                val grow = remember(stats.topProducts) { Animatable(0f) }
                LaunchedEffect(stats.topProducts) { grow.animateTo(1f, tween(900, delayMillis = 250, easing = EaseOutCubic)) }
                stats.topProducts.forEach { p ->
                    Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                        Row {
                            Text(p.name, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                            Text("${p.sold} sold", style = MaterialTheme.typography.bodySmall, color = c.label2)
                        }
                        Spacer(Modifier.height(6.dp))
                        Box(Modifier.fillMaxWidth().height(6.dp).clip(CircleShape).background(c.fill.copy(alpha = 0.3f))) {
                            Box(Modifier.fillMaxWidth(p.sold / max.toFloat() * grow.value).height(6.dp).clip(CircleShape).background(c.tintSolid))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatTile(
    label: String,
    target: Double,
    format: (Double) -> String,
    modifier: Modifier = Modifier,
    tone: Color? = null,
) {
    val c = Mascom.colors
    // Numbers count up from zero the first time the overview opens.
    val value = format(animatedCount(target))
    Card(modifier, padding = PaddingValues(14.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = c.label2)
        Spacer(Modifier.height(4.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (tone != null) {
                Box(Modifier.size(8.dp).clip(CircleShape).background(tone))
                Spacer(Modifier.width(6.dp))
            }
            Text(value, style = MaterialTheme.typography.headlineMedium, color = c.label)
        }
    }
}

private val dayLabel = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH)

/** One series of daily order counts: thin gold bars on a quiet baseline; tap a bar to read it. */
@Composable
private fun DailyBars(series: List<DayPoint>) {
    val c = Mascom.colors
    var selected by remember(series) { mutableStateOf(series.indexOfLast { it.orders > 0 }.takeIf { it >= 0 }) }
    val max = series.maxOfOrNull { it.orders }?.coerceAtLeast(1) ?: 1
    // Bars rise from the baseline one after another, left to right.
    val grow = remember(series) { Animatable(0f) }
    LaunchedEffect(series) { grow.animateTo(1f, tween(1100, easing = EaseOutCubic)) }

    val point = selected?.let(series::getOrNull)
    Row(verticalAlignment = Alignment.Bottom) {
        Text(point?.let { "${it.orders}" } ?: "–", style = MaterialTheme.typography.headlineMedium, color = c.label)
        Spacer(Modifier.width(8.dp))
        Text(
            point?.let { "orders · ${money(it.revenue)} · ${runCatching { LocalDate.parse(it.date).format(dayLabel) }.getOrDefault(it.date)}" } ?: "Tap a day",
            style = MaterialTheme.typography.bodySmall,
            color = c.label2,
            modifier = Modifier.padding(bottom = 4.dp),
        )
    }
    Spacer(Modifier.height(12.dp))
    if (series.isEmpty()) {
        Text("No orders yet.", style = MaterialTheme.typography.bodyMedium, color = c.label3)
        return
    }
    Canvas(
        Modifier
            .fillMaxWidth()
            .height(120.dp)
            .pointerInput(series) {
                detectTapGestures { offset ->
                    val slot = size.width / series.size
                    selected = (offset.x / slot).toInt().coerceIn(0, series.lastIndex)
                }
            },
    ) {
        val slot = size.width / series.size
        val gap = 2.dp.toPx()
        val barWidth = (slot - gap).coerceAtMost(18.dp.toPx())
        val baseline = size.height - 1.dp.toPx()
        drawLine(c.separator, Offset(0f, baseline), Offset(size.width, baseline), strokeWidth = 1.dp.toPx())
        series.forEachIndexed { i, p ->
            if (p.orders == 0) return@forEachIndexed
            val stagger = i / series.size.toFloat() * 0.45f
            val rise = ((grow.value - stagger) / 0.55f).coerceIn(0f, 1f)
            val h = (baseline - 4.dp.toPx()) * (p.orders / max.toFloat()) * rise
            if (h < 0.5f) return@forEachIndexed
            val left = i * slot + (slot - barWidth) / 2
            val color = if (i == selected) c.tint else c.tintSolid.copy(alpha = if (selected == null) 1f else 0.55f)
            topRoundedBar(color, left, baseline - h, barWidth, h, 4.dp.toPx())
        }
    }
    Row(Modifier.fillMaxWidth().padding(top = 6.dp)) {
        listOf(series.first(), series.last()).forEachIndexed { i, p ->
            Text(
                runCatching { LocalDate.parse(p.date).format(dayLabel) }.getOrDefault(p.date),
                style = MaterialTheme.typography.labelMedium,
                color = c.label3,
                modifier = Modifier.weight(1f),
                textAlign = if (i == 0) TextAlign.Start else TextAlign.End,
            )
        }
    }
}

/** A bar with rounded data-end and a square foot on the baseline. */
private fun DrawScope.topRoundedBar(color: Color, left: Float, top: Float, width: Float, height: Float, radius: Float) {
    val r = radius.coerceAtMost(minOf(width / 2, height))
    val path = Path().apply {
        addRoundRect(
            androidx.compose.ui.geometry.RoundRect(
                left, top, left + width, top + height,
                topLeftCornerRadius = CornerRadius(r), topRightCornerRadius = CornerRadius(r),
                bottomLeftCornerRadius = CornerRadius.Zero, bottomRightCornerRadius = CornerRadius.Zero,
            ),
        )
    }
    drawPath(path, color)
}

@Composable
private fun VerifyCard(
    order: Order,
    busy: Boolean,
    onProof: () -> Unit,
    onApprove: () -> Unit,
    onReject: () -> Unit,
    onReset: () -> Unit,
) {
    val c = Mascom.colors
    Card {
        Row {
            Column(Modifier.weight(1f)) {
                Text(order.orderId, style = MaterialTheme.typography.titleMedium)
                Text(order.placedAt?.dateTime().orEmpty(), style = MaterialTheme.typography.bodySmall, color = c.label2)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(money(order.amountPaid), style = MaterialTheme.typography.titleMedium, color = c.tint)
                StatusPill(order.paymentStatus.wire)
            }
        }
        Spacer(Modifier.height(12.dp))
        Row {
            if (order.screenshotUrl != null) {
                RemoteImage(
                    order.screenshotUrl,
                    "Payment proof",
                    Modifier.size(width = 76.dp, height = 110.dp).clip(RoundedCornerShape(Radii.sm)).background(c.surface2).pressable(onProof),
                )
                Spacer(Modifier.width(12.dp))
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                order.customer?.let { who ->
                    Text(who.name, style = MaterialTheme.typography.titleSmall)
                    listOfNotNull(who.rollNo, who.phone).takeIf { it.isNotEmpty() }?.let {
                        Text(it.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = c.label2)
                    }
                    who.room?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = c.label2) }
                }
                Text("Paid to ${order.paidTo ?: "—"}", style = MaterialTheme.typography.bodySmall, color = c.label2)
                Text(
                    "UTR ${order.paymentReference?.takeIf { it.isNotBlank() } ?: "not given"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (order.paymentReference.isNullOrBlank()) c.label3 else c.label,
                )
                Text(
                    order.items.joinToString { "${it.name} ×${it.quantity}" },
                    style = MaterialTheme.typography.bodySmall,
                    color = c.label3,
                    maxLines = 2,
                )
            }
        }
        if (order.fraudFlags.isNotEmpty()) {
            Spacer(Modifier.height(10.dp))
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(Radii.sm)).background(c.warn.copy(alpha = 0.12f)).padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Rounded.Flag, null, tint = c.warn, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text(order.fraudFlags.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = c.warn)
            }
        }
        Spacer(Modifier.height(12.dp))
        if (order.paymentStatus == PaymentStatus.Pending) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MascomButton("Reject", onReject, Modifier.weight(1f), kind = ButtonKind.Destructive, enabled = !busy, icon = Icons.Rounded.Close, height = 44.dp)
                MascomButton("Confirm paid", onApprove, Modifier.weight(1.4f), loading = busy, icon = Icons.Rounded.Done, height = 44.dp)
            }
        } else {
            MascomButton("Move back to pending", onReset, Modifier.fillMaxWidth(), kind = ButtonKind.Secondary, loading = busy, icon = Icons.AutoMirrored.Rounded.Undo, height = 44.dp)
        }
    }
}

@Composable
private fun RejectDialog(order: Order, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var notes by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Mascom.colors.surface,
        title = { Text("Reject ${order.orderId}?") },
        text = {
            Column {
                Text("The student will see this order's payment as failed.", style = MaterialTheme.typography.bodyMedium, color = Mascom.colors.label2)
                Spacer(Modifier.height(12.dp))
                MascomTextField(notes, { notes = it.take(300) }, "Reason (optional)", placeholder = "e.g. amount doesn't match", singleLine = false)
            }
        },
        confirmButton = { TextButton({ onConfirm(notes) }) { Text("Reject", color = Mascom.colors.danger) } },
        dismissButton = { TextButton(onDismiss) { Text("Cancel", color = Mascom.colors.label2) } },
    )
}

@Composable
private fun Segmented(options: List<String>, selected: Int, onSelect: (Int) -> Unit) {
    val c = Mascom.colors
    Row(
        Modifier.fillMaxWidth().height(38.dp).clip(RoundedCornerShape(Radii.sm + 2.dp))
            .background(c.fill.copy(alpha = if (c.isDark) 0.5f else 0.24f)).padding(3.dp),
    ) {
        options.forEachIndexed { i, label ->
            val bg by animateColorAsState(if (i == selected) (if (c.isDark) c.surface2 else Color.White) else Color.Transparent, label = "seg")
            Box(
                Modifier.weight(1f).fillMaxSize().clip(RoundedCornerShape(Radii.sm)).background(bg).pressable({ onSelect(i) }, pressedScale = 1f),
                contentAlignment = Alignment.Center,
            ) { Text(label, style = MaterialTheme.typography.titleSmall, color = if (i == selected) c.label else c.label2) }
        }
    }
}

@Composable
private fun Chip(label: String, selected: Boolean, onClick: () -> Unit) {
    val c = Mascom.colors
    val bg by animateColorAsState(if (selected) c.tintSolid else c.surface, label = "chip")
    Text(
        label,
        style = MaterialTheme.typography.titleSmall,
        color = if (selected) c.tintContrast else c.label,
        modifier = Modifier.clip(CircleShape).background(bg).pressable(onClick).padding(horizontal = 14.dp, vertical = 8.dp),
    )
}
