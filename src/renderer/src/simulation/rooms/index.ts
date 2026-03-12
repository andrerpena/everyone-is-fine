// =============================================================================
// ROOMS MODULE EXPORTS
// =============================================================================

export {
  DEFAULT_INSULATION,
  getIndoorTemperature,
  INDOOR_COMFORT_BASELINE,
} from "./indoor-temperature";
export {
  detectRoomsForLevel,
  ROOM_CHECK_INTERVAL,
  RoomDetectionSystem,
} from "./room-detection-system";
export { classifyRoom } from "./room-role";
export { calculateRoomStats } from "./room-stats";
export {
  generateRoomId,
  type Room,
  type RoomRole,
  type RoomStats,
} from "./room-types";
