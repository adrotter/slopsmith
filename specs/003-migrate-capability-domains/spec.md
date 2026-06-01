# Feature Specification: Incremental Capability Domain Migration and Deprecation

**Feature Branch**: `003-migrate-capability-domains`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "Create a specification for Incremental Capability Domain Migration and Deprecation in Slopsmith. After PR #245 lands, future capability domains should not only add new contracts; each domain slice must also improve the architecture of the part of the app it touches, preserve compatibility, stage deprecation, surface diagnostics, and avoid accumulating legacy behavior in the central frontend host."

## Clarifications

### Session 2026-05-29

- Q: What artifact should enforce that future domain specs actually follow this migration standard? → A: Central reference plus per-domain checklist: each domain spec must include a completed migration/deprecation checklist derived from this standard.
- Q: What minimum adoption gate should be required before a legacy surface can be marked removable? → A: Bundled plus external review plus warning window: removable only after bundled migration, documented external review, migration notes, and at least one release/notice period with warnings or compatibility diagnostics.
- Q: How should future domain slices prove “no net increase in legacy-only integration points”? → A: Per-slice legacy inventory: each domain records legacy surfaces added, removed, migrated, contained, and remaining.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define A Domain Slice With Migration Guardrails (Priority: P1)

A maintainer preparing a future capability domain needs a repeatable standard that explains what the domain must own, how it must preserve current behavior, what legacy surface it must isolate, and how it proves the new capability path is ready.

**Why this priority**: This is the core value of the feature. Without a required standard, future domains can add new capability contracts while leaving the old coupling and silent failure modes in place.

**Independent Test**: Can be tested by reviewing a proposed domain specification against this migration standard and confirming it either satisfies every required section or is blocked before planning.

**Acceptance Scenarios**:

1. **Given** a maintainer is drafting a new capability domain, **When** they apply this standard, **Then** the draft identifies the domain owner, participants, public commands, provider operations, events, safety class, diagnostics expectations, compatibility bridge, deprecation path, migration notes, and tests.
2. **Given** a proposed domain lacks a real host workflow, **When** the maintainer checks it against this standard, **Then** the domain remains roadmap-only and is not promoted into an active capability contract.
3. **Given** a proposed domain would add new behavior without isolating related legacy behavior, **When** the domain is reviewed, **Then** the proposal is marked incomplete until it explains how that domain area becomes cleaner.

---

### User Story 2 - Preserve Existing Plugin And User Behavior During Migration (Priority: P2)

A plugin author or user with existing workflows needs future domain migrations to preserve current behavior while a new capability path becomes available.

**Why this priority**: Slopsmith relies on bundled and external plugins. A migration standard that breaks current users or requires all plugin authors to migrate immediately would slow adoption and create avoidable regressions.

**Independent Test**: Can be tested by selecting a legacy behavior in a domain slice and verifying both the legacy path and the new capability path produce equivalent user-visible outcomes during the compatibility period.

**Acceptance Scenarios**:

1. **Given** a plugin still uses a legacy surface covered by a new domain, **When** the domain slice ships, **Then** the plugin continues to work through a documented compatibility bridge unless that legacy surface is confirmed unused.
2. **Given** a bundled plugin is updated after a replacement capability exists, **When** it adds new behavior in that domain, **Then** it uses the new domain path instead of adding new legacy-only coupling.
3. **Given** an external plugin has not migrated yet, **When** a user opens diagnostics or the Capability Inspector, **Then** they can see that the plugin is operating through compatibility rather than native capability participation.

---

### User Story 3 - Diagnose Capability And Compatibility Failures (Priority: P3)

A support maintainer investigating a bug needs diagnostics and the Capability Inspector to show which domain owner, participant, compatibility bridge, or legacy surface was involved and what outcome occurred.

**Why this priority**: Many current failures are hard to debug because ownership is unclear, plugin load order matters, and legacy behavior can silently no-op.

**Independent Test**: Can be tested by simulating handled, denied, overridden, unsupported, no-owner, no-handler, incompatible, and failed outcomes for a domain slice and confirming the support surface explains each result without reading private plugin state.

**Acceptance Scenarios**:

1. **Given** a capability request cannot run because no owner is active, **When** diagnostics are exported, **Then** the support data identifies the affected domain and reports a no-owner outcome.
2. **Given** a compatibility bridge is used, **When** the Capability Inspector shows the domain, **Then** it identifies the bridge and the associated legacy usage.
3. **Given** a manual user action overrides automation, **When** support data is reviewed, **Then** the outcome is shown as overridden rather than failed or silently ignored.

