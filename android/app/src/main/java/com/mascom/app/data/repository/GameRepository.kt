package com.mascom.app.data.repository

import com.mascom.app.core.network.apiCall
import com.mascom.app.data.remote.GameApi
import com.mascom.app.data.remote.dto.CrewActionRequest
import com.mascom.app.data.remote.dto.CrewLeaderboardDto
import com.mascom.app.data.remote.dto.CrewStateDto
import com.mascom.app.data.remote.dto.EncounterDto
import com.mascom.app.data.remote.dto.EscapeRequest
import com.mascom.app.data.remote.dto.FriendActionRequest
import com.mascom.app.data.remote.dto.FriendsDto
import com.mascom.app.data.remote.dto.GameHomeDto
import com.mascom.app.data.remote.dto.GameProfileDto
import com.mascom.app.data.remote.dto.GameSettingsRequest
import com.mascom.app.data.remote.dto.JoinGameRequest
import com.mascom.app.data.remote.dto.LeaderboardDto
import com.mascom.app.data.remote.dto.OpenDoorRequest
import com.mascom.app.data.remote.dto.RaidDto
import com.mascom.app.data.remote.dto.SetAlarmRequest
import com.mascom.app.data.remote.dto.StartRaidRequest
import com.mascom.app.data.remote.dto.VaultDto
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Campus Heist, which is server-authoritative: the app never decides an outcome, it only says what
 * the player did and draws what comes back. There is no domain mapping layer here because the
 * replies are already the view's shape — the rules live on the server, not in these types.
 */
@Singleton
class GameRepository @Inject constructor(
    private val api: GameApi,
    private val json: Json,
) {
    suspend fun home(): Result<GameHomeDto> = apiCall(json) { api.home() }

    suspend fun join(alias: String, cohort: String, socialOptIn: Boolean): Result<GameProfileDto> =
        apiCall(json) { api.join(JoinGameRequest(alias.trim(), cohort, socialOptIn)) }

    suspend fun updateSettings(
        alias: String? = null,
        cohort: String? = null,
        socialOptIn: Boolean? = null,
    ): Result<GameProfileDto> = apiCall(json) { api.updateSettings(GameSettingsRequest(alias, cohort, socialOptIn)) }

    /**
     * [idempotencyKey] is kept by the caller across retries, so a flaky connection can't spend two
     * of the day's attempts on one tap.
     */
    suspend fun startRaid(mode: String, targetId: String? = null, idempotencyKey: String): Result<RaidDto> =
        apiCall(json) { api.startRaid(StartRaidRequest(mode, targetId, idempotencyKey)).raid }

    suspend fun raid(id: String): Result<RaidDto> = apiCall(json) { api.raid(id).raid }

    suspend fun openDoor(id: String, door: Int, version: Int): Result<RaidDto> =
        apiCall(json) { api.openDoor(id, OpenDoorRequest(door, version)).raid }

    suspend fun escape(id: String, version: Int): Result<RaidDto> =
        apiCall(json) { api.escape(id, EscapeRequest(version)).raid }

    suspend fun leaderboard(scope: String): Result<LeaderboardDto> = apiCall(json) { api.leaderboard(scope) }

    suspend fun vault(): Result<VaultDto> = apiCall(json) { api.vault() }

    suspend fun setAlarm(slot: Int): Result<VaultDto> = apiCall(json) { api.setAlarm(SetAlarmRequest(slot)) }

    suspend fun friends(query: String? = null): Result<FriendsDto> =
        apiCall(json) { api.friends(query?.trim()?.takeIf { it.length >= 2 }) }

    suspend fun friendAction(action: String, userId: String): Result<Unit> =
        apiCall(json) { api.friendAction(FriendActionRequest(action, userId)) }.map { }

    suspend fun encounters(): Result<List<EncounterDto>> = apiCall(json) { api.encounters().encounters }

    suspend fun crew(): Result<CrewStateDto> = apiCall(json) { api.crew() }

    suspend fun createCrew(name: String): Result<Unit> =
        apiCall(json) { api.crewAction(CrewActionRequest("create", name = name.trim())) }.map { }

    suspend fun joinCrew(code: String): Result<Unit> =
        apiCall(json) { api.crewAction(CrewActionRequest("join", code = code.trim().uppercase())) }.map { }

    suspend fun leaveCrew(): Result<Unit> = apiCall(json) { api.crewAction(CrewActionRequest("leave")) }.map { }

    suspend fun crewLeaderboard(): Result<CrewLeaderboardDto> = apiCall(json) { api.crewLeaderboard() }
}
