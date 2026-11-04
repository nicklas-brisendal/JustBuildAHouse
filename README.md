# JustBuildAHouse

A house described as data, previewed as a 3D walkthrough and 2D plans in the browser.
No install beyond Node. Three.js is loaded from a CDN. Built for a one-day team design session with Claude Code.

Shared page: https://claude.ai/artifact/8euEAXQYsjZV1aJyjaBbuT (private until shared from its Share menu; republished by Claude Code from `index.html`).

## Files

| File | Purpose |
| --- | --- |
| `house.json` | The design. Storeys with rooms, openings, decks and stairs, plus roof, wall sizes and site (lake, terrain). The single source of truth. |
| `index.html` | The viewer. Self-contained page: 3D view with floor picker, walk mode, 2D plan per storey, room table, in-page spec editor. |
| `assets/Start_image.jpg` | The start screen photo. Shown with a Start button when the page opens without a view in the link; links such as `#plan` or `#tour` skip it. Published next to the page. |
| `assets/sky.jpg` | The sky: a tone-mapped equirectangular photo, used as background and as environment light. Published next to the page. |
| `tools/convert-sky.mjs` | Turns an equirectangular `.exr` (for example from Poly Haven) into `assets/sky.jpg`. |
| `build.mjs` | Copies `house.json` into `index.html` between the `SPEC-START` and `SPEC-END` markers, then writes `docs/index.html` and `docs/sky.jpg`. |
| `docs/` | Build output: the standalone page plus the sky, ready for any static host. |

## Workflow

1. Edit `house.json` (or ask Claude Code to).
2. Run `node build.mjs`.
3. Open `index.html` in a browser, or ask Claude Code to republish the shared page.

Anyone can also tweak the spec live in the page's Spec tab, press Apply, then Copy JSON and paste it back into the chat so `house.json` catches up.

Linkable views: append `#plan`, `#top`, `#dollhouse` (top view, roof off), `#walk`, `#north` (the entrance side), `#garden` (the lake side at eye level) or `#tour` (opens a guided tour, paused at the start) to the page URL. Any of these also skips the start screen.

## Swapping the sky

Any 2:1 equirectangular HDRI works. From a folder with Node available:

```sh
npm install three@0.170.0 jpeg-js@0.4.4
node tools/convert-sky.mjs meadow_2_4k.exr assets/sky.jpg 4096
node build.mjs
```

