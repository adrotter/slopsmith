# Tasks: Plugin Capability Pipelines

**Input**: Design documents from `/specs/002-plugin-capability-pipelines/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)
**Tests**: Included because the specification explicitly requires behavioral validation for runtime coordination, diagnostics redaction, diagnostics size limits, and plugin lifecycle behavior.
**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently after shared foundations are complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or has no dependency on incomplete tasks.
- **[Story]**: User story label for story phases only.
- Every task includes an exact repository path.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the reusable fixtures and harness needed for behavioral runtime tests.

- [X] T001 Create isolated browser-runtime test harness in tests/js/capabilities_test_harness.js
- [X] T002 [P] Create valid owner/provider manifest fixture in tests/fixtures/plugin_capabilities/valid_owner_provider.json
- [X] T003 [P] Create valid requester/observer manifest fixture in tests/fixtures/plugin_capabilities/valid_requester_observer.json
- [X] T004 [P] Create invalid capability metadata fixture in tests/fixtures/plugin_capabilities/invalid_capability_metadata.json
- [X] T005 [P] Create unsupported capability version fixture in tests/fixtures/plugin_capabilities/unsupported_capability_version.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared capability constants, validation shapes, and diagnostic helpers before user-story work begins.

**Critical**: No user story implementation should begin until this phase is complete.

- [X] T006 Define capability API version, outcome, role, ownership-policy, safety-class, and compatibility constants in static/capabilities.js
- [X] T007 [P] Add manifest capability validation result and warning collection helpers in plugins/__init__.py
- [X] T008 Add redaction-safe diagnostics serialization and byte-size accounting helpers in static/capabilities.js
- [X] T009 [P] Add capability metadata placeholders to diagnostics bundle plugin summaries in lib/diagnostics_bundle.py

**Checkpoint**: Capability foundations are ready and user-story phases can proceed.

---

## Phase 3: User Story 1 - Land a Trustworthy First Slice (Priority: P1) - MVP

**Goal**: Deliver a coherent first slice with manifest intent, runtime participants, idempotent hydration, claim-dispatch-release, user override behavior, minimum lifecycle cleanup, diagnostics/pipeline support domains, the bundled inspector, and the `library` provider-coordinator workflow.

**Independent Test**: Load manifest declarations before runtime registration, exercise the `library` owner/provider/requester/observer graph including local and plugin-backed providers, dispatch claim-backed runtime commands through a synthetic owner/requester fixture, apply a manual user override, rehydrate the plugin list three times, unregister requester and owner participants, and confirm diagnostics explain every decision with exactly one active participant/handler set, released requester claims, orphaned owner/handler claims, no stale restore snapshot reuse, and no runtime enable/disable state recorded as a user override.

### Tests for User Story 1

- [X] T010 [P] [US1] Add manifest-versus-runtime participant and idempotent registration tests in tests/js/capabilities_manifest_runtime.test.js
- [X] T011 [P] [US1] Add synthetic owner/requester claim, dispatch, release, manual override, and restore snapshot cleanup tests in tests/js/capabilities_claims.test.js
- [X] T012 [P] [US1] Add requester-release, owner-handler-orphan, stale handler, and enable-disable-not-override tests in tests/js/capabilities_lifecycle.test.js
- [X] T013 [P] [US1] Add plugin hydration idempotence regression coverage in tests/test_plugin_runtime_idempotence.py

### Implementation for User Story 1

- [X] T014 [US1] Implement manifest participant versus runtime participant separation in static/capabilities.js
- [X] T015 [US1] Implement claim, dispatch, release, terminal manual override, and restore snapshot cleanup behavior in static/capabilities.js
- [X] T016 [US1] Implement requester-release, owner-handler orphan, non-dispatchable stale handler, and enable-disable-not-override semantics in static/capabilities.js
- [X] T017 [US1] Register plugin manifest capability declarations idempotently during plugin hydration in static/app.js
- [X] T018 [US1] Prevent duplicate wrappers, listeners, handlers, UI contributions, diagnostics contributors, and participants during rehydration in static/app.js
- [X] T019 [US1] Unregister disappeared first-slice plugin runtime handlers and UI contributions during hydration refresh in static/app.js
- [X] T020 [US1] Expose first-slice declared intent, runtime handlers, claims, overrides, lifecycle transitions, and recent decisions through client diagnostics in static/diagnostics.js

**Checkpoint**: User Story 1 is independently functional and is the suggested MVP review scope.

---

## Phase 4: User Story 2 - Give Plugin Authors a Clear Contract (Priority: P1)

**Goal**: Publish and enforce the capability manifest contract so plugin authors can validate owner/provider, requester, and observer declarations against versioned rules.

**Independent Test**: Validate sample manifests and recipe examples against the published contract, load them through the plugin API, and confirm valid declarations appear as compatible while invalid capability metadata is excluded from the graph, compatibility shim metadata is recorded for legacy surfaces, and unsupported versions never execute runtime handlers.

### Tests for User Story 2

- [X] T021 [P] [US2] Add manifest contract fixture tests for valid and invalid capability declarations in tests/test_plugin_manifest_contract.py
- [X] T022 [P] [US2] Add unsupported capability-pipelines version behavior tests in tests/js/capabilities_versioning.test.js
- [X] T023 [P] [US2] Add /api/plugins metadata exposure tests for standards, capabilities, UI contributions, runtime domains, warnings, shim metadata, and unsupported versions in tests/test_plugins.py
- [X] T024 [P] [US2] Add recipe example schema validation and plugin metadata loading tests in tests/test_plugin_manifest_contract.py

### Implementation for User Story 2

- [X] T025 [US2] Publish the machine-readable manifest schema from the spec contract in docs/plugin-manifest.schema.json
- [X] T026 [US2] Enforce capability metadata roles, commands, events, compatibility modes, ownership, safety, and version validation in plugins/__init__.py
- [X] T027 [US2] Preserve valid legacy nav, screen, settings, routes, and visualization surfaces when capability metadata is invalid in plugins/__init__.py
- [X] T028 [US2] Record compatibility shim source, target capability, legacy surface, status, and reason while normalizing legacy surfaces in plugins/__init__.py
- [X] T029 [US2] Include validation warnings, unsupported-version metadata, and compatibility shim metadata in /api/plugins responses in server.py
- [X] T030 [US2] Mark incompatible runtime participants unavailable and prevent their handlers from executing in static/capabilities.js
- [X] T031 [US2] Document manifest fields, version compatibility, invalid-metadata behavior, and shim metadata in docs/capability-domains.md
- [X] T032 [US2] Add owner/provider, requester, and observer recipes with extractable manifest examples in docs/capability-recipes.md

**Checkpoint**: User Story 2 is independently functional for plugin author contract validation and compatibility diagnostics.

---

## Phase 5: User Story 3 - Coordinate Plugins Through Boring Ownership Rules (Priority: P1)

**Goal**: Route capability commands through deterministic ownership policies with observable conflicts and predictable no-owner, no-handler, unsupported-command, and multi-provider outcomes.

**Independent Test**: Exercise exclusive duplicate owners, multi-provider policy, no owner, owner without handler, unsupported command, unregister, and re-register flows through the runtime API and confirm diagnostics match each outcome.

### Tests for User Story 3

- [X] T033 [P] [US3] Add exclusive duplicate owner, no-owner, no-handler, and unsupported-command tests in tests/js/capabilities_ownership.test.js
- [X] T034 [P] [US3] Add multi-provider ordering and selection policy tests in tests/js/capabilities_multi_provider.test.js

### Implementation for User Story 3

- [X] T035 [US3] Implement exclusive-owner conflict detection and conflict diagnostics in static/capabilities.js
- [X] T036 [US3] Implement no-owner, no-handler, unsupported-command, failed, degraded, and short-circuited dispatch outcomes in static/capabilities.js
- [X] T037 [US3] Implement explicit multi-provider policy ordering and provider summaries in static/capabilities.js
- [X] T038 [US3] Record missing provider and handler decisions in capability diagnostics in static/capabilities.js
- [X] T039 [US3] Document ownership policies, provider policies, and dispatch outcomes in docs/capability-domains.md

**Checkpoint**: User Story 3 is independently functional for deterministic capability routing.

---

## Phase 6: User Story 4 - Inspect and Support Capability State (Priority: P2)

**Goal**: Ship a bundled first-party inspector plugin/screen and diagnostics contract that expose the capability graph without leaking secrets or raw runtime objects.

**Independent Test**: Load compatible, legacy, conflicting, disabled, unsupported-version, and failing plugins; open the inspector; export diagnostics; and confirm both views show the same redacted capability graph, including compatibility shim hits, while the snapshot remains at or below 64 KB.

### Tests for User Story 4

- [X] T040 [P] [US4] Add diagnostics redaction, 64 KB snapshot trimming, and compatibility shim hit tests in tests/js/capabilities_diagnostics.test.js
- [X] T041 [P] [US4] Add server diagnostics bundle capability metadata and compatibility shim export tests in tests/test_diagnostics_bundle.py
- [X] T042 [P] [US4] Add bundled inspector browser smoke test in tests/browser/capability-inspector.spec.ts

### Implementation for User Story 4

- [X] T043 [US4] Enforce capability diagnostics snapshot trimming priority and byte budget in static/capabilities.js
- [X] T044 [US4] Implement compatibility shim registration, hit counting, attribution, and snapshot export in static/capabilities.js
- [X] T045 [US4] Export compatibility shim summaries from server diagnostics bundles in lib/diagnostics_bundle.py
- [X] T046 [US4] Add bundled capability inspector plugin manifest in plugins/capability_inspector/plugin.json
- [X] T047 [US4] Build the inspector screen shell in plugins/capability_inspector/screen.html
- [X] T048 [US4] Implement inspector snapshot loading, refresh, filters, empty states, redacted rendering, and shim-hit display in plugins/capability_inspector/screen.js
- [X] T049 [US4] Link Settings or plugin navigation to the capability inspector screen in static/app.js
- [X] T050 [US4] Document capability diagnostics schema, redaction rules, compatibility shim fields, and snapshot budget in docs/diagnostics-bundle-spec.md

**Checkpoint**: User Story 4 is independently functional for observable support and author diagnostics.

---

## Phase 7: User Story 5 - Handle Plugin Lifecycle Changes Safely (Priority: P2)

**Goal**: Extend the first-slice cleanup behavior so disable, remove, fail, reload, and rehydrate operations clean up handlers, claims, UI contributions, and diagnostics without leaving stale state behind.

**Independent Test**: Start with an active requester/owner workflow, then disable, remove, fail registration, reload, and rehydrate each participant; confirm requester disappearance releases claims, owner/handler disappearance marks claims orphaned and non-dispatchable, failed registrations do not block other plugins, and re-registration leaves one active handler set.

### Tests for User Story 5

- [X] T051 [P] [US5] Add plugin disappearance and UI contribution unmount regression tests in tests/test_plugin_runtime_idempotence.py
- [X] T052 [P] [US5] Add failed-registration, reload, and rehydrate replacement tests in tests/js/capabilities_lifecycle.test.js

### Implementation for User Story 5

- [X] T053 [US5] Implement failed registration state, stale handler removal, and non-dispatchable orphan handling in static/capabilities.js
- [X] T054 [US5] Harden repeated disable, remove, reload, and re-registration cleanup in static/capabilities.js
- [X] T055 [US5] Unmount disappeared plugin UI contributions and unregister runtime handlers during full plugin refresh in static/app.js
- [X] T056 [US5] Preserve lifecycle transition diagnostics for release, orphan, failure, unregister, and re-register decisions in static/capabilities.js
- [X] T057 [US5] Document lifecycle cleanup rules and diagnostics expectations in docs/capability-domains.md

**Checkpoint**: User Story 5 is independently functional for safe plugin lifecycle changes.

---

## Phase 8: User Story 6 - Release the Model Incrementally (Priority: P3)

**Goal**: Document the capability roadmap so future domain families ship as independently reviewable slices with owner kind, safety classification, diagnostics fields, and validation scenarios.

**Independent Test**: Pick a proposed follow-up slice and confirm it states user value, included and excluded domains, owner kind, safety class, lifecycle behavior, diagnostics fields, and validation scenarios before implementation starts.

### Implementation for User Story 6

- [X] T058 [US6] Add stable command and domain safety classifications in docs/capability-safety-matrix.md
- [X] T059 [US6] Add incremental release roadmap with included and excluded domain families in docs/capability-domains.md
- [X] T060 [US6] Add future privileged-domain enforcement gate criteria in docs/capability-domains.md

**Checkpoint**: User Story 6 is independently functional for roadmap review and future slice planning.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full implementation and update release notes.

- [X] T061 [P] Run JS syntax validation and fix issues in static/capabilities.js, static/app.js, and static/diagnostics.js
- [X] T062 [P] Run JS behavior tests and fix regressions in tests/js/*.test.js
- [X] T063 [P] Run targeted pytest coverage and fix regressions in tests/test_plugins.py, tests/test_plugin_manifest_contract.py, tests/test_diagnostics_bundle.py, and tests/test_plugin_runtime_idempotence.py
- [X] T064 [P] Run Playwright smoke coverage and fix regressions in tests/browser/basic-load.spec.ts, tests/browser/check-errors.spec.ts, and tests/browser/capability-inspector.spec.ts
- [X] T065 Update the Unreleased section for plugin capability pipelines in CHANGELOG.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all user stories.
- **Phase 3: User Story 1** depends on Phase 2 and is the MVP, including minimum lifecycle cleanup needed by Slice 1.
- **Phase 4: User Story 2** depends on Phase 2 and can run in parallel with User Story 1 after shared constants and validation shapes exist.
- **Phase 5: User Story 3** depends on Phase 2 and can run in parallel with User Stories 1 and 2 after shared dispatch/outcome constants exist.
- **Phase 6: User Story 4** depends on User Stories 1, 2, and 3 for meaningful inspector and diagnostics state.
- **Phase 7: User Story 5** depends on User Story 1 for minimum lifecycle cleanup and extends it to failure, reload, and full refresh cases.
- **Phase 8: User Story 6** depends on Phase 2 and can proceed alongside implementation once domain names and safety classes are stable.
- **Phase 9: Polish** depends on the desired story set being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundation; no dependency on other stories.
- **US2 (P1)**: Can start after Foundation; no dependency on other stories.
- **US3 (P1)**: Can start after Foundation; no dependency on other stories.
- **US4 (P2)**: Best after US1-US3 so inspector data covers real runtime, validation, ownership, and shim behavior.
- **US5 (P2)**: Requires US1 claim/lifecycle state and US3 handler/ownership outcomes.
- **US6 (P3)**: Can start after Foundation but should be finalized after story implementation confirms stable domain/safety names.

### Within Each User Story

- Write the listed tests first and confirm they fail for missing behavior.
- Implement models/helpers before services/runtime behavior.
- Implement runtime behavior before inspector or documentation that depends on live fields.
- Confirm each story's independent test before moving to the next priority slice.

---

## Parallel Execution Examples

### User Story 1

```bash
Task: "T010 Add manifest-versus-runtime participant and idempotent registration tests in tests/js/capabilities_manifest_runtime.test.js"
Task: "T011 Add synthetic owner/requester claim, dispatch, release, manual override, and restore snapshot cleanup tests in tests/js/capabilities_claims.test.js"
Task: "T012 Add requester-release, owner-handler-orphan, stale handler, and enable-disable-not-override tests in tests/js/capabilities_lifecycle.test.js"
Task: "T013 Add plugin hydration idempotence regression coverage in tests/test_plugin_runtime_idempotence.py"
```

### User Story 2

```bash
Task: "T021 Add manifest contract fixture tests for valid and invalid capability declarations in tests/test_plugin_manifest_contract.py"
Task: "T022 Add unsupported capability-pipelines version behavior tests in tests/js/capabilities_versioning.test.js"
Task: "T023 Add /api/plugins metadata exposure tests in tests/test_plugins.py"
Task: "T024 Add recipe example schema validation and plugin metadata loading tests in tests/test_plugin_manifest_contract.py"
```

### User Story 3

```bash
Task: "T033 Add exclusive duplicate owner, no-owner, no-handler, and unsupported-command tests in tests/js/capabilities_ownership.test.js"
Task: "T034 Add multi-provider ordering and selection policy tests in tests/js/capabilities_multi_provider.test.js"
```

### User Story 4

```bash
Task: "T040 Add diagnostics redaction, 64 KB snapshot trimming, and compatibility shim hit tests in tests/js/capabilities_diagnostics.test.js"
Task: "T041 Add server diagnostics bundle capability metadata and compatibility shim export tests in tests/test_diagnostics_bundle.py"
Task: "T042 Add bundled inspector browser smoke test in tests/browser/capability-inspector.spec.ts"
```

### User Story 5

```bash
Task: "T051 Add plugin disappearance and UI contribution unmount regression tests in tests/test_plugin_runtime_idempotence.py"
Task: "T052 Add failed-registration, reload, and rehydrate replacement tests in tests/js/capabilities_lifecycle.test.js"
```

### User Story 6

```bash
Task: "T058 Add stable command and domain safety classifications in docs/capability-safety-matrix.md"
Task: "T059 Add incremental release roadmap with included and excluded domain families in docs/capability-domains.md"
Task: "T060 Add future privileged-domain enforcement gate criteria in docs/capability-domains.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational constants, validation shapes, and diagnostics helpers.
3. Complete Phase 3 User Story 1.
4. Stop and validate manifest/runtime separation, `library` owner/provider/requester/observer behavior, claim-dispatch-release, user override behavior, restore snapshot cleanup, first-slice lifecycle cleanup, idempotent hydration, and first-slice diagnostics.
5. Request review for the first coherent slice before adding the inspector or broader domain roadmap.

### Incremental Delivery

1. Setup plus Foundation produces a shared test and validation base.
2. US1 lands the trustworthy core MVP, including the lifecycle cleanup required by Slice 1.
3. US2 adds the plugin author contract, validated recipes, compatibility shim metadata, and compatibility behavior.
4. US3 hardens ownership and dispatch semantics.
5. US4 adds compatibility shim hit reporting, the inspector, and support diagnostics surface.
6. US5 hardens lifecycle cleanup for failure, reload, and full plugin refresh cases.
7. US6 locks the roadmap and safety classification guidance for follow-up PRs.

### Parallel Team Strategy

1. One developer completes Phase 1 and Phase 2.
2. After Foundation, developers can split US1, US2, and US3 by runtime area because their tests and docs touch mostly separate files.
3. US4 and US5 can proceed after the relevant P1 behavior stabilizes.
4. US6 documentation can proceed in parallel but should be reviewed after runtime naming and safety classes settle.