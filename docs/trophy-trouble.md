# Trophy Trouble — design and development blueprint

**Status:** design only. Nothing in this document has been built or measured. Every number marked
*(proposed)* is a starting value for the prototype, not a requirement — it exists to be tuned or
thrown away once the thing is playable. Numbers marked **(requirement)** are rules the game does not
work without.

**Date:** 23 September 2026. Engine and licensing facts in §9 were checked against official vendor
pages on that date; each carries its source and the date of the source.

---

## 1. The pitch

Four students. One trophy. Two minutes.

**Grab the trophy, escape your friends, and steal it back when they catch you.**

You score only while you are holding it. The moment it leaves your hands — dropped, thrown, or
knocked loose by someone's dash — your clock stops and theirs starts. At the end of two minutes, the
highest total possession time wins.

It is a playground game: tag, but the tagged thing is worth points and you can throw it over a bench.
No weapons, no health, no elimination. You lose the trophy, you sprint back into the fight.

It sits next to Campus Heist in the app's Games tab: Campus Heist is a 20-second decision you make
between classes; Trophy Trouble is the two-minute match you play with three friends in the hostel
common room.

### What it is not

Not an open-world campus. Not a management or quiz game — the college being an MBA institute is
flavour only, and no gameplay involves forecasting, case studies, or anything academic. Not a
cohort-versus-cohort mode: cohort populations differ, so cohort is an identity shown on a profile,
never a source of power or a scoring bucket.

---

## 2. A complete example match

Four players — Riya, Arjun, Noor, Vikram — join a private room from the hostel common room. Riya
shares the room code; the other three tap Join and enter it. Everyone picks an outfit from the free
set. The lobby shows four ready ticks and loads the Hostel Courtyard.

**0:00 — countdown.** Three seconds. The four spawn at the four courtyard entrances, each roughly the
same distance from the centre. The trophy sits on a low plinth in the middle of the courtyard,
lit so it reads from every approach.

**0:03 — the scramble.** All four run at the centre. Arjun arrives a stride early and picks it up.
The HUD tells him *You have the trophy* and his possession clock starts. The other three see his name
under the carrier marker and a soft outline on him at range.

**0:06 — first chase.** Arjun runs for the canteen edge, where the tables give him corners to cut.
Noor takes the direct line behind him; Vikram, reading the route, peels off toward the far side of
the canteen to meet him coming out. Riya goes to the raised walkway, which overlooks the same exit.

**0:11 — the first steal.** Noor closes and dashes. She is inside the contact region and Arjun is not
protected, so the trophy transfers. Arjun's clock stops at eight seconds; Noor's starts. She gets a
1.2 s protection window and a short animation as she recovers the trophy; Arjun stumbles briefly and
cannot dash for 1.5 s, which stops him from instantly taking it back.

**0:14 — the throw.** Noor turns into the hostel corridor — fast, but a known trap, because it has
only two exits. Vikram is waiting at the far end. Instead of running into him, Noor throws the trophy
sideways over the corridor's low wall into the planted area, and vaults the wall after it. Her clock
stops the instant it leaves her hands. Vikram sprints around; Noor lands first and picks it up. She
has spent 1.4 seconds of possession to skip a certain interception.

**0:31 — a bad throw.** Cornered on the basketball court, Noor throws long towards the courtyard.
Riya, coming down the walkway steps, is closer to where it lands. Riya collects and the chase
reverses; Noor is now the pursuer.

**1:20 — the grind.** Possession has changed hands nine times. The standings strip shows Riya 34 s,
Noor 27 s, Arjun 21 s, Vikram 18 s. Vikram, last and knowing it, stops chasing the carrier directly
and camps the courtyard's narrow stair instead — the one route Riya keeps using.

**1:46 — the read pays.** Riya takes the stair. Vikram dashes from the blind side and takes it. He
holds for eleven seconds, which is the longest single possession of his match.

**1:57 — the final scramble.** The last five seconds are called out by an audible and visible
countdown. Arjun dashes at Vikram and misses; his 0.35 s recovery is enough for Vikram to get clear.

**2:00 — result.** Riya 41 s, Vikram 34 s, Noor 29 s, Arjun 26 s. The result screen shows each
player's placement, total possession, steals, and longest single hold. Riya's longest hold (13 s) is
a personal best and is marked. One button: **Rematch**. Three of them tap it before the screen
settles.

---

## 3. Core rules (final for the prototype)

1. **Four players, free-for-all.** No teams at launch. **(requirement)**
2. **Two-minute match.** Server-owned clock. **(requirement)**
3. **One trophy, one carrier.** Never two carriers, never two trophies. **(requirement)**
4. **Possession time is the only score.** It accrues while carried and stops the instant the trophy
   is thrown, dropped, or stolen. Airborne and grounded trophy time counts for nobody. **(requirement)**
