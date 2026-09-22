package com.mascom.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Shapes mirror src/app/api/** and src/lib/validators.ts on the web app. The database is shared
// with an older server, so almost everything is optional with a default.

// ---- Auth ------------------------------------------------------------------------------------

@Serializable
data class SignInRequest(val email: String, val password: String)

@Serializable
data class SignUpRequest(
    val name: String,
    val email: String,
    val password: String,
    val rollNo: String? = null,
    val section: String? = null,
    val phone: String? = null,
)

@Serializable
data class MeResponse(val user: MeDto? = null)

@Serializable
data class MeDto(
    val id: String,
    val name: String = "",
    val email: String = "",
    val phone: String? = null,
    val rollNo: String? = null,
    val section: String? = null,
    val hostel: String? = null,
    val block: String? = null,
    val roomNo: String? = null,
    val gender: String? = null,
    val profilePicUrl: String? = null,
    val roles: List<String> = listOf("student"),
)

/** Every field is optional; an empty string clears it on the server, and null leaves it alone. */
@Serializable
data class ProfileUpdateRequest(
    val name: String? = null,
    val phone: String? = null,
    val rollNo: String? = null,
    val section: String? = null,
    val hostel: String? = null,
    val block: String? = null,
    val roomNo: String? = null,
    val gender: String? = null,
    val profilePicUrl: String? = null,
)

// ---- Shop ------------------------------------------------------------------------------------

@Serializable
data class ProductsResponse(val products: List<ProductDto> = emptyList())

@Serializable
data class ProductDto(
    @SerialName("_id") val id: String,
    val productId: String = "",
    val name: String = "",
    val slug: String = "",
    val description: String? = null,
    val price: Double = 0.0,
    val available: Boolean = false,
    val isLive: Boolean = false,
    val category: String? = null,
    val material: String? = null,
    val availableSizes: List<String> = emptyList(),
    val allowCustomName: Boolean = false,
    val launchTime: String? = null,
    val variants: List<VariantDto> = emptyList(),
    val totalSold: Int = 0,
)

@Serializable
data class VariantDto(val color: String = "", val imageUrls: List<String> = emptyList())

@Serializable
data class RecipientsResponse(val recipients: List<RecipientDto> = emptyList())

@Serializable
data class RecipientDto(
    @SerialName("_id") val id: String,
    val name: String = "",
    val upiId: String = "",
    val phoneNumber: String = "",
    val qrCodeUrl: String? = null,
    val description: String? = null,
)

// ---- Checkout --------------------------------------------------------------------------------

@Serializable
data class OrderItemInput(
    val productId: String,
    val quantity: Int,
    val color: String? = null,
    val size: String? = null,
    val customName: String? = null,
)

@Serializable
data class CouponValidateRequest(val code: String, val items: List<OrderItemInput>)

@Serializable
data class CouponQuoteDto(
    val code: String = "",
    val label: String = "",
    val subtotal: Double = 0.0,
    val discount: Double = 0.0,
    val total: Double = 0.0,
)

@Serializable
data class CreateOrderRequest(
    val items: List<OrderItemInput>,
    val paymentRecipientId: String,
    val screenshotUrl: String,
    val paymentReference: String? = null,
    val couponCode: String? = null,
)

@Serializable
data class CreateOrderResponse(val order: PlacedOrderDto)

@Serializable
data class PlacedOrderDto(
    val id: String,
    val orderId: String,
    val status: String = "",
    val paymentStatus: String = "",
    val finalAmountPaid: Double = 0.0,
    val paidTo: String? = null,
)

@Serializable
data class UploadResponse(val url: String, val filename: String? = null, val bytes: Long? = null)

// ---- Orders ----------------------------------------------------------------------------------

@Serializable
data class OrdersResponse(val orders: List<OrderDto> = emptyList())

@Serializable
data class OrderResponse(val order: OrderDto)

@Serializable
data class OrderDto(
    @SerialName("_id") val id: String,
    val orderId: String = "",
    @Serializable(with = UserRefSerializer::class) val userId: UserRefDto? = null,
    val orderDate: String? = null,
    val status: String = "",
    val items: List<OrderItemDto> = emptyList(),
    val totalAmount: Double = 0.0,
    val discountAmount: Double = 0.0,
    val finalAmountPaid: Double = 0.0,
    val paymentStatus: String = "",
    val batchNote: String? = null,
    @Serializable(with = RecipientRefSerializer::class) val paymentRecipientId: RecipientRefDto? = null,
    val paidTo: String? = null,
    val screenshotUrl: String? = null,
    val paymentReference: String? = null,
    val couponCodeUsed: String? = null,
    val verificationNotes: String? = null,
    val verificationDate: String? = null,
    val riskScore: Double = 0.0,
    val fraudFlags: List<String> = emptyList(),
    val createdAt: String? = null,
)

@Serializable
data class OrderItemDto(
    @SerialName("_id") val id: String = "",
    @Serializable(with = FlexibleIdSerializer::class) val productId: String = "",
    val productSnapshot: SnapshotDto? = null,
    val variant: ItemVariantDto? = null,
    val quantity: Int = 1,
    val customName: String? = null,
    val unitPrice: Double = 0.0,
    val batchNumber: String? = null,
    val itemStatus: String = "",
    val statusHistory: List<StatusEventDto> = emptyList(),
)

@Serializable
data class SnapshotDto(
    val name: String = "",
    val image: String? = null,
    val category: String? = null,
    val variants: List<VariantDto> = emptyList(),
)

@Serializable
data class ItemVariantDto(
    val color: String? = null,
    val size: String? = null,
    val selectedImage: String? = null,
)

@Serializable
data class StatusEventDto(
    val status: String = "",
    val timestamp: String? = null,
    val notes: String? = null,
)

// ---- Console ---------------------------------------------------------------------------------

@Serializable
data class StatsResponse(
    val scope: String = "mine",
    val recipient: RecipientDto? = null,
    val totals: TotalsDto = TotalsDto(),
    val series: List<SeriesPointDto> = emptyList(),
    val topProducts: List<TopProductDto> = emptyList(),
)

@Serializable
data class TotalsDto(
    val revenue: Double = 0.0,
    val orders: Int = 0,
    val pending: Int = 0,
    val paid: Int = 0,
    val failed: Int = 0,
    val units: Int = 0,
)

@Serializable
data class SeriesPointDto(val date: String = "", val orders: Int = 0, val revenue: Double = 0.0)

@Serializable
data class TopProductDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val totalSold: Int = 0,
    val totalRevenue: Double = 0.0,
)

@Serializable
data class QueueResponse(
    val orders: List<OrderDto> = emptyList(),
    val recipient: RecipientDto? = null,
    val scope: String = "none",
)

@Serializable
data class PaymentUpdateRequest(val paymentStatus: String, val notes: String? = null)
