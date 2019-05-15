// drawing functions

function clearCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function clearListeners(){
  var clone = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(clone, canvas);
  canvas = clone;
  ctx = canvas.getContext("2d");

  drawWorld(state);
}

function drawCircle(position, r, fill, stroke){
    ctx.beginPath();
  ctx.arc(position.x, position.y, r, 0, 2 * Math.PI, false);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.stroke();
}

function drawRectangle(tl, br, fill, stroke){
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.rect(tl.x, tl.y, br.x, br.y);
  ctx.fill();
  ctx.stroke();
}

function drawLine(v1, v2, stroke){
    ctx.beginPath();
    ctx.moveTo(v1.x,v1.y);
    ctx.lineTo(v2.x,v2.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
}

function drawText(text, position){
  ctx.textAlign = "center"
  ctx.font = "12pt Arial";
  ctx.strokeStyle = "white";
  ctx.fillText(text, position.x, position.y); 
}

var zeroVector = {x:0,y:0};

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
  return {x: v1.x/n, y: v1.y/n};
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

// setup


socket.emit("login",playername);

var canvas = document.getElementById("canvas");

canvas.width = (document.body.clientWidth-10) * 0.70 ;
canvas.height = (document.body.clientHeight-10) * 0.90 ;

var ctx = canvas.getContext("2d");

messageInput = document.getElementById("messageinput");

function disableAllButtons(){
  var buttons = document.getElementsByTagName("button");
  for(var i = 0; i < buttons.length; i++){
    buttons[i].disabled = true;
  }
}

function enableAllButtons(){
  var buttons = document.getElementsByTagName("button");
  for(var i = 0; i < buttons.length; i++){
    buttons[i].disabled = false;
  }
}

function findInState(name, state){
    for (obj of state){
        if(obj.name == name){
            return obj;
        }
    }
    return false;
}





// position of your view on the map
var viewPosition = {x:0,y:0};

var state = [{name:playername,position:viewPosition}];


document.onkeydown = function (e) {
    event = e || window.event;
    
    // check if you're in the text message box
    if(document.activeElement == messageInput){

      let enter = 13;

      console.log(event.which);

      if(event.which == enter){
        socket.emit("message",{text:messageInput.value, timeout:8000});
        messageInput.value = "";
        document.activeElement.blur();
      }

    }else{
      // movement

      let w = 87;
      let a = 65;
      let s = 83;
      let d = 68;

      if(event.which == w){
          socket.emit("startMove", "up");
      }else if(event.which == s){
          socket.emit("startMove", "down");
      }else if(event.which == a){
          socket.emit("startMove", "left");
      }else if(event.which == d){
          socket.emit("startMove", "right");
      }

      // messages

      let t = 84;

      if(event.which == t){
        // wait a bit so that the "t" doesn't get written in the textbox
        setTimeout(function(){messageInput.focus();},50);
      }
    }

};

document.onkeyup = function (e) {
    event = e || window.event;
    
    w = 87
    a = 65
    s = 83
    d = 68


    if(event.which == w){
        socket.emit("stopMove", "up");
    }else if(event.which == s){
        socket.emit("stopMove", "down");
    }else if(event.which == a){
        socket.emit("stopMove", "left");
    }else if(event.which == d){
        socket.emit("stopMove", "right");
    }

};


socket.on("state", function(state){
    viewPosition = findInState(playername,state).position;
    drawWorld(state);
});





// ok