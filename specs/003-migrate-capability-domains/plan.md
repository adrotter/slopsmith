# Implementation Plan: Incremental Capability Domain Migration and Deprecation

**Branch**: `003-migrate-capability-domains` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/003-migrate-capability-domains/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Define the reference migration standard that every future Slopsmith capability-domain spec must follow after PR #245. The plan produces documentation and contract artifacts for a central migration checklist, per-domain migration checklist, per-slice legacy inventory, staged deprecation gates, diagnostics/Inspector expectations, and parallel-domain coordination rules. This feature does not implement audio, ingest, UI, playback, or note-detection domains; it creates the reusable gate those domain specs must pass so each slice leaves its app area cleaner than before.

## Technical Context

**Language/Version**: Markdown and JSON documentation in the existing Spec Kit/repo docs structure; future implementation examples remain compatible with Python 3.12 backend and vanilla JavaScript frontend  
**Primary Dependencies**: Existing Spec Kit workflow, `.specify` templates, Slopsmith capability docs, Capability Inspector expectations, diagnostics bundle expectations, pytest/Node/Playwright validation conventions  
**Storage**: Repository documentation and specification artifacts only; no database, localStorage, or settings schema changes in this feature  
**Testing**: Spec quality checklist, markdown/source review, placeholder/clarification grep, and future domain checklist validation; later domain slices use pytest, `npm run test:js`, and Playwright as appropriate  
**Target Platform**: Slopsmith maintainers, plugin authors, and support workflows in the self-hosted single-user Slopsmith repo  
**Project Type**: Documentation/process contract for a web app and plugin ecosystem; no runtime feature implementation in this slice  
**Performance Goals**: Support maintainers can identify domain, participant, compatibility bridge, and outcome for representative failures in under 5 minutes; future diagnostics payloads remain bounded by each domain plan  
**Constraints**: No frontend framework, no JS build step, no immediate legacy plugin API removal, no speculative active domains, no breaking changes without staged deprecation, no new mandatory environment variables  
**Scale/Scope**: Applies to all future active capability domain specs, starting with audio graph/session, song ingest/jobs, player UI surfaces, playback/transport, and note detection

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Self-Hosted, Single-User, Docker-First**: PASS. The feature adds planning/documentation contracts only and introduces no auth, multi-user model, external service, mandatory path, or runtime dependency.

**II. Vanilla Frontend - No Frameworks**: PASS. The standard explicitly forbids using future domain migration as a reason to introduce a frontend framework or build pipeline. Future host boundaries must remain compatible with source-served vanilla JavaScript.

**III. Plugins Are the Extension Point - Isolated by `load_sibling`**: PASS. The standard preserves external plugin compatibility, requires migration notes for plugin authors, and keeps plugin behavior behind declared capability/domain contracts rather than private coupling.

**IV. Backwards-Compatible CDLC Library**: PASS. This reference standard does not alter DLC files, PSARC/sloppak scanning, arrangement IDs, or highway WebSocket contracts. Future domain slices must preserve existing user-visible behavior through compatibility bridges.

**V. Pure-Function Core Libraries, Tested**: PASS. No new `lib/` runtime code is planned here. Future domain slices remain responsible for pure helper coverage where they add backend logic.

**VI. Observability Over Chattiness**: PASS. Diagnostics and Inspector visibility are required gates for future domains, including explicit outcomes for handled, denied, overridden, unsupported, no-owner, no-handler, incompatible, and failed states.

**VII. Versioned, Migration-Aware Settings**: PASS. The standard requires staged deprecation and migration notes, and forbids immediate removal of legacy plugin APIs without adoption gates and warning/diagnostics windows.

**Gate Result**: PASS. No constitutional violations or unresolved clarifications.

## Project Structure

### Documentation (this feature)

```text
specs/003-migrate-capability-domains/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── migration-standard.md
│   ├── per-domain-checklist.md
│   └── legacy-inventory.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.github/
└── copilot-instructions.md      # Points agents at this feature plan while active

docs/
├── capability-roadmap.md        # Existing domain roadmap to align with the migration standard
├── capability-domains.md        # Existing capability contract documentation to update during implementation
└── capability-safety-matrix.md  # Existing safety/review gates to align with the standard

plugins/
└── capability_inspector/        # Existing support UI future domain slices must keep informative

static/
├── capabilities.js              # Existing runtime substrate future slices must not rewrite incompatibly in parallel
└── capabilities/
    └── library.js               # Existing native-domain reference example
```

**Structure Decision**: Keep this feature as a documentation and contract slice in `specs/003-migrate-capability-domains/`, with later implementation tasks expected to update `docs/` and supporting guidance. No runtime code moves in this planning phase.

## Complexity Tracking

No constitutional violations.

## Phase 0 Research Summary

Research is captured in [research.md](research.md). Key decisions: enforce future domain adoption through both a central reference checklist and per-domain checklist; use per-slice legacy inventories rather than a global inventory or numeric budget; require bundled migration, external usage review, migration notes, and at least one warning/diagnostics window before removal; keep speculative domains roadmap-only; and coordinate parallel domain work through ownership/sequence documentation rather than blocking all planning.

## Phase 1 Design Summary

Design artifacts are captured in [data-model.md](data-model.md), [quickstart.md](quickstart.md), and `contracts/`.

**Contracts**:
- [contracts/migration-standard.md](contracts/migration-standard.md): central reference checklist and domain promotion gates.
- [contracts/per-domain-checklist.md](contracts/per-domain-checklist.md): required checklist future domain specs must complete before planning.
- [contracts/legacy-inventory.md](contracts/legacy-inventory.md): per-slice legacy inventory format for proving no net increase in legacy-only integration points.

**Post-Design Constitution Check**: PASS. The design remains documentation/process oriented, preserves vanilla frontend and plugin compatibility constraints, strengthens observability and staged migration, and does not introduce runtime dependencies or breaking API removals.
