import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`
    )

    const updateMatch = () => {
      setIsMobile(mediaQuery.matches)
    }

    updateMatch()
    mediaQuery.addEventListener("change", updateMatch)

    return () => {
      mediaQuery.removeEventListener("change", updateMatch)
    }
  }, [])

  return isMobile
}
