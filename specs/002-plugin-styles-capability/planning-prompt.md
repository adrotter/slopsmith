# Planning-Agent Prompt — Plugin `styles` Capability + Tailwind Freshness Guard

> Hand this entire file to a planning agent. **Your job is to produce a
> detailed, file-by-file implementation plan and a test/verification strategy
> — not to write production code.** Read the cited files first; verify every
> file:line coordinate against the live tree before relying on it (this repo
> moves fast and line numbers drift).

---

## 0. Role & deliverables

You are an implementation architect for the **slopsmith** core repo
(`~/Repositories/slopsmith`, public: github.com/byrongamatos/slopsmith,
now under the `slopsmith` org). Produce:

1. A step-by-step implementation plan, grouped into the 3 phases below, each
   step naming the exact file(s), the change, and why.
2. A test strategy (Python `pytest` + `node --test` JS tests + manual/visual
   checks) tied to the acceptance scenarios in `spec.md`.
3. A determinism/verification plan for the CI Tailwind rebuild (prove the
   committed CSS rebuilds byte-stable).
4. A PR decomposition with merge order and risk notes.
5. An explicit list of open questions / things to confirm in the live tree,
   with your recommended default for each.

Do **not** start coding. End with the plan for human review.

## 1. Constitution first (MANDATORY)

Before anything, read `~/Repositories/slopsmith/.specify/memory/constitution.md`
— specifically **Principle II (Vanilla Frontend)** and **Governance**. This
feature already amended it to **1.1.0** (in the worktree, see §4). Your plan
MUST NOT violate Principle II: no frontend framework, no JS build pipeline in
core, no build step on the serve/runtime path, no Tailwind Play CDN (for core
OR plugins), UI state in `localStorage`/backend.

## 2. Background — why this exists

- **PR #411** (`08faa88`, merged 2026-05-27, shipped in 0.2.9-alpha.7) replaced
  the Tailwind **Play CDN** (`cdn.tailwindcss.com`) with a **prebuilt static
  stylesheet** `static/tailwind.min.css`. Motivation: the CDN is a runtime JIT
  that rescanned the DOM ~1.8×/sec on the main thread; a reporter on
  **slopsmith-desktop#110** measured **4357 dropped frames in 17 min (~26%)**
  with the 3D highway running. The static file killed that. **This frame-rate
  win is non-negotiable — no solution may reintroduce a runtime JIT.**
- A prebuilt stylesheet only contains classes the build **scanner saw at build
  time**. Critically, the codebase uses **221 arbitrary-value classes**
  (`max-h-[85vh]`, `grid-cols-[1fr_auto_auto]`, `shadow-[0_0_8px_rgba(...)]`).
  Arbitrary values are emitted **only** when their literal string is scanned —
  there is **no "complete" Tailwind utility set** that contains them. **This
  means a content-scanned build is mandatory; "just ship everything" is
  impossible. Do not propose it.**
- Two unguarded surfaces remain after #411:
  1. **Core staleness** — committed CSS can lag source if someone forgets to
     run the build. Nothing guards it.
  2. **Plugin coverage** — core's build scans `./plugins/**`, but only plugins
     on disk at core build time. Community/NAS plugins installed at *runtime*
     are never scanned, so their classes (esp. arbitrary values) are absent and
     their UI renders unstyled.

## 3. Decisions ALREADY MADE with the user (do not re-litigate)

- **Scope** = all of: spec the feature, build the `styles` capability, pilot
  one bundled plugin, AND ship the CI freshness guard ("Option A"). Plus a
  cheap glob-widening.
- **`styles` manifest value = single string** for v1 (e.g.
  `"styles": "assets/plugin.css"`), forward-compatible to an array later.
  (Confirm this is still the intent; default = single string.)
- **Plugins self-contain their utilities** (build with
  `corePlugins.preflight = false` — utilities only; core ships the one base
  reset). Plugins do NOT assume core's purged set.
