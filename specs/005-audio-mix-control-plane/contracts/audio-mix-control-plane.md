# Contract: Audio Mix Control Plane

This contract extends the `audio-mix` domain from the audio graph/session slice. It follows `capability-pipelines.v1` and keeps `core.audio.session` as the provider-coordinator owner.

## Domain Metadata

- **Domain**: `audio-mix`
- **Owner**: `core.audio.session`
- **Kind**: `provider-coordinator`
- **Safety**: `safe`
- **Compatibility bridges**: `audio-mix.fader-registry`, `audio-mix.song-volume`, `audio-mix.analyser`
- **Timeout**: fader read/write operations fail after 2 seconds

## Commands

Commands are invoked through the existing capability runtime, for example `window.slopsmith.capabilities.dispatch({ capability: 'audio-mix', command, payload })` or an equivalent helper.

| Command | Request | Success Payload | Failure Outcomes |
|---------|---------|-----------------|------------------|
| `inspect` | `{ sessionId? }` | Full redaction-safe `AudioMixSession` summary | `degraded`, `failed` |
| `list-faders` | `{ includeUnavailable?: boolean }` | `{ faders: FaderSummary[] }` ordered for mixer display | `degraded`, `failed` |
| `get-fader-value` | `{ participantId, faderId? }` | `FaderValueResult` with committed value | `denied`, `degraded`, `failed`, `no-owner`, `no-handler`, `unsupported-command`, `incompatible-version` |
| `set-fader-value` | `{ participantId, faderId?, value }` | `FaderValueResult` with requested and committed value | `denied`, `degraded`, `failed`, `no-owner`, `no-handler`, `unsupported-command`, `overridden`, `incompatible-version` |
| `inspect-route` | `{ sessionId? }` | `RouteSummary` | `degraded`, `failed` |
| `inspect-analyser` | `{ sessionId? }` | `AnalyserSummary` | `degraded`, `failed` |
| `register-participant` | `MixParticipantRegistration` | Registered participant summary | `denied`, `incompatible-version`, `failed` |
| `unregister-participant` | `{ participantId }` | `{ participantId, removed: true }` | `no-handler`, `failed` |

## Provider Operations

Provider operations are participant-owned callbacks or runtime handlers registered with the audio-mix host.

| Operation | Request | Success Payload | Notes |
|-----------|---------|-----------------|-------|
| `fader.get-value` | `{ participantId, faderId }` | `{ value, committedValue?, availability? }` | Must settle within 2 seconds. |
| `fader.set-value` | `{ participantId, faderId, value }` | `{ requestedValue, committedValue, availability? }` | Provider may clamp/normalize and returns committed value. |
| `route.get-current` | `{ sessionId? }` | `RouteSummary` | Raw device labels and paths are forbidden. |
| `analyser.get-summary` | `{ sessionId? }` | `AnalyserSummary` | Raw audio/FFT data is forbidden. |

## FaderSummary

```json
{
  "participantId": "plugin.nam_tone",
  "ownerPluginId": "nam_tone",
  "faderId": "output",
  "label": "NAM Tone",
  "kind": "plugin",
  "unit": "dB",
  "min": -60,
  "max": 12,
  "step": 0.5,
  "defaultValue": 0,
  "currentValue": -3,
  "availability": "available",
  "userAdjustable": true,
  "sourceMode": "native"
}
```

Rules:

- `participantId` is required and stable.
- `faderId` defaults to `main` when omitted.
- `max` must be greater than `min`; `step` must be positive.
- `currentValue` is the last committed value known to core.
- Known unavailable faders remain in `list-faders` and render disabled.
- If a native and legacy fader share the same logical source, the native fader is returned and the legacy one is recorded as compatibility-backed/overshadowed.

## FaderValueResult

```json
{
  "participantId": "plugin.nam_tone",
  "faderId": "output",
  "requestedValue": -4,
  "committedValue": -3.5,
  "previousCommittedValue": -3,
  "availability": "available",
  "outcome": "handled"
}
```

