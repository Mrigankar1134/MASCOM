package com.mascom.app.core.network

import com.mascom.app.BuildConfig
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Holds the server the app talks to. Retrofit is built once against a placeholder host, and
 * [BaseUrlInterceptor] swaps in whatever is set here, so the server can change at runtime.
 */
@Singleton
class ServerConfig @Inject constructor() {
    @Volatile
    var baseUrl: HttpUrl = BuildConfig.DEFAULT_BASE_URL.toHttpUrl()
        private set

    fun update(url: String) {
        normalize(url)?.let { baseUrl = it }
    }

    /** Turns a server-relative path such as `/uploads/x.jpg` into a full URL. Absolute URLs pass through. */
    fun resolve(path: String?): String? {
        if (path.isNullOrBlank()) return null
        if (path.startsWith("http://") || path.startsWith("https://")) return path
        return baseUrl.resolve(path.trimStart('/'))?.toString()
    }

    companion object {
        const val PLACEHOLDER_HOST = "mascom.invalid"
        const val PLACEHOLDER_URL = "http://$PLACEHOLDER_HOST/"

        /** Accepts `mascom.in`, `https://mascom.in` or `http://192.168.1.4:3000` and returns a URL ending in `/`. */
        fun normalize(raw: String): HttpUrl? {
            val trimmed = raw.trim().let { if ("://" in it) it else "https://$it" }
            val url = trimmed.toHttpUrlOrNull() ?: return null
            return if (url.encodedPath.endsWith("/")) url else url.newBuilder().addPathSegment("").build()
        }
    }
}
