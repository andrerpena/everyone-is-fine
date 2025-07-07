# Job System

The job system is a **tick-driven, multi-step task execution engine**. Players issue commands by right-clicking tiles; the system resolves available actions, creates jobs composed of ordered steps, and executes them tick-by-tick until completion or failure.

## Lifecycle

1. **Player right-clicks a tile.** `resolveActions(position, world)` tests all `ACTION_RULES` against the tile.
2. **Actions are sorted by priority** (descending). The highest-priority action is selected.
3. **A job is created** via the action's `createJob(characterId, position)` factory, which builds the step sequence.
4. **The job is assigned** through `jobProcessor.assignJob(job)`, which cancels any existing job for that character.
5. **Each simulation tick**, the job processor and movement system advance the job:
   - `jobProcessor.update(deltaTime)` calls `processCurrentStep()` for each active job, handling MoveStep (pathfind + movement), WorkStep (increment ticksWorked), TransformTileStep (modify tile), and SpawnItemsStep (add items).
   - `movementSystem.update(deltaTime)` advances characters along their paths and fires `onMovementComplete()` to advance the job to its next step.
   - `getActiveJobProgress()` provides data for the UI to render progress bars.
6. **Job ends** as completed, failed, or cancelled.

## Key Files

| File | Purpose |
|------|---------|
| `src/renderer/src/simulation/jobs/types.ts` | Type definitions for jobs, steps, actions |
| `src/renderer/src/simulation/jobs/job-processor.ts` | Main execution engine |
| `src/renderer/src/simulation/jobs/job-factory.ts` | Job creation (chop, mine, move) |
| `src/renderer/src/simulation/jobs/action-rules.ts` | Declarative tile → action mapping |
| `src/renderer/src/simulation/jobs/action-resolver.ts` | Resolves available actions for a tile |
| `src/renderer/src/simulation/jobs/job-queue.ts` | Queue stub for future AI scheduler |
| `src/renderer/src/simulation/movement/movement-system.ts` | Character movement along paths |
| `src/renderer/src/simulation/pathfinding/astar.ts` | A* pathfinding |

## Core Types

### Job

```typescript
interface Job {
  id: string
  type: string              // "chop", "mine", "move"
  characterId: EntityId
  targetPosition: Position3D
  steps: JobStep[]
  currentStepIndex: number
  status: JobStatus          // "pending" | "active" | "completed" | "failed" | "cancelled"
  createdAt: number
}
```

### Job Steps

Jobs are composed of sequential steps. Each step has its own status (`"pending" | "active" | "completed" | "failed"`).

| Step Type | Description | Timing |
|-----------|-------------|--------|
| **MoveStep** | Navigate character to a position. If `adjacent: true`, finds a passable tile neighboring the target instead. | Variable (depends on path length) |
| **WorkStep** | Perform labor. Increments `ticksWorked` each tick until reaching `totalTicks`. | Fixed (defined per job) |
| **TransformTileStep** | Modify tile state (e.g. remove a structure). | Instant |
| **SpawnItemsStep** | Create items at a position (e.g. wood, stone). | Instant |

## Defined Jobs

### Chop Tree

**Targets:** `tree_oak`, `tree_pine` structures | **Priority:** 10

| Step | Type | Detail |
|------|------|--------|
| 1 | Move | Walk to tile adjacent to the tree |
| 2 | Work | 300 ticks (~5s at 1x speed) |
| 3 | Transform | Remove tree structure, mark tile passable |
| 4 | Spawn | 25 wood items at the tile |

### Mine Boulder

**Targets:** `boulder` structures | **Priority:** 10

| Step | Type | Detail |
|------|------|--------|
| 1 | Move | Walk to tile adjacent to the boulder |
| 2 | Work | 480 ticks (~8s at 1x speed) |
| 3 | Transform | Remove boulder structure, mark tile passable |
| 4 | Spawn | 20 stone items at the tile |

### Move

**Targets:** Any passable tile | **Priority:** 1

| Step | Type | Detail |
|------|------|--------|
| 1 | Move | Walk directly to the destination tile |

## Action System

Actions bridge tile state to job creation. They are defined declaratively in `action-rules.ts`.

### Action Rules

