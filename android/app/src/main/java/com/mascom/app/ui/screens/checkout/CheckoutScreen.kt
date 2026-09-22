package com.mascom.app.ui.screens.checkout

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.AddPhotoAlternate
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.ContentCopy
import androidx.compose.material.icons.rounded.Payments
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Sell
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import java.util.Locale
import com.mascom.app.core.util.money
import com.mascom.app.ui.components.ButtonKind
import com.mascom.app.ui.components.Card
import com.mascom.app.ui.components.GlassScaffold
import com.mascom.app.ui.components.InlineError
import com.mascom.app.ui.components.LoadingView
import com.mascom.app.ui.components.LocalUrlResolver
import com.mascom.app.ui.components.MascomButton
import com.mascom.app.ui.components.MascomTextField
import com.mascom.app.ui.components.MessageView
import com.mascom.app.ui.components.RemoteImage
import com.mascom.app.ui.components.RowDivider
import com.mascom.app.ui.components.SectionHeader
import com.mascom.app.ui.components.RollingText
import com.mascom.app.ui.components.appear
import com.mascom.app.ui.components.pressable
import com.mascom.app.ui.screens.bag.SummaryLine
import com.mascom.app.ui.theme.LocalAmbientHaze
import com.mascom.app.ui.theme.Mascom
import com.mascom.app.ui.theme.Radii
import com.mascom.app.ui.theme.glass

@Composable
fun CheckoutScreen(onBack: () -> Unit, onPlaced: (String) -> Unit, vm: CheckoutViewModel = hiltViewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val form = state.form
    val goBack = { if (!vm.back()) onBack() }

    BackHandler(onBack = goBack)
    LaunchedEffect(Unit) { vm.placed.collect(onPlaced) }

    GlassScaffold(
        title = "Checkout",
        largeTitle = false,
        onBack = goBack,
        bottomBar = {
            MascomButton(
                text = when (form.step) {
                    CheckoutStep.Review -> "Choose who to pay"
                    CheckoutStep.Recipient -> "Continue to payment"
                    CheckoutStep.Pay -> "I've paid · add proof"
                    CheckoutStep.Proof -> "Place order · ${money(state.total)}"
                },
                onClick = vm::next,
                enabled = state.canContinue,
                loading = form.placing,
                icon = if (form.step == CheckoutStep.Proof) null else Icons.AutoMirrored.Rounded.ArrowForward,
                modifier = Modifier.fillMaxWidth(),
                height = 56.dp,
            )
        },
    ) {
        item(key = "steps") { StepIndicator(form.step) }
        item(key = "body") {
            AnimatedContent(
                targetState = form.step,
                transitionSpec = {
                    val forward = targetState.ordinal > initialState.ordinal
                    (slideInHorizontally { if (forward) it / 3 else -it / 3 } + fadeIn()) togetherWith
                        (slideOutHorizontally { if (forward) -it / 3 else it / 3 } + fadeOut())
                },
                label = "step",
            ) { step ->
                Column {
                    when (step) {
                        CheckoutStep.Review -> ReviewStep(state, vm)
                        CheckoutStep.Recipient -> RecipientStep(state, vm)
                        CheckoutStep.Pay -> PayStep(state)
                        CheckoutStep.Proof -> ProofStep(state, vm)
                    }
                    form.error?.let {
                        Spacer(Modifier.height(12.dp))
                        InlineError(it)
                    }
                }
            }
        }
    }
}

@Composable
private fun StepIndicator(current: CheckoutStep) {
    val c = Mascom.colors
    Row(Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 18.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        CheckoutStep.entries.forEach { step ->
            val done = step.ordinal <= current.ordinal
            // Each bar fills left to right as you reach its step, and drains when you go back.
            val fill by androidx.compose.animation.core.animateFloatAsState(
                if (done) 1f else 0f,
                androidx.compose.animation.core.tween(420, easing = androidx.compose.animation.core.EaseOutCubic),
                label = "step-fill",
            )
            Column(Modifier.weight(1f)) {
                Box(Modifier.fillMaxWidth().height(4.dp).clip(CircleShape).background(c.fill.copy(alpha = 0.4f))) {
                    Box(Modifier.fillMaxWidth(fill).height(4.dp).clip(CircleShape).background(c.tintSolid))
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    step.title,
                    style = MaterialTheme.typography.labelMedium,
                    color = if (step == current) c.label else c.label3,
                )
            }
        }
    }
}

