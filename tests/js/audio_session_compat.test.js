const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadAudioSession, runBrowserScript, installMixerDom } = require('./audio_session_test_harness');

function installAnalyserDom(window) {
    const audio = { addEventListener() {} };
    window.document.getElementById = id => (id === 'audio' ? audio : null);
    window.document.createElement = () => ({ getContext: () => null, style: {}, addEventListener() {}, setAttribute() {} });
    window.document.addEventListener = () => {};
    window.document.removeEventListener = () => {};
    window.Image = class Image {};
    window.URL = { createObjectURL: () => 'blob:test', revokeObjectURL() {} };
    window.Blob = class Blob {};
    window.AudioContext = class AudioContext {
        constructor() { this.state = 'running'; this.destination = {}; }
        createMediaElementSource() { return { connect() {} }; }
        createAnalyser() { return { context: this, frequencyBinCount: 128, fftSize: 0, connect() {}, getByteFrequencyData(data) { data.fill(1); } }; }
        resume() { return Promise.resolve(); }
        close() { return Promise.resolve(); }
    };
}

test('legacy fader API remains compatible while bridge hits are attributed', async () => {
    const window = loadAudioSession();
    installMixerDom(window);
    runBrowserScript(window, 'static/audio-mixer.js');

    let volume = 0.5;
    window.slopsmith.audio.registerFader({
        id: 'plugin.delay',
        label: 'Delay',
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.5,
        getValue: () => volume,
        setValue: value => { volume = value; },
    });

    const snapshot = window.slopsmith.audioSession.snapshot();
    assert.equal(window.slopsmith.audio.getFaders().some(fader => fader.id === 'plugin.delay'), true);
    assert.equal(snapshot.domains['audio-mix'].participants.some(participant => participant.participantId === 'fader.plugin.delay'), true);
    assert.equal(snapshot.domains['audio-mix'].bridges.some(bridge => bridge.bridgeId === 'audio-mix.fader-registry'), true);
});

test('legacy analyser fallback records bridge status without losing analyser output', () => {
    const window = loadAudioSession();
    installAnalyserDom(window);
    runBrowserScript(window, 'plugins/highway_3d/screen.js');

    const analyser = window.slopsmithViz_highway_3d.__test.getAnalyserForBridgeTest();
    const bands = window.slopsmithViz_highway_3d.__test.readBandsForBridgeTest();
    const bridge = window.slopsmith.audioSession.snapshot().domains['audio-mix'].bridges.find(entry => entry.bridgeId === 'audio-mix.analyser');

    assert.equal(analyser.source, 'core');
    assert.equal(bands.bass > 0, true);
    assert.equal(bridge.outcome, 'handled');
});

test('barrier and input compatibility surfaces are visible in diagnostics', () => {
    const window = loadAudioSession();
    const audioSession = window.slopsmith.audioSession;

    audioSession.recordBridgeHit({ domain: 'audio-monitoring', bridgeId: 'audio-monitoring.audio-barrier', legacySurface: 'window.slopsmithAudioBarrier', participantId: 'note_detect', outcome: 'degraded', reason: 'timeout' });
    audioSession.recordBridgeHit({ domain: 'audio-input', bridgeId: 'audio-input.legacy-source', legacySurface: 'navigator.mediaDevices.getUserMedia', participantId: 'note_detect', outcome: 'denied', reason: 'permission denied' });

    const snapshot = audioSession.snapshot();
    assert.equal(snapshot.domains['audio-monitoring'].bridges.some(bridge => bridge.bridgeId === 'audio-monitoring.audio-barrier' && bridge.outcome === 'degraded'), true);
    assert.equal(snapshot.domains['audio-input'].bridges.some(bridge => bridge.bridgeId === 'audio-input.legacy-source' && bridge.outcome === 'denied'), true);
});

test('legacy registerFader callbacks are usable through audio-mix get and set operations', async () => {
    const window = loadAudioSession();
    installMixerDom(window);
    runBrowserScript(window, 'static/audio-mixer.js');
    window.slopsmith.audioSession.startSession({ sessionId: 'main:test-song' });

    let gain = 0.35;
    window.slopsmith.audio.registerFader({
        id: 'plugin.gain',
        label: 'Plugin Gain',
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
        getValue: () => gain,
        setValue: value => { gain = Math.min(0.9, value); return gain; },
    });

    const api = window.slopsmith.capabilities;
    const listed = await api.dispatch({ capability: 'audio-mix', command: 'list-faders', source: 'test' });
    const read = await api.dispatch({ capability: 'audio-mix', command: 'get-fader-value', source: 'test', payload: { participantId: 'fader.plugin.gain', faderId: 'plugin.gain' } });
    const written = await api.dispatch({ capability: 'audio-mix', command: 'set-fader-value', source: 'test', payload: { participantId: 'fader.plugin.gain', faderId: 'plugin.gain', value: 1 } });

    assert.equal(listed.payload.faders.some(fader => fader.participantId === 'fader.plugin.gain' && fader.sourceMode === 'compatibility'), true);
    assert.equal(read.payload.committedValue, 0.35);
    assert.equal(written.payload.committedValue, 0.9);
    assert.equal(gain, 0.9);

    window.slopsmith.audio.unregisterFader('plugin.gain');
    assert.equal(window.slopsmith.audio.getFaders().some(fader => fader.id === 'plugin.gain'), false);
    assert.equal(window.slopsmith.audioSession.snapshot().domains['audio-mix'].participants.some(participant => participant.participantId === 'fader.plugin.gain'), false);
});