package com.mascom.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mascom.app.core.prefs.SettingsStore
import com.mascom.app.core.prefs.ThemeMode
import com.mascom.app.domain.model.User
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.domain.repository.BagRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

/** App-wide state the shell needs: who is signed in, the theme, the bag badge and first-run state. */
@HiltViewModel
class AppViewModel @Inject constructor(
    auth: AuthRepository,
    bag: BagRepository,
    private val settings: SettingsStore,
) : ViewModel() {
    val user: StateFlow<User?> = auth.user

    val themeMode: StateFlow<ThemeMode> =
        settings.themeMode.stateIn(viewModelScope, SharingStarted.Eagerly, ThemeMode.System)

    val bagCount: StateFlow<Int> = bag.lines
        .map { lines -> lines.sumOf { it.quantity } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), 0)

    /** Null until read from disk; the splash screen stays up until then. */
    val welcomeSeen: StateFlow<Boolean?> =
        settings.welcomeSeen.stateIn(viewModelScope, SharingStarted.Eagerly, null)

    fun markWelcomeSeen() {
        viewModelScope.launch { settings.setWelcomeSeen() }
    }
}
