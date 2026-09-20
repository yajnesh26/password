'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const PASS_JS_PATH = path.join(__dirname, '..', 'pass.js');
const PASS_SOURCE = fs.readFileSync(PASS_JS_PATH, 'utf8');

const UPPER = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '@#$%^&*()_+~|{}[]<>/-=?';
const POOL = UPPER + LOWER + DIGITS + SYMBOLS;
const AMBIGUOUS = ['O', '0', 'l', '1'];

function makeElement(id, { value = '', disabled = false } = {}) {
    const el = {
        id,
        value,
        textContent: '',
        disabled,
        selectCalls: 0,
        handlers: {},
        listeners: [],
    };
    Object.defineProperty(el, 'valueAsNumber', {
        get() {
            return el.value === '' ? NaN : Number(el.value);
        },
    });
    el.select = function () {
        el.selectCalls += 1;
    };
    el.addEventListener = function (type, fn) {
        el.listeners.push({ type, fn });
    };
    el.click = function () {
        for (const l of el.listeners) if (l.type === 'click') l.fn();
    };
    const classSet = new Set();
    el.classList = {
        add(...names) { names.forEach((n) => classSet.add(n)); },
        remove(...names) { names.forEach((n) => classSet.delete(n)); },
        contains(name) { return classSet.has(name); },
    };
    return el;
}

function createTimers() {
    let nextId = 1;
    let now = 0;
    const tasks = new Map();
    return {
        setTimeout(fn, delay) {
            const id = nextId++;
            tasks.set(id, { fn, at: now + (Number(delay) || 0) });
            return id;
        },
        clearTimeout(id) {
            tasks.delete(id);
        },
        advance(ms) {
            now += ms;
            const due = [...tasks.entries()]
                .filter(([, t]) => t.at <= now)
                .sort((a, b) => a[1].at - b[1].at);
            for (const [id, t] of due) {
                tasks.delete(id);
                t.fn();
            }
        },
    };
}

function boot({ clipboard, cryptoImpl = webcrypto, MathImpl = Math, execCommandResult = true, execCommandThrows = false } = {}) {
    const elements = {
        password: makeElement('password'),
        'copy-btn': makeElement('copy-btn', { disabled: true }),
        'generate-btn': makeElement('generate-btn'),
        'length-input': makeElement('length-input', { value: '12' }),
        feedback: makeElement('feedback'),
    };
    const timers = createTimers();
    const document = {
        getElementById(id) { return elements[id]; },
        execCommand(cmd) {
            if (cmd === 'copy') return execCommandResult;
            return false;
        },
    };
    if (execCommandThrows) {
        document.execCommand = function () {
            throw new Error('execCommand unavailable');
        };
    }
    const sandbox = {
        console: { error: () => {} },
        document,
        navigator: { clipboard },
        crypto: cryptoImpl,
        Math: MathImpl,
        Promise,
        Number,
        String,
        Array,
        Uint32Array,
        Object,
        setTimeout: timers.setTimeout,
        clearTimeout: timers.clearTimeout,
    };
    vm.createContext(sandbox);
    vm.runInContext(PASS_SOURCE, sandbox, { filename: 'pass.js' });

    const h = {
        elements,
        timers,
        clipboard,
        setLength(n) { elements['length-input'].value = String(n); },
        generate() { elements['generate-btn'].click(); return elements.password.value; },
        copy() { elements['copy-btn'].click(); },
        feedbackText() { return elements.feedback.textContent; },
        feedbackClass() {
            return elements.feedback.classList.contains('feedback--success') ? 'success'
                : elements.feedback.classList.contains('feedback--error') ? 'error' : 'none';
        },
        async flush() {
            for (let i = 0; i < 5; i += 1) await new Promise((r) => setImmediate(r));
        },
    };
    return h;
}

function categoryCounts(pw) {
    const counts = { upper: 0, lower: 0, digit: 0, symbol: 0 };
    for (const ch of pw) {
        if (UPPER.includes(ch)) counts.upper += 1;
        else if (LOWER.includes(ch)) counts.lower += 1;
        else if (DIGITS.includes(ch)) counts.digit += 1;
        else if (SYMBOLS.includes(ch)) counts.symbol += 1;
    }
    return counts;
}

