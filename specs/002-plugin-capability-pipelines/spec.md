# Feature Specification: Plugin Capability Pipelines

**Feature Branch**: `002-plugin-capability-pipelines`  
**Created**: 2026-05-24  
**Status**: Draft  
**Input**: User description: "Create a spec for the plugin-capability-pipelines PR (#245), incorporate review improvements, and define an incremental release path that keeps PRs easy to review and test while working toward the full capability model."

## Clarifications

### Session 2026-05-24

- Q: What should happen to active claims when a plugin involved in the claim disables, unloads, disappears, or fails registration? → A: Release claims when the requester disappears; mark claims orphaned and non-dispatchable when the owner/handler disappears.
- Q: What per-snapshot budget should capability diagnostics enforce? → A: 64 KB per capability diagnostics snapshot, trimming older recent decisions first while preserving current state.
- Q: How should Slopsmith handle invalid capability manifest metadata at runtime? → A: Reject or ignore invalid capability metadata from the capability graph while still loading legacy plugin surfaces with warnings.
- Q: Where should the live capability inspector ship? → A: As a bundled first-party inspector plugin/screen, optionally linked from Settings.
- Q: What trust/permission scope is required for the first release? → A: Every command/domain gets a safety class now; privileged runtime enforcement gates ship later with privileged domains.

### Session 2026-05-27

- Q: What concrete workflow should PR1 use as the reviewable core domain? → A: PR1 uses the core `library` domain as the active workflow, with `diagnostics` and `pipeline` as support domains; plugin-owned `stems`, playback, UI, backend route, and hardware-facing domains are deferred until their own host workflow PRs.
- Q: How should route-only external library plugins appear in capability diagnostics and the inspector when they adopt this contract? → A: They should declare requester/observer participation in the `library` capability they use, not provider/owner participation and not a separate `backend.routes` domain; the external plugin update is outside this PR.
- Q: Does a requester need to pass `owner` when claiming or releasing? → A: No. The runtime infers the owner from the active owner participant when possible; requesters should identify themselves with `requester` or `source`, and `release` only needs `claimId` plus optional `capability`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Land a Trustworthy First Slice (Priority: P1)

A Slopsmith maintainer reviews the first capability-pipelines release as a small, coherent change: plugins can declare capability intent, core can register and coordinate participants, diagnostics can explain what happened, hydration does not duplicate runtime work, and the existing library-provider workflow proves the model end to end. Broader playback, UI, profile, backend route, plugin-owned Stems/NAM, and future hardware-facing domains are documented as follow-on slices unless they are required to demonstrate the `library` workflow.

**Why this priority**: The change affects the plugin ecosystem contract. The first merge must be easy to trust before the model expands into more domains.

**Independent Test**: Review only the first-slice artifacts and a reference `library` workflow; confirm capability declarations are visible, the core library owner and library providers register once, route-only library participants can appear as requester/observer, claim owner inference works without requester-supplied owner fields, and diagnostics/inspector views explain decisions without requiring unrelated domain work.

**Acceptance Scenarios**:

1. **Given** a plugin declares capability intent before its runtime script is active, **When** Slopsmith loads the plugin list, **Then** diagnostics show declared intent separately from live callable runtime state.
2. **Given** the core library owner exposes local and plugin-provided library sources, **When** a plugin uses the `library` commands for list, refresh, select, get-current, sync-song, or inspect, **Then** the command routes through the capability pipeline and diagnostics show the owner-to-provider relationship.
3. **Given** a route-only external library plugin declares requester/observer roles, **When** the inspector renders the `library` graph, **Then** the generic declaration shape appears as requester/observer participation, not as provider, owner, or a separate `backend.routes` domain.
4. **Given** a requester creates a claim without an `owner` field, **When** the target capability has exactly one active owner that can be inferred, **Then** diagnostics record the inferred owner and the requester/source that made the claim.
5. **Given** the same plugin list hydrates more than once, **When** Slopsmith reloads plugin surfaces, **Then** wrappers, listeners, handlers, timers, UI contributions, diagnostics contributors, and capability participants are not duplicated.

---

### User Story 2 - Give Plugin Authors a Clear Contract (Priority: P1)

