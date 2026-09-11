import React from 'react'
import {
  Box, Button, CircularProgress, IconButton, List, ListItemButton,
  ListItemText, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography,
} from '@mui/material'
import Markdown from './Markdown.jsx'

// One group of records, listed by title and never by filename or id: `DEC-044`
// is not something anyone can hold in their head, and the whole point of this
// screen is that nobody has to (`PLT-6egb`).
//
// `only` names the group to show. A screen that is one group needs no group
// heading, and a screen that is one *document* — Notes — should open it rather
// than offer a list of one.
export default function Read({ base, only, docs: given }) {
  const [docs, setDocs] = React.useState(given || null)
  const [open, setOpen] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    if (given) return setDocs(given)
    fetch(`${base}/api/docs`).then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setDocs(d.docs)))
      .catch((e) => setError(e.message))
  }, [base, given])

  const mine = React.useMemo(
    () => (docs || []).filter((d) => !only || d.group === only),
    [docs, only],
  )

  // A single document is the screen, not a list with one row on it.
  React.useEffect(() => {
    if (mine.length === 1 && mine[0].kind === 'text' && !open) openDoc(mine[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.length])

  function openDoc(entry) {
    // Markdown and tables are fetched as text. An image or a PDF is a URL the
    // browser renders itself, and a download is a link — no point pulling bytes
    // through JSON to hand them straight back.
    if (entry.kind !== 'text' && entry.kind !== 'table') return setOpen(entry)
    setOpen({ loading: true })
    fetch(`${base}/api/doc?id=${encodeURIComponent(entry.id)}`)
      .then((r) => r.json())
      .then((d) => setOpen(d.error ? { error: d.error } : d))
      .catch((e) => setOpen({ error: e.message }))
  }

  if (error) return <Typography color="error" sx={{ mt: 3 }}>{error}</Typography>
  if (open) {
    // Nothing to go back to when the list was one document.
    const alone = mine.length === 1
    return <Doc doc={open} base={base} onBack={alone ? null : () => setOpen(null)} />
  }
  if (!docs) return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress size={22} /></Box>
  if (!mine.length) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        Nothing here yet.
      </Typography>
    )
  }

  const groups = mine.reduce((acc, d) => {
    (acc[d.group] = acc[d.group] || []).push(d)
    return acc
  }, {})

  return (
    <Box sx={{ mt: 2 }}>
      {Object.entries(groups).map(([group, items]) => (
        <Box key={group} sx={{ mb: 3 }}>
          {!only && (
            <Typography variant="overline" color="text.secondary">
              {group} ({items.length})
            </Typography>
          )}
          <List disablePadding
                sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mt: 0.5 }}>
            {items.map((d, i) => (
              <ListItemButton key={d.id} divider={i < items.length - 1}
                              onClick={() => openDoc(d)}
                              // An attachment is indented under the detail it
                              // belongs to, so a folder reads as one thing.
                              sx={{ pl: d.parent ? 4 : 2 }}>
                <ListItemText
                  primary={d.title}
                  secondary={d.kind === 'text' ? null : `${d.kind} · ${size(d.bytes)}`}
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

export function size(n) {
  if (!n && n !== 0) return ''
  return n < 1024 ? `${n} B`
    : n < 1024 * 1024 ? `${Math.round(n / 1024)} kB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function Doc({ doc, base, onBack }) {
  if (doc.loading) {
    return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress size={22} /></Box>
  }
  const src = `${base}/api/file?id=${encodeURIComponent(doc.id)}`
  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {onBack && (
          <IconButton onClick={onBack} size="small" aria-label="Back to the list">
            <span aria-hidden>←</span>
          </IconButton>
        )}
        <Typography variant="caption" color="text.secondary"
                    sx={{ overflowWrap: 'anywhere' }}>{doc.path}</Typography>
      </Box>
      {doc.error && <Typography color="error">{doc.error}</Typography>}
      {doc.kind === 'text' && doc.text !== undefined && <Markdown text={doc.text} />}
      {doc.kind === 'table' && doc.text !== undefined && <Rows text={doc.text} />}
      {doc.kind === 'image' && (
        <Box component="img" src={src} alt={doc.title}
             sx={{ maxWidth: '100%', borderRadius: 2, display: 'block' }} />
      )}
      {doc.kind === 'pdf' && (
        // An iframe is what a phone browser will actually do something with;
        // the link underneath is for the ones that will not.
        <Box>
          <Box component="iframe" src={src} title={doc.title}
               sx={{ width: '100%', height: '70vh', border: 0, borderRadius: 2 }} />
          <Button href={src} target="_blank" rel="noreferrer" sx={{ mt: 1 }}>
            Open {doc.title}
          </Button>
        </Box>
      )}
      {doc.kind === 'file' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {doc.title} · {size(doc.bytes)}
          </Typography>
          <Button variant="outlined" href={src}>Download</Button>
        </Box>
      )}
    </Box>
  )
}

// Separated values, as rows. Deliberately naive: it splits on the delimiter and
// nothing else, because a parser that handles quoted commas is a parser to
// maintain, and the fallback when it is wrong is the text itself.
function Rows({ text }) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  const sep = (lines[0] || '').includes('\t') ? '\t' : ','
  const cells = lines.map((l) => l.split(sep))
  const quoted = cells.some((r) => r.some((c) => c.startsWith('"')))
  if (!lines.length || quoted) {
    return (
      <Box component="pre" sx={{ overflowX: 'auto', fontSize: '0.85em',
                                fontFamily: 'ui-monospace, monospace' }}>
        {text}
      </Box>
    )
  }
  const [head, ...body] = cells
  return (
    <TableContainer sx={{ maxWidth: '100%' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {head.map((c, i) => (
              <TableCell key={i} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {body.map((row, i) => (
            <TableRow key={i}>
              {row.map((c, j) => <TableCell key={j}>{c}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
