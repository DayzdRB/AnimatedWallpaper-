/**
 * Particle system for the destruction sequence.
 *
 * The point of this file is that the old sequence was two static PNGs fading
 * in and out. Nothing expanded, nothing rose, nothing cooled. Here each stage
 * is driven by the behaviour it actually has:
 *
 *  - the fireball expands fast then decelerates, roughly as t^0.4, which is the
 *    Taylor-Sedov result for a blast wave into still air
 *  - it cools as it expands, so it runs white, then yellow, orange, deep red,
 *    and finally stops emitting and becomes ordinary smoke
 *  - it is buoyant, so it rises, and rising draws a stem up behind it
 *  - the cap spreads sideways when its rise stalls
 *  - a separate dust front runs outward along the ground, which is what reaches
 *    the camera and provides the foreground smoke
 *
 * Emission is in normalised scene coordinates so it survives any window size.
 */

export type SmokeKind = 'fireball' | 'stem' | 'cap' | 'surge' | 'foreground' | 'ember'

export type Particle = {
  kind: SmokeKind
  x: number
  y: number
  velocityX: number
  velocityY: number
  size: number
  growth: number
  age: number
  life: number
  rotation: number
  spin: number
  /** 0 is cold smoke, 1 is still emitting light. */
  heat: number
  seed: number
}

export type FieldConfig = {
  /** Ground zero in normalised scene coordinates. */
  originX: number
  originY: number
  /** Scene aspect ratio, so horizontal motion is not stretched. */
  aspect: number
}

const TAU = Math.PI * 2

