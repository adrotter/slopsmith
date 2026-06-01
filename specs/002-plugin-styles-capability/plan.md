# Implementation Plan: Plugin `styles` Capability + Tailwind Freshness Guard

**Branch**: `feat/plugin-styles-capability` | **Date**: 2026-06-01
**Spec**: [`spec.md`](./spec.md)
**Constitution**: amended to 1.1.0 (Principle II — prebuilt Tailwind + plugin
styling rule).

## Summary

Three independent, additive changes that together preserve the post-#411
frame-rate win while making Tailwind safe across core and plugins:

1. **CI freshness guard (A)** — a `tailwind-fresh` job rebuilds and diffs
   `static/tailwind.min.css`; widen core globs to `./plugins/**/*.{js,html}`.
2. **`styles` capability** — manifest key + `has_styles` + frontend `<link>`
   injection, served via the existing assets route.
3. **`highway_3d` pilot** — give one bundled plugin its own preflight-off CSS.

Nothing touches the serve/runtime path's build-free property; no JIT returns.

## Technical Context

- **Manifest parsing**: `plugins/__init__.py` `_nav_entry()` (~L834) derives
  `has_screen/has_script/has_settings/has_tour` from the manifest. Add
  `has_styles = bool(manifest.get("styles"))` and carry `styles` through to the
  nav entry payload `/api/plugins` returns.
- **Asset route**: `/api/plugins/{plugin_id}/assets/{asset_path:path}`
  (`plugins/__init__.py:1570`) already serves files under `<plugin>/assets`
  with `safe_join` containment. The stylesheet rides this — no new route.
- **Frontend injection**: plugin JS is loaded at `static/app.js:7075-7096` via
  a versioned `<script>` with `_removePluginScriptTags(id)` dedup. Mirror this
  for CSS: a `_injectPluginStyles(plugin)` helper that, when `has_styles` and
  the loaded version differs, removes any prior `link[data-plugin-id=id]` and
  appends `<link rel="stylesheet" data-plugin-id=id data-plugin-version=v
  href="/api/plugins/{id}/assets/{styles}?v={v}">`. Inject BEFORE the screen
  HTML/JS so styles are present on first paint.
- **Tailwind build**: `scripts/build-tailwind.sh` already pins
  `tailwindcss@3.4.19`, input `static/_tailwind.src.css`, config
  `tailwind.config.js`, `--minify`. Deterministic for fixed version + content.

## Phase 1 — CI guard + glob widening

- Add a `tailwind-fresh` job to `.github/workflows/tests.yml` (setup-node@v4,
  `node-version: 20`, run `bash scripts/build-tailwind.sh`, fail on
  `git diff --quiet -- static/tailwind.min.css` with a `::error file=…::`).
- Widen `tailwind.config.js` `content`: replace the four narrow `plugins/**`
  globs with `./plugins/**/*.{js,html}` (keep `./static/**/*.{html,js}`).
- Regenerate `static/tailwind.min.css` under the wider glob in the same commit
  (may add classes previously missed; never removes correct ones).

## Phase 2 — `styles` capability (additive, non-breaking)

- `plugins/__init__.py`: `_nav_entry()` → add `has_styles` + `styles` passthrough.
- `static/app.js`: add `_injectPluginStyles()` + `_removePluginStyleTags(id)`;
  call from the plugin-activation path alongside the screen/script loaders.
- Tests: extend `tests/js/*.test.js` for inject-once + dedup-on-upgrade;
  add a Python test that a manifest with `styles` yields `has_styles: true` in
  `/api/plugins`.
- Docs: plugin authoring guide — `styles` key, the `preflight:false`
  `tailwind.config.js` template, and a one-shot `build-tailwind.sh` for plugins.

## Phase 3 — `highway_3d` pilot (separate plugin repo)

- In `slopsmith-plugin-drum-highway-3d` (or whichever repo owns highway_3d):
  add `tailwind.config.js` (`corePlugins: { preflight: false }`, content globs
  over the plugin's own files), a `build-tailwind.sh`, build
  `assets/plugin.css`, declare `"styles": "assets/plugin.css"`.
- Verify visual parity against current bundled rendering.
- Only AFTER pilot proves out: plan narrowing core globs to `./static/**` and
  dropping the bundled-plugin scan (tracked as a follow-up task, not this PR).

## Risks & Mitigations

- **Determinism of the CI rebuild**: pinned version + git-tracked content set
  ⇒ byte-stable. If a platform ever diverges, regenerate in CI/container.
- **FOUC on plugin screens**: inject `<link>` before screen HTML; acceptable
  for a self-hosted single-user app even if a frame is unstyled.
- **Duplicated base reset**: prevented by mandating `preflight:false` in plugin
  builds (FR-005); core owns the single reset.
- **Order of operations**: glob widening + regenerate must land together or CI
  flags its own diff.

## PR Decomposition (suggested)

- PR 1: constitution amendment + CI guard + glob widen + regenerated CSS.
- PR 2: `styles` capability (loader + frontend + tests + docs).
- PR 3 (plugin repo): `highway_3d` pilot.