Each rule specifies:
- **id / label** — identifier and display name
- **priority** — higher values win when multiple actions match
- **matches(tile, position)** — predicate tested against the tile
- **createJob(characterId, target)** — factory function returning a `Job`

### Resolution

`resolveActions(position, world)` tests all rules against the tile at the given position and returns matching actions sorted by priority (descending). The UI uses the highest-priority action when the player right-clicks.

## Execution Engine (JobProcessor)

`JobProcessor` is the core class that drives job execution.

### Per-Tick Processing

On every simulation tick, `update(deltaTime)` iterates all active jobs and calls `processCurrentStep()`:

- **MoveStep (pending):** Resolve destination (handling `adjacent` flag), run A* pathfinding, issue move command to `MovementSystem`. When the movement system reports completion via `onMovementComplete()`, the step is marked completed and the job advances.
- **WorkStep (active):** Increment `ticksWorked`. When it reaches `totalTicks`, mark completed and advance.
- **TransformTileStep:** Execute tile mutation immediately, advance.
- **SpawnItemsStep:** Add items to tile immediately, advance.

When all steps are completed, the job is marked `"completed"` and removed from active jobs.

### Failure Handling

Jobs fail (status `"failed"`) when:

| Reason | Cause |
|--------|-------|
| Character not found | Entity removed from store |
| World not initialized | World not loaded |
| No passable adjacent tile | All 8 neighbors are impassable |
| Level not found | Invalid z-level |
| No path found | A* cannot reach destination |

Failed jobs are removed from active jobs and the character becomes idle.

## Walking & Pathfinding

### A* Pathfinder (`astar.ts`)

- Uses a binary min-heap priority queue for efficiency
- Supports 8-directional movement (cardinal directions preferred over diagonals)
- Octile distance heuristic for accurate diagonal cost estimation
- Configurable movement costs per tile
- Max node limit to prevent runaway searches

### Movement System (`movement-system.ts`)

Characters move along computed paths at a configurable speed (default: 2 tiles/second).

Each tick:
1. Calculate progress increment based on speed and delta time
2. When reaching a waypoint, update entity position and move to next waypoint
3. Calculate visual offset for smooth interpolation between tiles
4. When reaching the final waypoint, fire `onMovementComplete()` callback

The `adjacent` flag on MoveSteps uses `findAdjacentPassableTile()` which checks all 8 neighbors, preferring cardinal directions, and selects the nearest passable tile by Manhattan distance.

## Progress Rendering

`JobProgressRenderer` draws progress bars during work steps:

- Width: 26px, Height: 4px
- Positioned above the tile center
- Progress value: `ticksWorked / totalTicks`
- Only displayed during WorkStep execution

## Game State Integration

The game store (`game-state/store.ts`) provides:

- `assignJob(job)` — forwards to `jobProcessor.assignJob()`
- `cancelJob(characterId)` — forwards to `jobProcessor.cancelJob()`

The simulation loop calls `jobProcessor.update()` and `movementSystem.update()` each tick, then syncs job progress into the store for the renderer.

## Simulation Timing

- **Tick rate:** 60 ticks/second (16.67ms per tick)
- **Speed multipliers:** 1x, 2x, 4x

| Job | Work Ticks | Time at 1x | Time at 2x | Time at 4x |
|-----|-----------|------------|------------|------------|
| Chop tree | 300 | 5.0s | 2.5s | 1.25s |
| Mine boulder | 480 | 8.0s | 4.0s | 2.0s |

## Job Queue (Future)

`JobQueue` is a stub for a future AI scheduler. Currently, player-issued jobs bypass the queue and go directly to `JobProcessor.assignJob()`. The queue will eventually allow idle colonists to automatically pick up unassigned work.

## Adding New Job Types

1. **Create a factory function** in `job-factory.ts` that returns a `Job` with the desired step sequence.

2. **Add an action rule** in `action-rules.ts` with a `matches` predicate and `createJob` reference.

No other changes are needed — the system will automatically resolve the action when the matching tile is right-clicked and execute the steps in order.

To add a **new step type**, define the interface in `types.ts`, add it to the `JobStep` union, and handle it in `processCurrentStep()` in `job-processor.ts`.
