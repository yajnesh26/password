# Random Password Generator

A lightweight, dependency-free password generator that runs entirely in the browser. Click **Generate Password** to create a cryptographically secure 12-character password, then copy it to the clipboard with one click.

## Features

- Generates a **12-character** password combining upper- and lowercase letters, digits, and symbols.
- Guarantees **at least one character from every category** (uppercase, lowercase, number, symbol).
- Uses the **Web Crypto API** (`crypto.getRandomValues()`) for randomnessâ€”not `Math.random()`.
- One-click **copy to clipboard** with an automatic 30-second clipboard clear.
- Empty-input **guard**: the copy button stays disabled until a password is generated.
- **Keyboard accessible** copy button (visible focus outlines, accessible name).
- **Responsive layout** that does not overflow on narrow mobile viewports (â‰ˆ320â€“414â€¯px).
- No frameworks, no build step, no dependencies, no network requests.

## How it works

1. Four characters are picked firstâ€”one from each category (uppercase, lowercase, number, symbol)â€”so every password contains all four.
2. The remaining 8 characters are drawn uniformly from the full character pool.
3. The 12 characters are **shuffled** (Fisherâ€“Yates) so the per-category positions are not predictable.
4. The result is written into the password field.

Character pools (from `pass.js`):

- Uppercase: `ABCDEFGHIJKLMNOPQRSTUVWXYZ`
- Lowercase: `abcdefghijklmnopqrstuvwxyz`
- Numbers: `0123456789`
- Symbols: `@#$%^&*()_+~|{}[]<>/-=?`

The full pool is **85 characters**, giving a genuinely random 12-character password roughly **77 bits** of entropy. The password is never transmitted anywhere or stored (no `localStorage`, no backend).

### Randomness details

`getRandomIndex(max)` draws `Uint32Array` values from `crypto.getRandomValues()` and uses **rejection sampling** (discarding values that fall outside the largest multiple of `max` below 2Â³Â²). This avoids the modulo bias that plain `value % max` would introduce. The rejection loop is effectively negligible because the discarded range is never more than 2Â³Â² mod `max`.

## Clipboard functionality

- Priority path: **`navigator.clipboard.writeText()`** (the modern async Clipboard API, available in secure contexts such as HTTPS, `localhost`, or a locally opened `file://` page).
- Fallback: **`document.execCommand("copy")`** for older browsers where the async API is unavailable.
- Success and failure are reported to the user (native alert on success/failure).
- **Auto-clear:** 30 seconds after copying, the clipboard is clearedâ€”unless it was already replaced by different content (checked via a best-effort `readText()`). Note that auto-clear uses the async Clipboard API and therefore does not apply to the legacy `execCommand` fallback path.
- The copy button is disabled until a password exists, and `copyPassword()` refuses to copy an empty field.

## Accessibility

- Visible focus indicators (`:focus-visible` outlines) on the copy button, the password field, and the generate button.
- The copy button has an accessible name via `aria-label="Copy password"`.
- Color contrast on the generate button was adjusted so text remains readable.

## Responsive / mobile support

- The main container is `width: 90%; max-width: 700px;` and horizontally centered, so it never exceeds the viewport even on narrow screens.
- The password field is allowed to shrink inside the flex row (`min-width: 0`), preventing the input + copy button from causing horizontal overflow.
- Validated at ~320â€¯px, 375â€¯px, and 414â€¯px viewports with no horizontal overflow.

## Technologies used

- HTML5
- CSS3 (flexbox layout)
- Vanilla JavaScript (ES6+)
- Web Crypto API (`crypto.getRandomValues`)
- Clipboard API with `execCommand` fallback

## Project structure

```
password/
â”œâ”€â”€ index.html    # Page markup and controls
â”œâ”€â”€ pass.css      # Styling, layout, focus and responsive rules
â”œâ”€â”€ pass.js       # Password generation, randomness, clipboard logic
â””â”€â”€ images/
    â”œâ”€â”€ copy.png      # Copy button icon
    â””â”€â”€ generate.png  # Generate button icon
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

## Security considerations

- Randomness comes from the **cryptographic** generator `crypto.getRandomValues()`, never `Math.random()`.
- **Rejection sampling** eliminates modulo bias.
- The generated password lives only in your browser tab: it is not sent to any server, stored, or logged. Closing or reloading the page discards it.
- Auto-clearing the clipboard 30 seconds after copying reduces the window in which the password remains accessible to other applications.
- The app is fully staticâ€”there is no backend, database, API, or analytics.

## Future improvements

Some known limitations and planned work:

- Configurable password **length** (currently fixed at 12).
- Option to **exclude ambiguous characters** (e.g., `O`, `0`, `l`, `1`).
- Replace native alerts with a more polished feedback UI.
- Add automated tests.
- Add a `.gitignore` and a `LICENSE`.

## License

This project does not currently ship a license.