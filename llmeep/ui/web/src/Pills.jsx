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
export default function Pills({ options, value, selected, onChange, sx, atLeast = 2 }) {
  // Two modes. `value` is one choice of several; `selected` is a set of
  // toggles, everything on to begin with, and you switch off what you do not
  // want to see. The board is the second: it should open showing all of it.
  const isOn = (o) => (selected ? selected.has(o.value) : o.value === value)
  // **One pill is usually nothing to choose between**, so a row of one is
  // hidden rather than shown as a control that cannot change anything. Labels
  // are the exception and pass `atLeast={1}`: a single label in use is still a
  // narrowing worth one tap, and the row appearing the moment a first label
  // exists is how anyone discovers the feature (`PLT-wbhb`).
  if (options.length < atLeast) return null
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
          color={isOn(o) && !o.disabled || o.tint ? undefined : 'default'}
          sx={{
            flexShrink: 0, fontWeight: isOn(o) ? 600 : 400,
            // **A tinted pill keeps its own colour and shows selection by
            // filling** (`PLT-5gfc`). Labels carry a colour derived from the
            // name so a pill and the chip on a card are recognisably the same
            // thing; using the app's blue for "on" would throw that away at
            // exactly the moment you are looking at it.
            ...(o.tint && {
              color: isOn(o) ? '#fff' : o.tint.fg,
              bgcolor: isOn(o) ? o.tint.fg : o.tint.bg,
              borderColor: o.tint.fg,
              '&:hover': { bgcolor: isOn(o) ? o.tint.fg : o.tint.bg },
            }),
            ...(!o.tint && isOn(o) && !o.disabled && {
              color: 'primary.contrastText', bgcolor: 'primary.main',
            }),
          }}
        />
      ))}
    </Box>
  )
}
