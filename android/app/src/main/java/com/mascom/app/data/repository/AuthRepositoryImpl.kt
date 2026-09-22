package com.mascom.app.data.repository

import android.net.Uri
import com.mascom.app.core.network.ApiException
import com.mascom.app.core.network.SessionCookieJar
import com.mascom.app.core.network.apiCall
import com.mascom.app.core.prefs.SettingsStore
import com.mascom.app.data.media.Uploader
import com.mascom.app.data.remote.MascomApi
import com.mascom.app.data.remote.dto.MeDto
import com.mascom.app.data.remote.dto.ProfileUpdateRequest
import com.mascom.app.data.remote.dto.SignInRequest
import com.mascom.app.data.remote.dto.SignUpRequest
import com.mascom.app.domain.model.NewAccount
import com.mascom.app.domain.model.ProfileEdit
import com.mascom.app.domain.model.User
import com.mascom.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: MascomApi,
    private val cookies: SessionCookieJar,
    private val settings: SettingsStore,
    private val uploader: Uploader,
    private val json: Json,
) : AuthRepository {

    private val _user = MutableStateFlow<User?>(null)
    override val user: StateFlow<User?> = _user.asStateFlow()

    /** Shows the last known user straight away so the app opens signed in, even offline. */
    suspend fun restoreCachedUser() {
        if (cookies.session.value == null) return
        val cached = settings.cachedUser.first() ?: return
        _user.value = runCatching { json.decodeFromString<MeDto>(cached).toDomain() }.getOrNull()
    }

    override suspend fun refresh(): Result<User?> {
        if (cookies.session.value == null) {
            _user.value = null
            return Result.success(null)
        }
        return apiCall(json) { api.me().user }
            .map { me -> store(me) }
            .onFailure { if ((it as? ApiException)?.isUnauthorized == true) signOutLocally() }
    }

    override suspend fun signIn(email: String, password: String): Result<User> = apiCall(json) {
        api.signIn(SignInRequest(email.trim().lowercase(), password))
        loadMe()
    }

    override suspend fun signUp(account: NewAccount): Result<User> = apiCall(json) {
        api.signUp(
            SignUpRequest(
                name = account.name.trim(),
                email = account.email.trim().lowercase(),
                password = account.password,
                rollNo = account.rollNo.trim().ifEmpty { null },
                section = account.section.trim().ifEmpty { null },
                phone = account.phone.trim().ifEmpty { null },
            ),
        )
        loadMe()
    }

    override suspend fun updateProfile(edit: ProfileEdit): Result<User> = apiCall(json) {
        api.updateMe(
            ProfileUpdateRequest(
                name = edit.name.trim(),
                phone = edit.phone.trim(),
                rollNo = edit.rollNo.trim(),
                section = edit.section.trim(),
                hostel = edit.hostel.trim(),
                block = edit.block.trim(),
                roomNo = edit.roomNo.trim(),
                gender = edit.gender,
            ),
        )
        loadMe()
    }

    override suspend fun updateAvatar(image: Uri): Result<User> {
        val url = uploader.upload(image, kind = "avatar").getOrElse { return Result.failure(it) }
        return apiCall(json) {
            api.updateMe(ProfileUpdateRequest(profilePicUrl = url))
            loadMe()
        }
    }

    override suspend fun signOut() {
        runCatching { api.signOut() }
        signOutLocally()
    }

    private suspend fun loadMe(): User =
        store(api.me().user) ?: throw ApiException("Signed in, but the session didn't stick. Try again.")

    private suspend fun store(me: MeDto?): User? {
        val domain = me?.toDomain()
        _user.value = domain
        settings.setCachedUser(me?.let { json.encodeToString(MeDto.serializer(), it) })
        return domain
    }

    private suspend fun signOutLocally() {
        cookies.clear()
        _user.value = null
        settings.setCachedUser(null)
    }
}
