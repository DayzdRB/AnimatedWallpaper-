#!/usr/bin/env python3
"""
Generates the runtime assets the renderer needs.

The important idea: nothing produced here carries baked-in lighting. Cloud
textures store density and surface orientation, not colour, so the same cloud
can be lit warm at sunset and cold at noon. The previous cloud art was painted
pink, which is why it only ever belonged at one time of day.

Cloud channel packing (RGBA):
  R = upward facing surface, receives direct sun
  G = downward facing surface, sits in shadow
  B = vertical position within the cloud, 0 at base and 1 at top
  A = optical density

Run from the repo root:  python3 tools/generate-assets.py
"""

import os
import numpy as np
from PIL import Image, ImageFilter

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
RNG = np.random.default_rng(20260809)


def tileable_noise(width, height, periods_x, periods_y):
    """Periodic value noise on a lattice that wraps in both axes."""
    lattice = RNG.random((periods_y, periods_x)).astype(np.float32)
    ys = np.linspace(0, periods_y, height, endpoint=False)
    xs = np.linspace(0, periods_x, width, endpoint=False)
    y0 = np.floor(ys).astype(int) % periods_y
    x0 = np.floor(xs).astype(int) % periods_x
    y1 = (y0 + 1) % periods_y
    x1 = (x0 + 1) % periods_x
    fy = (ys - np.floor(ys))[:, None]
    fx = (xs - np.floor(xs))[None, :]
    fy = fy * fy * (3 - 2 * fy)
    fx = fx * fx * (3 - 2 * fx)
    top = lattice[np.ix_(y0, x0)] * (1 - fx) + lattice[np.ix_(y0, x1)] * fx
    bottom = lattice[np.ix_(y1, x0)] * (1 - fx) + lattice[np.ix_(y1, x1)] * fx
    return top * (1 - fy) + bottom * fy


def fbm(width, height, base_x, base_y, octaves=6, gain=0.5, lacunarity=2):
    total = np.zeros((height, width), np.float32)
    amplitude = 1.0
    norm = 0.0
    px, py = base_x, base_y
    for _ in range(octaves):
        total += amplitude * tileable_noise(width, height, max(int(px), 1), max(int(py), 1))
        norm += amplitude
        amplitude *= gain
        px *= lacunarity
        py *= lacunarity
    return total / norm


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def blur(array, radius):
    image = Image.fromarray((np.clip(array, 0, 1) * 255).astype(np.uint8))
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), np.float32) / 255


