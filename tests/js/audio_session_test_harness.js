const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createWindow, ROOT } = require('./capabilities_test_harness');

const CAPABILITIES_JS = path.join(ROOT, 'static', 'capabilities.js');
const AUDIO_SESSION_JS = path.join(ROOT, 'static', 'capabilities', 'audio-session.js');
const AUDIO_MIXER_JS = path.join(ROOT, 'static', 'audio-mixer.js');

function loadAudioSession(options = {}) {
    const window = createWindow(options);
    const context = vm.createContext(window);
    vm.runInContext(fs.readFileSync(CAPABILITIES_JS, 'utf8'), context, { filename: CAPABILITIES_JS });
    vm.runInContext(fs.readFileSync(AUDIO_SESSION_JS, 'utf8'), context, { filename: AUDIO_SESSION_JS });
    window.__vmContext = context;
    return window;
}

function runBrowserScript(window, relativePath) {
    const filePath = path.join(ROOT, relativePath);
    vm.runInContext(fs.readFileSync(filePath, 'utf8'), window.__vmContext, { filename: filePath });
}

function captureEvents(window, eventName) {
    const events = [];
    window.slopsmith.on(eventName, event => events.push(event.detail));
    return events;
}

function diagnosticsSnapshot(window) {
    return window.slopsmith.audioSession.snapshot();
}

function installDeterministicTimers(window) {
    const timers = [];
    let nextId = 1;
    window.setTimeout = (callback, delay = 0) => {
        const id = nextId;
        nextId += 1;
        timers.push({ id, callback, delay, cleared: false });
        return id;
    };
    window.clearTimeout = id => {
        const timer = timers.find(item => item.id === id);
        if (timer) timer.cleared = true;
    };
    window.__runTimers = (minimumDelay = 0) => {
        for (const timer of timers.slice()) {
            if (timer.cleared || timer.delay < minimumDelay) continue;
            timer.cleared = true;
            timer.callback();
        }
    };
    return timers;
}

function makeElement(tagName) {
    return {
        tagName,
        className: '',
        textContent: '',
        value: '',
        innerHTML: '',
        disabled: false,
        title: '',
        style: {},
        children: [],
        listeners: {},
        classList: {
            values: new Set(),
            add(name) { this.values.add(name); },
            remove(name) { this.values.delete(name); },
            contains(name) { return this.values.has(name); },
        },
        setAttribute(name, value) { this[name] = String(value); },
        appendChild(child) { this.children.push(child); return child; },
        addEventListener(type, handler) { this.listeners[type] = handler; },
        contains() { return false; },
        focus() {},
    };
}

function installMixerDom(window) {
    const elements = new Map();
    const audio = { volume: 0, src: '', load() {} };
    const button = makeElement('button');
    const popover = makeElement('div');
    elements.set('audio', audio);
    elements.set('btn-mixer', button);
    elements.set('mixer-popover', popover);
    window.Event = class Event { constructor(type) { this.type = type; } };
    window.document.readyState = 'complete';
    window.document.getElementById = id => elements.get(id) || null;
    window.document.addEventListener = () => {};
    window.document.removeEventListener = () => {};
    window.document.createElement = makeElement;
    return { elements, audio, button, popover };
}

function loadAudioMixer(window) {
    runBrowserScript(window, path.relative(ROOT, AUDIO_MIXER_JS));
    return window.slopsmith.audio;
}

module.exports = {
    loadAudioSession,
    runBrowserScript,
    captureEvents,
    diagnosticsSnapshot,
    installDeterministicTimers,
    installMixerDom,
    loadAudioMixer,
    ROOT,
};
