# Everyone Is Fine

[everyoneisfine.com](everyoneisfine.com) is an early-stage colony simulation game that aims to be like RimWorld one day, if Claude Code and my prompts are good enough.

While RimWorld is better than [everyoneisfine.com](everyoneisfine.com), then everyone is still fine.

## Autonomous Development

This is an experiment where Claude Code runs  `/dev-cycle` on my Mac Mini, every 1h.

The development process is:

1. **Tech Lead** — triages human feedback, grooms the backlog, creates detailed implementation tickets
2. **Developer** — picks up a ticket, implements it, passes quality gates, commits and pushes

Human steering happens by editing [`.spec/human-requests/todo.md`](.spec/human-requests/todo.md). The [roadmap](.spec/roadmap.md), [tickets](.spec/tickets/), and [project vision](.spec/north-star.md) live in [`.spec/`](.spec/).

## License

[MIT](LICENSE)

## Getting Started

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Runs the game in development mode
| `npm run build` | Typecheck + production build |
| `npm run storybook` | Component development |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint:fix` | Lint and format with Biome |

