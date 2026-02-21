const socket = io();

function joinGame() {
    const name = document.getElementById("nameInput").value;
    if (name.trim() === "") return;

    socket.emit("join", name);

    document.getElementById("joinSection").style.display = "none";
    document.getElementById("gameSection").style.display = "block";
}

socket.on("updatePlayers", (players) => {
    const list = document.getElementById("playerList");
    list.innerHTML = "<h3>Players:</h3>";

    players.forEach(player => {
        const div = document.createElement("div");
        div.innerText = player.name;
        list.appendChild(div);
    });
});

socket.on("yourRole", (role) => {
    document.getElementById("roleText").innerText = "Your Role: " + role;

    if (role === "Police") {
        document.getElementById("playerList").onclick = (e) => {
            if (e.target.tagName === "DIV") {
                socket.emit("guess", e.target.innerText);
            }
        };
    }
});

socket.on("result", (message) => {
    document.getElementById("resultText").innerText = message;
});

socket.on("roomFull", () => {
    alert("Room is full!");
});