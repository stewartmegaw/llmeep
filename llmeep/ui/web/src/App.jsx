import React from 'react'
import {
  Alert, AppBar, Box, Button, Chip, CircularProgress, Container, Dialog,
  DialogContent, DialogTitle, Divider, IconButton, List, ListItem,
  ListItemButton, ListItemText, Paper, Stack, Tab, Tabs, TextField, Toolbar,
  Typography,
} from '@mui/material'
import Read, { Doc, size } from './Read.jsx'
import Pills from './Pills.jsx'

// Where this is mounted. The server injects it; a dev server has none.
const BASE = (window.LLMEEP_BASE || '').replace(/\/$/, '')

// The order work moves through, and the order it is read in. `recent` is
// deliberately absent: it is history, and this screen is about what is live.
const SECTIONS = [
  ['in_progress', 'In progress'],
  ['prioritised', 'Prioritised'],
  ['backlog', 'Backlog'],
]

const LEDGERS = ['platform', 'business']

export default function App() {
  const [board, setBoard] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [canWrite, setCanWrite] = React.useState(false)
  const [tab, setTab] = React.useState('board')
  const [sub, setSub] = React.useState('decisions')
  // Everything on to begin with, and you switch off what you do not want. There
  // is no "All" pill because every pill being lit *is* all — a control whose
  // job is to undo the other controls is one more thing to understand.
  const [off, setOff] = React.useState(() => new Set())
  const toggle = (v) => setOff((prev) => {
    const next = new Set(prev)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  })
  const [docs, setDocs] = React.useState([])
  const [detail, setDetail] = React.useState(null)
  // How much room the composer is taking, so nothing ends up underneath it.
  // Measured rather than guessed: it grows as the exchange does.
  const [bottom, setBottom] = React.useState(0)

  // Fetched once and shared. The board says a task *has* a detail; the
  // catalogue is what knows how to open it.
  const [unbrowsed, setUnbrowsed] = React.useState('Task details')
  React.useEffect(() => {
    fetch(`${BASE}/api/docs`).then((r) => r.json())
      .then((d) => {
        setDocs(d.docs || [])
        if (d.unbrowsed) setUnbrowsed(d.unbrowsed)
      }).catch(() => {})
  }, [])

  // A detail belongs to its task, so it is reached by tapping that task and
  // never by scrolling a list whose every title is a task title.
  const browsable = React.useMemo(
    () => docs.filter((d) => d.group !== unbrowsed), [docs, unbrowsed],
  )

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
    <Box sx={{ pb: `calc(${bottom}px + 24px)` }}>
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
          <Tab value="notes" label="Notes" />
          {/* "Other", not "Read": the text box can promote a note or reword a
              task from these screens too, so naming them for reading would be
              naming them for half of what they do. */}
          <Tab value="other" label="Other" />
        </Tabs>

      </AppBar>

      <Container maxWidth="sm" sx={{ px: 2 }}>
        {tab === 'other' && (
          <Pills sx={{ mt: 2 }} value={sub} onChange={setSub}
                 options={[
                   { value: 'decisions', label: 'Decisions',
                     count: browsable.filter((d) => d.group === 'Decisions').length },
                   { value: 'ontology', label: 'Ontology',
                     count: browsable.filter((d) => d.group === 'Ontology').length },
                 ]} />
        )}
        {tab === 'board' && board && (
          <BoardFilters board={board} off={off} onToggle={toggle} />
        )}
        {error && (
          <Typography color="error" sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>{error}</Typography>
        )}
        {tab === 'notes' && <Read base={BASE} docs={browsable} only="Notes" />}
        {tab === 'other' && (
          <Read base={BASE} docs={browsable}
                only={sub === 'decisions' ? 'Decisions' : 'Ontology'}
                key={sub} />
        )}
        {tab === 'board' && board && Object.entries(board).map(([ledger, sections]) => (
          <Ledger key={ledger} name={ledger} sections={sections} off={off}
                  docs={docs} onDetail={setDetail} />
        ))}
      </Container>
      {/* On both tabs. The agent can promote a note or reword a task from
          either, and a question it asked must not vanish because someone
          looked something up while thinking about the answer. */}
      {canWrite && <Say onDone={load} onHeight={setBottom} />}
      <DetailSheet head={detail} docs={docs} onClose={() => setDetail(null)} />
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

function Say({ onDone, onHeight }) {
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [turns, setTurns] = React.useState([])
  const box = React.useRef(null)
  const tail = React.useRef(null)

  // Fixed to the bottom, so the page has to be told how tall it is. A
  // ResizeObserver rather than a constant, because the exchange above the input
  // changes that height every time either side says something.
  React.useEffect(() => {
    if (!box.current || !onHeight) return
    const watch = new ResizeObserver(([e]) => onHeight(e.contentRect.height))
    watch.observe(box.current)
    return () => watch.disconnect()
  }, [onHeight])

  // The newest turn, not the oldest. A reply you have to scroll to find is one
  // you will assume never came.
  React.useEffect(() => {
    tail.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [turns, busy])

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
      ref={box}
      elevation={3}
      square
      sx={{
        // Fixed, not sticky. Sticky only pins once the page is long enough to
        // scroll, so on a short board the box drifted up into the middle of
        // nowhere — which is where this started.
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1200,
        pt: 1.5, borderTop: 1, borderColor: 'divider',
        // Clear of the home indicator on a phone.
        pb: 'calc(12px + env(safe-area-inset-bottom))',
      }}
    >
      <Container maxWidth="sm" sx={{ px: 2 }}>
        {turns.length > 0 && (
          <Box sx={{ maxHeight: '45vh', overflowY: 'auto', mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
              <Button size="small" onClick={() => setTurns([])}
                      sx={{ textTransform: 'none', minWidth: 0 }}>
                Clear
              </Button>
            </Box>
            {turns.map((t, i) => <Turn key={i} turn={t} />)}
            {busy && (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <CircularProgress size={16} />
              </Box>
            )}
            <Box ref={tail} />
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

// `off` holds the pills that have been switched off — a ledger name or a
// section key. Empty means show everything, which is where it starts.
function Ledger({ name, sections, off, docs, onDetail }) {
  if (off.has(name)) return null
  const live = SECTIONS.filter(([key]) => !off.has(key) && sections[key]?.length)
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
              <Task key={task.id} task={task} docs={docs} onDetail={onDetail}
                    divider={i < sections[key].length - 1} />
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
// A paperclip, inline rather than pulled from an icon package. One shape does
// not justify a dependency, and drawn here it takes the chip's own colour.
function Clip(props) {
  return (
    <Box component="svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         sx={{ width: 15, height: 15 }} {...props}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1
               5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </Box>
  )
}

function Task({ task, docs, onDetail, divider }) {
  // The board's `detail` is a path; the catalogue's id is what opens it.
  const head = task.detail && docs.find((d) => d.path === task.detail)
  // Everything openable for this task: the detail itself, plus whatever else
  // is in its folder. Never zero — the chip only exists when there is one.
  const items = head ? 1 + docs.filter((d) => d.parent === head.id).length : null
  return (
    <ListItem divider={divider} alignItems="flex-start" sx={{ py: 1.25 }}>
      <ListItemText
        primary={task.title}
        primaryTypographyProps={{ sx: { lineHeight: 1.35 } }}
        secondary={
          <Box sx={{ mt: 0.75 }}>
            {task.detail && (
              // On its own line above the rest, and a button rather than a
              // chip. Everything else on this card is a label describing the
              // task; this is the one thing that does something, and it should
              // not have to be told apart from four things that do not.
              //
              // It opens where you are — sending someone to another tab to read
              // what they just tapped asks them to hold a place in their head
              // and come back to it.
              <Button
                size="small" variant="outlined" startIcon={<Clip />}
                disabled={!head}
                onClick={head ? () => onDetail(head) : undefined}
                sx={{ mb: 1, textTransform: 'none', py: 0.25 }}
              >
                {items ? `Attachments ${items}` : 'Attachments'}
              </Button>
            )}
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
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
              <Chip size="small" variant="outlined" label={task.id}
                    sx={{ opacity: 0.5, fontFamily: 'ui-monospace, monospace' }} />
            </Stack>
          </Box>
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

// A detail, opened over the board rather than instead of it. Its attachments
// are listed underneath and open in the same sheet, so a folder detail is one
// thing to read and one thing to close.
function DetailSheet({ head, docs, onClose }) {
  const [shown, setShown] = React.useState(null)
  const [text, setText] = React.useState(null)

  const open = shown || head
  const attachments = head ? docs.filter((d) => d.parent === head.id) : []

  React.useEffect(() => {
    setShown(null)
  }, [head])

  React.useEffect(() => {
    setText(null)
    if (!open || (open.kind !== 'text' && open.kind !== 'table')) return
    let live = true
    fetch(`${BASE}/api/doc?id=${encodeURIComponent(open.id)}`)
      .then((r) => r.json())
      .then((d) => live && setText(d))
      .catch(() => {})
    return () => { live = false }
  }, [open])

  if (!head) return null
  const doc = text && text.id === open.id ? text : open
  return (
    <Dialog open fullScreen onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        {shown && (
          <IconButton size="small" onClick={() => setShown(null)} aria-label="Back to the detail">
            <span aria-hidden>←</span>
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1, fontSize: '1rem', overflowWrap: 'anywhere' }}>
          {open.title}
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Doc doc={doc} base={BASE} />
        {!shown && attachments.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="overline" color="text.secondary">
              Also here ({attachments.length})
            </Typography>
            <List disablePadding
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mt: 0.5 }}>
              {attachments.map((a, i) => (
                <ListItemButton key={a.id} divider={i < attachments.length - 1}
                                onClick={() => setShown(a)}>
                  <ListItemText primary={a.title}
                                secondary={`${a.kind} · ${size(a.bytes)}`} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

// The pills above the board: three sections and both ledgers, all lit, all
// toggles. An empty one is shown disabled rather than hidden — that a business
// board exists and has nothing on it is worth knowing, and a row that changes
// shape as work arrives has to be re-read every time.
function BoardFilters({ board, off, onToggle }) {
  const count = (sections, key) => (key ? sections[key]?.length || 0
    : SECTIONS.reduce((n, [k]) => n + (sections[k]?.length || 0), 0))

  const options = SECTIONS.map(([key, label]) => {
    const n = Object.values(board).reduce((sum, s) => sum + count(s, key), 0)
    return { value: key, label, count: n, disabled: n === 0 }
  })
  for (const name of LEDGERS) {
    const sections = board[name]
    if (!sections) continue
    const n = count(sections)
    options.push({
      value: name,
      label: name[0].toUpperCase() + name.slice(1),
      count: n,
      disabled: n === 0,
    })
  }
  const selected = new Set(options.filter((o) => !off.has(o.value)).map((o) => o.value))
  return <Pills sx={{ mt: 2 }} options={options} selected={selected} onChange={onToggle} />
}
