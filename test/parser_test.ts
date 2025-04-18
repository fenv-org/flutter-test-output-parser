import { assertEquals } from "@std/assert";
import { parseSync } from "../src/parser.ts";
import type {
  Event,
  FlutterTestOutput,
  GroupNode,
  SuiteNode,
  TestNode,
} from "../src/types.ts";

/**
 * Utility function to read and parse a test file
 */
async function parseTestFile(filePath: string): Promise<FlutterTestOutput> {
  const testOutput = await Deno.readTextFile(filePath);
  return parseSync(testOutput.split("\n").filter((line) => line.trim() !== ""));
}

/**
 * Basic parser functionality test
 * - Validates output structure
 * - Validates event types
 * - Validates test result statistics
 */
Deno.test("parseFlutterTestOutput - basic test", async () => {
  const result = await parseTestFile(
    "./sample/test_report_1.obfuscated.output",
  );

  // Validate basic structure
  assertEquals(result.trees instanceof Map, true);
  assertEquals(Array.isArray(result.allEvents), true);
  assertEquals(typeof result.totalDurationInSeconds, "number");

  // Validate event type
  const startEvent = result.allEvents.find((event: Event) =>
    event.type === "start"
  );
  assertEquals(startEvent?.type, "start");
  assertEquals(startEvent?.protocolVersion, "0.1.1");
  assertEquals(startEvent?.runnerVersion, "1.25.8");

  // Validate test results
  const testNodes = Array.from(result.trees.values()).filter((
    node,
  ): node is TestNode => "test" in node && "done" in node);
  assertEquals(testNodes.length > 0, true);

  // Output test result details
  console.log("Number of test nodes:", testNodes.length);
  const successTests = testNodes.filter((node) =>
    node.done?.result === "success"
  );
  const errorTests = testNodes.filter((node) => node.done?.result === "error");
  const failureTests = testNodes.filter((node) =>
    node.done?.result === "failure"
  );

  console.log("Successful tests:", successTests.length);
  console.log("Error tests:", errorTests.length);
  console.log("Failed tests:", failureTests.length);

  // Validate test results
  assertEquals(
    successTests.length + errorTests.length + failureTests.length,
    testNodes.length,
    "All tests must have one of these results: success, error, or failure",
  );
  assertEquals(successTests.length, 69, "There should be 69 successful tests");
  assertEquals(
    errorTests.length,
    18,
    "There should be 18 tests with errors",
  );
  assertEquals(failureTests.length, 0, "There should be no failed tests");
});

/**
 * Test group structure validation
 * - Validates suite nodes
 * - Validates group nodes
 * - Validates group hierarchy
 */
Deno.test("parseFlutterTestOutput - group structure test", async () => {
  const result = await parseTestFile(
    "./sample/test_report_1.obfuscated.output",
  );

  // Validate group structure
  const allNodes = Array.from(result.trees.values());
  const suiteNodes = allNodes.filter((node): node is SuiteNode =>
    node.type === "suite"
  );
  assertEquals(suiteNodes.length, 1, "There should be one test suite");

  const groupNodes = allNodes.filter((node): node is GroupNode =>
    node.type === "group"
  );
  assertEquals(groupNodes.length, 2, "There should be two groups");

  // Validate group hierarchy
  const rootGroup = groupNodes.find((node) => node.group.parentID === null);
  assertEquals(
    rootGroup?.group.name,
    "",
    "Root group name should be empty",
  );

  const invPrdListGroup = groupNodes.find((node) =>
    node.group.name === "inv_prd_list"
  );
  assertEquals(
    invPrdListGroup?.group.parentID,
    rootGroup?.group.id,
    "inv_prd_list group should be a child of the root group",
  );
  assertEquals(
    invPrdListGroup?.group.testCount,
    86,
    "inv_prd_list group should contain 86 tests",
  );
});

/**
 * Test message and error validation
 * - Validates error tests
 * - Validates test messages
 */
Deno.test("parseFlutterTestOutput - test message and error test", async () => {
  const result = await parseTestFile(
    "./sample/test_report_1.obfuscated.output",
  );

  // Validate test messages and errors
  const testNodes = Array.from(result.trees.values()).filter((
    node,
  ): node is TestNode => "test" in node && "done" in node);

  // Validate tests with errors
  const errorTests = testNodes.filter((node) => node.done?.result === "error");
  assertEquals(errorTests.length, 18, "There should be 18 tests with errors");

  // Validate tests with messages
  const testsWithMessages = testNodes.filter((node) =>
    node.print && node.print.length > 0
  );
  assertEquals(
    testsWithMessages.length > 0,
    true,
    "There should be at least one test with messages",
  );

  // Validate first test's message
  const firstTest = testNodes[0];
  assertEquals(
    firstTest.print?.length,
    1,
    "First test should have one message",
  );
  assertEquals(
    firstTest.print?.[0].messageType,
    "print",
    "Message type should be 'print'",
  );
});
