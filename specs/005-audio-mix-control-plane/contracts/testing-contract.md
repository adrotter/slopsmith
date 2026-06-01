# Contract: Audio Mix Testing Contract

## Unit And Runtime Coverage

`tests/js/audio_session_mix.test.js` should cover:

- `list-faders` returns native, compatibility-backed, unavailable, and pending faders in deterministic UI order.
- Required participant kinds `song`, `plugin`, `stem`, `monitoring`, and `preview` are accepted, summarized, and displayed without collapsing into `other`.
- `get-fader-value` returns committed values and records invalid/non-numeric provider responses.
- `set-fader-value` returns requested and committed values.
- Successful set operations update the displayed committed value within the 500 ms success target under controlled timers.
- Native fader registration suppresses matching legacy fader UI entries.
- 2 second timeout behavior records failed outcomes and restores last committed value.
- Pre-session participants remain pending/known and attach to the next active session.
- Unavailable faders remain visible as disabled summaries and emit `fader-unavailable`.

`tests/js/audio_session_compat.test.js` should cover:

- `registerFader(...)` remains callable and is attributed under `audio-mix.fader-registry`.
- Legacy `getFaders()` remains available for external compatibility.
- Legacy fader bridge hits include overshadowed status when a native participant wins.
- Legacy analyser bridge records summary status without raw data.

`tests/js/audio_session_routes.test.js` should cover:

- HTML5, stems, and optional desktop/JUCE route summaries.
- Route degraded/unavailable outcomes.
- Core song volume remains persisted with current behavior.

`tests/js/capability_inspector_render.test.js` should cover:

- Audio-mix fader availability badges.
- Native vs compatibility-backed participant display.
- Failed/timeout outcome rendering.

## Browser Smoke Coverage

A focused browser smoke should verify:

- Mixer opens without console errors.
- Disabled unavailable faders do not shift or overlap controls.
- Slider changes update displayed committed values.
- Failed fader changes leave a stable visible state.

## Non-Goals For This Feature

Do not add tests for playback transport, note detection scoring, audio input device selection, monitoring start/stop, recording, audio effects, plugin installation, or backend job execution as part of this feature except when needed to keep existing tests green.
