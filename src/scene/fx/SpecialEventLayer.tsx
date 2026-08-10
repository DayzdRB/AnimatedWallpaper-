import { useEffect, useState } from 'react'
import { parisAssets } from '../assetRegistry'

export function SpecialEventLayer({ eventId }: { eventId: number }) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (!eventId) return
    setActive(false)
    const raf = requestAnimationFrame(() => setActive(true))
    const stop = window.setTimeout(() => setActive(false), 15000)
    return () => { cancelAnimationFrame(raf); window.clearTimeout(stop) }
  }, [eventId])
  if (!active) return null

  return (
    <div className="scene-layer special-event special-event--nuke" aria-hidden="true">
      <div className="nuke-flash" />
      <div className="nuke-shockwave" />
      <img className="nuke-fireball" src={parisAssets.nuke.fireball} alt="" />
      <img className="nuke-mushroom" src={parisAssets.nuke.mushroom} alt="" />
      <div className="nuke-afterglow" />
    </div>
  )
}
