# Architecture

## Public demo flow

```text
Meeting notes / transcript
        ↓
Source capture
        ↓
Deterministic extraction layer
        ↓
Structured package
  ├─ Summary
  ├─ Decisions
  ├─ Actions
  ├─ Owners
  ├─ Deadlines
  └─ Risks
        ↓
Confidence labeling
        ↓
Human approval gate
        ↓
Structured JSON export
        ↓
Audit record
```

## Design principles

- preserve the original source instead of overwriting it
- separate extraction from approval
- distinguish explicit facts from inferred fields
- never unlock downstream actions until review is complete
- keep the output structured so other systems can consume it
- keep browser demo credentials and secrets at zero

## Production version

A production implementation would move extraction server-side and validate every model response against a strict schema before persistence.

Suggested shape:

```text
Authenticated user
      ↓
Next.js app
      ↓
Server action / route handler
      ↓
AI extraction service
  ├─ provider abstraction
  ├─ structured-output schema
  ├─ confidence thresholds
  └─ retry / failure handling
      ↓
Validation layer
      ↓
PostgreSQL / Supabase
      ↓
Human review queue
      ↓
Approved integrations
  ├─ task system
  ├─ CRM
  ├─ Slack
  └─ email
```

## Failure modes worth handling

- missing owner
- ambiguous deadlines
- conflicting decisions
- action item duplicated across meetings
- model returns invalid structure
- low-confidence inferred fields
- repeated transcript submission
- downstream integration failure after approval

The desired behavior is to surface uncertainty and route exceptions for review rather than silently guessing.
