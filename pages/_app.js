import '../styles/global.css'
import { useEffect, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { useTheme } from 'next-themes'

const SETTINGS_EVENT = 'index-settings-changed'
const BRIGHTNESS_THRESHOLD = 160
const SAMPLE_SIZE = 48

function AppFrame({ Component, pageProps }) {
  const { resolvedTheme } = useTheme()
  const [backgroundImage, setBackgroundImage] = useState('')
  const [autoDimBackground, setAutoDimBackground] = useState(true)
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(0)

  useEffect(() => {
    const syncBackgroundSettings = () => {
      setBackgroundImage(localStorage.getItem('backgroundImage') || '')
      setAutoDimBackground(localStorage.getItem('autoDimBackground') !== 'false')
    }

    syncBackgroundSettings()
    window.addEventListener('storage', syncBackgroundSettings)
    window.addEventListener(SETTINGS_EVENT, syncBackgroundSettings)

    return () => {
      window.removeEventListener('storage', syncBackgroundSettings)
      window.removeEventListener(SETTINGS_EVENT, syncBackgroundSettings)
    }
  }, [])

  useEffect(() => {
    if (!backgroundImage) {
      setBackgroundOverlayOpacity(0)
      return
    }

    if (resolvedTheme !== 'dark' || !autoDimBackground) {
      setBackgroundOverlayOpacity(0)
      return
    }

    let cancelled = false
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d', { willReadFrequently: true })

        if (!context) {
          if (!cancelled) {
            setBackgroundOverlayOpacity(0.35)
          }
          return
        }

        canvas.width = SAMPLE_SIZE
        canvas.height = SAMPLE_SIZE
        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

        const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
        let luminanceTotal = 0
        let visiblePixels = 0

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3] / 255
          if (alpha === 0) {
            continue
          }
          const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
          luminanceTotal += luminance * alpha
          visiblePixels += alpha
        }

        const averageLuminance = visiblePixels > 0 ? luminanceTotal / visiblePixels : 0
        const overlayOpacity = averageLuminance > BRIGHTNESS_THRESHOLD
          ? Math.min(0.6, 0.18 + ((averageLuminance - BRIGHTNESS_THRESHOLD) / 95) * 0.42)
          : 0

        if (!cancelled) {
          setBackgroundOverlayOpacity(overlayOpacity)
        }
      } catch {
        if (!cancelled) {
          setBackgroundOverlayOpacity(0.35)
        }
      }
    }

    image.onerror = () => {
      if (!cancelled) {
        setBackgroundOverlayOpacity(0)
      }
    }

    image.src = backgroundImage

    return () => {
      cancelled = true
    }
  }, [autoDimBackground, backgroundImage, resolvedTheme])

  return (
    <div className="app-shell">
      <div
        className="app-background"
        style={backgroundImage ? { backgroundImage: `url('${backgroundImage}')` } : undefined}
      />
      <div
        className="app-background-overlay"
        style={{ opacity: backgroundOverlayOpacity }}
      />
      <div className="app-content">
        <Component {...pageProps} />
      </div>
    </div>
  )
}

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange scriptProps={{ 'data-cfasync': 'false' }}>
      <AppFrame Component={Component} pageProps={pageProps} />
    </ThemeProvider>
  )
}
