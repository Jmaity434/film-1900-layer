/**
 * Film 1900 Layer
 * Pure WebGL2 · zero dependency · real-time 1900s silent-film effect
 * Preview overlay + export-ready (captureStream)
 * MIT License
 */

const VERT_SRC = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D u_video;
uniform float u_time;
uniform float u_sepia;
uniform float u_grain;
uniform float u_scratches;
uniform float u_dust;
uniform float u_flicker;
uniform float u_vignette;
uniform float u_mono;
uniform float u_intensity;
uniform vec2  u_res;

in vec2 v_uv;
out vec4 fragColor;

/* ---------- cheap hash / noise (GPU-friendly) ---------- */
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

/* ---------- 1900-era film effects ---------- */
vec3 applySepia(vec3 c, float amount) {
  float r = dot(c, vec3(0.393, 0.769, 0.189));
  float g = dot(c, vec3(0.349, 0.686, 0.168));
  float b = dot(c, vec3(0.272, 0.534, 0.131));
  return mix(c, vec3(r, g, b), amount);
}

vec3 applyMono(vec3 c) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return vec3(l);
}

float filmGrain(vec2 uv, float t, float intensity) {
  float g1 = noise(uv * vec2(920.0, 680.0) + t * 37.0);
  float g2 = noise(uv * vec2(460.0, 340.0) - t * 19.0);
  float g3 = hash12(floor(uv * u_res * 0.5) + floor(t * 24.0));
  float grain = (g1 * 0.45 + g2 * 0.35 + g3 * 0.20) - 0.5;
  return grain * intensity;
}

float verticalScratches(vec2 uv, float t, float amount) {
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float phase = floor(t * 0.35 + fi * 1.7);
    float x = hash11(fi * 17.3 + phase) * 1.15 - 0.075;
    float w = 0.0012 + hash11(fi * 9.1 + phase) * 0.0028;
    float life = smoothstep(0.0, 0.12, fract(t * 0.28 + fi * 0.19))
               * smoothstep(1.0, 0.75, fract(t * 0.28 + fi * 0.19));
    float d = abs(uv.x - x);
    s += (1.0 - smoothstep(0.0, w, d)) * life * (0.55 + 0.45 * hash11(fi + t * 0.5));
  }
  return s * amount;
}

float dustSpots(vec2 uv, float t, float amount) {
  float d = 0.0;
  float frame = floor(t * 2.2);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float seed = hash11(fi * 23.7 + frame);
    if (seed > 0.78) {
      vec2 pos = vec2(
        hash11(fi * 5.1 + frame),
        hash11(fi * 11.3 + frame * 1.3)
      );
      float r = 0.0035 + hash11(fi * 3.9) * 0.011;
      float dist = length(uv - pos);
      float spot = 1.0 - smoothstep(0.0, r, dist);
      d += spot * (0.45 + 0.55 * hash11(fi + t));
    }
  }
  return clamp(d * amount, 0.0, 1.0);
}

float frameFlicker(float t, float amount) {
  float f = 0.93 + 0.07 * sin(t * 13.7) * sin(t * 7.1);
  f += (hash11(floor(t * 14.0)) - 0.5) * 0.055;
  return mix(1.0, f, amount);
}

float vignette(vec2 uv, float amount) {
  vec2 c = uv - 0.5;
  float v = 1.0 - dot(c, c) * 1.85;
  v = smoothstep(0.15, 1.0, v);
  return mix(1.0, v, amount);
}

