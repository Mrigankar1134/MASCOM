package com.mascom.app.core.network

import com.mascom.app.core.prefs.SettingsStore
import com.mascom.app.core.prefs.StoredSession
import com.mascom.app.di.ApplicationScope
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import javax.inject.Inject
import javax.inject.Singleton

/**
 * The server authenticates with an httpOnly `mascom_session` cookie and never returns the token
 * in a body, so the cookie is the session. It is held in memory for OkHttp and persisted to DataStore.
 */
@Singleton
class SessionCookieJar @Inject constructor(
    private val settings: SettingsStore,
    private val config: ServerConfig,
    @param:ApplicationScope private val scope: CoroutineScope,
) : CookieJar {

    private val _session = MutableStateFlow<StoredSession?>(null)
    val session: StateFlow<StoredSession?> = _session.asStateFlow()

    /** Called once at start-up, before the first request. */
    fun restore(stored: StoredSession?) {
        _session.value = stored?.takeIf { it.expiresAt > System.currentTimeMillis() }
    }

    fun clear() = persist(null)

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val cookie = cookies.lastOrNull { it.name == COOKIE_NAME } ?: return
        val expired = cookie.value.isEmpty() || cookie.expiresAt <= System.currentTimeMillis()
        persist(if (expired) null else StoredSession(cookie.value, cookie.expiresAt))
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val current = _session.value ?: return emptyList()
        if (current.expiresAt <= System.currentTimeMillis()) return emptyList()
        // Only hand the session to our own server, never to third-party image hosts.
        if (url.host != config.baseUrl.host) return emptyList()
        return listOf(
            Cookie.Builder().name(COOKIE_NAME).value(current.token).hostOnlyDomain(url.host).path("/").build(),
        )
    }

    private fun persist(value: StoredSession?) {
        _session.value = value
        scope.launch { settings.setSession(value) }
    }

    companion object {
        const val COOKIE_NAME = "mascom_session"
    }
}
