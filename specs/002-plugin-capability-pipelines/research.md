# Phase 0 Research: Plugin Capability Pipelines

## Decision: Keep the first release slice narrow and reviewable

**Rationale**: The capability registry, manifest metadata, diagnostics snapshot, idempotent hydration, invalid-metadata handling, compatibility-version handling, bundled inspector, and `library` provider-coordinator workflow form a complete end-to-end slice. This slice proves the model without forcing reviewers to validate playback, UI/profile, backend routes, plugin-owned Stems/NAM coordination, hardware, and future privileged domains in the same PR.

**Alternatives considered**: Shipping all currently documented domains in one PR would make the review harder to trust. Shipping only docs without the `library` workflow would not prove the current app coordination model; using Stems/NAM as PR1's proving domain would widen the first review beyond the core library surface now being delivered.

## Decision: Treat manifest declarations as declared intent and runtime registration as live callable state

**Rationale**: Support bundles and the inspector need to answer different questions: what did the plugin claim it would do, and what handlers are currently attached? Keeping manifest participants, runtime participants, active handlers, registration timestamps, lifecycle state, and errors distinct prevents misleading diagnostics.

**Alternatives considered**: Merging manifest and runtime state into one participant object is simpler but hides failure modes such as a plugin declaring ownership while its script never attaches a handler.

## Decision: Publish a machine-readable manifest contract for plugin CI and runtime validation

**Rationale**: Plugin authors need a stable contract for `standards`, `capabilities`, `ui_contributions`, `runtime_domains`, `settings_schema`, roles, commands, events, compatibility modes, domain names, ordering, safety class, and lifecycle metadata. A schema-style artifact gives external plugins a cheap validation target and gives runtime validation a single reference.

**Alternatives considered**: Documentation-only examples are easy to read but drift over time. Runtime-only normalization catches some bad shapes but does not help plugin CI before install.

## Decision: Reject invalid capability metadata from the capability graph while loading legacy plugin surfaces with warnings

**Rationale**: Capability metadata coordinates inter-plugin commands and must be harder to misuse than legacy fields. Invalid capability declarations should not create participants, handlers, or ownership conflicts. Existing `nav`, `screen`, `settings`, `routes`, and visualization fields should continue to load when they are otherwise valid so migration does not break older plugins.

**Alternatives considered**: Rejecting the whole plugin is safer but too disruptive for a migration feature. Accepting invalid metadata best-effort would make the capability graph untrustworthy.

## Decision: Use `capability-pipelines.v1` as the compatibility contract for the first API version

**Rationale**: The current PR exposes `window.slopsmith.capabilities.version === 1` and plugin docs already reference `capability-pipelines.v1`. Version 1 should allow additive optional fields, optional domains, optional diagnostics fields, and stricter non-breaking warnings. Removed fields, renamed fields, required behavior changes, incompatible outcomes, or changed ownership semantics require a future version.

**Alternatives considered**: A separate numeric `capabilitiesVersion` field is explicit, but duplicates the existing standards-token pattern. No version declaration would make future compatibility failures harder to explain.

## Decision: Command owners by default, provider coordination only by explicit owner kind

**Rationale**: Exclusive plugin-owned domains and future audio-input style controls must not have ambiguous owners. Domains like `library`, visualization, or UI contributions can support multiple providers only when they declare ordering, selection, or display policy.

**Alternatives considered**: Allowing multiple owners everywhere would maximize flexibility but recreate the private-global conflict problem. Blocking all provider-coordinator domains would not fit library, visualization, and future provider use cases.

## Decision: Split claim cleanup by disappeared participant role

**Rationale**: If the requester disappears, its automation claim should be released because no live plugin owns that request anymore. If the owner or active handler disappears, affected claims should become orphaned and non-dispatchable so diagnostics preserve why automation stopped and no stale handler is invoked.

**Alternatives considered**: Always releasing claims loses useful diagnostics. Always preserving orphaned claims leaves requester-owned automation hanging around after the requester disappears.

## Decision: Enforce a 64 KB per-snapshot capability diagnostics budget

**Rationale**: 64 KB is small enough for support bundles and issue attachments while preserving current participants, active claims, conflicts, shim hits, and enough recent decisions for triage. Older recent decisions are the first data trimmed.

**Alternatives considered**: 32 KB trims too aggressively for active support cases. 128 KB preserves more history but increases bundle noise. No snapshot budget risks accidental large diagnostics contributions.

## Decision: Ship the live inspector as a bundled first-party plugin/screen

**Rationale**: A plugin screen dogfoods the capability contribution model, keeps core Settings lighter, and remains available in a normal Slopsmith install. Settings can link to it for discoverability without owning the full surface.

**Alternatives considered**: A core Settings panel is more direct but crowds Settings and bypasses the plugin model. An external optional plugin weakens the requirement that coordination be observable for reviewers and plugin authors.

## Decision: Classify safety now and defer runtime enforcement gates to privileged-domain slices

**Rationale**: Every command/domain needs a trust map before it is advertised as stable. The first release does not need permission prompts because it should avoid privileged domains. Audio input, raw media access, monitoring, and similar privileged domains must ship their runtime enforcement gates with their own slices.

**Alternatives considered**: Full enforcement in Slice 1 would turn the feature into a permission-system project. Deferring safety entirely would leave privileged future work without a review framework.

## Decision: Replace source-string checks with behavioral tests for runtime behavior

**Rationale**: Source-string tests are acceptable for smoke-checking load order or legacy compatibility, but claim, dispatch, override, duplicate owner, no-owner, no-handler, unregister/re-register, idempotent registration, diagnostics redaction, and snapshot size behavior must be tested by executing the runtime logic.

**Alternatives considered**: Keeping current string assertions is low effort but does not prove behavior. End-to-end browser tests alone are useful but slower and less precise than focused JS behavior tests.
