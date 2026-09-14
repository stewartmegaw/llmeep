import React from 'react'
import {
  Alert, AppBar, Box, Button, Chip, CircularProgress, Container, Dialog,
  DialogContent, DialogTitle, Divider, IconButton, List, ListItem,
  ListItemButton, ListItemText, Paper, Stack, Tab, Tabs, TextField, Toolbar,
  Typography, useMediaQuery, useTheme,
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

// The toolbar plus the tab row, which the app bar pins to the top. The
// conversation pane on a wide screen is pinned under it and fills what is left,
// so it needs the number.
const HEADER = 120

// Wide enough for two columns. Below it there is one, and the conversation is a
// tab like everything else; at or above it the conversation is always there,
// because a screen that can show both should not make anyone choose.
const TWO_COLUMNS = 'md'

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
  // Declared after `load`, which it calls when a turn changed something.
  const conversation = useConversation(load)
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
              <IconButton onClick={load} aria-label="Reload the board" size="small">
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
                empty={sub === 'decisions'
                  ? 'No decisions recorded yet.'
                  : 'No domain ontology recorded yet — ask to record where yours lives.'}
                key={sub} />
        )}
        {tab === 'board' && board && Object.entries(board).map(([ledger, sections]) => (
          <Ledger key={ledger} name={ledger} sections={sections} off={off}
                  docs={docs} onDetail={setDetail} />
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
function useConversation(onDone) {
  const [text, setText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [turns, setTurns] = React.useState([])

  const send = React.useCallback(() => {
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
          : { who: 'llmeep', text: d.answer, used: d.used, changed: d.changed,
              // Whether it is live for anyone else. A change that committed and
              // did not push is not a failure and not a success (`PLT-xxcu`).
              note: d.note }])
        if (d.changed) onDone()
      })
      .catch((e) => setTurns((t) => [...t, { who: 'error', text: e.message }]))
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
      <IconButton onClick={send} disabled={busy || !text.trim()}
                  aria-label="Send" color="primary" sx={{ mb: 0.25 }}>
        {busy ? <CircularProgress size={18} /> : <span aria-hidden>↑</span>}
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
             width: 380, flexShrink: 0, position: 'sticky', top: HEADER,
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
      <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
        {turn.text}
      </Typography>
      {turn.note && (
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>{turn.note}</Typography>
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
