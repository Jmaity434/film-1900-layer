# Film 1900 Layer

Zero-dependency, browser-native **1900s silent-film style** video effect.

- Pure WebGL2
- Real-time preview with no lag on modern devices
- Procedural grain, scratches, dust, flicker, vignette, sepia / monochrome
- Use as live overlay (preview only — no export needed)
- Or export the video *with* the layer via `captureStream()` + MediaRecorder
- Fully language-agnostic (no UI strings, no locale code)

## Goals

- Authentic early-cinema look (hand-cranked feel, heavy organic grain, moving vertical scratches, soft irregular flicker, warm sepia or pure B&W)
- Zero third-party libraries
- Production-ready performance (`requestAnimationFrame` + single efficient fragment shader)

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
    sepia: 0.72,
    grain: 0.42,
    scratches: 0.48,
    dust: 0.28,
    flicker: 0.22,
    vignette: 0.38,
    monochrome: false,   // true = pure B&W silent-film look
    intensity: 1.0
  });

  // Live preview — no export required
  layer.start();

  // Optional: later stop
  // layer.stop();

  // Export the video WITH the layer applied
  // const stream = layer.captureStream(24);
  // const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  // ...
</script>
```

## API

### Constructor options

| Option        | Type              | Default | Description                    |
|---------------|-------------------|---------|--------------------------------|
| `video`       | HTMLVideoElement  | required| Source video                   |
| `canvas`      | HTMLCanvasElement | required| Output canvas                  |
| `sepia`       | number            | 0.72    | Sepia strength (0–1)           |
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
| `start()`                 | Begin real-time rendering loop (preview overlay) |
| `stop()`                  | Stop the loop |
| `setOptions(partial)`     | Live-update any parameters |
| `resize()`                | Call after canvas size change |
| `getCanvas()`             | Returns the output canvas |
| `captureStream(fps?)`     | MediaStream of the processed canvas (for export) |
| `destroy()`               | Release all WebGL resources |

## Preview vs Export

- **Preview only** — just call `start()`. The layer draws on the canvas every frame. No export step is required.
- **Export with layer** — keep `start()` running, then `const stream = layer.captureStream(24)` and feed it to `MediaRecorder` (or any other consumer). The exported video will contain the 1900 effect.

## Performance notes

- Single full-screen quad + one fragment shader
- All effects are procedural (hash noise) — no image/texture assets
- `desynchronized: true` + `powerPreference: 'high-performance'` when supported
- Resize only when dimensions actually change
- No allocations inside the render loop
- Designed to stay smooth at 1080p on mid-range devices

## Requirements

- Browser with WebGL2
- Video must allow CORS if it is cross-origin (`crossorigin="anonymous"` + proper server headers)

## License

MIT
