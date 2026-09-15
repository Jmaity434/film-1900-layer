# Film 1900 Layer

Zero-dependency, browser-native **1900s silent-film style** video effect.

- Pure WebGL2
- Real-time preview with no lag on modern devices
- Procedural grain, scratches, dust, flicker, vignette, sepia / monochrome
- Apply as live overlay (preview only) **or** bake into export via `captureStream()`
- Fully language-agnostic (no UI strings)

## Goals

- Authentic early-cinema look (hand-cranked era feel: heavy grain, vertical scratches, soft flicker, warm sepia or pure B&W)
- Zero third-party libraries
- Production-ready performance (`requestAnimationFrame` + efficient shaders)

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
    // Optional tuning
    sepia: 0.75,
    grain: 0.45,
    scratches: 0.55,
    dust: 0.35,
    flicker: 0.25,
    vignette: 0.4,
    monochrome: false,   // true = pure B&W silent-film look
    intensity: 1.0       // master intensity 0–1
  });

  layer.start();          // real-time preview
  // later: layer.stop();

  // Export example (MediaRecorder)
  // const stream = layer.captureStream(24);
  // const recorder = new MediaRecorder(stream);
  // ...
</script>
```

## API

### Constructor options

| Option        | Type              | Default | Description                          |
|---------------|-------------------|---------|--------------------------------------|
| `video`       | HTMLVideoElement  | required| Source video                         |
| `canvas`      | HTMLCanvasElement | required| Output canvas                        |
| `sepia`       | number            | 0.7     | Sepia strength (0–1)                 |
| `grain`       | number            | 0.4     | Film grain intensity                 |
| `scratches`   | number            | 0.5     | Vertical scratch amount              |
| `dust`        | number            | 0.3     | Dust / blot density                  |
| `flicker`     | number            | 0.2     | Frame brightness flicker             |
| `vignette`    | number            | 0.35    | Edge darkening                       |
| `monochrome`  | boolean           | false   | Force pure B&W                       |
| `intensity`   | number            | 1.0     | Global strength multiplier           |

### Methods

- `start()` – begin real-time rendering loop
- `stop()` – stop loop
- `setOptions(partial)` – live update parameters
- `resize()` – call after canvas size change
- `destroy()` – clean up WebGL resources
- `getCanvas()` – returns the output canvas
- `captureStream(fps?)` – returns a MediaStream for export / MediaRecorder

## Performance

- Single full-screen quad + one fragment shader
- All effects procedural (hash-based noise, no textures required)
- Designed to stay under 8–12 ms per frame on mid-range devices at 1080p
- Uses the video’s current frame directly; no extra decode cost

## License

MIT
