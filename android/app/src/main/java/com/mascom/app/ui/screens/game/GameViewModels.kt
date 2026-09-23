package com.mascom.app.ui.screens.game

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.mascom.app.data.remote.dto.CrewLeaderboardDto
import com.mascom.app.data.remote.dto.CrewStateDto
import com.mascom.app.data.remote.dto.FriendsDto
import com.mascom.app.data.remote.dto.GameHomeDto
import com.mascom.app.data.remote.dto.LeaderboardDto
import com.mascom.app.data.remote.dto.RaidDto
import com.mascom.app.data.repository.GameRepository
import com.mascom.app.domain.model.User
import com.mascom.app.domain.repository.AuthRepository
import com.mascom.app.ui.navigation.RaidRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.distinctUntilChangedBy
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

// ---- Home ------------------------------------------------------------------------------------

data class HeistUiState(
    val user: User? = null,
    val home: GameHomeDto? = null,
    val loading: Boolean = true,
    val error: String? = null,
    /** A raid is being started or the alarm is being set: one action at a time. */
    val busy: Boolean = false,
    val message: String? = null,
    /** Set once a raid exists; the screen navigates to it and calls [raidOpened]. */
    val openRaid: String? = null,
)

@HiltViewModel
class HeistViewModel @Inject constructor(
    private val repo: GameRepository,
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(HeistUiState(user = auth.user.value))
    val state: StateFlow<HeistUiState> = _state.asStateFlow()

    /** Kept across retries so a repeated tap resumes the same raid instead of spending another try. */
    private var startKey: String? = null

    init {
        viewModelScope.launch {
            auth.user.distinctUntilChangedBy { it?.id }.collect { user ->
                _state.update { it.copy(user = user, home = if (user == null) null else it.home) }
                if (user != null) refresh() else _state.update { it.copy(loading = false) }
            }
        }
    }

    fun refresh() {
        if (_state.value.user == null) return
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            repo.home()
                .onSuccess { home -> _state.update { it.copy(home = home, loading = false, error = null) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message) } }
        }
    }

    fun join(alias: String, cohort: String, socialOptIn: Boolean) = act {
        repo.join(alias, cohort, socialOptIn).map { }
    }

    fun setAlarm(slot: Int) = act(success = "Alarm armed on door ${slot + 1}.") { repo.setAlarm(slot).map { } }

    fun toggleFriendRaids(on: Boolean) = act(
        success = if (on) "Friends can raid your stash." else "Friend raids turned off.",
    ) { repo.updateSettings(socialOptIn = on).map { } }

    fun startRanked() = startRaid("ranked")

    fun startEvent() = startRaid("event")

    private fun startRaid(mode: String) {
        if (_state.value.busy) return
        val key = startKey ?: UUID.randomUUID().toString().also { startKey = it }
        viewModelScope.launch {
            _state.update { it.copy(busy = true, error = null, message = null) }
            repo.startRaid(mode, idempotencyKey = key)
                .onSuccess { raid ->
                    startKey = null
                    _state.update { it.copy(busy = false, openRaid = raid.id) }
                }
                .onFailure { e -> _state.update { it.copy(busy = false, message = e.message) } }
        }
    }

    /** The home screen's own "resume" entry point, for a raid that was already under way. */
    fun resume(raid: RaidDto) = _state.update { it.copy(openRaid = raid.id) }

    fun raidOpened() = _state.update { it.copy(openRaid = null) }

    fun clearMessage() = _state.update { it.copy(message = null) }

    private fun act(success: String? = null, block: suspend () -> Result<Unit>) {
        if (_state.value.busy) return
        viewModelScope.launch {
            _state.update { it.copy(busy = true, message = null) }
            block()
                .onSuccess {
                    _state.update { it.copy(busy = false, message = success) }
                    refresh()
                }
                .onFailure { e -> _state.update { it.copy(busy = false, message = e.message) } }
        }
    }
}

// ---- One raid --------------------------------------------------------------------------------

