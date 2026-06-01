# Contract: Migration Standard

This contract defines the central reference checklist that future capability-domain specifications must satisfy before planning.

## Applicability

A future domain spec MUST apply this contract when it promotes a domain or domain family from roadmap-only status to an active capability contract.

A future domain spec MUST remain roadmap-only when it has no real host workflow, provider workflow, or user-visible behavior to validate.

## Central Migration Checklist

Each future domain spec MUST include evidence for every item below, either directly or by linking to its completed per-domain checklist.

### 1. Domain Contract

- Domain name or domain family is named.
- Domain owner is identified.
- Participant roles are listed.
- Public commands are listed.
- Provider operations are listed when applicable.
- Emitted and observed events are listed when applicable.
- Safety class is stated.
- Included and excluded scope are stated.

### 2. Host Boundary

- The domain host boundary is identified.
- The host workflow that justifies active promotion is described.
- The slice explains how it prevents new behavior from depending only on legacy globals, wrapper chains, direct DOM mutation, private state access, or plugin-specific handshakes.
- The slice documents at least one architecture improvement in the domain area.

### 3. Compatibility Bridge

- Covered legacy surfaces are listed.
- Compatibility behavior is described.
- Legacy and native paths are expected to preserve equivalent user-visible behavior during transition.
- Compatibility bridge failure is distinguishable from native capability failure.

### 4. Diagnostics And Inspector

- Applicable outcomes are listed: handled, denied, overridden, unsupported, no-owner, no-handler, incompatible, failed.
- Diagnostics identify the domain, owner or participant, compatibility bridge when applicable, and outcome.
- Capability Inspector or equivalent support surface visibility is described.
- Redaction and safety requirements are stated for sensitive or privileged domains.

### 5. Deprecation

- Each affected legacy surface has a deprecation state.
- New bundled code is blocked from using deprecated legacy patterns once a replacement path exists.
- Removable state requires bundled migration, documented external usage review, migration notes, and at least one release or notice period with warnings or compatibility diagnostics.

### 6. Legacy Inventory

- The domain includes a per-slice legacy inventory.
- The inventory records added, removed, migrated, contained, and remaining legacy surfaces.
- Remaining legacy surfaces have owner, risk, and follow-up gate.
- The inventory proves no net increase in legacy-only integration points.

### 7. Testing And Review Evidence

- New capability path behavior is testable.
- Compatibility path behavior is testable.
- New path and compatibility path have equivalent user-visible behavior during transition.
- Disabled, incompatible, or missing participants are testable when applicable.

### 8. Migration Notes

- Plugin-author migration notes are included or explicitly linked.
- Notes identify the legacy surface, replacement path, compatibility period, deprecation signals, and removal gate.

### 9. Parallel Coordination

- Shared runtime primitives touched by the slice are listed.
- Overlap with other active domain slices is documented.
- Ownership and sequencing are clear when overlap exists.

### 10. Initial Promotion Priority

- Initial domain promotion follows the declared priority order: audio graph/session, song ingest/jobs, player UI surfaces, playback/transport, then note detection.
- Any initial promotion batch lists domains in that order and documents why lower-priority domains wait when higher-priority domains are still candidates.
- A domain skipped during initial promotion has an explicit owner, risk, and follow-up gate.

## Validation Result

A future domain spec is ready for planning only when:

- all checklist sections are complete, or
- any exception has an owner, risk, and follow-up gate, and
- no exception violates compatibility, diagnostics, no-net-legacy-growth, or initial-promotion priority requirements.

Planning readiness MUST fail when the listed initial-promotion domain sequence deviates from the declared priority order unless every skipped higher-priority domain has an explicit owner, risk, and follow-up gate.
