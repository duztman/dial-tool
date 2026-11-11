// main.js — Show Case 3D: the scene, its looks, the case, the bracelet, the dial in depth, the panel. The parts that stand alone are
// files of their own: specs.js (the watches as data), sweep.js (the builder), dial-in.js (a dial from Dial Tool), drawing.js (the
// Engineer drawing), parts.js (Dial Tool's record of a dial's parts and the stack's rules).
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import * as PARTS from "./parts.js";      // the dial's parts and the stack's rules: Dial Tool's own file (engine-build.mjs copies it)
import { CASES, BRACELETS } from "./specs.js";
import { sweep } from "./sweep.js";
import { readDial } from "./dial-in.js";
let scene3 = window.SCENE;      // the dial's parts: the opener's (dump.mjs), or a dial opened from Dial Tool's SVG (setDial, section 7b)
let DIAL_Z = 10.0;                // the dial's face, mm over the caseback; world y = 0 there. Set per case at rebuild: zTop + bezel.dialUp (round 34)
const W = (x, y, z) => [x, z - DIAL_Z, -y];      // case space (x, y of the dial plane, z up from the caseback) → world (dial y, 12 o'clock, is −z)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ss = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }, rad = (d) => d * Math.PI / 180;

// ── 1 · the specs: specs.js · 2 · the sweep: sweep.js (imported above) ──
/** a part spun round the dial's axis: `pts` [r, z] in case space */
const lathe = (pts, seg = 256) => new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z - DIAL_Z)), seg);
const mesh = (geo, mat, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = shadow; for (const mm of [].concat(mat)) mm.side = THREE.DoubleSide; return m; };

// ── 3 · materials: a small named list ──
const METAL = { steel: "#c9c9c6", gold: scene3.metal }; let metalHex = METAL.steel; const leatherHex = scene3.leather;
let floorHex = 0xa86a3c;      // the ground's (first) colour as a number: the table's, the page's, the dither's paper (S.floor is its hex)
const metalMat = (rough, aniso) => Object.assign(new THREE.MeshPhysicalMaterial({ color: metalHex, metalness: 1, roughness: rough, anisotropy: aniso }), { userData: { metal: true } });
// A GLARE GIVES WAY (rounds 95–96; Okay: "Glare shouldn't hide nothing nowhere, all should give way somehow, even photo"): on the
// crystal, the light a surface mirrors — its own shine and its clear coat's — adds `GLARE.cap` at most
const giveWay = (m) => { m.onBeforeCompile = (sh) => { const cap = `vec3(${GLARE.cap.toFixed(3)})`;
    sh.fragmentShader = sh.fragmentShader.replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", `totalSpecular = min(totalSpecular, ${cap});\n\tvec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;`)
      .replace("( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;", `min( ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat, ${cap} );`); }; return m; };
const MATERIALS = {
  polished: () => metalMat(0.16, 0), brushed: () => metalMat(0.36, 0.85),
  paint: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0, roughness: 0.45, clearcoat: 0.9, clearcoatRoughness: 0.15 }),
  insert: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.6, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
  sapphire: () => { const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.0, transmission: 1, thickness: 1.2, ior: 1.76, transparent: true, side: THREE.DoubleSide });
    return giveWay(m); },      // thickness: the real 1.2 mm — the refraction that shifts the rehaut at the edge; the blur comes from roughness, not thickness, so none at 0
  leather: () => new THREE.MeshPhysicalMaterial({ color: leatherHex, metalness: 0, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6 }),      // smooth calf: matte-satin, a soft broad highlight (ref-29)
  edge: () => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(leatherHex).multiplyScalar(0.55), metalness: 0, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 }),      // the burnished cut edge: darker, a little glossier (ref-34)
  lining: () => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(leatherHex).multiplyScalar(0.85), metalness: 0, roughness: 0.9 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95, metalness: 0 }),
  hand: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.9, roughness: 0.42 }),
};
const PB = () => [MATERIALS.polished(), MATERIALS.brushed()];      // the usual pair: 0 polished, 1 brushed

// ── 4 · the scene ──
const canvas = document.getElementById("gl"), status = document.getElementById("status");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(floorHex);
// the room the metal reflects: a light tent with a key softbox high at the upper left, fills, a black flag over the lens
// (what polished tops and the crystal mirror straight back at a camera above), a darker table below
// the DARK STUDIO (round 37): a black room with three soft panels — the way watches are photographed. Polished faces mirror black
// except where they catch a panel, so the form reads in blacks and one bright line; brushed faces smear a panel into a gradient.
// Key: a big soft panel high at the upper left with a falloff across it; strip: a tall narrow panel at the right for the
// flank's line; card: a low white card at the front, the reflector that keeps a low view's flank from going all black
function darkStudio(card = S.card) { const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.BackSide })));
  const soft = (w, h, x, y, z, lum) => { const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "rgba(255,255,255,0.15)"); gr.addColorStop(0.5, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0.15)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: new THREE.Color().setScalar(lum) })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  // the KEY's shape (round 97; Okay: "Can we add an option of a straight light source instead of this round one? Would this give us something like
  // the earlier toon's?"): a panel (90 × 45: in the domed glass a broad patch) or a strip, a long narrow light in the same place (140 × 7: a band
  // across the glass, as Toon's band was — but now where the room puts it, moving with the camera)
  if (S.keyShape === "strip") soft(140, 7, -55, 55, -35, 7); else soft(90, 45, -55, 55, -35, 7);
  soft(16, 70, 75, 20, 10, 4.5); soft(60, 12, 0, 8, 80, 1.2);      // the side strip · back glow
  soft(card.size, card.size * 0.3, 20, card.height, 60, card.lum);      // the low card: Okay's to move (round 38) — its height over the table, its width, its brightness
  s.add(new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(0.06) })).rotateX(-Math.PI / 2).translateZ(-60));
  return s; }
function studio() { const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.MeshBasicMaterial({ color: 0x8a8a8a, side: THREE.BackSide })));
  const box = (w, h, x, y, z, lum) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(lum) })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  box(70, 50, -60, 45, -40, 9); box(60, 40, 70, 25, 0, 3.5); box(40, 20, 0, 20, 70, 2.5); box(50, 30, 0, 12, -70, 2);
  { const flag = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(0.04) })); flag.position.set(0, 95, 0); flag.lookAt(0, 0, 0); s.add(flag); }
  s.add(new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(0.35) })).rotateX(-Math.PI / 2).translateZ(-60));
  return s; }
// ONE ROOM FOR EVERY LOOK (round 95; Okay, 11 Nov 2026: "The preview rendering does not give me card preview etc … Can we not
// universalize the studio setups and glares and whatever?" · "All sound good"). The room is ONE scene (`studio()` · `darkStudio()`).
// Photo reflects it blurred by roughness (the PMREM texture, `scene.environment`). `ROOM` holds the same scene as a small plain
// cube (`ROOM.tex`, for a shader) and as numbers (`ROOM.lum(x, y, z)`: the light coming from a direction, for code) — so no look
// needs its own list of panels. `ROOM.T`: a reflection brighter than this is a light, not a wall (the walls are 0.25 at most, the
// dimmest panel 1.2). `GLARE`: what glass sends back is its Fresnel share of that light (`f0`, sapphire's 7.6 % seen straight on);
// it counts as a glare over `t`, and it never covers what is under it — `cap` is the most a glare may add in Photo, `veil` how strongly a drawn look paints the same patch
// (Okay: "Glare shouldn't hide nothing nowhere, all should give way somehow, even photo")
const ROOM = { N: 512, T: 0.5, tex: { value: null }, t: { value: 0.5 }, faces: null, scenes: {} }, GLARE = { f0: 0.076, t: 0.2, cap: 0.03, veil: 0.035 };      // round 96 (Okay: "glares dimmer everyhere"): both are light added before the screen's curve, where 0.03 already reads as a fifth of white — at 0.3 the key panel in the glass was a grey sheet over the whole dial. cap: Photo's ceiling; veil: how strongly a drawn look paints the same patch
window.GLARE3D = GLARE;
ROOM.rt = new THREE.WebGLCubeRenderTarget(ROOM.N, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
// EVERY SURFACE READS THE ROOM, IN GRADES (round 98; Okay: "The controls basically do nothing. The preview lacks so much in light info it's
// practically useless … all lack grades to pass. Realistic. Add other surfaces to this system as well"). What a surface mirrors is the
// room in its mirror direction — `roomLum(direction, roughness)`: a rough surface reads a blurred copy of the room (the cube's smaller
// copies), a polished one the sharp one. `grade()` sorts that light into four steps: the dark of the room (under 0.12), its walls
// and floor (to 0.45), a card or the glow (to 1.5), a key or a strip (over). A drawn look paints by the step; Photo by the light itself
const GRADE = { base: { value: 0.5 }, top: 1.65 }; window.GRADE3D = GRADE;      // round 99 (Okay: "Bump up the base grays from 0.3 to +.2 … Get sensible values to go between"): a drawn metal that mirrors the room's dark is `base` of its own colour (0.5; it was 0.3), one that mirrors a key `top`; the two grades between lie evenly between them (0.88 · 1.27). The Metal's dark slider is `base`
const ROOM_GLSL = `uniform samplerCube room; uniform float gBase;
  float metalMul(float g) { return mix(gBase, ${GRADE.top.toFixed(2)}, g); }
  float roomLum(vec3 d, float rough) { return dot(textureLod(room, d, rough * 7.0).rgb, vec3(0.2126, 0.7152, 0.0722)); }
  float grade(float l) { return l < 0.12 ? 0.0 : l < 0.45 ? 0.34 : l < 1.5 ? 0.67 : 1.0; }
  float gloss(float l) { return l < 0.06 ? 0.0 : l < 0.2 ? 0.34 : l < 0.6 ? 0.67 : 1.0; }`;      // gloss(): the same four steps for what lacquer or glass sends back — a few per cent of the light, so the steps sit lower
const roomUniforms = (sh, m) => { sh.uniforms.room = ROOM.tex; sh.uniforms.gBase = GRADE.base; sh.uniforms.rRough = { value: m.roughness ?? 0.5 }; sh.uniforms.rMetal = { value: m.userData?.metal ? 1 : 0 }; sh.uniforms.rGloss = { value: m.userData?.metal ? 0 : Math.max(m.clearcoat ?? 0, 1 - (m.roughness ?? 1)) }; }; ROOM.cam = new THREE.CubeCamera(0.1, 1000, ROOM.rt); ROOM.tex.value = ROOM.rt.texture;
window.ROOM3D = ROOM; ROOM.take = (sc) => { ROOM.cam.update(renderer, sc); ROOM.faces = null; };
ROOM.read = () => { const N = ROOM.N, half = THREE.DataUtils.fromHalfFloat; ROOM.faces = Array.from({ length: 6 }, (_, f) => { const b = new Uint16Array(N * N * 4), L = new Float32Array(N * N); renderer.readRenderTargetPixels(ROOM.rt, 0, 0, N, N, b, f);
    for (let i = 0; i < N * N; i++) L[i] = 0.2126 * half(b[4 * i]) + 0.7152 * half(b[4 * i + 1]) + 0.0722 * half(b[4 * i + 2]); return L; }); };
// the light from a direction, as a shader's textureCube(room, d) reads it: the cube's own rule for which face and where on it
ROOM.lum = (x, y, z) => { if (!ROOM.faces) ROOM.read(); const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z), N = ROOM.N; let f, sc, tc, ma;
  if (ax >= ay && ax >= az) { ma = ax; f = x > 0 ? 0 : 1; sc = x > 0 ? -z : z; tc = -y; } else if (ay >= az) { ma = ay; f = y > 0 ? 2 : 3; sc = x; tc = y > 0 ? z : -z; } else { ma = az; f = z > 0 ? 4 : 5; sc = z > 0 ? x : -x; tc = -y; }
  const i = Math.min(N - 1, Math.max(0, Math.floor((sc / ma + 1) / 2 * N))), j = Math.min(N - 1, Math.max(0, Math.floor((tc / ma + 1) / 2 * N))); return ROOM.faces[f][j * N + i]; };
const pmrem = new THREE.PMREMGenerator(renderer), ROOMS = {}; const setRoom = (room, fresh = false) => { if (fresh) { ROOMS[room]?.dispose(); delete ROOMS[room]; delete ROOM.scenes[room]; }
  const sc = ROOM.scenes[room] ??= room === "dark" ? darkStudio() : studio(); scene.environment = ROOMS[room] ??= pmrem.fromScene(sc, 0.04).texture; ROOM.take(sc); };      // the room the metal reflects: made once each, kept; fresh when the card moves. Every look's cube follows it
const camera = new THREE.PerspectiveCamera(22, 1, 10, 2000);
const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 100, 100); gtao.output = GTAOPass.OUTPUT.Default;
gtao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1, thickness: 1, scale: 2.2, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 });
composer.addPass(gtao);
// ── 4b · the RENDER STYLES (round 35): Photo is the scene as lit. The others are the same scene under toon materials (flat steps of
// light) with INK LINES drawn by a pass that renders the normals and depth and inks where they jump — the lines every style shares.
// Pixel and Dither add a pass that samples the picture on a coarse grid (and snaps colours to a few levels, with a Bayer dither).
// Technical is white parts, white table, lines only — the engineer's view from the 3D
class EdgePass extends Pass {
  constructor(scene, camera) { super(); this.scene = scene; this.camera = camera; this.normalMat = new THREE.MeshNormalMaterial();
    this.target = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, tNormal: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) }, near: { value: 10 }, far: { value: 2000 }, ws: { value: 1.6 }, wc: { value: 0.8 }, nTh: { value: 0.35 }, dAbs: { value: 0.15 }, dRel: { value: 0.002 }, creaseInk: { value: 0.7 }, ink: { value: new THREE.Color(0x101010) } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      // two kinds of line (round 36): a SILHOUETTE where the depth steps (one part in front of another, or the background) — the heavier,
      // sampled at radius ws; a CREASE where the normal turns past nTh — lighter (creaseInk), sampled at wc. Both soft-edged by smoothstep
      fragmentShader: `uniform sampler2D tDiffuse, tNormal, tDepth; uniform vec2 res; uniform float near, far, ws, wc, nTh, dAbs, dRel, creaseInk; uniform vec3 ink; varying vec2 vUv;
        float lin(float d) { float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }      // the depth buffer to view distance
        void main() { vec3 n0 = texture2D(tNormal, vUv).xyz * 2.0 - 1.0; float z0 = lin(texture2D(tDepth, vUv).x); float sil = 0.0, cr = 0.0;
          for (int i = 0; i < 8; i++) { float a = float(i) * 0.7853982; vec2 dir = vec2(cos(a), sin(a));
            float z1 = lin(texture2D(tDepth, vUv + dir * ws / res).x); float t = dAbs + dRel * min(z0, z1); sil = max(sil, smoothstep(t, t * 3.0, abs(z0 - z1)));      // a step of dAbs mm (a marker on the plate) counts at any distance; dRel keeps far, grazing surfaces quiet
            if (i < 4) { vec3 n1 = texture2D(tNormal, vUv + dir * wc / res).xyz * 2.0 - 1.0; cr = max(cr, smoothstep(nTh, nTh * 1.5, 1.0 - dot(n0, n1))); } }
          float e = max(sil, cr * creaseInk); vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = vec4(mix(c.rgb, ink, e), c.a); }` })); }
  setSize(w, h) { this.target.setSize(w, h); this.quad.material.uniforms.res.value.set(w, h); }
  render(renderer, writeBuffer, readBuffer) { const bg = this.scene.background; this.scene.background = null; this.scene.overrideMaterial = this.normalMat;
    const ghosts = []; this.scene.traverse((o) => { if (!o.isMesh || !o.visible) return; const m = [].concat(o.userData.photo ?? o.material)[0]; if (m.transmission > 0 || (m.isMeshBasicMaterial && m.transparent)) { o.visible = false; ghosts.push(o); } });      // the crystal and the contact shadow draw no lines and hide none
    renderer.setRenderTarget(this.target); renderer.clear(); renderer.render(this.scene, this.camera); for (const o of ghosts) o.visible = true; this.scene.overrideMaterial = null; this.scene.background = bg;
    const u = this.quad.material.uniforms; u.tDiffuse.value = readBuffer.texture; u.tNormal.value = this.target.texture; u.tDepth.value = this.target.depthTexture; u.near.value = this.camera.near; u.far.value = this.camera.far;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer); }
}
const edgePass = new EdgePass(scene, camera); edgePass.enabled = false; composer.addPass(edgePass);
// the GRID PASS (round 43, after Return of the Obra Dinn — Lucas Pope's devlog: two colours, 800 × 450, an 8×8 Bayer on the
// things that matter and a blue-noise field on the rest, crisp lines over it; his sphere-mapped stability is not done here):
// one sample a cell; `bits` 1 → the luminance against a threshold pattern, dots of `ink` on `paper`; `bits` 0 → the old
// snap to `levels` with a Bayer nudge. `pattern` 0 Bayer 8×8 · 1 interleaved-gradient noise (a cheap blue-noise-like field)
const gridPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, cell: { value: 2 }, levels: { value: 4 }, dither: { value: 1 }, bits: { value: 1 }, pattern: { value: 1 }, ink: { value: new THREE.Color(0x141413) }, paper: { value: new THREE.Color(0xa86a3c) }, gain: { value: 1.0 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float cell, levels, dither, bits, pattern, gain; uniform vec3 ink, paper; varying vec2 vUv;
    float bayer(vec2 p) { ivec2 q = ivec2(mod(floor(p), 8.0)); int x = q.x, y = q.y, v = 0;      // the 8×8 Bayer threshold by bit interleaving: no table
      v = ((x ^ y) & 1) * 32 + (y & 1) * 16 + (((x ^ y) >> 1) & 1) * 8 + ((y >> 1) & 1) * 4 + (((x ^ y) >> 2) & 1) * 2 + ((y >> 2) & 1); return (float(v) + 0.5) / 64.0; }
    float ign(vec2 p) { return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y)); }      // interleaved gradient noise (Jimenez 2014): blue-noise-like, one line
    void main() { vec2 g = floor(vUv * res / cell); vec2 uv = (g + 0.5) * cell / res; vec3 c = texture2D(tDiffuse, uv).rgb;      // one sample a cell, at its centre
      float th = pattern > 0.5 ? ign(g) : bayer(g);
      if (bits > 0.5) { float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); l = pow(clamp(l * gain, 0.0, 1.0), 1.0 / 2.2); l = smoothstep(0.12, 0.85, l);      // the picture's light as the eye sees it, then stretched: the deep shadows all ink, the highlights all paper, the dots for the middle
        gl_FragColor = vec4(l > th ? paper : ink, 1.0); return; }      // one bit: lighter than the threshold → paper, else a dot of ink
      if (levels > 0.5) { float t = dither > 0.5 ? th - 0.5 : 0.0; c = floor(c * levels + 0.5 + t) / levels; }
      gl_FragColor = vec4(c, 1.0); }` }); gridPass.enabled = false; composer.addPass(gridPass);
composer.addPass(new OutputPass());
// toon materials stand in for the photo ones: one per mesh, made once, keeping the colour and the picture (an insert, the dial's plate)
const steps = (n, lo = 0.35) => { const d = new Uint8Array(n); for (let i = 0; i < n; i++) d[i] = Math.round(255 * (lo + (1 - lo) * Math.pow(i / (n - 1), 0.8))); const t = new THREE.DataTexture(d, n, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; };
const GRADIENTS = { toon: steps(5, 0.1), cel: steps(2) };      // round 44: five steps from a near-black shadow (Okay: "needs darks and more midtones"); round 43: three steps from a deep shadow (Okay: "lacks contrast extremely") — contrast in a toon is the ramp's depth, not the colour count
const fill = new THREE.HemisphereLight(0xffffff, 0x808080, 0);      // round 98: its ground was a warm brown (Okay: "Toon is warmer"); the room is grey in every look scene.add(fill);      // toon materials see no room: a sky light stands in for it in the drawn styles
// the DRAWING style's live view (round 75; Okay: "needs shadows and simple light, shadows in rgb green, highlights and glares magenta"):
// a false-colour map of what the SVG will draw — white Lambert with a simple light, the sun's cast shadow tinted GREEN (where the
// lit term falls under half of what the sun's angle promises), the metal's highlight (its reflection inside the key or strip panel's
// cone, as svg3d-core's round 53) and the crystal's glare band (round 65) MAGENTA. The ink lines of the EdgePass draw over it
const SURR = { paper: { value: 0 }, useRoom: { value: 0 }, sunV: new THREE.Vector3(0, 1, 0), keyV: new THREE.Vector3(), stripV: new THREE.Vector3(), cosK: Math.cos(18 * Math.PI / 180), cosS: Math.cos(9 * Math.PI / 180), sunI: 1 };
const KEY_W = new THREE.Vector3(-55, 55, -35).normalize(), STRIP_W = new THREE.Vector3(75, 20, 10).normalize();
const surrogateMaterial = (m) => { if (m.transmission) return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.FrontSide, uniforms: { magenta: { value: new THREE.Color(0xff2a9a) }, room: ROOM.tex, useRoom: SURR.useRoom, f0: { value: GLARE.f0 }, glareT: { value: GLARE.t } },
    vertexShader: `varying vec3 vN, vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 magenta; uniform samplerCube room; uniform float useRoom, f0, glareT; varying vec3 vN, vV; void main() { vec3 n = normalize(vN), v = normalize(vV); vec3 r = reflect(-v, n); vec3 up = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); float h = dot(r, up);
      vec3 rW = normalize((vec4(r, 0.0) * viewMatrix).xyz); float back = (f0 + (1.0 - f0) * pow(1.0 - max(dot(n, v), 0.0), 5.0)) * dot(textureCube(room, rW).rgb, vec3(0.2126, 0.7152, 0.0722));      // the room's light in the mirror direction, times the glass's Fresnel share
      if (back > glareT) gl_FragColor = vec4(magenta, back > 4.0 * glareT ? 0.6 : back > 2.0 * glareT ? 0.4 : 0.22); else discard; }` });      // round 96: the Engineer style's own view too — its band is retired
  const lam = new THREE.MeshLambertMaterial({ color: 0xf4f4f2, side: THREE.DoubleSide }); lam.userData.metal = !!m.userData.metal; const isGround = m === groundMat;
  lam.onBeforeCompile = (sh) => { sh.uniforms.sunV = { value: SURR.sunV }; sh.uniforms.keyV = { value: SURR.keyV }; sh.uniforms.stripV = { value: SURR.stripV }; sh.uniforms.cosK = { value: SURR.cosK }; sh.uniforms.cosS = { value: SURR.cosS }; sh.uniforms.sunI = { value: SURR.sunI }; sh.uniforms.isMetal = { value: lam.userData.metal ? 1 : 0 }; roomUniforms(sh, m); sh.uniforms.useRoom = SURR.useRoom; sh.uniforms.roomT = ROOM.t; sh.uniforms.isGround = { value: isGround ? 1 : 0 }; sh.uniforms.gA = GROUND_U.gA; sh.uniforms.gB = GROUND_U.gB; sh.uniforms.gRes = GROUND_U.gRes; sh.uniforms.paperGround = SURR.paper;
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\n" + ROOM_GLSL + "\nuniform vec3 sunV, keyV, stripV, gA, gB; uniform vec2 gRes; uniform float cosK, cosS, sunI, isMetal, useRoom, roomT, rRough, rMetal, rGloss, isGround, paperGround;")
      .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
        float expectNL = max(dot(normal, sunV), 0.0), got = reflectedLight.directDiffuse.g, expect = sunI * expectNL * RECIPROCAL_PI * diffuseColor.g;
        float inShadow = (expectNL > 0.12 && got < 0.5 * expect) ? 1.0 : 0.0;
        vec3 rV = reflect(-geometryViewDir, normal); float hl = isMetal > 0.5 ? max(dot(rV, keyV) - cosK, dot(rV, stripV) - cosS) : -1.0;
        float hlS = 1.0; if (useRoom > 0.5) { float L = roomLum(inverseTransformDirection(rV, viewMatrix), rRough); hlS = rMetal > 0.5 ? grade(L) : rGloss * gloss((0.04 + 0.96 * pow(1.0 - max(dot(normal, geometryViewDir), 0.0), 5.0)) * L); hl = hlS > 0.0 ? 1.0 : -1.0; }      // round 98: every surface, by what it mirrors of the room — metal by the room's grade, lacquer by its Fresnel share
        vec3 fc = vec3(0.96) * (0.72 + 0.28 * expectNL); fc = mix(fc, vec3(0.1, 0.85, 0.2), inShadow * 0.5); if (hl > 0.0) fc = mix(fc, vec3(1.0, 0.16, 0.6), useRoom > 0.5 ? 0.15 + 0.65 * hlS : 0.75);`)      // three strengths of magenta: a wall's light, a card's, a key's
      .replace("#include <opaque_fragment>", "if (isGround > 0.5 && paperGround < 0.5) { vec2 q = gl_FragCoord.xy / gRes; fc *= mix(gA, gB, clamp((q.x + 1.0 - q.y) * 0.5, 0.0, 1.0)); }      // the table in the background's colour or gradient, as in every look (round 99)\n gl_FragColor = vec4(fc, 1.0);"); };
  return lam; };
