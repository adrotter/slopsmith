# Data Model: Audio Mix Control Plane

## AudioMixSession

Represents the current player/song mix boundary.

**Fields**:

- `sessionId`: Stable id for the current audio-mix session. Uses `main:idle` or equivalent while no song is active.
- `playerId`: Player surface id, default `main`.
- `songKey`: Redaction-safe song/session key when a song is active.
- `songFormat`: `psarc`, `sloppak`, `unknown`, or another known route source.
- `state`: `idle`, `pending`, `active`, `stopped`, or `degraded`.
- `participants`: Ordered collection of `MixParticipant` records.
- `route`: Current `RouteSummary`.
- `analyser`: Current `AnalyserSummary`.
- `bridges`: Bounded collection of `CompatibilityBridgeHit` records.
- `recentOutcomes`: Bounded collection of `MixOutcome` records.
- `lastUpdatedAt`: ISO timestamp for diagnostics and stale-state handling.

**Relationships**:

- Owns zero or more `MixParticipant` records.
- Owns one current `RouteSummary` and one current `AnalyserSummary`.
- Records many `MixOutcome` and `CompatibilityBridgeHit` records.

**State transitions**:

- `idle` -> `pending`: participant registers before an active song exists.
- `idle` or `pending` -> `active`: song/audio route starts; pending participants attach.
- `active` -> `degraded`: route or required participant degrades but mixer remains usable.
- `active` or `degraded` -> `stopped`: song/player session stops.
- `stopped` -> `pending`: pre-session participants remain known for the next session.

## MixParticipant

Represents a source that contributes to the mix.

**Fields**:

- `participantId`: Stable unique id within audio-mix, such as `core.song`, `plugin.nam_tone`, or `fader.plugin.delay`.
- `ownerPluginId`: `core` or plugin id that owns the participant.
- `label`: User-facing label.
- `kind`: `song`, `plugin`, `stem`, `monitoring`, `preview`, `analyser`, or `other`.
- `availability`: `available`, `pending`, `unavailable`, `disabled`, `failed`, or `incompatible`.
- `fader`: Optional `Fader`.
- `operations`: Supported provider operations.
- `sourceMode`: `native`, `compatibility`, or `core`.
- `compatibilitySource`: Bridge id or legacy surface when compatibility-backed.
- `supersededBy`: Native participant id when a legacy participant is suppressed.
- `registeredAt`: ISO timestamp.
- `lastSeenAt`: ISO timestamp.

**Identity and uniqueness**:

- `participantId` is the primary identity.
- A logical fader key derived from owner/source plus fader id prevents duplicate user-visible faders.
- If native and legacy registrations match the same logical fader, the native participant wins and the legacy participant is marked compatibility-backed/overshadowed.

## Fader

Represents user-visible control metadata for a participant.

**Fields**:

- `faderId`: Stable id within its participant.
- `label`: User-facing label.
- `unit`: Optional unit such as `%` or `dB`.
- `min`: Numeric minimum.
- `max`: Numeric maximum, greater than `min`.
- `step`: Positive numeric step.
- `defaultValue`: Provider default.
- `currentValue`: Last committed value known to core.
- `lastRequestedValue`: Most recent value requested by the mixer.
- `lastRejectedValue`: Most recent value rejected or timed out, if any.
- `userAdjustable`: Boolean; unavailable/read-only faders render disabled.
- `availability`: Mirrors or narrows participant availability.
- `lastCommittedAt`: ISO timestamp.

**Validation rules**:

- `max` must be greater than `min`; invalid metadata is corrected only when a safe correction is deterministic, otherwise registration degrades or fails.
- `step` must be positive.
- Numeric values must be finite.
- Requested values are clamped, normalized, or rejected consistently and recorded in the operation outcome.

## FaderOperation

Represents a read or write request against a fader.

**Fields**:

- `operationId`: Diagnostic id for the operation.
- `operation`: `fader.get-value` or `fader.set-value`.
- `participantId`: Target participant.
- `faderId`: Target fader.
- `requestedValue`: Requested numeric value for writes.
- `committedValue`: Provider-accepted value when handled.
- `previousCommittedValue`: Value to keep/restore on failure.
- `outcome`: `handled`, `denied`, `degraded`, `failed`, `no-owner`, `no-handler`, `unsupported-command`, `overridden`, or `incompatible-version`.
- `reason`: Bounded redaction-safe reason.
- `startedAt`: ISO timestamp.
- `settledAt`: ISO timestamp when available.
- `timedOut`: Boolean; true when the operation exceeds 2 seconds.

**State transitions**:

- `requested` -> `handled`: provider returns a committed value.
- `requested` -> `denied`: provider rejects the request by policy.
- `requested` -> `failed`: provider throws, rejects, returns invalid data, or times out.
- `requested` -> `degraded`: provider settles but reports degraded behavior.

## RouteSummary

Redaction-safe summary of the current output route.

**Fields**:

- `routeId`: Stable route id.
- `routeKind`: `html5`, `stems`, `juce`, `desktop`, `unknown`, or another documented kind.
- `availability`: `available`, `degraded`, or `unavailable`.
- `selectedByUser`: Boolean.
- `fallbackReason`: Bounded redaction-safe reason.
- `lastChangedAt`: ISO timestamp.

## AnalyserSummary

Redaction-safe summary of analyser availability.

**Fields**:

- `source`: `core`, `stems`, `plugin`, `unavailable`, or `conflict`.
- `availability`: `available`, `degraded`, or `unavailable`.
- `participantId`: Optional participant id for the analyser provider.
- `reason`: Bounded redaction-safe reason.
- `lastChangedAt`: ISO timestamp.

**Validation rules**:

- Must not expose raw audio buffers, raw FFT arrays, analyser node internals, device labels, or stable hardware identifiers.

## CompatibilityBridgeHit

Records use of a legacy surface during migration.

**Fields**:

- `bridgeId`: `audio-mix.fader-registry`, `audio-mix.song-volume`, `audio-mix.analyser`, or related documented bridge.
- `legacySurface`: Legacy global/API name.
- `participantId`: Participant involved.
- `status`: `used`, `overshadowed`, `degraded`, or `failed`.
- `outcome`: Capability outcome.
- `reason`: Bounded redaction-safe reason.
- `hitCount`: Number of observed hits for the bridge/participant combination.
- `lastHitAt`: ISO timestamp.

## MixOutcome

Bounded diagnostic record for support and inspector views.

**Fields**:

- `domain`: Always `audio-mix` for this feature.
- `operation`: Command, provider operation, or event name.
- `participantId`: Participant involved.
- `faderId`: Optional fader id.
- `bridgeId`: Optional bridge id.
- `outcome`: Capability outcome.
- `status`: Optional state such as `available`, `disabled`, `timeout`, or `overshadowed`.
- `reason`: Bounded redaction-safe reason.
- `timestamp`: ISO timestamp.
