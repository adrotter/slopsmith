# Contract: Per-Slice Legacy Inventory

Each future capability-domain slice MUST maintain a per-slice legacy inventory to prove that the slice does not introduce a net increase in legacy-only integration points.

## Inventory Scope

The inventory covers legacy surfaces in the domain area touched by the slice. It does not require a full-app inventory before domain work can begin.

Legacy surfaces include, but are not limited to:

- global functions or objects
- wrapper chains
- legacy manifest fields
- direct DOM injection patterns
- private state access
- plugin-specific handshakes
- undocumented event names
- compatibility-only shims

## Required Format

```markdown
# Legacy Inventory: <domain or domain family>

**Feature**: <link to domain spec>
**Domain host boundary**: <name, or discovery owner when not identified yet>

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| Added | 0 | Legacy-only additions should be zero unless explicitly temporary. |
| Removed | 0 | Surfaces removed after adoption gates. |
| Migrated | 0 | Surfaces whose bundled consumers moved to the new path. |
| Contained | 0 | Surfaces still supported through a bridge or host boundary. |
| Remaining | 0 | Surfaces deferred with owner, risk, and follow-up gate. |

## Added Legacy Surfaces

| Surface | Type | Why added | Sunset gate | Owner |
|---------|------|-----------|-------------|-------|
| | | | | |

## Removed Legacy Surfaces

| Surface | Type | Adoption gate evidence | Removal notes |
|---------|------|------------------------|---------------|
| | | | |

## Migrated Legacy Surfaces

| Surface | Type | Replacement path | Bundled consumers migrated | Evidence |
|---------|------|------------------|----------------------------|----------|
| | | | | |

## Contained Legacy Surfaces

| Surface | Type | Compatibility bridge | Diagnostics emitted | Deprecation state |
|---------|------|----------------------|---------------------|-------------------|
| | | | | |

## Remaining Legacy Surfaces

| Surface | Type | Reason remaining | Owner | Risk | Follow-up gate |
|---------|------|------------------|-------|------|----------------|
| | | | | | |

## No-Net-Increase Decision

- Added legacy-only surfaces: <count>
- Removed or migrated surfaces: <count>
- Contained surfaces with bridge diagnostics: <count>
- Remaining surfaces with follow-up gate: <count>

Decision: PASS | BLOCKED

Rationale: <short explanation>
```

## Validation Rules

- Added legacy-only surfaces should be zero. Any addition requires explicit temporary justification and a sunset gate.
- Remaining surfaces must have owner, risk, and follow-up gate.
- Contained surfaces must identify a compatibility bridge or host boundary.
- Removed surfaces must cite adoption gate evidence.
- The inventory must support the domain spec's no-net-increase claim before planning.
