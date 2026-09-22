package com.mascom.app.ui.screens.checkout

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mascom.app.domain.model.BagLine
import com.mascom.app.domain.model.CouponQuote
import com.mascom.app.domain.model.Recipient
import com.mascom.app.domain.model.User
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.domain.repository.BagRepository
import com.mascom.app.domain.repository.CheckoutRepository
import com.mascom.app.domain.usecase.PlaceOrderUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.net.URLEncoder
import java.util.Locale
import javax.inject.Inject

enum class CheckoutStep(val title: String) { Review("Review"), Recipient("Who you pay"), Pay("Pay"), Proof("Proof") }

data class CheckoutForm(
    val step: CheckoutStep = CheckoutStep.Review,
    val couponInput: String = "",
    val coupon: CouponQuote? = null,
    val couponBusy: Boolean = false,
    val couponError: String? = null,
    val recipients: List<Recipient> = emptyList(),
    val recipientsLoading: Boolean = true,
    val recipientsError: String? = null,
    val recipientId: String? = null,
    val screenshot: Uri? = null,
    val reference: String = "",
    val confirmed: Boolean = false,
    val placing: Boolean = false,
    val error: String? = null,
)

data class CheckoutUiState(val form: CheckoutForm, val lines: List<BagLine>, val user: User?) {
    val subtotal get() = lines.sumOf { it.total }
    val total get() = form.coupon?.total ?: subtotal
    val recipient get() = form.recipients.firstOrNull { it.id == form.recipientId }

    /** Shown in the payer's UPI app, so the recipient can match the payment to a person. */
    val paymentNote get() = "MASCOM ${user?.rollNo?.takeIf { it.isNotBlank() } ?: user?.name.orEmpty()}".trim().take(48)

    val canContinue get() = when (form.step) {
        CheckoutStep.Review -> lines.isNotEmpty()
        CheckoutStep.Recipient -> recipient != null
        CheckoutStep.Pay -> true
        CheckoutStep.Proof -> form.screenshot != null && form.confirmed && !form.placing
    }

    fun upiUri(): String? {
        val r = recipient ?: return null
        return "upi://pay?pa=${enc(r.upiId)}&pn=${enc(r.name)}&am=${amount()}&cu=INR&tn=${enc(paymentNote)}"
    }

    /** The server renders an amount-locked QR for the chosen recipient. */
    fun qrPath(dark: Boolean): String? {
        val r = recipient ?: return null
        return "/api/qr?upi=${enc(r.upiId)}&name=${enc(r.name)}&amount=${amount()}" +
            "&note=${enc(paymentNote)}&theme=${if (dark) "dark" else "light"}"
    }

    private fun amount() = String.format(Locale.US, "%.2f", total)
    private fun enc(value: String) = URLEncoder.encode(value, "UTF-8").replace("+", "%20")
}

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val checkout: CheckoutRepository,
    private val placeOrder: PlaceOrderUseCase,
    bag: BagRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val form = MutableStateFlow(CheckoutForm())

    private val _placed = Channel<String>(Channel.BUFFERED)
    val placed = _placed.receiveAsFlow()

    val state: StateFlow<CheckoutUiState> = combine(form, bag.lines, auth.user) { f, lines, user ->
        CheckoutUiState(f, lines, user)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, CheckoutUiState(CheckoutForm(), emptyList(), null))

    init {
        loadRecipients()
        // A coupon is priced against the bag; if the bag changes, the quote no longer holds.
        viewModelScope.launch {
            bag.lines.distinctUntilChanged().drop(1).collect {
                if (form.value.coupon != null) form.update { it.copy(coupon = null, couponError = "Your bag changed, so apply the code again.") }
            }
        }
    }

    fun loadRecipients() {
        viewModelScope.launch {
            form.update { it.copy(recipientsLoading = true, recipientsError = null) }
            checkout.recipients()
                .onSuccess { list ->
                    form.update {
                        it.copy(
                            recipients = list,
                            recipientsLoading = false,
                            recipientId = it.recipientId ?: list.singleOrNull()?.id,
                        )
                    }
                }
                .onFailure { e -> form.update { it.copy(recipientsLoading = false, recipientsError = e.message) } }
        }
    }

    fun setCouponInput(value: String) = form.update { it.copy(couponInput = value.uppercase().take(32), couponError = null) }

    fun applyCoupon() {
        val code = form.value.couponInput.trim()
        if (code.isEmpty()) return
        viewModelScope.launch {
            form.update { it.copy(couponBusy = true, couponError = null) }
            checkout.validateCoupon(code, state.value.lines)
                .onSuccess { quote -> form.update { it.copy(coupon = quote, couponBusy = false) } }
                .onFailure { e -> form.update { it.copy(coupon = null, couponBusy = false, couponError = e.message) } }
        }
    }

    fun removeCoupon() = form.update { it.copy(coupon = null, couponInput = "", couponError = null) }

    fun selectRecipient(id: String) = form.update { it.copy(recipientId = id) }
    fun setScreenshot(uri: Uri?) = form.update { it.copy(screenshot = uri ?: it.screenshot, error = null) }
    fun setReference(value: String) = form.update { it.copy(reference = value.take(40)) }
    fun setConfirmed(value: Boolean) = form.update { it.copy(confirmed = value) }

    fun next() {
        val current = state.value
        if (!current.canContinue) return
        when (current.form.step) {
            CheckoutStep.Proof -> submit()
            else -> form.update { it.copy(step = CheckoutStep.entries[it.step.ordinal + 1], error = null) }
        }
    }

    /** Returns false when already on the first step, so the screen can close instead. */
    fun back(): Boolean {
        val step = form.value.step
        if (step == CheckoutStep.Review || form.value.placing) return false
        form.update { it.copy(step = CheckoutStep.entries[step.ordinal - 1], error = null) }
        return true
    }

    private fun submit() {
        val current = state.value
        val recipient = current.recipient ?: return
        val screenshot = current.form.screenshot ?: return
        viewModelScope.launch {
            form.update { it.copy(placing = true, error = null) }
            placeOrder(recipient.id, screenshot, current.form.reference, current.form.coupon?.code)
                .onSuccess { _placed.send(it.orderId.ifEmpty { it.id }) }
                .onFailure { e -> form.update { it.copy(placing = false, error = e.message) } }
        }
    }
}
