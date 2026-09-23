import React from 'react'
import {
  Alert, AppBar, Box, Button, Checkbox, Chip, CircularProgress, Container, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, IconButton, List, ListItem,
  ListItemButton, ListItemText, Paper, Snackbar, Stack, Tab, Tabs, TextField,
  Toolbar, Typography, useMediaQuery, useTheme,
} from '@mui/material'
import Read, { Doc, size } from './Read.jsx'
import Markdown from './Markdown.jsx'
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

// The toolbar plus the tab row, which the app bar pins to the top. The
// conversation pane on a wide screen is pinned under it and fills what is left,
// so it needs the number.
const HEADER = 120

// Wide enough for two columns. Below it there is one, and the conversation is a
// tab like everything else; at or above it the conversation is always there,
// because a screen that can show both should not make anyone choose.
const TWO_COLUMNS = 'md'

// **A button sized by its content is an oval.** These are glyphs rather than
// icons — ✓, ✕, ↑, ↓, ↻ — and a glyph is narrower than it is tall, so the
// ripple and the hover circle came out 25 wide by 34 high with a 50% radius.
// Squared here rather than per button, because there are seven of them and the
// eighth would be the one that got missed (`PLT-4spu`).
const GLYPH = { width: 34, height: 34 }

export default function App() {
  const [board, setBoard] = React.useState(null)
  const [updated, setUpdated] = React.useState(null)
  const [markFailed, setMarkFailed] = React.useState(false)
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
  // A verb the person named, waiting on their yes. `null` is nothing pending.
  const [asking, setAsking] = React.useState(null)
  const [acting, setActing] = React.useState(false)
  const [flash, setFlash] = React.useState(null)
  // Bumped when a verb lands, so a list that is not the board reloads too.
  const [notesAt, setNotesAt] = React.useState(0)
  // What is being dragged and where it is hovering: `{ id, from, over, where }`.
  const [drag, setDrag] = React.useState(null)
  const [detail, setDetail] = React.useState(null)
  // How much room the composer is taking, so nothing ends up underneath it.
  // Measured rather than guessed: a long message grows it.
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
      .then((d) => { setBoard(d.ledgers); setUpdated(d.updated); setError(null) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const wide = useMediaQuery(useTheme().breakpoints.up(TWO_COLUMNS))
  // **Named verbs go straight to the tool.** No model between a tap and
  // `tm done`: it would cost a call, a wait and a chance of guessing, and the
  // table this reaches is the same one a turn reaches (`PLT-7kk3`).
  const runTool = React.useCallback(async (tool, args) => {
    setActing(true)
    try {
      const r = await fetch(`${BASE}/api/do`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, args }),
      })
      if (!r.ok) throw new Error(`llmeep answered ${r.status}`)
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      load()
      setNotesAt((n) => n + 1)
      // `note` is how a commit says it did not reach anybody else (`DEC-053`),
      // and is worth showing for a tap exactly as it is for a turn.
      if (d.note) setFlash(d.note)
    } catch (e) {
      setFlash(e.message)
    } finally {
      setActing(false)
      setAsking(null)
    }
  }, [load])

  // **A drop resolves to a verb, never to a file.** Where a task landed is a
  // question about its neighbours, which is exactly what `prioritise --after`
  // takes (`DEC-056`) — so the app never has to know what `board.md` looks like.
  const dropped = React.useCallback((move) => {
    setDrag(null)
    // **Only the queue can be dropped into**, because it is the only section
    // with an order: the pool has none by definition (`DEC-027`) and moving
    // between sections is what the arrows are for. Dragging what cannot be
    // ordered is a gesture that has to be explained afterwards.
    if (!move || move.section !== 'prioritised') return
    if (move.after === null) return runTool('prioritise', { id: move.id, top: true })
    if (move.after === move.id) return
    runTool('prioritise', { id: move.id, after: move.after })
  }, [runTool])

  // A ref rather than the value: a turn reads it when it starts, and the state
  // it closes over would be whatever it was when `send` was created.
  const updatedAt = React.useRef(null)
  React.useEffect(() => { updatedAt.current = updated }, [updated])
  // Declared after `load`, which it calls when a turn changed something.
  const conversation = useConversation(load, updatedAt)
  // A tab that only exists on a phone leaves a dangling selection when the
  // screen gets wider — a rotated tablet, a resized window — so the board takes
  // over, which is where the app opens anyway.
  React.useEffect(() => {
    if (wide && tab === 'chat') setTab('board')
  }, [wide, tab])

  React.useEffect(load, [load])

  return (
    <Box sx={{ pb: wide ? 0 : `calc(${bottom}px + 24px)` }}>
      <AppBar position="sticky" color="default" elevation={0}
              sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: 72 }}>
          <Box sx={{ flexGrow: 1 }}>
            {/* The road runner the README opens with. It is fetched from the
                same third-party CDN that README links, so it is the one request
                this app makes to anywhere it does not control — and where this
                is meant to run, behind an ingress or a VPN, it may not arrive at
                all. So it falls back to the wordmark rather than to a gap
                (`PLT-zs4j`). */}
            {markFailed ? (
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>llmeep</Typography>
            ) : (
              <Box component="img" src={MARK} alt="llmeep"
                   onError={() => setMarkFailed(true)}
                   sx={{ height: 45, width: 'auto', display: 'block' }} />
            )}
          </Box>
          {/* Freshness sits with the control that changes it: reload above, and
              under it what reloading got you. When the records last changed, not
              when this tab last asked — the same answer for everyone looking at
              the same repo (`PLT-f4n6`). */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {tab === 'board' && (
              <IconButton onClick={load} aria-label="Reload the board" size="small"
                        sx={GLYPH}>
                {loading ? <CircularProgress size={18} /> : <span aria-hidden>↻</span>}
              </IconButton>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {updated ? `updated ${ago(updated)}` : 'no records yet'}
            </Typography>
          </Box>
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
          {/* An icon and no word: it is the one tab whose content is a
              conversation, and a label beside three others would squeeze all
              four. On a wide screen the pane makes it unnecessary. */}
          {!wide && canWrite && (
            <Tab value="chat" aria-label="Conversation" sx={{ minWidth: 56, flex: '0 0 auto' }}
                 label={<span aria-hidden style={{ fontSize: 18 }}>💬</span>} />
          )}
        </Tabs>

      </AppBar>

      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Container maxWidth="sm" sx={{ px: 2 }}>
        {tab === 'chat' && (
          <Box sx={{ mt: 2 }}>
            <Transcript turns={conversation.turns} busy={conversation.busy}
                        onClear={conversation.clear}
                        empty="Ask anything — a thought, a transcript, a question." />
          </Box>
        )}
        {tab === 'other' && (
          <Pills sx={{ mt: 2 }} value={sub} onChange={setSub}
                 options={[
                   { value: 'decisions', label: 'Decisions',
                     count: browsable.filter((d) => d.group === 'Decisions').length },
                   { value: 'ontology', label: 'Ontology',
                     count: browsable.filter((d) => d.group === 'Ontology').length },
                   { value: 'agenda', label: 'Agenda' },
                 ]} />
        )}
        {tab === 'board' && board && (
          <BoardFilters board={board} off={off} onToggle={toggle} />
        )}
        {error && (
          <Typography color="error" sx={{ mt: 3, whiteSpace: 'pre-wrap' }}>{error}</Typography>
        )}
        {tab === 'notes' && (
          <Notes base={BASE} onAsk={setAsking} busy={acting} reload={notesAt} />
        )}
        {tab === 'other' && sub === 'agenda' && (
          <Agenda base={BASE} busy={acting} reload={notesAt}
                  onSet={(text) => runTool('agenda', { text })} />
        )}
        {tab === 'other' && sub !== 'agenda' && (
          <Read base={BASE} docs={browsable}
                only={sub === 'decisions' ? 'Decisions' : 'Ontology'}
                empty={sub === 'decisions'
                  ? 'No decisions recorded yet.'
                  : 'No domain ontology recorded yet — ask to record where yours lives.'}
                key={sub} />
        )}
        {tab === 'board' && board && Object.entries(board).map(([ledger, sections]) => (
          <Ledger key={ledger} name={ledger} sections={sections} off={off}
                  docs={docs} onDetail={setDetail} onAsk={setAsking} onAct={runTool}
                  busy={acting} drag={drag} onDrag={setDrag} onDrop={dropped} />
        ))}
      </Container>
      </Box>
      {/* Always there, never a tab. A screen with room for both should not make
          anyone choose, and the answer to what you just asked stays visible
          while you look something up on the left. */}
      {wide && canWrite && <ConversationPane conversation={conversation} />}
      </Box>
      {/* On every tab, because the agent can promote a note or reword a task
          from any of them. Focusing it is the same intent as tapping the
          conversation tab, so it takes you there. */}
      {!wide && canWrite && (
        <BottomComposer conversation={conversation} onHeight={setBottom}
                        onFocus={() => setTab('chat')} />
      )}
      <DetailSheet head={detail} docs={docs} onClose={() => setDetail(null)} />
      <Confirm asking={asking} busy={acting} onClose={() => setAsking(null)}
               onYes={() => runTool(asking.tool, asking.args)} />
      <Snackbar open={Boolean(flash)} onClose={() => setFlash(null)}
                message={flash || ''} autoHideDuration={8000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
    </Box>
  )
}

// One box for everything: a new task, a change to one, or a question. Which of
// those it is, is the agent's to work out and not the person's to declare —
// asking them to pick a verb first is asking them to learn the system before
// they can use it, and this screen exists for people who should not have to.
// The road runner from the README's first line, hotlinked exactly as the README
// hotlinks it — nothing is vendored into the repo, so nothing copyrighted is
// committed here and the two stay the same picture by construction.
const MARK = 'https://static.wikia.nocookie.net/looneytunesshow/images/4/42/' +
  'Road_Runner.svg/revision/latest/scale-to-width-down/268'

// How long ago, in the coarsest unit that is still true. A board is read on a
// phone, where "3 days ago" is the answer and a timestamp is a puzzle — and
// where an exact clock time invites reading a sort key as a deadline, which
// `DEC-030` keeps off board lines for the same reason.
//
// Today and yesterday get named rather than counted: "22 hours ago" is a worse
// answer than "yesterday" to anyone who has just woken up.
function ago(iso) {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return 'recently'
  const mins = Math.floor((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 6) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const today = new Date().toDateString()
  if (then.toDateString() === today) return `today at ${then.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (then.toDateString() === yesterday) return 'yesterday'
  const days = Math.floor(mins / 1440)
  if (days < 14) return `${days} days ago`
  return then.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

// The session id is the browser's, not the server's: it identifies which
// conversation this is, and losing it costs the talk and never a record.
const SESSION = Math.random().toString(36).slice(2)

// **The conversation is state, not a place.** It lives here so that the same
// exchange is the one a phone shows in its fourth tab and a laptop shows in its
// right-hand pane — and so that turning a tablet sideways does not lose it
// (`PLT-nmeg`).
function useConversation(onDone, updatedAt) {
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [turns, setTurns] = React.useState([])

  const send = React.useCallback(() => {
    if (!text.trim() || busy) return
    const mine = text
    setBusy(true)
    setTurns((t) => [...t, { who: 'you', text: mine }])
    setText('')
    // What the records said before this turn. If they have moved by the time it
    // fails, the work landed and only the answer was lost.
    const before = updatedAt?.current
    fetch(`${BASE}/api/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: mine, session: SESSION }),
    })
      .then((r) => {
        // **Checked before parsing.** Without this, a proxy's HTML error page
        // reached the transcript as `Unexpected token '<'` — a message about a
        // parser, shown to someone who was told they would never need a
        // terminal (`PLT-mrt8`).
        if (!r.ok) {
          throw new Error(r.status === 504 || r.status === 502
            ? `Something between your browser and llmeep gave up waiting (${r.status}).`
            : `llmeep answered ${r.status} ${r.statusText || ''}`.trim())
        }
        return r.json()
      })
      .then((d) => {
        setTurns((t) => [...t, d.error
          ? { who: 'error', text: d.error }
          : { who: 'llmeep', text: d.answer, used: d.used, changed: d.changed,
              // Whether it is live for anyone else. A change that committed and
              // did not push is not a failure and not a success (`PLT-xxcu`).
              note: d.note }])
        if (d.changed) onDone()
      })
      .catch(async (e) => {
        // **The records are asked, not the request.** A turn that commits is not
        // fire-and-forget: the work can land while the answer is lost, and a
        // reader told only "error" retypes it and does the whole thing twice.
        // The repo already knows what happened, which is the premise of all of
        // this — so ask it (`PLT-mrt8`).
        let landed = false
        try {
          const d = await fetch(`${BASE}/api/board`).then((r) => r.json())
          landed = Boolean(before && d.updated && d.updated !== before)
        } catch { /* the answer stands on its own */ }
        onDone()
        setTurns((t) => [...t, { who: 'error', text: e.message, landed }])
      })
      .finally(() => setBusy(false))
  }, [text, busy, onDone])

  return { text, setText, busy, turns, send, clear: () => setTurns([]) }
}

