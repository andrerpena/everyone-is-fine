// =============================================================================
// HAULING SYSTEM
// =============================================================================
// Periodically scans for items on the ground and assigns haul jobs to idle
// colonists to move them into matching stockpile zones.

import type { ItemData, Position3D, World } from "../../world/types";
import { getWorldTileAt } from "../../world/utils/tile-utils";
import { doesItemPassFilter } from "../../zones/stockpile-filter";
import type { ZoneData } from "../../zones/types";
import { useZoneStore } from "../../zones/zone-store";
import type { EntityStore } from "../entity-store";
import type { EntityId } from "../types";
import { createHaulJob } from "./job-factory";
import type { JobProcessor } from "./job-processor";

// =============================================================================
// CONSTANTS
// =============================================================================

/** How often (in ticks) the hauling system scans for work */
const CHECK_INTERVAL = 120;

/** Maximum haul jobs to assign per scan (to avoid lag spikes) */
const MAX_JOBS_PER_SCAN = 3;

// =============================================================================
// HAULING SYSTEM CLASS
// =============================================================================

export class HaulingSystem {
  private ticksSinceLastCheck = 0;

  constructor(
    private entityStore: EntityStore,
    private jobProcessor: JobProcessor,
    private getWorld: () => World | null,
  ) {}

  update(): void {
    this.ticksSinceLastCheck++;
    if (this.ticksSinceLastCheck < CHECK_INTERVAL) return;
    this.ticksSinceLastCheck = 0;

    const world = this.getWorld();
    if (!world) return;

    const stockpiles = this.getStockpileZones();
    if (stockpiles.length === 0) return;

    const idleCharacters = this.getIdleCharacters();
    if (idleCharacters.length === 0) return;

    let jobsAssigned = 0;

    // Scan each level for items on the ground
    for (const [zLevel, level] of world.levels) {
      if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
      if (idleCharacters.length === 0) break;

      for (let y = 0; y < level.height; y++) {
        if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
        if (idleCharacters.length === 0) break;

        for (let x = 0; x < level.width; x++) {
          if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
          if (idleCharacters.length === 0) break;

          const tile = level.tiles[y * level.width + x];
          if (tile.items.length === 0) continue;

          // Skip tiles that are already inside a stockpile zone
          const tileKey = `${x},${y}`;
          const zoneAtTile = useZoneStore.getState().getZoneAtTile(tileKey);
          if (zoneAtTile?.type === "stockpile") continue;

          // Try to haul each item on this tile
          for (const item of tile.items) {
            if (jobsAssigned >= MAX_JOBS_PER_SCAN) break;
            if (idleCharacters.length === 0) break;

            // Skip items already reserved for hauling
            const sourcePos: Position3D = { x, y, z: zLevel };
            if (this.jobProcessor.reservations.isReserved(sourcePos)) continue;

            // Find a matching stockpile with an open tile
            const dest = this.findStockpileDestination(item, stockpiles, world);
            if (!dest) continue;

            // Pick the closest idle character
            const charId = this.pickClosestCharacter(idleCharacters, sourcePos);
            if (!charId) continue;

            const job = createHaulJob(charId, sourcePos, dest, item.id);
            this.jobProcessor.assignJob(job);
            jobsAssigned++;

            // Remove this character from idle pool
            const idx = idleCharacters.indexOf(charId);
            if (idx !== -1) idleCharacters.splice(idx, 1);
          }
        }
      }
    }
  }

  private getStockpileZones(): ZoneData[] {
    return useZoneStore
      .getState()
      .getAllZones()
      .filter((z) => z.type === "stockpile");
  }

  private getIdleCharacters(): EntityId[] {
    const idle: EntityId[] = [];
    for (const character of this.entityStore.values()) {
      if (character.mentalBreak !== null) continue;
      if (character.control.mode !== "idle") continue;
      if (character.movement.isMoving) continue;
      if (this.jobProcessor.getJob(character.id)) continue;
      idle.push(character.id);
    }
    return idle;
  }

  private findStockpileDestination(
    item: ItemData,
    stockpiles: ZoneData[],
    world: World,
  ): Position3D | null {
    for (const zone of stockpiles) {
      // Check if this stockpile accepts the item
      if (zone.filter && !doesItemPassFilter(zone.filter, item.type)) {
        continue;
      }

      // Find an open (passable, not reserved) tile in this zone
      for (const tileKey of zone.tiles) {
        const [xStr, yStr] = tileKey.split(",");
        const x = Number(xStr);
        const y = Number(yStr);
        const pos: Position3D = { x, y, z: zone.zLevel };

        // Skip reserved tiles
        if (this.jobProcessor.reservations.isReserved(pos)) continue;

        // Check tile is passable
        const tile = getWorldTileAt(world, x, y, zone.zLevel);
        if (!tile?.pathfinding.isPassable) continue;

        return pos;
      }
    }
    return null;
  }

  private pickClosestCharacter(
    idleCharacters: EntityId[],
    target: Position3D,
  ): EntityId | null {
    let best: EntityId | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const id of idleCharacters) {
      const char = this.entityStore.get(id);
      if (!char) continue;

      const dist =
        Math.abs(char.position.x - target.x) +
        Math.abs(char.position.y - target.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    }

    return best;
  }
}
