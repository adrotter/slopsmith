# Feature Specification: Plugin `styles` Capability + Tailwind Freshness Guard

**Feature Branch**: `feat/plugin-styles-capability`
**Created**: 2026-06-01
**Status**: Draft
**Input**: User description: "keep the improved frame rate AND have Tailwind
bundled; update the plugin capabilities so plugins can follow the no-CDN /
prebuilt-CSS rules"

> Follow-up to PR #411 (replaced the Tailwind Play CDN with a prebuilt static
> stylesheet, fixing ~26% dropped frames from the CDN's runtime JIT). That
> change is correct but left two unguarded surfaces: (1) core's committed CSS
> can silently go stale, and (2) plugins not present in the core repo at build
> time — community / NAS plugins installed at runtime — get **none** of their
> Tailwind classes, because core's build never scanned them. This feature
> closes both without reintroducing any runtime JIT.

## Problem

A prebuilt Tailwind stylesheet contains only the classes the build scanner
found in source at build time. Arbitrary values (`max-h-[85vh]`,
`grid-cols-[1fr_auto_auto]`) are emitted **only** when their literal string is
seen — there is no "complete" utility set to ship instead. Therefore:

- **Core staleness**: adding a class and forgetting to run
  `scripts/build-tailwind.sh` ships an unstyled element. Nothing guards it.
- **Plugin coverage**: core's content globs scan `./plugins/**`, but only
  plugins on disk at core build time. A plugin installed/updated afterwards
  is invisible to the build, so its classes (especially arbitrary values) are
  absent from the served CSS and its UI renders unstyled.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A community plugin styles correctly after runtime install (P1)

A user installs a third-party plugin into `CONFIG_DIR/plugins/` while the
container is running. The plugin uses Tailwind utilities including arbitrary
values. Its screen renders fully styled on first activation, with no core
rebuild and no CDN.

**Why this priority**: This is the capability gap that PR #411 opened. Without
it, every runtime-installed plugin that uses Tailwind is visually broken.

**Independent Test**: Drop a plugin declaring `"styles": "assets/plugin.css"`
(a preflight-off compiled stylesheet using `text-[11px]` and a custom color)
into the plugins dir, open its screen, confirm those classes apply and that
core's `tailwind.min.css` was NOT modified.

**Acceptance Scenarios**:

1. **Given** a plugin with `styles` in its manifest, **When** the user opens
   its screen, **Then** a `<link rel="stylesheet">` to
   `/api/plugins/{id}/assets/{styles}?v={version}` is injected once and its
   utilities apply.
2. **Given** the same plugin upgraded to a new `version`, **When** its screen
   re-activates, **Then** the stale `<link>` is removed and the new versioned
   URL is loaded (no duplicate tags, no stale cache).
3. **Given** a plugin WITHOUT `styles`, **When** it loads, **Then** behaviour
   is identical to today (no `<link>` injected; it relies on core utilities).

### User Story 2 — Core CSS cannot silently go stale (P1)

A contributor opens a PR that adds a Tailwind class to core or a bundled
plugin without regenerating `static/tailwind.min.css`. CI fails with a clear
message pointing at the file and the fix command.

**Independent Test**: Add `class="text-[99px]"` to a scanned file without
rebuilding; push; confirm the `tailwind-fresh` CI job fails and names
`static/tailwind.min.css`.

**Acceptance Scenarios**:

1. **Given** committed CSS that matches source, **When** CI runs, **Then** the
   guard passes.
2. **Given** committed CSS that lags source, **When** CI runs, **Then** the
   guard fails and prints `bash scripts/build-tailwind.sh` as the remedy.

### User Story 3 — A bundled plugin owns its own styles (P2, pilot)

`highway_3d` ships its own compiled `assets/plugin.css` (preflight off) and is
removed from core's content globs, proving the decentralized model end to end
while staying visually identical.

## Functional Requirements *(mandatory)*

- **FR-001**: The plugin manifest MUST accept an optional `styles` key — a
  single string: a plugin-root-relative path that MUST begin with `assets/`
  (e.g. `assets/plugin.css`), pointing at a compiled CSS file served via the
  sandboxed asset route. v1 is **single string only**; an array of paths is
  explicitly out of scope and deferred to a future FR (to be added if/when a
  bundled plugin needs multiple sheets), so the manifest, schema, loader, and
  frontend all agree on one contract and avoid cross-layer drift. (Resolved:
  single string — chosen for v1.)
- **FR-002**: The loader MUST expose a manifest-only `has_styles` boolean in
  the nav entry, derived without importing plugin code (mirrors `has_screen`).
- **FR-003**: The frontend MUST inject the plugin stylesheet `<link>` exactly
  once per active plugin, with `?v={version}` cache-busting and
  remove-stale-on-upgrade dedup, mirroring the existing `screen.js` loader.
- **FR-004**: The stylesheet MUST be served via the existing
  `/api/plugins/{id}/assets/{path}` route — no new route, no path-traversal
  surface beyond what `safe_join` already enforces.
- **FR-005**: Plugins MUST build their stylesheet with
  `corePlugins.preflight = false` (utilities only; core ships the base reset
  once). This is a documented authoring rule + scaffold, not a runtime check.
- **FR-006**: CI MUST regenerate `static/tailwind.min.css` and fail on any
  diff (the `tailwind-fresh` guard), naming the file and the fix command.
- **FR-007**: Core's content globs MUST be widened to `./plugins/**/*.{js,html}`
  so no plugin source file is silently unscanned while bundled plugins still
  rely on core's build (pre-migration safety).
- **FR-008**: Rollout MUST be additive — plugins without `styles` behave
  exactly as today. Narrowing core globs to `./static/**` happens only after
  all bundled plugins are migrated (tracked separately).

## Out of Scope

- Reintroducing any runtime Tailwind JIT / Play CDN (constitutional).
- A serve-time build step for core or plugins.
- Automatically running plugin CSS builds during core CI (plugins build at
  their own release time, in their own repos).

## Success Criteria

- A runtime-installed plugin with arbitrary-value classes renders fully
  styled, core CSS unchanged.
- DevTools shows no `cdn.tailwindcss.com` and no per-frame CSS work.
- A stale-CSS PR fails CI deterministically.
- `highway_3d` pilot renders byte-identically to today after migrating to its
  own stylesheet.