// The exchange. Scrolls itself to the newest turn, because a reply you have to
// scroll to find is one you will assume never came.
function Transcript({ turns, busy, onClear, empty }) {
  const tail = React.useRef(null)
  React.useEffect(() => {
    tail.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [turns, busy])

  if (!turns.length && !busy) {
    return (
      <Typography color="text.secondary"
                  sx={{ mt: 4, textAlign: 'center', px: 3, lineHeight: 1.5 }}>
        {empty}
      </Typography>
    )
  }
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
        <Button size="small" onClick={onClear} sx={{ textTransform: 'none', minWidth: 0 }}>
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
    </>
  )
}

// One box for everything: a new task, a change to one, or a question. Which of
// those it is, is the agent's to work out and not the person's to declare —
// asking them to pick a verb first is asking them to learn the system before
// they can use it, and this screen exists for people who should not have to.
function Composer({ conversation, onFocus }) {
  const { text, setText, busy, send } = conversation
  return (
    <Stack direction="row" spacing={1} alignItems="flex-end">
      <TextField
        fullWidth multiline maxRows={6} size="small"
        placeholder="Hi"
        value={text}
        disabled={busy}
        onFocus={onFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends; shift+enter is a newline. On a phone the return key is
          // the send button.
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
        }}
      />
      {/* Disabled, not spinning. One turn at a time is a real constraint — the
          exchange is a conversation and the next message depends on the answer —
          but two spinners for one wait says two things are happening. The one
          above the input is where the answer will appear, so it is the one that
          means anything; this button only has to stop being pressable
          (`PLT-8rn6`). */}
      <IconButton onClick={send} disabled={busy || !text.trim()}
                  aria-label="Send" color="primary" sx={{ ...GLYPH, mb: 0.25 }}>
        <span aria-hidden>↑</span>
      </IconButton>
    </Stack>
  )
}

