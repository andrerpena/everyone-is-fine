// =============================================================================
// INSPECTOR REGISTRY
// =============================================================================

import type { Selection } from "../../game-state/types";
import type { ObjectSchema, ObjectShape } from "../../schemas/core";

/**
 * Configuration for an inspector type
 */
export interface InspectorConfig<TShape extends ObjectShape = ObjectShape> {
  /** The selection type this inspector handles */
  type: Selection["type"];
  /** Display label for this inspector */
  label: string;
  /** The schema for the inspector form */
  schema: ObjectSchema<TShape>;
  /** React component to render the inspector */
  component: React.ComponentType<InspectorComponentProps>;
  /** Optional icon for the inspector header */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Props passed to inspector components
 */
export interface InspectorComponentProps {
  /** The current selection */
  selection: Selection;
}

/**
 * Registry for managing inspector configurations
 *
 * EXTENSION POINT: Register new inspectors for different selection types
 */
class InspectorRegistryImpl {
  private inspectors = new Map<Selection["type"], InspectorConfig>();

  /**
   * Register an inspector configuration
   */
  register<TShape extends ObjectShape>(config: InspectorConfig<TShape>): void {
    this.inspectors.set(config.type, config as unknown as InspectorConfig);
  }

  /**
   * Get inspector config for a selection type
   */
  get(type: Selection["type"]): InspectorConfig | undefined {
    return this.inspectors.get(type);
  }

  /**
   * Check if an inspector exists for a type
   */
  has(type: Selection["type"]): boolean {
    return this.inspectors.has(type);
  }

  /**
   * Get all registered inspectors
   */
  getAll(): InspectorConfig[] {
    return Array.from(this.inspectors.values());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.inspectors.clear();
  }
}

// Singleton instance
export const inspectorRegistry = new InspectorRegistryImpl();
