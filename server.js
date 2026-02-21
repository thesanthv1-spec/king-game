const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let playerList = []; // { name, role, socketId }
let roles = ["King", "Queen", "Bishop", "Police", "Thief"];
let gameStarted = false;

// Shuffle helper
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Start the game if 5 active players
function startGame() {
    if (playerList.length !== 5) return;

    gameStarted = true;
    const shuffledRoles = shuffle([...roles]);

    playerList.forEach((player, index) => {
        player.role = shuffledRoles[index];
        io.to(player.socketId).emit("yourRole", player.role);
    });

    io.emit("updatePlayers", playerList.map(p => ({ name: p.name })));
    console.log("Game started!");
}

// Reset roles for next round but keep players
function resetRound() {
    playerList.forEach(p => p.role = null);
    gameStarted = false;
    io.emit("result", "New round can start! Click Start Game.");
    io.emit("updatePlayers", playerList.map(p => ({ name: p.name })));
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (name) => {
        // Check if player name is already in list
        let existing = playerList.find(p => p.name === name);
        if (existing) {
            // Update socketId for reconnect
            existing.socketId = socket.id;
        } else {
            if (playerList.length >= 5) {
                socket.emit("roomFull");
                return;
            }
            playerList.push({ name, role: null, socketId: socket.id });
        }

        io.emit("updatePlayers", playerList.map(p => ({ name: p.name })));

        if (playerList.length === 5 && !gameStarted) {
            startGame();
        }
    });

    socket.on("guess", (playerName) => {
        if (!gameStarted) return;

        let police = playerList.find(p => p.role === "Police");
        if (!police || police.socketId !== socket.id) return;

        let target = playerList.find(p => p.name === playerName);
        if (!target) return;

        if (target.role === "Thief") {
            io.emit("result", "Police caught the thief! 🎉");
        } else {
            io.emit("result", "Police guessed wrong. Thief wins! 😈");
        }

        resetRound();
    });

    socket.on("startNewRound", () => {
        if (!gameStarted && playerList.length === 5) {
            startGame();
        }
    });

    socket.on("disconnect", () => {
        // Remove player if socketId matches
        playerList = playerList.filter(p => p.socketId !== socket.id);
        io.emit("updatePlayers", playerList.map(p => ({ name: p.name })));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));