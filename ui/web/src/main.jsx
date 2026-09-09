import React from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material'
import App from './App.jsx'

// Mobile first and no frills: one column, system fonts, the viewer's own
// light/dark. Nothing here is a brand.
function Root() {
  const dark = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = React.useMemo(
    () => createTheme({
      palette: { mode: dark ? 'dark' : 'light' },
      shape: { borderRadius: 10 },
      typography: { fontSize: 15 },
    }),
    [dark],
  )
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
