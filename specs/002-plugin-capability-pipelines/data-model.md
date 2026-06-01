# Data Model: Plugin Capability Pipelines

## Capability Domain

**Purpose**: Named coordination surface for plugin commands, provider operations, events, owner kind, diagnostics, and safety review.

**Fields**:
- `name`: stable domain identifier, for example `library`, `diagnostics`, `pipeline`, `playback`, `ui.navigation`, or `visualization`.
- `ownerKind`: one of `command`, `provider-coordinator`, `event`, `diagnostic`, or `privileged`.
- `ownershipPolicy`: legacy compatibility/diagnostic view, one of `exclusive-owner`, `multi-provider`, `observer-only`, `requester-only`, `privileged`, or `diagnostic-only`.
- `safetyClass`: one of `safe`, `privileged`, `sensitive`, or `diagnostic-only`.
- `commands`: ordered set of command names accepted by the domain.
- `operations`: ordered set of provider operations coordinated by the domain owner.
- `requests`: ordered set of public commands a participant intends to request.
- `observes`: ordered set of events a participant intends to observe.
- `events`: ordered set of event names emitted by the domain.
- `compatibility`: one of the supported compatibility modes.
- `providerPolicy`: ordering, selection, or display policy required when `ownerKind` is `provider-coordinator`.
- `version`: capability-pipelines compatibility version.

**Relationships**:
- Has many manifest participants.
- Has many runtime participants.
- Has many decision records, conflicts, compatibility shims, and active claims.

**Validation Rules**:
- Domain names must be non-empty strings and use stable dotted or hyphenated identifiers.
- Exclusive-owner domains may have at most one active owner.
- Provider-coordinator domains must define provider ordering, selection, or display policy.
- Privileged domains require an enforcement plan before implementation begins.

## Manifest Participant

**Purpose**: Plugin-declared intent from `plugin.json`, visible before runtime code attaches handlers.

**Fields**:
- `pluginId`: plugin manifest identifier.
- `standards`: versioned standards tokens, including `capability-pipelines.v1` when participating in this API.
- `capabilities`: map of capability domain names to declared roles, owner kind, commands, operations, requests, observes, emits, events, compatibility, mode, ordering, and safety metadata.
- `uiContributions`: declared UI placements from `ui_contributions` or `ui`.
- `runtimeDomains`: declared non-UI runtime domains from `runtime_domains` or `domains`.
- `settingsSchema`: optional settings metadata for packable user settings.
- `legacySources`: compatibility surfaces inferred from `nav`, `screen`, `settings`, `routes`, or visualization `type`.
- `validationWarnings`: ignored or rejected capability metadata reasons.

**Relationships**:
- Belongs to one plugin.
- May produce zero or more runtime participants after plugin script hydration.
- May produce compatibility shims for legacy sources.

**Validation Rules**:
- Invalid capability metadata must not enter the capability graph.
- Invalid capability metadata must not block otherwise valid legacy surfaces from loading.
- Unsupported capability-pipelines versions must be reported and must not attach incompatible runtime handlers.

## Runtime Participant

**Purpose**: Live plugin state that can handle commands, observe events, or contribute diagnostics.

**Fields**:
- `pluginId`: live plugin identifier.
- `domainName`: capability domain name.
- `roles`: active runtime roles.
- `mode`: active, optional, legacy-shim, or disabled.
- `availability`: available, unavailable, failed, disabled, or incompatible.
- `registeredAt`: last successful registration timestamp.
- `lastError`: last registration or handler error, if any.
- `handlers`: command handler names currently attached.
- `eventHandlers`: event handler names currently attached.
- `runtimeVersion`: declared or resolved capability-pipelines version.

**Relationships**:
- Refines one manifest participant when a declaration exists.
- Owns zero or more active handlers.
- May own, request, or observe active claims.
- Produces decision records during dispatch.

**State Transitions**:
- `declared` -> `available`: runtime handlers register successfully.
- `declared` -> `failed`: runtime registration throws or returns invalid state.
- `available` -> `disabled`: participant is disabled by runtime lifecycle.
- `available` -> `unavailable`: plugin unloads or disappears.
- `unavailable` -> `available`: plugin rehydrates and re-registers.
- `any` -> `incompatible`: plugin requests an unsupported capability-pipelines version.

## Active Handler

**Purpose**: Callable runtime behavior for a specific capability command or event.

**Fields**:
- `pluginId`: owning runtime participant.
- `domainName`: capability domain.
- `kind`: command handler or event handler.
- `name`: command or event name.
- `registeredAt`: timestamp of the active handler registration.
- `status`: active, stale, failed, or incompatible.
- `lastDecisionId`: most recent decision that invoked this handler.

**Relationships**:
- Belongs to one runtime participant.
- May be referenced by decision records.
- May be associated with active claims when it owns or restores capability state.

**Validation Rules**:
- A handler must not be invoked after its plugin disappears, disables, or becomes incompatible.
- Re-registration by the same plugin and capability replaces prior live handlers for that plugin/capability pair.

