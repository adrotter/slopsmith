# Research: Audio Mix Control Plane

## Decision: Extend the existing audio-session host as the audio-mix control plane

**Rationale**: `static/capabilities/audio-session.js` already owns the active audio domains, registers `audio-mix` as an active provider-coordinator, records route/fader/analyser bridge hits, and contributes diagnostics under `slopsmith.audio_session.diagnostics.v1`. Extending this host avoids a parallel mixer runtime and keeps 005 directly layered on the completed 004 slice.

**Alternatives considered**: A new standalone mixer module would duplicate participant/session/diagnostics state. Keeping `static/audio-mixer.js` as the source of truth would fail the migration goal because plugin fader callbacks would remain private UI registry state.

## Decision: Make native participants win over matching legacy faders

**Rationale**: Native audio-mix participants are the migration target and should become authoritative as soon as a plugin adopts them. Suppressing matching legacy faders prevents duplicate controls while retaining compatibility bridge diagnostics for support and removal-gate tracking.

**Alternatives considered**: Legacy-first behavior would slow the migration and keep old callbacks authoritative. First-registration-wins would be nondeterministic under plugin load order and rehydration. A disabled conflict state would be disruptive for users when the system can safely prefer the native path.

## Decision: Enforce a 2 second fader operation timeout

**Rationale**: The player mixer is local and UI-visible. A 2 second timeout prevents sliders from lingering in an uncertain pending state while allowing normal plugin or desktop bridge callbacks enough time to settle. Timeouts keep or restore the last committed value and record a failed outcome.

**Alternatives considered**: Longer timeouts such as 5 or 10 seconds would make the mixer feel broken. No timeout would make provider failures hard to diagnose and could leave pending UI state indefinitely.

## Decision: Keep plugin fader persistence provider-owned

**Rationale**: The existing mixer contract makes each fader source responsible for its value and persistence. Preserving that boundary avoids turning core into a plugin preference store and respects plugin-owned settings/export/import behavior. Core persists only core-owned song volume and caches last committed provider values for the active session.

**Alternatives considered**: Core-owned persistence for all faders would require schema and lifecycle policy for plugin-specific values. Opt-in core persistence adds complexity before a demonstrated need.

## Decision: Show known unavailable faders as disabled controls

**Rationale**: Disabled controls make route/provider changes explainable to the player and align the visible UI with diagnostics. This is especially helpful for pending pre-session participants, temporarily unavailable plugins, stem routes, and optional desktop-backed routes.

**Alternatives considered**: Hiding unavailable faders makes the mixer appear unstable and makes support harder. Provider-selected hide/disable behavior would make the mixer inconsistent.

## Decision: Accept pre-session participants as pending/known

**Rationale**: Plugins often hydrate before playback starts. Accepting pre-session participants prevents registration races and avoids forcing plugins to retry after song load. Pending participants can render as disabled and attach to the next active session.

**Alternatives considered**: Rejecting pre-session participants would force every provider to track player lifecycle and retry, increasing wrapper pressure around `playSong` and `showScreen`. Allowing only core song volume before playback would still leave plugin faders racy.

## Decision: Keep diagnostics bounded and redaction-safe

**Rationale**: Audio-mix is safe, but route/analyser/failure metadata can still accidentally include paths, device labels, or plugin secrets. The 004 audio-session host already caps outcome history and redacts reasons; 005 should preserve that model and add fader-specific outcome detail without raw audio data.

**Alternatives considered**: Richer raw analyser/fader internals would be useful during development but would violate the diagnostics redaction principle and increase snapshot size.
