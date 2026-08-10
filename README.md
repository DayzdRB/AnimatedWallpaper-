# AnimatedWallpaper

An original, cinematic Paris wallpaper rendered entirely in the browser.

## Current milestone

**v0.5.0 — Physical scene model**

The scene is no longer a stack of separately authored pictures with their own
time-of-day colour tables. Everything now derives from one place.

### What drives the picture

Real solar and lunar position for Paris, computed per frame. Sky, sun colour,
cloud lighting, plate relighting, star visibility and season all read from a
single derived environment object, so no layer can drift out of step with
another. There are no hand-authored time-of-day colour tables left anywhere.

- Solar and lunar ephemeris (NOAA / Meeus), validated against known geometry
- Rayleigh and Mie single scattering with Kasten-Young airmass, plus a
  multiple-scattering term so the anti-solar sky stays blue at sunset
- Sun colour and brightness from measured atmospheric extinction, so a low sun
  is orange **and** dimmer, and refraction visibly flattens the disc
- Sun at its true angular diameter of 0.53 degrees, which is 2.8 per cent of
  frame height. The glow does the work, not the disc
- Moon with real phase, correct terminator orientation and earthshine
- Twilight staged by solar altitude: golden, civil, nautical, astronomical
- Auto exposure that adapts **incompletely**, so dusk is darker than sunset

### Camera

The camera is calibrated against the artwork rather than guessed. In
`paris-city-day.png` the tower tip sits at y=78 and its ground line solves to
y=576, so 330 m spans 497 px. From a viewpoint 1.9 km away that fixes:

| Quantity | Value |
| --- | --- |
| Focal length | 3.03 frame heights |
| Vertical field of view | 18.74 deg |
| Horizontal field of view | 32.70 deg at 16:9 |
| Horizon | 53.1 per cent of frame height |
| Highest elevation in shot | 9.94 deg |

That last row explains most of the scene's behaviour, including why a
physically correct sun is out of frame for much of the day.

### Air traffic

Aircraft are physical objects. Each carries a real length and an operating
profile authored as an elevation range and a slant range, from which altitude,
ground distance, apparent size and crossing time are all derived. You cannot
make an aircraft larger without also bringing it nearer or lower.

| Profile | Size at 1080p | Altitude | Distance | Crossing |
| --- | --- | --- | --- | --- |
| Airliner, approach | 19 px | 1 543 ft | 6.5 km | 42 s |
| Airliner, climb out | 6 px | 6 965 ft | 19.4 km | 91 s |
| Airliner, cruise | 2 px | 30 971 ft | 69.4 km | 235 s |
| Helicopter, city work | 20 px | 558 ft | 1.9 km | 32 s |

Lighting follows the actual convention: red to port, green to starboard, white
astern, a red anti-collision beacon at 40 to 100 flashes per minute, white
strobes at the tips, and landing lights only in the terminal area. Below about
eighteen pixels the lights are closer together than one pixel, so they merge
into a single point source, which is also what the eye sees. After dark the
airframe drops to near zero opacity and the lights carry the aircraft.

Run `npm run verify:geometry` to print the derived geometry after changing any
profile.

### Clouds

Two techniques, because clouds are not all one kind of object.

- Flat types (cirrus, stratus, stratocumulus, storm base) are projected in
  perspective onto a horizontal plane at their real cloud base, so they converge
  toward the horizon and occupy the same space as the aircraft. Mip levels are
  selected per strip, and decks fade into haze before the aliased far field
  becomes visible.
- Fair weather cumulus are billboards, because a plan view projected onto a
  plane cannot show a cumulus from the side, and at a ten degree field of view
  the side is most of what you see.

Cloud textures store density and surface orientation, never colour. That is what
allows the same cloud to be lit warm at sunset and cold at noon.

### Seasons

Applied through masks extracted from the plates themselves: a foliage mask and
an upward-facing-surface mask for lying snow. The foliage tint uses a `color`
blend, which shifts hue while keeping the original luminance and detail. Masks
are generated for every plate including the tower, which fixes the previous
behaviour where the season overlay sat below the tower plate and left the tower
summer green in a snowstorm.

### Destruction sequence

Fictional, and now actually animated rather than two static images cross fading.

Staged as flash, fireball, rise, shock, settle, rebuild. The fireball expands as
roughly t^0.4 (Taylor-Sedov) and cools white through yellow and orange to deep
red as it grows. It rises buoyantly, drawing a stem, and the cap spreads as the
rise stalls. Two canvases are used because smoke has to be on both sides of the
city: the column behind the skyline, the dust front sweeping across in front of
it. The city is relit by the blast, and no aircraft fly for the duration.

## Known tradeoff: sun tracking

In a 33 degree frame, a physically correct sun is outside the picture for most
of any given day. You can have true azimuth or a visible sunset, not both.

- `framed` (default) remaps the day's arc so the sun crosses the picture, while
  keeping the seasonal difference in arc height. December noon sits at 42 per
  cent of frame height, June noon at 12 per cent.
- `realistic` puts the sun exactly where it is, and accepts that it is often out
  of shot. The sky still lights correctly and the glow shows where the sun is.

Settable in the panel. The panel also shows a live readout of solar altitude,
azimuth, twilight band, lunar phase and season.

## Run locally

```bash
npm install
npm run dev
```

Production build with `npm run build`, output in `dist/`.

Regenerate the procedural assets with `npm run assets` (needs Python with numpy
and Pillow). This is only necessary if you change the generators.

## Deploy to Vercel

Framework is detected as Vite.

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

## Planned

- Live Paris weather feeding the atmosphere parameters directly
- Volumetric cloud shading rather than a two mask approximation
- Comets and rare sky events
- Desktop integration through Tauri