## Capability Claim

**Purpose**: Temporary automation claim over a capability target.

**Fields**:
- `capability`: capability domain.
- `claimId`: stable claim identifier.
- `requester`: plugin that created the claim.
- `owner`: plugin expected to own or service the claim target.
- `targetSelector`: redaction-safe target identity.
- `state`: active, released, orphaned, overridden, or expired.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.
- `restoreSnapshotRef`: owner-scoped restore snapshot reference, not raw private state.
- `orphanReason`: explanation when owner or handler disappears.

**Relationships**:
- Belongs to one capability domain.
- May reference a requester runtime participant and owner runtime participant.
- May be matched by user overrides.
- Produces decision records on dispatch and release.

**State Transitions**:
- `active` -> `released`: requester releases the claim, or requester disappears.
- `active` -> `orphaned`: owner or active handler disappears; claim becomes non-dispatchable.
- `active` -> `overridden`: user override matches the claim target for the decision.
- `orphaned` -> `released`: user clears or cleanup removes the orphan.
- `orphaned` -> `active`: only allowed if the owner/handler re-registers and policy explicitly restores the claim.

## User Override

**Purpose**: Manual user decision that wins over matching automation claims.

**Fields**:
- `type`: must be `manual` for claim matching.
- `capability`: capability domain.
- `claimId`: optional claim identifier.
- `requester`: plugin or user surface that recorded the override.
- `targetSelector`: redaction-safe target identity.
- `reason`: human-readable explanation.
- `createdAt`: timestamp.

**Relationships**:
- May match one or more active claims by capability and target selector.
- Produces overridden decision records.

**Validation Rules**:
- Runtime enable/disable state changes must not be recorded as manual overrides.
- Overrides must not include raw live objects or secrets.

## Decision Record

**Purpose**: Bounded diagnostic entry for command dispatch, event handling, claim lifecycle, conflict, shim, or validation decisions.

**Fields**:
- `decisionId`: monotonic or stable diagnostic identifier.
- `timestamp`: decision time.
- `capability`: capability domain.
- `commandOrEvent`: command or event name.
- `requester`: requester or source.
- `participantsConsidered`: redaction-safe participant list.
- `handler`: invoked handler, if any.
- `outcome`: handled, transformed, denied, failed, degraded, short-circuited, overridden, no-owner, no-handler, unsupported-command, or incompatible-version.
- `reason`: explanation.
- `payloadSummary`: redaction-safe summary only.

**Relationships**:
- Belongs to one capability domain.
- May reference one active handler, claim, override, conflict, missing provider, or shim.

**Validation Rules**:
- Older decision records are first to trim when the snapshot would exceed 64 KB.
- Decision payload summaries must not contain secrets, raw media objects, user paths, or function references.

## Compatibility Shim

**Purpose**: Observable bridge from a legacy plugin surface into the capability model.

**Fields**:
- `shimId`: stable shim identifier.
- `source`: plugin or core source.
- `capability`: target capability domain.
- `legacySurface`: legacy field, global, event, or wrapper being bridged.
- `status`: active, used, skipped, failed, or retired.
- `reason`: why the shim exists or was used.
- `timestamp`: first or most recent observed use.

**Relationships**:
- May be created from a manifest participant's legacy sources.
- Appears in diagnostics and inspector state.

## Capability Diagnostics Snapshot

**Purpose**: Redaction-safe bounded snapshot used by support bundles and the inspector.

**Fields**:
- `schema`: `slopsmith.capabilities.diagnostics.v1`.
- `pipelines`: current resolved pipelines and conflicts.
- `participants`: declared and runtime participant summaries.
- `activeClaims`: active and orphaned claim summaries.
- `userOverrides`: manual override summaries.
- `recentDecisions`: bounded list of decision records.
- `missingProviders`: no-owner/no-handler summaries.
- `compatibilityShims`: shim summaries.
- `knownPlugins`: manifest-aware plugin summaries.
- `unsupportedVersions`: incompatible plugin summaries.
- `snapshotBytes`: serialized snapshot size.

**Validation Rules**:
- Serialized snapshot must be at or below 64 KB after trimming.
- Current participants, active claims, conflicts, shim hits, safety notes, and unsupported-version reports must be preserved before recent decision history.

## Capability Inspector

**Purpose**: Bundled first-party plugin/screen for live inspection of the capability graph.

**Fields**:
- `screenId`: plugin screen identifier.
- `snapshot`: latest diagnostics snapshot.
- `filters`: role, domain, lifecycle state, conflict, shim, and safety filters.
- `lastRefreshAt`: timestamp.
- `emptyState`: explanation when the runtime is unavailable or loading.

**Relationships**:
- Reads the capability diagnostics snapshot.
- May deep-link from Settings.
- Does not own core capability state.

**Validation Rules**:
- Must not render secrets, raw objects, function references, or unredacted paths.
- Must show declared intent separately from live runtime handlers.