function styledMaterial(m, style) { if (style === "tech") return m.userData.tech ??= surrogateMaterial(m);
  const k = "toon_" + style; if (m.userData[k]) return m.userData[k];
  if (m.transmission) return m.userData[k] = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.FrontSide,      // the crystal, drawn: see-through, with the room's GLARE (round 96; Okay: "Why do these refiectoins look so different? Similar looks. glares dimmer everyhere … retire the rings") — a flat paper-white patch at `GLARE.veil` where the glass mirrors a light of the room, the same patch Photo shows; nothing anywhere else
    uniforms: { glint: { value: new THREE.Color(0xffffff) }, room: ROOM.tex, f0: { value: GLARE.f0 }, glareT: { value: GLARE.t }, veil: { value: GLARE.veil } },
    vertexShader: `varying vec3 vN, vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 glint; uniform samplerCube room; uniform float f0, glareT, veil; varying vec3 vN, vV; void main() { vec3 n = normalize(vN), v = normalize(vV); vec3 r = reflect(-v, n);
      vec3 rW = normalize((vec4(r, 0.0) * viewMatrix).xyz); float back = (f0 + (1.0 - f0) * pow(1.0 - max(dot(n, v), 0.0), 5.0)) * dot(textureCube(room, rW).rgb, vec3(0.2126, 0.7152, 0.0722)); if (back <= glareT) discard; gl_FragColor = vec4(glint, veil * (back > 4.0 * glareT ? 2.6 : back > 2.0 * glareT ? 1.7 : 1.0)); }` });      // three grades (round 98): a light's soft edge, its body, its core
  if (m.isMeshBasicMaterial) return m.userData[k] = m;      // the contact shadow, the studio: as they are
  const tm = new THREE.MeshToonMaterial({ color: m.color, map: m.map ?? null,      /* a metal's toon colour is its own (round 98): the room it mirrors darkens it, as in Photo — the 60 % that stood in for the room is gone */ gradientMap: GRADIENTS[style] ?? GRADIENTS.toon, transparent: m.transparent, opacity: m.opacity, side: THREE.DoubleSide });
  // what a toon surface mirrors (round 98): the room, by its grade. METAL is painted by it — dark where it mirrors the dark of the room,
  // its own colour by the walls, lighter by a card, brightest by a key (the bands of round 44, reflection against "up", were a room made
  // up for the toon). LACQUER and leather (anything with a clear coat or a smooth face) take a faint paper-white patch where they mirror
  // a light, by Fresnel's share — stronger at a grazing eye — and never more than `GLARE.veil` a step: a glare gives way
  tm.onBeforeCompile = (sh) => { roomUniforms(sh, m); sh.uniforms.rVeil = { value: GLARE.veil };
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\n" + ROOM_GLSL + "\nuniform float rRough, rMetal, rGloss, rVeil;").replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
    { vec3 vv = normalize(vViewPosition); float L = roomLum(inverseTransformDirection(reflect(-vv, normal), viewMatrix), rRough);
      if (rMetal > 0.5) diffuseColor.rgb *= metalMul(grade(L));
      else if (rGloss > 0.05) { float g = gloss((0.04 + 0.96 * pow(1.0 - max(dot(normal, vv), 0.0), 5.0)) * L); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), g * rGloss * rVeil * 3.0); } }`); };
  if (m === groundMat) tintGround(tm);      // the table's toon stand-in takes the ground's colours as the table does (round 76)
  return m.userData[k] = tm; }
// THE FAST RENDER (Okay, 10 Nov 2026: "click should immediately activate the new toon style fast render", then "I meant green red
// while moving the camera for photo and toom. dither can stay dithered while moving"): while the hand is on the camera, Photo and
// Toon wear the Drawing's live view — white Lambert, the sun's shadow green, highlights and glare magenta, ink lines — with no
// ambient-occlusion pass and the sun's shadow map held (the sun is not moving); the chosen style returns when the hand lifts.
// Dither and Drawing move as themselves. `look()` is the style in force
let fast = false;
const look = () => (fast && (S.style === "photo" || S.style === "toon") ? "tech" : S.style);
// `live` (round 91): the thing being moved changes the shadows themselves — the sun, a card, a part's size — so they keep following;
// under a moving camera they hold still, which is where the speed comes from
function fastMode(on, live = false) { on = on && (S.style === "photo" || S.style === "toon"); renderer.shadowMap.autoUpdate = !on || live; if (on === fast) return; fast = on; if (!on) renderer.shadowMap.needsUpdate = true; applyStyle(look()); render(); }
function applyStyle(style) {
  const drawn = style !== "photo", swap = style === "toon" || style === "tech"; scene.traverse((o) => { if (!o.isMesh) return; o.userData.photo ??= o.material;      // Dither keeps the photo's materials and room (round 43): Obra Dinn dithers a lit scene, and the reflections are the contrast
    o.material = swap ? [].concat(o.userData.photo).map((m) => styledMaterial(m, style)) : o.userData.photo; if (Array.isArray(o.material) && o.material.length === 1) o.material = o.material[0]; });
  gtao.enabled = style !== "tech"; edgePass.enabled = drawn; gridPass.enabled = style === "dither";      // the AO stays on under the toon (round 44): the creases between links and under the bezel are its darks
  ditherSet();
  const eu = edgePass.quad.material.uniforms, pr = renderer.getPixelRatio(); eu.ws.value = (style === "tech" ? 1.5 : 1.3) * pr; eu.wc.value = (style === "tech" ? 1.0 : 0.8) * pr;      // the ink keeps its width on a 2× screen
  eu.nTh.value = style === "tech" ? 0.18 : 0.4; eu.creaseInk.value = style === "tech" ? 0.65 : 0.5; eu.dAbs.value = style === "tech" ? 0.08 : 0.15;      // the sheet shows a marker's 0.3 mm step; the toons need not eu.ink.value.set(style === "tech" ? 0x1a1a1a : 0x141414);
  fill.intensity = swap ? (style === "tech" ? 0 : 0.9) : 0; scene.background = new THREE.Color(S.style === "tech" && S.drawGround === "paper" ? 0xffffff : floorHex);      // round 99 (Okay: "svg mode should get background selection, all wiews should"): the background is every look's — the moving preview's and the Engineer style's too; white only on the Engineer's Paper
  if (groundMesh) groundMesh.visible = true; if (shadowMesh) shadowMesh.visible = style !== "tech";      // round 75: the ground shows in Drawing too, white, the shadow green on it
  renderer.toneMapping = style === "tech" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; }      // the technical sheet is paper-white, not filmic grey
let K = scene3.size; const K0 = K;      // the case scaled to the dial, as watch.js does: the dial stays its 34 mm, the CASE and STRAP grow by K so the
                            // opening (r 14.6 in case mm) lands on the dial's edge (r 17) — the dial's size does not include the rehaut (Okay, 5 Nov 2026)
const watch = new THREE.Group(); scene.add(watch);
const caseGroup = new THREE.Group(), strapGroup = new THREE.Group(); caseGroup.scale.setScalar(K); strapGroup.scale.setScalar(K); watch.add(caseGroup, strapGroup);

// ── 5 · the case ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** the body's plan outline: a point and its outward normal at angle θ, and the outline's y at a given x (for the lugs) */
function outline(C) {
  if (C.plan === "round") return { at: (th) => ({ p: [C.R * Math.cos(th), C.R * Math.sin(th)], n: [Math.cos(th), Math.sin(th)] }), yAt: (x) => Math.sqrt(Math.max(0, C.R * C.R - x * x)), xMax: C.R };
  const pt = (th) => { const c = Math.cos(th), s = Math.sin(th); return [C.a * Math.sign(c) * Math.abs(c) ** (2 / C.n), C.b * Math.sign(s) * Math.abs(s) ** (2 / C.n)]; };
  return { at: (th) => { const p = pt(th), q = pt(th + 1e-3), r = pt(th - 1e-3), tx = q[0] - r[0], ty = q[1] - r[1], l = Math.hypot(tx, ty); return { p, n: [ty / l, -tx / l] }; },
    yAt: (x) => C.b * Math.max(0, 1 - (Math.abs(x) / C.a) ** C.n) ** (1 / C.n), xMax: C.a };
}
/** the case's PLAN: body and lugs as ONE closed outline (round 32). Quadrant I is drawn piece by piece — the body arc, a
 *  concave FILLET where the lug's outer edge leaves the body, the outer edge (its flare), the tip's two rounded corners and
 *  face, the inner wall, a fillet into the body again, the body arc to 12 — and mirrored to the other three. Every station
 *  knows its kind (body | lug), its y for the lug's laws and how far along the lug it is; the skin's section is read from these.
 *  The lug's laws start at the ROOT: the y where the inner fillet meets the body — above that the lug is the body (flat top,
 *  full height); from there to the tip the top falls and the underside rises. Each lug also keeps its two edges (inner, outer)
 *  and its root arc for the top and underside patches */
function casePlan(C) {
  const R = C.R, half = C.l2l / 2, xi = C.lugw / 2, xo = xi + C.lugT, L = C.lug, rf = L.fillet, rc = Math.min(L.corner, C.lugT / 2 - 0.01), xb = Math.min(xo + (C.flare || 0), R - 0.5), yb = Math.sqrt(R * R - xb * xb);      // the lug's outer edge must leave the body inside its radius; a tip corner no wider than half the lug
  const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const seg = (p, q, n) => Array.from({ length: n + 1 }, (_, k) => [p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]);
  const bez = (t, p0, p1, p2, p3) => { const q = 1 - t; return [q * q * q * p0[0] + 3 * q * q * t * p1[0] + 3 * q * t * t * p2[0] + t * t * t * p3[0], q * q * q * p0[1] + 3 * q * q * t * p1[1] + 3 * q * t * t * p2[1] + t * t * t * p3[1]]; };
  // the outer edge: the flare's curve from the body (xb, yb) up to the tip corner's start (xo, half − rc) — watch.js lugPath's curve; a straight wall without a flare
  const P1 = [xb - 0.6, yb + 1.2], P2 = [xo, half - (half - yb) * 0.5], P3 = [xo, half - rc];
  const edge = C.flare ? Array.from({ length: 61 }, (_, k) => bez(k / 60, [xb, yb], P1, P2, P3)) : seg([xb, yb], P3, 60);
  // the OUTER FILLET: a circle of radius rf outside the body, tangent to the body and to the edge's first stretch (taken as a line)
  const d = C.flare ? [P1[0] - xb, P1[1] - yb] : [0, 1], dl = Math.hypot(...d); d[0] /= dl; d[1] /= dl; const no = [d[1], -d[0]];      // along the edge, and its outer normal
  const A = [xb + rf * no[0], yb + rf * no[1]], ad = A[0] * d[0] + A[1] * d[1], sFoot = -ad + Math.sqrt(Math.max(0, ad * ad - (A[0] * A[0] + A[1] * A[1] - (R + rf) ** 2)));
  const co = [A[0] + sFoot * d[0], A[1] + sFoot * d[1]], foot = [xb + sFoot * d[0], yb + sFoot * d[1]], col = Math.hypot(...co), tco = [co[0] * R / col, co[1] * R / col];
  // the INNER FILLET: centre (xi − rf, yc) at R + rf from the dial's axis, tangent to the wall x = xi at (xi, yc) and to the body
  const yc = Math.sqrt(Math.max(0, (R + rf) ** 2 - (xi - rf) ** 2)), ci = [xi - rf, yc], cil = Math.hypot(...ci), tci = [ci[0] * R / cil, ci[1] * R / cil];
  const yRoot = tci[1];      // the lug's laws start here
  const u = (y) => clamp((y - yRoot) / (half - yRoot), 0, 1);
  const lugTop = (y) => C.zTop - (C.zTop - L.tipTop) * ss(u(y)), lugBot = (y) => L.rootBot + (L.tipBot - L.rootBot) * ss(Math.pow(u(y), 1.3));
  const ang = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]), short = (a0, a1) => { let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; return a0 + da; };
  // quadrant I, in order, each piece tagged; a lug station's chamfer: the body's on the outer edge growing to the tip's, the tip's round the end, a small break on the inner wall
  const pieces = [];
  pieces.push(["body", arc(0, 0, R, 0, Math.atan2(tco[1], tco[0]), 40)]);
  pieces.push(["lug", arc(co[0], co[1], rf, ang(co, tco), short(ang(co, tco), ang(co, foot)), 10), "outer"]);
  pieces.push(["lug", edge.filter(([x, y]) => (x - xb) * d[0] + (y - yb) * d[1] > sFoot), "outer"]);
  pieces.push(["lug", arc(xo - rc, half - rc, rc, 0, Math.PI / 2, 8), "cornerO"]);
  pieces.push(["lug", seg([xo - rc, half], [xi + rc, half], 8), "tip"]);
  pieces.push(["lug", arc(xi + rc, half - rc, rc, Math.PI / 2, Math.PI, 8), "cornerI"]);
  pieces.push(["lug", seg([xi, half - rc], [xi, yc], 40), "inner"]);
  pieces.push(["lug", arc(ci[0], ci[1], rf, 0, short(0, ang(ci, tci)), 10), "innerFillet"]);
  pieces.push(["body", arc(0, 0, R, Math.atan2(tci[1], tci[0]), Math.PI / 2, 40)]);
  const q1 = []; for (const [kind, pts, part] of pieces) for (let k = 0; k < pts.length; k++) { if (q1.length && k === 0) continue; q1.push({ x: pts[k][0], y: pts[k][1], kind, part }); }      // pieces share their joints
  // the chamfer along the lug: outer edge and fillet by the laws; the outer corner the tip's; the tip the tip's; the inner corner from the tip's to the break; the inner wall the break; the inner fillet from the break to the body's
  const cham = (st, k, n) => { if (st.kind === "body") return C.chamfer; const t = n > 1 ? k / (n - 1) : 0;
    switch (st.part) { case "outer": return C.chamfer + (L.chamferTip - C.chamfer) * u(st.y); case "cornerO": case "tip": return L.chamferTip; case "cornerI": return L.chamferTip + (L.chamferIn - L.chamferTip) * t; case "inner": return L.chamferIn; default: return L.chamferIn + (C.chamfer - L.chamferIn) * t; } };
  { let i = 0; while (i < q1.length) { let j = i; while (j < q1.length && q1[j].part === q1[i].part && q1[j].kind === q1[i].kind) j++; for (let k = i; k < j; k++) q1[k].c = cham(q1[k], k - i, j - i); i = j; } }
  // the whole outline, counter-clockwise: Q1, Q2 (x mirrored, reversed), Q3 (both), Q4 (y mirrored, reversed); the lugs' quadrant signs ride along
  const mirror = (sx, sy, rev) => { const q = q1.map((st) => ({ ...st, x: sx * st.x, y: sy * st.y, sx, sy })); return rev ? q.reverse() : q; };
  const loop = [...mirror(1, 1, false), ...mirror(-1, 1, true).slice(1), ...mirror(-1, -1, false).slice(1), ...mirror(1, -1, true).slice(1)]; loop.pop();      // the last repeats the first
  const N = loop.length; for (let k = 0; k < N; k++) { const a = loop[(k - 1 + N) % N], b = loop[(k + 1) % N], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty); loop[k].nx = ty / l; loop[k].ny = -tx / l; }
  // each lug's edges for the top and underside patches, root → tip, and its root arc on the body between the two fillets' tangents
  const lugs = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const take = (parts) => q1.filter((st) => parts.includes(st.part)), m = (st) => ({ ...st, x: sx * st.x, y: sy * st.y });
    const inner = take(["innerFillet", "inner", "cornerI"]).reverse().map(m), outer = take(["outer", "cornerO"]).map(m);      // both end at the tip face's corners
    const a0 = Math.atan2(tco[1], tco[0]), a1 = Math.atan2(tci[1], tci[0]), rootArc = Array.from({ length: 21 }, (_, k) => { const a = a0 + (a1 - a0) * k / 20; return [sx * R * Math.cos(a), sy * R * Math.sin(a)]; });
    lugs.push({ sx, sy, inner, outer, rootArc, a0, a1 }); }
  // y of the outline in the slot between two lugs at x (the end link's inner edge): the body's circle, then the inner fillet's arc
  const yAt = (x) => { const ax = Math.abs(x); if (ax <= tci[0]) return Math.sqrt(Math.max(0, R * R - ax * ax)); if (ax >= xi) return yc; return yc - Math.sqrt(Math.max(0, rf * rf - (ax - ci[0]) ** 2)); };
  const xOut = (y) => { const ay = Math.abs(y); if (ay <= tco[1]) return Math.sqrt(Math.max(0, R * R - ay * ay)); const pts = [...q1.filter((st) => st.part === "outer")]; if (ay >= pts[pts.length - 1].y) return xo; let k = 0; while (k + 1 < pts.length && pts[k + 1].y < ay) k++; const p = pts[k], q = pts[Math.min(k + 1, pts.length - 1)]; return q.y === p.y ? p.x : p.x + (q.x - p.x) * (ay - p.y) / (q.y - p.y); };
  return { loop, lugs, yRoot, u, lugTop, lugBot, yAt, xOut, xi, xo, half, R, yEdge: Math.sqrt(R * R - xi * xi) };
}
/** a COONS PATCH: four boundary curves (bottom, top, left, right as point lists), filled by a grid; z from a law of (x, y) */
function coons(bottom, top, left, right, zOf, mat, rows, cols, flip = false) {      // flip: wind the faces the other way (a mirrored lug, an underside) so the AO pass, FrontSide, sees them
  const at = (pts, t) => { const f = t * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(f)), r = f - k; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * r, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * r]; };
  const b0 = bottom[0], b1 = bottom[bottom.length - 1], t0 = top[0], t1 = top[top.length - 1], v = [], idx = [], uv = [], tan = [];
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) { const t = i / rows, s = j / cols, B = at(bottom, s), T = at(top, s), Lf = at(left, t), Rt = at(right, t);
    const x = (1 - s) * Lf[0] + s * Rt[0] + (1 - t) * B[0] + t * T[0] - ((1 - s) * (1 - t) * b0[0] + (1 - s) * t * t0[0] + s * (1 - t) * b1[0] + s * t * t1[0]);
    const y = (1 - s) * Lf[1] + s * Rt[1] + (1 - t) * B[1] + t * T[1] - ((1 - s) * (1 - t) * b0[1] + (1 - s) * t * t0[1] + s * (1 - t) * b1[1] + s * t * t1[1]);
    v.push(...W(x, y, zOf(x, y))); uv.push(t * 4, s); }
  // the brushed grain runs along the lug (t): a tangent per vertex from the row before to the row after, as sweep() does — without it the anisotropic frame is per pixel and the top goes white (round 14)
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) { const a = (Math.max(0, i - 1) * (cols + 1) + j) * 3, b = (Math.min(rows, i + 1) * (cols + 1) + j) * 3; const T = new THREE.Vector3(v[b] - v[a], v[b + 1] - v[a + 1], v[b + 2] - v[a + 2]); if (T.lengthSq() < 1e-10) T.set(0, 0, -1); T.normalize(); tan.push(T.x, T.y, T.z, 1); }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, d = c + 1; if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("tangent", new THREE.Float32BufferAttribute(tan, 4)); g.setIndex(idx); g.computeVertexNormals();
  return mesh(g, mat);
}
function buildCase(C) {
  const g = new THREE.Group(), P = casePlan(C), half = P.half, xi = P.xi, xo = P.xo, L = C.lug, R = C.R;
  // the caseback: a polished dish under the body, out to the body's edge (the lugs' undersides meet it there)
  g.add(mesh(lathe([[0, 0], [R - 2.6, 0], [R - 1.0, 0.9], [R, C.zBand]]), MATERIALS.polished()));
  // the SKIN: one section carried round the whole outline, body and lugs alike — up from the underside with a belly, then the
  // chamfer in to the top. On the body: zBand to zTop, the body's chamfer. On a lug: the laws by y, the station's own chamfer,
  // the belly fading to the tip. One surface, so the chamfer is one unbroken line round the case and the lug grows out of the body
  { const ZS = 7, stations = [], loop = P.loop;
    for (let k = 0; k <= loop.length; k++) { const st = loop[k % loop.length], body = st.kind === "body", zb = body ? C.zBand : P.lugBot(Math.abs(st.y)), zt = body ? C.zTop : P.lugTop(Math.abs(st.y)), c = st.c, bw = body ? 1 : 1 - P.u(Math.abs(st.y)), H = zt - zb, pts = [];
      for (let j = 0; j <= ZS; j++) { const z = zb + (H - c) * j / ZS, dd = bw * C.belly * Math.sin(Math.PI * (z - zb) / H); pts.push(W(st.x + st.nx * dd, st.y + st.ny * dd, z)); }
      pts.push(W(st.x - st.nx * c, st.y - st.ny * c, zt)); stations.push(pts); }
    const mats = Array(ZS).fill(C.flank === "polished" ? 0 : 1).concat([0]);
    g.add(mesh(sweep(stations, mats, { closeSection: false }), PB())); }
  // the TOP: brushed, in pieces that share their edges — a flat sector of the body between each pair of lugs (less the bezel's
  // seat), and over each lug a Coons patch from the bezel's seat out to the lug's tip, its sides the lug's edges inset by the
  // chamfer, its height the lug's law (flat on the body, falling along the lug)
  const inset = (pts) => pts.map((st) => [st.x - st.nx * st.c, st.y - st.ny * st.c]), ri = R - C.bezel.inset - C.bezel.width, rt = R - C.chamfer;      // the top plates reach in to the ring's inner radius (the seat)
  const nrm = (st) => { const k = P.loop.indexOf(P.loop.find((q) => q.x === st.x && q.y === st.y)); return P.loop[k]; };
  for (const lug of P.lugs) { const inner = inset(lug.inner.map(nrm)), outer = inset(lug.outer.map(nrm)), { sx, sy, a0, a1 } = lug;
    const radial = (a, r0, r1, n) => Array.from({ length: n + 1 }, (_, k) => { const r = r0 + (r1 - r0) * k / n; return [sx * r * Math.cos(a), sy * r * Math.sin(a)]; });
    const bottom = Array.from({ length: 13 }, (_, k) => { const a = a0 + (a1 - a0) * k / 12; return [sx * ri * Math.cos(a), sy * ri * Math.sin(a)]; });      // the seat's arc, a0 → a1
    const right = [...radial(a0, ri, rt, 12), ...outer.slice(1)], left = [...radial(a1, ri, rt, 12), ...inner.slice(1)];      // a0 side: the outer edge; a1 side: the inner edge
    const top = [outer[outer.length - 1], inner[inner.length - 1]];      // the tip face, inset
    g.add(coons(bottom, top, right, left, (x, y) => P.lugTop(Math.abs(y)), MATERIALS.brushed(), 48, 10, sx * sy < 0));
    // the UNDERSIDE of the lug: from the root arc on the body's edge to the tip, the outline itself as its sides, rising by the law
    const outerU = lug.outer.map((st) => [st.x, st.y]), innerU = lug.inner.map((st) => [st.x, st.y]);
    g.add(coons(lug.rootArc, [outerU[outerU.length - 1], innerU[innerU.length - 1]], outerU, innerU, (x, y) => P.lugBot(Math.abs(y)), MATERIALS.brushed(), 24, 6, sx * sy > 0)); }
  // the body's sectors between the lugs: from the seat to the top's edge; between a1 of one lug and a0 of the next, round the dial
  { const spans = [[P.lugs.find((l) => l.sx === 1 && l.sy === 1), P.lugs.find((l) => l.sx === -1 && l.sy === 1)], [P.lugs.find((l) => l.sx === -1 && l.sy === 1), P.lugs.find((l) => l.sx === -1 && l.sy === -1)], [P.lugs.find((l) => l.sx === -1 && l.sy === -1), P.lugs.find((l) => l.sx === 1 && l.sy === -1)], [P.lugs.find((l) => l.sx === 1 && l.sy === -1), P.lugs.find((l) => l.sx === 1 && l.sy === 1)]];
    const angOf = (l, a) => Math.atan2(l.sy * Math.sin(a), l.sx * Math.cos(a));
    for (const [from, to] of spans) { let b0 = angOf(from, from.a1), b1 = angOf(to, to.a0); while (b1 <= b0) b1 += 2 * Math.PI;
      const sh = new THREE.Shape(); sh.absarc(0, 0, rt, b0, b1, false); sh.absarc(0, 0, ri, b1, b0, true); sh.closePath();
      const m = mesh(new THREE.ShapeGeometry(sh, 24), MATERIALS.brushed()); m.rotation.x = -Math.PI / 2; m.position.y = C.zTop - DIAL_Z; g.add(m); } }
  // the drilled hole: a dark dot in the outer flank with a bright rim, on the belly
  const yHole = half - L.holeIn, holeZ = (P.lugTop(yHole) + P.lugBot(yHole)) / 2;
  for (const lug of P.lugs) { const { sx, sy } = lug, zb = P.lugBot(yHole), zt = P.lugTop(yHole), dd = (1 - P.u(yHole)) * C.belly * Math.sin(Math.PI * (holeZ - zb) / (zt - zb));
    const hole = new THREE.Group(); hole.add(mesh(new THREE.CircleGeometry(0.42, 24), MATERIALS.dark(), false), mesh(new THREE.RingGeometry(0.42, 0.52, 24), MATERIALS.polished(), false));
    hole.position.set(...W(sx * (P.xOut(yHole) + dd + 0.015), sy * yHole, holeZ)); hole.rotation.y = sx * Math.PI / 2; g.add(hole); }
  const lugTop = P.lugTop, lugBot = P.lugBot, xOut = P.xOut, yEdge = P.yEdge, O = { yAt: P.yAt, at: outline(C).at };
  buildBezel(C, g);
  // the crown: a profile spun round its stem, fluted, chamfered, domed; on its tube out of the body at `at` degrees
  // the profile, r against length along the stem: a SHOULDER (a collar r 2.1, 0.5 long) where the tube leaves the case, the
  // tube r 1.5 to the body, the body with its chamfered rim, then a DOME 0.95 high in three arcs (ref-24: fuller than a cap)
  { const K_ = C.crown, top = 1.1 + K_.h, R = K_.w / 2, pts = [[0, 0], [2.1, 0], [2.1, 0.5], [1.5, 0.5], [1.5, 1.1], [R, 1.1], [R, top - 0.45], [R - 0.45, top], [R - 1.0, top + 0.45], [R - 2.0, top + 0.8], [0, top + 0.95]];
    const geo = new THREE.LatheGeometry(pts.map(([r, l]) => new THREE.Vector2(r, l)), 288), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), l = pos.getY(i), r = Math.hypot(x, z); if (r < K_.w / 2 - 0.01 || l < 1.3 || l > 1.1 + K_.h - 0.3) continue;
      const f = Math.abs(((Math.atan2(z, x) * K_.flutes / (2 * Math.PI)) % 1 + 1) % 1 - 0.5), d = 0.28 * Math.max(0, 1 - (f / 0.28) ** 2), k = (r - d) / r; pos.setX(i, x * k); pos.setZ(i, z * k); }      // flutes: half-round grooves, flat lands between
    geo.computeVertexNormals(); geo.rotateZ(-Math.PI / 2);      // the stem along +x
    const { p } = O.at(rad(K_.at)), m = mesh(geo, MATERIALS.polished()); m.position.set(...W(p[0] - 0.4 * Math.cos(rad(K_.at)), p[1] - 0.4 * Math.sin(rad(K_.at)), K_.z)); m.rotation.y = rad(K_.at); g.add(m); }
  return { group: g, xi, xo, half, yEdge, lugTop, lugBot, xOut, holeZ, tipH: lugTop(half) - lugBot(half), yAt: O.yAt, lug: C.lug };
}
/** the insert's markings as the reference's: numerals, long marks at the fives, a dot a minute, the triangle with its lume dot — a picture on a ring */
/** the BEZEL STACK from the spec's named numbers (round 34): the rehaut's wall, the ring, the coin edge, the insert (kind "insert") or a
 *  closed top (kind "plain"), the crystal. Every height hangs off the band top (C.zTop), every radius off the body's (C.R) — so the
 *  case's sliders move the whole stack with them. The opening is the dial's edge (scene3's 17 mm over K): the rehaut starts there */
function buildBezel(C, g) {
  const B = C.bezel, r1 = C.R - B.inset, r0 = r1 - B.width, z0 = C.zTop + B.seat, z1 = z0 + B.h, open = scene3.open ?? 14.6, ch = B.chamfer;
  // the rehaut: a polished wall up from the dial's face, sloping out to a flange under the ring's top
  g.add(mesh(lathe([[open, DIAL_Z], [open + 0.6, z1 - B.lip], [r0 - 0.2, z1 - B.lip + 0.15], [r0, z1 - B.lip + 0.15], [r0, z0], [open, Math.min(z0, DIAL_Z)]]), MATERIALS.polished()));      // a sunk dial (round 88): the wall's foot follows it down
  if (B.kind === "rotating") {
    // the ring with a recess for the insert: up the outer wall, the chamfer to the lip, in across the lip, down into the recess, its floor at z1, up its inner wall, the inner lip, down to the rehaut's flange
    const ri = r0 + B.inIn, ro = r1 - B.inOut, lip = z1 + B.lip;
    g.add(mesh(lathe([[r0, z0], [r1, z0], [r1, z1], [r1 - ch, lip], [ro, lip], [ro, z1], [ri, z1], [ri, lip - 0.05], [ri - 0.2, lip], [ri - 0.3, z1 - 0.3], [r0, z1 - 0.3]]), MATERIALS.brushed()));
    g.add(insertRing(ri, ro, z1 + 0.5));
  } else {
    // a plain bezel: the ring closed over the top, its top a gentle slope from the chamfer in to the crystal's rim
    const rim = r0 - B.rim;
    g.add(mesh(lathe([[r0, z0], [r1, z0], [r1, z1], [r1 - ch, z1 + ch], [rim + 0.3, z1 + B.lip], [rim, z1 + B.lip - 0.15], [rim, z1 - 0.3], [r0, z1 - 0.3]]), MATERIALS.polished())); }
  // the COIN EDGE (a rotating bezel's grip), machined: the ring's outer wall is one surface whose radius is a law of the angle — full on the lands, a round scallop (a circle of radius rd, `depth` deep, `fill` of the pitch wide) cut into each pitch (Okay: "machined out of metal, round divots")
  if (B.kind === "rotating") { const T = B.teeth, R = r1 + T.depth, tch = T.chamfer, pitch = 2 * Math.PI / T.n, a = R * pitch * T.fill / 2, rd = (a * a + T.depth * T.depth) / (2 * T.depth);
    const rAt = T.depth <= 0 ? () => R : (th) => { const x = R * ((th % pitch + pitch) % pitch - pitch / 2); return Math.abs(x) < a ? R - (Math.sqrt(rd * rd - x * x) - (rd - T.depth)) : R; };      // depth 0: a plain wall, no scallops
    const per = 28, N = T.n * per, stations = [];      // 28 stations a pitch: the scallop's rim lands on a station, so it stays a crisp edge
    for (let k = 0; k <= N; k++) { const th = k / N * 2 * Math.PI, r = rAt(th), c = Math.cos(th), sn = Math.sin(th), P = (rr, z) => W(rr * c, rr * sn, z);
      const ch = Math.min(tch, r - (r1 - 0.05) - 0.03);      // round 60: at a scallop's bottom the wall is already `depth` in, so a full chamfer would land INSIDE the ring's top edge and the top strip folded over itself (the triangular patches on every tooth); the chamfer narrows where the scallop is deep
      stations.push([P(r1 - 0.05, z0), P(r, z0), P(r, z1 - ch), P(r - ch, z1), P(r1 - 0.05, z1)]); }      // the wall's section: seat · outer wall · top chamfer · top, closed back to the ring
    g.add(mesh(sweep(stations, [0, 0, 0, 0, 0]), MATERIALS.polished())); }
  // the CRYSTAL: a disc sitting in the ring's mouth, its rim `rim` in from the ring's inner radius, `up` over the ring's top, a gentle dome `dome` high in four arcs
  { const rim = r0 - B.rim, zb = z1 - CRYSTAL_SEAT, zr = z1 + B.up, zt = zr + B.dome, d = zt - zr;
    g.add(mesh(lathe([[0, zb], [rim, zb], [rim, zr], [rim - 0.1, zr + 0.26 * d], [rim - 0.4, zr + 0.44 * d], [rim - 0.9, zr + 0.56 * d], [rim - 1.5, zr + 0.59 * d], [rim * 0.69, zr + 0.74 * d], [rim * 0.44, zr + 0.89 * d], [rim * 0.22, zr + 0.98 * d], [0, zt]]), MATERIALS.sapphire(), false)); g.children[g.children.length - 1].material.side = THREE.FrontSide; }      // round 46: front faces only — mesh() had made it DoubleSide, and a closed dome drawn twice through itself blurs and darkens what is under it
}
function insertRing(ri, ro, zTop) {
  const n = 2048, px = n / (2 * ro), c = document.createElement("canvas"); c.width = c.height = n; const x = c.getContext("2d");
  x.fillStyle = scene3.insert.top; x.fillRect(0, 0, n, n); x.setTransform(px, 0, 0, -px, n / 2, n / 2);
  const at = (m, r) => [Math.sin(m * 6 * Math.PI / 180) * r, Math.cos(m * 6 * Math.PI / 180) * r];
  x.fillStyle = "#e8e5dc"; x.strokeStyle = "#e8e5dc"; x.lineCap = "round";
  for (let m = 1; m < 60; m++) { if (m % 10 === 0) continue; const [X, Y] = at(m, (ri + ro) / 2 + 0.25); x.beginPath(); x.arc(X, Y, m % 5 ? 0.09 : 0.16, 0, 2 * Math.PI); x.fill(); }
  for (let m = 5; m < 60; m += 10) { const [a, b] = at(m, ri + 0.45), [c2, d] = at(m, ro - 0.35); x.lineWidth = 0.28; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); }
  x.setTransform(1, 0, 0, 1, 0, 0); x.font = `bold ${Math.round(1.75 * px)}px "Helvetica Neue", Arial, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
  for (let m = 10; m < 60; m += 10) { const [X, Y] = at(m, (ri + ro) / 2 + 0.05); x.save(); x.translate(n / 2 + X * px, n / 2 - Y * px); x.rotate((m * 6 + (m >= 20 && m <= 40 ? 180 : 0)) * Math.PI / 180); x.scale(0.82, 1); x.fillText(String(m), 0, 0.08 * px); x.restore(); }
  x.setTransform(px, 0, 0, -px, n / 2, n / 2);
  { const [X, Y] = at(0, ro - 0.35); x.beginPath(); x.moveTo(X, Y); x.lineTo(-1.35, ri + 0.5); x.lineTo(1.35, ri + 0.5); x.closePath(); x.fill(); x.fillStyle = "#d8ebc8"; x.beginPath(); x.arc(0, (ri + ro) / 2 + 0.1, 0.42, 0, 2 * Math.PI); x.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.RingGeometry(ri, ro, 256), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.45, metalness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = zTop - 0.04 - DIAL_Z; return m;
}
function mergeGeometries(geos) { const v = [], idx = []; let off = 0; for (const g of geos) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) v.push(p.getX(i), p.getY(i), p.getZ(i)); const ix = g.index; if (ix) for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off); else for (let i = 0; i < p.count; i++) idx.push(i + off); off += p.count; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }

