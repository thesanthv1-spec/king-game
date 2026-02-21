const socket = io();

const joinBtn = document.getElementById("joinBtn");
const manualStartBtn = document.getElementById("manualStartBtn");
const nameInput = document.getElementById("name");
const roleDiv = document.getElementById("role");
const playersList = document.getElementById("players");
const guessSection = document.getElementById("guessSection");
const guessList = document.getElementById("guessList");
const roundInfo = document.getElementById("roundInfo");
const resultDiv = document.getElementById("result");

// Join game
joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (name) socket.emit("joinGame", name);
};

// Manual start for testing
manualStartBtn.onclick = () => {
  socket.emit("manualStart");
};

// Room full alert
socket.on("roomFull", () => {
  alert("The game room is full! Try again later.");
});

// Update player list
socket.on("updatePlayers", (players) => {
  playersList.innerHTML = players.map(p => `<li>${p.name}</li>`).join("");
  if (roleDiv.innerText.includes("Police")) updateGuessList(players);
});

// Receive role
socket.on("yourRole", (role) => {
  roleDiv.innerText = `Your Role: ${role}`;
  guessSection.style.display = (role === "Police") ? "block" : "none";
});

// Round started
socket.on("roundStarted", (roundNum) => {
  roundInfo.innerText = `--- Round ${roundNum} ---`;
  resultDiv.innerText = "";
});

// Round result
socket.on("roundResult", ({success, thief}) => {
  resultDiv.innerText = success 
    ? `Police caught the Thief (${thief})!` 
    : `Thief (${thief}) escaped!`;
});

// Update guess buttons for Police
function updateGuessList(players) {
  guessList.innerHTML = players
    .filter(p => !roleDiv.innerText.includes(p.name))
    .map(p => `<li><button onclick="guess('${p.id}')">${p.name}</button></li>`)
    .join("");
}

// Police guess
function guess(targetId) {
  socket.emit("policeGuess", targetId);
}