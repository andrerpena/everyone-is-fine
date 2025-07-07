// =============================================================================
// SCHEMA FACTORY
// =============================================================================

import {
  ArraySchema,
  type BaseSchema,
  BooleanSchema,
  NumberSchema,
  ObjectSchema,
  type ObjectShape,
  StringSchema,
} from "./schema";

/**
 * Schema factory for creating type-safe schemas
 *
 * @example
 * ```ts
 * const userSchema = nu.object({
 *   name: nu.string().withMetadata({ label: "Name" }),
 *   age: nu.number().withMetadata({ label: "Age" }),
 *   active: nu.boolean(),
 * });
 * ```
 */
export const nu = {
  /**
   * Creates a boolean schema
   */
  boolean: () => new BooleanSchema(),

  /**
   * Creates a string schema
   */
  string: () => new StringSchema(),

  /**
   * Creates a number schema
   */
  number: () => new NumberSchema(),

  /**
   * Creates an object schema with a defined shape
   * @param shape An object mapping keys to schemas
   */
  object: <TShape extends ObjectShape>(shape: TShape) =>
    new ObjectSchema(shape),

  /**
   * Creates an array schema with a defined element type
   * @param elementSchema The schema for array elements
   */
  array: <TElementSchema extends BaseSchema<unknown>>(
    elementSchema: TElementSchema,
  ) => new ArraySchema(elementSchema),
};
