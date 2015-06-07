/**
* Created with mcmillenb.
* User: mcmillenb
* Date: 2015-06-06
* Time: 05:44 PM
*/

var controls = Object.create(null);

function createPaint(parent) {
    var canvas = elt("canvas", {width: 500, height: 300});
    var cx = canvas.getContext("2d");
    var toolbar = elt("div", {class: "toolbar"});
    for (var name in controls)
        toolbar.appendChild(controls[name](cx));
    
    var panel = elt("div", {class: "picturepanel"}, canvas);
    parent.appendChild(elt("div", null, panel, toolbar));
};

// associates the names of tools with the function that should
// be called when they are selected and the canvas is clicked
var tools = Object.create(null);

// populate a select element with the available tools as options
controls.tool = function(cx) {
    var select = elt("select");
    for (var name in tools)
        select.appendChild(elt("option", null, name));
    
    // add a mousedown event listener for the selected tool
    cx.canvas.addEventListener("mousedown", function(event){
       if (event.which == 1){
           tools[select.value](event, cx);
           event.preventDefault();
       } 
    });
    
    // return a span with the select element
    return elt("span", null, "Tool: ", select);
};

// a color input element 
controls.color = function(cx){
    var input = elt("input", {type: "color"});
    input.addEventListener("change", function(){
        cx.fillStyle = cx.strokeStyle = input.value;
    });
    return elt("span", null, "Color: ", input);
};

// field for configuring the brush size
controls.brushSize = function(cx) {
    var select = elt("select");
    var sizes = [1,2,3,5,8,12,25,35,50,75,100];
    sizes.forEach(function(size){
        select.appendChild(elt("option", {value: size},
                               size + " pixels"));
    });
    select.addEventListener("change", function() {
        cx.lineWidth = select.value;
    });
    return elt("span", null, "Brush size: ", select);
}

// Save link which updates when focus or mouseover 
controls.save = function(cx) {
    // add the link initially points nowhere
    var link = elt("a", {href: "/"}, "Save");
    function update(){
        try{ // try to point to the image in the canvas
            link.href = cx.canvas.toDataURL(); 
        }
        catch (e){
            if (e instanceof SecurityError) // point to a javascript url if it fails
                link.href = "javascript:alert(" +
                    JSON.stringify("Can't save: " + e.toString()) + ")";
            else
                throw e;
        }
    }
    link.addEventListener("mouseover", update);
    link.addEventListener("focus", update);
    return link;
};

// Input control to load a local file
controls.openFile = function(cx) {
    var input = elt("input", {type: "file"});
    input.addEventListener("change", function(){
        if (input.files.length == 0) return;
        var reader = new FileReader();
        reader.addEventListener("load", function(){
            loadImageURL(cx, reader.result);
        });
        reader.readAsDataURL(input.files[0]);
    });
    return elt("div", null, "Open file: ", input);
};

controls.openURL = function(cx){
    var input = elt("input", {type: "text"});
    var button = elt("button", {type: "submit"}, "load");
    var form = elt("form", null,
                   "Open URL: ", input, button);
    form.addEventListener("submit", function(event){
        event.preventDefault();
        loadImageURL(cx, input.value);
    });
    return form;
};

// Tool for drawing a basic line
tools.Line = function(event, cx, onEnd){
    cx.lineCap = "round";
    
    var pos = relativePos(event, cx.canvas);
    trackDrag(function(event){
        cx.beginPath();
        cx.moveTo(pos.x, pos.y);
        pos = relativePos(event, cx.canvas);
        cx.lineTo(pos.x, pos.y);
        cx.stroke();
    }, onEnd);
};

// Tool for easing
tools.Erase = function(event, cx){
    cx.globalCompositeOperation = "destination-out"; // erase when mousemove
    tools.Line(event, cx, function(){
        cx.globalCompositeOperation = "source-over"; // back to drawing when mouseup
    });
};

