# Contract: Audio Mix Migration Notes

## Legacy Surface: `window.slopsmith.audio.registerFader(...)`

**Current path**: Plugins register fader specs with `id`, `label`, `min`, `max`, `step`, `defaultValue`, `getValue`, and `setValue`.

**Replacement path**: Plugins register native `audio-mix` participants with `fader.get-value` and `fader.set-value` operations.

**Compatibility behavior**:

- Existing `registerFader(...)` calls continue to work.
- The compatibility adapter registers a compatibility-backed audio-mix participant.
- The player mixer consumes the audio-mix control plane, not the legacy registry, once native commands are available.
- Native participants win over matching legacy faders; suppressed legacy faders are recorded as compatibility-backed/overshadowed.

**Removal gate**:

- Core mixer UI consumes `audio-mix` commands only.
- Bundled plugins with faders have native declarations or an explicit compatibility exception.
- Diagnostics report bridge hits for at least one notice period.
- Plugin-author migration notes are published.

## Legacy Surface: Core Song Volume

**Current path**: `applySongVolume`, `readSongVolume`, HTML audio `volume`, optional desktop `setGain('backing')`, and existing `localStorage` key.

**Replacement path**: Core song volume becomes a core-owned audio-mix participant and fader operation while preserving existing preference behavior.

**Compatibility behavior**:

- Existing user song-volume preference remains valid.
- Core persists only core song volume.
- Route changes continue to report through `audio-mix.song-volume` and route summaries.

## Legacy Surface: Analyser Access

**Current path**: Direct analyser setup by visualization code or stem analyser access.

**Replacement path**: `inspect-analyser` and `analyser.get-summary` expose availability/source metadata only.

**Compatibility behavior**:

- Existing analyser consumers continue to work during migration.
- Bridge hits record whether analyser access came from core, stems, unavailable, or conflict paths.
- Raw audio/FFT data remains out of diagnostics.

## Plugin Author Checklist

- Declare `audio-mix` provider intent in `plugin.json`.
- Register a stable participant id.
- Provide a fader id and user-facing label.
- Return committed values from set operations.
- Settle get/set operations within 2 seconds.
- Persist plugin-owned fader values inside the plugin if persistence is desired.
- Mark temporary unavailability explicitly instead of unregistering if the fader should stay visible as disabled.
- Unregister only when the logical source should disappear.