let groundMesh, shadowMesh;      // the table and the contact shadow, placed under the caseback at each rebuild (placeGround)
// ── 6 · the bracelet ───────────────────────────────────────────────────────────────────────────────────────────────────
/** one link: a section (across x, up y) carried along the link (z), its ends rounding to a half-round of the link's
 *  thickness so it can hinge; `out` says which side faces the bracelet's edge (±1) or none (0). Materials per edge */
function link(sec, w, l, h, out, finish) {
  let pts, mats;      // the section walked clockwise from the bottom-left; mats per edge: 0 polished · 1 brushed
  if (sec === "slab") { const c = out ? 0.45 : 0.12, cl = out < 0 ? c : 0.12, cr = out > 0 ? c : 0.12;      // one bright bevel on the outer top edge; a hairline on the rest
    pts = [[-w / 2, -h / 2], [-w / 2, h / 2 - cl], [-w / 2 + cl, h / 2], [w / 2 - cr, h / 2], [w / 2, h / 2 - cr], [w / 2, -h / 2]]; mats = [1, 0, 1, 0, 1, 1]; }
  else if (sec === "barn") { const s = Math.min(0.8, h * 0.28);      // a house: flat top, 45° shoulders, vertical flanks
    pts = [[-w / 2, -h / 2], [-w / 2, h / 2 - s], [-w / 2 + s, h / 2], [w / 2 - s, h / 2], [w / 2, h / 2 - s], [w / 2, -h / 2]]; mats = [1, 0, 1, 0, 1, 1]; }
  else if (sec === "bean") { const r = Math.min(0.5, h * 0.2), arc = (cx, cy, a0, a1) => Array.from({ length: 4 }, (_, i) => [cx + r * Math.cos(a0 + (a1 - a0) * i / 3), cy + r * Math.sin(a0 + (a1 - a0) * i / 3)]);      // rounded corners, flat polished flanks
    pts = [...arc(-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5).reverse(), ...arc(-w / 2 + r, h / 2 - r, Math.PI, Math.PI / 2).reverse(), ...arc(w / 2 - r, h / 2 - r, Math.PI / 2, 0).reverse(), ...arc(w / 2 - r, -h / 2 + r, 0, -Math.PI / 2).reverse()];
    pts = [[-w / 2, -h / 2 + r], [-w / 2, h / 2 - r], [-w / 2 + r, h / 2], [w / 2 - r, h / 2], [w / 2, h / 2 - r], [w / 2, -h / 2 + r], [w / 2 - r, -h / 2], [-w / 2 + r, -h / 2]]; mats = [0, 1, 1, 1, 0, 1, 1, 1]; }
  else { pts = Array.from({ length: 20 }, (_, i) => [w / 2 * Math.cos(i / 20 * 2 * Math.PI + Math.PI), h / 2 * Math.sin(i / 20 * 2 * Math.PI + Math.PI)]); mats = Array(20).fill(0); }      // barrel: round, polished
  if (finish === "polished") mats = mats.map(() => 0);      // a column's finish from the bracelet's table (the Sub's centre links are polished; the goal's are not)
  // the outermost links' outer flank is CONVEX (ref-15, ref-18): the flat wall at x = ±w/2 becomes a bow of BULGE mm, in four strips
  const BULGE = 0.2;
  if (out && sec !== "barrel") { const M = 3, X = out * w / 2, i = pts.findIndex((p, j) => p[0] === X && pts[(j + 1) % pts.length][0] === X), j = (i + 1) % pts.length;
    const [y0, y1] = [pts[i][1], pts[j][1]], bow = Array.from({ length: M }, (_, k) => { const t = (k + 1) / (M + 1); return [X + out * BULGE * Math.sin(Math.PI * t), y0 + (y1 - y0) * t]; });
    pts.splice(i + 1, 0, ...bow); mats.splice(i + 1, 0, ...Array(M).fill(mats[i])); }
  const r = h / 2, N = 28, stations = [];
  for (let k = 0; k <= N; k++) { const t = k / N, z = -l / 2 + l * t, e = Math.abs(z) - (l / 2 - r), kz = e > 0 ? Math.max(0.03, Math.sqrt(Math.max(0, r * r - e * e)) / r) : 1;      // the end rounding: the section shrinks to the stadium's circle
    stations.push(pts.map(([x, y]) => [x, y * kz + (y > 0 ? 0.06 * (1 - (2 * x / w) ** 2) : 0), z])); }      // a hair of pillow on the top
  const m = mesh(sweep(stations, mats), PB());
  if (out && sec !== "barrel") for (const z of [-(l / 2 - r), l / 2 - r]) { const s = new THREE.Group(); s.add(mesh(new THREE.CircleGeometry(0.48, 20), MATERIALS.polished(), false), mesh(new THREE.RingGeometry(0.48, 0.56, 20), MATERIALS.dark(), false)); s.position.set(out * (w / 2 + BULGE + 0.005), 0, z); s.rotation.y = out * Math.PI / 2; m.add(s); }      // the screw heads on the outer flank
  return m;
}
/** the chain: pins on the bracelet's curve from the spring bar down to the table; every link spans two pins and tilts by
 *  the line between them; the end link between the lugs, following the lug's top, its nose a half-round */