5. **Only a dash steals.** Ordinary running contact never transfers possession. **(requirement)**
6. **The carrier is slower than pursuers** by a small margin — enough to be caught by a good line,
   not enough to make possession hopeless. **(requirement; margin is tunable)**
7. **A steal grants brief protection** to the new carrier, and briefly prevents the dispossessed
   player from dashing, so the trophy cannot ping-pong between two players. **(requirement)**
8. **Throwing never creates score,** and a thrower cannot instantly re-collect their own throw.
   **(requirement)**
9. **The trophy can always be reached.** If it leaves the playable space or becomes unreachable, it
   resets to a validated position with a visible, announced reset. **(requirement)**
10. **Ties share a placement.** Two players on the same rounded time both take that position, and the
    next position is skipped. No overtime in the first version. **(requirement)**
11. **Time is tracked precisely internally and displayed rounded.** Internal accumulation in
    milliseconds; the HUD and results show one decimal at most. **(requirement)**
12. **Cosmetics never change performance.** Every character has identical speed, dash, collision size,
    jump, and trophy behaviour. **(requirement)**

---

## 4. Controls and camera

### 4.1 Control layout

Left thumb, right thumb, nothing in the middle.

| Control | Placement | Behaviour |
|---|---|---|
| Movement stick | Bottom-left, floating (appears where the thumb lands within a generous zone) | 8-way analogue; deflection sets speed |
| Camera | Anywhere on the right half, drag | Relative drag rotates yaw and a limited pitch |
| Jump | Bottom-right, primary | Tap |
| Dash | Bottom-right, above jump, larger than jump | Tap; shows a radial cooldown |
| Throw | Replaces nothing — appears only while carrying, left of Jump | Tap to throw along camera aim; a short ground preview arc appears on touch-down and fires on release |

Sprint has **no button**. Pushing the stick past a deflection threshold *(proposed: 0.92 of full
travel, with 0.06 hysteresis so it does not flicker)* sprints. This is the first thing to test: if
players cannot reliably hold sprint on a phone without looking at their thumb, add a sprint toggle
and accept the extra button.

Vaulting is **automatic** over obstacles explicitly marked as vaultable *(proposed: up to 1.0 m high
and 0.6 m deep)*, triggered by running into them above a speed threshold. Sliding is deferred.

Left-handed mirroring, HUD scale, and a deadzone slider are accessibility settings, not launch
blockers — but mirroring is cheap and should be in the first build.

### 4.2 Camera

Third person, behind and slightly above, showing the character's back, their feet, and a useful
amount of ground ahead. *(Proposed starting rig: 3.6 m behind, 1.7 m above the character's root,
pitched down 10°, 55° vertical FOV.)*

| Situation | Behaviour |
|---|---|
| Running | Rig at rest values; follow damping ~0.12 s so the character leads slightly |
| Sprinting | Distance +0.5 m, FOV +6° over 0.4 s — speed reads without motion blur |
| Tight turns | Yaw follows with a soft lag and a small outward lean; never snaps |
| Jump / land | Vertical follow damped more heavily than horizontal (~0.25 s) so the view does not pogo; land adds a 3–4 cm dip, no shake |
| Dash | FOV +8° for the dash duration, distance −0.3 m, restored over 0.25 s. A brief, subtle radial vignette — no blur |
| Carrying | Distance +0.3 m and pitch +2° so more of the ground behind is visible; the carrier needs to see who is closing |
| Narrow corridor | Camera slides in to a floor of 1.8 m and raises pitch slightly; walls fade rather than clip |
| Close to a wall | Sphere-cast from character to camera; camera pulls to the contact point, returns over ~0.3 s once clear |
| Intercepted | On losing the trophy, the camera does **not** take control away; it holds the player's aim and only nudges pitch up to show the thief leaving |

**Assistance is gentle and never reverses the view.** Optional yaw assist recentres behind the
movement direction only when the player is not touching the camera, at a slow rate *(proposed: up to
60°/s, disabled entirely for 1.5 s after any camera touch)*. It is off during the protection window
after a steal, because that is exactly when an unexpected camera move would feel like being robbed
twice.

**Threat readability without wallhacks:** opponents within *(proposed)* 8 m who are behind the player
raise a small arc indicator at the screen edge, pointing at them, fading with distance. It shows
direction, not identity or exact position, and it does not appear through the outer boundary walls of
the arena. The carrier is always marked — on screen when visible, as an edge marker when not — because
everyone needs to know where the chase is.

Constrained areas are the camera's real test: the hostel corridor and the stair. Both are designed
wide enough for the camera floor distance *(corridor proposed at 4 m wide)*, and the corridor's inner
wall is low enough that the camera can ride above it rather than jamming.

---

## 5. Movement, dash, steal, throw

