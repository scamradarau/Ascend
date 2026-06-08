import { useEffect, useState } from 'react'
import CosmosScenery from './CosmosScenery'
import RuneScenery from './RuneScenery'
import OlympusScenery from './OlympusScenery'

// ================================================================
// ThemeBackground — uses a painted background image per theme
// (public/themes/<theme>.webp) when present; otherwise falls back to
// the procedural animated scenery so nothing regresses before the art
// is added. A dark vignette keeps UI panels readable on top.
// ================================================================

type Theme = 'cosmos' | 'rune' | 'olympus'
const SRC: Record<Theme, string> = {
  cosmos: '/themes/cosmos.webp',
  rune: '/themes/rune.webp',
  olympus: '/themes/olympus.webp',
}

// probe each theme image once per session
const cache: Record<string, boolean | undefined> = {}

export default function ThemeBackground({ theme }: { theme: Theme }) {
  const [present, setPresent] = useState<boolean>(cache[theme] === true)

  useEffect(() => {
    if (cache[theme] !== undefined) {
      setPresent(cache[theme] === true)
      return
    }
    let alive = true
    fetch(SRC[theme], { method: 'HEAD' })
      .then((r) => {
        const t = r.headers.get('content-type') ?? ''
        cache[theme] = r.ok && !t.includes('text/html')
      })
      .catch(() => {
        cache[theme] = false
      })
      .finally(() => {
        if (alive) setPresent(cache[theme] === true)
      })
    return () => {
      alive = false
    }
  }, [theme])

  if (present) {
    return (
      <>
        <div
          className="fixed inset-0 z-0"
          style={{ backgroundImage: `url(${SRC[theme]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        {/* readability vignette */}
        <div
          className="fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(120% 95% at 50% 28%, transparent 32%, rgba(2,4,10,0.6) 100%), linear-gradient(to bottom, rgba(2,4,10,0.45), rgba(2,4,10,0.12) 38%, rgba(2,4,10,0.72))',
          }}
        />
      </>
    )
  }

  // fallback — animated scenery (current look)
  return theme === 'rune' ? <RuneScenery /> : theme === 'olympus' ? <OlympusScenery /> : <CosmosScenery />
}
