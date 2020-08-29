var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var game_state = {
    started: false,
    players: []
};

app.use(express.static(__dirname + '/'));

http.listen(3000, () => {
  console.log('listening on *:3000');
});

io.on('connection', socket => {
    socket.on('newPlayer', name =>{
        game_state.players.push(name);
        io.emit('newPlayers', [name]);
    });
});