void main() {
  vec2 uv = v_uv;

  float jx = (hash11(floor(u_time * 11.0)) - 0.5) * 0.0014 * u_intensity;
  float jy = (hash11(floor(u_time * 11.0) + 7.0) - 0.5) * 0.0011 * u_intensity;
  uv += vec2(jx, jy);

  vec4 tex = texture(u_video, uv);
  vec3 col = tex.rgb;

  if (u_mono > 0.5) {
    col = applyMono(col);
  } else {
    col = applySepia(col, u_sepia * u_intensity);
  }

  col = pow(col, vec3(0.94));
  col = (col - 0.5) * 1.14 + 0.5;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float g = filmGrain(uv, u_time, u_grain * u_intensity * (1.15 - lum * 0.4));
  col += g;

  float sc = verticalScratches(uv, u_time, u_scratches * u_intensity);
  col = mix(col, vec3(0.92), sc * 0.65);
  col -= sc * 0.12;

  float dust = dustSpots(uv, u_time, u_dust * u_intensity);
  col = mix(col, vec3(0.04), dust * 0.88);

  col *= frameFlicker(u_time, u_flicker * u_intensity);
  col *= vignette(uv, u_vignette * u_intensity);

  col = clamp(col, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}`;

/**
 * Film1900Layer
 *
 * Real-time 1900s silent-film look as a video overlay.
 * - Preview: call start() — no export needed
 * - Export: keep the layer running and use captureStream() + MediaRecorder
 */
export class Film1900Layer {
  /**
   * @param {Object} opts
   * @param {HTMLVideoElement} opts.video
   * @param {HTMLCanvasElement} opts.canvas
   * @param {number}  [opts.sepia=0.72]
   * @param {number}  [opts.grain=0.42]
   * @param {number}  [opts.scratches=0.48]
   * @param {number}  [opts.dust=0.28]
   * @param {number}  [opts.flicker=0.22]
   * @param {number}  [opts.vignette=0.38]
   * @param {boolean} [opts.monochrome=false]
   * @param {number}  [opts.intensity=1.0]
   */
  constructor(opts) {
    if (!opts?.video || !opts?.canvas) {
      throw new Error('Film1900Layer requires { video, canvas }');
    }

    this.video = opts.video;
    this.canvas = opts.canvas;

    this.options = {
      sepia:      opts.sepia      ?? 0.72,
      grain:      opts.grain      ?? 0.42,
      scratches:  opts.scratches  ?? 0.48,
      dust:       opts.dust       ?? 0.28,
      flicker:    opts.flicker    ?? 0.22,
      vignette:   opts.vignette   ?? 0.38,
      monochrome: opts.monochrome ?? false,
      intensity:  opts.intensity  ?? 1.0,
    };

    this._gl = null;
    this._program = null;
    this._vao = null;
    this._tex = null;
    this._buf = null;
    this._raf = null;
    this._running = false;
    this._startTime = 0;
    this._lastW = 0;
    this._lastH = 0;

    this._initGL();
  }

  _initGL() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
      desynchronized: true,
    });

    if (!gl) {
      throw new Error('WebGL2 is required for Film1900Layer');
    }
    this._gl = gl;

    const vs = this._compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = this._compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error('Shader link failed: ' + log);
    }
    this._program = prog;

    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this._buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    this._vao = gl.createVertexArray();
    gl.bindVertexArray(this._vao);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this._tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this._u = {
      video:     gl.getUniformLocation(prog, 'u_video'),
      time:      gl.getUniformLocation(prog, 'u_time'),
      sepia:     gl.getUniformLocation(prog, 'u_sepia'),
      grain:     gl.getUniformLocation(prog, 'u_grain'),
      scratches: gl.getUniformLocation(prog, 'u_scratches'),
      dust:      gl.getUniformLocation(prog, 'u_dust'),
      flicker:   gl.getUniformLocation(prog, 'u_flicker'),
      vignette:  gl.getUniformLocation(prog, 'u_vignette'),
      mono:      gl.getUniformLocation(prog, 'u_mono'),
      intensity: gl.getUniformLocation(prog, 'u_intensity'),
      res:       gl.getUniformLocation(prog, 'u_res'),
    };

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.STENCIL_TEST);

    this.resize();
  }

  _compile(type, src) {
    const gl = this._gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('Shader compile error: ' + log);
    }
    return s;
  }

  resize() {
    const gl = this._gl;
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, (c.clientWidth * dpr) | 0);
    const h = Math.max(1, (c.clientHeight * dpr) | 0);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      gl.viewport(0, 0, w, h);
      this._lastW = w;
      this._lastH = h;
    }
  }

  setOptions(partial) {
    Object.assign(this.options, partial);
  }

  /**
   * Start the real-time overlay (preview).
   * No export required — the layer simply draws on the canvas every frame.
   */
  start() {
    if (this._running) return;
    this._running = true;
    this._startTime = performance.now();

    const loop = (now) => {
      if (!this._running) return;
      this._render(now);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this._running = false;
    if (this._raf != null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  _render(now) {
    const gl = this._gl;
    const video = this.video;

    if (video.readyState < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, (this.canvas.clientWidth * dpr) | 0);
    const h = Math.max(1, (this.canvas.clientHeight * dpr) | 0);
    if (w !== this._lastW || h !== this._lastH) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
      this._lastW = w;
      this._lastH = h;
    }

    gl.bindTexture(gl.TEXTURE_2D, this._tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    } catch (_) {
      return;
    }

    gl.useProgram(this._program);
    gl.bindVertexArray(this._vao);

    const t = (now - this._startTime) * 0.001;
    const o = this.options;

    gl.uniform1i(this._u.video, 0);
    gl.uniform1f(this._u.time, t);
    gl.uniform1f(this._u.sepia, o.sepia);
    gl.uniform1f(this._u.grain, o.grain);
    gl.uniform1f(this._u.scratches, o.scratches);
    gl.uniform1f(this._u.dust, o.dust);
    gl.uniform1f(this._u.flicker, o.flicker);
    gl.uniform1f(this._u.vignette, o.vignette);
    gl.uniform1f(this._u.mono, o.monochrome ? 1.0 : 0.0);
    gl.uniform1f(this._u.intensity, o.intensity);
    gl.uniform2f(this._u.res, this._lastW, this._lastH);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._tex);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  getCanvas() {
    return this.canvas;
  }

  /**
   * Returns a MediaStream of the processed canvas.
   * Use with MediaRecorder to export the video with the layer applied.
   * The layer must be running (start()) for the stream to contain frames.
   */
  captureStream(frameRate = 24) {
    return this.canvas.captureStream(frameRate);
  }

  destroy() {
    this.stop();
    const gl = this._gl;
    if (gl) {
      if (this._tex) gl.deleteTexture(this._tex);
      if (this._vao) gl.deleteVertexArray(this._vao);
      if (this._buf) gl.deleteBuffer(this._buf);
      if (this._program) gl.deleteProgram(this._program);
    }
    this._gl = null;
    this._program = null;
    this._vao = null;
    this._tex = null;
    this._buf = null;
  }
}

export function createFilm1900Layer(opts) {
  return new Film1900Layer(opts);
}
