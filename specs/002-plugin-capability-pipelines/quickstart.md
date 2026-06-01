# Quickstart: Plugin Capability Pipelines

## Goal

Use this quickstart to validate the first capability-pipelines slice and prepare follow-up implementation tasks.

## 1. Confirm the active feature artifacts

```bash
.specify/scripts/bash/check-prerequisites.sh --json --paths-only
```

Expected feature directory:

```text
specs/002-plugin-capability-pipelines
```

## 2. Review the feature contracts

Read these artifacts before implementing tasks:

```text
specs/002-plugin-capability-pipelines/spec.md
specs/002-plugin-capability-pipelines/plan.md
specs/002-plugin-capability-pipelines/research.md
specs/002-plugin-capability-pipelines/data-model.md
specs/002-plugin-capability-pipelines/contracts/plugin-manifest.schema.json
specs/002-plugin-capability-pipelines/contracts/capability-runtime.md
specs/002-plugin-capability-pipelines/contracts/capability-diagnostics.md
```

## 3. Validate existing syntax before editing

```bash
node --check static/capabilities.js
node --check static/app.js
node --check static/diagnostics.js
python -m pytest tests/test_plugins.py tests/test_plugin_runtime_idempotence.py tests/test_diagnostics_bundle.py -q
node --test tests/js/*.test.js
```

## 4. Implement Slice 1 in small reviewable steps

Slice 1 is done when Slopsmith has:

1. Capability registry, manifest metadata, diagnostics snapshot, and idempotent hydration wired together.
2. Capability metadata validation that keeps invalid capability declarations out of the graph while loading valid legacy surfaces with warnings.
3. `capability-pipelines.v1` compatibility rules and unsupported-version diagnostics.
4. `library` provider-coordinator behavior covered by behavioral tests, including the core owner, local provider, plugin-backed providers, source selection, and sync.
5. Claim, dispatch, release, owner inference, and user override behavior covered by behavioral tests against a synthetic owner/requester fixture.
6. Claim lifecycle cleanup: requester disappearance releases claims; owner/handler disappearance marks claims orphaned and non-dispatchable.
7. Bundled Capability Inspector shows `library`, `diagnostics`, and `pipeline` state without registering deferred domains.
8. 64 KB capability diagnostics snapshot budget with older recent decisions trimmed first.
9. Safety class recorded for every stable command/domain, with privileged enforcement deferred until privileged domains ship.

## 5. Replace source-string assertions with behavior tests

Source-string checks may stay as smoke tests for script load order and legacy compatibility, but core runtime behavior should be tested by executing the runtime API.

Behavioral tests should cover:

```text
claim -> dispatch -> release
claim -> dispatch -> user override -> overridden
duplicate exclusive owners
provider-coordinator domains with explicit policy
no owner
owner with no command handler
unregister and re-register
idempotent registerParticipants
diagnostics snapshot redaction and size trimming
unsupported capability-pipelines version
invalid capability metadata ignored while legacy surfaces load
```

## 6. Implement Slice 2 after Slice 1 is stable

Follow-up authoring work keeps examples and validation fixtures aligned:

```text
plugins/capability_inspector/plugin.json
plugins/capability_inspector/screen.html
plugins/capability_inspector/screen.js
docs/capability-recipes.md
docs/plugin-manifest.schema.json
docs/capability-safety-matrix.md
```

The inspector ships with Slice 1 as a bundled first-party plugin/screen, optionally linked from Settings.

## 7. Run validation before review

```bash
node --check static/capabilities.js static/app.js static/diagnostics.js
node --test tests/js/*.test.js
python -m pytest -q
npx playwright test tests/browser/basic-load.spec.ts tests/browser/check-errors.spec.ts
```

If Playwright dependencies are not installed locally, use the existing project setup before running browser tests:

```bash
npm install
npm run install:playwright
```

## 8. Review checklist

Before requesting review, confirm:

- The first PR can be reviewed without understanding deferred privileged domains.
- Invalid capability metadata cannot enter the graph.
- Legacy plugin surfaces keep loading with warnings.
- Diagnostics are redaction-safe and at or below 64 KB per snapshot.
- Inspector data distinguishes declared intent from live handlers.
- Every stable command/domain has an owner kind and safety class.
- No runtime permission gates are required until privileged-domain slices ship.