Rules:

- `committedValue` is authoritative for mixer display.
- If the operation fails or times out, the mixer keeps or restores `previousCommittedValue`.
- Timeout is a `failed` outcome with status/reason indicating timeout.
- Provider-owned persistence is not implied; providers persist their own values.

## MixParticipantRegistration

```json
{
  "participantId": "plugin.nam_tone",
  "ownerPluginId": "nam_tone",
  "label": "NAM Tone",
  "kind": "plugin",
  "availability": "pending",
  "fader": {
    "id": "output",
    "label": "NAM Tone",
    "unit": "dB",
    "min": -60,
    "max": 12,
    "step": 0.5,
    "defaultValue": 0,
    "currentValue": 0,
    "userAdjustable": true
  },
  "operations": ["fader.get-value", "fader.set-value"],
  "sourceMode": "native"
}
```

Rules:

- Registration is accepted before an active song/session exists.
- Pre-session participants are `pending` or known unavailable and attach to the next active session without re-registration.
- Incompatible version metadata returns `incompatible-version` and must be visible in diagnostics.

## RouteSummary

```json
{
  "routeId": "song-output",
  "routeKind": "html5",
  "availability": "available",
  "selectedByUser": true,
  "fallbackReason": ""
}
```

Route summaries are control/diagnostic metadata only. This feature does not change playback transport behavior.

## AnalyserSummary

```json
{
  "source": "core",
  "availability": "available",
  "participantId": "core.song",
  "reason": ""
}
```

Analyser summaries must not expose raw audio buffers, raw FFT arrays, analyser internals, raw device labels, stable hardware identifiers, secrets, or local file paths.

## Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `participant-registered` | Participant summary | Participant registration accepted. |
| `participant-removed` | `{ participantId }` | Participant unregistered. |
| `participant-availability-changed` | Participant summary | Availability changes, including pending/unavailable/failed. |
| `fader-registered` | `FaderSummary` | User-visible fader becomes known. |
| `fader-removed` | `{ participantId, faderId }` | User-visible fader is removed. |
| `fader-unavailable` | `FaderSummary` plus reason | A known fader remains visible but becomes unavailable/disabled. |
| `fader-value-changed` | `FaderValueResult` | Provider commits a value. |
| `fader-set-failed` | `FaderValueResult` plus reason | Set operation fails, rejects, or times out. |
| `route-changed` | `RouteSummary` | Route changes and remains available. |
| `route-degraded` | `RouteSummary` | Route becomes degraded or unavailable. |
| `analyser-changed` | `AnalyserSummary` | Analyser availability/source changes. |
| `bridge-hit` | `CompatibilityBridgeHit` | Legacy surface is used. |

## Legacy Compatibility API

`window.slopsmith.audio.registerFader(spec)` remains during the compatibility period.

Compatibility behavior:

- Legacy registration creates or updates a compatibility-backed audio-mix participant.
- Legacy callbacks are adapted into `fader.get-value` and `fader.set-value` provider operations.
- Native participants win over matching legacy faders in the visible mixer.
- Legacy fader hits are recorded under `audio-mix.fader-registry`.
- `window.slopsmith.audio.getFaders()` may remain for external compatibility, but the player mixer must consume `audio-mix` commands as source of truth.

## Diagnostics Expectations

The audio-session diagnostics contribution must include:

- domain schema version
- session id/player id/song format
- route summary
- analyser summary
- all native, compatibility-backed, pending, unavailable, failed, and overshadowed participants
- fader summaries without plugin-private values beyond current committed display values
- bridge hit counts and latest outcomes
- bounded recent outcomes, including timeouts and provider failures

Diagnostics must remain bounded and redaction-safe. Raw audio data, raw FFT arrays, raw device labels, stable hardware identifiers, secrets, and unredacted local file paths are forbidden.
