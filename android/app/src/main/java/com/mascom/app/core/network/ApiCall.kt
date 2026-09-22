package com.mascom.app.core.network

import kotlinx.coroutines.CancellationException
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import java.io.IOException

/** A failure the UI can show as-is. [code] is the HTTP status, or null for network trouble. */
class ApiException(message: String, val code: Int? = null) : Exception(message) {
    val isUnauthorized get() = code == 401
}

@Serializable
private data class ErrorBody(val error: String? = null, val issues: List<Issue> = emptyList()) {
    @Serializable
    data class Issue(val path: String = "", val message: String = "")
}

/** Runs an API call and folds every failure into an [ApiException] with a readable message. */
suspend fun <T> apiCall(json: Json, block: suspend () -> T): Result<T> = try {
    Result.success(block())
} catch (e: CancellationException) {
    throw e
} catch (e: HttpException) {
    Result.failure(e.toApiException(json))
} catch (e: IOException) {
    Result.failure(ApiException("Can't reach the server. Check your connection and try again."))
} catch (e: ApiException) {
    Result.failure(e)
} catch (e: Exception) {
    Result.failure(ApiException(e.message ?: "Something went wrong."))
}

private fun HttpException.toApiException(json: Json): ApiException {
    val raw = response()?.errorBody()?.string()
    val body = raw?.let { runCatching { json.decodeFromString<ErrorBody>(it) }.getOrNull() }
    val message = body?.issues?.firstOrNull()?.message?.takeIf { it.isNotBlank() }
        ?: body?.error
        ?: when (code()) {
            401 -> "Please sign in to continue."
            403 -> "You don't have access to this."
            404 -> "That couldn't be found."
            else -> "Something went wrong (${code()})."
        }
    return ApiException(message, code())
}
