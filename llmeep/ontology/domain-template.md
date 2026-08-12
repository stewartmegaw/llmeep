---
entity: <PascalCaseName>
kind: entity | actor | value-object | event
status: draft | current
updated: <YYYY-MM-DD>
---

# <EntityName>

One or two sentences. What this is, in terms someone outside the project would understand.
No jargon that is not defined elsewhere in this directory.

## Identity

What uniquely identifies an instance, and whether that identifier is stable over its
lifetime. If two instances could be confused, say how to tell them apart.

## Attributes

| Attribute | Type | Required | Meaning |
| --------- | ---- | -------- | ------- |
|           |      |          |         |

Only attributes that matter to the domain. This is not a database schema.

## Relationships

| Relation | Target | Cardinality | Meaning |
| -------- | ------ | ----------- | ------- |
|          |        | 1:1 / 1:N / N:N |     |

## Lifecycle

States and legal transitions. Delete this section if the entity has no states.

```
<state> → <state>
<state> → <state>
```

- **`<state>`** — what it means to be in this state, and what may act on it here.

## Where it lives

Where instances are stored or observed: a table, a service, an external system, a directory.
Concrete enough that a reader can go and look at one.

## Invariants

Things that must always be true. These are the statements worth testing.

-

## Notes

Edge cases, known ambiguities, historical baggage. Say what is genuinely unresolved rather
than papering over it — an honest gap is more useful than a confident guess.
