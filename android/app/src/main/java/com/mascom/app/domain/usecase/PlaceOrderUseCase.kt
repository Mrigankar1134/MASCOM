package com.mascom.app.domain.usecase

import android.net.Uri
import com.mascom.app.domain.model.PlacedOrder
import com.mascom.app.domain.repository.BagRepository
import com.mascom.app.domain.repository.CheckoutRepository
import javax.inject.Inject

/** Uploads the payment proof, places the order against the current bag, then empties the bag. */
class PlaceOrderUseCase @Inject constructor(
    private val checkout: CheckoutRepository,
    private val bag: BagRepository,
) {
    suspend operator fun invoke(
        recipientId: String,
        screenshot: Uri,
        paymentReference: String?,
        couponCode: String?,
    ): Result<PlacedOrder> {
        val lines = bag.snapshot()
        if (lines.isEmpty()) return Result.failure(IllegalStateException("Your bag is empty."))

        val proofUrl = checkout.uploadScreenshot(screenshot).getOrElse { return Result.failure(it) }
        return checkout.placeOrder(
            lines = lines,
            recipientId = recipientId,
            screenshotUrl = proofUrl,
            paymentReference = paymentReference?.trim()?.takeIf { it.isNotEmpty() },
            couponCode = couponCode,
        ).onSuccess { bag.clear() }
    }
}
