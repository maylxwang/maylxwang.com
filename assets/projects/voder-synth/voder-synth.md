*Made as a final project for MUSIC 6312 but primarily for personal interest*
This project ended up being the implementation of a bunch of different ideas I got introduced to in [this grad level music class](https://classes.cornell.edu/browse/roster/FA24/class/MUSIC/6312), specifically Bell Telephone's Voder Synth, design of the Yamaha DX7, and 80s British rave culture. Also, I would consider this a sequel to [sykle](), as it's a pretty good demonstration of how my skills have developed. 
Features include:
- IPA based analog formant synthesis using data from multiple papers but also analyzing my own speech with an FFT script
- Built off of a Teensy 4.1 + audio shield, therefore device has both 3.5mm + speaker output 
- Really intricate multimaterial faceplate made with Bambu's Galaxy PLA (this whole project is dedicated to @eeveelilith, thanks for inspiring me to make art)
- 5 effect modulators (from left to right: bandpass width, harmonics, voice gender, bitcrush, reverb)
- An abomination of a handwired LED multiplexer
- FRAM cartridge based save system that stores a serialized version of all track data 
- Clear acrylic backpanel + TPU feet
- Battery management system
As much as I liked making this synth, I am getting a bit tired of shoving a bunch of I2C modules in a box and calling it a project. By far the largest takeaway from this is that I should become much more comfortable my own custom PCBs, ~~although~~ *especially because* it takes more planning. Also it prevents me from needing to do so much UX design, and I can focus on doing cooler analog sound stuff instead.
A very crude presentation on the device can be found here.