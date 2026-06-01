# Research: Incremental Capability Domain Migration and Deprecation

## Decision: Use a central reference checklist plus a required per-domain checklist

**Rationale**: A central checklist keeps the migration policy consistent, while a per-domain checklist makes each future domain prove it applied the policy before planning. This satisfies the clarification that future domain specs must not merely cite the standard; they must complete a domain-specific gate.

**Alternatives considered**:
- Central reference only: simpler, but too easy for future specs to cite without applying.
- Per-domain only: flexible, but risks drift between domains.
- Automated enforcement only: attractive later, but premature before the checklist shape stabilizes.

## Decision: Track no-net-legacy-growth with a per-slice legacy inventory

**Rationale**: A per-slice inventory is auditable and lightweight. It records legacy surfaces added, removed, migrated, contained, and remaining for the specific domain area without requiring a complete app-wide inventory before useful domain work can start.

**Alternatives considered**:
- Narrative only: too subjective to prove the spec's success criteria.
- Numeric reduction budget: too brittle because not every slice can safely reduce legacy usage immediately.
- Global legacy registry first: useful someday, but would block incremental domain work behind a large up-front audit.

## Decision: Require a warning/diagnostics window before legacy removability

**Rationale**: Slopsmith has bundled and external plugin consumers. Legacy surfaces should only be marked removable after bundled migration, documented external usage review, plugin-author migration notes, and at least one release or notice period with warnings or compatibility diagnostics. This avoids removing an API in the same moment maintainers first communicate the replacement.

**Alternatives considered**:
- Bundled-only gate: too risky for external plugins.
- Bundled plus external review only: better, but misses the communication/notice period needed for migration.
- Never remove legacy surfaces: safe short term, but conflicts with the goal of not carrying a permanent second architecture.

## Decision: Keep this feature as a reference standard, not an implementation of future domains

**Rationale**: The spec is meant to govern future domain specs. Implementing audio, ingest, UI, playback, or note detection here would create an overly broad plan and violate the user's intent to improve incrementally as each domain is created.

**Alternatives considered**:
- Implement first priority domain immediately: useful, but would mix policy definition with audio-domain design and make the reference less reusable.
- Create all domain specs in this feature: too large and would delay the migration standard itself.

## Decision: Future domain promotion requires a real host workflow

**Rationale**: Existing roadmap and safety docs already state that deferred domains should stay out of the runtime graph until they ship a host workflow/provider, diagnostics, tests, and Inspector behavior. Keeping this gate prevents speculative graph entries and expected shims that do not correspond to working behavior.

**Alternatives considered**:
- Register all future domains early: improves visibility but creates misleading support output and untestable contracts.
- Allow domain specs without host workflow to proceed: risks documenting contracts that cannot be validated.

## Decision: Coordinate parallel domain work through shared-runtime ownership notes

**Rationale**: Multiple future domains can be specified in parallel, but implementation must not rewrite shared capability runtime primitives incompatibly at the same time. Each domain spec should document any shared-runtime touch points, the owning slice, and sequencing when overlap exists.

**Alternatives considered**:
- Serial domain planning only: too slow and unnecessary for independent docs/design.
- Fully parallel implementation: high risk when shared dispatch, diagnostics, or Inspector semantics change concurrently.

## Decision: Treat app-structure improvement as part of each domain's Definition of Done

**Rationale**: The project goal is not just to add capability metadata; each domain slice must leave its touched area cleaner. Requiring a domain host boundary and legacy inventory forces future specs to reduce private-state coupling and avoid adding new legacy-only behavior to the central frontend host.

**Alternatives considered**:
- Separate cleanup project later: likely to accumulate technical debt and lose the context needed for safe migration.
- Big-bang refactor now: violates the incremental scope and increases regression risk.
