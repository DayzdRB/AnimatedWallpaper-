import { buildEnvironment } from '../src/lib/scene-environment.ts'
import { DEFAULT_SETTINGS } from '../src/lib/settings.ts'
import { AIRCRAFT } from '../src/lib/aircraft-catalog.ts'
import { projectedSize, horizontalFov, verticalFov, frameTopElevation } from '../src/lib/camera.ts'

const aspect = 16 / 9
console.log(`camera: vFov ${verticalFov().toFixed(2)} deg, hFov ${horizontalFov(aspect).toFixed(2)} deg, frame top ${frameTopElevation().toFixed(2)} deg elevation`)

console.log('\nenvironment through 21 June:')
for (const hour of ['02:00','05:00','08:00','12:00','17:00','19:30','21:00','23:00']) {
  const date = new Date(`2026-06-21T${hour}:00Z`)
  const env = buildEnvironment(date, DEFAULT_SETTINGS, aspect)
  console.log(
    `${hour}Z alt ${env.sun.apparentAltitude.toFixed(1).padStart(6)} ` +
    `az ${env.sun.azimuth.toFixed(0).padStart(3)} ` +
    `${env.band.padEnd(12)} night ${env.night.toFixed(2)} day ${env.daylight.toFixed(2)} ` +
    `sun ${env.sunDisc.padEnd(20)} amb ${env.ambient.padEnd(20)} sunXY ${env.sunPlacement.x.toFixed(2)},${env.sunPlacement.y.toFixed(2)} vis ${env.sunPlacement.visible}`
  )
}

console.log('\nwinter vs summer noon:')
for (const iso of ['2026-12-21T11:50:00Z','2026-06-21T11:45:00Z']) {
  const env = buildEnvironment(new Date(iso), DEFAULT_SETTINGS, aspect)
  console.log(`${iso} alt ${env.sun.apparentAltitude.toFixed(1)} season ${env.season} sunY ${env.sunPlacement.y.toFixed(3)} haze ${env.atmosphere.haze.toFixed(1)}`)
}

console.log('\napparent aircraft size at 1080p, and derived geometry:')
for (const type of AIRCRAFT) {
  const rows = type.profiles.map((p) => {
    const el = (p.elevation[0] + p.elevation[1]) / 2
    const slant = (p.slant[0] + p.slant[1]) / 2
    const alt = slant * Math.sin((el * Math.PI) / 180)
    const ground = slant * Math.cos((el * Math.PI) / 180)
    const px = projectedSize(type.length, slant) * 1080
    const halfAngle = ((horizontalFov(aspect) / 2 + 6) * Math.PI) / 180
    const cross = (2 * ground * Math.tan(halfAngle)) / ((p.speed[0] + p.speed[1]) / 2)
    const inFrame = el < frameTopElevation()
    return `${px.toFixed(0).padStart(3)}px ${(alt * 3.281).toFixed(0).padStart(6)}ft ${(ground / 1000).toFixed(1).padStart(5)}km ${inFrame ? 'in ' : 'OFF'} ${cross.toFixed(0).padStart(3)}s`
  })
  console.log(`  ${type.label.padEnd(22)} ${rows.join(' | ')}`)
}
