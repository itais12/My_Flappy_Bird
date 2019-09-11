var socket = io();
var myGameArea;
var myGamePiece;
var myPlayers = [];
var myObstacles = [];
var myScore;
var clickUp = false;
var birdSize = 60;
var Title
var userName;
var playersAmount = {};
var birdsPhotosPath = "./flappy/birds/";
var colsPhotosPath = "./flappy/columns/";
var logoImage = {};
var infoMessage = {};
var errorMessage = {};
var ScreenGameIntervalTime = 30;
var homeScreen;
var gameNumber = 0;
var maxColStyleExist = 4;
var currenColStyle = 0;

function restartGame() {
    homeScreen.start();
    myObstacles = [];
    myPlayers = [];
    myGameArea.frameNo = 0;
    infoMessage = {};
    errorMessage = {};
    playersAmount = {};
    myGamePiece.x = 10;
    myGamePiece.y = 120;
    myGameArea.pause = false;
    myGameArea.stop();
}

function homeScreenManager() {
    Title = new component("40px", "Consolas", "blue", 100, 40, "text");
    Title.text = "Flappy Bird";
    this.start = function () {
        this.interval = setInterval(updateHomeArea, 30);
    }
    this.stop = function () {
        clearInterval(this.interval);
    }
    this.start();
}

function prepareGame() {
    logoImage = new component("250", "100", "./flappy/logo.png", 150, 200, "image");
    myGameArea = new gamearea();
    homeScreen = new homeScreenManager();
    myScore = new component("30px", "Consolas", "black", 180, 40, "text");
    myGamePiece = new component(birdSize, birdSize, "./flappy/birds/Flying-parrot.png", 10, 120, "myPlayer");
}


function gamearea() {
    document.getElementById("canvascontainer").innerHTML = '';
    this.canvas = document.createElement("canvas");
    this.canvas.width = 550;
    this.canvas.height = 480;
    document.getElementById("canvascontainer").appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");
    this.frameNo = 0;
    this.pause = false;
    this.start = function () {
        this.ScreenGameInterval = setInterval(updateGameArea, ScreenGameIntervalTime);
        this.clickUpGameInterval = setInterval(function () {
            socket.emit('movement', clickUp);
        }, 1000 / 60);
        pause = false;
    }
    this.stop = function () {
        pause = true;
        clearInterval(this.ScreenGameInterval);
        clearInterval(this.clickUpGameInterval);
    }
    this.clear = function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
//Spacebar  = up
document.body.onkeydown = function (e) {
    if (e.keyCode == 32) {
        up(true);
    }
}
document.body.onkeyup = function (e) {
    if (e.keyCode == 32) {
        up(false);
    }
}

function component(width, height, fillSrc, x, y, type) {
    this.type = type;
    if (this.type == "player") {
        this.gravity = 0.5;
    } else
        this.gravity = 0;
    this.score = 0;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.gravitySpeed = 0;
    this.fillSrc = fillSrc;
    this.update = function () {
        var ctx = myGameArea.context;
        if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = this.fillSrc;
            var lineHeight = 30;
            var currentTextHeight = this.y;
            var words = this.text.split("\n");
            for (var n = 0; n < words.length; n++) {
                ctx.fillText(words[n], this.x, currentTextHeight);
                currentTextHeight += lineHeight;
            }

        } else {
            this.currentBirdImage = new Image();
            this.currentBirdImage.src = this.fillSrc;
            ctx.drawImage(this.currentBirdImage, this.x, this.y, this.width, this.height);
        }
    }

    this.crashWith = function (otherobj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);
        var crash = true;
        var safeZone = 10;

        if ((mybottom < othertop + safeZone) || (mytop > otherbottom - safeZone) || (myright < otherleft +
                safeZone) || (
                myleft > otherright - safeZone)) {
            crash = false;
        }
        return crash;
    }
}
//show(block) or hide(none) elements in game html
function setViews(myfilterState, upButtonState, nameFormState) {
    document.getElementById("myfilter").style.display = myfilterState;
    document.getElementById("upButton").style.display = upButtonState;
    document.getElementById("nameForm").style.display = nameFormState;
}

