# Job Priority System (Per-Colonist Work Priorities)

**Priority:** high
**Roadmap Item:** 76
**Created:** 2026-03-11

## Goal
Add a per-colonist, per-work-type priority system (1-4, 0 = disabled) that controls which colonists are assigned to which auto-generated jobs.

## Context
Currently, auto-assignment systems (hauling, construction, harvesting, sowing, cooking) pick the **closest idle colonist** with no regard for specialization or player preference. This ticket adds a priority field to characters and integrates it into the existing auto-assignment systems, enabling work specialization (e.g., one colonist is the primary cook, another is the primary builder).

The priority scale follows the RimWorld convention:
- **0**: Disabled — colonist will never do this work type
- **1**: Highest priority (do first)
- **2-3**: Medium priorities
- **4**: Lowest priority (do last, as backup)

## Plan

### Files to Create
- `src/renderer/src/simulation/work-priorities.ts` — WorkType definition, default priorities, helper functions
- `src/renderer/src/simulation/work-priorities.test.ts` — Tests for priority helpers

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `workPriorities` field to Character interface and createCharacter defaults
- `src/renderer/src/simulation/jobs/hauling-system.ts` — Filter idle characters by hauling priority, prefer higher-priority colonists
- `src/renderer/src/simulation/jobs/construction-system.ts` — Filter by construction priority
- `src/renderer/src/simulation/jobs/harvesting-system.ts` — Filter by growing priority
- `src/renderer/src/simulation/jobs/sowing-system.ts` — Filter by growing priority
- `src/renderer/src/simulation/jobs/cooking-system.ts` — Filter by cooking priority
- `src/renderer/src/agent-api.types.ts` — Expose work priorities in character info
- `src/renderer/src/agent-api.ts` — Add setWorkPriority API method

### Existing Code to Reuse
- `src/renderer/src/simulation/jobs/hauling-system.ts:getIdleCharacters` — Pattern for filtering available colonists (will extend with priority check)
- `src/renderer/src/simulation/jobs/hauling-system.ts:pickClosestCharacter` — Will extend to sort by priority first, then distance

### Steps
1. Create `work-priorities.ts` with WorkType union, WorkPriorities type, default priorities, and a helper `getEligibleCharacters` that filters and sorts characters by priority for a given work type
2. Add `workPriorities: WorkPriorities` to Character interface and createCharacter defaults (all work types default to priority 3)
3. Update each auto-assignment system to use the priority-aware character selection:
   - Map each system to its WorkType (hauling→"hauling", construction→"construction", etc.)
   - Replace `getIdleCharacters()` + `pickClosestCharacter()` with priority-aware selection
4. Add `setWorkPriority` and `getWorkPriorities` to the agent API
5. Write tests for priority filtering and sorting logic

## Acceptance Criteria
- [ ] WorkType union covers all auto-assignment job categories
- [ ] Characters have workPriorities field with sensible defaults
- [ ] Priority 0 prevents assignment for that work type
- [ ] Higher priority (lower number) colonists are preferred over lower priority ones
- [ ] Among equal-priority colonists, closest is still preferred
- [ ] All 5 auto-assignment systems respect priorities
- [ ] Agent API exposes get/set for work priorities
- [ ] Tests verify priority filtering and sorting
- [ ] Typecheck and lint pass