// Tool for adding text to an image
tools.Text = function(event, cx){
    var text = prompt("Text:","");
    if (text) {
        var pos = relativePos(event, cx.canvas);
        cx.font = Math.max(7, cx.lineWidth) + "px sans-serif";
        cx.fillText(text, pos.x, pos.y);
    }
};

// Tool for spray-paint-like drawing
tools.Spray = function(event, cx){
    var radius = cx.lineWidth / 2;
    var area = radius * radius * Math.PI;
    var dotsPerTick = Math.ceil(area / 30);
    
    // spit out dots every 25ms
    var currentPos = relativePos(event, cx.canvas);
    var spray = setInterval(function() {
        for (var i = 0; i < dotsPerTick; i++){
            var offset = randomPointInRadius(radius);
            cx.fillRect(currentPos.x + offset.x,
                        currentPos.y + offset.y, 1, 1);
        }
    }, 25);
    trackDrag(function(event){
        currentPos = relativePos(event, cx.canvas);
    }, function() {
        clearInterval(spray);
    });
};

// Tool for drawing a rectangle
tools.Rectangle = function(event, cx) {
    // Create a rectangle add it to the body
    var rect = elt("div");
    rect.style["position"] = "absolute";
    rect.style["background-color"] = cx.fillStyle;
    document.body.appendChild(rect);
    
    var pos = relativePos(event, cx.canvas);
    var startX = event.pageX;
    var startY = event.pageY;
    var left,width,top,height;
    trackDrag(function(event){
      var curPos = relativePos(event, cx.canvas);

      // calculate the position and size of the div to display
      var toRight = (pos.x < curPos.x)
      left = (toRight) ? startX : curPos.x + startX - pos.x;
      width = (toRight) ? curPos.x - pos.x : pos.x - curPos.x;
      var below = (pos.y < curPos.y)
      top = (below) ? startY : curPos.y + startY - pos.y;
      height = (below) ? curPos.y - pos.y : pos.y - curPos.y;
      
      // account for drawing out of bounds
      var bounds = cx.canvas.getBoundingClientRect();
      if (bounds.left > left){
        width -= bounds.left - left;
        left = bounds.left;
      }
      if (bounds.right < left + width){
        width = bounds.right - left;
      }
      if (bounds.top > top){
        height -= bounds.top - top;
        top = bounds.top;
      }
      if (bounds.bottom < top + height){
        height = bounds.bottom - top;
      }
      
      // set the div's properties
      rect.style.left = left + "px";
      rect.style.width = width + "px";
      rect.style.top = top + "px";
      rect.style.height = height + "px";

    }, function() {
      // on mouseup, actually draw the rectangle to the canvas and remove the div
      cx.fillRect(left - (startX - pos.x) + 1, top - (startY - pos.y) + 1,
                  width, height);
      document.body.removeChild(rect);
    });
};

// Tool for picking a color
tools["Pick Color"] = function(event, cx) {
    try { // try to get image data from pixel at mouse pos
      var pos = relativePos(event, cx.canvas);
      var data = cx.getImageData(pos.x,pos.y,1,1).data;
      var color = "rgb("+data[0]+","+data[1]+","+data[2]+")";
      cx.fillStyle = cx.strokeStyle = color;
    } 
    catch (e){
      if (e instanceof SecurityError)
        alert("Can't save: " + e.toString());
      else
        throw e;
    }
};

// Tool for filling a space with a color (room for performance improvement)
tools["Flood fill"] = function(event, cx) {
    var pos = relativePos(event, cx.canvas);
    var width = cx.canvas.width;
    var height = cx.canvas.height;
    
    try { // try to get image data from pixel at mouse pos
      var data = cx.getImageData(0,0,width,height).data;
    }
    catch (e){
      if (e instanceof SecurityError)
        alert("Error: " + e.toString());
      else
        throw e;
    }
    // get the color to compare 
    var baseColor = getColor(data, width, pos.x, pos.y);
    
    // initialize the mulitdimensional array to store the pixels which have been drawn
    var drawn = [];
    for (var i = 0; i < width; i++)
      drawn[i] = [];
    
    // add the current position to the array of pixels to draw
    var toDraw = [pos];
    while (toDraw.length){ // while there are pixels to draw, run the function
      drawDot(cx, toDraw[toDraw.length-1], data, drawn, toDraw, baseColor);
    }
    
    delete toDraw, drawn, data, pos; //just in case
};

