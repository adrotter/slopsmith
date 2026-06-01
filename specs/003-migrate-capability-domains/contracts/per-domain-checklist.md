# Contract: Per-Domain Migration Checklist

Each future capability-domain specification MUST include a completed checklist derived from this contract before `/speckit-plan` begins for that domain.

## Required Checklist Format

```markdown
# Per-Domain Migration Checklist: <domain or domain family>

**Feature**: <link to domain spec>
**Reference Standard**: specs/003-migrate-capability-domains/contracts/migration-standard.md
**Context**: specs/003-migrate-capability-domains/spec.md
**Status**: Draft | Ready for planning | Blocked | Superseded

## Domain Contract

- [ ] Domain name or domain family is named.
- [ ] Owner is identified.
- [ ] Participant roles are listed.
- [ ] Public commands are listed.
- [ ] Provider operations are listed when applicable.
- [ ] Emitted and observed events are listed when applicable.
- [ ] Safety class is stated.
- [ ] Included scope is stated.
- [ ] Excluded scope is stated.

## Host Boundary And Architecture Improvement

- [ ] Real host workflow or provider workflow is described.
- [ ] Domain host boundary is identified.
- [ ] Slice explains how new behavior avoids legacy-only globals, wrapper chains, direct DOM mutation, private state access, or plugin-specific handshakes.
- [ ] At least one architecture improvement is documented.
- [ ] Residual legacy behavior is documented with owner, risk, and follow-up gate.

## Compatibility Bridge

- [ ] Covered legacy surfaces are listed.
- [ ] Compatibility bridge behavior is described.
- [ ] Legacy path preserves equivalent user-visible behavior during transition.
- [ ] Bridge failure is distinguishable from native capability failure.
- [ ] Unused legacy surfaces, if any, have documented proof.

## Diagnostics And Inspector

- [ ] Applicable outcomes are listed.
- [ ] Diagnostics identify domain, owner or participant, bridge if any, and outcome.
- [ ] Capability Inspector or equivalent support-surface behavior is described.
- [ ] Sensitive or privileged data has redaction/consent/confirmation expectations.

## Deprecation

- [ ] Each legacy surface has a deprecation state.
- [ ] New bundled code is blocked from deprecated legacy patterns once replacement exists.
- [ ] Removal is blocked until bundled migration, external review, migration notes, and warning/diagnostics window are complete.

## Per-Slice Legacy Inventory

- [ ] Inventory records added legacy surfaces.
- [ ] Inventory records removed legacy surfaces.
- [ ] Inventory records migrated legacy surfaces.
- [ ] Inventory records contained legacy surfaces.
- [ ] Inventory records remaining legacy surfaces.
- [ ] Inventory proves no net increase in legacy-only integration points.

## Testing And Review Evidence

- [ ] New capability path has validation coverage.
- [ ] Compatibility path has validation coverage.
- [ ] Equivalent user-visible behavior is validated during transition.
- [ ] Missing/disabled/incompatible participants are validated where applicable.

## Migration Notes

- [ ] Plugin-author migration notes are included or linked.
- [ ] Notes identify legacy surface and replacement path.
- [ ] Notes explain compatibility period, warnings/diagnostics, and removal gate.

## Parallel Coordination

- [ ] Shared runtime primitives touched by the slice are listed.
- [ ] Overlap with active domain slices is documented.
- [ ] Owner and sequencing are clear when overlap exists.

## Initial Promotion Priority

- [ ] Initial domain promotion follows the declared priority order: audio graph/session, song ingest/jobs, player UI surfaces, playback/transport, then note detection.
- [ ] Any skipped higher-priority initial domain has an owner, risk, and follow-up gate.

## Exceptions

| Item | Exception | Owner | Risk | Follow-up gate |
|------|-----------|-------|------|----------------|
| | | | | |
```

## Readiness Rule

A domain checklist can be marked "Ready for planning" only when all required items are complete or every exception has an owner, risk, and follow-up gate that does not violate compatibility, diagnostics, no-net-legacy-growth, or initial-promotion priority requirements.
