# AnimatedWallpaper-

An original, cinematic Paris wallpaper rendered entirely in the browser.

## Current milestone

**v0.3.0 — Paris Sky Traffic**

- Full-viewport, time-aware Paris scene
- Original illustrated Paris day and night artwork
- Live Paris time using the `Europe/Paris` IANA time zone
- Live viewer-local time
- French greeting based on the current time in Paris
- Reusable aurora text and click-origin ripple button components
- Browser fullscreen control with a graceful unsupported state
- Responsive desktop and mobile composition
- Reduced-motion support
- Persistent wallpaper settings panel
- Paris, local, or custom time-based lighting
- Independent Paris time, local time, date, and greeting controls
- 12/24-hour clock and ambient-motion preferences
- Greeting follows the displayed wallpaper time, including custom time
- Left-to-right aircraft flybys with distinct airliner, business jet, general-aviation, and helicopter profiles
- A220, A320, 737, CRJ700, Cessna 172, Piper Cub, DA40, Vision Jet, and private-jet variants
- Fictional liveries, navigation lights, strobes, beacons, and nighttime landing lights
- Local clear, rain, thunderstorm, and snow effects
- Weather-responsive cloud scale, including a heavier storm ceiling
- Continuous sun and moon movement with time-progressive scene color and brightness
- Automatic or manual seasons, including autumn foliage and winter snow accumulation
- Neutral translucent settings glass with a reliably visible close control

No photography or external artwork is required.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

The production files are written to `dist/`.

## Deploy to Vercel

Import this repository into Vercel. The framework should be detected as **Vite** automatically.

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

## Web-first strategy

The wallpaper renderer is being developed and polished on the web first. Desktop integration is deliberately postponed until the renderer, scenes, transitions, and performance are mature.

## Planned features

- Live Paris weather
- Live weather-driven rain, snow, clouds, and lightning
- Comets and rare sky events
- Wallpaper packs
- Desktop integration through Tauri