A plugin author updates their manifest and runtime to participate in capability pipelines. They can see which fields are valid, which capability version they are targeting, whether they are an owner, provider, requester, or observer, and what compatibility behavior Slopsmith will apply when a capability is unavailable or unsupported.

**Why this priority**: The model becomes harder to misuse only if future plugin authors have a crisp, validated contract instead of copying internal examples.

**Independent Test**: Validate sample owner/provider, requester, and observer plugin declarations against the published manifest contract; then load those plugins and confirm their declared intent, live registration, commands, events, compatibility mode, and version expectations appear consistently in the inspector and diagnostics.

**Acceptance Scenarios**:

1. **Given** a plugin declares standards, capabilities, UI contributions, runtime domains, settings schema, roles, commands, events, compatibility modes, and domain names, **When** the manifest is validated, **Then** valid declarations pass, invalid capability metadata is kept out of the capability graph, and legacy plugin surfaces still load with actionable warnings.
2. **Given** a plugin declares it expects capability-pipelines version 1, **When** Slopsmith loads it on a compatible core, **Then** the participant is accepted and marked compatible.
3. **Given** a plugin declares an unsupported capability-pipelines version, **When** Slopsmith loads it, **Then** Slopsmith reports the incompatibility, avoids executing incompatible runtime handlers, and preserves safe legacy behavior where available.
4. **Given** a plugin registers runtime handlers after manifest declarations, **When** diagnostics are captured, **Then** Slopsmith distinguishes manifest participant, runtime participant, active handler, registration time, and availability state.

---

### User Story 3 - Coordinate Plugins Through Boring Ownership Rules (Priority: P1)

A plugin requester sends a command to a capability without knowing which plugin owns the concrete implementation. Slopsmith routes the request through deterministic owner-kind rules, prevents accidental duplicate exclusive owners, allows intentionally provider-coordinated domains, records conflicts, and returns predictable outcomes for no-owner, no-handler, failure, override, and successful handling cases.

**Why this priority**: Capability pipelines are an inter-plugin command bus. Predictable ownership rules keep plugin coordination observable and prevent fragile private coupling from returning under a new name.

**Independent Test**: Exercise claim, dispatch, user override, duplicate owners, no owner, no handler, unregister/re-register, and idempotent participant registration flows with real runtime behavior; confirm decisions and diagnostics match the expected outcomes.

**Acceptance Scenarios**:

1. **Given** an exclusive capability already has an owner, **When** a second plugin claims owner status for the same capability, **Then** Slopsmith records a conflict and does not silently pick an ambiguous owner.
2. **Given** a domain owner is explicitly marked as `provider-coordinator`, **When** several plugins contribute providers, **Then** Slopsmith accepts all valid providers and shows their order or selection policy.
3. **Given** a requester dispatches to a capability with no owner, **When** the command runs, **Then** the requester receives a no-owner outcome and diagnostics record the missing provider.
4. **Given** a capability has an owner but no handler for the requested command, **When** the command runs, **Then** the requester receives a no-handler outcome and no stale handler is invoked.
5. **Given** a handler unregisters and later re-registers, **When** the requester dispatches before and after re-registration, **Then** Slopsmith first reports unavailable behavior and later routes to the new active handler without retaining the stale one.

---

### User Story 4 - Inspect and Support Capability State (Priority: P1)

A maintainer, user, or plugin author opens a bundled first-party capability inspector plugin screen, optionally linked from Settings. They can see owners, requesters, observers, handlers, claims, overrides, recent decisions, conflicts, compatibility-shim hits, missing providers, and lifecycle state without reading source or reproducing the issue in a debugger.

**Why this priority**: The point of the feature is observable coordination. Without a visible inspector and support-friendly diagnostics, reviewers cannot verify the current `library`, `diagnostics`, and `pipeline` graph without reading source.

**Independent Test**: Install a mix of compatible, legacy, conflicting, disabled, and failing plugins; open the bundled inspector plugin screen and export diagnostics; confirm both views describe the same capability graph and redact sensitive values.

**Acceptance Scenarios**:

