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
        game_state.hiddenLetter = game_state.hiddenLetter.substring(0, ind) + game_state.hiddenLetter.substring(ind + 1);
        io.emit('flipped', {
            index: indices,
            char: nextChar
        });
        console.log(game_state.hiddenLetter);
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

//checks wiktionary api if word is a word in any language
//Issue: false gets logged 3 times
//ISSUE: slow
function exists(word) {
    let url = "https://cors-anywhere.herokuapp.com/https://en.wiktionary.org/w/api.php?action=query&format=json&titles=";
    let real = true;
    $.ajax({
        url: url+word,
        datatype: 'json',
        async: false,
        success: function(data) {
            real = !data.query.pages.hasOwnProperty("-1");
            console.log(real);
        }
    });
    return real;
}

//Checks if word is a valid word in any language. If so, calls make to check for a valid snatch
//If valid, for each snatched word, finds target player and takes their word away, or does nothing 
//if it came from available letters, else failing the snatch
//ISSUE: if player has more than one copy of snatched word, it grabs both
function possible(word) {
    console.log(exists(word));
    console.log(word);
    if (word.length < 4 || !exists(word)){
        console.log("fail snatch 1");
        return false;
    }
    let wordAttempt = make(word.split(""));
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
        console.log(game_state.availLetters);
        return true;
    }
    console.log("fail snatch 2") //ISSUE: grabbing words breaks when you take a word while many letters on the board. does it grab every copy of available letters?
    return false;
}

//Issue:? Chooses first encounter by default. Needs better resolution when multiple
//Ways to snatch exist?

//Issue: Implement restrictions (common etymology etc.) or assume you're on a call to deliberate?

//Given an attempted word, checks pile and other players' words for requisite letters
//First checks set of available letters
//Recursively works from other players' words which are a subset of the attempt, checking on
//remainder. Pushes each snatched word onto snatch in return
//Gives attempting player the word if successful
function make(attempt) {
    var recurSnatch = [];

    if (isSubset(game_state.availLetters, attempt).value) {
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
            let subset = isSubset(attempt, playerWord);
            if(subset.value && !subset.strict) {
                let recur = make(subtract(playerWord.split(""), attempt))
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

//Determines whether sub is a subset of sup and whether it as a strict subset
function isSubset(sup, sub) {
    subcounts = {};
    supcounts = {};
    for (let item of sub){
        if(subcounts.hasOwnProperty(item)){
            subcounts[item] += 1;
        } else {
            subcounts[item] = 1;
        }
    }
    for (let item of sup){
        if(supcounts.hasOwnProperty(item)){
            supcounts[item] += 1;
        } else {
            supcounts[item] = 1;
        }
    }
    for (let letter in subcounts){
        if(!supcounts.hasOwnProperty(letter) || supcounts[letter] < subcounts[letter]){
            return {value : false, strict : false};
        }
    }
    for (let letter in supcounts){
        if(!subcounts.hasOwnProperty(letter) || supcounts[letter] > subcounts[letter]){
            return {value : true, strict : false};
        }
    }
    return {value : true, strict : true};
}

//Removes elements of ths from that
function subtract(ths, that) {
    console.log(that);
    for (let item of ths) {
        let ind = that.indexOf(item);
        that.splice(ind, 1);
    }
    return that;
}

//TODO: Ending, scoring