All values *(proposed)*, all to be re-derived from playtests. The rule they must collectively satisfy:
**a good pursuer with a good line catches a carrier who runs in a straight line; a carrier who uses
corners, shortcuts, and throws survives.**

### 5.1 Movement

| Property | Proposed | Notes |
|---|---|---|
| Walk speed | 2.6 m/s | stick below 0.6 |
| Run speed | 5.6 m/s | stick 0.6–0.92 |
| Sprint speed | 6.8 m/s | stick above threshold |
| Carrier penalty | −8% on all speeds (sprint 6.26 m/s) | the tuning dial that decides whether chases resolve |
| Ground acceleration | 0 → full in 0.18 s | responsive without ice |
| Deceleration | full → 0 in 0.12 s | |
| Turn rate | 540°/s walking, 300°/s sprinting | fast turns cost speed, which is what makes corners tactical |
| Jump | 1.1 m apex, ~0.45 s airborne | clears vaultables and the low planter walls |
| Air control | 35% of ground acceleration | enough to adjust, not enough to fly |
| Landing recovery | 0.12 s of reduced acceleration, no input lock | never take control away |
| Vault | 0.55 s, speed carried through at 80% | over marked low obstacles only |

Animation must match the ground: locomotion is speed-driven with foot planting, and no state may
translate the capsule faster than the legs are moving. Root motion is **not** used for locomotion
(too risky for prediction); it is used for the vault and the steal-loss stumble, both of which are
short and server-confirmed.

### 5.2 Dash

| Property | Proposed |
|---|---|
| Distance | 5.5 m |
| Duration | 0.30 s |
| Steal-active window | 0.06 s → 0.26 s of the dash |
| Cooldown (normal) | 3.5 s |
| Cooldown (after a successful steal) | 4.5 s |
| Miss recovery | 0.35 s of reduced speed and no turn assist |
| Direction | Locked at activation to the current movement direction (or camera forward when stationary) |

The dash is committed: you point it and you live with it. The miss recovery is the whole reason
dodging is a skill — it must be long enough for a carrier to gain a stride, short enough that the
player never feels the controls stopped responding. If testers describe a missed dash as "the game
froze," the penalty is wrong.

### 5.3 Stealing

- **Valid contact:** a capsule in front of the dasher's chest *(proposed radius 0.55 m, centred 0.4 m
  ahead, spanning 0.4–1.8 m in height)* overlapping the carrier's capsule at any point during the
  active window. The dasher must also be facing within ±70° of the carrier.
- **Not a steal:** running contact, a dash that lands outside the active window, or a dash into a
  protected carrier (the dasher bounces slightly and keeps their cooldown — a real cost for a
  mistimed attempt).
- **Simultaneous dashes:** the server resolves them in the order it can defend. Each dash carries a
  server-stamped start time; the earlier start wins the contest, and if the two are inside a small
  window *(proposed 40 ms)*, the winner is chosen by a seeded coin flip that both clients are told
  about explicitly ("Noor got there first"). The loser has their dash cooldown reduced to half as
  compensation. This is preferable to a hidden tiebreak that looks like a bug.
- **On transfer:** the thief receives possession instantly on the server; the trophy snaps to their
  carry socket with a short pickup flourish that does not stop movement. Both players feel it — the
  thief gets a rising sound, a gold burst and a short haptic tap; the loser gets a duller thud, a
  stumble, and a distinct haptic.
- **After transfer:** the new carrier keeps their velocity but is speed-ramped for 0.6 s so the steal
  does not launch them clear; the previous carrier stumbles for 0.35 s and cannot dash for 1.5 s.
- **Protection window:** *(proposed 1.2 s)* during which the new carrier cannot be stolen from. It is
  not invulnerability to contact, just to theft, and it is shown as a ring that visibly shrinks so
  pursuers can time their dash for the moment it ends. **Anti-exploit:** protection is granted only on
  a *steal*, never on a ground pickup, so a player cannot farm it by repeatedly throwing and
  collecting; and it ends immediately if the carrier throws.

### 5.4 Throwing

| Property | Proposed |
|---|---|
| Preparation | 0.25 s wind-up, movement continues at 80% speed |
| Range | ~12 m along camera aim |
| Arc | Fixed shallow lob, ~18° launch, 14 m/s initial |
| Aim | Camera forward, with a short ground-projected preview arc while the button is held |
| Wall contact | Stops dead and drops, no ricochet chains |
| Bounce | One bounce on ground at 35% energy, then settles |
| Pickup lockout — thrower | 0.7 s from release |
| Pickup lockout — everyone else | 0.25 s from release |
| Scoring | None while airborne or grounded **(requirement)** |
| Contested landing | First capsule to overlap the pickup radius after the lockout wins; exact same server tick → the player with less total possession this match wins, so the throw favours the underdog |
| Out of bounds | After 2 s unreachable or outside the boundary, resets to the nearest validated node with a countdown and a beacon everyone can see |

