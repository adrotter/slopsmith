# Data Model: Incremental Capability Domain Migration and Deprecation

## Migration Standard

**Purpose**: The reference rule set that future domain specifications must satisfy before planning.

**Fields**:
- `name`: Human-readable standard name.
- `scope`: The kinds of future domain specs governed by the standard.
- `central_checklist`: Required gates that apply to every future domain.
- `deprecation_policy`: Shared lifecycle rules for legacy surfaces.
- `parallel_work_policy`: Rules for overlapping domain planning or runtime changes.
- `promotion_policy`: Rules for moving a domain from roadmap-only to active contract.

**Relationships**:
- Owns the Central Migration Checklist.
- Is cited by each future Domain Slice.
- Defines the source of truth for Per-Domain Migration Checklists.

**Validation Rules**:
- Must be reusable across all prioritized future domains.
- Must not require implementation of any one future domain.
- Must not permit active runtime promotion without a real host workflow.

## Central Migration Checklist

**Purpose**: The canonical checklist future domain specs derive from.

**Fields**:
- `domain_contract`: Owner, participants, commands, provider operations, events, safety class.
- `host_boundary`: Host/facade ownership and app-structure improvement evidence.
- `compatibility_bridge`: Legacy behavior preservation plan.
- `diagnostics_and_inspector`: Support visibility requirements.
- `deprecation`: Legacy states, adoption gate, removal conditions.
- `legacy_inventory`: Inventory of legacy components, owners, compatibility status, migration risk, and no-net-growth evidence.
- `testing`: New path and compatibility path verification.
- `migration_notes`: Plugin-author guidance requirements.
- `parallel_coordination`: Shared-runtime overlap and sequencing notes.
- `initial_promotion_priority`: Evidence that initial domain promotion follows the declared priority order.

**Relationships**:
- Produces a Per-Domain Migration Checklist for each Domain Slice.

**Validation Rules**:
- Must be complete before a future domain spec proceeds to planning.
- Must distinguish active domains from roadmap-only domains.

## Per-Domain Migration Checklist

**Purpose**: A completed checklist proving one future domain applied the central standard.

**Fields**:
- `domain_name`: Candidate domain or related domain family.
- `completed_items`: Checked central checklist items with evidence links.
- `exceptions`: Any unresolved or deferred item with owner, risk, and follow-up gate.
- `review_status`: Draft, ready-for-plan, blocked, or superseded.

**Relationships**:
- Derived from the Central Migration Checklist.
- Attached to a Domain Slice specification.
- References a Per-Slice Legacy Inventory.

**Validation Rules**:
- Must be completed before `/speckit-plan` for a future domain slice.
- Must not silently omit checklist items; exceptions require explicit ownership and risk.
- Must fail planning readiness when initial-promotion sequencing deviates from the declared priority order without explicit skipped-domain exceptions.

## Domain Slice

**Purpose**: A focused migration effort for one capability domain or tightly related domain family.

**Fields**:
- `domain_name`: Stable domain name or domain family.
- `priority`: Relative ordering when multiple domains compete for attention.
- `host_workflow`: Real user/system workflow that justifies active promotion.
- `owner_model`: Owner kind and participant relationships.
- `compatibility_scope`: Legacy surfaces that remain supported during migration.
- `diagnostics_scope`: Outcomes and support visibility delivered by the slice.
- `app_structure_improvement`: How the domain area becomes cleaner.
- `migration_notes_scope`: Plugin-author guidance delivered by the slice.

**Relationships**:
- Must cite the Migration Standard.
- Must include a Per-Domain Migration Checklist.
- Must include a Per-Slice Legacy Inventory.
- May depend on another Domain Slice when shared runtime primitives overlap.

**Validation Rules**:
- Cannot be promoted to active contract without a real host workflow.
- Cannot introduce a net increase in legacy-only integration points.
- Cannot remove legacy surfaces before adoption gates are met.

## Domain Host Boundary

**Purpose**: The owned app surface that coordinates a domain and prevents new behavior from depending only on legacy globals or private state.

**Fields**:
- `owned_surface`: The user/system behavior coordinated by the boundary.
- `public_interactions`: Supported interactions available to participants.
- `legacy_inputs`: Legacy surfaces bridged or contained by the boundary.
- `diagnostic_outputs`: Support data emitted by the boundary.
- `residual_legacy`: Any behavior not fully migrated in the slice.

**Relationships**:
- Belongs to a Domain Slice.
- Owns compatibility decisions for covered Legacy Surfaces.

**Validation Rules**:
- Must not expose private mutable state as the migration path.
- Must preserve current user-visible behavior during the compatibility period.

## Legacy Surface

**Purpose**: An existing integration point being bridged, contained, deprecated, or removed.

