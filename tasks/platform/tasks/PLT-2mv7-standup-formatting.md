# Standup headers should be bold in Telegram

The standup posts as one block of plain text. On a phone — where it is read — `Next up` and
`Captured, not yet work` sit at the same visual weight as the lines under them, so the reader
has to parse structure that the sender already knows.

`sendMessage` is called with no `parse_mode` (`tm:423`), so Telegram renders exactly what it is
given.

## Formatting belongs to the channel, not to the standup

`standup_text()` builds one string that is printed to a terminal *and* handed to whichever
notifier `NOTIFY` names. Bolding inside it would put Telegram's syntax on the terminal and in
Slack, which uses different syntax again, and in a webhook, which wants none (`DEC-008` — the
notifier is swappable).

So the shape is: **the standup produces sections, and each channel renders them.**

```
standup_sections() -> [(heading, [line, …]), …]
  render_plain()     heading, then two-space-indented lines     (terminal)
  render_telegram()  <b>heading</b>, HTML-escaped body
  render_slack()     *heading*, mrkdwn
  render_webhook()   plain — a webhook's consumer decides
```

## Use HTML, not MarkdownV2

Telegram offers both. MarkdownV2 requires escaping `_ * [ ] ( ) ~ \` > # + - = | { } . !`
anywhere in the text — and task titles here routinely contain `--force`, `.llmeep`,
`ontology/domain/`, brackets and full stops. One missed escape and the API rejects the whole
message, which means the standup silently fails on the day someone files a title with a dash in
it.

HTML mode needs only `&`, `<` and `>` escaped, and `<b>` is all this needs.

## Care

- **A rejected message must not be silent.** `post()` raises on a non-2xx and `notify` currently
  swallows nothing — check that a parse failure surfaces rather than reporting "sent".
- **`done` also notifies.** One line, no headings; it should keep working unchanged.
- **The terminal output should not change.** It is read aloud from a screen and gains nothing
  from markup.

## Acceptance

- [ ] Telegram shows `Next up` and `Captured, not yet work` bold, body plain
- [ ] A title containing `-`, `.`, `(` and `_` posts without error
- [ ] `tm standup` printed to a terminal is byte-identical to today's output
- [ ] Slack and webhook paths still send, with slack bolding and webhook plain
- [ ] `tm done`'s notification is unchanged
- [ ] A message Telegram rejects reports failure rather than "sent via telegram"
