/**
* Created with mcmillenb.
* User: mcmillenb
* Date: 2015-04-21
* Time: 01:04 AM
*/

/* constants */
var SCALE = 20;
var MAXSTEP = 0.05;

// returns an object that tracks the current position of given keys.
//   codes - key codes as property names and key names as values
function trackKeys(codes) {
    var pressed = Object.create(null); 
    function handler(event) {
        // if one of the keys in arrowCodes
        if (codes.hasOwnProperty(event.keyCode)) {
            // bool for whether key is down or not
            var down = event.type == "keydown";
            // set property corresponding to key
            pressed[codes[event.keyCode]] = down;
            event.preventDefault();
        }
    }
    // listen for a key down or up
    addEventListener("keydown", handler);
    addEventListener("keyup", handler);
    return pressed;
}

// calls a given "frameFunc" function to draw a new frame
// until the function returns false
function runAnimation(frameFunc) {
    var lastTime = null;
    function frame(time) {
        var stop = false;
        if (lastTime != null) {
            // set a max step of 100 milliseconds
            var timeStep = Math.min(time - lastTime, 100) / 1000;
            stop = frameFunc(timeStep) === false;
        }
        lastTime = time;
        if (!stop)
            requestAnimationFrame(frame); // keeps going unless the frameFunc returns false
    }
    requestAnimationFrame(frame); // initial call
}

// codes for the arrow keys that need listeners
var keyCodes = {27: "esc", 37: "left", 38: "up", 39: "right"};
var keys = trackKeys(keyCodes);

// takes a level object, a constructor for a display,
// and, optionally, a function. Displays the level and 
// lets the user play through it. 
function runLevel(level, Display, andThen) {
    var display = new Display(document.body, level);
    
    runAnimation(function(step) {
        if (keys.esc)
            return false;
        level.animate(step, keys);
        display.drawFrame(step);
        // Clears the display, stops the animation, and, if an andThen function was
        // given, calls that function with the level's status
        if (level.isFinished()) {
            display.clear();
            if (andThen)
                andThen(level.status);
            return false;
        }
    });
}

// goes through the sequence of levels. 
function runGame(plans, Display) {
    function startLevel(n, lives) {
        var hud = document.getElementById("hud");
        hud.innerText = "Lives: " + lives;
        runLevel(new Level(plans[n]), Display, function(status) {
            if (status == "lost")
                if (lives == 1)
                    startLevel(0, 3); // restart game if the user dies three times
                else
                    startLevel(n, lives-1); // restart level
            else if (n < plans.length -1)
                startLevel(n + 1, lives); // start next level if there is one
            else
                console.log("You win!");
        });
    }
    startLevel(0, 3);
}

// creates a level given a level plan
// (assumes valid input)
function Level(plan) {
    // store the width and height from the plan
    this.width = plan[0].length;
    this.height = plan.length;
    this.grid = [];   // contains the static elements
    this.actors = []; // contains the dynamic elements
    
    for (var y = 0; y < this.height; y++){
        var line = plan[y], gridLine =[];
        for (var x = 0; x < this.width; x++){
            var ch = line[x], fieldType = null;
            var Actor = actorChars[ch];
            if (Actor) // if a dynamic element
                this.actors.push(new Actor(new Vector(x, y), ch));
            else if (ch == "x") // else wall or lava
                fieldType = "wall";
            else if (ch == "!")
                fieldType = "lava";
            gridLine.push(fieldType);
        }
        this.grid.push(gridLine);
    }
    
    this.player = this.actors.filter(function(actor){
        return actor.type == "player";
    })[0];
    this.status = this.finishDelay = null;
}

// used to keep the level running for a bit after the
// player has won or lost (in order to show animation)
Level.prototype.isFinished = function(){
    return this.status != null && this.finishDelay < 0;
}

// computes the set of grid squares that the body overlaps with
// by using Math.floor and Math.ceil on the body's coordinates.
Level.prototype.obstacleAt = function(pos, size) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);
    
    // if the body sticks out of the level return wall for the 
    // sides and top and lava for the bottom
    if (xStart < 0 || xEnd > this.width || yStart < 0)
        return "wall";
    if (yEnd > this.height)
        return "lava";
    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            var fieldType = this.grid[y][x];
            if (fieldType) return fieldType;
        }
    }
};