// On a narrow screen the composer is pinned to the bottom of the window and the
// exchange it belongs to is a tab. Fixed, not sticky: sticky only pins once the
// page is long enough to scroll, so on a short board the box drifted up into the
// middle of nowhere — which is where this started.
function BottomComposer({ conversation, onFocus, onHeight }) {
  const box = React.useRef(null)
  React.useEffect(() => {
    if (!box.current || !onHeight) return
    const watch = new ResizeObserver(([e]) => onHeight(e.contentRect.height))
    watch.observe(box.current)
    return () => watch.disconnect()
  }, [onHeight])

  return (
    <Paper ref={box} elevation={3} square
           sx={{
             position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1200,
             pt: 1.5, borderTop: 1, borderColor: 'divider',
             // Clear of the home indicator on a phone.
             pb: 'calc(12px + env(safe-area-inset-bottom))',
           }}>
      <Container maxWidth="sm" sx={{ px: 2 }}>
        <Composer conversation={conversation} onFocus={onFocus} />
      </Container>
    </Paper>
  )
}

// On a wide screen it is a column of its own, pinned under the header and
// filling the rest of the window: the exchange scrolls, the composer sits at the
// bottom of it, and neither is ever more than a glance away.
function ConversationPane({ conversation }) {
  return (
    <Paper variant="outlined" square
           sx={{
             width: 456, flexShrink: 0, position: 'sticky', top: HEADER,
             height: `calc(100vh - ${HEADER}px)`,
             display: 'flex', flexDirection: 'column',
             borderTop: 0, borderRight: 0, borderBottom: 0,
           }}>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pt: 1 }}>
        <Transcript turns={conversation.turns} busy={conversation.busy}
                    onClear={conversation.clear}
                    empty="Ask anything — a thought, a transcript, a question." />
      </Box>
      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Composer conversation={conversation} />
      </Box>
    </Paper>
  )
}