1. **Given** a plugin declares it owns a capability but never attaches a runtime handler, **When** the inspector opens, **Then** it shows declared owner intent and missing live handler as separate facts.
2. **Given** a compatibility shim handles a legacy plugin surface, **When** diagnostics are exported, **Then** the shim hit is counted and attributed without hiding the legacy path.
3. **Given** recent capability decisions push a capability diagnostics snapshot above 64 KB, **When** a snapshot is captured, **Then** older recent decisions are trimmed first while conflicts, active claims, current participants, and redacted safety notes remain.
4. **Given** a diagnostic payload contains secrets, raw media objects, or sensitive device state, **When** diagnostics are exported, **Then** those values are omitted or redacted before leaving the app.
5. **Given** a provider-coordinator `library` domain has core owner, local provider, remote provider, and requester/observer participants, **When** the inspector renders the graph, **Then** provider operation/event links are visually distinct from requester/observer request/event links, core/non-core origin is visible, and role-only header badges are not required to understand participation.

---

### User Story 5 - Handle Plugin Lifecycle Changes Safely (Priority: P2)

A user enables, disables, removes, updates, or reloads plugins while Slopsmith is running. Active claims, handlers, UI contributions, and diagnostics state update predictably, leaving no orphaned handlers, stale UI, duplicate wrappers, or ghost ownership claims.

**Why this priority**: Capability pipelines only stay trustworthy if lifecycle changes cannot leave hidden state behind.

**Independent Test**: Start with a plugin that declares and registers capabilities, then disable, remove, fail, reload, and rehydrate it; verify claims are released or marked orphaned, handlers become unavailable, UI contributions unmount, diagnostics retain the explanation, and re-registration produces exactly one active participant.

**Acceptance Scenarios**:

1. **Given** a plugin participates in active claims, **When** the requester is disabled or removed, **Then** Slopsmith releases those claims; **When** the owner or active handler is disabled or removed, **Then** Slopsmith marks affected claims orphaned and non-dispatchable and prevents future dispatch to stale handlers.
2. **Given** a plugin fails during runtime registration, **When** diagnostics are captured, **Then** its manifest declarations remain visible, runtime state is marked failed, and other plugins continue registering.
3. **Given** a plugin is rehydrated with the same version, **When** its runtime re-registers, **Then** live runtime handlers replace previous live handlers for the same plugin and capability while manifest declarations remain intact.
4. **Given** a plugin disappears from the plugin list, **When** Slopsmith refreshes plugin surfaces, **Then** its UI contributions and runtime handlers are unmounted or unregistered before current plugins are mounted.

---

### User Story 6 - Release the Model Incrementally (Priority: P3)

The project maintains an explicit capability roadmap so each future PR can add one domain family, one visible workflow, and its own behavioral validation. Playback, UI/profile, diagnostics, audio input, MIDI, note detection, tempo, visualization, and other domains can mature without forcing every concern into the first merge.

**Why this priority**: Incremental delivery keeps reviews smaller and makes regressions easier to isolate while still pointing toward the final architecture.

**Independent Test**: Pick any roadmap slice and confirm it states user value, included domains, excluded domains, compatibility expectations, lifecycle rules, diagnostics fields, and validation scenarios before implementation starts.

**Acceptance Scenarios**:

1. **Given** a new capability domain is proposed, **When** maintainers review it, **Then** the proposal identifies whether the owner kind is command, provider-coordinator, event, diagnostic, or privileged.
2. **Given** any capability command or domain is included in a release slice, **When** maintainers review it, **Then** it has a safety classification; **When** the slice introduces privileged domains, **Then** runtime enforcement gates are planned and shipped with that privileged-domain slice.
3. **Given** a follow-up PR expands capability pipelines, **When** reviewers inspect it, **Then** they can test it independently from the already-merged first slice.

### Edge Cases

