var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
var $ = jQuery = require('jquery')(window);
var game_state = {
    started: false,
    players: [],
    current_player: 0,
    hiddenLetter: "aaaaaaaabbccddddeeeeeeeeeeeeeffggghhiiiiiiiijklllmmnnnnnnooooooooppqrrrrrrrsssstttttttuuuuvvwwxyyz",
    availLetters: []
};

app.use(express.static(__dirname + '/public'));

http.listen(3000, () => {
  console.log('listening on *:3000');
});

io.on('connection', socket => {
    socket.on('newPlayer', newPlayer =>{
        game_state.players.push({
            name: newPlayer,
            words: []
        });  
        io.emit('newPlayers', game_state.players);
    });

    socket.on('start', start =>{
        advance();
    });

    socket.on('flipped', indices => {
        var ind = Math.floor(Math.random() * game_state.hiddenLetter.length);
        var nextChar = game_state.hiddenLetter.substring(ind, ind + 1);
        game_state.availLetters.push(nextChar);
        game_state.hiddenLetter = game_state.hiddenLetter.substring(0, ind) + game_state.hiddenLetter.substring(ind);
        io.emit('flipped', {
            index: indices,
            char: nextChar
        });
        advance();
    });

    socket.on('wordAttempt', attempt =>{
        if(possible(attempt.word)) {
            game_state.players.forEach(player =>{
                if (player.name == attempt.by) {
                    player.words.push(attempt.word);
                }
            });
            io.emit('snatch', game_state);
        }
    });
});

function advance(){
    io.emit('turn', game_state.players[game_state.current_player]);
    game_state.current_player = (game_state.current_player + 1) % game_state.players.length;
}

function exists(word) {
    url = "https://cors-anywhere.herokuapp.com/https://en.wiktionary.org/w/api.php?action=query&format=json&titles=";
    real = true;
    $.getJSON(url + word, function(data) {
        if ("-1" in data.query.pages){
            real = false;
        }
    });
    return real;
}

function possible(word) {
    if (word.length < 3 || !exists(word)){
        console.log("fail snatch 1");
        return false;
    }
    wordAttempt = make(word.split(""));
    if(wordAttempt.works) {
        wordAttempt.snatch.forEach(snatch =>{
            for (let player of game_state.players) {
                if(player.name == snatch.from) {
                    let ind = player.words.indexOf(snatch.word);
                    player.words.splice(ind, ind + 1);
                }
            }
        });
        console.log("successful snatch");
        return true;
    }
    console.log("fail snatch 2")
    return false;
}

function make(attempt) {
    var recurSnatch = [];

    if (isSubset(game_state.availLetters, attempt)) {
        for (let letter of attempt) {
            io.emit("taken", letter);
        }
        game_state.availLetters = subtract(attempt, game_state.availLetters);
        return {
            works: true,
            snatch: recurSnatch
        };
    }

    for (let player of game_state.players) {
        for (let playerWord of player.words) {
            if(isSubset(attempt, playerWord)) {
                recur = make(subtract(playerWord.split(""), attempt))
                if(recur.works) {
                    recurSnatch = recur.snatch
                    recurSnatch.push({
                        from: player.name,
                        word: playerWord
                    });
                    return {
                        works: true,
                        snatch: recurSnatch
                    };
                }
            }
        }
    }

    return {
        works: false
    };
}

function isSubset(sup, sub) {
    for (let item of sub) {
        if (!sup.includes(item)) {
            return false;
        }
    }
    return true;
}

function subtract(ths, that) {
    for (let item of ths) {
        let ind = that.indexOf(item);
        that.splice(ind, ind + 1);
    }
    return that;
}