# Implementation Plan: Audio Mix Control Plane

**Branch**: `005-audio-mix-control-plane` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-audio-mix-control-plane/spec.md`

## Summary

Make `audio-mix` the executable source of truth for player mixer faders. The implementation extends the existing `core.audio.session` host from passive participant/bridge diagnostics into a provider-coordinated control plane with fader listing, read, write, route inspection, analyser inspection, committed-value events, timeout handling, native-vs-legacy duplicate resolution, pending pre-session participants, and bounded diagnostics. The visible mixer in `static/audio-mixer.js` consumes the control plane, while `window.slopsmith.audio.registerFader(...)` remains as a compatibility adapter that registers legacy callbacks as audio-mix participants until its removal gates are met.

## Technical Context

**Language/Version**: Vanilla JavaScript in the source-served browser frontend; Python 3.12/FastAPI only for unchanged diagnostics/test harness surfaces
**Primary Dependencies**: Existing `window.slopsmith` event bus, `static/capabilities.js` (`capability-pipelines.v1`), `static/capabilities/audio-session.js`, `static/audio-mixer.js`, Web Audio APIs for existing route/analyser state, optional `window.slopsmithDesktop.audio` bridge
**Storage**: Existing `localStorage` song-volume preference plus in-memory last-committed fader cache for the active audio-mix session; plugin-owned fader persistence remains plugin-owned; no new database/schema
**Testing**: `node --check`, Node JS tests under `tests/js/`, focused Playwright/manual mixer smoke when UI behavior changes, existing pytest diagnostics tests only if diagnostics bundle shape changes
**Target Platform**: Self-hosted single-user Slopsmith browser app, served by Docker or local dev server, with optional desktop wrapper audio route
**Project Type**: Vanilla web app with FastAPI backend and plugin runtime
**Performance Goals**: 95% of successful user fader changes display committed values within 500 ms; fader read/write operations fail after 2 seconds; diagnostics snapshot remains within the existing 64 KB capability snapshot budget
**Constraints**: No frontend framework/build step; no new mandatory env vars or host paths; no raw audio buffers, raw FFT arrays, raw device labels, stable hardware identifiers, secrets, or unredacted local file paths in diagnostics; one primary active player audio-mix session at a time
**Scale/Scope**: Single local user, one primary active song/session, multiple plugin participants, native and compatibility-backed faders, pre-session participants that attach to the next active session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Result | Notes |
|-----------|--------|-------|
| I. Self-Hosted, Single-User, Docker-First | PASS | No auth, tenant model, mandatory env var, backend service, or host path is introduced. |
| II. Vanilla Frontend - No Frameworks | PASS | Plan uses source-served vanilla JS and existing browser APIs only. |
| III. Plugins Are the Extension Point | PASS | Plugins remain owners of their own output and fader persistence; core coordinates shared mixer behavior. |
| IV. Backwards-Compatible CDLC Library | PASS | No DLC file mutation, song format change, or highway WebSocket contract change is required. |
| V. Pure-Function Core Libraries, Tested | PASS | No new Python library architecture or import-time side effects are planned; coverage is focused on JS runtime and diagnostics. |
| VI. Observability Over Chattiness | PASS | Diagnostics are bounded, redaction-safe, and explain native/legacy fader outcomes without raw audio data. |
| VII. Versioned, Migration-Aware Settings | PASS | Existing song-volume persistence is preserved; plugin fader persistence remains plugin-owned; no settings import/export schema change is required. |

## Project Structure

### Documentation (this feature)

```text
specs/005-audio-mix-control-plane/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
|-- contracts/
|   |-- audio-mix-control-plane.md
|   |-- diagnostics-schema.md
|   |-- manifest-examples.md
|   |-- migration-notes.md
|   `-- testing-contract.md
`-- tasks.md              # Created later by /speckit-tasks
```

### Source Code (repository root)

```text
static/
|-- capabilities.js                  # Existing capability dispatch/timeout primitives
|-- capabilities/
|   `-- audio-session.js              # Extend audio-mix host commands, operation routing, diagnostics
|-- audio-mixer.js                    # Migrate mixer UI from local registry source-of-truth to audio-mix commands
|-- diagnostics.js                    # Existing browser diagnostics contribution namespace
`-- index.html                        # Existing script order/player controls; no framework/build changes

