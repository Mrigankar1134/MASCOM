package com.mascom.app.data.repository

import com.mascom.app.core.network.apiCall
import com.mascom.app.data.remote.MascomApi
import com.mascom.app.data.remote.dto.PaymentUpdateRequest
import com.mascom.app.domain.model.ConsoleStats
import com.mascom.app.domain.model.Order
import com.mascom.app.domain.model.PaymentStatus
import com.mascom.app.domain.repository.ConsoleRepository
import com.mascom.app.domain.repository.OrderRepository
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepositoryImpl @Inject constructor(
    private val api: MascomApi,
    private val json: Json,
) : OrderRepository {

    override suspend fun orders(): Result<List<Order>> = apiCall(json) {
        api.orders().orders.map { it.toDomain() }
    }

    override suspend fun order(id: String): Result<Order> = apiCall(json) {
        api.order(id).order.toDomain()
    }
}

@Singleton
class ConsoleRepositoryImpl @Inject constructor(
    private val api: MascomApi,
    private val json: Json,
) : ConsoleRepository {

    override suspend fun stats(): Result<ConsoleStats> = apiCall(json) { api.stats().toDomain() }

    override suspend fun queue(status: PaymentStatus?, query: String?): Result<List<Order>> = apiCall(json) {
        api.queue(
            status = status?.wire ?: "all",
            query = query?.trim()?.takeIf { it.isNotEmpty() },
        ).orders.map { it.toDomain() }
    }

    override suspend fun setPayment(orderId: String, status: PaymentStatus, notes: String?): Result<Unit> =
        apiCall(json) {
            api.setPaymentStatus(orderId, PaymentUpdateRequest(status.wire, notes?.trim()?.takeIf { it.isNotEmpty() }))
        }.map { }
}
