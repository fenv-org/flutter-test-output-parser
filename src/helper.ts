import type {
  DoneEvent,
  GroupNode,
  NodeTable,
  SuiteNode,
  TestNode,
} from "./types.ts";

export function suitesOfTable(table: NodeTable): SuiteNode[] {
  return Object.values(table).filter((node) => node.type === "suite");
}

export function testsOfTable(table: NodeTable): TestNode[] {
  return Object.values(table).filter((node) => node.type === "testStart");
}

export function childrenOfSuite(
  table: NodeTable,
  suite: SuiteNode,
): (GroupNode | TestNode)[] {
  return suite.children.map((id) => table[id])
    .filter((node) => node.type !== "suite");
}

export function childrenOfGroup(
  table: NodeTable,
  group: GroupNode,
): (GroupNode | TestNode)[] {
  return group.children.map((id) => table[id]).filter((node) =>
    node.type !== "suite"
  );
}

export function suiteOfGroup(table: NodeTable, group: GroupNode): SuiteNode {
  const suite = table[group.group.suiteID];
  if (suite.type !== "suite") {
    throw new Error("Suite not found");
  }
  return suite;
}

export function parentOfGroup(
  table: NodeTable,
  group: GroupNode,
): SuiteNode | GroupNode | null {
  if (group.group.parentID === null) {
    return null;
  }
  return table[group.group.parentID] as SuiteNode | GroupNode;
}

export function suiteOfTest(table: NodeTable, test: TestNode): SuiteNode {
  const suite = table[test.test.suiteID];
  if (suite.type !== "suite") {
    throw new Error("Suite not found");
  }
  return suite;
}

export function parentsOfTest(
  table: NodeTable,
  test: TestNode,
): GroupNode[] {
  return test.test.groupIDs.map((id) => table[id])
    .filter((node) => node.type === "group");
}

export function directParentOfTest(
  table: NodeTable,
  test: TestNode,
): GroupNode | null {
  const parents = parentsOfTest(table, test);
  return parents?.[0] ?? null;
}

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
export function getSegmentedName(table: NodeTable, node: TestNode): string[] {
  const segments: string[] = [];
  const groups = parentsOfTest(table, node);

  // Add all group names as segments, including empty ones
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const parentName = i > 0 ? groups[i - 1].group.name : "";
    const currentName = group.group.name;

    if (currentName === "") {
      segments.push("");
    } else if (parentName !== "" && currentName.startsWith(parentName + " ")) {
      segments.push(currentName.slice(parentName.length + 1));
    } else {
      segments.push(currentName);
    }
  }

  // Extract the test name by removing the last group name
  let testName = node.test.name;
  if (groups.length > 0) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup.group.name !== "") {
      const lastGroupName = lastGroup.group.name + " ";
      if (testName.endsWith(lastGroupName)) {
        testName = testName.slice(0, -lastGroupName.length);
      }
      testName = testName.slice(lastGroupName.length);
    }
  }

  segments.push(testName);
  return segments;
}

export function totalDuration(doneEvent: DoneEvent): {
  minutes: number;
  seconds: number;
  milliseconds: number;
} {
  const durationInMillis = doneEvent.time;
  if (durationInMillis === null || durationInMillis === undefined) {
    throw new Error("Duration is null or undefined");
  }
  const durationInSeconds = durationInMillis / 1000;
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  const milliseconds = durationInMillis % 1000;
  return { minutes, seconds, milliseconds };
}

/**
 * Finds the earliest start timestamp of a node and its children
 */
function findStartTimestamp(
  table: NodeTable,
  node: TestNode | GroupNode | SuiteNode,
): number {
  if (node.time === undefined) {
    throw new Error("Time is undefined");
  }

  if (node.type === "testStart") {
    return node.time;
  }

  // For GroupNode and SuiteNode, find the earliest start time among children
  const children = node.type === "suite"
    ? childrenOfSuite(table, node)
    : childrenOfGroup(table, node);

  let earliestStart = node.time;
  for (const child of children) {
    const childStart = findStartTimestamp(table, child);
    if (childStart < earliestStart) {
      earliestStart = childStart;
    }
  }

  return earliestStart;
}

/**
 * Finds the latest end timestamp of a node and its children
 */
function findEndTimestamp(
  table: NodeTable,
  node: TestNode | GroupNode | SuiteNode,
): number {
  if (node.time === undefined) {
    throw new Error("Time is undefined");
  }

  if (node.type === "testStart") {
    if (!node.done || node.done.time === undefined) {
      throw new Error("Test is not done yet");
    }
    return node.done.time;
  }

  // For GroupNode and SuiteNode, find the latest end time among children
  const children = node.type === "suite"
    ? childrenOfSuite(table, node)
    : childrenOfGroup(table, node);

  let latestEnd = node.time;
  for (const child of children) {
    const childEnd = findEndTimestamp(table, child);
    if (childEnd > latestEnd) {
      latestEnd = childEnd;
    }
  }

  return latestEnd;
}

export function duration(
  table: NodeTable,
  node: TestNode | GroupNode | SuiteNode,
): {
  minutes: number;
  seconds: number;
  milliseconds: number;
} {
  const startTime = findStartTimestamp(table, node);
  const endTime = findEndTimestamp(table, node);
  const durationInMillis = endTime - startTime;

  const durationInSeconds = durationInMillis / 1000;
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  const milliseconds = durationInMillis % 1000;
  return { minutes, seconds, milliseconds };
}
