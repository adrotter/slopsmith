# Contract: Audio Mix Diagnostics Schema

Diagnostics remain part of the browser audio-session contribution schema `slopsmith.audio_session.diagnostics.v1`. This file documents the audio-mix portion expected after the control-plane migration.

```json
{
  "schema": "slopsmith.audio_session.diagnostics.v1",
  "session": {
    "sessionId": "main:<redacted-song>",
    "playerId": "main",
    "songFormat": "psarc",
    "state": "active"
  },
  "domains": {
    "audio-mix": {
      "route": {
        "routeId": "song-output",
        "routeKind": "html5",
        "availability": "available",
        "selectedByUser": true,
        "fallbackReason": ""
      },
      "analyser": {
        "source": "core",
        "availability": "available",
        "participantId": "core.song",
        "reason": ""
      },
      "participants": [
        {
          "participantId": "core.song",
          "ownerPluginId": "core",
          "label": "Song",
          "kind": "song",
          "availability": "available",
          "sourceMode": "core",
          "fader": {
            "id": "song",
            "label": "Song",
            "unit": "%",
            "min": 0,
            "max": 100,
            "step": 1,
            "defaultValue": 80,
            "currentValue": 72,
            "userAdjustable": true
          },
          "operations": ["fader.get-value", "fader.set-value"]
        }
      ],
      "bridges": [
        {
          "bridgeId": "audio-mix.fader-registry",
          "legacySurface": "window.slopsmith.audio.registerFader",
          "participantId": "fader.plugin.delay",
          "status": "overshadowed",
          "outcome": "handled",
          "hitCount": 1,
          "reason": "native participant controls visible fader"
        }
      ]
    }
  },
  "recentOutcomes": [
    {
      "domain": "audio-mix",
      "operation": "fader.set-value",
      "participantId": "plugin.nam_tone",
      "faderId": "output",
      "outcome": "failed",
      "status": "timeout",
      "reason": "fader.set-value timed out after 2000 ms",
      "timestamp": "2026-05-30T00:00:00.000Z"
    }
  ]
}
```

## Redaction Rules

- Do not include raw audio buffers.
- Do not include raw FFT/frequency arrays.
- Do not include raw device labels or stable hardware identifiers.
- Do not include secrets, API keys, bearer tokens, or plugin-private credentials.
- Do not include unredacted local file paths.
- Bound free-form reason strings before including them in diagnostics.
- Preserve only the most recent bounded outcome history already allowed by the capability snapshot budget.