// **The notes, as a list rather than a document.** The archive rendered as
// markdown is something to read; a note is something to act on — it becomes a
// task or it goes. The rows come from `nm notes --json`, so what is a note, what
// it was promoted to and whether that shipped are all decided in one place
// (`PLT-pudy`).
function Notes({ base, onAsk, busy, reload }) {
  const [state, setState] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    fetch(`${base}/api/notes`)
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
      .then((d) => { setState(d); setError(null) })
      .catch((e) => setError(e.message))
  }, [base, reload])

  if (error) return <Typography color="error" sx={{ mt: 3 }}>{error}</Typography>
  if (!state) return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress size={22} /></Box>
  if (!state.notes.length && !state.waiting) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center', px: 3 }}>
        Nothing captured yet.
      </Typography>
    )
  }

  const days = state.notes.reduce((acc, n) => {
    (acc[n.on] = acc[n.on] || []).push(n)
    return acc
  }, {})

  return (
    <Box sx={{ mt: 2 }}>
      {/* First, because it is the actionable part and it is invisible in the
          archive: nothing in there says a file is sitting in `raw/`. */}
      {state.waiting > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {state.waiting} capture{state.waiting === 1 ? '' : 's'} waiting in raw/
        </Typography>
      )}
      {Object.entries(days).map(([on, notes]) => (
        <Box key={on} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{on}</Typography>
          <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            {notes.map((n, i) => (
              <ListItem key={n.id} divider={i < notes.length - 1} alignItems="flex-start"
                sx={{ py: 1.25 }}
                secondaryAction={(
                  <Stack direction="row" spacing={0.25}>
                    {/* A note that is already a task has nowhere to be promoted
                        to, and promoting it twice would file the same idea
                        again under a second id. */}
                    {!n.task && (
                      <IconButton size="small" disabled={busy} sx={GLYPH}
                                  aria-label={`Promote ${n.id} to a task`}
                                  onClick={() => onAsk({
                                    tool: 'promote', args: { id: n.id }, verb: 'Make it a task',
                                    title: n.text,
                                    body: 'Filed as a task.',
                                  })}>
                        <span aria-hidden>→</span>
                      </IconButton>
                    )}
                    <IconButton size="small" disabled={busy} sx={GLYPH}
                                aria-label={`Archive ${n.id}`}
                                onClick={() => onAsk({
                                  tool: 'unnote', args: { id: n.id }, verb: 'Archive it',
                                  title: n.text,
                                  body: 'Archived, not deleted.',
                                })}>
                      <span aria-hidden>✕</span>
                    </IconButton>
                  </Stack>
                )}
              >
                <ListItemText
                  primary={n.text}
                  primaryTypographyProps={{ sx: { lineHeight: 1.35, overflowWrap: 'anywhere' } }}
                  secondary={(n.task || n.source) && (
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
                      {n.task && (
                        // A tick means the task shipped, so the note is awaiting
                        // removal rather than hidden — `nm prune` is what clears
                        // it, because the task now carries the record.
                        <Chip size="small" variant="outlined"
                              color={n.shipped ? 'success' : 'default'}
                              label={n.shipped ? `${n.task} ✓` : n.task}
                              sx={{ fontFamily: 'ui-monospace, monospace' }} />
                      )}
                      {n.source && (
                        <Chip size="small" variant="outlined" label={n.source}
                              sx={{ opacity: 0.6 }} />
                      )}
                    </Stack>
                  )}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  )
}

// **The agenda, which is the one screen that is not a record.** Everything else
// here reads something the repo keeps; an agenda is a draft for a meeting,
// gitignored and gone with the machine. It is on this screen because it is
// written in the same conversation as everything else, and because an adopter
// found it useful enough to want it on a phone (`PLT-6v3m`).
//
// **Lines, not items.** The tool has never parsed the agenda — the agent writes
// the file and `--send` posts what is in it, so there is no format for the two
// ends to disagree about (`PLT-ehd6`). Removing one is text editing: drop the
// line, hand back the rest. Nothing here knows what a section is.
const TICK = '\u2713'
// The marker as `tm` writes and strips it: after a bullet or a section number.
const TICKED = /^(\s*(?:\d+\.|-)?\s*)\u2713\s*/
const ticked = (l) => TICKED.test(l)
// A ticked line reads as struck-through text, so the marker itself would be
// said twice — once as a character and once as the styling.
const bare = (l) => l.replace(TICKED, '$1')

function Agenda({ base, busy, reload, onSet }) {
  const [state, setState] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    fetch(`${base}/api/agenda`)
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
      .then((d) => { setState(d); setError(null) })
      .catch((e) => setError(e.message))
  }, [base, reload])

  if (error) return <Typography color="error" sx={{ mt: 3 }}>{error}</Typography>
  if (!state) return <Box sx={{ mt: 4, textAlign: 'center' }}><CircularProgress size={22} /></Box>

  const lines = (state.text || '').split('\n')
  const written = lines.filter((l) => l.trim()).length
  if (!written) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center', px: 3, lineHeight: 1.5 }}>
        Nothing on the agenda yet — say what the meeting has to get through.
      </Typography>
    )
  }

  // `Next Steps` is the last thing on every agenda and not a line to remove.
  const fixed = (l) => l.trim() === 'Next Steps'
  const drop = (i) => onSet(lines.filter((_, n) => n !== i).join('\n'))
  // Ticking is the same text editing dropping a line is: the marker goes after
  // the bullet or the section number, so the shape still scans down the left
  // edge, and `--send` strips it on the way out.
  const toggle = (i) => onSet(lines.map((l, n) => (
    n !== i ? l
      : ticked(l) ? l.replace(TICKED, '$1')
        : l.replace(/^(\s*(?:\d+\.|-)?\s*)/, `$1${TICK} `)
  )).join('\n'))

  return (
    <Box sx={{ mt: 2 }}>
      <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
        {lines.map((line, i) => (line.trim() ? (
          <ListItem key={i} divider={i < lines.length - 1} alignItems="flex-start"
            sx={{ py: 0.75, pl: 0.5 }}
            secondaryAction={!fixed(line) && (
              <IconButton size="small" disabled={busy} sx={GLYPH}
                          aria-label={`Remove line ${i + 1}`} onClick={() => drop(i)}>
                <span aria-hidden>✕</span>
              </IconButton>
            )}
          >
            {fixed(line) ? <Box sx={{ width: 38 }} /> : (
              <Checkbox size="small" checked={ticked(line)} disabled={busy}
                        onChange={() => toggle(i)} sx={{ mr: 0.5, p: 0.75 }}
                        inputProps={{ 'aria-label': `Worked through ${bare(line)}` }} />
            )}
            <ListItemText
              primary={bare(line)}
              primaryTypographyProps={{ sx: {
                mt: 0.75,
                lineHeight: 1.4, overflowWrap: 'anywhere',
                // A numbered line is a heading and a hyphen is a bullet: the
                // agenda's whole shape, because it is going to a chat message
                // where markdown renders as itself.
                fontWeight: /^\s*\d+\./.test(line) ? 600 : 400,
                pl: /^\s*-/.test(line) ? 2 : 0,
                color: fixed(line) || ticked(line) ? 'text.secondary' : 'text.primary',
                textDecoration: ticked(line) ? 'line-through' : 'none',
              } }}
            />
          </ListItem>
        ) : null))}
      </List>
      <Typography variant="caption" color="text.secondary"
                  sx={{ display: 'block', mt: 1.5, lineHeight: 1.5 }}>
        {state.last_sent ? `Last sent ${state.last_sent}. ` : ''}
        Say what belongs here and it gets written. Local and gitignored — it is a
        draft for a meeting, not a record.
      </Typography>
    </Box>
  )
}

