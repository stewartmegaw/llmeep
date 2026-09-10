import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box, Divider, Link, Table, TableBody, TableCell, TableContainer,
         TableHead, TableRow, Typography } from '@mui/material'

// The records are written machine-first (principle 1), which is affordable only
// because a person reads them somewhere else. This is that somewhere else.
const H = (variant, mt) => function Heading({ children }) {
  return <Typography variant={variant} sx={{ mt, mb: 1, fontWeight: 600 }}>{children}</Typography>
}

const components = {
  h1: H('h6', 0), h2: H('subtitle1', 3), h3: H('subtitle2', 2.5),
  h4: H('subtitle2', 2), h5: H('subtitle2', 2), h6: H('subtitle2', 2),
  p: ({ children }) => (
    <Typography paragraph sx={{ lineHeight: 1.6 }}>{children}</Typography>
  ),
  li: ({ children }) => (
    <Typography component="li" sx={{ lineHeight: 1.6, mb: 0.5 }}>{children}</Typography>
  ),
  hr: () => <Divider sx={{ my: 2 }} />,
  a: ({ href, children }) => {
    // Relative links point at other files in the repo, which this viewer opens
    // by id rather than by path. Rendering them as dead links would be worse
    // than rendering them as text, so they are text.
    const external = /^https?:/.test(href || '')
    return external
      ? <Link href={href} target="_blank" rel="noreferrer">{children}</Link>
      : <Box component="span" sx={{ textDecoration: 'underline dotted' }}>{children}</Box>
  },
  // react-markdown stopped passing an `inline` flag, so `code` is styled as
  // inline and `pre` resets its children. A fenced block is always <pre><code>,
  // which makes the nesting the signal rather than a prop that no longer exists.
  code: ({ children }) => (
    <Box component="code"
         sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85em',
               px: 0.5, py: 0.2, borderRadius: 1, bgcolor: 'action.hover' }}>
      {children}
    </Box>
  ),
  // Wide code scrolls inside its own box; the page never scrolls sideways.
  pre: ({ children }) => (
    <Box component="pre"
         sx={{ p: 1.5, my: 2, borderRadius: 2, bgcolor: 'action.hover',
               overflowX: 'auto', fontSize: '0.85em',
               '& code': { p: 0, bgcolor: 'transparent', borderRadius: 0 } }}>
      {children}
    </Box>
  ),
  blockquote: ({ children }) => (
    <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2, my: 2,
               color: 'text.secondary' }}>{children}</Box>
  ),
  table: ({ children }) => (
    <TableContainer sx={{ my: 2, maxWidth: '100%' }}>
      <Table size="small">{children}</Table>
    </TableContainer>
  ),
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children }) => <TableCell sx={{ fontWeight: 600 }}>{children}</TableCell>,
  td: ({ children }) => <TableCell>{children}</TableCell>,
}

export default function Markdown({ text }) {
  return (
    <Box sx={{ '& > *:first-of-type': { mt: 0 }, overflowWrap: 'anywhere' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </Box>
  )
}
