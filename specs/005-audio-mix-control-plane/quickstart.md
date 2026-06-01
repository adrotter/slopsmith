# Quickstart: Audio Mix Control Plane

## Prerequisites

Run commands from the repository root.

```bash
node --version
uv --version
```

Use `uv run pytest` for Python tests when pytest is not installed globally.

## Focused Validation Order

1. Static JavaScript syntax checks:

   ```bash
   node --check static/capabilities.js
   node --check static/capabilities/audio-session.js
   node --check static/audio-mixer.js
   node --check plugins/capability_inspector/screen.js
   ```

2. Audio-mix runtime tests:

   ```bash
   node --test \
     tests/js/audio_session_mix.test.js \
     tests/js/audio_session_compat.test.js \
     tests/js/audio_session_routes.test.js \
     tests/js/audio_session_host.test.js \
     tests/js/legacy_shim_hits.test.js
   ```

3. Inspector/UI-focused JS tests when diagnostics rendering changes:

   ```bash
   node --test tests/js/capability_inspector_render.test.js
   ```

4. Browser smoke when mixer DOM behavior changes:

   ```bash
   npx playwright test tests/browser/check-errors.spec.ts
   ```

5. Diagnostics bundle coverage if exported payload shape changes:

   ```bash
   uv run pytest tests/test_diagnostics_bundle.py -q
   ```

## Manual Scenarios

### Command Smoke

Run in the browser console after the app loads:

```js
await window.slopsmith.capabilities.command('audio-mix', 'list-faders', { requester: 'quickstart' });
await window.slopsmith.capabilities.command('audio-mix', 'inspect-route', { requester: 'quickstart' });
await window.slopsmith.capabilities.command('audio-mix', 'inspect-analyser', { requester: 'quickstart' });
```

Expected result: each command returns `outcome: "handled"`; `list-faders` includes at least the core song fader once `static/audio-mixer.js` has initialized.

### Native Fader Wins Over Legacy

1. Register a native audio-mix participant and a legacy `registerFader(...)` entry for the same logical fader.
2. Open the player mixer.
3. Confirm only the native fader is visible.
4. Export or inspect diagnostics.
5. Confirm the legacy path is recorded as compatibility-backed/overshadowed.

### Fader Commit And Timeout

1. Register a provider fader whose set operation returns a normalized committed value.
2. Change the slider.
3. Confirm the slider and label display the committed value, not the raw request, within 500 ms on the local session.
4. Register a provider fader that never settles.
5. Change the slider.
6. Confirm the UI returns to the last committed value within 2 seconds and diagnostics record a failed timeout.
7. Confirm `window.slopsmith.audioSession.snapshot().recentOutcomes` records the fader id and a `timeout` status.

### Provider-Owned Persistence

1. Change core song volume.
2. Reload the app and confirm core song volume restores from existing storage.
3. Change a plugin fader whose provider persists its own value.
4. Reload and confirm the provider restores its value.
5. Change a plugin fader whose provider does not persist.
6. Reload and confirm core does not invent persistence for that plugin fader.

### Unavailable And Pre-Session Participants

1. Register a participant before playback starts.
2. Open the mixer while idle.
3. Confirm the participant is known and disabled.
4. Start playback.
5. Confirm the same participant attaches without duplicate faders or a second registration.
6. Mark the participant temporarily unavailable.
7. Confirm the fader remains visible as disabled, emits `fader-unavailable`, and diagnostics include availability.

### Required Participant Kinds

1. Register representative `song`, `plugin`, `stem`, `monitoring`, and `preview` participants.
2. Open the mixer and inspect diagnostics.
3. Confirm every required kind is retained in fader summaries and diagnostics without being collapsed into `other`.
4. Confirm `list-faders` reports `requiredKinds.song`, `plugin`, `stem`, `monitoring`, and `preview` as present.

### Route And Analyser Summary

1. Exercise HTML5, stem-backed, and optional desktop/JUCE route states.
2. Confirm route summary updates without changing playback transport behavior.
3. Exercise a legacy analyser consumer.
4. Confirm analyser availability is summarized without raw FFT/audio data.
5. Open the Capability Inspector and confirm the Audio session panel shows route, analyser, faders, bridge hits, and recent failures without raw device labels or paths.

## Done Criteria

- Existing song volume and legacy plugin faders remain usable.
- Native fader command path works for list/get/set.
- Mixer UI uses audio-mix as source of truth.
- Compatibility bridge hits are attributed and bounded.
- Diagnostics stay redaction-safe.
- Rehydration and song switching do not duplicate faders or stale participants.
- The Capability Inspector explains native/compatibility source modes, unavailable faders, timeout failures, and bridge hits.
