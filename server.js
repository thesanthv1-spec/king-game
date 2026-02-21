const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve all static files (index.html, script.js, etc.)
app.use(express.static(__dirname));

// Explicitly serve index.html on root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Game data
const MAX_PLAYERS = 5;
let players = []; // {name, id, role}

// Socket.IO logic
io.on('connection', socket => {

    // Player joins game
    socket.on('join-game', (name) => {

        if(players.length >= MAX_PLAYERS){
            socket.emit('room-full');
            return;
        }

        players.push({name, id: socket.id});
        io.emit('update-players', players.map(p => ({name: p.name})));

        // When max players joined, start game
        if(players.length === MAX_PLAYERS){
            startGame();
        }
    });

    // Police guesses a player
    socket.on('guess-player', (targetName) => {
        const police = players.find(p => p.id === socket.id);
        const thief = players.find(p => p.role === 'Thief');

        if(!police || police.role !== 'Police') return;

        if(targetName === thief.name){
            socket.emit('guess-result', 'Correct! You caught the thief!');
            io.emit('guess-result', `${police.name} caught the thief ${thief.name}!`);
        } else {
            socket.emit('guess-result', 'Wrong! Keep trying.');
        }
    });

    // Player disconnects
    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('update-players', players.map(p => ({name: p.name})));
    });
});

// Start game: assign roles randomly
function startGame(){
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // 1 King
    shuffled[0].role = 'King';
    // 1 Police
    shuffled[1].role = 'Police';
    // Rest are Thieves
    for(let i = 2; i < shuffled.length; i++) shuffled[i].role = 'Thief';

    // Send roles to each player
    shuffled.forEach(p => {
        io.to(p.id).emit('your-role', p.role);
    });

    // Update player list with roles (optional)
    io.emit('update-players', shuffled.map(p => ({name: p.name})));
}

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));