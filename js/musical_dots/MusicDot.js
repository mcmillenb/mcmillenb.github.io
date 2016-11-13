/**
 * @author Brian McMillen (brianmcmillen1@gmail.com)
 * @since 2016.11.04 file created
 */

/**
 * Audio-visual 'dot' object possing a circle svg element and a related Sound
 * object, both of which can be manipulated via the mouse
 */
class MusicDot
{
    /**
     * Initialize the dot, given the info for the click event which prompted
     * the initialization, and the type of sound to associate with the dot
     * @param  {object} event Click event info
     * @param  {string} type  The type of sound to associate with the dot
     * @return {void}
     */
    constructor(event, type) {
        // Keep a reference to the dots x and y positions
        var pos   = this.posFromEvent(event);
        this.xPos = pos.x;
        this.yPos = pos.y;

        // Keep track of whether the dot is currently being dragged
        this.dragging = false;

        // Initialize the sound assoiciated with the dot
        this.sound = new Sound(type).play();
        this.updateSound(this.xPos, this.yPos);

        // Initialize the svg element and attach to the sandbox element
        this.dot = this.makeSVG('circle', { cx: 40, cy: 40, r: 0 });
        $sandbox.append(this.dot);

        this.addEventHandlers();
        this.setColor(this.sound.type);
        this.show();
    }

    /**
     * Calculate the x and y positions of the dot (relative to the sandbox),
     * given a mouse event
     * @param  {object} event Mouse event info
     * @return {object}       The x and y positions of the event
     */
    posFromEvent(event) {
        return {
            x: event.pageX - $sandbox.offset().left,
            y: event.pageY - $sandbox.offset().top
        };
    }

    /**
     * Set the color of the dot based on the type of sound provided
     * @param {string} type The type of sound to set the color for
     */
    setColor(type) {
        var color;
        switch (type) {
            case 'sine':
                color = '3498db';
                break;
            case 'square':
                color = '2ecc71';
                break;
            case 'sawtooth':
                color = 'f1c40f';
                break;
            case 'triangle':
                color = '9b59b6';
                break;
            default:
                color = '000';
        }

        $(this.dot).css({ fill: color });
    }

    /**
     * Generates and returns an svg element to given the tag name and the
     * attributes for the element.
     * (Taken from http://stackoverflow.com/questions/3642035)
     * @param  {string}  tag   Tag name for the type of svg shape to create
     * @param  {mixed[]} attrs Array of attributes to assign to the svg
     * @return {object}        The svg element
     */
    makeSVG(tag, attrs) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs) {
            el.setAttribute(k, attrs[k]);
        }
        return el;
    }

    /**
     * Set the event handlers for the dot element.
     */
    addEventHandlers() {
        var $dot  = $(this.dot);
        var sound = this.sound;

        // start tracking the mouse on mousedown
        $dot.on('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (e.shiftKey) { // If Shift + Click, remove the dot instead
                this.remove();
                return;
            }

            this.dragging = true;

            var dotFollow = this.dotFollow().start(e); // start following

            // stop tracking the mouse on mouseup
            $('body').one('mouseup', (e) => {
                this.dragging = false;
                dotFollow.stop();

                // reset references to x and y positions
                this.xPos += dotFollow.inputOffset.x;
                this.yPos += dotFollow.inputOffset.y;
            });
        });

        // update the pitch of the sound when dragging the mouse
        $dot.on('mousemove', (e) => {
            if (this.dragging) {
                var pos = this.posFromEvent(e);
                this.updateSound(pos.x, pos.y);
            }
        });
    }

    /**
     * Given x and y position values, set pitch and volume level
     * @param  {float} xPos The horizontal position to convert to a pitch value
     * @param  {float} yPos The vertical position to convert to a volume level
     * @return {void}
     */
    updateSound(xPos, yPos) {
        this.sound.pitch  = xPos + 300;
        this.sound.volume = (150 - yPos) / 1500.0;
    }

    /**
     * Generates a track animation assigned to the dot.
     * @return {object} The track motion animation
     */
    dotFollow() {
        return motion.track({
            values: { // the dot's x and y props track an input source
                x: { from: this.xPos - 40 },
                y: { from: this.yPos - 40 }
            },
        }).on(this.dot);
    }

    /**
     * Generates and starts an animation to reveal the dot element; The dot goes
     * from hidden to full size (30) in 1/4 seconds.
     * @return {void}
     */
    show() {
        motion.tween({
            duration: 250,
            values: {
                r: {
                    from: 0,
                    to: 30,
                    ease: motion.easing.backOut,
                },
                x: { from: this.xPos - 20, to: this.xPos - 40},
                y: { from: this.yPos - 20, to: this.yPos - 40},
            }
        }).on(this.dot).start();
    }

    /**
     * Generates and starts and animation to hide the dot element;
     * @return {void}
     */
    hide() {
        motion.tween({
            duration: 250,
            values: {
                r: {
                    from: 30,
                    to: 0,
                    ease: motion.easing.backIn,
                },
                x: { from: this.xPos - 40, to: this.xPos - 20},
                y: { from: this.yPos - 40, to: this.yPos - 20},
            }
        }).on(this.dot).start();
    }

    /**
     * Remove the dot, stoping the sound and hiding (then removing) the element
     * @return {void}
     */
    remove() {
        // stop the sound
        this.sound.pause();

        this.hide();

        // remove the element (but wait for the animation to finish)
        window.setTimeout(() => this.dot.remove(), 250);
    }
}
