/**
 * A Deno library for parsing Flutter test JSON output into a structured format.
 *
 * This module provides functions to parse Flutter test output, both synchronously and asynchronously.
 * It is designed to handle JSON output from Flutter tests and convert it into a structured object format.
 *
 * @example
 * ```ts
 * import { parseSync, parseAsync } from "@fenv-org/flutter-test-output-parser";
 *
 * // Synchronous parsing
 * const testOutput = `...JSON output from Flutter tests...`;
 * const result = parseSync(testOutput);
 *
 * // Asynchronous parsing
 * const resultAsync = await parseAsync("path/to/test_output.json");
 * ```
 *
 * @module
 */

export * from "./src/parser.ts";
export * from "./src/types.ts";