The 0.7 s self-lockout is the anti-exploit: throwing forward and running through it costs you more
possession time than simply running, unless the throw skipped an obstacle or an interception. That is
exactly the trade we want.

**No complicated aiming mode.** No slow-motion, no second stick, no drag-to-charge. Aim is where the
camera looks; range is fixed. A player who wants a short throw throws at the ground in front of them.

---

## 6. Arena: Hostel Courtyard

Scale is derived from traversal time, not from looking right in an editor.

- Corner-to-corner sprint *(target: 9–11 s)* → a playable envelope of roughly **60 m × 45 m**.
- The main chase loop *(target lap: 14–18 s at carrier speed)* → a loop of roughly 95–110 m.
- Central courtyard: **22 m × 18 m**, open, crossable in ~3 s.
- Hostel corridor: **4 m wide, 18 m long**, two exits.
- Raised walkway: **1.8 m** above ground, reached by a 6-step stair and a ramp at the far end.

### Zones and how they connect

1. **Central courtyard** — the trophy's spawn on a low plinth, four entrances, sightlines to
   everything. Where the opening scramble and most interceptions happen.
2. **Canteen edge** — shutters, tables, a serving counter. Broad corners, several vaultable benches.
   Good for a carrier who can cut tight; good for a pursuer who guesses which side they will exit.
3. **Hostel corridor** — the fast route between the courtyard and the recreation corner. Shorter than
   going around, but only two exits, so it is where confident carriers get punished.
4. **Raised walkway** — stair at one end, ramp at the other, overlooking the courtyard and the
   corridor's north exit. A player who takes the walkway trades ground speed for a view and a drop-in
   interception.
5. **Recreation corner** — the basketball half-court. Fully open. Nobody hides here; it is where a
   chase becomes a foot race, and where throws are most useful.

Every fast route has a counter: the corridor is countered from the walkway and its far exit; the
canteen cut-through is countered by the wide corner; the walkway drop-in is countered by the fact
that jumping down costs a landing recovery. No dead ends — every pocket has at least two ways out, and
any space a player could get stuck in is either opened or fenced during greybox. No rooftops, no
climbing, no interiors, no parkour in v1.

### Example chase

Noor picks up in the courtyard and breaks north-east toward the canteen. Vikram, directly behind her,
takes the inside line at the benches. Riya, at the walkway, does not chase — she runs the walkway to
its far ramp, which puts her at the corridor's north exit in about four seconds. Arjun loops wide
through the recreation corner to cover the open side.

Noor now has three bad options and one good one: the corridor is covered by Riya, the open court is
covered by Arjun, and turning back runs into Vikram. She vaults a canteen table — costing Vikram a
stride because he has to go around — throws the trophy across the low planter into the courtyard, and
takes the shortcut through the serving gap to meet it. She loses 1.5 s of possession and keeps the
trophy. If she had thrown a metre further, Arjun would have had it.

That is the loop the whole arena exists to produce: *every escape is available to someone else too.*

### Camping

Two things prevent a carrier hiding: the carrier is always marked for everyone, and there is no
enclosed space large enough to loiter in. If playtests show a corner where a carrier can survive more
than ~15 s without being pressured, the geometry changes — not the rules.

---

## 7. Art and animation direction

**Target look:** a believable contemporary Indian campus in warm late-afternoon light, at a fidelity a
mid-range Android phone can hold. Not photoreal, not stylised-toy. Realistic human proportions,
readable silhouettes.

**Environment:** painted plaster and concrete with honest wear — faded paint, water stains under
balconies, scuffed stair nosings. Metal railings, noticeboards with layered posters, benches, parked
bicycles and two stationary scooters, trees and planted beds, a canteen entrance with roll-down
shutters and steel tables. Clutter is deliberately kept off the running lines: decoration lives at
the edges, and anything within a metre of a chase route is either flat to the ground or has collision
simplified so it never snags a player.

**Lighting:** baked lightmaps for static geometry, a single dynamic directional light for characters
with a tight shadow cascade, and light probes for character shading. Warm key, cool sky fill, long
soft shadows. Restrained bloom, no heavy ambient occlusion passes, no screen-space reflections.

**Legibility rules that override art direction:**
- The trophy has a gold rim light and a small, constant ground indicator that is visible from any
  angle. It never disappears into the environment.
- The carrier gets a subtle coloured rim; each player has a fixed colour for the whole match, shown
  in the standings.
- Traversal edges — vaultable benches, the walkway lip, the stair — carry a consistent material
  treatment (a worn painted edge) that reads as "you can cross this."
- Nothing that is not traversable is given that treatment. Ever.

