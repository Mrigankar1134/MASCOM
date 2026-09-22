package com.mascom.app.data.repository

import com.mascom.app.core.util.parseInstant
import com.mascom.app.data.local.BagLineEntity
import com.mascom.app.data.local.ProductEntity
import com.mascom.app.data.remote.dto.MeDto
import com.mascom.app.data.remote.dto.OrderDto
import com.mascom.app.data.remote.dto.ProductDto
import com.mascom.app.data.remote.dto.RecipientDto
import com.mascom.app.data.remote.dto.StatsResponse
import com.mascom.app.domain.model.BagLine
import com.mascom.app.domain.model.ConsoleStats
import com.mascom.app.domain.model.Customer
import com.mascom.app.domain.model.DayPoint
import com.mascom.app.domain.model.ItemStatus
import com.mascom.app.domain.model.Order
import com.mascom.app.domain.model.OrderItem
import com.mascom.app.domain.model.OrderStatus
import com.mascom.app.domain.model.PaymentStatus
import com.mascom.app.domain.model.Product
import com.mascom.app.domain.model.Recipient
import com.mascom.app.domain.model.Role
import com.mascom.app.domain.model.StatusEvent
import com.mascom.app.domain.model.TopProduct
import com.mascom.app.domain.model.User
import com.mascom.app.domain.model.Variant

fun MeDto.toDomain() = User(
    id = id,
    name = name,
    email = email,
    phone = phone,
    rollNo = rollNo,
    section = section,
    hostel = hostel,
    block = block,
    roomNo = roomNo,
    gender = gender,
    profilePicUrl = profilePicUrl,
    roles = roles.mapNotNull(Role::from).toSet() + Role.Student,
)

fun ProductDto.toEntity(position: Int) = ProductEntity(
    id = id,
    position = position,
    productId = productId,
    name = name,
    slug = slug,
    description = description,
    price = price,
    available = available,
    isLive = isLive,
    category = category,
    material = material,
    sizes = availableSizes,
    allowCustomName = allowCustomName,
    launchTime = launchTime,
    variants = variants,
    totalSold = totalSold,
)

fun ProductEntity.toDomain() = Product(
    id = id,
    productId = productId,
    name = name,
    slug = slug,
    description = description,
    price = price,
    available = available,
    isLive = isLive,
    category = category,
    material = material,
    sizes = sizes,
    allowCustomName = allowCustomName,
    launchTime = parseInstant(launchTime),
    variants = variants.map { Variant(it.color, it.imageUrls) },
    totalSold = totalSold,
)

fun BagLineEntity.toDomain() = BagLine(
    key = key,
    productId = productId,
    slug = slug,
    name = name,
    image = image,
    color = color,
    size = size,
    customName = customName,
    unitPrice = unitPrice,
    quantity = quantity,
)

fun RecipientDto.toDomain() = Recipient(
    id = id,
    name = name,
    upiId = upiId,
    phone = phoneNumber,
    qrCodeUrl = qrCodeUrl,
    description = description?.takeIf { it.isNotBlank() },
)

fun OrderDto.toDomain() = Order(
    id = id,
    orderId = orderId,
    status = OrderStatus.from(status),
    paymentStatus = PaymentStatus.from(paymentStatus),
    items = items.map { item ->
        OrderItem(
            id = item.id,
            name = item.productSnapshot?.name.orEmpty(),
            image = item.variant?.selectedImage
                ?: item.productSnapshot?.image
                ?: item.productSnapshot?.variants
                    ?.firstOrNull { it.color == item.variant?.color }?.imageUrls?.firstOrNull()
                ?: item.productSnapshot?.variants?.firstOrNull()?.imageUrls?.firstOrNull(),
            color = item.variant?.color,
            size = item.variant?.size,
            customName = item.customName,
            quantity = item.quantity,
            unitPrice = item.unitPrice,
            status = ItemStatus.from(item.itemStatus),
            batchNumber = item.batchNumber,
            history = item.statusHistory.map { StatusEvent(it.status, parseInstant(it.timestamp), it.notes) },
        )
    },
    subtotal = totalAmount,
    discount = discountAmount,
    amountPaid = finalAmountPaid,
    paidTo = paymentRecipientId?.name ?: paidTo,
    recipientUpi = paymentRecipientId?.upiId,
    screenshotUrl = screenshotUrl,
    paymentReference = paymentReference,
    couponCode = couponCodeUsed,
    verificationNotes = verificationNotes,
    batchNote = batchNote,
    placedAt = parseInstant(createdAt ?: orderDate),
    customer = userId?.takeIf { it.name != null }?.let { u ->
        Customer(
            name = u.name.orEmpty(),
            email = u.email,
            phone = u.phone,
            rollNo = u.rollNo,
            room = listOfNotNull(u.hostel, u.block, u.roomNo).filter { it.isNotBlank() }
                .joinToString(" · ").takeIf { it.isNotEmpty() },
        )
    },
    fraudFlags = fraudFlags,
)

fun StatsResponse.toDomain() = ConsoleStats(
    scopeAll = scope == "all",
    recipientName = recipient?.name,
    revenue = totals.revenue,
    orders = totals.orders,
    pending = totals.pending,
    paid = totals.paid,
    failed = totals.failed,
    units = totals.units,
    series = series.map { DayPoint(it.date, it.orders, it.revenue) },
    topProducts = topProducts.map { TopProduct(it.name, it.totalSold, it.totalRevenue) },
)
