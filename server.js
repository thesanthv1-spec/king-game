const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let players = []; // {id, name, role}
const roles = ["Indravarma", "Tun Tun", "Kirmada", "Police", "Thief", "Pombala Soku"];
let round = 0;

// Utility function
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Start a new round
function startRound() {
  round++;
  const shuffledRoles = shuffle([...roles]);
  players.forEach((player, i) => {
    player.role = shuffledRoles[i];
    io.to(player.id).emit("yourRole", shuffledRoles[i]);
  });
  io.emit("roundStarted", round);
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", (name) => {
    if (players.length >= 6) {
      socket.emit("roomFull");
      return;
    }

    players.push({ id: socket.id, name: name });
    io.emit("updatePlayers", players);

    if (players.length === 6) {
      startRound(); // start the first round
    }
  });

  socket.on("policeGuess", (targetId) => {
    const thief = players.find((p) => p.role === "Thief");
    const success = thief.id === targetId;
    io.emit("roundResult", { success, thief: thief.name });

    // Start next round after 3 seconds
    setTimeout(() => {
      startRound();
    }, 3000);
  });

  socket.on("disconnect", () => {
    players = players.filter((p) => p.id !== socket.id);
    io.emit("updatePlayers", players);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});