const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let roles = ["King", "Queen", "Bishop", "Police", "Thief"];
let gameStarted = false;

// Shuffle function
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (name) => {
        if (Object.keys(players).length >= 5 || gameStarted) {
            socket.emit("roomFull");
            return;
        }

        players[socket.id] = {
            name: name,
            role: null
        };

        io.emit("updatePlayers", Object.values(players));

        if (Object.keys(players).length === 5) {
            startGame();
        }
    });

    socket.on("guess", (playerName) => {
        if (!gameStarted) return;

        const guessedPlayer = Object.values(players)
            .find(p => p.name === playerName);

        if (!guessedPlayer) return;

        if (guessedPlayer.role === "Thief") {
            io.emit("result", "Police Wins! 🎉");
        } else {
            io.emit("result", "Thief Wins! 😈");
        }

        resetGame();
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("updatePlayers", Object.values(players));
    });
});

function startGame() {
    gameStarted = true;
    const shuffledRoles = shuffle([...roles]);

    Object.keys(players).forEach((id, index) => {
        players[id].role = shuffledRoles[index];
        io.to(id).emit("yourRole", players[id].role);
    });

    console.log("Game started!");
}

function resetGame() {
    players = {};
    gameStarted = false;
    console.log("Game reset");
}

// IMPORTANT FOR RENDER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});