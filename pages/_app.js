import '../styles/global.css'
import { ThemeProvider } from 'next-themes'

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange scriptProps={{ 'data-cfasync': 'false' }}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}