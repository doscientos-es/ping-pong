import { useEffect } from 'react'

import { CLUB_NAME } from '../shared/brand'

export function usePageEffects(title: string, profileId: string) {
  useEffect(() => {
    document.title = `${title} · ${CLUB_NAME}`
    window.scrollTo({ top: 0 })
  }, [title, profileId])
}
