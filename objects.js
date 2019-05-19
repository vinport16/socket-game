
function abpos(position){
  return add( position, subtract( {x:canvas.width/2, y:canvas.height/2}, viewPosition))
}

function statepos(position){
  return subtract( position, subtract( {x:canvas.width/2 + document.body.scrollTop, y:canvas.height/2 + document.body.scrollLeft}, viewPosition))
}

function drawGridLines(){
  relative = viewPosition.y % 150;
  numLines = Math.floor(canvas.height/150) + 2;
  for(var i = 0; i <= numLines; i++){
    height = i*150-relative;
    v1 = {x:0,y:height};
    v2 = {x:canvas.width,y:height};
    
    drawLine(v1,v2,"rgba(50,70,200,0.3)");
  }

  relative = viewPosition.x % 150;
  numLines = Math.floor(canvas.width/150) + 2;
  for(var i = 0; i <= numLines; i++){
    width = i*150-relative;
    v1 = {x:width,y:0};
    v2 = {x:width,y:canvas.height};
    
    drawLine(v1,v2,"rgba(50,70,200,0.3)");
  }
}

function drawWorld(state){
  clearCanvas();

  drawGridLines();

  // draw zones
  for (obj of state){
    if(obj.type == "circularZone"){
      drawCircle(abpos(obj.position), obj.radius, obj.color, obj.color);
    }
  }

  // draw messages
  for (obj of state){
    if(obj.type == "message"){
      drawText(obj.text, add(abpos(obj.position), {x:0, y:-15}), "green");
    }
  }

  // draw players
  for (obj of state){
    if(obj.name == playername){
      drawCircle(abpos(obj.position), 10, "white", "red");
      drawText(obj.name, add(abpos(obj.position), {x:0, y:25}), "white");
    }else if(obj.type == "player"){
      drawCircle(abpos(obj.position), 10, "red", "white");
      drawText(obj.name, add(abpos(obj.position), {x:0, y:25}), "red");
    }
  }

}