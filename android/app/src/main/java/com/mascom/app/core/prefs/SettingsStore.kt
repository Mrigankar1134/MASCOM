package com.mascom.app.core.prefs

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mascom.app.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.settings: DataStore<Preferences> by preferencesDataStore(name = "mascom_settings")

enum class ThemeMode { System, Light, Dark }

/** The session cookie the server hands out, kept so the user stays signed in across launches. */
data class StoredSession(val token: String, val expiresAt: Long)

@Singleton
class SettingsStore @Inject constructor(@ApplicationContext context: Context) {
    private val store = context.settings

    val baseUrl: Flow<String> = store.data.map { it[BASE_URL] ?: BuildConfig.DEFAULT_BASE_URL }
    val themeMode: Flow<ThemeMode> = store.data.map { prefs ->
        prefs[THEME]?.let { name -> ThemeMode.entries.firstOrNull { it.name == name } } ?: ThemeMode.System
    }
    val cachedUser: Flow<String?> = store.data.map { it[CACHED_USER] }
    val welcomeSeen: Flow<Boolean> = store.data.map { it[WELCOME_SEEN] ?: false }

    suspend fun setWelcomeSeen() {
        store.edit { it[WELCOME_SEEN] = true }
    }

    suspend fun session(): StoredSession? {
        val prefs = store.data.first()
        val token = prefs[SESSION_TOKEN] ?: return null
        return StoredSession(token, prefs[SESSION_EXPIRES] ?: Long.MAX_VALUE)
    }

    suspend fun setBaseUrl(url: String) {
        store.edit { it[BASE_URL] = url }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        store.edit { it[THEME] = mode.name }
    }

    suspend fun setSession(session: StoredSession?) {
        store.edit {
            if (session == null) {
                it.remove(SESSION_TOKEN)
                it.remove(SESSION_EXPIRES)
                it.remove(CACHED_USER)
            } else {
                it[SESSION_TOKEN] = session.token
                it[SESSION_EXPIRES] = session.expiresAt
            }
        }
    }

    suspend fun setCachedUser(json: String?) {
        store.edit { if (json == null) it.remove(CACHED_USER) else it[CACHED_USER] = json }
    }

    suspend fun setPushToken(token: String) {
        store.edit { it[PUSH_TOKEN] = token }
    }

    private companion object {
        val BASE_URL = stringPreferencesKey("base_url")
        val THEME = stringPreferencesKey("theme")
        val SESSION_TOKEN = stringPreferencesKey("session_token")
        val SESSION_EXPIRES = longPreferencesKey("session_expires")
        val CACHED_USER = stringPreferencesKey("cached_user")
        val PUSH_TOKEN = stringPreferencesKey("push_token")
        val WELCOME_SEEN = booleanPreferencesKey("welcome_seen")
    }
}