- **Additive, non-breaking rollout**: plugins without `styles` behave exactly
  as today; core keeps scanning `./plugins/**` until all bundled plugins are
  migrated; only THEN narrow core globs to `./static/**` (a later, separate
  task — NOT in this work).
- Work happens in an isolated **git worktree** at
  `~/Repositories/slopsmith-styles`, branch `feat/plugin-styles-capability`,
  based on `origin/main` (which contains the prerequisites: #411 static
  Tailwind, #620 asset route, #245 capability system). The primary checkout has
  an in-flight PR (#624) — do not disturb it.

## 4. Artifacts ALREADY WRITTEN (in the worktree — read them, build on them)

- `.specify/memory/constitution.md` — amended to **1.1.0** (Principle II prose
  corrected; new plugin-styling non-negotiable rule added; footer
  `Last Amended: 2026-06-01`). Per Governance, the amendment also requires a
  `CHANGELOG.md` "Migration notes" entry and a `CLAUDE.md` update — **verify
  whether those were done and include them in your plan if not.**
- `specs/002-plugin-styles-capability/spec.md` — 3 user stories, FR-001..008,
  scope, success criteria. One `[NEEDS CLARIFICATION]` (string vs array).
- `specs/002-plugin-styles-capability/plan.md` — phase breakdown + file map +
  risks + PR split. **Your detailed plan should refine/expand this, not
  duplicate it.**

## 5. Exact integration points (verify against live tree)

- **Manifest → capability booleans**: `plugins/__init__.py`, function
  `_nav_entry()` (~L834). It builds `has_screen/has_script/has_settings/
  has_tour` from the manifest WITHOUT importing plugin code. Add
  `has_styles = bool(manifest.get("styles"))` and pass `styles` through to the
  nav entry that `/api/plugins` returns. Mirror the existing pattern exactly.
- **Asset serving (reuse, do NOT add a route)**:
  `/api/plugins/{plugin_id}/assets/{asset_path:path}` at
  `plugins/__init__.py:~1570`, sandboxed via `safe_join` against
  `<plugin>/assets`. The plugin stylesheet is served through this.
- **Frontend plugin-JS loader (the pattern to mirror for CSS)**:
  `static/app.js:~7075-7096`. It injects
  `<script src="/api/plugins/{id}/screen.js?v={version}">`, with
  `_removePluginScriptTags(id)` to dedup on version change and a
  `loadedScripts` Map keyed by plugin id → version. Build the analogous
  `_injectPluginStyles(plugin)` + `_removePluginStyleTags(id)` for
  `<link rel="stylesheet" data-plugin-id data-plugin-version
  href="/api/plugins/{id}/assets/{styles}?v={version}">`. **Inject the link
  BEFORE screen HTML/JS** so styles are present on first paint. Settings-panel
  injection happens nearby (~L7050) if relevant.
- **Tailwind build script**: `scripts/build-tailwind.sh` — pins
  `tailwindcss@3.4.19`, input `static/_tailwind.src.css`, config
  `tailwind.config.js`, `--minify`. Output committed to `static/tailwind.min.css`.
- **Tailwind config**: `tailwind.config.js` — `content` globs currently:
  `./static/**/*.{html,js}`, `./plugins/**/static/**/*.{html,js}`,
  `./plugins/**/screen.js`, `./plugins/**/settings.html`, `./plugins/**/*.html`.
  Plan to **widen** the plugin globs to `./plugins/**/*.{js,html}` (closes the
  silent hole where files like `plugins/app_tour_*/script.js` aren't scanned —
  currently harmless because those files carry no Tailwind classes, but latent).
  There is also a `safelist` (regex for dynamically-built color classes) and
  `theme.extend` (dark/accent/gold colors, Inter font).
- **CI conventions**: `.github/workflows/tests.yml` — `runs-on: ubuntu-latest`,
  `actions/checkout@v4`, Python 3.12 job, an existing `git grep` "guard" step
  that fails with `::error file=...,line=...::`, runs `pytest` and
  `node --test tests/js/*.test.js`. Add a **separate** `tailwind-fresh` job
  (needs `actions/setup-node@v4`, node 20) that runs `bash
  scripts/build-tailwind.sh` then fails on
  `git diff --quiet -- static/tailwind.min.css`, naming the file + the fix
  command. **Hard-fail** (matches the existing print() guard); do NOT
  auto-commit regenerated CSS.

## 6. Phase outline to plan against

**Phase 1 — CI guard + glob widen (independent, shippable alone)**
- Add `tailwind-fresh` CI job. Widen plugin content glob. Regenerate
  `static/tailwind.min.css` under the wider glob IN THE SAME COMMIT (else CI
  flags its own diff). Confirm regeneration is reproducible.

**Phase 2 — `styles` capability (additive)**
- Loader (`_nav_entry`) + `/api/plugins` payload. Frontend inject/dedup.
- Tests: JS tests for inject-once + dedup-on-upgrade; Python test that a
  manifest with `styles` surfaces `has_styles: true`.
- Docs: plugin authoring guide — the `styles` key, a `preflight:false`
  `tailwind.config.js` template, and a one-shot build script for plugin authors.

**Phase 3 — `highway_3d` pilot (lives in a SEPARATE plugin repo)**
- IMPORTANT: `plugins/highway_3d/` is git-tracked IN core, but slopsmith
  **bundles plugins from upstream repos** (CI clones each plugin's upstream;
  local builds copy from disk — see the user's memory
  `reference_slopsmith_desktop_plugin_bundling`). **You must determine the
  upstream source repo for `highway_3d`** (do not assume it's
  `slopsmith-plugin-drum-highway-3d` — that's a DIFFERENT plugin). Make the
  pilot change upstream, then re-bundle into core.
- Give it `tailwind.config.js` (`corePlugins: { preflight: false }`, content
  globs over its own files), a build script, build `assets/plugin.css`, declare
  `"styles": "assets/plugin.css"`. Verify visual parity vs current rendering.

## 7. Constraints, risks, and things to confirm

- **Frame rate is sacred**: no runtime JIT / CDN anywhere, core or plugin.
- **Serve path stays build-free**: only maintainer/CI-time builds; committed
  artifacts.
- **Determinism**: pinned tailwindcss version + git-tracked content set ⇒
  byte-stable rebuild. Confirm `node`/`npx` available in CI and locally; `npx -y
  tailwindcss@3.4.19` re-downloads each run (~10-20s) — note if caching is worth
  it. Watch for trailing-newline / line-ending drift.
- **FOUC**: plugin `<link>` should precede screen markup; a single unstyled
  frame is acceptable for a self-hosted single-user app — confirm the user
  agrees if you propose anything fancier.
- **`safe_join` containment**: the stylesheet must resolve under
  `<plugin>/assets` only; do not widen the asset route's surface.
- **Backward compat**: a plugin without `styles` must be byte-for-byte
  unaffected. Add a regression test asserting no `<link>` is injected.
- Confirm: does any bundled plugin ALREADY ship a CSS file some other way
  (inline `<style>`, a `style.css` referenced from `screen.html`)? If so, note
  how `styles` interacts with it.
- Confirm Governance side-effects of the constitution amendment: `CHANGELOG.md`
  "Migration notes" entry + `CLAUDE.md` sync (the amendment process requires
  both).

## 8. Review/merge process (this repo's norms — from user memory)

- Run the **Codex review loop locally before pushing**; only push when Codex
  returns 0 issues. Forbid web search in Codex; `timeout 120`; avoid quote
  literals in the Codex prompt.
- After pushing: iterate on **GitHub Copilot** review comments until silent,
  and on **CodeRabbit** (`@coderabbitai review`) — CodeRabbit IS active on core.
  Resolve review threads as fixes land. **Do NOT auto-merge**; the human merges.
- PRs land on `slopsmith/slopsmith` (the org) — that URL is correct.

Produce the plan now.
