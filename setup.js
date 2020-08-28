var players = 4;
var playerArea = document.getElementById("players");
for (let i = 0; i < players; i++){
    var newPlayer = document.createElement('div');
    newPlayer.className = "player-info";

    var nam = document.createElement('div');
    nam.className = "player-info-name";
    nam.innerHTML = "test" + i;

    var wordList = document.createElement('div');
    wordList.className = "words-container";
    wordList.innerHTML = "testing"

    newPlayer.appendChild(nam);
    newPlayer.appendChild(wordList);
    playerArea.appendChild(newPlayer);
}

var tileArea = document.getElementById("tiles");
for (let i = 0; i < 7; i++){
    for (let j = 0; j < 14; j++){
        var tile = document.createElement('div');
        tile.className = "tile";
        tile.id = i + "-" + j;
        tile.innerHTML = "~";
        tileArea.appendChild(tile);
    }
}