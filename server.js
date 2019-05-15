var express = require('express');
var sio = require('socket.io');
var app = express();
var http = require('http').createServer(app);
var io = sio(http);
var port = process.env.PORT || 3030; //runs on heroku or localhost:3030



http.listen(port);

// make sure people can get the client side code

app.get('/socket.io/socket.io.js', function(req, res){
  res.sendFile(__dirname + '/node_modules/socket.io/socket.io.js');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/style.css');
});

app.get('/preload.js', function(req, res){
  res.sendFile(__dirname + '/preload.js');
});

app.get('/script.js', function(req, res){
  res.sendFile(__dirname + '/script.js');
});

app.get('/objects.js', function(req, res){
  res.sendFile(__dirname + '/objects.js');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


// vector math functions

var zeroVector = {x:0,y:0};

function vector(x,y){
  return {x: x, y: y}
}

function getVector(e){
  return {x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop};
}

function subtract(v1, v2){
  return {x: v1.x-v2.x, y: v1.y-v2.y};
}

function add(v1, v2){
  return {x: v1.x+v2.x, y: v1.y+v2.y};
}

function divide(v1,n){ //divide a vector by a number
  if(n == 0){
    return zeroVector;
  }else{
    return {x: v1.x/n, y: v1.y/n};
  }
}

function multiply(v1,n){ //multiply a vector by a number
  return {x: v1.x*n, y: v1.y*n};
}

function distance(v1, v2){
  return Math.sqrt( (v1.x-v2.x)*(v1.x-v2.x) + (v1.y-v2.y)*(v1.y-v2.y) );
}

function unitVector(v){
  return divide(v, distance(zeroVector,v));
}

function rotateVector(vec, ang){
    ang = -ang * (Math.PI/180);
    var cos = Math.cos(ang);
    var sin = Math.sin(ang);
    return {x: Math.round(10000*(vec.x * cos - vec.y * sin))/10000, y: Math.round(10000*(vec.x * sin + vec.y * cos))/10000};
}

var directions = new Map();
directions.set("up", vector(0, -1));
directions.set("down", vector(0, 1));
directions.set("left", vector(-1, 0));
directions.set("right", vector(1, 0));


// state functions

function sendState(state){
  cleanedState = [];
  for (obj of state.players){
    cleanedState.push({type:obj.type,name:obj.name,position:obj.position});
  }
  for (obj of state.players){
    if(obj.type == "player"){
      obj.socket.emit("state", cleanedState);
    }
  }
}

function findInState(name, state){
  for (obj of state.players){
    if(obj.name == name){
      return obj;
    }
  }
  return false;
}

function deletePlayer(player, state){
  for (var i = 0; i < state.players.length; i++){
    if(state.players[i] === player){
      state.players.splice(i,1);
      break;
    }
  }
}

function movePlayers(state){
  for (player of state.players){
    let delta = new Date().getTime() - player.lastMoved;
    player.lastMoved = new Date().getTime();

    let direction = movementDirection(player);

    player.position = add(player.position, multiply(direction, delta/1000 * playerSpeed));
  }
}


// player functions

function movementDirection(player){
  let direction = zeroVector;

  player.moving.forEach(function(value, key, map){
    if(value){
      direction = add(direction, directions.get(key));
    }
  });

  direction = unitVector(direction);

  return direction;
}


// game data structures and variables

var state =
{
  players: [],
  startTime: new Date().getTime(),
  frameTime: new Date().getTime(),
  deltaTime: function(){
    return frameTime - new Date().getTime();
  }
};

var playerSpeed = 200; // px/sec

// message logic

io.on("connection", function(socket){
  var player;
  socket.on("message", function(msg){
    
    console.log("Player "+msg+" logged in.");
    
    player = {
      type:"player",
      name:msg,
      socket:socket,
      position:{x:0,y:0},
      moving: new Map([["up",false],["down",false],["left",false],["right",false]]),
      lastMoved: new Date().getTime()
    };

    state.players.push(player);

    socket.on("disconnect", function(){
      console.log(player.name+" disconnected.");
      deletePlayer(player, state);
    });

  });


  socket.on("startMove", function(direction){
    player.moving.set(direction, true);
  });

  socket.on("stopMove", function(direction){
    player.moving.set(direction, false);
  });

});



/* _____ game loop _____ */

function mainLoop(){
  state.frameTime = new Date().getTime();

  movePlayers(state);

  sendState(state);
}

setInterval(mainLoop,100);












// ok