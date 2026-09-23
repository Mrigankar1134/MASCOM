package com.mascom.app.data.remote

import com.mascom.app.data.remote.dto.CrewActionRequest
import com.mascom.app.data.remote.dto.CrewLeaderboardDto
import com.mascom.app.data.remote.dto.CrewStateDto
import com.mascom.app.data.remote.dto.EncountersDto
import com.mascom.app.data.remote.dto.EscapeRequest
import com.mascom.app.data.remote.dto.FriendActionRequest
import com.mascom.app.data.remote.dto.FriendsDto
import com.mascom.app.data.remote.dto.GameHomeDto
import com.mascom.app.data.remote.dto.GameProfileDto
import com.mascom.app.data.remote.dto.GameSettingsRequest
import com.mascom.app.data.remote.dto.JoinGameRequest
import com.mascom.app.data.remote.dto.LeaderboardDto
import com.mascom.app.data.remote.dto.OpenDoorRequest
import com.mascom.app.data.remote.dto.RaidEnvelope
import com.mascom.app.data.remote.dto.SetAlarmRequest
import com.mascom.app.data.remote.dto.StartRaidRequest
import com.mascom.app.data.remote.dto.VaultDto
import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/** Campus Heist routes, under the site's /api/game path. The server owns every outcome. */
interface GameApi {

    @GET("api/game/me")
    suspend fun home(): GameHomeDto

    @POST("api/game/join")
    suspend fun join(@Body body: JoinGameRequest): GameProfileDto

    @PATCH("api/game/join")
    suspend fun updateSettings(@Body body: GameSettingsRequest): GameProfileDto

    @POST("api/game/raids")
    suspend fun startRaid(@Body body: StartRaidRequest): RaidEnvelope

    @GET("api/game/raids/{id}")
    suspend fun raid(@Path("id") id: String): RaidEnvelope

    @POST("api/game/raids/{id}/open")
    suspend fun openDoor(@Path("id") id: String, @Body body: OpenDoorRequest): RaidEnvelope

    @POST("api/game/raids/{id}/escape")
    suspend fun escape(@Path("id") id: String, @Body body: EscapeRequest): RaidEnvelope

    @GET("api/game/leaderboard")
    suspend fun leaderboard(@Query("scope") scope: String): LeaderboardDto

    @GET("api/game/vault")
    suspend fun vault(): VaultDto

    @PUT("api/game/vault")
    suspend fun setAlarm(@Body body: SetAlarmRequest): VaultDto

    @GET("api/game/friends")
    suspend fun friends(@Query("q") query: String? = null): FriendsDto

    @POST("api/game/friends")
    suspend fun friendAction(@Body body: FriendActionRequest): JsonObject

    @GET("api/game/encounters")
    suspend fun encounters(): EncountersDto

    @GET("api/game/crew")
    suspend fun crew(): CrewStateDto

    @POST("api/game/crew")
    suspend fun crewAction(@Body body: CrewActionRequest): JsonObject

    @GET("api/game/crew/leaderboard")
    suspend fun crewLeaderboard(): CrewLeaderboardDto
}