@Composable
private fun ReviewStep(state: CheckoutUiState, vm: CheckoutViewModel) {
    val c = Mascom.colors
    val form = state.form
    Card(padding = PaddingValues(0.dp)) {
        state.lines.forEachIndexed { index, line ->
            Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                RemoteImage(line.image, line.name, Modifier.size(52.dp).clip(RoundedCornerShape(Radii.sm)))
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(line.name, style = MaterialTheme.typography.titleSmall)
                    val detail = listOfNotNull(line.color, line.size, line.customName, "×${line.quantity}")
                    Text(detail.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = c.label2)
                }
                Text(money(line.total), style = MaterialTheme.typography.titleSmall)
            }
            if (index < state.lines.lastIndex) RowDivider(inset = 76.dp)
        }
    }

    SectionHeader("Coupon")
    Card {
        if (form.coupon != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Rounded.Sell, null, tint = c.ok, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(form.coupon.code, style = MaterialTheme.typography.titleSmall)
                    Text(form.coupon.label, style = MaterialTheme.typography.bodySmall, color = c.ok)
                }
                MascomButton("Remove", vm::removeCoupon, kind = ButtonKind.Plain, height = 36.dp)
            }
        } else {
            Row(verticalAlignment = Alignment.CenterVertically) {
                MascomTextField(
                    value = form.couponInput,
                    onValueChange = vm::setCouponInput,
                    label = "Code",
                    modifier = Modifier.weight(1f),
                    imeAction = ImeAction.Done,
                    onImeAction = vm::applyCoupon,
                    error = form.couponError,
                )
                Spacer(Modifier.width(10.dp))
                MascomButton(
                    "Apply",
                    vm::applyCoupon,
                    kind = ButtonKind.Secondary,
                    enabled = form.couponInput.isNotBlank(),
                    loading = form.couponBusy,
                    height = 48.dp,
                )
            }
        }
    }

    SectionHeader("Summary")
    Card {
        SummaryLine("Subtotal", money(form.coupon?.subtotal ?: state.subtotal))
        if (form.coupon != null) {
            Spacer(Modifier.height(6.dp))
            SummaryLine("Discount", "−${money(form.coupon.discount)}", valueColor = c.ok)
        }
        Spacer(Modifier.height(10.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("You pay", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
            RollingText(money(state.total), style = MaterialTheme.typography.titleMedium, color = c.label)
        }
    }
}

@Composable
private fun RecipientStep(state: CheckoutUiState, vm: CheckoutViewModel) {
    val c = Mascom.colors
    val form = state.form
    Text(
        "Pay a MASCOM member directly by UPI. They'll check your payment and confirm the order.",
        style = MaterialTheme.typography.bodyMedium,
        color = c.label2,
        modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp),
    )
    Spacer(Modifier.height(10.dp))
    when {
        form.recipientsLoading -> LoadingView()
        form.recipientsError != null -> MessageView(
            title = "Couldn't load who to pay",
            body = form.recipientsError,
            actionText = "Try again",
            onAction = vm::loadRecipients,
        )
        form.recipients.isEmpty() -> MessageView(
            title = "Payments are paused",
            body = "No one is collecting payments right now. Check back soon.",
            icon = Icons.Rounded.Payments,
        )
        else -> form.recipients.forEach { r ->
            val selected = r.id == form.recipientId
            val border by animateColorAsState(if (selected) c.tint else Color.Transparent, label = "sel")
            Row(
                Modifier
                    .padding(bottom = 10.dp)
                    .fillMaxWidth()
                    .pressable({ vm.selectRecipient(r.id) }, pressedScale = 0.98f)
                    .glass(LocalAmbientHaze.current, RoundedCornerShape(Radii.card))
                    .border(2.dp, border, RoundedCornerShape(Radii.card))
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier.size(44.dp).clip(CircleShape).background(c.tintGlow),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(r.name.take(1).uppercase(), style = MaterialTheme.typography.titleMedium, color = c.tint)
                }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(r.name, style = MaterialTheme.typography.titleMedium)
                    Text(r.upiId, style = MaterialTheme.typography.bodySmall, color = c.label2)
                    r.description?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = c.label3) }
                }
                androidx.compose.animation.Crossfade(selected, label = "recipient-check") { on ->
                    Icon(
                        if (on) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                        null,
                        tint = if (on) c.tint else c.label4,
                        modifier = if (on) Modifier.appear(distance = 0.dp) else Modifier,
                    )
                }
            }
        }
    }
}

