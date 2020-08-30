var player;
var words;
var socket = io();
var tiles = []

function setPlayArea(){
    var tileArea = document.getElementById("tiles");
    for (let i = 0; i < 7; i++){
        for (let j = 0; j < 14; j++){
            var tile = document.createElement('div');
            tile.className = "tile";
            tile.id = i + "-" + j;
            tile.innerHTML = "~";
            tileArea.appendChild(tile);
            tiles.push(tile);
        }
    }
}

function setPlayers(players) {
    var playerArea = document.getElementById("players");
    while (playerArea.firstChild) {
        playerArea.removeChild(playerArea.firstChild);
    }
    players.forEach(player => {
        var newPlayer = document.createElement('div');
        newPlayer.className = "player-info";
    
        var nam = document.createElement('div');
        nam.className = "player-info-name";
        nam.innerHTML = player
    
        var wordList = document.createElement('div');
        wordList.className = "words-container";
    
        newPlayer.appendChild(nam);
        newPlayer.appendChild(wordList);
        playerArea.appendChild(newPlayer);
    });
}
 
function setup(){
    document.getElementById("add-user").onclick = function() {
        socket.emit('newPlayer', document.getElementById("username").value);
        player = document.getElementById("username").value;
        console.log(player);
        $("#welcome").modal('hide');
    };
    
    socket.on('newPlayers', function(players) {
        setPlayers(players);
    });

    socket.on('turn', function(currPlayer) {
        document.getElementById("start-game").style.visibility = "hidden";
        document.getElementById("status").innerHTML = currPlayer + "'s turn";
        if(player == currPlayer) {
            tiles.forEach(tile =>{
                tile.onclick = function() {
                    indices = tile.id.split('-');
                    socket.emit('flipped', [parseInt(indices[0]), parseInt(indices[1])]);
                    tiles.forEach(tile =>{
                        tile.onclick = null;
                    });
                };
            });
        }
    });

    socket.on('flipped', function(flipTile) {
        tiles[flipTile.index[0] * 7 + flipTile.index[1]].innerHTML = flipTile.char;
    });

    document.getElementById("start-game").onclick = function() {
        socket.emit('start', true);
    };

    setPlayArea();
}