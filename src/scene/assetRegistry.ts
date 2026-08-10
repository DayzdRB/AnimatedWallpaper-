export const parisAssets = {
  proxy: {
    anchorDay: '/assets/paris/proxy/anchor-day.png',
    anchorGolden: '/assets/paris/proxy/anchor-golden.png',
    cityGround: '/assets/paris/proxy/city-ground-proxy.png',
    arc: '/assets/paris/proxy/arc-proxy.png',
    eiffel: '/assets/paris/proxy/eiffel-proxy.png',
  },
  masks: {
    arc: '/assets/paris/masks/arc-occlusion.png',
    eiffel: '/assets/paris/masks/eiffel-occlusion.png',
    foliage: '/assets/paris/masks/foliage.png',
    roadWetness: '/assets/paris/masks/road-wetness.png',
    snowAccumulation: '/assets/paris/masks/snow-accumulation.png',
  },
  aircraft: [
    '/assets/paris/fx/aircraft/aircraft-a220.webp',
    '/assets/paris/fx/aircraft/aircraft-a320.webp',
    '/assets/paris/fx/aircraft/aircraft-b737.webp',
    '/assets/paris/fx/aircraft/aircraft-falcon8x.webp',
    '/assets/paris/fx/aircraft/aircraft-h135.webp',
  ],
  nuke: {
    fireball: '/assets/paris/fx/nuke/destruction-fireball.png',
    mushroom: '/assets/paris/fx/nuke/destruction-mushroom.png',
  },
} as const
