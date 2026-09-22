package com.mascom.app.domain.model

import java.time.Instant

enum class Role(val wire: String) {
    Student("student"), Recipient("recipient"), Moderator("moderator"), Admin("admin");

    companion object {
        fun from(wire: String) = entries.firstOrNull { it.wire == wire }
    }
}

data class User(
    val id: String,
    val name: String,
    val email: String,
    val phone: String?,
    val rollNo: String?,
    val section: String?,
    val hostel: String?,
    val block: String?,
    val roomNo: String?,
    val gender: String?,
    val profilePicUrl: String?,
    val roles: Set<Role>,
) {
    /** Admins, moderators and payment recipients all get the console. */
    val canUseConsole get() = roles.any { it != Role.Student }
    val isStaff get() = Role.Admin in roles || Role.Moderator in roles
    val firstName get() = name.substringBefore(' ')
}

data class Variant(val color: String, val images: List<String>)

data class Product(
    val id: String,
    val productId: String,
    val name: String,
    val slug: String,
    val description: String?,
    val price: Double,
    val available: Boolean,
    val isLive: Boolean,
    val category: String?,
    val material: String?,
    val sizes: List<String>,
    val allowCustomName: Boolean,
    val launchTime: Instant?,
    val variants: List<Variant>,
    val totalSold: Int,
) {
    /** The shop lists launched products before the server flips `isLive`; ordering needs both flags. */
    val canOrder get() = available && isLive
    val cover get() = variants.firstNotNullOfOrNull { it.images.firstOrNull() }
}

data class BagLine(
    val key: String,
    val productId: String,
    val slug: String,
    val name: String,
    val image: String?,
    val color: String?,
    val size: String?,
    val customName: String?,
    val unitPrice: Double,
    val quantity: Int,
) {
    val total get() = unitPrice * quantity

    companion object {
        const val MAX_QUANTITY = 20

        /** Same identity rule as the web bag: one line per product, colour, size and name. */
        fun keyOf(productId: String, color: String?, size: String?, customName: String?) =
            listOf(productId, color.orEmpty(), size.orEmpty(), customName.orEmpty()).joinToString("|")
    }
}

data class Recipient(
    val id: String,
    val name: String,
    val upiId: String,
    val phone: String,
    val qrCodeUrl: String?,
    val description: String?,
)

data class CouponQuote(
    val code: String,
    val label: String,
    val subtotal: Double,
    val discount: Double,
    val total: Double,
)

enum class OrderStatus(val wire: String) {
    VerificationPending("Verification Pending"),
    Confirmed("Confirmed"),
    Processing("Processing"),
    PartiallyFulfilled("Partially Fulfilled"),
    Delivered("Delivered"),
    Failed("Failed");

    companion object {
        fun from(wire: String) = entries.firstOrNull { it.wire == wire } ?: VerificationPending
    }
}

enum class ItemStatus(val wire: String) {
    VerificationPending("Verification Pending"),
    Confirmed("Confirmed"),
    Processing("Processing"),
    Delivered("Delivered"),
    Failed("Failed"),
    WaitingForInventory("Waiting for Inventory");

    companion object {
        fun from(wire: String) = entries.firstOrNull { it.wire == wire } ?: VerificationPending
    }
}

enum class PaymentStatus(val wire: String) {
    Pending("Pending"), Paid("Paid"), Failed("Failed");

    companion object {
        fun from(wire: String) = entries.firstOrNull { it.wire == wire } ?: Pending
    }
}

data class StatusEvent(val status: String, val at: Instant?, val notes: String?)

data class OrderItem(
    val id: String,
    val name: String,
    val image: String?,
    val color: String?,
    val size: String?,
    val customName: String?,
    val quantity: Int,
    val unitPrice: Double,
    val status: ItemStatus,
    val batchNumber: String?,
    val history: List<StatusEvent>,
)

data class Customer(
    val name: String,
    val email: String?,
    val phone: String?,
    val rollNo: String?,
    val room: String?,
)

data class Order(
    val id: String,
    val orderId: String,
    val status: OrderStatus,
    val paymentStatus: PaymentStatus,
    val items: List<OrderItem>,
    val subtotal: Double,
    val discount: Double,
    val amountPaid: Double,
    val paidTo: String?,
    val recipientUpi: String?,
    val screenshotUrl: String?,
    val paymentReference: String?,
    val couponCode: String?,
    val verificationNotes: String?,
    val batchNote: String?,
    val placedAt: Instant?,
    val customer: Customer?,
    val fraudFlags: List<String>,
) {
    val units get() = items.sumOf { it.quantity }
}

data class PlacedOrder(val id: String, val orderId: String)

data class DayPoint(val date: String, val orders: Int, val revenue: Double)
data class TopProduct(val name: String, val sold: Int, val revenue: Double)

data class ConsoleStats(
    val scopeAll: Boolean,
    val recipientName: String?,
    val revenue: Double,
    val orders: Int,
    val pending: Int,
    val paid: Int,
    val failed: Int,
    val units: Int,
    val series: List<DayPoint>,
    val topProducts: List<TopProduct>,
)

data class ProfileEdit(
    val name: String,
    val phone: String,
    val rollNo: String,
    val section: String,
    val hostel: String,
    val block: String,
    val roomNo: String,
    val gender: String?,
)

data class NewAccount(
    val name: String,
    val email: String,
    val password: String,
    val rollNo: String,
    val section: String,
    val phone: String,
)
