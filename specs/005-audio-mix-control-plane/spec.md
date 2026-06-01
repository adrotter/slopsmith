# Feature Specification: Audio Mix Control Plane

**Feature Branch**: `005-audio-mix-control-plane`
**Created**: 2026-05-30
**Status**: Draft
**Input**: User description: "Let's start with the first migration: audio-mix"

## Clarifications

### Session 2026-05-30

- Q: When a logical fader is registered through both native audio-mix and legacy `registerFader(...)` paths, which path should own the user-visible mixer control? → A: Native audio-mix participant wins; matching legacy fader is suppressed from UI and recorded as compatibility-backed/overshadowed in diagnostics.
- Q: How long should the mixer wait for fader read/write operations before treating the provider as failed? → A: Use a 2 second timeout; on timeout, keep or revert to the last committed value and record a failed outcome.
- Q: Who owns persistence for plugin fader values after migration? → A: Providers persist their own fader values; core persists only core song volume and caches last committed values for the active session.
- Q: How should unavailable faders appear in the mixer UI? → A: Show unavailable faders as disabled with a clear unavailable state, and keep them in diagnostics.
- Q: How should audio-mix handle participants that register before an active song/session exists? → A: Accept pre-session participants as pending/known; show them disabled when unavailable and attach them to the next active audio-mix session.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adjust Any Available Mix Fader (Priority: P1)

A player opens the mixer, sees every available mix source represented once, changes a fader, and immediately sees the value that was actually accepted by that source.

**Why this priority**: The migration is only useful if the player-facing mixer remains reliable while fader ownership moves from a legacy registry to the audio-mix capability domain.

**Independent Test**: Can be tested by registering song and plugin mix sources, opening the mixer, changing each fader, and confirming that the displayed value matches the committed value from the owning source.

**Acceptance Scenarios**:

1. **Given** song audio and one plugin output are available, **When** the user opens the mixer, **Then** both faders appear once with labels, ranges, units, and current values.
2. **Given** a fader is available, **When** the user changes its value, **Then** the owning source receives the request and the mixer displays the committed value.
3. **Given** a source clamps or normalizes a requested value, **When** the user changes its fader, **Then** the mixer displays the normalized committed value instead of the raw requested value.
4. **Given** a source is unavailable, **When** the user opens the mixer, **Then** its fader remains visible as disabled with a clear unavailable state rather than appearing broken or disappearing without explanation.

---

### User Story 2 - Migrate Plugin Faders Without Breaking Existing Plugins (Priority: P2)

A plugin author can register an audio-mix participant with fader behavior while older fader integrations continue to work during the compatibility period.

**Why this priority**: First-party and external plugins need a safe migration path. The new domain must support native participants without forcing every plugin to update at the same time.

**Independent Test**: Can be tested by registering one native audio-mix participant and one legacy fader, then confirming both appear through the same mixer experience and are attributed correctly in diagnostics.

**Acceptance Scenarios**:

1. **Given** a plugin registers a native audio-mix participant, **When** the mixer refreshes, **Then** the participant appears as a provider-owned fader without using the legacy fader registry as the source of truth.
2. **Given** a plugin still uses the legacy fader registry, **When** the mixer refreshes, **Then** the fader remains usable and is attributed to a compatibility bridge.
3. **Given** the same source is represented by both native and legacy registration during migration, **When** the mixer refreshes, **Then** the native participant owns the user-visible fader, the matching legacy fader is suppressed, and diagnostics record the legacy path as compatibility-backed/overshadowed.
4. **Given** a plugin unregisters or becomes unavailable, **When** the mixer refreshes or a user attempts a change, **Then** unregistered faders are removed and known unavailable faders remain visible as disabled without leaving stale controls.

---

### User Story 3 - Diagnose Mix Routing And Fader Failures (Priority: P3)

A maintainer exports diagnostics and can tell which mix participants, faders, routes, analyser summaries, compatibility bridges, and recent failures were involved without exposing raw audio data.

**Why this priority**: The capability migration must improve supportability, especially for plugin audio bugs where failures currently look like silent UI problems.

**Independent Test**: Can be tested by forcing successful, unavailable, denied, degraded, unsupported, and failed fader outcomes, then checking that the diagnostics snapshot explains each outcome with safe identifiers.

**Acceptance Scenarios**:

1. **Given** multiple mix participants are registered, **When** diagnostics are exported, **Then** the snapshot lists each participant with safe metadata, availability, fader summary, and owning source.
2. **Given** a fader read or write fails, **When** diagnostics are exported, **Then** the snapshot includes the failure outcome, bounded reason, participant, and operation without leaking raw audio data.
3. **Given** a compatibility fader is used, **When** diagnostics are exported, **Then** the snapshot records the bridge hit and the legacy surface involved.
4. **Given** the active route changes or degrades, **When** diagnostics are exported, **Then** the route summary explains the current route and degradation reason in redaction-safe terms.

