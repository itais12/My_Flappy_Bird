// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/flappy', express.static(__dirname + '/flappy'));

// Routing
app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'flappy.html'));
});

// Routing
app.get('/style.css', function (request, response) {
  response.sendFile(path.join(__dirname, 'style.css'));
});

server.listen(5000, function () {
  console.log('Starting server on port 5000');
});

var gameActive = false;
var players = {};
var playersScores = [];

var amountOfPlayers = 0;
var canvasHeight = 480;
var sendObstacle;
var startTimer = {};
var amountOfPlayersIcon = 9;

function sendObstacleManager() {
  //create new obstacle
  this.obsInterval = setInterval(function () {
    minHeight = 50;
    maxHeight = 280;
    height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
    minGap = 90;
    maxGap = 150;
    gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
    for (var id in players) {
      io.to(id).emit('newObstacle', height, gap);
    }
  }, 4000);
  this.stopSend = function () {
    clearInterval(this.obsInterval);
  }
}

//players gravity
setInterval(function () {
  if (gameActive) {
    for (var id in players) {
      var player = players[id];
      player.y += player.speedGravity;
      player.speedGravity += player.gravity;
      if (player.y < 0) {
        player.y = 0;
        player.speedGravity = 0;
        player.gravity = 0.5;
      } else if (player.y > canvasHeight - 60) {
        player.y = canvasHeight - 60;
        player.speedGravity = 0;
        player.gravity = 0.5;
      }
      io.to(id).emit('checkHit', player.x, player.y);
    }
    io.sockets.emit('state', players);

  }
}, 30);

setInterval(function () {
  if (gameActive && io.engine.clientsCount == 0) {
    gameActive = false;
    sendObstacle.stopSend();
    amountOfPlayers = 0;
    players = {};
    playersScores = [];
  }
  for (var id in players) {
    if (!io.sockets.connected[id]) {
      delete players[id];
      amountOfPlayers--;
    }
  }
}, 1000 / 60);

function setTimerAndStartGame() {

  if (!gameActive && Object.keys(startTimer).length == 0) {
    var timeleft = 10;

    startTimer = setInterval(function () {
      timeleft -= 1;
      io.sockets.emit('showInfoMessage', "Get ready " + timeleft + " To Start!!");
      if (timeleft <= 0) {
        gameActive = true;
        playersScores = [];
        for (var id in players) {
          io.to(id).emit('gameIsStart');
        }
        sendObstacle = new sendObstacleManager();
        clearInterval(startTimer);
        startTimer = {};
      }
    }, 1000);
  }
}

io.on('connection', function (socket) {
  socket.on('newPlayer', function (name) {
    if (!gameActive) {
      if (!players.hasOwnProperty(socket.id)) {
        var birdType = amountOfPlayers;
        if (amountOfPlayers > amountOfPlayersIcon)
          birdType = Math.floor(Math.random() * (amountOfPlayersIcon));

        players[socket.id] = {
          x: 10,
          y: 120,
          name: name,
          birdType: birdType,
          gravity: 0.5,
          speedGravity: 0.5
        };

        amountOfPlayers++;
        io.sockets.emit('playersAmount', amountOfPlayers);

        if (amountOfPlayers >= 2) {
          setTimerAndStartGame();
        } else {
          io.to(socket.id).emit('showInfoMessage', "Must be 2 players at least");
        }
      }
    } else {
      io.to(socket.id).emit('showErrorMessage', "Game is already running.\n please try again later");
    }
  });

  socket.on('movement', function (isClick) {
    var player = players[socket.id] || {};
    if (isClick)
      player.gravity = -0.2;
    else
      player.gravity = 0.2;
  });

  socket.on('gameOver', function (score) {
    var socketId = socket.id;
    var player = players[socketId];
    delete players[socketId];
    amountOfPlayers--;
    playersScores.push([player.name, score, socketId]);

    for (var id in players) {
      return;
    }

    playersScores.sort(function (a, b) {
      return b[1] - a[1];
    });

    for (var i = 0; i < playersScores.length; i++)
      io.to(playersScores[i][2]).emit('WinList', playersScores);
    gameActive = false;
    sendObstacle.stopSend();
  });

});