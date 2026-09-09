/**
 * Decorative community motifs for the landing page.
 *
 * CommunityBackdrop - two small networks of figures at the top, held to the
 * outer edges so the headline keeps the centre, fading downward.
 * LinkedRings - two rings of people holding hands, overlapping like chain
 * links, wrapped around the sign-in card. Every figure is the same size.
 *
 * Ornamental only: hidden from assistive tech and non-interactive.
 */

/** One figure, standing "up" along -y from its own origin. */
function Person({ x, y, rotate = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <circle cx="0" cy="-26" r="7.5" fill="currentColor" />
      <path d="M-13 0C-13-13-7-17 0-17s13 4 13 17Z" fill="currentColor" />
    </g>
  )
}

/**
 * A ring of people holding hands. The joined arms are one stroked circle
 * drawn *behind* the bodies at arm height, so the hands genuinely meet
 * rather than having lines drawn between them.
 */
function HandCircle({ cx, cy, r, count, scale = 0.7 }) {
  const people = Array.from({ length: count }, (_, i) => {
    const deg = (360 / count) * i
    const rad = (deg * Math.PI) / 180
    return {
      key: i,
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
      rotate: deg + 90, // head points away from the centre
    }
  })

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r + 10 * scale}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4 * scale}
      />
      {people.map((p) => (
        <Person key={p.key} x={p.x} y={p.y} rotate={p.rotate} scale={scale} />
      ))}
    </g>
  )
}

/**
 * Two rings offset by exactly one radius - the classic chain-link overlap.
 * The crossing points fall just clear of the card above and below it, so the
 * link between the two groups stays visible.
 */
export function LinkedRings({ className = '' }) {
  return (
    <svg
      viewBox="0 0 760 640"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={`pointer-events-none text-[var(--l-figure)] opacity-[0.2] ${className}`}
    >
      <HandCircle cx={270} cy={320} r={220} count={30} />
      <HandCircle cx={490} cy={320} r={220} count={30} />
    </svg>
  )
}

/* ---------- upper network ---------- */

function Tie({ a, b }) {
  return (
    <line
      x1={a[0]}
      y1={a[1] - 26}
      x2={b[0]}
      y2={b[1] - 26}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeOpacity="0.55"
    />
  )
}

const START_CLUSTER = [
  [70, 150],
  [138, 116],
  [206, 156],
  [150, 192],
]
const END_CLUSTER = [
  [994, 152],
  [1062, 114],
  [1132, 150],
  [1072, 190],
]
const TIES = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 2],
]

function Cluster({ nodes }) {
  return (
    <g>
      {TIES.map(([i, j]) => (
        <Tie key={`${i}-${j}`} a={nodes[i]} b={nodes[j]} />
      ))}
      {nodes.map(([x, y]) => (
        <Person key={`${x}-${y}`} x={x} y={y} scale={0.92} />
      ))}
    </g>
  )
}

export function CommunityBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1200 230"
        preserveAspectRatio="xMidYMin meet"
        className="absolute inset-x-0 top-0 h-auto w-full text-[var(--l-figure)] opacity-[0.15]"
      >
        <defs>
          <linearGradient id="eqFadeDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="eqTopFade">
            <rect width="1200" height="230" fill="url(#eqFadeDown)" />
          </mask>
        </defs>
        <g mask="url(#eqTopFade)">
          <Cluster nodes={START_CLUSTER} />
          <Cluster nodes={END_CLUSTER} />
        </g>
      </svg>
    </div>
  )
}
