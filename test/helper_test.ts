import { assert, assertEquals, assertThrows } from "@std/assert";
import { parseSync } from "../src/parser.ts";
import {
  childrenOfGroup,
  childrenOfSuite,
  directParentOfTest,
  duration,
  getSegmentedName,
  parentOfGroup,
  parentsOfTest,
  suiteOfGroup,
  suiteOfTest,
  suitesOfTable,
  testsOfTable,
  totalDuration,
} from "../src/helper.ts";
import type {
  GroupNode,
  NodeTable,
  SuiteNode,
  TestNode,
} from "../src/types.ts";

/**
 * Utility function to read and parse a test file
 */
async function parseTestFile(filePath: string) {
  const testOutput = await Deno.readTextFile(filePath);
  return parseSync(testOutput.split("\n").filter((line) => line.trim() !== ""));
}

/**
 * Test suitesOfTable function
 */
Deno.test("suitesOfTable - returns all suite nodes", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const suites = suitesOfTable(result.table);

  assertEquals(suites.length, 1, "There should be one suite");
  assertEquals(suites[0].type, "suite", "The node should be a suite");
  assertEquals(suites[0].suite.id, 0, "The suite ID should be 0");
  assertEquals(
    suites[0].suite.path,
    "/root-directory/test/sample_test.dart",
    "The suite path should match",
  );
});

/**
 * Test testsOfTable function
 */
Deno.test("testsOfTable - returns all test nodes", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const tests = testsOfTable(result.table);

  assertEquals(tests.length, 8, "There should be 8 test nodes");
  assertEquals(tests[0].type, "testStart", "The node should be a testStart");
  assertEquals(tests[0].test.id, 1, "The first test ID should be 1");
  assertEquals(
    tests[0].test.name,
    "loading /root-directory/test/sample_test.dart",
    "The test name should match",
  );
});

/**
 * Test childrenOfSuite function
 */
Deno.test("childrenOfSuite - returns children of a suite", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const suite = suitesOfTable(result.table)[0];
  const children = childrenOfSuite(result.table, suite);

  assertEquals(children.length, 2, "The suite should have 2 children");
  assertEquals(
    children[0].type,
    "testStart",
    "The first child should be a test",
  );
  if (children[0].type === "testStart") {
    assertEquals(children[0].test.id, 1, "The first child ID should be 1");
  }
  assertEquals(children[1].type, "group", "The second child should be a group");
  if (children[1].type === "group") {
    assertEquals(children[1].group.id, 2, "The second child ID should be 2");
  }
});

/**
 * Test childrenOfGroup function
 */
Deno.test("childrenOfGroup - returns children of a group", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const rootGroup = Object.values(result.table).find(
    (node): node is GroupNode =>
      node.type === "group" && node.group.parentID === null,
  )!;

  const children = childrenOfGroup(result.table, rootGroup);

  assertEquals(children.length, 1, "The root group should have 1 child");
  assertEquals(children[0].type, "group", "The child should be a group");
  if (children[0].type === "group") {
    assertEquals(children[0].group.id, 3, "The child group ID should be 3");
    assertEquals(
      children[0].group.name,
      "Intentionally failing tests",
      "The child group name should match",
    );
  }
});

/**
 * Test suiteOfGroup function
 */
Deno.test("suiteOfGroup - returns the suite of a group", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const group = Object.values(result.table).find(
    (node): node is GroupNode => node.type === "group" && node.group.id === 3,
  )!;

  const suite = suiteOfGroup(result.table, group);

  assertEquals(suite.type, "suite", "The result should be a suite");
  assertEquals(suite.suite.id, 0, "The suite ID should be 0");
  assertEquals(
    suite.suite.path,
    "/root-directory/test/sample_test.dart",
    "The suite path should match",
  );
});

/**
 * Test parentOfGroup function
 */
Deno.test("parentOfGroup - returns the parent of a group", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");

  // Test with a group that has a parent
  const childGroup = Object.values(result.table).find(
    (node): node is GroupNode => node.type === "group" && node.group.id === 3,
  )!;

  const parent = parentOfGroup(result.table, childGroup);

  if (parent && parent.type === "group") {
    assertEquals(parent.type, "group", "The parent should be a group");
    assertEquals(parent.group.id, 2, "The parent group ID should be 2");
  }

  // Test with a root group (no parent)
  const rootGroup = Object.values(result.table).find(
    (node): node is GroupNode => node.type === "group" && node.group.id === 2,
  )!;

  const rootParent = parentOfGroup(result.table, rootGroup);

  assertEquals(rootParent, null, "The root group should have no parent");
});

/**
 * Test suiteOfTest function
 */
Deno.test("suiteOfTest - returns the suite of a test", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const test = Object.values(result.table).find(
    (node): node is TestNode => node.type === "testStart" && node.test.id === 4,
  )!;

  const suite = suiteOfTest(result.table, test);

  assertEquals(suite.type, "suite", "The result should be a suite");
  assertEquals(suite.suite.id, 0, "The suite ID should be 0");
  assertEquals(
    suite.suite.path,
    "/root-directory/test/sample_test.dart",
    "The suite path should match",
  );
});

/**
 * Test parentsOfTest function
 */
