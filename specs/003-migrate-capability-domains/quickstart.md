# Quickstart: Applying The Capability Migration Standard

Use this guide when creating a future capability-domain spec after PR #245.

## 1. Start From The Reference Standard

Read:

- [spec.md](spec.md)
- [contracts/migration-standard.md](contracts/migration-standard.md)
- [contracts/per-domain-checklist.md](contracts/per-domain-checklist.md)
- [contracts/legacy-inventory.md](contracts/legacy-inventory.md)

The reference standard answers: how should any domain migrate responsibly?

A future domain spec answers: what does this specific domain own, expose, migrate, test, and deprecate?

## 2. Confirm The Domain Is Ready To Promote

Before writing a domain spec, confirm the domain has:

- a real host workflow or provider workflow
- clear user or maintainer value
- a known owner model
- compatibility behavior to preserve or an explicit unused-surface proof
- diagnostics and Inspector/support visibility needs

If the domain has no concrete host workflow, keep it roadmap-only.

## 3. Create The Domain Spec

Create a focused spec for one domain or tightly related domain family. The spec should cite this reference standard and include:

- owner and participant roles
- public commands and provider operations
- events, if any
- safety class
- included and excluded scope
- compatibility bridge
- diagnostics outcomes
- Capability Inspector or support-surface behavior
- migration notes for plugin authors

Do not copy the full reference standard into the domain spec; link to it and complete the per-domain checklist.

## 4. Add The Per-Domain Checklist

Copy the checklist structure from [contracts/per-domain-checklist.md](contracts/per-domain-checklist.md) into the future domain spec's checklist directory.

A future domain should not run `/speckit-plan` until that checklist is complete or every exception has:

- owner
- risk
- follow-up gate
- no violation of compatibility, diagnostics, or no-net-legacy-growth requirements
- no violation of initial-promotion priority requirements

## 5. Add The Legacy Inventory

Copy the inventory structure from [contracts/legacy-inventory.md](contracts/legacy-inventory.md).

Record domain surfaces as:

- added
- removed
- migrated
- contained
- remaining

Use the inventory to prove the slice does not increase legacy-only integration points.

## 6. Define The Deprecation Path

For every affected legacy surface, assign one state:

- supported compatibility
- deprecated with warning
- blocked for new bundled code
- removable

A legacy surface can be marked removable only after:

- bundled migration is complete or the surface is removed from bundled use
- documented external usage review is complete
- migration notes exist
- at least one release or notice period emitted warnings or compatibility diagnostics

## 7. Coordinate Parallel Domain Work

Domain specs may be designed in parallel. Implementation plans must coordinate if they touch shared capability runtime behavior.

Document:

- shared runtime primitives touched
- overlapping active domain slices
- owner of shared changes
- required sequencing

## 8. Validate Before Planning

Before running `/speckit-plan` for a future domain, check:

- central migration checklist applied
- per-domain checklist complete
- legacy inventory complete
- host workflow real and testable
- diagnostics outcomes visible
- compatibility bridge defined
- removal gates defined
- initial domain promotion follows the declared priority order when the slice is part of the first promotion set
- no speculative active runtime domain

## Example Domain Sequence

Recommended order for initial future domain consideration:

1. Audio graph/session
2. Song ingest/jobs
3. Player UI surfaces
4. Playback/transport
5. Note detection

Each domain should cite this standard but remain independently scoped and independently reviewable.