function buildBracelet(Bk, info) {
  const g = new THREE.Group(), B = BRACELETS[Bk], W0 = 2 * info.xi - 0.3, H0 = info.tipH, LEN = 70, yStart = info.yEdge + 0.1, END = info.half - 0.3 - yStart;
  const lerp = (a, b, s) => a + (b - a) * clamp(s / LEN, 0, 1), widthAt = (s) => lerp(W0, B.W1, s), thickAt = (s) => lerp(H0, B.H1, s), pitchAt = (s) => lerp(B.P0, B.P1, s);
  const BEND = 18, zAt = (s) => { const t = clamp((s - 6) / BEND, 0, 1), e = t * t * (3 - 2 * t); return info.holeZ * (1 - e) + thickAt(s) / 2 * e; };      // the pins: level past the lugs, then down over the bend onto the table
  const pinAt = (s) => new THREE.Vector3(0, zAt(s) - DIAL_Z, -(yStart + s));
  const span = (sy, s0, s1, w, x, sec, out, finish) => { const a = pinAt(s0), b = pinAt(s1), mid = a.clone().add(b).multiplyScalar(0.5), d = b.clone().sub(a), h = thickAt((s0 + s1) / 2);
    const m = link(sec, w, d.length() - B.gap, h, out, finish), gg = new THREE.Group(); gg.add(m); m.position.set(x, (h - H0) / 2, 0);      // tops level, undersides rising as the bracelet thins
    gg.position.set(0, mid.y, sy * mid.z); gg.rotation.x = sy * Math.atan2(d.y, -d.z); g.add(gg); };
  const xs = (w) => { const total = B.columns.reduce((a, c) => a + c[0], 0), gaps = B.gapx * (B.columns.length - 1), out = []; let x = -w / 2; for (const c of B.columns) { const cw = (w - gaps) * c[0] / total; out.push([x + cw / 2, cw]); x += cw + B.gapx; } return out; };
  for (const sy of [-1, 1]) {
    // the end link: swept across its width — inner edge the body's outline, nose a half-round, top following the lugs 0.35 under
    // the top follows the lugs' law up to the spring bar and is level beyond it — blended over 1.5 mm (round 60: a hard min() put a
    // 35–55° kink across the whole top, which the SVG drew as a line); 16 segments along it where 6 showed as facets
    { const M = 24, stations = [], zBot = info.holeZ - H0 / 2, yBar = info.half - (info.lug?.holeIn ?? 0), topAt = (y) => { const u = ss((y - yBar + 0.75) / 1.5); return info.lugTop(y + (yBar - y) * u) - 0.35; }, yOut = yStart + END;
      for (let k = 0; k <= M; k++) { const x = -W0 / 2 + W0 * k / M, yIn = info.yAt(x) + 0.1; let r = (topAt(yOut) - zBot) / 2, tOut = topAt(yOut - r); for (let it = 0; it < 6; it++) { r = (tOut - zBot) / 2; tOut = topAt(yOut - r); } const zc = zBot + r, pts = [];      // the nose's apex is at y = yOut − r, so its height is the top's THERE (round 60: taken at yOut, the tip end, it sat 0.2 mm lower than the top it met — a 67° step the SVG drew as a line); r depends on it: a few turns to the fixed point
        const P = (y, z) => W(x, sy * y, z); pts.push(P(yIn, zBot), P(yOut - r, zBot));
        for (let j = 1; j < 8; j++) { const a = -Math.PI / 2 + Math.PI * j / 8; pts.push(P(yOut - r + r * Math.cos(a), zc + r * Math.sin(a))); }
        pts.push(P(yOut - r, tOut)); for (let j = 1; j <= 16; j++) { const y = yOut - r - (yOut - r - yIn) * j / 16; pts.push(P(y, topAt(y))); } stations.push(pts); }
      g.add(mesh(sweep(stations, [1, ...Array(8).fill(0), ...Array(16).fill(1), 0], { closeSection: true, caps: true }), PB())); }
    const cols = xs(widthAt(END)); for (const [i, c] of B.columns.entries()) if (c[3]) span(sy, END - pitchAt(END) / 2, END + pitchAt(END) / 2, cols[i][1], cols[i][0], c[1], c[2], c[4]);      // the offset columns' first half-links, from inside the end link
    for (let s0 = END; s0 < LEN; ) { const P = pitchAt(s0), Pn = pitchAt(s0 + P), cs = xs(widthAt(s0 + P / 2));
      for (const [i, c] of B.columns.entries()) { if (c[3]) span(sy, s0 + P / 2, s0 + P + Pn / 2, cs[i][1], cs[i][0], c[1], c[2], c[4]); else span(sy, s0, s0 + P, cs[i][1], cs[i][0], c[1], c[2], c[4]); }
      s0 += P; } }
  return g;
}
/** a leather strap after ref-29: a FLAT BAND with a slight pillow on top, square burnished edges, the lug end cut square and
 *  filling the gap flush (its top a hair under the lug tops at the bar, ref-33), level to the lug tips then falling onto the
 *  table on the bracelet's curve; tapering 20 → 16. Section × path × finish: top leather · edges burnished · underside lining */
const STRAP = { T: 2.8, W1: 16, pillow: 0.25, edgeR: 0.3, LEN: 68, gap: 0.8, fold: 0.9, foldW: 2.2, keeper: { kw: 6, kt: 1.3, kr: 0.45, clear: 0.15 } };      // gap: the end stops short of the body's furthest point (the circle reaches 2.5 mm further at the strap's middle than at the lug root); fold: the swell round the spring bar (mm) and its half-width
function buildLeather(info) {
  const g = new THREE.Group(), W0 = 2 * info.xi - 0.3, { T, W1, pillow, edgeR: r, LEN, gap, fold, foldW } = STRAP, yStart = info.yEdge + 0.1, END = info.half - yStart, sBar = END - info.lug.holeIn;
  const thickAt = (s) => T + fold * Math.exp(-(((s - sBar) / foldW) ** 2));      // the FOLD: the strap wraps the spring bar, so it swells round it (ref-32, ref-33) and thins to the band
  const zAt = (s) => { const t = clamp((s - END - 2) / 18, 0, 1), e = t * t * (3 - 2 * t); return info.holeZ * (1 - e) + T / 2 * e; };      // the band's middle: on the spring bar past the tips, then an S down to the table
  // the section at width w, walked from the bottom-left: underside · right edge · corner · top (right to left, pillowed) · corner · left edge
  const section = (w, T) => { const pts = [], mats = [], put = (x, dz, m) => { pts.push([x, dz]); mats.push(m); };      // m = the finish of the edge that STARTS at this point: 0 leather · 1 edge · 2 lining
    put(-w / 2, -T / 2, 2); put(w / 2, -T / 2, 1); put(w / 2, T / 2 - r, 1);
    for (let j = 1; j <= 2; j++) { const a = j / 3 * Math.PI / 2; put(w / 2 - r + r * Math.cos(a), T / 2 - r + r * Math.sin(a), 1); }
    for (let j = 0; j <= 6; j++) { const x = (w / 2 - r) * (1 - 2 * j / 6); put(x, T / 2 + pillow * (1 - (2 * x / w) ** 2), j < 6 ? 0 : 1); }
    for (let j = 1; j <= 2; j++) { const a = Math.PI / 2 + j / 3 * Math.PI / 2; put(-w / 2 + r + r * Math.cos(a), T / 2 - r + r * Math.sin(a), 1); }
    put(-w / 2, T / 2 - r, 1); return { pts, mats }; };
  for (const sy of [-1, 1]) { const N = 48, stations = []; let mats;
    const s0 = info.yAt(0) + gap - yStart;      // the end: past the body's curve at x = 0 — two objects, never one inside the other
    for (let k = 0; k <= N; k++) { const s = s0 + (LEN - s0) * k / N, w = W0 + (W1 - W0) * s / LEN, z = zAt(s), sec = section(w, thickAt(s)); mats = sec.mats;
      stations.push(sec.pts.map(([x, dz]) => W(x, sy * (yStart + s), z + dz))); }
    g.add(mesh(sweep(stations, [...mats, 1], { caps: true }), [MATERIALS.leather(), MATERIALS.edge(), MATERIALS.lining()]));      // both cut ends show the burnished edge
    // KEEPERS on the buckle's end (6 o'clock): a leather loop hugging the strap — its path a stadium round the strap's section
    // (semicircular ends, the loop curving over the edges, ref-34), its section a small rounded strip; one fixed, one floating
    if (sy < 0) for (const s of [LEN - 8, LEN - 18]) g.add(keeper(s)); }
  function keeper(s) { const { kw, kt, kr, clear } = STRAP.keeper, w = W0 + (W1 - W0) * s / LEN, T_ = thickAt(s), a = w / 2 + clear + kt / 2, b = T_ / 2 + clear + kt / 2;      // a, b: the loop centreline's half-extents; b is also the end's radius
    const M = 56, stations = [], path = (t) => {      // around the stadium: top (right to left), left semicircle, bottom, right semicircle — point and outward normal
      const L = 2 * (a - b), C = Math.PI * b, P = 2 * L + 2 * C, d = t * P;
      if (d < L) return { p: [a - b - d, b], n: [0, 1] };
      if (d < L + C) { const th = Math.PI / 2 + (d - L) / b; return { p: [-(a - b) + b * Math.cos(th), b * Math.sin(th)], n: [Math.cos(th), Math.sin(th)] }; }
      if (d < 2 * L + C) return { p: [-(a - b) + (d - L - C), -b], n: [0, -1] };
      const th = -Math.PI / 2 + (d - 2 * L - C) / b; return { p: [(a - b) + b * Math.cos(th), b * Math.sin(th)], n: [Math.cos(th), Math.sin(th)] }; };
    const sec = [], mats = [];      // the strip's section in (u along the strap, v outward): a rounded rectangle kw × kt, corner kr; the two cut sides burnished
    const corner = (cx, cv, a0, k) => { for (let j = 0; j <= 2; j++) { const th = a0 + j / 2 * Math.PI / 2; sec.push([cx + kr * Math.cos(th), cv + kr * Math.sin(th)]); mats.push(k); } };
    corner(kw / 2 - kr, kt / 2 - kr, 0, 0); corner(-kw / 2 + kr, kt / 2 - kr, Math.PI / 2, 1); corner(-kw / 2 + kr, -kt / 2 + kr, Math.PI, 2); corner(kw / 2 - kr, -kt / 2 + kr, -Math.PI / 2, 1);
    for (let k = 0; k <= M; k++) { const { p, n } = path(k / M); stations.push(sec.map(([u, v]) => W(p[0] + n[0] * v, -(yStart + s) + u, zAt(s) + p[1] + n[1] * v))); }
    return mesh(sweep(stations, mats), [MATERIALS.leather(), MATERIALS.edge(), MATERIALS.lining()]); }
  return g;
}

// ── 7 · the dial: the plate a sunburst under a lacquer, the markers applied at their ink heights, the hands pulled up ──
const dialGroup = new THREE.Group(); watch.add(dialGroup);
// THE MOVEMENT (rounds 87, 88; Okay, 10 Nov 2026: "Amazing. Implement." · "Both, as a switch" · "i imagine you have slots, or a
// system for values about various movement types. If one was to find them and list them, you can adjust"). `HAND.move` "dial"
// stands every hand where the dial says; a movement's id stands the hour, minute and seconds hands and the cap at that
// movement's heights (mm over the dial's face) and makes each hand as thick as its maker prints (the slider's thickness where
// it prints none). The movements are NOT written here: `MOVES` is filled from movements.js beside the page — Dial Tool's own
// file, written from the one record (docs/research/movements.json; engine-build.mjs copies it). Any other hand keeps the dial's
// height. The room from the top of the stack to the crystal where a movement prints none: the stack's `clear`
// THE STACK'S RULES are Dial Tool's (Okay, 11 Nov 2026: "the rules in dial tool and 3d should be synced, caps for hands, hand
// thicknesses etc can also be decided from dial tool"): parts.js beside the page — the tool's own file, copied by engine-build.mjs —
// says how thick a hand and the cap are, a boss's step, a hand's pipe, the room to the crystal; a dial's file says the same (`data-stack`)
let STACK = PARTS.STACK;
const MOVES = {}, CRYSTAL_SEAT = 0.35;      // CRYSTAL_SEAT: the crystal's underside lies this far under the ring's top
const HAND = { t: null, move: "dial", fit: null };      // t: the Hand thickness slider's, once moved (null: the dial's); fit: the tool's hand holes, with the record
// a hand's thickness: its movement's where the maker prints one, else the Hand thickness slider once moved, else the dial's (Dial Tool's)
const handT = (hand) => MOVES[HAND.move]?.hand_t?.[hand] ?? HAND.t ?? scene3.items.find((it) => it.role === "hand" && it.hand === hand)?.t ?? STACK.hand_t;
// AN APPLIED PART (parts.js's make "applied": an index or a logo set on the plate — nothing in the tool makes one yet): a solid of its own
// height, its top edge cut by its section — flat a hair, a ridge or faceted a 45° chamfer of 0.4 × its height, domed a rounded 0.6
const APPLIED_BEVEL = (section, h) => section === "flat" ? Math.min(0.03, h * 0.2) : section === "domed" ? h * 0.6 / 2 : h * 0.4 / 2;
function buildDial() {
  dialGroup.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); for (const m of [].concat(o.material)) { m.map?.dispose(); m.anisotropyMap?.dispose(); m.dispose(); } } }); dialGroup.clear();