---

### User Story 4 - Stage Deprecation Without Big-Bang Removal (Priority: P4)

A release maintainer needs a clear deprecation process so old globals, wrapper chains, manifest fields, DOM injection patterns, and private-state access can be retired safely over time.

**Why this priority**: The project needs to avoid a future where new capability domains exist but old code remains forever as a second untracked architecture.

**Independent Test**: Can be tested by reviewing a domain slice and confirming each affected legacy surface has a declared deprecation state, adoption gate, and removal condition.

**Acceptance Scenarios**:

1. **Given** a replacement path exists for a legacy surface, **When** the domain slice is complete, **Then** the legacy surface has an explicit state: supported compatibility, deprecated with warning, blocked for new bundled code, or removable.
2. **Given** a legacy surface is still used by bundled plugins or documented external integrations, **When** removal is proposed, **Then** removal is blocked until adoption gates are satisfied.
3. **Given** a legacy surface is confirmed unused by bundled code, **When** removal is proposed, **Then** the slice may mark it removable only after documented external usage review, migration notes, and at least one release or notice period with warnings or compatibility diagnostics.

---

### Edge Cases

- A domain is useful as a future concept but has no concrete host workflow yet; it must remain documentation or roadmap material until a real workflow exists.
- A domain slice touches behavior used by external plugins whose adoption state is unknown; compatibility must remain unless the project has documented evidence that removal is safe.
- Two domain slices need to change the same capability runtime primitive; the later slice must wait or include an explicit coordination plan before implementation begins.
- A domain cannot fully isolate all related legacy behavior in one slice; the slice must still prevent new legacy-only growth and document residual legacy behavior with owner, risk, follow-up gate, and legacy-inventory status.
- A compatibility bridge fails or is disabled; diagnostics must distinguish bridge failure from native capability failure.
- A domain is sensitive or privileged; promotion requires additional safety, redaction, consent, or confirmation requirements before active use.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The standard MUST define a repeatable central migration checklist that every future capability domain specification must satisfy before planning.
- **FR-002**: Each future domain specification MUST include a completed per-domain migration and deprecation checklist derived from the central migration checklist.
- **FR-003**: Each domain slice MUST include a per-slice legacy inventory that records legacy surfaces added, removed, migrated, contained, and remaining for the domain area.
- **FR-004**: Each domain slice MUST identify its domain owner, participant roles, public commands, provider operations when applicable, emitted or observed events, safety class, and diagnostics expectations.
- **FR-005**: Each domain slice MUST introduce or reuse a domain host boundary so new behavior does not continue to accumulate only through legacy global behavior, wrapper chains, direct DOM mutation, or private state access.
- **FR-006**: Each domain slice MUST move, isolate, encapsulate, or explicitly contain the relevant legacy behavior for that domain so the area has no net increase in legacy-only surface.
- **FR-007**: Each domain slice MUST preserve existing user and plugin behavior through a compatibility bridge during migration unless the affected legacy surface is documented as unused.
- **FR-008**: Each domain slice MUST emit diagnostics for handled, denied, overridden, unsupported, no-owner, no-handler, incompatible, and failed outcomes when those outcomes are possible for the domain.
- **FR-009**: Each domain slice MUST make its owner, participants, compatibility bridge, legacy usage, and outcome state visible in the Capability Inspector or an equivalent support surface.
- **FR-010**: Each affected legacy surface MUST have a staged deprecation state: supported compatibility, deprecated with warning, blocked for new bundled code, or removable.
- **FR-011**: A legacy surface MUST NOT be marked removable until bundled usage has migrated or been removed, documented external usage has been reviewed, migration notes exist, and at least one release or notice period has emitted warnings or compatibility diagnostics.
- **FR-012**: Once a replacement path exists, new bundled code in that domain MUST be prevented from adding new usage of the deprecated legacy pattern.
- **FR-013**: Each domain slice MUST include tests or review evidence proving the new capability path and compatibility path produce equivalent user-visible behavior during the transition.
- **FR-014**: Each domain slice MUST include migration notes for plugin authors that explain the new domain path, the compatibility period, deprecation signals, and removal gates.
- **FR-015**: The standard MUST define how parallel domain work is coordinated so multiple slices do not make incompatible changes to the same shared capability runtime behavior at the same time.
- **FR-016**: The standard MUST treat app-structure improvement as a required outcome of each domain slice, not as optional cleanup deferred to a later unspecified effort.
- **FR-017**: The standard MUST keep future domain promotion scoped to domains with real host workflows and MUST exclude purely speculative domains from active runtime contracts.
- **FR-018**: The standard MUST preserve the priority order for initial future domain consideration: audio graph/session, song ingest/jobs, player UI surfaces, playback/transport, and note detection, as validated by SC-009.

