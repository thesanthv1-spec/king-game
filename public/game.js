const socket = io();

const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("name");
const roleDiv = document.getElementById("role");
const playersList = document.getElementById("players");
const guessSection = document.getElementById("guessSection");
const guessList = document.getElementById("guessList");
const roundInfo = document.getElementById("roundInfo");
const resultDiv = document.getElementById("result");

joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (name) socket.emit("joinGame", name);
};

socket.on("roomFull", () => {
  alert("The game room is full! Try again later.");
});

socket.on("updatePlayers", (players) => {
  playersList.innerHTML = players.map(p => `<li>${p.name}</li>`).join("");
  if (roleDiv.innerText.includes("Police")) updateGuessList(players);
});

socket.on("yourRole", (role) => {
  roleDiv.innerText = `Your Role: ${role}`;
  if (role === "Police") {
    guessSection.style.display = "block";
  } else {
    guessSection.style.display = "none";
  }
});

socket.on("roundStarted", (roundNum) => {
  roundInfo.innerText = `--- Round ${roundNum} ---`;
  resultDiv.innerText = "";
});

socket.on("roundResult", ({success, thief}) => {
  resultDiv.innerText = success 
    ? `Police caught the Thief (${thief})!` 
    : `Thief (${thief}) escaped!`;
});

// Helper to update guess buttons for Police
function updateGuessList(players) {
  guessList.innerHTML = players
    .filter(p => !roleDiv.innerText.includes(p.name))
    .map(p => `<li><button onclick="guess('${p.id}')">${p.name}</button></li>`)
    .join("");
}

function guess(targetId) {
  socket.emit("policeGuess", targetId);
}