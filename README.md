# Random Password Generator

A lightweight, dependency-free password generator that runs entirely in the browser. Click **Generate Password** to create a cryptographically secure password of your chosen length (4–64 characters, default 12), then copy it to the clipboard with one click.

## Features

- Generates a password of a **configurable length** (4–64 characters, default 12) combining upper- and lowercase letters, digits, and symbols.
- Guarantees **at least one character from every category** (uppercase, lowercase, number, symbol).
- Omits visually **ambiguous characters** (`O`, `0`, `l`, `1`) for easier human reading.
- Uses the **Web Crypto API** (`crypto.getRandomValues()`) for randomness—not `Math.random()`.
- One-click **copy to clipboard** with an automatic 30-second clipboard clear.
- Empty-input **guard**: the copy button stays disabled until a password is generated.
- **Keyboard accessible** copy button (visible focus outlines, accessible name).
- **Responsive layout** that does not overflow on narrow mobile viewports (≈320–414 px).
- No frameworks, no build step, no dependencies, no network requests.

## How it works

1. Four characters are picked first—one from each category (uppercase, lowercase, number, symbol)—so every password contains all four.
2. The remaining characters up to the chosen length are drawn uniformly from the full character pool.
3. The resulting characters are **shuffled** (Fisher–Yates) so the per-category positions are not predictable.
4. The result is written into the password field.

Character pools (from `pass.js`):

- Uppercase: `ABCDEFGHIJKLMNPQRSTUVWXYZ`
- Lowercase: `abcdefghijkmnopqrstuvwxyz`
- Numbers: `23456789`
- Symbols: `@#$%^&*()_+~|{}[]<>/-=?`

The full pool is **81 characters** (the visually ambiguous `O`, `0`, `l`, and `1` are omitted), so the default 12-character password has roughly **76 bits** of entropy (about 6.3 bits per character). The password is never transmitted anywhere or stored (no `localStorage`, no backend).

### Randomness details

`getRandomIndex(max)` draws `Uint32Array` values from `crypto.getRandomValues()` and uses **rejection sampling** (discarding values that fall outside the largest multiple of `max` below 2³²). This avoids the modulo bias that plain `value % max` would introduce. The rejection loop is effectively negligible because the discarded range is never more than 2³² mod `max`.

## Clipboard functionality

- Priority path: **`navigator.clipboard.writeText()`** (the modern async Clipboard API, available in secure contexts such as HTTPS, `localhost`, or a locally opened `file://` page).
- Fallback: **`document.execCommand("copy")`** for older browsers where the async API is unavailable.
- Success and failure are reported to the user via a non-blocking, in-page feedback message (a screen-reader-announced live region).
- **Auto-clear:** 30 seconds after copying, the clipboard is cleared—unless it was already replaced by different content (checked via a best-effort `readText()`). Note that auto-clear uses the async Clipboard API and therefore does not apply to the legacy `execCommand` fallback path.
- The copy button is disabled until a password exists, and `copyPassword()` refuses to copy an empty field.

## Accessibility

- Visible focus indicators (`:focus-visible` outlines) on the copy button, the password field, and the generate button.
- The copy button has an accessible name via `aria-label="Copy password"`.
- Color contrast on the generate button was adjusted so text remains readable.

## Responsive / mobile support

- The main container is `width: 90%; max-width: 700px;` and horizontally centered, so it never exceeds the viewport even on narrow screens.
- The password field is allowed to shrink inside the flex row (`min-width: 0`), preventing the input + copy button from causing horizontal overflow.
- Validated at ~320 px, 375 px, and 414 px viewports with no horizontal overflow.

## Technologies used

- HTML5
- CSS3 (flexbox layout)
- Vanilla JavaScript (ES6+)
- Web Crypto API (`crypto.getRandomValues`)
- Clipboard API with `execCommand` fallback

## Project structure

```
password/
├── index.html    # Page markup and controls
├── pass.css      # Styling, layout, focus and responsive rules
├── pass.js       # Password generation, randomness, clipboard logic
├── package.json  # Test script (no dependencies)
├── test/
│   └── password.test.js  # Automated test suite (Node's built-in runner)
└── images/
    ├── copy.png      # Copy button icon
    └── generate.png  # Generate button icon
```

## Running locally

No build step or dependencies are required.

1. Download/clone this repository.
2. Open `index.html` in a modern web browser (Chrome, Edge, Firefox, or Safari).

You can also serve it with any static server, for example:

```sh
python -m http.server 8000
```

or

```sh
npx serve .
```

then open `http://localhost:8000`.

## Testing

The test suite uses **Node's built-in test runner** (`node:test`) — no framework, no browser, and no dependencies are required. `pass.js` is executed inside an isolated `vm` context with a small in-memory DOM/Clipboard/Crypto stub, so tests are deterministic and do not touch the real system clipboard or call `Math.random()`.

Requires Node.js 20 or newer:

```bash
npm test
```

or, if you do not want to use npm:

```bash
node --test test/password.test.js
```

The suite covers:

- Password generation: default/min/max length, requested length, category guarantee, 81-character pool membership, and exclusion of the ambiguous characters `O`, `0`, `l`, and `1`.
- Invalid-length handling: empty, non-integer, below-minimum, and above-maximum inputs never generate or overwrite a valid password.
- Randomness: `crypto.getRandomValues()` is used, `Math.random()` is never used, and rejection sampling redraws when a value falls into the rejected range.
- Clipboard behavior: success, rejection, `document.execCommand` fallback (including its failure modes), empty-password copy attempts, and the disabled/enabled copy-button state.
- Feedback UI: success, failure, and empty-input messages, plus the auto-hide after the configured delay.

## Security considerations

- Randomness comes from the **cryptographic** generator `crypto.getRandomValues()`, never `Math.random()`.
- **Rejection sampling** eliminates modulo bias.
- The generated password lives only in your browser tab: it is not sent to any server, stored, or logged. Closing or reloading the page discards it.
- Auto-clearing the clipboard 30 seconds after copying reduces the window in which the password remains accessible to other applications.
- The app is fully static—there is no backend, database, API, or analytics.

## Future improvements

Some known limitations and planned work:

- (none)

## License

This project is licensed under the [MIT License](LICENSE).