### Key Entities

- **Migration Standard**: The reference rule set that future domain specifications must follow before planning and implementation.
- **Central Migration Checklist**: The canonical checklist in the reference standard that defines the required migration, compatibility, diagnostics, and deprecation gates for future domain specs.
- **Per-Domain Migration Checklist**: The checklist included with a specific domain specification to prove that the domain applied the central migration checklist before planning.
- **Domain Slice**: A focused migration effort for one capability domain or tightly related domain family.
- **Domain Host Boundary**: The owned app surface that coordinates a domain and prevents new behavior from depending only on legacy globals or private state.
- **Legacy Surface**: An existing integration point such as a global function, wrapper chain, manifest field, DOM injection pattern, private state access, or plugin-specific handshake.
- **Per-Slice Legacy Inventory**: The domain-specific record of legacy surfaces added, removed, migrated, contained, and remaining after a domain slice.
- **Compatibility Bridge**: A transitional path that preserves existing behavior while routing, attributing, or diagnosing legacy usage during migration.
- **Deprecation State**: The lifecycle status assigned to a legacy surface: supported compatibility, deprecated with warning, blocked for new bundled code, or removable.
- **Adoption Gate**: A measurable condition that must be satisfied before a legacy surface can move to a stricter deprecation state or be removed.
- **Diagnostics Outcome**: A recorded result explaining what happened when a capability or compatibility request was attempted.
- **Migration Notes**: Plugin-author guidance explaining how to move from a legacy surface to the new domain path.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of future active domain specifications include a completed per-domain migration checklist derived from the central migration checklist before they proceed to planning.
- **SC-002**: 100% of promoted domains document at least one architecture improvement for the domain area, such as isolating a legacy surface, reducing private-state coupling, or establishing an owned host boundary.
- **SC-003**: 100% of promoted domains provide diagnostics or Inspector evidence for applicable capability and compatibility outcomes.
- **SC-004**: For each promoted domain, all bundled behavior affected by a covered legacy surface either migrates to the new path or is explicitly covered by a compatibility bridge before release.
- **SC-005**: No promoted domain introduces a net increase in legacy-only integration points for the domain area, as shown by its per-slice legacy inventory.
- **SC-006**: No legacy surface is marked removable until its adoption gate has documented evidence covering bundled migration, external usage review, migration notes, and at least one release or notice period of warnings or compatibility diagnostics.
- **SC-007**: Support maintainers can identify the domain, participant, compatibility bridge if any, and request outcome for a representative failure in under 5 minutes using the available support surface.
- **SC-008**: Parallel domain planning produces no unresolved conflicts over shared runtime behavior; any overlap is documented with owner, sequence, and compatibility impact before implementation begins.
- **SC-009**: 100% of reviewed initial-promotion decisions list selected domains in the declared priority order: audio graph/session, song ingest/jobs, player UI surfaces, playback/transport, and note detection. Any skipped higher-priority domain must have documented owner, risk, and follow-up gate evidence before planning readiness can pass.

## Assumptions

- PR #245 has landed or is treated as the baseline, providing `capability-pipelines.v1`, diagnostics, the Capability Inspector, and `library` as the first native domain.
- Future domain specifications will cite this migration standard as a reference rather than duplicating all policy text.
- Existing users and external plugins may lag behind bundled plugin migration, so compatibility must be preserved by default.
- Deprecation timelines are release-policy decisions and will be finalized per domain slice, but every slice must define adoption gates before removal and removability requires bundled migration, external review, migration notes, and a warning or compatibility-diagnostics window.
- This feature defines the migration standard; it does not implement audio graph/session, song ingest/jobs, player UI surfaces, playback/transport, or note detection directly.
- No frontend framework migration, full frontend rewrite, or immediate removal of legacy plugin APIs is part of this feature.
