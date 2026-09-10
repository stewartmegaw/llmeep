import React from 'react'
import {
  Box, CircularProgress, Container, IconButton, List, ListItemButton,
  ListItemText, Typography,
} from '@mui/material'
import Markdown from './Markdown.jsx'

// The records, grouped as the catalogue groups them. Listed by title and never
// by filename or id: `DEC-044` is not something anyone can hold in their head,
// and the whole point of this screen is that nobody has to (`PLT-6egb`).
export default function Read({ base }) {
  const [docs, setDocs] = React.useState(null)
  const [open, setOpen] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    fetch(`${base}/api/docs`).then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setDocs(d.docs)))
      .catch((e) => setError(e.message))
  }, [base])

  function openDoc(id) {
    setOpen({ loading: true })
    fetch(`${base}/api/doc?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => setOpen(d.error ? { error: d.error } : d))
      .catch((e) => setOpen({ error: e.message }))
  }

  if (error) return <Typography color="error" sx={{ mt: 3 }}>{error}</Typography>
  if (open) return <Doc doc={open} onBack={() => setOpen(null)} />
  if (!docs) return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress size={22} /></Box>

  const groups = docs.reduce((acc, d) => {
    (acc[d.group] = acc[d.group] || []).push(d)
    return acc
  }, {})

  return (
    <Box sx={{ mt: 2 }}>
      {Object.entries(groups).map(([group, items]) => (
        <Box key={group} sx={{ mb: 3 }}>
          <Typography variant="overline" color="text.secondary">
            {group} ({items.length})
          </Typography>
          <List disablePadding
                sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mt: 0.5 }}>
            {items.map((d, i) => (
              <ListItemButton key={d.id} divider={i < items.length - 1}
                              onClick={() => openDoc(d.id)}>
                <ListItemText
                  primary={d.title}
                  primaryTypographyProps={{ sx: { lineHeight: 1.35 } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  )
}

function Doc({ doc, onBack }) {
  if (doc.loading) {
    return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress size={22} /></Box>
  }
  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton onClick={onBack} size="small" aria-label="Back to the list">
          <span aria-hidden>←</span>
        </IconButton>
        <Typography variant="caption" color="text.secondary">{doc.path}</Typography>
      </Box>
      {doc.error
        ? <Typography color="error">{doc.error}</Typography>
        : <Markdown text={doc.text} />}
    </Box>
  )
}
