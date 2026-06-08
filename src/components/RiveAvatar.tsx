import { lazy, Suspense, useEffect, useState } from 'react'
import type { AvatarConfig } from '../data/cosmetics'
import Avatar from './Avatar'

// Lazy wrapper: the heavy Rive runtime lives in RiveAvatarInner and is
// code-split into its own chunk. We only fetch that chunk once we've
// confirmed a real avatar.riv is actually deployed — otherwise we just
// render the procedural SVG <Avatar/>. This keeps the Rive engine off the
// wire entirely until the art exists, then activates with no code change.
const Inner = lazy(() => import('./RiveAvatarInner'))

// module-level cache so we probe /avatar.riv at most once per session
let rivePresent: boolean | null = null

export default function RiveAvatar(props: {
  config: AvatarConfig
  size?: number
  animated?: boolean
}) {
  const [present, setPresent] = useState<boolean>(rivePresent === true)

  useEffect(() => {
    if (rivePresent !== null) {
      setPresent(rivePresent)
      return
    }
    let alive = true
    fetch('/avatar.riv', { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? ''
        // a real .riv is binary; reject SPA index.html fallbacks (text/html)
        rivePresent = res.ok && !type.includes('text/html')
      })
      .catch(() => {
        rivePresent = false
      })
      .finally(() => {
        if (alive) setPresent(rivePresent === true)
      })
    return () => {
      alive = false
    }
  }, [])

  if (!present) return <Avatar {...props} />

  return (
    <Suspense fallback={<Avatar {...props} />}>
      <Inner {...props} />
    </Suspense>
  )
}
