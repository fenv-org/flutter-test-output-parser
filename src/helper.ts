import type { TestNode } from "./types.ts";

/**
 * Returns the segmented name of a test node.
 *
 * Examples:
 * ```ts
 * // Given a test node with name "Group1 Group2 Test Name"
 * // Returns ["Group1", "Group2", "Test Name"]
 *
 * // Given a test node with name "Simple Test"
 * // Returns ["Simple Test"]
 *
 * // Given a test node with name "Parent Child Grandchild Test"
 * // Returns ["Parent", "Child", "Grandchild", "Test"]
 * ```
 *
 * @param node The test node.
 * @returns The segmented name of the test node.
 */
export function getSegmentedName(node: TestNode) {
  const segments: string[] = [];
  const groups = node.parent.toReversed();
  let remainingName = node.test.name;
  while (groups.length > 0) {
    const group = groups.pop()!;
    segments.push(group.group.name);
    remainingName = remainingName.slice(group.group.name.length + 1);
  }
  segments.push(remainingName);
  return segments;
}
