// Converts an equirectangular EXR to a tone-mapped sRGB JPEG for use as a web skybox.
// Usage: node convert-sky.mjs <in.exr> <out.jpg> [width] [exposure]
import { readFileSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import jpeg from 'jpeg-js';

const [,, inPath, outPath, widthArg, exposureArg] = process.argv;
const buf = readFileSync(inPath);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const loader = new EXRLoader();
loader.setDataType(THREE.FloatType);
const t0 = Date.now();
const ex = loader.parse(ab);
const { width: sw, height: sh, data } = ex;
const ch = ex.format === THREE.RGBAFormat ? 4 : 3;
console.log(`decoded ${sw}x${sh}, ${ch} channels, type ${ex.type}, in ${Date.now() - t0} ms`);

// Output size (keep the 2:1 aspect).
const W = Number(widthArg) || sw, H = Math.round(W / 2);
const sx = sw / W, sy = sh / H;

// Auto exposure from the log-average luminance, unless given.
let logSum = 0, n = 0;
for (let i = 0; i < sw * sh; i += 7) {
  const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  logSum += Math.log(1e-4 + lum); n++;
}
const logAvg = Math.exp(logSum / n);
const exposure = exposureArg ? Number(exposureArg) : Math.min(4, Math.max(0.3, 0.22 / logAvg));
console.log(`log-average luminance ${logAvg.toFixed(4)}, exposure ${exposure.toFixed(3)}`);

// ACES filmic fit (Narkowicz) followed by the sRGB transfer curve.
const aces = x => { const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; const y = (x * (a * x + b)) / (x * (c * x + d) + e); return y < 0 ? 0 : y > 1 ? 1 : y; };
const srgb = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
const lut = new Uint8Array(4096); // tone-mapped linear [0,1] -> 8-bit sRGB
for (let i = 0; i < 4096; i++) lut[i] = Math.round(255 * srgb(i / 4095));

const out = new Uint8Array(W * H * 4);
// EXR rows come out bottom-up from the loader (WebGL convention); JPEG rows are top-down.
for (let y = 0; y < H; y++) {
  const srcY = sh - 1 - Math.min(sh - 1, Math.floor((y + 0.5) * sy));
  for (let x = 0; x < W; x++) {
    const srcX = Math.min(sw - 1, Math.floor((x + 0.5) * sx));
    const si = (srcY * sw + srcX) * ch, di = (y * W + x) * 4;
    out[di] = lut[Math.round(aces(data[si] * exposure) * 4095)];
    out[di + 1] = lut[Math.round(aces(data[si + 1] * exposure) * 4095)];
    out[di + 2] = lut[Math.round(aces(data[si + 2] * exposure) * 4095)];
    out[di + 3] = 255;
  }
}
const t1 = Date.now();
const enc = jpeg.encode({ data: out, width: W, height: H }, 86);
writeFileSync(outPath, enc.data);
console.log(`wrote ${outPath}: ${W}x${H}, ${(enc.data.length / 1024 / 1024).toFixed(2)} MB, encode ${Date.now() - t1} ms`);
