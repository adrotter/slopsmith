# Capability Safety Matrix

Capability declarations include a safety class so reviewers can decide whether a domain can ship as a normal plugin contract or needs extra enforcement first.

Core domains also have a review scope. **Active contract** domains are wired to current Slopsmith behavior and should be tested as working integration points. Expected future domains are documented below, but are intentionally not registered in the runtime graph until Slopsmith ships the corresponding host UI or provider workflow.

| Domain | Owner Kind | Safety Class | Stable Commands | Provider Operations | Notes |
|--------|------------|--------------|-----------------|---------------------|-------|
| pipeline | diagnostic | diagnostic-only | resolve, inspect, validate, participant.set-enabled | none | Graph inspection, validation, and participant lifecycle diagnostics. |
| diagnostics | diagnostic | diagnostic-only | snapshot | none | Redaction-safe snapshot/export surface for support bundles and the Capability Inspector. |
| library | provider-coordinator | safe | list-providers, refresh-providers, select-provider, get-current, sync-song, inspect | query-page, query-artists, query-stats, tuning-names, get-art, sync-song | Library source selection and provider-owned song sync; provider ids are public UI labels, while provider internals stay backend-owned. |

Privileged commands are roadmap-only until they have: a visible user confirmation path, diagnostics redaction rules, failure recovery, and tests that prove disabled or incompatible participants cannot execute handlers.

## Expected Future Domains

These domains are expected future capability contracts, not current runtime graph entries. They should stay documentation-only until a PR adds the corresponding host workflow and tests.

| Domain | Expected Ownership Policy | Expected Safety Class | Candidate Commands | Review Gate |
|--------|---------------------------|-----------------------|--------------------|-------------|
| stems | exclusive-owner | safe | mute, restore, inspect | Needs a focused plugin-owned Stems/NAM coordination PR with claim, dispatch, release, and override diagnostics. |
| playback | exclusive-owner | safe | play, pause, stop, seek, snapshot, audio-element, loop-set, loop-clear, loop-get | Needs focused transport command/event tests and legacy shim accounting. |
| ui.navigation | exclusive-owner | safe | register-contribution, mount, unmount, set-visible, reorder-by-policy, navigate, inspect | Needs a UI host PR with contribution placement and route/screen semantics. |
| ui.plugin-screens | exclusive-owner | safe | register-contribution, mount, unmount, set-visible, reorder-by-policy, inspect | Needs a screen host PR with mount/unmount and visibility policy. |
| settings | exclusive-owner | sensitive | register-contribution, mount, unmount, set-visible, reorder-by-policy, inspect | Needs redaction rules and a migration story for settings metadata. |
| visualization | multi-provider | safe | register-provider, get-current, set-renderer | Needs provider ordering/selection rules and legacy highway shim attribution. |
| audio-mix | multi-provider | safe | register-participant, inspect | Needs plugin fader ownership and bounded diagnostics payloads. |
| audio-monitoring | multi-provider | sensitive | start, stop, inspect | Needs device consent, lifecycle controls, and redacted diagnostics. |
| note-detection | multi-provider | sensitive | register, inspect | Needs performance-data redaction and provider lifecycle tests. |
| backend.routes | multi-provider | privileged | register, inspect | Needs a concrete backend route/provider workflow, privilege review, and route diagnostics. |
| ui.player-controls | exclusive-owner | safe | register-contribution, mount, unmount, set-visible, reorder-by-policy, inspect | Needs a first-party player-control host. |
| ui.player-panels | exclusive-owner | safe | register-contribution, mount, unmount, set-visible, reorder-by-policy, inspect | Needs a first-party panel host and layout policy. |
| ui.player-overlays | exclusive-owner | safe | register-contribution, mount, unmount, set-visible, reorder-by-policy, inspect | Needs overlay placement rules that coexist with legacy highway overlays. |
| plugins | exclusive-owner | privileged | enable, disable, install-missing, update, inspect | Needs explicit user confirmation for writes/install/update. |
| jobs | multi-provider | privileged | register, inspect, cancel | Needs scheduling limits, cancellation semantics, and user-visible failures. |
| midi-control | multi-provider | sensitive | register, inspect | Needs device consent and redacted diagnostics. |
| audio-input | multi-provider | sensitive | register, inspect | Needs device permission, lifecycle controls, and redacted diagnostics. |
| tempo-clock | multi-provider | safe | register, inspect | Needs a concrete provider and consumer workflow. |

Planned domains should also stay out of the runtime graph until Slopsmith ships the corresponding user-facing workflows.
