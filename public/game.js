const socket = io();

// Elements
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const playerList = document.getElementById("playerList");
const statusText = document.getElementById("status");
const roleText = document.getElementById("roleText");
const resultText = document.getElementById("resultText");

// Join button
joinBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) return alert("Enter your name");

    socket.emit("join-game", name);

    nameInput.disabled = true;
    joinBtn.disabled = true;
});

// Update player list
socket.on("update-players", (players) => {
    playerList.innerHTML = "";
    players.forEach(player => {
        const li = document.createElement("li");
        li.textContent = player.name;
        playerList.appendChild(li);
    });
    statusText.textContent = `Players Joined: ${players.length}/5`;
});

// Show room full
socket.on("room-full", () => alert("Room is full!"));

// Assign role
socket.on("your-role", (role) => {
    roleText.textContent = "Your Role: " + role;

    if (role === "Police") {
        playerList.addEventListener("click", (e) => {
            if (e.target.tagName === "LI") {
                socket.emit("guess-player", e.target.textContent);
            }
        });
    }
});

// Show guess result
socket.on("guess-result", (message) => {
    resultText.textContent = message;
});