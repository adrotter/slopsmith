# Contract: Capability Runtime

## Scope

The browser runtime exposes `window.slopsmith.capabilities` as the coordination point for plugin capability declarations, live runtime handlers, claims, dispatch, user overrides, lifecycle changes, and diagnostics. This contract is for plugin authors, bundled first-party plugins, and runtime tests.

## Version

- Current stable contract: `capability-pipelines.v1`.
- Runtime reports numeric `version: 1`.
- Version 1 allows additive optional fields, optional domains, optional diagnostics fields, and stricter non-breaking validation warnings.
- Renamed fields, removed fields, changed ownership semantics, incompatible outcomes, or newly required behavior require a future version.
- Plugins requesting an unsupported version are visible in diagnostics, and incompatible handlers must not execute.

## Participant Registration

### `registerParticipant(pluginId, declaration)`

Registers or refreshes one runtime participant.

**Input**:
- `pluginId`: non-empty plugin identifier.
- `declaration`: map of capability domain names to runtime declaration objects.

**Behavior**:
- Merges with manifest-declared intent for the same plugin and domain.
- Replaces or refreshes live callable runtime state for the same plugin and domain.
- Must not duplicate handlers, wrappers, listeners, timers, UI contributions, diagnostics contributors, or claims.
- Invalid capability metadata must not enter the capability graph.

### `registerParticipants(plugins)`

Registers manifest participant declarations before plugin scripts hydrate.

**Input**:
- `plugins`: plugin list with `id`, `standards`, `capabilities`, `ui_contributions`, and `runtime_domains` metadata.

**Behavior**:
- Registration order is deterministic by stable plugin id.
- Manifest participants are visible even before runtime handlers attach.
- Invalid capability metadata is ignored or rejected with warnings while legacy plugin surfaces may still load.

### `unregisterParticipant(pluginId, capabilityName?)`

Removes live runtime state for a plugin.

**Behavior**:
- Removes active handlers and marks them unavailable.
- Releases claims where the disappeared plugin is the requester.
- Marks claims orphaned and non-dispatchable where the disappeared plugin is the owner or active handler.
- Unmounts or unregisters UI contributions owned by the plugin.
- Preserves diagnostic evidence.

### `setParticipantEnabled(pluginId, capabilityName, enabled, options?)`

Changes live availability for one participant.

**Behavior**:
- Runtime enable/disable state changes are lifecycle state, not manual user overrides.
- Disabling a participant prevents dispatch to its handlers.
- Core participants are not disabled by plugin requests.

## Claims

### `claim({ capability, claimId, requester, source, target, owner })`

Creates or refreshes an automation claim.

**Required fields**:
- `capability`
- `claimId`
- `requester` or `source`

**Behavior**:
- Records creation time and lifecycle state.
- Infers `owner` from the active owner participant when the capability has a single unambiguous owner; an explicit `owner` remains accepted for compatibility and diagnostics escape hatches.
- May reference a redaction-safe target selector.
- Does not expose owner private state to requesters.

### `release({ capability, claimId, requester, source })`

Releases an active claim.

**Behavior**:
- Clears or marks claim-owned restore snapshots so later requests cannot apply stale state.
- Requires only `claimId`, plus optional `capability` when claim identifiers may collide across domains.
- Emits or records release decisions for diagnostics.

## Dispatch

### `command(capability, command, context)` / `dispatch(context)`

Routes a command through the resolved capability pipeline.

**Context fields**:
- `capability`: capability domain.
- `command`: command name.
- `requester`: plugin or core requester.
- `claim`: optional claim reference.
- `target`: optional redaction-safe target selector.
- `payload`: redaction-safe command payload.
- `reason`: optional reason for diagnostics.

**Outcomes**:
- `handled`
- `transformed`
- `denied`
- `failed`
- `degraded`
- `short-circuited`
- `overridden`
- `no-owner`
- `no-handler`
- `unsupported-command`
- `incompatible-version`

**Behavior**:
- Exclusive-owner domains route to at most one active owner.
- Duplicate active owners are conflicts and must not be silently resolved.
- Multi-provider domains require explicit provider policy.
- A matching manual user override is terminal for that dispatch path and prevents later handlers from mutating the same target.
- No-owner and no-handler cases produce explicit outcomes and diagnostics records.
- Failed or timed-out handlers produce failed or degraded decisions and must not break app events.

## Events and Subscriptions

### `subscribe(topic, handler)`

Subscribes to capability events or diagnostics topics.

**Behavior**:
- Handler failures must not break other subscribers.
- Subscriptions must be idempotent when plugins rehydrate.

### `emitEvent(capability, event, payload)`

Emits a redaction-safe capability event.

**Behavior**:
- Existing legacy `window.slopsmith` events continue to dispatch locally.
- Cross-plugin event families may be bridged into capability domains.
- Event payloads must not contain raw media objects, function references, secrets, or unredacted paths.

## User Overrides

### `recordUserOverride(entry)`

Records a manual user decision that takes precedence over matching automation claims.

**Required behavior**:
- Entries that can match claims must be marked as manual overrides.
- Runtime state toggles must not become manual overrides.
- Target selectors must be redaction-safe.

## Compatibility Shims

### `registerCompatibilityShim(shim)`

Records legacy surface bridging into capability domains.

**Fields**:
- `shimId`
- `source`
- `capability`
- `legacySurface`
- `status`
- `reason`

**Behavior**:
- Shim usage is visible in diagnostics and the inspector.
- Legacy use is observable, not hidden.

## Diagnostics

### `snapshotDiagnostics()` / `getDiagnostics()`

Returns the redaction-safe capability diagnostics snapshot.

**Required behavior**:
- Snapshot schema is `slopsmith.capabilities.diagnostics.v1`.
- Snapshot must stay at or below 64 KB.
- Older recent decisions trim first.
- Current participants, active claims, conflicts, shim hits, safety notes, and unsupported-version reports must be preserved before recent decision history.

## Inspector Requirements

The bundled first-party inspector plugin/screen reads runtime diagnostics and must show:
- Manifest participants separately from runtime participants.
- Active handlers and availability state.
- Owners, providers, requesters, observers, and conflicts.
- Active, released, orphaned, and overridden claims.
- Manual user overrides.
- Missing providers and no-handler decisions.
- Compatibility shim hits.
- Unsupported-version warnings.
- Safety class for every stable domain.
