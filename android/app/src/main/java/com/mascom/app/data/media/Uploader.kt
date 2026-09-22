package com.mascom.app.data.media

import android.net.Uri
import com.mascom.app.core.network.apiCall
import com.mascom.app.data.remote.MascomApi
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject

/** Posts an image to `/api/uploads` and returns the server path it was stored at. */
class Uploader @Inject constructor(
    private val api: MascomApi,
    private val compressor: ImageCompressor,
    private val json: Json,
) {
    suspend fun upload(image: Uri, kind: String): Result<String> = apiCall(json) {
        val bytes = compressor.compress(image)
        // The server checks the part's content type, not the file name.
        val part = MultipartBody.Part.createFormData(
            "file",
            "$kind-${System.currentTimeMillis()}.jpg",
            bytes.toRequestBody("image/jpeg".toMediaType()),
        )
        api.upload(part, kind.toRequestBody("text/plain".toMediaType())).url
    }
}