---

### User Story 4 - Keep Mixer Behavior Stable Across Sessions (Priority: P4)

A player who already has volume preferences and plugin faders sees the same practical mixer behavior after the migration, including reloads, screen changes, and plugin rehydration.

**Why this priority**: The migration should reduce coupling without creating regressions in ordinary playback or practice sessions.

**Independent Test**: Can be tested by changing song and plugin faders, reloading or rehydrating plugin scripts, switching songs, and confirming values, labels, and duplicate prevention remain stable.

**Acceptance Scenarios**:

1. **Given** a user changes song volume, **When** the app reloads, **Then** the song fader restores the expected value using the existing user preference behavior.
2. **Given** plugin scripts hydrate more than once, **When** the mixer opens, **Then** each logical fader appears at most once.
3. **Given** the user switches songs or routes, **When** the mixer opens again, **Then** stale faders from the previous route are removed or marked unavailable.
4. **Given** a plugin registers its fader before playback starts, **When** the mixer opens before an active song exists, **Then** the fader is known but disabled; **When** the next audio-mix session starts, **Then** the participant attaches without requiring the plugin to register again.

### Edge Cases

- A fader provider throws, rejects, times out, or returns a non-numeric value while reading or writing.
- A fader read or write operation does not settle within 2 seconds.
- A requested value is outside the fader range, uses an invalid step, or must be normalized by the provider.
- Two providers claim the same fader identifier or a legacy and native path represent the same logical source.
- The mixer is open while a provider unregisters, reloads, or becomes unavailable.
- A known participant is temporarily unavailable and must remain visible as a disabled mixer control.
- The active audio route changes between HTML audio, stem-backed playback, and optional desktop-backed playback.
- Local user preference storage is blocked or unavailable.
- A provider declares unsupported metadata or an incompatible capability contract version.
- A fader value changes outside the mixer while the popover is open.
- No active song session exists when a provider registers or a diagnostic snapshot is requested.
- A pre-session participant remains pending across idle state and attaches to the next active audio-mix session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single authoritative audio-mix control plane for discovering faders, reading fader values, applying fader changes, inspecting current route state, and inspecting read-only analyser availability.
- **FR-002**: System MUST represent each mix source as a participant with a stable identifier, owner/source attribution, label, kind, availability, optional fader metadata, and supported operations.
- **FR-002a**: System MUST accept participant registrations before an active song/session exists, mark them as pending or known unavailable, show their faders disabled when applicable, and attach them to the next active audio-mix session without requiring re-registration.
- **FR-003**: System MUST support at least song audio, plugin output, stem mix, monitoring output, and preview output as mix participant kinds.
- **FR-004**: System MUST allow a provider-owned fader to define label, unit, minimum, maximum, step, default value, current value, availability, and whether it can be changed by the user.
- **FR-005**: System MUST route user fader changes through the owning participant and display the participant's committed value after the change settles.
- **FR-006**: System MUST distinguish requested value, committed value, and rejected value for fader changes.
- **FR-007**: System MUST clamp, normalize, or reject invalid fader values in a consistent way and report the resulting outcome.
- **FR-007a**: System MUST treat any fader read or write operation that does not settle within 2 seconds as failed, keep or restore the last committed value, and record the timeout as a failed outcome.
- **FR-008**: System MUST expose explicit outcomes for fader and route operations, including handled, denied, degraded, failed, no-owner, no-handler, unsupported-command, overridden, and incompatible-version.
- **FR-009**: System MUST emit observable events when faders are registered, removed, changed, unavailable, or fail to change.
- **FR-010**: System MUST emit observable events when the active audio route changes or becomes degraded.
- **FR-011**: System MUST preserve existing song volume behavior, including existing user preference persistence and unavailable-storage fallbacks.
- **FR-011a**: System MUST keep persistence for plugin-owned fader values with the owning provider; core MUST persist only core-owned song volume and may cache last committed provider values for the active session.
- **FR-012**: System MUST preserve existing legacy fader integrations during the compatibility period by mapping them into the audio-mix control plane.
- **FR-013**: System MUST record compatibility bridge hits for legacy fader registration, song volume handling, route handling, and analyser access that still occur during migration.
- **FR-014**: System MUST prevent duplicate user-visible faders when a logical source is represented by both legacy and native migration paths; the native audio-mix participant wins and the matching legacy fader is suppressed from UI while remaining visible as compatibility-backed/overshadowed in diagnostics.
- **FR-015**: System MUST support unregistering, disabling, or marking a participant unavailable without leaving stale mixer controls; known unavailable faders MUST remain visible as disabled controls with a clear unavailable state and diagnostic attribution.
- **FR-016**: System MUST provide route inspection that identifies the current route kind, availability, user-selected state, and redaction-safe degradation reason.
- **FR-017**: System MUST provide analyser inspection as a summary of availability and source metadata only; raw audio buffers, raw frequency data, and direct analyser internals MUST NOT appear in public diagnostics.
- **FR-018**: System MUST include audio-mix participants, fader summaries, route summaries, bridge hits, and recent operation outcomes in diagnostics.
- **FR-019**: System MUST keep diagnostics bounded and redaction-safe, with reason text capped and local file paths, secrets, device labels, and stable hardware identifiers excluded.
- **FR-020**: System MUST make the player mixer consume the audio-mix control plane as its source of truth once native fader commands are available.
- **FR-021**: System MUST leave stems playback ownership with the active Stems provider; audio-mix may represent stem volume or route participation but MUST NOT own stem playback state.
- **FR-022**: System MUST avoid changing playback transport, note detection, audio input selection, recording, audio effects, or plugin installation behavior as part of this feature.
- **FR-023**: System MUST document the migration path for plugin authors, including native fader participation, compatibility behavior, diagnostics, and legacy removal gates.
- **FR-024**: System MUST allow support tooling to identify whether each fader is native, compatibility-backed, unavailable, or failed.
- **FR-025**: System MUST handle repeated plugin hydration, screen switching, and song switching without duplicate faders, duplicate event listeners, or stale participants.

