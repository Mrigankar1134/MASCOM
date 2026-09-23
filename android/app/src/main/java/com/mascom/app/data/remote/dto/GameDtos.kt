package com.mascom.app.data.remote.dto

import kotlinx.serialization.Serializable

// Campus Heist wire shapes, mirroring src/app/api/game/** on the server. The server already
// sends view-shaped data (it decides every outcome), so the game feature uses these directly
// rather than mapping them through a second set of models.

@Serializable
data class GameHomeDto(
    val joined: Boolean = false,
    val cohorts: List<String> = emptyList(),
    val suggestedAlias: String = "",
    val profile: GameProfileDto? = null,
    val attempts: AttemptsDto = AttemptsDto(),
    val week: WeekDto = WeekDto(),
    val activeRaid: RaidDto? = null,
    val vault: VaultDto = VaultDto(),
    val event: EventDto = EventDto(),
    val encounters: List<EncounterDto> = emptyList(),
    val rules: RulesDto = RulesDto(),
)

@Serializable
data class GameProfileDto(
    val alias: String = "",
    val cohort: String = "",
    val socialOptIn: Boolean = true,
    val stash: Int = 0,
    val reserved: Int = 0,
)

@Serializable
data class AttemptsDto(
    val ranked: Int = 0,
    val social: Int = 0,
    val exposureLeft: Int = 0,
    val eventUsed: Int = 0,
)

@Serializable
data class WeekDto(
    val id: String = "",
    val points: Int = 0,
    val rank: Int = 0,
    val attempts: Int = 0,
    val top: List<LeaderRowDto> = emptyList(),
)

@Serializable
data class RulesDto(
    val first: Int = 80,
    val second: Int = 180,
    val rankedPerDay: Int = 3,
    val socialPerDay: Int = 3,
    val exposureCap: Int = 120,
    val weeklyStash: Int = 300,
)

@Serializable
data class VaultDto(val alarmSlot: Int? = null, val lockedForToday: Boolean = false)

@Serializable
data class EventDto(
    val id: String = "",
    val open: Boolean = false,
    val startsAt: String = "",
    val crewSize: Int = 3,
    val maxScore: Int = 540,
    val crew: CrewBriefDto? = null,
)

@Serializable
data class CrewBriefDto(val id: String = "", val name: String = "", val code: String = "", val size: Int = 0)

/** A raid as the attacker is allowed to see it: opened doors only, never the hidden layout. */
@Serializable
data class RaidDto(
    val id: String,
    val mode: String = "ranked",
    val phase: String = "active",
    val doors: List<String> = emptyList(),
    val provisional: Int = 0,
    val rewardCap: Int? = null,
    val outcome: String? = null,
    val settledAmount: Int? = null,
    val nominalAmount: Int? = null,
    val version: Int = 0,
    val expiresAt: String = "",
    val target: TargetDto? = null,
)

@Serializable
data class TargetDto(val alias: String = "", val cohort: String = "")

@Serializable
data class RaidEnvelope(val raid: RaidDto)

@Serializable
data class LeaderRowDto(
    val userId: String = "",
    val alias: String = "",
    val cohort: String = "",
    val points: Int = 0,
    val attempts: Int = 0,
    val rank: Int = 0,
    val isMe: Boolean = false,
)

@Serializable
data class LeaderboardDto(
    val week: String = "",
    val scope: String = "campus",
    val rows: List<LeaderRowDto> = emptyList(),
    val me: LeaderRowDto? = null,
)

@Serializable
data class FriendDto(
    val userId: String = "",
    val alias: String = "",
    val cohort: String = "",
    val joined: Boolean = false,
    val optedIn: Boolean = false,
    val exposure: Int = 0,
    val raidable: Boolean = false,
    val reason: String? = null,
)

@Serializable
data class FriendsDto(
    val friends: List<FriendDto> = emptyList(),
    val incoming: List<FriendDto> = emptyList(),
    val outgoing: List<FriendDto> = emptyList(),
    val results: List<FriendDto> = emptyList(),
)

@Serializable
data class EncounterDto(
    val id: String = "",
    val raided: Boolean = false,
    val otherAlias: String = "",
    val amount: Int = 0,
    val outcome: String = "",
    val at: String = "",
)

@Serializable
data class EncountersDto(val encounters: List<EncounterDto> = emptyList())

@Serializable
data class CrewMemberDto(val userId: String = "", val alias: String = "", val cohort: String = "", val score: Int? = null)

@Serializable
data class CrewDto(
    val id: String = "",
    val name: String = "",
    val code: String = "",
    val captainId: String = "",
    val members: List<CrewMemberDto> = emptyList(),
    val score: Int = 0,
    val complete: Boolean = false,
)

@Serializable
data class CrewStateDto(val event: EventDto = EventDto(), val crew: CrewDto? = null)

@Serializable
data class CrewRowDto(
    val id: String = "",
    val name: String = "",
    val members: Int = 0,
    val score: Int = 0,
    val rank: Int = 0,
    val isMine: Boolean = false,
)

@Serializable
data class CrewLeaderboardDto(val event: String = "", val maxScore: Int = 540, val rows: List<CrewRowDto> = emptyList())

// ---- Requests ---------------------------------------------------------------------------------

@Serializable
data class JoinGameRequest(val alias: String, val cohort: String, val socialOptIn: Boolean = true)

@Serializable
data class GameSettingsRequest(val alias: String? = null, val cohort: String? = null, val socialOptIn: Boolean? = null)

@Serializable
data class StartRaidRequest(val mode: String, val targetId: String? = null, val idempotencyKey: String? = null)

@Serializable
data class OpenDoorRequest(val door: Int, val version: Int? = null)

@Serializable
data class EscapeRequest(val version: Int? = null)

@Serializable
data class SetAlarmRequest(val alarmSlot: Int)

@Serializable
data class FriendActionRequest(val action: String, val userId: String)

@Serializable
data class CrewActionRequest(val action: String, val name: String? = null, val code: String? = null)