const loader = new SVGLoader(), shapesOf = (d) => loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths.flatMap((p) => SVGLoader.createShapes(p));
// THE WINDOWS (round 85; Okay, 10 Nov 2026: "Now we need the windows on the dial"). A window is a hole through the plate with a disc
// under it. The plate is a solid as thick as the deepest window, its outline and holes the plate's own path (the tool cuts the
// windows out of it), its top the plate's picture, its hole walls the plate's colour. Each window's disc is a flat piece the shape of
// its opening, lying `under` mm below the plate's face (the tool's Shadows pane: a disc's depth; 0.15 where a dial does not say),
// with what the window shows — the date, a moon — painted on it. A flat print on the plate (a guessed file's bands) stays in the picture
{ const D = scene3.d, PX = 64, n = Math.ceil(D * PX), WINDOW_UNDER = 0.15, canvasOf = () => { const c = document.createElement("canvas"); c.width = c.height = n; const x = c.getContext("2d"); x.setTransform(PX, 0, 0, -PX, n / 2, n / 2); return [c, x]; };
  const [c, x] = canvasOf(), [cu, xu] = canvasOf(), wins = scene3.items.filter((it) => it.role === "date disc" && !it.print), plateIt = scene3.items.find((it) => it.role === "plate");
  for (const it of scene3.items) { const on = it.role === "plate" || it.print ? x : it.role === "date disc" || it.role === "date number" ? xu : null; if (on) { on.fillStyle = it.f; on.globalAlpha = it.a; on.fill(new Path2D(it.p), "nonzero"); } }
  const pictured = (geo) => { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / D + 0.5, p.getY(i) / D + 0.5); return geo; };      // a point of the dial → its place in the dial's picture
  const a = document.createElement("canvas"); a.width = a.height = 512; const ax = a.getContext("2d"), img = ax.createImageData(512, 512);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const dx = i - 256, dy = 256 - j, l = Math.hypot(dx, dy) || 1, k = 4 * (j * 512 + i); img.data[k] = 128 + 127 * dx / l; img.data[k + 1] = 128 + 127 * dy / l; img.data[k + 2] = 255; img.data[k + 3] = 255; }
  ax.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const top = new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.45, roughness: 0.5, anisotropy: 1, anisotropyMap: new THREE.CanvasTexture(a), clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const deep = wins.length && plateIt ? Math.max(...wins.map((it) => it.under ?? WINDOW_UNDER)) : 0; let plate;
  if (deep) { const geo = new THREE.ExtrudeGeometry(shapesOf(plateIt.p), { depth: deep, bevelEnabled: false, curveSegments: 48 }); geo.translate(0, 0, -deep);      // the solid's top at the plate's face
    plate = new THREE.Mesh(pictured(geo), [top, MATERIALS.paint(plateIt.f)]); plate.castShadow = true;
    const texU = new THREE.CanvasTexture(cu); texU.colorSpace = THREE.SRGBColorSpace; texU.anisotropy = 8;
    // under each window A RING OF ITS OWN (round 86; Okay: "the rings underneath should be lower, a seperate ring underneath"): what
    // turns under a window is a ring round the dial's centre, not a patch the opening's shape — it reaches `RING_MORE` past the
    // opening on both sides, so it is seen going on under the plate's edge. It lies `under` below the plate's face (the tool's number)
    const RING_MORE = 1.0;
    for (const it of wins) { const rr = shapesOf(it.p).flatMap((sh) => sh.getPoints(16)).map((v) => Math.hypot(v.x, v.y)), r0 = Math.max(0, Math.min(...rr) - RING_MORE), r1 = Math.min(D / 2, Math.max(...rr) + RING_MORE);
      xu.globalAlpha = 1; xu.fillStyle = it.f; xu.beginPath(); xu.arc(0, 0, r1, 0, 7); xu.arc(0, 0, r0, 0, 7, true); xu.fill("evenodd"); it.ring = [r0, r1]; }
    for (const it of scene3.items) if ((it.role === "date disc" && !it.print) || it.role === "date number") { xu.fillStyle = it.f; xu.globalAlpha = it.a; xu.fill(new Path2D(it.p), "nonzero"); }      // the window's own picture over its ring's colour
    for (const it of wins) { const [r0, r1] = it.ring, disc = new THREE.Mesh(pictured(r0 > 0 ? new THREE.RingGeometry(r0, r1, 128) : new THREE.CircleGeometry(r1, 128)), new THREE.MeshPhysicalMaterial({ map: texU, metalness: 0, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }));
      disc.rotation.x = -Math.PI / 2; disc.position.y = -0.001 - (it.under ?? WINDOW_UNDER); disc.receiveShadow = true; disc.userData.plateDisc = true; dialGroup.add(disc); } }
  else plate = new THREE.Mesh(new THREE.CircleGeometry(D / 2, 128), top);
  plate.userData.plate = true;
  plate.rotation.x = -Math.PI / 2; plate.position.y = 0.001; plate.receiveShadow = true; dialGroup.add(plate); }
{ const g = new THREE.Group();
  for (const it of scene3.items) { if (it.hand || ["plate", "date disc", "date number", "boss", "cap"].includes(it.role)) continue; const h = it.h ?? Math.max(0.12, (it.ink || 6) * scene3.ink_step), bv = it.applied ? APPLIED_BEVEL(it.section, h) : Math.min(0.04, h * 0.4), nth = g.children.length;      // it.h: the part's own thickness, mm (a dial from Dial Tool's SVG)
    for (const sh of shapesOf(it.p)) { const geo = new THREE.ExtrudeGeometry(sh, { depth: h - bv, bevelEnabled: true, bevelThickness: bv, bevelSize: it.applied ? bv : Math.min(0.03, bv), bevelSegments: it.applied && it.section === "domed" ? 4 : 1, curveSegments: 8 }); const m = new THREE.Mesh(geo, MATERIALS.paint(it.f)); m.position.z = 0.0015 * scene3.items.indexOf(it); m.castShadow = m.receiveShadow = true; g.add(m); } }      // a hair higher for each later part: two inks of one thickness, one over the other, would flicker
  g.rotation.x = -Math.PI / 2; g.position.y = 0.002; dialGroup.add(g); }
