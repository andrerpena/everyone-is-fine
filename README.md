# Everyone Is Fine

[everyoneisfine.com](everyoneisfine.com) is an early-stage colony simulation game that aims to be like RimWorld one day, if Claude Code and my prompts are good enough.

While RimWorld is better than [everyoneisfine.com](everyoneisfine.com), then everyone is still fine.

<img width="1486" height="952" alt="image" src="https://github.com/user-attachments/assets/341903dc-1cf1-4f1e-a61b-cb2636356860" />


## Autonomous Development

This is an experiment where Claude Code runs  `/dev-cycle` on my Mac Mini, every 1h, and tries to build this game.

The development process is:

1. **Tech Lead** — triages human feedback, grooms the backlog, creates detailed implementation tickets
2. **Developer** — picks up a ticket, implements it, passes quality gates, commits and pushes

Human steering happens by editing [`.spec/human-requests/todo.md`](.spec/human-requests/todo.md). The [roadmap](.spec/roadmap.md), [tickets](.spec/tickets/), and [project vision](.spec/north-star.md) live in [`.spec/`](.spec/).

## The initial commit was vibe-coded but not autonomous

The original infrastructure of the game (UI, base game loop...) was vibe-coded using Claude Code but I actively intervened to steer it in the right direction.

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
| `npm run dev` | Runs the game in development mode. Game will open in http://localhost:5173/
| `npm run build` | Typecheck + production build |
| `npm run storybook` | Component development |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint:fix` | Lint and format with Biome |

