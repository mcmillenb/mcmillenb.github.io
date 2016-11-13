/**
 * @author Brian McMillen (brianmcmillen1@gmail.com)
 * @since 2016.11.03 file created
 */

/**
 * Sound containing one webAudio gain node connected to an oscillator
 */
class Sound
{
    /**
     * Initialize the oscilator and gain node for the sound object. Set the type
     * of oscillator and the frequency (if provided).
     * @param  {string} type The type of oscillator
     * @param  {int}    freq The frequency of the pitch
     * @return {void}
     */
    constructor(type, freq) {
        var oscillator = audioCtx.createOscillator();
        var gainNode   = audioCtx.createGain();

        gainNode.gain.value = 0.0;

        oscillator.connect(gainNode);
        oscillator.type = type || 'sine';
        oscillator.frequency.value = freq || 500;
        oscillator.start();

        this.osc      = oscillator;
        this.gainNode = gainNode;
        this.type     = oscillator.type;
    }

    /**
     * Get the pitch of the sound (in frequency)
     * @return {float} The frequency of the sound's pitch
     */
    get pitch() {
        return this.osc.frequency.value;
    }

    /**
     * Set the pitch of the sound to the provided frequency
     * @param  {int} freq The frequency to change to pitch to
     * @return {void}
     */
    set pitch(freq) {
        if (freq) {
            this.osc.frequency.value = Math.round(freq);
        }
    }

    /**
     * Get the volume of the sound
     * @return {float} The volume level (between 0.0 and 1.0)
     */
    get volume() {
        return this.gainNode.gain.value;
    }

    /**
     * Set the volume of the sound to the provided level
     * @param  {float} level The volume level to change the gain to (between
     *                       0.0 and 1.0)
     * @return {void}
     */
    set volume(level) {
        this.gainNode.gain.value = Math.min(1.0, Math.max(0.0, level));
    }

    /**
     * Play the sound by connecting the gain node to the output
     * @return {Sound} This sound
     */
    play() {
        this.gainNode.connect(audioCtx.destination);

        return this;
    }

    /**
     * Pause the sound by disconnecting the gain node from the output after
     * lowering the gain
     * @return {Sound} This sound
     */
    pause() {
        var node = this.gainNode;
        node.gain.setTargetAtTime(0, audioCtx.currentTime, 0.015);

        window.setTimeout(() => node.disconnect(audioCtx.destination), 100);

        return this;
    }
}
