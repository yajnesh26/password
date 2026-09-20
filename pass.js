const passwordBox = document.getElementById("password");
const copyButton = document.getElementById("copy-btn");
const length = 12;
const CLIPBOARD_CLEAR_DELAY_MS = 30000;

let clipboardClearTimer = null;

const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowerCase = "abcdefghijklmnopqrstuvwxyz";
const number = "0123456789";
const symbol = "@#$%^&*()_+~|{}[]<>/-=?";

const allChars = upperCase + lowerCase + number + symbol;

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
        number[getRandomIndex(number.length)],
        symbol[getRandomIndex(symbol.length)]
    ];
    while (password.length < length) {
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
        alert("Generate a password first");
        return;
    }
    const copiedText = passwordBox.value;
    passwordBox.select();
    if (navigator.clipboard) {
        navigator.clipboard.writeText(copiedText)
            .then(() => {
                alert("Password copied to clipboard");
                scheduleClipboardClear(copiedText);
            })
            .catch(err => {
                console.error("Failed to copy:", err);
                alert("Failed to copy password to clipboard");
            });
        return;
    }
    try {
        if (document.execCommand("copy")) {
            alert("Password copied to clipboard");
            scheduleClipboardClear(copiedText);
        } else {
            alert("Failed to copy password to clipboard");
        }
    } catch (err) {
        console.error("Failed to copy:", err);
        alert("Failed to copy password to clipboard");
    }
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