plugins/
`-- capability_inspector/screen.js    # Surface richer audio-mix fader, bridge, and failure diagnostics

docs/
|-- capability-domains.md             # Plugin-author guidance for native audio-mix fader participants
|-- capability-recipes.md             # Manifest recipe for native audio-mix fader providers
|-- capability-roadmap.md             # 005 status/roadmap notes when implemented
`-- capability-safety-matrix.md       # Stable audio-mix command summary updates

tests/
|-- js/
|   |-- audio_session_mix.test.js
|   |-- audio_session_compat.test.js
|   |-- audio_session_routes.test.js
|   |-- audio_session_host.test.js
|   |-- capability_inspector_render.test.js
|   `-- legacy_shim_hits.test.js
`-- browser/
    `-- check-errors.spec.ts          # Focused browser smoke when mixer DOM changes need validation
```

**Structure Decision**: Keep this migration in the existing vanilla frontend/runtime surface. The `audio-session` module remains the domain host; `audio-mixer.js` becomes a UI/client plus legacy adapter. No backend route, new service, frontend framework, or persistent schema is needed.

## Complexity Tracking

No constitutional violations are introduced. No complexity exceptions are required.

## Phase 0: Research Summary

See [research.md](research.md). Key decisions:

- Extend the existing audio-session host instead of creating a parallel mixer runtime.
- Make native participants win over matching legacy faders while recording the legacy path as compatibility-backed/overshadowed.
- Enforce a 2 second fader read/write timeout with last-committed-value recovery.
- Keep plugin fader persistence provider-owned; core persists only core song volume.
- Render known unavailable faders as disabled controls and retain them in diagnostics.
- Accept pre-session participants as pending/known and attach them to the next active audio-mix session.

## Phase 1: Design Summary

Design artifacts created:

- [data-model.md](data-model.md) defines audio mix sessions, participants, faders, operations, route/analyser summaries, bridges, outcomes, and migration state.
- [contracts/audio-mix-control-plane.md](contracts/audio-mix-control-plane.md) defines commands, provider operations, events, compatibility behavior, and public/legacy API expectations.
- [contracts/diagnostics-schema.md](contracts/diagnostics-schema.md), [contracts/manifest-examples.md](contracts/manifest-examples.md), [contracts/migration-notes.md](contracts/migration-notes.md), and [contracts/testing-contract.md](contracts/testing-contract.md) capture supporting diagnostics, declaration, migration, and validation contracts.
- [quickstart.md](quickstart.md) defines validation order and representative mixer scenarios.

## Post-Design Constitution Check

| Principle | Result | Notes |
|-----------|--------|-------|
| I. Self-Hosted, Single-User, Docker-First | PASS | Design remains local and single-user with no deployment inputs. |
| II. Vanilla Frontend - No Frameworks | PASS | UI changes stay in source-served JS and existing DOM/CSS. |
| III. Plugins Are the Extension Point | PASS | Plugin output and persistence remain plugin-owned; core only coordinates shared mixer commands. |
| IV. Backwards-Compatible CDLC Library | PASS | Playback/source formats are unchanged; route summaries are diagnostic/control metadata only. |
| V. Pure-Function Core Libraries, Tested | PASS | Planned validation is JS-focused and does not alter Python core libraries. |
| VI. Observability Over Chattiness | PASS | Failures, timeouts, bridge hits, and duplicate suppression are observable without raw audio data. |
| VII. Versioned, Migration-Aware Settings | PASS | No import/export schema changes; existing `localStorage` song-volume behavior remains compatible. |
