# Work Schedule System

**Priority:** medium
**Roadmap Item:** 78
**Created:** 2026-03-11

## Goal
Add a per-colonist work schedule that defines what activity type each hour of the day allows, so colonists follow daily routines (work during day, sleep at night, recreation in evening).

## Context
The simulation has a 24-hour day cycle with `world.time.hour` (0-23). The NeedSatisfactionSystem currently responds to needs regardless of time of day. The work priority system (ticket 0063) controls *which* jobs colonists do, but there's no concept of *when* they should work vs sleep vs relax. A schedule system enables daily routines and prevents colonists from working through the night.

The schedule affects behavior as follows:
- **Work**: Colonist is available for auto-assignment systems (hauling, construction, etc.) and only addresses needs when critical
- **Sleep**: Colonist should sleep even if energy isn't critically low
- **Recreation**: Colonist should relax/socialize even if recreation isn't critically low
- **Anything**: Colonist follows the existing need-based behavior (current default)

## Plan

### Files to Create
- `src/renderer/src/simulation/schedule.ts` — Schedule types, default schedule, helper to get current activity for a given hour
- `src/renderer/src/simulation/schedule.test.ts` — Tests for schedule logic

### Files to Modify
- `src/renderer/src/simulation/types.ts` — Add `schedule` field to Character interface and createCharacter defaults
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts` — Consult schedule to determine behavior: during "sleep" hours, try to sleep proactively; during "recreation" hours, try relax/socialize; during "work" hours, only satisfy critical needs
- `src/renderer/src/agent-api.types.ts` — Expose schedule in AgentCharacterInfo, add setSchedule API
- `src/renderer/src/agent-api.ts` — Implement setSchedule and getSchedule

### Existing Code to Reuse
- `src/renderer/src/simulation/behaviors/need-satisfaction-system.ts:getMostUrgentAction` — Current need priority logic, will be augmented with schedule awareness
- `src/renderer/src/simulation/work-priorities.ts` — Pattern for per-character configuration

### Steps
1. Create `schedule.ts` with ScheduleActivity type ("work" | "sleep" | "recreation" | "anything"), Schedule type (array of 24 ScheduleActivity values), default schedule, and helper functions
2. Add `schedule` field to Character and createCharacter
3. Update NeedSatisfactionSystem to check the current hour's scheduled activity and bias behavior accordingly
4. Add agent API methods for getting/setting schedules
5. Write tests

## Acceptance Criteria
- [ ] Schedule type defines 24-hour activity assignments
- [ ] Default schedule: work 6-18, recreation 18-21, sleep 21-6
- [ ] During "sleep" hours, colonists proactively try to sleep (not just when energy is critical)
- [ ] During "recreation" hours, colonists proactively relax/socialize
- [ ] During "work" hours, colonists only satisfy critical needs (existing behavior)
- [ ] "anything" hours use existing need-based behavior unchanged
- [ ] Agent API can get/set schedules
- [ ] Tests verify schedule logic
- [ ] Typecheck and lint pass
