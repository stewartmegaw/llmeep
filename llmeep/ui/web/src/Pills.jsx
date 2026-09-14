import React from 'react'
import { Box, Chip } from '@mui/material'

// A row of pills. Used for the two things on this screen that are a *choice
// between views* rather than a place to go: which slice of the board, and which
// kind of record. Tabs say "these are different screens"; pills say "same
// screen, less of it" — which is what both of these actually are.
//
// **Wraps rather than scrolling sideways.** It scrolled, with the scrollbar
// hidden, so that a row of five never became two rows and pushed the content
// down a phone. At 390px that put two of the five pills past the right edge with
// nothing to say they were there and no way to reach them without a swipe —
// reported by an adopter running it at exactly the width this app calls its
// primary case (`PLT-25ew`).
//
// Wrapping is the conditional version of that original intent: one row wherever
// the row fits, and a second only where it does not.
export default function Pills({ options, value, selected, onChange, sx }) {
  // Two modes. `value` is one choice of several; `selected` is a set of
  // toggles, everything on to begin with, and you switch off what you do not
  // want to see. The board is the second: it should open showing all of it.
  const isOn = (o) => (selected ? selected.has(o.value) : o.value === value)
  if (options.length < 2) return null
  return (
    <Box
      sx={{
        display: 'flex', flexWrap: 'wrap', gap: 0.75, pb: 0.5,
        ...sx,
      }}
    >
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.count === undefined ? o.label : `${o.label} ${o.count}`}
          size="small"
          // A ledger with nothing in it stays on the row rather than
          // disappearing: that a business board exists and is empty is worth
          // knowing, and a row that changes shape as work arrives is one you
          // have to re-read every time.
          disabled={o.disabled}
          onClick={o.disabled ? undefined : () => onChange(o.value)}
          variant={isOn(o) && !o.disabled ? 'filled' : 'outlined'}
          color={isOn(o) && !o.disabled ? 'primary' : 'default'}
          sx={{ flexShrink: 0, fontWeight: isOn(o) ? 600 : 400 }}
        />
      ))}
    </Box>
  )
}