// scans the array of actors, looking for an actor that overlaps
// the one given as an argument
Level.prototype.actorAt = function(actor) {
    for (var i = 0; i < this.actors.length; i++) {
        var other = this.actors[i];
        if (other != actor &&
            actor.pos.x + actor.size.x > other.pos.x &&
            actor.pos.x < other.pos.x + other.size.x &&
            actor.pos.y + actor.size.y > other.pos.y &&
            actor.pos.y < other.pos.y + other.size.y)
                return other;
    }
};

// moves the actors
//   step - time in seconds
//   keys - contains info about the arrow keys the player has pressed
Level.prototype.animate = function(step, keys) {
    if (this.status != null) // if the player has won or lost
        this.finishDelay -= step;
    
    while (step > 0) {
        var thisStep = Math.min(step, MAXSTEP);
        this.actors.forEach(function(actor){
            actor.act(thisStep, this, keys);
        }, this);
        step -= thisStep;
    }
};

// handles the player colliding with elements in the
// environment
Level.prototype.playerTouched = function(type, actor) {
    if (type == "lava" && this.status == null) {
        this.status = "lost";
        this.finishDelay =1;
    } else if (type == "coin") {
        this.actors = this.actors.filter(function(other) {
            return other != actor;
        });
        if (!this.actors.some(function(actor) {
            return actor.type == "coin";
        })) {
            this.status = "won";
            this.finishDelay = 1;
        }
    }
};

// represents a location
function Vector(x, y) {
    this.x = x; this.y = y;
}
Vector.prototype.plus = function(other){
    return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor) {
    return new Vector(this.x * factor, this.y * factor);
};

var actorChars = {
    "@": Player,
    "o": Coin,
    "=": Lava, "|": Lava, "v": Lava
};

function Player(pos) {
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

// constants related to player motion
var PLAYERXSPEED = 7;
var GRAVITY = 30;
var JUMPSPEED = 17;

// The horizontal motion of the player 
Player.prototype.moveX = function(step, level, keys) {
    this.speed.x = 0; 
    // Checks the state of the left / right keys
    if (keys.left) this.speed.x -= PLAYERXSPEED;
    if (keys.right) this.speed.x += PLAYERXSPEED;
    
    // sets the new position
    var motion = new Vector(this.speed.x * step, 0);
    var newPos = this.pos.plus(motion);
    
    // if the player hits something, run the playerTouched method
    var obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle)
        level.playerTouched(obstacle);
    else
        this.pos = newPos;
};

// The vertical motion of the player
Player.prototype.moveY = function(step, level, keys) {
    // start with acceleration from gravity
    this.speed.y += step * GRAVITY; 
    
    // sets the new position
    var motion = new Vector(0, this.speed.y * step);
    var newPos = this.pos.plus(motion);
    
    // if the player hits something... 
    var obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle){
        level.playerTouched(obstacle);
        if (keys.up && this.speed.y > 0) // if jumping
            this.speed.y -= JUMPSPEED;
        else 
            this.speed.y = 0; // else stop going down
    } else {
        this.pos = newPos;
    }
};

// moves the player and checks for interaction with other actors
Player.prototype.act = function(step, level, keys) {
    // run both move methods
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);
    
    // interact with other actors
    var otherActor = level.actorAt(this);
    if (otherActor)
        level.playerTouched(otherActor.type, otherActor);
    
    // Losing animation
    if (level.status == "lost") {
        this.pos.y += step;
        this.size.y -= step;
    }
};

function Lava(pos, ch) {
    this.pos = pos;
    this.size = new Vector(1, 1);
    if (ch == "="){
        this.speed = new Vector(2, 0);
    } else if (ch == "|"){
        this.speed = new Vector(0, 2);
    } else if (ch == "v") {
        this.speed = new Vector(0, 3);
        this.repeatPos = pos;
    }
}
Lava.prototype.type = "lava";

// computes a new position for a lava object by adding
// the procuct of the time step and its current speed
// to its old position
Lava.prototype.act = function(step, level) {
    var newPos = this.pos.plus(this.speed.times(step));
    if (!level.obstacleAt(newPos, this.size)) // standard lava
        this.pos = newPos;
    else if (this.repeatPos) // dripping lava
        this.pos = this.repeatPos;
    else                     // bouncing lava
        this.speed = this.speed.times(-1);
};

