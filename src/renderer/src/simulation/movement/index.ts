// =============================================================================
// MOVEMENT MODULE EXPORTS
// =============================================================================

export {
  // Direction utilities
  type Direction,
  directionToAngle,
  // Easing functions
  easeIn,
  easeInOut,
  easeOut,
  // Interpolation functions
  getCharacterCenterPosition,
  getCharacterDirection,
  getCharacterVisualPosition,
  getMovementDirection,
  lerp,
  lerpPosition2D,
  lerpPosition3D,
  smootherStep,
  smoothStep,
} from "./interpolation";
export { MovementSystem } from "./movement-system";
