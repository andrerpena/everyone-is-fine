# Development Process

EveryoneIsFine is developed autonomously by an AI agent using Claude Code's `/loop` feature. This document explains how the system works end-to-end.

## Overview

The game is built incrementally by a recurring autonomous loop. A human sets it running, and the agent cycles through planning and implementation without any human interaction. The human's role is to steer priorities by editing the roadmap or dropping request files into a folder.

## Starting the Loop

```
/loop 1h /dev-cycle
```

This tells Claude Code to run the `/dev-cycle` slash command once every hour. Each run is a self-contained cycle that plans one piece of work and implements it.

## What Happens Each Cycle

Every `/dev-cycle` run executes two phases in sequence.

### Phase 1 — Tech Lead

The agent acts as a tech lead. It triages human feedback, grooms the backlog, and ensures exactly one actionable ticket exists in `.spec/tickets/pending/`.

1. **Human feedback triage**: It checks `.spec/human-requests/pending/` for any human-submitted requests. Requests are processed based on type — feature/bug requests go to the roadmap, strategic feedback modifies the roadmap or cancels conflicting tickets, technical feedback becomes tickets directly, and vision feedback updates north-star or guiding principles. Processed requests are moved to `completed/`.
2. **Backlog grooming**: If no pending ticket exists, it looks at the next 5 unchecked roadmap items and explores the codebase to verify each one. Items that are already implemented get checked off. Items that are partially done get an inline note. Obsolete items get checked off with a strikethrough note. This repeats until an actionable item is found.
3. **Ticket creation**: It picks the first genuinely actionable unchecked item, deep-explores the codebase, and creates a detailed ticket with a full implementation plan (files to modify/create, existing code to reuse, step-by-step instructions). It then checks off the roadmap item.

### Phase 2 — Developer

The agent acts as a developer. It picks up the pending ticket and implements it.

1. It reads the guiding principles and the ticket.
2. It analyzes the relevant source files to understand existing patterns before writing any code.
3. It implements the change, following existing conventions. If the scope is too large, it implements the smallest meaningful subset.
4. It writes unit tests for pure logic changes (not UI rendering).
5. It runs the quality gate: `npm run lint:fix` and `npm run typecheck`. Both must pass before any commit.
6. It does a best-effort browser verification using BrowserOS MCP — taking a screenshot to confirm the app loads. This step is not a blocker if BrowserOS is unavailable.
7. It moves the ticket from `pending/` to `completed/`.
8. It commits with a conventional commit message, rebases against the remote, and pushes.
9. It does a reflection pass: scanning for dead code, duplication, or simplification opportunities. If found, it fixes, lints, commits, and pushes again.

## Directory Structure

```
.spec/
├── north-star.md              # Game vision and prototype goals
├── roadmap.md                 # Ordered checklist of features to build
├── guiding-principles.md      # Rules the agent follows when coding
├── docs/                      # Documentation maintained alongside code
├── tickets/
│   ├── pending/               # Current ticket being worked on (max 1)
│   └── completed/             # Finished tickets (kept for history)
└── human-requests/
    └── todo.md                # Human requests (## TODO / ## DONE sections)
```

## Tickets

Tickets live as markdown files. The directory they're in IS their status — no status fields needed.

Filename format: `NNNN-kebab-case-title.md` (e.g., `0001-colonist-needs-system.md`). The number is sequential across both `pending/` and `completed/` to ensure uniqueness.

Each ticket contains a goal, context, a detailed implementation plan (files to modify/create, existing code to reuse, step-by-step instructions), and acceptance criteria. The Tech Lead creates tickets during Phase 1 and the Developer completes them during Phase 2.

## Roadmap

The roadmap (`roadmap.md`) is a numbered checklist. The first unchecked item is always the next priority. Items are checked off when a ticket is created for them, never removed.

Humans control priority by reordering the list. No scoring algorithms or complex prioritization — just ordering.

## Human Requests

Humans can influence what the agent works on by adding items to the `## TODO` section of `.spec/human-requests/todo.md`. Each item is a free-form description of a request, feedback, or direction change.

The Tech Lead processes all TODO items at the start of every cycle using judgment based on the content. Processed items are moved to the `## DONE` section of the same file.

This is the primary mechanism for humans to steer the agent without interrupting its loop.

## Quality Gates

Every commit must pass two checks:

1. `npm run lint:fix` — Biome linter with auto-fix
2. `npm run typecheck` — TypeScript type checking

These are hard gates. The agent will not commit or push until both pass. Browser verification via BrowserOS is also attempted but is best-effort — lint and typecheck are the mandatory checks.

## Git Workflow

The agent works directly on the `main` branch. Before each push it runs `git pull --rebase` to incorporate any human changes made between cycles. This keeps the history linear and avoids merge conflicts in most cases.

## Key Design Decisions

1. **One ticket at a time.** The Tech Lead skips ticket creation if a pending ticket exists. This prevents ticket pile-up and keeps each cycle focused on a single deliverable.

2. **Directory as status.** No status fields in tickets. `pending/` vs `completed/` is the status. Moving a file is an atomic status change.

3. **Roadmap ordering is priority.** First unchecked item wins. Simple and predictable.

4. **No human interaction during cycles.** The agent never prompts, never asks questions, never blocks on input. It makes autonomous decisions based on the ticket, codebase, and guiding principles.

5. **Small changes only.** If a roadmap item is too large for one cycle, the agent scopes it down. This keeps each commit reviewable and reduces the blast radius of mistakes.

6. **Reflection after implementation.** Each cycle ends with a quick cleanup pass. This prevents technical debt from accumulating across cycles.

7. **Backlog grooming prevents wasted work.** The Tech Lead verifies roadmap items against the codebase before creating tickets, so the Developer never gets a ticket for something already built.
