# Password Generator — Bug Fix Progress

## Completed

* [x] E1 — Replace `Math.random()` with `crypto.getRandomValues()`
* [x] F1/E2 — Harden clipboard handling
* [x] F2 — Guarantee at least one character from each character category
* [x] F4 — Make copy button keyboard accessible
* [x] Accessibility — Restore visible focus indicators
* [x] Accessibility — Fix button color contrast

## Next Fix

* [ ] E3 — Clipboard auto-clear
* [ ] F3 — Empty-input guard

## Remaining Issues

* [ ] F5 — Fix mobile horizontal overflow
* [ ] Remove unused/unloaded Poppins font
* [ ] Add README.md
* [ ] Add `.gitignore`
* [ ] Add LICENSE
* [ ] Improve error/feedback UI
* [ ] Address remaining global/inline-handler code-quality issues
* [ ] Consider configurable password length
* [ ] Consider removing ambiguous characters (O/0/l/1)
* [ ] Add appropriate tests

## Workflow

Fix only ONE issue at a time.

For every issue:

1. Analyze the issue.
2. Implement only that fix.
3. Validate the change.
4. Review the diff.
5. STOP.
6. Wait for the user to commit the change.
7. Only then proceed to the next issue.

Never combine multiple unrelated fixes into one change.

## Current Status

Completed through **#4 — F4 + accessibility fixes**.

The next issue to work on is:

**#5 — E3 + F3: Clipboard auto-clear and empty-input handling.**

Do not automatically proceed to the next issue after completing a fix.