def pack_deck(density, name, thickness=1.0):
    """
    Write a cloud deck as a plan view height field.

    The renderer projects these in perspective onto a horizontal plane at a
    fixed altitude, so the texture is a map looking down on the deck, not a
    picture of a cloud from the side. Channels carry surface orientation and
    thickness so the runtime can light the deck from wherever the sun is,
    rather than shipping one baked lighting condition.

      R = height field normal, x component, 0.5 is flat
      G = height field normal, y component, 0.5 is flat
      B = normalised cloud top height
      A = optical density
    """
    density = np.clip(density, 0, 1)
    height_field = blur(density, 6) * thickness

    grad_y, grad_x = np.gradient(height_field * 90)
    normal_x = -grad_x
    normal_y = -grad_y
    length = np.sqrt(normal_x ** 2 + normal_y ** 2 + 1)
    normal_x /= length
    normal_y /= length

    rows, cols = density.shape
    rgba = np.zeros((rows, cols, 4), np.uint8)
    rgba[:, :, 0] = np.clip((normal_x * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    rgba[:, :, 1] = np.clip((normal_y * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8)
    rgba[:, :, 2] = np.clip(height_field * 255, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = (density * 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(os.path.join(ASSETS, f'deck-{name}.png'), optimize=True)
    print(f'  deck-{name}.png  coverage {100 * (density > 0.06).mean():.0f}%')


D = 1024


def make_cirrus_deck():
    # Ice fibres drawn out along the wind: low frequency one way, high the other.
    field = fbm(D, D, 4, 20, octaves=5)
    streak = fbm(D, D, 2, 44, octaves=4)
    return blur(smoothstep(0.48, 0.80, field * 0.6 + streak * 0.4) * 0.5, 2)


def make_stratocumulus_deck():
    # A broken deck: mostly covered, torn open in places.
    field = fbm(D, D, 10, 10, octaves=6)
    return blur(np.clip(smoothstep(0.40, 0.63, field) * 1.6, 0, 1), 4)


def make_stratus_deck():
    # Featureless overcast. Density varies slowly and never fully clears.
    field = fbm(D, D, 5, 5, octaves=5)
    return blur(np.clip(0.62 + 0.38 * field, 0, 1), 8)


def make_storm_deck():
    # A thunderstorm base seen from underneath, which is all a ten degree field
    # of view can show. Ragged, thick, and near total coverage.
    coarse = fbm(D, D, 4, 4, octaves=4)
    ragged = fbm(D, D, 16, 16, octaves=7, gain=0.58)
    density = np.clip(0.55 + 0.5 * coarse + 0.35 * (ragged - 0.5), 0, 1)
    return blur(np.clip(density * 1.25, 0, 1), 5)


def make_cumulus_billboards(cell=512, columns=4):
    """
    Discrete convective cells drawn as elevation views.

    A plan view projected onto a plane cannot show a cumulus from the side, and
    at this field of view the side is most of what you see. So fair weather
    cumulus are billboards with real vertical shading, placed individually at
    known distances, while genuinely flat cloud types use the projected deck.

      R = sunlit upper surface   G = shaded base   B = depth   A = density
    """
    sheet = np.zeros((cell, cell * columns, 4), np.uint8)
    for index in range(columns):
        field = fbm(cell, cell, 4 + index, 4, octaves=6, gain=0.56)
        ys = np.linspace(-1, 1, cell)[:, None]
        xs = np.linspace(-1, 1, cell)[None, :]

        # Wide, domed top, flat base: the classic cumulus silhouette.
        dome = np.clip(1 - np.hypot(xs * 0.85, (ys + 0.32) * 1.45), 0, 1) ** 1.1
        base = smoothstep(0.52, 0.30, ys)
        density = np.clip(smoothstep(0.34, 0.62, dome * 0.72 + field * 0.42) * base * 1.8, 0, 1)
        density = blur(density, 4)

        smooth = blur(density, 9)
        grad_y, _ = np.gradient(smooth)
        magnitude = np.abs(grad_y) + 1e-5
        facing_up = np.clip(grad_y / magnitude, 0, 1) * np.clip(magnitude * 55, 0, 1)
        facing_down = np.clip(-grad_y / magnitude, 0, 1) * np.clip(magnitude * 55, 0, 1)

        broad = blur(density, 26)
        lit = np.clip(facing_up * 0.55 + broad * 0.8, 0, 1) * density
        shade = np.clip(facing_down * 0.7 + (1 - broad) * 0.35, 0, 1) * density

        block = sheet[:, index * cell:(index + 1) * cell]
        block[:, :, 0] = (np.clip(lit, 0, 1) * 255).astype(np.uint8)
        block[:, :, 1] = (np.clip(shade, 0, 1) * 255).astype(np.uint8)
        block[:, :, 2] = (np.clip(broad, 0, 1) * 255).astype(np.uint8)
        block[:, :, 3] = (density * 255).astype(np.uint8)

    Image.fromarray(sheet, 'RGBA').save(os.path.join(ASSETS, 'cumulus-billboards.png'), optimize=True)
    print(f'  cumulus-billboards.png  {columns} cells')


def make_smoke_puff(size=256):
    """Single soft turbulent blob used by the destruction particle system."""
    field = fbm(size, size, 5, 5, octaves=6)
    ys = np.linspace(-1, 1, size)[:, None]
    xs = np.linspace(-1, 1, size)[None, :]
    radius = np.hypot(xs, ys)
    falloff = np.clip(1 - radius, 0, 1) ** 1.6
    density = np.clip(falloff * (0.45 + 0.85 * field), 0, 1)
    density = blur(density, 4)
    density *= np.clip(1 - radius, 0, 1) ** 0.5

    rgba = np.zeros((size, size, 4), np.uint8)
    rgba[:, :, 0] = 255
    rgba[:, :, 1] = 255
    rgba[:, :, 2] = 255
    rgba[:, :, 3] = (np.clip(density, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(os.path.join(ASSETS, 'smoke-puff.png'), optimize=True)
    print('  smoke-puff.png')


def hsv_of(array):
    r, g, b = array[:, :, 0], array[:, :, 1], array[:, :, 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    delta = np.maximum(mx - mn, 1e-6)
    hue = np.zeros_like(r)
    m = mx == r
    hue[m] = ((g[m] - b[m]) / delta[m]) % 6
    m = mx == g
    hue[m] = ((b[m] - r[m]) / delta[m]) + 2
    m = mx == b
    hue[m] = ((r[m] - g[m]) / delta[m]) + 4
    return hue * 60, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0), mx / 255.0


# Regions to exclude from the foliage mask, as fractions of the plate. The
# Eiffel Tower's ironwork reads as green and must not turn autumn orange.
TOWER_GUARD = (0.735, 0.0, 0.945, 0.62)


def make_season_masks(plate, guard_tower):
    path = os.path.join(ASSETS, plate + '.png')
    if not os.path.exists(path):
        return
    source = Image.open(path).convert('RGBA')
    array = np.asarray(source).astype(np.float32)
    alpha = array[:, :, 3]
    hue, saturation, value = hsv_of(array)
    height, width = alpha.shape

    foliage = (hue > 40) & (hue < 180) & (saturation > 0.10) & (alpha > 32)

    if guard_tower:
        x0, y0, x1, y1 = TOWER_GUARD
        guard = np.zeros_like(foliage)
        guard[int(y0 * height):int(y1 * height), int(x0 * width):int(x1 * width)] = True
        foliage = foliage & ~guard

    # Drop the one pixel fringe left by the plate's alpha cut.
    fol = blur(foliage.astype(np.float32), 1.2)
    fol = np.where(fol > 0.55, fol, 0)
    fol = blur(fol, 1.6)

    # Snow settles on surfaces that face up. Approximate those as pixels that
    # are brighter than the rows just below them.
    shifted = np.roll(value, 4, axis=0)
    upward = np.clip((value - shifted) * 3.2, 0, 1)
    snow = np.clip(upward * (alpha > 32) * smoothstep(0.10, 0.45, value), 0, 1)
    snow = blur(snow, 1.4) * 1.4
    snow = np.clip(snow, 0, 1)

    for name, mask in (('foliage', fol), ('snow', snow)):
        rgba = np.zeros((height, width, 4), np.uint8)
        rgba[:, :, 0] = 255
        rgba[:, :, 1] = 255
        rgba[:, :, 2] = 255
        rgba[:, :, 3] = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
        out = os.path.join(ASSETS, f'{plate}-{name}.png')
        Image.fromarray(rgba, 'RGBA').save(out, optimize=True)
        print(f'  {plate}-{name}.png  coverage {100 * (mask > 0.1).mean():.1f}%')


if __name__ == '__main__':
    print('cloud decks')
    pack_deck(make_cirrus_deck(), 'cirrus', thickness=0.25)
    pack_deck(make_stratocumulus_deck(), 'stratocumulus', thickness=0.7)
    pack_deck(make_stratus_deck(), 'stratus', thickness=0.35)
    pack_deck(make_storm_deck(), 'storm', thickness=1.0)

    print('billboards')
    make_cumulus_billboards()

    print('particles')
    make_smoke_puff()

    print('season masks')
    for plate in (
        'paris-city-day',
        'paris-tower-day',
        'paris-foreground-day',
        'paris-city-day-mobile',
        'paris-tower-day-mobile',
        'paris-foreground-day-mobile',
    ):
        make_season_masks(plate, guard_tower=plate.startswith('paris-city') or plate.startswith('paris-tower'))