// **Asked before it happens, never after.** Each of these writes a record and
// two of them tell other people: `done` appends history and notifies, and a tap
// that reaches a team channel is not one to make by accident.
function Confirm({ asking, busy, onClose, onYes }) {
  return (
    <Dialog open={Boolean(asking)} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{asking?.verb}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontWeight: 600, mb: 1, lineHeight: 1.35 }}>{asking?.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {asking?.body}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={onYes} disabled={busy} variant="contained"
                sx={{ textTransform: 'none' }}>
          {busy ? <CircularProgress size={18} /> : asking?.verb}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// `off` holds the pills that have been switched off — a ledger name or a
// section key. Empty means show everything, which is where it starts.
function Ledger({ name, sections, off, docs, onDetail, onAsk, onAct, busy, drag, onDrag, onDrop }) {
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
          <List data-section={key} data-ledger={name} disablePadding
                sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            {sections[key].map((task, i) => (
              <Task key={task.id} task={task} docs={docs} onDetail={onDetail}
                    section={key} onAsk={onAsk} onAct={onAct} busy={busy}
                    drag={drag} onDrag={onDrag} onDrop={onDrop}
                    divider={i < sections[key].length - 1} />
            ))}
          </List>
        </Box>
      ))}
    </Box>
  )
}

