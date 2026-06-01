# Tasks: Audio Mix Control Plane

**Input**: Design documents from `/specs/005-audio-mix-control-plane/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included because the feature specification defines mandatory independent test scenarios and the testing contract requires focused JS/browser coverage.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested as an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks
- **[Story]**: User story label for traceability (`US1`, `US2`, `US3`, `US4`)
- Every task includes at least one exact repository file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared documentation and command inventory before implementation starts.

- [X] T001 [P] Update the audio-mix control-plane roadmap status and migration scope in docs/capability-roadmap.md
- [X] T002 [P] Update the audio-mix stable commands and provider operations in docs/capability-safety-matrix.md
- [X] T003 [P] Add native audio-mix fader provider migration guidance to docs/capability-recipes.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared runtime/test infrastructure that all user stories depend on.

**Critical**: No user story work should begin until this phase is complete.

- [X] T004 [P] Extend audio-session JS test helpers for mixer loading, event capture, deterministic timers, and diagnostics snapshots in tests/js/audio_session_test_harness.js
- [X] T005 Add audio-mix constants and normalization helpers for required participant kinds, fader ids, source modes, availability, timeout, logical keys, and numeric ranges in static/capabilities/audio-session.js
- [X] T006 Implement pending audio-mix participant/session attachment state for idle, pending, active, stopped, and degraded sessions in static/capabilities/audio-session.js
- [X] T007 Implement canonical participant and fader summary storage with deterministic ordering in static/capabilities/audio-session.js
- [X] T008 Extend the audio-mix owner registration with list/get/set/route/analyser commands and event names, including fader-unavailable, in static/capabilities/audio-session.js

**Checkpoint**: The audio-mix host can represent the new model and expose the command surface, even if individual commands still return degraded or placeholder results.

---

## Phase 3: User Story 1 - Adjust Any Available Mix Fader (Priority: P1)

**Goal**: A player can open the mixer, see each available mix source once, change a fader, and see the committed value accepted by the owning source.

**Independent Test**: Register song and plugin mix sources, open the mixer, change each fader, and confirm the displayed values match committed provider values including clamped/normalized results.

### Tests for User Story 1

- [X] T009 [US1] Add audio-mix list-faders, required participant-kind, get-fader-value, set-fader-value, committed-value, clamp/normalize, invalid-value, fader-unavailable, 500 ms committed-display latency, and 2 second timeout tests in tests/js/audio_session_mix.test.js
- [X] T010 [P] [US1] Add browser smoke assertions for opening the mixer, disabled controls, committed labels within 500 ms, and stable failed state in tests/browser/check-errors.spec.ts

### Implementation for User Story 1

- [X] T011 [US1] Implement audio-mix list-faders command with available/unavailable fader summaries and required song/plugin/stem/monitoring/preview participant kinds in static/capabilities/audio-session.js
- [X] T012 [US1] Implement audio-mix get-fader-value command with provider operation routing and committed-value cache in static/capabilities/audio-session.js
- [X] T013 [US1] Implement audio-mix set-fader-value command with range validation, requested/committed/rejected values, 2 second timeout handling, fader-unavailable, and fader value events in static/capabilities/audio-session.js
- [X] T014 [US1] Register core song audio as a core-owned audio-mix participant and fader while preserving existing song-volume callbacks in static/audio-mixer.js
- [X] T015 [US1] Migrate player mixer rendering to call audio-mix list-faders, get-fader-value, and set-fader-value commands as source of truth in static/audio-mixer.js
- [X] T016 [US1] Render committed values, pending state, disabled unavailable faders, and failed fader state in static/audio-mixer.js
- [X] T017 [US1] Validate the native fader, required participant-kind, committed-value latency, unavailable-fader, and timeout scenarios from specs/005-audio-mix-control-plane/quickstart.md

**Checkpoint**: User Story 1 is independently functional; native/core faders can be listed, read, written, and displayed without relying on the legacy fader registry as the player UI source of truth.

---

## Phase 4: User Story 2 - Migrate Plugin Faders Without Breaking Existing Plugins (Priority: P2)

**Goal**: Native audio-mix participants work for migrated plugins while legacy `registerFader(...)` integrations remain usable and diagnosable during the compatibility period.

**Independent Test**: Register one native participant and one legacy fader, then confirm both are usable through the same mixer experience and attributed correctly in diagnostics.

### Tests for User Story 2

- [X] T018 [US2] Add legacy registerFader, unregisterFader, getFaders, and compatibility-backed operation tests in tests/js/audio_session_compat.test.js
- [X] T019 [P] [US2] Add native-over-legacy duplicate suppression and overshadowed bridge-hit tests in tests/js/legacy_shim_hits.test.js

### Implementation for User Story 2

- [X] T020 [US2] Adapt window.slopsmith.audio.registerFader and unregisterFader to register compatibility-backed audio-mix participants in static/audio-mixer.js
- [X] T021 [US2] Wrap legacy getValue and setValue callbacks as fader.get-value and fader.set-value provider operations in static/audio-mixer.js
- [X] T022 [US2] Implement native-over-legacy logical fader suppression and compatibility-backed/overshadowed diagnostics in static/capabilities/audio-session.js
- [X] T023 [US2] Preserve window.slopsmith.audio.getFaders for external compatibility while keeping the player mixer sourced from audio-mix commands in static/audio-mixer.js
- [X] T024 [US2] Document native fader registration, compatibility bridge behavior, and removal gates in docs/capability-domains.md
- [X] T025 [US2] Validate the native-vs-legacy migration scenario from specs/005-audio-mix-control-plane/quickstart.md

**Checkpoint**: User Story 2 is independently functional; migrated and legacy plugin faders can coexist without duplicate user-visible controls.

---

## Phase 5: User Story 3 - Diagnose Mix Routing And Fader Failures (Priority: P3)

**Goal**: Maintainers can inspect/export diagnostics that explain participants, faders, routes, analyser summaries, bridges, and recent failures without exposing raw audio data.

**Independent Test**: Force successful, unavailable, denied, degraded, unsupported, timeout, and failed fader outcomes, then confirm diagnostics identify safe participant/operation metadata and omit raw audio data.

### Tests for User Story 3

- [X] T026 [US3] Add diagnostics tests for audio-mix participants, fader summaries, route summaries, analyser summaries, bridge hits, timeout outcomes, and redaction in tests/js/audio_session_host.test.js
- [X] T027 [P] [US3] Add Capability Inspector render tests for audio-mix fader availability, native/compatibility source modes, failed outcomes, and timeout badges in tests/js/capability_inspector_render.test.js

### Implementation for User Story 3

- [X] T028 [US3] Extend audio-session diagnostics with full audio-mix session, participant, fader, bridge, and recent outcome fields in static/capabilities/audio-session.js
- [X] T029 [US3] Implement inspect-route and inspect-analyser commands with redaction-safe payloads in static/capabilities/audio-session.js
- [X] T030 [US3] Record bounded fader, route, analyser, and legacy bridge outcomes with safe reason text in static/capabilities/audio-session.js
- [X] T031 [US3] Render audio-mix participant source modes, fader availability, route/analyser summaries, bridge hits, and failure states in plugins/capability_inspector/screen.js
- [X] T032 [US3] Document audio-mix diagnostics payloads and redaction rules in docs/capability-domains.md
- [X] T033 [US3] Validate the diagnostics, route, analyser, and raw-data exclusion scenarios from specs/005-audio-mix-control-plane/quickstart.md

**Checkpoint**: User Story 3 is independently functional; diagnostics and the inspector explain audio-mix behavior without leaking raw audio, FFT data, device labels, secrets, or local paths.

---

## Phase 6: User Story 4 - Keep Mixer Behavior Stable Across Sessions (Priority: P4)

**Goal**: Existing song volume preferences and plugin faders remain stable across reloads, screen changes, song switches, route changes, and repeated plugin hydration.

**Independent Test**: Change song and plugin faders, reload or rehydrate plugin scripts, switch songs/routes, and confirm values, labels, duplicate prevention, and pending participant attachment remain stable.

### Tests for User Story 4

- [X] T034 [US4] Add rehydration, duplicate-prevention, pre-session registration, unavailable participant, and song-switch cleanup tests in tests/js/audio_session_mix.test.js
- [X] T035 [P] [US4] Add route summary and song-volume persistence regression tests for HTML5, stem-backed, and optional desktop routes in tests/js/audio_session_routes.test.js

### Implementation for User Story 4

- [X] T036 [US4] Preserve existing song-volume localStorage fallback and optional desktop backing gain behavior through audio-mix in static/audio-mixer.js
- [X] T037 [US4] Make startSession, stopSession, and song switching clear stale route participants while retaining pending known participants in static/capabilities/audio-session.js
- [X] T038 [US4] Make audio-mix participant registration idempotent across repeated plugin hydration in static/capabilities/audio-session.js
- [X] T039 [US4] Refresh an open mixer from audio-mix events without duplicate event listeners or stale DOM controls in static/audio-mixer.js
- [X] T040 [US4] Keep Stems provider ownership intact while exposing only stem mix participation and route summary metadata in static/capabilities/audio-session.js
- [X] T041 [US4] Validate the persistence, rehydration, pre-session, song-switching, and route-switching scenarios from specs/005-audio-mix-control-plane/quickstart.md

**Checkpoint**: User Story 4 is independently functional; normal playback sessions remain stable after migration.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation, validation, and cleanup across all stories.

- [X] T042 [P] Update implementation-specific validation commands and manual scenarios in specs/005-audio-mix-control-plane/quickstart.md
- [X] T043 [P] Add changelog entry for the audio-mix control-plane migration in CHANGELOG.md
- [X] T044 Run JavaScript syntax checks for static/capabilities.js, static/capabilities/audio-session.js, static/audio-mixer.js, and plugins/capability_inspector/screen.js using specs/005-audio-mix-control-plane/quickstart.md
- [X] T045 Run the focused Node audio-mix test suite listed in specs/005-audio-mix-control-plane/quickstart.md
- [X] T046 Run the focused browser and diagnostics validation listed in specs/005-audio-mix-control-plane/quickstart.md when static/audio-mixer.js or diagnostics payloads change
- [X] T047 Verify implementation and documentation remain within the non-goals for playback, note detection, audio input selection, recording, audio effects, jobs, and plugin lifecycle in specs/005-audio-mix-control-plane/spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; documentation tasks can start immediately.
- **Foundational (Phase 2)**: Depends on Setup for final terminology and blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion.
- **Polish (Phase 7)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Start after Foundational; provides MVP native/core fader execution.
- **User Story 2 (P2)**: Start after Foundational; can run in parallel with US1 after shared model is ready, but final UI behavior should be checked against US1.
- **User Story 3 (P3)**: Start after Foundational; diagnostics can be developed in parallel with US1/US2 once outcome records exist.
- **User Story 4 (P4)**: Start after Foundational; best completed after US1/US2 so lifecycle tests cover both native and compatibility-backed faders.

### Within Each User Story

- Tests first; confirm they fail before implementation.
- Host/runtime changes before UI consumption.
- UI changes before manual/browser validation.
- Documentation updates before final quickstart validation.

---

## Parallel Opportunities

- T001, T002, and T003 can run in parallel.
- T004 can run in parallel with T005 once terminology is stable.
- T010 can run in parallel with T009 because it targets browser smoke coverage in a different file.
- T019 can run in parallel with T018 because duplicate suppression and shim-hit coverage live in a separate test file.
- T027 can run in parallel with T026 because inspector rendering tests are separate from audio-session diagnostics tests.
- T035 can run in parallel with T034 because route persistence coverage is in a separate file.
- T042 and T043 can run in parallel during polish.

---

## Parallel Example: User Story 1

```text
Task: T009 Add audio-mix command tests in tests/js/audio_session_mix.test.js
Task: T010 Add browser smoke assertions in tests/browser/check-errors.spec.ts
```

## Parallel Example: User Story 2

```text
Task: T018 Add compatibility adapter tests in tests/js/audio_session_compat.test.js
Task: T019 Add duplicate suppression bridge tests in tests/js/legacy_shim_hits.test.js
```

## Parallel Example: User Story 3

```text
Task: T026 Add diagnostics snapshot tests in tests/js/audio_session_host.test.js
Task: T027 Add inspector render tests in tests/js/capability_inspector_render.test.js
```

## Parallel Example: User Story 4

```text
Task: T034 Add lifecycle stability tests in tests/js/audio_session_mix.test.js
Task: T035 Add route persistence tests in tests/js/audio_session_routes.test.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for User Story 1.
3. Stop and validate native/core fader list, read, write, committed-value, unavailable, and timeout behavior.
4. Demo the mixer using native audio-mix commands before adding compatibility and diagnostics depth.

### Incremental Delivery

1. Foundation: shared model, normalization, command registration, and test helpers.
2. MVP: US1 native/core fader execution and mixer UI consumption.
3. Migration: US2 legacy compatibility adapter and duplicate suppression.
4. Supportability: US3 diagnostics and inspector details.
5. Stability: US4 persistence, rehydration, pre-session, and route-switching behavior.
6. Polish: docs, changelog, syntax checks, JS tests, browser smoke, and diagnostics validation.

### Scope Control

This task list intentionally excludes playback transport, note detection, audio input selection, monitoring lifecycle, recording, audio effects, jobs, backend routes, and plugin lifecycle work except where existing tests require preserving behavior.
