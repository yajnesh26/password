(function () {
    const passwordBox = document.getElementById("password");
    const copyButton = document.getElementById("copy-btn");
    const generateButton = document.getElementById("generate-btn");
    const feedbackEl = document.getElementById("feedback");
    const passwordLength = 12;
    const CLIPBOARD_CLEAR_DELAY_MS = 30000;

    let clipboardClearTimer = null;
    let feedbackHideTimer = null;

    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const symbol = "@#$%^&*()_+~|{}[]<>/-=?";

    const allChars = upperCase + lowerCase + digits + symbol;

    function getRandomIndex(max) {
        const buffer = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / max) * max;
        let value;
        do {
            crypto.getRandomValues(buffer);
            value = buffer[0];
        } while (value >= limit);
        return value % max;
    }

    function createPassword() {
        const password = [
            upperCase[getRandomIndex(upperCase.length)],
            lowerCase[getRandomIndex(lowerCase.length)],
            digits[getRandomIndex(digits.length)],
            symbol[getRandomIndex(symbol.length)]
        ];
        while (password.length < passwordLength) {
            password.push(allChars[getRandomIndex(allChars.length)]);
        }
        for (let i = password.length - 1; i > 0; i--) {
            const j = getRandomIndex(i + 1);
            [password[i], password[j]] = [password[j], password[i]];
        }
        passwordBox.value = password.join("");
        copyButton.disabled = false;
    }

    function copyPassword() {
        if (!passwordBox.value) {
            showFeedback("Generate a password first", "error");
            return;
        }
        const copiedText = passwordBox.value;
        passwordBox.select();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(copiedText)
                .then(() => {
                    showFeedback("Password copied to clipboard", "success");
                    scheduleClipboardClear(copiedText);
                })
                .catch(err => {
                    console.error("Failed to copy:", err);
                    showFeedback("Failed to copy password to clipboard", "error");
                });
            return;
        }
        try {
            if (document.execCommand("copy")) {
                showFeedback("Password copied to clipboard", "success");
                scheduleClipboardClear(copiedText);
            } else {
                showFeedback("Failed to copy password to clipboard", "error");
            }
        } catch (err) {
            console.error("Failed to copy:", err);
            showFeedback("Failed to copy password to clipboard", "error");
        }
    }

    function showFeedback(message, type) {
        clearTimeout(feedbackHideTimer);
        feedbackEl.textContent = message;
        feedbackEl.classList.remove("feedback--success", "feedback--error");
        feedbackEl.classList.add(type === "success" ? "feedback--success" : "feedback--error");
        feedbackHideTimer = setTimeout(() => {
            feedbackEl.classList.remove("feedback--success", "feedback--error");
            feedbackEl.textContent = "";
        }, 3000);
    }

    function scheduleClipboardClear(copiedText) {
        clearTimeout(clipboardClearTimer);
        clipboardClearTimer = setTimeout(async () => {
            let shouldClear = true;
            try {
                if (navigator.clipboard && navigator.clipboard.readText && copiedText !== "") {
                    const current = await navigator.clipboard.readText();
                    shouldClear = current === copiedText;
                }
            } catch (err) {
                console.error("Failed to read clipboard for auto-clear:", err);
            }
            if (shouldClear && navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText("");
                } catch (err) {
                    console.error("Failed to clear clipboard:", err);
                }
            }
        }, CLIPBOARD_CLEAR_DELAY_MS);
    }

    generateButton.addEventListener("click", createPassword);
    copyButton.addEventListener("click", copyPassword);
})();
