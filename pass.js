const passwordBox = document.getElementById("password");
const length = 12;

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
    let password = "";
    while (password.length < length) {
        password += allChars[getRandomIndex(allChars.length)];
    }
    passwordBox.value = password;
}

function copyPassword() {
    passwordBox.select();
    navigator.clipboard.writeText(passwordBox.value)
        .then(() => alert("Password copied to clipboard"))
        .catch(err => console.error("Failed to copy:", err));
}