// THE HANDS' STACK (round 86; Okay, 10 Nov 2026: "what is our default thickness for hands? Why do they look smushed? Arenn't there
// spaces defined between them?"). Each hand stands at a height: the dial's own (Dial Tool's Shadows pane) or, by the
// Movement switch, a movement's (`MOVES`) — so the spaces between hands are the dial's or the movement's. A hand's THICKNESS is
// `handT`: the movement's, the slider's once moved, or the dial's (Dial Tool's stack), and the solid is exactly that thick, its bevel
// inside it. The CAP's height is its top, its thickness the dial's. A hand's LUME or painted mark lies flush in its top; its BOSS
// (the hub the dial draws on it) is a step of the stack's `boss_t` on the blade. The pane names the tightest space, so a thickness can be held under it.
// THE POSTS AND THE PIPES (round 91; Okay: "gaps between hands seem filled with shapes. is that real life accurate?" · "do the
// accurate hand pipes"). What stands between two hands on a watch is the movement's own stepped post — the hour wheel's pipe, the
// cannon pinion in it, the seconds pivot in that — and, under each hand's blade, the hand's own short pipe round its post. The
// posts are the movement's (`posts`: each Ø and each top over the dial's face, from the record); with the dial's own heights
// they are the tool's hand holes (`HAND.fit`), each ending flush with its hand's top, as TMI's hand-fitting drawing has them.
// A hand's pipe no maker prints: its wall and how far it reaches down are the stack's (never into what is under it)
{ const Hh = scene3.heights, own = (it) => it.z ?? (it.role === "cap" ? Hh.cap : Hh[it.hand]), M = MOVES[HAND.move], heightOf = (it) => M?.heights?.[it.role === "cap" ? "cap" : it.hand] ?? own(it), tOf = handT;
  const levels = [...new Set(scene3.items.filter((it) => it.role === "hand" || it.role === "cap").map(heightOf))].sort((a, b) => a - b), above = (z) => levels.find((l) => l > z + 1e-6);
  let last = null, top = 0;      // the hand a boss or a lume belongs to: the one before it in the list
  for (const it of scene3.items) { if (!(it.hand || it.role === "boss" || it.role === "cap")) continue;
    let z, thick;
    if (it.role === "hand") { z = heightOf(it); thick = tOf(it.hand); last = { z, hand: it.hand, t: thick }; top = Math.max(top, z + thick); }
    else if (it.role === "cap") { thick = it.t ?? STACK.cap_t; z = heightOf(it) - thick; top = Math.max(top, z + thick); }      // the cap's height is its TOP, the top of the stack (Dial Tool's word): it closes over the seconds hand's hub
    else { const on = it.hand ? (last && last.hand === it.hand ? last : { z: heightOf(it) }) : last ?? { z: Hh.hour }, T = on.t ?? handT(it.hand ?? "hour"), next = above(on.z);
      if (it.role === "boss") { z = on.z + T; thick = STACK.boss_t; }
      else { z = on.z + T - 0.004; thick = 0.012; } }      // a lume, a painted mark: flush in the hand's top
    const bev = Math.min(it.role === "hand" && it.bevel ? 0.12 : 0.05, thick * 0.3), g = new THREE.Group();
    for (const sh of shapesOf(it.p)) { const geo = new THREE.ExtrudeGeometry(sh, { depth: thick - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: Math.min(bev, 0.06), bevelSegments: 2 }); geo.translate(0, 0, bev);      // the bevel inside the thickness: the solid stands from z to z + thick
      const m = new THREE.Mesh(geo, MATERIALS.hand(it.f)); m.castShadow = true; g.add(m); }
    const a = it.hand ? scene3.A[it.hand] ?? 0 : 0; g.rotation.set(-Math.PI / 2, 0, -a * Math.PI / 180); g.position.y = z; dialGroup.add(g); }
  { const P = M?.posts ?? (HAND.fit ? { d: HAND.fit, top: null } : null), NAMES = ["hour", "minute", "second"], first = (k) => scene3.items.find((it) => it.role === "hand" && it.hand === k);
    if (P) { const at = NAMES.map((k) => { const it = first(k); return it ? { z: heightOf(it), t: tOf(k), f: it.f } : null; });
      const tops = NAMES.map((k, i) => P.top?.[k] ?? (at[i] ? at[i].z + at[i].t : null));      // a post's top: the movement's, else flush with its hand's top
      const rod = (r, y0, y1, mat) => { if (!(y1 - y0 > 0.01)) return; const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, 48), mat); m.position.y = (y0 + y1) / 2; m.castShadow = true; dialGroup.add(m); };
      let under = -0.05;      // the hour wheel's pipe comes up through the dial's hole
      NAMES.forEach((k, i) => { if (tops[i] == null) return; rod(P.d[k] / 2, under, tops[i], MATERIALS.polished()); under = tops[i]; top = Math.max(top, tops[i]); });
      NAMES.forEach((k, i) => { const h = at[i]; if (!h) return; const below = i === 0 ? 0 : Math.max(tops[i - 1] ?? 0, at[i - 1] ? at[i - 1].z + at[i - 1].t : 0), len = Math.min(STACK.pipe_len, h.z - below - 0.03);
        rod(P.d[k] / 2 + STACK.pipe_wall, h.z - len, h.z, MATERIALS.hand(h.f)); }); } }
  scene3.stackTop = top;      // the top of the stack over the dial's face: what the crystal must clear (rebuild)
  { const hl = [...new Set(scene3.items.filter((it) => it.role === "hand").map(heightOf))].sort((a, b) => a - b); scene3.tightest = hl.length > 1 ? Math.min(...hl.slice(1).map((l, i) => l - hl[i])) : null; } }
}
buildDial();
// the ground: the table, its colour and surface; a contact shadow under the watch where no light gets in
let groundMat;
// THE TABLE'S COLOUR AND SURFACE (round 76). Colour: the table's material is white; its shader multiplies in the Background — one
// colour, or two as a gradient across the picture from the top left to the bottom right (the Show Case's 135°), read off the
// pixel's place on the canvas, so the gradient stays put while the camera moves. Surface: a picture in NEUTRAL GREYS — 128 leaves
// the colour as it is, lighter lifts it, darker lowers it (the shader doubles the picture: `gGain`) — so one picture serves every
// colour, and a scratch can be lighter than the table it is on. The same picture is the relief (the bump map)
const GROUND_U = { gA: { value: new THREE.Color(0xa86a3c) }, gB: { value: new THREE.Color(0xa86a3c) }, gRes: { value: gridPass.uniforms.res.value }, gGain: { value: 1 } };
function tintGround(mat) {
  const before = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { before?.call(mat, sh, r); Object.assign(sh.uniforms, GROUND_U);
    sh.fragmentShader = "uniform vec3 gA, gB; uniform vec2 gRes; uniform float gGain;\n" + sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
    { vec2 q = gl_FragCoord.xy / gRes; diffuseColor.rgb = min(diffuseColor.rgb * gGain, vec3(1.6)) * mix(gA, gB, clamp((q.x + 1.0 - q.y) * 0.5, 0.0, 1.0)); }`); };
  mat.customProgramCacheKey = () => "ground-tint"; mat.color.set(0xffffff); mat.needsUpdate = true; }
// noise whose lattice wraps at (px, py): a tile's edges meet, the table shows no seams
const tileNoise = (seed) => { let s = seed; const G = 256, tab = new Float32Array(G * G); for (let i = 0; i < tab.length; i++) { s = (s * 16807) % 2147483647; tab[i] = s / 2147483647; }
  return (x, y, px, py) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const i0 = ((x0 % px) + px) % px, i1 = (i0 + 1) % px, j0 = ((y0 % py) + py) % py, j1 = (j0 + 1) % py, a = tab[(j0 & 255) * G + (i0 & 255)], b = tab[(j0 & 255) * G + (i1 & 255)], c = tab[(j1 & 255) * G + (i0 & 255)], d = tab[(j1 & 255) * G + (i1 & 255)];
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy; }; };
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// each surface: its tile's size on the table (mm), the picture's size (px), its relief, its sheen, and how it is drawn
const GROUND_KINDS = {
  plain: { rough: 0.62, coat: 0.25 },
  // WOOD: a plain-sawn board. The grain is a field f whose whole numbers are the growth rings; it runs along x and wanders by a
  // slow noise. In each ring the wood goes from light early wood to a narrow dark late-wood line, each ring a little different.
  // A KNOT is a branch cut across: the rings bend round it (a bump in f), inside it they run in circles, darker, with a dark core
  // and a dark edge. On top: long fibre streaks, short pores, a slow drift of tone along the board
  wood: { tile: 160, px: 2048, bump: 0.5, rough: 0.55, coat: 0.3, draw(n, d, tile, x, put) {
    const N = tileNoise(11), RINGS = 44, KNOTS = [[30, -24, 4.5], [-58, 52, 7]].map(([x, y, r]) => [0.5 + x / tile, 0.5 + y / tile, r / tile]);      // the knots: mm from the tile's middle (the watch stands there) and their radius
    const ringTone = Float32Array.from({ length: 64 }, (_, i) => 0.75 + 0.5 * N(i * 0.731 + 0.5, 3.5, 64, 64));
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const u = i / n, v = j / n;
      let f = v * RINGS + 5.0 * N(u * 2, v * 4, 2, 4) + 1.6 * N(u * 5, v * 11, 5, 11) + 0.35 * N(u * 17, v * 40, 17, 40), knot = 0, kd = 0;
      for (const [ku, kv, kr] of KNOTS) { let du = u - ku, dv = v - kv; du -= Math.round(du); dv -= Math.round(dv); const dd = Math.hypot(du * 0.62, dv) / kr;      // a knot is longer along the grain
        f -= RINGS * 0.78 * dv * Math.exp(-dd * dd / 5.0);      /* the rings part round it: a line is pushed away from the knot's middle, most beside it, not at all far along the grain */ const rag = dd * (1 + 0.3 * (N(u * 24, v * 24, 24, 24) - 0.5) + 0.12 * (N(u * 90, v * 90, 90, 90) - 0.5)); if (rag < 1.3) { const w = 1 - sstep(0.9, 1.3, rag); if (w > knot) { knot = w; kd = rag; } } }      /* its edge ragged, not a compass circle */
      const id = Math.floor(f), ph = f - id, amp = ringTone[((id % 64) + 64) % 64];
      let t = 1.06 - 0.26 * amp * sstep(0.35, 0.93, ph) * (1 - sstep(0.93, 1.0, ph)) - 0.05 * amp * ph;      // a ring: light, darkening to the late-wood line, then sharp back to light
      t += 0.10 * (N(u * 30, v * 700, 30, 700) - 0.5) + 0.07 * (N(u * 9, v * 240, 9, 240) - 0.5);      // fibre: long thin streaks along the grain
      const pore = N(u * 300, v * 1500, 300, 1500); if (pore > 0.82) t -= 0.35 * (pore - 0.82);      // pores: short dark dashes
      t += 0.10 * (N(u * 2, v * 3, 2, 3) - 0.5);      // the board's slow drift
      if (knot > 0) { const kt = 0.7 - 0.09 * sstep(0.4, 0.9, (kd * 3.1) % 1) - 0.26 * (1 - sstep(0.0, 0.34, kd)) - 0.24 * sstep(0.72, 1.0, kd) * (1 - sstep(1.0, 1.3, kd)) + 0.12 * (N(u * 70, v * 70, 70, 70) - 0.5) + 0.08 * (N(u * 260, v * 260, 260, 260) - 0.5); t = t * (1 - knot) + kt * knot; }
      const k = (j * n + i) * 4; d[k] = d[k + 1] = d[k + 2] = Math.max(0, Math.min(255, 128 * t)); d[k + 3] = 255; } put(); } },
  // SCRUFFY: a worn table top. A fine speckle and soft blotches; then scratches — mostly one way (the way things get pushed across
  // a table), some any way, long ones few and short ones many, each a light line with a dark lip beside it; scuffed patches of many
  // fine parallel hairs; pits. Drawn nine times round the tile so its edges meet
  scruffy: { tile: 200, px: 2048, bump: 0.35, rough: 0.72, coat: 0.1, draw(n, d, tile, x, put) {
    const N = tileNoise(29); let s = 77; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647), gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const u = i / n, v = j / n, k = (j * n + i) * 4;
      const t = 128 + 22 * (N(u * 5, v * 5, 5, 5) - 0.5) + 14 * (N(u * 23, v * 23, 23, 23) - 0.5) + 10 * (N(u * 400, v * 400, 400, 400) - 0.5); d[k] = d[k + 1] = d[k + 2] = t; d[k + 3] = 255; }
    put(); x.lineCap = "round";
    const around = (fn) => { for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { x.save(); x.translate(ox, oy); fn(); x.restore(); } };
    const scratch = (x0, y0, ang, len, w, light, a) => { const bend = gauss() * len * 0.08, x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, mx = (x0 + x1) / 2 - Math.sin(ang) * bend, my = (y0 + y1) / 2 + Math.cos(ang) * bend;
      around(() => { x.globalAlpha = a * 0.6; x.strokeStyle = light ? "#3c3c3c" : "#d2d2d2"; x.lineWidth = w; x.beginPath(); x.moveTo(x0 + 1, y0 + 1.2); x.quadraticCurveTo(mx + 1, my + 1.2, x1 + 1, y1 + 1.2); x.stroke();      // the lip
        x.globalAlpha = a; x.strokeStyle = light ? "#f0f0f0" : "#2a2a2a"; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(mx, my, x1, y1); x.stroke(); }); };
    const WAY = -0.38;      // the prevailing way, about −22°
    for (let i = 0; i < 40; i++) { const cx = rnd() * n, cy = rnd() * n, r = 50 + rnd() * 170, ang = WAY + gauss() * 0.5;      // scuffed patches: a soft lighter cloud and a sheaf of hairs through it
      around(() => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "rgba(215,215,215,0.16)"); g.addColorStop(1, "rgba(215,215,215,0)"); x.globalAlpha = 1; x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); });
      for (let h = 0; h < 26; h++) { const o = gauss() * r * 0.5, t = gauss() * r * 0.4; scratch(cx - Math.sin(ang) * o + Math.cos(ang) * (t - r * 0.5), cy + Math.cos(ang) * o + Math.sin(ang) * (t - r * 0.5), ang + gauss() * 0.05, r * (0.5 + rnd()), 0.7, true, 0.18 + rnd() * 0.2); } }
    for (let i = 0; i < 1100; i++) { const long = rnd() < 0.12, len = long ? 250 + rnd() * 650 : 14 + rnd() * rnd() * 190; scratch(rnd() * n, rnd() * n, rnd() < 0.68 ? WAY + gauss() * 0.3 : rnd() * Math.PI, len, 0.7 + rnd() * rnd() * 2.0, rnd() < 0.8, 0.22 + rnd() * 0.5); }
    for (let i = 0; i < 30; i++) scratch(rnd() * n, rnd() * n, rnd() * Math.PI, 20 + rnd() * 90, 2.4 + rnd() * 2.2, rnd() < 0.5, 0.5 + rnd() * 0.3);      // gouges
    for (let i = 0; i < 700; i++) { const px = rnd() * n, py = rnd() * n, r = 0.8 + rnd() * rnd() * 3.2; around(() => { x.globalAlpha = 0.3 + rnd() * 0.4; x.fillStyle = "#333"; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); x.globalAlpha = 0.35; x.fillStyle = "#e4e4e4"; x.beginPath(); x.arc(px + r * 0.5, py + r * 0.6, r * 0.6, 0, 7); x.fill(); }); }      // pits
    x.globalAlpha = 1; } },
  // GRID: a cutting mat's print. A line each 5 mm (faint), each 10 mm, a heavier one each 50 mm. No relief. The lines are darker
  // than a light table and lighter than a dark one (`lightLines`), so the grid reads on any colour
  grid: { tile: 100, px: 2000, bump: 0, rough: 0.78, coat: 0.04, draw(n, d, tile, x, put, lightLines) {
    x.fillStyle = "#808080"; x.fillRect(0, 0, n, n); const mm = n / tile, line = (at, w, a) => { x.globalAlpha = a; x.fillStyle = lightLines ? "#ffffff" : "#000000"; for (const o of at ? [0] : [0, n]) { x.fillRect(at * mm - w / 2 + o, 0, w, n); x.fillRect(0, at * mm - w / 2 + o, n, w); } };      // the line at 0 lies half on each edge of the tile
    for (let at = 0; at < tile; at += 5) { if (at % 50 === 0) line(at, 0.45 * mm, lightLines ? 0.42 : 0.34); else if (at % 10 === 0) line(at, 0.2 * mm, lightLines ? 0.34 : 0.28); else line(at, 0.12 * mm, lightLines ? 0.16 : 0.13); }
    x.globalAlpha = 1; } } };
const groundTex = {};      // the pictures drawn so far, by surface (the grid twice: light lines, dark lines)
const floorLum = () => { const c = new THREE.Color(S.floor); if (S.floor2) c.lerp(new THREE.Color(S.floor2), 0.5); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };      // the ground's lightness (linear), a gradient's at its middle
function groundPicture(K, lightLines) { const n = K.px, c = document.createElement("canvas"); c.width = c.height = n; const x = c.getContext("2d"), img = x.createImageData(n, n);
  K.draw(n, img.data, K.tile, x, () => x.putImageData(img, 0, 0), lightLines);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4000 / K.tile, 4000 / K.tile); t.anisotropy = 8; return t; }
function setGround() { const K = GROUND_KINDS[S.ground], lightLines = S.ground === "grid" && floorLum() < 0.18, key = S.ground + (lightLines ? "-light" : "");
  const tex = K.draw ? (groundTex[key] ??= groundPicture(K, lightLines)) : null;
  for (const m of [groundMat, ...Object.entries(groundMat.userData).filter(([k]) => k.startsWith("toon_")).map(([, v]) => v)]) { if (m.map !== tex) { m.map = tex; m.needsUpdate = true; } }      // the toon stand-in was made with the surface of its moment: it follows
  const bump = K.bump ? tex : null; if (groundMat.bumpMap !== bump) { groundMat.bumpMap = bump; groundMat.needsUpdate = true; } groundMat.bumpScale = K.bump || 0;
  groundMat.roughness = K.rough; groundMat.clearcoat = K.coat; GROUND_U.gGain.value = tex ? 2 : 1; }
{ const m = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5 })); groundMat = m.material; tintGround(groundMat);
  m.rotation.x = -Math.PI / 2; groundMesh = m; m.receiveShadow = true; watch.add(m);      // the table at the caseback, in the case's scale. (Until round 34 this line sat inside the comment above: the table was never in the scene — the reason the ground grain was "invisible", open 8a)
  const s = 512, cc = document.createElement("canvas"); cc.width = cc.height = s; const cx = cc.getContext("2d"), gr = cx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.55, "rgba(0,0,0,0.45)"); gr.addColorStop(1, "rgba(0,0,0,0)"); cx.fillStyle = gr; cx.fillRect(0, 0, s, s);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(54 * K, 54 * K), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cc), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; shadowMesh = sh; watch.add(sh); }
const placeGround = () => { groundMesh.position.y = -DIAL_Z * K; shadowMesh.position.y = -DIAL_Z * K + 0.02; };      // the table under the caseback, wherever the datum puts it

// ── 8 · building, the light and the controls ──
const S = { from: 135, rise: 40, sun: 0.6, room: 0.6, mode: "studio", view: "top", caseKey: "diver", strap: "oyster", metal: "steel", ground: "wood", drag: "orbit", lockCam: false, lockSun: false, floor: "#a86a3c", floor2: null, greyPanel: false, bezelKind: "rotating", style: "photo", tab: "dial", studioKind: "dark", keyShape: "panel", ditherPattern: "noise", ditherBits: "one", ditherCell: 2, card: { height: 4, size: 70, lum: 0.9 }, drawing: "off", exportFormat: "svg", pngScale: "2", drawTones: "steps", drawDecals: "on", drawInk: "shaded", drawDetail: "2", drawPreview: "1700", drawGround: "scene", draw: { heavy: 2.0, light: 1.0, keyDeg: 18, creaseDeg: 32 } };
let info = null, info_sink = 0;      // info_sink: how far the dial sank to clear the stack, case units
function rebuild() {
  // THE DIAL'S SEAT (round 88; Okay: the case makes room "From the movement"): the case says how high its dial sits (`dialUp`), and the
  // stack says how much room it needs under the crystal — its top plus the movement's clearance. Where the case's own room is
  // less, the dial sinks by the difference. The case is drawn `K` times its numbers, the stack is in real mm: hence `/ K`
  { const C = CASES[S.caseKey], B = C.bezel, own = B.seat + B.h - CRYSTAL_SEAT - B.dialUp, need = ((scene3.stackTop ?? 0) + (MOVES[HAND.move]?.crystal_clearance ?? STACK.clear)) / K;
    info_sink = Math.max(0, need - own); DIAL_Z = C.zTop + B.dialUp - info_sink; } placeGround(); queueMicrotask(() => window.handShow?.());      // the dial's face is the datum (world y = 0): the case moves under it
  for (const grp of [caseGroup, strapGroup]) { grp.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); for (const m of [].concat(o.material)) m.dispose(); } }); grp.clear(); }
  metalHex = METAL[S.metal];
  info = buildCase(CASES[S.caseKey]); info.lug = CASES[S.caseKey].lug; caseGroup.add(info.group);
  strapGroup.add(S.strap === "leather" ? buildLeather(info) : buildBracelet(S.strap, info));
  if (S.style !== "photo") applyStyle(S.style);      // new meshes wear the style too
}
const sun = new THREE.DirectionalLight(0xffffff, 1); sun.castShadow = true; scene.add(sun); scene.add(sun.target);
sun.shadow.mapSize.set(2048, 2048);      /* was 4096: a depth texture that large can fail on an iPad's GPU and leave the table all in shadow (round 41) */
sun.shadow.camera.left = sun.shadow.camera.bottom = -45; sun.shadow.camera.right = sun.shadow.camera.top = 45; sun.shadow.camera.near = 50; sun.shadow.camera.far = 400; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
// the views: Top (the app's), Photo (the goal's three-quarter), Wide (the same angle pulled back: the whole watch with both
// strap ends — keepers, buckle), Low (a low three-quarter from the 5 o'clock side: the crystal's dome, the flank, the lugs' fall),
// Side (from the crown: heights)
const lens = () => S.style === "tech" ? 3.5 : 1;      // Technical: a 3.5× longer lens from 3.5× further — near-orthographic, as a drawing (round 36)
const orbit = (elDeg, azDeg, d0, fov0, look) => { const d = d0 * lens(), fov = fov0 / lens(); camera.fov = fov; const el = rad(elDeg), az = rad(azDeg); camera.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d); camera.lookAt(...look); controls.target.set(...look); };
let placing = false;      // controls.update() fires "change" too: a preset press must not count as a hand on the orbit
function placeCamera(view) { placing = true; watch.rotation.y = ["photo", "wide", "low"].includes(view) ? -10 * Math.PI / 180 : 0;
  if (view === "free") { placing = false; return; }                                                       // the orbit's own place: leave the camera where the hand left it
  if (view === "top") { camera.fov = 13 / lens(); camera.position.set(0, 325 * lens(), 0.5); camera.lookAt(0, 0, 0); controls.target.set(0, 0, 0); }   // 0.5 off the pole: screen-up stays −z (12 up), as before
  else if (view === "side") { camera.fov = 9 / lens(); camera.position.set(520 * lens(), 18, 0); camera.lookAt(0, -3, 0); controls.target.set(0, -3, 0); }
  else if (view === "wide") orbit(40, -38, 330, 24, [0, -8, 6]);
  else if (view === "low") orbit(14, -58, 185, 20, [0, -4, 0]);
  else orbit(36, -38, 190, 22, [0, -2, 0]);
  if (K !== K0) { const k = K / K0; controls.target.multiplyScalar(k); camera.position.multiplyScalar(k); camera.lookAt(controls.target); }      // the views were set for the opener's size: a larger or smaller dial is seen from as much farther or nearer (round 82)
  camera.updateProjectionMatrix(); controls.update(); placing = false; }
const controls = new OrbitControls(camera, canvas); controls.enableDamping = false; controls.minDistance = 60; controls.maxDistance = 3000; controls.zoomSpeed = 0.6; controls.rotateSpeed = 0.7;
const $ = (id) => document.getElementById(id);
function render() {
  const t0 = performance.now(), st = canvas.parentElement, w = st.clientWidth, h = st.clientHeight;      // the canvas fills the stage (round 41): on an iPad the square canvas was taller than the stage and pushed the page
  if (canvas.clientWidth !== w || canvas.clientHeight !== h) { renderer.setSize(w, h, true); composer.setSize(w, h); gridPass.uniforms.res.value.set(renderer.domElement.width, renderer.domElement.height); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const a = (90 - S.from) * Math.PI / 180, r = S.rise * Math.PI / 180; sun.position.set(Math.cos(a) * Math.cos(r) * 200, Math.sin(r) * 200, -Math.sin(a) * Math.cos(r) * 200);
  if (S.mode === "studio") { sun.intensity = S.sun * 1.6; sun.shadow.radius = 10; scene.environmentIntensity = S.room * 2.0; } else { sun.intensity = S.sun * 5; sun.shadow.radius = 2; scene.environmentIntensity = S.room * 0.9; }
  const L = look(); if (L === "toon" || L === "tech") { sun.intensity = L === "tech" ? 1.0 : 1.0 + S.sun * 1.0; fill.intensity = L === "tech" ? 0 : 0.02 + S.room * 0.15; }
  if (L === "tech") { camera.updateMatrixWorld(); const VM = camera.matrixWorldInverse; SURR.sunV.copy(sun.position).normalize().transformDirection(VM); SURR.keyV.copy(KEY_W).transformDirection(VM); SURR.stripV.copy(STRIP_W).transformDirection(VM); SURR.sunI = sun.intensity; SURR.useRoom.value = 1; SURR.paper.value = S.style === "tech" && S.drawGround === "paper" ? 1 : 0; }      // round 98: the Engineer style's own view too — its drawing reads the room now      // round 75: the surrogate's directions in view space, as the lambert shader sees them      // round 43: the sun carries the steps, the sky light only lifts the shadow a little      // the drawn styles: the sun steps the toon, the sky light fills. Round 42: a third of before — at 3× the lit step of a light grey clipped to white (Okay: "washed out extremely")

  canvasLook(); composer.render();
  status.textContent = `${canvas.width} × ${canvas.height} px · frame ${(performance.now() - t0).toFixed(1)} ms`;
  window.drawSoon?.();      // the drawing's preview follows, once the change settles (round 56; set in section 9, after the first renders)
}
const show = () => { $("v-from").textContent = S.from + "°"; $("v-rise").textContent = S.rise + "°"; $("v-sun").textContent = Math.round(S.sun * 100) + " %"; $("v-room").textContent = Math.round(S.room * 100) + " %"; };
const pick = (key, v) => { const row = document.querySelector(`:is(.pills, .picks)[data-key="${key}"]`); row.querySelector(".on")?.classList.remove("on"); row.querySelector(`[data-v="${v}"]`)?.classList.add("on"); S[key] = v; };
for (const row of document.querySelectorAll(".pills[data-key], .pills-tabs[data-key], .picks[data-key]")) for (const b of row.querySelectorAll("button")) b.onclick = () => { row.querySelector(".on")?.classList.remove("on"); b.classList.add("on"); S[row.dataset.key] = b.dataset.v;
  if (row.dataset.key === "tab") { for (const t of document.querySelectorAll(".tab")) t.hidden = t.dataset.tab !== S.tab; return; }
  if (row.dataset.key === "caseKey") { const C = CASES[S.caseKey]; pick("strap", C.strap); pick("bezelKind", C.bezel.kind); for (const i of document.querySelectorAll("#case-rows input")) i._show?.(); }      // a preset brings its strap and bezel kind
  if (row.dataset.key === "bezelKind") CASES[S.caseKey].bezel.kind = S.bezelKind; if (["caseKey", "strap", "metal", "bezelKind"].includes(row.dataset.key)) rebuild(); if (row.dataset.key === "view") placeCamera(S.view); if (row.dataset.key === "drag") dragMode(); if (row.dataset.key === "style") { applyStyle(S.style); placeCamera(S.view); roomRows(); ditherRows(); render(); drawRows(); return; } if (row.dataset.key === "studioKind") { setRoom(S.studioKind); cardRows(); } if (row.dataset.key === "keyShape") setRoom("dark", true); if (row.dataset.key === "ground") setGround(); if (row.dataset.key.startsWith("dither")) ditherSet(); if (row.dataset.key === "exportFormat" || row.dataset.key === "pngScale") { exportRows(); return; } if (row.dataset.key.startsWith("draw")) { drawSoon(); return; } render(); drawSoon(); };
for (const [id, k, f] of [["from", "from", 1], ["rise", "rise", 1], ["sun", "sun", 0.01], ["room", "room", 0.01]]) $(id).oninput = (e) => { S[k] = +e.target.value * f; show(); render(); };
for (const [id, k, f] of [["card-height", "height", 1], ["card-size", "size", 1], ["card-lum", "lum", 0.01]]) { const inp = $(id), show = () => { $("v-" + id).textContent = k === "lum" ? Math.round(S.card.lum * 100) + " %" : S.card[k] + " mm"; }; show();
  let pending = false; inp.oninput = () => { S.card[k] = +inp.value * f; show(); if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; if (S.studioKind === "dark") setRoom("dark", true); render(); }); }; }      // the card moves: the dark room is lit again
const cardRows = () => { $("card-rows").hidden = S.studioKind !== "dark"; window.dragLook?.(); };      // the room is the photo's: toon materials see no room (R16)
const roomRows = () => { $("photo-rows").hidden = false; $("grade-row").hidden = S.style === "photo"; cardRows(); }; roomRows();
{ const inp = $("grade-base"), show = () => { $("v-grade-base").textContent = GRADE.base.value.toFixed(2); }; show(); inp.oninput = () => { GRADE.base.value = +inp.value; show(); render(); }; inp.onchange = () => window.drawSoon?.(); }      // Photo's metal is the light itself: the row is the drawn looks' (R16)      // round 97: the room is every look's now (rounds 95–96), so its rows are every style's      // round 74: each style's own rows under the style bar
// the dither's settings into the grid pass: the backdrop is the paper; the dots ink on a light paper, paper-white on a dark one
const ditherSet = () => { const gu = gridPass.uniforms, pr = renderer.getPixelRatio(), bg = new THREE.Color(floorHex), light = (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) > 0.3;
  gu.cell.value = S.ditherCell * pr; gu.pattern.value = S.ditherPattern === "noise" ? 1 : 0; gu.bits.value = S.ditherBits === "one" ? 1 : 0; gu.levels.value = 4; gu.dither.value = 1;
  if (light) { gu.paper.value.copy(bg); gu.ink.value.set(0x141413); } else { gu.paper.value.set(0xECECE8); gu.ink.value.copy(bg); } gu.gain.value = 1.0; };      // the lit side is always the light colour: on a light backdrop the backdrop is the paper and the dots ink; on a dark one the backdrop is the dark and the lit parts paper-white
const ditherRows = () => { $("dither-rows").hidden = S.style !== "dither"; };
// ── THE BACKGROUND and THE COLUMN (round 76): the Show Case's colour system (show-case/app/src/main.js on show-case-app). The ground
// is one colour, or two for a gradient at 45° (the first at the top left); ten presets of each (Okay, 20 Oct 2026), and the colour
// itself under them. The column takes the ground's colour, much darker and stronger; its lines and words are steps from it
const SOLIDS = [["Stone", "#b9b3a6"], ["Umber", "#877f6d"], ["Paper", "#e8e4da"], ["Bone", "#d8d0bf"], ["Sky", "#a9bccb"], ["Sage", "#9aa891"], ["Olive", "#6b6a4e"], ["Brick", "#8a4a3a"], ["Slate", "#5b6066"], ["Night", "#1c1c1f"]];
const GROUND_GRADS = [["Dusk", "#3b3f58", "#b8876c"], ["Sea", "#1f4e5a", "#a9c7c0"], ["Clay", "#d9b8a0", "#7a4a3a"], ["Fog", "#e6e6e3", "#8c9096"], ["Dune", "#e8d8b8", "#a5835a"], ["Moss", "#1e2a1f", "#8fa27b"], ["Steel", "#2b3138", "#9aa6b2"], ["Plum", "#2a1f33", "#9c6d8f"], ["Ember", "#2a1a17", "#b4533a"], ["Ink", "#0e0f14", "#3b4256"]];
let grad = ["#2a1a17", "#b4533a"];      // the gradient's two colours, kept while one colour shows (Ember, the Show Case's opener)
const groundCss = () => S.floor2 ? `linear-gradient(135deg, ${S.floor}, ${S.floor2})` : S.floor;
const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => v / 255); };
/** the column from the ground (the Show Case's ground_look, its numbers): hue kept, saturation × 2.2 + 0.15, lightness × 30 %, at
 *  85 %; the top a tenth lighter. The "blacks" (row lines) 22 points from the column, darker where it is light enough, else lighter;
 *  the words two shades over the lines; boxes 11, hover 16, outlines 22 points from the column. In greys: the bar's #212121, solid */
function groundLook() {
  const [r, g, b] = rgbOf(S.floor), hi = Math.max(r, g, b), lo = Math.min(r, g, b), l = (hi + lo) / 2, d = hi - lo, sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = 0; if (d) h = hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  let ch = Math.round(h * 60), cs = Math.round(Math.min(1, sat * 2.2 + 0.15) * 100), cl = Math.round(l * 30);
  const tinted = `hsl(${ch} ${cs}% ${cl}%)`, GREY = [0, 0, 13], swatch = $("sc-grey");
  if (S.greyPanel) [ch, cs, cl] = GREY;
  swatch.style.background = S.greyPanel ? tinted : `hsl(0 0% ${GREY[2]}%)`; swatch.title = swatch.ariaLabel = S.greyPanel ? "The panel in the background's colour" : "The panel in greys"; swatch.setAttribute("aria-pressed", String(S.greyPanel));
  const side = $("side"), set = (k, v) => side.style.setProperty(k, v), op = S.greyPanel ? 1 : 0.85, tint = Math.min(cs, 40), grey = Math.min(cs, 25), wl = Math.min(97, cl + 22 + 44), by = (k) => Math.max(0, Math.min(100, cl >= 22 ? cl - k : cl + k));
  set("--column", `hsl(${ch} ${cs}% ${cl}% / ${op})`); set("--column-top", `hsl(${ch} ${cs}% ${Math.min(100, cl + 10)}% / ${op})`); set("--paper", `hsl(${ch} ${cs}% ${cl}%)`); set("--form-bg", "transparent");
  set("--uiblack", cl >= 22 ? `hsl(${ch} ${cs}% ${cl - 22}%)` : `hsl(${ch} ${Math.min(cs, 60)}% ${cl + 22}%)`);
  set("--ink", `hsl(${ch} ${tint}% ${wl}%)`); set("--grey", `hsl(${ch} ${tint}% ${wl}% / 0.66)`);
  set("--field", `hsl(${ch} ${grey}% ${by(11)}%)`); set("--well", `hsl(${ch} ${grey}% ${by(11)}%)`); set("--hover", `hsl(${ch} ${grey}% ${by(16)}%)`); set("--rule", `hsl(${ch} ${grey}% ${by(22)}%)`); }
/** the canvas switches' ink: white on a dark ground, black on a light one (the Show Case's 0.55); the Drawing style's sheet is white when its Ground is Paper, and so is the fast render's */
let canvasKey = "";
function canvasLook() { const tech = S.style === "tech" && S.drawGround === "paper", key = tech + S.floor + S.floor2; if (key === canvasKey) return; canvasKey = key;
  const lum = (hex) => { const [r, g, b] = rgbOf(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }, st = canvas.parentElement;
  st.classList.toggle("dark", !tech && (S.floor2 ? (lum(S.floor) + lum(S.floor2)) / 2 : lum(S.floor)) < 0.55); st.style.setProperty("--canvas-fill", tech ? "#fff" : S.floor2 ? "transparent" : S.floor); }
const groundSyncs = [];
const setBackdrop = () => { floorHex = parseInt(S.floor.slice(1), 16); GROUND_U.gA.value.set(S.floor); GROUND_U.gB.value.set(S.floor2 || S.floor); if (!(S.style === "tech" && S.drawGround === "paper")) scene.background = new THREE.Color(floorHex);
  document.documentElement.style.setProperty("--stage", groundCss()); if (S.ground === "grid") setGround(); groundLook(); for (const f of groundSyncs) f(); };
const groundChanged = () => { setBackdrop(); ditherSet(); render(); window.drawSoon?.(); };
{ const mk = (tag, props, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
  const button = $("ground"), pop = $("ground-pop"), open = (on) => { pop.hidden = !on; button.setAttribute("aria-expanded", String(on)); };
  button.onclick = () => open(pop.hidden); canvas.addEventListener("pointerdown", () => open(false));
  groundSyncs.push(() => { button.firstElementChild.style.background = groundCss(); });
  const tile = (name, look, on, act) => { const b = mk("button", { type: "button", className: "groundtile", title: name, ariaLabel: name }, mk("i")); b.firstChild.style.background = look; b.onclick = () => { act(); groundChanged(); }; groundSyncs.push(() => b.classList.toggle("on", on())); return b; };
  // the colour itself: the system's picker lies over its swatch, inside the popup's own box
  const over = (look, title, get, put) => { const input = mk("input", { type: "color", className: "overpick", title, ariaLabel: title }); input.oninput = () => { put(input.value); groundChanged(); }; groundSyncs.push(() => { input.value = get(); }); return mk("span", { className: "pickwrap" }, look, input); };
  const oneDot = mk("i"), oneHex = mk("span"), oneLook = mk("span", { className: "groundpick" }, oneDot, oneHex);
  groundSyncs.push(() => { oneDot.style.background = S.floor; oneHex.textContent = S.floor.toUpperCase(); oneLook.classList.toggle("on", !S.floor2); });
  const gDots = [mk("i"), mk("i")], gLook = mk("span", { className: "groundpick gradpick" }, ...gDots.map((d, k) => over(d, k ? "The gradient's second colour" : "The gradient's first colour", () => grad[k], (c) => { grad[k] = c; [S.floor, S.floor2] = grad; })));
  groundSyncs.push(() => { gDots.forEach((d, k) => { d.style.background = grad[k]; }); gLook.classList.toggle("on", Boolean(S.floor2)); });
  const side = (title, tiles, own) => mk("div", { className: "groundside" }, mk("h3", { textContent: title }), mk("div", { className: "groundtiles" }, ...tiles), own);
  pop.append(mk("h2", { textContent: "Background" }), mk("div", { className: "groundsides" },
    side("One colour", SOLIDS.map(([n, c]) => tile(n, c, () => !S.floor2 && S.floor === c, () => { S.floor = c; S.floor2 = null; })), over(oneLook, "The background's colour", () => S.floor, (c) => { S.floor = c; S.floor2 = null; })),
    side("Gradient", GROUND_GRADS.map(([n, a, b]) => tile(n, `linear-gradient(135deg, ${a}, ${b})`, () => S.floor === a && S.floor2 === b, () => { grad = [a, b]; S.floor = a; S.floor2 = b; })), gLook)));
  $("sc-grey").onclick = () => { S.greyPanel = !S.greyPanel; groundLook(); }; }
setBackdrop();
// ── WHAT A DRAG MOVES (round 76): Camera · Sun on the canvas, each with a lock. A locked one is frozen to the hand — it can't be
// chosen or dragged; the views and the sliders still move it. Locking the chosen one hands the drag to the other, if that is free
// WHAT THE SUN'S PAIR DRAGS (round 92): the sun itself (its place on the canvas is its direction and height), or one of the light's
// numbers — a drag across the canvas runs that number's slider from end to end (a card's height: a drag up and down). Each is
// [key, name, its slider's id, its axis]; the cards are the dark room's (R16: not offered where they are not)
const SUN_DRAGS = [["sun", "Sun"], ["sun-s", "Sun strength", "sun"], ["room", "Room light", "room"], ["card-h", "Card height", "card-height", "y"], ["card-w", "Card width", "card-size"], ["card-l", "Card brightness", "card-lum"]];
S.sunDrag = "sun"; const sunOffered = () => SUN_DRAGS.filter(([k]) => !k.startsWith("card") || (S.studioKind === "dark" && !$("card-rows").hidden));
// THE CAMERAS (round 92; "camera allows you to add up to three cameras and change between them"): each is where it stood when it
// was left — its place, its aim, its lens, the watch's turn and the view's name. Cam 1 is the camera the page opens with
const CAMS = [null], CAM_MOST = 3; S.cam = 0;
const camPose = () => ({ p: camera.position.clone(), t: controls.target.clone(), fov: camera.fov, turn: watch.rotation.y, view: S.view });
const camLoad = (k) => { S.cam = k; const c = CAMS[k]; if (c) { placing = true; camera.position.copy(c.p); controls.target.copy(c.t); camera.fov = c.fov; watch.rotation.y = c.turn; camera.updateProjectionMatrix(); controls.update(); placing = false; pick("view", c.view); } dragLook(); show(); render(); window.drawSoon?.(); };
const camTo = (k) => { CAMS[S.cam] = camPose(); camLoad(k); };
const camDrop = () => { if (CAMS.length < 2) return; CAMS.splice(S.cam, 1); camLoad(Math.min(S.cam, CAMS.length - 1)); };      // the camera in hand goes; the one that takes its number, or the last, comes to hand
const VIEW_NAMES = [["top", "Top"], ["photo", "Photo"], ["wide", "Wide"], ["low", "Low"]], viewTo = (v) => document.querySelector(`.pills[data-key="view"] [data-v="${v}"]`)?.click();      // the Camera pane's views, pressed for the camera in hand
const camAdd = () => { if (CAMS.length >= CAM_MOST) return; CAMS.push(camPose()); camTo(CAMS.length - 1); };
const dragLook = () => { if (!sunOffered().some(([k]) => k === S.sunDrag)) S.sunDrag = "sun";
  for (const p of document.querySelectorAll(".dragpair")) { const k = p.dataset.k, locked = k === "orbit" ? S.lockCam : S.lockSun, word = p.querySelector(".dragword"), lock = p.querySelector(".lockbox"), name = k === "orbit" ? "Cam " + (S.cam + 1) : SUN_DRAGS.find((d) => d[0] === S.sunDrag)[1], what = k === "orbit" ? "the camera" : "the light";
    word.querySelector("span").textContent = name; word.title = k === "orbit" ? "A drag moves " + name : "A drag changes: " + name;
    p.classList.toggle("locked", locked); p.classList.toggle("on", S.drag === k && !locked); word.setAttribute("aria-pressed", String(S.drag === k && !locked)); lock.setAttribute("aria-pressed", String(locked)); lock.title = lock.ariaLabel = (locked ? "Unlock " : "Lock ") + what; }
  dragMode(); }; window.dragLook = dragLook;
for (const p of document.querySelectorAll(".dragpair")) { const k = p.dataset.k, mine = k === "orbit" ? "lockCam" : "lockSun", other = k === "orbit" ? "sun" : "orbit", theirs = k === "orbit" ? "lockSun" : "lockCam";
  const take = () => { if (!S[mine]) S.drag = k; };
  p.querySelector(".dragword").onclick = () => { if (S[mine]) return; S.drag = k; dragLook(); };
  p.querySelector(".lockbox").onclick = () => { S[mine] = !S[mine]; if (S[mine] && S.drag === k) S.drag = S[theirs] ? "none" : other; else if (!S[mine] && S.drag === "none") S.drag = k; dragLook(); };
  // its list: over the pair, the chosen row first in bold, the others after in their order (Dial Tool's rule for a dropdown)
  const drop = p.querySelector(".dragdrop"), list = p.querySelector(".canvaslist"), open = (on) => { list.hidden = !on; drop.setAttribute("aria-expanded", String(on)); if (on) fill(); };
  // a row: [id, name, chosen, what it does, its class]. The cameras, the chosen first; Add (until three), Remove (from two on);
  // then, under a heavier line, the views — each puts the camera in hand there (Okay, round 93: "add a way to remove camera. also list the presets there")
  const rows = () => k === "orbit" ? [...CAMS.map((_, i) => ["cam" + i, "Cam " + (i + 1), i === S.cam, () => { if (i !== S.cam) camTo(i); }]), ...(CAMS.length < CAM_MOST ? [["add", "Add a camera", false, camAdd, "quiet"]] : []), ...(CAMS.length > 1 ? [["drop", "Remove Cam " + (S.cam + 1), false, camDrop, "quiet"]] : []),
      ...VIEW_NAMES.map(([v, name], i) => ["view-" + v, name + " view", false, () => viewTo(v), i ? "" : "rule"])]
    : sunOffered().map(([id, name]) => [id, name, id === S.sunDrag, () => { S.sunDrag = id; }]);
  const fill = () => { const all = rows(); list.replaceChildren(...[...all.filter((r) => r[2]), ...all.filter((r) => !r[2])].map(([id, name, on, act, cls]) => { const b = document.createElement("button"); b.type = "button"; b.dataset.v = id; b.textContent = name; b.setAttribute("role", "option"); b.className = cls || ""; b.classList.toggle("on", on); b.onclick = () => { act(); take(); open(false); dragLook(); }; return b; })); };
  drop.onclick = () => open(list.hidden); document.addEventListener("pointerdown", (e) => { if (!list.hidden && !p.contains(e.target)) open(false); }); document.addEventListener("keydown", (e) => { if (e.key === "Escape") open(false); }); }
let dragging = null;
const sunAt = (e) => { const b = canvas.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = 0.5 - (e.clientY - b.top) / b.height, d = Math.min(1, Math.hypot(x, y) * 2);
  S.from = ((90 - Math.atan2(y, x) * 180 / Math.PI) % 360 + 360) % 360 | 0; S.rise = Math.round(85 - 73 * d); $("from").value = S.from; $("rise").value = S.rise; show(); render(); };
// a number dragged: the drag's share of the canvas is the same share of the slider's run, from where the slider stood; the slider
// itself is moved and told so, so its own work (and the stand-in, round 91) follows as if the hand were on it
const numberAt = (e) => { const b = canvas.getBoundingClientRect(), d = dragging, f = d.axis === "y" ? (d.y - e.clientY) / b.height : (e.clientX - d.x) / b.width, lo = +d.inp.min, hi = +d.inp.max, st = +d.inp.step || 1;
  const v = Math.max(lo, Math.min(hi, Math.round((d.v + f * (hi - lo)) / st) * st)); if (v !== +d.inp.value) { d.inp.value = v; d.inp.dispatchEvent(new Event("input", { bubbles: true })); } };
canvas.onpointerdown = (e) => { if (S.drag !== "sun" || S.lockSun) return; const T = SUN_DRAGS.find((d) => d[0] === S.sunDrag); canvas.setPointerCapture(e.pointerId);
  if (!T[2]) { dragging = { sun: true }; fastMode(true, true); window.liveEdit?.start(); sunAt(e); } else { const inp = $(T[2]); dragging = { inp, x: e.clientX, y: e.clientY, v: +inp.value, axis: T[3] }; } };
canvas.onpointermove = (e) => { if (!dragging) return; if (dragging.sun) sunAt(e); else numberAt(e); };
canvas.onpointerup = canvas.onpointercancel = () => { if (dragging) { if (dragging.sun) { fastMode(false); window.liveEdit?.end(); } else dragging.inp.dispatchEvent(new Event("change", { bubbles: true })); } dragging = null; };
// a hand on the orbit leaves the view presets: the Free pill lights (it is hidden; a preset press puts the camera back), the frame is redrawn
controls.addEventListener("change", () => { if (placing) return; if (S.view !== "free") { S.view = "free"; const row = document.querySelector('.pills[data-key="view"]'); row.querySelector(".on")?.classList.remove("on"); row.querySelector('[data-v="free"]').classList.add("on"); } renderSoon(); });
let frame = 0; const renderSoon = () => { frame ||= requestAnimationFrame(() => { frame = 0; render(); }); };      // the camera's moves are drawn once a screen refresh: a finger reports more moves than the screen shows frames, and each was a whole render
let wheelTimer = 0;
controls.addEventListener("start", () => fastMode(true)); controls.addEventListener("end", () => { clearTimeout(wheelTimer); wheelTimer = setTimeout(() => fastMode(false), 60); });      // a wheel step is a start and an end at once: the short wait keeps the fast render on through a run of them
canvas.addEventListener("wheel", () => { if (!controls.enabled) return; fastMode(true); clearTimeout(wheelTimer); wheelTimer = setTimeout(() => fastMode(false), 300); }, { passive: true });
const dragMode = () => { controls.enabled = S.drag === "orbit" && !S.lockCam; const T = SUN_DRAGS.find((d) => d[0] === S.sunDrag); canvas.style.cursor = controls.enabled ? "grab" : S.drag === "sun" && !S.lockSun ? (!T[2] ? "crosshair" : T[3] === "y" ? "ns-resize" : "ew-resize") : "default"; };      // a locked one is not moved by the hand; the views and the sliders still move it
// ── 7 · the case's numbers: sliders over the spec, rebuilt live. Each row: group · label · path in CASES.<key> · min · max · step. Stage 2 adds the bezel's profile here
const CASE_ROWS = [
  ["Body", "Radius", "R", 15, 23, 0.05], ["Body", "Lug to lug", "l2l", 40, 54, 0.1], ["Body", "Band bottom", "zBand", 1, 5, 0.1], ["Body", "Band top", "zTop", 6, 12, 0.1], ["Body", "Belly", "belly", 0, 0.8, 0.02], ["Body", "Chamfer", "chamfer", 0.2, 1.5, 0.05],
  ["Lugs", "Width between", "lugw", 16, 22, 0.5], ["Lugs", "Thickness", "lugT", 1.5, 4.5, 0.1], ["Lugs", "Flare", "flare", 0, 5, 0.1], ["Lugs", "Root blend", "lug.fillet", 0.3, 3, 0.1], ["Lugs", "Tip top", "lug.tipTop", 4, 11, 0.1], ["Lugs", "Tip bottom", "lug.tipBot", 1.5, 6, 0.1], ["Lugs", "Tip corner", "lug.corner", 0.2, 1.5, 0.05], ["Lugs", "Tip chamfer", "lug.chamferTip", 0.2, 1.2, 0.05], ["Lugs", "Inner break", "lug.chamferIn", 0, 0.6, 0.05], ["Lugs", "Hole from tip", "lug.holeIn", 0.8, 3, 0.1],
  ["Bezel", "Inset from body", "bezel.inset", 0, 2.5, 0.05], ["Bezel", "Ring width", "bezel.width", 1.5, 5, 0.05], ["Bezel", "Dial over band", "bezel.dialUp", -1, 2.5, 0.05], ["Bezel", "Seat over band", "bezel.seat", 0, 1.5, 0.05], ["Bezel", "Ring height", "bezel.h", 0.8, 4, 0.05], ["Bezel", "Top chamfer", "bezel.chamfer", 0.1, 1.2, 0.05], ["Bezel", "Lip / recess", "bezel.lip", 0.2, 1.2, 0.05], ["Bezel", "Teeth", "bezel.teeth.n", 24, 120, 1], ["Bezel", "Tooth depth", "bezel.teeth.depth", 0, 1.2, 0.05], ["Crystal", "Rim in", "bezel.rim", 0, 1.5, 0.05], ["Crystal", "Over the ring", "bezel.up", 0, 2, 0.05], ["Crystal", "Dome", "bezel.dome", 0, 3, 0.05],
  ["Crown", "Diameter", "crown.w", 3, 9, 0.1], ["Crown", "Length", "crown.h", 1, 5, 0.1], ["Crown", "Height", "crown.z", 3, 9, 0.1]];
const CASES_0 = JSON.parse(JSON.stringify(CASES));      // the specs as written, for Reset
const getAt = (o, path) => path.split(".").reduce((a, k) => a[k], o), setAt = (o, path, v) => { const ks = path.split("."), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
{ const box = $("case-rows"); let grp = "", body = null;
  for (const [g, label, path, min, max, step] of CASE_ROWS) { if (g !== grp) { grp = g; const pane = document.createElement("section"); pane.className = "pane folded"; pane.dataset.pane = g.toLowerCase();
      pane.innerHTML = `<button class="fold"><span class="eye"><svg class="open" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.625" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 8.25C3.75 4.85 6.05 3.55 8.25 3.55S12.75 4.85 14.75 8.25C12.75 11.65 10.45 12.95 8.25 12.95S3.75 11.65 1.75 8.25Z"/><circle cx="8.25" cy="8.25" r="2.25" fill="currentColor" stroke="none"/></svg><svg class="closed" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.625" stroke-linecap="round" stroke-linejoin="round"><path d="M1.75 6.75C3.75 9.85 6.05 11.05 8.25 11.05S12.75 9.85 14.75 6.75M8.25 11.05V13.75M4.95 10.35L3.95 12.65M11.55 10.35L12.55 12.65M2.75 8.35L1.35 10.05M13.75 8.35L15.15 10.05"/></svg></span><h2>${g}</h2><span class="summary"></span></button><div class="body"></div>`; box.appendChild(pane); body = pane.querySelector(".body"); }
    const row = document.createElement("div"); row.className = "row"; const lab = document.createElement("label"), val = document.createElement("span"), inp = document.createElement("input"); val.className = "num"; lab.textContent = label;
    inp.type = "range"; inp.min = min; inp.max = max; inp.step = step; inp.dataset.path = path; row.append(lab, inp, val); body.appendChild(row);
    const dec = step >= 1 ? 0 : step >= 0.1 ? 1 : 2, show = () => { const v = getAt(CASES[S.caseKey], path); inp.value = v; fillOf(inp); val.textContent = step >= 1 ? v : v.toFixed(dec); }; show(); inp._show = show;      // the number alone: every number here is millimetres but the teeth, a count (the Preset note says so)
    let pending = false; inp.oninput = () => { setAt(CASES[S.caseKey], path, +inp.value); show(); if (pending) return; pending = true;      // one rebuild a frame while the slider moves
      requestAnimationFrame(() => { pending = false; const t0 = performance.now(); rebuild(); render(); $("v-build").textContent = `built in ${(performance.now() - t0).toFixed(0)} ms`; }); }; }
  $("case-reset").onclick = () => { Object.assign(CASES[S.caseKey], JSON.parse(JSON.stringify(CASES_0[S.caseKey]))); pick("bezelKind", CASES[S.caseKey].bezel.kind); for (const i of box.querySelectorAll("input")) i._show(); rebuild(); render(); }; }
