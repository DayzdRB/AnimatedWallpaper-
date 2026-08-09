import type { TimeOfDay } from '../lib/time'

type EiffelSceneProps = {
  timeOfDay: TimeOfDay
}

const stars = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + 11) % 97}%`,
  top: `${(index * 19 + 5) % 59}%`,
  delay: `${(index % 9) * -0.57}s`,
  size: `${1 + (index % 3) * 0.55}px`,
}))

export function EiffelScene({ timeOfDay }: EiffelSceneProps) {
  return (
    <div className={`scene scene--${timeOfDay}`} aria-hidden="true">
      <div className="scene__sky" />
      <div className="scene__glow" />
      <div className="scene__stars">
        {stars.map((star) => (
          <i
            className="scene__star"
            key={star.id}
            style={{
              animationDelay: star.delay,
              height: star.size,
              left: star.left,
              top: star.top,
              width: star.size,
            }}
          />
        ))}
      </div>
      <div className="scene__haze scene__haze--one" />
      <div className="scene__haze scene__haze--two" />

      <svg
        className="scene__skyline scene__skyline--far"
        viewBox="0 0 1600 260"
        preserveAspectRatio="none"
      >
        <path d="M0 188h62v-38h55v38h45v-62h18v-18h16v18h19v62h58v-32h71v32h32v-75h20v75h58v-44h39v44h75v-92h44v92h64v-52h29v52h44v-69h18v-20h15v20h18v69h49v-34h75v34h59v-54h34v54h34v-83h52v83h53v-42h66v42h59v-67h27v-23h19v23h29v67h73v72H0z" />
      </svg>

      <svg
        className="scene__skyline scene__skyline--near"
        viewBox="0 0 1600 260"
        preserveAspectRatio="none"
      >
        <path d="M0 198h130v-48l48-24 47 24v48h83v-84h20v-13h22v13h23v84h65v-47h94v47h99v-68h53v68h105v-51h109v51h95v-72h19v-14h31v14h22v72h81v-59h103v59h88v-43h124v43h110v62H0z" />
        <path className="scene__roofline" d="M118 150l60-38 59 38M906 139h110M1260 155h124" />
      </svg>

      <svg className="scene__tower" viewBox="0 0 430 760">
        <g className="scene__tower-fill">
          <path d="M204 24h22l6 67h-34z" />
          <path d="M196 86h38l8 22h-54z" />
          <path d="M196 105h38c13 165 45 340 149 604h-75c-21-90-51-182-93-278-42 96-72 188-93 278H47c104-264 136-439 149-604z" />
          <rect x="91" y="696" width="248" height="20" rx="4" />
        </g>
        <g className="scene__tower-cutouts">
          <path d="M215 134c-5 119-23 231-61 347h122c-38-116-56-228-61-347z" />
          <path d="M144 509c-19 53-38 109-55 169h68c7-55 25-107 58-155 33 48 51 100 58 155h68c-17-60-36-116-55-169z" />
        </g>
        <g className="scene__tower-lines">
          <path d="M177 226h76M158 325h114M132 450h166M97 600h236" />
          <path d="M183 174l64 52-78 99 103 125-140 150M247 174l-64 52 78 99-103 125 140 150" />
        </g>
        <g className="scene__tower-decks">
          <rect x="165" y="214" width="100" height="18" rx="3" />
          <rect x="119" y="438" width="192" height="24" rx="4" />
        </g>
      </svg>

      <div className="scene__ground scene__ground--back" />
      <div className="scene__ground scene__ground--front" />
      <div className="scene__grain" />
    </div>
  )
}