The third argument is the output width (4096 gives about 2.5 MB, 2048 about 0.7 MB). A fourth argument overrides the automatic exposure. The 4k source is plenty; the `.exr` itself is never shipped and is ignored by git. When the page is opened straight from disk (file://) the browser cannot read the image into WebGL, so it falls back to a plain blue sky; served or published it shows the photo.

## Spec reference

All lengths are metres. Plan axes: `x` runs east, `y` runs north. A room's `x`,`y` is its south-west corner.

```json
{
  "name": "Husprojekt",
  "description": "Shown in the Rooms tab.",
  "exteriorWall": 0.3,
  "interiorWall": 0.12,
  "slab": 0.3,
  "roof": { "type": "gable", "pitch": 27, "overhang": 0.5, "ridge": "y" },
  "exterior": { "preset": "ochre" },
  "site": {
    "lake": { "x": -6, "y": -24, "w": 26, "d": 14, "rotate": -12 },
    "terrain": { "high": -0.1, "low": -2.8, "highY": 13.3, "lowY": 4.8 }
  },
  "floors": [
    {
      "name": "Bottenvåning", "level": 0, "height": 2.6,
      "rooms":    [ { "name": "Kök", "x": 0, "y": 8, "w": 4, "d": 5, "floor": "tile" } ],
      "openings": [ { "type": "door", "room": "Entré / Hall", "side": "south", "offset": 0.3, "width": 0.9, "label": "Entré" } ],
      "decks":    [ { "name": "Altan", "x": -0.3, "y": -3.6, "w": 8.4, "d": 4.9, "material": "wood" } ],
      "stairs":   [ { "x": 0.15, "y": 4.95, "w": 2.3, "d": 2.9, "dir": "north", "shape": "u", "steps": 15 } ]
    }
  ]
}
```

- **floors**: one entry per storey. `level` 0 is the entrance floor, negative levels are below ground, positive above. Storeys stack automatically: each sits `slab` metres above the top of the one below, or give an explicit `elevation`. A spec with `rooms` and `openings` at the top level is still accepted as a single storey.
- **rooms**: axis-aligned rectangles. Rooms that touch share an interior wall automatically. Edges that touch nothing become exterior walls, placed outside the room so `w` and `d` are clear inside sizes. `floor` is `oak`, `pine`, `walnut`, `tile`, `concrete`, `carpet`, `slate` or a hex colour. Names must be unique within a storey.
- **openings**: `type` is `door` (with a leaf that swings into the named room), `window` or `opening` (a gap with no leaf). `side` is `north`, `south`, `east` or `west`. `offset` is measured from the west end of a north or south wall, and from the south end of an east or west wall. Defaults: doors 0.9 wide and 2.1 high, windows 1.2 wide and 1.2 high with a 0.9 sill.
- **decks**: terraces at that storey's level. `wood` decks stand on posts down to the ground, `stone` ones lie on it.
- **stairs**: a stair rising from that storey to the one above. `dir` is the climbing direction of the first flight, `shape` is `straight` or `u` (two flights with a landing).
- **roof**: `gable` or `flat`, over the top storey. `pitch` in degrees, `overhang` in metres, `ridge` is `x`, `y` or `auto` (along the longer side).
- **exterior**: facade, roof covering and trim, after typical Swedish houses. `preset` sets everything at once:

  | Preset | Facade | Trim | Roof |
  | --- | --- | --- | --- |
  | `ochre` (default) | yellow ochre board-and-batten | white | red tiles |
  | `falu` | Falu red board-and-batten | white | black tiles |
  | `white` | lime-white horizontal boards | white | black standing-seam metal |
  | `grey` | pearl-grey horizontal boards | white | black tiles |
  | `black` | tar-black board-and-batten | natural wood | black standing-seam metal |

  Any piece can be overridden on top of the preset: `facade` and `plinth` take a `material` (`board-vertical`, `board-horizontal`, `render`, `brick`) and a `color`; `roof` takes `tile`, `metal` or `felt` and a `color`; `trim` is just a colour (corner boards, window and door casings, barge boards, fascia, soffit). A colour is a hex value or one of `falu`, `ochre`, `limewhite`, `white`, `pearlgrey`, `grey`, `darkgrey`, `black`, `tilered`, `brick`, `yellowbrick`, `wood`, `concrete`. The `plinth` is a rendered band from the floor to `height` (default 0.35 m) above the ground, following the slope; list storey levels in `floors` (for example `[-1]`) to render those storeys' walls entirely, or set `"plinth": false` for none. Example: `{ "preset": "falu", "roof": { "material": "metal", "color": "darkgrey" } }`. Board facades get corner boards and window casings; render and brick facades only get window sills.
- **site.terrain**: ground height `high` north of `highY` and `low` south of `lowY`, with a straight slope between. This is how a souterräng storey ends up buried on the uphill side and open on the downhill side.
- **site.trees**: a `list` of trees (`x`, `y`, height `h`, `kind` leaf, pine or birch) and/or a `scatter` (`count`, `seed`, `spacing`, `area`) that plants trees at random but never on the house, decks or lake. Change the seed for another arrangement.
- **site.plot**: the plot rectangle with a `boundary` of `hedge`, `fence` or `none` on the listed `sides`. Paths that cross a side cut a gap through it.
- **site.paths**: gravel or stone strips that follow the ground, each a polyline of `points` with a `width`. A wide short path makes a parking pad.
- **site.jetty**: a wooden deck on posts at the water level plus `height`, placed with x, y, w, d like a room.
- **site.beds**: garden beds with `plants` set to `flowers` or `shrubs`.
- **site.neighbours**: plain house blocks with wall height `h`, a gable or flat roof and a `ridge` direction, for scale. Put them on flat ground; a block does not follow the slope.
- **tour**: optional route for the Tour button: `{ "speed": 1.2, "stops": [ { "level": 0, "room": "Hall" }, { "room": "Kök", "pause": 2, "look": "Matplats" }, { "level": -1, "x": 5, "y": -2.5, "label": "Uteplats" } ] }`. A stop is a room name (string or `room`) or an `x`,`y` point; a stop without `level` stays on the previous stop's storey. `pause` is seconds, `look` (room name or `{x, y}`) turns the view during the pause, `speed` is metres per second. The route finds its own way through doors and openings, round stairs that stand in the way, and up or down the stairs between storeys. Without `tour`, the Tour button visits every room automatically.
- **people**: simple figures on a storey (`level`, `x`, `y` in storey coordinates) with an optional `name` shown above the head, `facing` as a compass bearing, `shirt`, `trousers`, `hair` and `skin` colours, `silhouette` for an all-black figure and `wave`. They also appear as markers in the plan.
- **site.lake**: optional. A lake with a soft natural outline inside the box `x`, `y`, `w`, `d`, turned by `rotate` degrees, lying at the low terrain level.
- The walk camera starts inside the first exterior door of the chosen storey, preferring one whose `label` contains "entrance", "entré", "front" or "main".

The page validates the spec and refuses to apply one with errors (unknown room, bad side, non-numeric sizes, duplicate levels). Overlapping rooms, openings that run past a wall and a lake under the house are warnings.

## Viewer controls

- **Orbit**: drag to turn, scroll or pinch to zoom, right-drag or two-finger drag to pan.
- **Top**: straight down on the chosen storey. Toggle **Roof** off for a dollhouse view of the whole house.
- **Floors**: pick a storey to see it as a dollhouse with everything above removed, or All for the whole house. The Plan view and the Walk start follow the same choice.
- **Walk**: click the view, drag to look, W A S D or arrow keys to move, Shift to hurry, Esc to leave. On touch screens an on-screen pad appears.
- **Tour**: a guided walk at eye height through every room, up and down the stairs, ending outside the last garden door. Play/pause with the button or Space, drag to look around on the way, any movement key takes over in Walk, Esc ends it. The Plan view shows the route and numbered stops while a tour is loaded.
- **Plan**: scaled 2D drawing of the chosen storey with room areas, door swings, windows, stairs, decks and overall dimensions.

## Local preview

Double-clicking `index.html` works (with the plain sky). For the photo sky and for phones on the local network, serve the folder:

```sh
npx --yes serve .
```

## Hosting so anyone can visit

The page is one static file plus the sky image, with no backend. Three.js and the fonts come from public CDNs, so any static host works.

- **Quickest**: the claude.ai page above. Its Share menu can open it to the organisation or to anyone with the link, if the workspace policy allows that.
- **Free and permanent**: GitHub Pages. Push this folder to a repository, then in the repository settings choose Pages, "Deploy from a branch", branch `main`, folder `/docs`. The page appears at `https://<user-or-org>.github.io/<repo>/` a minute later, and every push that changes `docs/` updates it.
- **Drag and drop**: Netlify Drop or Cloudflare Pages take the `docs` folder from a browser and give a public URL.
- **Inside the company**: Azure Static Web Apps or any internal web server that can serve two static files.

## Surroundings roadmap

The plot is built up in small steps so work can stop and resume at any point. Each step is a spec addition plus its drawing code.

1. **Done.** Grass texture in place of the grid, trees by list and by seeded scatter.
2. **Done.** Gravel drive and parking pad, path down to the lake, wooden jetty on posts (`site.paths`, `site.jetty`).
3. **Done.** Flower and shrub beds, hedge or fence on the plot boundary with gaps where paths cross, neighbouring houses as plain blocks (`site.beds`, `site.plot`, `site.neighbours`).
4. Terrain as a gentle heightmap rather than one straight ramp, and water with ripples and reflections.
5. Sun position taken from the sky photo so shadows match the light.

## Known limits

Rectangular rooms, one roof over the top storey, a stair that is a placeholder rather than a cut through the floor above, no collision in walk mode, the tour passes close to walls where a stair fills a room (as in the entrance-floor Trapphall), and the terrain slopes only along the north-south axis. All of these are natural next steps if the team wants them.
