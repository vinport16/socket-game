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

function magnitude(v){
  return distance(zeroVector, v);
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
  for (obj of state.players()){
    cleanedState.push({type:obj.type, name:obj.name, position:obj.position});
  }

  for (obj of state.liveMessages()){
    cleanedState.push({type:obj.type, text:obj.text, position:obj.position, sender:obj.sender.name});
  }

  cleanedState = cleanedState.concat(state.zones());

  // send to each player
  for (obj of state.players()){
    obj.socket.emit("state", cleanedState);
  }
}

function findInState(name, state){
  for (obj of state.objects){
    if(obj.name == name){
      return obj;
    }
  }
  return false;
}

function deleteFromState(object, state){
  for (var i = 0; i < state.objects.length; i++){
    if(state.objects[i] === object){
      state.objects.splice(i,1);
      break;
    }
  }
}

function movePlayers(state){
  for (player of state.players()){

    let delta = new Date().getTime() - player.lastMoved;
    player.lastMoved = new Date().getTime();

    if(player.moveTarget && player.shouldAutoMove()){
      // move towards target
      let direction = unitVector(subtract(player.moveTarget, player.position));

      if(distance(player.position, player.moveTarget) > (delta/1000)*playerSpeed){
        // if the target is far away
        player.position = add(player.position, multiply(direction, (delta/1000)*playerSpeed));
      }else{
        // if the target is very close
        player.position = player.moveTarget;
        player.moveTarget = false;
      }

    }else{
      // cancel moveTarget
      player.moveTarget = false;
      // move with WASD
      let direction = movementDirection(player);
      player.position = add(player.position, multiply(direction, delta/1000 * playerSpeed));
    
    }

    
  }
}

function removeOldMessages(state){
  for(message of state.liveMessages()){
    if(message.time + message.timeout < new Date().getTime()){
      deleteFromState(message, state);
    }
  }
}

function createSomeZones(numberOfZones, state){
  for(i = 0; i < numberOfZones; i++){
    let zone = {type:"circularZone"};
    zone.radius = Math.random() * 300;
    zone.position = Math.position = {x:(Math.random() * 4000)-2000,y:(Math.random() * 4000)-2000};
    zone.color = randomColor();
    state.objects.push(zone);
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

// zone functions

function randomColor(){
  return "hsla("+randomIntInRange(0,255)+", "+100+"%, "+randomIntInRange(35,65)+"%, "+0.8+")";
}

// msc functions

function randomIntInRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// game data structures and variables

var state =
{
  objects: [],
  startTime: new Date().getTime(),
  frameTime: new Date().getTime(),
  deltaTime: function(){
    return this.frameTime - new Date().getTime();
  },
  players: function(){
    let out = [];
    for(obj of this.objects){
      if(obj.type == "player"){
        out.push(obj);
      }
    }
    return out;
  },
  liveMessages: function(){
    let out = [];
    for(obj of this.objects){
      if(obj.type == "message"){
        out.push(obj);
      }
    }
    return out;
  },
  zones: function(){
    let out = [];
    for(obj of this.objects){
      if(obj.type == "circularZone"){
        out.push(obj);
      }
    }
    return out;
  }
};

createSomeZones(50, state);

var playerSpeed = 200; // px/sec

// message logic

io.on("connection", function(socket){
  var player;
  socket.on("login", function(msg){
    
    console.log("Player "+msg+" logged in.");
    
    player = {
      type:"player",
      name:msg,
      socket:socket,
      position:{x:0,y:0},
      moving: new Map([["up",false],["down",false],["left",false],["right",false]]),
      lastMoved: new Date().getTime(),
      moveTarget: false,
      shouldAutoMove: function(){
        let shouldAuto = true;
        this.moving.forEach(function(value, key, map){
          shouldAuto = shouldAuto && !value;
        });
        return shouldAuto;
      }
    };

    state.objects.push(player);

    socket.on("disconnect", function(){
      console.log(player.name+" disconnected.");
      deleteFromState(player, state);
    });

  });

  socket.on("message", function(mes){
    let message = {
      type:"message",
      text:mes.text,
      time:new Date().getTime(),
      timeout:mes.timeout,
      sender: player,
      position: player.position
    };

    state.objects.push(message);
  });


  socket.on("startMove", function(direction){
    player.moving.set(direction, true);
  });

  socket.on("stopMove", function(direction){
    player.moving.set(direction, false);
  });

  socket.on("goto", function(position){
    player.moveTarget = position;
    player.moving.set("up",false);
    player.moving.set("down",false);
    player.moving.set("left",false);
    player.moving.set("right",false);
  });

});



/* _____ game loop _____ */

function mainLoop(){
  state.frameTime = new Date().getTime();

  movePlayers(state);

  removeOldMessages(state);

  sendState(state);
}

setInterval(mainLoop,30);












// ok