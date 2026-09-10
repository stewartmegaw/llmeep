import React from 'react'
import {
  Alert, AppBar, Box, Chip, CircularProgress, Container, IconButton,
  List, ListItem, ListItemText, Paper, Stack, Tab, Tabs, TextField,
  Toolbar, Typography,
} from '@mui/material'
import Read from './Read.jsx'

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
  const [tab, setTab] = React.useState('board')

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
          {tab === 'board' && (
            <IconButton onClick={load} aria-label="Reload the board" size="small">
              {loading ? <CircularProgress size={18} /> : <span aria-hidden>↻</span>}
            </IconButton>
          )}
        </Toolbar>
        {/* Two, not four. What is live and what is written down — everything
            else is a group inside the second, and a row of tabs a thumb has to
            aim at is worse than a list it can scroll. */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab value="board" label="Board" />
          {/* "Other", not "Read": the text box can promote a note or reword a
              task from this screen too, so naming the tab for reading would be
              naming it for half of what it does. */}
          <Tab value="read" label="Other" />
        </Tabs>
      </AppBar>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {error && (
          <Typography color="error" sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>{error}</Typography>
        )}
        {tab === 'read'
          ? <Read base={BASE} />
          : board && Object.entries(board).map(([ledger, sections]) => (
              <Ledger key={ledger} name={ledger} sections={sections} />
            ))}
      </Container>
      {canWrite && tab === 'board' && <Say onDone={load} />}
    </Box>
  )
}

// One box for everything: a new task, a change to one, or a question. Which of
// those it is, is the agent's to work out and not the person's to declare —
// asking them to pick a verb first is asking them to learn the system before
// they can use it, and this screen exists for people who should not have to.
// The session id is the browser's, not the server's: it identifies which
// conversation this is, and losing it costs the talk and never a record.
const SESSION = Math.random().toString(36).slice(2)

function Say({ onDone }) {
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [turns, setTurns] = React.useState([])

  function send() {
    if (!text.trim() || busy) return
    const mine = text
    setBusy(true)
    setTurns((t) => [...t, { who: 'you', text: mine }])
    setText('')
    fetch(`${BASE}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: mine, session: SESSION }),
    })
      .then((r) => r.json())
      .then((d) => {
        setTurns((t) => [...t, d.error
          ? { who: 'error', text: d.error }
          : { who: 'llmeep', text: d.answer, used: d.used, changed: d.changed }])
        if (d.changed) onDone()
      })
      .catch((e) => setTurns((t) => [...t, { who: 'error', text: e.message }]))
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
        {turns.length > 0 && (
          <Box sx={{ maxHeight: '40vh', overflowY: 'auto', mb: 1.5 }}>
            {turns.map((t, i) => (
              <Turn key={i} turn={t} />
            ))}
          </Box>
        )}
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth multiline maxRows={6} size="small"
            placeholder="Paste anything — a thought, a transcript, a question"
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

// An exchange, because the agent can ask. What it did is shown under what it
// said: the verbs are the constraint, so seeing them is seeing the boundary.
function Turn({ turn }) {
  if (turn.who === 'you') {
    return (
      <Typography sx={{ textAlign: 'right', color: 'text.secondary', mb: 1 }}>
        {turn.text}
      </Typography>
    )
  }
  return (
    <Alert severity={turn.who === 'error' ? 'error' : turn.changed ? 'success' : 'info'}
           icon={false} sx={{ mb: 1 }}>
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{turn.text}</Typography>
      {turn.used?.length > 0 && (
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
          {turn.used.map((u, i) => (
            <Chip key={i} size="small" variant="outlined" label={u} />
          ))}
        </Stack>
      )}
    </Alert>
  )
}