// every slider's ink runs to its handle (--p); set at load and as it moves
function fillOf(inp) { inp.style.setProperty("--p", (inp.value - inp.min) / (inp.max - inp.min)); }
for (const inp of document.querySelectorAll('input[type="range"]')) { fillOf(inp); inp.addEventListener("input", () => fillOf(inp)); }
// THE STAND-IN WHILE A SLIDER MOVES (round 91; Okay: "preview mode is not activated while adjusting sun or card etc. it should"): every
// slider, as the camera — the fast look from its first step until it has rested 250 ms or is let go. Listened for on the way down
// (capture), so the look is already the fast one when the slider's own work draws
{ let rest = 0, live = false; const done = () => { clearTimeout(rest); fastMode(false); if (live) { live = false; window.liveEdit?.end(); } };
  document.addEventListener("input", (e) => { if (e.target.matches?.('input[type="range"]')) { fastMode(true, true); if (!live) { live = true; window.liveEdit?.start(); } clearTimeout(rest); rest = setTimeout(done, 600); } }, true);      // 600 ms of rest (it was 250): a drawing is made again at the end, so a pause in a drag should not start one
  document.addEventListener("change", (e) => { if (e.target.matches?.('input[type="range"]')) done(); }, true); }

{ const inp = $("dither-cell"), show = () => { $("v-dither-cell").textContent = S.ditherCell + " px"; }; show(); inp.oninput = () => { S.ditherCell = +inp.value; show(); ditherSet(); render(); }; }
// panes fold to their heading; the summary says what the pane holds while folded
const SUMMARY = { style: () => ({ photo: "Photo", toon: "Toon", dither: "Dither", tech: "Engineer 3D" })[S.style] + (S.style === "dither" ? " · " + S.ditherPattern + " · " + (S.ditherBits === "one" ? "two colours" : "four levels") : ""), camera: () => ({ top: "Top", photo: "Photo", wide: "Wide", low: "Low", side: "Side", free: "Free" })[S.view],
  light: () => (S.mode === "studio" ? "Studio" : "Sun") + (S.style === "photo" ? " · " + (S.studioKind === "dark" ? "dark room" : "light tent") : "") + " · " + S.from + "° " + S.rise + "°", table: () => ({ plain: "Plain", grid: "Grid", scruffy: "Scruffy", wood: "Wood" })[S.ground],
  preset: () => CASES[S.caseKey].name, parts: () => CASES[S.caseKey].bezel.kind + " · " + S.strap + " · " + S.metal,
  body: () => `R ${CASES[S.caseKey].R} · ${CASES[S.caseKey].l2l} l2l`, lugs: () => `${CASES[S.caseKey].lugw} × ${CASES[S.caseKey].lugT}`, bezel: () => `${CASES[S.caseKey].bezel.kind} · h ${CASES[S.caseKey].bezel.h}`, crystal: () => `dome ${CASES[S.caseKey].bezel.dome}`, crown: () => `Ø ${CASES[S.caseKey].crown.w}` };