function random(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export class SmokeField {
  particles: Particle[] = []
  private config: FieldConfig
  /** Seconds since detonation. */
  time = 0

  constructor(config: FieldConfig) {
    this.config = config
  }

  reset(config: FieldConfig) {
    this.config = config
    this.particles = []
    this.time = 0
  }

  /**
   * Fireball radius in scene units. Fast expansion decelerating as t^0.4, then
   * held once the shock has decoupled and it has become a buoyant cloud.
   */
  fireballRadius() {
    const t = Math.max(this.time, 0.001)
    const expanding = 0.052 * Math.pow(t, 0.4)
    return Math.min(expanding, 0.13)
  }

  /** Height of the rising cloud above ground zero, scene units. */
  capHeight() {
    const t = Math.max(this.time - 0.9, 0)
    // Buoyant rise with drag, stalling as it spreads out.
    return 0.42 * (1 - Math.exp(-t / 4.2))
  }

  /** Colour temperature of freshly emitted material, 0 cold to 1 white hot. */
  emissionHeat() {
    if (this.time < 0.28) return 1
    return Math.max(0, Math.exp(-(this.time - 0.28) / 1.5))
  }

  emit(deltaSeconds: number) {
    const heat = this.emissionHeat()
    const radius = this.fireballRadius()
    const capY = this.config.originY - this.capHeight()

    // Fireball surface, only while it is still hot and growing.
    if (this.time < 2.6) {
      const count = Math.round(90 * deltaSeconds * (0.4 + heat))
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * TAU
        const spread = Math.sqrt(Math.random())
        this.particles.push({
          kind: 'fireball',
          x: this.config.originX + Math.cos(angle) * radius * spread / this.config.aspect,
          y: this.config.originY + Math.sin(angle) * radius * spread * 0.8,
          velocityX: Math.cos(angle) * random(0.008, 0.05),
          velocityY: Math.sin(angle) * random(0.008, 0.04) - 0.02,
          size: random(0.035, 0.085),
          growth: random(0.02, 0.06),
          age: 0,
          life: random(1.6, 3.4),
          rotation: Math.random() * TAU,
          spin: random(-0.5, 0.5),
          heat,
          seed: Math.random(),
        })
      }
    }

    // Stem: material drawn up behind the rising cloud.
    if (this.time > 0.5 && this.time < 16) {
      const count = Math.round(26 * deltaSeconds)
      for (let index = 0; index < count; index += 1) {
        const along = Math.random()
        this.particles.push({
          kind: 'stem',
          x: this.config.originX + random(-0.022, 0.022) / this.config.aspect,
          y: this.config.originY - along * this.capHeight(),
          velocityX: random(-0.004, 0.004),
          velocityY: random(-0.05, -0.022),
          size: random(0.03, 0.062),
          growth: random(0.012, 0.03),
          age: 0,
          life: random(6, 13),
          rotation: Math.random() * TAU,
          spin: random(-0.35, 0.35),
          heat: heat * 0.35,
          seed: Math.random(),
        })
      }
    }

    // Cap: rolls outward into a torus once the rise begins to stall.
    if (this.time > 1.4 && this.time < 22) {
      const count = Math.round(34 * deltaSeconds)
      const capRadius = 0.06 + this.capHeight() * 0.55
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * TAU
        const spread = 0.45 + Math.random() * 0.75
        this.particles.push({
          kind: 'cap',
          x: this.config.originX + (Math.cos(angle) * capRadius * spread) / this.config.aspect,
          y: capY + Math.sin(angle) * capRadius * spread * 0.36,
          velocityX: (Math.cos(angle) * random(0.012, 0.042)) / this.config.aspect,
          velocityY: -random(0.004, 0.022) + Math.sin(angle) * 0.006,
          size: random(0.05, 0.115),
          growth: random(0.016, 0.042),
          age: 0,
          life: random(9, 20),
          rotation: Math.random() * TAU,
          spin: random(-0.22, 0.22),
          heat: heat * 0.18,
          seed: Math.random(),
        })
      }
    }

    // Base surge: dust driven outward along the ground.
    if (this.time > 0.35 && this.time < 12) {
      const count = Math.round(30 * deltaSeconds)
      for (let index = 0; index < count; index += 1) {
        const side = Math.random() > 0.5 ? 1 : -1
        this.particles.push({
          kind: 'surge',
          x: this.config.originX + (side * random(0, 0.16)) / this.config.aspect,
          y: this.config.originY + random(-0.012, 0.03),
          velocityX: (side * random(0.05, 0.16)) / this.config.aspect,
          velocityY: random(-0.012, 0.004),
          size: random(0.05, 0.12),
          growth: random(0.02, 0.05),
          age: 0,
          life: random(7, 15),
          rotation: Math.random() * TAU,
          spin: random(-0.2, 0.2),
          heat: heat * 0.1,
          seed: Math.random(),
        })
      }
    }

    // Embers, briefly, while there is still anything incandescent.
    if (this.time < 4) {
      const count = Math.round(14 * deltaSeconds)
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * TAU
        this.particles.push({
          kind: 'ember',
          x: this.config.originX + (Math.cos(angle) * radius) / this.config.aspect,
          y: this.config.originY + Math.sin(angle) * radius * 0.7,
          velocityX: (Math.cos(angle) * random(0.05, 0.2)) / this.config.aspect,
          velocityY: Math.sin(angle) * random(0.04, 0.16) - 0.04,
          size: random(0.002, 0.006),
          growth: 0,
          age: 0,
          life: random(1.2, 3),
          rotation: 0,
          spin: 0,
          heat: 1,
          seed: Math.random(),
        })
      }
    }

    /**
     * Foreground dust. This is the layer that sits in front of the city, and it
     * only starts once the blast front has had time to reach the camera. At two
     * kilometres and a decaying front speed, a couple of seconds is about right.
     */
    if (this.time > 2.2 && this.time < 26) {
      const count = Math.round(16 * deltaSeconds)
      for (let index = 0; index < count; index += 1) {
        this.particles.push({
          kind: 'foreground',
          x: random(-0.25, 1.25),
          y: random(0.55, 1.2),
          velocityX: random(-0.05, 0.05),
          velocityY: random(-0.045, -0.012),
          size: random(0.16, 0.4),
          growth: random(0.03, 0.075),
          age: 0,
          life: random(8, 17),
          rotation: Math.random() * TAU,
          spin: random(-0.12, 0.12),
          heat: 0,
          seed: Math.random(),
        })
      }
    }
  }

  update(deltaSeconds: number) {
    this.time += deltaSeconds
    this.emit(deltaSeconds)

    const survivors: Particle[] = []
    for (const particle of this.particles) {
      particle.age += deltaSeconds
      if (particle.age >= particle.life) continue

      const fraction = particle.age / particle.life

      // Turbulent wander, per particle so nothing moves in lockstep.
      const wander = Math.sin(particle.seed * 41 + particle.age * 1.7) * 0.006
      particle.x += (particle.velocityX + wander) * deltaSeconds
      particle.y += particle.velocityY * deltaSeconds

      // Drag, and buoyancy on the hot material.
      const drag = Math.exp(-deltaSeconds * 0.42)
      particle.velocityX *= drag
      particle.velocityY *= drag
      if (particle.kind === 'stem' || particle.kind === 'cap' || particle.kind === 'fireball') {
        particle.velocityY -= 0.012 * deltaSeconds * (0.4 + particle.heat)
      }
      if (particle.kind === 'ember') {
        particle.velocityY += 0.09 * deltaSeconds
      }

      particle.size += particle.growth * deltaSeconds
      particle.rotation += particle.spin * deltaSeconds
      // Radiative cooling: nothing stays incandescent for long.
      particle.heat *= Math.exp(-deltaSeconds / 0.85)

      if (fraction < 1) survivors.push(particle)
    }
    this.particles = survivors
  }

  /** Light the blast is throwing onto the city, 0 to 1. */
  illumination() {
    if (this.time < 0.02) return 0
    return Math.max(0, Math.exp(-this.time / 1.35))
  }
}

/**
 * Colour of emitting material by temperature. Runs from white hot through the
 * yellows and oranges into a deep red, then hands over to neutral smoke.
 */
export function heatColour(heat: number): [number, number, number] {
  if (heat <= 0.001) return [128, 124, 120]
  const t = Math.min(1, heat)
  if (t > 0.72) {
    const k = (t - 0.72) / 0.28
    return [255, 238 + 17 * k, 190 + 65 * k]
  }
  if (t > 0.4) {
    const k = (t - 0.4) / 0.32
    return [255, 150 + 88 * k, 60 + 130 * k]
  }
  const k = t / 0.4
  return [150 + 105 * k, 52 + 98 * k, 40 + 20 * k]
}