- Duplicate owners appear for an exclusive capability.
- Multiple providers appear for a domain that intentionally supports them.
- A requester dispatches without an owner, without a handler, or with an unsupported command.
- A handler fails, times out, returns an unknown outcome, or returns overridden after a user override.
- A runtime handler registers without a manifest declaration, or a manifest declaration never gets runtime handlers.
- A plugin unloads, disables, is removed, fails during registration, or rehydrates repeatedly.
- Active claims outlive their requester, owner, target, or handler; requester disappearance releases the claim, while owner/handler disappearance marks it orphaned and non-dispatchable.
- Legacy compatibility shims are used during migration and must be visible, not hidden.
- Diagnostics payloads exceed the 64 KB per-snapshot budget or include secrets, raw media objects, user paths, or sensitive device state.
- A plugin requests an unsupported capability-pipelines version.
- A plugin declares invalid capability metadata while still using valid legacy nav, screen, settings, routes, or visualization fields.
- A future domain needs stronger trust controls than the first release provides; the first release classifies the risk, and privileged runtime enforcement ships with the privileged-domain slice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The first releasable slice MUST be reviewable as a coherent unit containing the capability registry, manifest capability metadata, diagnostics snapshot visibility, plugin hydration idempotence, the bundled inspector, and the core `library` provider-coordinator workflow.
- **FR-002**: Non-essential playback, UI/profile, backend route, plugin-owned Stems/NAM, hardware, and future domain families MUST be separable from the first slice unless required to demonstrate the `library` workflow.
- **FR-003**: The system MUST let plugins declare capability intent before runtime code attaches live handlers.
- **FR-004**: The system MUST maintain separate records for manifest participant, runtime participant, active handler, last registration time, availability state, lifecycle state, and last registration error.
- **FR-005**: Runtime registration by the same plugin for the same capability MUST replace or refresh that plugin's live callable state without duplicating handlers, wrappers, listeners, timers, UI contributions, diagnostics contributors, or claims.
- **FR-006**: Manifest declarations and runtime registrations MUST merge predictably: declarations describe stable intent, while runtime registration supplies current handlers and availability.
- **FR-007**: The system MUST expose a formal machine-readable manifest contract, suitable for plugin CI validation, for standards, capabilities, UI contributions, runtime domains, settings schema, roles, commands, events, compatibility modes, domain names, ordering, and lifecycle metadata.
- **FR-008**: The manifest contract MUST reject or ignore invalid capability metadata, including unknown shapes, invalid roles, invalid compatibility modes, missing required identifiers, ambiguous domain names, and unsupported capability-pipelines versions, so invalid metadata cannot enter the capability graph.
- **FR-008a**: Invalid capability metadata MUST NOT prevent otherwise valid legacy plugin nav, screen, settings, routes, or visualization surfaces from loading; Slopsmith MUST report actionable warnings for the ignored capability metadata.
- **FR-009**: Plugins MUST be able to declare the capability-pipelines version they expect.
- **FR-010**: Capability-pipelines version 1 MUST allow additive optional fields, additional optional domains, additional diagnostics fields, and stricter validation warnings that do not break valid v1 declarations.
- **FR-011**: Renamed fields, removed fields, required behavior changes, incompatible command outcomes, or changed ownership semantics MUST require a new capability-pipelines version.
- **FR-012**: When a plugin requests an unsupported capability-pipelines version, Slopsmith MUST report the incompatibility, avoid executing incompatible runtime handlers, and preserve safe legacy behavior where available.
- **FR-013**: Each capability domain MUST declare an owner kind: command, provider-coordinator, event, diagnostic, or privileged. Legacy ownership fields MAY remain accepted for compatibility and diagnostics.
- **FR-014**: Exclusive capabilities MUST have at most one active owner; duplicate active owners MUST be reported as conflicts and must not be resolved silently.
- **FR-015**: Provider-coordinator domains MUST define how providers are ordered, selected, or displayed before multiple providers are accepted.
- **FR-015a**: The `library` domain MUST model the core owner, built-in local provider, plugin-provided library sources, and route-only requester/observer participants without turning every backend route plugin into a provider or a `backend.routes` domain.
- **FR-016**: Claim creation MUST record capability, claim identifier, inferred owner when determinable, requester/source, target selector, creation time, and current lifecycle state.
- **FR-017**: Dispatch MUST return predictable outcomes for handled, transformed, denied, failed, degraded, short-circuited, overridden, no-owner, no-handler, unsupported command, and incompatible version cases.
- **FR-018**: A user override that matches an active automation claim MUST be terminal for that dispatch path and prevent later handlers from mutating the same target during that decision.
- **FR-019**: Runtime enable/disable state changes MUST NOT be treated as user claim overrides.
- **FR-020**: Claim release MUST clear or mark claim-owned restore snapshots so later requests cannot apply stale state.
- **FR-021**: When a plugin disables, unloads, disappears, or fails registration, the system MUST unregister stale handlers, unmount UI contributions, preserve diagnostic evidence, release claims whose requester disappeared, and mark claims orphaned and non-dispatchable when their owner or active handler disappeared.
- **FR-022**: The system MUST keep compatibility shim usage observable by recording shim source, target capability, legacy surface, status, and reason.
- **FR-023**: Diagnostics MUST include declared intent, live runtime state, active handlers, active claims, user overrides, conflicts, missing providers, shim hits, recent decisions, lifecycle transitions, and unsupported-version reports.
- **FR-024**: Diagnostics MUST redact secrets and sensitive state, avoid exposing raw live objects, and enforce a 64 KB per-snapshot budget by trimming older recent decisions before current participants, active claims, conflicts, shim hits, or safety notes.
- **FR-025**: A bundled first-party capability inspector plugin/screen MUST be available to reviewers and plugin authors as part of the first release support surface, not as an optional afterthought; Settings MAY link to it but does not need to own the full surface.
- **FR-026**: The inspector MUST show owners, owner kind, providers, provider operations, requesters, observers, handlers, claims, overrides, recent decisions, conflicts, missing providers, lifecycle state, compatibility shim hits, unsupported-version warnings, core/non-core origin, and provider-coordinator link flow distinctions.
- **FR-027**: Release validation MUST use behavioral tests for claim, dispatch, user override, duplicate owners, no owner, no handler, unregister/re-register, idempotent participant registration, and diagnostics snapshot redaction/size limits.
- **FR-028**: Source-string checks MAY remain only as smoke tests for load order or legacy compatibility, and MUST NOT be the primary evidence for capability behavior.
- **FR-029**: Plugin author documentation MUST include three minimal recipes: owner/provider, requester, and observer.
- **FR-030**: Safety documentation MUST classify every capability command and domain as safe, privileged, sensitive, or diagnostic-only and identify commands that must not expose raw objects or sensitive state.
- **FR-031**: Playback media-element access, audio input, monitoring, and future hardware-adjacent domains MUST receive explicit safety review before being treated as stable capability domains; runtime permission or enforcement gates are required when privileged domains ship, not for the first non-privileged release slice.
- **FR-032**: The roadmap MUST break future capability work into independently reviewable slices with stated user value, included domains, excluded domains, lifecycle expectations, diagnostics fields, and validation scenarios.

