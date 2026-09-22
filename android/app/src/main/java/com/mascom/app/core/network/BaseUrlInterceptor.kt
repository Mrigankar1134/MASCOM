package com.mascom.app.core.network

import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/** Points requests aimed at the placeholder host at the configured server. */
class BaseUrlInterceptor @Inject constructor(private val config: ServerConfig) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (request.url.host != ServerConfig.PLACEHOLDER_HOST) return chain.proceed(request)

        val relative = request.url.encodedPath.trimStart('/') +
            (request.url.encodedQuery?.let { "?$it" } ?: "")
        val target = config.baseUrl.resolve(relative) ?: return chain.proceed(request)
        return chain.proceed(request.newBuilder().url(target).build())
    }
}
