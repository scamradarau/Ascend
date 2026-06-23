import { useId } from 'react'
import type { AvatarConfig } from '../data/cosmetics'
import { AURA_COLORS, FRAME_COLORS } from './Avatar'

// ================================================================
// CosmeticRings - the animated aura + frame, drawn as a transparent
// SVG overlay so it can sit on top of ANY avatar art (the class portrait
// in ClassAvatar, or the procedural bust). Tuned for a portrait that fills
// ~r80 of the 200-unit box, so the frame hugs the rim and the aura blooms
// just outside it. Animation is gated on `animated` (lists stay static).
// ================================================================
export default function CosmeticRings({
  config,
  animated = true,
}: {
  config: AvatarConfig
  animated?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const aura = AURA_COLORS[config.aura] ?? 'transparent'
  const frame = FRAME_COLORS[config.frame] ?? FRAME_COLORS.basic
  const hasAura = config.aura !== 'none'
  const isAether = config.aura === 'aether'
  const isFounder = config.frame === 'founder'
  const isBasic = config.frame === 'basic'

  const spin = (dur: string, reverse = false) =>
    animated ? (
      <animateTransform
        attributeName="transform"
        type="rotate"
        from={`${reverse ? 360 : 0} 100 100`}
        to={`${reverse ? 0 : 360} 100 100`}
        dur={dur}
        repeatCount="indefinite"
      />
    ) : null

  const star = (x: number, y: number, r: number, fill: string, delay: number) => {
    const d = `M0 ${-r} L ${r * 0.3} ${-r * 0.3} L ${r} 0 L ${r * 0.3} ${r * 0.3} L 0 ${r} L ${-r * 0.3} ${r * 0.3} L ${-r} 0 L ${-r * 0.3} ${-r * 0.3} Z`
    return (
      <path
        transform={`translate(${x} ${y})`}
        d={d}
        fill={fill}
        filter={`url(#cr-glow-${uid})`}
        className={animated ? 'animate-twinkle' : ''}
        style={{ animationDelay: `${delay}s` }}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id={`cr-plusRing-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde08a" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="65%" stopColor="#d8a0ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id={`cr-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===== AURA ===== */}
      {isAether && (
        <g>
          <g>
            {spin('18s')}
            <circle cx="100" cy="100" r="90" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="2 9" opacity="0.9" filter={`url(#cr-glow-${uid})`} />
          </g>
          <g>
            {spin('26s', true)}
            <circle cx="100" cy="100" r="95" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="1 7" opacity="0.85" filter={`url(#cr-glow-${uid})`} />
          </g>
          {[...Array(20)].map((_, i) => {
            const a = (i / 20) * Math.PI * 2
            const dist = i % 3 === 0 ? 87 : 96
            const x = 100 + Math.cos(a) * dist
            const y = 100 + Math.sin(a) * dist
            const fill = i % 2 === 0 ? '#ffd76a' : '#d8a0ff'
            return i % 4 === 0
              ? <g key={i}>{star(x, y, 3.4, fill, i * 0.1)}</g>
              : <circle key={i} cx={x} cy={y} r={1.7} fill={fill} opacity={0.9} filter={`url(#cr-glow-${uid})`} className={animated ? 'animate-twinkle' : ''} style={{ animationDelay: `${i * 0.1}s` }} />
          })}
        </g>
      )}
      {hasAura && !isAether && (
        <g>
          <g>
            {spin('20s')}
            <circle cx="100" cy="100" r="90" fill="none" stroke={aura} strokeWidth="2.5" strokeDasharray="2 9" opacity="0.85" filter={`url(#cr-glow-${uid})`} />
          </g>
          <g>
            {spin('28s', true)}
            <circle cx="100" cy="100" r="95" fill="none" stroke={aura} strokeWidth="1.5" strokeDasharray="1 7" opacity="0.5" filter={`url(#cr-glow-${uid})`} />
          </g>
          {[...Array(16)].map((_, i) => {
            const a = (i / 16) * Math.PI * 2
            const dist = i % 3 === 0 ? 87 : 96
            const x = 100 + Math.cos(a) * dist
            const y = 100 + Math.sin(a) * dist
            return i % 4 === 0
              ? <g key={i}>{star(x, y, 3.2, aura, i * 0.12)}</g>
              : <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.4 : 1.6} fill={aura} opacity={0.85} filter={`url(#cr-glow-${uid})`} className={animated ? 'animate-twinkle' : ''} style={{ animationDelay: `${i * 0.12}s` }} />
          })}
        </g>
      )}

      {/* ===== FRAME ===== */}
      {isFounder ? (
        <g>
          <circle cx="100" cy="100" r="89" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
          <circle cx="100" cy="100" r="86" fill="none" stroke={`url(#cr-plusRing-${uid})`} strokeWidth="4.5" />
          <g>
            {spin('22s')}
            <circle cx="100" cy="100" r="86" fill="none" stroke="#ffe9a8" strokeWidth="4.5" strokeDasharray="3 16" opacity="0.7" filter={`url(#cr-glow-${uid})`} />
          </g>
          <circle cx="100" cy="100" r="82" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const a = (deg * Math.PI) / 180
            const big = deg % 90 === 0
            const sz = big ? 3.4 : 2.1
            return (
              <g key={deg} transform={`translate(${100 + Math.cos(a) * 86} ${100 + Math.sin(a) * 86}) rotate(45)`}>
                <rect x={-sz} y={-sz} width={sz * 2} height={sz * 2} fill={big ? '#ffd76a' : '#c879ff'} filter={`url(#cr-glow-${uid})`} className={animated ? 'animate-pulseGlow' : ''} style={{ animationDelay: `${i * 0.15}s` }} />
              </g>
            )
          })}
        </g>
      ) : isBasic ? (
        <circle cx="100" cy="100" r="86" fill="none" stroke={frame} strokeWidth="2" opacity="0.85" />
      ) : (
        <g>
          <circle cx="100" cy="100" r="86" fill="none" stroke={frame} strokeWidth="3.5" opacity="0.9" />
          <g>
            {spin('24s')}
            <circle cx="100" cy="100" r="86" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeDasharray="2 22" opacity="0.45" filter={`url(#cr-glow-${uid})`} />
          </g>
          <circle cx="100" cy="100" r="82" fill="none" stroke={frame} strokeWidth="1" opacity="0.4" />
          {[...Array(28)].map((_, i) => {
            const a = (i / 28) * Math.PI * 2
            return (
              <line key={i} x1={100 + Math.cos(a) * 83} y1={100 + Math.sin(a) * 83} x2={100 + Math.cos(a) * 85} y2={100 + Math.sin(a) * 85} stroke={frame} strokeWidth="1.1" opacity="0.5" />
            )
          })}
          {[0, 90, 180, 270].map((deg, i) => {
            const a = (deg * Math.PI) / 180
            return (
              <g key={deg} transform={`translate(${100 + Math.cos(a) * 86} ${100 + Math.sin(a) * 86}) rotate(45)`}>
                <rect x="-2.6" y="-2.6" width="5.2" height="5.2" fill={frame} filter={`url(#cr-glow-${uid})`} className={animated ? 'animate-pulseGlow' : ''} style={{ animationDelay: `${i * 0.18}s` }} />
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}
