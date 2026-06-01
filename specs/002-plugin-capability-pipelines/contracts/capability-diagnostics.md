# Contract: Capability Diagnostics Snapshot

## Purpose

Capability diagnostics snapshots are consumed by Settings diagnostics export, support bundles, tests, and the bundled first-party capability inspector plugin/screen. They explain declared intent, live runtime state, claims, overrides, conflicts, missing providers, compatibility shims, unsupported versions, and recent decisions without exposing secrets or raw runtime objects.

## Snapshot Envelope

```json
{
  "schema": "slopsmith.capabilities.diagnostics.v1",
  "snapshotBytes": 64000,
  "pipelines": [],
  "participants": [],
  "activeClaims": [],
  "userOverrides": [],
  "recentDecisions": [],
  "conflicts": [],
  "missingProviders": [],
  "compatibilityShims": [],
  "knownPlugins": [],
  "unsupportedVersions": [],
  "safety": []
}
```

## Size Budget

- Serialized snapshot size must be at or below 64 KB.
- Older `recentDecisions` entries are trimmed before current state.
- These fields are preserved before recent decision history: `pipelines`, `participants`, `activeClaims`, `conflicts`, `missingProviders`, `compatibilityShims`, `knownPlugins`, `unsupportedVersions`, and `safety`.

## Redaction Rules

Snapshots must not include:
- Raw media elements, audio nodes, WebGL objects, functions, DOM nodes, or live plugin objects.
- Bearer tokens, API keys, session tokens, or query parameters that look secret.
- Unredacted user paths, DLC paths, song filenames, IP addresses, or local network details.
- Full command payloads when a redaction-safe summary is enough.

## Pipeline Summary

Each pipeline entry describes one capability domain.

```json
{
  "name": "library",
  "kind": "provider-coordinator",
  "ownershipPolicy": "multi-provider",
  "safetyClass": "safe",
  "order": ["core.library", "core.library.local", "remote_library_client"],
  "resolvedAt": "2026-05-24T00:00:00.000Z",
  "conflicts": []
}
```

## Participant Summary

Each participant entry may represent declared intent, live runtime state, or both.

```json
{
  "pluginId": "remote_library_client",
  "capability": "library",
  "source": "manifest-and-runtime",
  "roles": ["provider"],
  "operations": ["query-page", "sync-song"],
  "mode": "active",
  "availability": "available",
  "registeredAt": "2026-05-24T00:00:00.000Z",
  "handlers": [],
  "manifestDeclared": true,
  "runtimeRegistered": true,
  "lastError": null,
  "version": 1
}
```

**Required distinctions**:
- `manifestDeclared: true` with `runtimeRegistered: false` means the plugin declared intent but no live handler attached.
- `runtimeRegistered: true` with `manifestDeclared: false` is allowed only as legacy or transitional behavior and should be visible.
- Unsupported versions must mark `availability: "incompatible"` and must not execute handlers.

## Claim Summary

```json
{
  "capability": "example.plugin-domain",
  "claimId": "example.automation-active",
  "requester": "example_requester",
  "owner": "example_owner",
  "targetSelector": { "kind": "example-target" },
  "state": "active",
  "createdAt": "2026-05-24T00:00:00.000Z",
  "updatedAt": "2026-05-24T00:00:00.000Z",
  "orphanReason": null
}
```

**Lifecycle requirements**:
- Requester disappearance releases the claim.
- Owner or active-handler disappearance marks the claim `orphaned` and non-dispatchable.
- Owner is inferred from the active owner participant when possible; requesters do not need to pass `owner` for normal claim/release flows.
- Manual user override can produce an `overridden` decision without deleting the claim.

## Decision Record

```json
{
  "decisionId": 42,
  "timestamp": "2026-05-24T00:00:00.000Z",
  "capability": "library",
  "commandOrEvent": "sync-song",
  "requester": "library_route_wrapper",
  "participantsConsidered": ["core.library", "remote_library_client"],
  "handler": "core.library.sync-song",
  "outcome": "handled",
  "reason": "Selected provider synchronized a remote library song",
  "payloadSummary": { "target": { "providerId": "remote:client", "songId": "redacted" } }
}
```

Allowed outcomes:
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

## Compatibility Shim Summary

```json
{
  "shimId": "legacy-nav:my_plugin",
  "source": "my_plugin",
  "capability": "ui.navigation",
  "legacySurface": "nav",
  "status": "used",
  "reason": "Legacy manifest nav field mapped to ui.navigation contribution",
  "timestamp": "2026-05-24T00:00:00.000Z"
}
```

## Inspector Consumption

The bundled inspector must treat this snapshot as read-only. It may filter, group, and refresh state, but it must not mutate runtime state except through explicitly documented capability commands. Empty and loading states must distinguish:
- Capability runtime unavailable.
- Runtime loading but no snapshot yet.
- Snapshot available with no registered third-party participants.
- Snapshot available with conflicts or unsupported-version warnings.
