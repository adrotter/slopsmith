# Implementation Plan: Plugin Capability Pipelines

**Branch**: `002-plugin-capability-pipelines` | **Date**: 2026-05-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-plugin-capability-pipelines/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Ship plugin capability pipelines incrementally so Slopsmith plugins coordinate through declared, inspectable contracts instead of private globals or wrapper chains. The plan keeps the first release slice focused on the capability registry, manifest metadata, diagnostics snapshot, idempotent hydration, invalid-metadata rejection, version compatibility, the bundled inspector, and the core `library` provider-coordinator workflow. `diagnostics` and `pipeline` ship as support domains for snapshot/export and graph operations. Later slices expand plugin-owned domains such as Stems/NAM coordination, non-sensitive app domains, and finally privileged domains with runtime enforcement gates.

## Technical Context

**Language/Version**: Python 3.12 backend; vanilla JavaScript, HTML, and CSS frontend; JSON/JSON Schema for contracts  
**Primary Dependencies**: Existing FastAPI/uvicorn backend, stdlib logging, SQLite diagnostics/settings helpers, browser DOM APIs, Node.js built-in test runner, pytest, Playwright for browser smoke tests  
**Storage**: Plugin manifests on disk; browser runtime state in memory; existing browser localStorage for preferences; diagnostics bundle JSON; no new database tables required for Slice 1  
**Testing**: `pytest`, `node --test tests/js/*.test.js`, `node --check` for changed JS, targeted Playwright coverage for the bundled inspector screen  
**Target Platform**: Self-hosted single-user Slopsmith web app in the existing Docker-first environment; browser frontend with no build step
**Project Type**: Web app with backend plugin metadata APIs, frontend runtime coordination API, and first-party bundled plugin UI  
**Performance Goals**: Capability diagnostics snapshots stay at or below 64 KB; older recent decisions trim before current state; capability handler dispatch remains bounded and must not touch per-frame chart/render data paths  
**Constraints**: No frontend framework or build pipeline; no new required environment variables; diagnostics redaction by default; invalid capability metadata cannot enter the capability graph; legacy plugin surfaces continue loading with warnings; privileged-domain enforcement is deferred to privileged-domain slices  
**Scale/Scope**: One trusted local user, dozens of installed plugins, one bundled first-party inspector plugin/screen, capability history sized for support bundles rather than long-term telemetry

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Self-Hosted, Single-User, Docker-First**: PASS. The feature adds local plugin coordination, docs, and diagnostics only. It introduces no user/account model, auth middleware, new mandatory path, or new required service.

**II. Vanilla Frontend - No Frameworks**: PASS. Runtime and inspector work must use source-served vanilla JavaScript, HTML, Tailwind-compatible classes, and existing globals. No JSX, bundler, transpiler, or framework is allowed in core.

**III. Plugins Are the Extension Point - Isolated by `load_sibling`**: PASS. The live inspector ships as a bundled first-party plugin/screen, plugin manifests remain the declared-intent source, and backend plugin behavior continues through existing loader conventions.

**IV. Backwards-Compatible CDLC Library**: PASS. The plan does not alter PSARC/sloppak scanning, DLC files, arrangement IDs, or the highway WebSocket chart contract. High-frequency chart/render reads remain outside capability commands.

**V. Pure-Function Core Libraries, Tested**: PASS. Python changes are limited to manifest/diagnostics normalization and should be covered by pytest. Browser runtime behavior must move from source-string checks toward direct JS behavior tests.

**VI. Observability Over Chattiness**: PASS. Diagnostics are a first-class output, remain redacted, stay bounded to 64 KB for capability snapshots, and expose compatibility shims and lifecycle decisions without raw live objects.

**VII. Versioned, Migration-Aware Settings**: PASS. Slice 1 does not add a new settings store or migration. Existing legacy plugin surfaces continue loading during capability metadata migration.

**Gate Result**: PASS. No constitutional violations or unresolved clarifications.

## Project Structure

### Documentation (this feature)

```text
specs/002-plugin-capability-pipelines/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
server.py                 # /api/plugins metadata response surface and app wiring

static/
├── capabilities.js      # Capability registry, dispatch, claims, diagnostics, runtime contracts
├── app.js               # Plugin hydration, manifest registration, event bridges, Settings link to inspector
├── diagnostics.js       # Client diagnostics contribution summaries and redaction-safe snapshots
└── index.html           # Runtime load order for diagnostics, capabilities, and app shell

plugins/
├── __init__.py          # Manifest metadata normalization and warnings
└── capability_inspector/
    ├── plugin.json      # Bundled first-party inspector declaration
    ├── screen.html      # Inspector screen shell
    └── screen.js        # Vanilla JS inspector UI reading capability diagnostics

lib/
└── diagnostics_bundle.py # Server diagnostics bundle plugin metadata export

docs/
├── capability-domains.md
├── capability-roadmap.md
├── capability-recipes.md
├── plugin-manifest.schema.json
├── capability-safety-matrix.md
└── diagnostics-bundle-spec.md

tests/
├── js/
│   └── capabilities-runtime.test.js
├── browser/
│   └── capability-inspector.spec.ts
├── test_plugins.py
├── test_plugin_runtime_idempotence.py
└── test_diagnostics_bundle.py
```

**Structure Decision**: Use the existing Slopsmith web app structure. Core runtime coordination stays in `static/`, `/api/plugins` response wiring stays in `server.py`, manifest and diagnostics normalization stay in `plugins/__init__.py` and `lib/diagnostics_bundle.py`, and the live inspector ships as a bundled first-party plugin under `plugins/capability_inspector/`. Contracts and authoring guidance are documented under `docs/` and mirrored by Spec Kit contracts under `specs/002-plugin-capability-pipelines/contracts/`.

## Complexity Tracking

No constitutional violations.

## Phase 0 Research Summary

Research is captured in [research.md](research.md). Key decisions: keep the first slice small and reviewable around `library` plus the `diagnostics` and `pipeline` support domains; use a machine-readable manifest contract; validate capability metadata strictly while loading legacy surfaces leniently; declare compatibility through `capability-pipelines.v1`; keep declared intent separate from live runtime handlers; enforce a 64 KB diagnostics snapshot budget; ship the inspector as a bundled first-party plugin/screen; and classify safety now while deferring runtime enforcement gates to privileged-domain slices.

## Phase 1 Design Summary

Design artifacts are captured in [data-model.md](data-model.md), [quickstart.md](quickstart.md), and `contracts/`.

**Contracts**:
- [contracts/plugin-manifest.schema.json](contracts/plugin-manifest.schema.json): plugin manifest capability metadata contract for CI and runtime validation.
- [contracts/capability-runtime.md](contracts/capability-runtime.md): browser runtime registration, claim, dispatch, override, lifecycle, and diagnostics behavior.
- [contracts/capability-diagnostics.md](contracts/capability-diagnostics.md): redaction-safe diagnostics snapshot and inspector data contract.

**Post-Design Constitution Check**: PASS. Phase 1 artifacts preserve the same constraints: no framework, no new mandatory environment variable, plugin-first inspector, redacted diagnostics, version-aware manifest metadata, and behavioral tests for runtime behavior.