function summaries() { for (const pane of document.querySelectorAll(".pane")) { const f = SUMMARY[pane.dataset.pane]; pane.querySelector(".summary").textContent = f ? f() : ""; } }
for (const fold of document.querySelectorAll(".fold")) fold.onclick = () => { fold.parentElement.classList.toggle("folded"); summaries(); };
document.querySelector(".form").addEventListener("input", summaries); document.querySelector(".form").addEventListener("click", () => requestAnimationFrame(summaries)); summaries();
window.onresize = render; new ResizeObserver(() => render()).observe(document.getElementById("stage"));
setRoom(S.studioKind); rebuild(); placeCamera(S.view); setGround(); dragLook(); show(); render();
if (S.style !== "tech") { applyStyle("tech"); renderer.compile(scene, camera); applyStyle(S.style); }      // the fast render's programs made now: the first press finds them ready

// ── 9 · the drawing: a preview over the canvas and the SVG save (round 55–56; svg3d-core.mjs does the work, in this page) ──
const drawOpts = (linesOnly = false) => ({ heavy: S.draw.heavy, light: S.draw.light, keyDeg: S.draw.keyDeg, creaseDeg: S.draw.creaseDeg, inkMode: S.drawInk, traceScale: +S.drawDetail, ground: S.drawGround, bands: !linesOnly && S.drawTones !== "none", steps: S.drawTones === "steps", decals: !linesOnly && S.drawDecals === "on" });
let drawBusy = false, drawAgain = false, drawTimer = 0, drawURL = null, handOn = false;      // handOn: the hand is on the camera (the 3D stands in for the drawing)
// THE PREVIEW'S RESOLUTION (round 79; Okay: "the preview wait on large screens for drawing is a little too long, we need a resolution
// selector, and a preview loading banner with a small animation"): the tones are traced from a picture, and the wait grows with that
// picture's pixels. The preview's picture has a size of its own — `S.drawPreview` px on its long side (Draft 1000 · Normal 1700 ·
// Fine 2600), the same on any screen; a saved file keeps the Export tab's Detail. The banner shows from the start of a drawing to its end
const previewScale = () => +S.drawPreview / Math.max(canvas.clientWidth, canvas.clientHeight, 1);
const painted = () => new Promise((ok) => { const done = setTimeout(ok, 120); requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(done); ok(); })); });      // two frames on: what was just written is on the screen (the timer: a hidden tab has no frames)
const draw = async () => { if (S.drawing !== "on") return; if (drawBusy) { drawAgain = true; return; } drawBusy = true; status.textContent = "drawing…";
  $("draw-step").textContent = ""; $("draw-banner").classList.add("on"); await painted();
  try { const t0 = performance.now(), { svg, stats } = await window.svg3d(window.watch3d, { ...drawOpts(), traceScale: previewScale(), onStage: (name, k, of) => { $("draw-step").textContent = `${k} / ${of} · ${name}`; return painted(); } }); stats.ms = Math.round(performance.now() - t0); if (drawURL) URL.revokeObjectURL(drawURL); drawURL = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); await new Promise((ok, bad) => { const im = $("draw"); im.onload = ok; im.onerror = () => bad(new Error("the drawing would not load")); im.src = drawURL; }); $("draw").classList.add("on");
    if (!handOn && !drawAgain) $("draw").classList.remove("lift");      // a finished drawing shows itself — whichever timer asked for it — unless the hand is on the camera or a newer one is already asked for
    status.textContent = `drawing: ${stats.polylines} lines · ${stats.pieces} tone pieces · ${stats.decals} decals · ${(stats.ms / 1000).toFixed(1)} s`; } catch (e) { status.textContent = "drawing failed: " + (e.message || e.code); console.error(e); }
  drawBusy = false; if (drawAgain) { drawAgain = false; draw(); } else $("draw-banner").classList.remove("on"); };
const drawSoon = () => { if (S.drawing !== "on") return; clearTimeout(drawTimer); drawTimer = setTimeout(draw, 500); }; window.drawSoon = drawSoon;
// round 72 (Okay: "move the camera while on svg preview… stop moving: render svg of current view"): while the orbit moves, the drawing
// lifts and the live 3D stands in as the surrogate; when the hand comes off (or the wheel settles) the drawing is redrawn
// round 100 (Okay: "light edits triggering the preview"): the same for a slider or the sun dragged on the canvas — `liveEdit.start()` lifts
// the drawing so the change is seen as it is made, `liveEdit.end()` draws again
const liveStart = () => { handOn = true; if (S.drawing === "on") { clearTimeout(drawTimer); $("draw").classList.add("lift"); } };
const liveEnd = () => { handOn = false; if (S.drawing === "on") { $("draw-step").textContent = ""; $("draw-banner").classList.add("on"); clearTimeout(drawTimer); drawTimer = setTimeout(draw, 120); } };
window.liveEdit = { start: liveStart, end: liveEnd };
controls.addEventListener("start", () => { handOn = true; if (S.drawing === "on") { clearTimeout(drawTimer); $("draw").classList.add("lift"); } });
controls.addEventListener("end", () => { handOn = false; if (S.drawing === "on") { $("draw-step").textContent = ""; $("draw-banner").classList.add("on"); clearTimeout(drawTimer); drawTimer = setTimeout(draw, 120); } });      // the banner from the moment the hand lifts
canvas.addEventListener("wheel", () => { if (S.drawing === "on") { $("draw").classList.add("lift"); clearTimeout(drawTimer); drawTimer = setTimeout(draw, 400); } }, { passive: true });      // after a change settles (an orbit drag fires render() many times)
const drawRows = () => { S.drawing = S.style === "tech" ? "on" : "off"; $("draw-rows").hidden = S.drawing !== "on"; if (S.drawing === "on") draw(); else { $("draw").classList.remove("on"); $("draw").classList.remove("lift"); $("draw-banner").classList.remove("on"); } };      // round 74: the Drawing style IS the preview — the live line render while the hand moves, the vectors when it stops
for (const [id, k, f, unit] of [["draw-heavy", "heavy", 0.1, " px"], ["draw-light", "light", 0.1, " px"], ["draw-key", "keyDeg", 1, "°"], ["draw-crease", "creaseDeg", 1, "°"]]) { const inp = $(id), show = () => { $("v-" + id).textContent = (f === 1 ? S.draw[k] : S.draw[k].toFixed(1)) + unit; }; show(); inp.oninput = () => { S.draw[k] = +inp.value * f; show(); drawSoon(); }; }
const exportSVG = async (opts) => { const b = document.activeElement; status.textContent = "drawing…"; await new Promise((r) => setTimeout(r, 30));
  try { const { svg, stats } = await window.svg3d(window.watch3d, opts), filename = `watch3d-${S.view}-${S.caseKey}-${S.strap}${opts.bands === false ? "-lines" : ""}${opts.frames ? "-motion" : ""}.svg`;
    // in the artifact the viewer blocks a page's own downloads: the file goes through the `downloads` capability (declared on the artifact), which asks the viewer first. Elsewhere (a local file, the node runner) a plain download link
    await saveFile(filename, svg);
    status.textContent = `SVG: ${stats.polylines} lines · ${stats.pieces} tone pieces · ${stats.decals} decals`; } catch (e) { status.textContent = e.code === "declined" ? "SVG: not saved" : "SVG failed: " + (e.message || e.code); console.error(e); } b?.blur?.(); };
const exportRows = () => { $("svg-detail-row").hidden = S.exportFormat !== "svg"; $("png-scale-row").hidden = S.exportFormat !== "png"; $("svg-lines").hidden = $("svg-motion").hidden = S.exportFormat !== "svg"; }; exportRows();
const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB";
const saveFile = async (filename, data) => { const size = typeof data === "string" ? new Blob([data]).size : data.size; const dl = window.claude?.use ? await window.claude.use("downloads") : null;
  if (dl) await dl.save({ filename, data }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
  $("export-size").textContent = `${filename} · ${fmtSize(size)}`; return size; };
// PNG (round 74): the canvas at `pngScale` × — the renderer sized up for one frame and read back; in the Drawing style the SVG is rasterised at that size instead
const exportPNG = async () => { const k = +S.pngScale, b = document.activeElement; status.textContent = "saving…"; await new Promise((r) => setTimeout(r, 30));
  try { const w = canvas.clientWidth, h = canvas.clientHeight, cv = document.createElement("canvas"); cv.width = Math.round(w * k); cv.height = Math.round(h * k); const cx = cv.getContext("2d");
    if (S.style === "tech") { const { svg } = await window.svg3d(window.watch3d, drawOpts()); const im = new Image(); const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); await new Promise((ok, no) => { im.onload = ok; im.onerror = no; im.src = url; }); cx.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); }
    else { const pr = renderer.getPixelRatio(); renderer.setPixelRatio(k); renderer.setSize(w, h, false); composer.setSize(w, h); gridPass.uniforms.res.value.set(renderer.domElement.width, renderer.domElement.height); composer.render(); cx.drawImage(renderer.domElement, 0, 0, cv.width, cv.height); renderer.setPixelRatio(pr); renderer.setSize(w, h, true); composer.setSize(w, h); gridPass.uniforms.res.value.set(renderer.domElement.width, renderer.domElement.height); render(); }
    const blob = await new Promise((ok) => cv.toBlob(ok, "image/png")); await saveFile(`watch3d-${S.view}-${S.caseKey}-${S.strap}-${S.style}-${k}x.png`, blob); status.textContent = `PNG ${cv.width} × ${cv.height}`; } catch (e) { status.textContent = e.code === "declined" ? "PNG: not saved" : "PNG failed: " + (e.message || e.code); console.error(e); } b?.blur?.(); };
$("save-now").onclick = () => S.exportFormat === "png" ? exportPNG() : exportSVG(drawOpts()); $("svg-lines").onclick = () => exportSVG(drawOpts(true)); $("svg-motion").onclick = () => exportSVG(Object.assign(drawOpts(), { frames: { n: 6, sweep: 10, hold: 0.2 } }));
// ── A DIAL FROM DIAL TOOL (rounds 82–83; Okay, 10 Nov 2026: "getting a dial tool dial in and visualize it here … you're getting an svg
// here to implement, right? fonts are converted in svgs", then "i need you to get height and thickness values as well, this preview
// depends on it"). The hand-over is Dial Tool's own SVG export: every part a filled outline in millimetres (text already outlines),
// named by what it is, inside <g id="dial">, and — from v1.1.63 beta — saying its ink's thickness and its height (`data-` attributes,
// show.js `svg_facts`). Nothing of the tool's engine or its fonts is needed here, and nothing is guessed. Hands arrive already turned
// to their time (their angle is 0). The tool's own bezel and rehaut are left out: the case here is this page's own
const SCENE_DEFAULT = scene3;
const svgToScene = (text) => readDial(text, SCENE_DEFAULT);      // a dial's SVG → its scene: dial-in.js
/** the dial in use ← a scene. The case and strap grow with the dial (K), the table and the contact shadow follow, the style is put back on */
function setDial(sc, name) { window.SCENE = scene3 = sc; STACK = sc.stack ?? PARTS.STACK; K = sc.size; caseGroup.scale.setScalar(K); strapGroup.scale.setScalar(K); shadowMesh.scale.setScalar(K / SCENE_DEFAULT.size);
  buildDial(); rebuild(); placeCamera(S.view); render(); dialShow(name); window.drawSoon?.(); }
function dialShow(name) { const sc = scene3, r = sc.d / 2 + 0.6;
  $("dial-thumb").innerHTML = `<svg viewBox="${-r} ${-r} ${2 * r} ${2 * r}" width="100%" height="100%" aria-hidden="true"><g transform="scale(1 -1)">${sc.items.map((it) => `<g${it.hand && sc.A[it.hand] ? ` transform="rotate(${sc.A[it.hand]})"` : ""}><path d="${it.p}" fill="${it.f}" fill-opacity="${it.a}"/></g>`).join("")}</g></svg>`;
  $("dial-name").textContent = name; $("dial-meta").textContent = `Ø ${+sc.d.toFixed(2)} mm · ${sc.items.length} parts` + (sc === SCENE_DEFAULT ? "" : sc.exact ? " · heights from Dial Tool" : " · heights guessed: save it again from Dial Tool v1.1.63 or later") + (sc.skipped?.length ? ` · left out: ${sc.skipped.join(", ")}` : ""); $("dial-default").disabled = sc === SCENE_DEFAULT; $("dial-meta").classList.remove("bad"); window.handShow?.(); summaries(); }
function dialFromText(text, name) { try { setDial(svgToScene(text), name); } catch (e) { $("dial-meta").textContent = "That can't be read as a dial: " + e.message + "."; $("dial-meta").classList.add("bad"); } }
$("dial-open").onclick = () => $("dial-file").click();
$("dial-file").onchange = async () => { const f = $("dial-file").files[0]; if (f) dialFromText(await f.text(), f.name.replace(/\.svg$/i, "")); $("dial-file").value = ""; };
$("dial-default").onclick = () => { $("dial-link").value = ""; setDial(SCENE_DEFAULT, "Opener"); };
{ const st = canvas.parentElement; st.addEventListener("dragover", (e) => { e.preventDefault(); }); st.addEventListener("drop", async (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) dialFromText(await f.text(), f.name.replace(/\.svg$/i, "")); }); }
// A LINK (round 84; Okay, 10 Nov 2026: "now you have what you need to get a link paste work. Right?"). A link is the dial's settings;
// its shapes are made by Dial Tool's own engine, which travels with the page: engine.js (built by engine-build.mjs from the tool's
// code) and the tool's font files in fonts/, fetched at the first link and as a dial asks for them. The engine writes the SVG the
// tool's Export writes — heights and all — and that goes through the one reader above
const looksLikeLink = (t) => /(^|#)[2-9][0-9A-Za-z]{40,}\s*$/.test(t.trim()) || /dial-tool\/[^#\s]*#\S+/.test(t);
let dialEngine = null;
async function dialFromLink(text) { const meta = $("dial-meta"); meta.classList.remove("bad"); meta.textContent = dialEngine ? "Reading the link…" : "Fetching Dial Tool's engine (once)…";
  try { const E = await (dialEngine ??= import(new URL("engine.js", document.baseURI).href)), got = await E.svgFromLink(text, new URL("fonts/", document.baseURI).href);
    dialFromText(got.svg, "From a link"); if (!$("dial-meta").classList.contains("bad")) $("dial-meta").textContent += ` · engine ${got.version}` + (got.missing.length ? ` · fonts not with this page, a stand-in drawn: ${got.missing.join(", ")}` : ""); }
  catch (e) { if (!dialEngine || /Failed to fetch dynamically|Importing a module script failed|error loading dynamically/i.test(e.message)) dialEngine = null; meta.textContent = "The link can't be drawn: " + (e.message || e) + "."; meta.classList.add("bad"); } }
{ const field = $("dial-link"), go = () => { const t = field.value.trim(); if (t) { field.blur(); dialFromLink(t); } };
  field.addEventListener("paste", (e) => { const t = e.clipboardData?.getData("text") || ""; if (looksLikeLink(t)) { e.preventDefault(); e.stopPropagation(); field.value = t.trim(); go(); } });
  field.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); }); field.addEventListener("change", go); $("dial-link-go").onclick = go; }
document.addEventListener("paste", (e) => { const t = e.clipboardData?.getData("text") || ""; if (t.includes("<svg") && t.includes('id="dial"')) { e.preventDefault(); dialFromText(t, "Pasted dial"); } else if (e.target !== $("dial-link") && looksLikeLink(t)) { e.preventDefault(); $("dial-link").value = t.trim(); dialFromLink(t); } });
SUMMARY.dial = () => $("dial-name").textContent;
{ const inp = $("hand-t"), M = () => MOVES[HAND.move], show = () => { const own = HAND.t ?? handT("hour"); inp.value = own; $("v-hand-t").textContent = own.toFixed(2) + " mm"; fillOf(inp);
    const whose = HAND.move === "dial" ? "the dial's, from Dial Tool" : M().name + "'s, " + (M().heights.from === "maker" ? "as its maker prints them" : "worked out from its posts"), t = M()?.hand_t;
    $("hand-gap").textContent = scene3.tightest == null ? "" : `The tightest space between this dial's hands is ${scene3.tightest.toFixed(2)} mm (their heights are ${whose}): thicker than that and they run into each other.` + (t ? ` This movement's own hands are ${t.hour} · ${t.minute} · ${t.second} mm thick; the slider is for a movement that prints none.` : "");
    const p = $("hand-sink"); p.textContent = info_sink > 0.005 ? `The dial sits ${(info_sink * K).toFixed(2)} mm deeper in this case, so the crystal clears the hands by ${(M()?.crystal_clearance ?? STACK.clear).toFixed(2)} mm.` : ""; p.parentNode.hidden = !p.textContent; };
  const again = () => { buildDial(); rebuild(); if (S.style !== "photo") applyStyle(look()); show(); render(); };
  // the movements' dropdown: `choices` in their order (the dial's own first, then the record's); open, the chosen one is the first row
  const choices = [["dial", "Dial's own"]], btn = $("hand-move-btn"), list = $("hand-move-list"), open = (on) => { list.hidden = !on; btn.setAttribute("aria-expanded", String(on)); if (on) fill(); };
  const pick = (id) => { HAND.move = id; btn.querySelector(".v").textContent = choices.find((c) => c[0] === id)[1]; open(false); again(); };
  const fill = () => { list.replaceChildren(...[...choices.filter((c) => c[0] === HAND.move), ...choices.filter((c) => c[0] !== HAND.move)].map(([id, name]) => { const b = document.createElement("button"); b.type = "button"; b.dataset.v = id; b.textContent = name; b.setAttribute("role", "option"); b.classList.toggle("on", id === HAND.move); b.onclick = () => pick(id); return b; })); };
  btn.onclick = () => open(list.hidden); document.addEventListener("pointerdown", (e) => { if (!list.hidden && !$("hand-move").contains(e.target)) open(false); }); document.addEventListener("keydown", (e) => { if (e.key === "Escape") open(false); });
  window.handMove = pick;
  inp.oninput = () => { HAND.t = +inp.value; again(); }; window.handShow = show;
  // the movements, from Dial Tool's record beside the page (a page opened as a file has none: the dial's own heights only)
  import(new URL("movements.js", document.baseURI)).then((R) => { for (const m of R.MOVEMENTS) if (m.heights) { MOVES[m.id] = m; choices.push([m.id, m.name]); } HAND.fit = R.HOLE_FIT ?? null; again(); window.movesReady = true; }).catch(() => { window.movesReady = false; }); }
dialShow("Opener");
window.watch3d = { S, render, setDial, svgToScene, dialFromText, dialFromLink, fastMode, isFast: () => fast, scene, camera, renderer, controls, info: () => info, CASES, floor: () => floorHex, floor2: () => S.floor2, sun, fill, ground: () => groundMesh, contact: () => shadowMesh, set: (key, v) => document.querySelector(`[data-key="${key}"] [data-v="${v}"]`)?.click(), setMode: (m) => document.querySelector(`.pills[data-key="mode"] [data-v="${m}"]`).click() };
