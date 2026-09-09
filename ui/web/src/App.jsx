import React from 'react'
import {
  Alert, AppBar, Box, Chip, CircularProgress, Container, IconButton,
  List, ListItem, ListItemText, Paper, Stack, TextField, Toolbar, Typography,
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
  const [canWrite, setCanWrite] = React.useState(false)

  React.useEffect(() => {
    fetch(`${BASE}/api/config`).then((r) => r.json())
      .then((c) => setCanWrite(c.can_write)).catch(() => {})
  }, [])

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
      {canWrite && <Say onDone={load} />}
    </Box>
  )
}

// One box for everything: a new task, a change to one, or a question. Which of
// those it is, is the agent's to work out and not the person's to declare —
// asking them to pick a verb first is asking them to learn the system before
// they can use it, and this screen exists for people who should not have to.
function Say({ onDone }) {
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [reply, setReply] = React.useState(null)

  function send() {
    if (!text.trim() || busy) return
    setBusy(true); setReply(null)
    fetch(`${BASE}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setReply({ error: d.error })
        setReply({ text: d.answer, changed: d.action !== 'none' })
        setText('')
        if (d.action !== 'none') onDone()
      })
      .catch((e) => setReply({ error: e.message }))
      .finally(() => setBusy(false))
  }

  return (
    <Paper
      elevation={3}
      square
      sx={{
        position: 'sticky', bottom: 0, mt: 3, py: 1.5,
        borderTop: 1, borderColor: 'divider',
        // Clear of the home indicator on a phone.
        pb: 'calc(12px + env(safe-area-inset-bottom))',
      }}
    >
      <Container maxWidth="sm" sx={{ px: 2 }}>
        {reply && (
          <Alert
            severity={reply.error ? 'error' : reply.changed ? 'success' : 'info'}
            sx={{ mb: 1.5 }}
            onClose={() => setReply(null)}
          >
            {reply.error || reply.text}
          </Alert>
        )}
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth multiline maxRows={6} size="small"
            placeholder="Add something, change something, or just ask"
            value={text}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; shift+enter is a newline. On a phone the return
              // key is the send button.
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
          />
          <IconButton onClick={send} disabled={busy || !text.trim()}
                      aria-label="Send" color="primary" sx={{ mb: 0.25 }}>
            {busy ? <CircularProgress size={18} /> : <span aria-hidden>↑</span>}
          </IconButton>
        </Stack>
      </Container>
    </Paper>
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
