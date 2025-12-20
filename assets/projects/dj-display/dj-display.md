Home DJs have always relied on visuals to make their sets more engaging, whether that's through projectors displaying reactive animations or simple LED fairy lights strung around the room. I wanted to add another dimension to my own DJ setup with a LED matrix display that could show track information, act as an audio visualizer, or do a combination of both. The idea was to build something that could pair wirelessly with my laptop running VirtualDJ, receiving both track metadata and FFT data to drive the display in real time.

The technical core of this project centers around a RP2040W microcontroller driving a 32×32 RGB LED matrix using the HUB75 interface protocol. The system connects to my home WiFi network and receives UDP packets from my laptop containing track names, artist information, 6-band FFT data, and spectral flux values. All of this data gets rendered on the matrix at around 60 frames per second using a PIO-accelerated display driver, with scrolling text for track info and a colorful frequency spectrum visualizer at the bottom. I also integrated a NeoKey 1x4 button board for scene switching and added a WS2811 LED fairy light chain that reacts to the music's spectral flux, creating ambient sparkle effects. The whole thing runs on dual cores, with Core 0 handling the display and network logic while Core 1 drives the WS2811 chain independently.

## Hardware Design and Testing

### *LED Matrix Display*

The heart of the visual system is a Waveshare 32×32 RGB LED Matrix with a 5mm pitch. This thing uses the HUB75 interface, which is essentially a shift register-based protocol where you clock in pixel data for an entire row, then latch it and enable the display briefly. The matrix has two sets of RGB pins because it actually drives the top and bottom halves simultaneously using row addressing pins A, B, C, and D to select which of the 16 row pairs is being lit up. So when you address row 0, you're actually updating both physical row 0 and row 16 at the same time.

The control signals are pretty straightforward once you wrap your head around them. CLK is your shift register clock, LAT latches the data into the display drivers, and OE (output enable) turns the LEDs on or off. The tricky part is the timing because if you're not careful about how long you leave things enabled or how fast you're clocking data, you get ghosting or flickering or just weird color artifacts.

I initially looked at using existing libraries like Adafruit's Protomatter, but that's primarily written for SAMD chips and uses their DMA capabilities in ways that don't translate cleanly to the RP2040. Given that we'd already done VGA output in class using precise timing control, I figured I could implement a custom driver using either GPIO bit-banging or PIO state machines. The power requirements are significant too, this thing can draw up to 4A at 5V when running at full brightness, so I used a dedicated 5V 4A power adapter and made sure not to crank it to full blast during demos to avoid giving anyone an epilepsy attack.

### *RP2040W Microcontroller*

I chose the RP2040W specifically because it has built-in WiFi via the CYW43 chip, which meant I could do wireless data transmission without needing an external ESP module or anything. The dual-core architecture was perfect for this project because I could dedicate Core 0 to the main display logic, UDP packet reception, and button handling, while Core 1 runs the WS2811 LED chain controller completely independently. This way the sparkle animation stays smooth even if the main core gets bogged down parsing network packets.

The pin assignments ended up being pretty packed. The HUB75 interface takes up 13 GPIO pins total (6 for RGB data, 4 for row addressing, and 3 for control signals). I used I2C1 on GP26 and GP27 for the NeoKey button interface, and one of the PIO state machines drives the WS2811 chain on its own pin. The nice thing about PIO is that you can pick almost any GPIO pin for it, so I didn't have to worry too much about conflicts there.

### *NeoKey 1x4 QT I2C*

For interactive control, I added an Adafruit NeoKey 1x4, which is a board with four mechanical keyboard switches and integrated NeoPixels. It communicates over I2C using a Seesaw chip that handles debouncing and maintains an event FIFO for button presses. The Seesaw register map was a bit convoluted to work with, requiring specific initialization sequences and register pairs for configuration. Button 0 toggles the track name color, Button 1 switches the artist name color, Button 2 changes the visualizer type, and Button 3 turns the display on and off. The NeoPixels light up to show which modes are active, providing nice visual feedback.

### *WS2811 LED Fairy Lights Chain*