@Composable
private fun PayStep(state: CheckoutUiState) {
    val c = Mascom.colors
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    val recipient = state.recipient ?: return
    val resolve = LocalUrlResolver.current
    var qrFailed by remember(recipient.id, state.total) { mutableStateOf(false) }
    val qr = if (qrFailed) resolve(recipient.qrCodeUrl) else resolve(state.qrPath(c.isDark))

    Card {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Pay ${recipient.name}", style = MaterialTheme.typography.titleMedium)
            Text(money(state.total), style = MaterialTheme.typography.displaySmall, color = c.tint)
            Spacer(Modifier.height(14.dp))
            Box(
                Modifier
                    .fillMaxWidth(0.72f)
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(Radii.xl))
                    .background(c.surface2)
                    .padding(12.dp),
                contentAlignment = Alignment.Center,
            ) {
                // Amount-locked QR from the server, falling back to the recipient's own QR image.
                AsyncImage(
                    model = qr,
                    contentDescription = "UPI QR code",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize(),
                    onError = { qrFailed = true },
                )
            }
            Spacer(Modifier.height(10.dp))
            Text(
                "Scan with any UPI app, or pay straight from this phone.",
                style = MaterialTheme.typography.bodySmall,
                color = c.label2,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(16.dp))
            MascomButton(
                text = "Open UPI app",
                onClick = {
                    val uri = state.upiUri() ?: return@MascomButton
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
                    try {
                        context.startActivity(Intent.createChooser(intent, "Pay with"))
                    } catch (_: ActivityNotFoundException) {
                        clipboard.setText(AnnotatedString(recipient.upiId))
                    }
                },
                icon = Icons.Rounded.Payments,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }

    SectionHeader("Or pay manually")
    Card(padding = PaddingValues(0.dp)) {
        CopyRow("UPI ID", recipient.upiId) { clipboard.setText(AnnotatedString(recipient.upiId)) }
        RowDivider()
        CopyRow("Amount", money(state.total)) { clipboard.setText(AnnotatedString(String.format(Locale.US, "%.2f", state.total))) }
        RowDivider()
        CopyRow("Note", state.paymentNote) { clipboard.setText(AnnotatedString(state.paymentNote)) }
    }
    Text(
        "Add the note so ${recipient.name} can match the payment to you. Take a screenshot once it goes through.",
        style = MaterialTheme.typography.bodySmall,
        color = c.label3,
        modifier = Modifier.padding(horizontal = 4.dp, vertical = 10.dp),
    )
}

@Composable
private fun CopyRow(label: String, value: String, onCopy: () -> Unit) {
    val c = Mascom.colors
    Row(
        Modifier.fillMaxWidth().pressable(onCopy, pressedScale = 0.98f, label = "Copy $label").padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = c.label2, modifier = Modifier.width(80.dp))
        Text(value, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        Icon(Icons.Rounded.ContentCopy, null, tint = c.tint, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun ProofStep(state: CheckoutUiState, vm: CheckoutViewModel) {
    val c = Mascom.colors
    val form = state.form
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri -> vm.setScreenshot(uri) }
    val pick = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }

    Card(padding = PaddingValues(12.dp), onClick = pick) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(if (form.screenshot != null) 320.dp else 180.dp)
                .clip(RoundedCornerShape(Radii.lg))
                .background(c.surface2)
                .border(1.5.dp, if (form.screenshot == null) c.separator else Color.Transparent, RoundedCornerShape(Radii.lg)),
            contentAlignment = Alignment.Center,
        ) {
            if (form.screenshot != null) {
                AsyncImage(form.screenshot, "Payment screenshot", Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Rounded.AddPhotoAlternate, null, tint = c.tint, modifier = Modifier.size(36.dp))
                    Spacer(Modifier.height(8.dp))
                    Text("Add payment screenshot", style = MaterialTheme.typography.titleSmall)
                    Text("It should show the amount and the UTR", style = MaterialTheme.typography.bodySmall, color = c.label2)
                }
            }
        }
        if (form.screenshot != null) {
            Spacer(Modifier.height(8.dp))
            Text("Tap to change", style = MaterialTheme.typography.labelMedium, color = c.tint, modifier = Modifier.align(Alignment.CenterHorizontally))
        }
    }

    Spacer(Modifier.height(14.dp))
    MascomTextField(
        value = form.reference,
        onValueChange = vm::setReference,
        label = "UTR / reference (optional)",
        placeholder = "12-digit number from your UPI app",
        imeAction = ImeAction.Done,
    )

    Spacer(Modifier.height(8.dp))
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(Radii.md)).pressable({ vm.setConfirmed(!form.confirmed) }, pressedScale = 0.99f).padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(
            checked = form.confirmed,
            onCheckedChange = vm::setConfirmed,
            colors = CheckboxDefaults.colors(checkedColor = c.tintSolid, checkmarkColor = c.tintContrast),
        )
        Text(
            "I've paid ${money(state.total)} to ${state.recipient?.name ?: "the recipient"} and this screenshot is genuine.",
            style = MaterialTheme.typography.bodyMedium,
            color = c.label2,
        )
    }
}
