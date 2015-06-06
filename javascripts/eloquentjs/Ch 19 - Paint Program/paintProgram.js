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
        cx.fillStyle = input.value;
        cx.strokeStyle = input.value;
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
