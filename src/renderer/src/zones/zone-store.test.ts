import { beforeEach, describe, expect, it } from "vitest";
import { useZoneStore } from "./zone-store";

describe("ZoneStore", () => {
  beforeEach(() => {
    useZoneStore.getState().clearAll();
  });

  it("creates a zone with an ID", () => {
    const id = useZoneStore
      .getState()
      .createZone("stockpile", "Main Storage", 0);
    expect(id).toBe("zone_1");

    const zone = useZoneStore.getState().zones.get(id);
    expect(zone).toBeDefined();
    expect(zone!.type).toBe("stockpile");
    expect(zone!.name).toBe("Main Storage");
    expect(zone!.zLevel).toBe(0);
    expect(zone!.tiles.size).toBe(0);
  });

  it("increments zone IDs", () => {
    const id1 = useZoneStore.getState().createZone("stockpile", "A", 0);
    const id2 = useZoneStore.getState().createZone("growing", "B", 0);
    expect(id1).toBe("zone_1");
    expect(id2).toBe("zone_2");
  });

  it("deletes a zone and cleans up tile mappings", () => {
    const id = useZoneStore.getState().createZone("stockpile", "A", 0);
    useZoneStore.getState().addTiles(id, ["5,5", "5,6"]);
    useZoneStore.getState().deleteZone(id);

    expect(useZoneStore.getState().zones.has(id)).toBe(false);
    expect(useZoneStore.getState().tileToZone.has("5,5")).toBe(false);
    expect(useZoneStore.getState().tileToZone.has("5,6")).toBe(false);
  });

  it("adds tiles to a zone", () => {
    const id = useZoneStore.getState().createZone("stockpile", "A", 0);
    useZoneStore.getState().addTiles(id, ["3,4", "3,5", "3,6"]);

    const zone = useZoneStore.getState().zones.get(id)!;
    expect(zone.tiles.size).toBe(3);
    expect(zone.tiles.has("3,4")).toBe(true);
  });

  it("removes tiles from a zone", () => {
    const id = useZoneStore.getState().createZone("stockpile", "A", 0);
    useZoneStore.getState().addTiles(id, ["1,1", "1,2", "1,3"]);
    useZoneStore.getState().removeTiles(id, ["1,2"]);

    const zone = useZoneStore.getState().zones.get(id)!;
    expect(zone.tiles.size).toBe(2);
    expect(zone.tiles.has("1,2")).toBe(false);
  });

  it("reassigns tile from one zone to another", () => {
    const id1 = useZoneStore.getState().createZone("stockpile", "A", 0);
    const id2 = useZoneStore.getState().createZone("growing", "B", 0);

    useZoneStore.getState().addTiles(id1, ["5,5"]);
    expect(useZoneStore.getState().tileToZone.get("5,5")).toBe(id1);

    // Adding same tile to zone2 should remove it from zone1
    useZoneStore.getState().addTiles(id2, ["5,5"]);
    expect(useZoneStore.getState().tileToZone.get("5,5")).toBe(id2);

    const zone1 = useZoneStore.getState().zones.get(id1)!;
    expect(zone1.tiles.has("5,5")).toBe(false);
  });

  it("getZoneAtTile returns the correct zone", () => {
    const id = useZoneStore.getState().createZone("dumping", "Trash", 0);
    useZoneStore.getState().addTiles(id, ["10,10"]);

    const zone = useZoneStore.getState().getZoneAtTile("10,10");
    expect(zone).toBeDefined();
    expect(zone!.id).toBe(id);
    expect(zone!.type).toBe("dumping");
  });

  it("getZoneAtTile returns undefined for unzoned tile", () => {
    expect(useZoneStore.getState().getZoneAtTile("99,99")).toBeUndefined();
  });

  it("getAllZones returns all zones", () => {
    useZoneStore.getState().createZone("stockpile", "A", 0);
    useZoneStore.getState().createZone("growing", "B", 0);
    useZoneStore.getState().createZone("dumping", "C", 0);

    const all = useZoneStore.getState().getAllZones();
    expect(all.length).toBe(3);
  });

  it("clearAll removes everything", () => {
    const id = useZoneStore.getState().createZone("stockpile", "A", 0);
    useZoneStore.getState().addTiles(id, ["1,1"]);
    useZoneStore.getState().clearAll();

    expect(useZoneStore.getState().zones.size).toBe(0);
    expect(useZoneStore.getState().tileToZone.size).toBe(0);
  });
});