data class RaidUiState(
    val raid: RaidDto? = null,
    val loading: Boolean = true,
    val busy: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

@HiltViewModel
class RaidViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: GameRepository,
) : ViewModel() {

    private val route = savedState.toRoute<RaidRoute>()
    private val _state = MutableStateFlow(RaidUiState())
    val state: StateFlow<RaidUiState> = _state.asStateFlow()

    init {
        reload()
    }

    /** Also how an expired raid is closed out: the GET settles it server-side and returns the result. */
    fun reload() {
        viewModelScope.launch {
            repo.raid(route.id)
                .onSuccess { raid -> _state.update { it.copy(raid = raid, loading = false, error = null) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message) } }
        }
    }

    fun open(door: Int) = step { raid -> repo.openDoor(raid.id, door, raid.version) }

    fun escape() = step { raid -> repo.escape(raid.id, raid.version) }

    /**
     * Every command carries the version the screen is showing, so a double tap or a stale retry is
     * rejected by the server rather than opening a second door.
     */
    private fun step(block: suspend (RaidDto) -> Result<RaidDto>) {
        val raid = _state.value.raid ?: return
        if (_state.value.busy || raid.phase == "settled") return
        viewModelScope.launch {
            _state.update { it.copy(busy = true, message = null) }
            block(raid)
                .onSuccess { next -> _state.update { it.copy(raid = next, busy = false) } }
                .onFailure { e -> _state.update { it.copy(busy = false, message = e.message) } }
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}

// ---- Friends ---------------------------------------------------------------------------------

data class FriendsUiState(
    val data: FriendsDto? = null,
    val loading: Boolean = true,
    val query: String = "",
    val error: String? = null,
    /** The player an action is running against, so only their row shows a spinner. */
    val busyWith: String? = null,
    val message: String? = null,
    val openRaid: String? = null,
)

@HiltViewModel
class FriendsViewModel @Inject constructor(private val repo: GameRepository) : ViewModel() {

    private val _state = MutableStateFlow(FriendsUiState())
    val state: StateFlow<FriendsUiState> = _state.asStateFlow()
    private val queries = MutableStateFlow("")
    private var startKey: String? = null

    @OptIn(FlowPreview::class)
    private fun watchQuery() = viewModelScope.launch {
        queries.debounce(300).distinctUntilChanged().collect { load(it) }
    }

    init {
        watchQuery()
        refresh()
    }

    fun refresh() = load(_state.value.query)

    fun search(text: String) {
        _state.update { it.copy(query = text) }
        queries.value = text
    }

    private fun load(query: String) {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.data == null, error = null) }
            repo.friends(query)
                .onSuccess { data -> _state.update { it.copy(data = data, loading = false) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message) } }
        }
    }

    fun request(userId: String) = act(userId, "Request sent.") { repo.friendAction("request", userId) }
    fun accept(userId: String) = act(userId, "You're friends now.") { repo.friendAction("accept", userId) }
    fun remove(userId: String) = act(userId, "Removed.") { repo.friendAction("remove", userId) }
    fun block(userId: String) = act(userId, "Blocked.") { repo.friendAction("block", userId) }

    fun raid(userId: String) {
        if (_state.value.busyWith != null) return
        val key = startKey ?: UUID.randomUUID().toString().also { startKey = it }
        viewModelScope.launch {
            _state.update { it.copy(busyWith = userId, message = null) }
            repo.startRaid("friend", targetId = userId, idempotencyKey = key)
                .onSuccess { raid ->
                    startKey = null
                    _state.update { it.copy(busyWith = null, openRaid = raid.id) }
                }
                .onFailure { e -> _state.update { it.copy(busyWith = null, message = e.message) } }
        }
    }

    fun raidOpened() = _state.update { it.copy(openRaid = null) }

    fun clearMessage() = _state.update { it.copy(message = null) }

    private fun act(userId: String, success: String, block: suspend () -> Result<Unit>) {
        if (_state.value.busyWith != null) return
        viewModelScope.launch {
            _state.update { it.copy(busyWith = userId, message = null) }
            block()
                .onSuccess {
                    _state.update { it.copy(busyWith = null, message = success) }
                    refresh()
                }
                .onFailure { e -> _state.update { it.copy(busyWith = null, message = e.message) } }
        }
    }
}

// ---- Rankings --------------------------------------------------------------------------------

enum class LeaderboardScope(val wire: String, val label: String) {
    Campus("campus", "Campus"),
    Cohort("cohort", "My cohort"),
    Friends("friends", "Friends"),
}

data class RankingsUiState(
    val scope: LeaderboardScope = LeaderboardScope.Campus,
    val board: LeaderboardDto? = null,
    val loading: Boolean = true,
    val error: String? = null,
)

@HiltViewModel
class RankingsViewModel @Inject constructor(private val repo: GameRepository) : ViewModel() {

    private val _state = MutableStateFlow(RankingsUiState())
    val state: StateFlow<RankingsUiState> = _state.asStateFlow()

    init {
        load(LeaderboardScope.Campus)
    }

    fun select(scope: LeaderboardScope) {
        if (scope == _state.value.scope && _state.value.board != null) return
        load(scope)
    }

    private fun load(scope: LeaderboardScope) {
        viewModelScope.launch {
            _state.update { it.copy(scope = scope, loading = true, error = null, board = null) }
            repo.leaderboard(scope.wire)
                .onSuccess { board -> _state.update { it.copy(board = board, loading = false) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message) } }
        }
    }
}

// ---- Crew and the Friday event ---------------------------------------------------------------

data class CrewUiState(
    val crew: CrewStateDto? = null,
    val board: CrewLeaderboardDto? = null,
    val loading: Boolean = true,
    val busy: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val openRaid: String? = null,
)

@HiltViewModel
class CrewViewModel @Inject constructor(private val repo: GameRepository) : ViewModel() {

    private val _state = MutableStateFlow(CrewUiState())
    val state: StateFlow<CrewUiState> = _state.asStateFlow()
    private var startKey: String? = null

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = it.crew == null, error = null) }
            repo.crew()
                .onSuccess { crew -> _state.update { it.copy(crew = crew, loading = false) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message) } }
            repo.crewLeaderboard().onSuccess { board -> _state.update { it.copy(board = board) } }
        }
    }

    fun create(name: String) = act("Crew created.") { repo.createCrew(name) }
    fun join(code: String) = act("You're in.") { repo.joinCrew(code) }
    fun leave() = act("You left the crew.") { repo.leaveCrew() }

    fun startEventRaid() {
        if (_state.value.busy) return
        val key = startKey ?: UUID.randomUUID().toString().also { startKey = it }
        viewModelScope.launch {
            _state.update { it.copy(busy = true, message = null) }
            repo.startRaid("event", idempotencyKey = key)
                .onSuccess { raid ->
                    startKey = null
                    _state.update { it.copy(busy = false, openRaid = raid.id) }
                }
                .onFailure { e -> _state.update { it.copy(busy = false, message = e.message) } }
        }
    }

    fun raidOpened() = _state.update { it.copy(openRaid = null) }

    fun clearMessage() = _state.update { it.copy(message = null) }

    private fun act(success: String, block: suspend () -> Result<Unit>) {
        if (_state.value.busy) return
        viewModelScope.launch {
            _state.update { it.copy(busy = true, message = null) }
            block()
                .onSuccess {
                    _state.update { it.copy(busy = false, message = success) }
                    refresh()
                }
                .onFailure { e -> _state.update { it.copy(busy = false, message = e.message) } }
        }
    }
}
