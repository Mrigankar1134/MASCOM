package com.mascom.app.data.remote

import com.mascom.app.data.remote.dto.CouponQuoteDto
import com.mascom.app.data.remote.dto.CouponValidateRequest
import com.mascom.app.data.remote.dto.CreateOrderRequest
import com.mascom.app.data.remote.dto.CreateOrderResponse
import com.mascom.app.data.remote.dto.MeResponse
import com.mascom.app.data.remote.dto.OrderResponse
import com.mascom.app.data.remote.dto.OrdersResponse
import com.mascom.app.data.remote.dto.PaymentUpdateRequest
import com.mascom.app.data.remote.dto.ProductsResponse
import com.mascom.app.data.remote.dto.ProfileUpdateRequest
import com.mascom.app.data.remote.dto.QueueResponse
import com.mascom.app.data.remote.dto.RecipientsResponse
import com.mascom.app.data.remote.dto.SignInRequest
import com.mascom.app.data.remote.dto.SignUpRequest
import com.mascom.app.data.remote.dto.StatsResponse
import com.mascom.app.data.remote.dto.UploadResponse
import kotlinx.serialization.json.JsonObject
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

/** The web app's route handlers under src/app/api. Paths are relative to the configured server. */
interface MascomApi {

    @POST("api/auth/signin")
    suspend fun signIn(@Body body: SignInRequest): JsonObject

    @POST("api/auth/signup")
    suspend fun signUp(@Body body: SignUpRequest): JsonObject

    @POST("api/auth/signout")
    suspend fun signOut(): JsonObject

    @GET("api/auth/me")
    suspend fun me(): MeResponse

    @PATCH("api/auth/me")
    suspend fun updateMe(@Body body: ProfileUpdateRequest): JsonObject

    @GET("api/products")
    suspend fun products(): ProductsResponse

    @GET("api/recipients")
    suspend fun recipients(): RecipientsResponse

    @POST("api/coupons/validate")
    suspend fun validateCoupon(@Body body: CouponValidateRequest): CouponQuoteDto

    @GET("api/orders")
    suspend fun orders(): OrdersResponse

    @GET("api/orders/{id}")
    suspend fun order(@Path("id") id: String): OrderResponse

    @POST("api/orders")
    suspend fun placeOrder(@Body body: CreateOrderRequest): CreateOrderResponse

    @Multipart
    @POST("api/uploads")
    suspend fun upload(@Part file: MultipartBody.Part, @Part("kind") kind: RequestBody): UploadResponse

    @GET("api/admin/stats")
    suspend fun stats(): StatsResponse

    @GET("api/admin/queue")
    suspend fun queue(
        @Query("status") status: String?,
        @Query("q") query: String?,
        @Query("limit") limit: Int = 150,
    ): QueueResponse

    @PATCH("api/admin/orders/{id}/payment")
    suspend fun setPaymentStatus(@Path("id") id: String, @Body body: PaymentUpdateRequest): JsonObject
}