// draws one pixel and checks the four neighbors and adds to the list
// of pixels to draw if they are of the same color
function drawDot(cx, pos, data, drawn, toDraw, color){
    var x = pos.x;
    var y = pos.y;
    var width = cx.canvas.width;
    var height = cx.canvas.height;
    
    // draw the pixel, flag as having been drawn, and remove from the list
    cx.fillRect(x, y, 1, 1);
    drawn[x][y] = true;
    toDraw.pop();
  
    // check the neighbor pixels and add them to the list if the same color
  	//up
    if(!drawn[x][y-1] && (y !== 0)){
      if (color === getColor(data,width,x,y-1))
        toDraw.push({x: x, y: y-1});
    }
    //right
    if(drawn[x+1] && !drawn[x+1][y] && (x < width -1)){
      if (color === getColor(data,width,x+1,y)) 
        toDraw.push({x: x+1, y: y});
    }
    //down
    if(!drawn[x][y+1] && (y < height -1)){
      if (color === getColor(data,width,x,y+1)) 
        toDraw.push({x: x, y: y+1});
    }
    //left
    if(drawn[x-1] && !drawn[x-1][y] && (x !== 0)){
      if (color === getColor(data,width,x-1,y)) 
        toDraw.push({x: x-1, y: y});
    }
};
  
// get the color from the image's data array 
function getColor(data, width, x, y){
    var off = (y * width + x)*4;
    return color = "" + data[off] + data[off+1] + data[off+2];
};

// helper function to find a random position under the brush
function randomPointInRadius(radius){
    for(;;) {
        var x = Math.random() * 2 - 1;
        var y = Math.random() * 2 - 1;
        if (x * x + y * y <=1)
            return {x: x * radius, y: y * radius};
    }
}

// helper function which tries to load an image file from a URL 
function loadImageURL(cx, url) {
    var image = document.createElement("img");
    image.addEventListener("load", function(){
        var color = cx.fillStyle, size = cx.lineWidth;
        cx.canvas.width = image.width;
        cx.canvas.height = image.height;
        cx.drawImage(image, 0, 0);
        cx.strokeStyle = color;
        cx.lineWidth = size;
    });
    image.src = url;
};

// helper function to get the position of the mouse in the canvas
function relativePos(event, element){
    var rect = element.getBoundingClientRect();
    return {x: Math.floor(event.clientX - rect.left),
            y: Math.floor(event.clientY - rect.top)};
};

// takes care of event registration and unregistration for drawing
// tools needing to listen for "mousemove"
function trackDrag(onMove, onEnd){
    // onMove - function to call for each "mousemove" event
    // onEnd - function to call when the mouse button is released
    function end(event){
        removeEventListener("mousemove", onMove);
        removeEventListener("mouseup", end);
        if (onEnd)
            onEnd(event);
    }
    addEventListener("mousemove", onMove);
    addEventListener("mouseup", end);
};

// helper function to easily create elements
function elt(name, attributes) {
    var node = document.createElement(name);
    // assign any specified attributes
    if (attributes) {
        for (var attr in attributes)
            if (attributes.hasOwnProperty(attr))
                node.setAttribute(attr, attributes[attr]);
    }
    // extra args are appended to the node 
    for (var i = 2; i < arguments.length; i++){
        var child = arguments[i];
        if (typeof child == "string")
            child = document.createTextNode(child);
        node.appendChild(child);
    }
    return node;
};

createPaint(document.body);
