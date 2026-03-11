// =============================================================================
// CROP REGISTRY — Static definitions for all plantable crop types
// =============================================================================

import type { CropProperties, CropType } from "../../world/types";

export const CROP_REGISTRY: Record<CropType, CropProperties> = {
  rice: {
    growthTicks: 18_000, // ~5 min at 60 TPS
    minTemp: 10,
    maxTemp: 40,
    yieldType: "vegetable",
    yieldQuantity: 3,
  },
  potato: {
    growthTicks: 15_000, // ~4.2 min
    minTemp: 5,
    maxTemp: 35,
    yieldType: "vegetable",
    yieldQuantity: 4,
  },
  corn: {
    growthTicks: 21_000, // ~5.8 min
    minTemp: 12,
    maxTemp: 42,
    yieldType: "vegetable",
    yieldQuantity: 5,
  },
  strawberry: {
    growthTicks: 12_000, // ~3.3 min
    minTemp: 8,
    maxTemp: 35,
    yieldType: "berries",
    yieldQuantity: 6,
  },
  healroot: {
    growthTicks: 24_000, // ~6.7 min
    minTemp: 2,
    maxTemp: 38,
    yieldType: "berries", // placeholder until medicine ItemType is added
    yieldQuantity: 2,
  },
};
