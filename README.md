# Film 1900 Layer — Browser-Native Old Film / Silent Film Video Effect (WebGL2)

**Zero-dependency JavaScript library** that turns any modern HTML5 video into an authentic **1900s silent-film / early cinema** look in real time.

Perfect for:
- Vintage / retro video filters in the browser
- Old film grain, scratches, dust and flicker effects
- Silent film style overlays
- WebGL film emulation without FFmpeg or external assets
- Live preview + exportable processed video

## Why this library?

Most “old film” effects online are either:
- Heavy CSS-only approximations, or
- Desktop plugins / FFmpeg filters that cannot run live in the browser.

**Film 1900 Layer** is a pure **WebGL2** solution:
- Runs entirely in the browser
- No third-party dependencies
- No pre-made textures or image assets
- Real-time (no lag on modern devices)
- Works as a live overlay **or** can be exported with the effect baked in

Search terms this project targets:  
`old film effect javascript`, `silent film filter webgl`, `vintage film grain browser`, `1900 film look video`, `film scratches dust flicker web`, `webgl old cinema effect`, `real-time film emulation javascript`.

## Features

| Feature | Description |
|---------|-------------|
| **Authentic 1900s look** | Hand-cranked feel, organic multi-scale grain, moving vertical scratches, sparse dust spots, irregular flicker, gate-weave jitter, warm sepia or pure monochrome |
| **Real-time preview** | Call `start()` — the effect draws on a canvas every frame. No export step required for preview |
| **Export with effect** | `captureStream()` + `MediaRecorder` → download a video that already has the 1900 layer applied |
| **Zero dependencies** | Single ES module, pure WebGL2 |
| **Language agnostic** | No UI strings, works in any locale |
| **Performance focused** | Single fragment shader, no allocations in the render loop, high-performance WebGL context |

## Quick Start

```html
<video id="src" src="your-video.mp4" crossorigin="anonymous" playsinline></video>
<canvas id="out"></canvas>

<script type="module">
  import { Film1900Layer } from './src/film1900.js';

  const video = document.getElementById('src');
  const canvas = document.getElementById('out');

  const layer = new Film1900Layer({
    video,
    canvas,
    sepia: 0.72,        // warm early-film tint (0–1)
    grain: 0.42,        // film grain intensity
    scratches: 0.48,    // vertical scratch amount
    dust: 0.28,         // dust / emulsion spots
    flicker: 0.22,      // hand-cranked brightness flicker
    vignette: 0.38,     // edge darkening
    monochrome: false,  // true = pure black & white silent-film look
    intensity: 1.0      // global strength
  });

  // Live preview — no export needed
  layer.start();

  // Later: layer.stop();
</script>
```

### Export the video *with* the 1900 effect

```js
// Keep the layer running
layer.start();

const stream = layer.captureStream(24);
const recorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9'
});

const chunks = [];
recorder.ondataavailable = e => chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  // download or upload the blob
};

recorder.start();
// ... after desired duration
recorder.stop();
```

## API Reference

### Constructor options

| Option        | Type              | Default | Description                    |
|---------------|-------------------|---------|--------------------------------|
| `video`       | HTMLVideoElement  | required| Source video element           |
| `canvas`      | HTMLCanvasElement | required| Output canvas                  |
| `sepia`       | number            | 0.72    | Sepia / early-film tint (0–1)  |
| `grain`       | number            | 0.42    | Film grain intensity           |
| `scratches`   | number            | 0.48    | Vertical scratch amount        |
| `dust`        | number            | 0.28    | Dust / blot density            |
| `flicker`     | number            | 0.22    | Frame brightness flicker       |
| `vignette`    | number            | 0.38    | Edge darkening                 |
| `monochrome`  | boolean           | false   | Force pure B&W                 |
| `intensity`   | number            | 1.0     | Global strength multiplier     |

### Methods

| Method                    | Description |
|---------------------------|-------------|
| `start()`                 | Start real-time rendering (preview overlay) |
| `stop()`                  | Stop the rendering loop |
| `setOptions(partial)`     | Live-update any parameters |
| `resize()`                | Call after the canvas is resized |
| `getCanvas()`             | Returns the output canvas |
| `captureStream(fps?)`     | Returns a MediaStream for export |
| `destroy()`               | Release all WebGL resources |

## Performance

- Single full-screen quad + one fragment shader
- All effects are **procedural** (hash-based noise) — no image or texture assets to load
- `powerPreference: 'high-performance'` and `desynchronized: true` when supported
- Resize only when canvas dimensions actually change
- No object allocations inside the render loop
- Designed to stay smooth at 1080p on mid-range devices

## Browser requirements

- WebGL2 support (all modern browsers)
- If the video is cross-origin, it must be served with proper CORS headers and the `<video>` element must have `crossorigin="anonymous"`

## Keywords / Discoverability

old film effect javascript · silent film filter · vintage film grain webgl · 1900 cinema look · film scratches dust flicker · browser film emulation · real-time video effect · webgl film filter · early cinema overlay · zero dependency video filter

## License

MIT — free to use, modify and distribute.
