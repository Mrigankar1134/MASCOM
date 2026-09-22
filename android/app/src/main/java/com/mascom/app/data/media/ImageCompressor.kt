package com.mascom.app.data.media

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import kotlin.math.max

/**
 * Shrinks a picked image before upload, matching the web client: longest edge 1400px, JPEG at 82%.
 * Payment screenshots stay readable and well under the server's 5 MB cap.
 */
class ImageCompressor @Inject constructor(@param:ApplicationContext private val context: Context) {

    suspend fun compress(uri: Uri, maxEdge: Int = 1400, quality: Int = 82): ByteArray =
        withContext(Dispatchers.IO) {
            val resolver = context.contentResolver
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
            require(bounds.outWidth > 0 && bounds.outHeight > 0) { "That file doesn't look like an image." }

            var sample = 1
            while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxEdge) sample *= 2
            val decoded = resolver.openInputStream(uri)?.use {
                BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
            } ?: error("Couldn't read that image.")

            val rotation = resolver.openInputStream(uri)?.use {
                ExifInterface(it).rotationDegrees
            } ?: 0

            val scale = minOf(1f, maxEdge.toFloat() / max(decoded.width, decoded.height))
            val matrix = Matrix().apply {
                postScale(scale, scale)
                postRotate(rotation.toFloat())
            }
            val output = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)

            ByteArrayOutputStream().use { stream ->
                output.compress(Bitmap.CompressFormat.JPEG, quality, stream)
                if (output !== decoded) output.recycle()
                decoded.recycle()
                stream.toByteArray()
            }
        }
}