As an extra visual element, I integrated a chain of WS2811 fairy lights that use a PIO state machine to generate the precise 800kHz timing required for the single-wire protocol. Since the WS2811 needs 5V logic levels and the RP2040 outputs 3.3V, I used a simple MOSFET as a level shifter to convert the signal properly.

### *3D Printed Frame*

The mechanical design consists of a front panel and a back panel. The front panel has a single layer of PLA at 0.2mm thickness that acts as a light diffuser for the LED matrix, which I got the idea for from this YouTube video on LED dashboards (https://www.youtube.com/watch?v=A5A6ET64Oz8). The thin PLA does a surprisingly good job of softening the individual pixels and making the display look more cohesive.

The back panel has cutouts for the NeoKey buttons, a 2.1mm barrel jack for power, and a JST connector for the WS2811 light chain. Everything is held together with a final laser-cut acrylic panel that mounts to the back using countersink screws and heatset inserts. I printed everything on the H2D printer in the maker space, and as usual I probably spent too much time optimizing wall thicknesses and trying to minimize material usage while keeping things structurally sound.

### *Power Distribution and Safety*

I use a 5V supply for both the display and the microcontroller, which keeps things simple. However, I learned an expensive lesson early on when I was setting up for a DJ set and accidentally plugged my speakers' 18V power supply into the original 64×32 display I had bought. The speakers use the same barrel connector and I was being careless, which instantly fried the display. This definitely taught me to use more "perfect fit" connectors that can't just destroy your hardware if you grab the wrong wall wart. I ended up downgrading to this 32×32 display partly because of budget constraints after that incident, but it actually worked out well since the smaller resolution made the layout design more focused.

## Software Design and Testing

### *Display Driver Implementation*

The display driver was one of the meatier parts of the software stack. I started with a simple GPIO bit-banging version to understand the protocol, then moved to a PIO-accelerated implementation for better performance and higher color depth.

The initial GPIO driver uses a straightforward framebuffer approach with a 32×32×3 array storing RGB values for each pixel. The display refresh works by iterating through the 16 row addresses and for each row, clocking out 32 pixels worth of RGB data for both the top half (rows 0-15) and bottom half (rows 16-31) simultaneously. The big limitation of the GPIO approach was 1-bit color depth giving just 8 colors total, and the refresh rate topped out around 30 FPS with noticeable flicker.

After getting the GPIO driver working as a proof of concept, I moved to a PIO-accelerated implementation to improve both color depth and refresh rate. The PIO version uses state machines to handle the data shifting while the main CPU still controls the clock cycling and row addressing. This division of labor works well because the PIO can autonomously shift out the RGB data for an entire row while the CPU handles timing and sequencing. The state machine implementation is much simpler than a fully autonomous PIO driver would be, since I don't have to coordinate multiple state machines or implement complex timing logic in the 32-instruction limit.

The key advantage of the PIO approach is that it offloads the repetitive bit-shifting work from the CPU, which freed up enough cycles to implement Binary Code Modulation for 4-bit color depth. BCM works by displaying each bit plane of the color data for a duration proportional to its weight, so the most significant bit gets displayed for 8 time units, the next for 4, then 2, then 1. This gives me 16 levels per RGB channel for a total of 4096 possible colors, which is a huge improvement over the 8 colors from the GPIO driver.

Getting BCM working required careful timing management. I use interrupt flags to coordinate between the PIO state machine finishing a data transfer and the CPU updating the bit plane and display timing. The timing for each bit plane has to be precise or you get weird brightness artifacts where some colors don't look right. The whole refresh cycle runs at about 60 FPS now, which is smooth enough that there's no visible flicker at all.

### *Wireless Data Reception*

For getting data from my laptop to the display, I went with UDP over WiFi using the lwIP network stack. The RP2040W has a CYW43 WiFi chip that integrates with lwIP, and I used the polling mode where you call `cyw43_arch_poll()` in your main loop to service network events.

Getting lwIP up and running was honestly a struggle. The documentation is pretty sparse and most examples assume you're using FreeRTOS, which I wasn't. I spent way too much time debugging connection issues where the WiFi would connect but packets wouldn't arrive, or the whole thing would just hang. I tried using static IP assignment at one point to avoid DHCP issues, but that introduced its own problems with subnet masks and gateway configuration. In retrospect, I really should have displayed the IP address on the LED matrix during the pairing process instead of having to connect over USB serial to read it. That would have made setup at a DJ gig way smoother.

The Windows hotspot feature was also unreliable, sometimes it would just cut out mid-session for no apparent reason, forcing me to reconnect everything. I ended up using my phone's hotspot for the final demo since it was more stable.

The UDP receiver binds to port 4444 and waits for packets containing track metadata and FFT data. The packet format is a simple binary structure: first a byte for track name length, then the track name string, then artist name length and artist name, then 6 bytes of FFT band values (0-255 range), a spectral flux byte, and finally an XOR checksum of everything. The checksum was crucial because UDP doesn't guarantee delivery or ordering, and I was seeing occasional corrupted packets that would cause garbage to appear on the display. With the checksum I can just discard invalid packets and keep showing the last good data.

The UDP callback gets invoked whenever a packet arrives, and it copies the data into a temporary buffer, validates the checksum, and if everything looks good it updates a global DisplayData structure that the main loop reads from. There's a flag for new data availability so the main loop knows when to update the display content versus just redrawing the same frame.

### *Text Rendering System*

For displaying track and artist names, I needed a font that would be readable at the tiny 6-pixel height I had available for each text line. I found a font called Tiny5 (https://github.com/Gissio/font_Tiny5) which is designed specifically for low-resolution displays. The font comes in BDF format, which is this old bitmap font format that stores character bitmaps as hex data. I had to learn about the BDF specification and write a Python script to convert it into C arrays that the RP2040 could use. The conversion process extracts the bitmap data for each character and generates both the pixel data and width tables.

The Tiny5 font has a 5×6 pixel cell with variable width characters. Most characters are 3-4 pixels wide, with narrow ones like 'i' and 'l' being only 2 pixels and wide ones like 'm' and 'w' being 5 pixels. This variable width approach saves a lot of horizontal space compared to fixed-width fonts and makes the text way more readable on a 32-pixel wide display.

The font also has proper descender support for letters like 'g', 'j', 'p', 'q', and 'y'. Descenders are the parts of letters that go below the baseline, and to make everything align nicely I shifted non-descender characters up by one pixel so their baselines match. This was one of those little details that really improved the visual quality once I got it working right.

The scrolling implementation took a few iterations to get smooth. I started with character-based scrolling where the text would jump by one whole character width at a time, but that looked choppy. The final version uses pixel-based scrolling where I maintain a pixel offset into the string and increment it by one pixel every few frames. The scrolling logic includes a pause-scroll-pause behavior where the text sits still for about 60 frames (roughly 2 seconds at 30 FPS) at the start, then scrolls smoothly until it reaches the end, pauses again, then loops back to the beginning.

To make pixel-based scrolling work, I had to write a function that could calculate how many pixels wide a string would be given the variable character widths, and another function that could render a string starting at an arbitrary pixel offset. This latter function walks through the string character by character, keeping track of the current pixel position, and only draws characters that are at least partially visible in the viewport after accounting for the scroll offset. It was a bit fiddly to get all the edge cases right but once it worked it looked really smooth.

### *Audio Analysis Experimentation*

Before settling on the final visualizer design, I spent a fair amount of time experimenting with different audio features to figure out what would actually look good and respond well to music. I built an interactive Python tool (audio_analysis_interactive.py) that let me visualize different audio features in real-time at 60 FPS while music was playing. This tool had sliders to adjust parameters and radio buttons to switch between different visualization modes.

I experimented with a bunch of different features: basic FFT spectrum, RMS (root mean square) for overall loudness, spectral centroid (the "center of mass" of the spectrum, which correlates with brightness), spectral flux (how much the spectrum is changing), energy in different frequency bands, and even beat detection using onset detection algorithms. Each mode would update in real-time so I could see how responsive and visually interesting each feature was.

What I found was that straight FFT visualization with logarithmic frequency bands worked best for the main visualizer because it's intuitive and directly shows what frequencies are present in the music. Spectral flux ended up being perfect for the WS2811 sparkle effect because it spikes during transient events like drum hits, making the lights react to percussive elements. I tried using spectral centroid to modulate colors but it didn't correlate as well with what I wanted visually. RMS and energy bands were useful for understanding the overall dynamics but weren't as visually interesting as the FFT bars.

Having this experimentation tool was crucial because it let me iterate quickly on different ideas without having to reflash the RP2040 every time I wanted to try something new. By the time I settled on the final design, I had a really good understanding of what audio features would work well for this application.

### *FFT Visualizer*

The visualizer occupies the bottom section of the display and shows 6 vertical bars representing different frequency bands from bass to treble. The color scheme goes magenta (sub-bass), blue (bass), cyan (low-mid), green (mid), yellow (high-mid), and red (treble). This rainbow-ish progression makes it really easy to see which frequencies are active at a glance.

The FFT data comes from the PC side where I have a Python script that grabs audio, computes the FFT, and bins it down to 6 bands with logarithmic spacing to match how we perceive frequency ranges. Getting the FFT processing right was trickier than I expected. Initially I was seeing a constant strong signal in the lowest frequency bins even when there was no bass in the music playing. This turned out to be caused by DC offset in the audio signal. The FFT interprets any non-zero DC offset as a very strong 0 Hz component, which then bleeds into the lowest frequency bins.

To fix this, I had to remove the DC component by subtracting the mean of each audio block before running the FFT. This is a pretty standard pre-processing step but I didn't realize I needed it until I saw the visualizer bars behaving weird. After adding DC removal, the bass bars only light up when there's actual bass content, which is what I wanted.

The FFT computation itself uses numpy's rfft function which gives me the real-valued FFT of a real signal. I take the magnitude of each bin, then sum up the magnitudes for bins that fall within each of the 6 frequency ranges. The ranges are logarithmically spaced: 20-60Hz for sub-bass, 60-250Hz for bass, 250-500Hz for low-mid, 500-2000Hz for mid, 2000-6000Hz for high-mid, and 6000-20000Hz for treble. This distribution matches how we hear frequency ranges and gives good separation between different elements in typical electronic music.

Each band value gets normalized to 0-255 range and sent over UDP. On the RP2040 side I just linearly scale that to the available height for the visualizer area (about 10 pixels). The bars draw from bottom to top which feels natural for a frequency display.

The bar widths and spacing took some tuning to fit nicely in the 32-pixel width. I used 4 pixels wide for the first three bars and 3 pixels wide for the last three, with 1-pixel gaps in between. This gets me almost exactly to 32 pixels across. The bars update every frame based on the latest FFT data, so they're very responsive to the music.

### *NeoKey Button Interface*

Interfacing with the NeoKey required implementing the Seesaw I2C protocol, which was more involved than a typical I2C peripheral. Seesaw has this two-level register addressing where you specify a base address (like KEYPAD_BASE or NEOPIXEL_BASE) and then a function address within that module. Every read or write involves sending both address bytes followed by the data.

Initialization was a multi-step process: first do a software reset by writing to the STATUS/SWRST register, wait a bit, then verify the hardware ID is 0x55 to confirm you're talking to a Seesaw chip. After that you have to configure the keypad module by setting which GPIO pins generate events (pins 4-7 for the NeoKey 1x4) and enabling the interrupt system. Finally the NeoPixel module needs to know which pin the LED data line is on, what speed to use (800kHz for WS2812), and how many bytes the pixel buffer is.

Once initialized, reading button state is event-driven. The Seesaw maintains a FIFO of button events and you poll it to check for presses and releases. I map the four buttons to different display functions: Button 0 toggles the track name color between yellow and green, Button 1 switches the artist name between cyan and pink, Button 2 cycles through different visualizer types, and Button 3 turns the whole display on and off. The NeoPixels light up to show which modes are active, which is helpful both for the user and for debugging.

### *WS2811 Sparkle Effect*

The WS2811 LED chain runs on Core 1 in a completely separate loop from the main display code. I used one of the PIO state machines to generate the WS2811 protocol timing, which requires precise 1.25 microsecond bit times with different duty cycles for logical 0 and 1. The PIO code for this is pretty standard and I based it on existing examples, just compiling the .pio file and loading it into PIO0.

The sparkle effect itself maintains three arrays: one for the current RGB color of each LED, one for the brightness (0-255), and one for the "sparkle lifetime" counter. Each frame, existing sparkles decay by decrementing their lifetime and fading their brightness by 5%. When a sparkle's lifetime hits zero, it goes dark. New sparkles spawn randomly based on the current spectral flux value, which comes from the same UDP packets as the FFT data. Higher flux means more sparkles per frame.

When a new sparkle spawns, it picks a random color from a 10-color fiery palette ranging from near-black through dark reds and oranges up to golden yellow. The palette index selection is biased toward brighter colors when flux is high, so during really intense musical moments you get more bright yellow/orange sparkles and during quieter parts you get more dark red ones. Each sparkle also gets a random lifetime between 20 and 60 frames and random initial brightness between 150 and 255.

The whole effect runs at 60 FPS on Core 1, totally independent of whatever Core 0 is doing. I use a shared volatile variable to pass the spectral flux value between cores, which is simple and works fine since it's just a single byte and occasional stale reads don't matter for an aesthetic effect like this.

### *VirtualDJ Integration*

On the PC side, I wrote a Python script that interfaces with VirtualDJ and sends the UDP packets. VirtualDJ has an API that can export various information, and I'm using it to get the current track name and artist for whatever deck is playing. For the audio analysis, I capture the system audio output using PyAudio and run an FFT on chunks of samples in real time.

The FFT processing bins the frequency spectrum down to 6 logarithmically-spaced bands covering roughly 20Hz-20kHz. I experimented with different bin sizes and smoothing to get something that looks good visually while still being responsive to the music. Spectral flux is calculated by taking the sum of positive differences between the current FFT and the previous one, normalized to a 0-255 range. This tends to spike on percussive hits and during busy sections of music, which is exactly what I wanted for the sparkle effect.

The UDP packet gets sent every time there's a new FFT result or whenever the track changes, which works out to roughly 30-40 packets per second. This is way more than necessary for updating the display but the overhead is negligible and it ensures the display stays very responsive to the music.

## Debugging and Development Process

The development process was pretty iterative with a lot of back-and-forth between getting individual components working and integrating them together. I started with just the display driver, bit-banging the HUB75 protocol until I could draw some test patterns and make sure the timing was working. This took a while because I initially had issues with ghosting where pixels from one row would faintly appear on other rows. This turned out to be because I wasn't giving the row address lines enough time to settle before enabling the output, adding a small delay fixed it.

Working with cheap Chinese LED matrices had its own challenges. I was constantly worried about ESD damage since these displays don't have much protection circuitry. I tried to be careful about grounding myself before handling the board, but I definitely zapped it a few times accidentally. The quality control on these displays is also hit or miss, some pixels were dead right out of the box and there's not much you can do about it at this price point.

WiFi was another source of frustration. The CYW43 initialization is pretty opaque and when it fails you don't get much information about why. I spent a good chunk of time making sure the SSID and password were exactly right (no extra whitespace or wrong capitalization) and eventually got it connecting reliably. The lwIP polling mode worked fine for this application even though it's not the most efficient approach, it kept the code simpler than dealing with FreeRTOS.

The NeoKey interface was tedious to get working because the Seesaw documentation is kind of scattered across multiple Adafruit repos and there aren't many examples for the RP2040. I ended up reading through the Arduino library source code to figure out the exact register sequences needed for initialization and event reading. The key insight was that the button pins are numbered 4-7 on the Seesaw GPIO, not 0-3, which wasn't obvious from the NeoKey schematic I was looking at.

Scroll timing tuning was mostly just trial and error. I tried different scroll speeds and pause durations until I found something that felt good. Pausing for 60 frames at the start and end turned out to be about the right amount of time to read the full text before it starts scrolling, and scrolling one pixel every 10 frames (3 pixels per second at 30 FPS) is slow enough to read but fast enough that you don't get bored waiting.

The FFT band mapping took some experimentation too. I tried different numbers of bands (4, 6, 8, 16) and different frequency ranges, and settled on 6 bands because it fit nicely width-wise and gave good separation between bass, mids, and highs. The logarithmic spacing is important because frequency perception is logarithmic, so linearly spaced bands would have like 4 bands in the bass and 2 bands covering all the mids and highs.

Color palette selection for the WS2811 sparkles went through a few iterations. I initially tried a blue-to-white palette but it looked too cold for the vibe I wanted. The fiery sunset palette with reds, oranges, and yellows feels warmer and more energetic, which fits better with the kind of music I usually play. The brightness bias toward brighter colors during high flux moments was a late addition that really made the effect pop.

The PIO display driver took some iteration to get the timing right for Binary Code Modulation. The interrupt flag coordination between the PIO finishing data transfer and the CPU updating bit planes had to be precise, otherwise you'd get brightness artifacts. I also had to be careful about the exponentially decreasing display times for each bit plane to get smooth color gradients.

Testing methodology was pretty ad-hoc, mostly just plugging things in and seeing if they worked. For individual components I'd write little test programs, like a I2C scanner to make sure the NeoKey was visible on the bus, or a simple pattern generator to test the display driver before adding text rendering. Once I had multiple systems working I'd integrate them incrementally and deal with whatever broke. The nice thing about embedded development is you get very immediate feedback when something's wrong, the display either shows the right thing or it doesn't.

## Results

The final system achieves all the core goals I set out in the proposal and then some. The display updates at 60 FPS using the PIO-accelerated driver with 4-bit Binary Code Modulation, giving me 4096 colors and completely eliminating flicker. The scrolling is pixel-smooth and the pause-scroll-pause behavior makes it easy to read long track names. The 6-band visualizer responds instantly to the music and the color progression from bass to treble makes it really intuitive to see what frequencies are active.

WiFi connectivity is reliable once it's connected, and the UDP packet structure with checksumming means I don't see corrupted data on the display even with occasional dropped packets. There's essentially no perceivable latency from VirtualDJ outputting audio to the display updating, the visualizer feels immediate and synchronized with the music. The NeoKey buttons work great and being able to change text colors, switch visualizer modes, or turn the display off on the fly is surprisingly useful.

The WS2811 sparkle effect running on Core 1 stays smooth even when Core 0 is busy with network packets or display rendering, which validates the dual-core architecture. The fiery color palette and flux-reactive spawning rate makes the fairy lights feel really connected to the music. During intense drops or buildups the lights go crazy with bright yellow sparkles and during quieter sections they mostly sit dark with occasional dim red twinkles.

Performance-wise, the PIO display driver runs smoothly at 60 FPS and the dual-core split means neither core is particularly stressed. Core 0 handles the display refresh and network communication with plenty of headroom, and Core 1's WS2811 animation loop is lightweight. I never implemented detailed profiling but subjectively everything feels responsive and I didn't run into any timing issues or race conditions with the shared spectral flux variable.

The 3D printed frame came out great and holds the matrix at a nice viewing angle. It's sturdy enough to transport without worrying about breaking anything but light enough that the whole assembly isn't unwieldy.

In terms of proposal goals, I hit all the MVP targets and all the "Project Completion" goals. The MVP was matrix connects to PC wirelessly (exceeded expectations with UDP over WiFi), basic visualizer at 40+ FPS (achieved 60 FPS with PIO), and dual-core rendering (Core 0 for display, Core 1 for WS2811). For completion goals I got wireless transmission working, NeoKey logic for scene switching with multiple visualizer modes, and full PIO implementation with Binary Code Modulation. The additions section had a bunch of stretch goals that I didn't get to, like using an audio jack with the ADC to run standalone, or implementing more sophisticated audio features like spectral centroid. Those would have been cool but the core feature set is already pretty complete.

Some things worked better than expected. The variable-width font rendering with pixel-based scrolling looks way better than I thought it would at such low resolution. The Seesaw-based NeoKey interface, while annoying to set up initially, is actually really convenient because all the debouncing and event handling is done in hardware. The spectral flux sparkle effect on the WS2811 chain was a late addition that I almost cut for time but I'm really glad I included it because it adds a lot to the overall aesthetic.

Things that were harder than expected: the HUB75 protocol timing is finicky and getting rid of ghosting took more iteration than I anticipated. WiFi initialization and debugging network issues without good debug tools was frustrating. The PIO implementation proved more complex than I thought, especially coordinating multiple state machines and getting Binary Code Modulation working correctly. If I were to do this again I'd probably start with the PIO driver from the beginning rather than doing GPIO first, just to avoid having to debug two different implementations.

## AI Usage

I used a lot of AI throughout both the code and this final report, mainly using Claude. My philosophy was to focus on exploring as many ideas as possible and understanding the overall system design, while letting AI help with implementation details and boilerplate code. This let me iterate quickly on different approaches without getting bogged down in syntax or protocol minutiae.

For the code, I'd estimate maybe 70-80% was AI-assisted in some form. The display driver started with me describing what I wanted and Claude generating initial implementations that I then debugged and refined. The PIO programs, lwIP networking stack integration, Seesaw I2C protocol, and most of the Python PC-side code were heavily AI-generated. I'd typically describe what I wanted at a high level, get a first implementation from Claude, test it, then iterate with Claude on bugs and improvements.

The parts I wrote more manually were the high-level architecture decisions, the animation algorithms (like the sparkle effect logic), and the audio analysis experimentation tool. Even there though, I'd often use AI to help implement specific functions once I knew what I wanted.

For this report, I also used Claude extensively to help structure and write it. I provided the outline and key points I wanted to cover, and Claude helped flesh it out in a narrative form. This let me focus on making sure the technical content was accurate and complete rather than spending hours on prose.

Using AI this heavily was definitely a deliberate choice to maximize what I could explore and learn in the limited time I had. The tradeoff is that I probably understand some parts of the code less deeply than if I'd written everything by hand, but I got to build a much more complete and polished system than would have been possible otherwise.

## Conclusion

This project ended up being exactly the kind of open-ended systems integration challenge I was hoping for. Unlike the lab projects where the hardware and basic structure are mostly defined, I had to make a lot of design decisions about everything from the display driver architecture to the packet format to the animation algorithms. This freedom was both exciting and occasionally overwhelming, especially when deciding how to allocate time between getting core features working versus polishing nice-to-have additions.

The technical skills I developed are probably the most valuable outcome. I got really comfortable with PIO programming and understanding how to implement hardware protocols efficiently on the RP2040. The lwIP network stack and WiFi integration was completely new to me and gave me good exposure to how embedded networking works. I2C peripheral communication with the Seesaw chip deepened my understanding of I2C beyond the simple sensor interfaces we did in labs. Multi-core coordination was interesting because I had to think carefully about data sharing and synchronization even though this project's requirements were pretty simple. And the whole real-time embedded systems aspect, making sure everything hits frame rates and responds quickly to input, was a good lesson in performance optimization.

The challenges I overcame mostly revolved around working with hardware protocols that have strict timing requirements and limited documentation. The HUB75 interface is well-known but there's no formal spec, just various tutorials and forum posts with slightly different timing values. Getting WiFi working reliably required understanding multiple layers of the stack from CYW43 initialization through lwIP configuration to UDP socket programming. The NeoKey's Seesaw protocol is documented but scattered across multiple repos and mostly aimed at Arduino users, so translating that to RP2040 C code took some detective work.

Looking at future improvements, there are a bunch of directions I could take this. Adding an audio jack input with the RP2040's ADC would let the display run standalone without needing a PC connection, which would make it way more practical for live DJ sets. I could implement more sophisticated audio features like spectral centroid to change color schemes based on the "brightness" of the frequency spectrum, or loudness normalization to keep the visualizer bars from getting washed out during quiet sections. The VirtualDJ API has way more data available than just track name and artist, I could pull BPM, beat phase, loop points, all kinds of stuff that could drive more interesting visualizations.

I could add more scene modes that the NeoKey buttons switch between, like a pure visualizer mode with no text, or a mode that shows different track information like BPM or time remaining. The firework effect I mentioned in the proposal would be cool too, some kind of particle system that overlays on the current display.

The WS2811 chain could be expanded from just the one strand of fairy lights to multiple strands or even a second LED matrix. With the PIO state machine already handling the protocol, adding more LEDs is mostly just a memory and power budget question. I could also do more sophisticated animations that sync to beat detection or respond to specific frequency bands rather than just overall spectral flux.

For the enclosure, the current 3D printed frame is functional but pretty basic. A more finished design with cable management, button labels on the NeoKey, mounting points for the WS2811 controller, and maybe a diffuser for the LED matrix would make the whole thing look more polished. I'd also want to add a physical power switch and maybe some status LEDs to indicate WiFi connection state without needing to be connected to serial.

Reflecting on the project scope, I think I sized it perfectly. The MVP was achievable in a reasonable timeframe and gave me a working demo, the completion goals pushed me to add wireless and interactive features that really improved the usability, and I managed to hit all of them. The stretch goals were genuinely optional things that would have been cool but weren't necessary for a complete project. I'm really happy with the eventual scope and what I was able to accomplish.

Comparing this to the lab projects, the scope is bigger but also more personally relevant since it's something I'll actually use. The helicopter lab was very focused on one specific control theory problem and tuning PID gains, whereas this project touched a lot of different systems and required integrating them all together. The Galton board was more about statistical simulation and VGA output, which has some overlap with this project's display driver but was much more constrained in scope. The open-ended nature of the final project meant I had to make a lot more decisions about what to prioritize and when to stop adding features, which is good practice for real-world engineering where projects are never really "done", you just run out of time.

Overall I'm really pleased with how this turned out. I have a working LED matrix display that I can actually use at home when I'm DJing, it looks cool, the code is reasonably clean and maintainable, and I learned a ton about embedded systems development along the way. The combination of hardware interfacing, network programming, real-time graphics, and audio analysis hit a sweet spot of challenging but achievable, and I'm definitely more confident in my ability to tackle similar projects in the future.

## Appendix A: Code
The group approves this report for inclusion on the course website.
All code and 3d models can be found at https://github.com/maylxwang/dj_display
The group does not approve the video for inclusion on the course youtube channel.

## Appendix B: Pin Assignments

**LED Matrix (HUB75):**
- R1, G1, B1: Top half RGB (GPIO 0-2)
- R2, G2, B2: Bottom half RGB (GPIO 3-5)
- A, B, C, D: Row address (GPIO 6-9)
- CLK: Shift register clock (GPIO 10)
- LAT: Latch (GPIO 11)
- OE: Output enable (GPIO 12)

**NeoKey 1x4:**
- SDA: GP26 (I2C1)
- SCL: GP27 (I2C1)

**WS2811 LED Chain:**
- Data: GPIO 15 (PIO0, SM0)

**WiFi:**
- Onboard CYW43 chip (no external pins)

## Appendix C: Key Source Files

### dj_main.c
Main application logic with display layout, scrolling text, visualizer rendering, and main loop.

### display.c
HUB75 LED matrix driver using GPIO bit-banging, 1-bit color depth, 30 FPS refresh.

### udp_receiver.c
WiFi initialization and UDP packet receiver for track metadata and FFT data.

### neokey.c
Seesaw I2C driver for NeoKey 1x4 button interface with NeoPixel control.

### ws2811_sparkle.c
PIO-based WS2811 protocol driver with spectral flux-reactive sparkle animation for LED chain.

### tiny5_font.c
Variable-width 5×6 pixel font with descender support for text rendering.
