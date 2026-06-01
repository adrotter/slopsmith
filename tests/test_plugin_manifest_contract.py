import json
from pathlib import Path

import plugins


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures" / "plugin_capabilities"


def _fixture(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_published_manifest_schema_contains_capability_contract():
    schema = json.loads((ROOT / "docs" / "plugin-manifest.schema.json").read_text(encoding="utf-8"))
    assert schema["properties"]["capabilities"]["additionalProperties"]["$ref"] == "#/$defs/capabilityDeclaration"
    declaration = schema["$defs"]["capabilityDeclaration"]
    assert "owner" in declaration["properties"]["roles"]["items"]["enum"]
    assert "provider-coordinator" in declaration["properties"]["kind"]["enum"]
    assert declaration["properties"]["operations"]["items"]["type"] == "string"
    assert declaration["properties"]["requests"]["items"]["type"] == "string"
    assert declaration["properties"]["observes"]["items"]["type"] == "string"
    assert "exclusive-owner" in declaration["properties"]["ownership"]["enum"]
    assert "diagnostic-only" in declaration["properties"]["safety"]["enum"]


def test_normalize_string_list_trims_and_drops_blank_entries():
    # Surrounding whitespace must be stripped (so version detection matches)
    # and empty-after-strip entries dropped (so they don't leak into the API).
    assert plugins._normalize_string_list(
        ["  capability-pipelines.v1  ", "   ", "", "plain", 7, None]
    ) == ["capability-pipelines.v1", "plain"]
    assert plugins._normalize_string_list("not-a-list") == []


def test_capability_lists_reject_whitespace_only_and_trim_padded_entries():
    # Whitespace-only command → invalid (warning, declaration dropped), matching
    # the browser runtime which trims/drops such entries.
    caps, warnings, _ = plugins._capability_warnings(
        {"standards": ["capability-pipelines.v1"],
         "capabilities": {"d": {"roles": ["owner"], "commands": ["   "]}}},
        "p",
    )
    assert caps == {}
    assert warnings
    # Padded-but-valid command → accepted and stored trimmed, so /api/plugins
    # matches the runtime.
    caps, warnings, _ = plugins._capability_warnings(
        {"standards": ["capability-pipelines.v1"],
         "capabilities": {"d": {"roles": ["owner"], "commands": ["  mute  ", "restore"]}}},
        "p",
    )
    assert not warnings
    assert caps["d"]["commands"] == ["mute", "restore"]


def test_capability_kind_is_omitted_when_empty_and_kept_when_declared():
    # kind defaults to "" internally, but "" is not a valid schema enum value,
    # so it must not be emitted into /api/plugins / diagnostics.
    caps, warnings, _ = plugins._capability_warnings(
        {"standards": ["capability-pipelines.v1"],
         "capabilities": {"d": {"roles": ["owner"]}}},
        "p",
    )
    assert not warnings
    assert "kind" not in caps["d"]
    # A declared, valid kind is preserved.
    caps, warnings, _ = plugins._capability_warnings(
        {"standards": ["capability-pipelines.v1"],
         "capabilities": {"d": {"roles": ["owner"], "kind": "provider-coordinator"}}},
        "p",
    )
    assert not warnings
    assert caps["d"]["kind"] == "provider-coordinator"


def test_capability_version_coercion_matches_runtime_number_semantics():
    # Numeric-string version "1" must be accepted (the runtime does
    # Number(version) === 1), not dropped as unsupported.
    caps, _w, unsupported = plugins._capability_warnings(
        {"standards": ["capability-pipelines.v1"],
         "capabilities": {"d": {"roles": ["owner"], "version": "1"}}},
        "p",
    )
    assert not unsupported
    assert caps["d"]["version"] == 1
    assert not caps["d"].get("incompatible")
    # Any finite version != 1 (here a numeric string "2") is still unsupported,
    # matching the runtime's Number.isFinite(v) && v !== 1 check.
    caps, _w, unsupported = plugins._capability_warnings(
        {"standards": ["capability-pipelines.v1"],
         "capabilities": {"d": {"roles": ["owner"], "version": "2"}}},
        "p",
    )
    assert unsupported
    assert caps["d"]["incompatible"] is True


def test_valid_owner_provider_fixture_passes_loader_validation():
    manifest = _fixture("valid_owner_provider.json")
    capabilities, warnings, unsupported = plugins._capability_warnings(manifest, manifest["id"])
    assert not warnings
    assert not unsupported
    assert capabilities["stems"]["roles"] == ["owner", "provider"]
    assert capabilities["stems"]["ownership"] == "exclusive-owner"
    # Human-readable text the runtime/Inspector display must survive
    # sanitization (static/capabilities.js reads declaration.description).
    assert capabilities["stems"]["description"] == manifest["capabilities"]["stems"]["description"]


def test_valid_requester_observer_fixture_passes_loader_validation():
    manifest = _fixture("valid_requester_observer.json")
    capabilities, warnings, unsupported = plugins._capability_warnings(manifest, manifest["id"])
    assert not warnings
    assert not unsupported
    assert capabilities["stems"]["roles"] == ["requester", "observer"]
    assert capabilities["stems"]["compatibility"] == "legacy-window-shim"


def test_invalid_capability_metadata_is_excluded_but_legacy_surfaces_survive():
    manifest = _fixture("invalid_capability_metadata.json")
    capabilities, warnings, unsupported = plugins._capability_warnings(manifest, manifest["id"])
    assert capabilities == {}
    assert warnings
    assert not unsupported
    ui = plugins._normalize_ui_contributions(manifest)
    assert {entry["legacy_source"] for entry in ui["legacy"]} == {"nav", "screen", "settings"}


def test_unsupported_version_is_reported_as_incompatible_not_executed():
    manifest = _fixture("unsupported_capability_version.json")
    capabilities, warnings, unsupported = plugins._capability_warnings(manifest, manifest["id"])
    assert not warnings
    assert unsupported
    assert capabilities["stems"]["incompatible"] is True
    assert capabilities["stems"]["mode"] == "disabled"
    assert capabilities["stems"]["safety"] == "diagnostic-only"


def test_recipe_manifest_examples_are_extractable_json_objects():
    recipes = (ROOT / "docs" / "capability-recipes.md").read_text(encoding="utf-8")
    blocks = []
    parts = recipes.split("```json")
    for part in parts[1:]:
        block, _, _tail = part.partition("```")
        blocks.append(json.loads(block))
    assert blocks, "recipe docs should include JSON manifest examples"
    for manifest in blocks:
        assert "capabilities" in manifest
        _capabilities, warnings, unsupported = plugins._capability_warnings(manifest, manifest.get("id", "recipe"))
        assert not warnings
        assert not unsupported