**Characters:** six to eight original students at launch, varied skin tones, hair and casual clothing —
kurta and jeans, hoodie, sports jersey, salwar, shirt-and-chinos. One shared skeleton, one shared
collision capsule, one shared animation set.

**Animation list:** idle (plus a fidget), walk, run, sprint, 90°/180° turns, jump start, airborne,
land (soft and hard), dash, vault, trophy pickup from ground, carry idle, carry run, throw wind-up
and release, possession-loss stumble, recovery, plus three short result-screen reactions (win,
mid-place, last).

**Transitions serve responsiveness:** input never waits for an animation to finish. Blend times are
short *(proposed 0.10–0.15 s)*, the dash and throw have no blend-in on their first frames, and any
animation longer than 0.35 s (vault, stumble) is interruptible by the next meaningful input. If a
choice arises between a beautiful transition and a responsive one, take the responsive one.

Prefer a solid blend tree and clean state transitions over procedural rigs, IK chains and ragdolls in
v1. All of that is a phase-5-or-later conversation.

---

## 8. Multiplayer architecture and failure handling

### 8.1 What the server owns

The server is the only authority on: the match clock; the trophy's existence, position, and owner;
whether a pickup is legal; whether a dash was eligible (cooldown) and whether it connected; the
protection window; every possession-time accumulation; and the final result. Clients own only their
own *intent*.

Clients simulate their own movement immediately (prediction) and reconcile when the server's
authoritative state disagrees. Other players are drawn from buffered snapshots with interpolation
*(proposed buffer: ~100 ms)*, which is what makes remote players look smooth at the cost of showing
them very slightly in the past. *(Proposed tick rates: 30 Hz simulation, 20 Hz snapshots — to be
measured on real connections, not assumed.)*

### 8.2 Disputed dash contacts, honestly

A dash contact is judged on the server using **lag compensation**: the server rewinds the other
players to roughly where the dashing client saw them *(clamped, proposed: at most 200 ms)* and tests
the overlap there. The consequence — and this is a design decision, not a bug — is that a carrier can
occasionally be stolen from a fraction of a second after they believe they rounded a corner. The
alternative (judging only on current server state) makes dashing feel broken for anyone not on the
fastest connection, which is worse for a campus Wi-Fi audience.

Two things make this acceptable: the clamp is small, and the loser is told what happened. "Noor's
dash connected" is better than the trophy silently changing hands.

**Networking does not remove delay.** It hides some of it, chooses where the remaining delay lands,
and makes the outcome consistent for everyone afterwards. Any claim stronger than that should be
distrusted.

### 8.3 Failure handling

| Event | Behaviour |
|---|---|
| Player disconnects **before** the countdown | Room returns to lobby; remaining players can start with bots or wait |
| Brief connection loss during play | Client keeps simulating locally for a grace period *(proposed 5 s)* while showing a reconnecting indicator; on return, the client snaps to server state. The character does **not** freeze in place for others — it continues its last input briefly, then stands still and remains stealable |
| Player fails to return within the grace period | Character is removed; their accumulated time stays on the board and is shown as "left" |
| **The carrier** disconnects | The trophy drops at their last validated position after a 1 s beat, with a clear "dropped" announcement. Their clock stops at the moment of the last confirmed server tick, not at the moment of the drop |
| A player reconnects | Rejoins the same match if it is still running, with their possession time intact; if the match ended, they get the result screen |
| Too few players in a public queue | After a short wait, offer: wait longer, start 1v1/1v2 with the players present, or play against clearly labelled practice bots. Never silently fill a "public" match with bots |
| Server interruption | Match is void; nothing is recorded; every player is told plainly and returned to the lobby. A void match must not create a rematch loop |
| Duplicate result submission | The server writes the result once, keyed by match ID; repeat submissions are accepted and ignored, returning the same stored result |

### 8.4 Bots

For prototyping, bots are honest opponents and are **always labelled as bots**, in the lobby, the HUD,
and the results. Minimum behaviour: navigate to the trophy; pursue the carrier along a navmesh path;
attempt an interception by pathing to a predicted future position rather than the carrier's current
one; dash when within range and the cooldown allows; when carrying, run away from the nearest pursuer
and use a throw when cornered.

Bots get the same speeds, the same dash, the same cooldowns, and the same information a player could
have — no knowledge of the carrier's position through walls beyond the marker every player sees, no
reaction times below a human floor *(proposed 200–300 ms)*. A bot that cheats teaches players the
wrong lessons about the game's rules.

### 8.5 Server hosting reality

Note for planning: Unity's own Multiplay Game Server Hosting was supported only through 31 March 2026,
with the software licensed to Rocket Science Group for continuity
(source: Unity docs, *Welcome to Multiplay*, checked 2026-09-23). So "first-party managed dedicated
servers from the engine vendor" is no longer the simple answer it was.