function updateGameArea() {
    myGameArea.clear();

    if (Object.keys(infoMessage).length > 0) {
        myGameArea.pause = true;
        setViews("block", "none", "block");
        infoMessage.update();
    } else if (myGameArea.pause == false) {
        if (myGameArea.frameNo !== "Game Over") {
            myGameArea.frameNo += 1;
            if (myGameArea.frameNo % 500 == 0) {
                gameImprove();
            }
        }
        for (var i = 0; i < myObstacles.length; i++) {
            myObstacles[i].x += -1.5;
            myObstacles[i].update();
        }
        myScore.text = "SCORE: " + myGameArea.frameNo;
        myScore.update();

        for (var i = 0; i < myPlayers.length; i++) {
            myPlayers[i].update();
        }
    }
}

//game improve every 500 steps columns change and come faster
function gameImprove() {
    currenColStyle = Math.floor(Math.random() * (maxColStyleExist));
    if (ScreenGameIntervalTime > 6) {
        myGameArea.stop();
        ScreenGameIntervalTime -= 3;
        myGameArea.start();
    }
}

function updateHomeArea() {
    myGameArea.clear();
    Title.update();
    var showLogo = true;

    if (Object.keys(errorMessage).length > 0) {
        errorMessage.update();
        showLogo = false;
    } else {
        if (Object.keys(playersAmount).length > 0) {
            playersAmount.update();
            showLogo = false;
        }
        if (Object.keys(infoMessage).length > 0) {
            infoMessage.update();
            showLogo = false;
        }
    }

    if (showLogo === true) {
        logoImage.update();
    }
}

function readyForGame() {
    if (gameNumber > 0)
        restartGame();
    userName = document.getElementById("nameField").value;
    setViews("none", "block", "none");
    socket.emit('newPlayer', userName);
}

function up(clickUp) {
    this.clickUp = clickUp;

}

socket.on('state', function (players) {
    myPlayers = [];
    for (var id in players) {
        var player = players[id];
        myPlayers.push(new component(birdSize, birdSize, birdsPhotosPath + player.birdType + ".png", player.x, player.y, "player"))
    }
});

socket.on('newObstacle', function (height, gap) {
    x = myGameArea.canvas.width;
    y = myGameArea.canvas.height;
    myObstacles.push(new component(40, height, colsPhotosPath + currenColStyle + "op.png", x, 0));
    myObstacles.push(new component(40, y - (height +
        gap), colsPhotosPath + currenColStyle + ".png", x, y - (y - (height + gap))));
});

socket.on('checkHit', function (x, y) {
    myGamePiece.x = x;
    myGamePiece.y = y;

    for (i = 0; i < myObstacles.length; i += 1) {
        if (myGamePiece.crashWith(myObstacles[i])) {
            socket.emit('gameOver', myGameArea.frameNo);
            myGameArea.frameNo = "Game Over";
            document.getElementById("myfilter").style.display = "block";
            return;
        }
    }
});

socket.on('showInfoMessage', function (messageFromServer) {
    infoMessage = new component("25px", "Consolas", "black", 120, 190, "text");
    infoMessage.text = messageFromServer;
});

socket.on('showErrorMessage', function (messageFromServer) {
    setViews("block", "none", "block");
    errorMessage = new component("25px", "Consolas", "black", 120, 190, "text");
    errorMessage.text = messageFromServer;
});

socket.on('gameIsStart', function () {
    homeScreen.stop();
    myGameArea.start();
    setViews("none", "block", "none");
    infoMessage = {};
});

socket.on('playersAmount', function (amountOfPlayers) {
    playersAmount = new component("25px", "Consolas", "black", 120, 150, "text");
    playersAmount.text = "Players connected: " + amountOfPlayers;
});

socket.on('WinList', function (playersScores) {
    infoMessage = new component("25px", "Consolas", "black", 120, 150, "text");
    infoMessage.text = "Player records: \n";
    var i = 0;
    for (; i < playersScores.length; i++) {
        infoMessage.text += playersScores[i][0] + " Score: " + playersScores[i][1] + "\n";
    }
    gameNumber++;
    infoMessage.text += "The winner is: " + playersScores[0][0];
});

prepareGame();