**Fields**:
- `identifier`: Human-readable name of the surface.
- `type`: Global, wrapper chain, manifest field, DOM injection, private state access, plugin-specific handshake, or other.
- `current_consumers`: Bundled and documented external users when known.
- `replacement_path`: New domain path, if available.
- `deprecation_state`: Supported compatibility, deprecated with warning, blocked for new bundled code, or removable.
- `risk`: User/plugin impact if behavior changes.

**Relationships**:
- Appears in a Per-Slice Legacy Inventory.
- May be served by a Compatibility Bridge.
- Has an Adoption Gate before removal.

**Validation Rules**:
- Unknown external usage defaults to compatibility-preserving behavior.
- Removable state requires bundled migration, external review, migration notes, and warning/diagnostics window.

## Per-Slice Legacy Inventory

**Purpose**: Domain-specific record proving no net increase in legacy-only integration points.

**Fields**:
- `added`: Legacy-only surfaces introduced by the slice, expected to be empty or justified as temporary compatibility.
- `removed`: Legacy surfaces removed after meeting adoption gates.
- `migrated`: Legacy surfaces whose bundled consumers moved to the new domain path.
- `contained`: Legacy surfaces still supported through a compatibility bridge or host boundary.
- `remaining`: Legacy surfaces not fully addressed in the slice.
- `follow_up_gates`: Conditions required for remaining surfaces.

**Relationships**:
- Attached to a Domain Slice.
- References Legacy Surfaces and Adoption Gates.

**Validation Rules**:
- Must show no net increase in legacy-only integration points.
- Remaining surfaces must have owner, risk, and follow-up gate.

## Compatibility Bridge

**Purpose**: Transitional path preserving legacy behavior while attributing and diagnosing usage.

**Fields**:
- `legacy_surface`: Covered legacy surface.
- `replacement_path`: New domain path or host boundary.
- `diagnostics`: Outcomes and usage evidence emitted by the bridge.
- `failure_behavior`: What happens when bridge execution fails or is disabled.
- `sunset_gate`: Adoption gate required before removal.

**Relationships**:
- Connects Legacy Surface to Domain Host Boundary.
- Emits Diagnostics Outcomes.

**Validation Rules**:
- Must preserve user-visible behavior during the compatibility period.
- Must distinguish bridge failure from native capability failure.

## Deprecation State

**Purpose**: Lifecycle status assigned to a legacy surface.

**States**:
- `supported_compatibility`: Legacy surface is intentionally supported through compatibility.
- `deprecated_with_warning`: Replacement exists and usage emits warning or compatibility diagnostics.
- `blocked_for_new_bundled_code`: Existing compatibility remains, but new bundled code may not use the legacy surface.
- `removable`: Adoption gate is satisfied and removal can be planned.

**Transitions**:
- `supported_compatibility` -> `deprecated_with_warning` when replacement path and migration notes exist.
- `deprecated_with_warning` -> `blocked_for_new_bundled_code` when bundled code has a usable replacement and enforcement is practical.
- `blocked_for_new_bundled_code` -> `removable` when adoption gate is satisfied.

**Validation Rules**:
- Cannot transition directly to `removable` unless the surface is documented unused and the warning/review requirements are satisfied.

## Adoption Gate

**Purpose**: Evidence required before a legacy surface can move to stricter deprecation or removal.

**Fields**:
- `bundled_migration_evidence`: Proof bundled consumers migrated or no longer use the surface.
- `external_usage_review`: Documented review of known external integrations.
- `migration_notes`: Published guidance for plugin authors.
- `warning_window`: Release or notice period with warnings or compatibility diagnostics.
- `approval_status`: Ready, blocked, or deferred.

**Validation Rules**:
- Required before any legacy surface is marked removable.
- Must be documented in the domain slice.

## Diagnostics Outcome

**Purpose**: Support-visible result explaining what happened when a capability or compatibility request was attempted.

**Allowed Outcomes**:
- handled
- denied
- overridden
- unsupported
- no-owner
- no-handler
- incompatible
- failed

**Relationships**:
- Emitted by Domain Host Boundary or Compatibility Bridge.
- Visible through diagnostics and the Capability Inspector or equivalent support surface.

**Validation Rules**:
- Outcomes must be distinguishable enough for support maintainers to identify the domain, participant, bridge if any, and failure reason.

## Migration Notes

**Purpose**: Plugin-author guidance for moving from legacy surfaces to the new domain path.

**Fields**:
- `audience`: Bundled plugin maintainers, external plugin authors, or support maintainers.
- `legacy_surface`: What is being replaced.
- `replacement_path`: How to adopt the new domain.
- `compatibility_period`: What remains supported and for how long.
- `deprecation_signals`: Warnings or diagnostics authors will see.
- `removal_gate`: Conditions before removal.

**Validation Rules**:
- Required before deprecated-with-warning or removable states.
