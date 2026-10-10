# Human Anatomy 3D

**An interactive 3D atlas of the human body that you can peel layer by layer, in English and हिंदी, with an animated doctor who explains every part.**

Seven anatomical layers (2,198 separate 3D parts) stream into the browser as compressed glTF. Every surface is shaded procedurally on the GPU, and 408 structures carry researched, sourced descriptions. Dr. Buddy, a hand-built 3D cartoon doctor, answers questions offline, points at what he's explaining and leads guided tours. Everything runs client-side: there is no backend and no API key.

![three.js](https://img.shields.io/badge/three.js-r186-000000?logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![WebGL2](https://img.shields.io/badge/WebGL-2.0-990000?logo=webgl&logoColor=white)
![Blender](https://img.shields.io/badge/Blender-4.5-F5792A?logo=blender&logoColor=white)
![glTF](https://img.shields.io/badge/glTF-Draco-87C540?logo=khronosgroup&logoColor=white)
![Languages](https://img.shields.io/badge/languages-English%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A5%80-38f5e6)
![No backend](https://img.shields.io/badge/backend-none-success)

![The landing page: a scanner sweeps up the body, peeling the skin away to reveal the muscles underneath](docs/screenshots/scan.gif)

> [!NOTE]
> For learning only. Nothing here is medical advice. Dr. Buddy says so himself and declines to diagnose.

## Contents

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Quick start](#quick-start)
- [Screenshots](#screenshots)
- [The body](#the-body)
- [Controls](#controls)
- [Talking to Dr. Buddy](#talking-to-dr-buddy)
- [Guided tours](#guided-tours)
- [Architecture](#architecture)
- [Re-exporting the models from Blender](#re-exporting-the-models-from-blender)
- [Editing the content](#editing-the-content)
- [Engineering notes](#engineering-notes)
- [What the source model got wrong](#what-the-source-model-got-wrong)
- [Deploying](#deploying)
- [Troubleshooting](#troubleshooting)
- [Credits and licences](#credits-and-licences)

## Why this exists

Anatomy is spatial, and textbooks are flat. Free, accurate 3D anatomy data exists ([Z-Anatomy](https://www.z-anatomy.com/), built on the Japanese BodyParts3D database), but it lives in a 300 MB Blender file that most students will never open.

This project turns that data into something you can explore in any browser. It adds plain-language explanations at a first-year-student level, makes the body feel alive (a beating heart, flowing blood), and gives Hindi-speaking learners the same experience in their own language.

## Features

- 🧍 **Seven peelable layers:** skin, muscles, organs, arteries, veins, nerves and bones, each with its own opacity slider and 12 one-click quick views such as "Vessels + bones" and "X-ray skin".
- ❤️ **Live body:** blood pulses leave the heart through the arteries once per heartbeat and return through the veins. The heart beats (lub-dub), the lungs breathe and signals race along the nerves.
- 🩺 **Dr. Buddy:** an animated guide who answers typed or spoken questions offline, walks over to the part he's describing and points at it, and has idle animations (reading, a coffee break, a nap).
- 🧭 **Guided tours:** five narrated tours (Journey of blood, Skeleton, Digestion, Brain & nerves, Muscles) that move the camera, switch layers and explain each stop.
- 📚 **408 researched structures:** each with a summary, function, location, "did you know?" facts and source links, shown in medical or everyday names.
- 🇮🇳 **English and हिंदी:** the full interface, all descriptions, Dr. Buddy's knowledge, his voice and speech recognition. English medical names stay by default, with a separate switch for Hindi medical terms.
- 🔍 **Search:** finds structures by medical name, common name or Hindi name.
- 🎛️ **Three looks:** realistic tissue, hologram and X-ray.
- 🏷️ **Smart labels:** labels hide when the part they name is hidden behind another one, and never overlap each other.
- ⚡ **Runs anywhere:** Ultra, High and Fast quality levels are picked automatically for phones and low-power laptops. Motion is reduced for visitors who ask for it.
- 🎬 **Cinematic landing page:** the real body turns behind the title while a scanner peels it layer by layer as the models stream in.

## Quick start

On Windows, double-click **`start.bat`**. It installs the dependencies the first time and opens http://localhost:5173.

On any system:

```bash
cd web
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # static site in web/dist/
npm run preview    # serve the built site locally
```

Requirements: Node.js 20.19 or newer (or 22.12+), and a browser with WebGL2 (any current Chrome, Edge, Firefox or Safari).

> [!IMPORTANT]
> The site has to be served over HTTP. Opening `index.html` straight from disk won't work, because browsers block module scripts and model downloads from `file://` addresses.

## Screenshots

| | |
|:---:|:---:|
| ![Landing page](docs/screenshots/landing.jpg) | ![Live blood flow](docs/screenshots/live-blood-flow.jpg) |
| **Landing page:** the scanner peeling skin to muscle | **Live body:** blood pulses travelling through the vessels |
| ![Dr. Buddy explaining the heart](docs/screenshots/dr-buddy.jpg) | ![A guided tour stop on the femur](docs/screenshots/guided-tour.jpg) |
| **Ask Dr. Buddy:** answer plus the researched info card | **Guided tour:** the skeleton tour, stop 8 of 10 |
| ![Hologram render mode](docs/screenshots/hologram.jpg) | ![X-ray view](docs/screenshots/xray.jpg) |
| **Hologram mode:** organs, vessels and nerves | **X-ray skin:** see-through skin over bones, organs and vessels |
| ![Muscle labels](docs/screenshots/labels.jpg) | ![Hindi interface](docs/screenshots/hindi.jpg) |
| **Labels:** occlusion-aware, never overlapping | **हिंदी:** interface, descriptions and Hindi medical names |
| ![Hindi guided tour](docs/screenshots/hindi-tour.jpg) | <img src="docs/screenshots/mobile.jpg" alt="Phone layout" width="220"> |
| **Tours in Hindi:** Dr. Buddy narrates in हिंदी | **Phone layout** |

## The body

### The models

The models come from Z-Anatomy's Blender file. A pipeline script sorts them into seven layers, simplifies them to a triangle budget and writes one Draco-compressed GLB per layer.

| Layer | 3D parts | Target triangle budget | File size |
|---|---:|---:|---:|
| Bones | 271 | 260,000 | 1.20 MB |
| Muscles | 476 | 420,000 | 1.91 MB |
| Organs | 297 | 260,000 | 1.42 MB |
| Arteries | 417 | 160,000 | 1.58 MB |
| Veins | 226 | 140,000 | 1.04 MB |
| Nerves | 255 | 120,000 | 1.02 MB |
| Skin | 256 | 200,000 | 0.77 MB |
| **Total** | **2,198** | | **8.9 MB** |

Small parts (under 300 triangles) are never simplified, so a layer can land slightly above its budget. Layers download one after another behind the landing page; the bones come first, so the page is usable within seconds.

Reproductive anatomy is deliberately left out of both the models and the text, and the exporter generates a plain modesty garment over that area.

### The content

| Layer | Described structures |
|---|---:|
| Bones | 60 |
| Muscles | 120 |
| Organs | 54 |
| Arteries | 63 |
| Veins | 46 |
| Nerves | 42 |
| Skin | 23 |
| **Total** | **408** |

Dr. Buddy also knows 11 body-system overviews and 64 FAQ answers.

The descriptions were written by AI research agents working from trusted medical sources (StatPearls, Kenhub, TeachMeAnatomy, Cleveland Clinic, MedlinePlus and others), then checked by reviewer agents, whose corrections were applied. Every card lists its sources. The orchestration script is in [`pipeline/research-workflow.js`](pipeline/research-workflow.js).

The Hindi version was produced the same way: eight translator agents, one per file, with every number checked against the English, then a reviewer agent that unified terminology across files and fixed meaning errors.

> [!TIP]
> The Hindi translation is AI-assisted. A review by a native-speaking medical professional is very welcome; see [Editing the content](#editing-the-content).

## Controls

| Action | Mouse | Touch |
|---|---|---|
| Rotate | Left-drag | One-finger drag |
| Pan | Right-drag | Two-finger drag |
| Zoom | Scroll | Pinch |
| Select a part | Click | Tap |
| Part name | Hover | n/a |
| Talk to Dr. Buddy | Click him | Tap him |
| Search | Type, then <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd>, <kbd>Esc</kbd> to close | Type, then tap a result |

**The dock along the bottom:**

| Button | What it does |
|---|---|
| Real / Holo / X-ray | Render style |
| Ultra / High / Fast | Quality: Ultra adds ambient occlusion, High keeps glow and outlines, Fast turns post-processing off |
| Labels | Floating name tags for the visible structures |
| Live | Blood flow, heartbeat, breathing and nerve signals |
| Scan | The scanner sweep |
| Spin | Auto-rotate |
| Reset | Back to the starting view |
| SFX | Interface sounds |

The info card's **Isolate** button hides everything except the selected structure.

## Talking to Dr. Buddy

Dr. Buddy runs entirely in the browser, with no AI service behind him. [`brain.js`](web/src/brain.js) matches questions against the researched content, so his answers are always grounded in the sourced text. He understands:

| You say | He does |
|---|---|
| "Where is the femur?" / "What does the pancreas do?" | Answers from that structure's location or function, and flies the camera to it |
| "Tell me about the heart" / "What bones are in the hand?" | Shows the whole group (heart chambers and valves, hand bones) |
| "Rotator cuff", "quads", "hamstrings", "funny bone" | Knows common names for groups of structures |
| "How many bones are in the body?" | Answers from the FAQ |
| "Show me the veins" / "Hide the muscles" / "Show everything" | Changes the layers |
| "Zoom in", "Spin", "Reset" | Moves the camera |
| "Take me on a tour" | Lists the tours and starts the one you pick |
| "What causes a heart attack?" | Explains he can't give medical advice, suggests seeing a doctor and shows the related anatomy |
| "दिल के बारे में बताओ" / "dil kya karta hai" | The same, in Hindi or Hinglish |

His voice uses the browser's built-in speech (Edge's "Natural" voices sound best), and the 🎤 button uses browser speech recognition (Chrome and Edge).

## Guided tours

| Tour | Stops | Route |
|---|---:|---|
| ❤ Journey of blood | 12 | Vena cava → right heart → lungs → left heart → aorta → legs → back. Live blood flow switches on. |
| 🦴 Your skeleton | 10 | Skull → spine → ribs → arm → hand → hip → femur → kneecap → foot |
| 🍎 Digestion | 10 | Oesophagus → stomach → liver → gallbladder → pancreas → small and large intestine → appendix |
| ⚡ Brain & nerves | 10 | Brain lobes → cerebellum → brainstem → cranial nerves → brachial plexus → sciatic nerve |
| 💪 Muscles in action | 11 | Shoulder → arm → chest → belly → diaphragm → hip → thigh → calf |

Start a tour from the left panel, from the landing page, or by asking Dr. Buddy. A tour bar lets you pause, step back and forth or exit. Each stop's explanation is taken from the researched content; only the short linking lines ("Next stop: the stomach") are written for the tour. Stops stay on screen at least as long as it takes to read them, even when the browser has no voice.

## Architecture

```
source/Z-Anatomy/Startup.blend ─► pipeline/export_layers.py ─► web/public/models/*.glb ─┐
                                    (Blender, headless)                                 │
pipeline/research-workflow.js ──► content/*.json ──► content/i18n/hi/*.json ────────────┼─► web (Vite + three.js)
       (research agents)          (408 structures)    (Hindi, loaded on demand)         │
```

| File | Role |
|---|---|
| [`web/src/main.js`](web/src/main.js) | Wires up the interface: landing page, layer panel, presets, dock, search, info card, language switch |
| [`web/src/anatomy.js`](web/src/anatomy.js) | The 3D engine: loading, picking, highlighting, camera moves, labels, render modes, live animations, the sci-fi stage and post-processing |
| [`web/src/materials.js`](web/src/materials.js) | Procedural tissue shaders, live pulse shader, hologram shader |
| [`web/src/intro.js`](web/src/intro.js) | Landing-page scan that peels the layers |
| [`web/src/doctor.js`](web/src/doctor.js) / [`doctorModel.js`](web/src/doctorModel.js) | Dr. Buddy: the model built from primitives, animation states, speech bubble, voice and microphone |
| [`web/src/brain.js`](web/src/brain.js) | Offline question answering in English and Hindi |
| [`web/src/tours.js`](web/src/tours.js) | Tour definitions and the tour runner |
| [`web/src/content.js`](web/src/content.js) | Loads and indexes content; swaps languages in place |
| [`web/src/i18n.js`](web/src/i18n.js) | Interface strings in English and Hindi |
| [`web/src/sfx.js`](web/src/sfx.js) | Interface sounds generated with WebAudio (no audio files) |
| [`pipeline/export_layers.py`](pipeline/export_layers.py) | Blender script: Z-Anatomy → seven layer GLBs |

```
3D_Human/
├── web/                 # the website (Vite + three.js)
│   ├── src/             # application code
│   └── public/models/   # one Draco GLB per layer
├── content/             # researched text (JSON), plus i18n/hi/ for Hindi
├── pipeline/            # Blender export + research orchestration scripts
├── docs/screenshots/    # images used in this README
├── source/              # Z-Anatomy download (not in git; only needed to re-export)
└── start.bat            # one-click start on Windows
```

## Re-exporting the models from Blender

You only need this to change the models. The site itself runs from the GLBs already in `web/public/models/`.

1. Download Z-Anatomy from [z-anatomy.com](https://www.z-anatomy.com/) and unzip it so that `source/Z-Anatomy/Startup.blend` exists. It's about 300 MB, so it isn't in the repository.
2. Run the exporter with Blender 4.5:

   ```bash
   "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b source/Z-Anatomy/Startup.blend --python pipeline/export_layers.py
   ```

3. To re-export only some layers, set `ZLAYERS` first, for example `ZLAYERS=organs,skin`.

> [!WARNING]
> `export_layers.py` has the project path hard-coded in `ROOT` at the top. Change it if your checkout lives somewhere else.

## Editing the content

| What | Where |
|---|---|
| A structure's text | `content/<layer>.json` → `structures[]`. `match` must list the exact 3D object names from `content/names/<layer>.txt`. |
| Hindi text | `content/i18n/hi/<layer>.json`, keyed by structure `id` |
| Dr. Buddy's FAQ, overviews and lines | `content/doctor.json` (Hindi in `content/i18n/hi/doctor.json`; the FAQ is in the same order) |
| Interface strings | `web/src/i18n.js` |
| Group nicknames ("quads") | `ALIASES` in `web/src/brain.js` |
| Tours | `TOURS` in `web/src/tours.js` |
| Quick views | `PRESETS` in `web/src/main.js` |

To add a language, add `content/i18n/<code>/` with the same files as `hi/`, add a string table to `i18n.js`, and add a `data-lang="<code>"` button next to the existing EN / हिंदी buttons in `web/index.html` (there are two sets: one on the landing page, one in the top bar).

## Engineering notes

- **Tissue shading without textures.** The models have no UV coordinates, so every surface (bone pores, muscle fibres, wet organ sheen, skin pores) is generated from 3D noise in object space, injected into `MeshPhysicalMaterial` with `onBeforeCompile`. Muscle fibres follow each mesh's long axis, which is found by principal component analysis at load time.
- **Blood flow is a shader, not particles.** Each vessel fragment measures its distance from the heart. A travelling band, with wavelength equal to speed × heartbeat period, means exactly one pulse leaves per beat: outward in arteries, inward in veins. Nerves do the same from the brainstem.
- **A beating heart that stays attached.** The heart and the coronary vessels on its surface scale together about the heart's centre, so the vessels don't drift off the muscle.
- **The landing-page peel** uses per-layer clipping planes that move with the scan line. The plane array keeps the same identity every frame, so shaders don't recompile. Ambient occlusion is switched off during the peel, because it would otherwise draw a ghost of the layer being cut away.
- **Fast picking.** Clicks and hovers raycast against `three-mesh-bvh` bounding-volume trees, which stays quick across 2,198 meshes.
- **Labels that behave.** Every 180 ms each label raycasts from the camera to its structure and hides if something is in front, then labels are placed largest-first so they never overlap.
- **Hindi-aware matching.** JavaScript's `\b` only understands ASCII, so word boundaries use Unicode-aware lookarounds. Spelling variants (जाँघ/जांघ, ज़/ज) are normalised, and name fragments made only of filler words are ignored.
- **Lean language switching.** Hindi content ships as separate chunks that download only when हिंदी is chosen, and entries are swapped in place, so the 3D scene and selection survive the switch.
- **Speech that can't race.** A cancelled utterance's late `end` event is ignored, and tour stops wait at least the reading time of their text, so tours pace correctly even with no voice installed.
- **Loading that recovers.** Each layer retries once automatically. A failed layer shows **RETRY**, and the landing page never locks visitors out.

## What the source model got wrong

Z-Anatomy is excellent, but a few things in the Blender file needed fixing or working around:

| Problem | Fix |
|---|---|
| A stray 4.9 cm hole in the stomach wall | The exporter seals it (`SEAL_HOLES`) and keeps the real oesophagus and duodenum openings |
| One curve under "Coronary sinus" is named `????????` | Renamed to *Small cardiac vein* from its course (`FIXNAMES`) |
| Mirrored left-side (`.l`) objects have inverted normals | Normals are flipped back when the object's transform is mirrored |
| Some skin patches face inward | Each patch votes against a welded, consistently oriented copy of the whole skin and is flipped if it loses |
| Visible seams between skin patches | Normals of shared vertices are averaged at load time (`weldNormals`) |
| The eyes exist in both the skin and organs collections | Both are exported, but only one copy is drawn when both layers are on, and each copy gets its own layer's description |

## Deploying

`npm run build` produces a fully static site in `web/dist/`. Upload that folder to any static host: GitHub Pages, Netlify, Vercel, Cloudflare Pages or a plain web server. Asset paths are relative, so it works at a domain root or in a subfolder without configuration.

> [!NOTE]
> The 🎤 microphone needs HTTPS (or `localhost`), which is a browser rule for speech recognition. Everything else works over plain HTTP too.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Blank page when opening `dist/index.html` | It needs a server: run `npm run preview` or host it (see [Quick start](#quick-start)) |
| A layer shows **RETRY** | Its download failed. Click the layer to try again. |
| Laggy on a laptop or phone | Switch the dock to **Fast**. Phones start on Fast automatically. |
| Dr. Buddy doesn't speak | The browser has no voice for the current language. The text still shows, and tours still advance. |
| Hindi is read with an English accent | Install a Hindi voice (Windows: Settings → Time & language → Speech), or use Edge or Chrome |
| No 🎤 button | The browser lacks speech recognition (e.g. Firefox). Use Chrome or Edge. |
| An old model still shows after re-exporting | Hard-refresh with <kbd>Ctrl</kbd>+<kbd>F5</kbd> |
| Port 5173 is busy | `npm run dev -- --port 5174` |

## Credits and licences

- **3D models:** [Z-Anatomy](https://www.z-anatomy.com/) (CC BY-SA 4.0), derived from [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/) © The Database Center for Life Science (CC BY-SA 2.1 JP). The models here were simplified and modified for the web, and these derived models are shared under the same licence.
- **Libraries:** [three.js](https://threejs.org/) (MIT), [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) (MIT), [Vite](https://vitejs.dev/) (MIT).
- **Fonts:** Orbitron, Rajdhani and Baloo 2 from Google Fonts (SIL Open Font License).

> [!WARNING]
> Z-Anatomy includes a kidney model by Lissie Cowley (CC BY-NC 4.0), and it is part of the organs layer here. That licence forbids commercial use, so replace the kidney before any commercial release.
