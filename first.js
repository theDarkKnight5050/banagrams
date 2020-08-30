var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var game_state = {
    started: false,
    players: [],
    current_player: 0,
    hiddenLetter: "aaaaaaaabbccddddeeeeeeeeeeeeeffggghhiiiiiiiijklllmmnnnnnnooooooooppqrrrrrrrsssstttttttuuuuvvwwxyyz",
    availLetters: ""
};

app.use(express.static(__dirname + '/public'));

http.listen(3000, () => {
  console.log('listening on *:3000');
});

io.on('connection', socket => {
    socket.on('newPlayer', name =>{
        game_state.players.push(name);
        io.emit('newPlayers', game_state.players);
    });

    socket.on('start', start =>{
        advance();
    });

    socket.on('flipped', indices => {
        var ind = Math.floor(Math.random() * game_state.hiddenLetter.length);
        var nextChar = game_state.hiddenLetter.substring(ind, ind + 1);
        game_state.availLetters = game_state.availLetters + nextChar;
        game_state.hiddenLetter = game_state.hiddenLetter.substring(0, ind) + game_state.hiddenLetter.substring(ind);
        io.emit('flipped', {
            index: indices,
            char: nextChar
        });
        advance();
    });
});

function advance(){
    io.emit('turn', game_state.players[game_state.current_player]);
    game_state.current_player = (game_state.current_player + 1) % game_state.players.length;
}