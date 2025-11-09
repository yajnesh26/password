const passwordBox = document.getElementById("password");
const length = 12;

const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowerCase = "abcdefghijklmnopqrstuvwxyz";
const number = "0123456789";
const symbol = "@#$%^&*()_+~|{}[]<>/-=?";

const allChars = upperCase + lowerCase + number + symbol;

function createPassword() {
    let password = "";
    while (password.length < length) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    passwordBox.value = password;
}

    function copyPassword() {
        passwordBox.select();
        document.execCommand("copy");
        alert("copied");
        const data=prompt("Enter sometdhwik");
        console.log(data)
    }