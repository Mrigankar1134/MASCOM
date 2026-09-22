package com.mascom.app.data.repository

import android.net.Uri
import com.mascom.app.core.network.apiCall
import com.mascom.app.data.local.BagDao
import com.mascom.app.data.local.BagLineEntity
import com.mascom.app.data.local.ProductDao
import com.mascom.app.data.media.Uploader
import com.mascom.app.data.remote.MascomApi
import com.mascom.app.data.remote.dto.CouponValidateRequest
import com.mascom.app.data.remote.dto.CreateOrderRequest
import com.mascom.app.data.remote.dto.OrderItemInput
import com.mascom.app.domain.model.BagLine
import com.mascom.app.domain.model.CouponQuote
import com.mascom.app.domain.model.PlacedOrder
import com.mascom.app.domain.model.Product
import com.mascom.app.domain.model.Recipient
import com.mascom.app.domain.repository.BagRepository
import com.mascom.app.domain.repository.CheckoutRepository
import com.mascom.app.domain.repository.ShopRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ShopRepositoryImpl @Inject constructor(
    private val api: MascomApi,
    private val dao: ProductDao,
    private val json: Json,
) : ShopRepository {

    override val products: Flow<List<Product>> = dao.observe().map { rows -> rows.map { it.toDomain() } }

    override suspend fun refresh(): Result<Unit> = apiCall(json) {
        val fresh = api.products().products
        dao.replaceAll(fresh.mapIndexed { index, dto -> dto.toEntity(index) })
    }

    override fun product(slug: String): Flow<Product?> = dao.observe(slug).map { it?.toDomain() }
}

@Singleton
class BagRepositoryImpl @Inject constructor(private val dao: BagDao) : BagRepository {

    override val lines: Flow<List<BagLine>> = dao.observe().map { rows -> rows.map { it.toDomain() } }

    override suspend fun add(product: Product, color: String?, size: String?, customName: String?, quantity: Int) {
        val name = customName?.trim()?.takeIf { it.isNotEmpty() && product.allowCustomName }
        val key = BagLine.keyOf(product.id, color, size, name)
        val existing = dao.find(key)
        val image = product.variants.firstOrNull { it.color == color }?.images?.firstOrNull() ?: product.cover
        dao.upsert(
            BagLineEntity(
                key = key,
                productId = product.id,
                slug = product.slug,
                name = product.name,
                image = image,
                color = color,
                size = size,
                customName = name,
                unitPrice = product.price,
                quantity = ((existing?.quantity ?: 0) + quantity).coerceIn(1, BagLine.MAX_QUANTITY),
                addedAt = existing?.addedAt ?: System.currentTimeMillis(),
            ),
        )
    }

    override suspend fun setQuantity(key: String, quantity: Int) {
        if (quantity <= 0) dao.delete(key) else dao.setQuantity(key, quantity.coerceAtMost(BagLine.MAX_QUANTITY))
    }

    override suspend fun remove(key: String) = dao.delete(key)

    override suspend fun clear() = dao.clear()

    override suspend fun snapshot(): List<BagLine> = dao.all().map { it.toDomain() }
}

@Singleton
class CheckoutRepositoryImpl @Inject constructor(
    private val api: MascomApi,
    private val uploader: Uploader,
    private val json: Json,
) : CheckoutRepository {

    override suspend fun recipients(): Result<List<Recipient>> = apiCall(json) {
        api.recipients().recipients.map { it.toDomain() }
    }

    override suspend fun validateCoupon(code: String, lines: List<BagLine>): Result<CouponQuote> = apiCall(json) {
        val quote = api.validateCoupon(CouponValidateRequest(code.trim().uppercase(), lines.toInputs()))
        CouponQuote(quote.code, quote.label, quote.subtotal, quote.discount, quote.total)
    }

    override suspend fun uploadScreenshot(image: Uri): Result<String> = uploader.upload(image, kind = "screenshot")

    override suspend fun placeOrder(
        lines: List<BagLine>,
        recipientId: String,
        screenshotUrl: String,
        paymentReference: String?,
        couponCode: String?,
    ): Result<PlacedOrder> = apiCall(json) {
        val placed = api.placeOrder(
            CreateOrderRequest(
                items = lines.toInputs(),
                paymentRecipientId = recipientId,
                screenshotUrl = screenshotUrl,
                paymentReference = paymentReference,
                couponCode = couponCode,
            ),
        ).order
        PlacedOrder(placed.id, placed.orderId)
    }

    private fun List<BagLine>.toInputs() = map {
        OrderItemInput(
            productId = it.productId,
            quantity = it.quantity,
            color = it.color,
            size = it.size,
            customName = it.customName,
        )
    }
}