### Release Slices

- **Slice 1 - Trustworthy Core**: Capability registry, manifest metadata, diagnostics snapshot, idempotent plugin hydration, lifecycle cleanup, owner-inferred claim semantics, `library` domain provider/requester/observer behavior, bundled inspector, manifest contract draft, and behavioral validation for the first workflow.
- **Slice 2 - Authoring and Hardening**: Plugin author recipes, stricter manifest validation, diagnostics redaction and snapshot limits, source-string test replacement for core behaviors, and follow-up polish that does not widen the active domain set.
- **Slice 3 - Domain Expansion**: Plugin-owned Stems/NAM coordination, playback, UI/profile, visualization, MIDI, tempo, note detection, backend jobs, and other non-sensitive domains, each shipped with owner kind and independent tests.
- **Slice 4 - Trust and Privileged Domains**: Audio input, monitoring, raw media access, and any future sensitive command surfaces, with runtime permission or enforcement gates shipped alongside the privileged domains.

### Key Entities *(include if feature involves data)*

- **Capability Domain**: A named coordination surface with owner kind, supported roles, public commands, provider operations, requests, observed/emitted events, compatibility behavior, lifecycle rules, and safety classification; privileged domains require runtime enforcement gates when they ship.
- **Manifest Participant**: A plugin's declared intent from its manifest, including expected standards, roles, commands, events, UI contributions, settings schema, runtime domains, and compatibility mode.
- **Runtime Participant**: A live plugin registration that supplies current availability, handlers, event subscriptions, lifecycle state, and registration timestamps.
- **Active Handler**: A callable runtime behavior for a specific capability command or event, associated with a runtime participant and lifecycle state.
- **Capability Claim**: A temporary ownership or automation request over a capability target, with inferred owner when determinable, requester/source, target selector, lifecycle state, and restore/cleanup expectations; requester disappearance releases the claim, while owner/handler disappearance marks it orphaned and non-dispatchable.
- **User Override**: A manual user decision that takes precedence over matching automation claims and explains overridden outcomes.
- **Decision Record**: A diagnostic entry describing a dispatch or event decision, participants considered, outcome, conflict or failure reason, and timestamp; older decision records are the first data trimmed when a snapshot would exceed 64 KB.
- **Compatibility Shim**: A recorded bridge from legacy plugin behavior into the capability model, including source, target capability, and reason.
- **Manifest Contract**: The machine-readable and human-readable rules that define valid plugin capability declarations and version compatibility; invalid capability metadata is rejected or ignored for the capability graph while legacy plugin surfaces remain loadable with warnings.
- **Capability Inspector**: A bundled first-party plugin/screen that renders the current capability graph and recent decisions, optionally linked from Settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A maintainer can review the first release slice and identify included versus deferred domains in under 30 minutes.
- **SC-002**: 100% of the listed core coordination behaviors are covered by behavioral validation: claim, dispatch, user override, duplicate owners, no owner, no handler, unregister/re-register, idempotent registration, diagnostics redaction, and diagnostics size limiting.
- **SC-003**: 100% of published plugin author examples validate against the formal manifest contract and load without compatibility warnings on a compatible Slopsmith version.
- **SC-004**: In runtime claim validation, a matching user override prevents automation from reapplying the overridden target on the next dispatch attempt and records an overridden decision without requiring the requester to pass an `owner` field.
- **SC-005**: Rehydrating the same compatible plugin three times results in exactly one active participant registration, one active handler set, and no duplicate UI contributions for that plugin.
- **SC-006**: Disabling or removing a plugin with active claims leaves zero dispatchable stale handlers and produces a diagnostics entry explaining released or orphaned claims.
- **SC-007**: A diagnostics snapshot with active claims, conflicts, shim hits, and recent decisions stays at or below 64 KB while preserving current state and redacting sensitive values.
- **SC-008**: A plugin author can open the bundled inspector and create a minimal owner/provider, requester, or observer declaration from the recipe documentation in under 15 minutes without reading core source.
- **SC-009**: Every stable capability domain has an explicit owner kind and safety classification before it is marked ready for plugin authors, and every privileged domain has an associated runtime enforcement plan before implementation begins.
- **SC-010**: Follow-up capability PRs can be tested independently from the first slice using documented acceptance scenarios for their domain family.

## Assumptions

- Pull request #245 is the current candidate implementation branch, but this spec defines the desired product behavior and release shape rather than blessing every current change as part of the first slice.
- Existing legacy plugin surfaces remain supported during migration, but their use should be visible as compatibility shim activity.
- The core `library` workflow is the reference app workflow for the first release; plugin-owned Stems/NAM coordination remains a future proving domain unless a separate PR promotes it with its own host workflow, diagnostics, and tests.
- External route-only library plugins are not part of this PR; when updated in their own repositories, they should use requester/observer declarations for `library`. External plugins participate as providers only when they register browsable/syncable library sources.
- The capability inspector ships as a bundled first-party plugin/screen; Settings may deep-link to it for discoverability.
- The first release does not need runtime permission prompts or enforcement gates, but it must classify every shipped command/domain and avoid leaking sensitive state in diagnostics; privileged-domain slices must add the needed enforcement gates when they ship.
- High-frequency chart/render data remains outside capability commands until a dedicated chart/render facade is specified.
- Plugin manifests remain the source of declared intent, while runtime registration remains the source of live callable behavior.
- Future domains should prefer one independently testable workflow per PR instead of bundling unrelated capability families together.
