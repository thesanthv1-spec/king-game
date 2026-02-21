const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const MAX_PLAYERS = 5;
let players = []; // {name, id, role}

app.use(express.static(__dirname)); // serve HTML & JS

// Socket.IO
io.on('connection', (socket) => {

    socket.on('join-game', (name) => {
        if (players.length >= MAX_PLAYERS) {
            socket.emit('room-full');
            return;
        }

        players.push({name, id: socket.id});
        io.emit('update-players', players.map(p => ({name: p.name})));

        // When room full, assign roles
        if (players.length === MAX_PLAYERS) {
            startGame();
        }
    });

    socket.on('guess-player', (targetName) => {
        const police = players.find(p => p.id === socket.id);
        const thief = players.find(p => p.role === 'Thief');

        if (!police || police.role !== 'Police') return;

        if (targetName === thief.name) {
            socket.emit('guess-result', 'Correct! You caught the thief!');
            io.emit('guess-result', `${police.name} caught the thief ${thief.name}!`);
        } else {
            socket.emit('guess-result', 'Wrong! Keep trying.');
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('update-players', players.map(p => ({name: p.name})));
    });
});

// Assign random roles
function startGame() {
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // 1 King
    shuffled[0].role = 'King';
    // 1 Police
    shuffled[1].role = 'Police';
    // Rest are Thieves
    for (let i = 2; i < shuffled.length; i++) shuffled[i].role = 'Thief';

    // Send roles to each player
    shuffled.forEach(p => {
        io.to(p.id).emit('your-role', p.role);
    });

    io.emit('update-players', shuffled.map(p => ({name: p.name})));
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));