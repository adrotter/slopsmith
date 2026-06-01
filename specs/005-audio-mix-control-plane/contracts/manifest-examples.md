# Contract: Audio Mix Manifest Examples

These examples show intended plugin declarations for the audio-mix control-plane migration. Exact manifest validation follows the `capability-pipelines.v1` runtime rules.

## Native Fader Provider

```json
{
  "standards": ["capability-pipelines.v1", "plugin-runtime-idempotent.v1"],
  "capabilities": {
    "audio-mix": {
      "roles": ["provider"],
      "operations": ["fader.get-value", "fader.set-value"],
      "emits": ["fader-value-changed"],
      "description": "Provides a user-adjustable output fader for the plugin audio path.",
      "mode": "active",
      "compatibility": "none",
      "safety": "safe"
    }
  }
}
```

## Compatibility-Backed Fader During Migration

```json
{
  "standards": ["capability-pipelines.v1"],
  "capabilities": {
    "audio-mix": {
      "roles": ["provider"],
      "operations": ["fader.get-value", "fader.set-value"],
      "observes": ["bridge-hit"],
      "description": "Currently registers through the legacy fader API and is attributed by the compatibility bridge.",
      "mode": "active",
      "compatibility": "legacy-window-shim",
      "safety": "safe"
    }
  }
}
```

## Audio-Mix Observer

```json
{
  "capabilities": {
    "audio-mix": {
      "roles": ["observer"],
      "observes": ["fader-value-changed", "route-changed", "route-degraded", "bridge-hit"],
      "mode": "active",
      "compatibility": "none",
      "safety": "safe"
    }
  }
}
```