Deno.test("parentsOfTest - returns the parents of a test", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const test = Object.values(result.table).find(
    (node): node is TestNode => node.type === "testStart" && node.test.id === 4,
  )!;

  const parents = parentsOfTest(result.table, test);

  assertEquals(parents.length, 2, "The test should have 2 parents");
  assertEquals(parents[0].type, "group", "The parents should be groups");
  assertEquals(parents[0].group.id, 2, "The first parent group ID should be 2");
  assertEquals(
    parents[1].group.id,
    3,
    "The second parent group ID should be 3",
  );
});

/**
 * Test directParentOfTest function
 */
Deno.test("directParentOfTest - returns the direct parent of a test", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const test = Object.values(result.table).find(
    (node): node is TestNode => node.type === "testStart" && node.test.id === 4,
  )!;

  const directParent = directParentOfTest(result.table, test);

  assertEquals(
    directParent?.type,
    "group",
    "The direct parent should be a group",
  );
  assertEquals(
    directParent?.group.id,
    2,
    "The direct parent group ID should be 2",
  );
});

/**
 * Test getSegmentedName function
 */
Deno.test("getSegmentedName - returns the segmented name of a test", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");
  const test = Object.values(result.table).find(
    (node): node is TestNode => node.type === "testStart" && node.test.id === 4,
  )!;

  const segments = getSegmentedName(result.table, test);

  assertEquals(segments, [
    "",
    "Intentionally failing tests",
    "Simple assertion failure",
  ], "The segments should match");
});

/**
 * Test getSegmentedName function with nested test groups
 */
Deno.test("getSegmentedName - nested test groups", async () => {
  const result = await parseTestFile("./sample/test_report_3.output");

  // Test ID 7: "Intentionally failing tests Nested group of failing tests First nested test"
  const test7 = Object.values(result.table).find(
    (node): node is TestNode => node.type === "testStart" && node.test.id === 7,
  )!;

  const segments7 = getSegmentedName(result.table, test7);

  assertEquals(segments7, [
    "",
    "Intentionally failing tests",
    "Nested group of failing tests",
    "First nested test",
  ], "Test ID 7 segments should match");

  // Test ID 8: "Intentionally failing tests Nested group of failing tests Second nested test"
  const test8 = Object.values(result.table).find(
    (node): node is TestNode => node.type === "testStart" && node.test.id === 8,
  )!;

  const segments8 = getSegmentedName(result.table, test8);

  assertEquals(segments8, [
    "",
    "Intentionally failing tests",
    "Nested group of failing tests",
    "Second nested test",
  ], "Test ID 8 segments should match");
});

/**
 * Test totalDuration function
 */
Deno.test("totalDuration - returns the total duration of a test run", async () => {
  const result = await parseTestFile(
    "./sample/test_report_2.obfuscated.output",
  );
  const duration = totalDuration(result.doneEvent);

  assertEquals(duration, {
    minutes: 1,
    seconds: 45,
    milliseconds: 579,
  }, "The duration should match");
});

Deno.test("duration - TestNode", async () => {
  const testResult = await parseTestFile("./sample/test_report_3.output");
  const { table } = testResult;

  // Find a test node that has a clear duration
  const testNode = Object.values(table).find((node): node is TestNode =>
    node.type === "testStart" &&
    node.test.name === "Intentionally failing tests Simple assertion failure"
  );
  assert(testNode, "Test node not found");

  const durationResult = duration(table, testNode);
  assertEquals(durationResult, {
    minutes: 0,
    seconds: 0,
    milliseconds: 52, // 3124 - 3072 = 52ms
  });
});

Deno.test("duration - GroupNode with nested tests", async () => {
  const testResult = await parseTestFile("./sample/test_report_3.output");
  const { table } = testResult;

  // Find the "Intentionally failing tests" group
  const groupNode = Object.values(table).find((node): node is GroupNode =>
    node.type === "group" &&
    node.group.name === "Intentionally failing tests"
  );
  assert(groupNode, "Group node not found");

  const durationResult = duration(table, groupNode);
  assertEquals(durationResult, {
    minutes: 0,
    seconds: 1,
    milliseconds: 118, // 4190 - 3072 = 1118ms
  });
});

Deno.test("duration - SuiteNode", async () => {
  const testResult = await parseTestFile("./sample/test_report_3.output");
  const { table } = testResult;

  // Find the suite node
  const suiteNode = Object.values(table).find((node): node is SuiteNode =>
    node.type === "suite"
  );
  assert(suiteNode, "Suite node not found");

  const durationResult = duration(table, suiteNode);
  assertEquals(durationResult, {
    minutes: 0,
    seconds: 4,
    milliseconds: 190, // 4190 - 0 = 4190ms
  });
});

Deno.test("duration - undefined time", () => {
  const table: NodeTable = {};
  const node: TestNode = {
    type: "testStart",
    time: undefined,
    skip: false,
    skipReason: null,
    test: {
      id: 1,
      name: "Test 1",
      suiteID: 1,
      groupIDs: [1],
      line: null,
      column: null,
      url: null,
    },
  };

  assertThrows(
    () => duration(table, node),
    Error,
    "Time is undefined",
  );
});
