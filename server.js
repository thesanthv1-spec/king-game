const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // your HTML, CSS, JS files

let players = {}; // { socketId: { name, role } }
let roles = ["King", "Queen", "Bishop", "Police", "Thief"];
let gameStarted = false;

// Shuffle helper
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Start a new game
function startGame() {
    if (Object.keys(players).length !== 5) return;

    gameStarted = true;
    const shuffledRoles = shuffle([...roles]);

    Object.keys(players).forEach((id, index) => {
        players[id].role = shuffledRoles[index];
        io.to(id).emit("yourRole", players[id].role);
    });

    io.emit("updatePlayers", Object.values(players));
    console.log("Game started!");
}

// Reset roles for a new round
function resetRound() {
    Object.keys(players).forEach(id => players[id].role = null);
    gameStarted = false;
    io.emit("result", "New round can start! Click Start Game.");
    io.emit("updatePlayers", Object.values(players));
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // Join game
    socket.on("join", (name) => {
        if (Object.keys(players).length >= 5) {
            socket.emit("roomFull");
            return;
        }

        players[socket.id] = { name: name, role: null };
        io.emit("updatePlayers", Object.values(players));

        // Automatically start if 5 players
        if (Object.keys(players).length === 5 && !gameStarted) {
            startGame();
        }
    });

    // Police makes a guess
    socket.on("guess", (playerName) => {
        if (!gameStarted) return;

        const policeId = Object.keys(players).find(id => players[id].role === "Police");
        if (socket.id !== policeId) return; // only Police can guess

        const target = Object.values(players).find(p => p.name === playerName);
        if (!target) return;

        if (target.role === "Thief") {
            io.emit("result", `Police caught the thief! 🎉`);
        } else {
            io.emit("result", `Police guessed wrong. Thief wins! 😈`);
        }

        // Reset round (roles only, keep players)
        resetRound();
    });

    // Start a new round manually (optional)
    socket.on("startNewRound", () => {
        if (!gameStarted && Object.keys(players).length === 5) {
            startGame();
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("updatePlayers", Object.values(players));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));