// Where a pointer is, in board terms: which section it is over, which task, and
// whether it is above or below that task's middle.
//
// **Read off the page rather than tracked.** `elementFromPoint` asks the browser
// what is under the finger, which is the same question the finger is asking —
// and it needs no registry of rows to keep in step with a list that reloads
// under it (`PLT-4spu`).
function whereIsThePointer(x, y) {
  const el = document.elementFromPoint(x, y)
  if (!el) return null
  const list = el.closest('[data-section]')
  if (!list) return null
  const row = el.closest('[data-task-id]')
  if (!row) return { section: list.dataset.section, task: null, below: true }
  const box = row.getBoundingClientRect()
  return {
    section: list.dataset.section,
    task: row.dataset.taskId,
    below: y > box.top + box.height / 2,
  }
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

function Task({ task, docs, onDetail, section, onAsk, onAct, busy, drag, onDrag, onDrop, divider }) {
  // **Pointer events, not HTML5 drag.** `dragstart` never fires on touch, and
  // this screen is a phone first. Dragging begins on the handle only, so a drag
  // never competes with scrolling the board with a thumb (`PLT-4spu`).
  const grab = (e) => {
    if (busy || !onDrag) return
    e.currentTarget.setPointerCapture(e.pointerId)
    onDrag({ id: task.id, from: section, over: null })
  }
  const move = (e) => {
    if (!drag || drag.id !== task.id) return
    const over = whereIsThePointer(e.clientX, e.clientY)
    onDrag({ ...drag, over })
  }
  const let_go = (e) => {
    if (!drag || drag.id !== task.id) return onDrop(null)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    const over = drag.over
    if (!over) return onDrop(null)
    // The id this one should sit behind: the task it was dropped below, or the
    // one above the task it was dropped onto. `null` means the top.
    let after = null
    if (over.task) {
      if (over.below) {
        after = over.task
      } else {
        const list = document.querySelector(`[data-section="${over.section}"]`)
        const ids = [...list.querySelectorAll('[data-task-id]')]
          .map((n) => n.dataset.taskId).filter((id) => id !== task.id)
        const at = ids.indexOf(over.task)
        after = at > 0 ? ids[at - 1] : null
      }
    } else if (over.section === 'prioritised') {
      // Dropped on the empty part of a section: the end of it.
      const list = document.querySelector('[data-section="prioritised"]')
      const ids = [...list.querySelectorAll('[data-task-id]')]
        .map((n) => n.dataset.taskId).filter((id) => id !== task.id)
      after = ids.length ? ids[ids.length - 1] : null
    }
    if (after === task.id) after = null
    onDrop({ id: task.id, from: section, section: over.section, after })
  }

  const held = drag?.id === task.id
  const line = drag && drag.over?.task === task.id && drag.id !== task.id
    ? (drag.over.below ? 'bottom' : 'top') : null

  // The board's `detail` is a path; the catalogue's id is what opens it.
  const head = task.detail && docs.find((d) => d.path === task.detail)
  // Everything openable for this task: the detail itself, plus whatever else
  // is in its folder. Never zero — the chip only exists when there is one.
  const items = head ? 1 + docs.filter((d) => d.parent === head.id).length : null
  return (
    <ListItem divider={divider} alignItems="flex-start" data-task-id={task.id}
      sx={{ py: 1.25, opacity: held ? 0.4 : 1,
            ...(line && { [`border${line === 'top' ? 'Top' : 'Bottom'}`]: 2,
                          borderColor: 'primary.main' }) }}
      secondaryAction={onAsk && (
        <Stack direction="row" spacing={0.25} alignItems="center">
          {/* **Only the queue.** Dragging is for arranging an order, and the
              queue is the only section that has one — the pool is unordered by
              definition (`DEC-027`) and work in progress is neither. */}
          {onDrag && section === 'prioritised' && (
            <Box component="span" aria-label={`Move ${task.id}`} role="button"
                 onPointerDown={grab} onPointerMove={move}
                 onPointerUp={let_go} onPointerCancel={let_go}
                 sx={{ ...GLYPH, cursor: 'grab', color: 'text.disabled',
                       display: 'inline-flex', alignItems: 'center',
                       justifyContent: 'center', touchAction: 'none',
                       userSelect: 'none', fontSize: 18, lineHeight: 1 }}>
              <span aria-hidden>⠿</span>
            </Box>
          )}
          {/* **A section is a click, not a drag.** Up ranks it, down returns it
              to the pool — one tap each, on a phone, without holding anything.
              Neither asks first: both are cheap, and the other button undoes
              it. */}
          {onAsk && section === 'backlog' && (
            <IconButton size="small" disabled={busy} sx={GLYPH}
                        aria-label={`Prioritise ${task.id}`}
                        onClick={() => onAct('prioritise', { id: task.id })}>
              <span aria-hidden>↑</span>
            </IconButton>
          )}
          {onAsk && section === 'prioritised' && (
            <IconButton size="small" disabled={busy} sx={GLYPH}
                        aria-label={`Return ${task.id} to the backlog`}
                        onClick={() => onAct('park', { id: task.id })}>
              <span aria-hidden>↓</span>
            </IconButton>
          )}
          {/* `done` closes a task from any open section, so this is on all of
              them — the board is a list of things that are not finished, and
              saying one is finished is the commonest thing anyone does to it. */}
          <IconButton size="small" disabled={busy} sx={GLYPH}
                      aria-label={`Mark ${task.id} done`}
                      onClick={() => onAsk({
                        tool: 'done', args: { id: task.id }, verb: 'Mark done',
                        title: task.title,
                        body: 'Done, and the team is told.',
                      })}>
            <span aria-hidden>✓</span>
          </IconButton>
          {/* **Not on work in progress.** `drop` writes no history — the task
              was never filed — so dropping something started would erase the
              only record that anyone had touched it, including the commit count
              that says how much is behind it (`DEC-047`). Park it or finish it. */}
          {section !== 'in_progress' && (
            <IconButton size="small" disabled={busy} sx={GLYPH}
                        aria-label={`Archive ${task.id}`}
                        onClick={() => onAsk({
                          tool: 'drop', args: { id: task.id }, verb: 'Archive it',
                          title: task.title,
                          body: 'Archived, not deleted.',
                        })}>
              <span aria-hidden>✕</span>
            </IconButton>
          )}
        </Stack>
      )}
    >
      <ListItemText
        primary={task.title}
        // `anywhere` breaks a word only when there is no other way to fit it, so
        // ordinary titles wrap on spaces exactly as before. Without it a single
        // long token — a path, a URL, a CamelCase run — overflowed the card and
        // was cut mid-word at the right edge, on a page with no horizontal
        // scroll to reach the rest (`PLT-25ew`).
        primaryTypographyProps={{ sx: { lineHeight: 1.35, overflowWrap: 'anywhere' } }}
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
    <Alert severity={turn.who === 'error' ? 'error'
             : turn.note ? 'warning' : turn.changed ? 'success' : 'info'}
           icon={false} sx={{ mb: 1 }}>
      {/* **The agent writes markdown, because everything it reads is markdown.**
          Flat text put `**bold**` and `- a list` on the screen as typed, and
          folded every line break into a space — the same defect the notes had,
          one layer along. What a person typed stays flat: they did not mean
          `*` to be emphasis (`PLT-naj8`). */}
      {turn.who === 'llmeep' ? (
        <Box sx={{ '& > :first-of-type': { mt: 0 }, '& > :last-child': { mb: 0 },
                   overflowWrap: 'anywhere' }}>
          <Markdown text={turn.text} />
        </Box>
      ) : (
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {turn.text}
        </Typography>
      )}
      {turn.note && (
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>{turn.note}</Typography>
      )}
      {turn.landed && (
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
          The records changed while that was in flight, so the work landed — the board
          above is current. Do not send it again.
        </Typography>
      )}
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
