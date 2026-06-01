# Capability Roadmap

This roadmap keeps the first capability PR reviewable while making the future domain plan explicit. PR1 ships the substrate and only the domains whose current behavior is implemented, diagnosed, and tested. Future domains stay planned or reserved until the PR that implements their host workflow also adds runtime registration, compatibility shims when needed, diagnostics, and tests.

## PR1 Domain Set

PR1 should include these delivered domains:

| Domain | Scope | Owner Kind | Safety | Why It Is In PR1 |
|--------|-------|------------|--------|------------------|
| `pipeline` | Core diagnostic surface | diagnostic | diagnostic-only | Exposes capability graph inspection, validation, and participant enablement diagnostics. |
| `diagnostics` | Core diagnostic surface | diagnostic | diagnostic-only | Lets support bundles explain capability state safely. |
| `library` | Core app workflow | provider-coordinator | safe | Models current local and plugin-provided library sources, source selection, and song sync. |

The core/runtime domains in PR1 are intentionally small: diagnostics snapshots, pipeline graph operations, and one concrete app workflow (`library`). Runtime claim and override mechanics are covered by focused behavior tests, but no plugin-owned proving domain is promoted into the runtime graph in PR1.

`diagnostics` and `pipeline` are support domains, not feature workflow domains. `diagnostics` is the read-only snapshot/export facade consumed by support bundles and the Capability Inspector. `pipeline` is the graph operations facade: resolve, inspect, validate, and enable or disable participants.

## PR1 Compatibility Shims

PR1 does not expose expected compatibility shims for `library`. Library is implemented as a native provider-coordinator domain; provider attribution comes from backend `owner_plugin_id` metadata and browser runtime provider participants.

Future domains should not add expected shim entries until their own implementation PR. A domain PR owns its compatibility story.

## Deferred Domains

These domains are planned but should stay out of the runtime graph until a host workflow exists:

| Domain | Expected Ownership | Expected Safety | Candidate Scope | Implementation Trigger |
|--------|--------------------|-----------------|-----------------|------------------------|
| `stems` | exclusive-owner | safe | Stem mute/restore, ownership claims, manual override events, and requester/observer coordination. | A focused Stems/NAM coordination PR with plugin-owned commands/events and override diagnostics. |
| `playback` | exclusive-owner | safe | Transport, seek, loop, media snapshot, and song lifecycle events. | A focused playback facade PR with command/event tests and legacy transport shim accounting. |
| `ui.navigation` | exclusive-owner | safe | Navigation contributions and screen-change events. | A UI host PR that owns contribution placement and route/screen semantics. |
| `ui.plugin-screens` | exclusive-owner | safe | Plugin screen registration and lifecycle. | A screen host PR with mount/unmount and visibility policy. |
| `settings` | exclusive-owner | sensitive | Plugin settings contribution metadata without settings values. | A settings contribution PR with redaction rules and migration story. |
| `visualization` | multi-provider | safe | Renderer providers, overlay participation, and renderer selection. | A visualization PR that defines provider ordering/selection and legacy highway shim attribution. |
| `audio-mix` | multi-provider | safe | Mixer fader registration and current fader inspection. | A mixer PR that scopes plugin fader ownership and diagnostics payloads. |
| `audio-monitoring` | multi-provider | sensitive | Native/audio-input barrier participation and monitoring lifecycle. | A device-adjacent PR with consent, lifecycle, and redacted diagnostics. |
| `note-detection` | multi-provider | sensitive | Note-state providers and note event integration. | A note-detection PR with performance-data redaction and provider lifecycle tests. |
| `backend.routes` | multi-provider | privileged | Server route/provider participation and route inspection. | A backend domain PR with concrete core/provider workflow, privilege review, and route diagnostics. |
| `ui.player-controls` | exclusive-owner | safe | Player-control contributions and ordering. | A first-party player-control host and layout policy. |
| `ui.player-panels` | exclusive-owner | safe | Player panel contributions, mount/unmount, visibility, ordering. | A panel host with layout and focus rules. |
| `ui.player-overlays` | exclusive-owner | safe | Overlay contributions layered over player or highway surfaces. | Overlay placement and z-order rules that coexist with legacy overlays. |
| `plugins` | exclusive-owner | privileged | Plugin enable/disable/install/update workflows. | Visible user confirmation, rollback, and disabled-handler enforcement. |
| `jobs` | multi-provider | privileged | Long-running jobs, cancellation, status, failures. | Scheduling limits, cancellation semantics, and user-visible failures. |
| `midi-control` | multi-provider | sensitive | MIDI device providers and control mappings. | Device consent and redacted diagnostics. |
| `audio-input` | multi-provider | sensitive | Audio input device providers and lifecycle. | Permission flow, lifecycle controls, and redacted diagnostics. |
| `tempo-clock` | multi-provider | safe | Tempo/clock provider registration and consumers. | A concrete tempo source and consumer workflow. |

Deferred domains may remain documented or reserved, but they should not produce expected shims, inspector links, or runtime handlers before their implementation slice.

## Domain Versioning

PR1 does not add per-domain versioning. The `capability-pipelines.v1` standard versions the overall manifest/runtime/diagnostics contract. Domain evolution follows compatibility rules:

- Adding optional commands, events, diagnostics fields, or participant metadata is non-breaking.
- Removing or renaming commands/events is breaking.
- Changing ownership semantics is breaking.
- Changing command payloads, return payloads, or dispatch outcomes incompatibly is breaking.
- A breaking change requires either a future `capability-pipelines` version or a clearly new domain name if parallel support is needed.

Per-domain versions should wait until Slopsmith has a concrete need for multiple incompatible versions of the same domain to coexist.

## Future Domain PR Checklist

A PR that promotes a deferred domain into the runtime graph should include:

1. User value and included/excluded command scope.
2. Host workflow or provider implementation.
3. Runtime domain review metadata.
4. Manifest and runtime registration path.
5. Compatibility shims only for legacy behavior the PR actually bridges.
6. Diagnostics fields and redaction rules.
7. Inspector behavior and meaningful labels/tooltips.
8. Tests for valid metadata, invalid metadata, unsupported versions, disabled participants, command outcomes, and shim hit accounting.
9. Documentation updates in the safety matrix and capability docs.
