package com.mascom.app.di

import android.content.Context
import androidx.room.Room
import com.mascom.app.BuildConfig
import com.mascom.app.core.network.BaseUrlInterceptor
import com.mascom.app.core.network.ServerConfig
import com.mascom.app.core.network.SessionCookieJar
import com.mascom.app.data.local.BagDao
import com.mascom.app.data.local.MascomDatabase
import com.mascom.app.data.local.ProductDao
import com.mascom.app.data.remote.MascomApi
import com.mascom.app.data.repository.AuthRepositoryImpl
import com.mascom.app.data.repository.BagRepositoryImpl
import com.mascom.app.data.repository.CheckoutRepositoryImpl
import com.mascom.app.data.repository.ConsoleRepositoryImpl
import com.mascom.app.data.repository.OrderRepositoryImpl
import com.mascom.app.data.repository.ShopRepositoryImpl
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.domain.repository.BagRepository
import com.mascom.app.domain.repository.CheckoutRepository
import com.mascom.app.domain.repository.ConsoleRepository
import com.mascom.app.domain.repository.OrderRepository
import com.mascom.app.domain.repository.ShopRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class ApplicationScope

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    @ApplicationScope
    fun applicationScope(): CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    @Provides
    @Singleton
    fun json(): Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = true
        isLenient = true
    }

    @Provides
    @Singleton
    fun okHttp(cookies: SessionCookieJar, baseUrl: BaseUrlInterceptor): OkHttpClient =
        OkHttpClient.Builder()
            .cookieJar(cookies)
            .addInterceptor(baseUrl)
            .apply {
                if (BuildConfig.DEBUG) {
                    addInterceptor(HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BASIC))
                }
            }
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()

    @Provides
    @Singleton
    fun api(client: OkHttpClient, json: Json): MascomApi = Retrofit.Builder()
        .baseUrl(ServerConfig.PLACEHOLDER_URL)
        .client(client)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(MascomApi::class.java)

    @Provides
    @Singleton
    fun database(@ApplicationContext context: Context): MascomDatabase =
        Room.databaseBuilder(context, MascomDatabase::class.java, "mascom.db")
            .fallbackToDestructiveMigration(dropAllTables = true)
            .build()

    @Provides
    fun bagDao(db: MascomDatabase): BagDao = db.bagDao()

    @Provides
    fun productDao(db: MascomDatabase): ProductDao = db.productDao()
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds abstract fun auth(impl: AuthRepositoryImpl): AuthRepository
    @Binds abstract fun shop(impl: ShopRepositoryImpl): ShopRepository
    @Binds abstract fun bag(impl: BagRepositoryImpl): BagRepository
    @Binds abstract fun checkout(impl: CheckoutRepositoryImpl): CheckoutRepository
    @Binds abstract fun orders(impl: OrderRepositoryImpl): OrderRepository
    @Binds abstract fun console(impl: ConsoleRepositoryImpl): ConsoleRepository
}
