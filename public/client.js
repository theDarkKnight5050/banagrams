var playerName;
var words = [];
var socket = io();
var tiles = []

//Adds blank tiles to play area
function setPlayArea(){
    var tileArea = document.getElementById("tiles");
    for (let i = 0; i < 7; i++){
        for (let j = 0; j < 14; j++){
            var tile = document.createElement('div');
            tile.className = "tile";
            tile.id = i + "-" + j;
            //tile.innerHTML = "~";
            tile.unflipped = true;
            tileArea.appendChild(tile);
            tiles.push(tile);
        }
    }
}


//Adds players to player area, gives client special color in their own display
//Issue: doesn't remember ip's as players
function setPlayers(players) {
    var playerArea = document.getElementById("players");
    while (playerArea.firstChild) {
        playerArea.removeChild(playerArea.firstChild);
    }
    players.forEach(player => {
        var newPlayer = document.createElement('div');
        newPlayer.className = "player-info";
        if (player.name == playerName) {
            newPlayer.style.background = "#f78ddE";
            newPlayer.style.borderColor = "#df35b7";
        }
    
        var nam = document.createElement('div');
        nam.className = "player-info-name";
        nam.innerHTML = player.name
    
        var wordList = document.createElement('div');
        wordList.className = "words-container";
        console.log(player.words);
        player.words.forEach(word =>{
            wordList.innerHTML += "<p>" + word + "</p>";
        });
    
        newPlayer.appendChild(nam);
        newPlayer.appendChild(wordList);
        playerArea.appendChild(newPlayer);
    });
}

//newPlayers event?
//Should setPlayArea come before everything else?
function setup(){
    document.getElementById("add-user").onclick = function() {
        if(document.getElementById("username").value != ""){
            socket.emit('newPlayer', document.getElementById("username").value);
            player = document.getElementById("username").value;
            $("#welcome").modal('hide');
        }
    };
    
    socket.on('newPlayers', function(players) {
        setPlayers(players);
    });

    socket.on('turn', function(currPlayer) {
        document.getElementById("start-game").style.visibility = "hidden";
        document.getElementById("status").innerHTML = currPlayer.name + "'s turn";
        if(player == currPlayer.name) {
            tiles.forEach(tile =>{
                if (tile.className == "tile" && tile.unflipped) {
                    tile.onclick = function() {
                        indices = tile.id.split('-');
                        socket.emit('flipped', [parseInt(indices[0]), parseInt(indices[1])]);
                        tiles.forEach(tile =>{
                            tile.onclick = null;
                        });
                    };
                }
            });
        }
    });

    socket.on('flipped', function(flipTile) {
        tiles[flipTile.index[0] * 14 + flipTile.index[1]].innerHTML = flipTile.char;
        tiles[flipTile.index[0] * 14 + flipTile.index[1]].unflipped = false;
    });


    socket.on('snatch', function(game_state) {
        setPlayers(game_state.players);
    });

    socket.on('taken', function(letter) {
        tiles.some(tile => {
            if(tile.innerHTML == letter) {
                tile.className = "tile-taken";
                tile.innerHTML = null;
                console.log("taken");
                return true;
            }
        });
    });

    document.getElementById("start-game").onclick = function() {
        socket.emit('start', true);
    };

    //ISSUE? Lockout rapid entries
    document.getElementById("word-field").addEventListener("keyup", function(event){
        event.preventDefault();
        if(event.keyCode == 13){
            socket.emit('wordAttempt', {
                by: player,
                word: document.getElementById("word-field").value
            });
            document.getElementById("word-field").value = "";
        }
    });

    setPlayArea();
}