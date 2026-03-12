# Event Difficulty Scaling

**Priority:** medium
**Roadmap Item:** 219
**Created:** 2026-03-12

## Goal
Scale event frequency based on colony size and age so that larger, more established colonies face more frequent events, creating increasing narrative pressure.

## Context
The storyteller currently uses a fixed global cooldown (1800 ticks) between events regardless of colony state. This means a colony with 1 colonist on day 1 gets the same event pacing as a colony with 8 colonists on day 30. Adding a difficulty multiplier that scales with colony size and age creates more dynamic gameplay — early game is quiet while late game has more events to manage.

## Plan

### Files to Modify
- `src/renderer/src/simulation/events/storyteller.ts` — Add `getDifficultyMultiplier` method and use it to scale the global cooldown in `canFireEvent`
- `src/renderer/src/simulation/events/storyteller.test.ts` — Add tests for difficulty scaling

### Existing Code to Reuse
- `simulation/events/storyteller.ts:Storyteller` — existing class with cooldown logic
- `simulation/events/storyteller.ts:GLOBAL_EVENT_COOLDOWN` — base cooldown to scale
- `world/types.ts:WorldTime.day` — colony age in days

### Steps
1. Add `getDifficultyMultiplier(colonistCount: number, day: number): number` to Storyteller that returns a multiplier between 0.5 and 2.0:
   - Colony size factor: `clamp(colonistCount / 5, 0.5, 1.5)` — more colonists = more events
   - Time factor: `clamp(day / 20, 0.5, 1.5)` — older colonies = more events
   - Combined: average of both factors, clamped to [0.5, 2.0]
2. Modify `canFireEvent` to accept colony context and use scaled cooldown: `GLOBAL_EVENT_COOLDOWN / multiplier`
3. Update `selectEligibleEvents` to pass colony context to `canFireEvent`
4. Write unit tests for difficulty scaling at various colony sizes and ages

## Acceptance Criteria
- [ ] Difficulty multiplier scales with colony size (more colonists = higher multiplier)
- [ ] Difficulty multiplier scales with colony age in days (older = higher multiplier)
- [ ] Multiplier is clamped between 0.5 and 2.0
- [ ] Effective cooldown is shorter for larger/older colonies
- [ ] Unit tests cover edge cases (0 colonists, day 1, large colony, old colony)
