import { useState } from 'react'

// Shareable invite — points friends at the brochure (which links into the app).
export const BROCHURE_URL = 'https://ornate-donut-c6f444.netlify.app/brochure.html'
const SHARE_TEXT = "I'm testing ASCEND — self-improvement as a game. Come level up with me:"

export default function InviteButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    // native share sheet on mobile if available
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'ASCEND', text: SHARE_TEXT, url: BROCHURE_URL })
        return
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    // otherwise copy the link to clipboard
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${BROCHURE_URL}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // last resort: open the brochure so they can copy the URL bar
      window.open(BROCHURE_URL, '_blank', 'noopener')
    }
  }

  return (
    <button onClick={share} className={className ?? 'btn btn-primary'}>
      {copied ? '✓ Link copied!' : '🔗 Invite friends'}
    </button>
  )
}
