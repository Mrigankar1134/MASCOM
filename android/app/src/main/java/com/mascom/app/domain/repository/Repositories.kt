package com.mascom.app.domain.repository

import android.net.Uri
import com.mascom.app.domain.model.BagLine
import com.mascom.app.domain.model.ConsoleStats
import com.mascom.app.domain.model.CouponQuote
import com.mascom.app.domain.model.NewAccount
import com.mascom.app.domain.model.Order
import com.mascom.app.domain.model.PaymentStatus
import com.mascom.app.domain.model.PlacedOrder
import com.mascom.app.domain.model.Product
import com.mascom.app.domain.model.ProfileEdit
import com.mascom.app.domain.model.Recipient
import com.mascom.app.domain.model.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow

interface AuthRepository {
    /** The signed-in user, or null. Seeded from cache at launch, then refreshed from the server. */
    val user: StateFlow<User?>

    suspend fun refresh(): Result<User?>
    suspend fun signIn(email: String, password: String): Result<User>
    suspend fun signUp(account: NewAccount): Result<User>
    suspend fun updateProfile(edit: ProfileEdit): Result<User>
    suspend fun updateAvatar(image: Uri): Result<User>
    suspend fun signOut()
}

interface ShopRepository {
    /** Cached products; call [refresh] to pull fresh ones. */
    val products: Flow<List<Product>>

    suspend fun refresh(): Result<Unit>
    fun product(slug: String): Flow<Product?>
}

interface BagRepository {
    val lines: Flow<List<BagLine>>

    suspend fun add(product: Product, color: String?, size: String?, customName: String?, quantity: Int)
    suspend fun setQuantity(key: String, quantity: Int)
    suspend fun remove(key: String)
    suspend fun clear()
    suspend fun snapshot(): List<BagLine>
}

interface CheckoutRepository {
    suspend fun recipients(): Result<List<Recipient>>
    suspend fun validateCoupon(code: String, lines: List<BagLine>): Result<CouponQuote>
    suspend fun uploadScreenshot(image: Uri): Result<String>
    suspend fun placeOrder(
        lines: List<BagLine>,
        recipientId: String,
        screenshotUrl: String,
        paymentReference: String?,
        couponCode: String?,
    ): Result<PlacedOrder>
}

interface OrderRepository {
    suspend fun orders(): Result<List<Order>>
    suspend fun order(id: String): Result<Order>
}

interface ConsoleRepository {
    suspend fun stats(): Result<ConsoleStats>
    suspend fun queue(status: PaymentStatus?, query: String?): Result<List<Order>>
    suspend fun setPayment(orderId: String, status: PaymentStatus, notes: String?): Result<Unit>
}
