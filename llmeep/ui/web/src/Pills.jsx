import React from 'react'
import { Box, Chip } from '@mui/material'

// A row of pills. Used for the two things on this screen that are a *choice
// between views* rather than a place to go: which slice of the board, and which
// kind of record. Tabs say "these are different screens"; pills say "same
// screen, less of it" — which is what both of these actually are.
//
// Scrolls sideways on its own rather than wrapping, so a row of five never
// becomes two rows and pushes the content down a phone.
export default function Pills({ options, value, selected, onChange, sx }) {
  // Two modes. `value` is one choice of several; `selected` is a set of
  // toggles, everything on to begin with, and you switch off what you do not
  // want to see. The board is the second: it should open showing all of it.
  const isOn = (o) => (selected ? selected.has(o.value) : o.value === value)
  if (options.length < 2) return null
  return (
    <Box
      sx={{
        display: 'flex', gap: 0.75, overflowX: 'auto', pb: 0.5,
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
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