Recommended path:
1. **Prototype (phases 4–6):** Unity Relay + Lobby with one client acting as host-authority. Free tier
   covers a campus pilot comfortably — Relay's free allowance is the first 50 average monthly CCU and
   3 GiB per CCU of bandwidth; Lobby is 10 GiB/month per regional group
   (source: unity.com/products/gaming-services/pricing, checked 2026-09-23). Accept the known
   limitation: the host has a latency advantage and could in principle cheat. Acceptable for private
   rooms among friends; **not** acceptable for a public leaderboard.
2. **Before any public ranked play:** move the authoritative simulation to a small headless build on a
   rented VM in an India region. Four players at 30 Hz is a trivial workload; the cost is operational,
   not computational.

Keep this separate in your head from the app's ordinary backend: accounts, cosmetics, and leaderboards
are regular HTTP against the MASCOM server (as Campus Heist already does). A database is not a game
server; the real-time match traffic is a different system with different failure modes.

---

## 9. Engine recommendation and Android performance plan

### 9.1 Recommendation: **Unity, with the Universal Render Pipeline**

Facts checked 2026-09-23 against official sources; each is cited. Anything I could not verify
officially is flagged as unverified and must not be planned around.

**Version.** Unity 6.3 LTS (released 4 December 2025, supported to December 2027) is the conservative
choice; Unity 6.6 (released 31 August 2026) is the current Supported Update and Unity's own guidance
is that Update releases are "the preferred choice for new and mid-cycle productions," with 6.7 LTS
signposted next (sources: unity.com/releases/unity-6/support; unity.com/blog/unity-6-3-lts-is-now-available;
Unity 6.6 release announcement). **Proposal: start on 6.6, and be prepared to settle onto 6.7 LTS
before public release.**

**Why Unity over Unreal for this specific game:**

- **Mobile rendering fit.** Unity 6.6's URP adds On-Tile Post Processing specifically to cut GPU
  bandwidth on tile-based GPUs "on platforms such as Android and iOS," and 6.3 added mobile-oriented
  URP bloom options (sources: Unity 6.6 and 6.3 release material). Unity defaults new Android projects
  to **Vulkan** (source: Unity 6.x manual, *Vulkan*). Unreal 5.8 moved mobile to multi-pass deferred
  by default and added SSAO/SSR/decals on mobile — genuinely attractive — but Unreal's docs still
  list **OpenGL ES 3.2 as the default Android feature level**, with Vulkan enabled per project
  (sources: UE 5.8 release notes; *Mobile Feature Levels and Rendering Modes*). Note the engine's own
  docs and release notes currently disagree about the 5.8 mobile default; that is a thing to verify
  empirically, not a thing to plan a schedule around.
- **The headline Unreal features do not apply here.** Lumen on Android is officially **Experimental**,
  high-end-only, requires the desktop renderer on Vulkan SM5, and Epic explicitly says "we do not
  recommend shipping projects with it yet" and that the desktop renderer on mobile "incurs a
  significant performance cost" (source: *Using Lumen Global Illumination on Mobile*). For Nanite I
  found **no official statement of Android support** — only that it is unsupported on mobile XR and
  falls back where unsupported. Treat Nanite as unavailable to us. Without Lumen and Nanite, Unreal's
  biggest visual advantages are off the table, and we are comparing two forward/deferred mobile
  renderers.
- **Build size.** Unity builds are widely understood to package smaller than Unreal for a minimal 3D
  game, which matters when this ships inside an existing shopping app or beside it. **Neither vendor
  publishes a baseline figure** — every number in circulation is a community estimate — so this must be
  measured on our own empty projects before it is used to justify anything.
- **Multiplayer path.** Netcode for GameObjects is server/host-authoritative by default and aimed at
  exactly this scale; on Unity 6.6 and below the guidance is to stay on NGO 2.x, with NGO 3.0
  requiring a 6.7 baseline (source: Unity discussions, NGO 3.0.0 announcement, 17 September 2026).
  Relay and Lobby free tiers cover a pilot (see §8.5). Unreal's built-in replication is excellent and
  EOS is free with no royalty or hosting fees (source: onlineservices.epicgames.com/licensing) — this
  is the one category where Unreal is at least equal.
- **Licensing at our scale.** Unity Personal is free up to $200,000 total finances over 12 months;
  Pro is $2,310/seat/year (prepaid) above that; the Runtime Fee was cancelled on 12 September 2024
  and the current Editor Terms allow distribution "without royalty, revenue share, or a runtime fee"
  (sources: unity.com/products/pricing-updates; unity.com/blog/unity-is-canceling-the-runtime-fee;
  Editor Software Terms effective 30 June 2026). Unreal is free under $1M gross revenue per product
  and charges 5% above that (3.5% under the Epic Games Store launch programme), with per-seat fees
  applying only to non-game use (source: unrealengine.com/license). **Both are effectively free for a
  campus pilot.** Licensing should not decide this.