function assertInPool(pw) {
    for (const ch of pw) {
        assert.ok(POOL.includes(ch), `character ${JSON.stringify(ch)} not in pool`);
    }
}

test('source uses crypto.getRandomValues with rejection sampling and never Math.random', () => {
    assert.match(PASS_SOURCE, /crypto\.getRandomValues\(buffer\)/);
    assert.match(PASS_SOURCE, /do \{/, 'rejection-sampling do/while loop must exist');
    assert.match(PASS_SOURCE, /while \(value >= limit\)/, 'rejection condition must compare against limit');
    assert.doesNotMatch(PASS_SOURCE, /Math\.random/);
});

test('default password length is 12', () => {
    const h = boot();
    const pw = h.generate();
    assert.equal(pw.length, 12);
});

test('minimum length of 4 works and contains every category', () => {
    const h = boot();
    h.setLength(4);
    const pw = h.generate();
    assert.equal(pw.length, 4);
    const c = categoryCounts(pw);
    assert.deepEqual(c, { upper: 1, lower: 1, digit: 1, symbol: 1 });
});

test('maximum length of 64 works', () => {
    const h = boot();
    h.setLength(64);
    const pw = h.generate();
    assert.equal(pw.length, 64);
});

test('generated passwords have the requested length', () => {
    const h = boot();
    for (const len of [5, 11, 12, 20, 33, 50]) {
        h.setLength(len);
        const pw = h.generate();
        assert.equal(pw.length, len, `expected length ${len}`);
    }
});

test('every generated password contains all four categories across many runs', () => {
    const h = boot();
    for (let i = 0; i < 40; i += 1) {
        const len = 4 + (i % 61);
        h.setLength(len);
        const pw = h.generate();
        const c = categoryCounts(pw);
        for (const key of ['upper', 'lower', 'digit', 'symbol']) {
            assert.ok(c[key] >= 1, `length ${len} password ${pw} missing ${key}`);
        }
    }
});

test('generated characters belong to the 81-character pool and omit ambiguous chars', () => {
    const h = boot();
    for (let i = 0; i < 30; i += 1) {
        const len = 4 + (i % 61);
        h.setLength(len);
        const pw = h.generate();
        assert.equal(pw.length, len);
        assertInPool(pw);
        for (const banned of AMBIGUOUS) {
            assert.ok(!pw.includes(banned), `ambiguous char ${JSON.stringify(banned)} present in ${pw}`);
        }
    }
});

const ERRFB = 'Password length must be between 4 and 64';

test('invalid lengths show error feedback and do not overwrite an existing password', () => {
    const h = boot();
    const good = h.generate();
    assert.equal(good.length, 12);
    for (const bad of ['', '12.5', '3', '65', 'foo']) {
        h.setLength(bad);
        const pw = h.generate();
        assert.equal(pw, good, `invalid input ${JSON.stringify(bad)} overwrote the password`);
        assert.equal(h.feedbackText(), ERRFB, `no error feedback for ${JSON.stringify(bad)}`);
        assert.equal(h.feedbackClass(), 'error');
    }
});

test('invalid length on a fresh page leaves the field empty', () => {
    const h = boot();
    h.setLength('');
    const pw = h.generate();
    assert.equal(pw, '');
    assert.equal(h.feedbackText(), ERRFB);
});

test('generation uses crypto.getRandomValues()', () => {
    let calls = 0;
    const impl = {
        getRandomValues(buf) {
            calls += 1;
            return webcrypto.getRandomValues(buf);
        },
    };
    const h = boot({ cryptoImpl: impl });
    h.generate();
    assert.ok(calls > 0, 'getRandomValues was never called');
});

test('Math.random() is not used during generation', () => {
    const mathNoRandom = Object.assign(Object.create(Math), {
        random() {
            throw new Error('Math.random() must not be used');
        },
    });
    const h = boot({ MathImpl: mathNoRandom });
    const pw = h.generate();
    assert.equal(pw.length, 12);
});

test('rejection sampling redraws when a value falls into the rejected range', () => {
    const REJECTED = 0xffffffff;
    let fills = 0;
    let servedRejected = false;
    const impl = {
        getRandomValues(buf) {
            fills += 1;
            if (!servedRejected && fills === 1) {
                servedRejected = true;
                buf[0] = REJECTED;
                return buf;
            }
            buf[0] = (fills % 31) + 1;
            return buf;
        },
    };
    const h = boot({ cryptoImpl: impl });
    const pw = h.generate();
    assert.equal(pw.length, 12);
    assertInPool(pw);
    const expectedDraws = 4 + 8 + 11;
    assert.ok(fills > expectedDraws, 'rejected value must have required an extra draw');
    assert.ok(servedRejected, 'test did not actually serve a rejected-range value');
});

test('copy button is disabled before generation and enabled after', () => {
    const h = boot();
    assert.equal(h.elements['copy-btn'].disabled, true);
    h.generate();
    assert.equal(h.elements['copy-btn'].disabled, false);
});

async function makeClipboard({ writeTextImpl, readTextImpl } = {}) {
    const calls = [];
    let lastWritten = '';
    const cb = {
        calls,
        async writeText(text) {
            calls.push(['write', text]);
            lastWritten = text;
            if (writeTextImpl) await writeTextImpl(text);
        },
        async readText() {
            calls.push(['read']);
            if (readTextImpl) return readTextImpl();
            return lastWritten;
        },
    };
    return cb;
}

test('successful clipboard copy shows success feedback', async () => {
    const cb = await makeClipboard();
    const h = boot({ clipboard: cb });
    const pw = h.generate();
    h.copy();
    await h.flush();
    assert.deepEqual(cb.calls, [['write', pw]]);
    assert.equal(h.feedbackText(), 'Password copied to clipboard');
    assert.equal(h.feedbackClass(), 'success');
});

test('clipboard rejection shows failure feedback', async () => {
    const cb = await makeClipboard({
        writeTextImpl: async () => {
            throw new Error('denied');
        },
    });
    const h = boot({ clipboard: cb });
    h.generate();
    h.copy();
    await h.flush();
    assert.equal(h.feedbackText(), 'Failed to copy password to clipboard');
    assert.equal(h.feedbackClass(), 'error');
});

test('falls back to document.execCommand when the Clipboard API is unavailable', async () => {
    const h = boot({ clipboard: undefined, execCommandResult: true });
    h.generate();
    h.copy();
    await h.flush();
    assert.equal(h.feedbackText(), 'Password copied to clipboard');
    assert.equal(h.feedbackClass(), 'success');
});

test('execCommand returning false shows failure feedback', async () => {
    const h = boot({ clipboard: undefined, execCommandResult: false });
    h.generate();
    h.copy();
    await h.flush();
    assert.equal(h.feedbackText(), 'Failed to copy password to clipboard');
    assert.equal(h.feedbackClass(), 'error');
});

test('execCommand throwing shows failure feedback', async () => {
    const h = boot({ clipboard: undefined, execCommandThrows: true });
    h.generate();
    h.copy();
    await h.flush();
    assert.equal(h.feedbackText(), 'Failed to copy password to clipboard');
    assert.equal(h.feedbackClass(), 'error');
});

test('copying with an empty password shows empty-input feedback', async () => {
    const cb = await makeClipboard();
    const h = boot({ clipboard: cb });
    h.copy();
    await h.flush();
    assert.equal(h.feedbackText(), 'Generate a password first');
    assert.equal(h.feedbackClass(), 'error');
    assert.equal(cb.calls.length, 0, 'clipboard.writeText must not be called');
});

test('feedback auto-hides after the configured delay', () => {
    const h = boot({ clipboard: undefined, execCommandResult: true });
    h.generate();
    h.copy();
    assert.equal(h.feedbackText(), 'Password copied to clipboard');
    h.timers.advance(3000);
    assert.equal(h.feedbackText(), '');
    assert.equal(h.feedbackClass(), 'none');
});

test('clipboard is auto-cleared 30s after copying (unchanged content)', async () => {
    const cb = await makeClipboard();
    const h = boot({ clipboard: cb });
    h.generate();
    h.copy();
    await h.flush();
    h.timers.advance(30000);
    await h.flush();
    const writes = cb.calls.filter(([op]) => op === 'write');
    assert.deepEqual(writes[1], ['write', '']);
});