### Key Entities

- **Audio Mix Session**: The active player/song mix boundary; contains route state, mix participants, compatibility bridge usage, and recent outcomes.
- **Mix Participant**: A source that participates in the mix, such as song audio, plugin output, stem mix, monitoring output, or preview output.
- **Fader**: User-adjustable or read-only volume/control metadata owned by a participant, including range, unit, current value, and committed value behavior.
- **Fader Operation**: A request to read or set a fader value, with an explicit outcome and optional failure reason.
- **Route Summary**: Redaction-safe description of the current output route and whether the route is available, degraded, or unavailable.
- **Analyser Summary**: Redaction-safe description of whether read-only analysis data is available for visual or diagnostic consumers.
- **Compatibility Bridge Hit**: A record that a legacy fader, song-volume, route, or analyser surface was used and mapped into the audio-mix migration path.
- **Mix Outcome**: A bounded diagnostic record describing what happened, which participant was involved, and whether the operation succeeded, degraded, or failed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing bundled mixer faders remain visible and adjustable through the player mixer after migration.
- **SC-002**: 95% of successful user fader changes display the committed value within 500 ms on a typical local Slopsmith session.
- **SC-003**: 100% of failed or unavailable fader changes produce a visible stable mixer state and a diagnostic outcome that identifies the affected participant.
- **SC-003b**: 100% of known unavailable faders render as disabled controls with a clear unavailable state while remaining represented in diagnostics.
- **SC-003a**: 100% of fader read/write operations that exceed 2 seconds produce a failed diagnostic outcome and leave the mixer showing the last committed value.
- **SC-004**: Diagnostics identify every registered audio-mix participant, its fader availability, its route participation when applicable, and whether it is native or compatibility-backed.
- **SC-005**: Diagnostics exports contain zero raw audio buffers, raw frequency arrays, raw device labels, stable hardware identifiers, secrets, or unredacted local file paths.
- **SC-006**: Rehydrating plugin scripts five times in one session does not create duplicate faders, duplicate mixer controls, or duplicate participant records.
- **SC-007**: Switching between at least three representative route states preserves song volume behavior and leaves no stale faders from the previous route.
- **SC-008**: A plugin author can migrate a fader to the native audio-mix path using documented manifest/runtime guidance without relying on private mixer globals.
- **SC-009**: Reloading the app preserves core song volume through core persistence and preserves plugin fader values only when the owning provider restores them.
- **SC-010**: 100% of valid pre-session participant registrations remain known while idle and attach to the next active audio-mix session without duplicate faders or provider re-registration.

## Assumptions

- The audio graph/session slice from `specs/004-audio-graph-session` is the foundation for this feature.
- Slopsmith remains a self-hosted, single-user app with one primary active player/song audio session at a time.
- Plugins may register audio-mix participants before playback starts; those participants are treated as pending/known until an active audio-mix session exists.
- Splitscreen and visualization panels share the active player audio mix rather than creating independent song-volume ownership.
- Existing song-volume and plugin-fader preferences must remain compatible with current user data.
- Plugin-owned fader persistence remains plugin-owned; core does not become a general preference store for plugin mix values.
- The active Stems provider remains the owner of actual stem playback and per-stem state.
- This feature focuses on fader control, route summary, analyser summary, compatibility attribution, diagnostics, and mixer migration only.
- Playback transport, audio input device selection, monitoring lifecycle, note detection, recording, audio effects, jobs, and plugin lifecycle are separate migrations.
