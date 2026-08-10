# Paris Animated Wallpaper — Layered Rebuild

A React + TypeScript milestone implementation of the layered Paris wallpaper renderer.

## Run

```bash
npm install
npm run dev
```

Build production output with:

```bash
npm run build
```

## Architecture

The scene is deliberately split into independent rendering layers instead of treating the wallpaper as one image plus global tint filters.

Render order currently includes:

1. generated sky gradient / stars
2. animated cloud canvas
3. far atmospheric haze
4. far aircraft
5. midground city/ground proxy
6. season-specific foliage and snow accumulation masks
7. road wetness mask
8. near aircraft
9. Eiffel Tower occlusion proxy
10. Arc de Triomphe occlusion proxy
11. local city / monument lighting
12. foreground fog
13. leaves / precipitation
14. storm lightning
15. independent special-event renderer
16. React UI

## Important: proxy art

`public/assets/paris/proxy/anchor-day.png` is being used as the composition reference for the first milestone. It is **not** treated as the permanent production scene.

The project creates temporary cutout proxies for the city, Arc de Triomphe, and Eiffel Tower so aircraft can already be tested behind the landmarks. Replace the proxy files with final separated artwork later without changing the renderer architecture.

## Weather provider

The renderer consumes normalized `WeatherSnapshot` data. `DemoWeatherProvider` is deliberately separate from rendering and can be replaced with a live provider later.

## Snow behavior

Accumulated snow and falling snow are separate systems. Snow brightness comes from the lighting engine; night snow is intentionally much darker and cooler than daylight snow, with localized warm response near city lights.

## Asset paths

Production replacements belong under `public/assets/paris/`. The central registry is `src/scene/assetRegistry.ts`.

## Current milestone limitations

- The landmark masks are production placeholders derived from the reference image and should eventually be replaced by clean alpha assets.
- Weather is normalized from a demo provider, not a live Paris weather service yet.
- Building/window lights are procedural placeholders until dedicated light masks exist.
- The destruction sequence is functional as an independent subsystem but is not final art.
