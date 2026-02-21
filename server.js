const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

let players = [];
const roles = ["King", "Queen", "Bishop", "Police", "Thief", "Citizen"];
let round = 0;

// Shuffle helper
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Start a new round
function startRound() {
  if (players.length === 0) return;
  round++;
  const shuffledRoles = shuffle([...roles]);
  players.forEach((player, i) => {
    player.role = shuffledRoles[i];
    io.to(player.id).emit("yourRole", shuffledRoles[i]);
  });
  io.emit("roundStarted", round);
}

// Socket.io events
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinGame", (name) => {
    if (players.length >= 6) {
      socket.emit("roomFull");
      return;
    }

    players.push({ id: socket.id, name: name });
    io.emit("updatePlayers", players);

    if (players.length === 6) startRound(); // auto-start for full room
  });

  socket.on("manualStart", () => {
    startRound(); // manual start for testing
  });

  socket.on("policeGuess", (targetId) => {
    const thief = players.find((p) => p.role === "Thief");
    const success = thief.id === targetId;
    io.emit("roundResult", { success, thief: thief.name });

    setTimeout(() => {
      startRound();
    }, 3000);
  });

  socket.on("disconnect", () => {
    players = players.filter((p) => p.id !== socket.id);
    io.emit("updatePlayers", players);
  });
});

// Dynamic port for Render or local
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));