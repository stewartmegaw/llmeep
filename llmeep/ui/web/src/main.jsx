import React from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App.jsx'

// Mobile first and no frills: one column, system fonts, light. Nothing here is
// a brand.
//
// **Light, not the viewer's own light/dark** (`PLT-5j6u`). Following
// `prefers-color-scheme` meant a phone on dark — which most are, by default or
// on a schedule after dark — rendered a board of white-on-black cards nobody
// asked for. This is a records screen read in short glances, not a place anyone
// spends an evening, and the records themselves are black text on white
// everywhere else they are read.
function Root() {
  const theme = React.useMemo(
    () => createTheme({
      palette: { mode: 'light' },
      shape: { borderRadius: 10 },
      typography: { fontSize: 15 },
    }),
    [],
  )
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
