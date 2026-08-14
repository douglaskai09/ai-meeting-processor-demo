# AI Meeting Processor Demo

A public portfolio demo that turns messy meeting notes or transcripts into a structured decision package.

**Workflow:** Capture → Extract → Verify → Assign → Approve → Export

## What it demonstrates

- transcript / note intake
- executive summary generation
- decision extraction
- action-item extraction
- owner and deadline detection
- risk / blocker identification
- follow-up draft generation
- human review and approval gates
- structured JSON export
- processing audit trail

## Why this demo is different

This project is not another chatbot UI. It demonstrates how unstructured business conversation can be transformed into structured operational data that teams can review, approve, and act on.

The public version uses a deterministic extraction engine so it can run safely in the browser without exposing API credentials. A production implementation would replace the extraction layer with server-side OpenAI or Anthropic structured output, validate the schema, persist approved records, and connect tasks to systems such as Notion, ClickUp, Slack, email, or a CRM.

## Engineering signature

The workflow follows a decision-oriented pattern:

1. **Capture** — preserve source context
2. **Extract** — convert narrative text into structured entities
3. **Verify** — surface uncertainty instead of silently inventing facts
4. **Assign** — connect commitments to owners and dates
5. **Approve** — require human confirmation before downstream actions
6. **Export** — produce reusable structured output and an audit record

## Demo-safe architecture

The browser demo intentionally:

- keeps all data local to the current browser
- contains no API keys or secrets
- does not send messages or create tasks externally
- distinguishes inferred fields from explicitly stated fields
- requires human approval before the final package is marked ready

## Production upgrade path

A production build could use:

- Next.js / TypeScript
- server-side OpenAI or Anthropic structured outputs
- Zod / JSON Schema validation
- Supabase / PostgreSQL persistence
- row-level access controls
- task / CRM / Slack / email integrations
- idempotency and duplicate protection
- durable audit events
- confidence thresholds and exception queues

## Run locally

Open `index.html` in a browser, or serve the repository with any static web server.

No API key or installation is required for the public demo.
