package com.mascom.app

import android.app.Application
import coil3.ImageLoader
import coil3.PlatformContext
import coil3.SingletonImageLoader
import coil3.network.okhttp.OkHttpNetworkFetcherFactory
import coil3.request.crossfade
import com.mascom.app.core.network.ServerConfig
import com.mascom.app.core.network.SessionCookieJar
import com.mascom.app.core.prefs.SettingsStore
import com.mascom.app.data.repository.AuthRepositoryImpl
import com.mascom.app.di.ApplicationScope
import com.mascom.app.push.PushRegistrar
import dagger.Lazy
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import javax.inject.Inject

@HiltAndroidApp
class MascomApp : Application(), SingletonImageLoader.Factory {

    @Inject lateinit var settings: SettingsStore
    @Inject lateinit var serverConfig: ServerConfig
    @Inject lateinit var cookies: SessionCookieJar
    @Inject lateinit var auth: AuthRepositoryImpl
    @Inject lateinit var okHttp: Lazy<OkHttpClient>
    @Inject lateinit var push: PushRegistrar
    @Inject @ApplicationScope lateinit var scope: CoroutineScope

    override fun onCreate() {
        super.onCreate()
        // A tiny, one-off read: every request needs the server and session, so settle them first.
        runBlocking {
            serverConfig.update(settings.baseUrl.first())
            cookies.restore(settings.session())
            auth.restoreCachedUser()
        }
        scope.launch { settings.baseUrl.collect(serverConfig::update) }
        scope.launch { auth.refresh() }
        push.register()
    }

    /** Coil shares the app's OkHttp client so images behind the session (like the UPI QR) load too. */
    override fun newImageLoader(context: PlatformContext): ImageLoader =
        ImageLoader.Builder(context)
            .components { add(OkHttpNetworkFetcherFactory(callFactory = { okHttp.get() })) }
            .crossfade(true)
            .build()
}
