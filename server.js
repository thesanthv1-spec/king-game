const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let players = [];
const MAX_PLAYERS = 5;

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // When player joins
    socket.on("join-game", (playerName) => {

        if (players.length >= MAX_PLAYERS) {
            socket.emit("room-full");
            return;
        }

        const player = {
            id: socket.id,
            name: playerName
        };

        players.push(player);

        console.log("Players:", players.length);

        io.emit("update-players", players);

        if (players.length === MAX_PLAYERS) {
            io.emit("start-game", players);
        }
    });

    // When player disconnects
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        players = players.filter(player => player.id !== socket.id);

        console.log("Players after leave:", players.length);

        io.emit("update-players", players);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});