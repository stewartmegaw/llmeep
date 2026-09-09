import React from 'react'
import {
  AppBar, Box, Chip, CircularProgress, Container, IconButton, Link,
  List, ListItem, ListItemText, Stack, Toolbar, Typography,
} from '@mui/material'

// Where this is mounted. The server injects it; a dev server has none.
const BASE = (window.LLMEEP_BASE || '').replace(/\/$/, '')

// The order work moves through, and the order it is read in. `recent` is
// deliberately absent: it is history, and this screen is about what is live.
const SECTIONS = [
  ['in_progress', 'In progress'],
  ['prioritised', 'Next'],
  ['backlog', 'Backlog'],
]

export default function App() {
  const [board, setBoard] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/board`)
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
      .then((d) => { setBoard(d.ledgers); setError(null) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(load, [load])

  return (
    <Box sx={{ pb: 6 }}>
      <AppBar position="sticky" color="default" elevation={0}
              sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 52 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>llmeep</Typography>
          <IconButton onClick={load} aria-label="Reload the board" size="small">
            {loading ? <CircularProgress size={18} /> : <span aria-hidden>↻</span>}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {error && (
          <Typography color="error" sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>{error}</Typography>
        )}
        {board && Object.entries(board).map(([ledger, sections]) => (
          <Ledger key={ledger} name={ledger} sections={sections} />
        ))}
      </Container>
    </Box>
  )
}

function Ledger({ name, sections }) {
  const live = SECTIONS.filter(([key]) => sections[key]?.length)
  if (!live.length) return null
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="overline" color="text.secondary">{name}</Typography>
      {live.map(([key, label]) => (
        <Box key={key} sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            {label} ({sections[key].length})
          </Typography>
          <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            {sections[key].map((task, i) => (
              <Task key={task.id} task={task} divider={i < sections[key].length - 1} />
            ))}
          </List>
        </Box>
      ))}
    </Box>
  )
}

// The title is the handle, not the id. `PLT-6yjz` is four random characters
// nobody can hold in their head, and this screen is for people who should never
// have to (`PLT-6egb`).
function Task({ task, divider }) {
  return (
    <ListItem divider={divider} alignItems="flex-start" sx={{ py: 1.25 }}>
      <ListItemText
        primary={task.title}
        primaryTypographyProps={{ sx: { lineHeight: 1.35 } }}
        secondary={
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
            {task.assignee
              ? <Chip size="small" label={`@${task.assignee}`} />
              : <Chip size="small" variant="outlined" label="unassigned" />}
            {task.commits > 0 && (
              <Chip size="small" color="success" variant="outlined"
                    label={`${task.commits} commit${task.commits === 1 ? '' : 's'} in`} />
            )}
            {task.blocked_by && (
              <Chip size="small" color="warning" variant="outlined" label="blocked" />
            )}
            {task.detail && <Chip size="small" variant="outlined" label="has detail" />}
            <Chip size="small" variant="outlined" label={task.id}
                  sx={{ opacity: 0.5, fontFamily: 'ui-monospace, monospace' }} />
          </Stack>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />
    </ListItem>
  )
}
