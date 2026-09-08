/**
 * Decorative community motifs for the landing page.
 *
 * Top: two clusters of figures connected into a small network, held to the
 * outer edges so the headline keeps the centre, and masked to fade downward.
 * Bottom: a linked row of figures, all identical in size - the equality the
 * product is about.
 *
 * Ornamental only: hidden from assistive tech and non-interactive.
 */

/** One figure standing on the given baseline. */
function Person({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="0" cy="-26" r="7.5" fill="currentColor" />
      <path d="M-13 0C-13-13-7-17 0-17s13 4 13 17Z" fill="currentColor" />
    </g>
  )
}

/** Thin tie between two figures, drawn head to head. */
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

// Two clusters hugging the outer edges; the middle stays clear for the text.
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

// Bottom band
const BASELINE = 58
const ROW = Array.from({ length: 27 }, (_, i) => 26 + i * 46)

export function CommunityBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* upper social network */}
      <svg
        viewBox="0 0 1200 230"
        preserveAspectRatio="xMidYMin slice"
        className="absolute inset-x-0 top-0 h-[210px] w-full text-[var(--l-figure)] opacity-[0.15] sm:h-[250px]"
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

      {/* lower linked row */}
      <svg
        viewBox="0 0 1240 70"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[120px] w-full text-[var(--l-figure)] opacity-[0.22] sm:h-[150px]"
      >
        {ROW.slice(0, -1).map((x, i) => (
          <path
            key={`link-${x}`}
            d={`M${x + 13} ${BASELINE - 9}Q${(x + 13 + ROW[i + 1] - 13) / 2} ${BASELINE - 1} ${ROW[i + 1] - 13} ${BASELINE - 9}`}
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {ROW.map((x) => (
          <Person key={x} x={x} y={BASELINE} />
        ))}
      </svg>
    </div>
  )
}
