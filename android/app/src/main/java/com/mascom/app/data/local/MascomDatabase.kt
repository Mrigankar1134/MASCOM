package com.mascom.app.data.local

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.Transaction
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import androidx.room.Upsert
import com.mascom.app.data.remote.dto.VariantDto
import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.json.Json

@Entity(tableName = "bag_lines")
data class BagLineEntity(
    @PrimaryKey val key: String,
    val productId: String,
    val slug: String,
    val name: String,
    val image: String?,
    val color: String?,
    val size: String?,
    val customName: String?,
    val unitPrice: Double,
    val quantity: Int,
    val addedAt: Long,
)

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val position: Int,
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
    val launchTime: String?,
    val variants: List<VariantDto>,
    val totalSold: Int,
)

@Dao
interface BagDao {
    @Query("SELECT * FROM bag_lines ORDER BY addedAt")
    fun observe(): Flow<List<BagLineEntity>>

    @Query("SELECT * FROM bag_lines ORDER BY addedAt")
    suspend fun all(): List<BagLineEntity>

    @Query("SELECT * FROM bag_lines WHERE `key` = :key")
    suspend fun find(key: String): BagLineEntity?

    @Upsert
    suspend fun upsert(line: BagLineEntity)

    @Query("UPDATE bag_lines SET quantity = :quantity WHERE `key` = :key")
    suspend fun setQuantity(key: String, quantity: Int)

    @Query("DELETE FROM bag_lines WHERE `key` = :key")
    suspend fun delete(key: String)

    @Query("DELETE FROM bag_lines")
    suspend fun clear()
}

@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY position")
    fun observe(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE slug = :slug OR productId = :slug OR id = :slug LIMIT 1")
    fun observe(slug: String): Flow<ProductEntity?>

    @Query("DELETE FROM products")
    suspend fun clear()

    @Upsert
    suspend fun upsertAll(products: List<ProductEntity>)

    /** Swaps the cache for a fresh list in one go so the grid never flashes empty. */
    @Transaction
    suspend fun replaceAll(products: List<ProductEntity>) {
        clear()
        upsertAll(products)
    }
}

class Converters {
    private val json = Json { ignoreUnknownKeys = true }

    @TypeConverter
    fun fromStrings(value: List<String>): String = json.encodeToString(value)

    @TypeConverter
    fun toStrings(value: String): List<String> = json.decodeFromString(value)

    @TypeConverter
    fun fromVariants(value: List<VariantDto>): String = json.encodeToString(value)

    @TypeConverter
    fun toVariants(value: String): List<VariantDto> = json.decodeFromString(value)
}

@Database(entities = [BagLineEntity::class, ProductEntity::class], version = 1, exportSchema = true)
@TypeConverters(Converters::class)
abstract class MascomDatabase : RoomDatabase() {
    abstract fun bagDao(): BagDao
    abstract fun productDao(): ProductDao
}