- **Team and complexity.** The team is already shipping an Android app. Unity's iteration loop,
  smaller Android toolchain, and the fact that Fab content is licensed for use in Unity as well as
  Unreal (source: Epic's Fab launch announcement, October 2024) mean the asset-availability argument
  no longer favours Unreal either.

**Choose Unreal instead if** the project's identity depends on desktop-class visuals on flagship
phones and the team already has Unreal expertise. For a two-minute chase game that must run on a
₹15,000 phone in a hostel, it is the wrong trade.

*React Native is not a candidate for rendering the match, and is not being proposed anywhere in this
document.*

### 9.2 Android performance plan

Engineering **targets to measure**, not promises:

- **Stable 30 FPS** on the baseline device class, with consistent frame pacing — steady 30 beats an
  average of 45 that stutters.
- **Optional 60 FPS** on strong devices, offered only if it holds without thermal collapse.

**Before graphics budgets are finalised, the team must name actual test devices** — at minimum one
baseline phone (a current entry-level Snapdragon/Dimensity device with 4 GB RAM), one mid-range, one
flagship, and ideally the two or three handsets most common among students on campus. Budgets written
without named devices are fiction.

Approach:

- Baked lighting for all static geometry; one dynamic directional light for characters; light probes
  for character shading.
- Dynamic shadows limited to characters and the trophy, single cascade, tight range.
- Texture budget per material set, with aggressive atlasing; ASTC compression; mip streaming on.
- LODs on every prop above a trivial polygon count; character LODs with reduced bone influence at
  distance.
- Occlusion culling for the buildings; distance culling for small props with a smooth fade.
- Transparency strictly limited — it is the usual cause of a mobile GPU falling over. No large
  overlapping alpha planes, no particle walls.
- Post-processing conservative: tonemapping and light bloom only; no motion blur, no depth of field,
  no SSR.
- Three quality presets plus dynamic resolution scaling, chosen by a device tier lookup on first run
  and overridable in settings.
- **Thermal and battery testing is a deliverable, not an afterthought:** ten consecutive matches with
  no restarts, logging frame times, CPU/GPU clocks, battery drain and skin temperature. A build that
  is fine for one match and unplayable by match six has failed.
- Loading: single arena packaged in the base build; cosmetics as addressables; target a short
  cold-start into a match, measured once the arena is real.

---

## 10. Ranking and progression

### 10.1 Ranking: capped weekly competition (chosen for launch)

Two options were considered:

- **Skill rating (Elo-style).** Accurate, self-balancing, matches players fairly. But it needs a
  steady stream of public matches to converge, punishes experimentation, and on a campus of a few
  hundred players it will be noisy and demoralising for newcomers.
- **Capped weekly competition.** Each player's best *N* ranked matches in a campus week count
  *(proposed: best 10)*. Beyond that, extra matches are played for fun and do not add to the total.

**Choose the capped weekly competition for launch.** The reason is the audience: students between
classes. A cap means the leaderboard rewards playing *well*, not playing *endlessly*, and someone who
plays six good matches can beat someone who grinds forty mediocre ones. It also keeps the pilot's data
readable while the game is still being tuned. Revisit skill rating only when there is a genuine
population and matchmaking to feed it.

Ranked totals come **only** from public matches. Private-room matches are clearly labelled as
practice, show full result screens and personal bests, and never touch the competitive table — which
also removes the incentive to farm a friendly room.

### 10.2 Results and stats

Every match shows: final placement, total possession time, number of successful steals, longest
continuous possession, and any personal best beaten. Profiles keep lifetime totals for the same four.
Cohort is shown as a label and is available as an optional leaderboard *filter*; there is deliberately
no cohort-total scoring, because cohort populations differ and a sum would simply rank the largest
cohort first.

### 10.3 Progression: identity only

Unlocks are character outfits, trophy skins, profile frames, celebration animations and cosmetic
titles ("Butterfingers" for the most possessions lost in a week is worth more than any stat). Earned
through play, milestones, and weekly participation.

**Nothing purchasable or unlockable may affect movement, dash, steal, throw or collision.** No energy
timers, no paid cooldown reductions, no "premium" dash. A first-day player and a hundred-hour player
have identical capabilities; the only difference is that one of them knows the corridor is a trap.

---

## 11. MVP scope and phased plan

### 11.1 First playable build

**In:** one polished courtyard arena; four players in a private room; third-person movement and
camera; jump, dash, vault; trophy pickup, steal, throw; two-minute matches; possession scoring;
results and a rematch button; a handful of character appearances; Android builds on real devices.

**Out (deferred, deliberately):** open campus world, voice chat, extra modes, cosmetic store,
ragdolls, destructible scenery, deep progression, merch tie-ins, and **any second map until the first
one is genuinely fun**.

Placeholder and temporary licensed assets are fine during prototyping, on one condition: they are
listed in a `PROTOTYPE_ASSETS.md` with their licence terms, and no screenshot containing them is ever
presented as finished art.

### 11.2 Phases and exit criteria

| Phase | Work | Exit criterion |
|---|---|---|
| 1. Movement test | Run, turn, sprint, jump, land, dash, vault, camera — in a grey box with a few obstacles | Five testers, given no goal beyond "run around," describe the movement as good and keep playing after being told they can stop. Camera never obscures the character in the test corridor |
| 2. Trophy interaction | Pickup, possession scoring, dash-steal, protection window, throw | In 1v1 with a bot, testers make *different* choices in repeated runs — throwing sometimes, holding sometimes. If one option is always correct, the numbers are wrong |
| 3. Arena design | Greybox courtyard, all five zones, chase routes, interception paths | No route dominates across 20 recorded matches; no carrier survives more than ~15 s uncontested; no trap dead ends; no unreachable trophy positions |
| 4. Multiplayer | Four real clients, server authority, prediction, reconciliation, lag-compensated steals, all §8.3 failure paths | Every failure row in §8.3 demonstrated deliberately and behaving as written. Trophy ownership never disagrees between clients. Steals remain understandable at 120 ms RTT with 3% loss |
| 5. Art and animation | Real characters, real courtyard, lighting, audio | Silhouettes, trophy and traversable edges readable on the baseline phone at arm's length, judged from screenshots by people who have not played |
| 6. Android optimisation | Profiling, LODs, culling, presets, thermal runs | Stable target frame rate on named devices across ten consecutive matches with no thermal cliff |
| 7. Campus playtest | Groups of students, observed | Voluntary rematch rate is high enough to justify public matchmaking — and if it is not, the game changes rather than the plan |

**Do not begin phase 5 while phase 1 or 4 is still unreliable.** Polishing art over unreliable movement
or networking is the most expensive mistake available here.

---

## 12. Risks, open decisions, and playtest questions

### Main risks

1. **The chase may not resolve.** If the carrier's speed penalty is too small, matches become
   twenty-second stalemates; too large, and holding the trophy is pointless. This single number is the
   game's balance, and it cannot be settled by reasoning — only by watching people play.
2. **Mobile third-person camera in tight spaces.** The corridor and stair are where this game will
   feel bad first. Mitigation: build them at generous widths in greybox and shrink only if the camera
   proves it can cope.
3. **Throwing is either overpowered or pointless.** The self-lockout and the "no score while airborne"
   rule are the controls on this; the risk is that testers simply never use it, which would mean the
   distinctive mechanic is decorative.
4. **Lag-compensated steals feel unfair to carriers.** Partly a tuning problem (clamp size), largely a
   communication problem (telling the loser what happened).
5. **Thermal throttling.** Two-minute matches back-to-back is a sustained load; a game that is smooth
   in match one and juddering in match five will not be replayed.
6. **Four concurrent players is a matchmaking problem on a small campus.** Hence private rooms first
   and labelled bots, rather than pretending a public queue has a population.
7. **Scope.** A 3D multiplayer game is an order of magnitude more work than Campus Heist. The phase
   gates exist to make that visible early rather than at the art stage.

### Open decisions

- Sprint by stick deflection, or a sprint button? *Decide from phase 1.*
- Carrier speed penalty: a flat percentage, or one that grows while unchallenged? *A growing penalty
  would break stalemates but adds a hidden rule; try flat first.*
- Should a dropped trophy (from a disconnect) be collectable immediately, or after a short beat?
- Protection window: fixed 1.2 s, or scaled by how long the previous carrier held it?
- Does the trophy respawn centrally if nobody touches it for a long stretch, or stay where it lies?
- Host-authority via Relay for the pilot versus standing up a headless server earlier — cost against
  integrity.

### Questions for playtesters

- After one short tutorial, can you say what wins a match, in one sentence?
- When you lost the trophy, did you understand why?
- When you missed a dash, did it feel like a mistake you made, or like the game ignored you?
- Did you ever throw the trophy on purpose? Did it work? Would you try it again?
- Was there a route you kept using because it was best, or did it depend on where the others were?
- Did you know where the trophy was at all times? Did you know who had it?
- Did you want to play again immediately — and did you actually tap Rematch before being asked?
- Did the phone get uncomfortably warm? Did the game get worse the longer you played?

---

### One last note on this document

Fun, replay interest, and device performance are claims this blueprint deliberately does not make.
They are hypotheses with tests attached, listed in §11.2 and §12. If phase 1 produces movement that
nobody enjoys, no amount of the rest of this document will save it — and the correct response is to
change the movement, not to continue to phase 2.
