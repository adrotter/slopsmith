const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadAudioSession, runBrowserScript, installMixerDom } = require('./audio_session_test_harness');

test('audio session records route transitions without blocking callers', () => {
    const window = loadAudioSession();
    const audioSession = window.slopsmith.audioSession;

    const html5 = audioSession.setRoute({ routeKind: 'html5', availability: 'available', selectedByUser: true });
    const stems = audioSession.setRoute({ routeKind: 'stems', availability: 'available', selectedByUser: true });
    const juce = audioSession.setRoute({ routeKind: 'juce', availability: 'degraded', fallbackReason: 'native route unavailable' });
    const snapshot = audioSession.snapshot();

    assert.equal(html5.routeKind, 'html5');
    assert.equal(stems.routeKind, 'stems');
    assert.equal(juce.availability, 'degraded');
    assert.equal(snapshot.domains['audio-mix'].route.routeKind, 'juce');
    assert.equal(snapshot.recentOutcomes.at(-1).outcome, 'degraded');
});

test('legacy song fader registration is bridged into audio-mix participants and route diagnostics', async () => {
    const window = loadAudioSession();
    const { audio } = installMixerDom(window);
    window.localStorage.setItem('volume', '65');

    runBrowserScript(window, 'static/audio-mixer.js');
    assert.equal(typeof window.slopsmith.audio.applySongVolume, 'function');

    await window.slopsmith.audio.applySongVolume(72);
    const snapshot = window.slopsmith.audioSession.snapshot();
    const songParticipant = snapshot.domains['audio-mix'].participants.find(p => p.participantId === 'core.song');

    assert.equal(audio.volume, 0.72);
    assert.equal(songParticipant.label, 'Song');
    assert.equal(songParticipant.fader.currentValue, 72);
    assert.equal(snapshot.domains['audio-mix'].route.routeKind, 'html5');
    assert.equal(snapshot.domains['audio-mix'].bridges.some(b => b.bridgeId === 'audio-mix.song-volume'), true);
});

test('song volume persists through html5 stems and desktop routes', async () => {
    const window = loadAudioSession();
    const { audio } = installMixerDom(window);
    const stemsCalls = [];
    const desktopCalls = [];
    window.localStorage.setItem('volume', '41');
    window.slopsmith.stems = { setMasterVolume(value) { stemsCalls.push(value); return Promise.resolve(); } };
    window.slopsmithDesktop = { audio: { setGain(name, value) { desktopCalls.push([name, value]); return Promise.resolve(); } } };

    runBrowserScript(window, 'static/audio-mixer.js');
    assert.equal(window.slopsmith.audio.readSongVolume(), 41);

    await window.slopsmith.audio.applySongVolume(55);
    assert.equal(audio.volume, 0.55);
    assert.equal(stemsCalls.at(-1), 0.55);
    assert.equal(window.slopsmith.audioSession.snapshot().domains['audio-mix'].route.routeKind, 'stems');

    window._juceMode = true;
    delete window.slopsmith.stems;
    await window.slopsmith.audio.applySongVolume(66);
    assert.deepEqual(desktopCalls.at(-1), ['backing', 0.66]);
    assert.equal(window.slopsmith.audioSession.snapshot().domains['audio-mix'].route.routeKind, 'juce');
});

test('stems provider ownership remains separate from audio-mix stem participation', async () => {
    const window = loadAudioSession();
    const audioSession = window.slopsmith.audioSession;
    audioSession.startSession({ sessionId: 'main:stems-song' });
    audioSession.registerStemOwner({ ownerId: 'stems_plugin', stemIds: ['guitar', 'bass'], availability: 'available' });
    audioSession.registerMixParticipant({
        participantId: 'stems.master',
        ownerPluginId: 'stems_plugin',
        label: 'Stems',
        kind: 'stem',
        sourceMode: 'native',
        fader: { id: 'master', label: 'Stems', min: 0, max: 1, step: 0.1, defaultValue: 1, currentValue: 1 },
        operations: ['fader.get-value', 'fader.set-value'],
    });

    const stemsInspect = await window.slopsmith.capabilities.dispatch({ capability: 'stems', command: 'inspect', source: 'test' });
    const mixInspect = await window.slopsmith.capabilities.dispatch({ capability: 'audio-mix', command: 'inspect', source: 'test' });

    assert.equal(stemsInspect.payload.owner.ownerId, 'stems_plugin');
    assert.equal(mixInspect.payload.faders.some(fader => fader.kind === 'stem' && fader.ownerPluginId === 'stems_plugin'), true);
});