function Coin(pos){
    this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.wobble = Math.random() * Math.PI * 2;
}
Coin.prototype.type = "coin";

var WOBBLESPEED = 8, WOBBLEDIST = 0.07;

// wobbles the coin object. 
// ignores collisions since that is handled in the 
// player's act method
Coin.prototype.act = function(step) {
    this.wobble += step * WOBBLESPEED;
    var wobblePos = Math.sin(this.wobble) * WOBBLEDIST;
    this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

// utility function for creating an element and 
// giving it a class
function elt(name, className){
    var elt = document.createElement(name);
    if (className) elt.className = className;
    return elt;
}

function DOMDisplay(parent, level) {
    this.wrap = parent.appendChild(elt("div", "game"));
    this.level = level;
    
    this.wrap.appendChild(this.drawBackground());
    this.actorLayer = null;
    this.drawFrame();
}

// draws the background as a table element, appending
// row elements for each row in the level, and appending
// cell elements for each type of block
DOMDisplay.prototype.drawBackground = function() {
    var table = elt("table", "background");
    table.style.width = this.level.width * SCALE + "px";
    this.level.grid.forEach(function(row) {
        var rowElt = table.appendChild(elt("tr"));
        rowElt.style.height = SCALE + "px";
        row.forEach(function(type) {
            rowElt.appendChild(elt("td", type));
        });
    });
    return table;
};

// draw each actor by creating a DOM element for it and setting
// that element's position and size based on the actor's properties
DOMDisplay.prototype.drawActors = function() {
    var wrap = elt("div");
    this.level.actors.forEach(function(actor) {
        var rect = wrap.appendChild(elt("div",
                                        "actor " + actor.type));
        rect.style.width = actor.size.x * SCALE + "px";
        rect.style.height = actor.size.y * SCALE + "px";
        rect.style.left = actor.pos.x * SCALE + "px";
        rect.style.top = actor.pos.y * SCALE + "px";
    });
    return wrap;
};

// first removes the old actor graphics, if any, and then redraws
// them in their new positions. 
DOMDisplay.prototype.drawFrame = function() {
    if (this.actorLayer)
        this.wrap.removeChild(this.actorLayer);
    this.actorLayer = this.wrap.appendChild(this.drawActors());
    // by adding the level's current status as a class name to the wrapper,
    // we can style the player actor slightly differently when the game is won
    // or lost by adding a CSS rule that takes effect only when the player has 
    // an ancestor element with a given class.
    this.wrap.className = "game " + (this.level.status || "");
    this.scrollPlayerIntoView(); // cant assume the level fits in the viewport
};

// Ensures that if the level is protruding outside the viewport,
// we scroll that viewport to make sure the player is near its center.
DOMDisplay.prototype.scrollPlayerIntoView = function() {
    var width = this.wrap.clientWidth;
    var height = this.wrap.clientHeight;
    var margin = width / 3;

    // The viewport
    var left = this.wrap.scrollLeft, right = left + width;
    var top = this.wrap.scrollTop, bottom = top + height;

    var player = this.level.player;
    var center = player.pos.plus(player.size.times(0.5))
                    .times(SCALE);

    // Verify that the player position insn't outside of the 
    // allowed range.
    if (center.x < left + margin)
        this.wrap.scrollLeft = center.x - margin;
    else if (center.x > right - margin)
        this.wrap.scrollLeft = center.x + margin - width;
    if (center.y < top + margin)
        this.wrap.scrollTop = center.y - margin;
    else if (center.y > bottom - margin)
        this.wrap.scrollTop = center.y + margin - height;
};

// clears a displayed level
DOMDisplay.prototype.clear = function() {
    this.wrap.parentNode.removeChild(this.wrap);
};

var levelPlans = [
[// level 1
  "                      ",
  "                      ",
  "  x              = x  ",
  "  x         o o    x  ",
  "  x @      xxxxx   x  ",
  "  xxxxx            x  ",
  "      x!!!!!!!!!!!!x  ",
  "      xxxxxxxxxxxxxx  ",
  "                      "
],
[// level 2
"                                                                                ",
"                                                                                ",
"                                                                                ",
"                                                                                ",
"                                                                                ",
"                                                                                ",
"                                                                  xxx           ",
"                                                   xx      xx    xx!xx          ",
"                                    o o      xx                  x!!!x          ",
"                                                                 xx!xx          ",
"                                   xxxxx                          xvx           ",
"                                                                            xx  ",
"  xx                                      o o                                x  ",
"  x                     o                                                    x  ",
"  x                                      xxxxx                             o x  ",
"  x          xxxx       o                                                    x  ",
"  x  @       x  x                                                xxxxx       x  ",
"  xxxxxxxxxxxx  xxxxxxxxxxxxxxx   xxxxxxxxxxxxxxxxxxxx     xxxxxxx   xxxxxxxxx  ",
"                              x   x                  x     x                    ",
"                              x!!!x                  x!!!!!x                    ",
"                              x!!!x                  x!!!!!x                    ",
"                              xxxxx                  xxxxxxx                    ",
"                                                                                ",
"                                                                                "
],
[// level 3
"                                      x!!x                        xxxxxxx                                    x!x  ",
"                                      x!!x                     xxxx     xxxx                                 x!x  ",
"                                      x!!xxxxxxxxxx           xx           xx                                x!x  ",
"                                      xx!!!!!!!!!!xx         xx             xx                               x!x  ",
"                                       xxxxxxxxxx!!x         x                                    o   o   o  x!x  ",
"                                                xx!x         x     o   o                                    xx!x  ",
"                                                 x!x         x                                xxxxxxxxxxxxxxx!!x  ",
"                                                 xvx         x     x   x                        !!!!!!!!!!!!!!xx  ",
"                                                             xx  |   |   |  xx            xxxxxxxxxxxxxxxxxxxxx   ",
"                                                              xx!!!!!!!!!!!xx            v                        ",
"                                                               xxxx!!!!!xxxx                                      ",
"                                               x     x            xxxxxxx        xxx         xxx                  ",
"                                               x     x                           x x         x x                  ",
"                                               x     x                             x         x                    ",
"                                               x     x                             xx        x                    ",
"                                               xx    x                             x         x                    ",
"                                               x     x      o  o     x   x         x         x                    ",
"               xxxxxxx        xxx   xxx        x     x               x   x         x         x                    ",
"              xx     xx         x   x          x     x     xxxxxx    x   x   xxxxxxxxx       x                    ",
"             xx       xx        x o x          x    xx               x   x   x               x                    ",
"     @       x         x        x   x          x     x               x   x   x               x                    ",
"    xxx      x         x        x   x          x     x               x   xxxxx   xxxxxx      x                    ",
"    x x      x         x       xx o xx         x     x               x     o     x x         x                    ",
"!!!!x x!!!!!!x         x!!!!!!xx     xx!!!!!!!!xx    x!!!!!!!!!!     x     =     x x         x                    ",
"!!!!x x!!!!!!x         x!!!!!xx       xxxxxxxxxx     x!!!!!!!xx!     xxxxxxxxxxxxx xx  o o  xx                    ",
"!!!!x x!!!!!!x         x!!!!!x    o                 xx!!!!!!xx !                    xx     xx                     ",
"!!!!x x!!!!!!x         x!!!!!x                     xx!!!!!!xx  !                     xxxxxxx                      ",
"!!!!x x!!!!!!x         x!!!!!xx       xxxxxxxxxxxxxx!!!!!!xx   !                                                  ",
"!!!!x x!!!!!!x         x!!!!!!xxxxxxxxx!!!!!!!!!!!!!!!!!!xx    !                                                  ",
"!!!!x x!!!!!!x         x!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!xx     !                                                  "
],
[// level 4
"                                                                                                              ",
"                                                                                                              ",
"                                                                                                              ",
"                                                                                                              ",
"                                                                                                              ",
"                                        o                                                                     ",
"                                                                                                              ",
"                                        x                                                                     ",
"                                        x                                                                     ",
"                                        x                                                                     ",
"                                        x                                                                     ",
"                                       xxx                                                                    ",
"                                       x x                 !!!        !!!  xxx                                ",
"                                       x x                 !x!        !x!                                     ",
"                                     xxx xxx                x          x                                      ",
"                                      x   x                 x   oooo   x       xxx                            ",
"                                      x   x                 x          x      x!!!x                           ",
"                                      x   x                 xxxxxxxxxxxx       xxx                            ",
"                                     xx   xx      x   x      x                                                ",
"                                      x   xxxxxxxxx   xxxxxxxx              x x                               ",
"                                      x   x           x                    x!!!x                              ",
"                                      x   x           x                     xxx                               ",
"                                     xx   xx          x                                                       ",
"                                      x   x= = = =    x            xxx                                        ",
"                                      x   x           x           x!!!x                                       ",
"                                      x   x    = = = =x     o      xxx       xxx                              ",
"                                     xx   xx          x                     x!!!x                             ",
"                              o   o   x   x           x     x                xxv        xxx                   ",
"                                      x   x           x              x                 x!!!x                  ",
"                             xxx xxx xxx xxx     o o  x!!!!!!!!!!!!!!x                   vx                   ",
"                             x xxx x x xxx x          x!!!!!!!!!!!!!!x                                        ",
"                             x             x   xxxxxxxxxxxxxxxxxxxxxxx                                        ",
"                             xx           xx                                         xxx                      ",
"  xxx                         x     x     x                                         x!!!x                xxx  ",
"  x x                         x    xxx    x                                          xxx                 x x  ",
"  x                           x    xxx    xxxxxxx                        xxxxx                             x  ",
"  x                           x           x                              x   x                             x  ",
"  x                           xx          x                              x x x                             x  ",
"  x                                       x       |xxxx|    |xxxx|     xxx xxx                             x  ",
"  x                xxx             o o    x                              x         xxx                     x  ",
"  x               xxxxx       xx          x                             xxx       x!!!x          x         x  ",
"  x               oxxxo       x    xxx    x                             x x        xxx          xxx        x  ",
"  x                xxx        xxxxxxxxxxxxx  x oo x    x oo x    x oo  xx xx                    xxx        x  ",
"  x      @          x         x           x!!x    x!!!!x    x!!!!x    xx   xx                    x         x  ",
"  xxxxxxxxxxxxxxxxxxxxxxxxxxxxx           xxxxxxxxxxxxxxxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ",
"                                                                                                              ",
"                                                                                                              "
],
[// level 5
"                                                                                                  xxx x       ",
"                                                                                                      x       ",
"                                                                                                  xxxxx       ",
"                                                                                                  x           ",
"                                                                                                  x xxx       ",
"                          o                                                                       x x x       ",
"                                                                                             o o oxxx x       ",
"                   xxx                                                                                x       ",
"       !  o  !                                                xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx       ",
"       x     x                                                x   x x   x x   x x   x x   x x   x x           ",
"       x= o  x            x                                   xxx x xxx x xxx x xxx x xxx x xxx x xxxxx       ",
"       x     x                                                  x x   x x   x x   x x   x x   x x     x       ",
"       !  o  !            o                                  xxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxxxx       ",
"                                                                                                              ",
"          o              xxx                              xx                                                  ",
"                                                                                                              ",
"                                                                                                              ",
"                                                      xx                                                      ",
"                   xxx         xxx                                                                            ",
"                                                                                                              ",
"                          o                                                     x      x                      ",
"                                                          xx     xx                                           ",
"             xxx         xxx         xxx                                 x                  x                 ",
"                                                                                                              ",
"                                                                 ||                                           ",
"  xxxxxxxxxxx                                                                                                 ",
"  x         x o xxxxxxxxx o xxxxxxxxx o xx                                                x                   ",
"  x         x   x       x   x       x   x                 ||                  x     x                         ",
"  x  @      xxxxx   o   xxxxx   o   xxxxx                                                                     ",
"  xxxxxxx                                     xxxxx       xx     xx     xxx                                   ",
"        x=                  =                =x   x                     xxx                                   ",
"        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   x!!!!!!!!!!!!!!!!!!!!!xxx!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
"                                                  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"                                                                                                              "
]];

var plans = [];
levelPlans.forEach(function(level){ plans.push(level); });

runGame(plans, DOMDisplay);